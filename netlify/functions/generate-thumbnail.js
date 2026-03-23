async function toDataUrlFromResponse(response) {
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length < 2500) {
    throw new Error('Image payload too small');
  }

  return `data:${contentType};base64,${buffer.toString('base64')}`;
}

async function fetchImageAsDataUrl(url) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Image fetch failed: ${response.status}`);
  const type = response.headers.get('content-type') || '';
  if (!type.includes('image')) throw new Error('Response is not an image');
  return toDataUrlFromResponse(response);
}

async function generateWithOpenAI({ prompt, size, n, apiKey }) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model: 'gpt-image-1', prompt, size, n })
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result?.error?.message || 'OpenAI image generation failed.');

  const images = (result.data || [])
    .map((item) => item.b64_json)
    .filter(Boolean)
    .map((b64) => `data:image/png;base64,${b64}`);

  return { images, provider: 'openai' };
}

function fallbackSvgDataUrl(size, label) {
  const [w, h] = size.split('x').map(Number);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
  <defs>
    <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='#1d3a7a'/><stop offset='1' stop-color='#3b1670'/>
    </linearGradient>
  </defs>
  <rect width='100%' height='100%' fill='url(#g)'/>
  <text x='50%' y='50%' fill='white' font-size='54' font-family='Arial' text-anchor='middle'>${label}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function generateWithFallbackProviders({ prompt, size, n }) {
  const [width, height] = size.split('x');
  const keyword = encodeURIComponent(prompt.split(' ').slice(0, 3).join(' ') || 'technology');
  const aiPrompt = encodeURIComponent(`${prompt} photorealistic, high detail, thumbnail design`);

  const images = [];

  for (let i = 0; i < n; i += 1) {
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${aiPrompt}?width=${width}&height=${height}&model=flux&nologo=true&seed=${Date.now() + i}`;
    const flickrUrl = `https://loremflickr.com/${width}/${height}/${keyword}?lock=${Date.now() + i}`;

    try {
      images.push(await fetchImageAsDataUrl(pollinationsUrl));
      continue;
    } catch {
      // try next provider
    }

    try {
      images.push(await fetchImageAsDataUrl(flickrUrl));
      continue;
    } catch {
      // fallback to generated svg
    }

    images.push(fallbackSvgDataUrl(size, `Variant ${i + 1}`));
  }

  return { images, provider: 'fallback-mixed' };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { prompt, size, n } = JSON.parse(event.body || '{}');
    const finalPrompt = String(prompt || '').trim();
    const finalSize = size || '1280x720';
    const finalN = Math.min(Math.max(Number(n) || 1, 1), 4);

    if (!finalPrompt) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Prompt is required.' }) };
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey) {
      try {
        const openaiResult = await generateWithOpenAI({ prompt: finalPrompt, size: finalSize, n: finalN, apiKey });
        return { statusCode: 200, body: JSON.stringify(openaiResult) };
      } catch (openaiError) {
        const fallback = await generateWithFallbackProviders({ prompt: finalPrompt, size: finalSize, n: finalN });
        return {
          statusCode: 200,
          body: JSON.stringify({ ...fallback, warning: `OpenAI failed, fallback used: ${openaiError.message}` })
        };
      }
    }

    const fallback = await generateWithFallbackProviders({ prompt: finalPrompt, size: finalSize, n: finalN });
    return {
      statusCode: 200,
      body: JSON.stringify({ ...fallback, warning: 'OPENAI_API_KEY not configured. Using fallback providers.' })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message || 'Unexpected server error.' }) };
  }
};

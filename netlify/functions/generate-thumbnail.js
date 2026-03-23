async function generateWithOpenAI({ prompt, size, n, apiKey }) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      size,
      n
    })
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
  <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#253b72'/><stop offset='1' stop-color='#1f1148'/></linearGradient></defs>
  <rect width='100%' height='100%' fill='url(#g)'/>
  <text x='50%' y='50%' fill='white' font-size='48' font-family='Arial' text-anchor='middle'>${label}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function generateWithPollinations({ prompt, size, n }) {
  const [width, height] = size.split('x');
  const safePrompt = encodeURIComponent(`${prompt} photorealistic, high detail, thumbnail design`);

  const urls = Array.from({ length: n }, (_, idx) => (
    `https://image.pollinations.ai/prompt/${safePrompt}?width=${width}&height=${height}&model=flux&nologo=true&seed=${Date.now() + idx}`
  ));

  const images = [];
  for (let i = 0; i < urls.length; i += 1) {
    try {
      const response = await fetch(urls[i]);
      if (!response.ok) throw new Error('pollinations failed');
      const contentType = response.headers.get('content-type') || 'image/png';
      const buffer = Buffer.from(await response.arrayBuffer()).toString('base64');
      images.push(`data:${contentType};base64,${buffer}`);
    } catch {
      images.push(fallbackSvgDataUrl(size, `Variant ${i + 1}`));
    }
  }

  return { images, provider: 'pollinations' };
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
        const openaiResult = await generateWithOpenAI({
          prompt: finalPrompt,
          size: finalSize,
          n: finalN,
          apiKey
        });

        return { statusCode: 200, body: JSON.stringify(openaiResult) };
      } catch (openaiError) {
        const fallback = await generateWithPollinations({ prompt: finalPrompt, size: finalSize, n: finalN });
        return {
          statusCode: 200,
          body: JSON.stringify({ ...fallback, warning: `OpenAI failed, fallback used: ${openaiError.message}` })
        };
      }
    }

    const fallback = await generateWithPollinations({ prompt: finalPrompt, size: finalSize, n: finalN });
    return {
      statusCode: 200,
      body: JSON.stringify({ ...fallback, warning: 'OPENAI_API_KEY not configured. Using free fallback provider.' })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message || 'Unexpected server error.' }) };
  }
};

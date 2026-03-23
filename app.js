const form = document.getElementById('thumbnail-form');
const uploadInput = document.getElementById('uploadImage');
const referenceInput = document.getElementById('referenceImage');
const uploadedPreview = document.getElementById('uploadedPreview');
const uploadedPlaceholder = document.getElementById('uploadedPlaceholder');
const referencePreview = document.getElementById('referencePreview');
const referencePlaceholder = document.getElementById('referencePlaceholder');
const outputPreview = document.getElementById('outputPreview');
const outputPlaceholder = document.getElementById('outputPlaceholder');
const outputBox = document.getElementById('outputBox');
const statusText = document.getElementById('status');
const downloadLink = document.getElementById('downloadLink');
const generateBtn = document.getElementById('generateBtn');

const dimensionsByRatio = {
  youtube: { width: 1280, height: 720, label: '16:9' },
  insta_post: { width: 1080, height: 1080, label: '1:1' },
  insta_story: { width: 1080, height: 1920, label: '9:16' }
};

let uploadedImageDataUrl = '';
let referenceImageDataUrl = '';

function previewLocalImage(input, target, placeholder, setter) {
  const file = input.files?.[0];
  if (!file) {
    setter('');
    target.hidden = true;
    placeholder.hidden = false;
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const data = String(event.target?.result || '');
    setter(data);
    target.src = data;
    target.hidden = false;
    placeholder.hidden = true;
  };
  reader.readAsDataURL(file);
}

uploadInput.addEventListener('change', () => {
  previewLocalImage(uploadInput, uploadedPreview, uploadedPlaceholder, (value) => {
    uploadedImageDataUrl = value;
  });
});

referenceInput.addEventListener('change', () => {
  previewLocalImage(referenceInput, referencePreview, referencePlaceholder, (value) => {
    referenceImageDataUrl = value;
  });
});

function waitForImageLoad(url, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timer = setTimeout(() => reject(new Error('Image load timeout')), timeoutMs);

    image.onload = () => {
      clearTimeout(timer);
      resolve();
    };

    image.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Image load failed'));
    };

    image.src = url;
  });
}

function wrapLines(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 3);
}

function setOutputAspect(ratioKey) {
  const { width, height } = dimensionsByRatio[ratioKey];
  outputBox.style.aspectRatio = `${width} / ${height}`;
}

async function generateFallbackThumbnail(topic, ratioKey, creatorImage) {
  const { width, height } = dimensionsByRatio[ratioKey];
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#4f46e5');
  gradient.addColorStop(0.5, '#7c3aed');
  gradient.addColorStop(1, '#0f172a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  if (creatorImage) {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = creatorImage;
    });

    const frameW = Math.round(width * 0.34);
    const frameH = Math.round(height * 0.68);
    const frameX = width - frameW - Math.round(width * 0.04);
    const frameY = Math.round(height * 0.16);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.fillRect(frameX - 10, frameY - 10, frameW + 20, frameH + 20);
    ctx.drawImage(image, frameX, frameY, frameW, frameH);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(width * 0.075)}px Inter, Arial, sans-serif`;
  const lines = wrapLines(ctx, topic.toUpperCase(), Math.round(width * 0.58));

  let y = Math.round(height * 0.65);
  for (const line of lines) {
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = Math.max(6, Math.round(width * 0.0065));
    ctx.strokeText(line, Math.round(width * 0.06), y);
    ctx.fillText(line, Math.round(width * 0.06), y);
    y += Math.round(width * 0.09);
  }

  return canvas.toDataURL('image/png');
}

function showOutput(url) {
  outputPreview.src = url;
  outputPreview.hidden = false;
  outputPlaceholder.hidden = true;
  downloadLink.href = url;
  downloadLink.hidden = false;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const topic = document.getElementById('videoTopic').value.trim();
  const style = document.getElementById('style').value;
  const details = document.getElementById('details').value.trim();
  const ratioKey = document.getElementById('aspectRatio').value;
  const { width, height, label } = dimensionsByRatio[ratioKey];

  if (!topic) {
    statusText.textContent = 'Please add a video topic first.';
    return;
  }

  setOutputAspect(ratioKey);

  generateBtn.disabled = true;
  generateBtn.textContent = 'Generating...';
  downloadLink.hidden = true;
  statusText.textContent = 'Generating realistic AI thumbnail...';

  try {
    const promptParts = [
      'Create an ultra realistic social media thumbnail image.',
      `Style: ${style}.`,
      `Topic: ${topic}.`,
      details ? `Details: ${details}.` : '',
      referenceImageDataUrl ? 'Use the optional reference image composition and mood as inspiration.' : '',
      `Aspect ratio ${label}, clean composition, high dynamic range lighting, professional quality.`
    ];

    const prompt = promptParts.filter(Boolean).join(' ');
    const aiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=flux&enhance=true&nologo=true&seed=${Date.now()}`;

    await waitForImageLoad(aiUrl);
    showOutput(aiUrl);
    statusText.textContent = 'AI thumbnail generated successfully.';
  } catch (error) {
    const fallback = await generateFallbackThumbnail(topic, ratioKey, uploadedImageDataUrl || referenceImageDataUrl);
    showOutput(fallback);
    statusText.textContent = 'AI server unavailable right now. Showing a clean fallback thumbnail.';
    console.warn(error);
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate thumbnail';
  }
});

setOutputAspect('youtube');

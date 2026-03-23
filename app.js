const form = document.getElementById('thumbnail-form');
const uploadInput = document.getElementById('uploadImage');
const uploadedPreview = document.getElementById('uploadedPreview');
const uploadedPlaceholder = document.getElementById('uploadedPlaceholder');
const outputPreview = document.getElementById('outputPreview');
const outputPlaceholder = document.getElementById('outputPlaceholder');
const statusText = document.getElementById('status');
const downloadLink = document.getElementById('downloadLink');
const generateBtn = document.getElementById('generateBtn');

let uploadedImageDataUrl = '';

uploadInput.addEventListener('change', () => {
  const file = uploadInput.files?.[0];
  if (!file) {
    uploadedImageDataUrl = '';
    uploadedPreview.hidden = true;
    uploadedPlaceholder.hidden = false;
    uploadedPlaceholder.textContent = 'No image uploaded yet.';
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    uploadedImageDataUrl = String(event.target?.result || '');
    uploadedPreview.src = uploadedImageDataUrl;
    uploadedPreview.hidden = false;
    uploadedPlaceholder.hidden = true;
  };
  reader.readAsDataURL(file);
});

function wrapLines(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const { width } = ctx.measureText(testLine);

    if (width > maxWidth && currentLine) {
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

function waitForImageLoad(url, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timer = setTimeout(() => {
      reject(new Error('Image load timeout'));
    }, timeoutMs);

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

async function templateThumbnail(topic, uploadedImageUrl) {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, '#3b82f6');
  bg.addColorStop(0.5, '#7c3aed');
  bg.addColorStop(1, '#0f172a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (uploadedImageUrl) {
    const creatorImage = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = uploadedImageUrl;
    });

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(830, 70, 390, 580);
    ctx.drawImage(creatorImage, 845, 85, 360, 550);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 80px Inter, Arial, sans-serif';

  const lines = wrapLines(ctx, topic.toUpperCase(), 760);
  let lineY = 460;

  for (const line of lines) {
    ctx.lineWidth = 12;
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.strokeText(line, 55, lineY);
    ctx.fillText(line, 55, lineY);
    lineY += 95;
  }

  return canvas.toDataURL('image/png');
}

function showOutput(imageUrl) {
  outputPreview.src = imageUrl;
  outputPreview.hidden = false;
  outputPlaceholder.hidden = true;
  downloadLink.href = imageUrl;
  downloadLink.hidden = false;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const topic = document.getElementById('videoTopic').value.trim();
  const style = document.getElementById('style').value;
  const details = document.getElementById('details').value.trim();

  if (!topic) {
    statusText.textContent = 'Please add a video topic first.';
    return;
  }

  try {
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    statusText.textContent = 'Creating your thumbnail...';
    downloadLink.hidden = true;

    const prompt = [
      'YouTube thumbnail, 16:9 ratio, high contrast, eye-catching.',
      `Topic: ${topic}.`,
      `Style: ${style}.`,
      details ? `Extra notes: ${details}.` : ''
    ]
      .filter(Boolean)
      .join(' ');

    const aiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&seed=${Date.now()}&nologo=true`;

    try {
      await waitForImageLoad(aiUrl);
      showOutput(aiUrl);
      statusText.textContent = 'AI thumbnail generated! You can download it now.';
    } catch {
      const fallbackImage = await templateThumbnail(topic, uploadedImageDataUrl);
      showOutput(fallbackImage);
      statusText.textContent = 'AI service is busy right now. Generated a template thumbnail instead.';
    }
  } catch (error) {
    statusText.textContent = 'Could not generate image right now. Please try again in a moment.';
    outputPreview.hidden = true;
    outputPlaceholder.hidden = false;
    downloadLink.hidden = true;
    console.error(error);
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate thumbnail';
  }
});

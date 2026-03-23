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

async function blobUrlToImage(blobUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = blobUrl;
  });
}

async function composeThumbnail({ aiUrl, topic, uploadedImageUrl }) {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');

  const imageResponse = await fetch(aiUrl);
  const imageBlob = await imageResponse.blob();
  const aiBlobUrl = URL.createObjectURL(imageBlob);

  try {
    const aiImage = await blobUrlToImage(aiBlobUrl);
    ctx.drawImage(aiImage, 0, 0, canvas.width, canvas.height);
  } finally {
    URL.revokeObjectURL(aiBlobUrl);
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (uploadedImageUrl) {
    const creatorImage = await blobUrlToImage(uploadedImageUrl);
    const boxWidth = 360;
    const boxHeight = 500;
    const x = canvas.width - boxWidth - 40;
    const y = canvas.height - boxHeight - 35;

    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x - 12, y - 12, boxWidth + 24, boxHeight + 24);
    ctx.drawImage(creatorImage, x, y, boxWidth, boxHeight);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 78px Inter, Arial, sans-serif';
  const lines = wrapLines(ctx, topic.toUpperCase(), 760);

  let yPosition = 470;
  for (const line of lines) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.lineWidth = 10;
    ctx.strokeText(line, 50, yPosition);
    ctx.fillText(line, 50, yPosition);
    yPosition += 90;
  }

  return canvas.toDataURL('image/png');
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

    const prompt = [
      'YouTube thumbnail background, 16:9 ratio, cinematic lighting, high contrast.',
      `Topic: ${topic}.`,
      `Style: ${style}.`,
      details ? `Extra notes: ${details}.` : '',
      'Leave open composition space for large headline text.'
    ]
      .filter(Boolean)
      .join(' ');

    const aiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&seed=${Date.now()}&nologo=true`;

    let finalImageUrl = aiUrl;

    try {
      finalImageUrl = await composeThumbnail({
        aiUrl,
        topic,
        uploadedImageUrl: uploadedImageDataUrl
      });
    } catch (composeError) {
      console.warn('Image composition failed, showing raw AI result instead.', composeError);
    }

    outputPreview.src = finalImageUrl;
    await outputPreview.decode();

    outputPreview.hidden = false;
    outputPlaceholder.hidden = true;
    downloadLink.href = finalImageUrl;
    downloadLink.hidden = false;
    statusText.textContent = 'Thumbnail generated! You can download it now.';
  } catch (error) {
    statusText.textContent = 'Could not generate image right now. Please try again in a moment.';
    console.error(error);
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate thumbnail';
  }
});

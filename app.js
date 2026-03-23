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
  youtube_shorts: { width: 1080, height: 1920, label: '9:16' },
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

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function wrapLines(ctx, text, maxWidth, maxLines = 3) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length === maxLines - 1) {
        break;
      }
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, maxLines);
}

function setOutputAspect(ratioKey) {
  const { width, height } = dimensionsByRatio[ratioKey];
  outputBox.style.aspectRatio = `${width} / ${height}`;
}

function pickMainWord(topic) {
  const words = topic.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/);
  if (!words.length) {
    return 'GROW';
  }
  return words[0].toUpperCase();
}

async function generateStudioThumbnail(topic, ratioKey, creatorImageUrl, referenceImageUrl) {
  const { width, height } = dimensionsByRatio[ratioKey];
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Base background layer (prefer reference image when available).
  if (referenceImageUrl) {
    const refImage = await loadImage(referenceImageUrl);
    ctx.filter = 'blur(10px) saturate(1.2)';
    ctx.drawImage(refImage, 0, 0, width, height);
    ctx.filter = 'none';

    // Bring back some detail so it looks premium, not flat.
    ctx.globalAlpha = 0.35;
    ctx.drawImage(refImage, 0, 0, width, height);
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(8, 10, 20, 0.42)';
    ctx.fillRect(0, 0, width, height);
  } else {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#1f2948');
    grad.addColorStop(0.55, '#1f1444');
    grad.addColorStop(1, '#0c0f1e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  const headlineWord = pickMainWord(topic);
  ctx.fillStyle = '#ff244d';
  ctx.font = `900 ${Math.round(width * 0.14)}px Inter, Arial, sans-serif`;
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 14;
  ctx.fillText(headlineWord, Math.round(width * 0.06), Math.round(height * 0.2));
  ctx.shadowBlur = 0;

  const subjectSource = creatorImageUrl || referenceImageUrl;
  if (subjectSource) {
    const subject = await loadImage(subjectSource);

    const boxW = ratioKey === 'youtube' ? Math.round(width * 0.4) : Math.round(width * 0.74);
    const boxH = ratioKey === 'youtube' ? Math.round(height * 0.74) : Math.round(height * 0.5);
    const boxX = ratioKey === 'youtube' ? Math.round(width * 0.54) : Math.round(width * 0.13);
    const boxY = ratioKey === 'youtube' ? Math.round(height * 0.16) : Math.round(height * 0.24);
    const radius = Math.max(20, Math.round(width * 0.015));

    // Soft glass frame.
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.beginPath();
    ctx.roundRect(boxX - 10, boxY - 10, boxW + 20, boxH + 20, radius + 4);
    ctx.fill();

    // Clip rounded image.
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, radius);
    ctx.clip();
    ctx.drawImage(subject, boxX, boxY, boxW, boxH);
    ctx.restore();

    // Vignette over subject for depth.
    const vignette = ctx.createLinearGradient(0, boxY, 0, boxY + boxH);
    vignette.addColorStop(0, 'rgba(0,0,0,0.00)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = vignette;
    ctx.fillRect(boxX, boxY, boxW, boxH);
  }

  // Main title lines.
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${Math.round(width * 0.07)}px Inter, Arial, sans-serif`;
  const lines = wrapLines(ctx, topic.toLowerCase(), Math.round(width * 0.5), ratioKey === 'youtube' ? 2 : 3);

  let textY = ratioKey === 'youtube' ? Math.round(height * 0.8) : Math.round(height * 0.76);
  for (const line of lines) {
    ctx.strokeStyle = 'rgba(0,0,0,0.58)';
    ctx.lineWidth = Math.max(6, Math.round(width * 0.0042));
    ctx.strokeText(line, Math.round(width * 0.06), textY);
    ctx.fillText(line, Math.round(width * 0.06), textY);
    textY += Math.round(width * 0.08);
  }

  // Bottom progress text similar to reference style.
  ctx.font = `700 ${Math.round(width * 0.055)}px Inter, Arial, sans-serif`;
  ctx.fillStyle = '#f3f6ff';
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = Math.max(4, Math.round(width * 0.0035));
  const progressText = 'beginner → pro';
  const progressY = ratioKey === 'youtube' ? Math.round(height * 0.96) : Math.round(height * 0.92);
  ctx.strokeText(progressText, Math.round(width * 0.06), progressY);
  ctx.fillText(progressText, Math.round(width * 0.06), progressY);

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
  statusText.textContent = 'Generating thumbnail...';

  try {
    const prompt = [
      'Ultra realistic YouTube or Instagram thumbnail photo.',
      `Style: ${style}.`,
      `Topic: ${topic}.`,
      details ? `Extra: ${details}.` : '',
      'high contrast, expressive face, crisp details, creator-focused composition, cinematic studio lighting.',
      `Aspect ratio ${label}.`
    ]
      .filter(Boolean)
      .join(' ');

    const aiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=flux&nologo=true&seed=${Date.now()}`;

    await waitForImageLoad(aiUrl);
    showOutput(aiUrl);
    statusText.textContent = 'Thumbnail generated.';
  } catch (error) {
    const studioImage = await generateStudioThumbnail(
      topic,
      ratioKey,
      uploadedImageDataUrl || referenceImageDataUrl,
      referenceImageDataUrl
    );
    showOutput(studioImage);
    statusText.textContent = 'Thumbnail generated.';
    console.warn(error);
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate thumbnail';
  }
});

setOutputAspect('youtube');

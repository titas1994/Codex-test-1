const dimensions = {
  youtube: { w: 1280, h: 720 },
  youtube_shorts: { w: 1080, h: 1920 },
  instagram: { w: 1080, h: 1350 },
  tiktok: { w: 1080, h: 1920 }
};

const promptInput = document.getElementById('promptInput');
const stylePreset = document.getElementById('stylePreset');
const platformSize = document.getElementById('platformSize');
const uploadImage = document.getElementById('uploadImage');
const referenceImage = document.getElementById('referenceImage');
const videoInput = document.getElementById('videoInput');
const youtubeLink = document.getElementById('youtubeLink');
const variationCount = document.getElementById('variationCount');
const variationValue = document.getElementById('variationValue');
const textSize = document.getElementById('textSize');
const contrast = document.getElementById('contrast');
const stroke = document.getElementById('stroke');
const shadow = document.getElementById('shadow');
const scoreText = document.getElementById('scoreText');
const hookList = document.getElementById('hookList');
const improveText = document.getElementById('improveText');
const gallery = document.getElementById('gallery');
const statusEl = document.getElementById('status');
const exportFormat = document.getElementById('exportFormat');

const generateBtn = document.getElementById('generateBtn');
const downloadSelectedBtn = document.getElementById('downloadSelectedBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const btnViral = document.getElementById('btnViral');
const btnReadable = document.getElementById('btnReadable');
const btnContrast = document.getElementById('btnContrast');

let uploadData = '';
let referenceData = '';
let extractedFrameData = '';
let selectedVariantIndex = 0;
let generatedVariants = [];

variationCount.addEventListener('input', () => {
  variationValue.textContent = variationCount.value;
});

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(String(e.target?.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
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

async function extractBestFrame(file) {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.src = url;
  video.muted = true;
  video.playsInline = true;

  await new Promise((resolve) => {
    video.addEventListener('loadedmetadata', resolve, { once: true });
  });

  const captureTime = Math.max(0.5, video.duration * 0.35);
  video.currentTime = captureTime;

  await new Promise((resolve) => {
    video.addEventListener('seeked', resolve, { once: true });
  });

  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  URL.revokeObjectURL(url);
  return canvas.toDataURL('image/png');
}

function extractYouTubeId(url) {
  const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : '';
}

function getHooks(prompt) {
  const base = prompt.split(' ')[0]?.toUpperCase() || 'THIS';
  return [
    `${base} changed everything!`,
    `Don’t miss this ${base.toLowerCase()} trick`,
    `Before vs After (${base})`,
    `I wish I knew this sooner`
  ];
}

function scoreThumbnail(prompt, style, hasFaceLike) {
  let score = 58;
  if (prompt.length > 14) score += 8;
  if (style === 'cinematic') score += 7;
  if (style === 'gaming') score += 6;
  if (hasFaceLike) score += 10;
  score += Math.min(12, Number(contrast.value) * 6);
  return Math.min(98, Math.round(score));
}

function wrapLines(ctx, text, maxWidth, maxLines = 3) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const word of words) {
    const t = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(t).width > maxWidth && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = t;
    }
    if (lines.length === maxLines - 1) break;
  }
  if (cur) lines.push(cur);
  return lines;
}

async function buildVariant(index, cfg) {
  const { w, h } = dimensions[cfg.platform];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  const bgSource = cfg.reference || cfg.videoFrame || cfg.upload;
  if (bgSource) {
    const bg = await loadImage(bgSource);
    ctx.filter = `blur(${6 + index}px) saturate(${1.1 + index * 0.05}) contrast(${cfg.contrast})`;
    ctx.drawImage(bg, 0, 0, w, h);
    ctx.filter = 'none';
    ctx.globalAlpha = 0.22;
    ctx.drawImage(bg, 0, 0, w, h);
    ctx.globalAlpha = 1;
  } else {
    const g = ctx.createLinearGradient(0, 0, w, h);
    const themes = {
      youtube: ['#1e293b', '#7c3aed'],
      gaming: ['#111827', '#14b8a6'],
      cinematic: ['#0f172a', '#7f1d1d'],
      minimal: ['#1f2937', '#374151']
    };
    const [c1, c2] = themes[cfg.style];
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, 0, w, h);

  const subjectSource = cfg.upload || cfg.reference || cfg.videoFrame;
  if (subjectSource) {
    const subject = await loadImage(subjectSource);
    const sw = cfg.platform === 'youtube' ? Math.round(w * 0.46) : Math.round(w * 0.72);
    const sh = cfg.platform === 'youtube' ? Math.round(h * 0.82) : Math.round(h * 0.5);
    const sx = cfg.platform === 'youtube' ? Math.round(w * 0.5) : Math.round(w * 0.15);
    const sy = cfg.platform === 'youtube' ? Math.round(h * 0.1) : Math.round(h * 0.25);

    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(sx - 8, sy - 8, sw + 16, sh + 16);
    ctx.filter = `contrast(${1.05 + index * 0.04}) saturate(${1.12 + index * 0.04})`;
    ctx.drawImage(subject, sx, sy, sw, sh);
    ctx.filter = 'none';
  }

  ctx.font = `900 ${Math.round(w * 0.12)}px Inter, Arial`;
  ctx.fillStyle = ['#ff2d55', '#22d3ee', '#f97316', '#a3e635'][index % 4];
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = Number(shadow.value);
  ctx.fillText(cfg.prompt.split(' ')[0].toUpperCase().slice(0, 10), Math.round(w * 0.06), Math.round(h * 0.18));
  ctx.shadowBlur = 0;

  ctx.font = `800 ${Number(textSize.value)}px Inter, Arial`;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = Number(stroke.value);
  const lines = wrapLines(ctx, cfg.prompt.toLowerCase(), Math.round(w * 0.52), cfg.platform === 'youtube' ? 2 : 3);
  let y = cfg.platform === 'youtube' ? Math.round(h * 0.78) : Math.round(h * 0.76);
  lines.forEach((line) => {
    ctx.strokeText(line, Math.round(w * 0.06), y);
    ctx.fillText(line, Math.round(w * 0.06), y);
    y += Math.round(w * 0.075);
  });

  ctx.font = `700 ${Math.round(w * 0.052)}px Inter, Arial`;
  ctx.strokeText('beginner → pro', Math.round(w * 0.06), Math.round(h * 0.95));
  ctx.fillText('beginner → pro', Math.round(w * 0.06), Math.round(h * 0.95));

  return canvas.toDataURL(`image/${exportFormat.value === 'jpg' ? 'jpeg' : exportFormat.value}`);
}

function renderGallery() {
  gallery.innerHTML = '';
  generatedVariants.forEach((url, idx) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img src="${url}" alt="Variant ${idx + 1}" />
      <div class="meta">
        <span>Variant ${idx + 1}</span>
        <input type="radio" name="variant" ${idx === selectedVariantIndex ? 'checked' : ''} />
      </div>
    `;
    card.querySelector('input').addEventListener('change', () => {
      selectedVariantIndex = idx;
    });
    gallery.appendChild(card);
  });
}

function saveSession() {
  sessionStorage.setItem('thumbStudioState', JSON.stringify({
    prompt: promptInput.value,
    style: stylePreset.value,
    platform: platformSize.value,
    variants: generatedVariants,
    selected: selectedVariantIndex
  }));
}

function restoreSession() {
  const raw = sessionStorage.getItem('thumbStudioState');
  if (!raw) return;
  const data = JSON.parse(raw);
  promptInput.value = data.prompt || '';
  stylePreset.value = data.style || 'youtube';
  platformSize.value = data.platform || 'youtube';
  generatedVariants = data.variants || [];
  selectedVariantIndex = data.selected || 0;
  if (generatedVariants.length) {
    renderGallery();
    statusEl.textContent = `Restored ${generatedVariants.length} thumbnails from this session.`;
  }
}

async function generateAll() {
  const prompt = promptInput.value.trim();
  if (!prompt) {
    statusEl.textContent = 'Please enter a prompt.';
    return;
  }

  statusEl.textContent = 'Generating variations...';
  const count = Number(variationCount.value);

  const hooks = getHooks(prompt);
  hookList.innerHTML = hooks.map((h) => `<li>${h}</li>`).join('');
  const score = scoreThumbnail(prompt, stylePreset.value, Boolean(uploadData));
  scoreText.textContent = `Click potential: ${score}%`;
  improveText.textContent = score < 78
    ? 'Suggestion: Improve contrast + use shorter text + stronger face focus.'
    : 'Great! Keep text short and ensure one clear focal subject.';

  generatedVariants = [];
  for (let i = 0; i < count; i += 1) {
    const variant = await buildVariant(i, {
      prompt,
      style: stylePreset.value,
      platform: platformSize.value,
      upload: uploadData,
      reference: referenceData,
      videoFrame: extractedFrameData,
      contrast: Number(contrast.value) + i * 0.05
    });
    generatedVariants.push(variant);
  }

  selectedVariantIndex = 0;
  renderGallery();
  saveSession();
  statusEl.textContent = `Generated ${count} thumbnails.`;
}

uploadImage.addEventListener('change', async () => {
  if (uploadImage.files?.[0]) uploadData = await fileToDataUrl(uploadImage.files[0]);
});
referenceImage.addEventListener('change', async () => {
  if (referenceImage.files?.[0]) referenceData = await fileToDataUrl(referenceImage.files[0]);
});
videoInput.addEventListener('change', async () => {
  if (!videoInput.files?.[0]) return;
  statusEl.textContent = 'Extracting key video frame...';
  extractedFrameData = await extractBestFrame(videoInput.files[0]);
  statusEl.textContent = 'Video frame extracted.';
});

youtubeLink.addEventListener('change', () => {
  const id = extractYouTubeId(youtubeLink.value.trim());
  if (id) {
    referenceData = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
    statusEl.textContent = 'Using YouTube thumbnail as reference image.';
  }
});

btnViral.addEventListener('click', () => {
  textSize.value = Math.min(140, Number(textSize.value) + 8);
  shadow.value = Math.min(35, Number(shadow.value) + 6);
});
btnReadable.addEventListener('click', () => {
  stroke.value = Math.min(18, Number(stroke.value) + 3);
  textSize.value = Math.max(62, Number(textSize.value));
});
btnContrast.addEventListener('click', () => {
  contrast.value = Math.min(1.8, Number(contrast.value) + 0.2).toFixed(1);
});

generateBtn.addEventListener('click', generateAll);

downloadSelectedBtn.addEventListener('click', () => {
  if (!generatedVariants.length) return;
  const link = document.createElement('a');
  const fmt = exportFormat.value === 'jpg' ? 'jpg' : exportFormat.value;
  link.href = generatedVariants[selectedVariantIndex];
  link.download = `thumbnail-${selectedVariantIndex + 1}.${fmt}`;
  link.click();
});

downloadAllBtn.addEventListener('click', () => {
  const fmt = exportFormat.value === 'jpg' ? 'jpg' : exportFormat.value;
  generatedVariants.forEach((url, i) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `thumbnail-${i + 1}.${fmt}`;
    link.click();
  });
});

restoreSession();

const promptInput = document.getElementById('promptInput');
const stylePreset = document.getElementById('stylePreset');
const platformSize = document.getElementById('platformSize');
const variationCount = document.getElementById('variationCount');
const exportFormat = document.getElementById('exportFormat');
const generateBtn = document.getElementById('generateBtn');
const downloadSelectedBtn = document.getElementById('downloadSelectedBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const gallery = document.getElementById('gallery');
const statusEl = document.getElementById('status');

let selectedIndex = 0;
let images = [];
let activeProvider = '';

function buildPrompt() {
  const goal = promptInput.value.trim();
  if (!goal) return '';

  return [
    `Create a ${stylePreset.value} thumbnail concept.`,
    `Topic: ${goal}.`,
    'Use strong visual hierarchy, one dominant subject, clean background separation, and high readability.',
    'Output should look like a real YouTube/short-form social media thumbnail designed for click-through.'
  ].join(' ');
}

function aspectFromSize(size) {
  const [w, h] = size.split('x').map(Number);
  return `${w} / ${h}`;
}

async function convertDataUrl(dataUrl, format) {
  if (format === 'png') return dataUrl;

  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  canvas.getContext('2d').drawImage(img, 0, 0);

  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/webp';
  return canvas.toDataURL(mime, 0.95);
}

function render() {
  gallery.innerHTML = '';
  gallery.style.setProperty('--thumb-ratio', aspectFromSize(platformSize.value));

  images.forEach((url, idx) => {
    const card = document.createElement('article');
    card.className = 'item';
    card.innerHTML = `
      <img src="${url}" alt="Generated thumbnail ${idx + 1}" />
      <div class="meta">
        <span>Variation ${idx + 1}</span>
        <input type="radio" name="thumb" ${idx === selectedIndex ? 'checked' : ''} />
      </div>
    `;

    const imgEl = card.querySelector('img');
    imgEl.onerror = () => {
      imgEl.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgwIiBoZWlnaHQ9IjcyMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzEyMjI0ZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSIjZmZmIiBmb250LXNpemU9IjQ4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiPkltYWdlIGZhaWxlZCwgdHJ5IGFnYWluPC90ZXh0Pjwvc3ZnPg==';
    };

    card.querySelector('input').addEventListener('change', () => {
      selectedIndex = idx;
    });
    gallery.appendChild(card);
  });
}

async function generate() {
  const prompt = buildPrompt();
  if (!prompt) {
    statusEl.textContent = 'Please enter your thumbnail goal.';
    return;
  }

  generateBtn.disabled = true;
  statusEl.textContent = 'Generating with AI engine...';

  try {
    const res = await fetch('/.netlify/functions/generate-thumbnail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        size: platformSize.value,
        n: Number(variationCount.value)
      })
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Generation failed.');

    images = json.images || [];
    activeProvider = json.provider || 'provider';
    selectedIndex = 0;
    render();

    statusEl.textContent = json.warning
      ? `${json.warning} Generated ${images.length} thumbnail(s).`
      : `Generated ${images.length} thumbnail(s) with ${activeProvider}.`;
  } catch (error) {
    statusEl.textContent = `Error: ${error.message}`;
  } finally {
    generateBtn.disabled = false;
  }
}

downloadSelectedBtn.addEventListener('click', async () => {
  if (!images.length) return;
  const fmt = exportFormat.value;
  const ext = fmt === 'jpeg' ? 'jpg' : fmt;
  const a = document.createElement('a');

  try {
    a.href = await convertDataUrl(images[selectedIndex], fmt);
  } catch {
    a.href = images[selectedIndex];
  }

  a.download = `thumbnail-${selectedIndex + 1}.${ext}`;
  a.target = '_blank';
  a.click();
});

downloadAllBtn.addEventListener('click', async () => {
  if (!images.length) return;
  const fmt = exportFormat.value;
  const ext = fmt === 'jpeg' ? 'jpg' : fmt;

  for (let i = 0; i < images.length; i += 1) {
    const a = document.createElement('a');
    try {
      a.href = await convertDataUrl(images[i], fmt);
    } catch {
      a.href = images[i];
    }
    a.download = `thumbnail-${i + 1}.${ext}`;
    a.target = '_blank';
    a.click();
  }
});

generateBtn.addEventListener('click', generate);

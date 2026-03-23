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
      `YouTube thumbnail, 16:9 ratio, high contrast, eye-catching.` ,
      `Topic: ${topic}.`,
      `Style: ${style}.`,
      details ? `Extra notes: ${details}.` : '',
      uploadedImageDataUrl
        ? 'Include a composition that would work with an uploaded reference image of the creator.'
        : 'No reference image uploaded.'
    ]
      .filter(Boolean)
      .join(' ');

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&seed=${Date.now()}&nologo=true`;

    outputPreview.src = url;
    await outputPreview.decode();

    outputPreview.hidden = false;
    outputPlaceholder.hidden = true;
    downloadLink.href = url;
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

const uploadForm = document.getElementById('upload-form');
const fileInput = document.getElementById('file-input');
const dropzone = document.getElementById('dropzone');
const selectedFilename = document.getElementById('selected-filename');
const statusEl = document.getElementById('upload-status');
const progressEl = document.getElementById('upload-progress');
const trackList = document.getElementById('track-list');
const trackTemplate = document.getElementById('track-card-template');
const filterButtons = document.querySelectorAll('.tracks__filters .chip');

let tracks = [];
let activeFilter = 'all';

async function fetchTracks() {
  try {
    const response = await fetch('/api/tracks');
    if (!response.ok) {
      throw new Error('Failed to load tracks');
    }
    tracks = await response.json();
    renderTracks();
  } catch (error) {
    setStatus(error.message, true);
  }
}

function renderTracks() {
  trackList.innerHTML = '';
  const filtered = getFilteredTracks();

  if (!filtered.length) {
    const emptyState = document.createElement('p');
    emptyState.className = 'tracks__empty';
    emptyState.textContent = 'No audio relics yet. Upload your first echo to begin the archive!';
    trackList.appendChild(emptyState);
    return;
  }

  filtered.forEach((track) => {
    const node = trackTemplate.content.cloneNode(true);
    const article = node.querySelector('.track-card');
    const timestampEl = node.querySelector('.track-card__timestamp');
    const titleEl = node.querySelector('.track-card__title');
    const detailsEl = node.querySelector('.track-card__details');
    const audioEl = node.querySelector('audio');
    const copyButton = node.querySelector('.track-card__copy');

    timestampEl.textContent = formatRelativeTime(track.uploaded_at);
    titleEl.textContent = track.title;
    detailsEl.textContent = `${track.original_filename} · ${formatFilesize(track.filesize)}`;
    audioEl.src = `/stream/${track.id}`;
    audioEl.setAttribute('data-track-id', track.id);

    copyButton.addEventListener('click', () => copyStreamUrl(track));

    trackList.appendChild(node);
    article.classList.add('track-card--ready');
  });
}

function getFilteredTracks() {
  if (activeFilter === 'recent') {
    return tracks.slice(0, 6);
  }
  if (activeFilter === 'longform') {
    return tracks.filter((track) => track.filesize >= 10 * 1024 * 1024);
  }
  return tracks;
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (Number.isNaN(diff)) {
    return 'Unknown age';
  }

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 172800) return 'Yesterday';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

function formatFilesize(bytes) {
  if (bytes === 0) return '0 bytes';
  const units = ['bytes', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#ff9aa2' : 'var(--color-highlight)';
}

function resetUploadForm() {
  uploadForm.reset();
  selectedFilename.textContent = 'No file selected';
  progressEl.value = 0;
  progressEl.hidden = true;
}

function handleFileSelection(file) {
  if (!file) return;
  selectedFilename.textContent = file.name;
}

function uploadFile(file) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        progressEl.hidden = false;
        progressEl.value = percent;
        setStatus(`Uploading… ${percent}%`);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const payload = JSON.parse(xhr.responseText);
          resolve(payload);
        } catch (error) {
          reject(new Error('Upload succeeded but response was invalid.'));
        }
      } else {
        reject(new Error(xhr.responseText || 'Upload failed.'));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error while uploading.'));
    });

    xhr.send(formData);
  });
}

async function handleUpload(event) {
  event.preventDefault();
  const file = fileInput.files?.[0];

  if (!file) {
    setStatus('Please select an audio file to upload.', true);
    return;
  }

  try {
    setStatus('Starting upload…');
    const result = await uploadFile(file);
    if (result?.track) {
      tracks.unshift(result.track);
      renderTracks();
      setStatus(`"${result.track.title}" added to the archive.`);
      resetUploadForm();
    }
  } catch (error) {
    setStatus(error.message, true);
  }
}

function handleDrop(event) {
  event.preventDefault();
  dropzone.classList.remove('dragover');
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    fileInput.files = event.dataTransfer.files;
    handleFileSelection(file);
  }
}

function handleDragOver(event) {
  event.preventDefault();
  dropzone.classList.add('dragover');
}

function handleDragLeave() {
  dropzone.classList.remove('dragover');
}

function copyStreamUrl(track) {
  const url = `${window.location.origin}/stream/${track.id}`;
  navigator.clipboard
    .writeText(url)
    .then(() => setStatus(`Copied stream URL for "${track.title}"`))
    .catch(() => setStatus('Unable to copy link. Please copy manually.', true));
}

function attachFilterEvents() {
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      filterButtons.forEach((node) => node.classList.remove('chip--active'));
      button.classList.add('chip--active');
      activeFilter = button.dataset.filter ?? 'all';
      renderTracks();
    });
  });
}

fileInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  handleFileSelection(file);
});

uploadForm.addEventListener('submit', handleUpload);

dropzone.addEventListener('dragover', handleDragOver);
dropzone.addEventListener('dragleave', handleDragLeave);
dropzone.addEventListener('drop', handleDrop);

attachFilterEvents();
fetchTracks();

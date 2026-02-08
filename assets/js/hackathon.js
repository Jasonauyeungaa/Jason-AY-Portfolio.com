// Hackathon Page JavaScript

// Load demo video
const videoContainer = document.querySelector('.video-container');
const videoPath = 'assets/videos/demo.mp4';

async function loadDemoVideo() {
  const video = document.createElement('video');
  video.src = videoPath;
  video.controls = true;
  video.style.width = '100%';
  video.style.maxWidth = '900px';
  video.style.borderRadius = '16px';
  video.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
  
  video.onerror = () => {
    console.log('Demo video not found. Place demo.mp4 in assets/videos/');
  };
  
  videoContainer.innerHTML = '';
  videoContainer.appendChild(video);
}

// Photo Gallery
const hackathonGallery = document.getElementById('hackathonGallery');
const mediaFiles = [];

async function loadHackathonPhotos() {
  const hackathonDir = 'assets/images/hackathon/';
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif'];
  
  // Try to load images
  for (let i = 1; i <= 50; i++) {
    for (const ext of imageExtensions) {
      const filename = `${i}.${ext}`;
      const path = `${hackathonDir}${filename}`;
      
      try {
        const img = new Image();
        img.src = path;
        await new Promise((resolve) => {
          img.onload = () => {
            mediaFiles.push({
              type: 'image',
              src: path,
              caption: `Hackathon Photo ${i}`
            });
            resolve();
          };
          img.onerror = () => resolve();
          setTimeout(resolve, 100);
        });
      } catch (e) {}
    }
  }
  
  if (mediaFiles.length > 0) {
    renderGallery();
  }
}

function renderGallery() {
  hackathonGallery.innerHTML = mediaFiles.map((item, index) => `
    <div class="media-item glass-card" data-index="${index}">
      <img src="${item.src}" alt="${item.caption}" loading="lazy">
    </div>
  `).join('');
  
  // Add click handlers for lightbox
  document.querySelectorAll('.media-item').forEach(item => {
    item.addEventListener('click', () => {
      const index = item.dataset.index;
      openLightbox(mediaFiles[index]);
    });
  });
}

// Lightbox
function openLightbox(media) {
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox active';
  lightbox.style.cssText = `
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.95);
    z-index: 9999;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  `;
  
  lightbox.innerHTML = `
    <button class="lightbox-close" style="
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      border: none;
      color: white;
      font-size: 2rem;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.3s ease;
    " onclick="this.parentElement.remove()">×</button>
    <div class="lightbox-content" style="max-width: 90%; max-height: 90%;">
      <img src="${media.src}" alt="${media.caption}" style="max-width: 100%; max-height: 90vh; border-radius: 8px;">
      <p style="color: white; text-align: center; margin-top: 1rem; font-size: 1.1rem;">${media.caption}</p>
    </div>
  `;
  
  document.body.appendChild(lightbox);
  
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) lightbox.remove();
  });
  
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      lightbox.remove();
      document.removeEventListener('keydown', escHandler);
    }
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadDemoVideo();
  loadHackathonPhotos();
  console.log('To add media:');
  console.log('1. Place demo.mp4 in assets/videos/');
  console.log('2. Place photos as 1.jpg, 2.jpg, etc. in assets/images/hackathon/');
});

console.log('AWS Hackathon Page - Loaded Successfully ✓');

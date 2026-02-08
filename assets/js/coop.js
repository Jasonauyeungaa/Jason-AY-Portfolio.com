// Co-op Page JavaScript

// Media Gallery Functionality
const mediaGallery = document.getElementById('mediaGallery');
const categoryBtns = document.querySelectorAll('.category-btn');

// Auto-load images from assets/images/coop/ folder
const mediaFiles = [];

// Automatically scan and load images
async function loadMediaFiles() {
  const coopDir = 'assets/images/coop/';
  const categories = ['hackathon', 'leanday', 'techathon', 'events', 'reinvent'];
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif'];
  const videoExtensions = ['mp4', 'mov', 'webm'];
  
  // Try to load images by attempting to fetch them
  // This will work if files are named with category prefix
  for (let i = 1; i <= 50; i++) {
    for (const cat of categories) {
      for (const ext of imageExtensions) {
        const filename = `${cat}_${i}.${ext}`;
        const path = `${coopDir}${filename}`;
        
        try {
          const img = new Image();
          img.src = path;
          await new Promise((resolve) => {
            img.onload = () => {
              mediaFiles.push({
                type: 'image',
                src: path,
                category: cat,
                caption: filename.replace(/_/g, ' ').replace(/\.[^.]+$/, '')
              });
              resolve();
            };
            img.onerror = () => resolve();
            setTimeout(resolve, 100);
          });
        } catch (e) {}
      }
    }
  }
  
  // Also check for files without numbering
  for (const cat of categories) {
    for (const ext of imageExtensions) {
      const filename = `${cat}.${ext}`;
      const path = `${coopDir}${filename}`;
      
      try {
        const img = new Image();
        img.src = path;
        await new Promise((resolve) => {
          img.onload = () => {
            mediaFiles.push({
              type: 'image',
              src: path,
              category: cat,
              caption: cat.charAt(0).toUpperCase() + cat.slice(1)
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
    renderMediaGallery('all');
  }
}

// Render media gallery
function renderMediaGallery(category) {
  if (mediaFiles.length === 0) {
    // Show upload placeholder
    return;
  }

  const filteredMedia = category === 'all' 
    ? mediaFiles 
    : mediaFiles.filter(item => item.category === category);

  mediaGallery.innerHTML = filteredMedia.map((item, index) => {
    if (item.type === 'image') {
      return `
        <div class="media-item glass-card" data-index="${index}">
          <img src="${item.src}" alt="${item.caption}" loading="lazy">
          <div class="media-overlay">
            <p>${item.caption}</p>
          </div>
        </div>
      `;
    } else if (item.type === 'video') {
      return `
        <div class="media-item glass-card" data-index="${index}">
          <video src="${item.src}" muted loop></video>
          <div class="media-overlay">
            <p>${item.caption}</p>
          </div>
        </div>
      `;
    }
  }).join('');

  // Add click handlers for lightbox
  document.querySelectorAll('.media-item').forEach(item => {
    item.addEventListener('click', () => {
      const index = item.dataset.index;
      openLightbox(mediaFiles[index]);
    });

    // Play video on hover
    const video = item.querySelector('video');
    if (video) {
      item.addEventListener('mouseenter', () => video.play());
      item.addEventListener('mouseleave', () => {
        video.pause();
        video.currentTime = 0;
      });
    }
  });
}

// Category filter
categoryBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    categoryBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const category = btn.dataset.category;
    renderMediaGallery(category);
  });
});

// Lightbox functionality
function openLightbox(media) {
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox active';
  
  const content = media.type === 'image'
    ? `<img src="${media.src}" alt="${media.caption}">`
    : `<video src="${media.src}" controls autoplay></video>`;
  
  lightbox.innerHTML = `
    <button class="lightbox-close" onclick="this.parentElement.remove()">×</button>
    <div class="lightbox-content">
      ${content}
      <p style="color: white; text-align: center; margin-top: 1rem; font-size: 1.1rem;">${media.caption}</p>
    </div>
  `;
  
  document.body.appendChild(lightbox);
  
  // Close on background click
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.remove();
    }
  });
  
  // Close on Escape key
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      lightbox.remove();
      document.removeEventListener('keydown', escHandler);
    }
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadMediaFiles();
  console.log('To add media files:');
  console.log('1. Create folder: assets/images/coop/');
  console.log('2. Add files with naming: hackathon_1.jpg, leanday_1.jpg, etc.');
});

// Smooth scroll for timeline
document.querySelectorAll('.month-badge').forEach(badge => {
  badge.style.cursor = 'pointer';
  badge.addEventListener('click', () => {
    badge.closest('.month-section').scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  });
});

// Add animation to task items on scroll
const taskObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateX(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.task-item').forEach((item, index) => {
  item.style.opacity = '0';
  item.style.transform = 'translateX(-20px)';
  item.style.transition = `opacity 0.5s ease ${index * 0.05}s, transform 0.5s ease ${index * 0.05}s`;
  taskObserver.observe(item);
});

console.log('HAECO Co-op Experience Page - Loaded Successfully ✓');
console.log('Upload your photos and videos to: assets/images/coop/');

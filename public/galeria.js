// API endpoint
const API_URL = '/api/gallery';

// Global gallery data
let galleryData = [];
let currentGalleryItems = []; // Track currently displayed items
const SESSION_TIMESTAMP = new Date().getTime();

// Update the preload function
function preloadAdjacentImages(currentIndex) {
  if (!currentGalleryItems || currentGalleryItems.length === 0) return;
  
  for (let i = 1; i <= 5; i++) {
    // Preload next 5 images
    const nextIndex = (currentIndex + i) % currentGalleryItems.length;
    const nextMedia = currentGalleryItems[nextIndex];
    
    if (nextMedia && nextMedia.type === 'image' && !nextMedia.hqImageLoaded) {
      const hqUrl = `${nextMedia.hqSrc}?t=${SESSION_TIMESTAMP}`;
      const img = new Image();
      img.src = hqUrl;
      nextMedia.hqImageLoaded = true;
    }

    // Preload previous 5 images
    const prevIndex = (currentIndex - i + currentGalleryItems.length) % currentGalleryItems.length;
    const prevMedia = currentGalleryItems[prevIndex];
    
    if (prevMedia && prevMedia.type === 'image' && !prevMedia.hqImageLoaded) {
      const hqUrl = `${prevMedia.hqSrc}?t=${SESSION_TIMESTAMP}`;
      const img = new Image();
      img.src = hqUrl;
      prevMedia.hqImageLoaded = true;
    }
  }
}

// Fetch gallery data from backend
async function fetchGalleryData() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching gallery data:', error);
    return [];
  }
}

// Initialize gallery
document.addEventListener('DOMContentLoaded', async () => {
  const galleryGrid = document.getElementById('galleryGrid');
  galleryGrid.innerHTML = `
    <div class="loader">
      <div class="loader-spinner"></div>
      <span>Carregando imagens da galeria...</span>
    </div>
  `;

  try {
    galleryData = await fetchGalleryData();
    
    // Initialize hqImageLoaded for all images
    galleryData.forEach(item => {
      if (item.type === 'image') {
        item.hqImageLoaded = false;
      }
    });
    
    // Set initial current items
    currentGalleryItems = [...galleryData];
    
    // Add filter button event listeners
    document.querySelectorAll('.filter-btn').forEach(button => {
      button.addEventListener('click', () => {
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        button.classList.add('active');
        
        // Filter gallery
        filterGallery(button.dataset.filter);
      });
    });
    
    renderGallery(currentGalleryItems);
    initLightbox();
  } catch (error) {
    galleryGrid.innerHTML = `
      <div class="error">
        Ocorreu um erro ao carregar a galeria. Por favor, tente novamente mais tarde.
      </div>
    `;
    console.error('Gallery initialization error:', error);
  }
});

// Render gallery items
function renderGallery(items) {
  const galleryGrid = document.getElementById('galleryGrid');
  galleryGrid.innerHTML = '';

  if (items.length === 0) {
    galleryGrid.innerHTML = '<div class="error">Nenhuma imagem encontrada na galeria</div>';
    return;
  }

  items.forEach((item, index) => {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';
    galleryItem.dataset.type = item.type;
    galleryItem.dataset.index = index;
    
    const videoIcon = item.type === 'video' ? 
      `<div class="video-icon">
         <i class="fas fa-play"></i>
         ${item.duration ? `<span class="video-duration">${item.duration}</span>` : ''}
       </div>` : '';
    
    galleryItem.innerHTML = `
      <img src="${item.thumbnail}" alt="${item.title}" loading="lazy">
      ${videoIcon}
      <div class="gallery-item-overlay">
        <h3 class="gallery-item-title">${item.title}</h3>
        <p class="gallery-item-category">${item.presentationName || ''}</p>
      </div>
    `;
    
    // Add image loading handler
    const img = galleryItem.querySelector('img');
    img.onload = function() {
      this.classList.add('loaded');
    };
    
    galleryGrid.appendChild(galleryItem);
  });
  
  // Re-initialize lightbox after items are rendered
  initLightbox();
}

// Initialize lightbox functionality
function initLightbox() {
  const lightbox = document.querySelector('.lightbox');
  const lightboxImage = document.querySelector('.lightbox-image');
  const lightboxVideo = document.querySelector('.lightbox-video');
  const lightboxTitle = document.querySelector('.lightbox-title');
  const lightboxCategory = document.querySelector('.lightbox-category');
  const lightboxClose = document.querySelector('.lightbox-close');
  const lightboxPrev = document.querySelector('.lightbox-prev');
  const lightboxNext = document.querySelector('.lightbox-next');
  
  let currentIndex = 0;
  
  function stopVideo() {
    if (lightboxVideo) {
      // Remove src to stop iframe video playback
      lightboxVideo.src = '';
    }
  }

  // Get all gallery items
  const galleryItems = document.querySelectorAll('.gallery-item');
  
  // Add click event to each gallery item
  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const index = parseInt(item.dataset.index);
      openLightbox(index);
    });
  });
  
  // Open lightbox with specific media
  function openLightbox(index) {
    currentIndex = index;
    const media = currentGalleryItems[index];
    
    if (!media) return;
    
    stopVideo();
    preloadAdjacentImages(index);
    
    // Add loading state
    lightbox.classList.add('lightbox-loading');
    
    // Reset lightbox
    lightboxImage.style.display = 'none';
    lightboxVideo.style.display = 'none';
    lightboxImage.classList.remove('zoomed');
    
    // Set presentation info
    lightboxTitle.textContent = media.title;
    lightboxCategory.textContent = media.presentationName || '';
    
    if (media.type === 'video') {
      lightboxVideo.src = media.src;
      lightboxVideo.style.display = 'block';
      lightbox.classList.remove('lightbox-loading');
    } else {
      lightboxImage.style.display = 'block';
      lightboxImage.classList.add('loading');

      if (media.hqImageLoaded) {
        lightboxImage.src = media.hqSrc;
        lightboxImage.classList.remove('loading');
        lightboxImage.classList.add('loaded');
        lightbox.classList.remove('lightbox-loading');
      } else {
        const timestamp = new Date().getTime();
        const hqUrl = `${media.hqSrc}?t=${timestamp}`;

        const highResImage = new Image();
        highResImage.onload = function() {
          media.hqImageLoaded = true;
          lightboxImage.src = hqUrl;
          lightboxImage.classList.remove('loading');
          lightboxImage.classList.add('loaded');
          lightbox.classList.remove('lightbox-loading');
        };

        highResImage.onerror = function() {
          console.error('Failed to load HQ image:', media.hqSrc);
          lightboxImage.classList.remove('loading');
          lightbox.classList.remove('lightbox-loading');
          lightboxImage.src = media.thumbnail;
        };

        highResImage.src = hqUrl;
      }
    }

    lightboxImage.onerror = function() {
      console.error('Failed to load HQ image:', this.src);
      this.src = media.thumbnail; 
    };
    
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  // Close lightbox
  function closeLightbox() {
    stopVideo();
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function prevMedia() {
    stopVideo();
    currentIndex = (currentIndex - 1 + currentGalleryItems.length) % currentGalleryItems.length;
    openLightbox(currentIndex);
  }

  function nextMedia() {
    stopVideo();
    currentIndex = (currentIndex + 1) % currentGalleryItems.length;
    openLightbox(currentIndex);
  }
  
  // Event listeners
  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', prevMedia);
  lightboxNext.addEventListener('click', nextMedia);
  
  // Close lightbox when clicking outside the content
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (lightbox.classList.contains('active')) {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') prevMedia();
      else if (e.key === 'ArrowRight') nextMedia();
    }
  });
}

function filterGallery(presentation) {
  console.log(`Filtering by: ${presentation}`);
  const galleryGrid = document.getElementById('galleryGrid');
  galleryGrid.innerHTML = `
    <div class="loader">
      <div class="loader-spinner"></div>
      <span>Carregando...</span>
    </div>
  `;
  
  // Filter items based on presentation
  let filteredItems = [];
  if (presentation === 'all') {
    filteredItems = [...galleryData];
  } else {
    filteredItems = galleryData.filter(item => {
      const match = item.presentation === presentation;
      console.log(`Item: ${item.title}, Presentation: ${item.presentation}, Match: ${match}`);
      return match;
    });
  }
  
  console.log(`Found ${filteredItems.length} items for ${presentation}`);
  renderGallery(filteredItems);
}
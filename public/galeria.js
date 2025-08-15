// API endpoint
    const API_URL = '/api/gallery';
    
    // Global gallery data
    let galleryData = [];
    const SESSION_TIMESTAMP = new Date().getTime();
    let currentFilteredData = [];
    let activeFilter = 'all';
// Update the preload function
function preloadAdjacentImages(currentIndex) {
  if (!currentFilteredData || currentFilteredData.length === 0) return;
  
  for (let i = 1; i <= 5; i++) {
    // Preload next 5 images
    const nextIndex = (currentIndex + i) % galleryData.length;
    const nextMedia = galleryData[nextIndex];
    
    if (nextMedia && nextMedia.type === 'image' && !nextMedia.hqImageLoaded) {
      const hqUrl = `${nextMedia.hqSrc}?t=${SESSION_TIMESTAMP}`;
      const img = new Image();
      img.src = hqUrl;
      nextMedia.hqImageLoaded = true;
    }

    // Preload previous 5 images
    const prevIndex = (currentIndex - i + galleryData.length) % galleryData.length;
    const prevMedia = galleryData[prevIndex];
    
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
        currentFilteredData = [...galleryData];
        // Initialize hqImageLoaded for all images
        galleryData.forEach(item => {
          if (item.type === 'image') {
            item.hqImageLoaded = false;
          }
        });
        
        renderGallery(currentFilteredData); 
        initLightbox();
        initFilters(); 
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
      </div>
    `;
    
    // Add click handler directly to this item
    galleryItem.addEventListener('click', () => {
      openLightbox(index);
    });
    
    // Add image loading handler
    const img = galleryItem.querySelector('img');
    img.onload = function() {
      this.classList.add('loaded');
    };
    
    galleryGrid.appendChild(galleryItem);
  });
}
    
    // Initialize lightbox functionality
    function initLightbox() {
  const lightbox = document.querySelector('.lightbox');
  const lightboxImage = document.querySelector('.lightbox-image');
  const lightboxVideo = document.querySelector('.lightbox-video');
  const lightboxTitle = document.querySelector('.lightbox-title');
  const lightboxClose = document.querySelector('.lightbox-close');
  const lightboxPrev = document.querySelector('.lightbox-prev');
  const lightboxNext = document.querySelector('.lightbox-next');
  
  let currentIndex = 0;

  // Open lightbox with specific media
  window.openLightbox = function(index) { // Make it global
    currentIndex = index;
    const media = currentFilteredData[index];
    
    // Add loading state
    lightbox.classList.add('lightbox-loading');
    
    // Reset lightbox
    lightboxImage.style.display = 'none';
    lightboxVideo.style.display = 'none';
    lightboxImage.classList.remove('zoomed');
    
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

    lightboxTitle.textContent = media.title;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

      
      // Close lightbox
      function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        lightboxVideo.src = ''; // Stop video playback
      }
      
      // Navigate to previous media
      function prevMedia() {
        currentIndex = (currentIndex - 1 + currentFilteredData.length) % currentFilteredData.length;
        openLightbox(currentIndex);
      }
      
      function nextMedia() {
        currentIndex = (currentIndex + 1) % currentFilteredData.length;
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
    function scaleImageToFit(imgElement) {
      const maxWidth = window.innerWidth * 0.9;
      const maxHeight = window.innerHeight * 0.9;
      
      const ratio = Math.min(
        maxWidth / imgElement.naturalWidth,
        maxHeight / imgElement.naturalHeight
      );
      
      imgElement.style.width = `${imgElement.naturalWidth * ratio}px`;
      imgElement.style.height = 'auto';
    }

// Initialize filters
function initFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      const filter = this.dataset.filter;
      applyFilter(filter);
    });
  });
}

// Apply filter function
function applyFilter(filter) {
  activeFilter = filter;
  
  // Update button states
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  
  // Apply filter
  if (filter === 'all') {
    currentFilteredData = [...galleryData];
  } else {
    currentFilteredData = galleryData.filter(item => 
      item.presentation === filter
    );
  }
  
  renderGallery(currentFilteredData);
}

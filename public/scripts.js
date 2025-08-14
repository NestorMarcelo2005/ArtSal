document.addEventListener("DOMContentLoaded", function () {
  const heroSlider = document.getElementById('hero-slider');
  const heroLayer = document.querySelector('.hero-bg-layer');
  
  if (heroSlider && heroLayer) {
    const images = [
      'images/foto rise up com o Nuno cortada.jpg',
      'images/IMG-20240708-WA0021jpg.0cortada.jpg',
      'images/IMG-20240707-WA0015jpg.0cortada.jpg',
      'images/LAB_1906jpg.0cortada.jpg'
     ];

        let index = 0;
        
        // Preload images
        images.forEach(src => {
          const img = new Image();
          img.src = src;
        });

        function changeBackground() {
          heroLayer.style.opacity = 0;
          
          setTimeout(() => {
            heroLayer.style.backgroundImage = `url('${images[index]}')`;
            
            setTimeout(() => {
              heroLayer.style.opacity = 1;
            }, 50);
            
            index = (index + 1) % images.length;
          }, 500);
        }

        // Set initial image
        heroLayer.style.backgroundImage = `url('${images[0]}')`;
        heroLayer.style.opacity = 1;
        index = 1;
        
        // Start rotation
        setInterval(changeBackground, 5000);
      }
      
      // Smooth scrolling for anchor links
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
          e.preventDefault();
          const targetId = this.getAttribute('href');
          if(targetId === '#') return;
          
          const targetElement = document.querySelector(targetId);
          
          if (targetElement) {
            window.scrollTo({
              top: targetElement.offsetTop - 80,
              behavior: 'smooth'
            });
          }
        });
      });

      // Navbar scroll effect
      const navbar = document.querySelector('.custom-navbar');
      if (navbar) {
        window.addEventListener('scroll', function () {
          if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
          } else {
            navbar.classList.remove('scrolled');
          }
        });
      }

      // Active link highlighting
      const currentPage = window.location.pathname.split("/").pop();
      
      // Handle top-level links
      document.querySelectorAll(".nav-link.custom-link").forEach(link => {
        const href = link.getAttribute("href");
        if (href === currentPage) {
          link.classList.add("active");
        }
      });
      
      // Handle dropdown links
      const dropdownItems = document.querySelectorAll('.dropdown-menu .dropdown-item');
      dropdownItems.forEach(item => {
        const href = item.getAttribute("href");
        if (href === currentPage) {
          item.classList.add("active");
          const parentLink = document.querySelector('#areasDropdown');
          if (parentLink) {
            parentLink.classList.add("active");
          }
        }
      });
      
      // Animation observers
      function createObserver(elements, rootMargin = '0px', threshold = 0.1) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('active');
            }
          });
        }, {
          rootMargin,
          threshold
        });
        
        elements.forEach(el => {
          observer.observe(el);
        });
      }
      
      // Animate elements
      const animateElements = document.querySelectorAll('.animate');
      if(animateElements.length > 0) {
        createObserver(animateElements);
      }
      
      // Show cards
      const showCards = document.querySelectorAll('.show-card');
      if(showCards.length > 0) {
        createObserver(showCards);
        
        showCards.forEach(card => {
          card.addEventListener('mouseenter', () => {
            card.style.transition = 'none';
            card.style.transform = 'translateY(-10px)';
            card.style.boxShadow = '0 15px 30px rgba(212, 175, 55, 0.2)';
            card.style.borderColor = 'var(--gold)';
          });
          
          card.addEventListener('mouseleave', () => {
            card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease';
            card.style.transform = '';
            card.style.boxShadow = '';
            card.style.borderColor = '';
          });
        });
      }
      
      // Timeline animation
      const timelineItems = document.querySelectorAll('.timeline-content');
      if(timelineItems.length > 0) {
        createObserver(timelineItems);
      }
      const faqItems = document.querySelectorAll('.faq-item');
      faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
          item.classList.toggle('active');
        });
      });
    });
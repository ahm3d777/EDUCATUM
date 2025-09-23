// ===========================
// INITIALIZATION & CONSTANTS
// ===========================
const STORAGE_KEYS = {
    THEME: 'educatum_theme',
    FIRST_VISIT: 'educatum_first_visit'
};

const ANIMATION_CONFIG = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const PERFORMANCE_CONFIG = {
    debounceDelay: 16, // ~60fps
    throttleDelay: 100
};

// Global state
let isLoading = true;
let scrollPosition = 0;
let isMenuOpen = false;

// ===========================
// UTILITY FUNCTIONS
// ===========================
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

const throttle = (func, delay) => {
    let timeoutId;
    let lastExecTime = 0;
    return (...args) => {
        const currentTime = Date.now();
        
        if (currentTime - lastExecTime > delay) {
            func(...args);
            lastExecTime = currentTime;
        } else {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func(...args);
                lastExecTime = Date.now();
            }, delay - (currentTime - lastExecTime));
        }
    };
};

const getRandomFloat = (min, max) => Math.random() * (max - min) + min;

// ===========================
// LOADING SCREEN
// ===========================
class LoadingManager {
    constructor() {
        this.loadingScreen = document.getElementById('loadingScreen');
        this.minimumLoadTime = 1500; // Minimum loading time for better UX
        this.startTime = Date.now();
    }

    async hide() {
        const elapsedTime = Date.now() - this.startTime;
        const remainingTime = Math.max(0, this.minimumLoadTime - elapsedTime);
        
        // Wait for minimum load time if needed
        if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        
        this.loadingScreen.classList.add('hidden');
        document.body.style.overflow = 'auto';
        
        // Remove loading screen from DOM after animation
        setTimeout(() => {
            if (this.loadingScreen.parentNode) {
                this.loadingScreen.remove();
            }
        }, 500);
        
        isLoading = false;
        this.triggerLoadComplete();
    }

    triggerLoadComplete() {
        // Trigger initial animations
        setTimeout(() => {
            this.animateHeroElements();
            window.scrollAnimationManager?.observeElements();
        }, 200);
    }

    animateHeroElements() {
        const heroElements = document.querySelectorAll('.hero .reveal-animation');
        heroElements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add('revealed');
            }, index * 200);
        });
    }
}

// ===========================
// THEME MANAGEMENT
// ===========================
class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.currentTheme = this.getInitialTheme();
        this.init();
    }

    getInitialTheme() {
        const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
        if (savedTheme) return savedTheme;
        
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.themeToggle?.addEventListener('click', () => this.toggleTheme());
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(STORAGE_KEYS.THEME)) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    }

    applyTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update theme toggle icon
        if (this.themeToggle) {
            const icon = this.themeToggle.querySelector('i');
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }

        // Animate theme transition
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    }
}

// ===========================
// CUSTOM CURSOR
// ===========================
class CustomCursor {
    constructor() {
        this.cursor = document.querySelector('.custom-cursor');
        this.cursorDot = document.querySelector('.custom-cursor-dot');
        this.isVisible = !window.matchMedia('(max-width: 768px)').matches;
        
        if (this.isVisible && this.cursor && this.cursorDot) {
            this.init();
        }
    }

    init() {
        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;
        let dotX = 0, dotY = 0;

        const updateCursor = () => {
            // Smooth cursor following
            cursorX += (mouseX - cursorX) * 0.1;
            cursorY += (mouseY - cursorY) * 0.1;
            
            dotX += (mouseX - dotX) * 0.15;
            dotY += (mouseY - dotY) * 0.15;

            this.cursor.style.transform = `translate(${cursorX - 20}px, ${cursorY - 20}px)`;
            this.cursorDot.style.transform = `translate(${dotX - 4}px, ${dotY - 4}px)`;

            requestAnimationFrame(updateCursor);
        };

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        // Cursor interactions
        const interactiveElements = document.querySelectorAll('a, button, .category-card, .video-card, .teacher-card');
        
        interactiveElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                this.cursor.style.transform += ' scale(1.5)';
                this.cursor.style.opacity = '0.6';
            });
            
            element.addEventListener('mouseleave', () => {
                this.cursor.style.transform = this.cursor.style.transform.replace(' scale(1.5)', '');
                this.cursor.style.opacity = '0.8';
            });
        });

        updateCursor();
    }
}

// ===========================
// NAVIGATION MANAGEMENT
// ===========================
class NavigationManager {
    constructor() {
        this.nav = document.querySelector('nav');
        this.menuButton = document.getElementById('menuButton');
        this.sidebar = document.getElementById('sidebar');
        this.sidebarClose = document.getElementById('sidebarClose');
        this.navLinks = document.querySelectorAll('.nav-link, .sidebar-link');
        this.scrollIndicator = document.querySelector('.scroll-indicator');
        
        this.init();
    }

    init() {
        this.setupMobileMenu();
        this.setupSmoothScrolling();
        this.setupScrollEffects();
        this.setupScrollIndicator();
    }

    setupMobileMenu() {
        this.menuButton?.addEventListener('click', () => this.toggleMenu());
        this.sidebarClose?.addEventListener('click', () => this.closeMenu());
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (isMenuOpen && !this.sidebar.contains(e.target) && !this.menuButton.contains(e.target)) {
                this.closeMenu();
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isMenuOpen) {
                this.closeMenu();
            }
        });
    }

    toggleMenu() {
        if (isMenuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        isMenuOpen = true;
        this.sidebar.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Animate menu button
        this.menuButton.style.transform = 'rotate(90deg)';
    }

    closeMenu() {
        isMenuOpen = false;
        this.sidebar.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        // Reset menu button
        this.menuButton.style.transform = 'rotate(0deg)';
    }

    setupSmoothScrolling() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    
                    if (target) {
                        const navHeight = this.nav.offsetHeight;
                        const targetPosition = target.offsetTop - navHeight - 20;
                        
                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                        
                        // Close mobile menu if open
                        if (isMenuOpen) {
                            setTimeout(() => this.closeMenu(), 300);
                        }
                    }
                }
            });
        });
    }

    setupScrollEffects() {
        const handleScroll = throttle(() => {
            const currentScroll = window.pageYOffset;
            const scrollingDown = currentScroll > scrollPosition;
            
            // Update nav background
            if (currentScroll > 100) {
                this.nav.style.background = document.documentElement.getAttribute('data-theme') === 'dark' 
                    ? 'rgba(10, 11, 30, 0.98)' 
                    : 'rgba(255, 255, 255, 0.98)';
                this.nav.style.boxShadow = '0 5px 25px rgba(0, 0, 0, 0.1)';
            } else {
                this.nav.style.background = document.documentElement.getAttribute('data-theme') === 'dark' 
                    ? 'rgba(10, 11, 30, 0.85)' 
                    : 'rgba(255, 255, 255, 0.85)';
                this.nav.style.boxShadow = 'none';
            }
            
            scrollPosition = currentScroll;
        }, PERFORMANCE_CONFIG.throttleDelay);

        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    setupScrollIndicator() {
        this.scrollIndicator?.addEventListener('click', () => {
            const coursesSection = document.getElementById('courses');
            if (coursesSection) {
                coursesSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
}

// ===========================
// SCROLL ANIMATIONS
// ===========================
class ScrollAnimationManager {
    constructor() {
        this.observer = null;
        this.elements = [];
        this.init();
    }

    init() {
        this.createObserver();
    }

    createObserver() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        const delay = element.dataset.delay || 0;
                        
                        setTimeout(() => {
                            element.classList.add('revealed');
                            this.observer.unobserve(element);
                        }, delay);
                    }
                });
            }, ANIMATION_CONFIG);
        } else {
            // Fallback for browsers without IntersectionObserver
            this.fallbackReveal();
        }
    }

    observeElements() {
        if (!this.observer) return;
        
        const elements = document.querySelectorAll('.reveal-animation:not(.revealed)');
        elements.forEach((element, index) => {
            // Add staggered animation delay
            element.dataset.delay = index * 100;
            this.observer.observe(element);
        });
    }

    fallbackReveal() {
        const elements = document.querySelectorAll('.reveal-animation');
        elements.forEach(element => {
            element.classList.add('revealed');
        });
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

// ===========================
// PARTICLE SYSTEM (Hero Background)
// ===========================
class ParticleSystem {
    constructor() {
        this.container = document.getElementById('heroParticles');
        this.particles = [];
        this.isActive = false;
        
        if (this.container) {
            this.init();
        }
    }

    init() {
        // Only create particles on larger screens for performance
        if (window.innerWidth > 768 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.createParticles();
            this.animate();
            this.isActive = true;
        }
    }

    createParticles() {
        const particleCount = Math.min(50, Math.floor(window.innerWidth / 30));
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random positioning and properties
            const x = getRandomFloat(0, 100);
            const y = getRandomFloat(0, 100);
            const size = getRandomFloat(2, 6);
            const duration = getRandomFloat(10, 30);
            
            particle.style.cssText = `
                position: absolute;
                left: ${x}%;
                top: ${y}%;
                width: ${size}px;
                height: ${size}px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                animation: particleFloat ${duration}s ease-in-out infinite;
                animation-delay: -${getRandomFloat(0, duration)}s;
            `;
            
            this.container.appendChild(particle);
            this.particles.push({
                element: particle,
                x: x,
                y: y,
                vx: getRandomFloat(-0.5, 0.5),
                vy: getRandomFloat(-0.5, 0.5),
                size: size
            });
        }
    }

    animate() {
        if (!this.isActive) return;
        
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Boundary checking
            if (particle.x < 0 || particle.x > 100) particle.vx *= -1;
            if (particle.y < 0 || particle.y > 100) particle.vy *= -1;
            
            particle.element.style.left = `${particle.x}%`;
            particle.element.style.top = `${particle.y}%`;
        });
        
        requestAnimationFrame(() => this.animate());
    }

    destroy() {
        this.isActive = false;
        this.particles.forEach(particle => {
            if (particle.element.parentNode) {
                particle.element.remove();
            }
        });
        this.particles = [];
    }
}

// ===========================
// VIDEO MANAGEMENT
// ===========================
class VideoManager {
    constructor() {
        this.videoCards = document.querySelectorAll('.video-card');
        this.init();
    }

    init() {
        this.videoCards.forEach(card => {
            this.setupVideoCard(card);
        });
    }

    setupVideoCard(card) {
        const iframe = card.querySelector('iframe');
        const overlay = card.querySelector('.video-overlay');
        
        if (!iframe || !overlay) return;
        
        // Lazy loading
        this.setupLazyLoading(iframe);
        
        // Play button interaction
        overlay.addEventListener('click', () => {
            this.playVideo(iframe);
        });
        
        // Hover effects
        card.addEventListener('mouseenter', () => {
            this.pauseAllVideos();
        });
    }

    setupLazyLoading(iframe) {
        const src = iframe.getAttribute('src');
        if (src && !src.includes('autoplay=1')) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Preload video thumbnail
                        const preconnect = document.createElement('link');
                        preconnect.rel = 'preconnect';
                        preconnect.href = 'https://www.youtube.com';
                        document.head.appendChild(preconnect);
                        
                        observer.unobserve(iframe);
                    }
                });
            });
            observer.observe(iframe);
        }
    }

    playVideo(iframe) {
        const src = iframe.getAttribute('src');
        if (src && !src.includes('autoplay=1')) {
            iframe.setAttribute('src', src + '&autoplay=1');
        }
    }

    pauseAllVideos() {
        this.videoCards.forEach(card => {
            const iframe = card.querySelector('iframe');
            if (iframe) {
                const src = iframe.getAttribute('src');
                if (src && src.includes('autoplay=1')) {
                    iframe.setAttribute('src', src.replace('&autoplay=1', ''));
                }
            }
        });
    }
}

// ===========================
// PERFORMANCE OPTIMIZATION
// ===========================
class PerformanceOptimizer {
    constructor() {
        this.init();
    }

    init() {
        this.setupImageLazyLoading();
        this.optimizeAnimations();
        this.preloadCriticalResources();
    }

    setupImageLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        imageObserver.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    optimizeAnimations() {
        // Disable animations on low-end devices
        const isLowEndDevice = navigator.hardwareConcurrency < 4 || 
                              navigator.connection?.effectiveType === 'slow-2g' ||
                              navigator.connection?.effectiveType === '2g';
        
        if (isLowEndDevice) {
            document.documentElement.style.setProperty('--transition-smooth', 'none');
            document.documentElement.style.setProperty('--transition-bounce', 'none');
        }
    }

    preloadCriticalResources() {
        // Preload critical fonts
        const fontUrls = [
            'https://fonts.googleapis.com/css2?family=Inter:wght@300..900&display=swap',
            'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap'
        ];

        fontUrls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'style';
            link.href = url;
            document.head.appendChild(link);
        });
    }
}

// ===========================
// FORM HANDLING & INTERACTIONS
// ===========================
class InteractionManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupCategoryCards();
        this.setupTeacherCards();
        this.setupHoverEffects();
        this.setupAccessibility();
    }

    setupCategoryCards() {
        const categoryCards = document.querySelectorAll('.category-card');
        
        categoryCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.category-link')) {
                    const link = card.querySelector('.category-link');
                    if (link) {
                        link.click();
                    }
                }
            });

            // Add ripple effect
            card.addEventListener('click', (e) => {
                this.createRipple(e, card);
            });
        });
    }

    setupTeacherCards() {
        const teacherCards = document.querySelectorAll('.teacher-card');
        
        teacherCards.forEach(card => {
            const socialLinks = card.querySelectorAll('.social-links a');
            
            socialLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Add analytics tracking here if needed
                });
            });
        });
    }

    setupHoverEffects() {
        // Enhanced hover effects for interactive elements
        const interactiveElements = document.querySelectorAll('button, .btn, .cta-button, .category-link');
        
        interactiveElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                element.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            });
            
            element.addEventListener('mouseleave', () => {
                element.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            });
        });
    }

    setupAccessibility() {
        // Keyboard navigation support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

        // Focus management for modal/sidebar
        const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModals = document.querySelectorAll('.modal.active, .sidebar.active');
                openModals.forEach(modal => {
                    modal.classList.remove('active');
                });
            }
        });
    }

    createRipple(event, element) {
        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('span');
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
            z-index: 1;
        `;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
}

// ===========================
// MAIN APPLICATION
// ===========================
class EducatumApp {
    constructor() {
        this.components = {};
        this.init();
    }

    async init() {
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // Initialize core components
            this.initializeComponents();
            
            // Setup global event listeners
            this.setupGlobalListeners();
            
            // Hide loading screen
            await this.components.loadingManager.hide();
            
            console.log('Educatum Academy app initialized successfully');
            
        } catch (error) {
            console.error('Error initializing Educatum Academy app:', error);
            this.handleInitError();
        }
    }

    initializeComponents() {
        // Initialize in order of dependency
        this.components.loadingManager = new LoadingManager();
        this.components.themeManager = new ThemeManager();
        this.components.performanceOptimizer = new PerformanceOptimizer();
        this.components.navigationManager = new NavigationManager();
        this.components.scrollAnimationManager = new ScrollAnimationManager();
        this.components.customCursor = new CustomCursor();
        this.components.particleSystem = new ParticleSystem();
        this.components.videoManager = new VideoManager();
        this.components.interactionManager = new InteractionManager();
        
        // Store reference for global access
        window.scrollAnimationManager = this.components.scrollAnimationManager;
    }

    setupGlobalListeners() {
        // Resize handler
        const handleResize = debounce(() => {
            // Recalculate layouts if needed
            if (this.components.particleSystem) {
                this.components.particleSystem.destroy();
                this.components.particleSystem = new ParticleSystem();
            }
        }, PERFORMANCE_CONFIG.debounceDelay);

        window.addEventListener('resize', handleResize, { passive: true });

        // Orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(handleResize, 100);
        });

        // Page visibility API
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Pause animations when page is hidden
                this.pauseAnimations();
            } else {
                // Resume animations when page is visible
                this.resumeAnimations();
            }
        });

        // Unload cleanup
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    pauseAnimations() {
        if (this.components.particleSystem) {
            this.components.particleSystem.isActive = false;
        }
    }

    resumeAnimations() {
        if (this.components.particleSystem) {
            this.components.particleSystem.isActive = true;
            this.components.particleSystem.animate();
        }
    }

    handleInitError() {
        // Hide loading screen even on error
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        // Show basic functionality
        document.body.style.overflow = 'auto';
        
        // Initialize minimal functionality
        this.initMinimalFunctionality();
    }

    initMinimalFunctionality() {
        // Basic mobile menu
        const menuButton = document.getElementById('menuButton');
        const sidebar = document.getElementById('sidebar');
        const sidebarClose = document.getElementById('sidebarClose');
        
        if (menuButton && sidebar) {
            menuButton.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }
        
        if (sidebarClose) {
            sidebarClose.addEventListener('click', () => {
                sidebar.classList.remove('active');
            });
        }
        
        // Basic theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', newTheme);
            });
        }
    }

    cleanup() {
        // Cleanup components
        Object.values(this.components).forEach(component => {
            if (component.destroy && typeof component.destroy === 'function') {
                component.destroy();
            }
        });
    }
}

// ===========================
// CSS ANIMATIONS (Injected)
// ===========================
const injectAnimationStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .keyboard-navigation *:focus {
            outline: 2px solid var(--gold-accent) !important;
            outline-offset: 2px;
        }
        
        .particle {
            pointer-events: none;
        }
        
        @keyframes particleFloat {
            0%, 100% { 
                transform: translateY(0px) translateX(0px); 
                opacity: 0.1;
            }
            25% { 
                transform: translateY(-20px) translateX(10px); 
                opacity: 0.3;
            }
            50% { 
                transform: translateY(-10px) translateX(-5px); 
                opacity: 0.2;
            }
            75% { 
                transform: translateY(-30px) translateX(15px); 
                opacity: 0.4;
            }
        }
    `;
    document.head.appendChild(style);
};

// ===========================
// APPLICATION STARTUP
// ===========================
// Inject animation styles
injectAnimationStyles();

// Initialize the application
const educatumApp = new EducatumApp();

// Global error handling
window.addEventListener('error', (error) => {
    console.error('Global error:', error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EducatumApp };
}

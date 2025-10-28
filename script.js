/**
 * Education - Interactive JavaScript
 * Version: 2.0
 * Standards: ES6+, Performance Optimized, Accessibility Enhanced
 * @fileoverview Main application script for Education platform
 */

'use strict';

// ===========================
// INITIALIZATION & CONSTANTS
// ===========================

// Fixed: Updated storage keys to match new name "Education"
const STORAGE_KEYS = {
    THEME: 'education_theme',
    FIRST_VISIT: 'education_first_visit'
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

// Enhanced: Check localStorage availability
const isLocalStorageAvailable = (() => {
    try {
        const test = '__localStorage_test__';
        window.localStorage.setItem(test, test);
        window.localStorage.removeItem(test);
        return true;
    } catch(e) {
        console.warn('localStorage is not available. Theme preferences will not be saved.');
        return false;
    }
})();

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

/**
 * Throttle function execution
 * @param {Function} func - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Throttled function
 */
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

/**
 * Get random float between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random float
 */
const getRandomFloat = (min, max) => Math.random() * (max - min) + min;

/**
 * Enhanced: Safe console log with development mode check
 * @param {...any} args - Arguments to log
 */
const log = (...args) => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log(...args);
    }
};

/**
 * Enhanced: Safe console error
 * @param {...any} args - Arguments to log
 */
const logError = (...args) => {
    console.error(...args);
};

// ===========================
// LOADING SCREEN
// ===========================

/**
 * Manages the loading screen display and animations
 * @class LoadingManager
 */
class LoadingManager {
    constructor() {
        this.loadingScreen = document.getElementById('loadingScreen');
        this.minimumLoadTime = 1500; // Minimum loading time for better UX
        this.startTime = Date.now();
    }

    /**
     * Hide loading screen with smooth transition
     * @returns {Promise<void>}
     */
    async hide() {
        try {
            const elapsedTime = Date.now() - this.startTime;
            const remainingTime = Math.max(0, this.minimumLoadTime - elapsedTime);

            // Wait for minimum load time if needed
            if (remainingTime > 0) {
                await new Promise(resolve => setTimeout(resolve, remainingTime));
            }

            if (this.loadingScreen) {
                this.loadingScreen.classList.add('hidden');
                document.body.style.overflow = 'auto';

                // Remove loading screen from DOM after animation
                setTimeout(() => {
                    if (this.loadingScreen && this.loadingScreen.parentNode) {
                        this.loadingScreen.remove();
                    }
                }, 500);
            }

            isLoading = false;
            this.triggerLoadComplete();
        } catch (error) {
            logError('Error hiding loading screen:', error);
            // Ensure page is usable even if there's an error
            document.body.style.overflow = 'auto';
            isLoading = false;
        }
    }

    /**
     * Trigger animations after loading completes
     */
    triggerLoadComplete() {
        try {
            setTimeout(() => {
                this.animateHeroElements();
                if (window.scrollAnimationManager) {
                    window.scrollAnimationManager.observeElements();
                }
            }, 200);
        } catch (error) {
            logError('Error triggering load complete animations:', error);
        }
    }

    /**
     * Animate hero section elements
     */
    animateHeroElements() {
        try {
            const heroElements = document.querySelectorAll('.hero .reveal-animation');
            heroElements.forEach((element, index) => {
                setTimeout(() => {
                    element.classList.add('revealed');
                }, index * 200);
            });
        } catch (error) {
            logError('Error animating hero elements:', error);
        }
    }
}

// ===========================
// THEME MANAGEMENT
// ===========================

/**
 * Manages theme switching and persistence
 * @class ThemeManager
 */
class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.currentTheme = this.getInitialTheme();
        this.init();
    }

    /**
     * Get initial theme from storage or system preference
     * @returns {string} Theme name ('light' or 'dark')
     */
    getInitialTheme() {
        if (isLocalStorageAvailable) {
            const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
            if (savedTheme) return savedTheme;
        }

        // Enhanced: Check system preference with fallback
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        return 'light';
    }

    /**
     * Initialize theme manager
     */
    init() {
        try {
            this.applyTheme(this.currentTheme);

            if (this.themeToggle) {
                this.themeToggle.addEventListener('click', () => this.toggleTheme());
            }

            // Listen for system theme changes
            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                    if (!isLocalStorageAvailable || !localStorage.getItem(STORAGE_KEYS.THEME)) {
                        this.applyTheme(e.matches ? 'dark' : 'light');
                    }
                });
            }
        } catch (error) {
            logError('Error initializing theme manager:', error);
        }
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        try {
            const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
            this.applyTheme(newTheme);

            if (isLocalStorageAvailable) {
                localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
            }
        } catch (error) {
            logError('Error toggling theme:', error);
        }
    }

    /**
     * Apply theme to document
     * @param {string} theme - Theme name to apply
     */
    applyTheme(theme) {
        try {
            this.currentTheme = theme;
            document.documentElement.setAttribute('data-theme', theme);

            // Update theme toggle icon
            if (this.themeToggle) {
                const icon = this.themeToggle.querySelector('i');
                if (icon) {
                    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
                }
                // Enhanced: Update ARIA pressed state
                this.themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
            }

            // Animate theme transition
            document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
            setTimeout(() => {
                document.body.style.transition = '';
            }, 300);
        } catch (error) {
            logError('Error applying theme:', error);
        }
    }
}

// ===========================
// CUSTOM CURSOR
// ===========================

/**
 * Custom cursor implementation
 * @class CustomCursor
 */
class CustomCursor {
    constructor() {
        this.cursor = document.querySelector('.custom-cursor');
        this.cursorDot = document.querySelector('.custom-cursor-dot');
        this.isVisible = !window.matchMedia('(max-width: 768px)').matches;

        if (this.isVisible && this.cursor && this.cursorDot) {
            this.init();
        }
    }

    /**
     * Initialize custom cursor
     */
    init() {
        try {
            let mouseX = 0, mouseY = 0;
            let cursorX = 0, cursorY = 0;
            let dotX = 0, dotY = 0;
            let animationFrameId;

            const updateCursor = () => {
                try {
                    // Smooth cursor following with lerp
                    cursorX += (mouseX - cursorX) * 0.1;
                    cursorY += (mouseY - cursorY) * 0.1;

                    dotX += (mouseX - dotX) * 0.15;
                    dotY += (mouseY - dotY) * 0.15;

                    if (this.cursor) {
                        this.cursor.style.transform = `translate(${cursorX - 20}px, ${cursorY - 20}px)`;
                    }
                    if (this.cursorDot) {
                        this.cursorDot.style.transform = `translate(${dotX - 4}px, ${dotY - 4}px)`;
                    }

                    animationFrameId = requestAnimationFrame(updateCursor);
                } catch (error) {
                    logError('Error updating cursor:', error);
                }
            };

            document.addEventListener('mousemove', (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;
            }, { passive: true });

            // Enhanced: Cursor interactions with better error handling
            const interactiveElements = document.querySelectorAll('a, button, .category-card, .video-card, .teacher-card');

            interactiveElements.forEach(element => {
                element.addEventListener('mouseenter', () => {
                    if (this.cursor) {
                        this.cursor.style.transform += ' scale(1.5)';
                        this.cursor.style.opacity = '0.6';
                    }
                });

                element.addEventListener('mouseleave', () => {
                    if (this.cursor) {
                        this.cursor.style.transform = this.cursor.style.transform.replace(' scale(1.5)', '');
                        this.cursor.style.opacity = '0.8';
                    }
                });
            });

            updateCursor();

            // Store animation ID for cleanup
            this.animationFrameId = animationFrameId;
        } catch (error) {
            logError('Error initializing custom cursor:', error);
        }
    }

    /**
     * Destroy custom cursor
     */
    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }
}

// ===========================
// NAVIGATION MANAGEMENT
// ===========================

/**
 * Handles navigation interactions and scroll effects
 * @class NavigationManager
 */
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

    /**
     * Initialize navigation
     */
    init() {
        try {
            this.setupMobileMenu();
            this.setupSmoothScrolling();
            this.setupScrollEffects();
            this.setupScrollIndicator();
        } catch (error) {
            logError('Error initializing navigation:', error);
        }
    }

    /**
     * Setup mobile menu interactions
     */
    setupMobileMenu() {
        try {
            if (this.menuButton) {
                this.menuButton.addEventListener('click', () => this.toggleMenu());
            }

            if (this.sidebarClose) {
                this.sidebarClose.addEventListener('click', () => this.closeMenu());
            }

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (isMenuOpen && this.sidebar && this.menuButton &&
                    !this.sidebar.contains(e.target) && !this.menuButton.contains(e.target)) {
                    this.closeMenu();
                }
            });

            // Close menu on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && isMenuOpen) {
                    this.closeMenu();
                }
            });
        } catch (error) {
            logError('Error setting up mobile menu:', error);
        }
    }

    /**
     * Toggle menu state
     */
    toggleMenu() {
        if (isMenuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    /**
     * Open mobile menu
     */
    openMenu() {
        try {
            isMenuOpen = true;

            if (this.sidebar) {
                this.sidebar.classList.add('active');
                this.sidebar.setAttribute('aria-modal', 'true');
            }

            document.body.style.overflow = 'hidden';

            // Animate menu button
            if (this.menuButton) {
                this.menuButton.style.transform = 'rotate(90deg)';
                this.menuButton.setAttribute('aria-expanded', 'true');
            }
        } catch (error) {
            logError('Error opening menu:', error);
        }
    }

    /**
     * Close mobile menu
     */
    closeMenu() {
        try {
            isMenuOpen = false;

            if (this.sidebar) {
                this.sidebar.classList.remove('active');
                this.sidebar.setAttribute('aria-modal', 'false');
            }

            document.body.style.overflow = 'auto';

            // Reset menu button
            if (this.menuButton) {
                this.menuButton.style.transform = 'rotate(0deg)';
                this.menuButton.setAttribute('aria-expanded', 'false');
            }
        } catch (error) {
            logError('Error closing menu:', error);
        }
    }

    /**
     * Setup smooth scrolling for navigation links
     */
    setupSmoothScrolling() {
        try {
            this.navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    const href = link.getAttribute('href');

                    if (href && href.startsWith('#')) {
                        e.preventDefault();
                        const target = document.querySelector(href);

                        if (target) {
                            const navHeight = this.nav ? this.nav.offsetHeight : 70;
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
        } catch (error) {
            logError('Error setting up smooth scrolling:', error);
        }
    }

    /**
     * Setup scroll effects for navigation
     */
    setupScrollEffects() {
        try {
            const handleScroll = throttle(() => {
                try {
                    const currentScroll = window.pageYOffset;
                    const scrollingDown = currentScroll > scrollPosition;

                    if (!this.nav) return;

                    // Update nav background based on scroll position
                    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

                    if (currentScroll > 100) {
                        this.nav.style.background = isDark
                            ? 'rgba(10, 11, 30, 0.98)'
                            : 'rgba(255, 255, 255, 0.98)';
                        this.nav.style.boxShadow = '0 5px 25px rgba(0, 0, 0, 0.1)';
                    } else {
                        this.nav.style.background = isDark
                            ? 'rgba(10, 11, 30, 0.85)'
                            : 'rgba(255, 255, 255, 0.85)';
                        this.nav.style.boxShadow = 'none';
                    }

                    scrollPosition = currentScroll;
                } catch (error) {
                    logError('Error handling scroll:', error);
                }
            }, PERFORMANCE_CONFIG.throttleDelay);

            window.addEventListener('scroll', handleScroll, { passive: true });
        } catch (error) {
            logError('Error setting up scroll effects:', error);
        }
    }

    /**
     * Setup scroll indicator
     */
    setupScrollIndicator() {
        try {
            if (this.scrollIndicator) {
                this.scrollIndicator.addEventListener('click', () => {
                    const coursesSection = document.getElementById('courses');
                    if (coursesSection) {
                        coursesSection.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            }
        } catch (error) {
            logError('Error setting up scroll indicator:', error);
        }
    }
}

// ===========================
// SCROLL ANIMATIONS
// ===========================

/**
 * Manages scroll-triggered animations using Intersection Observer
 * @class ScrollAnimationManager
 */
class ScrollAnimationManager {
    constructor() {
        this.observer = null;
        this.elements = [];
        this.init();
    }

    /**
     * Initialize scroll animation observer
     */
    init() {
        try {
            this.createObserver();
        } catch (error) {
            logError('Error initializing scroll animations:', error);
            this.fallbackReveal();
        }
    }

    /**
     * Create Intersection Observer
     */
    createObserver() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    try {
                        if (entry.isIntersecting) {
                            const element = entry.target;
                            const delay = element.dataset.delay || 0;

                            setTimeout(() => {
                                element.classList.add('revealed');
                                if (this.observer) {
                                    this.observer.unobserve(element);
                                }
                            }, delay);
                        }
                    } catch (error) {
                        logError('Error observing element:', error);
                    }
                });
            }, ANIMATION_CONFIG);
        } else {
            // Fallback for browsers without IntersectionObserver
            this.fallbackReveal();
        }
    }

    /**
     * Observe elements for animation
     */
    observeElements() {
        try {
            if (!this.observer) return;

            const elements = document.querySelectorAll('.reveal-animation:not(.revealed)');
            elements.forEach((element, index) => {
                // Add staggered animation delay
                element.dataset.delay = index * 100;
                this.observer.observe(element);
            });
        } catch (error) {
            logError('Error observing elements:', error);
        }
    }

    /**
     * Fallback method for browsers without Intersection Observer
     */
    fallbackReveal() {
        try {
            const elements = document.querySelectorAll('.reveal-animation');
            elements.forEach(element => {
                element.classList.add('revealed');
            });
        } catch (error) {
            logError('Error in fallback reveal:', error);
        }
    }

    /**
     * Destroy observer
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

// ===========================
// PARTICLE SYSTEM (Hero Background)
// ===========================

/**
 * Animated particle system for hero section
 * @class ParticleSystem
 */
class ParticleSystem {
    constructor() {
        this.container = document.getElementById('heroParticles');
        this.particles = [];
        this.isActive = false;
        this.animationFrameId = null;

        if (this.container) {
            this.init();
        }
    }

    /**
     * Initialize particle system
     */
    init() {
        try {
            // Only create particles on larger screens for performance
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            if (window.innerWidth > 768 && !prefersReducedMotion) {
                this.createParticles();
                this.animate();
                this.isActive = true;
            }
        } catch (error) {
            logError('Error initializing particle system:', error);
        }
    }

    /**
     * Create particle elements
     */
    createParticles() {
        try {
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
                    pointer-events: none;
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
        } catch (error) {
            logError('Error creating particles:', error);
        }
    }

    /**
     * Animate particles
     */
    animate() {
        if (!this.isActive) return;

        try {
            this.particles.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;

                // Boundary checking
                if (particle.x < 0 || particle.x > 100) particle.vx *= -1;
                if (particle.y < 0 || particle.y > 100) particle.vy *= -1;

                particle.element.style.left = `${particle.x}%`;
                particle.element.style.top = `${particle.y}%`;
            });

            this.animationFrameId = requestAnimationFrame(() => this.animate());
        } catch (error) {
            logError('Error animating particles:', error);
        }
    }

    /**
     * Destroy particle system
     */
    destroy() {
        try {
            this.isActive = false;

            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
            }

            this.particles.forEach(particle => {
                if (particle.element && particle.element.parentNode) {
                    particle.element.remove();
                }
            });
            this.particles = [];
        } catch (error) {
            logError('Error destroying particle system:', error);
        }
    }
}

// ===========================
// VIDEO MANAGEMENT
// ===========================

/**
 * Manages video player interactions and lazy loading
 * @class VideoManager
 */
class VideoManager {
    constructor() {
        this.videoCards = document.querySelectorAll('.video-card');
        this.init();
    }

    /**
     * Initialize video manager
     */
    init() {
        try {
            this.videoCards.forEach(card => {
                this.setupVideoCard(card);
            });
        } catch (error) {
            logError('Error initializing video manager:', error);
        }
    }

    /**
     * Setup individual video card
     * @param {HTMLElement} card - Video card element
     */
    setupVideoCard(card) {
        try {
            const iframe = card.querySelector('iframe');
            const overlay = card.querySelector('.video-overlay');

            if (!iframe || !overlay) return;

            // Lazy loading
            this.setupLazyLoading(iframe);

            // Play button interaction
            overlay.addEventListener('click', () => {
                this.playVideo(iframe);
            });

            // Pause other videos when hovering
            card.addEventListener('mouseenter', () => {
                // Optionally pause other videos
            });
        } catch (error) {
            logError('Error setting up video card:', error);
        }
    }

    /**
     * Setup lazy loading for video iframe
     * @param {HTMLIFrameElement} iframe - Video iframe element
     */
    setupLazyLoading(iframe) {
        try {
            const src = iframe.getAttribute('src');
            if (src && !src.includes('autoplay=1') && 'IntersectionObserver' in window) {
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
        } catch (error) {
            logError('Error setting up lazy loading:', error);
        }
    }

    /**
     * Play video
     * @param {HTMLIFrameElement} iframe - Video iframe element
     */
    playVideo(iframe) {
        try {
            const src = iframe.getAttribute('src');
            if (src && !src.includes('autoplay=1')) {
                iframe.setAttribute('src', src + '&autoplay=1');
            }
        } catch (error) {
            logError('Error playing video:', error);
        }
    }

    /**
     * Pause all videos
     */
    pauseAllVideos() {
        try {
            this.videoCards.forEach(card => {
                const iframe = card.querySelector('iframe');
                if (iframe) {
                    const src = iframe.getAttribute('src');
                    if (src && src.includes('autoplay=1')) {
                        iframe.setAttribute('src', src.replace('&autoplay=1', ''));
                    }
                }
            });
        } catch (error) {
            logError('Error pausing videos:', error);
        }
    }
}

// ===========================
// PERFORMANCE OPTIMIZATION
// ===========================

/**
 * Handles performance optimizations
 * @class PerformanceOptimizer
 */
class PerformanceOptimizer {
    constructor() {
        this.init();
    }

    /**
     * Initialize performance optimizations
     */
    init() {
        try {
            this.setupImageLazyLoading();
            this.optimizeAnimations();
            this.preloadCriticalResources();
        } catch (error) {
            logError('Error initializing performance optimizations:', error);
        }
    }

    /**
     * Setup lazy loading for images
     */
    setupImageLazyLoading() {
        try {
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
        } catch (error) {
            logError('Error setting up image lazy loading:', error);
        }
    }

    /**
     * Optimize animations based on device capabilities
     */
    optimizeAnimations() {
        try {
            // Disable animations on low-end devices
            const isLowEndDevice = (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) ||
                                  (navigator.connection &&
                                   (navigator.connection.effectiveType === 'slow-2g' ||
                                    navigator.connection.effectiveType === '2g'));

            if (isLowEndDevice) {
                document.documentElement.style.setProperty('--transition-smooth', 'none');
                document.documentElement.style.setProperty('--transition-bounce', 'none');
            }
        } catch (error) {
            logError('Error optimizing animations:', error);
        }
    }

    /**
     * Preload critical resources
     */
    preloadCriticalResources() {
        try {
            // Preload critical fonts
            const fontUrls = [
                'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap',
                'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap'
            ];

            fontUrls.forEach(url => {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'style';
                link.href = url;
                document.head.appendChild(link);
            });
        } catch (error) {
            logError('Error preloading resources:', error);
        }
    }
}

// ===========================
// FORM HANDLING & INTERACTIONS
// ===========================

/**
 * Handles interactive elements and user interactions
 * @class InteractionManager
 */
class InteractionManager {
    constructor() {
        this.init();
    }

    /**
     * Initialize interaction manager
     */
    init() {
        try {
            this.setupCategoryCards();
            this.setupTeacherCards();
            this.setupHoverEffects();
            this.setupAccessibility();
        } catch (error) {
            logError('Error initializing interaction manager:', error);
        }
    }

    /**
     * Setup category card interactions
     */
    setupCategoryCards() {
        try {
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
        } catch (error) {
            logError('Error setting up category cards:', error);
        }
    }

    /**
     * Setup teacher card interactions
     */
    setupTeacherCards() {
        try {
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
        } catch (error) {
            logError('Error setting up teacher cards:', error);
        }
    }

    /**
     * Setup enhanced hover effects
     */
    setupHoverEffects() {
        try {
            const interactiveElements = document.querySelectorAll('button, .btn, .cta-button, .category-link');

            interactiveElements.forEach(element => {
                element.addEventListener('mouseenter', () => {
                    element.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                });

                element.addEventListener('mouseleave', () => {
                    element.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                });
            });
        } catch (error) {
            logError('Error setting up hover effects:', error);
        }
    }

    /**
     * Setup accessibility enhancements
     */
    setupAccessibility() {
        try {
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
        } catch (error) {
            logError('Error setting up accessibility:', error);
        }
    }

    /**
     * Create ripple effect on element
     * @param {MouseEvent} event - Click event
     * @param {HTMLElement} element - Element to create ripple on
     */
    createRipple(event, element) {
        try {
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
        } catch (error) {
            logError('Error creating ripple:', error);
        }
    }
}

// ===========================
// MAIN APPLICATION
// ===========================

/**
 * Main application class
 * @class EducationApp
 */
class EducationApp {
    constructor() {
        this.components = {};
        this.init();
    }

    /**
     * Initialize application
     * @returns {Promise<void>}
     */
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
            if (this.components.loadingManager) {
                await this.components.loadingManager.hide();
            }

            log('Education app initialized successfully');

        } catch (error) {
            logError('Error initializing Education app:', error);
            this.handleInitError();
        }
    }

    /**
     * Initialize all application components
     */
    initializeComponents() {
        try {
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
        } catch (error) {
            logError('Error initializing components:', error);
        }
    }

    /**
     * Setup global event listeners
     */
    setupGlobalListeners() {
        try {
            // Resize handler
            const handleResize = debounce(() => {
                try {
                    // Recalculate layouts if needed
                    if (this.components.particleSystem) {
                        this.components.particleSystem.destroy();
                        this.components.particleSystem = new ParticleSystem();
                    }
                } catch (error) {
                    logError('Error handling resize:', error);
                }
            }, PERFORMANCE_CONFIG.debounceDelay);

            window.addEventListener('resize', handleResize, { passive: true });

            // Orientation change
            window.addEventListener('orientationchange', () => {
                setTimeout(handleResize, 100);
            });

            // Page visibility API
            document.addEventListener('visibilitychange', () => {
                try {
                    if (document.hidden) {
                        // Pause animations when page is hidden
                        this.pauseAnimations();
                    } else {
                        // Resume animations when page is visible
                        this.resumeAnimations();
                    }
                } catch (error) {
                    logError('Error handling visibility change:', error);
                }
            });

            // Unload cleanup
            window.addEventListener('beforeunload', () => {
                this.cleanup();
            });
        } catch (error) {
            logError('Error setting up global listeners:', error);
        }
    }

    /**
     * Pause animations
     */
    pauseAnimations() {
        try {
            if (this.components.particleSystem) {
                this.components.particleSystem.isActive = false;
            }
        } catch (error) {
            logError('Error pausing animations:', error);
        }
    }

    /**
     * Resume animations
     */
    resumeAnimations() {
        try {
            if (this.components.particleSystem) {
                this.components.particleSystem.isActive = true;
                this.components.particleSystem.animate();
            }
        } catch (error) {
            logError('Error resuming animations:', error);
        }
    }

    /**
     * Handle initialization error
     */
    handleInitError() {
        try {
            // Hide loading screen even on error
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }

            // Show basic functionality
            document.body.style.overflow = 'auto';

            // Initialize minimal functionality
            this.initMinimalFunctionality();
        } catch (error) {
            logError('Error handling init error:', error);
        }
    }

    /**
     * Initialize minimal functionality as fallback
     */
    initMinimalFunctionality() {
        try {
            // Basic mobile menu
            const menuButton = document.getElementById('menuButton');
            const sidebar = document.getElementById('sidebar');
            const sidebarClose = document.getElementById('sidebarClose');

            if (menuButton && sidebar) {
                menuButton.addEventListener('click', () => {
                    sidebar.classList.toggle('active');
                });
            }

            if (sidebarClose && sidebar) {
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
        } catch (error) {
            logError('Error initializing minimal functionality:', error);
        }
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        try {
            // Cleanup components
            Object.values(this.components).forEach(component => {
                if (component && typeof component.destroy === 'function') {
                    component.destroy();
                }
            });
        } catch (error) {
            logError('Error cleaning up:', error);
        }
    }
}

// ===========================
// CSS ANIMATIONS (Injected)
// ===========================

/**
 * Inject animation styles into document
 */
const injectAnimationStyles = () => {
    try {
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
    } catch (error) {
        logError('Error injecting animation styles:', error);
    }
};

// ===========================
// APPLICATION STARTUP
// ===========================

// Inject animation styles
injectAnimationStyles();

// Initialize the application
const educationApp = new EducationApp();

// Enhanced: Global error handling
window.addEventListener('error', (error) => {
    logError('Global error:', error.message, error.filename, error.lineno);
});

window.addEventListener('unhandledrejection', (event) => {
    logError('Unhandled promise rejection:', event.reason);
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EducationApp };
}

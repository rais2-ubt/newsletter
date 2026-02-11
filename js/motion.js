/**
 * Motion Module
 * Handles all animation orchestration for RAIS2 Newsletter App
 * Uses vanilla CSS animations and Web Animations API
 */

const Motion = {
    // Check for reduced motion preference
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,

    /**
     * Initialize motion system
     */
    init() {
        this.setupReducedMotionListener();
        this.setupPageTransitions();
        this.setupRevealObserver();
        this.enhanceInteractiveElements();

        console.log('[Motion] Initialized', { reducedMotion: this.prefersReducedMotion });
    },

    /**
     * Listen for reduced motion preference changes
     */
    setupReducedMotionListener() {
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            this.prefersReducedMotion = e.matches;
            console.log('[Motion] Reduced motion preference changed:', this.prefersReducedMotion);
        });
    },

    // ===== PAGE TRANSITIONS =====

    /**
     * Setup page transition system
     */
    setupPageTransitions() {
        const mainContent = document.querySelector('.main-content');
        if (mainContent && !this.prefersReducedMotion) {
            mainContent.classList.add('page-transition-wrapper');
        }

        // Intercept navigation clicks for smooth transitions
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e, link));
        });
    },

    /**
     * Handle navigation with transition
     */
    handleNavigation(event, link) {
        if (this.prefersReducedMotion) return;

        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;

        event.preventDefault();
        this.transitionToPage(href);
    },

    /**
     * Perform page transition
     */
    async transitionToPage(url) {
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) {
            window.location.href = url;
            return;
        }

        mainContent.classList.remove('page-transition-wrapper');
        mainContent.classList.add('page-transition-exit');

        await this.wait(300);
        window.location.href = url;
    },

    // ===== REVEAL ANIMATIONS =====

    /**
     * Setup Intersection Observer for reveal animations
     */
    setupRevealObserver() {
        if (this.prefersReducedMotion) {
            document.querySelectorAll('.reveal, .stagger-children').forEach(el => {
                el.classList.add('revealed');
                el.style.opacity = '1';
                el.querySelectorAll('*').forEach(child => child.style.opacity = '1');
            });
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        document.querySelectorAll('.reveal, .stagger-children').forEach(el => {
            observer.observe(el);
        });
    },

    /**
     * Reveal element with animation
     */
    reveal(element, options = {}) {
        if (this.prefersReducedMotion) {
            element.style.opacity = '1';
            return Promise.resolve();
        }

        const config = {
            duration: 400,
            delay: 0,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            transform: 'translateY(16px)',
            ...options
        };

        return element.animate([
            { opacity: 0, transform: config.transform },
            { opacity: 1, transform: 'translateY(0)' }
        ], {
            duration: config.duration,
            delay: config.delay,
            easing: config.easing,
            fill: 'forwards'
        }).finished;
    },

    /**
     * Reveal multiple elements with stagger
     */
    async revealStaggered(elements, options = {}) {
        if (this.prefersReducedMotion) {
            Array.from(elements).forEach(el => el.style.opacity = '1');
            return Promise.resolve();
        }

        const staggerDelay = options.staggerDelay || 50;
        const promises = [];

        Array.from(elements).forEach((el, index) => {
            promises.push(this.reveal(el, {
                ...options,
                delay: (options.delay || 0) + (index * staggerDelay)
            }));
        });

        return Promise.all(promises);
    },

    /**
     * Trigger reveal on container children
     */
    triggerReveal(container) {
        if (!container) return;
        container.classList.add('revealed');
    },

    // ===== MICRO-INTERACTIONS =====

    /**
     * Enhance interactive elements
     */
    enhanceInteractiveElements() {
        // Buttons
        document.querySelectorAll('.btn').forEach(btn => {
            btn.classList.add('btn-ripple');
            btn.addEventListener('mousedown', () => this.buttonPress(btn));
        });

        // Cards
        document.querySelectorAll('.card, .stat-card, .item-card, .mail-card').forEach(card => {
            card.classList.add('hover-lift');
        });

        // Form inputs
        document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(input => {
            input.classList.add('input-animated');
        });
    },

    /**
     * Button press animation
     */
    buttonPress(button) {
        if (this.prefersReducedMotion) return;

        button.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(0.97)' },
            { transform: 'scale(1)' }
        ], {
            duration: 150,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
        });
    },

    // ===== ITEM SELECTION (Builder) =====

    /**
     * Animate item selection
     */
    animateItemSelect(element, selected) {
        if (this.prefersReducedMotion) {
            element.classList.toggle('selected', selected);
            return Promise.resolve();
        }

        // Pop animation
        const animation = element.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(0.97)' },
            { transform: 'scale(1.01)' },
            { transform: 'scale(1)' }
        ], {
            duration: 250,
            easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        });

        element.classList.toggle('selected', selected);
        return animation.finished;
    },

    /**
     * Animate checkbox check
     */
    animateCheckbox(checkbox, checked) {
        if (this.prefersReducedMotion) return;

        const wrapper = checkbox.closest('.checkbox-animated');
        if (!wrapper) return;

        const checkmark = wrapper.querySelector('.checkmark-icon');
        if (checkmark && checked) {
            checkmark.animate([
                { strokeDashoffset: 24 },
                { strokeDashoffset: 0 }
            ], {
                duration: 200,
                fill: 'forwards',
                easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
            });
        }
    },

    // ===== PREVIEW UPDATE =====

    /**
     * Animate preview update
     */
    async animatePreviewUpdate(previewElement, updateCallback) {
        if (this.prefersReducedMotion) {
            if (updateCallback) updateCallback();
            return Promise.resolve();
        }

        // Fade out
        previewElement.classList.add('preview-updating');
        await this.wait(150);

        // Update content
        if (updateCallback) updateCallback();

        // Fade in
        previewElement.classList.remove('preview-updating');
        previewElement.classList.add('preview-updated');

        await this.wait(300);
        previewElement.classList.remove('preview-updated');
    },

    // ===== SEND ANIMATION =====

    /**
     * Play envelope send animation
     */
    async playSendAnimation(container) {
        if (this.prefersReducedMotion) {
            return this.showSuccessImmediate(container);
        }

        // Create envelope SVG
        const envelope = this.createEnvelopeSVG();
        envelope.classList.add('envelope-icon');
        container.innerHTML = '';
        container.appendChild(envelope);

        // Phase 1: Lift up
        await envelope.animate([
            { transform: 'translateY(0) scale(1)', opacity: 1 },
            { transform: 'translateY(-20px) scale(1.05)', opacity: 1 }
        ], {
            duration: 300,
            fill: 'forwards',
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
        }).finished;

        // Phase 2: Fly away
        await envelope.animate([
            { transform: 'translateY(-20px) translateX(0) rotate(0deg) scale(1.05)', opacity: 1 },
            { transform: 'translateY(-80px) translateX(150px) rotate(20deg) scale(0.6)', opacity: 0 }
        ], {
            duration: 500,
            fill: 'forwards',
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
        }).finished;

        // Phase 3: Show success
        await this.showSuccess(container);
    },

    /**
     * Create envelope SVG element
     */
    createEnvelopeSVG() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '64');
        svg.setAttribute('height', '64');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.innerHTML = `
            <path d="M22 2L11 13"></path>
            <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
        `;
        svg.style.display = 'block';
        svg.style.color = 'var(--ubt-green)';
        return svg;
    },

    /**
     * Show success animation
     */
    async showSuccess(container) {
        const success = document.createElement('div');
        success.className = 'success-content';
        success.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <p>Sent!</p>
        `;

        container.innerHTML = '';
        container.appendChild(success);

        // Burst animation
        await success.querySelector('svg').animate([
            { transform: 'scale(0)', opacity: 0 },
            { transform: 'scale(1.2)', opacity: 1 },
            { transform: 'scale(1)', opacity: 1 }
        ], {
            duration: 400,
            easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            fill: 'forwards'
        }).finished;
    },

    /**
     * Show success immediately (reduced motion)
     */
    showSuccessImmediate(container) {
        container.innerHTML = `
            <div class="success-content">
                <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="var(--ubt-green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <p>Sent!</p>
            </div>
        `;
        return Promise.resolve();
    },

    // ===== LOADING STATES =====

    /**
     * Show skeleton loading
     */
    showSkeleton(container, count = 3) {
        const skeletons = Array(count).fill(0).map(() => `
            <div class="skeleton skeleton-card">
                <div class="skeleton-text" style="width: 40%; height: 12px;"></div>
                <div class="skeleton-text" style="width: 90%; height: 18px; margin-top: 12px;"></div>
                <div class="skeleton-text" style="width: 70%; height: 14px; margin-top: 8px;"></div>
            </div>
        `).join('');

        container.innerHTML = skeletons;
    },

    /**
     * Show dot loader
     */
    showDotLoader(container, message = 'Loading...') {
        container.innerHTML = `
            <div class="loading" style="display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 48px;">
                <div class="loader-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <p style="color: var(--ubt-medium-gray); font-size: 14px;">${message}</p>
            </div>
        `;
    },

    /**
     * Show pulse loader
     */
    showPulseLoader(container, message = 'Loading...') {
        container.innerHTML = `
            <div class="loading" style="display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 48px;">
                <div class="loader-pulse">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                    </svg>
                </div>
                <p style="color: var(--ubt-medium-gray); font-size: 14px;">${message}</p>
            </div>
        `;
    },

    /**
     * Show progress loader with circular progress ring
     */
    showProgressLoader(container, options = {}) {
        const { message = 'Loading...', percent = 0 } = options;
        const circumference = 2 * Math.PI * 36; // radius = 36
        const offset = circumference - (percent / 100) * circumference;

        container.innerHTML = `
            <div class="loading progress-loading" style="display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 48px; width: 100%;">
                <div class="progress-ring-container" style="position: relative; width: 100px; height: 100px;">
                    <svg width="100" height="100" viewBox="0 0 100 100" style="transform: rotate(-90deg);">
                        <circle cx="50" cy="50" r="36" fill="none" stroke="var(--ubt-light-gray)" stroke-width="8"/>
                        <circle class="progress-ring" cx="50" cy="50" r="36" fill="none" stroke="var(--ubt-green)" stroke-width="8"
                            stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                            style="transition: stroke-dashoffset 0.4s ease;"/>
                    </svg>
                    <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;">
                        <span class="progress-percent" style="font-size: 20px; font-weight: 600; color: var(--ubt-green);">${percent}%</span>
                    </div>
                </div>
                <div class="progress-status" style="text-align: center;">
                    <div class="progress-message" style="color: var(--ubt-dark-gray); font-size: 16px; font-weight: 500; margin-bottom: 4px;">${message}</div>
                    <div class="progress-substatus" style="color: var(--ubt-medium-gray); font-size: 13px;">Please wait...</div>
                </div>
                <div class="progress-bar-container" style="width: 100%; max-width: 200px; height: 4px; background: var(--ubt-light-gray); border-radius: 2px; overflow: hidden;">
                    <div class="progress-bar-fill" style="width: ${percent}%; height: 100%; background: linear-gradient(90deg, var(--ubt-green), var(--ubt-green-light)); border-radius: 2px; transition: width 0.4s ease;"></div>
                </div>
            </div>
        `;
    },

    /**
     * Update progress loader values
     */
    updateProgress(container, options = {}) {
        const { message, percent } = options;
        const messageEl = container.querySelector('.progress-message');
        const barEl = container.querySelector('.progress-bar-fill');
        const percentEl = container.querySelector('.progress-percent');
        const ringEl = container.querySelector('.progress-ring');
        const substatusEl = container.querySelector('.progress-substatus');

        if (messageEl && message !== undefined) messageEl.textContent = message;
        if (barEl && percent !== undefined) barEl.style.width = `${percent}%`;
        if (percentEl && percent !== undefined) percentEl.textContent = `${percent}%`;

        if (ringEl && percent !== undefined) {
            const circumference = 2 * Math.PI * 36;
            const offset = circumference - (percent / 100) * circumference;
            ringEl.style.strokeDashoffset = offset;
        }

        if (substatusEl) {
            if (percent >= 100) {
                substatusEl.textContent = 'Complete!';
            } else if (percent >= 66) {
                substatusEl.textContent = 'Almost there...';
            } else if (percent >= 33) {
                substatusEl.textContent = 'Making progress...';
            } else {
                substatusEl.textContent = 'Please wait...';
            }
        }
    },

    // ===== MODAL ANIMATIONS =====

    /**
     * Open modal with animation
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (!this.prefersReducedMotion) {
            const content = modal.querySelector('.modal');
            if (content) {
                content.animate([
                    { opacity: 0, transform: 'scale(0.95) translateY(10px)' },
                    { opacity: 1, transform: 'scale(1) translateY(0)' }
                ], {
                    duration: 250,
                    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                    fill: 'forwards'
                });
            }
        }
    },

    /**
     * Close modal with animation
     */
    async closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        if (!this.prefersReducedMotion) {
            const content = modal.querySelector('.modal');
            if (content) {
                await content.animate([
                    { opacity: 1, transform: 'scale(1) translateY(0)' },
                    { opacity: 0, transform: 'scale(0.95) translateY(10px)' }
                ], {
                    duration: 200,
                    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                    fill: 'forwards'
                }).finished;
            }
        }

        modal.classList.remove('active');
        document.body.style.overflow = '';
    },

    /**
     * Close all modals
     */
    async closeAllModals() {
        const modals = document.querySelectorAll('.modal-overlay.active');
        for (const modal of modals) {
            await this.closeModal(modal.id);
        }
    },

    // ===== TOAST ANIMATIONS =====

    /**
     * Show toast with animation
     */
    showToast(message, type = 'info', duration = 3000) {
        const container = document.querySelector('.toast-container') || this.createToastContainer();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icon = this.getToastIcon(type);
        toast.innerHTML = `${icon}<span>${message}</span>`;

        container.appendChild(toast);

        if (!this.prefersReducedMotion) {
            toast.animate([
                { transform: 'translateX(100%)', opacity: 0 },
                { transform: 'translateX(0)', opacity: 1 }
            ], {
                duration: 250,
                easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                fill: 'forwards'
            });
        }

        setTimeout(() => this.dismissToast(toast), duration);
        return toast;
    },

    /**
     * Get toast icon based on type
     */
    getToastIcon(type) {
        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };
        return icons[type] || icons.info;
    },

    /**
     * Dismiss toast with animation
     */
    async dismissToast(toast) {
        if (!this.prefersReducedMotion) {
            toast.classList.add('exiting');
            await toast.animate([
                { transform: 'translateX(0)', opacity: 1 },
                { transform: 'translateX(100%)', opacity: 0 }
            ], {
                duration: 200,
                easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                fill: 'forwards'
            }).finished;
        }

        toast.remove();
    },

    /**
     * Create toast container if not exists
     */
    createToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    },

    // ===== COUNTER ANIMATION =====

    /**
     * Animate counter value
     */
    animateCounter(element, targetValue, duration = 1000) {
        if (this.prefersReducedMotion) {
            element.textContent = targetValue;
            return Promise.resolve();
        }

        const startValue = parseInt(element.textContent) || 0;
        const startTime = performance.now();

        return new Promise(resolve => {
            const updateCounter = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease out quart
                const eased = 1 - Math.pow(1 - progress, 4);
                const currentValue = Math.round(startValue + (targetValue - startValue) * eased);

                element.textContent = currentValue;

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    element.textContent = targetValue;
                    resolve();
                }
            };

            requestAnimationFrame(updateCounter);
        });
    },

    /**
     * Animate multiple counters
     */
    async animateCounters(counterConfigs) {
        const promises = counterConfigs.map(({ element, value, duration }) =>
            this.animateCounter(element, value, duration)
        );
        return Promise.all(promises);
    },

    // ===== ERROR/VALIDATION ANIMATIONS =====

    /**
     * Shake element for error
     */
    shakeError(element) {
        if (this.prefersReducedMotion) return Promise.resolve();

        element.classList.add('shake-error');
        return new Promise(resolve => {
            setTimeout(() => {
                element.classList.remove('shake-error');
                resolve();
            }, 400);
        });
    },

    /**
     * Flash success
     */
    flashSuccess(element) {
        if (this.prefersReducedMotion) return Promise.resolve();

        element.classList.add('flash-success');
        return new Promise(resolve => {
            setTimeout(() => {
                element.classList.remove('flash-success');
                resolve();
            }, 300);
        });
    },

    // ===== CARD ANIMATIONS =====

    /**
     * Animate card enter
     */
    animateCardEnter(card, delay = 0) {
        if (this.prefersReducedMotion) {
            card.style.opacity = '1';
            return Promise.resolve();
        }

        return card.animate([
            { opacity: 0, transform: 'translateY(16px)' },
            { opacity: 1, transform: 'translateY(0)' }
        ], {
            duration: 400,
            delay: delay,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            fill: 'forwards'
        }).finished;
    },

    /**
     * Animate card exit
     */
    animateCardExit(card) {
        if (this.prefersReducedMotion) {
            card.style.opacity = '0';
            return Promise.resolve();
        }

        return card.animate([
            { opacity: 1, transform: 'translateY(0)' },
            { opacity: 0, transform: 'translateY(-16px)' }
        ], {
            duration: 200,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            fill: 'forwards'
        }).finished;
    },

    // ===== UTILITIES =====

    /**
     * Wait for specified duration
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Run animation only if motion is enabled
     */
    ifMotionEnabled(callback) {
        if (!this.prefersReducedMotion) {
            return callback();
        }
        return Promise.resolve();
    },

    /**
     * Add animation classes to element
     */
    addAnimationClass(element, className, duration) {
        element.classList.add(className);
        if (duration) {
            setTimeout(() => element.classList.remove(className), duration);
        }
    }
};

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Motion.init());
} else {
    Motion.init();
}

// Export for use in other modules
window.Motion = Motion;

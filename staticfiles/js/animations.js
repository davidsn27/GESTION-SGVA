// Animation and Micro-interactions Manager
class AnimationManager {
    constructor() {
        this.observers = new Map();
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.setupScrollAnimations();
        this.setupHoverEffects();
        this.setupLoadingAnimations();
        this.setupNotificationAnimations();
    }

    // Intersection Observer para animaciones al hacer scroll
    setupIntersectionObserver() {
        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        this.observers.set('fade-in', new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    this.observers.get('fade-in').unobserve(entry.target);
                }
            });
        }, options));

        this.observers.set('slide-in-left', new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('slide-in-left');
                    this.observers.get('slide-in-left').unobserve(entry.target);
                }
            });
        }, options));

        this.observers.set('slide-in-right', new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('slide-in-right');
                    this.observers.get('slide-in-right').unobserve(entry.target);
                }
            });
        }, options));

        this.observers.set('scale-in', new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('scale-in');
                    this.observers.get('scale-in').unobserve(entry.target);
                }
            });
        }, options));
    }

    // Observar elementos para animaciones
    observeElements() {
        // Cards
        document.querySelectorAll('.card').forEach((card, index) => {
            const animationClass = index % 2 === 0 ? 'slide-in-left' : 'slide-in-right';
            this.observers.get(animationClass)?.observe(card);
        });

        // Dashboard cards
        document.querySelectorAll('.dashboard-card').forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('scale-in');
            }, index * 100);
        });

        // Tablas
        document.querySelectorAll('.table').forEach(table => {
            this.observers.get('fade-in')?.observe(table);
        });

        // Formularios
        document.querySelectorAll('.form-control, .form-select').forEach(input => {
            this.observers.get('slide-in-left')?.observe(input);
        });
    }

    // Animaciones al hacer scroll
    setupScrollAnimations() {
        let ticking = false;
        
        const updateAnimations = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Parallax effect para dashboard cards
            document.querySelectorAll('.dashboard-card').forEach((card, index) => {
                const speed = 0.5 + (index * 0.1);
                const yPos = -(scrollTop * speed);
                card.style.transform = `translateY(${yPos}px)`;
            });

            // Navbar background on scroll
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                if (scrollTop > 50) {
                    navbar.classList.add('navbar-scrolled');
                } else {
                    navbar.classList.remove('navbar-scrolled');
                }
            }

            ticking = false;
        };

        const requestTick = () => {
            if (!ticking) {
                requestAnimationFrame(updateAnimations);
                ticking = true;
            }
        };

        window.addEventListener('scroll', requestTick);
    }

    // Efectos hover mejorados
    setupHoverEffects() {
        // Efecto ripple para botones
        document.querySelectorAll('.btn').forEach(button => {
            button.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ripple');
                
                this.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });

        // Efecto tilt para cards
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 10;
                const rotateY = (centerX - x) / 10;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
            });
        });
    }

    // Animaciones de carga
    setupLoadingAnimations() {
        // Skeleton loading
        window.showSkeletonLoader = (container) => {
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton-loader';
            skeleton.innerHTML = `
                <div class="skeleton-item"></div>
                <div class="skeleton-item"></div>
                <div class="skeleton-item"></div>
            `;
            
            if (typeof container === 'string') {
                container = document.querySelector(container);
            }
            
            if (container) {
                container.appendChild(skeleton);
            }
            
            return skeleton;
        };

        window.hideSkeletonLoader = (skeleton) => {
            if (skeleton && skeleton.parentNode) {
                skeleton.remove();
            }
        };

        // Progress animation
        window.animateProgress = (progressBar, targetPercent, duration = 1000) => {
            const start = 0;
            const startTime = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const currentPercent = start + (targetPercent - start) * this.easeOutQuad(progress);
                progressBar.style.width = currentPercent + '%';
                progressBar.textContent = Math.round(currentPercent) + '%';
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            
            requestAnimationFrame(animate);
        };
    }

    // Animaciones de notificaciones
    setupNotificationAnimations() {
        // Slide-in notifications
        window.showAnimatedNotification = (message, type = 'info', duration = 5000) => {
            const notification = document.createElement('div');
            notification.className = `alert alert-${type} alert-dismissible fade show notification-slide-in`;
            notification.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            const container = document.querySelector('.container');
            if (container) {
                container.insertBefore(notification, container.firstChild);
                
                // Auto remover con animación
                setTimeout(() => {
                    notification.classList.add('notification-slide-out');
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.remove();
                        }
                    }, 300);
                }, duration);
            }
            
            return notification;
        };
    }

    // Easing functions
    easeOutQuad(t) {
        return t * (2 - t);
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // Animación de números
    animateNumber(element, target, duration = 1000) {
        const start = 0;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.round(start + (target - start) * this.easeOutQuad(progress));
            element.textContent = current.toLocaleString('es-CO');
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    // Animación de typing effect
    typeWriter(element, text, speed = 50) {
        let i = 0;
        element.textContent = '';
        
        const type = () => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        };
        
        type();
    }

    // Inicializar animaciones cuando el DOM esté listo
    static init() {
        const animationManager = new AnimationManager();
        
        // Esperar a que todo esté cargado
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                animationManager.observeElements();
            });
        } else {
            animationManager.observeElements();
        }
        
        // Exportar funciones globales
        window.animationManager = animationManager;
        
        return animationManager;
    }
}

// CSS para skeleton loader y animaciones de notificaciones
const skeletonCSS = `
.skeleton-loader {
    padding: 1rem;
}

.skeleton-item {
    height: 20px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 4px;
    margin-bottom: 10px;
}

.skeleton-item:last-child {
    margin-bottom: 0;
}

@keyframes loading {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}

.notification-slide-in {
    animation: slideInRight 0.3s ease-out;
}

.notification-slide-out {
    animation: slideOutRight 0.3s ease-out;
}

@keyframes slideOutRight {
    to {
        opacity: 0;
        transform: translateX(100%);
    }
}

.ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: ripple-animation 0.6s ease-out;
    pointer-events: none;
}

@keyframes ripple-animation {
    to {
        transform: scale(4);
        opacity: 0;
    }
}

.navbar-scrolled {
    background-color: var(--navbar-bg) !important;
    box-shadow: 0 2px 10px var(--shadow-color);
}
`;

// Inyectar CSS adicional
const styleSheet = document.createElement('style');
styleSheet.textContent = skeletonCSS;
document.head.appendChild(styleSheet);

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    AnimationManager.init();
});

// Exportar para uso global
window.AnimationManager = AnimationManager;

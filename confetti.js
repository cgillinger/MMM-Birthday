/**
 * @file confetti.js
 * @description Local implementation of confetti effect for MMM-Birthday module
 * @version 1.2.3
 * @license MIT
 */

const Confetti = (function() {
    // Enhanced color palette for more vibrant effect
    const defaultColors = ['#ff718d', '#fdff6a', '#58cffb', '#ffffff', '#7b52ff'];

    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '999999';

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    class Particle {
        constructor(context, options) {
            this.context = context;
            
            // Position setup with offset for cannon placement
            const cannonOffset = options.isLeftCannon ? width * 0.15 : width * 0.85;
            this.x = cannonOffset;
            this.y = height - 20; // Slightly above bottom
            
            // Calculate angle based on cannon position and spread
            const baseAngle = options.isLeftCannon ? -45 : -135; // Base angle in degrees
            const angleVariation = (Math.random() - 0.5) * 20; // Random ±10 degrees
            const spreadAngle = (Math.random() - 0.5) * options.spread;
            this.angle = ((baseAngle + angleVariation + spreadAngle) * Math.PI) / 180;
            
            // Enhanced physics properties - Modified for maximum height
            this.velocity = options.velocity * (0.95 + Math.random() * 0.25); // More consistent high velocity
            this.gravity = 0.25; // Further reduced gravity for maximum height
            this.drag = 0.045; // Reduced drag for even longer travel
            this.wobble = Math.random() * 360;
            this.wobbleSpeed = Math.random() * 2 - 1;
            
            // Visual properties
            this.color = options.colors[Math.floor(Math.random() * options.colors.length)];
            this.size = Math.random() * 6 + 4;
            this.opacity = 1;
            
            // Calculate initial velocity components with stronger upward boost
            this.vx = Math.cos(this.angle) * this.velocity;
            this.vy = Math.sin(this.angle) * this.velocity * 1.4; // Increased upward boost
        }

        update() {
            // Apply physics
            this.x += this.vx;
            this.y += this.vy;
            
            // Apply gravity with smooth deceleration
            this.vy += this.gravity;
            
            // Apply air resistance
            this.vx *= (1 - this.drag);
            this.vy *= (1 - this.drag);
            
            // Update wobble
            this.wobble += this.wobbleSpeed;
            
            // Modified fade out for full height
            const velocityFade = Math.min(1, Math.sqrt(this.vx * this.vx + this.vy * this.vy) / 6);
            const heightFade = 1 - Math.max(0, (this.y - (height * 0.95)) / (height * 0.05));
            this.opacity = Math.min(velocityFade, heightFade);
            
            // Return true if particle is still visible and within bounds
            return this.opacity > 0.1 && this.y < height;
        }

        draw() {
            const context = this.context;
            context.save();
            context.translate(this.x, this.y);
            context.rotate((this.wobble * Math.PI) / 180);
            
            // Set composite operation for better blending
            context.globalCompositeOperation = 'lighter';
            context.globalAlpha = this.opacity;
            
            // Draw confetti piece with gradient
            const gradient = context.createLinearGradient(-this.size/2, 0, this.size/2, 0);
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(1, this.adjustColor(this.color, 20));
            context.fillStyle = gradient;
            
            // Draw as elongated rectangle for better visual effect
            context.fillRect(-this.size/2, -this.size/4, this.size, this.size/2);
            
            context.restore();
        }

        // Helper to create color variations
        adjustColor(color, amount) {
            return '#' + color.replace(/^#/, '').match(/.{2}/g).map(c => {
                const num = Math.min(255, Math.max(0, parseInt(c, 16) + amount));
                return num.toString(16).padStart(2, '0');
            }).join('');
        }
    }

    let particles = [];
    let isAnimating = false;
    let animationFrame;

    function animate() {
        if (!isAnimating) return;

        ctx.clearRect(0, 0, width, height);
        
        // Update and draw particles
        particles = particles.filter(particle => {
            if (particle.update()) {
                particle.draw();
                return true;
            }
            return false;
        });

        // Continue animation if there are particles or animation is ongoing
        if (particles.length > 0) {
            animationFrame = requestAnimationFrame(animate);
        } else {
            isAnimating = false;
        }
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    return {
        init: function() {
            if (!document.body.contains(canvas)) {
                document.body.appendChild(canvas);
            }
        },

        fire: function() {
            // Create burst from both cannons
            const particleCount = 15; // Particles per burst
            const options = {
                colors: defaultColors,
                velocity: 45, // Significantly increased base velocity
                spread: 20  // Tightened spread for more focused streams
            };

            // Add particles for left cannon
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle(ctx, { ...options, isLeftCannon: true }));
            }

            // Add particles for right cannon
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle(ctx, { ...options, isLeftCannon: false }));
            }

            // Start animation if not already running
            if (!isAnimating) {
                isAnimating = true;
                animate();
            }
        },

        cleanup: function() {
            isAnimating = false;
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
            particles = [];
            if (canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        }
    };
})();

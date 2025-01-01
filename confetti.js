/**
 * @file confetti.js
 * @description Local implementation of confetti effect for MMM-Birthday module
 * @author Christian Gillinger
 * @license MIT
 * @version 1.2.3
 * 
 * This module creates a canvas-based confetti animation system with physics simulation
 * and particle management. Designed for optimal performance with dual-cannon effects.
 */

const Confetti = (function() {
    // Enhanced color palette for vibrant visual effects
    const defaultColors = ['#ff718d', '#fdff6a', '#58cffb', '#ffffff', '#7b52ff'];

    /**
     * @description Canvas setup for rendering confetti
     */
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '999999';

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    /**
     * @class Particle
     * @description Individual confetti particle with physics and rendering properties
     */
    class Particle {
        /**
         * @constructor
         * @param {CanvasRenderingContext2D} context - Canvas rendering context
         * @param {Object} options - Particle configuration options
         */
        constructor(context, options) {
            this.context = context;
            
            // Position setup with cannon placement offsets
            const cannonOffset = options.isLeftCannon ? width * 0.15 : width * 0.85;
            this.x = cannonOffset;
            this.y = height - 20; // Launch point slightly above bottom
            
            // Calculate launch angle for realistic arc
            const baseAngle = options.isLeftCannon ? -45 : -135;
            const angleVariation = (Math.random() - 0.5) * 20;
            const spreadAngle = (Math.random() - 0.5) * options.spread;
            this.angle = ((baseAngle + angleVariation + spreadAngle) * Math.PI) / 180;
            
            // Physics properties for natural movement
            this.velocity = options.velocity * (0.95 + Math.random() * 0.25);
            this.gravity = 0.25;
            this.drag = 0.045;
            this.wobble = Math.random() * 360;
            this.wobbleSpeed = Math.random() * 2 - 1;
            
            // Visual properties
            this.color = options.colors[Math.floor(Math.random() * options.colors.length)];
            this.size = Math.random() * 6 + 4;
            this.opacity = 1;
            
            // Initial velocity components
            this.vx = Math.cos(this.angle) * this.velocity;
            this.vy = Math.sin(this.angle) * this.velocity * 1.4;
        }

        /**
         * @function update
         * @description Updates particle position and properties for each frame
         * @returns {boolean} Whether the particle is still active
         */
        update() {
            // Apply physics
            this.x += this.vx;
            this.y += this.vy;
            this.vy += this.gravity;
            
            // Apply air resistance
            this.vx *= (1 - this.drag);
            this.vy *= (1 - this.drag);
            
            // Update wobble animation
            this.wobble += this.wobbleSpeed;
            
            // Calculate opacity based on velocity and height
            const velocityFade = Math.min(1, Math.sqrt(this.vx * this.vx + this.vy * this.vy) / 6);
            const heightFade = 1 - Math.max(0, (this.y - (height * 0.95)) / (height * 0.05));
            this.opacity = Math.min(velocityFade, heightFade);
            
            return this.opacity > 0.1 && this.y < height;
        }

        /**
         * @function draw
         * @description Renders the particle on the canvas
         */
        draw() {
            const context = this.context;
            context.save();
            context.translate(this.x, this.y);
            context.rotate((this.wobble * Math.PI) / 180);
            
            // Enhanced blending for better visual effect
            context.globalCompositeOperation = 'lighter';
            context.globalAlpha = this.opacity;
            
            // Create gradient for 3D effect
            const gradient = context.createLinearGradient(-this.size/2, 0, this.size/2, 0);
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(1, this.adjustColor(this.color, 20));
            context.fillStyle = gradient;
            
            // Draw elongated rectangle for better visibility
            context.fillRect(-this.size/2, -this.size/4, this.size, this.size/2);
            
            context.restore();
        }

        /**
         * @function adjustColor
         * @description Creates color variations for visual depth
         * @param {string} color - Base color in hex format
         * @param {number} amount - Amount to adjust brightness
         * @returns {string} Modified color
         */
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

    /**
     * @function animate
     * @description Main animation loop for confetti effect
     */
    function animate() {
        if (!isAnimating) return;

        ctx.clearRect(0, 0, width, height);
        
        // Update and render active particles
        particles = particles.filter(particle => {
            if (particle.update()) {
                particle.draw();
                return true;
            }
            return false;
        });

        if (particles.length > 0) {
            animationFrame = requestAnimationFrame(animate);
        } else {
            isAnimating = false;
        }
    }

    // Handle window resizing
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    return {
        /**
         * @function init
         * @description Initializes the confetti system
         */
        init: function() {
            if (!document.body.contains(canvas)) {
                document.body.appendChild(canvas);
            }
        },

        /**
         * @function fire
         * @description Triggers a new confetti burst
         */
        fire: function() {
            const particleCount = 15;
            const options = {
                colors: defaultColors,
                velocity: 45,
                spread: 20
            };

            // Create particles for both cannons
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle(ctx, { ...options, isLeftCannon: true }));
                particles.push(new Particle(ctx, { ...options, isLeftCannon: false }));
            }

            if (!isAnimating) {
                isAnimating = true;
                animate();
            }
        },

        /**
         * @function cleanup
         * @description Stops animation and removes all particles
         */
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

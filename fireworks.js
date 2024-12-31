/**
 * @file fireworks.js
 * @description Fireworks effect implementation for MMM-Birthday module
 * @author Christian Gillinger
 * @license MIT
 * @version 1.1.0
 * 
 * Changelog:
 * 1.1.0 - Added infinite duration support and improved performance
 * 1.0.0 - Initial release
 */

class Fireworks {
    constructor() {
        this.colors = [
            '#ff0000', '#ffa500', '#ffff00', '#00ff00', '#00ffff',
            '#0000ff', '#ff00ff', '#ff1493', '#ffd700', '#00ff7f'
        ];
        this.container = document.body;
        this.particles = [];
        this.endTime = Infinity;
        this.createStyleSheet();
    }

    createStyleSheet() {
        if (!document.getElementById('fireworkStyles')) {
            const style = document.createElement('style');
            style.id = 'fireworkStyles';
            style.textContent = `
                .rocket {
                    position: fixed;
                    width: 3px;
                    height: 3px;
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 999999;
                }

                .rocket::after {
                    content: '';
                    position: absolute;
                    width: 2px;
                    height: 20px;
                    background: linear-gradient(to top, 
                        rgba(255, 255, 255, 0.8) 0%,
                        rgba(255, 200, 100, 0.5) 60%,
                        rgba(255, 100, 50, 0.3) 100%);
                    transform: translateY(3px);
                }

                .spark {
                    position: fixed;
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 999999;
                }

                .spark::after {
                    content: '';
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    filter: blur(1px);
                }

                @keyframes rocketTrail {
                    0% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                    70% {
                        opacity: 1;
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(-800px) scale(0.2);
                    }
                }

                @keyframes explode {
                    0% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    40% {
                        opacity: 0.9;
                    }
                    100% {
                        transform: scale(0);
                        opacity: 0;
                    }
                }

                @keyframes sparkTrail {
                    0% { 
                        width: 0px;
                        opacity: 0.8;
                    }
                    100% { 
                        width: 20px;
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    createRocket(x) {
        const rocket = document.createElement('div');
        rocket.className = 'rocket';
        rocket.style.left = x + 'px';
        rocket.style.bottom = '0';
        rocket.style.backgroundColor = '#fff';
        rocket.style.boxShadow = '0 0 6px #fff, 0 0 12px #ff0';
        rocket.style.animation = 'rocketTrail 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        return rocket;
    }

    createSpark(x, y, color, angle, velocity) {
        const spark = document.createElement('div');
        spark.className = 'spark';
        spark.style.left = x + 'px';
        spark.style.top = y + 'px';
        spark.style.backgroundColor = color;
        spark.style.boxShadow = `0 0 6px ${color}, 0 0 12px ${color}`;
        
        const rad = angle * Math.PI / 180;
        const duration = 0.8 + Math.random() * 0.6;
        const distance = velocity * (0.7 + Math.random() * 0.3);

        spark.style.transform = `translate(${Math.cos(rad) * distance}px, ${Math.sin(rad) * distance}px)`;
        spark.style.transition = `transform ${duration}s cubic-bezier(0.165, 0.84, 0.44, 1), opacity ${duration}s ease-out`;
        
        const trail = document.createElement('div');
        trail.style.position = 'absolute';
        trail.style.height = '2px';
        trail.style.background = `linear-gradient(to left, ${color}, transparent)`;
        trail.style.animation = 'sparkTrail 0.2s linear forwards';
        spark.appendChild(trail);

        setTimeout(() => {
            spark.style.opacity = '0';
        }, duration * 900);

        return spark;
    }

    createExplosion(x, y, color) {
        const particleCount = 80;
        const sparks = [];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i * 360) / particleCount + Math.random() * 20;
            const velocity = 100 + Math.random() * 100;
            const spark = this.createSpark(x, y, color, angle, velocity);
            this.container.appendChild(spark);
            sparks.push(spark);

            setTimeout(() => {
                if (spark.parentNode) {
                    spark.remove();
                }
            }, 2000);
        }
    }

    launch() {
        const x = Math.random() * (window.innerWidth - 100) + 50;
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        
        const rocket = this.createRocket(x);
        this.container.appendChild(rocket);
        
        setTimeout(() => {
            const rocketRect = rocket.getBoundingClientRect();
            this.createExplosion(x, rocketRect.top + 50, color);
            rocket.remove();
        }, 800);

        setTimeout(() => {
            if (rocket.parentNode) {
                rocket.remove();
            }
        }, 1000);
    }

    /**
     * @function start
     * @param {string|number} duration - Duration in ms or "infinite"
     * @description Starts the fireworks display for specified duration or indefinitely
     */
    start(duration) {
        const minInterval = 200;
        const maxInterval = 1000;
        
        const launchNext = () => {
            if (Date.now() < this.endTime) {
                this.launch();
                const nextDelay = Math.random() * (maxInterval - minInterval) + minInterval;
                setTimeout(launchNext, nextDelay);
            }
        };

        this.endTime = duration === "infinite" ? Infinity : Date.now() + duration;
        launchNext();
    }

    /**
     * @function cleanup
     * @description Stops the fireworks and cleans up all elements
     */
    cleanup() {
        this.endTime = 0;
        const elements = document.querySelectorAll('.rocket, .spark');
        elements.forEach(element => {
            if (element.parentNode) {
                element.remove();
            }
        });
    }
}

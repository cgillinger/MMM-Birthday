/**
 * @file MMM-Birthday.js
 * @description A MagicMirror² module that displays birthday celebrations with fireworks and confetti
 * @author Christian Gillinger
 * @license MIT
 * @version 1.3.0
 * 
 * This module monitors configured birthdays and creates celebratory displays when they occur.
 * Now includes suspend/resume functionality for better compatibility with MMM-Pages.
 */

Module.register("MMM-Birthday", {
    /**
     * @property {Object} defaults - Default configuration values
     */
    defaults: {
        birthdays: [],           // Example: [{name: "Anna", date: "12-25"}]
        fireworkDuration: "infinite",
        confettiDuration: "infinite"
    },

    /**
     * @function getStyles
     * @description Loads required CSS files for the module
     * @returns {Array} List of CSS file paths
     */
    getStyles: function() {
        return ["MMM-Birthday.css"];
    },

    /**
     * @function getScripts
     * @description Loads required JavaScript files for animations
     * @returns {Array} List of JavaScript file paths
     */
    getScripts: function() {
        return [
            this.file('fireworks.js'),
            this.file('confetti.js')
        ];
    },

    /**
     * @function getTranslations
     * @description Loads language files for multilingual support
     * @returns {Object} Mapping of language codes to translation files
     */
    getTranslations: function() {
        return {
            en: "translations/en.json",
            sv: "translations/sv.json",
            da: "translations/da.json",
            de: "translations/de.json",
            es: "translations/es.json",
            fi: "translations/fi.json",
            fr: "translations/fr.json",
            it: "translations/it.json",
            nl: "translations/nl.json",
            no: "translations/no.json",
            pt: "translations/pt.json",
            uk: "translations/uk.json"
        };
    },

    /**
     * @function start
     * @description Initializes the module when MagicMirror loads
     */
    start: function() {
        Log.info("Starting module: " + this.name);
        
        // Initialize module states
        this.loaded = false;
        this.fireworks = null;
        this.celebrating = false;
        this._wasCelebrating = false;  // New state tracker for suspend/resume
        this.celebrationInterval = null;

        // Set module language
        this.language = config.language || 'en';
        Log.info(`${this.name} using language: ${this.language}`);
        
        // Fallback translations
        this.defaultTranslations = {
            MESSAGES: [
                "🎉 Happy Birthday, {name}! 🎂",
                "🎈 Best wishes on your special day, {name}! 🎁",
                "🌟 Have a fantastic birthday, {name}! 🎊"
            ]
        };

        this.scheduleNextCheck();
    },

    /**
     * @function suspend
     * @description Handles module suspension (hiding) for MMM-Pages compatibility
     */
    suspend: function() {
        if (this.celebrating) {
            // Store celebration state before cleanup
            this._wasCelebrating = true;
            
            // Clean up active celebrations
            if (this.fireworks) {
                this.fireworks.cleanup();
            }
            Confetti.cleanup();
            
            // Clean up any running timers
            if (this.celebrationInterval) {
                clearInterval(this.celebrationInterval);
            }
            
            // Hide the celebration display
            const wrapper = document.querySelector('.birthday-module');
            if (wrapper) {
                wrapper.style.display = 'none';
            }
            
            // Update module state
            this.celebrating = false;
        }
    },

    /**
     * @function resume
     * @description Handles module resumption (showing) for MMM-Pages compatibility
     */
    resume: function() {
        if (this._wasCelebrating) {
            // Restore celebration state
            this.celebrating = true;
            this._wasCelebrating = false;
            
            // Show the celebration display
            const wrapper = document.querySelector('.birthday-module');
            if (wrapper) {
                wrapper.style.display = 'block';
            }
            
            // Restart celebrations
            this.celebrateBirthday();
        }
    },

    /**
     * @function getDom
     * @description Creates the module's visible DOM elements
     * @returns {Element} The module's wrapper element
     */
    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.className = "birthday-module";
        return wrapper;
    },

    /**
     * @function scheduleNextCheck
     * @description Sets up periodic checks for birthdays
     */
    scheduleNextCheck: function() {
        setInterval(() => {
            this.checkBirthdays();
        }, 60000);
        this.checkBirthdays(); // Initial check on load
    },

    /**
     * @function checkBirthdays
     * @description Checks if today matches any configured birthdays
     */
    checkBirthdays: function() {
        const now = new Date();
        const currentDate = (now.getMonth() + 1).toString().padStart(2, '0') + 
                           "-" + now.getDate().toString().padStart(2, '0');

        if (!Array.isArray(this.config.birthdays)) {
            Log.error(`[${this.name}] Birthdays configuration is not an array`);
            return;
        }

        this.config.birthdays.forEach(birthday => {
            if (birthday.date === currentDate && !this.celebrating && !this._wasCelebrating) {
                this.celebrating = true;
                this.celebrateBirthday(birthday.name);
            }
        });
    },

    /**
     * @function getRandomMessage
     * @description Selects a random birthday message and personalizes it
     * @param {string} name - Name of the person celebrating
     * @returns {string} Formatted birthday message
     */
    getRandomMessage: function(name) {
        let messages;
        try {
            messages = this.translate("MESSAGES");
            if (messages === "MESSAGES") {
                messages = this.defaultTranslations.MESSAGES;
            }
        } catch (e) {
            messages = this.defaultTranslations.MESSAGES;
            Log.warn(`${this.name} translation failed, using default messages`);
        }
        
        if (!Array.isArray(messages)) {
            messages = this.defaultTranslations.MESSAGES;
            Log.warn(`${this.name} invalid translation format, using default messages`);
        }

        const message = messages[Math.floor(Math.random() * messages.length)];
        return message.replace('{name}', name);
    },

    /**
     * @function celebrateBirthday
     * @description Initiates the birthday celebration with animations
     * @param {string} name - Name of the person celebrating
     */
    celebrateBirthday: function(name) {
        // Initialize animation components
        if (!this.fireworks) {
            this.fireworks = new Fireworks();
        }
        Confetti.init();

        // Create or get celebration display
        const wrapper = document.querySelector('.birthday-module') || this.createWrapper();
        const messageDiv = document.createElement("div");
        messageDiv.className = "birthday-message";
        messageDiv.innerHTML = this.getRandomMessage(name);
        
        // Update display
        wrapper.innerHTML = '';
        wrapper.appendChild(messageDiv);
        wrapper.style.display = 'block';

        // Start celebration effects
        this.dimOtherModules();
        this.startFireworks();
        this.startConfetti();

        // Set celebration duration if not infinite
        if (this.config.fireworkDuration !== "infinite") {
            setTimeout(() => {
                this.stopCelebration(wrapper);
            }, this.config.fireworkDuration);
        }
    },

    /**
     * @function startFireworks
     * @description Configures and starts the fireworks animation
     */
    startFireworks: function() {
        this.fireworks.start(this.config.fireworkDuration);
    },

    /**
     * @function startConfetti
     * @description Initiates confetti animation with periodic bursts
     */
    startConfetti: function() {
        const isInfinite = this.config.confettiDuration === "infinite";
        const end = isInfinite ? Infinity : Date.now() + this.config.confettiDuration;

        const fireBurst = () => {
            if (this.celebrating && (isInfinite || Date.now() < end)) {
                Confetti.fire();
                // Random delay between bursts (2-8 seconds)
                const nextDelay = 2000 + Math.random() * 6000;
                setTimeout(fireBurst, nextDelay);
            }
        };

        // Start first burst after initial delay
        setTimeout(fireBurst, 1000);
    },

    /**
     * @function stopCelebration
     * @description Cleans up and ends the celebration
     * @param {Element} wrapper - The celebration display wrapper
     */
    stopCelebration: function(wrapper) {
        if (this.celebrationInterval) {
            clearInterval(this.celebrationInterval);
        }
        
        // Hide celebration display
        wrapper.style.display = 'none';
        
        // Restore other modules
        document.querySelectorAll('.module').forEach(module => {
            module.style.filter = '';
        });
        
        // Reset celebration state
        this.celebrating = false;
        this._wasCelebrating = false;
        
        // Clean up animations
        if (this.fireworks) {
            this.fireworks.cleanup();
        }
        Confetti.cleanup();
    },

    /**
     * @function createWrapper
     * @description Creates the celebration display container
     * @returns {Element} The celebration wrapper element
     */
    createWrapper: function() {
        const wrapper = document.createElement("div");
        wrapper.className = "birthday-module";
        document.body.appendChild(wrapper);
        return wrapper;
    },

    /**
     * @function dimOtherModules
     * @description Reduces brightness of other modules during celebration
     */
    dimOtherModules: function() {
        document.querySelectorAll('.module').forEach(module => {
            if (!module.classList.contains('birthday-module')) {
                module.style.filter = 'brightness(30%)';
                module.style.transition = 'filter 0.5s ease-in-out';
            }
        });
    }
});

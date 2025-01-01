/**
 * @file MMM-Birthday.js
 * @description A MagicMirror² module that displays birthday celebrations with fireworks and confetti
 * @author Christian Gillinger
 * @license MIT
 * @version 1.2.5
 * 
 * This module monitors configured birthdays and creates celebratory displays when they occur.
 * It features animated fireworks, confetti effects, and multilingual birthday messages.
 */

Module.register("MMM-Birthday", {
    /**
     * @property {Object} defaults - Default configuration values
     * @property {Array} defaults.birthdays - List of birthday objects with name and date
     * @property {string} defaults.fireworkDuration - Duration for fireworks ("infinite" or milliseconds)
     * @property {string} defaults.confettiDuration - Duration for confetti ("infinite" or milliseconds)
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
        this.loaded = false;          // Tracks if module is fully loaded
        this.fireworks = null;        // Fireworks animation instance
        this.celebrating = false;     // Current celebration state
        this.celebrationInterval = null; // Timer for celebration duration

        // Set module language based on global MagicMirror config
        this.language = config.language || 'en';
        Log.info(`${this.name} using language: ${this.language}`);
        
        // Fallback translations if language file fails to load
        this.defaultTranslations = {
            MESSAGES: [
                "🎉 Happy Birthday, {name}! 🎂",
                "🎈 Best wishes on your special day, {name}! 🎁",
                "🌟 Have a fantastic birthday, {name}! 🎊"
            ]
        };

        // Start birthday monitoring
        this.scheduleNextCheck();
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
        // Check every minute for birthdays
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
        // Format current date as MM-DD for comparison
        const currentDate = (now.getMonth() + 1).toString().padStart(2, '0') + 
                           "-" + now.getDate().toString().padStart(2, '0');

        // Validate birthdays configuration
        if (!Array.isArray(this.config.birthdays)) {
            Log.error(`[${this.name}] Birthdays configuration is not an array`);
            return;
        }

        // Check each birthday for a match
        this.config.birthdays.forEach(birthday => {
            if (birthday.date === currentDate && !this.celebrating) {
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
            // Attempt to get translated messages
            messages = this.translate("MESSAGES");
            // Check if translation failed (returns key instead of translation)
            if (messages === "MESSAGES") {
                messages = this.defaultTranslations.MESSAGES;
            }
        } catch (e) {
            // Use default messages if translation fails
            messages = this.defaultTranslations.MESSAGES;
            Log.warn(`${this.name} translation failed, using default messages`);
        }
        
        // Validate messages format
        if (!Array.isArray(messages)) {
            messages = this.defaultTranslations.MESSAGES;
            Log.warn(`${this.name} invalid translation format, using default messages`);
        }

        // Select and personalize random message
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
        wrapper.style.visibility = 'visible';

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
        const config = {
            velocity: 25,      // Reduced velocity for better visibility
            spread: 15,        // Controlled spread for display
            delay: 1000       // Time between launches
        };
        this.fireworks.start(this.config.fireworkDuration, config);
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

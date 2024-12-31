/**
 * @file MMM-Birthday.js
 * @description A MagicMirror² module that displays birthday celebrations with fireworks and confetti
 * @version 1.2.5
 */

Module.register("MMM-Birthday", {
    // Default configuration - will be overridden by module config or global config
    defaults: {
        birthdays: [],
        fireworkDuration: "infinite",
        confettiDuration: "infinite"
    },

    // Required styles
    getStyles: function() {
        return ["MMM-Birthday.css"];
    },

    // Required scripts
    getScripts: function() {
        return [
            this.file('fireworks.js'),
            this.file('confetti.js')
        ];
    },

    // Translation files mapping
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

    start: function() {
        Log.info("Starting module: " + this.name);
        
        // Initialize states
        this.loaded = false;
        this.fireworks = null;
        this.celebrating = false;
        this.celebrationInterval = null;

        // Set language according to hierarchy:
        // 1. Module config
        // 2. Global config
        // 3. Default 'en'
        this.language = this.config.language || config.language || 'en';
        Log.info(`${this.name} using language: ${this.language}`);
        
        // Default translations as ultimate fallback
        this.defaultTranslations = {
            MESSAGES: [
                "🎉 Happy Birthday, {name}! 🎂",
                "🎈 Best wishes on your special day, {name}! 🎁",
                "🌟 Have a fantastic birthday, {name}! 🎊"
            ]
        };

        this.scheduleNextCheck();
    },

    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.className = "birthday-module";
        return wrapper;
    },

    scheduleNextCheck: function() {
        setInterval(() => {
            this.checkBirthdays();
        }, 60000); // Check every minute
        this.checkBirthdays(); // Initial check
    },

    checkBirthdays: function() {
        const now = new Date();
        const currentDate = (now.getMonth() + 1).toString().padStart(2, '0') + 
                           "-" + now.getDate().toString().padStart(2, '0');

        if (!Array.isArray(this.config.birthdays)) {
            Log.error(`[${this.name}] Birthdays configuration is not an array`);
            return;
        }

        this.config.birthdays.forEach(birthday => {
            if (birthday.date === currentDate && !this.celebrating) {
                this.celebrating = true;
                this.celebrateBirthday(birthday.name);
            }
        });
    },

    getRandomMessage: function(name) {
        let messages;
        try {
            // Try to get translated messages
            messages = this.translate("MESSAGES");
            // If translation returns the key, it means translation failed
            if (messages === "MESSAGES") {
                messages = this.defaultTranslations.MESSAGES;
            }
        } catch (e) {
            // Fallback to default messages if translation fails
            messages = this.defaultTranslations.MESSAGES;
            Log.warn(`${this.name} translation failed, using default messages`);
        }
        
        // Ensure we have an array of messages
        if (!Array.isArray(messages)) {
            messages = this.defaultTranslations.MESSAGES;
            Log.warn(`${this.name} invalid translation format, using default messages`);
        }

        const message = messages[Math.floor(Math.random() * messages.length)];
        return message.replace('{name}', name);
    },

    celebrateBirthday: function(name) {
        if (!this.fireworks) {
            this.fireworks = new Fireworks();
        }
        Confetti.init();

        const wrapper = document.querySelector('.birthday-module') || this.createWrapper();
        const messageDiv = document.createElement("div");
        messageDiv.className = "birthday-message";
        messageDiv.innerHTML = this.getRandomMessage(name);
        
        wrapper.innerHTML = '';
        wrapper.appendChild(messageDiv);
        wrapper.style.display = 'block';
        wrapper.style.visibility = 'visible';

        this.dimOtherModules();
        this.startFireworks();
        this.startConfetti();

        if (this.config.fireworkDuration !== "infinite") {
            setTimeout(() => {
                this.stopCelebration(wrapper);
            }, this.config.fireworkDuration);
        }
    },

    startFireworks: function() {
        const config = {
            velocity: 25,      // Reduced velocity
            spread: 15,        // Reduced spread
            delay: 1000        // Delay between launches
        };
        this.fireworks.start(this.config.fireworkDuration, config);
    },

    startConfetti: function() {
        const isInfinite = this.config.confettiDuration === "infinite";
        const end = isInfinite ? Infinity : Date.now() + this.config.confettiDuration;

        const fireBurst = () => {
            if (this.celebrating && (isInfinite || Date.now() < end)) {
                Confetti.fire();
                // 2-8 seconds between bursts
                const nextDelay = 2000 + Math.random() * 6000;
                setTimeout(fireBurst, nextDelay);
            }
        };

        // Initial delay before starting confetti
        setTimeout(fireBurst, 1000);
    },

    stopCelebration: function(wrapper) {
        if (this.celebrationInterval) {
            clearInterval(this.celebrationInterval);
        }
        
        wrapper.style.display = 'none';
        document.querySelectorAll('.module').forEach(module => {
            module.style.filter = '';
        });
        this.celebrating = false;
        
        if (this.fireworks) {
            this.fireworks.cleanup();
        }
        Confetti.cleanup();
    },

    createWrapper: function() {
        const wrapper = document.createElement("div");
        wrapper.className = "birthday-module";
        document.body.appendChild(wrapper);
        return wrapper;
    },

    dimOtherModules: function() {
        document.querySelectorAll('.module').forEach(module => {
            if (!module.classList.contains('birthday-module')) {
                module.style.filter = 'brightness(30%)';
                module.style.transition = 'filter 0.5s ease-in-out';
            }
        });
    }
});

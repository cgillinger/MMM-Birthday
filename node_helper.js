/**
 * @file node_helper.js
 * @description Node helper for MMM-Birthday module
 * @author Christian Gillinger
 * @license MIT
 * @version 1.0.0
 */

var NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
    /**
     * @function start
     * @description Called when the helper starts
     */
    start: function() {
        console.log("Starting node helper for: " + this.name);
        this.initialized = false;
    },

    /**
     * @function socketNotificationReceived
     * @description Handle incoming socket notifications
     * @param {string} notification - The notification identifier
     * @param {*} payload - The notification payload
     */
    socketNotificationReceived: function(notification, payload) {
        if (notification === "INITIALIZE") {
            if (!this.initialized) {
                this.initialized = true;
                this.sendSocketNotification("INITIALIZED", true);
            }
        }
    },

    /**
     * @function handleError
     * @description Handle and log errors
     * @param {Error} error - The error object
     */
    handleError: function(error) {
        console.error(`[${this.name}] Error:`, error);
        this.sendSocketNotification("ERROR", {
            message: error.message,
            stack: error.stack
        });
    }
});

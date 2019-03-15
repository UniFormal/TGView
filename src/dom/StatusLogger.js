"use strict";
exports.__esModule = true;
/**
 * Represents a class that can log to something
 * @param logElement ID of Element that should be logged into
 * @param optionsIn Options that are used with this StatusLogger
 * @class
 */
var StatusLogger = /** @class */ (function () {
    function StatusLogger(dom, logElementId) {
        this.dom = dom;
        this.statusbar = this.dom.getElementById(logElementId);
    }
    StatusLogger.prototype.destroy = function () {
        // reset the cursor of the status bar
        this.setStatusCursor('auto');
    };
    StatusLogger.prototype.setStatusText = function (text) {
        this.statusbar.innerHTML = text;
    };
    StatusLogger.prototype.setStatusCursor = function (cursor) {
        this.dom.mainElement.style.cursor = cursor || 'auto';
    };
    return StatusLogger;
}());
exports["default"] = StatusLogger;

"use strict";
exports.__esModule = true;
var jquery_1 = require("jquery");
/**
 * Handles resizing of the window and main container
 * @class
 */
var Resizer = /** @class */ (function () {
    function Resizer(dom) {
        var _this = this;
        this.dom = dom;
        this.widthTreeBefore = 350;
        this.doResize = this.doResize.bind(this);
        this.resizeMenuDiv = this.resizeMenuDiv.bind(this);
        this.dom.mainElement$.ready(function () {
            _this.doResize();
            _this.interval = window.setInterval(_this.resizeMenuDiv, 250);
            jquery_1["default"](window).resize(_this.doResize);
        });
    }
    Resizer.prototype.destroy = function () {
        if (this.interval) {
            window.clearInterval(this.interval);
            this.interval = undefined;
        }
        jquery_1["default"](window).off('resize', this.doResize);
    };
    Resizer.prototype.resizeMenuDiv = function () {
        var currWidth = this.dom.getElementById('theory_tree_div').offsetWidth;
        if (this.widthTreeBefore != currWidth) {
            this.widthTreeBefore = currWidth;
            var sideNav = this.dom.getElementById('mySidenav');
            sideNav.style.width = (this.widthTreeBefore + 16) + 'px';
        }
    };
    Resizer.prototype.doResize = function () {
        var htmlCanvas = this.dom.getElementById('toolCanvas');
        htmlCanvas.style.width = ((window.innerWidth - 36) | 0) + 'px';
        htmlCanvas.style.height = ((window.innerHeight - 74) | 0) + 'px';
        var mainbox = this.dom.getElementById('mainbox');
        mainbox.style.width = ((window.innerWidth - 36) | 0) + 'px';
        var wholeNetwork = this.dom.getElementById('wholeNetwork');
        wholeNetwork.style.width = ((window.innerWidth - 36) | 0) + 'px';
        wholeNetwork.style.height = ((window.innerHeight - 74) | 0) + 'px';
    };
    return Resizer;
}());
exports["default"] = Resizer;

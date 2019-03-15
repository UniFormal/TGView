"use strict";
exports.__esModule = true;
var jquery_1 = require("jquery");
var GlobalListener = /** @class */ (function () {
    function GlobalListener(theoryGraph, config, dom, wrapper) {
        var _this = this;
        this.theoryGraph = theoryGraph;
        this.config = config;
        this.dom = dom;
        this.wrapper = wrapper;
        this.rectTools = {};
        this.dragTools = false;
        this.selectionMode = false;
        this.onMessage = this.onMessage.bind(this);
        jquery_1["default"](window).bind('message', this.onMessage);
        this.dom.mainElement$.bind('contextmenu', function (event) {
            // if the ctrl key or the meta key are pressed
            // show the default context menu 
            if (event.ctrlKey || event.metaKey) {
                event.stopImmediatePropagation();
                return;
            }
            // else prevent it from showing
            event.preventDefault();
        });
        this.dom.mainElement$.ready(function () {
            //$('button').button();
            // Accordion
            // this.dom.$('.accordion').accordion({ header: 'h3' });
            // Tabs
            // TODO: Does not exist
            // this.dom.$$('tabs').tabs();
            // Button Set
            // TODO: Does not exist
            //this.dom.$$("radio1").buttonset();
            // this.dom.$$("methodCluster").selectmenu();
            _this.canvasTools = _this.dom.getElementById('toolCanvas');
            _this.ctxTools = _this.canvasTools.getContext('2d');
            _this.rectTools = {};
            _this.containerTools = _this.dom.$$('toolCanvas');
            _this.containerTools.on('mousemove', function (e) {
                if (_this.dragTools == true && _this.selectionMode == true) {
                    _this.rectTools.w = e.offsetX - _this.rectTools.startX;
                    _this.rectTools.h = e.offsetY - _this.rectTools.startY;
                    _this.ctxTools.clearRect(0, 0, _this.canvasTools.width, _this.canvasTools.height);
                    _this.ctxTools.setLineDash([5]);
                    _this.ctxTools.strokeStyle = 'rgb(0, 102, 0)';
                    _this.ctxTools.strokeRect(_this.rectTools.startX, _this.rectTools.startY, _this.rectTools.w, _this.rectTools.h);
                    _this.ctxTools.setLineDash([]);
                    _this.ctxTools.fillStyle = 'rgba(0, 255, 0, 0.2)';
                    _this.ctxTools.fillRect(_this.rectTools.startX, _this.rectTools.startY, _this.rectTools.w, _this.rectTools.h);
                    console.log(_this.rectTools.startX, _this.rectTools.startY, _this.rectTools.w, _this.rectTools.h);
                }
            });
            _this.containerTools.on('mousedown', function (e) {
                if (_this.selectionMode == true) {
                    _this.rectTools = {
                        w: 0,
                        h: 0,
                        startX: e.offsetX,
                        startY: e.offsetY
                    };
                    _this.dragTools = true;
                }
            });
            _this.containerTools.on('mouseup', function (e) {
                if (_this.dragTools == true) {
                    _this.dragTools = false;
                    _this.theoryGraph.selectNodesInRect(_this.rectTools);
                    _this.ctxTools.clearRect(0, 0, _this.canvasTools.width, _this.canvasTools.height);
                    _this.switchSelectionMode();
                }
            });
        });
    }
    GlobalListener.prototype.destroy = function () {
        // undo all the event handlers
        jquery_1["default"](window).unbind('message', this.onMessage);
        this.dom.mainElement$.unbind('contextmenu');
        // 
        if (this.containerTools) {
            this.containerTools.off('mousemove');
            this.containerTools.off('mousedown');
            this.containerTools.off('mouseup');
        }
        // destroy the ui
        // this.dom.$('.accordion').accordion('destroy');
        // this.dom.$$('tabs').tabs('destroy');
        // his.dom.$$('radio1').buttonset('destroy');
        // this.dom.$$('methodCluster').selectmenu('destroy');
        // reset a couple of variables
        this.canvasTools = undefined;
        this.ctxTools = undefined;
        this.rectTools = {};
        this.containerTools = undefined;
    };
    GlobalListener.prototype.onMessage = function (e) {
        this.wrapper.recievedDataJSON = e.originalEvent.data;
    };
    GlobalListener.prototype.switchSelectionMode = function () {
        if (this.selectionMode == false) {
            this.dom.$$('toolCanvas').css('display', 'block');
            this.selectionMode = true;
            this.dom.getElementById('toolCanvas').style.cursor = 'crosshair';
        }
        else {
            this.dom.$$('toolCanvas').css('display', 'none');
            this.selectionMode = false;
            this.dom.getElementById('toolCanvas').style.cursor = 'auto';
        }
    };
    return GlobalListener;
}());
exports["default"] = GlobalListener;

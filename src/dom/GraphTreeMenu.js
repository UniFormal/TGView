"use strict";
exports.__esModule = true;
var jquery_1 = require("jquery");
require("jstree");
var GraphTreeMenu = /** @class */ (function () {
    function GraphTreeMenu(config, dom, wrapper) {
        var _this = this;
        this.config = config;
        this.dom = dom;
        this.wrapper = wrapper;
        this.alreadyAdded = {};
        this.lazyParent = '#';
        this.currentMouseX = 0;
        this.currentMouseY = 0;
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.dom.mainElement.onmousemove = this.handleMouseMove;
        this.dom.$$('theory_tree').jstree({
            'core': {
                'check_callback': true,
                'themes': { 'stripes': false, 'icons': false }
            },
            'types': {
                'default': {
                    'valid_children': ['default', 'file']
                }
            },
            'plugins': [
                'contextmenu', 'dnd', 'search',
                'state', 'types', 'wholerow'
            ]
        });
        jquery_1["default"].get(this.config.menuEntriesURL, this.addTreeNodes.bind(this));
        this.dom.$$('theory_tree').on('select_node.jstree', function (evt, data) {
            _this.wrapper.lastGraphDataUsed = data.node.original.graphdata; // TODO: Fix me
            var y = _this.currentMouseY - 8;
            var x = _this.currentMouseX + 4;
            // TODO: no-globals
            _this.dom.$('.custom-menu-side').finish().show(10).
                // In the right position (the mouse)
                css({
                top: y + 'px',
                left: x + 'px'
            });
            evt.preventDefault();
        });
        this.dom.$$('theory_tree').on('open_node.jstree', function (evt, data) {
            _this.dom.$('.custom-menu-side').hide(10);
            _this.lazyParent = data.node.id;
            data.node.children = [];
            if (_this.alreadyAdded[_this.lazyParent] != true) {
                console.log(data.node);
                console.log(_this.lazyParent + ' added: ' + _this.alreadyAdded[_this.lazyParent]);
                var jsonURL = _this.config.menuEntriesURL + data.node.original.serverId;
                //var jsonURL="http://neuralocean.de/graph/test/menu.json";
                //this.alreadyAdded[lazyParent]=true;
                jquery_1["default"].get(jsonURL, _this.addTreeNodes.bind(_this));
            }
        });
    }
    GraphTreeMenu.prototype.destroy = function () {
        this.dom.mainElement.onmousemove = null;
        // remove jstree + handlers
        var tree = this.dom.$$('theory_tree');
        tree.jstree(true).destroy();
        tree.off('select_node.jstree');
        tree.off('open_node.jstree');
    };
    GraphTreeMenu.prototype.handleMouseMove = function (event) {
        //var dot, eventDoc, doc, body, pageX, pageY;
        event = event || window.event; // IE-ism
        /*
        // NO IE-compatibility needed
        // If pageX/Y aren't available and clientX/Y are,
        // calculate pageX/Y - logic taken from jQuery.
        // (This is to support old IE)
        // TODO: We don't really need to support old IE if it only adds weird code
        // that is what poly-fills are for
        if (event.pageX == null && event.clientX != null)
        {
            eventDoc = (event.target && (event.target as any).ownerDocument) || this.dom.mainElement;
            doc = eventDoc.documentElement;
            body = eventDoc.body;

            (event as any).pageX = event.clientX +
              (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
              (doc && doc.clientLeft || body && body.clientLeft || 0);
              (event as any).pageY = event.clientY +
              (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
              (doc && doc.clientTop  || body && body.clientTop  || 0 );
        }
        */
        this.currentMouseX = event.pageX;
        this.currentMouseY = event.pageY;
    };
    GraphTreeMenu.prototype.addTreeNodes = function (data) {
        var childNodes = data;
        console.log(childNodes);
        console.log(this.lazyParent + ';');
        for (var i = 0; i < childNodes.length; i++) {
            var child = (childNodes[i].hasChildren == true) ? [{ 'id': 'placeholder' }] : undefined;
            var node = {
                'text': childNodes[i].menuText,
                'id': childNodes[i].id + Math.floor(Math.random() * 5000),
                'serverId': childNodes[i].id,
                'graphdata': childNodes[i].uri,
                'typeGraph': childNodes[i].type,
                'children': child,
                'state': { 'opened': !childNodes[i].hasChildren }
            };
            this.dom.$$('theory_tree').jstree().create_node(this.lazyParent, node, 'last', function () { console.log('Child created'); });
        }
    };
    return GraphTreeMenu;
}());
exports["default"] = GraphTreeMenu;

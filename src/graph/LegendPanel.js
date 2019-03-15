"use strict";
exports.__esModule = true;
var vis_1 = require("vis");
var visgraph_1 = require("./visgraph");
var LegendPanel = /** @class */ (function () {
    function LegendPanel(dom, name, config, statusLogger) {
        this.config = config;
        this.statusLogger = statusLogger;
        this.originalNodes = [];
        this.originalEdges = [];
        this.nodes = null;
        this.edges = null;
        this.smallNodeSize = 5;
        this.bigNodeSize = 130;
        this.container = dom.getElementById(name);
    }
    LegendPanel.prototype.destroy = function () {
        // clear edges, then nodes
        if (this.edges) {
            this.edges.clear();
        }
        if (this.nodes) {
            this.nodes.clear();
        }
        // destroy the network
        if (this.network) {
            this.network.destroy();
            this.network = undefined;
        }
        // empty saved state
        this.originalEdges = [];
        this.originalNodes = [];
    };
    LegendPanel.prototype.load = function (usedNodeTypes, usedEdgeTypes) {
        var _this = this;
        var _a, _b;
        var nodesToAdd = [];
        var edgesToAdd = [];
        for (var i = 0; i < usedNodeTypes.length; i++) {
            var label = 'Node';
            if (typeof this.config.NODE_STYLES[usedNodeTypes[i]] !== 'undefined') {
                label = this.config.NODE_STYLES[usedNodeTypes[i]].alias;
            }
            nodesToAdd.push({
                id: (100000 + i) + '',
                style: usedNodeTypes[i],
                label: label,
                widthConstraint: {
                    minimum: this.bigNodeSize,
                    maximum: this.bigNodeSize
                }
            });
        }
        for (var i = 0; i < usedEdgeTypes.length; i++) {
            var label = 'Default Edge';
            var edgeType = usedEdgeTypes[i];
            if (typeof this.config.ARROW_STYLES[edgeType] !== 'undefined') {
                label = this.config.ARROW_STYLES[edgeType].alias;
            }
            else {
                edgeType = usedEdgeTypes[i].replace(/graph/i, '');
                if (typeof this.config.ARROW_STYLES[edgeType] !== 'undefined') {
                    label = this.config.ARROW_STYLES[edgeType].alias;
                }
            }
            nodesToAdd.push({
                id: (200000 + i) + '',
                label: 'N',
                widthConstraint: {
                    minimum: this.smallNodeSize,
                    maximum: this.smallNodeSize
                }
            });
            nodesToAdd.push({
                id: (210000 + i) + '',
                label: 'N',
                widthConstraint: {
                    minimum: this.smallNodeSize,
                    maximum: this.smallNodeSize
                }
            });
            edgesToAdd.push({
                id: (300000 + i) + '',
                style: edgeType,
                label: label,
                from: (200000 + i) + '',
                to: (210000 + i) + ''
            });
        }
        (_a = this.originalEdges).push.apply(_a, edgesToAdd.map(function (e) { return visgraph_1.cleanEdge(e, _this.config.ARROW_STYLES); }));
        (_b = this.originalNodes).push.apply(_b, nodesToAdd.map(function (n) { return visgraph_1.cleanNode(n, _this.config.NODE_STYLES); }));
        this.startRendering();
    };
    LegendPanel.prototype.startRendering = function () {
        var _this = this;
        this.statusLogger.setStatusText('Rendering Legend...');
        this.nodes = new vis_1["default"].DataSet(this.originalNodes);
        this.edges = new vis_1["default"].DataSet(this.originalEdges);
        // create the network
        this.network = new vis_1["default"].Network(this.container, { nodes: this.nodes, edges: this.edges }, this.config.LEGEND_PANEL_OPTIONS);
        //network.startSimulation(10); 
        this.network.on('stabilizationIterationsDone', function () {
            _this.network.stopSimulation();
            var options = {
                physics: {
                    enabled: false
                }
            };
            _this.network.setOptions(options);
            _this.statusLogger.setStatusCursor('auto');
        });
        this.network.once('beforeDrawing', function () {
            _this.positionNodes();
            _this.network.fit();
            _this.statusLogger.setStatusText('');
        });
    };
    LegendPanel.prototype.positionNodes = function () {
        var nodeXY = this.network.DOMtoCanvas({ x: 48, y: 20 });
        var nodeSizeBefore = -1;
        for (var i = 0; i < this.originalNodes.length; i++) {
            var currNodeSize = this.originalNodes[i].widthConstraint.minimum;
            if (nodeSizeBefore == this.bigNodeSize && currNodeSize == this.smallNodeSize) {
                nodeXY.x += 110;
            }
            else if (nodeSizeBefore == this.smallNodeSize && currNodeSize == this.smallNodeSize && parseInt(this.originalNodes[i].id, 10) < 210000) {
                nodeXY.x += 50;
            }
            else if (nodeSizeBefore == this.bigNodeSize && currNodeSize == this.bigNodeSize) {
                nodeXY.x += 165;
            }
            else {
                nodeXY.x += 175;
            }
            this.network.body.nodes[this.originalNodes[i].id].x = nodeXY.x;
            this.network.body.nodes[this.originalNodes[i].id].y = nodeXY.y;
            nodeSizeBefore = currNodeSize;
            console.log(nodeXY);
        }
    };
    return LegendPanel;
}());
exports["default"] = LegendPanel;

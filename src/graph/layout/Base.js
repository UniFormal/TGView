"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var LayoutBase = /** @class */ (function () {
    function LayoutBase(nodes, edges, logger, ignoreEdgesByType) {
        this.logger = logger;
        this.countNodesInGraph = [];
        this.myAllNodes = nodes.map(CleanNode2LayoutNode); // TODO: Check if we do not already have the extra props
        this.edgesCount = edges.length;
        this.mapEdgesIntoNodes(edges, ignoreEdgesByType);
        this.identifySubgraphs();
    }
    LayoutBase.prototype.destroy = function () {
        this.myAllNodes = [];
        this.countNodesInGraph = [];
    };
    LayoutBase.prototype.mapEdgesIntoNodes = function (edges, ignoreEdgesByType) {
        this.logger.setStatusText('Mapping Edges to Nodes...');
        var mappedNodes = {};
        for (var i = 0; i < this.myAllNodes.length; i++) {
            this.myAllNodes[i].toConnected = [];
            this.myAllNodes[i].fromConnected = [];
            this.myAllNodes[i].connectedNodes = [];
            this.myAllNodes[i].connectedNodesById = {};
            mappedNodes[this.myAllNodes[i].id] = this.myAllNodes[i];
            this.myAllNodes[i].modularityPart = 0;
            this.myAllNodes[i].idx = i;
        }
        for (var i = 0; i < edges.length; i++) {
            if (edges[i].from == undefined || mappedNodes[edges[i].from] == undefined) {
                console.log('Not found: ' + edges[i].from);
            }
            else {
                if (edges[i].to == undefined || mappedNodes[edges[i].to] == undefined) {
                    console.log('Not found: ' + edges[i].to);
                }
                else {
                    if (typeof ignoreEdgesByType == 'undefined' || typeof ignoreEdgesByType[edges[i].style] != 'undefined' || typeof ignoreEdgesByType['graph' + edges[i].style] != 'undefined') {
                        mappedNodes[edges[i].from].toConnected.push(mappedNodes[edges[i].to]);
                        mappedNodes[edges[i].to].fromConnected.push(mappedNodes[edges[i].from]);
                        mappedNodes[edges[i].to].connectedNodes.push(mappedNodes[edges[i].from]);
                        mappedNodes[edges[i].from].connectedNodes.push(mappedNodes[edges[i].to]);
                        mappedNodes[edges[i].to].connectedNodesById[edges[i].from] = (mappedNodes[edges[i].from]);
                        mappedNodes[edges[i].from].connectedNodesById[edges[i].to] = (mappedNodes[edges[i].to]);
                    }
                }
            }
        }
    };
    LayoutBase.prototype.identifySubgraphs = function () {
        this.logger.setStatusText('Identify Subgraphs...');
        var nodesToCheck = [];
        var graphNumber = 1;
        // iterate over all the nodes
        for (var i = 0; i < this.myAllNodes.length; i++) {
            var n = this.myAllNodes[i];
            if (n.graphNumber < 1 && n.hidden != true) {
                nodesToCheck.push(n);
                this.countNodesInGraph.push(0);
                while (nodesToCheck.length > 0) {
                    this.countNodesInGraph[this.countNodesInGraph.length - 1]++;
                    var currNode = nodesToCheck.pop();
                    currNode.graphNumber = graphNumber;
                    for (var j = 0; j < currNode.connectedNodes.length; j++) {
                        var u = currNode.connectedNodes[j];
                        if (u.graphNumber < 1 && u.hidden != true) // TODO: Was n.hidden, probably u.hidden
                         {
                            nodesToCheck.push(u);
                        }
                    }
                }
                graphNumber++;
            }
        }
    };
    return LayoutBase;
}());
exports["default"] = LayoutBase;
function CleanNode2LayoutNode(node) {
    if (node.x === undefined || node.y === undefined) {
        console.warn('Node ' + node.id + ' is missing x or y, using (0, 0)');
    }
    return __assign({ graphNumber: -1, hidden: false, toConnected: [], fromConnected: [], connectedNodes: [], connectedNodesById: {}, modularityPart: 0, idx: -1, overallLength: 0, overallVisited: 0, overallWeight: 0, visited: false, forcesFixed: false, dispX: 0, dispY: 0, x: 0, y: 0 }, node);
}

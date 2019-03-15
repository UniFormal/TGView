"use strict";
exports.__esModule = true;
// import {setLocation, getRandomColor, rainbow, getParameterByName, getStartToEnd} from './utils.js';
var utils_1 = require("../utils");
var vis_1 = require("vis");
var visgraph_1 = require("./visgraph");
var Clusterer_1 = require("./layout/Clusterer");
var Optimizer_1 = require("./layout/Optimizer");
var jquery_1 = require("jquery");
var images_1 = require("../css/images");
var TheoryGraph = /** @class */ (function () {
    function TheoryGraph(config, dom, containerName, statusLogger, actionLogger) {
        this.config = config;
        this.dom = dom;
        this.containerName = containerName;
        this.statusLogger = statusLogger;
        this.actionLogger = actionLogger;
        // we store the nodes and edges in three ways:
        // 1. in 'original' form, as a 'save' state we can revert to
        // and access very quickly
        this.originalNodes = [];
        this.originalEdges = [];
        // 2. in 'dataset' form, that represent the current editor state
        this.nodes = null;
        this.edges = null;
        // 3. Inside of the network itself (essentially synced with 2.)
        this.network = null;
        //
        // CLUSTER INFO
        //
        /** a counter to generate unique cluster ids */
        this.clusterId = 0;
        /** the ids of all clusters */
        this.allClusters = [];
        /** the positions of nodes within clusters */
        this.clusterPositions = {};
        /** last zoom level used for clusters */
        this.lastClusterZoomLevel = 0;
        /** the zoom levels of all clusters */
        this.zoomClusters = [];
        /** all hidden nodes */
        this.hiddenNodes = {};
        /** edges that are hidden */
        this.edgesNameToHide = [];
        /** boolean to set manual focus mode */
        this.manualFocus = false;
        /** regions of selected nodes */
        this.allNodeRegions = [];
        /** nodes which have been manually hidden */
        this.allManuallyHiddenNodes = [];
        this.moveRegionHold = false;
        this.moveRegionId = 0;
        this.addNodeToRegion = false;
        // image caches
        this.removeRegionImg = new Image();
        this.moveRegionImg = new Image();
        this.addNodeToRegionImg = new Image();
        this.removeRegionImg.src = images_1.deleteRegionPng;
        this.moveRegionImg.src = images_1.moveRegionPng;
        this.addNodeToRegionImg.src = images_1.addRegionPng;
    }
    TheoryGraph.prototype.destroy = function () {
        this.dom.$('.custom-menu li').off('click');
        this.originalNodes = [];
        this.originalEdges = [];
        if (this.edges) {
            this.edges.clear();
        }
        this.edges = null;
        if (this.nodes) {
            this.nodes.clear();
        }
        this.nodes = null;
        if (this.network) {
            this.network.destroy();
            this.network = null;
        }
        this.allClusters = [];
        this.clusterPositions = {};
        this.zoomClusters = [];
        this.hiddenNodes = {};
        this.edgesNameToHide = [];
        this.onConstructionDone = undefined;
        this.allNodeRegions = [];
        this.allManuallyHiddenNodes = [];
        if (this.internalOptimizer) {
            this.internalOptimizer.destroy();
        }
    };
    TheoryGraph.prototype.focusOnNodes = function (nodeIds) {
        var nodesToShow = [];
        if (typeof nodeIds == 'undefined') {
            nodeIds = this.network.getSelectedNodes().map(function (e) { return e.toString(); });
        }
        if (nodeIds == undefined || nodeIds.length == 0) {
            return;
        }
        nodesToShow = nodesToShow.concat(nodeIds);
        var edgesToShow = [];
        for (var i = 0; i < nodeIds.length; i++) {
            var middleNodePos = this.network.getPositions(nodeIds[i]);
            var connectedEdges = this.network.getConnectedEdges(nodeIds[i]);
            edgesToShow = edgesToShow.concat(connectedEdges.map(function (e) { return e.toString(); }));
            var toNodes = this.network.getConnectedNodes(nodeIds[i], 'to').map(function (e) { return e.toString(); });
            var fromNodes = this.network.getConnectedNodes(nodeIds[i], 'from').map(function (e) { return e.toString(); });
            if (nodeIds.length == 1) {
                for (var j = 0; j < fromNodes.length; j++) {
                    if ((middleNodePos.y - this.network.body.nodes[fromNodes[j]].y) < 200) {
                        this.network.body.nodes[fromNodes[j]].y = middleNodePos.y - (Math.random() * 50 + 150);
                    }
                    if (Math.abs(middleNodePos.x - this.network.body.nodes[fromNodes[j]].x) > 200) {
                        this.network.body.nodes[fromNodes[j]].x = middleNodePos.x + Math.random() * 400 - 200;
                    }
                }
                for (var j = 0; j < toNodes.length; j++) {
                    if ((middleNodePos.y - this.network.body.nodes[toNodes[j]].y) > 200) {
                        this.network.body.nodes[toNodes[j]].y = middleNodePos.y + (Math.random() * 50 + 150);
                    }
                    if (Math.abs(middleNodePos.x - this.network.body.nodes[fromNodes[j]].x) > 200) {
                        this.network.body.nodes[toNodes[j]].x = middleNodePos.x + Math.random() * 400 - 200;
                    }
                }
            }
            nodesToShow = nodesToShow.concat(fromNodes);
            nodesToShow = nodesToShow.concat(toNodes);
        }
        this.hideNodesById(nodesToShow, false);
        var nodesToHide = [];
        for (var i = 0; i < this.originalNodes.length; i++) {
            this.originalNodes[i].y = this.network.body.nodes[this.originalNodes[i].id].y;
            this.originalNodes[i].x = this.network.body.nodes[this.originalNodes[i].id].x;
            if (nodesToShow.indexOf(this.originalNodes[i].id) == -1) {
                nodesToHide.push(this.originalNodes[i].id);
                //originalNodes[i].hidden=true;
            }
            else {
                //originalNodes[i].hidden=false;
            }
        }
        this.hideNodesById(nodesToHide, true);
        //internalOptimizer.SolveUsingForces(25, 50/originalNodes.length*nodesToShow.length, false);
        if (nodeIds.length == 1) {
            if (!this.internalOptimizer) {
                throw new Error('internalOptimizer not initialized');
            }
            this.internalOptimizer.SolveUsingForces(25, 12, false);
        }
        var newNodePositions = [];
        for (var i = 0; i < this.originalNodes.length; i++) {
            newNodePositions.push({
                id: this.originalNodes[i].id,
                x: this.originalNodes[i].x,
                y: this.originalNodes[i].y
            });
        }
        this.nodes.update(newNodePositions); // TODO: Fix nodes type
        this.statusLogger.setStatusText('');
        var edgesToHide = [];
        for (var i = 0; i < this.originalEdges.length; i++) {
            edgesToHide.push(this.originalEdges[i].id); // TODO: Fix originalEdges type
        }
        this.hideEdgesById(edgesToHide, true);
        this.hideEdgesById(edgesToShow, false);
    };
    TheoryGraph.prototype.manipulateSelectedRegion = function (coords) {
        // If the document is hold somewhere
        var updateNodes = [];
        var redraw = false;
        var selectRegion = false;
        if (this.moveRegionHold == true) {
            if (this.oldRegionPosition === undefined) {
                throw new Error('trying to manuipulate selected region, but oldRegionPosition is undefined');
            }
            var newRegionPosition = coords;
            var difX = newRegionPosition.x - this.oldRegionPosition.x;
            var difY = newRegionPosition.y - this.oldRegionPosition.y;
            var positions = this.network.getPositions(this.allNodeRegions[this.moveRegionId].nodeIds);
            for (var i = 0; i < this.allNodeRegions[this.moveRegionId].nodeIds.length; i++) {
                if (typeof this.allNodeRegions[this.moveRegionId].nodeIds[i] != 'undefined') {
                    updateNodes.push({ 'id': this.allNodeRegions[this.moveRegionId].nodeIds[i], 'x': this.network.body.nodes[this.allNodeRegions[this.moveRegionId].nodeIds[i]].x + difX, 'y': this.network.body.nodes[this.allNodeRegions[this.moveRegionId].nodeIds[i]].y + difY });
                }
            }
            this.moveRegionHold = false;
            this.statusLogger.setStatusCursor('auto');
            this.oldRegionPosition = coords;
            selectRegion = true;
            redraw = true;
            this.nodes.update(updateNodes);
        }
        else {
            for (var i = 0; i < this.allNodeRegions.length; i++) {
                if (this.allNodeRegions[i].selected == true) {
                    if (this.allNodeRegions[i].left - 44 <= coords.x && this.allNodeRegions[i].left >= coords.x && this.allNodeRegions[i].top - 6 <= coords.y && this.allNodeRegions[i].top + 34 >= coords.y) {
                        this.removeNodeRegion(i);
                        redraw = true;
                        break;
                    }
                    else if (this.allNodeRegions[i].left - 42 <= coords.x && this.allNodeRegions[i].left >= coords.x && this.allNodeRegions[i].top + 40 <= coords.y && this.allNodeRegions[i].top + 74 >= coords.y) {
                        this.moveRegionHold = true;
                        this.moveRegionId = i;
                        this.oldRegionPosition = coords;
                        this.statusLogger.setStatusCursor('pointer');
                        selectRegion = true;
                        break;
                    }
                    else if (this.allNodeRegions[i].left - 74 <= coords.x && this.allNodeRegions[i].left >= coords.x && this.allNodeRegions[i].top + 86 <= coords.y && this.allNodeRegions[i].top + 122 >= coords.y) {
                        this.addNodeRegionId = i;
                        this.addNodeToRegion = true;
                        this.statusLogger.setStatusCursor('copy');
                        selectRegion = true;
                        break;
                    }
                }
            }
        }
        if (redraw == true) {
            this.network.redraw();
        }
        return selectRegion;
    };
    TheoryGraph.prototype.selectRegion = function (coords) {
        var redraw = false;
        for (var i = 0; i < this.allNodeRegions.length; i++) {
            this.allNodeRegions[i].selected = false;
            if (this.allNodeRegions[i].left <= coords.x && this.allNodeRegions[i].right >= coords.x && this.allNodeRegions[i].top <= coords.y && this.allNodeRegions[i].bottom >= coords.y) {
                this.allNodeRegions[i].selected = true;
                redraw = true;
            }
        }
        if (redraw == true) {
            this.network.redraw();
        }
    };
    /**
     * Removes a region from the graph
     * @param index Index of region to remove
     */
    TheoryGraph.prototype.removeNodeRegion = function (index) {
        this.allNodeRegions.splice(index, 1);
        this.network.redraw();
    };
    TheoryGraph.prototype.drawAllColoredRegionsOnCanvas = function (ctx) {
        for (var i = 0; i < this.allNodeRegions.length; i++) {
            ctx.fillStyle = this.allNodeRegions[i].color;
            ctx.strokeStyle = this.allNodeRegions[i].color;
            ctx.setLineDash([8]);
            var oldWidth = ctx.lineWidth;
            if (this.allNodeRegions[i].selected == true) {
                ctx.drawImage(this.removeRegionImg, this.allNodeRegions[i].left - 46, this.allNodeRegions[i].top - 8, 38, 38);
                ctx.drawImage(this.moveRegionImg, this.allNodeRegions[i].left - 46, this.allNodeRegions[i].top + 38, 38, 38);
                ctx.drawImage(this.addNodeToRegionImg, this.allNodeRegions[i].left - 46, this.allNodeRegions[i].top + 84, 38, 38);
                ctx.lineWidth = 10;
            }
            else {
                ctx.lineWidth = 6;
            }
            ctx.strokeRect(this.allNodeRegions[i].left, this.allNodeRegions[i].top, this.allNodeRegions[i].right - this.allNodeRegions[i].left, this.allNodeRegions[i].bottom - this.allNodeRegions[i].top);
            ctx.setLineDash([]);
            ctx.lineWidth = oldWidth;
            //ctx.globalAlpha = 0.2;			
            //ctx.fillRect(allNodeRegions[i].left,allNodeRegions[i].top,allNodeRegions[i].right-allNodeRegions[i].left,allNodeRegions[i].bottom-allNodeRegions[i].top);
            //ctx.globalAlpha = 1.0;
        }
    };
    TheoryGraph.prototype.drawAllColoredRegions = function (ctx) {
        if (this.allNodeRegions.length == 0) {
            return;
        }
        for (var i = 0; i < this.allNodeRegions.length; i++) {
            this.allNodeRegions[i].left = 10000000;
            this.allNodeRegions[i].right = -10000000;
            this.allNodeRegions[i].top = 10000000;
            this.allNodeRegions[i].bottom = -10000000;
            this.allNodeRegions[i].mappedNodes = {};
            for (var j = 0; j < this.allNodeRegions[i].nodeIds.length; j++) {
                if (this.hiddenNodes[this.allNodeRegions[i].nodeIds[j]] == true) {
                    continue;
                }
                var box = this.network.getBoundingBox(this.allNodeRegions[i].nodeIds[j]);
                this.allNodeRegions[i].left = Math.min(this.allNodeRegions[i].left, box.left);
                this.allNodeRegions[i].right = Math.max(this.allNodeRegions[i].right, box.right);
                this.allNodeRegions[i].top = Math.min(this.allNodeRegions[i].top, box.top);
                this.allNodeRegions[i].bottom = Math.max(this.allNodeRegions[i].bottom, box.bottom);
                this.allNodeRegions[i].mappedNodes[this.allNodeRegions[i].nodeIds[j]] = 1;
            }
            var distance = (i * 4) % 20 + 8;
            if (this.allNodeRegions[i].left == 10000000) {
                continue;
            }
            this.allNodeRegions[i].left -= distance;
            this.allNodeRegions[i].right += distance;
            this.allNodeRegions[i].top -= distance;
            this.allNodeRegions[i].bottom += distance;
            ctx.fillStyle = this.allNodeRegions[i].color;
            ctx.strokeStyle = this.allNodeRegions[i].color;
            if (this.allNodeRegions[i].selected == true) {
                ctx.globalAlpha = 0.5;
            }
            else {
                ctx.globalAlpha = 0.2;
            }
            ctx.fillRect(this.allNodeRegions[i].left, this.allNodeRegions[i].top, this.allNodeRegions[i].right - this.allNodeRegions[i].left, this.allNodeRegions[i].bottom - this.allNodeRegions[i].top);
            ctx.globalAlpha = 1.0;
        }
        this.repositionNodes();
    };
    // TODO: Move to utils?
    TheoryGraph.prototype.intersectRect = function (a, b) {
        return (a.left <= b.right &&
            b.left <= a.right &&
            a.top <= b.bottom &&
            b.top <= a.bottom);
    };
    TheoryGraph.prototype.liesInAnyRegion = function (box, id) {
        for (var j = 0; j < this.allNodeRegions.length; j++) {
            if (typeof this.allNodeRegions[j].mappedNodes[id] == 'undefined' && this.intersectRect(box, this.allNodeRegions[j]) == true) {
                return j;
            }
        }
        return -1;
    };
    TheoryGraph.prototype.repositionNodes = function () {
        //var allNodePositions=network.getPositions();
        var newPositions = [];
        for (var i = 0; i < this.originalNodes.length; i++) {
            var box = this.network.getBoundingBox(this.originalNodes[i].id);
            var avgX = 0;
            var avgY = 0;
            var countAvg = 0;
            for (var j = 0; j < this.allNodeRegions.length; j++) {
                if (typeof this.allNodeRegions[j].mappedNodes[this.originalNodes[i].id] != 'undefined') {
                    avgX += (this.allNodeRegions[j].left + this.allNodeRegions[j].right) / 2;
                    avgY += (this.allNodeRegions[j].top + this.allNodeRegions[j].bottom) / 2;
                    countAvg++;
                }
            }
            avgX /= countAvg;
            avgY /= countAvg;
            for (var j = 0; j < this.allNodeRegions.length; j++) {
                if (typeof this.allNodeRegions[j].mappedNodes[this.originalNodes[i].id] == 'undefined' && this.intersectRect(box, this.allNodeRegions[j]) == true) {
                    var minDirection = 0;
                    var minDistance;
                    var tmp;
                    var width = box.right - box.left;
                    var height = box.bottom - box.top;
                    if (countAvg == 0) {
                        minDistance = Math.abs(box.right - this.allNodeRegions[j].left);
                        tmp = Math.abs(box.left - this.allNodeRegions[j].right);
                        if (tmp < minDistance) {
                            minDirection = 1;
                            minDistance = tmp;
                        }
                        tmp = Math.abs(box.bottom - this.allNodeRegions[j].top);
                        if (tmp < minDistance) {
                            minDirection = 2;
                            minDistance = tmp;
                        }
                        tmp = Math.abs(box.top - this.allNodeRegions[j].bottom);
                        if (tmp < minDistance) {
                            minDirection = 3;
                            minDistance = tmp;
                        }
                    }
                    else {
                        minDistance = Math.abs(this.allNodeRegions[j].left - width / 1.8 - avgX) + Math.abs((box.bottom + box.top) / 2 - avgY);
                        tmp = Math.abs(this.allNodeRegions[j].right + width / 1.8 - avgX) + Math.abs((box.bottom + box.top) / 2 - avgY);
                        if (tmp < minDistance) {
                            minDirection = 1;
                            minDistance = tmp;
                        }
                        tmp = Math.abs(this.allNodeRegions[j].top - height / 1.8 - avgY) + Math.abs((box.left + box.right) / 2 - avgX);
                        if (tmp < minDistance) {
                            minDirection = 2;
                            minDistance = tmp;
                        }
                        tmp = Math.abs(this.allNodeRegions[j].bottom + height / 1.8 - avgY) + Math.abs((box.left + box.right) / 2 - avgX);
                        if (tmp < minDistance) {
                            minDirection = 3;
                            minDistance = tmp;
                        }
                    }
                    if (minDirection == 0) {
                        var intersectingRegion = 0;
                        var newX = this.allNodeRegions[j].left - width / 1.8;
                        while (intersectingRegion != -1) {
                            box.left = newX - width / 2;
                            box.right = newX + width / 2;
                            intersectingRegion = this.liesInAnyRegion(box, this.originalNodes[i].id);
                            if (intersectingRegion != -1) {
                                newX = this.allNodeRegions[intersectingRegion].left - width / 1.8;
                            }
                        }
                        newPositions.push({ 'x': newX, 'id': this.originalNodes[i].id });
                    }
                    else if (minDirection == 1) {
                        var intersectingRegion = 0;
                        var newX = this.allNodeRegions[j].right + width / 1.8;
                        while (intersectingRegion != -1) {
                            box.left = newX - width / 2;
                            box.right = newX + width / 2;
                            intersectingRegion = this.liesInAnyRegion(box, this.originalNodes[i].id);
                            if (intersectingRegion != -1) {
                                newX = this.allNodeRegions[intersectingRegion].right + width / 1.8;
                            }
                        }
                        newPositions.push({ 'x': newX, 'id': this.originalNodes[i].id });
                    }
                    else if (minDirection == 2) {
                        var intersectingRegion = 0;
                        var newY = this.allNodeRegions[j].top - height / 1.8;
                        while (intersectingRegion != -1) {
                            box.top = newY - height / 2;
                            box.bottom = newY + height / 2;
                            intersectingRegion = this.liesInAnyRegion(box, this.originalNodes[i].id);
                            if (intersectingRegion != -1) {
                                newY = this.allNodeRegions[intersectingRegion].top - height / 1.8;
                            }
                        }
                        newPositions.push({ 'y': newY, 'id': this.originalNodes[i].id });
                    }
                    else if (minDirection == 3) {
                        var intersectingRegion = 0;
                        var newY = this.allNodeRegions[j].bottom + height / 1.8;
                        while (intersectingRegion != -1) {
                            box.top = newY - height / 2;
                            box.bottom = newY + height / 2;
                            intersectingRegion = this.liesInAnyRegion(box, this.originalNodes[i].id);
                            if (intersectingRegion != -1) {
                                newY = this.allNodeRegions[intersectingRegion].bottom + height / 1.8;
                            }
                        }
                        newPositions.push({ 'y': newY, 'id': this.originalNodes[i].id });
                    }
                }
            }
        }
        for (var i = 0; i < newPositions.length; i++) {
            var position = newPositions[i];
            if (typeof position.x != 'undefined') {
                this.network.body.nodes[newPositions[i].id].x = position.x;
            }
            if (typeof position.y != 'undefined') {
                this.network.body.nodes[newPositions[i].id].y = position.y;
            }
        }
        // Check for intersecting regions, which do not share nodes
        // 1. Check region1 and region2 intersect
        // 2. Extract all intersecting nodes
        // 3. Remove intersecting nodes and calculate new bounding box
        // 4. If still intersecting --> reposition nodes
        // 5. Reposition nodes: move all nodes to region center and apply few iterations of forces driven layout
    };
    TheoryGraph.prototype.selectNodesByType = function (type) {
        var nodeIds = this.network.getSelectedNodes().map(function (e) { return e.toString(); });
        for (var i = 0; i < this.originalNodes.length; i++) {
            var curNode = this.originalNodes[i];
            if (curNode['style'] == type) {
                nodeIds.push(curNode.id.toString());
            }
        }
        this.actionLogger.addToStateHistory({ func: 'select', param: { nodes: nodeIds } });
        this.network.selectNodes(nodeIds);
    };
    TheoryGraph.prototype.selectEdgesById = function (edgeIds) {
        this.actionLogger.addToStateHistory({ func: 'selectEdges', param: { edges: edgeIds } });
        this.network.selectEdges(edgeIds);
    };
    TheoryGraph.prototype.selectEdgesByType = function (type) {
        var edgeIds = [];
        for (var i = 0; i < this.originalEdges.length; i++) {
            var currEdge = this.originalEdges[i];
            if (currEdge['style'] == type) {
                edgeIds.push(currEdge.id);
            }
        }
        this.actionLogger.addToStateHistory({ func: 'selectEdges', param: { 'edges': edgeIds } });
        this.network.selectEdges(edgeIds);
    };
    TheoryGraph.prototype.getUsedNodeTypes = function () {
        var usedNodeTypes = [];
        for (var i = 0; i < this.originalNodes.length; i++) {
            if (typeof this.originalNodes[i]['style'] != 'undefined' && usedNodeTypes.indexOf(this.originalNodes[i].style) == -1) {
                usedNodeTypes.push(this.originalNodes[i].style);
            }
        }
        return usedNodeTypes;
    };
    TheoryGraph.prototype.getUsedEdgeTypes = function () {
        var usedEdgeTypes = [];
        for (var i = 0; i < this.originalEdges.length; i++) {
            if (typeof this.originalEdges[i]['style'] != 'undefined' && usedEdgeTypes.indexOf(this.originalEdges[i]['style']) == -1) {
                usedEdgeTypes.push(this.originalEdges[i]['style']);
            }
        }
        return usedEdgeTypes;
    };
    TheoryGraph.prototype.graphToIFrameString = function (parameterName, onlySelected, compressionRate) {
        if (typeof parameterName == 'undefined') {
            parameterName = 'tgviewGraphData_' + Math.floor((new Date()).getTime() / 1000) + '_' + Math.floor(Math.random() * 1000);
        }
        if (typeof onlySelected == 'undefined') {
            onlySelected = false;
        }
        if (typeof compressionRate == 'undefined') {
            compressionRate = 0;
        }
        //TODO: what is this?, looks like an unsafe eval() being called somewhere
        return { 'storage': 'localStorage.setItem(\'' + parameterName + '\', \'' + this.generateCompressedJSON(onlySelected, compressionRate).split('\'').join('\\\'') + '\');', 'uri': location.protocol + '//' + location.host + location.pathname + '?source=iframe&uri=' + parameterName, 'id': parameterName };
    };
    TheoryGraph.prototype.graphToLocalStorageString = function (parameterName, onlySelected, compressionRate) {
        if (typeof parameterName == 'undefined') {
            parameterName = 'tgviewGraphData_' + Math.floor((new Date()).getTime() / 1000) + '_' + Math.floor(Math.random() * 1000);
        }
        if (typeof onlySelected == 'undefined') {
            onlySelected = false;
        }
        if (typeof compressionRate == 'undefined') {
            compressionRate = 0;
        }
        return { 'storage': 'localStorage.setItem(\'' + parameterName + '\', \'' + this.generateCompressedJSON(onlySelected, compressionRate).split('\'').join('\\\'') + '\');', 'uri': location.protocol + '//' + location.host + location.pathname + '?source=param&uri=' + parameterName, 'name': parameterName };
    };
    TheoryGraph.prototype.graphToURIParameterString = function (onlySelected, compressionRate) {
        if (typeof onlySelected == 'undefined') {
            onlySelected = false;
        }
        if (typeof compressionRate == 'undefined') {
            compressionRate = 2;
        }
        return location.protocol + '//' + location.host + location.pathname + '?source=param&uri=' + encodeURI(this.generateCompressedJSON(onlySelected, compressionRate));
    };
    TheoryGraph.prototype.graphToStringJSON = function (onlySelected, compressionRate) {
        if (typeof onlySelected == 'undefined') {
            onlySelected = false;
        }
        if (typeof compressionRate == 'undefined') {
            compressionRate = 0;
        }
        return this.generateCompressedJSON(onlySelected, compressionRate);
    };
    TheoryGraph.prototype.generateCompressedJSON = function (onlySelected, compressionRate) {
        // TODO: Use JSON.stringify for cleaner code
        var allNodePositions = {};
        var json = '{"nodes":[';
        if (typeof onlySelected == 'undefined') {
            onlySelected = false;
        }
        if (typeof compressionRate == 'undefined') {
            compressionRate = 0;
        }
        if (compressionRate == 0) {
            allNodePositions = this.network.getPositions(); // TODO: Is this safe?
        }
        var nodeIds = undefined;
        var nodeIdMapping = {};
        if (onlySelected == true) {
            nodeIds = this.network.getSelectedNodes();
            for (var i = 0; i < nodeIds.length; i++) {
                nodeIdMapping[nodeIds[i]] = 1;
            }
        }
        var mapping = {};
        var counter = 0;
        for (var i = 0; i < this.originalNodes.length; i++) {
            var currentNodeJson = '{';
            var curNode = this.originalNodes[i];
            if (onlySelected == true && typeof nodeIdMapping[curNode.id] == 'undefined') {
                continue;
            }
            if (typeof mapping[curNode.id] == 'undefined') {
                mapping[curNode.id] = counter;
                counter++;
            }
            currentNodeJson += '"id":"' + curNode.id + '",';
            currentNodeJson += '"label":"' + curNode.label + '",';
            currentNodeJson += '"style":"' + curNode.style + '"';
            if (curNode.shape) {
                currentNodeJson += ',"shape":"' + curNode.shape + '"';
            }
            if (curNode.mathml) {
                currentNodeJson += ',"mathml":"' + curNode.mathml.split('"').join('\'') + '"';
            }
            if (curNode.previewhtml) {
                currentNodeJson += ',"previewhtml":"' + curNode.previewhtml.split('"').join('\'') + '"';
            }
            if (typeof curNode.url != 'undefined' && curNode.url != '' && compressionRate < 2) {
                currentNodeJson += ',"url":"' + curNode.url + '"';
            }
            if (compressionRate == 0) {
                currentNodeJson += ',"x":"' + allNodePositions[curNode.id].x + '"';
                currentNodeJson += ',"y":"' + allNodePositions[curNode.id].y + '"';
            }
            currentNodeJson += '},';
            json += currentNodeJson;
        }
        json = json.substring(0, json.length - 1) + '],"edges":[';
        for (var i = 0; i < this.originalEdges.length; i++) {
            var currEdge = this.originalEdges[i];
            if (typeof mapping[currEdge.to] != 'undefined' && typeof mapping[currEdge.from] != 'undefined') {
                var currentEdgeJson = '{';
                currentEdgeJson += '"to":"' + currEdge.to + '",';
                currentEdgeJson += '"from":"' + currEdge.from + '",';
                currentEdgeJson += '"style":"' + currEdge.style + '"';
                if (typeof currEdge.label != 'undefined' && currEdge.label != '' && compressionRate < 2) {
                    currentEdgeJson += ',"label":"' + currEdge.label + '"';
                }
                if (typeof currEdge.weight != 'undefined' && currEdge.weight != '' && compressionRate < 2) {
                    currentEdgeJson += ',"weight":"' + currEdge.weight + '"';
                }
                if (typeof currEdge.url != 'undefined' && currEdge.url != '' && compressionRate < 2) {
                    currentEdgeJson += ',"url":"' + currEdge.url + '"';
                }
                currentEdgeJson += '},';
                json += currentEdgeJson;
            }
        }
        if (this.allClusters.length > 0) {
            json = json.substring(0, json.length - 1) + '],"cluster":[';
            for (var i = 0; i < this.allClusters.length; i++) {
                var currentClusterJson = '{"nodeIds":';
                currentClusterJson += JSON.stringify(this.clusterPositions[this.allClusters[i]][0]);
                currentClusterJson += ',';
                currentClusterJson += '"nodePositions":';
                currentClusterJson += JSON.stringify(this.clusterPositions[this.allClusters[i]][1]);
                currentClusterJson += '';
                currentClusterJson += '},';
                json += currentClusterJson;
            }
        }
        json = json.substring(0, json.length - 1) + ']}';
        return json;
    };
    TheoryGraph.prototype.loadGraphByLocalStorage = function (parameterName) {
        if (typeof parameterName == 'undefined') {
            parameterName = 'tgviewGraphData';
        }
        var graphData = localStorage.getItem(parameterName);
        this.drawGraph(JSON.parse(graphData));
    };
    TheoryGraph.prototype.loadGraphByURIParameter = function (_) {
        var graphData = utils_1.getParameterByName('uri');
        this.drawGraph(JSON.parse(graphData));
    };
    TheoryGraph.prototype.hideEdges = function (type, hideEdge) {
        this.setEdgesHidden(type, hideEdge);
        var edgesToHide = [];
        for (var i = 0; i < this.originalEdges.length; i++) {
            //console.log(type+""+originalEdges[i]["style"]);
            if (type == this.originalEdges[i]['style'] || ('graph' + type) == this.originalEdges[i]['style']) {
                if (hideEdge == true) {
                    edgesToHide.push({ id: this.originalEdges[i]['id'], hidden: hideEdge });
                }
                else if (hideEdge == false && (this.hiddenNodes[this.originalEdges[i].to] == false && this.hiddenNodes[this.originalEdges[i].from] == false)) {
                    edgesToHide.push({ id: this.originalEdges[i]['id'], hidden: hideEdge });
                }
            }
        }
        this.edges.update(edgesToHide);
        //actionLoggerIn.addToStateHistory({func: "hideEdges", params: {"hideEdges":edgesToHide,"hidden":hideEdge}});
    };
    TheoryGraph.prototype.hideEdgesById = function (edgeIds, hideEdge) {
        if (typeof edgeIds == 'undefined' || edgeIds.length == 0)
            return;
        var edgesToHide = [];
        for (var i = 0; i < edgeIds.length; i++) {
            edgesToHide.push({ id: edgeIds[i], hidden: hideEdge });
        }
        this.edges.update(edgesToHide);
        this.actionLogger.addToStateHistory({ func: 'hideEdges', param: { 'hideEdges': edgesToHide, 'hidden': hideEdge } });
    };
    TheoryGraph.prototype.showAllManuallyHiddenNodes = function () {
        var nodesToHide = [];
        var edgesToHide = [];
        for (var i = 0; i < this.allManuallyHiddenNodes.length; i++) {
            for (var j = 0; j < this.allManuallyHiddenNodes[i].nodes.length; j++) {
                this.allManuallyHiddenNodes[i].nodes[j].hidden = false;
                nodesToHide.push(this.allManuallyHiddenNodes[i].nodes[j]);
                this.hiddenNodes[this.allManuallyHiddenNodes[i].nodes[j].id] = false;
            }
            this.nodes.update(this.allManuallyHiddenNodes[i].nodes);
            for (var j = 0; j < this.allManuallyHiddenNodes[i].edges.length; j++) {
                this.allManuallyHiddenNodes[i].edges[j].hidden = false;
                edgesToHide.push(this.allManuallyHiddenNodes[i].edges[j]);
            }
            this.edges.update(this.allManuallyHiddenNodes[i].edges);
        }
        this.allManuallyHiddenNodes = [];
        this.actionLogger.addToStateHistory({ func: 'hideNodes', param: { 'hideNodes': nodesToHide, 'hideEdges': edgesToHide, 'hidden': false } });
    };
    TheoryGraph.prototype.hideNodesById = function (nodeIds, hideNode) {
        if (typeof nodeIds == 'undefined' || nodeIds.length == 0) {
            nodeIds = this.network.getSelectedNodes().map(function (e) { return e.toString(); });
        }
        var nodesToHide = [];
        for (var i = 0; i < nodeIds.length; i++) {
            nodesToHide.push({ id: nodeIds[i], hidden: hideNode });
            this.hiddenNodes[nodeIds[i]] = hideNode;
        }
        this.nodes.update(nodesToHide);
        var edgesToHide = [];
        for (var i = 0; i < this.originalEdges.length; i++) {
            if (hideNode == true && (this.hiddenNodes[this.originalEdges[i].to] == true || this.hiddenNodes[this.originalEdges[i].from] == true)) {
                edgesToHide.push({ id: this.originalEdges[i]['id'], hidden: hideNode });
            }
            if (hideNode == false && (this.hiddenNodes[this.originalEdges[i].to] == false && this.hiddenNodes[this.originalEdges[i].from] == false)) {
                edgesToHide.push({ id: this.originalEdges[i]['id'], hidden: hideNode });
            }
        }
        this.edges.update(edgesToHide);
        this.allManuallyHiddenNodes.push({ 'nodes': nodesToHide, 'edges': edgesToHide });
        this.actionLogger.addToStateHistory({ func: 'hideNodes', param: { 'hideNodes': nodesToHide, 'hideEdges': edgesToHide, 'hidden': hideNode } });
    };
    TheoryGraph.prototype.hideNodes = function (type, hideEdge) {
        //that.setEdgesHidden(type, hideEdge);
        var nodesToHide = [];
        for (var i = 0; i < this.originalNodes.length; i++) {
            //console.log(type+""+originalEdges[i]["style"]);
            if (type == this.originalNodes[i]['style'] || ('graph' + type) == this.originalNodes[i]['style']) {
                nodesToHide.push({ id: this.originalNodes[i]['id'], hidden: hideEdge });
                this.hiddenNodes[this.originalNodes[i]['id']] = hideEdge;
            }
        }
        this.nodes.update(nodesToHide);
        var mappedEdges = {};
        for (var i = 0; i < this.edgesNameToHide.length; i++) {
            mappedEdges[this.edgesNameToHide[i].type] = this.edgesNameToHide[i].hidden;
        }
        var edgesToHide = [];
        for (var i = 0; i < this.originalEdges.length; i++) {
            if (hideEdge == true && (this.hiddenNodes[this.originalEdges[i].to] == true || this.hiddenNodes[this.originalEdges[i].from] == true)) {
                edgesToHide.push({ id: this.originalEdges[i]['id'], hidden: hideEdge });
            }
            if (typeof mappedEdges[this.originalEdges[i]['style']] != 'undefined' && mappedEdges[this.originalEdges[i]['style']] != hideEdge) {
                continue;
            }
            if (hideEdge == false && (this.hiddenNodes[this.originalEdges[i].to] == false && this.hiddenNodes[this.originalEdges[i].from] == false)) {
                edgesToHide.push({ id: this.originalEdges[i]['id'], hidden: hideEdge });
            }
        }
        this.edges.update(edgesToHide);
        //actionLoggerIn.addToStateHistory({func: "hideNodes", param: {"hideNodes":nodesToHide,"hideEdges":edgesToHide,"hidden":hideEdge}});
    };
    TheoryGraph.prototype.setEdgesHidden = function (type, hideEdge) {
        for (var i = 0; i < this.edgesNameToHide.length; i++) {
            if (type == this.edgesNameToHide[i].type) {
                this.edgesNameToHide[i].hidden = hideEdge;
                return;
            }
        }
        this.edgesNameToHide.push({ 'hidden': hideEdge, 'type': type });
    };
    TheoryGraph.prototype.downloadCanvasAsImage = function (_) {
        var _this = this;
        var minX = 111110;
        var minY = 111110;
        var maxX = -111110;
        var maxY = -111110;
        for (var i = 0; i < this.originalNodes.length; i++) {
            var curNode = this.originalNodes[i];
            var nodePosition = this.network.getPositions([curNode.id]);
            minX = Math.min(nodePosition[curNode.id].x, minX);
            maxX = Math.max(nodePosition[curNode.id].x, maxX);
            minY = Math.min(nodePosition[curNode.id].y, minY);
            maxY = Math.max(nodePosition[curNode.id].y, maxY);
        }
        var originalWidth = this.network.canvas.frame.canvas.width + 'px';
        var originalHeight = this.network.canvas.frame.canvas.height + 'px';
        var sizeA = Math.min((maxX - minX) * 1.2, 3500) + 'px';
        var sizeB = Math.min((maxY - minY) * 1.2, 3500) + 'px';
        this.network.setSize(sizeA, sizeB);
        this.network.redraw();
        this.network.fit();
        this.network.once('afterDrawing', function () {
            //button.href = network.canvas.frame.canvas.toDataURL();
            //button.download = "graph.png";
            var downloadLink = document.createElement('a');
            downloadLink.target = '_blank';
            downloadLink.download = 'graph.png';
            var image = _this.network.canvas.frame.canvas.toDataURL('image/png');
            var URL = window.URL /*|| window.webkitURL*/;
            var downloadUrl = image;
            // set object URL as the anchor's href
            downloadLink.href = downloadUrl;
            // append the anchor to document body
            document.body.appendChild(downloadLink);
            // fire a click event on the anchor
            downloadLink.click();
            // cleanup: remove element and revoke object URL
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(downloadUrl);
            //window.open(image);
            _this.network.setSize(originalWidth, originalHeight);
            _this.network.redraw();
            _this.network.fit();
            _this.statusLogger.setStatusText('');
        });
    };
    TheoryGraph.prototype.selectNodes = function (nodeIds) {
        this.network.selectNodes(nodeIds);
        this.actionLogger.addToStateHistory({ func: 'select', param: { 'nodes': nodeIds } });
    };
    TheoryGraph.prototype.selectNodesWithIdLike = function (searchId) {
        var nodeIds = [];
        for (var i = 0; i < this.originalNodes.length; i++) {
            var curNode = this.originalNodes[i];
            if (curNode.id.indexOf(searchId) > -1) {
                nodeIds.push(curNode.id);
            }
        }
        this.actionLogger.addToStateHistory({ func: 'select', param: { 'nodes': nodeIds } });
        this.network.selectNodes(nodeIds);
    };
    TheoryGraph.prototype.cageNodes = function (nodeIds, color) {
        if (nodeIds === undefined) {
            nodeIds = this.network.getSelectedNodes().map(function (e) { return e.toString(); });
        }
        if (color == undefined) {
            color = '#' + (4 * Math.floor(Math.random() * 4)).toString(16) +
                (4 * Math.floor(Math.random() * 4)).toString(16) +
                (4 * Math.floor(Math.random() * 4)).toString(16);
        }
        for (var i = 0; i < this.allNodeRegions.length; i++) {
            this.allNodeRegions[i].selected = false;
        }
        this.allNodeRegions.push({
            nodeIds: nodeIds,
            color: color,
            selected: true,
            mappedNodes: {},
            top: NaN,
            bottom: NaN,
            left: NaN,
            right: NaN
        });
        this.actionLogger.addToStateHistory({ func: 'cageNodes', param: { 'nodeIds': nodeIds, 'color': color, 'index': this.allNodeRegions.length - 1 } });
        this.network.redraw();
    };
    TheoryGraph.prototype.selectNodesInRect = function (rect) {
        //var fromX;
        //var toX;
        //var fromY;
        //var toY;
        var nodesIdInDrawing = [];
        var xRange = utils_1.getStartToEnd(rect.startX, rect.w);
        var yRange = utils_1.getStartToEnd(rect.startY, rect.h);
        for (var i = 0; i < this.originalNodes.length; i++) {
            var curNode = this.originalNodes[i];
            var nodePosition = this.network.getPositions([curNode.id]);
            if (typeof nodePosition != 'undefined' && typeof this.network.body.nodes[curNode.id] != 'undefined' && this.network.body.nodes[curNode.id].options.hidden != true) {
                var nodeXY = this.network.canvasToDOM({ x: nodePosition[curNode.id].x, y: nodePosition[curNode.id].y });
                if (xRange.start <= nodeXY.x && nodeXY.x <= xRange.end && yRange.start <= nodeXY.y && nodeXY.y <= yRange.end) {
                    nodesIdInDrawing.push(curNode.id);
                }
            }
        }
        this.actionLogger.addToStateHistory({ func: 'select', param: { 'nodes': nodesIdInDrawing } });
        this.network.selectNodes(nodesIdInDrawing);
    };
    TheoryGraph.prototype.colorizeNodesByName = function (nodeNames, color) {
        if (typeof nodeNames == 'undefined' || nodeNames == null || nodeNames == undefined) {
            return;
        }
        var colorizingIds = [];
        var nodeNamesArray = [];
        if (typeof nodeNames == 'string') {
            nodeNamesArray = nodeNames.replace(' ', '').split(',');
        }
        else {
            nodeNamesArray = nodeNames;
        }
        for (var i = 0; i < nodeNamesArray.length; i++) {
            console.log('^' + nodeNamesArray[i].replace('*', '(.*)') + '$');
            var re = new RegExp('^' + nodeNamesArray[i].split('*').join('(.*)') + '$');
            for (var j = 0; j < this.originalNodes.length; j++) {
                if (re.test(this.originalNodes[j].label)) {
                    colorizingIds.push(this.originalNodes[j].id);
                }
            }
        }
        this.colorizeNodes(colorizingIds, color);
    };
    TheoryGraph.prototype.clusterUsingColor = function () {
        // TODO: Re-workt the clusterer and make sure that this returns valid data
        // run the clustering algorithm and then remove the clusterer
        var internalClusterer = new Clusterer_1["default"](this.originalNodes, this.originalEdges, this.statusLogger);
        var membership = internalClusterer.cluster();
        internalClusterer.destroy();
        var clusteredNodes = [];
        var usedClusters = [];
        for (var i = 0; i < membership.length; i++) {
            if (typeof clusteredNodes[membership[i]] === 'undefined') {
                clusteredNodes[membership[i]] = [];
                usedClusters.push(membership[i]);
            }
            clusteredNodes[membership[i]].push(this.originalNodes[i].id);
        }
        for (var i = 0; i < membership.length; i++) {
            this.originalNodes[i].membership = membership[i]; // TODO: Clean node should get an optional membership thingy
        }
        this.startRendering();
        for (var i = 0; i < usedClusters.length; i++) {
            //that.cageNodes(clusteredNodes[usedClusters[i]],rainbow(usedClusters.length,i));
            this.colorizeNodes(clusteredNodes[usedClusters[i]], utils_1.rainbow(usedClusters.length, i), false);
        }
        this.network.redraw();
    };
    TheoryGraph.prototype.colorizeNodes = function (nodeIds, color, doRedraw) {
        if (doRedraw === void 0) { doRedraw = true; }
        if (nodeIds === undefined) {
            nodeIds = this.network.getSelectedNodes().map(function (e) { return e.toString(); });
        }
        if (color == undefined) {
            color = 'blue';
        }
        if (this.network != null) {
            var toUpdate = [];
            for (var i = 0; i < nodeIds.length; i++) {
                toUpdate.push({ id: nodeIds[i], color: { background: color, highlight: { background: color } } });
            }
            this.nodes.update(toUpdate);
            if (doRedraw == true) {
                this.network.redraw();
            }
        }
    };
    TheoryGraph.prototype.cluster = function (nodeIds, name, givenClusterId) {
        // TODO: The parameter clusterID looks weird
        // because of the way it is treated in case of an undo / redo
        if (typeof givenClusterId === 'undefined') {
            givenClusterId = this.clusterId.toString();
        }
        if (nodeIds == undefined) {
            nodeIds = this.network.getSelectedNodes().map(function (e) { return e.toString(); });
        }
        if (name == undefined) {
            name = 'cluster_' + givenClusterId;
        }
        if (this.network != null) {
            this.clusterPositions['cluster_' + givenClusterId] = [
                nodeIds,
                this.network.getPositions(nodeIds)
            ];
            this.allClusters.push('cluster_' + givenClusterId);
            var options = {
                joinCondition: function (nodeOptions) {
                    return nodeIds.indexOf(nodeOptions.id) != -1;
                },
                processProperties: function (clusterOptions, childNodes, childEdges) {
                    var totalMass = 0;
                    for (var i = 0; i < childNodes.length; i++) {
                        totalMass += childNodes[i].mass;
                    }
                    clusterOptions.mass = totalMass;
                    return clusterOptions;
                },
                clusterNodeProperties: { id: 'cluster_' + givenClusterId, borderWidth: 2, shape: 'database', color: 'orange', label: name }
            };
            this.network.clustering.cluster(options);
            this.actionLogger.addToStateHistory({ func: 'cluster', param: { 'clusterId': 'cluster_' + givenClusterId, 'name': name, 'nodes': nodeIds } });
            this.clusterId++;
        }
    };
    TheoryGraph.prototype.getGraph = function (jsonURL) {
        var _this = this;
        this.statusLogger.setStatusText('Downloading graph...');
        this.statusLogger.setStatusCursor('wait');
        // TODO: This is really unsafe if other stuff is on the page
        jquery_1["default"].ajaxSetup({
            error: function (x, e) {
                if (x.status == 0) {
                    _this.statusLogger.setStatusText('<font color="red">Downloading graph failed (Check Your Network)</font>');
                    _this.statusLogger.setStatusCursor('auto');
                }
                else if (x.status == 404) {
                    _this.statusLogger.setStatusText('<font color="red">Downloading graph failed (Requested URL not found)</font>');
                    _this.statusLogger.setStatusCursor('auto');
                }
                else if (x.status == 500) {
                    _this.statusLogger.setStatusText('<font color="red">Downloading graph failed (Internel Server Error)</font>');
                    _this.statusLogger.setStatusCursor('auto');
                }
                else {
                    _this.statusLogger.setStatusText('<font color="red">Downloading graph failed (HTTP-Error-Code: ' + x.status + ')</font>');
                    _this.statusLogger.setStatusCursor('auto');
                    console.log(x);
                }
            }
        });
        jquery_1["default"].get(jsonURL, this.drawGraph.bind(this));
    };
    TheoryGraph.prototype.loadJSONGraph = function (data) {
        if ((typeof data === 'string' && data.length < 20) || data === undefined) // data.length < 20 TODO: WHAT?
         {
            this.statusLogger.setStatusText('<font color="red">Graph-File is empty or corrupt</font>');
            this.statusLogger.setStatusCursor('auto');
            return;
        }
        // parse the string (if needed)
        if (typeof data === 'string') {
            data = JSON.parse(data);
        }
        if (typeof data['nodes'] == 'undefined' || typeof data['edges'] == 'undefined') {
            this.statusLogger.setStatusText('<font color="red">Graph-File is invalid (maybe incorrect JSON?)</font>');
            this.statusLogger.setStatusCursor('auto');
            return;
        }
        this.loadDataSet(data.nodes, data.edges, true);
    };
    TheoryGraph.prototype.drawGraph = function (data, status) {
        if (status === void 0) { status = 200; }
        if (status != 200 && status != 'success') {
            this.statusLogger.setStatusText('<font color="red">Downloading graph failed (HTTP-Error-Code: ' + status + ')</font>');
            this.statusLogger.setStatusCursor('auto');
            return;
        }
        if (typeof data === 'string') // data.length < 20 TODO: WHAT?
         {
            this.statusLogger.setStatusText('<font color="red">Graph-File is empty or corrupt</font>');
            this.statusLogger.setStatusCursor('auto');
            return;
        }
        if (typeof data['nodes'] == 'undefined' || typeof data['edges'] == 'undefined') {
            this.statusLogger.setStatusText('<font color="red">Graph-File is invalid (maybe incorrect JSON?)</font>');
            this.statusLogger.setStatusCursor('auto');
            return;
        }
        this.loadDataSet(data.nodes, data.edges);
    };
    /**
     * Loads a given dataset from the user, ensuring consistency
     * @param nodes
     * @param edges
     * @param fixedPositions
     */
    TheoryGraph.prototype.loadDataSet = function (nodes, edges, fixedPositions) {
        var _this = this;
        this.originalNodes = nodes.map(function (n) { return visgraph_1.cleanNode(n, _this.config.NODE_STYLES); });
        this.originalEdges = edges.map(function (e) { return visgraph_1.cleanEdge(e, _this.config.ARROW_STYLES); });
        this.addUsedButNotDefinedNodes();
        this.originalNodes = visgraph_1.ensureUniqueIds(this.originalNodes);
        this.originalEdges = visgraph_1.ensureUniqueIds(this.originalEdges);
        this.startConstruction(fixedPositions);
    };
    TheoryGraph.prototype.addUsedButNotDefinedNodes = function () {
        this.statusLogger.setStatusText('Adding used but not defined nodes...');
        var mappedNodes = {};
        for (var i = 0; i < this.originalNodes.length; i++) {
            mappedNodes[this.originalNodes[i].id] = this.originalNodes[i];
        }
        for (var i = 0; i < this.originalEdges.length; i++) {
            if (this.originalEdges[i].from != undefined && mappedNodes[this.originalEdges[i].from] == undefined) {
                var nodeLabel = this.originalEdges[i].from;
                var exploded = nodeLabel.split('?');
                if (exploded[1] != undefined) {
                    nodeLabel = exploded[1];
                }
                var addNode = {
                    'id': this.originalEdges[i].from,
                    'style': 'border',
                    'label': nodeLabel,
                    'url': this.originalEdges[i].from
                };
                this.originalNodes.push(visgraph_1.cleanNode(addNode, this.config.NODE_STYLES));
                mappedNodes[this.originalEdges[i].from] = addNode;
                console.log('Border-Node: ' + nodeLabel + ' (' + this.originalEdges[i].from + ')');
            }
            if (this.originalEdges[i].to != undefined && mappedNodes[this.originalEdges[i].to] == undefined) {
                var nodeLabel = this.originalEdges[i].to;
                var exploded = nodeLabel.split('?');
                if (exploded[1] != undefined) {
                    nodeLabel = exploded[1];
                }
                var addNode = {
                    'id': this.originalEdges[i].to,
                    'style': 'border',
                    'label': nodeLabel,
                    'url': this.originalEdges[i].to
                };
                this.originalNodes.push(visgraph_1.cleanNode(addNode, this.config.NODE_STYLES));
                mappedNodes[this.originalEdges[i].to] = addNode;
                console.log('Border-Node: ' + nodeLabel + ' (' + this.originalEdges[i].to + ')');
            }
        }
    };
    // TODO: Compare and unify with drawgraph
    TheoryGraph.prototype.addNodesAndEdges = function (data, status) {
        var _this = this;
        if (status === void 0) { status = 200; }
        if (status != 200 && status != 'success') // TODO: what kind of type is this? use either number or string
         {
            this.statusLogger.setStatusText('<font color="red">Downloading nodes failed (HTTP-Error-Code: ' + status + ')</font>');
            this.statusLogger.setStatusCursor('auto');
            return;
        }
        if (typeof data === 'string') // data.length < 20 TODO: WHAT?
         {
            this.statusLogger.setStatusText('<font color="red">Graph-File is empty or corrupt</font>');
            this.statusLogger.setStatusCursor('auto');
            return;
        }
        if (typeof data['nodes'] == 'undefined' || typeof data['edges'] == 'undefined') {
            this.statusLogger.setStatusText('<font color="red">Graph-File is invalid (maybe incorrect JSON?)</font>');
            this.statusLogger.setStatusCursor('auto');
            return;
        }
        var nodesJSON = data.nodes.map(function (n) { return visgraph_1.cleanNode(n, _this.config.NODE_STYLES); });
        var edgesJSON = data.edges.map(function (e) { return visgraph_1.cleanEdge(e, _this.config.ARROW_STYLES); });
        nodesJSON = visgraph_1.ensureUniqueIds(nodesJSON);
        edgesJSON = visgraph_1.ensureUniqueIds(edgesJSON);
        this.edges.update(edgesJSON);
        this.nodes.update(nodesJSON);
        this.originalEdges = this.originalEdges.concat(edgesJSON);
        this.originalNodes = this.originalNodes.concat(nodesJSON);
        this.statusLogger.setStatusText('<font color="green">Successfully recieved ' + nodesJSON.length + ' node(s) and ' + edgesJSON.length + ' edge(s)!</font>');
        this.statusLogger.setStatusCursor('auto');
    };
    TheoryGraph.prototype.addNode = function (nodeIn) {
        var node = visgraph_1.cleanNode(nodeIn, this.config.NODE_STYLES);
        this.originalNodes.push(node);
        if (node['mathml'] != '') // TODO: More unclear node types
         {
            node = this.nodeToSVGMath(node);
        }
        if (node['previewhtml'] != '') {
            node = this.nodeToSVGHTML(node);
        }
        this.nodes.update(node);
        this.actionLogger.addToStateHistory({ func: 'addNode', param: { 'node': node } });
    };
    TheoryGraph.prototype.addEdge = function (edgeIn) {
        var edge = visgraph_1.cleanEdge(edgeIn, this.config.ARROW_STYLES);
        this.originalEdges.push(edge);
        this.edges.update(edge);
        this.actionLogger.addToStateHistory({ func: 'addEdge', param: { 'edge': edge } });
    };
    TheoryGraph.prototype.deleteEdges = function (edgeIds) {
        var deletedEdges = [];
        this.originalEdges = this.originalEdges.filter(function (item) {
            var keepEdge = true;
            for (var i = 0; i < edgeIds.length; i++) {
                if (item.id == edgeIds[i]) {
                    keepEdge = false;
                    deletedEdges.push(item);
                    break;
                }
            }
            return keepEdge;
        });
        this.edges.remove(edgeIds);
        this.actionLogger.addToStateHistory({ func: 'deleteEdges', param: { 'edges': deletedEdges } });
    };
    TheoryGraph.prototype.deleteNodes = function (nodeIds, edgeIds) {
        var deletedNodes = [];
        var deletedEdges = [];
        this.originalNodes = this.originalNodes.filter(function (item) {
            var keepNode = true;
            for (var i = 0; i < nodeIds.length; i++) {
                if (item.id == nodeIds[i]) {
                    keepNode = false;
                    deletedNodes.push(item);
                    break;
                }
            }
            return keepNode;
        });
        this.nodes.remove(nodeIds);
        if (edgeIds !== undefined) {
            this.originalEdges = this.originalEdges.filter(function (item) {
                var keepEdge = true;
                for (var i = 0; i < edgeIds.length; i++) {
                    if (item.id == edgeIds[i]) {
                        keepEdge = false;
                        deletedEdges.push(item);
                        break;
                    }
                }
                return keepEdge;
            });
            this.edges.remove(edgeIds);
        }
        this.actionLogger.addToStateHistory({ func: 'deleteNodes', param: { 'nodes': deletedNodes, 'edges': deletedEdges } });
    };
    TheoryGraph.prototype.saveEdge = function (edgeIn) {
        var oldEdge = undefined;
        var edge = visgraph_1.cleanEdge(edgeIn, this.config.ARROW_STYLES);
        for (var i = 0; i < this.originalEdges.length; i++) {
            if (this.originalEdges[i].id == edge.id) {
                oldEdge = this.originalEdges[i];
                this.originalEdges[i] = edge;
                break;
            }
        }
        this.edges.update(edge);
        this.actionLogger.addToStateHistory({ func: 'editEdge', param: { 'newEdge': edge, 'oldEdge': oldEdge } });
    };
    TheoryGraph.prototype.saveNode = function (nodeIn) {
        var oldNode = undefined;
        var node = visgraph_1.cleanNode(nodeIn, this.config.NODE_STYLES);
        for (var i = 0; i < this.originalNodes.length; i++) {
            if (this.originalNodes[i].id == node.id) {
                oldNode = this.originalNodes[i];
                this.originalNodes[i] = node;
                break;
            }
        }
        if (typeof node['mathml'] != 'undefined' && node['mathml'] != '') {
            node = this.nodeToSVGMath(node);
        }
        if (typeof node['previewhtml'] != 'undefined' && node['previewhtml'] != '') {
            node = this.nodeToSVGHTML(node);
        }
        this.nodes.update(node);
        this.actionLogger.addToStateHistory({ func: 'editNode', param: { 'newNode': node, 'oldNode': oldNode } });
    };
    TheoryGraph.prototype.isUniqueId = function (id) {
        for (var i = 0; i < this.originalNodes.length; i++) {
            if (this.originalNodes[i].id == id) {
                return false;
            }
        }
        return true;
    };
    TheoryGraph.prototype.isUniqueEdgeId = function (id) {
        for (var i = 0; i < this.originalEdges.length; i++) {
            if (this.originalEdges[i].id == id) {
                return false;
            }
        }
        return true;
    };
    TheoryGraph.prototype.lazyLoadNodes = function (jsonURL) {
        if (jsonURL == undefined || jsonURL.length < 3) {
            return;
        }
        this.statusLogger.setStatusText('Downloading nodes...');
        this.statusLogger.setStatusCursor('wait');
        jquery_1["default"].ajaxSetup({
            error: function (x, e) {
                if (x.status == 0) {
                    this.statusLogger.setStatusText('<font color="red">Downloading nodes failed (Check Your Network)</font>');
                    this.statusLogger.setStatusCursor('auto');
                }
                else if (x.status == 404) {
                    this.statusLogger.setStatusText('<font color="red">Downloading nodes failed (Requested URL not found)</font>');
                    this.statusLogger.setStatusCursor('auto');
                }
                else if (x.status == 500) {
                    this.statusLogger.setStatusText('<font color="red">Downloading nodes failed (Internel Server Error)</font>');
                    this.statusLogger.setStatusCursor('auto');
                }
                else {
                    this.statusLogger.setStatusText('<font color="red">Downloading nodes failed (HTTP-Error-Code: ' + x.status + ')</font>');
                    this.statusLogger.setStatusCursor('auto');
                }
            }
        });
        jquery_1["default"].get(jsonURL, this.addNodesAndEdges.bind(this));
    };
    TheoryGraph.prototype.openCluster = function (nodeId) {
        if (this.network.isCluster(nodeId) == true) {
            var node = this.network.body.nodes[nodeId].label; //options.label
            this.network.openCluster(nodeId);
            var toUpdate = [];
            for (var i = 0; i < this.clusterPositions[nodeId][0].length; i++) {
                var id = this.clusterPositions[nodeId][0][i];
                toUpdate.push({ id: id, x: this.clusterPositions[nodeId][1][id].x, y: this.clusterPositions[nodeId][1][id].y });
            }
            var index = this.allClusters.indexOf(nodeId);
            if (index > -1) {
                this.allClusters.splice(index, 1);
            }
            this.actionLogger.addToStateHistory({ func: 'uncluster', param: { 'clusterId': nodeId, 'nodes': toUpdate.map(function (e) { return e.id; }), 'name': node /*.label*/ } });
            this.nodes.update(toUpdate);
            this.network.redraw();
        }
    };
    TheoryGraph.prototype.estimateExtraSVGHeight = function (expression) {
        if (expression.indexOf('frac') == -1 && expression.indexOf('under') == -1 && expression.indexOf('over') == -1) {
            return 0;
        }
        else {
            //return 16;
            return 0;
        }
    };
    TheoryGraph.prototype.nodeToSVGHTML = function (node) {
        this.dom.$$('string_span').html(node['previewhtml'] || '');
        var width = this.dom.$$('string_span').width();
        var height = this.dom.$$('string_span').height();
        this.dom.$$('string_span').html('');
        var svg;
        if (node['shape'] == 'image') {
            var overallheight = height;
            svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + (width + 16 * 1) + ' ' + (16 * 1 + overallheight) + '" width="' + (width + 16 * 1) + 'px" height="' + (16 * 1 + overallheight) + 'px" preserveAspectRatio="none">' +
                //svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMinYMin">' +
                '<foreignObject x="8" y="8" width="' + (width + 15) + '" height="' + overallheight + '">' +
                '<div xmlns="http://www.w3.org/1999/xhtml" style="font-size:18px;margin-left: auto;margin-right: auto;display: flex;align-items: center;justify-content: center">' +
                node['previewhtml'] +
                '</div></foreignObject>' +
                '</svg>';
        }
        else {
            svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + (30 * 1 + width) + 'px" height="' + (30 * 1 + height) + 'px" preserveAspectRatio="none">' +
                '<foreignObject x="15" y="13" width="100%" height="100%">' +
                '<div xmlns="http://www.w3.org/1999/xhtml">' +
                node['previewhtml'] +
                '</div></foreignObject>' +
                '</svg>';
        }
        node['image'] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        return node;
    };
    TheoryGraph.prototype.nodeToSVGMath = function (node) {
        this.dom.$$('string_span').html(node['mathml']);
        var width = this.dom.$$('string_span').width();
        var height = this.dom.$$('string_span').height();
        this.dom.$$('string_span').html('');
        var svg;
        if (node['shape'] == 'image') {
            var overallheight = height + this.estimateExtraSVGHeight(node['mathml']);
            svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + (width + 16 * 1) + ' ' + (16 * 1 + overallheight) + '" width="' + (width + 16 * 1) + 'px" height="' + (16 * 1 + overallheight) + 'px" preserveAspectRatio="none">' +
                //svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMinYMin">' +
                '<foreignObject x="8" y="8" width="' + (width + 15) + '" height="' + overallheight + '">' +
                node['mathml'] +
                '</foreignObject>' +
                '</svg>';
        }
        else {
            svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + (30 * 1 + width) + 'px" height="' + (30 * 1 + height + this.estimateExtraSVGHeight(node['mathml'])) + 'px" preserveAspectRatio="none">' +
                '<foreignObject x="15" y="13" width="100%" height="100%">' +
                node['mathml'] +
                '</foreignObject>' +
                '</svg>';
        }
        node['image'] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        return node;
    };
    TheoryGraph.prototype.startConstruction = function (fixedPositions) {
        var _this = this;
        if (fixedPositions === void 0) { fixedPositions = false; }
        var hideEdgesType = {};
        for (var j = 0; j < this.edgesNameToHide.length; j++) {
            var type = this.edgesNameToHide[j].type;
            if (this.edgesNameToHide[j].hidden == true) {
                hideEdgesType[type] = true;
            }
        }
        this.internalOptimizer = new Optimizer_1["default"](this.originalNodes, this.originalEdges, hideEdgesType, this.statusLogger);
        this.statusLogger.setStatusText('Constructing graph...');
        var processedNodes = 0;
        var nodesCount = 0;
        for (var i = 0; i < this.originalNodes.length; i++) {
            if (this.originalNodes[i]['image'] != '' && this.originalNodes[i]['image'] != undefined) {
                nodesCount++;
            }
        }
        for (var i = 0; i < this.originalNodes.length; i++) {
            this.hiddenNodes[this.originalNodes[i]['id']] = false;
            if (this.originalNodes[i]['image'] != '' && this.originalNodes[i]['image'] != undefined) {
                var callback = (function (node, data) {
                    node['mathml'] = data;
                    _this.nodeToSVGMath(node);
                    processedNodes++;
                    if (processedNodes == nodesCount) {
                        _this.startRendering();
                    }
                }).bind(this, this.originalNodes[i]);
                jquery_1["default"].get(this.originalNodes[i]['image'], callback);
            }
            else {
                if (this.originalNodes[i]['mathml'] != undefined && this.originalNodes[i]['mathml'].length > 10 && this.originalNodes[i]['mathml'] != '') {
                    this.nodeToSVGMath(this.originalNodes[i]);
                }
                if (typeof this.originalNodes[i]['previewhtml'] != 'undefined' && this.originalNodes[i]['previewhtml'] != '') {
                    this.nodeToSVGHTML(this.originalNodes[i]);
                }
            }
        }
        if (nodesCount == 0) {
            this.startRendering(fixedPositions);
        }
    };
    // Called when the Visualization API is loaded.
    TheoryGraph.prototype.startRendering = function (fixedPositions) {
        var _this = this;
        if (typeof fixedPositions == 'undefined') {
            fixedPositions = false;
        }
        this.statusLogger.setStatusText('Rendering graph...');
        if (fixedPositions == false) {
            var hideEdgesType = {};
            for (var j = 0; j < this.edgesNameToHide.length; j++) {
                var type = this.edgesNameToHide[j].type;
                if (this.edgesNameToHide[j].hidden == true) {
                    hideEdgesType[type] = true;
                }
            }
            if (typeof this.config.THEORY_GRAPH_OPTIONS.layout === 'undefined' || typeof this.config.THEORY_GRAPH_OPTIONS.layout.ownLayoutIdx === 'undefined' || this.config.THEORY_GRAPH_OPTIONS.layout.ownLayoutIdx == 1) {
                var opti = new Optimizer_1["default"](this.originalNodes, this.originalEdges, hideEdgesType, this.statusLogger);
                var spacingValue = parseInt(this.dom.getElementById('nodeSpacingBox').value, 10);
                if (this.originalNodes.length + this.originalEdges.length > 3000) {
                    opti.weaklyHierarchicalLayout(500, spacingValue);
                }
                else if (this.originalNodes.length + this.originalEdges.length > 2000) {
                    opti.weaklyHierarchicalLayout(700, spacingValue);
                }
                else {
                    opti.weaklyHierarchicalLayout(1000, spacingValue);
                }
                opti.destroy();
            }
            else if (this.config.THEORY_GRAPH_OPTIONS.layout.ownLayoutIdx == 2) {
                var opti = new Optimizer_1["default"](this.originalNodes, this.originalEdges, hideEdgesType, this.statusLogger);
                opti.GenerateRandomSolution();
                var spacingValue = parseInt(this.dom.getElementById('nodeSpacingBox').value, 10);
                // TODO: Check if the new arguments are correct
                if (this.originalNodes.length + this.originalEdges.length > 3000) {
                    //opti.SolveUsingForces(200,spacingValue,200,{"meta":false},this.originalEdges);
                    opti.SolveUsingForces(200, spacingValue);
                }
                else if (this.originalNodes.length + this.originalEdges.length > 2000) {
                    //opti.SolveUsingForces(400,spacingValue,200,{"meta":false},this.originalEdges);
                    opti.SolveUsingForces(400, spacingValue);
                }
                else {
                    // opti.SolveUsingForces(600,spacingValue,200,{"meta":false},this.originalEdges);
                    opti.SolveUsingForces(600, spacingValue);
                }
                opti.destroy();
            }
            else if (this.config.THEORY_GRAPH_OPTIONS.layout.ownLayoutIdx == 4) {
                var opti = new Optimizer_1["default"](this.originalNodes, this.originalEdges, hideEdgesType, this.statusLogger);
                opti.GenerateRandomSolution();
                var spacingValue = parseInt(this.dom.getElementById('nodeSpacingBox').value, 10);
                if (this.originalNodes.length + this.originalEdges.length > 3000) {
                    opti.waterDrivenLayout(200, spacingValue);
                }
                else if (this.originalNodes.length + this.originalEdges.length > 2000) {
                    opti.waterDrivenLayout(400, spacingValue);
                }
                else {
                    opti.waterDrivenLayout(600, spacingValue);
                }
                opti.destroy();
            }
        }
        for (var i = 0; i < this.originalEdges.length; i++) {
            this.originalEdges[i].hidden = false;
        }
        for (var j = 0; j < this.edgesNameToHide.length; j++) {
            for (var i = 0; i < this.originalEdges.length; i++) {
                var type = this.edgesNameToHide[j].type;
                if (type == this.originalEdges[i]['style'] || ('graph' + type) == this.originalEdges[i]['style']) {
                    this.originalEdges[i].hidden = this.edgesNameToHide[j].hidden;
                }
            }
        }
        this.nodes = new vis_1.DataSet(this.originalNodes);
        this.edges = new vis_1.DataSet(this.originalEdges);
        // create a network
        var data = {
            nodes: this.nodes,
            edges: this.edges
        };
        this.network = new vis_1.Network(this.dom.getElementById(this.containerName), data, this.config.THEORY_GRAPH_OPTIONS);
        //network.startSimulation(10); 
        if (this.config.THEORY_GRAPH_OPTIONS.physics.enabled == false) {
            this.statusLogger.setStatusCursor('auto');
            this.statusLogger.setStatusText('<font color="green">Received ' + this.originalNodes.length + ' nodes</font>');
        }
        this.network.on('afterDrawing', function () {
            if (_this.onConstructionDone != undefined) {
                var tmp = _this.onConstructionDone;
                _this.onConstructionDone = undefined;
                tmp();
            }
        });
        // If the document is clicked somewhere
        this.network.on('click', function (e) {
            _this.dom.$$('tooltip-container').hide(10);
            // If the clicked element is not the menu
            if (!(jquery_1["default"](e.target).parents('.custom-menu').length > 0)) {
                // Hide it
                _this.dom.$('.custom-menu').hide(10);
            }
            if (_this.manipulateSelectedRegion(e.pointer.canvas) == false) {
                _this.selectRegion(e.pointer.canvas);
            }
            if (_this.addNodeToRegion == true && _this.allNodeRegions[_this.addNodeRegionId].selected == false) {
                _this.addNodeToRegion = false;
                _this.statusLogger.setStatusCursor('auto');
            }
        });
        // If the document is clicked somewhere
        this.network.on('selectNode', function (e) {
            //console.log(e);
            if (_this.manualFocus == true) {
                _this.focusOnNodes();
                return;
            }
            if (_this.addNodeToRegion == true && e.nodes.length > 0 && _this.allNodeRegions[_this.addNodeRegionId].selected == true) {
                for (var i = 0; i < e.nodes.length; i++) {
                    _this.allNodeRegions[_this.addNodeRegionId].nodeIds.push(e.nodes[i]);
                }
                _this.network.redraw();
            }
        });
        // If the menu element is clicked
        this.dom.$('.custom-menu li').click(function (e) {
            var nodesFound = _this.network.getSelectedNodes();
            var selectedNode = _this.network.body.nodes[nodesFound[0]];
            if (selectedNode == undefined) {
                for (var i = 0; i < _this.originalNodes.length; i++) {
                    if (_this.originalNodes[i]['id'] == nodesFound[0]) {
                        selectedNode = _this.originalNodes[i];
                        break;
                    }
                }
            }
            else {
                selectedNode = selectedNode.options || {};
            }
            var edgesFound = _this.network.getSelectedEdges();
            var selectedEdge = undefined;
            for (var i = 0; i < _this.originalEdges.length; i++) {
                if (_this.originalEdges[i]['id'] == edgesFound[0]) {
                    selectedEdge = _this.originalEdges[i];
                    break;
                }
            }
            var selected = undefined;
            if (selectedEdge != undefined) {
                selected = selectedEdge;
            }
            if (selectedNode != undefined) {
                selected = selectedNode;
            }
            if (selected != undefined) {
                // This is the triggered action name
                switch (jquery_1["default"](e.target).attr('data-action')) {
                    // A case for each action
                    case 'openWindow':
                        window.open(_this.config.serverUrl + selected.url);
                        break;
                    case 'showURL':
                        alert(_this.config.serverUrl + selected.url);
                        break;
                    case 'openCluster':
                        _this.openCluster(selected.id);
                        break;
                    case 'inferType':
                        alert('Not implemented yet!');
                        break;
                    case 'showDecl':
                        alert('Not implemented yet!');
                        break;
                    case 'childNodes':
                        _this.lazyLoadNodes(selectedNode.childsURL);
                        break;
                }
            }
            // Hide it AFTER the action was triggered
            _this.dom.$('.custom-menu').hide(10);
        });
        this.network.on('oncontext', function (params) {
            _this.dom.$$('tooltip-container').hide(10);
            _this.dom.$('.custom-menu').hide(10);
            var node = _this.network.getNodeAt({ x: params['pointer']['DOM']['x'], y: params['pointer']['DOM']['y'] });
            if (node != undefined) {
                _this.network.selectNodes([node]);
                // Show contextmenu
                _this.dom.$('.custom-menu').finish().show(10).
                    // In the right position (the mouse)
                    css({
                    top: params['pointer']['DOM']['y'] * 1 + 20 + 'px',
                    left: params['pointer']['DOM']['x'] * 1 + 16 + _this.dom.getElementById('mainbox').offsetLeft + 'px'
                });
                return;
            }
            var edge = _this.network.getEdgeAt({ x: params['pointer']['DOM']['x'], y: params['pointer']['DOM']['y'] });
            if (typeof edge != undefined && edge != undefined) {
                _this.network.selectEdges([edge]);
                var selectedEdge = undefined;
                for (var i = 0; i < _this.originalEdges.length; i++) {
                    if (_this.originalEdges[i]['id'] == edge) {
                        selectedEdge = _this.originalEdges[i];
                        break;
                    }
                }
                if (selectedEdge != undefined && typeof selectedEdge.clickText != 'undefined') {
                    // Show contextmenu
                    _this.dom.$$('tooltip-container').finish().show(10).
                        html(selectedEdge.clickText).
                        // In the right position (the mouse)
                        css({
                        top: params['pointer']['DOM']['y'] * 1 + 20 + 'px',
                        left: params['pointer']['DOM']['x'] * 1 + 16 + _this.dom.getElementById('mainbox').offsetLeft + 'px'
                    });
                }
            }
        });
        this.network.on('stabilizationIterationsDone', function (params) {
            _this.network.stopSimulation();
            var options = {
                physics: {
                    enabled: false
                }
            };
            _this.network.setOptions(options);
            _this.statusLogger.setStatusCursor('auto');
            _this.statusLogger.setStatusText('<font color="green">Received ' + _this.originalNodes.length + ' nodes</font>');
        });
        // we use the zoom event for our clustering
        /*network.on('zoom', function (params)
        {
            console.log(params.direction+" "+params.scale+" < "+lastClusterZoomLevel*clusterFactor);
            if (params.direction == '-')
            {
                if (params.scale < lastClusterZoomLevel*clusterFactor)
                {
                    that.clusterOutliers(params.scale);
                    lastClusterZoomLevel = params.scale;
                }
            }
            else
            {
                openOutlierClusters(params.scale);
            }
        });*/
        this.network.on('beforeDrawing', function (ctx) {
            _this.drawAllColoredRegions(ctx);
        });
        this.network.on('afterDrawing', function (ctx) {
            _this.drawAllColoredRegionsOnCanvas(ctx);
        });
        this.network.once('initRedraw', function () {
            if (_this.lastClusterZoomLevel === 0) {
                _this.lastClusterZoomLevel = _this.network.getScale();
            }
            _this.statusLogger.setStatusCursor('auto');
        });
    };
    return TheoryGraph;
}());
exports["default"] = TheoryGraph;

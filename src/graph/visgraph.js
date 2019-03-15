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
/**
 * Cleans up a user-provided node and applies the appropriate style
 * @param nodeIn
 * @param NODE_STYLES
 */
function cleanNode(nodeIn, NODE_STYLES) {
    var node = __assign({ 
        // all the properties with constant defaults
        style: 'no-style-provided', shape: 'square', label: '', previewhtml: '', mathml: '', url: '', childsURL: '', membership: 0, options: {
            hidden: false
        } }, nodeIn, { 
        // all the fields with a default based on the input
        id: (nodeIn.id !== undefined ? nodeIn.id : 'no-id-provided').toString() });
    var style = NODE_STYLES[node.style];
    // style, shape, id, label, previewhtml, mathml, url, x, y, childsURL
    if (node.style !== undefined && style) {
        // clean the shape info
        var hasPreviewOrMath = (node.previewhtml && node.previewhtml.length > 10) ||
            (node.mathml && node.mathml.length > 10);
        if (style.shape === 'ellipse' || style.shape === 'circle') {
            node.shape = hasPreviewOrMath ? 'circularImage' : 'ellipse';
        }
        else if (style.shape === 'square') {
            node.shape = hasPreviewOrMath ? 'image' : 'square';
        }
        else {
            node.shape = hasPreviewOrMath ? 'image' : style.shape;
        }
        // Setup color
        if (node.color === undefined || typeof node.color === 'string') {
            node.color = { highlight: {} };
        }
        if (style.color) {
            node.color.background = style.color;
        }
        if (style.colorBorder) {
            node.color.border = style.colorBorder;
        }
        if (style.colorHighlightBorder) {
            node.color.border = style.colorBorder;
        }
        if (style.colorHighlight) {
            node.color.highlight = style.colorHighlight;
        }
        // fix shape properties
        if (node.shapeProperties === undefined) {
            node.shapeProperties = {};
        }
        if (style.dashes) {
            node.shapeProperties.borderDashes = [5, 5];
        }
    }
    // assume it is clean now and we have added the missing properties
    return node;
}
exports.cleanNode = cleanNode;
/**
 * Cleans up a user-provided edge and applies the appropriate style
 * @param nodeIn
 * @param NODE_STYLES
 */
function cleanEdge(edgeIn, ARROW_STYLES) {
    var edge = __assign({ from: 'none', to: 'none', style: 'no-style-provided', clickText: '', weight: '', url: '' }, edgeIn, { id: (edgeIn.id != undefined ? edgeIn.id : 'no-id-provided').toString() });
    var style = ARROW_STYLES[edge.style || ''];
    if (edge.style && style) {
        edge.arrows = {
            to: {
                enabled: style.directed,
                type: style.circle ? 'circle' : 'arrow'
            }
        };
        if (style.smoothEdge) {
            edge.smooth = false;
        }
        edge.dashes = style.dashes;
        edge.width = style.width;
        edge.color = {
            color: style.color,
            highlight: style.colorHighlight,
            hover: style.colorHover
        };
    }
    return edge;
}
exports.cleanEdge = cleanEdge;
/**
 * Ensures that all Ids with array are unique
 * @param array
 */
function ensureUniqueIds(array) {
    var knownIds = new Set();
    return array.map(function (e, i) {
        if (e.id !== undefined) {
            // if we have an already known id
            // add a unique prefix to it to make sure it becomes unique
            if (knownIds.has(e.id)) {
                e.id += '_' + i;
            }
            // and store that we had this id
            knownIds.add(e.id);
        }
        // return the element
        return e;
    });
}
exports.ensureUniqueIds = ensureUniqueIds;

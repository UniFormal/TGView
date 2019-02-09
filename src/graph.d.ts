/**
 * @file
 * 
 * This file contains type definitions for user-provided objects. 
 */

/**
 * JSON representing a TGView menu entry
 */
interface ITGViewMenuEntry {
    /** text show in the side menu */
    menuText: string;
    /** internal id */
    id: string;
    /** Location of archive on server */
    uri: string;
    /** Default graph type to open */
    type: string;
    /** true when the archive has children */
    hasChildren: boolean;
}

/**
 * Represents a TGView Graph
 */
export interface IGraphJSONGraph {
    nodes: IGraphJSONNode[];
    edges: IGraphJSONEdge[];
}

interface IGraphJSONNode {
    /** style of this node, as found in NODE_STYLE */
    style: string;
    /** shape of this node */
    shape?: "" | "circle" | "ellipse" | "square" | "circularImage" | "image"; // TODO: Was this moved into the style
    /** internal id */
    id: number | string;
    /** text shown */
    label: string;
    /** html show in the node */
    previewhtml?: string;
    /** mathml of the node */
    mathml: string;
    /** url for showing node */
    url: string;
    /** x position of the node */
    x: number;
    /** y position of the node */
    y: number;
    /** url to download children from */
    childsURL: string;   
}

interface IGraphJSONEdge {
    /** Id of from-node */
    from: string;
    /** Id of to-node */
    to: string;
    /** style of this edge, as found in EDGE_STYLE */
    style: string; // TODO: Should we limit this?
    /** Text shown when edge is clicked */
    clickText: string;
    /** Weight of the edge */
    weight: string;
    /** url for showing edge */
    url: string;
}
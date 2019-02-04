/**
 * Options that an be passed to TGView
 */
export interface ITGViewOptions {
    serverBaseURL: string;
    serverUrl?: string;

    isMathhub: boolean;
    viewOnlyMode: boolean;

    source: string; // TODO: This should be something like "uri" | "html" | undefined
    type: string;
    graphdata: string;

    highlight: string;

    mainContainer: string;
    prefix: string; // TODO: Rename this to elementPrefix
}

/**
 * options for the legend panel
 * TODO: Define this in terms of library
 */
interface ILegendPanelOptions {}

/**
 * options for the underlying theory graph
 * TODO: Define this in terms of the library
*/
interface ITheoryGraphOptions {}

/** Common Style properties for both arrow and nodes */
interface IStyleCommon {
    color: string;
    colorBorder?: string;
    colorHover?: string;
    colorHighlight: string;
    colorHighlightBorder?: string;
    dashes: boolean;
    alias: string;
}

/**
 * A Style for an arrow
 */
interface IArrowStyle extends IStyleCommon {
    circle: boolean;
    directed: boolean;
    smoothEdge: boolean;
    width: number;
}

/**
 * A Style for a node
 */
interface INodeStyle extends IStyleCommon {
    shape: "square" | "circle";
}

/**
 * A Graph Type as available in the MMT Menu
 */
interface IGraphMenuEntry {
    id: string;
    menuText: string;
    tooltip: string;
}
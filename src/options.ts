// @ts-check
import {getParameterByName} from './utils.js';

/**
 * Represents Options for TGView
 * @param {Partial<import('./types/options').ITGViewOptions>} external
 * @constructor
 */
export class Options {
	constructor(external: Partial<ITGViewOptions>) {
		this.external = {
			serverBaseURL: external.serverBaseURL || "/",
			serverUrl: external.serverUrl,

			isMathhub: external.isMathhub === undefined ? true : external.isMathhub,
			viewOnlyMode: external.viewOnlyMode || false,

			source: external.source || getParameterByName(Options.graphDataURLSourceParameterNameTGView) || undefined,
			type: external.type || getParameterByName(Options.graphDataURLTypeParameterNameTGView) || undefined,
			graphdata: external.graphdata || getParameterByName(Options.graphDataURLDataParameterNameTGView) || undefined,

			highlight: external.highlight || getParameterByName(Options.graphDataURLHighlightParameterNameTGView) || undefined,
			
			mainContainer: external.mainContainer || "tgViewMainEle",
			prefix: external.prefix || "tgview-",
		}

		/**
		 * The base URL of all requests to the server
		 * @type {string}
		 */
		this.serverBaseURL = this.external.serverBaseURL || "/";

		/**
		 * The url to items on the server
		 * @todo: What exactly is this used for
		 * @type {string} 
		 */
		this.serverUrl = this.serverBaseURL || (window.location.protocol == "file:" ? "/" : "/mh/mmt/");

		// if we have an external serverURL, use it
		if (this.external.serverUrl !== undefined) {
			this.serverUrl = this.external.serverUrl;
		}

		// if we are not on MathHub, the server url is '/'
		if (!this.external.isMathhub) {
			this.serverUrl = '/';
		}

		/**
		 * URL for getting menu-entries in the side-menu
		 * @type {string}
		 */
		this.menuEntriesURL = this.serverUrl + ":jgraph/menu?id=";

		// URL parts for getting graphdata, construction looks like:
		// graphDataURL + graphDataURLTypeParameterName + concreteTypeValue + "&" + graphDataURLDataParameterName + concreteGraphdataValue
		this.graphDataURL = this.serverUrl + ":jgraph/json?";		
	}

	/** Options that were set externally */
	readonly external: ITGViewOptions

	// TODO: Can one of these two be made private?
	// or removed entirely?

	/** the server base url */
	readonly serverBaseURL: string; 

	/** the server url */
	readonly serverUrl: string;

	/** the url to the menu entries */
	readonly menuEntriesURL: string;

	/** the url to the graph data */
	readonly graphDataURL: string;

	/**
	 * Colors to select the colorizing nodes in a graph
	 * @type {string[]}
	 */
	readonly colorizingNodesArray = [
		"#CCCCFF",
		"#FFFFCC",
		"#FFCC99",
		"#CCFFCC",
		"#DDDDDD",
		"#FFCCCC"
	];

	/**
	 * Color to used for highlighting nodes given by URI parameter
	 */
	readonly highlightColorByURI = "#ff8080";

	/**
	 * Options for the legend panel
	 */
	readonly LEGEND_PANEL_OPTIONS = 
	{
		physics:
		{
			enabled: false,
			stabilization: false
		},
		interaction:
		{
			dragNodes: false,
			dragView: false,
			hideEdgesOnDrag: false,
			hideNodesOnDrag: false,
			hover: false,
			hoverConnectedEdges: false,
			keyboard: {
				enabled: false,
				speed: { x: 10, y: 10, zoom: 0.02 },
				bindToWindow: true
			},
			multiselect: false,
			navigationButtons: false,
			selectable: false,
			selectConnectedEdges: false,
			tooltipDelay: 300,
			zoomView: false
		},
		nodes:
		{
			physics: false,
			shapeProperties:
			{
				useImageSize: true,  // only for image and circularImage shapes
				useBorderWithImage: true  // only for image shape
			}
		},
		edges:
		{
			smooth:
			{
				enabled: true,
				type: "straightCross",
				roundness: 0.3
			}
		},
	};

	/**
	 * Options for the TheoryGraph API
	 */
	readonly THEORY_GRAPH_OPTIONS = {
		physics: {
			enabled: false,
			solver: "barnesHut",
			barnesHut: {
				avoidOverlap: 1
			},
			stabilization: {
				enabled: true,
				iterations: 5 // maximum number of iteration to stabilize
			}
		},
		interaction: {
			multiselect: true
		},
		nodes: {
			physics: false,
			shapeProperties: {
				useImageSize: true, // only for image and circularImage shapes
				useBorderWithImage: true // only for image shape
			}
		},
		edges: {
			smooth: {
				enabled: true,
				type: "straightCross",
				roundness: 0.3
			}
		}, 
		/*manipulation: {
			addNode: addNodeCallback,
			editNode: editNodeCallback,
			deleteNode: deleteNodeCallback,
			addEdge: addEdgeCallback,
			editEdge: editEdgeCallback,
			deleteEdge: deleteEdgeCallback
		},
		layout: {
			hierarchical:
			{
				sortMethod: "directed",
				direction: "LR"
			}
		}*/
	};

	/**
	 * Styles for all available arrow types
     */
	readonly ARROW_STYLES: {[id: string]: IArrowStyle} = {
		include: {
			color: "#cccccc",
			colorHighlight: "#cccccc",
			colorHover: "#cccccc",
			dashes: false,
			circle: false,
			directed: true,
			smoothEdge: true,
			width: 1,
			alias: "Include-Edges"
		},
		modelinclude: {
			color: "black",
			colorHighlight: "black",
			colorHover: "black",
			dashes: false,
			circle: false,
			directed: false,
			smoothEdge: false,
			width: 1,
			alias: "Model Includes-Edges"
		},
		meta: {
			color: "green",
			colorHighlight: "green",
			colorHover: "green",
			dashes: true,
			circle: true,
			directed: true,
			smoothEdge: true,
			width: 1,
			alias: "Meta-Edges"
		},
		alignment: {
			color: "red",
			colorHighlight: "red",
			colorHover: "red",
			dashes: true,
			circle: false,
			directed: false,
			smoothEdge: true,
			width: 1,
			alias: "Alignment-Edges"
		},
		view: {
			color: "black",
			colorHighlight: "black",
			colorHover: "black",
			dashes: false,
			circle: false,
			directed: true,
			smoothEdge: true,
			width: 1,
			alias: "View-Edges"
		},
		structure: {
			color: "#cccccc",
			colorHighlight: "#cccccc",
			colorHover: "#cccccc",
			dashes: true,
			circle: false,
			directed: true,
			smoothEdge: true,
			width: 1,
			alias: "Structure-Edges"
		}
	};

	/**
	 * Styles of all available nodes
	 */
	readonly NODE_STYLES: {[id: string]: INodeStyle} = {
		model: {
			shape: "square",
			color: "#DDDDDD",
			colorBorder: "#222222",
			colorHighlightBorder: "#444444",
			colorHighlight: "#EEEEEE",
			dashes: false,
			alias: "Model-Nodes"
		},
		border: {
			shape: "circle",
			color: "#E8E8E8",
			colorBorder: "#D8D8D8",
			colorHighlightBorder: "#A8A8A8",
			colorHighlight: "#D8D8D8",
			dashes: false,
			alias: "Border-Nodes"
		},
		theory: {
			shape: "circle",
			color: "#D2E5FF",
			colorBorder: "#2B7CE9",
			colorHighlightBorder: "#2B7CE9",
			colorHighlight: "#D2E5FF",
			dashes: false,
			alias: "Theory-Nodes"
		},
		boundarycondition: {
			shape: "square",
			color: "#EEEEEE",
			colorBorder: "#DDDDDD",
			colorHighlightBorder: "#CCCCCC",
			colorHighlight: "#DDDDDD",
			dashes: true,
			alias: "Boundary-Condition-Nodes"
		}
	};

	/**
	 * Available graph types (for MMT Menu)
	 */
	readonly GRAPH_TYPES: IGraphMenuEntry[] = [
		{
			id: "thgraph",
			menuText: "Th. Graph",
			tooltip: ""
		},
		{
			id: "pgraph",
			menuText: "P Graph",
			tooltip: ""
		},
		{
			id: "docgraph",
			menuText: "Doc Graph",
			tooltip: ""
		},
		{
			id: "archivegraph",
			menuText: "Archive Graph",
			tooltip: ""
		},
		{
			id: "mpd",
			menuText: "MPD Graph",
			tooltip: "MPD Graph-Viewer"
		}
	];

	// For Backend
	static readonly graphDataURLTypeParameterName = "key";
	static readonly graphDataURLDataParameterName = "uri";

	// For TGView
	static readonly graphDataURLTypeParameterNameTGView = "type";
	static readonly graphDataURLDataParameterNameTGView = "graphdata";
	static readonly graphDataURLHighlightParameterNameTGView = "highlight";
	static readonly graphDataURLSourceParameterNameTGView = "source";
	static readonly graphDataURLDataSourceParameterNameTGView = "uri";
}




/**
 * Options that an be passed to TGView
 */
export interface ITGViewOptions {
    serverBaseURL: string;
    serverUrl?: string;

    isMathhub: boolean;
    viewOnlyMode: boolean;

    source?: string; // TODO: This should be something like "uri" | "html" | undefined
    type?: string;
    graphdata?: string;
    highlight?: string;

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
import { Options as VOptions, NodeOptions } from 'vis';

// @ts-check
import { getParameterByName } from './utils';
import { IDirtyGraph } from './graph/visgraph';

/**
 * Represents Options for TGView
 * @constructor
 */
export class Configuration {
	constructor(preferences: Partial<ITGViewOptions>) {

		// find the main element (whatever it is)
		const elementRef = preferences.mainContainer || 'tgViewMainEle';
		const mainContainer = typeof elementRef === 'string' ? document.getElementById(elementRef) : elementRef instanceof HTMLElement ? elementRef : elementRef.get(0);

		this.preferences = {
			serverBaseURL: preferences.serverBaseURL || '/',
			serverUrl: preferences.serverUrl,
			menuUrl: preferences.menuUrl,

			isMathhub: preferences.isMathhub === undefined ? true : preferences.isMathhub,
			viewOnlyMode: preferences.viewOnlyMode || false,

			source: preferences.source || getParameterByName(Configuration.graphDataURLSourceParameterNameTGView) || undefined,
			type: preferences.type || getParameterByName(Configuration.graphDataURLTypeParameterNameTGView) || undefined,
			graphdata: preferences.graphdata || getParameterByName(Configuration.graphDataURLDataParameterNameTGView) || undefined,
			
			json: preferences.json || undefined,

			highlight: preferences.highlight || getParameterByName(Configuration.graphDataURLHighlightParameterNameTGView) || undefined,

			mainContainer: mainContainer,
			prefix: preferences.prefix || 'custom-prefix-',
		}

		/**
		 * The base URL of all requests to the server
		 * @type {string}
		 */
		this.serverBaseURL = this.preferences.serverBaseURL || '/';

		/**
		 * The url to items on the server
		 * @todo: What exactly is this used for
		 * @type {string} 
		 */
		this.serverUrl = this.serverBaseURL || (window.location.protocol == 'file:' ? '/' : '/mh/mmt/');

		// if we have an external serverURL, use it
		if (this.preferences.serverUrl !== undefined) {
			this.serverUrl = this.preferences.serverUrl;
		}

		// if we are not on MathHub, the server url is '/'
		if (!this.preferences.isMathhub) {
			this.serverUrl = '/';
		}

		// menu url magic
		// TODO: This should be a promise or something returning the menu entries
		// TODO: Same for the node values
		const menuUrl = this.preferences.menuUrl === undefined ? (this.serverUrl + ':jgraph/menu?id=' ) : this.preferences.menuUrl;

		this.menuEntriesURL = (id?: string) => {
			if (typeof menuUrl === 'string') {
				return menuUrl + (id || '');
			} else {
				return menuUrl(id, this.serverUrl);
			}
		}

		// URL parts for getting graphdata, construction looks like:
		// graphDataURL + graphDataURLTypeParameterName + concreteTypeValue + "&" + graphDataURLDataParameterName + concreteGraphdataValue
		this.graphDataURL = this.serverUrl + ':jgraph/json?';
	}

	/** Options that were set externally */
	readonly preferences: ResolvedTGViewOptions

	// TODO: Can one of these two be made private?
	// or removed entirely?

	/** the server base url */
	readonly serverBaseURL: string;

	/** the server url */
	readonly serverUrl: string;

	/**
	 * Builds an url to get a menu entry from
	 * @param id Id of menu to get entries from
	 */
	readonly menuEntriesURL: (id?: string) => string;

	/** the url to the graph data */
	readonly graphDataURL: string;

	/**
	 * Colors to select the colorizing nodes in a graph
	 * @type {string[]}
	 */
	readonly colorizingNodesArray = [
		'#CCCCFF',
		'#FFFFCC',
		'#FFCC99',
		'#CCFFCC',
		'#DDDDDD',
		'#FFCCCC'
	];

	/**
	 * Color to used for highlighting nodes given by URI parameter
	 */
	readonly highlightColorByURI = '#ff8080';

	/**
	 * Options for the legend panel
	 */
	readonly LEGEND_PANEL_OPTIONS: vis.Options =
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
			} as NodeOptions,
			edges:
			{
				smooth:
				{
					enabled: true,
					type: 'straightCross',
					roundness: 0.3
				}
			},
		};

	/**
	 * Options for the TheoryGraph API
	 */
	readonly THEORY_GRAPH_OPTIONS: VOptions = {
		physics: {
			enabled: false,
			solver: 'barnesHut',
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
		} as NodeOptions,
		edges: {
			smooth: {
				enabled: true,
				type: 'straightCross',
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
	readonly ARROW_STYLES: { [id: string]: IArrowStyle } = {
		include: {
			color: '#cccccc',
			colorHighlight: '#cccccc',
			colorHover: '#cccccc',
			dashes: false,
			circle: false,
			directed: true,
			smoothEdge: true,
			width: 1,
			alias: 'Include-Edges'
		},
		attack: {
		color: "#673232",
		colorHighlight: "#7e1b1b",
		colorHover: "#673232",
		dashes: false,
		circle: false,
		directed: true,
		smoothEdge: true,
		width: 1,
		alias: "Attack-Edges"
	    },
		modelinclude: {
			color: 'black',
			colorHighlight: 'black',
			colorHover: 'black',
			dashes: false,
			circle: false,
			directed: false,
			smoothEdge: false,
			width: 1,
			alias: 'Model Includes-Edges'
		},
		meta: {
			color: 'green',
			colorHighlight: 'green',
			colorHover: 'green',
			dashes: true,
			circle: true,
			directed: true,
			smoothEdge: true,
			width: 1,
			alias: 'Meta-Edges'
		},
		alignment: {
			color: 'red',
			colorHighlight: 'red',
			colorHover: 'red',
			dashes: true,
			circle: false,
			directed: false,
			smoothEdge: true,
			width: 1,
			alias: 'Alignment-Edges'
		},
		view: {
			color: 'black',
			colorHighlight: 'black',
			colorHover: 'black',
			dashes: false,
			circle: false,
			directed: true,
			smoothEdge: true,
			width: 1,
			alias: 'View-Edges'
		},
		structure: {
			color: '#cccccc',
			colorHighlight: '#cccccc',
			colorHover: '#cccccc',
			dashes: true,
			circle: false,
			directed: true,
			smoothEdge: true,
			width: 1,
			alias: 'Structure-Edges'
		}
	};

	/**
	 * Styles of all available nodes
	 */
	readonly NODE_STYLES: { [id: string]: INodeStyle } = {
		model: {
			shape: 'square',
			color: '#DDDDDD',
			colorBorder: '#222222',
			colorHighlightBorder: '#444444',
			colorHighlight: '#EEEEEE',
			dashes: false,
			alias: 'Model-Nodes'
		},
	 sceptically_accepted: {
		shape: "circle",
		color: "#ff9900",
		colorBorder: "#ffa31a",
		colorHighlightBorder: "#ffad33",
		colorHighlight: "#ffb84d",
		dashes: false,
		alias: "Sceptically Accepted"
	  },
	  credulously_accepted: {
		shape: "circle",
		color: "#009900",
		colorBorder: "#008000",
		colorHighlightBorder: "#00b300",
		colorHighlight: "#00cc00",
		dashes: false,
		alias: "Credulously Accepted"
	  },
	  rejected: {
		shape: "circle",
		color: "#ff4d4d",
		colorBorder: "#ff0000",
		colorHighlightBorder: "#ff6666",
		colorHighlight: "#ff8080",
		dashes: false,
		alias: "Rejected-Nodes"
	  },
		border: {
			shape: 'circle',
			color: '#E8E8E8',
			colorBorder: '#D8D8D8',
			colorHighlightBorder: '#A8A8A8',
			colorHighlight: '#D8D8D8',
			dashes: false,
			alias: 'Border-Nodes'
		},
		theory: {
			shape: 'circle',
			color: '#D2E5FF',
			colorBorder: '#2B7CE9',
			colorHighlightBorder: '#2B7CE9',
			colorHighlight: '#D2E5FF',
			dashes: false,
			alias: 'Theory-Nodes'
		},
		boundarycondition: {
			shape: 'square',
			color: '#EEEEEE',
			colorBorder: '#DDDDDD',
			colorHighlightBorder: '#CCCCCC',
			colorHighlight: '#DDDDDD',
			dashes: true,
			alias: 'Boundary-Condition-Nodes'
		}
	};

	/**
	 * Available graph types (for MMT Menu)
	 */
	readonly GRAPH_TYPES: IGraphMenuEntry[] = [
		{
			id: 'thgraph',
			menuText: 'Th. Graph',
			tooltip: ''
		},
		{
			id: 'pgraph',
			menuText: 'P Graph',
			tooltip: ''
		},
		{
			id: 'docgraph',
			menuText: 'Doc Graph',
			tooltip: ''
		},
		{
			id: 'archivegraph',
			menuText: 'Archive Graph',
			tooltip: ''
		},
		{
			id: 'mpd',
			menuText: 'MPD Graph',
			tooltip: 'MPD Graph-Viewer'
		}
	];

	// For Backend
	static readonly graphDataURLTypeParameterName = 'key';
	static readonly graphDataURLDataParameterName = 'uri';

	// For TGView
	static readonly graphDataURLTypeParameterNameTGView = 'type';
	static readonly graphDataURLDataParameterNameTGView = 'graphdata';
	static readonly graphDataURLHighlightParameterNameTGView = 'highlight';
	static readonly graphDataURLSourceParameterNameTGView = 'source';
	static readonly graphDataURLDataSourceParameterNameTGView = 'uri';
}




/**
 * Options that an be passed to TGView
 */
export interface ITGViewOptions {
	serverBaseURL: string;
	serverUrl?: string;
	menuUrl?: string | ((id: string | undefined, base: string) => string)

	isMathhub: boolean;
	viewOnlyMode: boolean;

	source?: string; // TODO: This should be something like "uri" | "html" | undefined
	type?: string;
	graphdata?: string;
	json?: IDirtyGraph;
	highlight?: string;

	mainContainer: HTMLElement | JQuery<HTMLElement> | string | null;
	prefix: string; // TODO: Rename this to elementPrefix
}

export interface ResolvedTGViewOptions extends ITGViewOptions {
	mainContainer: HTMLElement | null
}

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
export interface IArrowStyle extends IStyleCommon {
	circle: boolean;
	directed: boolean;
	smoothEdge: boolean;
	width: number;
}

/**
 * A Style for a node
 */
export interface INodeStyle extends IStyleCommon {
	shape: 'square' | 'circle' | 'ellipse';
}

/**
 * A Graph Type as available in the MMT Menu
 */
interface IGraphMenuEntry {
	id: string;
	menuText: string;
	tooltip: string;
}

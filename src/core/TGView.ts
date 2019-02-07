import { default as $ } from "jquery";

import { ITGViewOptions, Options } from "../options.js";
import StatusLogger from "../dom/StatusLogger.js";
import Resizer from "../dom/Resizer.js";
import ActionHistory from "./ActionHistory.js";
import TheoryGraph from "./TheoryGraph.js";
import { setLocation, getParameterByName } from "../utils.js";
import DOMCreator from "../dom/DOMCreator.js";
import LegendPanel from "../dom/legendPanel.js";
import TGViewDOMListener from "../dom/GlobalListener.js";
import InteractionUI from "../dom/InteractionUI.js";
import GraphTreeMenu from "../dom/GraphTreeMenu.js";

export default class TGView {
	constructor(externalOptions: Partial<ITGViewOptions>) {
		// parse options and create dom
		this.options = new Options(externalOptions);
		this.dom = new DOMCreator(this.options.external.mainContainer, this.options);

		// initialize basic UI components
		this.resizer = new Resizer(this.options);
		this.logger = new StatusLogger(this.options.external.prefix + "statusBar", this.options);

		// create history logger and initialize it with the theory graph
		this.historyLogger = new ActionHistory();
		this.theoryGraph = new TheoryGraph(this.options.external.prefix + "mynetwork", this.logger, this.historyLogger); // TODO: Consider passing options into theorygraph directly
		this.historyLogger.init(this.theoryGraph);

		// create remaining dom
		this.legendPanel = new LegendPanel(this.options.external.prefix + "mynetworkLegend", this.options, this.logger);
		this.tgDomListener = new TGViewDOMListener(this.theoryGraph, this.options);
		this.ui = new InteractionUI(this.theoryGraph, this.tgDomListener, this.logger, this.options, this.historyLogger, this);
		this.treeMenu = new GraphTreeMenu(this, this.options);

		// update the theory graph
		this.theoryGraph.onConstructionDone = this.updateNetworkOnFirstCall.bind(this);
		this.theoryGraph.setOptions(this.options);

		// and initialize all the things
		this.init();
	}

	private readonly options: Options;
	private readonly dom: DOMCreator;

	private readonly resizer: Resizer;
	private readonly logger: StatusLogger;

	private historyLogger: ActionHistory;
	private theoryGraph: TheoryGraph;

	private legendPanel: LegendPanel;
	private tgDomListener: TGViewDOMListener;
	private ui: InteractionUI;
	private treeMenu: GraphTreeMenu;

	private recievedDataJSON: string = "";
	private lastGraphDataUsed = "";
	private lastGraphTypeUsed = "";

	/**
	 * Initalizes everything, should only be called once
	 */
	private init() {

		// If the menu element is clicked // TODO: Custom
		$(".custom-menu-side li").click(() => {
			var type = $(this).attr("data-action");

			if (type != "close") {
				this.createNewGraph(type, this.lastGraphDataUsed);
			}

			// Hide it AFTER the action was triggered
			$(".custom-menu-side").hide(10);
		});

		var source = this.options.external.source;

		if (source == "html") {
			this.theoryGraph.loadGraphByLocalStorage(getParameterByName(Options.graphDataURLDataSourceParameterNameTGView) || undefined);
		}
		else if (source == "param") {
			this.theoryGraph.loadGraphByURIParameter(getParameterByName(Options.graphDataURLDataSourceParameterNameTGView) || undefined));
		}
		else if (source == "iframe") {
			this.waitForJSONMessage.bind(this)();
		}
		else {
			this.createNewGraph(this.options.external.type, this.options.external.graphdata);
		}
	}

	/**
	 * Creates a new graph, either loading it from a url or loading the graph data directly
	 * @param tp Type of graph to c
	 * @param gd 
	 */
	createNewGraph(tp?: string, gd?: string) {
		var type = tp || this.lastGraphTypeUsed;
		var graphdata = gd || this.lastGraphDataUsed;

		this.lastGraphTypeUsed = type;
		this.lastGraphDataUsed = graphdata;

		// console.log(this.options);

		if (this.options.external.isMathhub) {
			// fetch the url 
			var url = this.options.graphDataURL + Options.graphDataURLTypeParameterName + "=" + type + "&" + Options.graphDataURLDataParameterName + "=" + graphdata
			this.theoryGraph!.getGraph(url);

			var newURL = location.protocol + '//' + location.host + location.pathname + "?" + Options.graphDataURLTypeParameterNameTGView + "=" + type + "&" + Options.graphDataURLDataParameterNameTGView + "=" + graphdata;

			if (typeof this.options.external.highlight != "undefined") {
				newURL += "&" + Options.graphDataURLHighlightParameterNameTGView + "=" + this.options.external.highlight;
			}

			setLocation(newURL);
		} else {
			this.theoryGraph!.getGraph(graphdata);
		}
	}

	private waitForJSONMessage() {
		if (this.recievedDataJSON == "") {
			setTimeout(this.waitForJSONMessage.bind(this), 500);
		}
		else {
			this.theoryGraph!.loadJSONGraph(JSON.parse(this.recievedDataJSON));
			this.recievedDataJSON = "";
		}
	}

	updateNetworkOnFirstCall() {
		this.theoryGraph.colorizeNodesByName(this.options.external.highlight, this.options.highlightColorByURI);
		this.ui.generateEdgesNodesHideDiv();
		this.theoryGraph.hideEdges("graphmeta", true);

		var usedNodeTypes = this.theoryGraph.getUsedNodeTypes();
		var usedEdgeTypes = this.theoryGraph.getUsedEdgeTypes();

		this.legendPanel.load(usedNodeTypes, usedEdgeTypes);
	}
}
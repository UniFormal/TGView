import { default as $ } from 'jquery';

import { ITGViewOptions, Configuration } from '../Configuration';
import StatusLogger from '../dom/StatusLogger';
import Resizer from '../dom/Resizer';
import ActionHistory from './ActionHistory';
import TheoryGraph from '../graph/TheoryGraph';
import { setLocation, getParameterByName } from '../utils';
import DOMConstruct from '../dom/DOMConstruct';
import LegendPanel from '../graph/LegendPanel';
import GlobalListener from '../dom/GlobalListener';
import InteractionUI from '../dom/InteractionUI';
import GraphTreeMenu from '../dom/GraphTreeMenu';

export default class TGView {
	constructor(preferences: Partial<ITGViewOptions>) {
		// parse options and create dom
		this.config = new Configuration(preferences); // DONE
		this.dom = new DOMConstruct(this.config); // DONE

		// initialize basic UI components
		this.resizer = new Resizer(this.dom);  // DONE
		this.statusLogger = new StatusLogger(this.dom, 'statusBar');  // DONE

		// create history logger and initialize it with the theory graph
		this.actionHistory = new ActionHistory(); // DONE
		this.theoryGraph = new TheoryGraph(this.config, this.dom, 'mynetwork', this.statusLogger, this.actionHistory); // DONE
		this.actionHistory.init(this.theoryGraph);

		// create remaining dom
		this.legendPanel = new LegendPanel(this.dom, 'mynetworkLegend', this.config, this.statusLogger); // DONE
		this.tgDomListener = new GlobalListener(this.theoryGraph, this.config, this.dom, this); // DONE
		this.ui = new InteractionUI(this.dom, this.theoryGraph, this.tgDomListener, this.statusLogger, this.config, this.actionHistory, this);
		this.treeMenu = new GraphTreeMenu(this.config, this.dom, this); // DONE

		// update the theory graph
		this.theoryGraph.onConstructionDone = this.updateNetworkOnFirstCall.bind(this);

		// and initialize all the things
		this.init();
	}

	private config: Configuration;
	private dom: DOMConstruct;

	private resizer: Resizer;
	private statusLogger: StatusLogger;

	private actionHistory: ActionHistory;
	private theoryGraph: TheoryGraph;

	private legendPanel: LegendPanel;
	private tgDomListener: GlobalListener;
	private ui: InteractionUI;
	private treeMenu: GraphTreeMenu;

	recievedDataJSON: string = '';
	lastGraphDataUsed = '';
	private lastGraphTypeUsed = '';

	/**
	 * Initalizes everything, should only be called once
	 */
	private init() {

		// If the menu element is clicked // TODO: Custom
		this.dom.$('.custom-menu-side li').click(() => {
			var type = $(this).attr('data-action');

			if (type != 'close') {
				this.createNewGraph(type, this.lastGraphDataUsed);
			}

			// Hide it AFTER the action was triggered
			$('.custom-menu-side').hide(10);
		});

		var source = this.config.preferences.source;

		if (source == 'html') {
			this.theoryGraph.loadGraphByLocalStorage(getParameterByName(Configuration.graphDataURLDataSourceParameterNameTGView) || undefined);
		}
		else if (source == 'param') {
			this.theoryGraph.loadGraphByURIParameter(getParameterByName(Configuration.graphDataURLDataSourceParameterNameTGView) || undefined);
		}
		else if (source == 'iframe') {
			this.waitForJSONMessage.bind(this)();
		}
		else {
			this.createNewGraph(this.config.preferences.type, this.config.preferences.graphdata);
		}
	}

	/** Destroys everything and should fully unload TGView from memory */
	destroy() {
		// unregister click handlers
		this.dom.$('.custom-menu-side li').off('click');

		// destroy everything in reverse
		this.treeMenu.destroy();
		this.ui.destroy();
		this.tgDomListener.destroy();
		this.legendPanel.destroy();
		this.theoryGraph.destroy();
		this.actionHistory.destroy();
		this.statusLogger.destroy();
		this.resizer.destroy();
		this.dom.destroy();
		// this.config.destroy();
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

		if (this.config.preferences.isMathhub) {
			// fetch the url 
			var url = this.config.graphDataURL + Configuration.graphDataURLTypeParameterName + '=' + type + '&' + Configuration.graphDataURLDataParameterName + '=' + graphdata
			this.theoryGraph!.getGraph(url);

			var newURL = location.protocol + '//' + location.host + location.pathname + '?' + Configuration.graphDataURLTypeParameterNameTGView + '=' + type + '&' + Configuration.graphDataURLDataParameterNameTGView + '=' + graphdata;

			if (typeof this.config.preferences.highlight != 'undefined') {
				newURL += '&' + Configuration.graphDataURLHighlightParameterNameTGView + '=' + this.config.preferences.highlight;
			}

			setLocation(newURL);
		} else {
			this.theoryGraph.getGraph(graphdata);
		}
	}

	private waitForJSONMessage() {
		if (this.recievedDataJSON == '') {
			setTimeout(this.waitForJSONMessage.bind(this), 500);
		}
		else {
			this.theoryGraph!.loadJSONGraph(JSON.parse(this.recievedDataJSON));
			this.recievedDataJSON = '';
		}
	}

	private updateNetworkOnFirstCall() {
		this.theoryGraph.colorizeNodesByName(this.config.preferences.highlight, this.config.highlightColorByURI);
		this.ui.generateEdgesNodesHideDiv();
		this.theoryGraph.hideEdges('graphmeta', true);

		var usedNodeTypes = this.theoryGraph.getUsedNodeTypes();
		var usedEdgeTypes = this.theoryGraph.getUsedEdgeTypes();

		this.legendPanel.load(usedNodeTypes, usedEdgeTypes);
	}
}
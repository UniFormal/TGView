import $ from "../../deps/jquery/jquery-es.js";

import DOMCreator from '../dom/DOMCreator.js';
// import Clusterer from './Clusterer.js';
import ActionHistory from './ActionHistory.js';
import TheoryGraph from './theoryGraph.js';
import { StatusLogger } from '../dom/StatusLogger.js';
import Resizer from '../dom/Resizer.js';
import LegendPanel from '../dom/legendPanel.js';
import InteractionUI from '../dom/InteractionUI.js';
import GraphTreeMenu from '../dom/GraphTreeMenu.js';
import { Options } from '../options.js';
import TGViewDOMListener from '../dom/GlobalListener.js';
// import {setLocation, getRandomColor, rainbow, getParameterByName, getStartToEnd} from './utils.js';
import {setLocation, getParameterByName} from '../utils.js';


export default function TGViewContainerClass(externalOptions)
{
	var recievedDataJSON="";
	this.lastGraphDataUsed="";
	this.lastGraphTypeUsed="";
	var that=this;
	var resizer;
	var logger;
	var options=new Options(externalOptions);;
	var historyLogger;
	var theoryGraph;
	var legendPanel;
	var tgDomListener;
	var ui;				
	var treeMenu;
	
	this.createNewGraph = function(type, graphdata) 
	{
		var type=(typeof type =="undefined") ? that.lastGraphTypeUsed : type;
		var graphdata=(typeof graphdata =="undefined") ? that.lastGraphDataUsed : graphdata;
		
		that.lastGraphTypeUsed=type;
		that.lastGraphDataUsed=graphdata;
		
		console.log(options);
		
		if(options.external.isMathhub == true)
		{		
			theoryGraph.getGraph( graphDataURL+graphDataURLTypeParameterName+"="+ type + "&" + graphDataURLDataParameterName+"=" + graphdata);
			var newURL=location.protocol + '//' + location.host + location.pathname+"?"+graphDataURLTypeParameterNameTGView+"="+ type + "&" + graphDataURLDataParameterNameTGView+"=" + graphdata;
			
			if(typeof options.external.highlight != "undefined")
			{
				newURL+="&"+graphDataURLHighlightParameterNameTGView+"="+options.external.highlight;
			}
			
			setLocation(newURL);
		}
		else
		{
			theoryGraph.getGraph(graphdata);
		}	
	}
	
	var dom=new DOMCreator(options.external.mainContainer, options);
	// TODO: Pass through the dom elements everywhere
	
	$("#"+options.external.mainContainer).ready(function()
	{
		resizer=new Resizer(options);
		logger=new StatusLogger(options.external.prefix+"statusBar", options);
		historyLogger=new ActionHistory();
		theoryGraph=new TheoryGraph(options.external.prefix+"mynetwork", logger, historyLogger);
		historyLogger.init(theoryGraph);
		legendPanel=new LegendPanel(options.external.prefix+"mynetworkLegend", options, logger);
		tgDomListener= new TGViewDOMListener(theoryGraph, options);
		ui = new InteractionUI(theoryGraph, tgDomListener, logger, options, historyLogger, that);				
		treeMenu=new GraphTreeMenu(that, options);
					
		theoryGraph.onConstructionDone=updateNetworkOnFirstCall;				
				
		theoryGraph.setOptions(options);
		init();
	});
	
	function waitForJSONMessage()
	{
		if(recievedDataJSON == "")
		{
			setTimeout(waitForJSONMessage, 500);
		}
		else
		{
			theoryGraph.loadJSONGraph(JSON.parse(recievedDataJSON));
			recievedDataJSON="";
		}
	}
			
	function updateNetworkOnFirstCall()
	{
		theoryGraph.colorizeNodesByName(options.external.highlight, options.highlightColorByURI);
		ui.generateEdgesNodesHideDiv();	
		theoryGraph.hideEdges("graphmeta",true);
		
		var usedNodeTypes = theoryGraph.getUsedNodeTypes();
		var usedEdgeTypes = theoryGraph.getUsedEdgeTypes();
		
		legendPanel.load(usedNodeTypes, usedEdgeTypes);
	}
	
	function init()
	{	
		// If the menu element is clicked
		$(".custom-menu-side li").click(function()
		{
			var type=$(this).attr("data-action");
			
			if(type!="close")
			{
				that.createNewGraph(type, that.lastGraphDataUsed);
			}
				
			// Hide it AFTER the action was triggered
			$(".custom-menu-side").hide(10);
		});
	
		var source=options.external.source;
	
		if(source == "html")
		{
			theoryGraph.loadGraphByLocalStorage(getParameterByName(options.graphDataURLDataSourceParameterNameTGView));
		}
		else if(source == "param")
		{
			theoryGraph.loadGraphByURIParameter(getParameterByName(options.graphDataURLDataSourceParameterNameTGView));
		}
		else if(source == "iframe")
		{
			waitForJSONMessage();
		}
		else
		{
			// Starts downloading, creating and rendering graph
			that.createNewGraph(options.external.type, options.external.graphdata);	
		}
	}
		
}
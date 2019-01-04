function TGViewContainerClass(externalOptions)
{
	var recievedDataJSON="";
	this.lastGraphDataUsed="";
	this.lastGraphTypeUsed="";
	var that=this;
	var resizer;
	var logger;
	var options;
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
	
	
	var dom=new DOMCreator("tgViewMainEle");
	
	$("#tgViewMainEle").ready(function()
	{
		resizer=new Resizer();
		logger=new StatusLogger("statusBar");
		options=new Options(externalOptions);
		historyLogger=new ActionHistory();
		theoryGraph=new TheoryGraph("mynetwork", logger, historyLogger);
		historyLogger.init(theoryGraph);
		legendPanel=new LegendPanel("mynetworkLegend", options, logger);
		tgDomListener= new TGViewDOMListener(theoryGraph);
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
				that.createNewGraph(type, lastGraphDataUsed);
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
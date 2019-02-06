import vis from 'vis';

/**
 * 
 * @param {string} containerNameIn Name of containet to instantiate LegendPanel in
 * @param {import('../options').Options} optionsIn Options
 * @param {import('./StatusLogger').StatusLogger} statusLoggerIn 
 * @class
 */
export default function LegendPanel(containerNameIn, optionsIn, statusLoggerIn)
{
	var statusLogger=statusLoggerIn;
	var containerName=containerNameIn;
	var originalNodes = [];
	var originalEdges = [];
	var network = null;
	var nodes;
	var edges;
	// var that=this;
	var options=optionsIn;
	
	var smallNodeSize=5;
	var bigNodeSize=130;
	
	function positionNodes()
	{
		var nodeXY = network.DOMtoCanvas({x: 48, y: 20});	
		var nodeSizeBefore=-1;
		for(var i=0;i<originalNodes.length;i++)
		{	
			var currNodeSize=originalNodes[i].widthConstraint.minimum;
			if(nodeSizeBefore==bigNodeSize && currNodeSize==smallNodeSize)
			{
				nodeXY.x+=110;
			}
			else if (nodeSizeBefore==smallNodeSize && currNodeSize==smallNodeSize && originalNodes[i].id<210000)
			{
				nodeXY.x+=50;
			}
			else if (nodeSizeBefore==bigNodeSize && currNodeSize==bigNodeSize)
			{
				nodeXY.x+=165;
			}
			else
			{
				nodeXY.x+=175;
			}
			
			network.body.nodes[originalNodes[i].id].x=nodeXY.x;
			network.body.nodes[originalNodes[i].id].y=nodeXY.y;
			

			nodeSizeBefore=currNodeSize;
			
			console.log(nodeXY);
		}
	}
	
	this.load=function(usedNodeTypes, usedEdgeTypes)
	{
		for(var i=0;i<usedNodeTypes.length;i++)
		{
			var label="Node";
			if(typeof options.NODE_STYLES[usedNodeTypes[i]] !== "undefined")
			{
				label=options.NODE_STYLES[usedNodeTypes[i]].alias;
			}
			originalNodes.push({"id": 100000+i, "style":usedNodeTypes[i],"label":label, widthConstraint:{minimum:bigNodeSize, maximum:bigNodeSize}});
		}
		
		for(var i=0;i<usedEdgeTypes.length;i++)
		{
			var label="Default Edge";
			var edgeType=usedEdgeTypes[i];
			if(typeof options.ARROW_STYLES[edgeType] !== "undefined")
			{
				label=options.ARROW_STYLES[edgeType].alias;
			}
			else
			{
				edgeType=usedEdgeTypes[i].replace(/graph/i, "");
				if(typeof options.ARROW_STYLES[edgeType] !== "undefined")
				{
					label=options.ARROW_STYLES[edgeType].alias;
				}
			}
			
			
			originalNodes.push({"id": 200000+i,"label":"N", widthConstraint:{minimum:smallNodeSize, maximum:smallNodeSize}});
			originalNodes.push({"id": 210000+i,"label":"N", widthConstraint:{minimum:smallNodeSize, maximum:smallNodeSize}});
			originalEdges.push({"id": 300000+i, "style":edgeType,"label":label, "from": 200000+i, "to": 210000+i});
		}
		
		postprocessEdges();
		postprocessNodes();
		
		startRendering(true);
	}
	
	function postprocessNodes(nodesIn)
	{	
		if(typeof nodesIn =="undefined" )
		{
			nodesIn=originalNodes;
		}
		
		for(var i=0;i<nodesIn.length;i++)
		{
			if(nodesIn[i].style!=undefined && options.NODE_STYLES[nodesIn[i].style]!=undefined)
			{
				var styleInfos=options.NODE_STYLES[nodesIn[i].style];

				if(styleInfos.shape=="ellipse" || styleInfos.shape=="circle")
				{
					if((nodesIn[i].previewhtml!=undefined && nodesIn[i].previewhtml!="" && nodesIn[i].previewhtml.length>10) || (nodesIn[i].mathml!=undefined && nodesIn[i].mathml!="" && nodesIn[i].mathml.length>10))
						nodesIn[i].shape="circularImage";
					else
						nodesIn[i].shape="ellipse";
				}
				else if(styleInfos.shape=="square")
				{
					if((nodesIn[i].previewhtml!=undefined && nodesIn[i].previewhtml!="" && nodesIn[i].previewhtml.length>10) || (nodesIn[i].mathml!=undefined && nodesIn[i].mathml!="" && nodesIn[i].mathml.length>10))
						nodesIn[i].shape="image";
					else
						nodesIn[i].shape="square";
				}
				else
				{
					if((nodesIn[i].previewhtml!=undefined && nodesIn[i].previewhtml!="" && nodesIn[i].previewhtml.length>10) || (nodesIn[i].mathml!=undefined && nodesIn[i].mathml!="" && nodesIn[i].mathml.length>10))
						nodesIn[i].shape="image";
					else
						nodesIn[i].shape=styleInfos.shape;
				}
				
				if(typeof nodesIn[i].color=="undefined")
				{
					nodesIn[i].color={highlight:{}};
				}
				
				if(typeof nodesIn[i].shapeProperties=="undefined")
				{
					nodesIn[i].shapeProperties={};
				}
				
				if (typeof styleInfos.color!="undefined" && styleInfos.color!="") 
				{
					nodesIn[i].color.background=styleInfos.color;
				}
				if (typeof styleInfos.colorBorder!="undefined" && styleInfos.colorBorder!="") 
				{
					nodesIn[i].color.border=styleInfos.colorBorder;
				}
				if (typeof styleInfos.colorHighlightBorder!="undefined" && styleInfos.colorHighlightBorder!="") 
				{
					nodesIn[i].color.highlight.border=styleInfos.colorHighlightBorder;
				}
				if (typeof styleInfos.colorHighlight!="undefined" && styleInfos.colorHighlight!="") 
				{
					nodesIn[i].color.highlight.background=styleInfos.colorHighlight;
				}
				if (typeof styleInfos.dashes!="undefined" && styleInfos.dashes==true) 
				{
					nodesIn[i].shapeProperties.borderDashes=[5,5];
				}

			}
		}
	}
	
	function postprocessEdges(edgesIn)
	{
		if(typeof edgesIn =="undefined" )
		{
			edgesIn=originalEdges;
		}
		
		for(var i=0;i<edgesIn.length;i++)
		{
			if(edgesIn[i].style!=undefined && options.ARROW_STYLES[edgesIn[i].style]!=undefined)
			{
				var styleInfos=options.ARROW_STYLES[edgesIn[i].style];
				edgesIn[i].arrows = {to:{enabled:styleInfos.directed}};
				
				if(styleInfos.circle==true)
				{
					edgesIn[i].arrows.to.type="circle";
				}
				else
				{
					edgesIn[i].arrows.to.type="arrow";
				}

				if(styleInfos.smoothEdge==false)
				{
					edgesIn[i].smooth={enabled: false};
				}
				
				edgesIn[i].dashes=styleInfos.dashes;
				edgesIn[i].width=styleInfos.width;
				edgesIn[i].color={color:styleInfos.color, highlight:styleInfos.colorHighlight, hover:styleInfos.colorHover};
			}
		}
	}
	
	// Called when the Visualization API is loaded.
	function startRendering() 
	{
		statusLogger.setStatusText("Rendering Legend...");
		
		nodes = new vis.DataSet(originalNodes);
		edges = new vis.DataSet(originalEdges);
		
		// create a network
		var container = document.getElementById(containerName);
		var data = 
		{
			nodes: nodes,
			edges: edges
		};
		
		network = new vis.Network(container, data, options.LEGEND_PANEL_OPTIONS);
		//network.startSimulation(10); 
		
		network.on("stabilizationIterationsDone", function (params) 
		{
			network.stopSimulation();
			var options = 
			{
				physics: 
				{
					enabled: false
				}
			};
			network.setOptions(options);
			statusLogger.setStatusCursor('auto');
		});
		
		network.once("beforeDrawing", function (ctx) 
		{
			positionNodes();
			network.fit();
			statusLogger.setStatusText("");
		});
	}
}
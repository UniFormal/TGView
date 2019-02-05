import $ from "../../deps/jquery/jquery-es.js";

export default function TGViewDOMListener(theoryGraphIn, optionsIn)
{
	var options=optionsIn;
	var theoryGraph=theoryGraphIn;
	var that=this;
	var canvasTools;
	var ctxTools;
	var rectTools;
	var dragTools=false;
	var containerTools;
	var selectionMode=false;

	// addEventListener support for IE8
	function bindEvent(element, eventName, eventHandler) 
	{
		if (element.addEventListener)
		{
			element.addEventListener(eventName, eventHandler, false);
		} 
		else if (element.attachEvent) 
		{
			element.attachEvent('on' + eventName, eventHandler);
		}
	}

	bindEvent(window, 'message', function (e) 
	{
		recievedDataJSON = e.data;
	});

	$("#"+options.external.mainContainer).bind("contextmenu", function (event) 
	{
		// Avoid the real menu
		event.preventDefault();
	});


	$("#"+options.external.mainContainer).ready(function() 
	{
		//$('button').button();
		// Accordion
		$(".accordion").accordion({ header: "h3" });
		// Tabs
		$('#'+options.external.prefix+'tabs').tabs();
		// Button Set
		$("#"+options.external.prefix+"radio1").buttonset();
		$( "#"+options.external.prefix+"methodCluster" ).selectmenu();
			
		canvasTools=document.getElementById(options.external.prefix+'toolCanvas');
		ctxTools=canvasTools.getContext('2d');
		rectTools = {};
		containerTools = $("#"+options.external.prefix+"toolCanvas");

		var canvasOffset=containerTools.offset();
		var offsetX=canvasOffset.left;
		var offsetY=canvasOffset.top;
		
		containerTools.on("mousemove", function(e) 
		{

			if (dragTools==true && selectionMode==true) 
			{ 
				rectTools.w = e.offsetX  - rectTools.startX;
				rectTools.h = e.offsetY  - rectTools.startY ;

				ctxTools.clearRect(0, 0, canvasTools.width, canvasTools.height);
				ctxTools.setLineDash([5]);
				ctxTools.strokeStyle = "rgb(0, 102, 0)";
				ctxTools.strokeRect(rectTools.startX, rectTools.startY, rectTools.w, rectTools.h);
				ctxTools.setLineDash([]);
				ctxTools.fillStyle = "rgba(0, 255, 0, 0.2)";
				ctxTools.fillRect(rectTools.startX, rectTools.startY, rectTools.w, rectTools.h);
				console.log(rectTools.startX,rectTools.startY, rectTools.w, rectTools.h);
			}
			
		});

		containerTools.on("mousedown", function(e) 
		{
			if (selectionMode==true) 
			{ 
				rectTools.w=0;
				rectTools.h=0;
				rectTools.startX = e.offsetX ;
				rectTools.startY = e.offsetY ;
				dragTools = true;   
			}
		}); 

		containerTools.on("mouseup", function(e) 
		{
			if (dragTools==true) 
			{ 
				dragTools = false;
				theoryGraph.selectNodesInRect(rectTools);
				ctxTools.clearRect(0, 0, canvasTools.width, canvasTools.height);
				that.switchSelectionMode();
			}
		});
	});
	
		
	this.switchSelectionMode = function()
	{
		if(selectionMode==false)
		{
			$("#"+options.external.prefix+"toolCanvas").css("display","block");
			selectionMode=true;
			document.getElementById(options.external.prefix+'toolCanvas').style.cursor = "crosshair";
		}
		else
		{
			$("#"+options.external.prefix+"toolCanvas").css("display","none");
			selectionMode=false;
			document.getElementById(options.external.prefix+'toolCanvas').style.cursor = "auto";
		}
	}
}
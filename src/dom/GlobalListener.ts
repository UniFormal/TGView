import {default as $} from 'jquery';

import TheoryGraph from "../core/theoryGraph";
import { Options } from "../options";

export default class TGViewDOMListener {

	constructor(theoryGraphIn: TheoryGraph, optionsIn: Options) {
		this.options = optionsIn;
		this.theoryGraph = theoryGraphIn;

		this.bindEvent(window as any as Node, 'message', function(e: Event){
			// TODO: This is a typo and should be fixed. Also this is broken by scoping of variables
			//recievedDataJSON = (e as any).data;
		});

		$("#"+this.options.external.mainContainer).bind("contextmenu", function(event) 
		{
			// TODO: Allow the real context menu with the help of cmd / ctrl or something which is insanely useful for debugging
			// Avoid the real menu
			event.preventDefault();
		});

		$("#"+this.options.external.mainContainer).ready(() => {
			//$('button').button();
			// Accordion
			$(".accordion").accordion({ header: "h3" });
			// Tabs
			$('#'+this.options.external.prefix+'tabs').tabs();
			// Button Set
			$("#"+this.options.external.prefix+"radio1").buttonset();
			$( "#"+this.options.external.prefix+"methodCluster" ).selectmenu();
			
			this.canvasTools=document.getElementById(this.options.external.prefix+'toolCanvas')! as HTMLCanvasElement;
			this.ctxTools=this.canvasTools.getContext('2d')!;
			this.rectTools = {};
			this.containerTools = $("#"+this.options.external.prefix+"toolCanvas");

			var canvasOffset=this.containerTools.offset()!;
			var offsetX=canvasOffset.left;
			var offsetY=canvasOffset.top;
			
			this.containerTools.on("mousemove", (e) => {

				if (this.dragTools==true && this.selectionMode==true) 
				{ 
					this.rectTools.w = e.offsetX  - this.rectTools.startX!;
					this.rectTools.h = e.offsetY  - this.rectTools.startY!;

					this.ctxTools!.clearRect(0, 0, this.canvasTools!.width, this.canvasTools!.height);
					this.ctxTools!.setLineDash([5]);
					this.ctxTools!.strokeStyle = "rgb(0, 102, 0)";
					this.ctxTools!.strokeRect(this.rectTools.startX!, this.rectTools.startY!, this.rectTools.w!, this.rectTools.h!);
					this.ctxTools!.setLineDash([]);
					this.ctxTools!.fillStyle = "rgba(0, 255, 0, 0.2)";
					this.ctxTools!.fillRect(this.rectTools.startX!, this.rectTools.startY!, this.rectTools.w!, this.rectTools.h!);
					console.log(this.rectTools.startX,this.rectTools.startY, this.rectTools.w, this.rectTools.h);
				}
				
			});

			this.containerTools.on("mousedown", (e) => {
				if (this.selectionMode==true) 
				{ 
					this.rectTools.w=0;
					this.rectTools.h=0;
					this.rectTools.startX = e.offsetX ;
					this.rectTools.startY = e.offsetY ;
					this.dragTools = true;   
				}
			}); 

			this.containerTools.on("mouseup", (e) =>
			{
				if (this.dragTools==true) 
				{ 
					this.dragTools = false;
					this.theoryGraph.selectNodesInRect(this.rectTools!);
					this.ctxTools!.clearRect(0, 0, this.canvasTools!.width, this.canvasTools!.height);
					this.switchSelectionMode();
				}
			});
		});
	}

	private readonly options: Options;
	private readonly theoryGraph: TheoryGraph;
	
	private canvasTools: HTMLCanvasElement | undefined;
	private ctxTools: CanvasRenderingContext2D | undefined;
	private rectTools: Partial<{w: number, h: number, startX: number, startY: number}> = {};
	private dragTools: boolean = false;
	private containerTools: JQuery<HTMLElement> | undefined;
	private selectionMode = false;


	// addEventListener support for IE8
	// TODO: Do we really need this?
	private bindEvent(element: Node, eventName: string, eventHandler: EventListener) {
		if (element.addEventListener)
		{
			element.addEventListener(eventName, eventHandler, false);
		}
		else if ((element as any).attachEvent) 
		{
			(element as any).attachEvent('on' + eventName, eventHandler);
		}
	}
		
	private switchSelectionMode()
	{
		if(this.selectionMode==false)
		{
			$("#"+this.options.external.prefix+"toolCanvas").css("display","block");
			this.selectionMode=true;
			document.getElementById(this.options.external.prefix+'toolCanvas')!.style.cursor = "crosshair";
		}
		else
		{
			$("#"+this.options.external.prefix+"toolCanvas").css("display","none");
			this.selectionMode=false;
			document.getElementById(this.options.external.prefix+'toolCanvas')!.style.cursor = "auto";
		}
	}
}
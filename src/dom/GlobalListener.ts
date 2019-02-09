import {default as $} from 'jquery';

import TheoryGraph, { IRectangle } from '../graph/TheoryGraph';
import { Configuration } from '../Configuration';
import TGView from '..';
import DOMConstruct from './DOMConstruct';

export default class GlobalListener {

	constructor(private readonly theoryGraph: TheoryGraph, private readonly config: Configuration, private readonly dom: DOMConstruct, private readonly wrapper: TGView) {
		this.onMessage = this.onMessage.bind(this);

		$(window).bind('message', this.onMessage);
		
		this.dom.mainElement$.bind('contextmenu', (event) => 
		{
			// if the ctrl key or the meta key are pressed
			// show the default context menu 
			if (event.ctrlKey || event.metaKey) {
				event.stopImmediatePropagation();
				return;
			}

			// else prevent it from showing
			event.preventDefault();
		});

		this.dom.mainElement$.ready(() => {
			//$('button').button();
			// Accordion
			this.dom.$('.accordion').accordion({ header: 'h3' });
			// Tabs
			// TODO: Does not exist
			// this.dom.$$('tabs').tabs();
			// Button Set
			// TODO: Does not exist
			//this.dom.$$("radio1").buttonset();
			// this.dom.$$("methodCluster").selectmenu();
			
			this.canvasTools=this.dom.getElementById<HTMLCanvasElement>('toolCanvas');
			this.ctxTools=this.canvasTools.getContext('2d')!;
			this.rectTools = {};
			this.containerTools = this.dom.$$('toolCanvas');
			
			this.containerTools.on('mousemove', (e) => {

				if (this.dragTools==true && this.selectionMode==true) 
				{ 
					this.rectTools.w = e.offsetX  - this.rectTools.startX!;
					this.rectTools.h = e.offsetY  - this.rectTools.startY!;

					this.ctxTools!.clearRect(0, 0, this.canvasTools!.width, this.canvasTools!.height);
					this.ctxTools!.setLineDash([5]);
					this.ctxTools!.strokeStyle = 'rgb(0, 102, 0)';
					this.ctxTools!.strokeRect(this.rectTools.startX!, this.rectTools.startY!, this.rectTools.w!, this.rectTools.h!);
					this.ctxTools!.setLineDash([]);
					this.ctxTools!.fillStyle = 'rgba(0, 255, 0, 0.2)';
					this.ctxTools!.fillRect(this.rectTools.startX!, this.rectTools.startY!, this.rectTools.w!, this.rectTools.h!);
					console.log(this.rectTools.startX,this.rectTools.startY, this.rectTools.w, this.rectTools.h);
				}
				
			});

			this.containerTools.on('mousedown', (e) => {
				if (this.selectionMode==true) 
				{ 
					this.rectTools = {
						w: 0,
						h: 0,
						startX: e.offsetX,
						startY: e.offsetY,
					};

					this.dragTools = true;   
				}
			}); 

			this.containerTools.on('mouseup', (e) =>
			{
				if (this.dragTools==true) 
				{ 
					this.dragTools = false;
					this.theoryGraph.selectNodesInRect(this.rectTools as IRectangle);
					this.ctxTools!.clearRect(0, 0, this.canvasTools!.width, this.canvasTools!.height);
					this.switchSelectionMode();
				}
			});
		});
	}

	destroy() {
		// undo all the event handlers
		$(window).unbind('message', this.onMessage);
		this.dom.mainElement$.unbind('contextmenu');

		// 
		if (this.containerTools) {
			this.containerTools.off('mousemove');
			this.containerTools.off('mousedown');
			this.containerTools.off('mouseup');
		}

		// destroy the ui
		this.dom.$('.accordion').accordion('destroy');
		// this.dom.$$('tabs').tabs('destroy');
		this.dom.$$('radio1').buttonset('destroy');
		this.dom.$$('methodCluster').selectmenu('destroy');

		// reset a couple of variables
		this.canvasTools = undefined;
		this.ctxTools = undefined;
		this.rectTools = {};
		this.containerTools = undefined;
	}
	
	private canvasTools: HTMLCanvasElement | undefined;
	private ctxTools: CanvasRenderingContext2D | undefined;
	private rectTools: Partial<IRectangle> = {};
	private dragTools: boolean = false;
	private containerTools: JQuery<HTMLElement> | undefined;
	private selectionMode = false;

	private onMessage(e: JQuery.TriggeredEvent<Window>) {
		this.wrapper.recievedDataJSON = (e.originalEvent as any).data;
	}
		
	switchSelectionMode()
	{
		if(this.selectionMode==false)
		{
			$('#'+this.config.preferences.prefix+'toolCanvas').css('display','block');
			this.selectionMode=true;
			document.getElementById(this.config.preferences.prefix+'toolCanvas')!.style.cursor = 'crosshair';
		}
		else
		{
			$('#'+this.config.preferences.prefix+'toolCanvas').css('display','none');
			this.selectionMode=false;
			document.getElementById(this.config.preferences.prefix+'toolCanvas')!.style.cursor = 'auto';
		}
	}
}
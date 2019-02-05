import $ from 'jquery';

import { Options } from "../options";

/**
 * Handles resizing of the window and main container
 * @class
 */
export default class Resizer {
	constructor(private optionsIn: Options) {
		const mainElement = document.getElementById(optionsIn.external.mainContainer)!;	
		$(mainElement).ready(() => {
			this.checkResize();
			window.setInterval(this.resizeMenuDiv.bind(this), 250);
			$(window).resize(this.checkResize.bind(this));

		});
	}

	private widthTreeBefore=350;
	private divW = 0;

	private resizeMenuDiv()
	{	
		var tree = document.getElementById(this.optionsIn.external.prefix+"theory_tree_div")!;

		var currWidth = tree.offsetWidth;

		if(this.widthTreeBefore != currWidth)
		{
			this.widthTreeBefore = currWidth;

			var sideNav = document.getElementById(this.optionsIn.external.prefix+'mySidenav')!;

			sideNav.style.width=(this.widthTreeBefore+16)+"px";
		}
	}

	private checkResize()
	{
		var theoryTree = document.getElementById(this.optionsIn.external.prefix+"theory_tree_div")!;

		var w = $(theoryTree).width() || 0;
		this.divW = w;

		var htmlCanvas = document.getElementById(this.optionsIn.external.prefix+'toolCanvas')!;
		htmlCanvas.style.width=((window.innerWidth-36)|0)+"px";
		htmlCanvas.style.height=((window.innerHeight-74)|0)+"px";
		
		htmlCanvas = document.getElementById(this.optionsIn.external.prefix+'mainbox')!;
		htmlCanvas.style.width=((window.innerWidth-36)|0)+"px";
		
		htmlCanvas = document.getElementById(this.optionsIn.external.prefix+'wholeNetwork')!;
		htmlCanvas.style.width=((window.innerWidth-36)|0)+"px";
		htmlCanvas.style.height=((window.innerHeight-74)|0)+"px";
	}
}
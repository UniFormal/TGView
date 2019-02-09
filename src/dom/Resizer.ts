import $ from 'jquery';

import DOMConstruct from "./DOMConstruct";

/**
 * Handles resizing of the window and main container
 * @class
 */
export default class Resizer {
	constructor(private dom: DOMConstruct) {
		this.doResize = this.doResize.bind(this);
		this.resizeMenuDiv = this.resizeMenuDiv.bind(this);
		this.dom.mainElement$.ready(() => {
			this.doResize();
			this.interval = window.setInterval(this.resizeMenuDiv, 250);
			$(window).resize(this.doResize);
		});
	}

	private interval: number | undefined;

	destroy() {
		if (this.interval) {
			window.clearInterval(this.interval);
			this.interval = undefined;
		}

		$(window).off('resize', this.doResize);
	}

	private widthTreeBefore = 350;

	private resizeMenuDiv() {
		const currWidth = this.dom.getElementById("theory_tree_div").offsetWidth;

		if (this.widthTreeBefore != currWidth) {
			this.widthTreeBefore = currWidth;

			var sideNav = this.dom.getElementById('mySidenav')!;
			sideNav.style.width = (this.widthTreeBefore + 16) + "px";
		}
	}

	private doResize() {
		const htmlCanvas = this.dom.getElementById('toolCanvas');
		htmlCanvas.style.width = ((window.innerWidth - 36) | 0) + "px";
		htmlCanvas.style.height = ((window.innerHeight - 74) | 0) + "px";

		const mainbox = this.dom.getElementById('mainbox')!;
		mainbox.style.width = ((window.innerWidth - 36) | 0) + "px";

		const wholeNetwork = this.dom.getElementById('wholeNetwork')!;
		wholeNetwork.style.width = ((window.innerWidth - 36) | 0) + "px";
		wholeNetwork.style.height = ((window.innerHeight - 74) | 0) + "px";
	}
}
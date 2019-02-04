// @ts-check
import $ from "../../deps/jquery/jquery-es.js";

/**
 * Handles resizing of the window and main container
 * @param {import('./options').Options} options 
 */
export default function Resizer(options)
{
	var widthTreeBefore=350;
	var divW = 0;

	$(document.getElementById(options.external.mainContainer)).ready(function()
	{
		checkResize();
		window.setInterval(resizeMenuDiv, 250);
		$(window).resize(checkResize);
	});
	
	function resizeMenuDiv()
	{	
		var tree = document.getElementById(options.external.prefix+"theory_tree_div");
		var currWidth=tree.offsetWidth;

		if(widthTreeBefore!=currWidth)
		{
			widthTreeBefore=currWidth;
			var sideNav = document.getElementById(options.external.prefix+'mySidenav');
			sideNav.style.width=(widthTreeBefore+16)+"px";
		}
	}

	function checkResize()
	{
		var w = $(document.getElementById(options.external.prefix+"theory_tree_div")).width();

		{
			divW = w;
			var htmlCanvas = document.getElementById(options.external.prefix+'toolCanvas');
			htmlCanvas.style.width=((window.innerWidth-36)|0)+"px";
			htmlCanvas.style.height=((window.innerHeight-74)|0)+"px";
			
			htmlCanvas = document.getElementById(options.external.prefix+'mainbox');
			htmlCanvas.style.width=((window.innerWidth-36)|0)+"px";
			
			htmlCanvas = document.getElementById(options.external.prefix+'wholeNetwork');
			htmlCanvas.style.width=((window.innerWidth-36)|0)+"px";
			htmlCanvas.style.height=((window.innerHeight-74)|0)+"px";
		}
	}
}
export default function Resizer(optionsIn)
{	
	var options=optionsIn;
	var widthTreeBefore=350;
	
	var divW = 0;
	jQuery("#"+options.external.mainContainer).ready(function()
	{
		checkResize();
		window.setInterval(resizeMenuDiv, 250);
		jQuery(window).resize(checkResize);
		//window.setInterval(checkResize, 250);
	});
	
	function resizeMenuDiv()
	{ 
		if(document.getElementById(options.external.prefix+'mySidenav') != null)
		{
			return;
		}
		
		var sideNav=document.getElementById(options.external.prefix+"mySidenav");
		var tree=document.getElementById(options.external.prefix+"theory_tree_div");
		
		var currWidth=tree.offsetWidth;

		if(widthTreeBefore!=currWidth)
		{
			widthTreeBefore=currWidth;
			sideNav.style.width=(widthTreeBefore+16)+"px";
		}
	}

	function checkResize()
	{
		var w = jQuery("#theory_tree_div").width();
		//console.log(w +"!="+ divW);
		//if (w != divW) 
		{
			divW = w;
			
			var treeDiv = jQuery('#theory_tree_div');
			
			
			var htmlCanvas = document.getElementById(options.external.prefix+'toolCanvas');
			htmlCanvas.width = (window.innerWidth-36)|0;
			htmlCanvas.height = (window.innerHeight-74)|0;
			htmlCanvas.style.width=htmlCanvas.width+"px";
			htmlCanvas.style.height=htmlCanvas.height+"px";
			
			
			
			htmlCanvas = document.getElementById(options.external.prefix+'mainbox');
			htmlCanvas.width = (window.innerWidth-36)|0;
			htmlCanvas.style.width=htmlCanvas.width+"px";
			
			htmlCanvas = document.getElementById(options.external.prefix+'wholeNetwork');
			htmlCanvas.width = (window.innerWidth-36)|0;
			htmlCanvas.height = (window.innerHeight-74)|0;
			htmlCanvas.style.width=htmlCanvas.width+"px";
			htmlCanvas.style.height=htmlCanvas.height+"px";
		}
	}
}
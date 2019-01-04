function Resizer()
{	
	var widthTreeBefore=350;
	
	var divW = 0;
	jQuery(document).ready(function()
	{
		checkResize();
		window.setInterval(resizeMenuDiv, 250);
		jQuery(window).resize(checkResize);
		//window.setInterval(checkResize, 250);
	});
	
	function resizeMenuDiv()
	{ 
		if(document.getElementById('mySidenav') != null)
		{
			return;
		}
		
		var sideNav=document.getElementById("mySidenav");
		var tree=document.getElementById("theory_tree_div");
		
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
			
			
			var htmlCanvas = document.getElementById('toolCanvas');
			htmlCanvas.width = (window.innerWidth-36)|0;
			htmlCanvas.height = (window.innerHeight-74)|0;
			htmlCanvas.style.width=htmlCanvas.width+"px";
			htmlCanvas.style.height=htmlCanvas.height+"px";
			
			
			
			htmlCanvas = document.getElementById('mainbox');
			htmlCanvas.width = (window.innerWidth-36)|0;
			htmlCanvas.style.width=htmlCanvas.width+"px";
			
			htmlCanvas = document.getElementById('wholeNetwork');
			htmlCanvas.width = (window.innerWidth-36)|0;
			htmlCanvas.height = (window.innerHeight-74)|0;
			htmlCanvas.style.width=htmlCanvas.width+"px";
			htmlCanvas.style.height=htmlCanvas.height+"px";
		}
	}
}
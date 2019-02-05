import {default as $} from 'jquery';
import 'jstree';

// import TGViewContainerClass from "../core/wrapper";
// TODO: Import properly
declare class TGViewContainerClass {}

import { Options } from "../options";

export default class GraphTreeMenu {

	constructor(wrapperIn: TGViewContainerClass, optionsIn: Options) {
		this.wrapper = wrapperIn;
		this.options = optionsIn;

		// TODO: This is a global event handler
		document.getElementById(this.options.external.mainContainer)!.onmousemove = this.handleMouseMove.bind(this);

		$('#'+this.options.external.prefix+'theory_tree').jstree(
			{
				'core' : 
				{
					"check_callback" : true,
					"themes" : { "stripes" : false,"icons":false },
				},	
				"types" : 
				{
					"default" : 
					{
					  "valid_children" : ["default","file"]
					}
				 },
		
				"plugins" : 
				[
					"contextmenu", "dnd", "search",
					"state", "types", "wholerow"
				]
			}); 
	}

	private wrapper: TGViewContainerClass;
	private options: Options;

	private alreadyAdded = [];


	private lazyParent = "#";
	private currentMouseX = 0;
	private currentMouseY = 0;

	private handleMouseMove(event: MouseEvent) 
	{
		//var dot, eventDoc, doc, body, pageX, pageY;
		var eventDoc, doc, body;
		event = event || window.event; // IE-ism

		// If pageX/Y aren't available and clientX/Y are,
		// calculate pageX/Y - logic taken from jQuery.
		// (This is to support old IE)
		// TODO: We don't really need to support old IE if it only adds weird code
		// that is what poly-fills are for
		if (event.pageX == null && event.clientX != null) 
		{
			eventDoc = (event.target && (event.target as any).ownerDocument) || document.getElementById(this.options.external.mainContainer)!;
			doc = eventDoc.documentElement;
			body = eventDoc.body;

			(event as any).pageX = event.clientX +
			  (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
			  (doc && doc.clientLeft || body && body.clientLeft || 0);
			  (event as any).pageY = event.clientY +
			  (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
			  (doc && doc.clientTop  || body && body.clientTop  || 0 );
		}

		this.currentMouseX = event.pageX;
		this.currentMouseY = event.pageY;
	}

	private addTreeNodes(data)
	{
		var childNodes=data;
		console.log(childNodes);
		console.log(lazyParent+";");
		for(var i=0;i<childNodes.length;i++)
		{
			var child=(childNodes[i].hasChildren==true) ? [{"id":"placeholder"}] : undefined;
			var node=
			{ 
				"text" : childNodes[i].menuText, 
				"id" : childNodes[i].id+Math.floor(Math.random() * 5000),
				"serverId" : childNodes[i].id,
				"graphdata": childNodes[i].uri, 
				"typeGraph": childNodes[i].type, 
				"children": child,
				"state" : {"opened": !childNodes[i].hasChildren}
			};
			$('#'+options.external.prefix+'theory_tree').jstree().create_node(lazyParent, node, 'last',function() {console.log("Child created");});
		}
	}	
	 
	var jsonURL="https://neuralocean.de/graph/test/menu.json";
	//var jsonURL=options.menuEntriesURL;
	$.get(jsonURL, addTreeNodes);

	$("#"+options.external.prefix+"theory_tree").on("select_node.jstree",
		function(evt, data)
		{
			wrapper.lastGraphDataUsed=data.node.original.graphdata;
			var y = currentMouseY - 8;
			var x = currentMouseX + 4;

			$(".custom-menu-side").finish().show(10).
			// In the right position (the mouse)
			css({
				top: y + "px",
				left: x + "px",
			});
			evt.preventDefault();
		}
	);
		
	$("#"+options.external.prefix+"theory_tree").on("open_node.jstree",
		function(evt, data)
		{
			$(".custom-menu-side").hide(10);
			lazyParent=data.node.id;
			data.node.children=[];
			if(alreadyAdded[lazyParent]!=true)
			{
				console.log(data.node);
				console.log(lazyParent+" added: "+alreadyAdded[lazyParent]);
				var jsonURL=options.menuEntriesURL+data.node.serverId;
				//var jsonURL="http://neuralocean.de/graph/test/menu.json";
				//alreadyAdded[lazyParent]=true;
				$.get(jsonURL, addTreeNodes);
			}
		}
	);
}
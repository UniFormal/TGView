import {default as $} from 'jquery';
import 'jstree';

import { Configuration } from '../Configuration';
import { ITGViewMenuEntry } from '../graph';
import TGView from '..';
import DOMConstruct from './DOMConstruct';

export default class GraphTreeMenu {

	constructor(private readonly config: Configuration, private readonly dom: DOMConstruct, private readonly wrapper: TGView) {
		this.handleMouseMove = this.handleMouseMove.bind(this);

		this.dom.mainElement.onmousemove = this.handleMouseMove;

		this.dom.$$('theory_tree').jstree(
		{
			'core' : 
			{
				'check_callback' : true,
				'themes' : { 'stripes' : false,'icons':false },
			},	
			'types' : 
			{
				'default' : 
				{
					'valid_children' : ['default','file']
				}
				},
	
			'plugins' : 
			[
				'contextmenu', 'dnd', 'search',
				'state', 'types', 'wholerow'
			]
		}); 

		var jsonURL='https://neuralocean.de/graph/test/menu.json' || this.config.menuEntriesURL;

		$.get(jsonURL, this.addTreeNodes.bind(this));
	
		this.dom.$$('theory_tree').on('select_node.jstree',
			(evt, data) =>
			{
				this.wrapper.lastGraphDataUsed=data.node.original.graphdata; // TODO: Fix me
				var y = this.currentMouseY - 8;
				var x = this.currentMouseX + 4;
	
				// TODO: no-globals
				this.dom.$('.custom-menu-side').finish().show(10).
				// In the right position (the mouse)
				css({
					top: y + 'px',
					left: x + 'px',
				});
				evt.preventDefault();
			}
		);
			
		this.dom.$('theory_tree').on('open_node.jstree',
			(evt, data) =>
			{
				$('.custom-menu-side').hide(10);
				this.lazyParent=data.node.id;
				data.node.children=[];
				if(this.alreadyAdded[this.lazyParent]!=true)
				{
					console.log(data.node);
					console.log(this.lazyParent+' added: '+this.alreadyAdded[this.lazyParent]);
					var jsonURL=this.config.menuEntriesURL+data.node.serverId;
					//var jsonURL="http://neuralocean.de/graph/test/menu.json";
					//this.alreadyAdded[lazyParent]=true;
					$.get(jsonURL, this.addTreeNodes.bind(this));
				}
			}
		);
	}

	destroy() {
		this.dom.mainElement.onmousemove = null;

		// remove jstree + handlers
		const tree = this.dom.$$('theory_tree');
		tree.jstree(true).destroy();
		tree.off('select_node.jstree');
		tree.off('open_node.jstree');
	}

	private readonly alreadyAdded: Record<string, boolean> = {};

	private lazyParent = '#';
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
			eventDoc = (event.target && (event.target as any).ownerDocument) || this.dom.mainElement;
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

	private addTreeNodes(data: ITGViewMenuEntry[])
	{
		var childNodes=data;
		console.log(childNodes);
		console.log(this.lazyParent+';');
		for(var i=0;i<childNodes.length;i++)
		{
			var child=(childNodes[i].hasChildren==true) ? [{'id':'placeholder'}] : undefined;
			var node=
			{ 
				'text' : childNodes[i].menuText, 
				'id' : childNodes[i].id+Math.floor(Math.random() * 5000),
				'serverId' : childNodes[i].id,
				'graphdata': childNodes[i].uri, 
				'typeGraph': childNodes[i].type, 
				'children': child,
				'state' : {'opened': !childNodes[i].hasChildren}
			};
			this.dom.$$('theory_tree').jstree().create_node(this.lazyParent, node, 'last',function() {console.log('Child created');});
		}
	}
}
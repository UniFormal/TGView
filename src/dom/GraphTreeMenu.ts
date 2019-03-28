import {default as $} from 'jquery';
import 'jstree';

import { Configuration } from '../Configuration';
import { ITGViewMenuEntry } from '../graph';
import TGView from '..';
import DOMConstruct from './DOMConstruct';

export default class GraphTreeMenu {

	constructor(private readonly config: Configuration, dom: DOMConstruct, private readonly wrapper: TGView) {
		this.tracker = new MouseTracker(dom.mainElement);
		
		this.treeElement = dom.$$('theory_tree'); 
		this.contextMenuElement = dom.$$('side-menu'); // .custom-menu-side

		// create a jstree
		this.treeElement.jstree({
			core: {
				check_callback: true,
				themes: {
					stripes: false,
					icons: false
				},
			},
			types: {
				default: {
					valid_children: ['default', 'file']
				}
			},
			plugins: [
				'dnd',
				'search',
				'state',
				'types',
				'wholerow'
			]
		});

		this.treeElement.on('select_node.jstree', (event, data) => {// TODO: Fix type of data
			// if the ctrl key or the meta key are pressed
			// show the default context menu 
			if (event.ctrlKey || event.metaKey) {
				event.stopImmediatePropagation();
				return;
			}

			event.preventDefault();
			
			// store the last uri we loaded in the parent
			this.wrapper.lastGraphDataUsed=data.node.original.graphdata;

			// show the context menu
			this.contextMenuElement.finish().show(10).css({
				top: this.tracker.mouseY() - 8,
				left: this.tracker.mouseX() + 4,
			});
		});
			
		this.treeElement.on('open_node.jstree', (_, data) => {
			// clear the context menu
			this.contextMenuElement.hide(10);

			// remove node children
			data.node.children=[];

			// and get data from the json url
			const jsonURL = this.config.menuEntriesURL(data.node.original.serverId);
			$.get(jsonURL, (node) => this.addTreeNodes(node, data.node.id));
		});

		// and load the tree nodes lazily
		$.get(this.config.menuEntriesURL(), (data) => this.addTreeNodes(data));
	}

	destroy() {
		this.tracker.destroy();

		// clear event handlers
		this.treeElement
			.off('select_node.jstree')
			.off('open_node.jstree')
			.jstree(true).destroy();
	}

	private tracker: MouseTracker;
	private treeElement: JQuery<HTMLElement>;
	private contextMenuElement: JQuery<HTMLElement>;

	/** Adds a list of tree nodes to the current parent */
	private addTreeNodes(nodes: ITGViewMenuEntry[], parentElement: string = '#')
	{
		const jstree = this.treeElement.jstree();
		nodes.forEach((childNode) => {
			const id = childNode.id+Math.floor(Math.random() * 5000);
			const children = childNode.hasChildren ? [{id: 'placeholder'}] : undefined;

			const node = { 
				id,
				
				text: childNode.menuText, 
				serverId: childNode.id,
				graphdata: childNode.uri, 
				typeGraph: childNode.type, 
				children,
				state: {
					opened: !childNode.hasChildren
				}
			};

			jstree.create_node(parentElement, node, 'last', function(){});
		});
	}
}

class MouseTracker {
	constructor(private element: HTMLElement) {
		this.element.onmousemove = this.handleMouseMove;
	}

	destroy() {
		this.element.onmousemove = null;
	}

	public mouseX(): number {
		return this.pageX;
	}
	public mouseY(): number {
		return this.pageY;
	}

	private pageX: number = 0;
	private pageY: number = 0;

	private readonly handleMouseMove = (event: MouseEvent) => {
		// TODO: Do we need this IE-ism?
		event = event || window.event;

		// store the current mouse move
		this.pageX = event.pageX;
		this.pageY = event.pageY;
	};
}
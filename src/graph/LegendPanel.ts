import vis from 'vis';

import DOMConstruct from '../dom/DOMConstruct';
import { Configuration } from '../Configuration';
import StatusLogger from '../dom/StatusLogger';

import {CleanNode, DirtyNode, DirtyEdge, CleanEdge, cleanNode, cleanEdge} from './visgraph';

export default class LegendPanel {
	
	constructor(dom: DOMConstruct, name: string, private readonly config: Configuration, private readonly statusLogger: StatusLogger) {
		this.container = dom.getElementById(name);
	}

	private readonly container: HTMLElement;

	private originalNodes: CleanNode[] = [];
	private originalEdges: CleanEdge[] = [];

	private network: vis.Network | undefined;
	
	private nodes: vis.DataSet<CleanNode> = null!;
	private edges: vis.DataSet<CleanEdge> = null!;

	private readonly smallNodeSize = 5;
	private readonly bigNodeSize = 130;

	destroy() {
		// clear edges, then nodes
		if (this.edges) { this.edges.clear(); }
		if (this.nodes) { this.nodes.clear(); }

		// destroy the network
		if (this.network) { this.network.destroy(); this.network = undefined; }
		
		// empty saved state
		this.originalEdges = [];
		this.originalNodes = [];
	}

	load(usedNodeTypes: string[], usedEdgeTypes: string[]) {
		const nodesToAdd: DirtyNode[] = [];
		const edgesToAdd: DirtyEdge[] = [];
		

		for(var i=0;i<usedNodeTypes.length;i++)
		{
			var label='Node';
			if(typeof this.config.NODE_STYLES[usedNodeTypes[i]] !== 'undefined')
			{
				label=this.config.NODE_STYLES[usedNodeTypes[i]].alias;
			}
			nodesToAdd.push({
				id:(100000+i) + '', 
				style: usedNodeTypes[i],
				label: label,
				widthConstraint: {
					minimum: this.bigNodeSize,
					maximum: this.bigNodeSize
				}
			});
		}
		
		for(var i=0;i<usedEdgeTypes.length;i++)
		{
			var label='Default Edge';
			var edgeType=usedEdgeTypes[i];
			if(typeof this.config.ARROW_STYLES[edgeType] !== 'undefined')
			{
				label=this.config.ARROW_STYLES[edgeType].alias;
			}
			else
			{
				edgeType=usedEdgeTypes[i].replace(/graph/i, '');
				if(typeof this.config.ARROW_STYLES[edgeType] !== 'undefined')
				{
					label=this.config.ARROW_STYLES[edgeType].alias;
				}
			}
			
			nodesToAdd.push({
				id: (200000+i)+'',
				label:'N',
				widthConstraint: {
					minimum: this.smallNodeSize, 
					maximum: this.smallNodeSize
				}
			});
			
			nodesToAdd.push({
				id: (210000+i)+'',
				label:'N', 
				widthConstraint: {
					minimum: this.smallNodeSize,
					maximum: this.smallNodeSize
				}
			});

			edgesToAdd.push({
				id: (300000+i)+'', 
				style: edgeType,
				label: label, 
				from: (200000+i)+'',
				to: (210000+i)+''
			});
		}
		
		this.originalEdges.push(...edgesToAdd.map(e => cleanEdge(e, this.config.ARROW_STYLES)));
		this.originalNodes.push(...nodesToAdd.map(n => cleanNode(n, this.config.NODE_STYLES)));
		
		this.startRendering();
	}

	private startRendering() {
		this.statusLogger.setStatusText('Rendering Legend...');
		
		this.nodes = new vis.DataSet(this.originalNodes);
		this.edges = new vis.DataSet(this.originalEdges);
		
		// create the network
		this.network = new vis.Network(this.container, { nodes: this.nodes, edges: this.edges }, this.config.LEGEND_PANEL_OPTIONS);
		//network.startSimulation(10); 
		
		this.network.on('stabilizationIterationsDone', () => 
		{
			this.network!.stopSimulation();
			var options = 
			{
				physics: 
				{
					enabled: false
				}
			};
			this.network!.setOptions(options);
			this.statusLogger.setStatusCursor('auto');
		});
		
		this.network.once('beforeDrawing',() => 
		{
			this.positionNodes();
			this.network!.fit();
			this.statusLogger.setStatusText('');
		});
	}

	private positionNodes()
	{
		var nodeXY = this.network!.DOMtoCanvas({x: 48, y: 20});	
		var nodeSizeBefore=-1;
		for(var i=0;i<this.originalNodes.length;i++)
		{	
			var currNodeSize=this.originalNodes[i].widthConstraint!.minimum!;
			if(nodeSizeBefore==this.bigNodeSize && currNodeSize==this.smallNodeSize)
			{
				nodeXY.x+=110;
			}
			else if (nodeSizeBefore==this.smallNodeSize && currNodeSize==this.smallNodeSize && parseInt(this.originalNodes[i].id!, 10)<210000)
			{
				nodeXY.x+=50;
			}
			else if (nodeSizeBefore==this.bigNodeSize && currNodeSize==this.bigNodeSize)
			{
				nodeXY.x+=165;
			}
			else
			{
				nodeXY.x+=175;
			}
			
			this.network!.body.nodes[this.originalNodes[i].id!].x=nodeXY.x;
			this.network!.body.nodes[this.originalNodes[i].id!].y=nodeXY.y;

			nodeSizeBefore=currNodeSize;
			
			console.log(nodeXY);
		}
	}
}
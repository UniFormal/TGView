import StatusLogger from "../ui/StatusLogger";
import { IGraphJSONEdge, IGraphJSONNode } from "../graph";

export default class LayoutBase {
	constructor(nodes: IGraphJSONNode[], edges: IGraphJSONEdge[], loggerIn: StatusLogger, ignoreEdgesByType?: IEdgeIgnorance) {
		this.logger = loggerIn;
		this.myAllNodes = nodes.map(GraphNode2Node); // TODO: Check if we do not already have the extra props
		this.edgesCount = edges.length;

		this.mapEdgesIntoNodes(edges, ignoreEdgesByType);
		this.identifySubgraphs();
	}

	protected readonly logger: StatusLogger;
	protected myAllNodes: INode[];
	protected edgesCount: number;
	protected countNodesInGraph : number[] = [];
	
	protected mapEdgesIntoNodes(edges: IGraphJSONEdge[], ignoreEdgesByType?: IEdgeIgnorance)
	{
		this.logger.setStatusText("Mapping Edges to Nodes...");
		var mappedNodes: {[key: string]: INode} = {};

		for(var i=0;i< this.myAllNodes.length;i++ )
		{
			this.myAllNodes[i].toConnected=[];
			this.myAllNodes[i].fromConnected=[];
			this.myAllNodes[i].connectedNodes=[];
			this.myAllNodes[i].connectedNodesById={};
			mappedNodes[this.myAllNodes[i].id]=this.myAllNodes[i];
			this.myAllNodes[i].modularityPart=0;
			this.myAllNodes[i].idx=i;
		}
		
		for(var i=0;i< edges.length;i++ )
		{
			if(edges[i].from == undefined || mappedNodes[edges[i].from]==undefined)
			{
				console.log("Not found: "+edges[i].from);
			}
			else
			{
				if(edges[i].to==undefined || mappedNodes[edges[i].to]==undefined)
				{
					console.log("Not found: "+edges[i].to);
				}
				else
				{
					if(typeof ignoreEdgesByType=="undefined" || typeof ignoreEdgesByType[edges[i].style]!="undefined" || typeof ignoreEdgesByType["graph"+edges[i].style]!="undefined")
					{
						mappedNodes[edges[i].from].toConnected.push(mappedNodes[edges[i].to]);
						mappedNodes[edges[i].to].fromConnected.push(mappedNodes[edges[i].from]);
						
						mappedNodes[edges[i].to].connectedNodes.push(mappedNodes[edges[i].from]);
						mappedNodes[edges[i].from].connectedNodes.push(mappedNodes[edges[i].to]);
						
						mappedNodes[edges[i].to].connectedNodesById[edges[i].from]=(mappedNodes[edges[i].from]);
						mappedNodes[edges[i].from].connectedNodesById[edges[i].to]=(mappedNodes[edges[i].to]);
					}
				}
			}
		}
	}

	private identifySubgraphs()
	{
		this.logger.setStatusText("Identify Subgraphs...");
		
		var nodesToCheck: INode[] = [];
		var graphNumber = 1;

		// iterate over all the nodes
		for(var i=0;i<this.myAllNodes.length;i++ )
		{
			var n=this.myAllNodes[i];
			
			if( n.graphNumber < 1 && n.hidden!=true)
			{
				nodesToCheck.push( n );
				this.countNodesInGraph.push( 0 );
				
				while( nodesToCheck.length > 0 )
				{
					this.countNodesInGraph[ this.countNodesInGraph.length - 1 ]++;
					
					var currNode = nodesToCheck.pop()!;
					currNode.graphNumber = graphNumber;
					
					for(var j=0;j<currNode.connectedNodes.length;j++ )
					{
						var u=currNode.connectedNodes[j];
						if( u.graphNumber < 1 && u.hidden!=true) // TODO: Was n.hidden, probably u.hidden
						{
							nodesToCheck.push( u );
						}
					}
				}
				graphNumber++;
			}
		}
	}
}

export type IEdgeIgnorance = {[tp: string]: boolean};

export interface INode extends IGraphJSONNode {
	graphNumber: number;
	hidden: boolean;
	toConnected: INode[];
	fromConnected: INode[];
	connectedNodes: INode[];
	connectedNodesById: {[id: string]: INode};
	modularityPart: number;
	idx: number;

	overallLength: number;
	overallVisited: number;
	overallWeight: number;
	visited: boolean;

	dispX: number,
	dispY: number,

	forcesFixed: boolean;
	membership?: boolean; // TODO: Figure out what this is
}
function GraphNode2Node(node: IGraphJSONNode): INode {
	return {
		graphNumber: -1,
		hidden: false,

		toConnected: [],
		fromConnected: [],

		connectedNodes: [],
		connectedNodesById: {},

		modularityPart: 0,
		idx: -1,

		overallLength: 0,
		overallVisited: 0,
		overallWeight: 0,
		visited: false,

		forcesFixed: false,
		
		dispX: 0,
		dispY: 0,

		// this is at the end so that if we already have some extra props
		// they get used
		...node, 
	}
}
import { StatusLogger } from "./StatusLogger";
import { IGraphJSONEdge, IGraphJSONNode } from "./graph";

export default class Clusterer {
	constructor(nodes: IGraphJSONNode[], edges: IGraphJSONEdge[], loggerIn: StatusLogger) {
		this.logger = loggerIn;
		this.myAllNodes = nodes.map(GraphNode2Node); // TODO: Check if we do not already have the extra props
		this.edgesCount = edges.length;

		this.mapEdgesIntoNodes(edges);
		this.identifySubgraphs();
	}

	private readonly logger: StatusLogger;
	private myAllNodes: INode[];
	private edgesCount: number;
	private countNodesInGraph : number[] = [];

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
	
	private mapEdgesIntoNodes(edges: IGraphJSONEdge[], ignoreEdgesByType?: {[tp: string]: boolean})
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
	
	cluster(populationSize: number = 10, rounds: number = 10, iterationsPerMutation: number =200 , finalIterations: number =1000) : IMembershipData
	{
		var memberships: IMembership[] = [];
		for(var i=0;i<populationSize;i++)
		{
			memberships.push({"data": [], "modularity":0});
			memberships[i].data=this.generateRandomSolution();
			memberships[i].modularity=this.calculateModularity(memberships[i].data);
		}

		
		for(var round=0;round<rounds;round++)
		{
			console.log("round: "+round+"/"+rounds);
			for(var i=1;i<populationSize;i++)
			{
				for(var j=0;j<iterationsPerMutation;j++)
				{
					if(Math.random()<0.95)
					{
						var nodeIdx=Math.floor(Math.random() * this.myAllNodes.length);
						memberships[i].modularity=this.findBestNewClusterForNode(nodeIdx, memberships[i].data, memberships[i].modularity);
					}
					else
					{
						var nodeIdx=Math.floor(Math.random() * this.myAllNodes.length);
						var randomCluster=Math.floor(Math.random() * this.myAllNodes.length);
						memberships[i].modularity=this.calculateModularityChangeOneNode(nodeIdx, memberships[i].data, randomCluster, memberships[i].modularity);
					}
				}
			}
			
			memberships.sort(function(membership1, membership2)
			{
				return membership2.modularity - membership1.modularity;
			});
			
			
			console.log(memberships[0].modularity);
			console.log(memberships[1].modularity);
			console.log(memberships[2].modularity);
			console.log(" ");
			
			for(var i=(populationSize/2)|0;i<populationSize;i++)
			{
				var rand1=Math.floor(Math.random() * ((memberships.length>>1) - 1));
				var rand2=Math.floor(Math.random() * ((memberships.length>>1) - 1));
				
				if(Math.random()<0.75)
				{
					memberships[i].data=this.combineTwoSolutionsRandom(memberships[rand1].data, memberships[rand2].data);
					memberships[i].modularity=this.calculateModularity(memberships[i].data);
				}
				else
				{
					memberships[i].data=this.combineTwoSolutionsClusterbased(memberships[rand1].data, memberships[rand2].data);
					memberships[i].modularity=this.calculateModularity(memberships[i].data);
				}
			}
			
		}
		
		for(var i=0;i<populationSize;i++)
		{
			for(var j=0;j<finalIterations;j++)
			{
				var nodeIdx=Math.floor(Math.random() * this.myAllNodes.length);
				memberships[i].modularity=this.findBestNewClusterForNode(nodeIdx, memberships[i].data, memberships[i].modularity);
			}
		}
		
		memberships.sort(function(membership1, membership2)
		{
			return membership2.modularity - membership1.modularity;
		});
		
		console.log(memberships[0].modularity);
		console.log(memberships[1].modularity);
		console.log(memberships[2].modularity);
		
		return memberships[0].data;
	}
	
	private combineTwoSolutionsRandom(membership1: IMembershipData, membership2: IMembershipData): IMembershipData
	{
		var newMembership=[];
		for(var i=0;i<membership1.length;i++)
		{
			if(Math.random()<0.5)
			{
				newMembership.push(membership1[i]);
			}
			else
			{
				newMembership.push(membership2[i]);
			}
		}
		return newMembership;
	}
	
	private combineTwoSolutionsClusterbased(membership1: IMembershipData, membership2: IMembershipData): IMembershipData
	{
		var newMembership=[];
		// var randNum=Math.random();
		var maxMember1Cluster=0;
		
		for(var i=0;i<membership1.length;i++)
		{
			newMembership.push(membership1[i]);
			
			maxMember1Cluster=Math.max(maxMember1Cluster,membership1[i]);
		}
		
		maxMember1Cluster++;
		
		var allClusterUsing=[];
		var clusterUsed=[];
		for(var i=0;i<membership2.length;i++)
		{
			if(typeof clusterUsed[membership2[i]] !== "undefined")
			{
				continue;
			}
			
			clusterUsed[membership2[i]]=1;
			if(Math.random()<0.1)
			{
				allClusterUsing[membership2[i]]=1;
			}
		}
		
		for(var i=0;i<membership2.length;i++)
		{
			if(typeof allClusterUsing[membership2[i]] !=="undefined")
			{
				newMembership[i]=membership2[i]+maxMember1Cluster;
			}
		}
		
		return newMembership;
	}
	
	private generateRandomSolution(): IMembershipData
	{
		var membership=[];
		
		if(Math.random()<0.75)
		{
			for(var i=0;i<this.myAllNodes.length;i++)
			{
				membership[i]=i;
			}
			return membership;
		}
		
		for(var i=0;i<this.myAllNodes.length;i++)
		{
			membership[i]=-1;
		}
		
		for(var i=0;i<this.myAllNodes.length;i++)
		{
			if(membership[i]!=-1)
			{
				continue;
			}
			
			var membershipCurr=i+this.myAllNodes.length;
			membership[i]=membershipCurr;
			
			for(var j=0;j<this.myAllNodes[i].connectedNodes.length;j++)
			{
				if((Math.random()<0.5 || this.myAllNodes[i].connectedNodes.length<3))
				{
					membership[this.myAllNodes[i].connectedNodes[j].idx]=membershipCurr;
				}
			}
		}
		
		for(var i=0;i<this.myAllNodes.length;i++)
		{
			if(membership[i]==-1)
			{
				membership[i]=i;
			}
		}
		
		return membership;
	}
	
	private findBestNewClusterForNode(nodeIdx: number, membershipIn: IMembershipData, oldModularity: number): number
	{	
		var clusterUsed: number[] = [];
		var maxModularity=-Infinity;
		var membershipBest=0;
		var originalCluster=membershipIn[nodeIdx];
		var membership=membershipIn.slice();
		
		for(var i=0;i<membershipIn.length;i++)
		{
			if(typeof clusterUsed[membershipIn[i]] !== "undefined")
			{
				continue;
			}
			
			clusterUsed[membershipIn[i]]=1;
			var newCluster=membershipIn[i];
			
			var modularity=this.calculateModularityChangeOneNode(nodeIdx, membership, newCluster, oldModularity);
			membership[nodeIdx]=originalCluster;
			
			if(modularity > maxModularity)
			{
				maxModularity=modularity;
				membershipBest=newCluster;
			}
		}
		
		//modularity=calculateModularityChangeOneNode(nodeIdx, membershipIn, membershipBest, oldModularity);
		
		membershipIn[nodeIdx]=membershipBest;
		return maxModularity;
	}
	
	private calculateModularityChangeOneNode(nodeIdx: number, membership: IMembershipData, newCluster: number, oldModularity: number): number
	{
		var numberOfLinks2=this.edgesCount*2;
				
		for(var i=0;i<this.myAllNodes.length;i++)
		{
			if(membership[nodeIdx]==membership[i] && nodeIdx!=i)
			{
				var isConnected=( typeof this.myAllNodes[nodeIdx].connectedNodesById[this.myAllNodes[i].id] === "undefined" ? 0 : 1);
				var tmp=isConnected-this.myAllNodes[nodeIdx].connectedNodes.length*this.myAllNodes[i].connectedNodes.length/numberOfLinks2;
				
				oldModularity-=tmp;
			}
		}
		
		for(var i=0;i<this.myAllNodes.length;i++)
		{
			if(membership[i]==membership[nodeIdx] && nodeIdx!=i)
			{
				var isConnected=( typeof this.myAllNodes[i].connectedNodesById[this.myAllNodes[nodeIdx].id] === "undefined" ? 0 : 1);
				var tmp=isConnected-this.myAllNodes[i].connectedNodes.length*this.myAllNodes[nodeIdx].connectedNodes.length/numberOfLinks2;
				
				oldModularity-=tmp;
			}
		}
		
		membership[nodeIdx]=newCluster;	
		for(var i=0;i<this.myAllNodes.length;i++)
		{
			if(membership[nodeIdx]==membership[i] && nodeIdx!=i)
			{
				var isConnected=( typeof this.myAllNodes[nodeIdx].connectedNodesById[this.myAllNodes[i].id] === "undefined" ? 0 : 1);
				var tmp=isConnected-this.myAllNodes[nodeIdx].connectedNodes.length*this.myAllNodes[i].connectedNodes.length/numberOfLinks2;
				
				oldModularity+=tmp;
			}
		}
		
		for(var i=0;i<this.myAllNodes.length;i++)
		{
			if(membership[i]==membership[nodeIdx] && nodeIdx!=i)
			{
				var isConnected=( typeof this.myAllNodes[i].connectedNodesById[this.myAllNodes[nodeIdx].id] === "undefined" ? 0 : 1);
				var tmp=isConnected-this.myAllNodes[i].connectedNodes.length*this.myAllNodes[nodeIdx].connectedNodes.length/numberOfLinks2;
				
				oldModularity+=tmp;
			}
		}
		return oldModularity;
	}
	
	private calculateModularity(membership: IMembershipData): number
	{
		var modularity=0;
		var numberOfLinks2=this.edgesCount*2;
		for(var i=0;i<this.myAllNodes.length;i++)
		{
			for(var j=0;j<this.myAllNodes.length;j++)
			{
				if(membership[i] == membership[j] && i!=j)
				{
					var isConnected=( typeof this.myAllNodes[i].connectedNodesById[this.myAllNodes[j].id] === "undefined" ? 0 : 1);
					//console.log("isConnected "+isConnected);
					//console.log(myAllNodes[i]);
					var tmp=isConnected-this.myAllNodes[i].connectedNodes.length*this.myAllNodes[j].connectedNodes.length/numberOfLinks2;
					
					modularity+=tmp;
				}
			}
		}
		return modularity;
	}
}

interface INode extends IGraphJSONNode {
	graphNumber: number;
	hidden: boolean;
	toConnected: INode[];
	fromConnected: INode[];
	connectedNodes: INode[];
	connectedNodesById: {[id: string]: INode};
	modularityPart: number;
	idx: number;
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

		// this is at the end so that if we already have some extra props
		// they get used
		...node, 
	}
}

interface IMembership {
	/** actual memberships */
	data: IMembershipData;
	modularity: number;
}

type IMembershipData = number[];
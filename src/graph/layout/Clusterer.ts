import LayoutBase from "./Base";
import { CleanNode, CleanEdge } from "../visgraph";
import StatusLogger from "../../dom/StatusLogger";

export default class Clusterer extends LayoutBase {
	constructor(nodes: CleanNode[], edges: CleanEdge[], loggerIn: StatusLogger) {
		super(nodes, edges, loggerIn)
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

interface IMembership {
	/** actual memberships */
	data: IMembershipData;
	modularity: number;
}

type IMembershipData = number[];
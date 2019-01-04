
function HelperLine(xStart, yStart, xEnd, yEnd)
{
	this.xStart = xStart;
	this.yStart = yStart;
	this.xEnd = xEnd;
	this.yEnd = yEnd;
}

function Clusterer(nodes, edges, loggerIn)
{
	var logger=loggerIn;
	var overAllColision;
	var myAllNodes=nodes;
	var field=[];
	var countNodesInGraph;
	var edgesCount=edges.length;
	var that=this;
	
	mapEdgesIntoNodes(edges);
	identifySubgraphs();
	
	function identifySubgraphs()
	{
		logger.setStatusText("Identify Subgraphs...");
		for(var i=0;i< myAllNodes.length;i++ )
		{
			myAllNodes[i].graphNumber=-1;
		}
		
		var nodesToCheck = [];
		countNodesInGraph = [];
		var graphNumber = 1;
		for(var i=0;i<myAllNodes.length;i++ )
		{
			var n=myAllNodes[i];
			if( n.graphNumber < 1 && n.hidden!=true)
			{
				nodesToCheck.push( n );
				countNodesInGraph.push( 0 );
				
				while( nodesToCheck.length > 0 )
				{
					countNodesInGraph[ countNodesInGraph.length - 1 ]++;
					
					var currNode = nodesToCheck.pop( );
					currNode.graphNumber = graphNumber;
					
					for(var j=0;j<currNode.connectedNodes.length;j++ )
					{
						var u=currNode.connectedNodes[j];
						if( u.graphNumber < 1 && n.hidden!=true)
						{
							nodesToCheck.push( u );
						}
					}
				}
				graphNumber++;
			}
		}
	}
	
	function mapEdgesIntoNodes(edges, ignoreEdgesByType)
	{
		logger.setStatusText("Mapping Edges to Nodes...");
		var mappedNodes=[];
		for(var i=0;i< myAllNodes.length;i++ )
		{
			myAllNodes[i].toConnected=[];
			myAllNodes[i].fromConnected=[];
			myAllNodes[i].connectedNodes=[];
			myAllNodes[i].connectedNodesById=[];
			mappedNodes[myAllNodes[i].id]=myAllNodes[i];
			myAllNodes[i].modularityPart=0;
			myAllNodes[i].idx=i;
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
	
	this.cluster=function(populationSize=10, rounds=10, iterationsPerMutation=200 , finalIterations=1000)
	{
		var memberships=[];
		for(var i=0;i<populationSize;i++)
		{
			memberships.push({"data": [], "modularity":0});
			memberships[i].data=generateRandomSolution();
			memberships[i].modularity=calculateModularity(memberships[i].data);
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
						var nodeIdx=Math.floor(Math.random() * myAllNodes.length);
						memberships[i].modularity=findBestNewClusterForNode(nodeIdx, memberships[i].data, memberships[i].modularity);
					}
					else
					{
						var nodeIdx=Math.floor(Math.random() * myAllNodes.length);
						var randomCluster=Math.floor(Math.random() * myAllNodes.length);
						memberships[i].modularity=calculateModularityChangeOneNode(nodeIdx, memberships[i].data, randomCluster, memberships[i].modularity);
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
					memberships[i].data=combineTwoSolutionsRandom(memberships[rand1].data, memberships[rand2].data);
					memberships[i].modularity=calculateModularity(memberships[i].data);
				}
				else
				{
					memberships[i].data=combineTwoSolutionsClusterbased(memberships[rand1].data, memberships[rand2].data);
					memberships[i].modularity=calculateModularity(memberships[i].data);
				}
			}
			
		}
		
		for(var i=0;i<populationSize;i++)
		{
			for(var j=0;j<finalIterations;j++)
			{
				var nodeIdx=Math.floor(Math.random() * myAllNodes.length);
				memberships[i].modularity=findBestNewClusterForNode(nodeIdx, memberships[i].data, memberships[i].modularity);
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
	
	function combineTwoSolutionsRandom(membership1, membership2)
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
	
	function combineTwoSolutionsClusterbased(membership1, membership2)
	{
		var newMembership=[];
		var randNum=Math.random();
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
	
	function generateRandomSolution()
	{
		var membership=[];
		
		if(Math.random()<0.75)
		{
			for(var i=0;i<myAllNodes.length;i++)
			{
				membership[i]=i;
			}
			return membership;
		}
		
		for(var i=0;i<myAllNodes.length;i++)
		{
			membership[i]=-1;
		}
		
		for(var i=0;i<myAllNodes.length;i++)
		{
			if(membership[i]!=-1)
			{
				continue;
			}
			
			var membershipCurr=i+myAllNodes.length;
			membership[i]=membershipCurr;
			
			for(var j=0;j<myAllNodes[i].connectedNodes.length;j++)
			{
				if((Math.random()<0.5 || myAllNodes[i].connectedNodes.length<3))
				{
					membership[myAllNodes[i].connectedNodes[j].idx]=membershipCurr;
				}
			}
		}
		
		for(var i=0;i<myAllNodes.length;i++)
		{
			if(membership[i]==-1)
			{
				membership[i]=i;
			}
		}
		
		return membership;
	}
	
	function findBestNewClusterForNode(nodeIdx, membershipIn, oldModularity)
	{	
		var clusterUsed=[];
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
			
			var modularity=calculateModularityChangeOneNode(nodeIdx, membership, newCluster, oldModularity);
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
	
	function calculateModularityChangeOneNode(nodeIdx, membership, newCluster, oldModularity)
	{
		var numberOfLinks2=edgesCount*2;
				
		for(var i=0;i<myAllNodes.length;i++)
		{
			if(membership[nodeIdx]==membership[i] && nodeIdx!=i)
			{
				var isConnected=( typeof myAllNodes[nodeIdx].connectedNodesById[myAllNodes[i].id] === "undefined" ? 0 : 1);
				var tmp=isConnected-myAllNodes[nodeIdx].connectedNodes.length*myAllNodes[i].connectedNodes.length/numberOfLinks2;
				
				oldModularity-=tmp;
			}
		}
		
		for(var i=0;i<myAllNodes.length;i++)
		{
			if(membership[i]==membership[nodeIdx] && nodeIdx!=i)
			{
				var isConnected=( typeof myAllNodes[i].connectedNodesById[myAllNodes[nodeIdx].id] === "undefined" ? 0 : 1);
				var tmp=isConnected-myAllNodes[i].connectedNodes.length*myAllNodes[nodeIdx].connectedNodes.length/numberOfLinks2;
				
				oldModularity-=tmp;
			}
		}
		
		membership[nodeIdx]=newCluster;	
		for(var i=0;i<myAllNodes.length;i++)
		{
			if(membership[nodeIdx]==membership[i] && nodeIdx!=i)
			{
				var isConnected=( typeof myAllNodes[nodeIdx].connectedNodesById[myAllNodes[i].id] === "undefined" ? 0 : 1);
				var tmp=isConnected-myAllNodes[nodeIdx].connectedNodes.length*myAllNodes[i].connectedNodes.length/numberOfLinks2;
				
				oldModularity+=tmp;
			}
		}
		
		for(var i=0;i<myAllNodes.length;i++)
		{
			if(membership[i]==membership[nodeIdx] && nodeIdx!=i)
			{
				var isConnected=( typeof myAllNodes[i].connectedNodesById[myAllNodes[nodeIdx].id] === "undefined" ? 0 : 1);
				var tmp=isConnected-myAllNodes[i].connectedNodes.length*myAllNodes[nodeIdx].connectedNodes.length/numberOfLinks2;
				
				oldModularity+=tmp;
			}
		}
		return oldModularity;
	}
	
	function calculateModularity(membership)
	{
		var modularity=0;
		var numberOfLinks2=edgesCount*2;
		for(var i=0;i<myAllNodes.length;i++)
		{
			for(var j=0;j<myAllNodes.length;j++)
			{
				if(membership[i] == membership[j] && i!=j)
				{
					var isConnected=( typeof myAllNodes[i].connectedNodesById[myAllNodes[j].id] === "undefined" ? 0 : 1);
					//console.log("isConnected "+isConnected);
					//console.log(myAllNodes[i]);
					var tmp=isConnected-myAllNodes[i].connectedNodes.length*myAllNodes[j].connectedNodes.length/numberOfLinks2;
					
					modularity+=tmp;
				}
			}
		}
		return modularity;
	}

}
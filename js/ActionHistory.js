
export default function ActionHistory()
{
	var theoryGraph;
	var historyStates=[];
	var undoneHistoryStates=[];
	var lastActionWasUndoRedo=0;
	var that=this;
	
	this.init=function(theoryGraphIn)
	{
		theoryGraph=theoryGraphIn;
	}
	
	this.addToStateHistory = function(func, parameterArray)
	{
		historyStates.push({"func":func, "param": parameterArray});
		if(lastActionWasUndoRedo==0)
		{
			undoneHistoryStates=[];
		}
		lastActionWasUndoRedo=0;
	}
	
	this.undoLastAction = function()
	{
		//console.log(historyStates);
		
		if(historyStates.length==0)
			return;
		
		lastActionWasUndoRedo=1;
		
		var lastState = historyStates.pop();
		//console.log(lastState);
		undoneHistoryStates.push(lastState);
		
		if(typeof lastState.func=="undefined")
			return;
		
		var repeatlastAction=true;
		
		if(lastState.func=="cluster")
		{
			theoryGraph.openCluster(lastState.param.clusterId);
			historyStates.pop();
		}
		else if(lastState.func=="uncluster")
		{
			theoryGraph.cluster(lastState.param.nodes,lastState.param.name,lastState.param.clusterId);
			historyStates.pop();
		}
		else if(lastState.func=="select")
		{
			theoryGraph.selectNodes([]);
			historyStates.pop();
		}
		else if(lastState.func=="unselect")
		{
			theoryGraph.selectNodes(lastState.param.nodes);
			historyStates.pop();
		}
		else if(lastState.func=="addNode")
		{
			theoryGraph.deleteNodes(lastState.param.node.id);
			historyStates.pop();
			repeatlastAction=false;
		}
		else if(lastState.func=="editNode")
		{
			theoryGraph.saveNode(lastState.param.oldNode);
			historyStates.pop();
		}
		else if(lastState.func=="deleteNodes")
		{
			for(var i=0;i<lastState.param.nodes.length;i++)
			{
				theoryGraph.addNode(lastState.param.nodes[i]);
				historyStates.pop();
			}
			
			for(var i=0;i<lastState.param.edges.length;i++)
			{
				theoryGraph.addEdge(lastState.param.edges[i]);
				historyStates.pop();
			}
		}
		else if(lastState.func=="addEdge")
		{
			theoryGraph.deleteEdges([lastState.param.edge.id]);
			historyStates.pop();
			repeatlastAction=false;
		}
		else if(lastState.func=="editEdge")
		{
			theoryGraph.saveEdge(lastState.param.oldEdge);
			historyStates.pop();
		}
		else if(lastState.func=="deleteEdges")
		{
			for(var i=0;i<lastState.param.edges.length;i++)
			{
				theoryGraph.addEdge(lastState.param.edges[i]);
				historyStates.pop();
			}
		}	
		else if(lastState.func=="cageNodes")
		{
			theoryGraph.removeNodeRegion(lastState.param.index);
		}
		else if(lastState.func=="hideNodes")
		{
			theoryGraph.hideNodesById(lastState.param.nodesToHide,!lastState.param.hidden);
			historyStates.pop();
		}
		else if(lastState.func=="hideEdges")
		{
			var edgeIds=[];
			
			for(var i=0;i<lastState.param.hideEdges.length;i++)
			{
				edgeIds.push(lastState.param.hideEdges[i].id);
			}
			
			theoryGraph.hideEdgesById(edgeIds,!lastState.param.hidden);
			historyStates.pop();
		}
		else if(lastState.func=="selectEdges")
		{
			theoryGraph.selectEdgesById([]);
			historyStates.pop();
		}
		
		
		if(repeatlastAction==true)
		{
			that.doLastAction();
		}
		lastActionWasUndoRedo=0;
	}

	this.redoLastAction = function()
	{
		if(undoneHistoryStates.length==0)
			return;
		
		lastActionWasUndoRedo=1;
		
		var lastState = undoneHistoryStates.pop();
		
		if(typeof lastState.func=="undefined")
			return;
				
		if(lastState.func=="cluster")
		{
			theoryGraph.cluster(lastState.param.nodes,lastState.param.name,lastState.param.clusterId);
		}
		else if(lastState.func=="uncluster")
		{
			theoryGraph.openCluster(lastState.param.clusterId);
		}
		else if(lastState.func=="select")
		{
			theoryGraph.selectNodes(lastState.param.nodes);
		}
		else if(lastState.func=="unselect")
		{
			theoryGraph.selectNodes([]);
		}
		else if(lastState.func=="addNode")
		{
			theoryGraph.addNode(lastState.param.node);
		}
		else if(lastState.func=="editNode")
		{
			theoryGraph.saveNode(lastState.param.newNode);
		}
		else if(lastState.func=="deleteNodes")
		{
			var toDelete=[];
			for(var i=0;i<lastState.param.edges.length;i++)
			{
				toDelete.push(lastState.param.edges[i].id);
			}
			theoryGraph.deleteEdges(toDelete);
			
			toDelete=[];
			for(var i=0;i<lastState.param.nodes.length;i++)
			{
				toDelete.push(lastState.param.nodes[i].id);
			}
			theoryGraph.deleteNodes(toDelete);
		}
		else if(lastState.func=="addEdge")
		{
			theoryGraph.addEdge(lastState.param.edge);
		}
		else if(lastState.func=="editEdge")
		{
			theoryGraph.saveEdge(lastState.param.newEdge);
		}
		else if(lastState.func=="deleteEdges")
		{
			var toDelete=[];
			for(var i=0;i<lastState.param.edges.length;i++)
			{
				toDelete.push(lastState.param.edges[i].id);
			}
			theoryGraph.deleteEdges(toDelete);
		}
		else if(lastState.func=="cageNodes")
		{
			theoryGraph.cageNodes(lastState.param.nodeIds, lastState.param.color);
		}
		else if(lastState.func=="hideNodes")
		{
			theoryGraph.hideNodesById(lastState.param.nodesToHide,lastState.param.hidden);
		}
		else if(lastState.func=="hideEdges")
		{
			var edgeIds=[];
			
			for(var i=0;i<lastState.param.hideEdges.length;i++)
			{
				edgeIds.push(lastState.param.hideEdges[i].id);
			}
			
			theoryGraph.hideEdgesById(edgeIds,lastState.param.hidden);
		}
		else if(lastState.func=="selectEdges")
		{
			theoryGraph.selectEdgesById(lastState.param.edges);
			historyStates.pop();
		}

		
		//undoneHistoryStates.pop();
		//that.doLastAction();
		lastActionWasUndoRedo=0;
	}

	this.doLastAction = function()
	{
		if(historyStates.length==0)
			return;

		lastActionWasUndoRedo=1;
		
		for(var i=historyStates.length-1;i>=0;i--)
		{
			var lastState = historyStates[i];
			if(lastState.func=="unselect")
			{
				theoryGraph.selectNodes([]);
				historyStates.pop();
				break;
			}
			else if(lastState.func=="select")
			{
				theoryGraph.selectNodes(lastState.param.nodes);
				historyStates.pop();
				break;
			}
		}

		
		lastActionWasUndoRedo=0;
	}
}
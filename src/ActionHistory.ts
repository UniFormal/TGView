// import TheoryGraph from './theoryGraph';

// TODO: For the moment we manually declare the theory graph class here
// because we have not yet updated the other file
declare class TheoryGraph {
	openCluster(p: any): void
	cluster(p1: any, p2: any, p3: any): void
	selectNodes(p: any): void
	deleteNodes(p: any): void
	saveNode(p: any): void
	addNode(p: any): void
	removeNodeRegion(p: any): void
	hideNodesById(p1: any, p2: any): void
	addEdge(p: any): void
	saveEdge(p: any): void
	deleteEdges(p: any): void
	hideEdgesById(p1: any, p2: any): void
	selectEdgesById(p: any): void
	cageNodes(p1: any, p2: any): any
}

/**
 * Represents a History of actions that occured
 */
export default class ActionHistory
{
	private theoryGraph: TheoryGraph | undefined;
	private historyStates: IAction[] = [];
	private undoneHistoryStates: IAction[] = [];
	private lastActionWasUndoRedo = 0; // TODO: Should this be a boolean?


	init(theoryGraphIn: TheoryGraph) {
		this.theoryGraph = theoryGraphIn;
	}
	
	addToStateHistory(func: IAction["func"], parameterArray: IAction["param"])
	{
		this.historyStates.push({"func": func, "param": parameterArray});
		if(this.lastActionWasUndoRedo==0)
		{
			this.undoneHistoryStates=[];
		}
		this.lastActionWasUndoRedo=0;
	}
	
	undoLastAction()
	{		
		if(this.historyStates.length==0)
			return;
		
		this.lastActionWasUndoRedo=1;
		
		var lastState = this.historyStates.pop()!;
		this.undoneHistoryStates.push(lastState);
		
		if(typeof lastState.func=="undefined")
			return;
		
		var repeatlastAction=true;
		
		if(lastState.func=="cluster")
		{
			this.theoryGraph!.openCluster(lastState.param.clusterId);
			this.historyStates.pop();
		}
		else if(lastState.func=="uncluster")
		{
			this.theoryGraph!.cluster(lastState.param.nodes,lastState.param.name,lastState.param.clusterId);
			this.historyStates.pop();
		}
		else if(lastState.func=="select")
		{
			this.theoryGraph!.selectNodes([]);
			this.historyStates.pop();
		}
		else if(lastState.func=="unselect")
		{
			this.theoryGraph!.selectNodes(lastState.param.nodes);
			this.historyStates.pop();
		}
		else if(lastState.func=="addNode")
		{
			this.theoryGraph!.deleteNodes(lastState.param.node.id);
			this.historyStates.pop();
			repeatlastAction=false;
		}
		else if(lastState.func=="editNode")
		{
			this.theoryGraph!.saveNode(lastState.param.oldNode);
			this.historyStates.pop();
		}
		else if(lastState.func=="deleteNodes")
		{
			for(var i=0;i<lastState.param.nodes.length;i++)
			{
				this.theoryGraph!.addNode(lastState.param.nodes[i]);
				this.historyStates.pop();
			}
			
			for(var i=0;i<lastState.param.edges.length;i++)
			{
				this.theoryGraph!.addEdge(lastState.param.edges[i]);
				this.historyStates.pop();
			}
		}
		else if(lastState.func=="addEdge")
		{
			this.theoryGraph!.deleteEdges([lastState.param.edge.id]);
			this.historyStates.pop();
			repeatlastAction=false;
		}
		else if(lastState.func=="editEdge")
		{
			this.theoryGraph!.saveEdge(lastState.param.oldEdge);
			this.historyStates.pop();
		}
		else if(lastState.func=="deleteEdges")
		{
			for(var i=0;i<lastState.param.edges.length;i++)
			{
				this.theoryGraph!.addEdge(lastState.param.edges[i]);
				this.historyStates.pop();
			}
		}	
		else if(lastState.func=="cageNodes")
		{
			this.theoryGraph!.removeNodeRegion(lastState.param.index);
		}
		else if(lastState.func=="hideNodes")
		{
			this.theoryGraph!.hideNodesById(lastState.param.nodesToHide,!lastState.param.hidden);
			this.historyStates.pop();
		}
		else if(lastState.func=="hideEdges")
		{
			var edgeIds=[];
			
			for(var i=0;i<lastState.param.hideEdges.length;i++)
			{
				edgeIds.push(lastState.param.hideEdges[i].id);
			}
			
			this.theoryGraph!.hideEdgesById(edgeIds,!lastState.param.hidden);
			this.historyStates.pop();
		}
		else if(lastState.func=="selectEdges")
		{
			this.theoryGraph!.selectEdgesById([]);
			this.historyStates.pop();
		}
		
		
		if(repeatlastAction==true)
		{
			this.doLastAction();
		}
		this.lastActionWasUndoRedo=0;
	}

	redoLastAction()
	{
		if(this.undoneHistoryStates.length==0)
			return;
		
		this.lastActionWasUndoRedo=1;
		
		var lastState = this.undoneHistoryStates.pop()!;
		
		if(typeof lastState.func=="undefined")
			return;
				
		if(lastState.func=="cluster")
		{
			this.theoryGraph!.cluster(lastState.param.nodes,lastState.param.name,lastState.param.clusterId);
		}
		else if(lastState.func=="uncluster")
		{
			this.theoryGraph!.openCluster(lastState.param.clusterId);
		}
		else if(lastState.func=="select")
		{
			this.theoryGraph!.selectNodes(lastState.param.nodes);
		}
		else if(lastState.func=="unselect")
		{
			this.theoryGraph!.selectNodes([]);
		}
		else if(lastState.func=="addNode")
		{
			this.theoryGraph!.addNode(lastState.param.node);
		}
		else if(lastState.func=="editNode")
		{
			this.theoryGraph!.saveNode(lastState.param.newNode);
		}
		else if(lastState.func=="deleteNodes")
		{
			var toDelete=[];
			for(var i=0;i<lastState.param.edges.length;i++)
			{
				toDelete.push(lastState.param.edges[i].id);
			}
			this.theoryGraph!.deleteEdges(toDelete);
			
			toDelete=[];
			for(var i=0;i<lastState.param.nodes.length;i++)
			{
				toDelete.push(lastState.param.nodes[i].id);
			}
			this.theoryGraph!.deleteNodes(toDelete);
		}
		else if(lastState.func=="addEdge")
		{
			this.theoryGraph!.addEdge(lastState.param.edge);
		}
		else if(lastState.func=="editEdge")
		{
			this.theoryGraph!.saveEdge(lastState.param.newEdge);
		}
		else if(lastState.func=="deleteEdges")
		{
			var toDelete=[];
			for(var i=0;i<lastState.param.edges.length;i++)
			{
				toDelete.push(lastState.param.edges[i].id);
			}
			this.theoryGraph!.deleteEdges(toDelete);
		}
		else if(lastState.func=="cageNodes")
		{
			this.theoryGraph!.cageNodes(lastState.param.nodeIds, lastState.param.color);
		}
		else if(lastState.func=="hideNodes")
		{
			this.theoryGraph!.hideNodesById(lastState.param.nodesToHide,lastState.param.hidden);
		}
		else if(lastState.func=="hideEdges")
		{
			var edgeIds=[];
			
			for(var i=0;i<lastState.param.hideEdges.length;i++)
			{
				edgeIds.push(lastState.param.hideEdges[i].id);
			}
			
			this.theoryGraph!.hideEdgesById(edgeIds,lastState.param.hidden);
		}
		else if(lastState.func=="selectEdges")
		{
			this.theoryGraph!.selectEdgesById(lastState.param.edges);
			this.historyStates.pop();
		}

		
		//undoneHistoryStates.pop();
		//that.doLastAction();
		this.lastActionWasUndoRedo=0;
	}

	doLastAction()
	{
		if(this.historyStates.length==0)
			return;

		this.lastActionWasUndoRedo=1;
		
		for(var i=this.historyStates.length-1;i>=0;i--)
		{
			var lastState = this.historyStates[i];
			if(lastState.func=="unselect")
			{
				this.theoryGraph!.selectNodes([]);
				this.historyStates.pop();
				break;
			}
			else if(lastState.func=="select")
			{
				this.theoryGraph!.selectNodes(lastState.param.nodes);
				this.historyStates.pop();
				break;
			}
		}

		
		this.lastActionWasUndoRedo=0;
	}
}

/** an action within the history */
interface IAction {
	// TODO: Make ach acttion well-defined w.r.t. their parameters
	func?: "cluster" | "uncluster" | "select" | "unselect" | "addNode" | "editNode" | "deleteNodes" | "addEdge" | "editEdge" | "deleteEdges" | "cageNodes" | "hideNodes"  | "hideEdges" | "selectEdges"
	param: any;
}
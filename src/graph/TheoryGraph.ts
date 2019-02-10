// import {setLocation, getRandomColor, rainbow, getParameterByName, getStartToEnd} from './utils.js';
import {rainbow, getParameterByName, getStartToEnd} from '../utils';
import StatusLogger from '../dom/StatusLogger';
import ActionHistory from '../core/ActionHistory';
import { Configuration } from '../Configuration';
import { Position, IdType, ClusterOptions, Network, DataSet } from 'vis';
import { CleanEdge, CleanNode, ensureUniqueIds, cleanNode, cleanEdge, DirtyEdge, DirtyNode, IDirtyGraph, IPositionWithId } from './visgraph';
import DOMConstruct from '../dom/DOMConstruct';
import Clusterer from './layout/Clusterer';
import Optimizer from './layout/Optimizer';

import {default as $} from 'jquery';
import { deleteRegionPng, moveRegionPng, addRegionPng } from '../css/images';

interface INodeRegion extends vis.BoundingBox {
	nodeIds: string[];
	selected: boolean;
	color: string;
	mappedNodes: Record<string, number>;
}

export interface IRectangle {
	w: number;
	h: number;
	startX: number;
	startY: number;
}

export default class TheoryGraph {
	constructor(private readonly config: Configuration, private readonly dom: DOMConstruct, private readonly containerName: string, private readonly statusLogger: StatusLogger, private readonly actionLogger: ActionHistory){
		this.removeRegionImg.src = deleteRegionPng;
		this.moveRegionImg.src = moveRegionPng;
		this.addNodeToRegionImg.src = addRegionPng;
	}

	// we store the nodes and edges in three ways:

	// 1. in 'original' form, as a 'save' state we can revert to
	// and access very quickly
	private originalNodes: CleanNode[] = [];
	private originalEdges: CleanEdge[] = [];

	// 2. in 'dataset' form, that represent the current editor state
	private nodes: vis.DataSet<CleanNode> = null!;
	private edges: vis.DataSet<CleanEdge> = null!;

	// 3. Inside of the network itself (essentially synced with 2.)
	private network: vis.Network = null!;


	//
	// CLUSTER INFO
	//

	/** a counter to generate unique cluster ids */
	private clusterId = 0;

	/** the ids of all clusters */
	private allClusters: string[] = [];

	/** the positions of nodes within clusters */
	private clusterPositions: Record<string, [string[], Record<string, Position>]> = {};

	/** last zoom level used for clusters */
	private lastClusterZoomLevel = 0;

	/** the zoom levels of all clusters */
	private zoomClusters: {id: string, scale: number}[] = [];

	/** all hidden nodes */	
	private hiddenNodes: Record<string, boolean> = {};

	/** edges that are hidden */
	private edgesNameToHide: {hidden: boolean; type: string}[]=[];

	/** callback that is called when construction is done */
	onConstructionDone: (() => void) | undefined;

	/** boolean to set manual focus mode */
	manualFocus: boolean = false;

	/** regions of selected nodes */
	private allNodeRegions: INodeRegion[] = [];

	
	/** nodes which have been manually hidden */
	private allManuallyHiddenNodes: {nodes: Pick<CleanNode, 'id' | 'hidden'>[], edges: Pick<CleanEdge, 'id' | 'hidden'> []}[] = [];	

	private moveRegionHold=false;
	private moveRegionId=0;
	private oldRegionPosition: Position | undefined; // TODO: Fix my type

	private addNodeToRegion=false;
	private addNodeRegionId: vis.IdType | undefined;

	
	private internalOptimizer: Optimizer | undefined;


	// image caches
	private readonly removeRegionImg = new Image();
	private readonly moveRegionImg = new Image();
	private readonly addNodeToRegionImg = new Image();

	destroy() {
		this.dom.$('.custom-menu li').off('click');

		this.originalNodes = [];
		this.originalEdges = [];

		if (this.edges) { this.edges.clear(); }
		this.edges = null!;

		if (this.nodes) { this.nodes.clear(); }
		this.nodes = null!;
		
		if (this.network) {
			this.network.destroy();
			this.network = null!;
		}

		this.allClusters = [];
		this.clusterPositions = {};
		this.zoomClusters = [];
		this.hiddenNodes = {};
		this.edgesNameToHide = [];
		this.onConstructionDone = undefined;
		this.allNodeRegions = [];
		this.allManuallyHiddenNodes = [];

		if (this.internalOptimizer) {
			this.internalOptimizer.destroy();
		}
	}

	private focusOnNodes(nodeIds?: string[]) {
		var nodesToShow: string[] = [];
		if (typeof nodeIds == 'undefined')
		{
			nodeIds = this.network.getSelectedNodes().map(e => e.toString());
		}
		
		if(nodeIds==undefined || nodeIds.length==0) { return; }
		
		nodesToShow=nodesToShow.concat(nodeIds);
		var edgesToShow: string[]=[];

		for(var i=0;i<nodeIds.length;i++)
		{
			var middleNodePos=this.network.getPositions(nodeIds[i]);
			var connectedEdges=this.network.getConnectedEdges(nodeIds[i]);
			
			edgesToShow=edgesToShow.concat(connectedEdges.map(e => e.toString()));
			var toNodes=this.network.getConnectedNodes(nodeIds[i],'to').map(e => e.toString());
			var fromNodes=this.network.getConnectedNodes(nodeIds[i],'from').map(e => e.toString());
			
			if(nodeIds.length==1)
			{
				for(var j=0;j<fromNodes.length;j++)
				{
					if((middleNodePos.y-this.network.body.nodes[fromNodes[j]].y)<200)
					{
						
						this.network.body.nodes[fromNodes[j]].y=middleNodePos.y-(Math.random()*50+150);
					}
					if(Math.abs(middleNodePos.x-this.network.body.nodes[fromNodes[j]].x) > 200)
					{
						this.network.body.nodes[fromNodes[j]].x=middleNodePos.x+Math.random()*400-200;
					}
				}
				
				
				for(var j=0;j<toNodes.length;j++)
				{
					if((middleNodePos.y-this.network.body.nodes[toNodes[j]].y)>200)
					{
						this.network.body.nodes[toNodes[j]].y=middleNodePos.y+(Math.random()*50+150);
					}
					if(Math.abs(middleNodePos.x-this.network.body.nodes[fromNodes[j]].x) > 200)
					{
						this.network.body.nodes[toNodes[j]].x=middleNodePos.x+Math.random()*400-200;
					}
				}
			}
			
			nodesToShow = nodesToShow.concat(fromNodes);
			nodesToShow = nodesToShow.concat(toNodes);
		}

		this.hideNodesById(nodesToShow, false);
		
		var nodesToHide=[];
		for(var i=0;i<this.originalNodes.length;i++)
		{

			this.originalNodes[i].y=this.network.body.nodes[this.originalNodes[i].id].y;
			this.originalNodes[i].x=this.network.body.nodes[this.originalNodes[i].id].x;
			
			if(nodesToShow.indexOf(this.originalNodes[i].id) == -1)
			{
				nodesToHide.push(this.originalNodes[i].id);
				//originalNodes[i].hidden=true;
			}
			else
			{
				//originalNodes[i].hidden=false;
			}
			
		}
		
		this.hideNodesById(nodesToHide, true);

		
		//internalOptimizer.SolveUsingForces(25, 50/originalNodes.length*nodesToShow.length, false);
		if(nodeIds.length==1)
		{
			if (!this.internalOptimizer) { throw new Error('internalOptimizer not initialized'); }
			this.internalOptimizer.SolveUsingForces(25, 12, false);
		}
		
		var newNodePositions: Array<IPositionWithId>=[];
		for(var i=0;i<this.originalNodes.length;i++)
		{
			newNodePositions.push({
				id: this.originalNodes[i].id, 
				x: this.originalNodes[i].x,
				y: this.originalNodes[i].y
			})
		}
		this.nodes.update(newNodePositions); // TODO: Fix nodes type
		
		this.statusLogger.setStatusText('');
		
		var edgesToHide=[];
		for(var i=0;i<this.originalEdges.length;i++)
		{
			edgesToHide.push(this.originalEdges[i].id) // TODO: Fix originalEdges type
		}
		
		this.hideEdgesById(edgesToHide,true);
		
		this.hideEdgesById(edgesToShow,false);
	}
	
	private manipulateSelectedRegion(coords: Position)
	{
		// If the document is hold somewhere
		var updateNodes: IPositionWithId[] = [];
		var redraw=false;
		var selectRegion=false;
		if(this.moveRegionHold==true)
		{
			if (this.oldRegionPosition === undefined) {
				throw new Error('trying to manuipulate selected region, but oldRegionPosition is undefined');
			}
			var newRegionPosition=coords;
			var difX=newRegionPosition.x-this.oldRegionPosition.x;
			var difY=newRegionPosition.y-this.oldRegionPosition.y;
			var positions=this.network.getPositions(this.allNodeRegions[this.moveRegionId].nodeIds);
			for(var i=0;i<this.allNodeRegions[this.moveRegionId].nodeIds.length;i++)
			{
				if(typeof this.allNodeRegions[this.moveRegionId].nodeIds[i] != 'undefined')
				{
					updateNodes.push({'id':this.allNodeRegions[this.moveRegionId].nodeIds[i] ,'x':this.network.body.nodes[this.allNodeRegions[this.moveRegionId].nodeIds[i]].x+difX, 'y':this.network.body.nodes[this.allNodeRegions[this.moveRegionId].nodeIds[i]].y+difY});
				}
			}
			this.moveRegionHold=false;
			this.statusLogger.setStatusCursor('auto');
			this.oldRegionPosition=coords;
			selectRegion=true;
			redraw=true;
			this.nodes.update(updateNodes);
		}
		else
		{
			for(var i=0;i<this.allNodeRegions.length;i++)
			{
				if(this.allNodeRegions[i].selected==true)
				{
					if(this.allNodeRegions[i].left-44<=coords.x && this.allNodeRegions[i].left>=coords.x && this.allNodeRegions[i].top-6<=coords.y && this.allNodeRegions[i].top+34>=coords.y)
					{
						this.removeNodeRegion(i);
						redraw=true;
						break;
					}
					else if(this.allNodeRegions[i].left-42<=coords.x && this.allNodeRegions[i].left>=coords.x && this.allNodeRegions[i].top+40<=coords.y && this.allNodeRegions[i].top+74>=coords.y)
					{
						this.moveRegionHold=true;
						this.moveRegionId=i;
						this.oldRegionPosition=coords;
						this.statusLogger.setStatusCursor('pointer');
						selectRegion=true;
						break;
					}
					else if(this.allNodeRegions[i].left-74<=coords.x && this.allNodeRegions[i].left>=coords.x && this.allNodeRegions[i].top+86<=coords.y && this.allNodeRegions[i].top+122>=coords.y)
					{
						this.addNodeRegionId=i;
						this.addNodeToRegion=true;
						this.statusLogger.setStatusCursor('copy');
						selectRegion=true;
						break;
					}
				}
			}
		}
		
		if(redraw==true)
		{
			this.network.redraw();
		}
		return selectRegion;
	}
	
	private selectRegion(coords: Position)
	{
		var redraw=false;
		for(var i=0;i<this.allNodeRegions.length;i++)
		{
			this.allNodeRegions[i].selected=false;
			if(this.allNodeRegions[i].left<=coords.x && this.allNodeRegions[i].right>=coords.x && this.allNodeRegions[i].top<=coords.y && this.allNodeRegions[i].bottom>=coords.y)
			{
				this.allNodeRegions[i].selected=true;
				redraw=true;
			}
		}
		if(redraw==true)
		{
			this.network.redraw();
		}
	}
	
	/**
	 * Removes a region from the graph
	 * @param index Index of region to remove
	 */
	removeNodeRegion(index: number)
	{
		this.allNodeRegions.splice(index, 1);
		this.network.redraw();
	}
	
	private drawAllColoredRegionsOnCanvas(ctx: CanvasRenderingContext2D)
	{
		for(var i=0;i<this.allNodeRegions.length;i++)
		{
			ctx.fillStyle = this.allNodeRegions[i].color;
			ctx.strokeStyle = this.allNodeRegions[i].color;
			
			ctx.setLineDash([8]);
			var oldWidth=ctx.lineWidth;
			
			if(this.allNodeRegions[i].selected==true)
			{
				ctx.drawImage(this.removeRegionImg, this.allNodeRegions[i].left-46, this.allNodeRegions[i].top-8,38,38);
				ctx.drawImage(this.moveRegionImg, this.allNodeRegions[i].left-46, this.allNodeRegions[i].top+38,38,38);
				ctx.drawImage(this.addNodeToRegionImg, this.allNodeRegions[i].left-46, this.allNodeRegions[i].top+84,38,38);
				
				
				ctx.lineWidth=10;
			}
			else
			{
				ctx.lineWidth=6;
			}	
			ctx.strokeRect(this.allNodeRegions[i].left,this.allNodeRegions[i].top,this.allNodeRegions[i].right-this.allNodeRegions[i].left,this.allNodeRegions[i].bottom-this.allNodeRegions[i].top);
			ctx.setLineDash([]);
			ctx.lineWidth=oldWidth;
			//ctx.globalAlpha = 0.2;			
			//ctx.fillRect(allNodeRegions[i].left,allNodeRegions[i].top,allNodeRegions[i].right-allNodeRegions[i].left,allNodeRegions[i].bottom-allNodeRegions[i].top);
			//ctx.globalAlpha = 1.0;
		}
	}
	
	private drawAllColoredRegions(ctx: CanvasRenderingContext2D)
	{
		if(this.allNodeRegions.length==0)
		{
			return;
		}

		for(var i=0;i<this.allNodeRegions.length;i++)
		{
			this.allNodeRegions[i].left=10000000;
			this.allNodeRegions[i].right=-10000000;
			this.allNodeRegions[i].top=10000000;
			this.allNodeRegions[i].bottom=-10000000;
			this.allNodeRegions[i].mappedNodes={};
			
			for(var j=0;j<this.allNodeRegions[i].nodeIds.length;j++)
			{
				if(this.hiddenNodes[this.allNodeRegions[i].nodeIds[j]] == true)
				{
					continue;
				}
				var box=this.network.getBoundingBox(this.allNodeRegions[i].nodeIds[j]);
				
				this.allNodeRegions[i].left=Math.min(this.allNodeRegions[i].left,box.left);
				this.allNodeRegions[i].right=Math.max(this.allNodeRegions[i].right,box.right);
				this.allNodeRegions[i].top=Math.min(this.allNodeRegions[i].top,box.top);
				this.allNodeRegions[i].bottom=Math.max(this.allNodeRegions[i].bottom,box.bottom);
				
				this.allNodeRegions[i].mappedNodes[this.allNodeRegions[i].nodeIds[j]]=1;
			}
			
			var distance=(i*4)%20+8;

			if(this.allNodeRegions[i].left==10000000)
			{
				continue;
			}

			this.allNodeRegions[i].left-=distance;
			this.allNodeRegions[i].right+=distance;
			this.allNodeRegions[i].top-=distance;
			this.allNodeRegions[i].bottom+=distance;
			
			
			
			ctx.fillStyle = this.allNodeRegions[i].color;
			ctx.strokeStyle = this.allNodeRegions[i].color;
			
			if(this.allNodeRegions[i].selected==true)
			{
				ctx.globalAlpha = 0.5;	
			}
			else
			{
				ctx.globalAlpha = 0.2;	
			}
			ctx.fillRect(this.allNodeRegions[i].left,this.allNodeRegions[i].top,this.allNodeRegions[i].right-this.allNodeRegions[i].left,this.allNodeRegions[i].bottom-this.allNodeRegions[i].top);
			ctx.globalAlpha = 1.0;
		}
		this.repositionNodes();
	}

	// TODO: Move to utils?
	private intersectRect(a: vis.BoundingBox, b: vis.BoundingBox): boolean
	{
		return (a.left <= b.right &&
			b.left <= a.right &&
			a.top <= b.bottom &&
			b.top <= a.bottom)
	}
	
	private liesInAnyRegion(box: vis.BoundingBox,id: IdType): number
	{
		for(var j=0;j<this.allNodeRegions.length;j++)
		{
			if(typeof this.allNodeRegions[j].mappedNodes[id]=='undefined' && this.intersectRect(box, this.allNodeRegions[j])==true)
			{
				return j;
			}
		}
		
		return -1;
	}
	
	private repositionNodes()
	{
		//var allNodePositions=network.getPositions();
		var newPositions: IPositionWithId[]=[];
		for(var i=0;i<this.originalNodes.length;i++)
		{
			var box=this.network.getBoundingBox(this.originalNodes[i].id);
			
			var avgX=0;
			var avgY=0;
			var countAvg=0;
			for(var j=0;j<this.allNodeRegions.length;j++)
			{	
				if(typeof this.allNodeRegions[j].mappedNodes[this.originalNodes[i].id]!='undefined')
				{
					avgX+=(this.allNodeRegions[j].left+this.allNodeRegions[j].right)/2;
					avgY+=(this.allNodeRegions[j].top+this.allNodeRegions[j].bottom)/2;
					countAvg++;
				}
			}
			
			avgX/=countAvg;
			avgY/=countAvg;
			
			for(var j=0;j<this.allNodeRegions.length;j++)
			{	
				if(typeof this.allNodeRegions[j].mappedNodes[this.originalNodes[i].id]=='undefined' && this.intersectRect(box, this.allNodeRegions[j])==true)
				{
					var minDirection=0;
					var minDistance; 
					var tmp;
					var width=box.right-box.left;
					var height=box.bottom-box.top;
					
					if(countAvg==0)
					{
						minDistance=Math.abs(box.right-this.allNodeRegions[j].left); 
						tmp=Math.abs(box.left-this.allNodeRegions[j].right);
						
						if(tmp<minDistance)
						{
							minDirection=1;
							minDistance=tmp;
						}
						
						tmp=Math.abs(box.bottom-this.allNodeRegions[j].top);
						if(tmp<minDistance)
						{
							minDirection=2;
							minDistance=tmp;
						}
						
						tmp=Math.abs(box.top-this.allNodeRegions[j].bottom);
						if(tmp<minDistance)
						{
							minDirection=3;
							minDistance=tmp;
						}	
					}
					else
					{
						minDistance=Math.abs(this.allNodeRegions[j].left-width/1.8-avgX)+Math.abs((box.bottom+box.top)/2-avgY); 
						tmp=Math.abs(this.allNodeRegions[j].right+width/1.8-avgX)+Math.abs((box.bottom+box.top)/2-avgY);
						
						if(tmp<minDistance)
						{
							minDirection=1;
							minDistance=tmp;
						}
						
						tmp=Math.abs(this.allNodeRegions[j].top-height/1.8-avgY)+Math.abs((box.left+box.right)/2-avgX);
						if(tmp<minDistance)
						{
							minDirection=2;
							minDistance=tmp;
						}
						
						tmp=Math.abs(this.allNodeRegions[j].bottom+height/1.8-avgY)+Math.abs((box.left+box.right)/2-avgX);
						if(tmp<minDistance)
						{
							minDirection=3;
							minDistance=tmp;
						}
					}

					
					if(minDirection==0)
					{
						var intersectingRegion=0;
						var newX=this.allNodeRegions[j].left-width/1.8;
						while(intersectingRegion!=-1)
						{
							box.left=newX-width/2;
							box.right=newX+width/2;
							intersectingRegion=this.liesInAnyRegion(box,this.originalNodes[i].id);
							if(intersectingRegion!=-1)
							{
								newX=this.allNodeRegions[intersectingRegion].left-width/1.8;
							}
						} 
						newPositions.push({'x':newX, 'id':this.originalNodes[i].id});
					}
					else if(minDirection==1)
					{
						var intersectingRegion=0;
						var newX=this.allNodeRegions[j].right+width/1.8;
						while(intersectingRegion!=-1)
						{
							box.left=newX-width/2;
							box.right=newX+width/2;
							intersectingRegion=this.liesInAnyRegion(box,this.originalNodes[i].id);
							if(intersectingRegion!=-1)
							{
								newX=this.allNodeRegions[intersectingRegion].right+width/1.8;
							}
						} 
						newPositions.push({'x':newX, 'id':this.originalNodes[i].id});
					}
					else if(minDirection==2)
					{
						var intersectingRegion=0;
						var newY=this.allNodeRegions[j].top-height/1.8;
						while(intersectingRegion!=-1)
						{
							box.top=newY-height/2;
							box.bottom=newY+height/2;
							intersectingRegion=this.liesInAnyRegion(box,this.originalNodes[i].id);
							if(intersectingRegion!=-1)
							{
								newY=this.allNodeRegions[intersectingRegion].top-height/1.8;
							}
						} 
						newPositions.push({'y':newY, 'id':this.originalNodes[i].id});
					}
					else if(minDirection==3)
					{
						var intersectingRegion=0;
						var newY=this.allNodeRegions[j].bottom+height/1.8;
						while(intersectingRegion!=-1)
						{
							box.top=newY-height/2;
							box.bottom=newY+height/2;
							intersectingRegion=this.liesInAnyRegion(box,this.originalNodes[i].id);
							if(intersectingRegion!=-1)
							{
								newY=this.allNodeRegions[intersectingRegion].bottom+height/1.8;
							}
						} 
						newPositions.push({'y':newY, 'id':this.originalNodes[i].id});
					}
				}
			}
		}
		
		for(var i=0;i<newPositions.length;i++)
		{
			var position = newPositions[i];
			if(typeof position.x != 'undefined')
			{
				this.network.body.nodes[newPositions[i].id].x=position.x;
			}
			if(typeof position.y != 'undefined')
			{
				this.network.body.nodes[newPositions[i].id].y=position.y;
			}
		}
		
		// Check for intersecting regions, which do not share nodes
		// 1. Check region1 and region2 intersect
		// 2. Extract all intersecting nodes
		// 3. Remove intersecting nodes and calculate new bounding box
		// 4. If still intersecting --> reposition nodes
		// 5. Reposition nodes: move all nodes to region center and apply few iterations of forces driven layout
	}
	
	selectNodesByType(type: string)
	{
		var nodeIds = this.network.getSelectedNodes().map(e => e.toString());
		for (var i = 0; i < this.originalNodes.length; i++) 
		{
			var curNode = this.originalNodes[i];
			if(curNode['style']==type)
			{
				nodeIds.push(curNode.id.toString());
			}
			
		}
		this.actionLogger.addToStateHistory({func: 'select', param: {nodes: nodeIds}});
		this.network.selectNodes(nodeIds);
	}
	
	selectEdgesById(edgeIds: string[])
	{
		this.actionLogger.addToStateHistory({func: 'selectEdges', param: {edges: edgeIds}});
		this.network.selectEdges(edgeIds);
	}
	
	selectEdgesByType(type: string)
	{
		var edgeIds = [];
		for (var i = 0; i < this.originalEdges.length; i++) 
		{
			var currEdge = this.originalEdges[i];
			if(currEdge['style']==type)
			{
				edgeIds.push(currEdge.id);
			}
			
		}
		this.actionLogger.addToStateHistory({func: 'selectEdges', param: {'edges': edgeIds}});
		this.network.selectEdges(edgeIds);
	}
	
	getUsedNodeTypes(): string[]
	{
		var usedNodeTypes: string[] =[];
		for (var i = 0; i < this.originalNodes.length; i++) 
		{
			if(typeof this.originalNodes[i]['style']!='undefined' && usedNodeTypes.indexOf(this.originalNodes[i].style!)==-1)
			{
				usedNodeTypes.push(this.originalNodes[i].style);
			}
		}
		return usedNodeTypes;
	}
	
	getUsedEdgeTypes(): string[]
	{
		var usedEdgeTypes=[];
		for (var i = 0; i < this.originalEdges.length; i++) 
		{
			if(typeof this.originalEdges[i]['style']!='undefined' && usedEdgeTypes.indexOf(this.originalEdges[i]['style']!)==-1)
			{
				usedEdgeTypes.push(this.originalEdges[i]['style']!);
			}
		}
		return usedEdgeTypes;
	}
	
	graphToIFrameString(parameterName: string | undefined, onlySelected: boolean | undefined, compressionRate: number | undefined)
	{
		if (typeof parameterName == 'undefined')
		{
			parameterName='tgviewGraphData_'+Math.floor((new Date()).getTime() / 1000)+'_'+Math.floor(Math.random() * 1000);
		}
		
		if (typeof onlySelected == 'undefined')
		{
			onlySelected=false;
		}

		if (typeof compressionRate == 'undefined')
		{
			compressionRate=0;
		}
		
		//TODO: what is this?, looks like an unsafe eval() being called somewhere
		return {'storage':'localStorage.setItem(\''+parameterName+'\', \''+this.generateCompressedJSON(onlySelected, compressionRate).split('\'').join('\\\'')+'\');', 'uri':location.protocol + '//' + location.host + location.pathname+'?source=iframe&uri='+parameterName, 'id':parameterName};
	}
	
	graphToLocalStorageString(parameterName: string | undefined, onlySelected: boolean | undefined, compressionRate: number | undefined)
	{
		if (typeof parameterName == 'undefined')
		{
			parameterName='tgviewGraphData_'+Math.floor((new Date()).getTime() / 1000)+'_'+Math.floor(Math.random() * 1000);
		}
		
		if (typeof onlySelected == 'undefined')
		{
			onlySelected=false;
		}

		if (typeof compressionRate == 'undefined')
		{
			compressionRate=0;
		}
		
		return {'storage':'localStorage.setItem(\''+parameterName+'\', \''+this.generateCompressedJSON(onlySelected, compressionRate).split('\'').join('\\\'')+'\');', 'uri':location.protocol + '//' + location.host + location.pathname+'?source=param&uri='+parameterName, 'name':parameterName};
	}
	
	graphToURIParameterString(onlySelected: boolean | undefined, compressionRate: number | undefined)
	{
		if (typeof onlySelected == 'undefined')
		{
			onlySelected=false;
		}

		if (typeof compressionRate == 'undefined')
		{
			compressionRate=2;
		}
		
		return location.protocol + '//' + location.host + location.pathname+'?source=param&uri='+encodeURI(this.generateCompressedJSON(onlySelected, compressionRate));
	}

	graphToStringJSON(onlySelected: boolean | undefined, compressionRate: number | undefined)
	{
		if (typeof onlySelected == 'undefined')
		{
			onlySelected=false;
		}

		if (typeof compressionRate == 'undefined')
		{
			compressionRate=0;
		}
		
		return this.generateCompressedJSON(onlySelected, compressionRate);
	}
	
	private generateCompressedJSON(onlySelected: boolean, compressionRate: number)
	{	
		// TODO: Use JSON.stringify for cleaner code
		var allNodePositions: Record<string, vis.Position>={};
		
		var json='{"nodes":[';
		if (typeof onlySelected == 'undefined')
		{
			onlySelected=false;
		}
		
		if (typeof compressionRate == 'undefined')
		{
			compressionRate=0;
		}

		if(compressionRate==0)
		{
			allNodePositions=this.network.getPositions(); // TODO: Is this safe?
		}
		
		var nodeIds=undefined;
		var nodeIdMapping: Record<string, number> = {};
		
		if(onlySelected==true)
		{
			nodeIds=this.network.getSelectedNodes();
			
			for (var i = 0; i < nodeIds.length; i++) 
			{
				nodeIdMapping[nodeIds[i]]=1;
			}
		}
		
		var mapping: Record<string, number> = {};
		var counter=0;
		for (var i = 0; i < this.originalNodes.length; i++) 
		{
			var currentNodeJson='{';
			var curNode = this.originalNodes[i];
			
			if(onlySelected==true && typeof nodeIdMapping[curNode.id] == 'undefined')
			{
				continue;
			}
			
			if(typeof mapping[curNode.id] == 'undefined')
			{
				mapping[curNode.id]=counter;
				counter++;
			}
			
			currentNodeJson+='"id":"'+curNode.id+'",';
			currentNodeJson+='"label":"'+curNode.label+'",';
			currentNodeJson+='"style":"'+curNode.style+'"';
			
			if(curNode.shape)
			{
				currentNodeJson+=',"shape":"'+curNode.shape+'"';
			}
			
			if(curNode.mathml)
			{
				currentNodeJson+=',"mathml":"'+curNode.mathml.split('"').join('\'')+'"';
			}

			if(curNode.previewhtml)
			{
				currentNodeJson+=',"previewhtml":"'+curNode.previewhtml.split('"').join('\'')+'"';
			}
			
			if(typeof curNode.url != 'undefined' && curNode.url!='' && compressionRate<2)
			{
				currentNodeJson+=',"url":"'+curNode.url+'"';
			}
			
			if(compressionRate==0)
			{
				currentNodeJson+=',"x":"'+allNodePositions[curNode.id].x+'"';
				currentNodeJson+=',"y":"'+allNodePositions[curNode.id].y+'"';
			}
			
			currentNodeJson+='},';
			json+=currentNodeJson;
		}
		
		json=json.substring(0, json.length - 1)+'],"edges":[';
		
		for (var i = 0; i < this.originalEdges.length; i++) 
		{				
			var currEdge = this.originalEdges[i];
			if(typeof mapping[currEdge.to] != 'undefined' && typeof mapping[currEdge.from] != 'undefined' )
			{
				var currentEdgeJson='{';
				
				currentEdgeJson+='"to":"'+currEdge.to+'",';
				currentEdgeJson+='"from":"'+currEdge.from+'",';
				currentEdgeJson+='"style":"'+currEdge.style+'"';
				
				if(typeof currEdge.label != 'undefined' && currEdge.label!='' && compressionRate<2)
				{
					currentEdgeJson+=',"label":"'+currEdge.label+'"';
				}
				
				if(typeof currEdge.weight != 'undefined' && currEdge.weight!='' && compressionRate<2)
				{
					currentEdgeJson+=',"weight":"'+currEdge.weight+'"';
				}
				
				if(typeof currEdge.url != 'undefined' && currEdge.url!='' && compressionRate<2)
				{
					currentEdgeJson+=',"url":"'+currEdge.url+'"';
				}
				
				currentEdgeJson+='},';
				json+=currentEdgeJson;
			}
		}
		
		if(this.allClusters.length>0)
		{
			json=json.substring(0, json.length - 1)+'],"cluster":[';
			
			for (var i = 0; i < this.allClusters.length; i++) 
			{		
				var currentClusterJson='{"nodeIds":';
				currentClusterJson+=JSON.stringify(this.clusterPositions[this.allClusters[i]][0]);
				currentClusterJson+=',';
				
				currentClusterJson+='"nodePositions":';
				currentClusterJson+=JSON.stringify(this.clusterPositions[this.allClusters[i]][1]);
				currentClusterJson+='';
				
				currentClusterJson+='},';
				json+=currentClusterJson;
			}
		}

		json=json.substring(0, json.length - 1)+']}';
		return json;
	}
	
	loadGraphByLocalStorage(parameterName?: string)
	{
		if (typeof parameterName == 'undefined')
		{
			parameterName='tgviewGraphData';
		}

		var graphData=localStorage.getItem(parameterName);
		this.drawGraph(JSON.parse(graphData!));
	}
	
	loadGraphByURIParameter(_?: string)
	{
		var graphData=getParameterByName('uri');
		this.drawGraph(JSON.parse(graphData!));
	}
	
	hideEdges(type: string, hideEdge: boolean)
	{
		this.setEdgesHidden(type, hideEdge);
		var edgesToHide: Array<{id: IdType, hidden: boolean}>=[];
		for(var i=0;i<this.originalEdges.length;i++)
		{
			//console.log(type+""+originalEdges[i]["style"]);
			if(type==this.originalEdges[i]['style'] || ('graph'+type)==this.originalEdges[i]['style'] )
			{
				if(hideEdge==true)
				{
					edgesToHide.push({id: this.originalEdges[i]['id']!, hidden: hideEdge!});
				}
				else if(hideEdge==false && (this.hiddenNodes[this.originalEdges[i].to!]==false && this.hiddenNodes[this.originalEdges[i].from!]==false))
				{
					edgesToHide.push({id: this.originalEdges[i]['id']!, hidden: hideEdge!});
				}
			}
		}
		this.edges.update(edgesToHide);
		//actionLoggerIn.addToStateHistory({func: "hideEdges", params: {"hideEdges":edgesToHide,"hidden":hideEdge}});
	}
	
	hideEdgesById(edgeIds: string[] | undefined, hideEdge: boolean)
	{
		if(typeof edgeIds=='undefined' || edgeIds.length==0)
			return;
		
		var edgesToHide: Pick<CleanEdge, 'id' | 'hidden'>[]=[];
		for(var i=0;i<edgeIds.length;i++)
		{
			edgesToHide.push({id: edgeIds[i], hidden: hideEdge});
		}
		this.edges.update(edgesToHide);
		this.actionLogger.addToStateHistory({func: 'hideEdges', param: {'hideEdges':edgesToHide,'hidden':hideEdge}});
	}
	
	
	showAllManuallyHiddenNodes()
	{
		var nodesToHide: Pick<CleanNode, 'id' | 'hidden'>[]=[];
		var edgesToHide: Pick<CleanEdge, 'id' | 'hidden'>[]=[];
		for(var i=0;i<this.allManuallyHiddenNodes.length;i++)
		{
			for(var j=0;j<this.allManuallyHiddenNodes[i].nodes.length;j++)
			{
				this.allManuallyHiddenNodes[i].nodes[j].hidden=false;
				nodesToHide.push(this.allManuallyHiddenNodes[i].nodes[j]);
				this.hiddenNodes[this.allManuallyHiddenNodes[i].nodes[j].id]=false;
			}
			this.nodes.update(this.allManuallyHiddenNodes[i].nodes);
			
			for(var j=0;j<this.allManuallyHiddenNodes[i].edges.length;j++)
			{
				this.allManuallyHiddenNodes[i].edges[j].hidden=false;
				edgesToHide.push(this.allManuallyHiddenNodes[i].edges[j]);
			}
			this.edges.update(this.allManuallyHiddenNodes[i].edges);
		}
		this.allManuallyHiddenNodes=[];

		this.actionLogger.addToStateHistory({func: 'hideNodes', param: {'hideNodes':nodesToHide,'hideEdges':edgesToHide,'hidden':false}});
	}
	
	hideNodesById(nodeIds: string[] | undefined, hideNode: boolean)
	{
		if(typeof nodeIds=='undefined' || nodeIds.length==0)
		{
			nodeIds=this.network.getSelectedNodes().map(e => e.toString());
		}
		
		var nodesToHide=[];
		for(var i=0;i<nodeIds.length;i++)
		{
			nodesToHide.push({id: nodeIds[i], hidden: hideNode});
			this.hiddenNodes[nodeIds[i]]=hideNode;
		}
		this.nodes.update(nodesToHide);
		

		var edgesToHide=[];
		for(var i=0;i<this.originalEdges.length;i++)
		{
			if(hideNode==true && (this.hiddenNodes[this.originalEdges[i].to!] == true || this.hiddenNodes[this.originalEdges[i].from!] == true))
			{
				edgesToHide.push({id: this.originalEdges[i]['id'], hidden: hideNode});
			}

			if(hideNode==false && (this.hiddenNodes[this.originalEdges[i].to!]==false && this.hiddenNodes[this.originalEdges[i].from!]==false))
			{
				edgesToHide.push({id: this.originalEdges[i]['id'], hidden: hideNode});
			}
		}
		this.edges.update(edgesToHide);
		
		this.allManuallyHiddenNodes.push({'nodes':nodesToHide, 'edges':edgesToHide});
		this.actionLogger.addToStateHistory({func: 'hideNodes', param: {'hideNodes':nodesToHide,'hideEdges':edgesToHide,'hidden':hideNode}});
	}
	
	hideNodes(type: string, hideEdge: boolean)
	{
		//that.setEdgesHidden(type, hideEdge);
		var nodesToHide=[];
		
		for(var i=0;i<this.originalNodes.length;i++)
		{
			//console.log(type+""+originalEdges[i]["style"]);
			if(type==this.originalNodes[i]['style'] || ('graph'+type)==this.originalNodes[i]['style'] )
			{
				nodesToHide.push({id: this.originalNodes[i]['id'], hidden: hideEdge});
				this.hiddenNodes[this.originalNodes[i]['id']!]=hideEdge;
			}
		}
		this.nodes.update(nodesToHide);
		
		var mappedEdges: Record<string, boolean>={};
		for(var i=0;i<this.edgesNameToHide.length;i++)
		{
			mappedEdges[this.edgesNameToHide[i].type]=this.edgesNameToHide[i].hidden;
		}
		
		var edgesToHide=[];
		for(var i=0;i<this.originalEdges.length;i++)
		{
			if(hideEdge==true && (this.hiddenNodes[this.originalEdges[i].to!] == true || this.hiddenNodes[this.originalEdges[i].from!] == true))
			{
				edgesToHide.push({id: this.originalEdges[i]['id']!, hidden: hideEdge});
			}
			
			if(typeof mappedEdges[this.originalEdges[i]['style']!] != 'undefined' && mappedEdges[this.originalEdges[i]['style']!]!=hideEdge)
			{
				continue;
			}
			
			
			if(hideEdge==false && (this.hiddenNodes[this.originalEdges[i].to!]==false && this.hiddenNodes[this.originalEdges[i].from!]==false))
			{
				edgesToHide.push({id: this.originalEdges[i]['id'], hidden: hideEdge});
			}
		}
		this.edges.update(edgesToHide);
		
		//actionLoggerIn.addToStateHistory({func: "hideNodes", param: {"hideNodes":nodesToHide,"hideEdges":edgesToHide,"hidden":hideEdge}});
	}
	
	private setEdgesHidden(type: string, hideEdge: boolean)
	{
		for(var i=0;i<this.edgesNameToHide.length;i++)
		{
			if(type==this.edgesNameToHide[i].type)
			{
				this.edgesNameToHide[i].hidden=hideEdge;
				return;
			}
		}

		this.edgesNameToHide.push({'hidden': hideEdge,'type': type});
	}
	
	downloadCanvasAsImage(_: HTMLButtonElement)
	{
		var minX=111110;
		var minY=111110;
		var maxX=-111110;
		var maxY=-111110;
		for (var i = 0; i < this.originalNodes.length; i++) 
		{
			var curNode = this.originalNodes[i];
			var nodePosition = this.network.getPositions([curNode.id]);
			
			minX=Math.min(nodePosition[curNode.id].x,minX);
			maxX=Math.max(nodePosition[curNode.id].x,maxX);
			
			minY=Math.min(nodePosition[curNode.id].y,minY);
			maxY=Math.max(nodePosition[curNode.id].y,maxY);
		}
		
		var originalWidth=this.network.canvas.frame.canvas.width + 'px';
		var originalHeight=this.network.canvas.frame.canvas.height+ 'px';
		
		var sizeA = Math.min((maxX-minX)*1.2,3500) + 'px';
		var sizeB = Math.min((maxY-minY)*1.2,3500) + 'px';
		this.network.setSize(sizeA,sizeB);
		
		this.network.redraw();
		this.network.fit();
		
		this.network.once('afterDrawing',() => 
		{
			
			//button.href = network.canvas.frame.canvas.toDataURL();
			//button.download = "graph.png";

			var downloadLink      = document.createElement('a');
			downloadLink.target   = '_blank';
			downloadLink.download = 'graph.png';

			var image=this.network.canvas.frame.canvas.toDataURL('image/png');

			var URL: typeof window.URL = window.URL || (window as any).webkitURL;
			var downloadUrl = image;

			// set object URL as the anchor's href
			downloadLink.href = downloadUrl;

			// append the anchor to document body
			document.body.appendChild(downloadLink);

			// fire a click event on the anchor
			downloadLink.click();

			// cleanup: remove element and revoke object URL
			document.body.removeChild(downloadLink);
			URL.revokeObjectURL(downloadUrl);
						
			
			//window.open(image);
			this.network.setSize(originalWidth,originalHeight);
			this.network.redraw();
			this.network.fit();
			this.statusLogger.setStatusText('');
		});
	}
	
	selectNodes(nodeIds: string[])
	{
		this.network.selectNodes(nodeIds);
		this.actionLogger.addToStateHistory({func: 'select', param: {'nodes': nodeIds}});
	}
	
	selectNodesWithIdLike(searchId: string)
	{
		var nodeIds = [];
		for (var i = 0; i < this.originalNodes.length; i++) 
		{
			var curNode = this.originalNodes[i];
			if((curNode.id as string).indexOf(searchId)>-1)
			{
				nodeIds.push(curNode.id);
			}
			
		}
		this.actionLogger.addToStateHistory({func: 'select', param: {'nodes': nodeIds}});
		this.network.selectNodes(nodeIds);
	}
	
	cageNodes(nodeIds: string[] | undefined, color: string | undefined)
	{
		if(nodeIds===undefined)
		{
			nodeIds=this.network.getSelectedNodes().map(e => e.toString());
		}

		if(color==undefined)
		{
			color='#'+(4*Math.floor(Math.random()*4)).toString(16)+
    		(4*Math.floor(Math.random()*4)).toString(16)+
    		(4*Math.floor(Math.random()*4)).toString(16);
		}
		
		for(var i=0;i<this.allNodeRegions.length;i++)
		{
			this.allNodeRegions[i].selected=false;
		}
		
		this.allNodeRegions.push({
			nodeIds: nodeIds,
			color: color,
			selected: true,

			mappedNodes: {},

			top: NaN,
			bottom: NaN,
			left: NaN,
			right: NaN,
		});

		this.actionLogger.addToStateHistory({func: 'cageNodes', param: {'nodeIds':nodeIds,'color':color,'index':this.allNodeRegions.length-1}});
		this.network.redraw();
	}
	
	selectNodesInRect(rect: IRectangle) 
	{
		//var fromX;
		//var toX;
		//var fromY;
		//var toY;
		var nodesIdInDrawing = [];
		var xRange = getStartToEnd(rect.startX, rect.w);
		var yRange = getStartToEnd(rect.startY, rect.h);

		for (var i = 0; i < this.originalNodes.length; i++) 
		{
			var curNode = this.originalNodes[i];
			var nodePosition = this.network.getPositions([curNode.id]);
			if(typeof nodePosition!='undefined' && typeof this.network.body.nodes[curNode.id] !='undefined' && this.network.body.nodes[curNode.id].options.hidden!=true)
			{
				var nodeXY = this.network.canvasToDOM({x: nodePosition[curNode.id].x, y: nodePosition[curNode.id].y});
				if (xRange.start <= nodeXY.x && nodeXY.x <= xRange.end && yRange.start <= nodeXY.y && nodeXY.y <= yRange.end) 
				{
					nodesIdInDrawing.push(curNode.id);
				}
			}
		}
		this.actionLogger.addToStateHistory({func: 'select', param: {'nodes': nodesIdInDrawing}});
		this.network.selectNodes(nodesIdInDrawing);
	}
	
	colorizeNodesByName(nodeNames: string | undefined | null, color: string)
	{
		if(typeof nodeNames == 'undefined' || nodeNames==null || nodeNames==undefined)
		{
			return;
		}
		
		var colorizingIds=[];
		var nodeNamesArray=[];
		if( typeof nodeNames == 'string' ) 
		{
			nodeNamesArray = nodeNames.replace(' ', '').split(',');
			
		}
		else
		{
			nodeNamesArray=nodeNames;
		}
		
		for(var i=0;i<nodeNamesArray.length;i++)
		{
			console.log('^'+nodeNamesArray[i].replace('*', '(.*)')+'$');
			var re = new RegExp('^'+nodeNamesArray[i].split('*').join('(.*)')+'$');
			for (var j = 0; j < this.originalNodes.length; j++) 
			{
				if (re.test(this.originalNodes[j].label!)) 
				{
					colorizingIds.push(this.originalNodes[j].id);
				}
			}
		}
		this.colorizeNodes(colorizingIds,color);
	}
	
	clusterUsingColor()
	{
		
		// TODO: Re-workt the clusterer and make sure that this returns valid data

		// run the clustering algorithm and then remove the clusterer
		const internalClusterer = new Clusterer(this.originalNodes, this.originalEdges, this.statusLogger);
		const membership = internalClusterer.cluster();
		internalClusterer.destroy();
		
		var clusteredNodes: string[][] =[];
		var usedClusters=[];
		
		for(var i=0;i<membership.length;i++)
		{
			if(typeof clusteredNodes[membership[i]] === 'undefined')
			{
				clusteredNodes[membership[i]]=[];
				usedClusters.push(membership[i]);
			}
			
			clusteredNodes[membership[i]].push(this.originalNodes[i].id);
		}
		
				
		for(var i=0;i<membership.length;i++)
		{
			this.originalNodes[i].membership=membership[i]; // TODO: Clean node should get an optional membership thingy
		}
		
		this.startRendering();
		
		for(var i=0;i<usedClusters.length;i++)
		{
			//that.cageNodes(clusteredNodes[usedClusters[i]],rainbow(usedClusters.length,i));
			this.colorizeNodes(clusteredNodes[usedClusters[i]],rainbow(usedClusters.length,i),false);
		}
		this.network.redraw();
	}
	
	colorizeNodes(nodeIds: string[] | undefined, color: string, doRedraw=true)
	{
		if(nodeIds===undefined)
		{
			nodeIds=this.network.getSelectedNodes().map(e => e.toString());
		}
		
		if(color==undefined)
		{
			color='blue';
		}
		
		if(this.network!=null)
		{
			var toUpdate=[];
			for (var i=0;i<nodeIds.length;i++) 
			{
				toUpdate.push({id: nodeIds[i], color:{background:color,highlight:{background:color}}});
			}
			this.nodes.update(toUpdate);
			if(doRedraw==true)
			{
				this.network.redraw();
			}
		}
	}
	
	cluster(nodeIds?: string[],name?: string, givenClusterId?: string)
	{
		// TODO: The parameter clusterID looks weird
		// because of the way it is treated in case of an undo / redo
		if(typeof givenClusterId ==='undefined')
		{
			givenClusterId=this.clusterId.toString();
		}
		
		if(nodeIds==undefined)
		{
			nodeIds=this.network.getSelectedNodes().map(e => e.toString());
		}
		
		if(name==undefined)
		{
			name='cluster_' +givenClusterId;
		}
		
		if(this.network!=null)
		{
			this.clusterPositions['cluster_' +givenClusterId]=[
				nodeIds,
				this.network.getPositions(nodeIds)
			];
			this.allClusters.push('cluster_' +givenClusterId);
			var options: ClusterOptions = 
			{
				joinCondition: (nodeOptions) =>
				{
					return nodeIds!.indexOf(nodeOptions.id) != -1;
				},
				processProperties: function (clusterOptions, childNodes, childEdges) 
				{
                  var totalMass = 0;
                  for (var i = 0; i < childNodes.length; i++) 
				  {
                      totalMass += childNodes[i].mass;
                  }
                  clusterOptions.mass = totalMass;
                  return clusterOptions;
              },
              clusterNodeProperties: {id: 'cluster_' +givenClusterId , borderWidth: 2, shape: 'database', color:'orange', label:name} as vis.NodeOptions
			}
			this.network.clustering.cluster(options);
			this.actionLogger.addToStateHistory({func: 'cluster', param: {'clusterId': 'cluster_' +givenClusterId, 'name': name, 'nodes': nodeIds}});
			this.clusterId++;
		}
	}
	
	getGraph(jsonURL: string)
	{
		this.statusLogger.setStatusText('Downloading graph...');
		this.statusLogger.setStatusCursor('wait');
		
		// TODO: This is really unsafe if other stuff is on the page
		$.ajaxSetup(
		{
            error: (x, e) =>
			{
                if (x.status == 0) 
				{
					this.statusLogger.setStatusText('<font color="red">Downloading graph failed (Check Your Network)</font>');
					this.statusLogger.setStatusCursor('auto');
                } 
                else if (x.status == 404) 
				{
					this.statusLogger.setStatusText('<font color="red">Downloading graph failed (Requested URL not found)</font>');
					this.statusLogger.setStatusCursor('auto');
                } 
				else if (x.status == 500) 
				{
					this.statusLogger.setStatusText('<font color="red">Downloading graph failed (Internel Server Error)</font>');
                    this.statusLogger.setStatusCursor('auto');
                }  
				else 
				{
					this.statusLogger.setStatusText('<font color="red">Downloading graph failed (HTTP-Error-Code: '+x.status+')</font>');
					this.statusLogger.setStatusCursor('auto');
					console.log(x);
                }
            }
        });
		
		$.get(jsonURL, this.drawGraph.bind(this));
	}

	loadJSONGraph(data: string | IDirtyGraph)
	{
		if(typeof data === 'string') // data.length < 20 TODO: WHAT?
		{
			this.statusLogger.setStatusText('<font color="red">Graph-File is empty or corrupt</font>');
			this.statusLogger.setStatusCursor('auto');
			return;
		}
		
		if(typeof data['nodes'] == 'undefined' || typeof data['edges'] == 'undefined')
		{
			this.statusLogger.setStatusText('<font color="red">Graph-File is invalid (maybe incorrect JSON?)</font>');
			this.statusLogger.setStatusCursor('auto');
			return;
		}

		this.loadDataSet(data.nodes, data.edges, true);
	}
	
	private drawGraph(data: string | IDirtyGraph, status: number | string=200)
	{
		if(status!=200 && status!='success') 
		{
			this.statusLogger.setStatusText('<font color="red">Downloading graph failed (HTTP-Error-Code: '+status+')</font>');
			this.statusLogger.setStatusCursor('auto');
			return;
		}
	
		if(typeof data === 'string') // data.length < 20 TODO: WHAT?
		{
			this.statusLogger.setStatusText('<font color="red">Graph-File is empty or corrupt</font>');
			this.statusLogger.setStatusCursor('auto');
			return;
		}
		
		if(typeof data['nodes'] == 'undefined' || typeof data['edges'] == 'undefined')
		{
			this.statusLogger.setStatusText('<font color="red">Graph-File is invalid (maybe incorrect JSON?)</font>');
			this.statusLogger.setStatusCursor('auto');
			return;
		}

		this.loadDataSet(data.nodes, data.edges);
	}

	/**
	 * Loads a given dataset from the user, ensuring consistency
	 * @param nodes 
	 * @param edges 
	 * @param fixedPositions 
	 */
	private loadDataSet(nodes: DirtyNode[], edges: DirtyEdge[], fixedPositions?: boolean) {
		this.originalNodes=nodes.map(n => cleanNode(n, this.config.NODE_STYLES));
		this.originalEdges=edges.map(e => cleanEdge(e, this.config.ARROW_STYLES));

		this.addUsedButNotDefinedNodes();
		
		this.originalNodes = ensureUniqueIds(this.originalNodes);
		this.originalEdges = ensureUniqueIds(this.originalEdges);
		
		this.startConstruction(fixedPositions);
	}
	
	private addUsedButNotDefinedNodes()
	{
		this.statusLogger.setStatusText('Adding used but not defined nodes...');
		var mappedNodes: Record<string, vis.Node> = {};
		for(var i=0;i< this.originalNodes.length;i++ )
		{
			mappedNodes[this.originalNodes[i].id]=this.originalNodes[i];
		}
		
		for(var i=0;i< this.originalEdges.length;i++ )
		{
			if(this.originalEdges[i].from != undefined && mappedNodes[this.originalEdges[i].from]==undefined)
			{
				var nodeLabel=this.originalEdges[i].from as string;
				var exploded=nodeLabel.split('?');
				if(exploded[1]!=undefined)
				{
					nodeLabel=exploded[1];
				}
				
				var addNode=
				{
					'id' : this.originalEdges[i].from!,
					'style' : 'border',
					'label' : nodeLabel,
					'url' : this.originalEdges[i].from as string
				};
				
				this.originalNodes.push(cleanNode(addNode, this.config.NODE_STYLES));
				mappedNodes[this.originalEdges[i].from]=addNode;
				console.log('Border-Node: '+nodeLabel+' ('+this.originalEdges[i].from+')');
			}
			if(this.originalEdges[i].to!=undefined && mappedNodes[this.originalEdges[i].to]==undefined)
			{
				var nodeLabel=this.originalEdges[i].to;
				var exploded=nodeLabel.split('?');
				if(exploded[1]!=undefined)
				{
					nodeLabel=exploded[1];
				}
				
				var addNode=
				{
					'id' : this.originalEdges[i].to,
					'style' : 'border',
					'label' : nodeLabel,
					'url' : this.originalEdges[i].to
				};
				
				this.originalNodes.push(cleanNode(addNode, this.config.NODE_STYLES));
				mappedNodes[this.originalEdges[i].to]=addNode;
				console.log('Border-Node: '+nodeLabel+' ('+this.originalEdges[i].to+')');
			}
		}
	}
	
	// TODO: Compare and unify with drawgraph
	private addNodesAndEdges(data: IDirtyGraph | string, status: number | string=200)
	{
		if(status!=200 && status!='success') // TODO: what kind of type is this? use either number or string
		{
			this.statusLogger.setStatusText('<font color="red">Downloading nodes failed (HTTP-Error-Code: '+status+')</font>');
			this.statusLogger.setStatusCursor('auto');
			return;
		}
	
		if(typeof data === 'string') // data.length < 20 TODO: WHAT?
		{
			this.statusLogger.setStatusText('<font color="red">Graph-File is empty or corrupt</font>');
			this.statusLogger.setStatusCursor('auto');
			return;
		}
		
		if(typeof data['nodes'] == 'undefined' || typeof data['edges'] == 'undefined')
		{
			this.statusLogger.setStatusText('<font color="red">Graph-File is invalid (maybe incorrect JSON?)</font>');
			this.statusLogger.setStatusCursor('auto');
			return;
		}
		
		var nodesJSON=data.nodes.map(n => cleanNode(n, this.config.NODE_STYLES));
		var edgesJSON=data.edges.map(e => cleanEdge(e, this.config.ARROW_STYLES));
		
		nodesJSON = ensureUniqueIds(nodesJSON);
		edgesJSON = ensureUniqueIds(edgesJSON);

		this.edges.update(edgesJSON);
		this.nodes.update(nodesJSON);
		
		this.originalEdges=this.originalEdges.concat(edgesJSON);
		this.originalNodes=this.originalNodes.concat(nodesJSON);
		
		this.statusLogger.setStatusText('<font color="green">Successfully recieved '+nodesJSON.length+' node(s) and '+edgesJSON.length+' edge(s)!</font>');
		this.statusLogger.setStatusCursor('auto');
	}
	
	addNode(nodeIn: DirtyNode)
	{
		let node = cleanNode(nodeIn, this.config.NODE_STYLES)

		this.originalNodes.push(node);
		if(node['mathml']!='') // TODO: More unclear node types
		{
			node = this.nodeToSVGMath(node);
		}

		if(node['previewhtml']!='')
		{
			node = this.nodeToSVGHTML(node);
		}
		this.nodes.update(node);
		
		this.actionLogger.addToStateHistory({func: 'addNode', param: {'node': node}});
	}
	
	addEdge(edgeIn: DirtyEdge)
	{
		const edge = cleanEdge(edgeIn, this.config.ARROW_STYLES);
		this.originalEdges.push(edge);
		this.edges.update(edge);
		
		this.actionLogger.addToStateHistory({func: 'addEdge', param: {'edge': edge}});
	}
	
	deleteEdges(edgeIds: string[])
	{
		var deletedEdges: CleanEdge[] =[];
		this.originalEdges = this.originalEdges.filter((item) => 
		{
			var keepEdge=true;
			for(var i=0;i<edgeIds.length;i++)
			{
				if(item.id==edgeIds[i])
				{
					keepEdge=false;
					deletedEdges.push(item);
					break;
				}
			}
			return keepEdge;
		});

		this.edges.remove(edgeIds);
		this.actionLogger.addToStateHistory({func: 'deleteEdges', param: {'edges': deletedEdges}});
	}
	
	deleteNodes(nodeIds: string[], edgeIds?: string[])
	{
		var deletedNodes: CleanNode[] = [];
		var deletedEdges: CleanEdge[] = [];

		this.originalNodes = this.originalNodes.filter((item) =>
		{
			var keepNode=true;
			for(var i=0;i<nodeIds.length;i++)
			{
				if(item.id==nodeIds[i])
				{
					keepNode=false;
					deletedNodes.push(item);
					break;
				}
			}
			return keepNode;
		});
		
		this.nodes.remove(nodeIds);
		
		if(edgeIds!== undefined)
		{
			this.originalEdges = this.originalEdges.filter((item) => 
			{
				var keepEdge=true;
				for(var i=0;i<edgeIds.length;i++)
				{
					if(item.id==edgeIds[i])
					{
						keepEdge=false;
						deletedEdges.push(item);
						break;
					}
				}
				return keepEdge;
			});
			this.edges.remove(edgeIds);
		}
		this.actionLogger.addToStateHistory({func: 'deleteNodes', param: {'nodes': deletedNodes,'edges':deletedEdges}});
	}
	
	saveEdge(edgeIn: DirtyEdge)
	{
		let oldEdge: CleanEdge | undefined = undefined;
		let edge = cleanEdge(edgeIn, this.config.ARROW_STYLES);
		for(var i=0;i<this.originalEdges.length;i++)
		{
			if(this.originalEdges[i].id==edge.id)
			{
				oldEdge=this.originalEdges[i];
				this.originalEdges[i]=edge;
				break;
			}
		}

		this.edges.update(edge);
		this.actionLogger.addToStateHistory({func: 'editEdge', param: {'newEdge': edge,'oldEdge':oldEdge!}});
	}
	
	saveNode(nodeIn: DirtyNode)
	{
		let oldNode: CleanNode | undefined = undefined;
		let node: CleanNode = cleanNode(nodeIn, this.config.NODE_STYLES);
		for(var i=0;i<this.originalNodes.length;i++)
		{
			if(this.originalNodes[i].id==node.id)
			{
				oldNode=this.originalNodes[i];
				this.originalNodes[i]=node;
				break;
			}
		}
		
		if(typeof node['mathml']!='undefined' && node['mathml']!='')
		{
			node = this.nodeToSVGMath(node);
		}
		if(typeof node['previewhtml']!='undefined' &&  node['previewhtml']!='')
		{
			node = this.nodeToSVGHTML(node);
		}
		this.nodes.update(node);
		this.actionLogger.addToStateHistory({func: 'editNode', param: {'newNode': node,'oldNode': oldNode!}});
	}
	
	isUniqueId(id: string)
	{
		for(var i=0;i<this.originalNodes.length;i++)
		{
			if(this.originalNodes[i].id==id)
			{
				return false;
			}
		}
		return true;
	}
	
	isUniqueEdgeId(id: string)
	{
		for(var i=0;i<this.originalEdges.length;i++)
		{
			if(this.originalEdges[i].id==id)
			{
				return false;
			}
		}
		return true;
	}
	
	private lazyLoadNodes(jsonURL?: string)
	{
		if(jsonURL==undefined || jsonURL.length<3)
		{
			return;
		}
		
		this.statusLogger.setStatusText('Downloading nodes...');
		this.statusLogger.setStatusCursor('wait');
		
		$.ajaxSetup(
		{
            error: function(x, e) 
			{
                if (x.status == 0) 
				{
					this.statusLogger.setStatusText('<font color="red">Downloading nodes failed (Check Your Network)</font>');
					this.statusLogger.setStatusCursor('auto');
                } 
                else if (x.status == 404) 
				{
					this.statusLogger.setStatusText('<font color="red">Downloading nodes failed (Requested URL not found)</font>');
					this.statusLogger.setStatusCursor('auto');
                } 
				else if (x.status == 500) 
				{
					this.statusLogger.setStatusText('<font color="red">Downloading nodes failed (Internel Server Error)</font>');
                    this.statusLogger.setStatusCursor('auto');
                }  
				else 
				{
					this.statusLogger.setStatusText('<font color="red">Downloading nodes failed (HTTP-Error-Code: '+x.status+')</font>');
					this.statusLogger.setStatusCursor('auto');
                }
            }
        });
		
		$.get(jsonURL, this.addNodesAndEdges.bind(this));
	}
	
	openCluster(nodeId: string)
	{
		if (this.network.isCluster(nodeId) == true) 
		{
			var node = this.network.body.nodes[nodeId].label; //options.label
              this.network.openCluster(nodeId);
			  var toUpdate: IPositionWithId[] =[];
			  for (var i=0;i<this.clusterPositions[nodeId][0].length;i++) 
			  {
				  var id=this.clusterPositions[nodeId][0][i];
				  toUpdate.push({id: id, x:this.clusterPositions[nodeId][1][id].x, y:this.clusterPositions[nodeId][1][id].y});
			  }
			  
			var index = this.allClusters.indexOf(nodeId as string);
			if (index > -1) 
			{
				this.allClusters.splice(index, 1);
			}
			
			this.actionLogger.addToStateHistory({func: 'uncluster', param: {'clusterId': nodeId, 'nodes': toUpdate.map(e => e.id), 'name':node/*.label*/}});
			this.nodes.update(toUpdate);
			this.network.redraw();
        }
	}
	
	private estimateExtraSVGHeight(expression: string): number
	{
		if(expression.indexOf('frac') == -1 && expression.indexOf('under') == -1  && expression.indexOf('over') == -1)
		{
			return 0;
		}
		else
		{
			//return 16;
			return 0;
		}
	}
	

	private nodeToSVGHTML(node: CleanNode): CleanNode
	{
		this.dom.$$('string_span').html(node['previewhtml'] || '');
		var width=this.dom.$$('string_span').width()!;
		var height=this.dom.$$('string_span').height()!;
		this.dom.$$('string_span').html('');
		var svg;
		
		if(node['shape']=='image')
		{
			var overallheight=height;
			svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+(width+16*1)+' '+(16*1+overallheight)+'" width="'+(width+16*1)+'px" height="'+(16*1+overallheight)+'px" preserveAspectRatio="none">' +
			//svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMinYMin">' +
			'<foreignObject x="8" y="8" width="'+(width+15)+'" height="'+overallheight+'">' +
			'<div xmlns="http://www.w3.org/1999/xhtml" style="font-size:18px;margin-left: auto;margin-right: auto;display: flex;align-items: center;justify-content: center">' +
			node['previewhtml'] +
			'</div></foreignObject>' +
			'</svg>';
		}
		else
		{
			svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+(30*1+width)+'px" height="'+(30*1+height)+'px" preserveAspectRatio="none">' +
			'<foreignObject x="15" y="13" width="100%" height="100%">' +
			'<div xmlns="http://www.w3.org/1999/xhtml">' +
			node['previewhtml'] +
			'</div></foreignObject>' +
			'</svg>';
		}
		node['image']='data:image/svg+xml;charset=utf-8,'+ encodeURIComponent(svg);
		return node
	}

	private nodeToSVGMath(node: CleanNode): CleanNode
	{
		this.dom.$$('string_span').html(node['mathml']!);
		var width=this.dom.$$('string_span').width()!;
		var height=this.dom.$$('string_span').height()!;
		this.dom.$$('string_span').html('');
		var svg;
		
		if(node['shape']=='image')
		{
			var overallheight=height+this.estimateExtraSVGHeight(node['mathml']!);
			svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+(width+16*1)+' '+(16*1+overallheight)+'" width="'+(width+16*1)+'px" height="'+(16*1+overallheight)+'px" preserveAspectRatio="none">' +
			//svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMinYMin">' +
			'<foreignObject x="8" y="8" width="'+(width+15)+'" height="'+overallheight+'">' +
			node['mathml'] +
			'</foreignObject>' +
			'</svg>';
		}
		else
		{
			svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+(30*1+width)+'px" height="'+(30*1+height+this.estimateExtraSVGHeight(node['mathml']!))+'px" preserveAspectRatio="none">' +
			'<foreignObject x="15" y="13" width="100%" height="100%">' +
			node['mathml'] +
			'</foreignObject>' +
			'</svg>';
		}
		node['image']='data:image/svg+xml;charset=utf-8,'+ encodeURIComponent(svg);
		return node
	}
	
	private startConstruction(fixedPositions=false)
	{	
		var hideEdgesType: Record<string, boolean>={};
		for(var j=0;j<this.edgesNameToHide.length;j++)
		{
			var type=this.edgesNameToHide[j].type;
			if(this.edgesNameToHide[j].hidden==true)
			{
				hideEdgesType[type]=true;
			}
		}
		
		this.internalOptimizer = new Optimizer(this.originalNodes, this.originalEdges, hideEdgesType, this.statusLogger);
		this.statusLogger.setStatusText('Constructing graph...');
		var processedNodes=0;
		var nodesCount=0;
		
		for(var i=0;i<this.originalNodes.length;i++)
		{
			if(this.originalNodes[i]['image']!='' && this.originalNodes[i]['image']!=undefined)
			{
				nodesCount++;
			}
		}

		for(var i=0;i<this.originalNodes.length;i++)
		{
			this.hiddenNodes[this.originalNodes[i]['id']]=false;
			if(this.originalNodes[i]['image']!='' && this.originalNodes[i]['image']!=undefined)
			{
				var callback = ((node: CleanNode, data: any) =>
				{
					node['mathml']=data;
					this.nodeToSVGMath(node);
					processedNodes++;
					if(processedNodes==nodesCount)
					{
						this.startRendering();
					}
				}).bind(this, this.originalNodes[i]) as JQuery.jqXHR.DoneCallback;

				$.get(this.originalNodes[i]['image'] as string, callback);
			}
			else 
			{
				if(this.originalNodes[i]['mathml']!=undefined && this.originalNodes[i]['mathml']!.length>10 && this.originalNodes[i]['mathml']!='')
				{
					this.nodeToSVGMath(this.originalNodes[i]);
				}
				if(typeof this.originalNodes[i]['previewhtml']!='undefined' &&  this.originalNodes[i]['previewhtml']!='')
				{
					this.nodeToSVGHTML(this.originalNodes[i]);
				}
			}
		}
		
		if(nodesCount==0)
		{
			this.startRendering(fixedPositions);
		}
	}
	
	// Called when the Visualization API is loaded.
	private startRendering(fixedPositions?: boolean) 
	{
		if(typeof fixedPositions == 'undefined')
		{
			fixedPositions=false;
		}
		this.statusLogger.setStatusText('Rendering graph...');
		if(fixedPositions==false)
		{
			var hideEdgesType: Record<string, boolean>={};
			for(var j=0;j<this.edgesNameToHide.length;j++)
			{
				var type=this.edgesNameToHide[j].type;
				if(this.edgesNameToHide[j].hidden==true)
				{
					hideEdgesType[type]=true;
				}
			}
			if(typeof this.config.THEORY_GRAPH_OPTIONS.layout === 'undefined' || typeof (this.config.THEORY_GRAPH_OPTIONS as any).layout.ownLayoutIdx === 'undefined' || (this.config.THEORY_GRAPH_OPTIONS as any).layout.ownLayoutIdx==1)
			{
				var opti=new Optimizer(this.originalNodes,this.originalEdges, hideEdgesType, this.statusLogger);
				var spacingValue = parseInt(this.dom.getElementById<HTMLInputElement>('nodeSpacingBox').value, 10);
				if(this.originalNodes.length+this.originalEdges.length>3000)
				{
					opti.weaklyHierarchicalLayout(500, spacingValue);
				}
				else if(this.originalNodes.length+this.originalEdges.length>2000)
				{
					opti.weaklyHierarchicalLayout(700, spacingValue);
				}
				else
				{
					opti.weaklyHierarchicalLayout(1000, spacingValue);
				}
				opti.destroy();
			}
			else if((this.config.THEORY_GRAPH_OPTIONS as any).layout.ownLayoutIdx==2)
			{
				var opti=new Optimizer(this.originalNodes,this.originalEdges, hideEdgesType, this.statusLogger);
				opti.GenerateRandomSolution();
				var spacingValue = parseInt(this.dom.getElementById<HTMLInputElement>('nodeSpacingBox').value, 10);
				// TODO: Check if the new arguments are correct
				if(this.originalNodes.length+this.originalEdges.length>3000)
				{
					//opti.SolveUsingForces(200,spacingValue,200,{"meta":false},this.originalEdges);
					opti.SolveUsingForces(200,spacingValue);
				}
				else if(this.originalNodes.length+this.originalEdges.length>2000)
				{
					//opti.SolveUsingForces(400,spacingValue,200,{"meta":false},this.originalEdges);
					opti.SolveUsingForces(400,spacingValue);
				}
				else
				{
					// opti.SolveUsingForces(600,spacingValue,200,{"meta":false},this.originalEdges);
					opti.SolveUsingForces(600,spacingValue);
				}
				opti.destroy();
			}
			else if(this.config.THEORY_GRAPH_OPTIONS.layout.ownLayoutIdx==4)
			{
				var opti=new Optimizer(this.originalNodes,this.originalEdges, hideEdgesType, this.statusLogger);
				opti.GenerateRandomSolution();
				var spacingValue = parseInt(this.dom.getElementById<HTMLInputElement>('nodeSpacingBox').value, 10);
				if(this.originalNodes.length+this.originalEdges.length>3000)
				{
					opti.waterDrivenLayout(200, spacingValue);
				}
				else if(this.originalNodes.length+this.originalEdges.length>2000)
				{
					opti.waterDrivenLayout(400, spacingValue);
				}
				else
				{
					opti.waterDrivenLayout(600, spacingValue);
				}
				opti.destroy();
			}
		}

		for(var i=0;i<this.originalEdges.length;i++)
		{
			this.originalEdges[i].hidden=false;
		}
		
		for(var j=0;j<this.edgesNameToHide.length;j++)
		{
			for(var i=0;i<this.originalEdges.length;i++)
			{
				var type=this.edgesNameToHide[j].type;
				if(type==this.originalEdges[i]['style'] || ('graph'+type)==this.originalEdges[i]['style'] )
				{
					this.originalEdges[i].hidden=this.edgesNameToHide[j].hidden;
				}
			}
		}
		
		this.nodes = new DataSet(this.originalNodes);
		this.edges = new DataSet(this.originalEdges);
		
		// create a network
		var data = 
		{
			nodes: this.nodes,
			edges: this.edges
		};
		
		this.network = new Network(this.dom.getElementById(this.containerName), data, this.config.THEORY_GRAPH_OPTIONS);
		//network.startSimulation(10); 
		
		if(this.config.THEORY_GRAPH_OPTIONS.physics.enabled==false)
		{
			this.statusLogger.setStatusCursor('auto');
			this.statusLogger.setStatusText('<font color="green">Received '+this.originalNodes.length+' nodes</font>');
		}
		
		this.network.on('afterDrawing', () =>
		{	
			if(this.onConstructionDone!=undefined)
			{
				var tmp=this.onConstructionDone;
				this.onConstructionDone=undefined;
				tmp();
				
			}
		});
		
		// If the document is clicked somewhere
		this.network.on('click', (e) =>
		{
			this.dom.$$('tooltip-container').hide(10);
			// If the clicked element is not the menu
			if (!($(e.target).parents('.custom-menu').length > 0)) 
			{
				// Hide it
				this.dom.$('.custom-menu').hide(10);
			}
			if(this.manipulateSelectedRegion(e.pointer.canvas)==false)
			{
				this.selectRegion(e.pointer.canvas);
			}
			
			if(this.addNodeToRegion==true && this.allNodeRegions[this.addNodeRegionId as number].selected==false)
			{
				this.addNodeToRegion=false;
				this.statusLogger.setStatusCursor('auto');
			}
		});
		
		// If the document is clicked somewhere
		this.network.on('selectNode', (e) => 
		{
			//console.log(e);
			
			if(this.manualFocus==true)
			{
				this.focusOnNodes();
				return;
			}
			
			if(this.addNodeToRegion==true && e.nodes.length>0 && this.allNodeRegions[this.addNodeRegionId as number].selected==true)
			{
				for(var i=0;i<e.nodes.length;i++)
				{
					this.allNodeRegions[this.addNodeRegionId as number].nodeIds.push(e.nodes[i]);
				}
				this.network.redraw();
			}
		});

		
		// If the menu element is clicked
		this.dom.$('.custom-menu li').click((e) =>
		{
			var nodesFound=this.network.getSelectedNodes();
			var selectedNode: Partial<CleanNode>=this.network.body.nodes[nodesFound[0]];
			
			if (selectedNode==undefined)
			{
				for(var i=0;i<this.originalNodes.length;i++)
				{
					if(this.originalNodes[i]['id']==nodesFound[0])
					{
						selectedNode=this.originalNodes[i];
						break;
					}
				}
			}
			else
			{
				selectedNode=selectedNode.options || {};
			}
			
			
			
			var edgesFound=this.network.getSelectedEdges();
			var selectedEdge=undefined;
			for(var i=0;i<this.originalEdges.length;i++)
			{
				if(this.originalEdges[i]['id']==edgesFound[0])
				{
					selectedEdge=this.originalEdges[i];
					break;
				}
			}
			
			var selected=undefined;
			
			if(selectedEdge!=undefined)
			{
				selected=selectedEdge;
			}
			
			if(selectedNode!=undefined)
			{
				selected=selectedNode;
			}
			
			if(selected!=undefined)
			{
				// This is the triggered action name
				switch($(e.target).attr('data-action')) 
				{
					// A case for each action
					case 'openWindow': window.open(this.config.serverUrl+selected.url!); break;
					case 'showURL': alert(this.config.serverUrl+selected.url!); break;
					case 'openCluster': this.openCluster(selected.id!); break;
					case 'inferType': alert('Not implemented yet!'); break;
					case 'showDecl': alert('Not implemented yet!'); break;
					case 'childNodes': this.lazyLoadNodes(selectedNode.childsURL) ; break;
				}
			}
			
			// Hide it AFTER the action was triggered
			this.dom.$('.custom-menu').hide(10);
		});
		
		this.network.on('oncontext', (params) =>
		{
			this.dom.$$('tooltip-container').hide(10);
			this.dom.$('.custom-menu').hide(10);
			
			var node=this.network.getNodeAt({x: params['pointer']['DOM']['x'],y: params['pointer']['DOM']['y']});
			
			if(node!=undefined)
			{
				this.network.selectNodes([node]);
				// Show contextmenu
				this.dom.$('.custom-menu').finish().show(10).
				
				// In the right position (the mouse)
				css({
					top: params['pointer']['DOM']['y']*1+20 + 'px',
					left: params['pointer']['DOM']['x']*1+16+this.dom.getElementById('mainbox').offsetLeft + 'px',
				});
				return;
			}
			
			var edge=this.network.getEdgeAt({x: params['pointer']['DOM']['x'],y: params['pointer']['DOM']['y']});
			
			if(typeof edge != undefined && edge!=undefined)
			{
				this.network.selectEdges([edge]);
				
				var selectedEdge=undefined;
				for(var i=0;i<this.originalEdges.length;i++)
				{
					if(this.originalEdges[i]['id']==edge)
					{
						selectedEdge=this.originalEdges[i];
						break;
					}
				}
					
				if (selectedEdge!=undefined && typeof selectedEdge.clickText != 'undefined')
				{
					// Show contextmenu
					this.dom.$$('tooltip-container').finish().show(10).
					html(selectedEdge.clickText ).
					// In the right position (the mouse)
					css({
						top: params['pointer']['DOM']['y']*1+20 + 'px',
						left: params['pointer']['DOM']['x']*1+16+this.dom.getElementById('mainbox').offsetLeft + 'px'
					});
				}
			}
			
		});
		
		this.network.on('stabilizationIterationsDone', (params) =>
		{
			this.network.stopSimulation();
			var options = 
			{
				physics: 
				{
					enabled: false
				}
			};
			this.network.setOptions(options);
			this.statusLogger.setStatusCursor('auto');
			this.statusLogger.setStatusText('<font color="green">Received '+this.originalNodes.length+' nodes</font>');
		});
		
		
		// we use the zoom event for our clustering
		/*network.on('zoom', function (params) 
		{
			console.log(params.direction+" "+params.scale+" < "+lastClusterZoomLevel*clusterFactor);
			if (params.direction == '-') 
			{
				if (params.scale < lastClusterZoomLevel*clusterFactor) 
				{
					that.clusterOutliers(params.scale);
					lastClusterZoomLevel = params.scale;
				}
			}
			else 
			{
				openOutlierClusters(params.scale);
			} 
		});*/
		
		this.network.on('beforeDrawing', (ctx) => 
		{
			this.drawAllColoredRegions(ctx);
		});
		
		this.network.on('afterDrawing', (ctx) =>
		{
			this.drawAllColoredRegionsOnCanvas(ctx);
			
		});
		
		this.network.once('initRedraw', () => 
		{
			if (this.lastClusterZoomLevel === 0) 
			{
				this.lastClusterZoomLevel = this.network.getScale();
			}
			this.statusLogger.setStatusCursor('auto');
		});
	}
}

// import {setLocation, getRandomColor, rainbow, getParameterByName, getStartToEnd} from './utils.js';
import {rainbow, getParameterByName, getStartToEnd} from '../utils';
import StatusLogger from "../dom/StatusLogger";
import ActionHistory from "./ActionHistory";
import { Options } from "../options";
import { INode } from "../layout/Base";
import { IGraphJSONEdge, IGraphJSONNode, IGraphJSONGraph } from "../graph";
import Optimizer from "../layout/Optimizer";
import { Position, BoundingBox, IdType, ClusterOptions } from "vis";
import Clusterer from "../layout/Clusterer";

declare module 'vis' {
	interface NetworkNodes {
		[index: number]: Position // options: hidden?
		[index: string]: Position // options: hidden?
	}
	interface Network {
		getConnectedNodes(nodeOrEdgeId: IdType, direction: string): IdType[];
		body: { nodes: NetworkNodes };
		canvas: {frame: {canvas: HTMLCanvasElement}};
		clustering: Network;
	}
	interface Node {
		style?: string;
		label?: string;
		mathml?: string;
		previewhtml?: string;
		url?: string;
		membership?: number;
	}
	interface Edge {
		style?: string;
		type?: string;
		weight?: string;
		url?: string;
	}
}

interface INodeRegion extends vis.BoundingBox {
	nodeIds: vis.IdType[];
	selected: boolean;

	color: string;

	mappedNodes: {
		[index: number]: number
		[index: string]: number
	}
}

export interface IRectangle {
	w: number;
	h: number;
	startX: number;
	startY: number;
}

interface IPositionWithId extends Partial<vis.Position> {
	id: IdType;
}

export default class TheoryGraph {
	constructor(containerNameIn: string, statusLoggerIn: StatusLogger, actionLoggerIn: ActionHistory){
		this.statusLogger = statusLoggerIn;
		this.containerName = containerNameIn;
		this.actionLogger = actionLoggerIn;

		this.removeRegionImg.src = "img/delete_region.png";
		this.moveRegionImg.src = "img/move_region.png";
		this.addNodeToRegionImg.src = "img/add_region.png";
	}

	private options: Options = undefined!; // HACK HACK HACK
	private readonly statusLogger: StatusLogger;
	private readonly actionLogger: ActionHistory;
	private readonly containerName: string;

	private originalNodes: vis.Node[] = []; // TODO: 'style'
	private originalEdges: vis.Edge[] = []; // TODO: 'type'

	private network: vis.Network = undefined!; // HACK HACK HACK TODO: Create an empty network

	private nodes: vis.DataSet<vis.Node> = undefined!;
	private edges: vis.DataSet<vis.Edge> = undefined!;
	
	private clusterId = 0;
	private lastClusterZoomLevel = 0;

	private zoomClusters: any[] = []; // TODO: Fix me
	private allClusters: string[] = [];
	private clusterPositions: {[id: string]: [vis.IdType[], {
		[index: number]: Position
		[index: string]: Position
	}]} = {}
	
	
	private hiddenNodes: {
		[id: number]: boolean
		[id: string]: boolean
	} = {};
	private edgesNameToHide: vis.Edge[]=[];

	onConstructionDone: (() => void) | undefined;
	manualFocus: boolean = false;
	
	private allManuallyHiddenNodes: {nodes: vis.Node[], edges: vis.Edge[]}[] = [];
	private allNodeRegions: INodeRegion[] = [];

	private readonly removeRegionImg = new Image();
	private readonly moveRegionImg = new Image();
	private readonly addNodeToRegionImg = new Image();
	
	private moveRegionHold=false;
	private moveRegionId=0;
	private oldRegionPosition:{x?: number, y?: number}={}; // TODO: Fix my type

	private addNodeToRegion=false;
	private addNodeRegionId: IdType | undefined;

	private internalOptimizer: Optimizer | undefined;
	
	setOptions(optionsIn: Options) {
		this.options = optionsIn;
	}

	focusOnNodes(nodeIds?: vis.IdType[]) {
		this.network.getSelectedNodes()

		var nodesToShow: vis.IdType[] = [];
		if (typeof nodeIds == "undefined")
		{
			nodeIds = this.network.getSelectedNodes();
		}
		
		if(nodeIds==undefined || nodeIds.length==0)
		{
			return;
		}
		
		nodesToShow=nodesToShow.concat(nodeIds);
		
		//var positions=network.getPositions();
		var edgesToShow:vis.IdType[]=[];

		for(var i=0;i<nodeIds.length;i++)
		{
			var middleNodePos=this.network.body.nodes[nodeIds[i]];
			var connectedEdges=this.network.getConnectedEdges(nodeIds[i]);
			
			edgesToShow=edgesToShow.concat(connectedEdges);
			var toNodes=this.network.getConnectedNodes(nodeIds[i],"to");
			var fromNodes=this.network.getConnectedNodes(nodeIds[i],"from");
			
			if(nodeIds.length==1)
			{
				for(var j=0;j<fromNodes.length;j++)
				{
					if((middleNodePos.y-this.network.body.nodes[fromNodes[j]].y)<200)
					{
						
						this.network.body.nodes[fromNodes[j]]!.y=middleNodePos.y-(Math.random()*50+150);
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

			this.originalNodes[i].y=this.network.body.nodes[this.originalNodes[i].id!].y;
			this.originalNodes[i].x=this.network.body.nodes[this.originalNodes[i].id!].x;
			
			if(nodesToShow.indexOf(this.originalNodes[i]["id"]!) == -1)
			{
				nodesToHide.push(this.originalNodes[i]["id"]!);
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
			this.internalOptimizer!.SolveUsingForces(25, 12, false);
		}
		
		var newNodePositions: Array<IPositionWithId>=[];
		for(var i=0;i<this.originalNodes.length;i++)
		{
			newNodePositions.push({"id": this.originalNodes[i].id!, "x": this.originalNodes[i].x,"y": this.originalNodes[i].y})
		}
		this.nodes.update(newNodePositions); // TODO: Fix nodes type
		
		this.statusLogger.setStatusText("");
		
		var edgesToHide=[];
		for(var i=0;i<this.originalEdges.length;i++)
		{
			edgesToHide.push(this.originalEdges[i].id!) // TODO: Fix originalEdges type
		}
		
		this.hideEdgesById(edgesToHide,true);
		
		this.hideEdgesById(edgesToShow,false);
	}
	
	manipulateSelectedRegion(coords: Position)
	{
		// If the document is hold somewhere
		
		var updateNodes: IPositionWithId[] =[];
		var redraw=false;
		var selectRegion=false;
		if(this.moveRegionHold==true)
		{
			var newRegionPosition=coords;
			var difX=newRegionPosition.x-this.oldRegionPosition.x!;
			var difY=newRegionPosition.y-this.oldRegionPosition.y!;
			var positions=this.network.getPositions(this.allNodeRegions[this.moveRegionId].nodeIds);
			for(var i=0;i<this.allNodeRegions[this.moveRegionId].nodeIds.length;i++)
			{
				if(typeof this.allNodeRegions[this.moveRegionId].nodeIds[i] != "undefined")
				{
					updateNodes.push({"id":this.allNodeRegions[this.moveRegionId].nodeIds[i] ,"x":this.network.body.nodes[this.allNodeRegions[this.moveRegionId].nodeIds[i]].x+difX, "y":this.network.body.nodes[this.allNodeRegions[this.moveRegionId].nodeIds[i]].y+difY});
				}
			}
			this.moveRegionHold=false;
			document.getElementById(this.options.external.mainContainer)!.style.cursor = 'auto';
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
						document.getElementById(this.options.external.mainContainer)!.style.cursor = 'pointer';
						selectRegion=true;
						break;
					}
					else if(this.allNodeRegions[i].left-74<=coords.x && this.allNodeRegions[i].left>=coords.x && this.allNodeRegions[i].top+86<=coords.y && this.allNodeRegions[i].top+122>=coords.y)
					{
						this.addNodeRegionId=i;
						this.addNodeToRegion=true;
						document.getElementById(this.options.external.mainContainer)!.style.cursor = 'copy';
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
	
	selectRegion(coords: Position)
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
	
	removeNodeRegion(index: number)
	{
		this.allNodeRegions.splice(index, 1);
		this.network.redraw();
	}
	
	drawAllColoredRegionsOnCanvas(ctx: CanvasRenderingContext2D)
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
	
	drawAllColoredRegions(ctx: CanvasRenderingContext2D)
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

	intersectRect(a: vis.BoundingBox, b: vis.BoundingBox): boolean
	{
		return (a.left <= b.right &&
			b.left <= a.right &&
			a.top <= b.bottom &&
			b.top <= a.bottom)
	}
	
	liesInAnyRegion(box: vis.BoundingBox,id: IdType): number
	{
		for(var j=0;j<this.allNodeRegions.length;j++)
		{
			if(typeof this.allNodeRegions[j].mappedNodes[id]=="undefined" && this.intersectRect(box, this.allNodeRegions[j])==true)
			{
				return j;
			}
		}
		
		return -1;
	}
	
	repositionNodes()
	{
		//var allNodePositions=network.getPositions();
		var newPositions: IPositionWithId[]=[];
		for(var i=0;i<this.originalNodes.length;i++)
		{
			var box=this.network.getBoundingBox(this.originalNodes[i].id!);
			
			var avgX=0;
			var avgY=0;
			var countAvg=0;
			for(var j=0;j<this.allNodeRegions.length;j++)
			{	
				if(typeof this.allNodeRegions[j].mappedNodes[this.originalNodes[i].id!]!="undefined")
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
				if(typeof this.allNodeRegions[j].mappedNodes[this.originalNodes[i].id!]=="undefined" && this.intersectRect(box, this.allNodeRegions[j])==true)
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
							intersectingRegion=this.liesInAnyRegion(box,this.originalNodes[i].id!);
							if(intersectingRegion!=-1)
							{
								newX=this.allNodeRegions[intersectingRegion].left-width/1.8;
							}
						} 
						newPositions.push({"x":newX, "id":this.originalNodes[i].id!});
					}
					else if(minDirection==1)
					{
						var intersectingRegion=0;
						var newX=this.allNodeRegions[j].right+width/1.8;
						while(intersectingRegion!=-1)
						{
							box.left=newX-width/2;
							box.right=newX+width/2;
							intersectingRegion=this.liesInAnyRegion(box,this.originalNodes[i].id!);
							if(intersectingRegion!=-1)
							{
								newX=this.allNodeRegions[intersectingRegion].right+width/1.8;
							}
						} 
						newPositions.push({"x":newX, "id":this.originalNodes[i].id!});
					}
					else if(minDirection==2)
					{
						var intersectingRegion=0;
						var newY=this.allNodeRegions[j].top-height/1.8;
						while(intersectingRegion!=-1)
						{
							box.top=newY-height/2;
							box.bottom=newY+height/2;
							intersectingRegion=this.liesInAnyRegion(box,this.originalNodes[i].id!);
							if(intersectingRegion!=-1)
							{
								newY=this.allNodeRegions[intersectingRegion].top-height/1.8;
							}
						} 
						newPositions.push({"y":newY, "id":this.originalNodes[i].id!});
					}
					else if(minDirection==3)
					{
						var intersectingRegion=0;
						var newY=this.allNodeRegions[j].bottom+height/1.8;
						while(intersectingRegion!=-1)
						{
							box.top=newY-height/2;
							box.bottom=newY+height/2;
							intersectingRegion=this.liesInAnyRegion(box,this.originalNodes[i].id!);
							if(intersectingRegion!=-1)
							{
								newY=this.allNodeRegions[intersectingRegion].bottom+height/1.8;
							}
						} 
						newPositions.push({"y":newY, "id":this.originalNodes[i].id!});
					}
				}
			}
		}
		
		for(var i=0;i<newPositions.length;i++)
		{
			var position = newPositions[i];
			if(typeof position.x != "undefined")
			{
				this.network.body.nodes[newPositions[i].id].x=position.x;
			}
			if(typeof position.y != "undefined")
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
		var nodeIds = this.network.getSelectedNodes();
		for (var i = 0; i < this.originalNodes.length; i++) 
		{
			var curNode = this.originalNodes[i];
			if(curNode["style"]==type)
			{
				nodeIds.push(curNode.id!);
			}
			
		}
		this.actionLogger.addToStateHistory("select", {"nodes": nodeIds});
		this.network.selectNodes(nodeIds);
	}
	
	selectEdgesById(edgeIds: vis.IdType[])
	{
		this.actionLogger.addToStateHistory("selectEdges", {"edges": edgeIds});
		this.network.selectEdges(edgeIds);
	}
	
	selectEdgesByType(type: string)
	{
		var edgeIds = [];
		for (var i = 0; i < this.originalEdges.length; i++) 
		{
			var currEdge = this.originalEdges[i];
			if(currEdge["style"]==type)
			{
				edgeIds.push(currEdge.id!);
			}
			
		}
		this.actionLogger.addToStateHistory("selectEdges", {"edges": edgeIds});
		this.network.selectEdges(edgeIds);
	}
	
	getUsedNodeTypes(): string[]
	{
		var usedNodeTypes=[];
		for (var i = 0; i < this.originalNodes.length; i++) 
		{
			if(typeof this.originalNodes[i]["style"]!="undefined" && usedNodeTypes.indexOf(this.originalNodes[i]["style"]!)==-1)
			{
				usedNodeTypes.push(this.originalNodes[i]["style"]!);
			}
		}
		return usedNodeTypes;
	}
	
	getUsedEdgeTypes(): string[]
	{
		var usedEdgeTypes=[];
		for (var i = 0; i < this.originalEdges.length; i++) 
		{
			if(typeof this.originalEdges[i]["style"]!="undefined" && usedEdgeTypes.indexOf(this.originalEdges[i]["style"]!)==-1)
			{
				usedEdgeTypes.push(this.originalEdges[i]["style"]!);
			}
		}
		return usedEdgeTypes;
	}
	
	graphToIFrameString(parameterName: string, onlySelected: boolean, compressionRate: number)
	{
		if (typeof parameterName == "undefined")
		{
			parameterName="tgviewGraphData_"+Math.floor((new Date()).getTime() / 1000)+"_"+Math.floor(Math.random() * 1000);
		}
		
		if (typeof onlySelected == "undefined")
		{
			onlySelected=false;
		}

		if (typeof compressionRate == "undefined")
		{
			compressionRate=0;
		}
		
		//TODO: what is this?, looks like an unsafe eval() being called somewhere
		return {"storage":"localStorage.setItem('"+parameterName+"', '"+this.generateCompressedJSON(onlySelected, compressionRate).split("'").join("\\'")+"');", "uri":location.protocol + '//' + location.host + location.pathname+"?source=iframe&uri="+parameterName, "id":parameterName};
	}
	
	graphToLocalStorageString(parameterName: string, onlySelected: boolean, compressionRate: number)
	{
		if (typeof parameterName == "undefined")
		{
			parameterName="tgviewGraphData_"+Math.floor((new Date()).getTime() / 1000)+"_"+Math.floor(Math.random() * 1000);
		}
		
		if (typeof onlySelected == "undefined")
		{
			onlySelected=false;
		}

		if (typeof compressionRate == "undefined")
		{
			compressionRate=0;
		}
		
		return {"storage":"localStorage.setItem('"+parameterName+"', '"+this.generateCompressedJSON(onlySelected, compressionRate).split("'").join("\\'")+"');", "uri":location.protocol + '//' + location.host + location.pathname+"?source=param&uri="+parameterName, "name":parameterName};
	}
	
	graphToURIParameterString(onlySelected: boolean, compressionRate: number)
	{
		if (typeof onlySelected == "undefined")
		{
			onlySelected=false;
		}

		if (typeof compressionRate == "undefined")
		{
			compressionRate=2;
		}
		
		return location.protocol + '//' + location.host + location.pathname+"?source=param&uri="+encodeURI(this.generateCompressedJSON(onlySelected, compressionRate));
	}

	graphToStringJSON(onlySelected: boolean, compressionRate: number)
	{
		if (typeof onlySelected == "undefined")
		{
			onlySelected=false;
		}

		if (typeof compressionRate == "undefined")
		{
			compressionRate=0;
		}
		
		return this.generateCompressedJSON(onlySelected, compressionRate);
	}
	
	generateCompressedJSON(onlySelected: boolean, compressionRate: number)
	{	
		// TODO: Use JSON.stringify for cleaner code
		var allNodePositions: vis.Position[]=[];
		
		var json="{\"nodes\":[";
		if (typeof onlySelected == "undefined")
		{
			onlySelected=false;
		}
		
		if (typeof compressionRate == "undefined")
		{
			compressionRate=0;
		}

		if(compressionRate==0)
		{
			allNodePositions=this.network.getPositions() as any as vis.Position[]; // TODO: Is this safe?
		}
		
		var nodeIds=undefined;
		var nodeIdMapping: number[]=[];
		
		if(onlySelected==true)
		{
			nodeIds=this.network.getSelectedNodes();
			
			for (var i = 0; i < nodeIds.length; i++) 
			{
				nodeIdMapping[nodeIds[i] as number]=1;
			}
		}
		
		var mapping: number[]=[];
		var counter=0;
		for (var i = 0; i < this.originalNodes.length; i++) 
		{
			var currentNodeJson="{";
			var curNode = this.originalNodes[i];
			
			if(onlySelected==true && typeof nodeIdMapping[curNode.id as number] == "undefined")
			{
				continue;
			}
			
			if(typeof mapping[curNode.id as number] == "undefined")
			{
				mapping[curNode.id as number]=counter;
				counter++;
			}
			
			currentNodeJson+='"id":"'+curNode.id+'",';
			currentNodeJson+='"label":"'+curNode.label+'",';
			currentNodeJson+='"style":"'+curNode.style+'"';
			
			if(typeof curNode.shape != "undefined" && curNode.shape!="")
			{
				currentNodeJson+=',"shape":"'+curNode.shape+'"';
			}
			
			if(typeof curNode.mathml != "undefined" && curNode.mathml!="")
			{
				currentNodeJson+=',"mathml":"'+curNode.mathml.split('"').join("'")+'"';
			}

			if(typeof curNode.previewhtml != "undefined" && curNode.previewhtml!="")
			{
				currentNodeJson+=',"previewhtml":"'+curNode.previewhtml.split('"').join("'")+'"';
			}
			
			if(typeof curNode.url != "undefined" && curNode.url!="" && compressionRate<2)
			{
				currentNodeJson+=',"url":"'+curNode.url+'"';
			}
			
			if(compressionRate==0)
			{
				currentNodeJson+=',"x":"'+allNodePositions[curNode.id as number].x+'"';
				currentNodeJson+=',"y":"'+allNodePositions[curNode.id as number].y+'"';
			}
			
			currentNodeJson+="},";
			json+=currentNodeJson;
		}
		
		json=json.substring(0, json.length - 1)+"],\"edges\":[";
		
		for (var i = 0; i < this.originalEdges.length; i++) 
		{				
			var currEdge = this.originalEdges[i];
			if(typeof mapping[currEdge.to as number] != "undefined" && typeof mapping[currEdge.from as number] != "undefined" )
			{
				var currentEdgeJson="{";
				
				currentEdgeJson+='"to":"'+currEdge.to+'",';
				currentEdgeJson+='"from":"'+currEdge.from+'",';
				currentEdgeJson+='"style":"'+currEdge.style+'"';
				
				if(typeof currEdge.label != "undefined" && currEdge.label!="" && compressionRate<2)
				{
					currentEdgeJson+=',"label":"'+currEdge.label+'"';
				}
				
				if(typeof currEdge.weight != "undefined" && currEdge.weight!="" && compressionRate<2)
				{
					currentEdgeJson+=',"weight":"'+currEdge.weight+'"';
				}
				
				if(typeof currEdge.url != "undefined" && currEdge.url!="" && compressionRate<2)
				{
					currentEdgeJson+=',"url":"'+currEdge.url+'"';
				}
				
				currentEdgeJson+="},";
				json+=currentEdgeJson;
			}
		}
		
		if(this.allClusters.length>0)
		{
			json=json.substring(0, json.length - 1)+"],\"cluster\":[";
			
			for (var i = 0; i < this.allClusters.length; i++) 
			{		
				var currentClusterJson="{\"nodeIds\":";
				currentClusterJson+=JSON.stringify(this.clusterPositions[this.allClusters[i]][0]);
				currentClusterJson+=",";
				
				currentClusterJson+="\"nodePositions\":";
				currentClusterJson+=JSON.stringify(this.clusterPositions[this.allClusters[i]][1]);
				currentClusterJson+="";
				
				currentClusterJson+="},";
				json+=currentClusterJson;
			}
		}

		json=json.substring(0, json.length - 1)+"]}";
		return json;
	}
	
	loadGraphByLocalStorage(parameterName?: string)
	{
		if (typeof parameterName == "undefined")
		{
			parameterName="tgviewGraphData";
		}

		var graphData=localStorage.getItem(parameterName);
		drawGraph(JSON.parse(graphData!));
	}
	
	loadGraphByURIParameter()
	{
		var graphData=getParameterByName("uri");
		drawGraph(JSON.parse(graphData!));
	}
	
	hideEdges(type: string, hideEdge: boolean)
	{
		this.setEdgesHidden(type, hideEdge);
		var edgesToHide: Array<{id: IdType, hidden: boolean}>=[];
		for(var i=0;i<this.originalEdges.length;i++)
		{
			//console.log(type+""+originalEdges[i]["style"]);
			if(type==this.originalEdges[i]["style"] || ("graph"+type)==this.originalEdges[i]["style"] )
			{
				if(hideEdge==true)
				{
					edgesToHide.push({id: this.originalEdges[i]["id"]!, hidden: hideEdge!});
				}
				else if(hideEdge==false && (this.hiddenNodes[this.originalEdges[i].to!]==false && this.hiddenNodes[this.originalEdges[i].from!]==false))
				{
					edgesToHide.push({id: this.originalEdges[i]["id"]!, hidden: hideEdge!});
				}
			}
		}
		this.edges.update(edgesToHide);
		//actionLoggerIn.addToStateHistory("hideEdges", {"hideEdges":edgesToHide,"hidden":hideEdge});
	}
	
	hideEdgesById(edgeIds?: IdType[], hideEdge: boolean)
	{
		if(typeof edgeIds=="undefined" || edgeIds.length==0)
			return;
		
		var edgesToHide=[];
		for(var i=0;i<edgeIds.length;i++)
		{
			edgesToHide.push({id: edgeIds[i], hidden: hideEdge});
		}
		this.edges.update(edgesToHide);
		this.actionLogger.addToStateHistory("hideEdges", {"hideEdges":edgesToHide,"hidden":hideEdge});
	}
	
	
	showAllManuallyHiddenNodes()
	{
		var nodesToHide=[];
		var edgesToHide=[];
		for(var i=0;i<this.allManuallyHiddenNodes.length;i++)
		{
			for(var j=0;j<this.allManuallyHiddenNodes[i].nodes.length;j++)
			{
				this.allManuallyHiddenNodes[i].nodes[j].hidden=false;
				nodesToHide.push(this.allManuallyHiddenNodes[i].nodes[j]);
				this.hiddenNodes[this.allManuallyHiddenNodes[i].nodes[j].id!]=false;
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

		this.actionLogger.addToStateHistory("hideNodes", {"hideNodes":nodesToHide,"hideEdges":edgesToHide,"hidden":false});
	}
	
	hideNodesById(nodeIds?: vis.IdType[], hideNode: boolean)
	{
		if(typeof nodeIds=="undefined" || nodeIds.length==0)
		{
			nodeIds=this.network.getSelectedNodes();
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
				edgesToHide.push({id: this.originalEdges[i]["id"], hidden: hideNode});
			}

			if(hideNode==false && (this.hiddenNodes[this.originalEdges[i].to!]==false && this.hiddenNodes[this.originalEdges[i].from!]==false))
			{
				edgesToHide.push({id: this.originalEdges[i]["id"], hidden: hideNode});
			}
		}
		this.edges.update(edgesToHide);
		
		this.allManuallyHiddenNodes.push({"nodes":nodesToHide, "edges":edgesToHide});
		this.actionLogger.addToStateHistory("hideNodes", {"hideNodes":nodesToHide,"hideEdges":edgesToHide,"hidden":hideNode});
	}
	
	hideNodes(type: string, hideEdge: boolean)
	{
		//that.setEdgesHidden(type, hideEdge);
		var nodesToHide=[];
		
		for(var i=0;i<this.originalNodes.length;i++)
		{
			//console.log(type+""+originalEdges[i]["style"]);
			if(type==this.originalNodes[i]["style"] || ("graph"+type)==this.originalNodes[i]["style"] )
			{
				nodesToHide.push({id: this.originalNodes[i]["id"], hidden: hideEdge});
				this.hiddenNodes[this.originalNodes[i]["id"]!]=hideEdge;
			}
		}
		this.nodes.update(nodesToHide);
		
		var mappedEdges: {[tp: string]: boolean}={};
		for(var i=0;i<this.edgesNameToHide.length;i++)
		{
			mappedEdges[this.edgesNameToHide[i].type!]=this.edgesNameToHide[i].hidden!;
		}
		
		var edgesToHide=[];
		for(var i=0;i<this.originalEdges.length;i++)
		{
			if(hideEdge==true && (this.hiddenNodes[this.originalEdges[i].to!] == true || this.hiddenNodes[this.originalEdges[i].from!] == true))
			{
				edgesToHide.push({id: this.originalEdges[i]["id"]!, hidden: hideEdge});
			}
			
			if(typeof mappedEdges[this.originalEdges[i]["style"]!] != "undefined" && mappedEdges[this.originalEdges[i]["style"]!]!=hideEdge)
			{
				continue;
			}
			
			
			if(hideEdge==false && (this.hiddenNodes[this.originalEdges[i].to!]==false && this.hiddenNodes[this.originalEdges[i].from!]==false))
			{
				edgesToHide.push({id: this.originalEdges[i]["id"], hidden: hideEdge});
			}
		}
		this.edges.update(edgesToHide);
		
		//actionLoggerIn.addToStateHistory("hideNodes", {"hideNodes":nodesToHide,"hideEdges":edgesToHide,"hidden":hideEdge});
	}
	
	setEdgesHidden(type: string, hideEdge: boolean)
	{
		for(var i=0;i<this.edgesNameToHide.length;i++)
		{
			if(type==this.edgesNameToHide[i].type)
			{
				this.edgesNameToHide[i].hidden=hideEdge;
				return;
			}
		}

		this.edgesNameToHide.push({"hidden": hideEdge,"type": type});
	}
	
	downloadCanvasAsImage(/*button*/)
	{
		var minX=111110;
		var minY=111110;
		var maxX=-111110;
		var maxY=-111110;
		for (var i = 0; i < this.originalNodes.length; i++) 
		{
			var curNode = this.originalNodes[i];
			var nodePosition = this.network.getPositions([curNode.id!]);
			
			minX=Math.min(nodePosition[curNode.id!].x,minX);
			maxX=Math.max(nodePosition[curNode.id!].x,maxX);
			
			minY=Math.min(nodePosition[curNode.id!].y,minY);
			maxY=Math.max(nodePosition[curNode.id!].y,maxY);
		}
		
		var originalWidth=this.network.canvas.frame.canvas.width + 'px';
		var originalHeight=this.network.canvas.frame.canvas.height+ 'px';
		
		var sizeA = Math.min((maxX-minX)*1.2,3500) + 'px';
		var sizeB = Math.min((maxY-minY)*1.2,3500) + 'px';
		this.network.setSize(sizeA,sizeB);
		
		this.network.redraw();
		this.network.fit();
		
		this.network.once("afterDrawing",() => 
		{
			
			//button.href = network.canvas.frame.canvas.toDataURL();
			//button.download = "graph.png";

			var downloadLink      = document.createElement('a');
			downloadLink.target   = '_blank';
			downloadLink.download = 'graph.png';

			var image=this.network.canvas.frame.canvas.toDataURL("image/png");

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
			this.statusLogger.setStatusText("");
		});
	}
	
    openOutlierClusters(scale: number): boolean
	{
        var newClusters = [];
        var declustered = false;
        for (var i = 0; i < this.zoomClusters.length; i++) 
		{
            if (this.zoomClusters[i].scale < scale) 
			{
                this.network.openCluster(this.zoomClusters[i].id);
                this.lastClusterZoomLevel = scale;
                declustered = true;
            }
            else 
			{
                newClusters.push(this.zoomClusters[i])
            }
        }
		this.zoomClusters = newClusters;
		return declustered;
    }
	
	selectNodes(nodeIds: vis.IdType[])
	{
		this.network.selectNodes(nodeIds);
		this.actionLogger.addToStateHistory("select", {"nodes": nodeIds});
	}
	
	selectNodesWithIdLike(searchId: string)
	{
		var nodeIds = [];
		for (var i = 0; i < this.originalNodes.length; i++) 
		{
			var curNode = this.originalNodes[i];
			if((curNode.id as string).indexOf(searchId)>-1)
			{
				nodeIds.push(curNode.id!);
			}
			
		}
		this.actionLogger.addToStateHistory("select", {"nodes": nodeIds});
		this.network.selectNodes(nodeIds);
	}
	
	clusterOutliers(scale: number)
	{
		var clusterOptionsByData: vis.ClusterOptions = 
		{
			processProperties: (clusterOptions, childNodes) =>
			{
				this.clusterId = this.clusterId + 1;
				var childrenCount = 0;
				for (var i = 0; i < childNodes.length; i++) 
				{
					childrenCount += childNodes[i].childrenCount || 1;
				}
				clusterOptions.childrenCount = childrenCount;
				clusterOptions.label = "# " + childrenCount + "";
				clusterOptions.font = {size: Math.min(childrenCount+20,40)}
				clusterOptions.id = 'cluster_' + this.clusterId;
				this.zoomClusters.push({id:'cluster_' + this.clusterId, scale:scale});
				return clusterOptions;
			},
			clusterNodeProperties: {borderWidth: 2, shape: 'database', color:"orange"}
		}
		this.network.clusterOutliers(clusterOptionsByData);
	}
	
	cageNodes(nodeIds?: vis.IdType[],color: string)
	{
		if(nodeIds==undefined)
		{
			nodeIds=this.network.getSelectedNodes();
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
		
		this.allNodeRegions.push({"nodeIds":nodeIds,"color":color,"selected":true}); // TODO: Fix allNodeRegions
		this.actionLogger.addToStateHistory("cageNodes", {"nodeIds":nodeIds,"color":color,"index":this.allNodeRegions.length-1});
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
			var nodePosition = this.network.getPositions([curNode.id!]);
			if(typeof nodePosition!="undefined" && typeof this.network.body.nodes[curNode.id!] !="undefined" && this.network.body.nodes[curNode.id!].options.hidden!=true)
			{
				var nodeXY = this.network.canvasToDOM({x: nodePosition[curNode.id!].x, y: nodePosition[curNode.id!].y});
				if (xRange.start <= nodeXY.x && nodeXY.x <= xRange.end && yRange.start <= nodeXY.y && nodeXY.y <= yRange.end) 
				{
					nodesIdInDrawing.push(curNode.id!);
				}
			}
		}
		this.actionLogger.addToStateHistory("select", {"nodes": nodesIdInDrawing});
		this.network.selectNodes(nodesIdInDrawing);
	}
	
	colorizeNodesByName(nodeNames?: string | null, color: string)
	{
		if(typeof nodeNames == "undefined" || nodeNames==null || nodeNames==undefined)
		{
			return;
		}
		
		var colorizingIds=[];
		var nodeNamesArray=[];
		if( typeof nodeNames == 'string' ) 
		{
			nodeNamesArray = nodeNames.replace(" ", "").split(",");
			
		}
		else
		{
			nodeNamesArray=nodeNames;
		}
		
		for(var i=0;i<nodeNamesArray.length;i++)
		{
			console.log("^"+nodeNamesArray[i].replace("*", "(.*)")+"$");
			var re = new RegExp("^"+nodeNamesArray[i].split("*").join("(.*)")+"$");
			for (var j = 0; j < this.originalNodes.length; j++) 
			{
				if (re.test(this.originalNodes[j].label!)) 
				{
					colorizingIds.push(this.originalNodes[j].id!);
				}
			}
		}
		this.colorizeNodes(colorizingIds,color);
	}
	
	clusterUsingColor()
	{
		var internalClusterer = new Clusterer(this.originalNodes, this.originalEdges, this.statusLogger); // TODO: Match originalNodes type
		var membership=internalClusterer.cluster();
		
		var clusteredNodes: vis.IdType[][] =[];
		var usedClusters=[];
		
		for(var i=0;i<membership.length;i++)
		{
			if(typeof clusteredNodes[membership[i]] === "undefined")
			{
				clusteredNodes[membership[i]]=[];
				usedClusters.push(membership[i]);
			}
			
			clusteredNodes[membership[i]].push(this.originalNodes[i].id!);
		}
		
				
		for(var i=0;i<membership.length;i++)
		{
			this.originalNodes[i].membership=membership[i];
		}
		
		this.startRendering();
		
		for(var i=0;i<usedClusters.length;i++)
		{
			//that.cageNodes(clusteredNodes[usedClusters[i]],rainbow(usedClusters.length,i));
			this.colorizeNodes(clusteredNodes[usedClusters[i]],rainbow(usedClusters.length,i),false);
		}
		this.network.redraw();
	}
	
	colorizeNodes(nodeIds?: vis.IdType[],color: string, doRedraw=true)
	{
		if(nodeIds==undefined)
		{
			nodeIds=this.network.getSelectedNodes();
		}
		
		if(color==undefined)
		{
			color="blue";
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
	
	cluster(nodeIds?: vis.IdType[],name?: string,givenClusterId?: number)
	{
		if(typeof givenClusterId ==="undefined")
		{
			givenClusterId=this.clusterId;
		}
		
		if(nodeIds==undefined)
		{
			nodeIds=this.network.getSelectedNodes();
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
              clusterNodeProperties: {id: 'cluster_' +givenClusterId , borderWidth: 2, shape: 'database', color:"orange", label:name} as NodeOptions
			}
			this.network.clustering.cluster(options);
			this.actionLogger.addToStateHistory("cluster", {"clusterId": 'cluster_' +givenClusterId, "name": name, "nodes": nodeIds});
			this.clusterId++;
		}
	}
	
	getGraph(jsonURL: string)
	{
		this.statusLogger.setStatusText("Downloading graph...");
		document.body.style.cursor = 'wait';
		
		$.ajaxSetup(
		{
            error: function(x, e) 
			{
                if (x.status == 0) 
				{
					this.statusLogger.setStatusText('<font color="red">Downloading graph failed (Check Your Network)</font>');
					document.body.style.cursor = 'auto';
                } 
                else if (x.status == 404) 
				{
					this.statusLogger.setStatusText('<font color="red">Downloading graph failed (Requested URL not found)</font>');
					document.body.style.cursor = 'auto';
                } 
				else if (x.status == 500) 
				{
					this.statusLogger.setStatusText('<font color="red">Downloading graph failed (Internel Server Error)</font>');
                    document.body.style.cursor = 'auto';
                }  
				else 
				{
					this.statusLogger.setStatusText('<font color="red">Downloading graph failed (HTTP-Error-Code: '+x.status+')</font>');
					document.body.style.cursor = 'auto';
					console.log(x);
                }
            }
        });
		
		$.get(jsonURL, drawGraph);
	}

	loadJSONGraph(data: IGraphJSONGraph | string)
	{
		if(typeof data === 'string') // data.length < 20 TODO: WHAT?
		{
			this.statusLogger.setStatusText('<font color="red">Graph-File is empty or corrupt</font>');
			document.body.style.cursor = 'auto';
			return;
		}
		
		if(typeof data["nodes"] == 'undefined' || typeof data["edges"] == 'undefined')
		{
			this.statusLogger.setStatusText('<font color="red">Graph-File is invalid (maybe incorrect JSON?)</font>');
			document.body.style.cursor = 'auto';
			return;
		}

		this.originalNodes=data["nodes"];
		this.originalEdges=data["edges"];

		this.addUsedButNotDefinedNodes();
		
		this.ensureUniqueIds(this.originalNodes); // TODO: Fix types here
		this.ensureUniqueIds(this.originalEdges); // TODO: Fix types here
		
		this.postprocessEdges();
		this.postprocessNodes();
		
		this.startConstruction(true);
	}
	
	drawGraph(data: string, status: number | string=200)
	{
		if(status!=200 && status!="success") 
		{
			this.statusLogger.setStatusText('<font color="red">Downloading graph failed (HTTP-Error-Code: '+status+')</font>');
			document.body.style.cursor = 'auto';
			return;
		}
	
		if(typeof data === 'string') // data.length < 20 TODO: WHAT?
		{
			this.statusLogger.setStatusText('<font color="red">Graph-File is empty or corrupt</font>');
			document.body.style.cursor = 'auto';
			return;
		}
		
		if(typeof data["nodes"] == 'undefined' || typeof data["edges"] == 'undefined')
		{
			this.statusLogger.setStatusText('<font color="red">Graph-File is invalid (maybe incorrect JSON?)</font>');
			document.body.style.cursor = 'auto';
			return;
		}
		
		this.originalNodes=data["nodes"];
		this.originalEdges=data["edges"];

		this.addUsedButNotDefinedNodes();
		
		this.ensureUniqueIds(this.originalNodes);
		this.ensureUniqueIds(this.originalEdges);
		
		this.postprocessEdges();
		this.postprocessNodes();
		
		this.startConstruction();
	}
	
	addUsedButNotDefinedNodes()
	{
		this.statusLogger.setStatusText("Adding used but not defined nodes...");
		var mappedNodes: vis.Node[] =[];
		for(var i=0;i< this.originalNodes.length;i++ )
		{
			mappedNodes[this.originalNodes[i].id as number]=this.originalNodes[i];
		}
		
		for(var i=0;i< this.originalEdges.length;i++ )
		{
			if(this.originalEdges[i].from != undefined && mappedNodes[this.originalEdges[i].from as number]==undefined)
			{
				var nodeLabel=this.originalEdges[i].from as string;
				var exploded=nodeLabel.split("?");
				if(exploded[1]!=undefined)
				{
					nodeLabel=exploded[1];
				}
				
				var addNode=
				{
					"id" : this.originalEdges[i].from!,
					"style" : "border",
					"label" : nodeLabel,
					"url" : this.originalEdges[i].from as string
				};
				
				this.originalNodes.push(addNode);
				mappedNodes[this.originalEdges[i].from as number]=addNode;
				console.log("Border-Node: "+nodeLabel+" ("+this.originalEdges[i].from+")");
			}
			if(this.originalEdges[i].to!=undefined && mappedNodes[this.originalEdges[i].to as number]==undefined)
			{
				var nodeLabel=this.originalEdges[i].to as string;
				var exploded=nodeLabel.split("?");
				if(exploded[1]!=undefined)
				{
					nodeLabel=exploded[1];
				}
				
				var addNode=
				{
					"id" : this.originalEdges[i].to!,
					"style" : "border",
					"label" : nodeLabel,
					"url" : this.originalEdges[i].to as string
				};
				
				this.originalNodes.push(addNode);
				mappedNodes[this.originalEdges[i].to as number]=addNode;
				console.log("Border-Node: "+nodeLabel+" ("+this.originalEdges[i].to+")");
			}
		}
	}
	
	postprocessNodes(nodesIn?: vis.Node[])
	{	
		// TODO: Node types
		if(typeof nodesIn =="undefined" )
		{
			nodesIn=this.originalNodes;
		}
		
		for(var i=0;i<nodesIn.length;i++)
		{
			if(nodesIn[i].style!=undefined && this.options.NODE_STYLES[nodesIn[i].style!]!=undefined)
			{
				var styleInfos=this.options.NODE_STYLES[nodesIn[i].style!]!;

				if(styleInfos.shape=="ellipse" || styleInfos.shape=="circle")
				{
					if((nodesIn[i].previewhtml!=undefined && nodesIn[i].previewhtml!="" && nodesIn[i].previewhtml!.length>10) || (nodesIn[i].mathml!=undefined && nodesIn[i].mathml!="" && nodesIn[i].mathml!.length>10))
						nodesIn[i].shape="circularImage";
					else
						nodesIn[i].shape="ellipse";
				}
				else if(styleInfos.shape=="square")
				{
					if((nodesIn[i].previewhtml!=undefined && nodesIn[i].previewhtml!="" && nodesIn[i].previewhtml!.length>10) || (nodesIn[i].mathml!=undefined && nodesIn[i].mathml!="" && nodesIn[i].mathml!.length>10))
						nodesIn[i].shape="image";
					else
						nodesIn[i].shape="square";
				}
				else
				{
					if((nodesIn[i].previewhtml!=undefined && nodesIn[i].previewhtml!="" && nodesIn[i].previewhtml!.length>10) || (nodesIn[i].mathml!=undefined && nodesIn[i].mathml!="" && nodesIn[i].mathml!.length>10))
						nodesIn[i].shape="image";
					else
						nodesIn[i].shape=styleInfos.shape;
				}
				
				if(typeof nodesIn[i].color=="undefined")
				{
					nodesIn[i].color={highlight:{}};
				}
				
				if(typeof nodesIn[i].shapeProperties=="undefined")
				{
					nodesIn[i].shapeProperties={};
				}
				
				if (typeof styleInfos.color!="undefined" && styleInfos.color!="") 
				{
					nodesIn[i].color.background=styleInfos.color;
				}
				if (typeof styleInfos.colorBorder!="undefined" && styleInfos.colorBorder!="") 
				{
					nodesIn[i].color.border=styleInfos.colorBorder;
				}
				if (typeof styleInfos.colorHighlightBorder!="undefined" && styleInfos.colorHighlightBorder!="") 
				{
					nodesIn[i].color.highlight.border=styleInfos.colorHighlightBorder;
				}
				if (typeof styleInfos.colorHighlight!="undefined" && styleInfos.colorHighlight!="") 
				{
					nodesIn[i].color.highlight.background=styleInfos.colorHighlight;
				}
				if (typeof styleInfos.dashes!="undefined" && styleInfos.dashes==true) 
				{
					nodesIn[i].shapeProperties.borderDashes=[5,5];
				}

			}
		}
	}
	
	postprocessEdges(edgesIn?: vis.Edge[])
	{
		if(typeof edgesIn =="undefined" )
		{
			edgesIn=this.originalEdges;
		}
		
		for(var i=0;i<edgesIn.length;i++)
		{
			if(edgesIn[i].style!=undefined && this.options.ARROW_STYLES[edgesIn[i].style!]!=undefined)
			{
				var styleInfos=this.options.ARROW_STYLES[edgesIn[i].style]!;
				edgesIn[i].arrows = {to:{enabled:styleInfos.directed}};
				
				if(styleInfos.circle==true)
				{
					edgesIn[i].arrows!.to.type="circle";
				}
				else
				{
					edgesIn[i].arrows!.to.type="arrow";
				}

				if(styleInfos.smoothEdge==false)
				{
					edgesIn[i].smooth={enabled: false};
				}
				
				edgesIn[i].dashes=styleInfos.dashes;
				edgesIn[i].width=styleInfos.width;
				edgesIn[i].color={color:styleInfos.color, highlight:styleInfos.colorHighlight, hover:styleInfos.colorHover};
			}
		}
	}
	
	function addNodesAndEdges(data, status=200)
	{
		if(status!=200 && status!="success")
		{
			this.statusLogger.setStatusText('<font color="red">Downloading nodes failed (HTTP-Error-Code: '+status+')</font>');
			document.body.style.cursor = 'auto';
			return;
		}
	
		if(data.length<20)
		{
			statusLogger.setStatusText('<font color="red">Graph-File is empty or corrupt</font>');
			document.body.style.cursor = 'auto';
			return;
		}
		
		if(typeof data["nodes"] == 'undefined' || typeof data["edges"] == 'undefined')
		{
			statusLogger.setStatusText('<font color="red">Graph-File is invalid (maybe incorrect JSON?)</font>');
			document.body.style.cursor = 'auto';
			return;
		}
		
		var nodesJSON=data["nodes"];
		var edgesJSON=data["edges"];
		
		ensureUniqueIds(nodesJSON);
		ensureUniqueIds(edgesJSON);
		
		postprocessEdges(edgesJSON);
		postprocessNodes(nodesJSON);

		edges.update(edgesJSON);
		nodes.update(nodesJSON);
		
		originalEdges=originalEdges.concat(edgesJSON);
		originalNodes=originalNodes.concat(nodesJSON);
		
		statusLogger.setStatusText("<font color=\"green\">Successfully recieved "+nodesJSON.length+" node(s) and "+edgesJSON.length+" edge(s)!</font>");
		document.body.style.cursor = 'auto';
	}
	
	this.addNode = function(node)
	{
		originalNodes.push(node);
		postprocessNodes([node]);
		if(node["mathml"]!="")
		{
			nodeToSVGMath(node);
		}

		if(node["previewhtml"]!="")
		{
			nodeToSVGHTML(node);
		}
		nodes.update(node);
		
		actionLoggerIn.addToStateHistory("addNode", {"node": node});
	}
	
	this.addEdge = function(edge)
	{
		originalEdges.push(edge);
		postprocessEdges([edge]);
		edges.update(edge);
		
		actionLoggerIn.addToStateHistory("addEdge", {"edge": edge});
	}
	
	this.deleteEdges = function(edgeIds)
	{
		var deletedEdges=[];
		originalEdges = originalEdges.filter(function(item) 
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

		edges.remove(edgeIds);
		actionLoggerIn.addToStateHistory("deleteEdges", {"edges": deletedEdges});
	}
	
	this.deleteNodes = function(nodeIds, edgeIds=undefined)
	{
		var deletedNodes=[];
		var deletedEdges=[];
		originalNodes = originalNodes.filter(function(item) 
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
		
		nodes.remove(nodeIds);
		
		if(typeof edgeIds!="undefined")
		{
			originalEdges = originalEdges.filter(function(item) 
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
		}
		edges.remove(edgeIds);
		actionLoggerIn.addToStateHistory("deleteNodes", {"nodes": deletedNodes,"edges":deletedEdges});
	}
	
	this.saveEdge = function(edge)
	{
		var oldEdge={};
		postprocessEdges([edge]);
		for(var i=0;i<originalEdges.length;i++)
		{
			if(originalEdges[i].id==edge.id)
			{
				oldEdge=originalEdges[i];
				originalEdges[i]=edge;
				break;
			}
		}

		edges.update(edge);
		actionLoggerIn.addToStateHistory("editEdge", {"newEdge": edge,"oldEdge":oldEdge});
	}
	
	this.saveNode = function(node)
	{
		var oldNode={};
		postprocessNodes([node]);
		for(var i=0;i<originalNodes.length;i++)
		{
			if(originalNodes[i].id==node.id)
			{
				oldNode=originalNodes[i];
				originalNodes[i]=node;
				break;
			}
		}
		
		if(typeof node["mathml"]!="undefined" && node["mathml"]!="")
		{
			nodeToSVGMath(node);
		}
		if(typeof node["previewhtml"]!="undefined" &&  node["previewhtml"]!="")
		{
			nodeToSVGHTML(node);
		}
		nodes.update(node);
		actionLoggerIn.addToStateHistory("editNode", {"newNode": node,"oldNode":oldNode});
	}
	
	this.isUniqueId = function(id)
	{
		for(var i=0;i<originalNodes.length;i++)
		{
			if(originalNodes[i].id==id)
			{
				return false;
			}
		}
		return true;
	}
	
	this.isUniqueEdgeId = function(id)
	{
		for(var i=0;i<originalEdges.length;i++)
		{
			if(originalEdges[i].id==id)
			{
				return false;
			}
		}
		return true;
	}
	
	this.lazyLoadNodes=function(jsonURL)
	{
		if(jsonURL==undefined || jsonURL.length<3)
		{
			return;
		}
		
		statusLogger.setStatusText("Downloading nodes...");
		document.body.style.cursor = 'wait';
		
		$.ajaxSetup(
		{
            error: function(x, e) 
			{
                if (x.status == 0) 
				{
					statusLogger.setStatusText('<font color="red">Downloading nodes failed (Check Your Network)</font>');
					document.body.style.cursor = 'auto';
                } 
                else if (x.status == 404) 
				{
					statusLogger.setStatusText('<font color="red">Downloading nodes failed (Requested URL not found)</font>');
					document.body.style.cursor = 'auto';
                } 
				else if (x.status == 500) 
				{
					statusLogger.setStatusText('<font color="red">Downloading nodes failed (Internel Server Error)</font>');
                    document.body.style.cursor = 'auto';
                }  
				else 
				{
					statusLogger.setStatusText('<font color="red">Downloading nodes failed (HTTP-Error-Code: '+x.status+')</font>');
					document.body.style.cursor = 'auto';
                }
            }
        });
		
		$.get(jsonURL, addNodesAndEdges);
	}
	
	function ensureUniqueIds(arrays)
	{
		var idArray=[];
		for(var i=0;i<arrays.length;i++)
		{
			if(idArray[arrays[i]["id"]]==undefined)
			{
				idArray[arrays[i]["id"]]=1;
			}
			else
			{
				arrays[i]["id"]+="_"+i;
				idArray[arrays[i]["id"]]=1;
			}
		}
	}
	
	this.openCluster = function(nodeId)
	{
		if (network.isCluster(nodeId) == true) 
		{
			var node = network.body.nodes[nodeId].options;
              network.openCluster(nodeId);
			  var toUpdate=[];
			  for (var i=0;i<clusterPositions[nodeId][0].length;i++) 
			  {
				  var id=clusterPositions[nodeId][0][i];
				  toUpdate.push({id: id, x:clusterPositions[nodeId][1][id].x, y:clusterPositions[nodeId][1][id].y});
			  }
			  
			var index = allClusters.indexOf(nodeId);
			if (index > -1) 
			{
				allClusters.splice(index, 1);
			}
			
			  actionLoggerIn.addToStateHistory("uncluster", {"clusterId": nodeId, "nodes": toUpdate, "name":node.label});
			  nodes.update(toUpdate);
			  network.redraw();
        }
	}
	
	function estimateExtraSVGHeight(expression)
	{
		if(expression.indexOf("frac") == -1 && expression.indexOf("under") == -1  && expression.indexOf("over") == -1)
		{
			return 0;
		}
		else
		{
			//return 16;
			return 0;
		}
	}
	

	function nodeToSVGHTML(node)
	{
		$('#'+options.external.prefix+'string_span').html(node["previewhtml"]);
		var width=$('#'+options.external.prefix+'string_span').width();
		var height=$('#'+options.external.prefix+'string_span').height();
		$('#'+options.external.prefix+'string_span').html("");
		var svg;
		
		if(node["shape"]=="image")
		{
			var overallheight=height;
			svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+(width+16*1)+' '+(16*1+overallheight)+'" width="'+(width+16*1)+'px" height="'+(16*1+overallheight)+'px" preserveAspectRatio="none">' +
			//svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMinYMin">' +
			'<foreignObject x="8" y="8" width="'+(width+15)+'" height="'+overallheight+'">' +
			'<div xmlns="http://www.w3.org/1999/xhtml" style="font-size:18px;margin-left: auto;margin-right: auto;display: flex;align-items: center;justify-content: center">' +
			node["previewhtml"] +
			'</div></foreignObject>' +
			'</svg>';
		}
		else
		{
			svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+(30*1+width)+'px" height="'+(30*1+height)+'px" preserveAspectRatio="none">' +
			'<foreignObject x="15" y="13" width="100%" height="100%">' +
			'<div xmlns="http://www.w3.org/1999/xhtml">' +
			node["previewhtml"] +
			'</div></foreignObject>' +
			'</svg>';
		}
		node["image"]="data:image/svg+xml;charset=utf-8,"+ encodeURIComponent(svg);
	}

	function nodeToSVGMath(node)
	{
		$('#'+options.external.prefix+'string_span').html(node["mathml"]);
		var width=$('#'+options.external.prefix+'string_span').width();
		var height=$('#'+options.external.prefix+'string_span').height();
		$('#'+options.external.prefix+'string_span').html("");
		var svg;
		
		if(node["shape"]=="image")
		{
			var overallheight=height+estimateExtraSVGHeight(node["mathml"]);
			svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+(width+16*1)+' '+(16*1+overallheight)+'" width="'+(width+16*1)+'px" height="'+(16*1+overallheight)+'px" preserveAspectRatio="none">' +
			//svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMinYMin">' +
			'<foreignObject x="8" y="8" width="'+(width+15)+'" height="'+overallheight+'">' +
			node["mathml"] +
			'</foreignObject>' +
			'</svg>';
		}
		else
		{
			svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+(30*1+width)+'px" height="'+(30*1+height+estimateExtraSVGHeight(node["mathml"]))+'px" preserveAspectRatio="none">' +
			'<foreignObject x="15" y="13" width="100%" height="100%">' +
			node["mathml"] +
			'</foreignObject>' +
			'</svg>';
		}
		node["image"]="data:image/svg+xml;charset=utf-8,"+ encodeURIComponent(svg);
	}
	
	function startConstruction(fixedPositions=false)
	{	
		var hideEdgesType={};
		for(var j=0;j<edgesNameToHide.length;j++)
		{
			var type=edgesNameToHide[j].type;
			if(edgesNameToHide[j].hidden==true)
			{
				hideEdgesType[type]=1;
			}
		}
		
		internalOptimizer = new Optimizer(originalNodes, originalEdges, hideEdgesType, statusLogger);
		statusLogger.setStatusText("Constructing graph...");
		var processedNodes=0;
		var nodesCount=0;
		
		for(var i=0;i<originalNodes.length;i++)
		{
			if(originalNodes[i]["image"]!="" && originalNodes[i]["image"]!=undefined)
			{
				nodesCount++;
			}
		}

		for(var i=0;i<originalNodes.length;i++)
		{
			hiddenNodes[originalNodes[i]["id"]]=false;
			if(originalNodes[i]["image"]!="" && originalNodes[i]["image"]!=undefined)
			{
				function callback(node,data, status)
				{
					node["mathml"]=data;
					nodeToSVGMath(node);
					processedNodes++;
					if(processedNodes==nodesCount)
					{
						startRendering();
					}
				}

				var callback2=callback.bind(null,originalNodes[i]);

				$.get(originalNodes[i]["image"], callback2);
			}
			else 
			{
				if(originalNodes[i]["mathml"]!=undefined && originalNodes[i]["mathml"].length>10 && originalNodes[i]["mathml"]!="")
				{
					nodeToSVGMath(originalNodes[i]);
				}
				if(typeof originalNodes[i]["previewhtml"]!="undefined" &&  originalNodes[i]["previewhtml"]!="")
				{
					nodeToSVGHTML(originalNodes[i]);
				}
			}
		}
		
		if(nodesCount==0)
		{
			startRendering(fixedPositions);
		}
	}
	
	// Called when the Visualization API is loaded.
	function startRendering(fixedPositions) 
	{
		if(typeof fixedPositions == "undefined")
		{
			fixedPositions=false;
		}
		statusLogger.setStatusText("Rendering graph...");
		if(fixedPositions==false)
		{
			var hideEdgesType={};
			for(var j=0;j<edgesNameToHide.length;j++)
			{
				var type=edgesNameToHide[j].type;
				if(edgesNameToHide[j].hidden==true)
				{
					hideEdgesType[type]=1;
				}
			}
			if(typeof options.THEORY_GRAPH_OPTIONS.layout === 'undefined' || typeof options.THEORY_GRAPH_OPTIONS.layout.ownLayoutIdx === 'undefined' || options.THEORY_GRAPH_OPTIONS.layout.ownLayoutIdx==1)
			{
				var opti=new Optimizer(originalNodes,originalEdges, hideEdgesType, statusLogger);
				if(originalNodes.length+originalEdges.length>3000)
				{
					opti.weaklyHierarchicalLayout(500,document.getElementById(options.external.prefix+'nodeSpacingBox').value);
				}
				else if(originalNodes.length+originalEdges.length>2000)
				{
					opti.weaklyHierarchicalLayout(700,document.getElementById(options.external.prefix+'nodeSpacingBox').value);
				}
				else
				{
					opti.weaklyHierarchicalLayout(1000,document.getElementById(options.external.prefix+'nodeSpacingBox').value);
				}
			}
			else if(options.THEORY_GRAPH_OPTIONS.layout.ownLayoutIdx==2)
			{
				var opti=new Optimizer(originalNodes,originalEdges, hideEdgesType, statusLogger);
				opti.GenerateRandomSolution();
				if(originalNodes.length+originalEdges.length>3000)
				{
					opti.SolveUsingForces(200,document.getElementById(options.external.prefix+'nodeSpacingBox').value,200,{"meta":false},originalEdges);
				}
				else if(originalNodes.length+originalEdges.length>2000)
				{
					opti.SolveUsingForces(400,document.getElementById(options.external.prefix+'nodeSpacingBox').value,200,{"meta":false},originalEdges);
				}
				else
				{
					opti.SolveUsingForces(600,document.getElementById(options.external.prefix+'nodeSpacingBox').value,200,{"meta":false},originalEdges);
				}
			}
			else if(options.THEORY_GRAPH_OPTIONS.layout.ownLayoutIdx==4)
			{
				var opti=new Optimizer(originalNodes,originalEdges, hideEdgesType, statusLogger);
				opti.GenerateRandomSolution();
				if(originalNodes.length+originalEdges.length>3000)
				{
					opti.waterDrivenLayout(200,document.getElementById(options.external.prefix+'nodeSpacingBox').value);
				}
				else if(originalNodes.length+originalEdges.length>2000)
				{
					opti.waterDrivenLayout(400,document.getElementById(options.external.prefix+'nodeSpacingBox').value);
				}
				else
				{
					opti.waterDrivenLayout(600,document.getElementById(options.external.prefix+'nodeSpacingBox').value);
				}
			}
		}

		for(var i=0;i<originalEdges.length;i++)
		{
			originalEdges[i].hidden=false;
		}
		
		for(var j=0;j<edgesNameToHide.length;j++)
		{
			for(var i=0;i<originalEdges.length;i++)
			{
				var type=edgesNameToHide[j].type;
				if(type==originalEdges[i]["style"] || ("graph"+type)==originalEdges[i]["style"] )
				{
					originalEdges[i].hidden=edgesNameToHide[j].hidden;
				}
			}
		}
		
		nodes = new vis.DataSet(originalNodes);
		edges = new vis.DataSet(originalEdges);
		
		// create a network
		var container = document.getElementById(containerName);
		var data = 
		{
			nodes: nodes,
			edges: edges
		};
		
		network = new vis.Network(container, data, options.THEORY_GRAPH_OPTIONS);
		//network.startSimulation(10); 
		
		if(options.THEORY_GRAPH_OPTIONS.physics.enabled==false)
		{
			document.body.style.cursor = 'auto';
			statusLogger.setStatusText('<font color="green">Received '+originalNodes.length+' nodes</font>');
		}
		
		network.on('afterDrawing', function() 
		{	
			if(that.onConstructionDone!=undefined)
			{
				var tmp=that.onConstructionDone;
				that.onConstructionDone=undefined;;
				tmp();
				
			}
		});
		
		// If the document is clicked somewhere
		network.on("click", function (e) 
		{
			$("#"+options.external.prefix+"tooltip-container").hide(10);
			// If the clicked element is not the menu
			if (!$(e.target).parents(".custom-menu").length > 0) 
			{
				// Hide it
				$(".custom-menu").hide(10);
			}
			if(that.manipulateSelectedRegion(e.pointer.canvas)==false)
			{
				that.selectRegion(e.pointer.canvas);
			}
			
			if(addNodeToRegion==true && allNodeRegions[addNodeRegionId].selected==false)
			{
				addNodeToRegion=false;
				document.body.style.cursor = 'auto';
			}
		});
		
		// If the document is clicked somewhere
		network.on("selectNode", function (e) 
		{
			//console.log(e);
			
			if(that.manualFocus==true)
			{
				that.focusOnNodes();
				return;
			}
			
			if(addNodeToRegion==true && e.nodes.length>0 && allNodeRegions[addNodeRegionId].selected==true)
			{
				for(var i=0;i<e.nodes.length;i++)
				{
					allNodeRegions[addNodeRegionId].nodeIds.push(e.nodes[i]);
				}
				network.redraw();
			}
		});

		
		// If the menu element is clicked
		$(".custom-menu li").click(function()
		{
			var nodesFound=network.getSelectedNodes();
			var selectedNode=network.body.nodes[nodesFound[0]];
			
			if (selectedNode==undefined)
			{
				for(var i=0;i<originalNodes.length;i++)
				{
					if(originalNodes[i]["id"]==nodesFound[0])
					{
						selectedNode=originalNodes[i];
						break;
					}
				}
			}
			else
			{
				selectedNode=selectedNode.options;
			}
			
			
			
			var edgesFound=network.getSelectedEdges();
			var selectedEdge=undefined;
			for(var i=0;i<originalEdges.length;i++)
			{
				if(originalEdges[i]["id"]==edgesFound[0])
				{
					selectedEdge=originalEdges[i];
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
				switch($(this).attr("data-action")) 
				{
					// A case for each action
					case "openWindow": window.open(options.serverUrl+selected["url"]); break;
					case "showURL": alert(options.serverUrl+selected["url"]); break;
					case "openCluster": that.openCluster(selected["id"]); break;
					case "inferType": alert("Not implemented yet!"); break;
					case "showDecl": alert("Not implemented yet!"); break;
					case "childNodes": that.lazyLoadNodes(selectedNode.childsURL) ; break;
				}
			}
			
			// Hide it AFTER the action was triggered
			$(".custom-menu").hide(10);
		});
		
		network.on("oncontext", function (params) 
		{
			$("#"+options.external.prefix+"tooltip-container").hide(10);
			$(".custom-menu").hide(10);
			
			var node=network.getNodeAt({x: params["pointer"]["DOM"]["x"],y: params["pointer"]["DOM"]["y"]});
			
			if(node!=undefined)
			{
				network.selectNodes([node]);
				// Show contextmenu
				$(".custom-menu").finish().show(10).
				
				// In the right position (the mouse)
				css({
					top: params["pointer"]["DOM"]["y"]*1+20 + "px",
					left: params["pointer"]["DOM"]["x"]*1+16+document.getElementById(options.external.prefix+"mainbox").offsetLeft + "px",
				});
				return;
			}
			
			var edge=network.getEdgeAt({x: params["pointer"]["DOM"]["x"],y: params["pointer"]["DOM"]["y"]});
			
			if(typeof edge != undefined && edge!=undefined)
			{
				network.selectEdges([edge]);
				
				var selectedEdge=undefined;
				for(var i=0;i<originalEdges.length;i++)
				{
					if(originalEdges[i]["id"]==edge)
					{
						selectedEdge=originalEdges[i];
						break;
					}
				}
					
				if (selectedEdge!=undefined && typeof selectedEdge.clickText != "undefined")
				{
					// Show contextmenu
					$("#"+options.external.prefix+"tooltip-container").finish().show(10).
					html(selectedEdge.clickText ).
					// In the right position (the mouse)
					css({
						top: params["pointer"]["DOM"]["y"]*1+20 + "px",
						left: params["pointer"]["DOM"]["x"]*1+16+document.getElementById(options.external.prefix+"mainbox").offsetLeft + "px"
					});
				}
			}
			
		});
		
		network.on("stabilizationIterationsDone", function (params) 
		{
			network.stopSimulation();
			var options = 
			{
				physics: 
				{
					enabled: false
				}
			};
			network.setOptions(options);
			document.body.style.cursor = 'auto';
			statusLogger.setStatusText('<font color="green">Received '+originalNodes.length+' nodes</font>');
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
		
		network.on("beforeDrawing", function (ctx) 
		{
			that.drawAllColoredRegions(ctx);
		});
		
		network.on("afterDrawing", function (ctx) 
		{
			that.drawAllColoredRegionsOnCanvas(ctx);
			
		});
		
		network.once('initRedraw', function() 
		{
			if (lastClusterZoomLevel === 0) 
			{
				lastClusterZoomLevel = network.getScale();
			}
			document.body.style.cursor = 'auto';
		});
	}
}

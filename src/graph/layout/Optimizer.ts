import LayoutBase, { IEdgeIgnorance, LayoutNode } from './Base';
import { CleanNode, CleanEdge } from '../visgraph';
import StatusLogger from '../../dom/StatusLogger';
export default class Optimizer extends LayoutBase {
    constructor(nodes: CleanNode[], edges: CleanEdge[], ignoreByType: IEdgeIgnorance, logger: StatusLogger) {
        super(nodes, edges, logger, ignoreByType);
    }

    private readonly DependencyWidth: number = 30;
    private readonly DependencyHeight: number = 30;
	
    private field: {[key: number]: number}={};
	private readonly myWidth = 12000;
	private readonly myHeight = 12000;

	destroy() {
		super.destroy();
		this.field = {};
	}
	
	GenerateRandomSolution()
	{
		var lines: HelperLine[] = []; // TODO: Annotate me
		var i = 0;
		
		for(var i=0;i< this.myAllNodes.length;i++ )
		{
			this.InsertNodeAtGoodPosition( this.myAllNodes[i], lines);
		}
	}

	private UpdateFieldColision( x: number,  y: number,  value = 1 )
	{
		this.field[ y * this.myWidth + x ] = value;
	}
	
	private InsertNodeAtGoodPosition(n: LayoutNode, lines: HelperLine[], iterations = 5 )
	{
		var xOffset = this.DependencyWidth / 2;
		var yOffset = this.DependencyHeight / 2;

		var x;
		var y;
		var bestX = 0;
		var bestY = 0;
		var bestColision = 10000000;
		var nodes = n.connectedNodes;

		var maxIterations=10;
		
		if( nodes == undefined || nodes.length == 0 )
		{
			var i=0;
			do
			{
				i++;
				bestX = (Math.random() * this.myWidth/this.DependencyWidth)|0;
				bestY = (Math.random() * this.myHeight/this.DependencyHeight)|0;
			} while( this.field[ bestY * this.myWidth + bestX ] == 1 && i<maxIterations);

			n.x=( bestX * this.DependencyWidth );
			n.y=( bestY * this.DependencyHeight );

			this.UpdateFieldColision( bestX, bestY );
			return;
		}

		for( var i = 0; i < iterations; i++ )
		{
			x = (Math.random() * this.myWidth/this.DependencyWidth)|0;
			y = (Math.random() * this.myHeight/this.DependencyHeight)|0;

			if( this.field[ y * this.myWidth + x ] == 1 )
			{
				continue;
			}

			var colision = 0;
			var currX = x * this.DependencyWidth;
			var currY = y * this.DependencyHeight;

			for(var j=0;j< nodes.length;j++ )
			{
				if( currX > nodes[j].x )
				{
					colision += this.GetLineColision( new HelperLine( nodes[j].x + xOffset, nodes[j].y + yOffset, currX + xOffset, currY + yOffset ), lines );
				}
				else
				{
					colision += this.GetLineColision( new HelperLine( currX + xOffset, currY + yOffset, nodes[j].x + xOffset, nodes[j].y + yOffset ), lines );
				}
			}

			if( bestColision > colision )
			{
				bestColision = colision;
				bestX = x;
				bestY = y;
			}
		}

		n.x=( bestX * this.DependencyWidth );
		n.y=( bestY * this.DependencyHeight );

		this.UpdateFieldColision( bestX, bestY );
		
		for(var j=0;j< nodes.length;j++ )
		{
			if( n.x > nodes[j].x )
			{
				lines.push( new HelperLine( nodes[j].x + xOffset, nodes[j].y + yOffset, n.x + xOffset, n.y + yOffset ) );
			}
			else
			{
				lines.push( new HelperLine( n.x + xOffset, n.y + yOffset, nodes[j].x + xOffset, nodes[j].y + yOffset ) );
			}
		}
	}

    /**
     * Checks if two vectors are clockwise or counterclockwise
     */
	private ccw(  x1: number,  y1: number,  x2: number,  y2: number,  x3: number,  y3: number ): number
	{
		// TODO: Move to utils?
		var val = (y2 - y1) * (x3 - x2) - (x2 - x1) * (y3 - y2);
		if( val == 0 )
		{
			return 0; // colinear
		}

		return (val > 0) ? 1 : 2; // clock or counterclock wise
	}
	
	private findRandomPath(startNode?: LayoutNode): LayoutNode[] | undefined
	{
		if(startNode===undefined)
            return undefined;
        
		var nodesToprocess=[startNode];
		var currentPath: LayoutNode[] =[];
		while(nodesToprocess.length>0)
		{
			var n=nodesToprocess.pop()!;
			n.overallLength+=currentPath.length;
			n.overallVisited+=1;
			currentPath.push(n);
			var nextNode=Math.floor(Math.random() * n.connectedNodes.length);
			
			if(n.connectedNodes.length==0)
			{
				return currentPath;
			}

			var maxNode=n.connectedNodes[0];
			if(Math.floor(Math.random() * 100)>66)
			{
				for(var i=0;i<n.connectedNodes.length;i++)
				{
					if(n.connectedNodes[i].connectedNodes!=undefined && maxNode!=undefined && n.connectedNodes[i].connectedNodes.length>maxNode.connectedNodes.length && n.connectedNodes[i].visited!=true)
					{
						maxNode=n.connectedNodes[i];
						nextNode=i;
					}
				}
			}
			
			var i=0;
			
			while(n.connectedNodes[nextNode].visited==true || n.connectedNodes[nextNode].connectedNodes==undefined || n.connectedNodes[nextNode].connectedNodes.length==0)
			{
				nextNode=i;
				i++;
				if(i>=n.connectedNodes.length)
				{
					return currentPath;
				}
			}
			n.connectedNodes[nextNode].visited=true;
			nodesToprocess.push(n.connectedNodes[nextNode]);
		}
		
		for( var j = 0; j < startNode.connectedNodes.length; j++ )
		{
			var n=startNode.connectedNodes[j];
		}
		return currentPath;
	}
	
	waterDrivenLayout(iterations: number, spacingValue: number, gravity=200, ignoreEdgesByType?: IEdgeIgnorance, edgesIn?: CleanEdge[])
	{
		if(typeof edgesIn!='undefined')
		{
			this.mapEdgesIntoNodes(edgesIn, ignoreEdgesByType)
		}

		for( var j = 0; j < this.myAllNodes.length; j++ )
		{
			var n=this.myAllNodes[j];
			n.overallWeight=0;
		}

		var weights=[];

		for( var j = 0; j < this.myAllNodes.length; j++ )
		{
			var n=this.myAllNodes[j];
			
			//n.overallWeight=(n.toConnected.length/(n.toConnected.length+n.fromConnected.length)-0.5);
			weights[j]=0;
			n.overallWeight=0.5;
			if(n.fromConnected.length==0)
			{
				n.overallWeight=1;
			}
			if(n.toConnected.length==0)
			{
				n.overallWeight=0;
			}
		}

		for(var i=0;i<iterations/10;i++)
		{
			var normalizing=0;
			for( var j = 0; j < this.myAllNodes.length; j++ )
			{
				var n=this.myAllNodes[j];
				var tmp=n.overallWeight;
				
				for(var k=0;k<n.connectedNodes.length;k++)
				{
					tmp+=n.connectedNodes[k].overallWeight/(1+n.connectedNodes.length);
				}
				weights[j]=tmp;
				normalizing+=weights[j];
			}

			for( var j = 0; j < this.myAllNodes.length; j++ )
			{
				weights[j]/=normalizing;
				var n=this.myAllNodes[j];
				n.overallWeight=weights[j];
				weights[j]=0;
			}

		}

		var min=Infinity;
		var max=-Infinity;
		for( var j = 0; j < this.myAllNodes.length; j++ )
		{
			var n=this.myAllNodes[j];
			min=Math.min(n.overallWeight,min);
			max=Math.max(n.overallWeight,max);
		}

		for( var j = 0; j < this.myAllNodes.length; j++ )
		{
			var n=this.myAllNodes[j];
			n.overallWeight=((n.overallWeight-min)/(max-min)-0.5)*gravity*2;
		}
		console.log(this.myAllNodes);
		this.SolveUsingForces(iterations, spacingValue, true,  false, 0.9, 30.0, true );
	}
	
	weaklyHierarchicalLayout(iterations: number, spacingValue: number, usingMinMax = false, currTemperature = 0.9, initialStep = 30.0 )
	{
		for( var j = 0; j < this.myAllNodes.length; j++ )
		{
			var n=this.myAllNodes[j];
			n.overallLength=0;
			n.overallVisited=0;
		}
		
		var distClusterCenter=40*spacingValue;
		var distNodes=40*spacingValue;
		
		var nodesOrderedByEdges: LayoutNode[][]=[];
		var maxEdgesDif=0;
		var maxNode=this.myAllNodes[0];
		for( var j = 0; j < this.myAllNodes.length; j++ )
		{
			var n=this.myAllNodes[j];
			n.forcesFixed=false;
			var edgesDif=Math.abs(n.toConnected.length-n.fromConnected.length);
			if(typeof nodesOrderedByEdges[edgesDif]==='undefined')
			{
				nodesOrderedByEdges[edgesDif]=[];
			}
			nodesOrderedByEdges[edgesDif].push(n);
			
			if(edgesDif>maxEdgesDif)
			{
				maxEdgesDif=edgesDif;
			}
			
			if(maxNode.toConnected < n.toConnected)
			{
				maxNode=n;
			}
		}
		
		var longPath=[];
		for(var i=0;i<iterations*16;i++)
		{
			if(i%50==0)
			{
				this.logger.setStatusText('Beautify Layout: Iteration '+i+' of '+(iterations*2)+'...');
			}
			
			for( var j = 0; j < this.myAllNodes.length; j++ )
			{
				this.myAllNodes[j].visited=false;
			}
			
			var tempPath=this.findRandomPath(maxNode);

			if(tempPath!==undefined && tempPath.length>longPath.length)
			{
				longPath=tempPath.slice();
			}
		}
		
		for( var j = 0; j < this.myAllNodes.length; j++ )
		{
			if(this.myAllNodes[j].overallLength==undefined || this.myAllNodes[j].overallVisited==0)
			{
				if(this.myAllNodes[j].connectedNodes.length!=0)
				{
					for(var i=0;i<this.myAllNodes[j].connectedNodes.length;i++)
					{
						this.myAllNodes[j].overallLength+=this.myAllNodes[j].connectedNodes[i].overallLength;
					}
				}
				
				if(this.myAllNodes[j].overallLength==0 || this.myAllNodes[j].connectedNodes.length==0)
				{
					this.myAllNodes[j].overallLength=Math.floor(Math.random() * 20);
				}
				else
				{
					this.myAllNodes[j].overallLength=Math.floor(this.myAllNodes[j].overallLength/this.myAllNodes[j].connectedNodes.length);
				}
			}
			else
			{
				this.myAllNodes[j].overallLength=Math.floor(this.myAllNodes[j].overallLength/this.myAllNodes[j].overallVisited);
			}
		}
		
		var xUsed=[];
		var yUsed=[];
		
		for( var j = 0; j < this.myAllNodes.length*2+20; j++ )
		{
			xUsed[j]=0;
			yUsed[j]=0;
		}
		
		var maxLevel=0; 
		for(var i=0;i<this.myAllNodes.length;i++)
		{
			var level=this.myAllNodes[i].overallLength;
			if(level>maxLevel)
			{
				maxLevel=level;
			}
		}
		
		maxLevel+=1;
		var lengthMapping=[];
		for(var i=0;i<this.myAllNodes.length;i++)
		{
			if(this.myAllNodes[i].overallLength>=0)
			{
				lengthMapping[this.myAllNodes[i].overallLength]=this.myAllNodes[i].overallLength;
			}
		}
		
		lengthMapping[maxLevel]=maxLevel;
		var sub=0;
		for(var i=0;i<=maxLevel+1;i++)
		{
			if(typeof lengthMapping[i] === 'undefined' || lengthMapping[i]<0)
			{
				sub+=1;
			}
			else
			{
				lengthMapping[i]-=sub;
			}
		}
		
		var upDown=true as boolean; // TODO: why is this constant?
		
		for(var i=0;i<this.myAllNodes.length;i++)
		{
			if(this.myAllNodes[i].toConnected==undefined || this.myAllNodes[i].toConnected.length==0 || (this.myAllNodes[i].fromConnected.length-this.myAllNodes[i].toConnected.length)>this.myAllNodes.length/3)
			{
				this.myAllNodes[i].overallLength=maxLevel;
			}

			var level=lengthMapping[this.myAllNodes[i].overallLength];
			//var currX=xUsed[level];
			//var currY=yUsed[level];
			if(upDown==false)
			{
				yUsed[level]+=distNodes;
				this.myAllNodes[i].y=yUsed[level];
				this.myAllNodes[i].x=level*distClusterCenter;
			}
			else
			{
				xUsed[level]+=distNodes;
				this.myAllNodes[i].x=xUsed[level];
				this.myAllNodes[i].y=level*distClusterCenter;
			}
			
			console.log('Level['+level+'; real:'+this.myAllNodes[i].overallLength+']: '+this.myAllNodes[i].x+' '+this.myAllNodes[i].y);
			
		}
		
		for(var i=0;i<this.myAllNodes.length;i++)
		{
			if(this.myAllNodes[i].connectedNodes.length>1)
			{
				this.myAllNodes[i].forcesFixed=true;
			}
			
			var level=lengthMapping[this.myAllNodes[i].overallLength];
			if(upDown==false)
			{
				this.myAllNodes[i].y-=yUsed[level]/2;
			}
			else
			{
				this.myAllNodes[i].x-=xUsed[level]/2;
			}
		}
	    this.SolveUsingForces(iterations*2, spacingValue, false , usingMinMax, currTemperature , initialStep);
		this.SolveUsingForces(5, spacingValue, true, usingMinMax, currTemperature , 3);
	}
	
	SolveUsingForces(iterations: number, spacingValue: number, resetForcesFixed=true, usingMinMax = false, currTemperature = 0.9, initialStep = 30.0, useGravity=false )
	{
		if(resetForcesFixed==true)
		{
			for( var j = 0; j < this.myAllNodes.length; j++ )
			{
				var n=this.myAllNodes[j];
				n.forcesFixed=false;
			}
		}
		
		var energy = 1000000;
		var step = initialStep;
		var success = 0;

		//var area = myWidth * myHeight;
		var kVal =  Math.max(Math.min((this.myAllNodes.length*4+this.edgesCount/2.5)/2 * 0.5*spacingValue/7.0,300),70);
		var kSquared = kVal*kVal;

		
		for( var i = 0; i < iterations; i++ )
		{
			if(i%100==0)
			{
				this.logger.setStatusText('Beautify Layout: Iteration '+i+' of '+iterations+'...');
			}
			
			var energyBefore = energy;
			energy = 0;
			for( var j = 0; j < this.myAllNodes.length; j++ )
			{
				var n=this.myAllNodes[j];
				if(n.forcesFixed===false && n.hidden!=true)
				{
					if (useGravity==true && typeof n.overallWeight!='undefined')
					{
						n.dispX = 0;
						n.dispY = n.overallWeight;
					}
					else
					{
						n.dispX = 0;
						n.dispY = 0;
					}
					
					// calculate global (repulsive) forces
					for( var k = 0; k < this.myAllNodes.length; k++ )
					{
						var u=this.myAllNodes[k];
						if(u.graphNumber==n.graphNumber && n != u && u.connectedNodes != undefined && u.connectedNodes.length > 0 )
						{
							var differenceNodesX = u.x - n.x;
							var differenceNodesY = u.y - n.y;
							
							var lengthDiff =  Math.sqrt( differenceNodesX * differenceNodesX + differenceNodesY * differenceNodesY ) + 0.001;
							var repulsiveForce = - (kSquared / lengthDiff);
													
							if(typeof n.membership !== 'undefined'  && typeof u.membership !== 'undefined' && u.membership!=n.membership)
							{
								repulsiveForce*=1.5;
							}

							n.dispX += (differenceNodesX / lengthDiff) * repulsiveForce;
							n.dispY += (differenceNodesY / lengthDiff) * repulsiveForce;
						}
					}
					
					// calculate local (spring) forces
					for( var k = 0; k < n.connectedNodes.length; k++ )
					{
						var u=n.connectedNodes[k];
						var differenceNodesX = u.x - n.x;
						var differenceNodesY = u.y - n.y;
						
						var lengthDiff =  Math.sqrt( differenceNodesX * differenceNodesX + differenceNodesY * differenceNodesY ) + 0.001;
						var attractiveForce = (lengthDiff * lengthDiff / kVal);

						if(typeof n.membership !== 'undefined'  && typeof u.membership !== 'undefined' && u.membership==n.membership)
						{
							attractiveForce*=5;
						}
						
						n.dispX += (differenceNodesX / lengthDiff) * attractiveForce;
						n.dispY += (differenceNodesY / lengthDiff) * attractiveForce;
					}


					
					// Limit max displacement to temperature currTemperature
					var dispLength =  Math.sqrt( n.dispX * n.dispX + n.dispY * n.dispY ) + 0.001;
					n.x=(  (n.x + (n.dispX / dispLength) * step) );
					n.y=(  (n.y + (n.dispY / dispLength) * step) );

					// Prevent from displacement outside of frame
					if( usingMinMax == true )
					{
						n.x=( Math.max( 48, Math.min( n.x, this.myWidth - 48 ) ) );
						n.y=( Math.max( 8, Math.min( n.y, this.myHeight - 32 ) ) );
					}
					energy += dispLength * dispLength;
				}
			}
			// Reduce the temperature as the layout approaches a better configuration

			if( energy < energyBefore )
			{
				success++;
				if( success >= 5 )
				{
					success = 0;
					//step /= currTemperature;
				}
			}
			else
			{
				success = 0;
				//step *= currTemperature;
			}
		}
		this.placeGraphs();
	}

	private placeGraphs()
	{
		var rows=(this.countNodesInGraph.length+1)>>1;
		var graphRects: number[][]=[];
		
		for(var i=1;i<= this.countNodesInGraph.length;i++ )
		{
			graphRects[i]=[];
			graphRects[i][0]=1000000;
			graphRects[i][1]=1000000;
			graphRects[i][2]=-1000000;
			graphRects[i][3]=-1000000;
		}
		
		for(var i=0;i< this.myAllNodes.length;i++ )
		{
			graphRects[this.myAllNodes[i].graphNumber][0]=Math.min(graphRects[this.myAllNodes[i].graphNumber][0],this.myAllNodes[i].x);
			graphRects[this.myAllNodes[i].graphNumber][1]=Math.min(graphRects[this.myAllNodes[i].graphNumber][1],this.myAllNodes[i].y);
			graphRects[this.myAllNodes[i].graphNumber][2]=Math.max(graphRects[this.myAllNodes[i].graphNumber][2],this.myAllNodes[i].x+100);
			graphRects[this.myAllNodes[i].graphNumber][3]=Math.max(graphRects[this.myAllNodes[i].graphNumber][3],this.myAllNodes[i].y+100);
		}

		
		var rectNewPos: number[][]=[];
		var currX=0;
		var currY=0;
		var biggestHeight=0;
		for(var i=1;i< graphRects.length;i++ )
		{	
			if(i%rows==0)
			{
				currX=0;
				currY+=biggestHeight;
				biggestHeight=0;
			}
			
			rectNewPos[i]=[];
			rectNewPos[i][0]=currX;
			rectNewPos[i][1]=currY;

			currX+=graphRects[i][2]-graphRects[i][0]+10;
			biggestHeight=Math.max(biggestHeight,graphRects[i][3]-graphRects[i][1]+10);
		}

		for(var i=0;i< this.myAllNodes.length;i++ )
		{
			this.myAllNodes[i].x=rectNewPos[this.myAllNodes[i].graphNumber][0]+(this.myAllNodes[i].x-graphRects[this.myAllNodes[i].graphNumber][0]);
			this.myAllNodes[i].y=rectNewPos[this.myAllNodes[i].graphNumber][1]+(this.myAllNodes[i].y-graphRects[this.myAllNodes[i].graphNumber][1]);
		}
	}
	
	private GetLineColision(currLine: HelperLine, lines: HelperLine[])
	{
		var colision = 0;
		
		for(var i = 0; i < lines.length; i++ )
		{
			if( (currLine.xEnd == lines[ i ].xEnd || currLine.xStart == lines[ i ].xEnd || currLine.xEnd == lines[ i ].xStart || currLine.xStart == lines[ i ].xStart)
				&& (currLine.yEnd == lines[ i ].yEnd || currLine.yStart == lines[ i ].yEnd || currLine.yEnd == lines[ i ].yStart || currLine.yStart == lines[ i ].yStart) )
			{
				continue;
			}

			if( this.ccw( currLine.xStart, currLine.yStart, currLine.xEnd, currLine.yEnd, lines[ i ].xStart, lines[ i ].yStart )
				!= this.ccw( currLine.xStart, currLine.yStart, currLine.xEnd, currLine.yEnd, lines[ i ].xEnd, lines[ i ].yEnd )
				&& this.ccw( lines[ i ].xStart, lines[ i ].yStart, lines[ i ].xEnd, lines[ i ].yEnd, currLine.xStart, currLine.yStart )
				!= this.ccw( lines[ i ].xStart, lines[ i ].yStart, lines[ i ].xEnd, lines[ i ].yEnd, currLine.xEnd, currLine.yEnd ) )
			{
				colision++;
			}
		}

		return colision;
    }

}

// TODO: This is suited way better as a json structure
class HelperLine{
    constructor( public xStart: number, public yStart: number, public xEnd: number, public yEnd: number) {}
}
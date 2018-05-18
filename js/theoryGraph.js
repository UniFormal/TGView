function TheoryGraph()
{
	// Array holding original nodes
	var originalNodes = null;
	// Array holding original edges
	var originalEdges = null;
	// Object of vis.Network class
	var network = null;
	// Next unique Id to use for cluster
	var clusterId=0;
	// Array holding (parsed) nodes
	var nodes;
	// Array holding (parsed) edges
	var edges;
	// Last used zoom level for clustering
	var lastClusterZoomLevel = 0;
	// Cluster factor when zooming
    var clusterFactor = 1;
	// Clustered points when zooming
	var zoomClusters=[];
	// Positions of nodes before clustering
	var clusterPositions=[];
	var allClusters=[];
	var hiddenNodes={};
	this.onConstructionDone=undefined;
	
	var allManuallyHiddenNodes=[];
	var allNodeRegions=[];
	
	var edgesNameToHide=[];
	var that=this;
	
	var removeRegionImg = new Image();
	removeRegionImg.src = "img/delete_region.png";
	
	var moveRegionImg = new Image();
	moveRegionImg.src = "img/move_region.png";
	
	var addNodeToRegionImg = new Image();
	addNodeToRegionImg.src = "img/add_region.png";
	
	var moveRegionHold=false;
	var moveRegionId=0;
	var oldRegionPosition={};
	
	var addNodeToRegion=false;
	var addNodeRegionId;
	
	var internalOptimizer;
	
	this.focusOnNodes=function(nodeIds)
	{
		var nodesToShow=[];
		if (typeof nodeIds == "undefined")
		{
			nodeIds = network.getSelectedNodes();
		}
		
		if(nodeIds==undefined || nodeIds.length==0)
		{
			return;
		}
		
		nodesToShow=nodesToShow.concat(nodeIds);
		
		var positions=network.getPositions();
		var edgesToShow=[];

		for(var i=0;i<nodeIds.length;i++)
		{
			var middleNodePos=network.body.nodes[nodeIds[i]];
			
			var connectedEdges=network.getConnectedEdges(nodeIds[i]);
			
			edgesToShow=edgesToShow.concat(connectedEdges);
			var toNodes=network.getConnectedNodes(nodeIds[i],"to");
			var fromNodes=network.getConnectedNodes(nodeIds[i],"from");
			
			if(nodeIds.length==1)
			{
				for(var j=0;j<fromNodes.length;j++)
				{
					if((middleNodePos.y-network.body.nodes[fromNodes[j]].y)<200)
					{
						network.body.nodes[fromNodes[j]].y=middleNodePos.y-(Math.random()*50+150);
					}
					if(Math.abs(middleNodePos.x-network.body.nodes[fromNodes[j]].x) > 200)
					{
						network.body.nodes[fromNodes[j]].x=middleNodePos.x+Math.random()*400-200;
					}
				}
				
				
				for(var j=0;j<toNodes.length;j++)
				{
					if((middleNodePos.y-network.body.nodes[toNodes[j]].y)>-200)
					{
						network.body.nodes[toNodes[j]].y=middleNodePos.y+(Math.random()*50+150);
					}
					if(Math.abs(middleNodePos.x-network.body.nodes[fromNodes[j]].x) > 200)
					{
						network.body.nodes[toNodes[j]].x=middleNodePos.x+Math.random()*400-200;
					}
				}
			}
			
			nodesToShow = nodesToShow.concat(fromNodes);
			nodesToShow = nodesToShow.concat(toNodes);
		}

		that.hideNodesById(nodesToShow, false);
		
		var nodesToHide=[];
		for(var i=0;i<originalNodes.length;i++)
		{

			originalNodes[i].y=network.body.nodes[originalNodes[i].id].y;
			originalNodes[i].x=network.body.nodes[originalNodes[i].id].x;
			
			if(nodesToShow.indexOf(originalNodes[i]["id"]) == -1)
			{
				nodesToHide.push(originalNodes[i]["id"]);
				//originalNodes[i].hidden=true;
			}
			else
			{
				//originalNodes[i].hidden=false;
			}
			
		}
		
		that.hideNodesById(nodesToHide, true);

		
		//internalOptimizer.SolveUsingForces(25, 50/originalNodes.length*nodesToShow.length, false);
		if(nodeIds.length==1)
		{
			internalOptimizer.SolveUsingForces(30, 12, false);
		}
		
		var newNodePositions=[];
		for(var i=0;i<originalNodes.length;i++)
		{
			newNodePositions.push({"id": originalNodes[i].id, "x": originalNodes[i].x,"y": originalNodes[i].y})
		}
		nodes.update(newNodePositions);
		
		setStatusText("");
		
		var edgesToHide=[];
		for(var i=0;i<originalEdges.length;i++)
		{
			edgesToHide.push(originalEdges[i].id)
		}
		
		that.hideEdgesById(edgesToHide,true);
		
		that.hideEdgesById(edgesToShow,false);
	}
	
	this.manipulateSelectedRegion = function(coords)
	{
		var updateNodes=[];
		var redraw=false;
		var selectRegion=false;
		if(moveRegionHold==true)
		{
			var newRegionPosition=coords;
			var difX=newRegionPosition.x-oldRegionPosition.x;
			var difY=newRegionPosition.y-oldRegionPosition.y;
			var positions=network.getPositions(allNodeRegions[moveRegionId].nodeIds);
			for(var i=0;i<allNodeRegions[moveRegionId].nodeIds.length;i++)
			{
				if(typeof allNodeRegions[moveRegionId].nodeIds[i] != "undefined")
				{
					updateNodes.push({"id":allNodeRegions[moveRegionId].nodeIds[i] ,"x":network.body.nodes[allNodeRegions[moveRegionId].nodeIds[i]].x+difX, "y":network.body.nodes[allNodeRegions[moveRegionId].nodeIds[i]].y+difY});
				}
			}
			moveRegionHold=false;
			document.body.style.cursor = 'auto';
			oldRegionPosition=coords;
			selectRegion=true;
			redraw=true;
			nodes.update(updateNodes);
		}
		else
		{
			for(var i=0;i<allNodeRegions.length;i++)
			{
				if(allNodeRegions[i].selected==true)
				{
					if(allNodeRegions[i].left-44<=coords.x && allNodeRegions[i].left>=coords.x && allNodeRegions[i].top-6<=coords.y && allNodeRegions[i].top+34>=coords.y)
					{
						that.removeNodeRegion(i);
						redraw=true;
						break;
					}
					else if(allNodeRegions[i].left-42<=coords.x && allNodeRegions[i].left>=coords.x && allNodeRegions[i].top+40<=coords.y && allNodeRegions[i].top+74>=coords.y)
					{
						moveRegionHold=true;
						moveRegionId=i;
						oldRegionPosition=coords;
						document.body.style.cursor = 'pointer';
						selectRegion=true;
						break;
					}
					else if(allNodeRegions[i].left-74<=coords.x && allNodeRegions[i].left>=coords.x && allNodeRegions[i].top+86<=coords.y && allNodeRegions[i].top+122>=coords.y)
					{
						addNodeRegionId=i;
						addNodeToRegion=true;
						document.body.style.cursor = 'copy';
						selectRegion=true;
						break;
					}
				}
			}
		}
		
		if(redraw==true)
		{
			network.redraw();
		}
		return selectRegion;
	}
	
	this.selectRegion =function(coords)
	{
		var redraw=false;
		for(var i=0;i<allNodeRegions.length;i++)
		{
			allNodeRegions[i].selected=false;
			if(allNodeRegions[i].left<=coords.x && allNodeRegions[i].right>=coords.x && allNodeRegions[i].top<=coords.y && allNodeRegions[i].bottom>=coords.y)
			{
				allNodeRegions[i].selected=true;
				redraw=true;
			}
		}
		if(redraw==true)
		{
			network.redraw();
		}
	}
	
	this.removeNodeRegion=function(index)
	{
		allNodeRegions.splice(index, 1);
		network.redraw();
	}
	
	this.drawAllColoredRegionsOnCanvas=function(ctx)
	{
		for(var i=0;i<allNodeRegions.length;i++)
		{
			ctx.fillStyle = allNodeRegions[i].color;
			ctx.strokeStyle = allNodeRegions[i].color;
			
			ctx.setLineDash([10]);
			var oldWidth=ctx.lineWidth;
			if(allNodeRegions[i].selected==true)
			{
				ctx.drawImage(removeRegionImg, allNodeRegions[i].left-46, allNodeRegions[i].top-8,38,38);
				ctx.drawImage(moveRegionImg, allNodeRegions[i].left-46, allNodeRegions[i].top+38,38,38);
				ctx.drawImage(addNodeToRegionImg, allNodeRegions[i].left-46, allNodeRegions[i].top+84,38,38);
				
				ctx.lineWidth=10;
			}
			else
			{
				ctx.lineWidth=6;
			}	
			ctx.strokeRect(allNodeRegions[i].left,allNodeRegions[i].top,allNodeRegions[i].right-allNodeRegions[i].left,allNodeRegions[i].bottom-allNodeRegions[i].top);
			ctx.setLineDash([]);
			ctx.lineWidth=oldWidth;
			//ctx.globalAlpha = 0.2;			
			//ctx.fillRect(allNodeRegions[i].left,allNodeRegions[i].top,allNodeRegions[i].right-allNodeRegions[i].left,allNodeRegions[i].bottom-allNodeRegions[i].top);
			//ctx.globalAlpha = 1.0;
		}
	}
	
	this.drawAllColoredRegions = function(ctx)
	{
		if(allNodeRegions.length==0)
		{
			return;
		}

		for(var i=0;i<allNodeRegions.length;i++)
		{
			allNodeRegions[i].left=10000000;
			allNodeRegions[i].right=-10000000;
			allNodeRegions[i].top=10000000;
			allNodeRegions[i].bottom=-10000000;
			allNodeRegions[i].mappedNodes={};
			
			for(var j=0;j<allNodeRegions[i].nodeIds.length;j++)
			{
				if(hiddenNodes[allNodeRegions[i].nodeIds[j]] == true)
				{
					continue;
				}
				var box=network.getBoundingBox(allNodeRegions[i].nodeIds[j]);
				
				allNodeRegions[i].left=Math.min(allNodeRegions[i].left,box.left);
				allNodeRegions[i].right=Math.max(allNodeRegions[i].right,box.right);
				allNodeRegions[i].top=Math.min(allNodeRegions[i].top,box.top);
				allNodeRegions[i].bottom=Math.max(allNodeRegions[i].bottom,box.bottom);
				
				allNodeRegions[i].mappedNodes[allNodeRegions[i].nodeIds[j]]=1;
			}
			
			var distance=(i*4)%20+8;

			if(allNodeRegions[i].left==10000000)
			{
				continue;
			}

			allNodeRegions[i].left-=distance;
			allNodeRegions[i].right+=distance;
			allNodeRegions[i].top-=distance;
			allNodeRegions[i].bottom+=distance;
			
			ctx.fillStyle = allNodeRegions[i].color;
			ctx.strokeStyle = allNodeRegions[i].color;
			if(allNodeRegions[i].selected==true)
			{
				ctx.globalAlpha = 0.5;	
			}
			else
			{
				ctx.globalAlpha = 0.2;	
			}		
			ctx.fillRect(allNodeRegions[i].left,allNodeRegions[i].top,allNodeRegions[i].right-allNodeRegions[i].left,allNodeRegions[i].bottom-allNodeRegions[i].top);
			ctx.globalAlpha = 1.0;
		}
		that.repositionNodes();
	}

	function intersectRect(a, b) 
	{
		return (a.left <= b.right &&
			b.left <= a.right &&
			a.top <= b.bottom &&
			b.top <= a.bottom)
	}
	
	function liesInAnyRegion(box,id)
	{
		for(var j=0;j<allNodeRegions.length;j++)
		{
			if(typeof allNodeRegions[j].mappedNodes[id]=="undefined" && intersectRect(box, allNodeRegions[j])==true)
			{
				return j;
			}
		}
		
		return -1;
	}
	
	this.repositionNodes=function()
	{
		//var allNodePositions=network.getPositions();
		var newPositions=[];
		for(var i=0;i<originalNodes.length;i++)
		{
			var box=network.getBoundingBox(originalNodes[i].id);
			
			var avgX=0;
			var avgY=0;
			var countAvg=0;
			for(var j=0;j<allNodeRegions.length;j++)
			{	
				if(typeof allNodeRegions[j].mappedNodes[originalNodes[i].id]!="undefined")
				{
					avgX+=(allNodeRegions[j].left+allNodeRegions[j].right)/2;
					avgY+=(allNodeRegions[j].top+allNodeRegions[j].bottom)/2;
					countAvg++;
				}
			}
			
			avgX/=countAvg;
			avgY/=countAvg;
			
			for(var j=0;j<allNodeRegions.length;j++)
			{	
				if(typeof allNodeRegions[j].mappedNodes[originalNodes[i].id]=="undefined" && intersectRect(box, allNodeRegions[j])==true)
				{
					var minDirection=0;
					var minDistance; 
					var tmp;
					var width=box.right-box.left;
					var height=box.bottom-box.top;
					
					if(countAvg==0)
					{
						minDistance=Math.abs(box.right-allNodeRegions[j].left); 
						tmp=Math.abs(box.left-allNodeRegions[j].right);
						
						if(tmp<minDistance)
						{
							minDirection=1;
							minDistance=tmp;
						}
						
						tmp=Math.abs(box.bottom-allNodeRegions[j].top);
						if(tmp<minDistance)
						{
							minDirection=2;
							minDistance=tmp;
						}
						
						tmp=Math.abs(box.top-allNodeRegions[j].bottom);
						if(tmp<minDistance)
						{
							minDirection=3;
							minDistance=tmp;
						}	
					}
					else
					{
						minDistance=Math.abs(allNodeRegions[j].left-width/1.8-avgX)+Math.abs((box.bottom+box.top)/2-avgY); 
						tmp=Math.abs(allNodeRegions[j].right+width/1.8-avgX)+Math.abs((box.bottom+box.top)/2-avgY);
						
						if(tmp<minDistance)
						{
							minDirection=1;
							minDistance=tmp;
						}
						
						tmp=Math.abs(allNodeRegions[j].top-height/1.8-avgY)+Math.abs((box.left+box.right)/2-avgX);
						if(tmp<minDistance)
						{
							minDirection=2;
							minDistance=tmp;
						}
						
						tmp=Math.abs(allNodeRegions[j].bottom+height/1.8-avgY)+Math.abs((box.left+box.right)/2-avgX);
						if(tmp<minDistance)
						{
							minDirection=3;
							minDistance=tmp;
						}
					}

					
					if(minDirection==0)
					{
						var intersectingRegion=0;
						var newX=allNodeRegions[j].left-width/1.8;
						while(intersectingRegion!=-1)
						{
							box.left=newX-width/2;
							box.right=newX+width/2;
							intersectingRegion=liesInAnyRegion(box,originalNodes[i].id);
							if(intersectingRegion!=-1)
							{
								newX=allNodeRegions[intersectingRegion].left-width/1.8;
							}
						} 
						newPositions.push({"x":newX, "id":originalNodes[i].id});
					}
					else if(minDirection==1)
					{
						var intersectingRegion=0;
						var newX=allNodeRegions[j].right+width/1.8;
						while(intersectingRegion!=-1)
						{
							box.left=newX-width/2;
							box.right=newX+width/2;
							intersectingRegion=liesInAnyRegion(box,originalNodes[i].id);
							if(intersectingRegion!=-1)
							{
								newX=allNodeRegions[intersectingRegion].right+width/1.8;
							}
						} 
						newPositions.push({"x":newX, "id":originalNodes[i].id});
					}
					else if(minDirection==2)
					{
						var intersectingRegion=0;
						var newY=allNodeRegions[j].top-height/1.8;
						while(intersectingRegion!=-1)
						{
							box.top=newY-height/2;
							box.bottom=newY+height/2;
							intersectingRegion=liesInAnyRegion(box,originalNodes[i].id);
							if(intersectingRegion!=-1)
							{
								newY=allNodeRegions[intersectingRegion].top-height/1.8;
							}
						} 
						newPositions.push({"y":newY, "id":originalNodes[i].id});
					}
					else if(minDirection==3)
					{
						var intersectingRegion=0;
						var newY=allNodeRegions[j].bottom+height/1.8;
						while(intersectingRegion!=-1)
						{
							box.top=newY-height/2;
							box.bottom=newY+height/2;
							intersectingRegion=liesInAnyRegion(box,originalNodes[i].id);
							if(intersectingRegion!=-1)
							{
								newY=allNodeRegions[intersectingRegion].bottom+height/1.8;
							}
						} 
						newPositions.push({"y":newY, "id":originalNodes[i].id});
					}
				}
			}
		}
		
		for(var i=0;i<newPositions.length;i++)
		{
			if(typeof newPositions[i].x != "undefined")
			{
				network.body.nodes[newPositions[i].id].x=newPositions[i].x;
			}
			if(typeof newPositions[i].y != "undefined")
			{
				network.body.nodes[newPositions[i].id].y=newPositions[i].y;
			}
		}
		
		// Check for intersecting regions, which do not share nodes
		// 1. Check region1 and region2 intersect
		// 2. Extract all intersecting nodes
		// 3. Remove intersecting nodes and calculate new bounding box
		// 4. If still intersecting --> reposition nodes
		// 5. Reposition nodes: move all nodes to region center and apply few iterations of forces driven layout
	}
	
	this.selectNodesByType=function(type)
	{
		var nodeIds = network.getSelectedNodes();;
		for (var i = 0; i < originalNodes.length; i++) 
		{
			var curNode = originalNodes[i];
			if(curNode["style"]==type)
			{
				nodeIds.push(curNode.id);
			}
			
		}
		addToStateHistory("select", {"nodes": nodeIds});
		network.selectNodes(nodeIds);
	}
	
	this.selectEdgesByType=function(type)
	{
		var edgeIds = [];
		for (var i = 0; i < originalEdges.length; i++) 
		{
			var currEdge = originalEdges[i];
			if(currEdge["style"]==type)
			{
				edgeIds.push(currEdge.id);
			}
			
		}
		addToStateHistory("select", {"nodes": edgeIds});
		network.selectEdges(edgeIds);
	}
	
	this.getUsedNodeTypes=function()
	{
		var usedNodeTypes=[];
		for (var i = 0; i < originalNodes.length; i++) 
		{
			if(typeof originalNodes[i]["style"]!="undefined" && usedNodeTypes.indexOf(originalNodes[i]["style"])==-1)
			{
				usedNodeTypes.push(originalNodes[i]["style"]);
			}
		}
		return usedNodeTypes;
	}
	
	this.getUsedEdgeTypes=function()
	{
		var usedEdgeTypes=[];
		for (var i = 0; i < originalEdges.length; i++) 
		{
			if(typeof originalEdges[i]["style"]!="undefined" && usedEdgeTypes.indexOf(originalEdges[i]["style"])==-1)
			{
				usedEdgeTypes.push(originalEdges[i]["style"]);
			}
		}
		return usedEdgeTypes;
	}
	
	this.graphToIFrameString=function(parameterName, onlySelected, compressionRate)
	{
		if (typeof parameterName == "undefined")
		{
			parameterName="tgviewGraphData_"+Math.floor(new Date() / 1000)+"_"+Math.floor(Math.random() * 1000);
		}
		
		if (typeof onlySelected == "undefined")
		{
			onlySelected=false;
		}

		if (typeof compressionRate == "undefined")
		{
			compressionRate=0;
		}
		
		return {"storage":"localStorage.setItem('"+parameterName+"', '"+generateCompressedJSON(onlySelected, compressionRate).split("'").join("\\'")+"');", "uri":location.protocol + '//' + location.host + location.pathname+"?"+graphDataURLSourceParameterNameTGView+"=iframe&"+graphDataURLDataSourceParameterNameTGView+"="+parameterName, "id":parameterName};
	}
	
	this.graphToLocalStorageString=function(parameterName, onlySelected, compressionRate)
	{
		if (typeof parameterName == "undefined")
		{
			parameterName="tgviewGraphData_"+Math.floor(new Date() / 1000)+"_"+Math.floor(Math.random() * 1000);
		}
		
		if (typeof onlySelected == "undefined")
		{
			onlySelected=false;
		}

		if (typeof compressionRate == "undefined")
		{
			compressionRate=0;
		}
		
		return {"storage":"localStorage.setItem('"+parameterName+"', '"+generateCompressedJSON(onlySelected, compressionRate).split("'").join("\\'")+"');", "uri":location.protocol + '//' + location.host + location.pathname+"?"+graphDataURLSourceParameterNameTGView+"=param&"+graphDataURLDataSourceParameterNameTGView+"="+parameterName, "name":parameterName};
	}
	
	this.graphToURIParameterString=function(onlySelected, compressionRate)
	{
		if (typeof onlySelected == "undefined")
		{
			onlySelected=false;
		}

		if (typeof compressionRate == "undefined")
		{
			compressionRate=2;
		}
		
		return location.protocol + '//' + location.host + location.pathname+"?"+graphDataURLSourceParameterNameTGView+"=param&"+graphDataURLDataSourceParameterNameTGView+"="+encodeURI(generateCompressedJSON(onlySelected, compressionRate));
	}
	
	function generateCompressedJSON(onlySelected, compressionRate)
	{	
		var allNodePositions=[];
		
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
			allNodePositions=network.getPositions();
		}
		
		var nodeIds=undefined;
		var nodeIdMapping=[];
		
		if(onlySelected==true)
		{
			nodeIds=network.getSelectedNodes();
			
			for (var i = 0; i < nodeIds.length; i++) 
			{
				nodeIdMapping[nodeIds[i]]=1;
			}
		}
		
		var mapping=[];
		var counter=0;
		for (var i = 0; i < originalNodes.length; i++) 
		{
			var currentNodeJson="{";
			var curNode = originalNodes[i];
			
			if(onlySelected==true && typeof nodeIdMapping[curNode.id] == "undefined")
			{
				continue;
			}
			
			if(typeof mapping[curNode.id] == "undefined")
			{
				mapping[curNode.id]=counter;
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
				currentNodeJson+=',"x":"'+allNodePositions[curNode.id].x+'"';
				currentNodeJson+=',"y":"'+allNodePositions[curNode.id].y+'"';
			}
			
			currentNodeJson+="},";
			json+=currentNodeJson;
		}
		
		json=json.substring(0, json.length - 1)+"],\"edges\":[";
		
		for (var i = 0; i < originalEdges.length; i++) 
		{				
			var currEdge = originalEdges[i];
			if(typeof mapping[currEdge.to] != "undefined" && mapping[currEdge.from] != "undefined" )
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
		
		if(allClusters.length>0)
		{
			json=json.substring(0, json.length - 1)+"],\"cluster\":[";
			
			for (var i = 0; i < allClusters.length; i++) 
			{		
				var currentClusterJson="{\"nodeIds\":";
				currentClusterJson+=JSON.stringify(clusterPositions[allClusters[i]][0]);
				currentClusterJson+=",";
				
				currentClusterJson+="\"nodePositions\":";
				currentClusterJson+=JSON.stringify(clusterPositions[allClusters[i]][1]);
				currentClusterJson+="";
				
				currentClusterJson+="},";
				json+=currentClusterJson;
			}
		}

		json=json.substring(0, json.length - 1)+"]}";
		return json;
	}
	
	this.loadGraphByLocalStorage=function(parameterName)
	{
		if (typeof parameterName == "undefined")
		{
			parameterName="tgviewGraphData";
		}

		var graphData=localStorage.getItem(parameterName);
		drawGraph(JSON.parse(graphData));
	}
	
	this.loadGraphByURIParameter=function()
	{
		var graphData=getParameterByName(graphDataURLDataSourceParameterNameTGView);
		drawGraph(JSON.parse(graphData));
	}

	// Hides all edges with given type
	this.hideEdges=function(type, hideEdge)
	{
		that.setEdgesHidden(type, hideEdge);
		var edgesToHide=[];
		for(var i=0;i<originalEdges.length;i++)
		{
			//console.log(type+""+originalEdges[i]["style"]);
			if(type==originalEdges[i]["style"] || ("graph"+type)==originalEdges[i]["style"] )
			{
				if(hideEdge==true)
				{
					edgesToHide.push({id: originalEdges[i]["id"], hidden: hideEdge});
				}
				else if(hideEdge==false && (hiddenNodes[originalEdges[i].to]==false && hiddenNodes[originalEdges[i].from]==false))
				{
					edgesToHide.push({id: originalEdges[i]["id"], hidden: hideEdge});
				}
			}
		}
		edges.update(edgesToHide);
		//addToStateHistory("hideEdges", {"hideEdges":edgesToHide,"hidden":hideEdge});
	}
	
	this.hideEdgesById=function(edgeIds, hideEdge)
	{
		if(typeof edgeIds=="undefined" || edgeIds.length==0)
			return;
		
		var edgesToHide=[];
		for(var i=0;i<edgeIds.length;i++)
		{
			edgesToHide.push({id: edgeIds[i], hidden: hideEdge});
		}
		edges.update(edgesToHide);
		addToStateHistory("hideEdges", {"hideEdges":edgesToHide,"hidden":hideEdge});
	}
	
	this.showAllManuallyHiddenNodes=function()
	{
		var nodesToHide=[];
		var edgesToHide=[];
		for(var i=0;i<allManuallyHiddenNodes.length;i++)
		{
			for(var j=0;j<allManuallyHiddenNodes[i].nodes.length;j++)
			{
				allManuallyHiddenNodes[i].nodes[j].hidden=false;
				nodesToHide.push(allManuallyHiddenNodes[i].nodes[j]);
				hiddenNodes[allManuallyHiddenNodes[i].nodes[j].id]=false;
			}
			nodes.update(allManuallyHiddenNodes[i].nodes);
			
			for(var j=0;j<allManuallyHiddenNodes[i].edges.length;j++)
			{
				allManuallyHiddenNodes[i].edges[j].hidden=false;
				edgesToHide.push(allManuallyHiddenNodes[i].edges[j]);
			}
			edges.update(allManuallyHiddenNodes[i].edges);
		}
		allManuallyHiddenNodes=[];

		addToStateHistory("hideNodes", {"hideNodes":nodesToHide,"hideEdges":edgesToHide,"hidden":false});
	}
	
	this.hideNodesById=function(nodeIds, hideNode)
	{
		if(typeof nodeIds=="undefined" || nodeIds.length==0)
		{
			nodeIds=network.getSelectedNodes();
		}
		
		var nodesToHide=[];
		for(var i=0;i<nodeIds.length;i++)
		{
			nodesToHide.push({id: nodeIds[i], hidden: hideNode});
			hiddenNodes[nodeIds[i]]=hideNode;
		}
		nodes.update(nodesToHide);
		

		var edgesToHide=[];
		for(var i=0;i<originalEdges.length;i++)
		{
			if(hideNode==true && (hiddenNodes[originalEdges[i].to] == true || hiddenNodes[originalEdges[i].from] == true))
			{
				edgesToHide.push({id: originalEdges[i]["id"], hidden: hideNode});
			}

			if(hideNode==false && (hiddenNodes[originalEdges[i].to]==false && hiddenNodes[originalEdges[i].from]==false))
			{
				edgesToHide.push({id: originalEdges[i]["id"], hidden: hideNode});
			}
		}
		edges.update(edgesToHide);
		
		allManuallyHiddenNodes.push({"nodes":nodesToHide, "edges":edgesToHide});
		addToStateHistory("hideNodes", {"hideNodes":nodesToHide,"hideEdges":edgesToHide,"hidden":hideNode});
	}
	
	this.hideNodes=function(type, hideEdge)
	{
		//that.setEdgesHidden(type, hideEdge);
		var nodesToHide=[];
		
		for(var i=0;i<originalNodes.length;i++)
		{
			//console.log(type+""+originalEdges[i]["style"]);
			if(type==originalNodes[i]["style"] || ("graph"+type)==originalNodes[i]["style"] )
			{
				nodesToHide.push({id: originalNodes[i]["id"], hidden: hideEdge});
				hiddenNodes[originalNodes[i]["id"]]=hideEdge;
			}
		}
		nodes.update(nodesToHide);
		
		var mappedEdges={};
		for(var i=0;i<edgesNameToHide.length;i++)
		{
			mappedEdges[edgesNameToHide[i].type]=edgesNameToHide[i].hidden;
		}
		
		var edgesToHide=[];
		for(var i=0;i<originalEdges.length;i++)
		{
			if(hideEdge==true && (hiddenNodes[originalEdges[i].to] == true || hiddenNodes[originalEdges[i].from] == true))
			{
				edgesToHide.push({id: originalEdges[i]["id"], hidden: hideEdge});
			}
			
			if(typeof mappedEdges[originalEdges[i]["style"]] != "undefined" && mappedEdges[originalEdges[i]["style"]]!=hideEdge)
			{
				continue;
			}
			
			
			if(hideEdge==false && (hiddenNodes[originalEdges[i].to]==false && hiddenNodes[originalEdges[i].from]==false))
			{
				edgesToHide.push({id: originalEdges[i]["id"], hidden: hideEdge});
			}
		}
		edges.update(edgesToHide);
	}
	
	this.setEdgesHidden=function(type, hideEdge)
	{
		for(var i=0;i<edgesNameToHide.length;i++)
		{
			if(type==edgesNameToHide[i].type)
			{
				edgesNameToHide[i].hidden=hideEdge;
				return;
			}
		}

		edgesNameToHide.push({"hidden": hideEdge,"type": type});
	}
	
	// Downloads canvas as image
	this.downloadCanvasAsImage = function(button)
	{
		var minX=111110;
		var minY=111110;
		var maxX=-111110;
		var maxY=-111110;
		for (var i = 0; i < originalNodes.length; i++) 
		{
			var curNode = originalNodes[i];
			var nodePosition = network.getPositions([curNode.id]);
			
			minX=Math.min(nodePosition[curNode.id].x,minX);
			maxX=Math.max(nodePosition[curNode.id].x,maxX);
			
			minY=Math.min(nodePosition[curNode.id].y,minY);
			maxY=Math.max(nodePosition[curNode.id].y,maxY);
		}
		
		var originalWidth=network.canvas.frame.canvas.width;
		var originalHeight=network.canvas.frame.canvas.height;
		
		network.setSize(Math.min((maxX-minX)*1.2,3500),Math.min((maxY-minY)*1.2,3500));
		
		network.redraw();
		network.fit();
		
		network.once("afterDrawing",function () 
		{
			
			//button.href = network.canvas.frame.canvas.toDataURL();
			//button.download = "graph.png";

			var downloadLink      = document.createElement('a');
			downloadLink.target   = '_blank';
			downloadLink.download = 'graph.png';

			var image=network.canvas.frame.canvas.toDataURL("image/png");

			var URL = window.URL || window.webkitURL;
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
			network.setSize(originalWidth,originalHeight);
			network.redraw();
			network.fit();
			setStatusText("");
		});
	}
	
	// Opens all clusters which were clustered "clusterOutliers"
    function openOutlierClusters(scale) 
	{
        var newClusters = [];
        var declustered = false;
        for (var i = 0; i < zoomClusters.length; i++) 
		{
            if (zoomClusters[i].scale < scale) 
			{
                network.openCluster(zoomClusters[i].id);
                lastClusterZoomLevel = scale;
                declustered = true;
            }
            else 
			{
                newClusters.push(zoomClusters[i])
            }
        }
        zoomClusters = newClusters;
    }
	
	// Select all nodes with nodeid
	this.selectNodes = function(nodeIds)
	{
		network.selectNodes(nodeIds);
		addToStateHistory("select", {"nodes": nodeIds});
	}
	
	// Select nodes which has an Id similar to searchId
	this.selectNodesWithIdLike=function(searchId)
	{
		var nodeIds = [];
		for (var i = 0; i < originalNodes.length; i++) 
		{
			var curNode = originalNodes[i];
			if(curNode.id.indexOf(searchId)>-1)
			{
				nodeIds.push(curNode.id);
			}
			
		}
		addToStateHistory("select", {"nodes": nodeIds});
		network.selectNodes(nodeIds);
	}
	
	// Clusters all outliers
	this.clusterOutliers=function(scale)
	{
		var clusterOptionsByData = 
		{
			processProperties: function (clusterOptions, childNodes) 
			{
				clusterId = clusterId + 1;
				var childrenCount = 0;
				for (var i = 0; i < childNodes.length; i++) 
				{
					childrenCount += childNodes[i].childrenCount || 1;
				}
				clusterOptions.childrenCount = childrenCount;
				clusterOptions.label = "# " + childrenCount + "";
				clusterOptions.font = {size: Math.min(childrenCount+20,40)}
				clusterOptions.id = 'cluster_' + clusterId;
				zoomClusters.push({id:'cluster_' + clusterId, scale:scale});
				return clusterOptions;
			},
			clusterNodeProperties: {borderWidth: 2, shape: 'database', color:"orange"}
		}
		network.clusterOutliers(clusterOptionsByData);
	}
	
	this.cageNodes=function(nodeIds,color)
	{
		if(nodeIds==undefined)
		{
			nodeIds=network.getSelectedNodes();
		}

		if(color==undefined)
		{
			color='#'+(4*Math.floor(Math.random()*4)).toString(16)+
    		(4*Math.floor(Math.random()*4)).toString(16)+
    		(4*Math.floor(Math.random()*4)).toString(16);
		}
		
		allNodeRegions.push({"nodeIds":nodeIds,"color":color});
		addToStateHistory("cageNodes", {"nodeIds":nodeIds,"color":color,"index":allNodeRegions.length-1});
		network.redraw();
	}
	
	// Selects all nodes in area of given rect
	this.selectNodesInRect = function(rect) 
	{
		var fromX;
		var toX;
		var fromY;
		var toY;
		var nodesIdInDrawing = [];
		var xRange = getStartToEnd(rect.startX, rect.w);
		var yRange = getStartToEnd(rect.startY, rect.h);

		for (var i = 0; i < originalNodes.length; i++) 
		{
			var curNode = originalNodes[i];
			var nodePosition = network.getPositions([curNode.id]);
			if(typeof nodePosition!="undefined" && typeof network.body.nodes[curNode.id] !="undefined" && network.body.nodes[curNode.id].options.hidden!=true)
			{
				var nodeXY = network.canvasToDOM({x: nodePosition[curNode.id].x, y: nodePosition[curNode.id].y});
				if (xRange.start <= nodeXY.x && nodeXY.x <= xRange.end && yRange.start <= nodeXY.y && nodeXY.y <= yRange.end) 
				{
					nodesIdInDrawing.push(curNode.id);
				}
			}
		}
		addToStateHistory("select", {"nodes": nodesIdInDrawing});
		network.selectNodes(nodesIdInDrawing);
	}
	
	// Colorizes nodes by name (* used as wildcard, e.g. "identity*" will colorize "identity" and "identity_probs")
	// nodeNames can be an array of names or list of names joined with "," e.g: name1,name2,name3
	this.colorizeNodesByName = function(nodeNames, color)
	{
		if(typeof nodeNames == "undefined" || nodeNames==null || nodeNames==undefined)
		{
			return;
		}
		
		var colorizingIds=[];
		var nodeNamesArray=[];
		if( typeof nodeNames == 'string' ) 
		{
			var nodeNamesArray = nodeNames.replace(" ", "").split(",");
			
		}
		else
		{
			nodeNamesArray=nodeNames;
		}
		
		for(var i=0;i<nodeNamesArray.length;i++)
		{
			console.log("^"+nodeNamesArray[i].replace("*", "(.*)")+"$");
			var re = new RegExp("^"+nodeNamesArray[i].split("*").join("(.*)")+"$");
			for (var j = 0; j < originalNodes.length; j++) 
			{
				if (re.test(originalNodes[j].label)) 
				{
					colorizingIds.push(originalNodes[j].id);
				}
			}
		}
		that.colorizeNodes(colorizingIds,color);
	}
	
	// Colorizes nodes by id
	this.colorizeNodes = function(nodeIds,color)
	{
		if(nodeIds==undefined)
		{
			nodeIds=network.getSelectedNodes();
		}
		
		if(color==undefined)
		{
			color="blue";
		}
		
		if(network!=null)
		{
			var toUpdate=[];
			for (var i=0;i<nodeIds.length;i++) 
			{
				toUpdate.push({id: nodeIds[i], color:{background:color,highlight:{background:color}}});
			}
			nodes.update(toUpdate);
			network.redraw();
		}
	}
	
	// Cluster given nodes 
	this.cluster = function(nodeIds,name,givenClusterId)
	{
		if(typeof givenClusterId ==="undefined")
		{
			givenClusterId=clusterId;
		}
		
		if(nodeIds==undefined)
		{
			nodeIds=network.getSelectedNodes();
		}
		
		if(name==undefined)
		{
			name='cluster_' +givenClusterId;
		}
		
		if(network!=null)
		{
			clusterPositions['cluster_' +givenClusterId]=[];
			clusterPositions['cluster_' +givenClusterId][0]=nodeIds;
			clusterPositions['cluster_' +givenClusterId][1]=network.getPositions(nodeIds);
			allClusters.push('cluster_' +givenClusterId);
			var options = 
			{
				joinCondition:function(nodeOptions) 
				{
					return nodeIds.indexOf(nodeOptions.id) != -1;
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
              clusterNodeProperties: {id: 'cluster_' +givenClusterId , borderWidth: 2, shape: 'database', color:"orange", label:name}
			}
			network.clustering.cluster(options);
			addToStateHistory("cluster", {"clusterId": 'cluster_' +givenClusterId, "name": name, "nodes": nodeIds});
			clusterId++;
		}
	}
	
	// Get graph located at jsonURL, downlaod it and render it
	this.getGraph= function(jsonURL)
	{
		setStatusText("Downloading graph...");
		document.body.style.cursor = 'wait';
		
		$.ajaxSetup(
		{
            error: function(x, e) 
			{
                if (x.status == 0) 
				{
					setStatusText('<font color="red">Downloading graph failed (Check Your Network)</font>');
					document.body.style.cursor = 'auto';
                } 
                else if (x.status == 404) 
				{
					setStatusText('<font color="red">Downloading graph failed (Requested URL not found)</font>');
					document.body.style.cursor = 'auto';
                } 
				else if (x.status == 500) 
				{
					setStatusText('<font color="red">Downloading graph failed (Internel Server Error)</font>');
                    document.body.style.cursor = 'auto';
                }  
				else 
				{
					setStatusText('<font color="red">Downloading graph failed (HTTP-Error-Code: '+x.status+')</font>');
					document.body.style.cursor = 'auto';
                }
            }
        });
		
		$.get(jsonURL, drawGraph);
	}

	// Loads graph using JSON
	this.loadJSONGraph=function(data)
	{
		if(data.length<20)
		{
			setStatusText('<font color="red">Graph-File is empty or corrupt</font>');
			document.body.style.cursor = 'auto';
			return;
		}
		
		if(typeof data["nodes"] == 'undefined' || typeof data["edges"] == 'undefined')
		{
			setStatusText('<font color="red">Graph-File is invalid (maybe incorrect JSON?)</font>');
			document.body.style.cursor = 'auto';
			return;
		}

		originalNodes=data["nodes"];
		originalEdges=data["edges"];

		addUsedButNotDefinedNodes();
		
		ensureUniqueIds(originalNodes);
		ensureUniqueIds(originalEdges);
		
		postprocessEdges();
		postprocessNodes();
		
		startConstruction(true);
	}
	
	// Draws given data as graph
	function drawGraph(data, status=200)
	{
		if(status!=200 && status!="success")
		{
			setStatusText('<font color="red">Downloading graph failed (HTTP-Error-Code: '+status+')</font>');
			document.body.style.cursor = 'auto';
			return;
		}
	
		if(typeof data["nodes"] == 'undefined' || data.length<20)
		{
			setStatusText('<font color="red">Graph-File is empty</font>');
			document.body.style.cursor = 'auto';
			return;
		}
		
		originalNodes=data["nodes"];
		originalEdges=data["edges"];

		addUsedButNotDefinedNodes();
		
		ensureUniqueIds(originalNodes);
		ensureUniqueIds(originalEdges);
		
		postprocessEdges();
		postprocessNodes();
		
		startConstruction();
	}
	
	// Adds nodes to node-array, which were referenced by edges but not specified in nodes-array
	function addUsedButNotDefinedNodes()
	{
		setStatusText("Adding used but not defined nodes...");
		var mappedNodes=[];
		for(var i=0;i< originalNodes.length;i++ )
		{
			mappedNodes[originalNodes[i].id]=originalNodes[i];
		}
		
		for(var i=0;i< originalEdges.length;i++ )
		{
			if(originalEdges[i].from != undefined && mappedNodes[originalEdges[i].from]==undefined)
			{
				var nodeLabel=originalEdges[i].from;
				var exploded=originalEdges[i].from.split("?");
				if(exploded[1]!=undefined)
				{
					nodeLabel=exploded[1];
				}
				
				var addNode=
				{
					"id" : originalEdges[i].from,
					"style" : "border",
					"label" : nodeLabel,
					"url" : originalEdges[i].from
				};
				
				originalNodes.push(addNode);
				mappedNodes[originalEdges[i].from]=addNode;
				console.log("Border-Node: "+nodeLabel+" ("+originalEdges[i].from+")");
			}
			if(originalEdges[i].to!=undefined && mappedNodes[originalEdges[i].to]==undefined)
			{
				var nodeLabel=originalEdges[i].to;
				var exploded=originalEdges[i].to.split("?");
				if(exploded[1]!=undefined)
				{
					nodeLabel=exploded[1];
				}
				
				var addNode=
				{
					"id" : originalEdges[i].to,
					"style" : "border",
					"label" : nodeLabel,
					"url" : originalEdges[i].to
				};
				
				originalNodes.push(addNode);
				mappedNodes[originalEdges[i].to]=addNode;
				console.log("Border-Node: "+nodeLabel+" ("+originalEdges[i].to+")");
			}
		}
	}
	
	// Apply styles to nodes/edges
	function postprocessNodes(nodesIn)
	{	
		if(typeof nodesIn =="undefined" )
		{
			nodesIn=originalNodes;
		}
		
		for(var i=0;i<nodesIn.length;i++)
		{
			if(nodesIn[i].style!=undefined && NODE_STYLES[nodesIn[i].style]!=undefined)
			{
				var styleInfos=NODE_STYLES[nodesIn[i].style];

				if(styleInfos.shape=="ellipse" || styleInfos.shape=="circle")
				{
					if((nodesIn[i].previewhtml!=undefined && nodesIn[i].previewhtml!="" && nodesIn[i].previewhtml.length>10) || (nodesIn[i].mathml!=undefined && nodesIn[i].mathml!="" && nodesIn[i].mathml.length>10))
						nodesIn[i].shape="circularImage";
					else
						nodesIn[i].shape="ellipse";
				}
				else if(styleInfos.shape=="square")
				{
					if((nodesIn[i].previewhtml!=undefined && nodesIn[i].previewhtml!="" && nodesIn[i].previewhtml.length>10) || (nodesIn[i].mathml!=undefined && nodesIn[i].mathml!="" && nodesIn[i].mathml.length>10))
						nodesIn[i].shape="image";
					else
						nodesIn[i].shape="square";
				}
				else
				{
					if((nodesIn[i].previewhtml!=undefined && nodesIn[i].previewhtml!="" && nodesIn[i].previewhtml.length>10) || (nodesIn[i].mathml!=undefined && nodesIn[i].mathml!="" && nodesIn[i].mathml.length>10))
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
	
	function postprocessEdges(edgesIn)
	{
		if(typeof edgesIn =="undefined" )
		{
			edgesIn=originalEdges;
		}
		
		for(var i=0;i<edgesIn.length;i++)
		{
			if(edgesIn[i].style!=undefined && ARROW_STYLES[edgesIn[i].style]!=undefined)
			{
				var styleInfos=ARROW_STYLES[edgesIn[i].style];
				edgesIn[i].arrows = {to:{enabled:styleInfos.directed}};
				
				if(styleInfos.circle==true)
				{
					edgesIn[i].arrows.to.type="circle";
				}
				else
				{
					edgesIn[i].arrows.to.type="arrow";
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
			setStatusText('<font color="red">Downloading nodes failed (HTTP-Error-Code: '+status+')</font>');
			document.body.style.cursor = 'auto';
			return;
		}
	
		if(data.length<20)
		{
			setStatusText('<font color="red">Graph-File is empty or corrupt</font>');
			document.body.style.cursor = 'auto';
			return;
		}
		
		if(typeof data["nodes"] == 'undefined' || typeof data["edges"] == 'undefined')
		{
			setStatusText('<font color="red">Graph-File is invalid (maybe incorrect JSON?)</font>');
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
		
		setStatusText("<font color=\"green\">Successfully recieved "+nodesJSON.length+" node(s) and "+edgesJSON.length+" edge(s)!</font>");
		document.body.style.cursor = 'auto';
	}
	
	this.addEdge = function(edge)
	{
		originalEdges.push(edge);
		postprocessEdges([edge]);
		edges.update(edge);
		
		addToStateHistory("addEdge", {"edge": edge});
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
		addToStateHistory("deleteEdges", {"edges": deletedEdges});
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
		addToStateHistory("deleteNodes", {"nodes": deletedNodes,"edges":deletedEdges});
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
		addToStateHistory("editEdge", {"newEdge": edge,"oldEdge":oldEdge});
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
		addToStateHistory("editNode", {"newNode": node,"oldNode":oldNode});
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
		
		setStatusText("Downloading nodes...");
		document.body.style.cursor = 'wait';
		
		$.ajaxSetup(
		{
            error: function(x, e) 
			{
                if (x.status == 0) 
				{
					setStatusText('<font color="red">Downloading nodes failed (Check Your Network)</font>');
					document.body.style.cursor = 'auto';
                } 
                else if (x.status == 404) 
				{
					setStatusText('<font color="red">Downloading nodes failed (Requested URL not found)</font>');
					document.body.style.cursor = 'auto';
                } 
				else if (x.status == 500) 
				{
					setStatusText('<font color="red">Downloading nodes failed (Internel Server Error)</font>');
                    document.body.style.cursor = 'auto';
                }  
				else 
				{
					setStatusText('<font color="red">Downloading nodes failed (HTTP-Error-Code: '+x.status+')</font>');
					document.body.style.cursor = 'auto';
                }
            }
        });
		
		$.get(jsonURL, addNodesAndEdges);
	}
	
	// Make sure every node and edge has unique ids 
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
	
	// Opens given cluster by id
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
			  
			  addToStateHistory("uncluster", {"clusterId": nodeId, "nodes": toUpdate, "name":node.label});
			  nodes.update(toUpdate);
			  network.redraw();
        }
	}
	
	// Estimates extra height of MathML as SVG
	function estimateExtraSVGHeight(expression)
	{
		if(expression.indexOf("frac") == -1 && expression.indexOf("under") == -1  && expression.indexOf("over") == -1)
		{
			return 0;
		}
		else
		{
			return 0;
		}
	}
	
	function nodeToSVGHTML(node)
	{
		$('#string_span').html(node["previewhtml"]);
		var width=$('#string_span').width();
		var height=$('#string_span').height();
		$('#string_span').html("");
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
	
	// Converts MathML node to SVG node
	function nodeToSVGMath(node)
	{
		$('#string_span').html(node["mathml"]);
		var width=$('#string_span').width();
		var height=$('#string_span').height();
		$('#string_span').html("");
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
	
	// Start construction of graph
	function startConstruction(fixedPositions=false)
	{
		internalOptimizer = new Optimizer(originalNodes, originalEdges);
		setStatusText("Constructing graph...");
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
			else if(originalNodes[i]["mathml"]!=undefined && originalNodes[i]["mathml"].length>10 && originalNodes[i]["mathml"]!="")
			{
				nodeToSVGMath(originalNodes[i]);
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
		
		setStatusText("Rendering graph...");
		console.log("fixedPositions: "+fixedPositions);
		if(fixedPositions==false)
		{
			
			if(typeof THEORY_GRAPH_OPTIONS.layout === 'undefined' || typeof THEORY_GRAPH_OPTIONS.layout.ownLayoutIdx === 'undefined' || THEORY_GRAPH_OPTIONS.layout.ownLayoutIdx==1)
			{
				var opti=new Optimizer(originalNodes,originalEdges);
				if(originalNodes.length+originalEdges.length>3000)
				{
					opti.weaklyHierarchicalLayout(500,document.getElementById('nodeSpacingBox').value);
				}
				else if(originalNodes.length+originalEdges.length>2000)
				{
					opti.weaklyHierarchicalLayout(700,document.getElementById('nodeSpacingBox').value);
				}
				else
				{
					opti.weaklyHierarchicalLayout(1000,document.getElementById('nodeSpacingBox').value);
				}
			}
			else if(THEORY_GRAPH_OPTIONS.layout.ownLayoutIdx==2)
			{
				var opti=new Optimizer(originalNodes,originalEdges);
				opti.GenerateRandomSolution();
				if(originalNodes.length+originalEdges.length>3000)
				{
					opti.SolveUsingForces(200,document.getElementById('nodeSpacingBox').value);
				}
				else if(originalNodes.length+originalEdges.length>2000)
				{
					opti.SolveUsingForces(400,document.getElementById('nodeSpacingBox').value);
				}
				else
				{
					opti.SolveUsingForces(600,document.getElementById('nodeSpacingBox').value);
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
		var container = document.getElementById('mynetwork');
		var data = 
		{
			nodes: nodes,
			edges: edges
		};
		
		network = new vis.Network(container, data, THEORY_GRAPH_OPTIONS);
		//network.startSimulation(10);
		
		if(THEORY_GRAPH_OPTIONS.physics.enabled==false)
		{
			document.body.style.cursor = 'auto';
			setStatusText('<font color="green">Received '+originalNodes.length+' nodes</font>');
		}
		
		network.on('afterDrawing', function() 
		{	
			if(that.onConstructionDone!=undefined)
			{
				var tmp=that.onConstructionDone;
				that.onConstructionDone=undefined;
				tmp();
				
			}
		});
		
		// If the document is clicked somewhere
		network.on("click", function (e) 
		{
			$("#tooltip-container").hide(10);
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
		
				
		// If node is selected
		network.on("selectNode", function (e) 
		{
			console.log(e);
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
					case "openWindow": window.open(serverUrl+selected["url"]); break;
					case "showURL": alert(serverUrl+selected["url"]); break;
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
			$("#tooltip-container").hide(10);
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
					left: params["pointer"]["DOM"]["x"]*1+16+document.getElementById("mainbox").offsetLeft + "px",
				});
				return;
			}
			
			var edge=network.getEdgeAt({x: params["pointer"]["DOM"]["x"],y: params["pointer"]["DOM"]["y"]});
			
			if(edge!=undefined)
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
					
				if (typeof selectedEdge.clickText != "undefined")
				{
					// Show contextmenu
					$("#tooltip-container").finish().show(10).
					html(selectedEdge.clickText ).
					// In the right position (the mouse)
					css({
						top: params["pointer"]["DOM"]["y"]*1+20 + "px",
						left: params["pointer"]["DOM"]["x"]*1+16+document.getElementById("mainbox").offsetLeft + "px"
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
			setStatusText('<font color="green">Received '+originalNodes.length+' nodes</font>');
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

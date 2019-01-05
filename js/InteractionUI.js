function InteractionUI(theoryGraphIn, tgDomListenerIn, statusLoggerIn, optionsIn, actionLoggerIn, wrapperIn)
{
	var actionLogger=actionLoggerIn;
	var options=optionsIn;
	var theoryGraph=theoryGraphIn;
	var tgDomListener=tgDomListenerIn;
	var statusLogger=statusLoggerIn;
	var wrapper=wrapperIn;
	
	init();
	
	function init()
	{
		options.THEORY_GRAPH_OPTIONS.manipulation=
		{
			addNode: addNodeCallback,
			editNode: editNodeCallback,
			deleteNode: deleteNodeCallback,
			addEdge: addEdgeCallback,
			editEdge: editEdgeCallback,
			deleteEdge: deleteEdgeCallback
		};
		
		$( "#"+options.external.prefix+"helpDialog" ).dialog({autoOpen: false});
		$(  "#"+options.external.prefix+"helpDialog" ).on( "click", function() 
		{
			$(  "#"+options.external.prefix+"helpDialog" ).dialog( "open" );
		});
		
		$("#"+options.external.prefix+"shareIcons").jsSocials(
		{
		    showLabel: false,
		    showCount: false,
		    shares: ["email", "twitter", "facebook", "googleplus", "linkedin", "pinterest", "stumbleupon", "whatsapp","telegram"]
		});
		
		addColors();
		generateCustomSideMenu();	
		
		var viewOnlyMode=options.external.viewOnlyMode;
		if(typeof viewOnlyMode != "undefined" && viewOnlyMode=="true")
		{
			var menuButtonsDiv = document.getElementById(options.external.prefix+'menuButtonsDiv');
			menuButtonsDiv.style.display='none';
		}
		
		var jsonLoader = document.getElementById(options.external.prefix+'jsonLoader');
		jsonLoader.addEventListener('change', handleJson, false);
		
		addDOMHandler();
	}	
	
	function addDOMHandler()
	{
		// TODO bind DOM to functions
		document.getElementById(options.external.prefix+'leftMenuButton').addEventListener('click',function() {openNav()},false);	
		document.getElementById(options.external.prefix+'rightMenuButton').addEventListener('click',function() { openNav2() },false);	
		document.getElementById(options.external.prefix+'closeNav2').addEventListener('click',function() { closeNav2() },false);	
		document.getElementById(options.external.prefix+'closeNav').addEventListener('click',function() { closeNav() },false);	
		document.getElementById(options.external.prefix+'undoButton').addEventListener('click',function() { actionLogger.undoLastAction() },false);	
		document.getElementById(options.external.prefix+'redoButton').addEventListener('click',function() { actionLogger.redoLastAction() },false);	
		document.getElementById(options.external.prefix+'selectionModeButton').addEventListener('click',function() {switchSelectionMode()},false);	
		document.getElementById(options.external.prefix+'downloadButton').addEventListener('click',function() { downloadGraph() },false);	
		document.getElementById(options.external.prefix+'clusterButton').addEventListener('click',function() { clusterSelectedNodes() },false);	
		document.getElementById(options.external.prefix+'cageButton').addEventListener('click',function() { cageSelectedNodes() },false);
		document.getElementById(options.external.prefix+'manualHideButton').addEventListener('click',function() { hideSelectedNodes(true) },false);
		document.getElementById(options.external.prefix+'manualShowButton').addEventListener('click',function() { showAllManuallyHiddenNodes() },false);
		document.getElementById(options.external.prefix+'helpButton').addEventListener('click',function() {  },false);
		document.getElementById(options.external.prefix+'selectNodes').addEventListener('click',function() { selectNodes() },false);
		document.getElementById(options.external.prefix+'clusterNodesColor').addEventListener('click',function() { clusterNodesColor() },false);
		
		document.getElementById(options.external.prefix+'iframeRadio').addEventListener('click',function() { generateIFrameGraph() },false);	
		document.getElementById(options.external.prefix+'htmlRadio').addEventListener('click',function() { generateHTMLGraph() },false);
		document.getElementById(options.external.prefix+'parameterRadio').addEventListener('click',function() { generateParameterGraph() },false);
		document.getElementById(options.external.prefix+'uriRadio').addEventListener('click',function() { generateURIGraph() },false);
		document.getElementById(options.external.prefix+'jsonRadio').addEventListener('click',function() { downloadGraphJSON() },false);
		
		document.getElementById(options.external.prefix+'nodeSpacingBox').addEventListener('change',function() { changeMethod(); },false);
		document.getElementById(options.external.prefix+'layoutBox').addEventListener('change',function() { changeMethod(this.value); },false);
		
		//document.getElementById(options.external.prefix+'').addEventListener('click',function() {  },false);
		//document.getElementById(options.external.prefix+'').addEventListener('click',function() {  },false);
		
	}
	
	function generateCustomSideMenu()
	{
		var html="";
		for(var i=0;i<options.GRAPH_TYPES.length;i++)
		{
			html+='<li data-action="'+options.GRAPH_TYPES[i].id+'" title="'+options.GRAPH_TYPES[i].tooltip+'">'+options.GRAPH_TYPES[i].menuText+'</li>';
		}
		html+='<li data-action="close" title="Hides this menu">Hide</li>';
		document.getElementById(options.external.prefix+'side-menu').innerHTML = html;
	}	
		
	function addColors()
	{
		var mainEle=document.getElementById(options.external.prefix+"colorPicker");
		var colorArray=options.colorizingNodesArray;
		for(var i=0;i<colorArray.length;i++)
		{
			var div = document.createElement("div");
			function colorizeTmp(color) { colorizeSelectedNodes(color); }
			var boundFunc=colorizeTmp.bind(this, colorArray[i]);
			
			div.addEventListener(
				 'click',
				 boundFunc,
				 false
			);
			div.title='Colorize all selected nodes';
			div.classList.add("colorRect");
			div.style.cssText='background-color:'+colorArray[i];
			
			mainEle.appendChild(div);
		}
	}
	
	this.generateEdgesNodesHideDiv = function()
	{
		var usedEdgeTypes = theoryGraph.getUsedEdgeTypes();
		
		var mainEle=document.getElementById(options.external.prefix+"edgesShowHideDiv");
		
		var strong = document.createElement("strong");
		strong.innerHTML="Hide/Show Edges";
		mainEle.appendChild(strong);
		mainEle.appendChild(document.createElement("br"));
		
		for(var i=0;i<usedEdgeTypes.length;i++)
		{
			var alias=(typeof options.ARROW_STYLES[usedEdgeTypes[i]] === "undefined" ? options.ARROW_STYLES[usedEdgeTypes[i].replace("graph","")].alias : options.ARROW_STYLES[usedEdgeTypes[i]].alias);
			
			var img = document.createElement("img");
			
			function selectEdgesByType(type) { theoryGraph.selectEdgesByType(type); }
			var boundFunc=selectEdgesByType.bind(this, usedEdgeTypes[i]);
			
			img.addEventListener(
				 'click',
				 boundFunc,
				 false
			);
			img.src='img/select.png';
			img.width=14;
			img.style.cssText="width:14px";
			img.title="Select all "+alias;

			mainEle.appendChild(img);
			
			var input = document.createElement("input");
			input.type="checkbox";
			input.id="edgesCheckbox_"+i;
			input.value=usedEdgeTypes[i];
			if(usedEdgeTypes[i]!=="meta" && usedEdgeTypes[i]!=="graphmeta")
			{
				input.checked=true;
			}
			
			
			input.addEventListener(
				 'click',
				 function() { hideEdges(this.value, !this.checked) },
				 false
			);
			
			mainEle.appendChild(input);
			
			var label = document.createElement("label");
			label.for="edgesCheckbox_"+i;
			label.innerHTML='Show '+alias;
			
			mainEle.appendChild(label);
			mainEle.appendChild(document.createElement("br"));
		}
		
		var usedNodeTypes = theoryGraph.getUsedNodeTypes();
		mainEle.appendChild(document.createElement("br"));
		var strong = document.createElement("strong");
		strong.innerHTML="Hide/Show Nodes";
		mainEle.appendChild(strong);
		mainEle.appendChild(document.createElement("br"));
		for(var i=0;i<usedNodeTypes.length;i++)
		{
			var alias=(typeof options.NODE_STYLES[usedNodeTypes[i]] === "undefined" ? options.NODE_STYLES[usedNodeTypes[i].replace("graph","")].alias : options.NODE_STYLES[usedNodeTypes[i]].alias);

			var img = document.createElement("img");
			
			function selectNodesByType(type) { theoryGraph.selectNodesByType(type); }
			var boundFunc=selectNodesByType.bind(this, usedNodeTypes[i]);
			
			img.addEventListener(
				 'click',
				 boundFunc,
				 false
			);
			
			img.src='img/select.png';
			img.width=14;
			img.style.cssText="width:14px";
			img.title="Select all "+alias;

			mainEle.appendChild(img);
			
			var input = document.createElement("input");
			input.type="checkbox";
			input.id="nodesCheckbox_"+i;
			input.value=usedNodeTypes[i];
			
			input.checked=true;
			
			input.addEventListener(
				 'click',
				 function() { hideNodes(this.value, !this.checked) },
				 false
			);
			
			mainEle.appendChild(input);
			
			var label = document.createElement("label");
			label.for="nodesCheckbox_"+i;
			label.innerHTML='Show '+alias;
			
			mainEle.appendChild(label);
			
			if(i!=usedNodeTypes.length-1)
			{				
				mainEle.appendChild(document.createElement("br"));
			}
		}
	}
		
	function hideEdges(type, hide)
	{
		theoryGraph.hideEdges(type, hide);
	}
	
	function hideNodes(type, hide)
	{
		theoryGraph.hideNodes(type, hide);
	}

	function selectNodes()
	{
		theoryGraph.selectNodesWithIdLike(prompt("Please enter a name which should be searched for!", "node_name"));
		//theoryGraph.focusOnNodes();
	}
	
	function downloadGraph()
	{
		statusLogger.setStatusText("Downloading Image...");
		theoryGraph.downloadCanvasAsImage(document.getElementById(options.external.prefix+'downloadButton'));
	}
	
	function switchSelectionMode()
	{
		tgDomListener.switchSelectionMode();
	}
	
	function clusterSelectedNodes()
	{
		statusLogger.setStatusText("Clustering Nodes...");
		theoryGraph.cluster(undefined, prompt("Please choose a name for the cluster", ""));
		statusLogger.setStatusText("");
	}
	
	function colorizeSelectedNodes(color)
	{
		theoryGraph.colorizeNodes(undefined, color);
	}
	
	function changeMethod(idx)
	{
		theoryGraph.manualFocus=false;
		statusLogger.setStatusText("Relayouting graph...");
		document.body.style.cursor = 'wait';
		if(typeof idx !=='undefined')
		{
			if(idx==1 || idx==2 || idx==4)
			{
				options.THEORY_GRAPH_OPTIONS.layout={ownLayoutIdx:idx};
			}
			else if(idx==0)
			{
				options.THEORY_GRAPH_OPTIONS.layout={ownLayoutIdx:0, hierarchical: {sortMethod: "directed",direction: "LR"}};
			}
			else if(idx==3)
			{
				theoryGraph.manualFocus=true;
				document.body.style.cursor = 'auto';
				return;
			}
		}
		wrapper.createNewGraph();
	}

	function handleJson(e)
	{
		var reader = new FileReader();
		reader.onload = function(event)
		{
			console.log(event.target.result);
			theoryGraph.loadJSONGraph(JSON.parse(event.target.result));
		}
		reader.readAsText(e.target.files[0]);   		
	}		
	
	function openNav() 
	{
		document.getElementById(options.external.prefix+"mySidenav").style.width = "400px";
	}

	function closeNav() 
	{
		document.getElementById(options.external.prefix+"mySidenav").style.width = "0";
	}

	function openNav2() 
	{
		document.getElementById(options.external.prefix+"mySidenav2").style.width = "400px";
	}

	function closeNav2() 
	{
		document.getElementById(options.external.prefix+"mySidenav2").style.width = "0";
	}
	
	function cageSelectedNodes()
	{
		console.log("cageSelectedNodes");
		theoryGraph.cageNodes();
	}
	
	function hideSelectedNodes(hidden)
	{
		theoryGraph.hideNodesById(undefined, hidden);
	}
	
	function showAllManuallyHiddenNodes()
	{
		theoryGraph.showAllManuallyHiddenNodes();
	}
		
	function clusterNodesColor()
	{
		theoryGraph.clusterUsingColor();
	}
	
	function downloadGraphJSON()
	{
		download("graph_data.json", theoryGraph.graphToStringJSON());
	}

	function download(filename, text) 
	{
		var element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
		element.setAttribute('download', filename);

		element.style.display = 'none';
		document.body.appendChild(element);

		element.click();

		document.body.removeChild(element);
	}
	
	function generateIFrameGraph()
	{
		var generatedJson=theoryGraph.graphToIFrameString();
		
		var embeddingCode="<script>";
		embeddingCode+="function sendMessageToIFrameFromLocalStorage"+generatedJson.id+"(param){ var tmp=localStorage.getItem(param); document.getElementById(options.external.prefix+'"+generatedJson.id+"').contentWindow.postMessage(tmp, '*'); }\r\n"+generatedJson.storage;
		embeddingCode+="<\/script>\r\n";
		embeddingCode+="<iframe style='width:100%;min-height:550px;' src='"+generatedJson.uri+"' onLoad=\"sendMessageToIFrameFromLocalStorage"+generatedJson.id+"('"+generatedJson.id+"')\" id='"+generatedJson.id+"'><\/iframe>";
		
		document.getElementById(options.external.prefix+"uriTextarea").value="";
		document.getElementById(options.external.prefix+"informationTextarea").value=embeddingCode;
	}
	
	function generateHTMLGraph()
	{
		var generatedJson=theoryGraph.graphToLocalStorageString();
		
		document.getElementById(options.external.prefix+"uriTextarea").value=generatedJson.uri;
		document.getElementById(options.external.prefix+"informationTextarea").value=generatedJson.storage;
	}
	
	function generateParameterGraph()
	{
		var generatedJson=theoryGraph.graphToURIParameterString();
		
		if(generatedJson.length > 220)
		{
			document.getElementById(options.external.prefix+"uriTextarea").value="";
			document.getElementById(options.external.prefix+"informationTextarea").value="";
			alert("Graph is too big to be embedded in URI. Select HTML-Embedding or IFrame-Embedding instead!");
		}
		else
		{
			document.getElementById(options.external.prefix+"uriTextarea").value=generatedJson;
			document.getElementById(options.external.prefix+"informationTextarea").value="";
		}
	}
	
	function generateURIGraph()
	{
		document.getElementById(options.external.prefix+"uriTextarea").value=window.location.href;
		document.getElementById(options.external.prefix+"informationTextarea").value="";
	}
	
	

	function addDataNode(data, callback) 
	{
		data.id = document.getElementById(options.external.prefix+'node-id').value;
		if(theoryGraph.isUniqueId(data.id)==false)
		{
			alert("The ID entered is already used, please enter an unique ID.");
			return;
		}
		
		data.label = document.getElementById(options.external.prefix+'node-label').value;
		data.url = document.getElementById(options.external.prefix+'node-url').value;
		data.mathml = document.getElementById(options.external.prefix+'node-mathml').value;
		data.style = document.getElementById(options.external.prefix+'node-style').value;
		clearPopUp();
		theoryGraph.addNode(data);
	}

	function addDataEdge(data, callback) 
	{
		var edge={};
		edge.id = document.getElementById(options.external.prefix+'edge-id').value;
		if(theoryGraph.isUniqueEdgeId(edge.id)==false)
		{
			alert("The ID entered is already used, please enter an unique ID.");
			return;
		}
		
		edge.label = document.getElementById(options.external.prefix+'edge-label').value;
		edge.url = document.getElementById(options.external.prefix+'edge-url').value;
		edge.style = document.getElementById(options.external.prefix+'edge-style').value;
		edge.from=data.from;
		edge.to=data.to;
		clearPopUp();
		theoryGraph.addEdge(edge);
	}

	function editDataEdge(data, callback) 
	{
		var edge={};
		edge.id = document.getElementById(options.external.prefix+'edge-id').value;
		edge.label = document.getElementById(options.external.prefix+'edge-label').value;
		edge.url = document.getElementById(options.external.prefix+'edge-url').value;
		edge.style = document.getElementById(options.external.prefix+'edge-style').value;
		edge.from=data.from;
		edge.to=data.to;
		clearPopUp();
		theoryGraph.saveEdge(edge);
		callback(null);
	}

	function saveDataNode(data, callback) 
	{
		var node={};
		node.id = document.getElementById(options.external.prefix+'node-id').value;
		node.label = document.getElementById(options.external.prefix+'node-label').value;
		node.url = document.getElementById(options.external.prefix+'node-url').value;
		node.mathml = document.getElementById(options.external.prefix+'node-mathml').value;
		node.style = document.getElementById(options.external.prefix+'node-style').value;
		clearPopUp();
		theoryGraph.saveNode(node);
		callback(null);
	}

	function clearPopUp() 
	{
		document.getElementById(options.external.prefix+'saveButton').onclick = null;
		document.getElementById(options.external.prefix+'cancelButton').onclick = null;
		document.getElementById(options.external.prefix+'network-popUp').style.display = 'none';
		
		document.getElementById(options.external.prefix+'edge-saveButton').onclick = null;
		document.getElementById(options.external.prefix+'edge-cancelButton').onclick = null;
		document.getElementById(options.external.prefix+'network-edge-popUp').style.display = 'none';
	}

	function cancelEdit(callback) 
	{
		clearPopUp();
		callback(null);
	}

	function addNodeCallback(data, callback) 
	{
		// filling in the popup DOM elements
		document.getElementById(options.external.prefix+'operation').innerHTML = "Add Node";
		document.getElementById(options.external.prefix+'node-id').value = data.id;
		document.getElementById(options.external.prefix+'node-label').value = data.label;
		document.getElementById(options.external.prefix+'node-url').value = "";
		document.getElementById(options.external.prefix+'node-mathml').value = "";
		
		var html="";
		Object.keys(options.NODE_STYLES).forEach(function (key) 
		{
		   html+='<option value="'+key+'">'+options.NODE_STYLES[key].alias+'</option>';
		});
		
		document.getElementById(options.external.prefix+'node-style').innerHTML = html;
		document.getElementById(options.external.prefix+'saveButton').onclick = addDataNode.bind(this, data, callback);
		document.getElementById(options.external.prefix+'cancelButton').onclick = clearPopUp.bind();
		document.getElementById(options.external.prefix+'network-popUp').style.display = 'block';
	}

	function editNodeCallback(data, callback) 
	{
		// filling in the popup DOM elements
		document.getElementById(options.external.prefix+'operation').innerHTML = "Edit Node";
		document.getElementById(options.external.prefix+'node-id').value = data.id;
		document.getElementById(options.external.prefix+'node-id').disabled=true;
		document.getElementById(options.external.prefix+'node-label').value = (typeof data.label !="undefined") ? data.label : "";
		document.getElementById(options.external.prefix+'node-url').value = (typeof data.url !="undefined") ? data.url : "";
		document.getElementById(options.external.prefix+'node-mathml').value = (typeof data.mathml !="undefined") ? data.mathml : "";
		
		var html="";
		Object.keys(options.NODE_STYLES).forEach(function (key) 
		{
		   html+='<option value="'+key+'">'+options.NODE_STYLES[key].alias+'</option>';
		});
		
		document.getElementById(options.external.prefix+'node-style').innerHTML = html;
		
		if(typeof data.style !="undefined" )
		{
			document.getElementById(options.external.prefix+'node-style').value = data.style;
		}
		
		document.getElementById(options.external.prefix+'saveButton').onclick = saveDataNode.bind(this, data, callback);
		document.getElementById(options.external.prefix+'cancelButton').onclick = cancelEdit.bind(this,callback);
		document.getElementById(options.external.prefix+'network-popUp').style.display = 'block';
	}

	function addEdgeCallbackHelper(data, callback)
	{
		// filling in the popup DOM elements
		document.getElementById(options.external.prefix+'edge-operation').innerHTML = "Add Edge";
		document.getElementById(options.external.prefix+'edge-id').value = 'edge_' + Math.random().toString(36).substr(2, 9);
		document.getElementById(options.external.prefix+'edge-label').value = "";
		document.getElementById(options.external.prefix+'edge-url').value = "";
		
		var html="";
		Object.keys(options.ARROW_STYLES).forEach(function (key) 
		{
		   html+='<option value="'+key+'">'+options.ARROW_STYLES[key].alias+'</option>';
		});
		
		document.getElementById(options.external.prefix+'edge-style').innerHTML = html;
		document.getElementById(options.external.prefix+'edge-saveButton').onclick = addDataEdge.bind(this, data, callback);
		document.getElementById(options.external.prefix+'edge-cancelButton').onclick = clearPopUp.bind();
		document.getElementById(options.external.prefix+'network-edge-popUp').style.display = 'block';
	}

	function addEdgeCallback(data, callback) 
	{
		if (data.from == data.to) 
		{
			var r = confirm("Do you want to connect the node to itself?");
			if (r == true) 
			{
				addEdgeCallbackHelper(data, callback);
			}
		}
		else 
		{
			addEdgeCallbackHelper(data, callback);
		}
	}

	function deleteEdgeCallback(data, callback) 
	{
		console.log(data);
		theoryGraph.deleteEdges(data["edges"]);
	}

	function deleteNodeCallback(data, callback) 
	{
		console.log(data);
		theoryGraph.deleteNodes(data["nodes"],data["edges"]);
	}

	function editEdgeCallbackHelper(data, callback) 
	{
		// filling in the popup DOM elements
		document.getElementById(options.external.prefix+'edge-operation').innerHTML = "Edit Edge";
		document.getElementById(options.external.prefix+'edge-id').value = data.id;
		document.getElementById(options.external.prefix+'edge-label').value = (typeof data.label !="undefined") ? data.label : "";
		document.getElementById(options.external.prefix+'edge-url').value = (typeof data.url !="undefined") ? data.url : "";

		var html="";
		Object.keys(options.ARROW_STYLES).forEach(function (key) 
		{
		   html+='<option value="'+key+'">'+options.ARROW_STYLES[key].alias+'</option>';
		});
		
		document.getElementById(options.external.prefix+'edge-style').innerHTML = html;
		document.getElementById(options.external.prefix+'edge-saveButton').onclick = editDataEdge.bind(this, data, callback);
		document.getElementById(options.external.prefix+'edge-cancelButton').onclick = clearPopUp.bind();
		document.getElementById(options.external.prefix+'network-edge-popUp').style.display = 'block';
	}

	function editEdgeCallback(data, callback) 
	{
		if (data.from == data.to) 
		{
			var r = confirm("Do you want to connect the node to itself?");
			if (r == true) 
			{
				editEdgeCallbackHelper(data, callback);
			}
		}
		else 
		{
			editEdgeCallbackHelper(data, callback);
		}
	}
}
import 'jqueryui'

import TGView from '..';
import GlobalListener from './GlobalListener';
import StatusLogger from './StatusLogger';
import { Configuration } from '../Configuration';
import TheoryGraph from '../graph/TheoryGraph';
import ActionHistory from '../core/ActionHistory';
import DOMConstruct from './DOMConstruct';
import { DirtyNode, DirtyEdge } from '../graph/visgraph';
import { selectPng } from '../css/images';

export default class InteractionUI {
	constructor(
		private readonly dom: DOMConstruct, 
		private readonly theoryGraph: TheoryGraph, 
		private readonly tgDomListener: GlobalListener, 
		private readonly statusLogger: StatusLogger, 
		private readonly options: Configuration, 
		private readonly actionHistory: ActionHistory, 
		private readonly wrapperIn: TGView
	) {
		this.handleJson = this.handleJson.bind(this);
		this.init();
	}

	private init()
	{
		this.options.THEORY_GRAPH_OPTIONS.manipulation = {
			addNode: this.addNodeCallback.bind(this),
			editNode: this.editNodeCallback.bind(this),
			deleteNode: this.deleteNodeCallback.bind(this),
			addEdge: this.addEdgeCallback.bind(this),
			editEdge: this.editEdgeCallback.bind(this),
			deleteEdge: this.deleteEdgeCallback.bind(this)
		};


		
		this.dom.$$('helpDialog').dialog({autoOpen: false});
		this.dom.$$('helpDialog').on('click', () => 
		{
			this.dom.$$('helpDialog').dialog('open');
		});
		
		/*
		$("#"+options.external.prefix+"shareIcons").jsSocials(
		{
		    showLabel: false,
		    showCount: false,
		    shares: ["email", "twitter", "facebook", "googleplus", "linkedin", "pinterest", "stumbleupon", "whatsapp","telegram"]
		});
		*/
		
		this.addColors();
		this.generateCustomSideMenu();	
		
		var viewOnlyMode=this.options.preferences.viewOnlyMode;
		if(typeof viewOnlyMode != 'undefined' && viewOnlyMode==true)
		{
			this.dom.getElementById('menuButtonsDiv').style.display = 'none';
		}
		
		
		var jsonLoader = this.dom.getElementById('jsonLoader');
		jsonLoader.addEventListener('change', this.handleJson, false);
		
		this.addDOMHandler();
	}

	destroy() {
		this.dom.$$('helpDialog' ).dialog('destroy');
		this.dom.getElementById('jsonLonger').removeEventListener('jsonLoader', this.handleJson);
	}
	
	addDOMHandler()
	{
		this.dom.getElementById('leftMenuButton').addEventListener('click', () => this.openNav(),false);	
		this.dom.getElementById('rightMenuButton').addEventListener('click',() => { this.openNav2() },false);	
		this.dom.getElementById('closeNav2').addEventListener('click',() => { this.closeNav2() },false);	
		this.dom.getElementById('closeNav').addEventListener('click',() => { this.closeNav() },false);	
		this.dom.getElementById('undoButton').addEventListener('click',() => { this.actionHistory.undoLastAction() },false);	
		this.dom.getElementById('redoButton').addEventListener('click',() => { this.actionHistory.redoLastAction() },false);	
		this.dom.getElementById('selectionModeButton').addEventListener('click',() => {this.switchSelectionMode()},false);	
		this.dom.getElementById('downloadButton').addEventListener('click',() => { this.downloadGraph() },false);	
		this.dom.getElementById('clusterButton').addEventListener('click',() => { this.clusterSelectedNodes() },false);	
		this.dom.getElementById('cageButton').addEventListener('click',() => { this.cageSelectedNodes() },false);
		this.dom.getElementById('manualHideButton').addEventListener('click',() => { this.hideSelectedNodes(true) },false);
		this.dom.getElementById('manualShowButton').addEventListener('click',() => { this.showAllManuallyHiddenNodes() },false);
		this.dom.getElementById('helpButton').addEventListener('click',() => {  },false);
		this.dom.getElementById('selectNodes').addEventListener('click',() => { this.selectNodes() },false);
		this.dom.getElementById('clusterNodesColor').addEventListener('click',() => { this.clusterNodesColor() },false);
		
		this.dom.getElementById('iframeRadio').addEventListener('click',() =>  { this.generateIFrameGraph() },false);	
		this.dom.getElementById('htmlRadio').addEventListener('click',() =>  { this.generateHTMLGraph() },false);
		this.dom.getElementById('parameterRadio').addEventListener('click',()  =>  { this.generateParameterGraph() },false);
		this.dom.getElementById('uriRadio').addEventListener('click',() => { this.generateURIGraph() },false);
		this.dom.getElementById('jsonRadio').addEventListener('click',()  => { this.downloadGraphJSON() },false);
		
		this.dom.getElementById('nodeSpacingBox').addEventListener('change',() => { this.changeMethod(); },false);
		this.dom.getElementById('layoutBox').addEventListener('change',(e) => { this.changeMethod((e.target as HTMLSelectElement).value); },false);
		
		//document.getElementById(options.external.prefix+'').addEventListener('click',function() {  },false);
		//document.getElementById(options.external.prefix+'').addEventListener('click',function() {  },false);
		
	}
	
	generateCustomSideMenu()
	{
		var html='';
		for(var i=0;i<this.options.GRAPH_TYPES.length;i++)
		{
			html+='<li data-action="'+this.options.GRAPH_TYPES[i].id+'" title="'+this.options.GRAPH_TYPES[i].tooltip+'">'+this.options.GRAPH_TYPES[i].menuText+'</li>';
		}
		html+='<li data-action="close" title="Hides this menu">Hide</li>';
		this.dom.getElementById('side-menu').innerHTML = html;
	}	
		
	addColors()
	{
		var mainEle=this.dom.getElementById('colorPicker');
		var colorArray=this.options.colorizingNodesArray;
		for(var i=0;i<colorArray.length;i++)
		{
			var div = document.createElement('div');
			var boundFunc=this.colorizeSelectedNodes.bind(this, colorArray[i]);
			
			div.addEventListener(
				 'click',
				 boundFunc,
				 false
			);
			div.title='Colorize all selected nodes';
			div.classList.add('colorRect');
			div.classList.add('tgview');
			div.style.cssText='background-color:'+colorArray[i];
			
			mainEle.appendChild(div);
		}
	}
	
	generateEdgesNodesHideDiv()
	{
		var usedEdgeTypes = this.theoryGraph.getUsedEdgeTypes();
		
		var mainEle=this.dom.getElementById('edgesShowHideDiv');
		
		var strong = document.createElement('strong');
		strong.innerHTML='Hide/Show Edges';
		mainEle.appendChild(strong);
		mainEle.appendChild(document.createElement('br'));
		
		for(var i=0;i<usedEdgeTypes.length;i++)
		{
			var alias=(typeof this.options.ARROW_STYLES[usedEdgeTypes[i]] === 'undefined' ? this.options.ARROW_STYLES[usedEdgeTypes[i].replace('graph','')].alias : this.options.ARROW_STYLES[usedEdgeTypes[i]].alias);
			
			var img = document.createElement('img');
			
			var boundFunc=this.theoryGraph.selectEdgesByType.bind(this.theoryGraph, usedEdgeTypes[i]);
			
			img.addEventListener(
				 'click',
				 boundFunc,
				 false
			);
			img.src=selectPng;
			img.width=14;
			img.style.cssText='width:14px';
			img.title='Select all '+alias;

			mainEle.appendChild(img);
			
			var input = document.createElement('input');
			input.type='checkbox';
			input.id='edgesCheckbox_'+i;
			input.value=usedEdgeTypes[i];
			if(usedEdgeTypes[i]!=='meta' && usedEdgeTypes[i]!=='graphmeta')
			{
				input.checked=true;
			}
			
			
			input.addEventListener(
				 'click',
				 (e) => {
					const t = e.target! as HTMLInputElement;
					this.hideEdges(t.value, !t.checked)
				},
				 false
			);
			
			mainEle.appendChild(input);
			
			var label = document.createElement('label');
			label.setAttribute('for', 'edgesCheckbox_'+i);
			label.innerHTML='Show '+alias;
			
			mainEle.appendChild(label);
			mainEle.appendChild(document.createElement('br'));
		}
		
		var usedNodeTypes = this.theoryGraph.getUsedNodeTypes();
		mainEle.appendChild(document.createElement('br'));
		var strong = document.createElement('strong');
		strong.innerHTML='Hide/Show Nodes';
		mainEle.appendChild(strong);
		mainEle.appendChild(document.createElement('br'));
		for(var i=0;i<usedNodeTypes.length;i++)
		{
			var alias=(typeof this.options.NODE_STYLES[usedNodeTypes[i]] === 'undefined' ? this.options.NODE_STYLES[usedNodeTypes[i].replace('graph','')].alias : this.options.NODE_STYLES[usedNodeTypes[i]].alias);

			var img = document.createElement('img');
			var boundFunc=this.theoryGraph.selectNodesByType.bind(this.theoryGraph, usedNodeTypes[i]);
			
			img.addEventListener(
				 'click',
				 boundFunc,
				 false
			);
			
			img.src=selectPng;
			img.width=14;
			img.style.cssText='width:14px';
			img.title='Select all '+alias;

			mainEle.appendChild(img);
			
			var input = document.createElement('input');
			input.type='checkbox';
			input.id='nodesCheckbox_'+i;
			input.value=usedNodeTypes[i];
			
			input.checked=true;
			
			input.addEventListener(
				 'click',
				 (e) => {
					const t = e.target as HTMLInputElement;
					this.hideNodes(t.value, !t.checked)
				},
				 false
			);
			
			mainEle.appendChild(input);
			
			var label = document.createElement('label');
			label.setAttribute('for', 'nodesCheckbox_'+i);
			label.innerHTML='Show '+alias;
			
			mainEle.appendChild(label);
			
			if(i!=usedNodeTypes.length-1)
			{				
				mainEle.appendChild(document.createElement('br'));
			}
		}
	}
		
	hideEdges(type: string, hide: boolean)
	{
		this.theoryGraph.hideEdges(type, hide);
	}
	
	hideNodes(type: string, hide: boolean)
	{
		this.theoryGraph.hideNodes(type, hide);
	}

	selectNodes()
	{
		// TODO: Handle when prompt is cancelled
		this.theoryGraph.selectNodesWithIdLike(prompt('Please enter a name which should be searched for!', 'node_name')!);
		//theoryGraph.focusOnNodes();
	}
	
	downloadGraph()
	{
		this.statusLogger.setStatusText('Downloading Image...');
		this.theoryGraph.downloadCanvasAsImage(this.dom.getElementById<HTMLButtonElement>('downloadButton'));
	}
	
	switchSelectionMode()
	{
		this.tgDomListener.switchSelectionMode();
	}
	
	clusterSelectedNodes()
	{
		// TODO: Handle prompt being cancelled
		this.statusLogger.setStatusText('Clustering Nodes...');
		this.theoryGraph.cluster(undefined, prompt('Please choose a name for the cluster', '')!);
		this.statusLogger.setStatusText('');
	}
	
	colorizeSelectedNodes(color: string)
	{
		this.theoryGraph.colorizeNodes(undefined, color);
	}
	
	changeMethod(idx?: string)
	{
		const iidx = idx ? parseInt(idx, 10) : -1;
		this.theoryGraph.manualFocus=false;
		this.statusLogger.setStatusText('Relayouting graph...');
		this.statusLogger.setStatusCursor('wait');
		if(typeof idx !=='undefined')
		{
			if(iidx==1 || iidx==2 || iidx==4)
			{
				this.options.THEORY_GRAPH_OPTIONS.layout={ownLayoutIdx:iidx};
			}
			else if(iidx==0)
			{
				this.options.THEORY_GRAPH_OPTIONS.layout={ownLayoutIdx:0, hierarchical: {sortMethod: 'directed',direction: 'LR'}};
			}
			else if(iidx==3)
			{
				this.theoryGraph.manualFocus=true;
				this.statusLogger.setStatusCursor('wait');
				return;
			}
		}
		this.wrapperIn.createNewGraph();
	}

	handleJson(e: Event)
	{
		var reader = new FileReader();
		reader.onload = (event: ProgressEvent) =>
		{
			const result = (event.target as unknown as {result: string}).result;
			console.log(result);
			this.theoryGraph.loadJSONGraph(JSON.parse(result));
		}
		reader.readAsText((e.target as unknown as {files: Blob[]}).files[0]);   		
	}		
	
	openNav() 
	{
		this.dom.getElementById('mySidenav').style.width = '400px';
	}

	closeNav() 
	{
		this.dom.getElementById('mySidenav').style.width = '0';
	}

	openNav2() 
	{
		this.dom.getElementById('mySidenav2').style.width = '400px';
	}

	closeNav2() 
	{
		this.dom.getElementById('mySidenav2').style.width = '0';
	}
	
	cageSelectedNodes()
	{
		console.log('cageSelectedNodes');
		this.theoryGraph.cageNodes(undefined, undefined);
	}
	
	hideSelectedNodes(hidden: boolean)
	{
		this.theoryGraph.hideNodesById(undefined, hidden);
	}
	
	showAllManuallyHiddenNodes()
	{
		this.theoryGraph.showAllManuallyHiddenNodes();
	}
		
	clusterNodesColor()
	{
		this.theoryGraph.clusterUsingColor();
	}
	
	downloadGraphJSON()
	{
		this.download('graph_data.json', this.theoryGraph.graphToStringJSON(undefined, undefined));
	}

	download(filename: string, text: string) 
	{
		var element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
		element.setAttribute('download', filename);

		element.style.display = 'none';
		document.body.appendChild(element);

		element.click();

		document.body.removeChild(element);
	}
	
	generateIFrameGraph()
	{
		var generatedJson=this.theoryGraph.graphToIFrameString(undefined, undefined, undefined);
		
		var embeddingCode='<script>';
		embeddingCode+='function sendMessageToIFrameFromLocalStorage'+generatedJson.id+'(param){ var tmp=localStorage.getItem(param); document.getElementById(options.external.prefix+\''+generatedJson.id+'\').contentWindow.postMessage(tmp, \'*\'); }\r\n'+generatedJson.storage;
		embeddingCode+='<\/script>\r\n';
		embeddingCode+='<iframe style=\'width:100%;min-height:550px;\' src=\''+generatedJson.uri+'\' onLoad="sendMessageToIFrameFromLocalStorage'+generatedJson.id+'(\''+generatedJson.id+'\')" id=\''+generatedJson.id+'\'><\/iframe>';
		
		this.dom.getElementById<HTMLTextAreaElement>('uriTextarea').value='';
		this.dom.getElementById<HTMLTextAreaElement>('informationTextarea').value=embeddingCode;
	}
	
	generateHTMLGraph()
	{
		var generatedJson=this.theoryGraph.graphToLocalStorageString(undefined, undefined, undefined);
		
		this.dom.getElementById<HTMLTextAreaElement>('uriTextarea').value=generatedJson.uri;
		this.dom.getElementById<HTMLTextAreaElement>('informationTextarea').value=generatedJson.storage;
	}
	
	generateParameterGraph()
	{
		var generatedJson=this.theoryGraph.graphToURIParameterString(undefined, undefined);
		
		if(generatedJson.length > 220)
		{
			this.dom.getElementById<HTMLTextAreaElement>('uriTextarea').value='';
			this.dom.getElementById<HTMLTextAreaElement>('informationTextarea').value='';
			alert('Graph is too big to be embedded in URI. Select HTML-Embedding or IFrame-Embedding instead!');
		}
		else
		{
			this.dom.getElementById<HTMLTextAreaElement>('uriTextarea').value=generatedJson;
			this.dom.getElementById<HTMLTextAreaElement>('informationTextarea').value='';
		}
	}
	
	generateURIGraph()
	{
		this.dom.getElementById<HTMLTextAreaElement>('uriTextarea').value=window.location.href;
		this.dom.getElementById<HTMLTextAreaElement>('informationTextarea').value='';
	}
	

	addDataNode(data: DirtyNode, /*callback */) 
	{
		data.id = this.dom.getElementById<HTMLInputElement>('node-id').value;
		if(this.theoryGraph.isUniqueId(data.id)==false)
		{
			alert('The ID entered is already used, please enter an unique ID.');
			return;
		}
		
		data.label = this.dom.getElementById<HTMLInputElement>('node-label').value;
		data.url = this.dom.getElementById<HTMLInputElement>('node-url').value;
		data.mathml = this.dom.getElementById<HTMLInputElement>('node-mathml').value;
		data.style = this.dom.getElementById<HTMLInputElement>('node-style').value;
		this.clearPopUp();
		this.theoryGraph.addNode(data);
	}

	addDataEdge(data: DirtyEdge, /*callback */) 
	{
		var edge: DirtyEdge={};
		edge.id = this.dom.getElementById<HTMLInputElement>('edge-id').value;
		if(this.theoryGraph.isUniqueEdgeId(edge.id)==false)
		{
			alert('The ID entered is already used, please enter an unique ID.');
			return;
		}
		
		edge.label = this.dom.getElementById<HTMLInputElement>('edge-label').value;
		edge.url = this.dom.getElementById<HTMLInputElement>('edge-url').value;
		edge.style = this.dom.getElementById<HTMLInputElement>('edge-style').value;
		edge.from=data.from;
		edge.to=data.to;
		this.clearPopUp();
		this.theoryGraph.addEdge(edge);
	}

	editDataEdge(data: DirtyEdge, callback: (any: null) => void) 
	{
		var edge: DirtyEdge={};
		edge.id = this.dom.getElementById<HTMLInputElement>('edge-id').value;
		edge.label = this.dom.getElementById<HTMLInputElement>('edge-label').value;
		edge.url = this.dom.getElementById<HTMLInputElement>('edge-url').value;
		edge.style = this.dom.getElementById<HTMLInputElement>('edge-style').value;
		edge.from=data.from;
		edge.to=data.to;
		this.clearPopUp();
		this.theoryGraph.saveEdge(edge);
		callback(null);
	}

	saveDataNode(data: DirtyNode, callback: (any: null) => void) 
	{
		var node: DirtyNode={};
		node.id = this.dom.getElementById<HTMLInputElement>('node-id').value;
		node.label = this.dom.getElementById<HTMLInputElement>('node-label').value;
		node.url = this.dom.getElementById<HTMLInputElement>('node-url').value;
		node.mathml = this.dom.getElementById<HTMLInputElement>('node-mathml').value;
		node.style = this.dom.getElementById<HTMLInputElement>('node-style').value;
		this.clearPopUp();
		this.theoryGraph.saveNode(node);
		callback(null);
	}

	clearPopUp() 
	{
		this.dom.getElementById('saveButton').onclick = null;
		this.dom.getElementById('cancelButton').onclick = null;
		this.dom.getElementById('network-popUp').style.display = 'none';
		
		this.dom.getElementById('edge-saveButton').onclick = null;
		this.dom.getElementById('edge-cancelButton').onclick = null;
		this.dom.getElementById('network-edge-popUp').style.display = 'none';
	}

	cancelEdit(callback: (any: null) => void) 
	{
		this.clearPopUp();
		callback(null);
	}

	addNodeCallback(data: DirtyNode & {id: string, label: string}, callback: (any: null) => void) 
	{
		// filling in the popup DOM elements
		this.dom.getElementById('operation').innerHTML = 'Add Node';
		this.dom.getElementById<HTMLInputElement>('node-id').value = data.id;
		this.dom.getElementById<HTMLInputElement>('node-label').value = data.label;
		this.dom.getElementById<HTMLInputElement>('node-url').value = '';
		this.dom.getElementById<HTMLInputElement>('node-mathml').value = '';
		
		var html='';
		Object.keys(this.options.NODE_STYLES).forEach((key) => 
		{
		   html+='<option value="'+key+'">'+this.options.NODE_STYLES[key].alias+'</option>';
		});
		
		this.dom.getElementById('node-style').innerHTML = html;
		this.dom.getElementById('saveButton').onclick = this.addDataNode.bind(this, data, callback);
		this.dom.getElementById('cancelButton').onclick = this.clearPopUp.bind(this);
		this.dom.getElementById('network-popUp').style.display = 'block';
	}

	editNodeCallback(data: DirtyNode & {id: string}, callback: (any: null) => void) 
	{
		// filling in the popup DOM elements
		this.dom.getElementById<HTMLInputElement>('operation').innerHTML = 'Edit Node';
		this.dom.getElementById<HTMLInputElement>('node-id').value = data.id;
		this.dom.getElementById<HTMLInputElement>('node-id').disabled=true;
		this.dom.getElementById<HTMLInputElement>('node-label').value = (typeof data.label !='undefined') ? data.label : '';
		this.dom.getElementById<HTMLInputElement>('node-url').value = (typeof data.url !='undefined') ? data.url : '';
		this.dom.getElementById<HTMLInputElement>('node-mathml').value = (typeof data.mathml !='undefined') ? data.mathml : '';
		
		var html='';
		Object.keys(this.options.NODE_STYLES).forEach((key) => 
		{
		   html+='<option value="'+key+'">'+this.options.NODE_STYLES[key].alias+'</option>';
		});
		
		this.dom.getElementById('node-style').innerHTML = html;
		
		if(typeof data.style !='undefined' )
		{
			this.dom.getElementById<HTMLInputElement>('node-style').value = data.style;
		}
		
		this.dom.getElementById('saveButton').onclick = this.saveDataNode.bind(this, data, callback);
		this.dom.getElementById('cancelButton').onclick = this.cancelEdit.bind(this, callback);
		this.dom.getElementById('network-popUp').style.display = 'block';
	}

	private addEdgeCallbackHelper(data: DirtyEdge, callback: (any: null) => void)
	{
		// filling in the popup DOM elements
		this.dom.getElementById('edge-operation').innerHTML = 'Add Edge';
		this.dom.getElementById<HTMLInputElement>('edge-id').value = 'edge_' + Math.random().toString(36).substr(2, 9);
		this.dom.getElementById<HTMLInputElement>('edge-label').value = '';
		this.dom.getElementById<HTMLInputElement>('edge-url').value = '';
		
		var html='';
		Object.keys(this.options.ARROW_STYLES).forEach((key) =>
		{
		   html+='<option value="'+key+'">'+this.options.ARROW_STYLES[key].alias+'</option>';
		});
		
		this.dom.getElementById('edge-style').innerHTML = html;
		this.dom.getElementById('edge-saveButton').onclick = this.addDataEdge.bind(this, data, callback);
		this.dom.getElementById('edge-cancelButton').onclick = this.clearPopUp.bind(this);
		this.dom.getElementById('network-edge-popUp').style.display = 'block';
	}

	addEdgeCallback(data: DirtyEdge, callback: (any: null) => void) 
	{
		if (data.from == data.to) 
		{
			var r = confirm('Do you want to connect the node to itself?');
			if (r == true) 
			{
				this.addEdgeCallbackHelper(data, callback);
			}
		}
		else 
		{
			this.addEdgeCallbackHelper(data, callback);
		}
	}

	deleteEdgeCallback(data: {edges: string[]}, callback: (any: null) => void) 
	{
		console.log(data);
		this.theoryGraph.deleteEdges(data['edges']);
	}

	deleteNodeCallback(data: {nodes: string[], edges?: string[]}, callback: (any: null) => void) 
	{
		console.log(data);
		this.theoryGraph.deleteNodes(data['nodes'],data['edges']);
	}

	private editEdgeCallbackHelper(data: DirtyEdge & {id: string}, callback: (any: null) => void) 
	{
		// filling in the popup DOM elements
		this.dom.getElementById('edge-operation').innerHTML = 'Edit Edge';
		this.dom.getElementById<HTMLInputElement>('edge-id').value = data.id;
		this.dom.getElementById<HTMLInputElement>('edge-label').value = (typeof data.label !='undefined') ? data.label : '';
		this.dom.getElementById<HTMLInputElement>('edge-url').value = (typeof data.url !='undefined') ? data.url : '';

		var html='';
		Object.keys(this.options.ARROW_STYLES).forEach((key) => 
		{
		   html+='<option value="'+key+'">'+this.options.ARROW_STYLES[key].alias+'</option>';
		});
		
		this.dom.getElementById('edge-style').innerHTML = html;
		this.dom.getElementById('edge-saveButton').onclick = this.editDataEdge.bind(this, data, callback);
		this.dom.getElementById('edge-cancelButton').onclick = this.clearPopUp.bind(this);
		this.dom.getElementById('network-edge-popUp').style.display = 'block';
	}

	editEdgeCallback(data: DirtyEdge & {id: string}, callback: (any: null) => void) 
	{
		if (data.from == data.to) 
		{
			var r = confirm('Do you want to connect the node to itself?');
			if (r == true) 
			{
				this.editEdgeCallbackHelper(data, callback);
			}
		}
		else 
		{
			this.editEdgeCallbackHelper(data, callback);
		}
	}
}
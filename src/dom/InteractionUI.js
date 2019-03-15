"use strict";
exports.__esModule = true;
require("jqueryui");
var images_1 = require("../css/images");
var InteractionUI = /** @class */ (function () {
    function InteractionUI(dom, theoryGraph, tgDomListener, statusLogger, options, actionHistory, wrapperIn) {
        var _this = this;
        this.dom = dom;
        this.theoryGraph = theoryGraph;
        this.tgDomListener = tgDomListener;
        this.statusLogger = statusLogger;
        this.options = options;
        this.actionHistory = actionHistory;
        this.wrapperIn = wrapperIn;
        this.handleJson = this.handleJson.bind(this);
        this.options.THEORY_GRAPH_OPTIONS.manipulation = {
            addNode: this.addNodeCallback.bind(this),
            editNode: this.editNodeCallback.bind(this),
            deleteNode: this.deleteNodeCallback.bind(this),
            addEdge: this.addEdgeCallback.bind(this),
            editEdge: this.editEdgeCallback.bind(this),
            deleteEdge: this.deleteEdgeCallback.bind(this)
        };
        this.helpDialog = this.dom.$$('helpDialog');
        this.helpDialog
            .dialog({ autoOpen: false })
            .on('click', function () {
            _this.helpDialog.dialog('open');
        });
        /*
        this.dom.$$("shareIcons").jsSocials(
        {
            showLabel: false,
            showCount: false,
            shares: ["email", "twitter", "facebook", "googleplus", "linkedin", "pinterest", "stumbleupon", "whatsapp","telegram"]
        });
        */
        this.addColors();
        this.generateCustomSideMenu();
        var viewOnlyMode = this.options.preferences.viewOnlyMode;
        if (typeof viewOnlyMode != 'undefined' && viewOnlyMode == true) {
            this.dom.getElementById('menuButtonsDiv').style.display = 'none';
        }
        var jsonLoader = this.dom.getElementById('jsonLoader');
        jsonLoader.addEventListener('change', this.handleJson, false);
        this.addDOMHandler();
    }
    InteractionUI.prototype.destroy = function () {
        this.helpDialog.dialog('destroy');
        this.dom.getElementById('jsonLoader').removeEventListener('change', this.handleJson);
    };
    InteractionUI.prototype.addDOMHandler = function () {
        var _this = this;
        this.dom.getElementById('leftMenuButton').addEventListener('click', function () { return _this.openNav(); }, false);
        this.dom.getElementById('rightMenuButton').addEventListener('click', function () { _this.openNav2(); }, false);
        this.dom.getElementById('closeNav2').addEventListener('click', function () { _this.closeNav2(); }, false);
        this.dom.getElementById('closeNav').addEventListener('click', function () { _this.closeNav(); }, false);
        this.dom.getElementById('undoButton').addEventListener('click', function () { _this.actionHistory.undoLastAction(); }, false);
        this.dom.getElementById('redoButton').addEventListener('click', function () { _this.actionHistory.redoLastAction(); }, false);
        this.dom.getElementById('selectionModeButton').addEventListener('click', function () { _this.switchSelectionMode(); }, false);
        this.dom.getElementById('downloadButton').addEventListener('click', function () { _this.downloadGraph(); }, false);
        this.dom.getElementById('clusterButton').addEventListener('click', function () { _this.clusterSelectedNodes(); }, false);
        this.dom.getElementById('cageButton').addEventListener('click', function () { _this.cageSelectedNodes(); }, false);
        this.dom.getElementById('manualHideButton').addEventListener('click', function () { _this.hideSelectedNodes(true); }, false);
        this.dom.getElementById('manualShowButton').addEventListener('click', function () { _this.showAllManuallyHiddenNodes(); }, false);
        this.dom.getElementById('helpButton').addEventListener('click', function () { }, false);
        this.dom.getElementById('selectNodes').addEventListener('click', function () { _this.selectNodes(); }, false);
        this.dom.getElementById('clusterNodesColor').addEventListener('click', function () { _this.clusterNodesColor(); }, false);
        this.dom.getElementById('iframeRadio').addEventListener('click', function () { _this.generateIFrameGraph(); }, false);
        this.dom.getElementById('htmlRadio').addEventListener('click', function () { _this.generateHTMLGraph(); }, false);
        this.dom.getElementById('parameterRadio').addEventListener('click', function () { _this.generateParameterGraph(); }, false);
        this.dom.getElementById('uriRadio').addEventListener('click', function () { _this.generateURIGraph(); }, false);
        this.dom.getElementById('jsonRadio').addEventListener('click', function () { _this.downloadGraphJSON(); }, false);
        this.dom.getElementById('nodeSpacingBox').addEventListener('change', function () { _this.changeMethod(); }, false);
        this.dom.getElementById('layoutBox').addEventListener('change', function (e) { _this.changeMethod(e.target.value); }, false);
        //document.getElementById(options.external.prefix+'').addEventListener('click',function() {  },false);
        //document.getElementById(options.external.prefix+'').addEventListener('click',function() {  },false);
    };
    InteractionUI.prototype.generateCustomSideMenu = function () {
        var html = '';
        for (var i = 0; i < this.options.GRAPH_TYPES.length; i++) {
            html += '<li data-action="' + this.options.GRAPH_TYPES[i].id + '" title="' + this.options.GRAPH_TYPES[i].tooltip + '">' + this.options.GRAPH_TYPES[i].menuText + '</li>';
        }
        html += '<li data-action="close" title="Hides this menu">Hide</li>';
        this.dom.getElementById('side-menu').innerHTML = html;
    };
    InteractionUI.prototype.addColors = function () {
        var mainEle = this.dom.getElementById('colorPicker');
        var colorArray = this.options.colorizingNodesArray;
        for (var i = 0; i < colorArray.length; i++) {
            var div = document.createElement('div');
            var boundFunc = this.colorizeSelectedNodes.bind(this, colorArray[i]);
            div.addEventListener('click', boundFunc, false);
            div.title = 'Colorize all selected nodes';
            div.classList.add('colorRect');
            div.classList.add('tgview');
            div.style.cssText = 'background-color:' + colorArray[i];
            mainEle.appendChild(div);
        }
    };
    InteractionUI.prototype.generateEdgesNodesHideDiv = function () {
        var _this = this;
        var usedEdgeTypes = this.theoryGraph.getUsedEdgeTypes();
        var mainEle = this.dom.getElementById('edgesShowHideDiv');
        var strong = document.createElement('strong');
        strong.innerHTML = 'Hide/Show Edges';
        mainEle.appendChild(strong);
        mainEle.appendChild(document.createElement('br'));
        for (var i = 0; i < usedEdgeTypes.length; i++) {
            var alias = (typeof this.options.ARROW_STYLES[usedEdgeTypes[i]] === 'undefined' ? this.options.ARROW_STYLES[usedEdgeTypes[i].replace('graph', '')].alias : this.options.ARROW_STYLES[usedEdgeTypes[i]].alias);
            var img = document.createElement('img');
            var boundFunc = this.theoryGraph.selectEdgesByType.bind(this.theoryGraph, usedEdgeTypes[i]);
            img.addEventListener('click', boundFunc, false);
            img.src = images_1.selectPng;
            img.width = 14;
            img.style.cssText = 'width:14px';
            img.title = 'Select all ' + alias;
            mainEle.appendChild(img);
            var input = document.createElement('input');
            input.type = 'checkbox';
            input.id = 'edgesCheckbox_' + i;
            input.value = usedEdgeTypes[i];
            if (usedEdgeTypes[i] !== 'meta' && usedEdgeTypes[i] !== 'graphmeta') {
                input.checked = true;
            }
            input.addEventListener('click', function (e) {
                var t = e.target;
                _this.hideEdges(t.value, !t.checked);
            }, false);
            mainEle.appendChild(input);
            var label = document.createElement('label');
            label.setAttribute('for', 'edgesCheckbox_' + i);
            label.innerHTML = 'Show ' + alias;
            mainEle.appendChild(label);
            mainEle.appendChild(document.createElement('br'));
        }
        var usedNodeTypes = this.theoryGraph.getUsedNodeTypes();
        mainEle.appendChild(document.createElement('br'));
        var strong = document.createElement('strong');
        strong.innerHTML = 'Hide/Show Nodes';
        mainEle.appendChild(strong);
        mainEle.appendChild(document.createElement('br'));
        for (var i = 0; i < usedNodeTypes.length; i++) {
            var alias = (typeof this.options.NODE_STYLES[usedNodeTypes[i]] === 'undefined' ? this.options.NODE_STYLES[usedNodeTypes[i].replace('graph', '')].alias : this.options.NODE_STYLES[usedNodeTypes[i]].alias);
            var img = document.createElement('img');
            var boundFunc = this.theoryGraph.selectNodesByType.bind(this.theoryGraph, usedNodeTypes[i]);
            img.addEventListener('click', boundFunc, false);
            img.src = images_1.selectPng;
            img.width = 14;
            img.style.cssText = 'width:14px';
            img.title = 'Select all ' + alias;
            mainEle.appendChild(img);
            var input = document.createElement('input');
            input.type = 'checkbox';
            input.id = 'nodesCheckbox_' + i;
            input.value = usedNodeTypes[i];
            input.checked = true;
            input.addEventListener('click', function (e) {
                var t = e.target;
                _this.hideNodes(t.value, !t.checked);
            }, false);
            mainEle.appendChild(input);
            var label = document.createElement('label');
            label.setAttribute('for', 'nodesCheckbox_' + i);
            label.innerHTML = 'Show ' + alias;
            mainEle.appendChild(label);
            if (i != usedNodeTypes.length - 1) {
                mainEle.appendChild(document.createElement('br'));
            }
        }
    };
    InteractionUI.prototype.hideEdges = function (type, hide) {
        this.theoryGraph.hideEdges(type, hide);
    };
    InteractionUI.prototype.hideNodes = function (type, hide) {
        this.theoryGraph.hideNodes(type, hide);
    };
    InteractionUI.prototype.selectNodes = function () {
        // TODO: Handle when prompt is cancelled
        this.theoryGraph.selectNodesWithIdLike(prompt('Please enter a name which should be searched for!', 'node_name'));
        //theoryGraph.focusOnNodes();
    };
    InteractionUI.prototype.downloadGraph = function () {
        this.statusLogger.setStatusText('Downloading Image...');
        this.theoryGraph.downloadCanvasAsImage(this.dom.getElementById('downloadButton'));
    };
    InteractionUI.prototype.switchSelectionMode = function () {
        this.tgDomListener.switchSelectionMode();
    };
    InteractionUI.prototype.clusterSelectedNodes = function () {
        // TODO: Handle prompt being cancelled
        this.statusLogger.setStatusText('Clustering Nodes...');
        this.theoryGraph.cluster(undefined, prompt('Please choose a name for the cluster', ''));
        this.statusLogger.setStatusText('');
    };
    InteractionUI.prototype.colorizeSelectedNodes = function (color) {
        this.theoryGraph.colorizeNodes(undefined, color);
    };
    InteractionUI.prototype.changeMethod = function (idx) {
        var iidx = idx ? parseInt(idx, 10) : -1;
        this.theoryGraph.manualFocus = false;
        this.statusLogger.setStatusText('Relayouting graph...');
        this.statusLogger.setStatusCursor('wait');
        if (typeof idx !== 'undefined') {
            if (iidx == 1 || iidx == 2 || iidx == 4) {
                this.options.THEORY_GRAPH_OPTIONS.layout = { ownLayoutIdx: iidx };
            }
            else if (iidx == 0) {
                this.options.THEORY_GRAPH_OPTIONS.layout = { ownLayoutIdx: 0, hierarchical: { sortMethod: 'directed', direction: 'LR' } };
            }
            else if (iidx == 3) {
                this.theoryGraph.manualFocus = true;
                this.statusLogger.setStatusCursor('wait');
                return;
            }
        }
        this.wrapperIn.createNewGraph();
    };
    InteractionUI.prototype.handleJson = function (e) {
        var _this = this;
        var reader = new FileReader();
        reader.onload = function (event) {
            var result = event.target.result;
            console.log(result);
            _this.theoryGraph.loadJSONGraph(JSON.parse(result));
        };
        reader.readAsText(e.target.files[0]);
    };
    InteractionUI.prototype.openNav = function () {
        this.dom.getElementById('mySidenav').style.width = '400px';
    };
    InteractionUI.prototype.closeNav = function () {
        this.dom.getElementById('mySidenav').style.width = '0';
    };
    InteractionUI.prototype.openNav2 = function () {
        this.dom.getElementById('mySidenav2').style.width = '400px';
    };
    InteractionUI.prototype.closeNav2 = function () {
        this.dom.getElementById('mySidenav2').style.width = '0';
    };
    InteractionUI.prototype.cageSelectedNodes = function () {
        console.log('cageSelectedNodes');
        this.theoryGraph.cageNodes(undefined, undefined);
    };
    InteractionUI.prototype.hideSelectedNodes = function (hidden) {
        this.theoryGraph.hideNodesById(undefined, hidden);
    };
    InteractionUI.prototype.showAllManuallyHiddenNodes = function () {
        this.theoryGraph.showAllManuallyHiddenNodes();
    };
    InteractionUI.prototype.clusterNodesColor = function () {
        this.theoryGraph.clusterUsingColor();
    };
    InteractionUI.prototype.downloadGraphJSON = function () {
        this.download('graph_data.json', this.theoryGraph.graphToStringJSON(undefined, undefined));
    };
    InteractionUI.prototype.download = function (filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };
    InteractionUI.prototype.generateIFrameGraph = function () {
        var generatedJson = this.theoryGraph.graphToIFrameString(undefined, undefined, undefined);
        var embeddingCode = '<script>';
        embeddingCode += 'function sendMessageToIFrameFromLocalStorage' + generatedJson.id + '(param){ var tmp=localStorage.getItem(param); document.getElementById(options.external.prefix+\'' + generatedJson.id + '\').contentWindow.postMessage(tmp, \'*\'); }\r\n' + generatedJson.storage;
        embeddingCode += '<\/script>\r\n';
        embeddingCode += '<iframe style=\'width:100%;min-height:550px;\' src=\'' + generatedJson.uri + '\' onLoad="sendMessageToIFrameFromLocalStorage' + generatedJson.id + '(\'' + generatedJson.id + '\')" id=\'' + generatedJson.id + '\'><\/iframe>';
        this.dom.getElementById('uriTextarea').value = '';
        this.dom.getElementById('informationTextarea').value = embeddingCode;
    };
    InteractionUI.prototype.generateHTMLGraph = function () {
        var generatedJson = this.theoryGraph.graphToLocalStorageString(undefined, undefined, undefined);
        this.dom.getElementById('uriTextarea').value = generatedJson.uri;
        this.dom.getElementById('informationTextarea').value = generatedJson.storage;
    };
    InteractionUI.prototype.generateParameterGraph = function () {
        var generatedJson = this.theoryGraph.graphToURIParameterString(undefined, undefined);
        if (generatedJson.length > 220) {
            this.dom.getElementById('uriTextarea').value = '';
            this.dom.getElementById('informationTextarea').value = '';
            alert('Graph is too big to be embedded in URI. Select HTML-Embedding or IFrame-Embedding instead!');
        }
        else {
            this.dom.getElementById('uriTextarea').value = generatedJson;
            this.dom.getElementById('informationTextarea').value = '';
        }
    };
    InteractionUI.prototype.generateURIGraph = function () {
        this.dom.getElementById('uriTextarea').value = window.location.href;
        this.dom.getElementById('informationTextarea').value = '';
    };
    InteractionUI.prototype.addDataNode = function (data) {
        data.id = this.dom.getElementById('node-id').value;
        if (this.theoryGraph.isUniqueId(data.id) == false) {
            alert('The ID entered is already used, please enter an unique ID.');
            return;
        }
        data.label = this.dom.getElementById('node-label').value;
        data.url = this.dom.getElementById('node-url').value;
        data.mathml = this.dom.getElementById('node-mathml').value;
        data.style = this.dom.getElementById('node-style').value;
        this.clearPopUp();
        this.theoryGraph.addNode(data);
    };
    InteractionUI.prototype.addDataEdge = function (data) {
        var edge = {};
        edge.id = this.dom.getElementById('edge-id').value;
        if (this.theoryGraph.isUniqueEdgeId(edge.id) == false) {
            alert('The ID entered is already used, please enter an unique ID.');
            return;
        }
        edge.label = this.dom.getElementById('edge-label').value;
        edge.url = this.dom.getElementById('edge-url').value;
        edge.style = this.dom.getElementById('edge-style').value;
        edge.from = data.from;
        edge.to = data.to;
        this.clearPopUp();
        this.theoryGraph.addEdge(edge);
    };
    InteractionUI.prototype.editDataEdge = function (data, callback) {
        var edge = {};
        edge.id = this.dom.getElementById('edge-id').value;
        edge.label = this.dom.getElementById('edge-label').value;
        edge.url = this.dom.getElementById('edge-url').value;
        edge.style = this.dom.getElementById('edge-style').value;
        edge.from = data.from;
        edge.to = data.to;
        this.clearPopUp();
        this.theoryGraph.saveEdge(edge);
        callback(null);
    };
    InteractionUI.prototype.saveDataNode = function (data, callback) {
        var node = {};
        node.id = this.dom.getElementById('node-id').value;
        node.label = this.dom.getElementById('node-label').value;
        node.url = this.dom.getElementById('node-url').value;
        node.mathml = this.dom.getElementById('node-mathml').value;
        node.style = this.dom.getElementById('node-style').value;
        this.clearPopUp();
        this.theoryGraph.saveNode(node);
        callback(null);
    };
    InteractionUI.prototype.clearPopUp = function () {
        this.dom.getElementById('saveButton').onclick = null;
        this.dom.getElementById('cancelButton').onclick = null;
        this.dom.getElementById('network-popUp').style.display = 'none';
        this.dom.getElementById('edge-saveButton').onclick = null;
        this.dom.getElementById('edge-cancelButton').onclick = null;
        this.dom.getElementById('network-edge-popUp').style.display = 'none';
    };
    InteractionUI.prototype.cancelEdit = function (callback) {
        this.clearPopUp();
        callback(null);
    };
    InteractionUI.prototype.addNodeCallback = function (data, callback) {
        var _this = this;
        // filling in the popup DOM elements
        this.dom.getElementById('operation').innerHTML = 'Add Node';
        this.dom.getElementById('node-id').value = data.id;
        this.dom.getElementById('node-label').value = data.label;
        this.dom.getElementById('node-url').value = '';
        this.dom.getElementById('node-mathml').value = '';
        var html = '';
        Object.keys(this.options.NODE_STYLES).forEach(function (key) {
            html += '<option value="' + key + '">' + _this.options.NODE_STYLES[key].alias + '</option>';
        });
        this.dom.getElementById('node-style').innerHTML = html;
        this.dom.getElementById('saveButton').onclick = this.addDataNode.bind(this, data, callback);
        this.dom.getElementById('cancelButton').onclick = this.clearPopUp.bind(this);
        this.dom.getElementById('network-popUp').style.display = 'block';
    };
    InteractionUI.prototype.editNodeCallback = function (data, callback) {
        var _this = this;
        // filling in the popup DOM elements
        this.dom.getElementById('operation').innerHTML = 'Edit Node';
        this.dom.getElementById('node-id').value = data.id;
        this.dom.getElementById('node-id').disabled = true;
        this.dom.getElementById('node-label').value = (typeof data.label != 'undefined') ? data.label : '';
        this.dom.getElementById('node-url').value = (typeof data.url != 'undefined') ? data.url : '';
        this.dom.getElementById('node-mathml').value = (typeof data.mathml != 'undefined') ? data.mathml : '';
        var html = '';
        Object.keys(this.options.NODE_STYLES).forEach(function (key) {
            html += '<option value="' + key + '">' + _this.options.NODE_STYLES[key].alias + '</option>';
        });
        this.dom.getElementById('node-style').innerHTML = html;
        if (typeof data.style != 'undefined') {
            this.dom.getElementById('node-style').value = data.style;
        }
        this.dom.getElementById('saveButton').onclick = this.saveDataNode.bind(this, data, callback);
        this.dom.getElementById('cancelButton').onclick = this.cancelEdit.bind(this, callback);
        this.dom.getElementById('network-popUp').style.display = 'block';
    };
    InteractionUI.prototype.addEdgeCallbackHelper = function (data, callback) {
        var _this = this;
        // filling in the popup DOM elements
        this.dom.getElementById('edge-operation').innerHTML = 'Add Edge';
        this.dom.getElementById('edge-id').value = 'edge_' + Math.random().toString(36).substr(2, 9);
        this.dom.getElementById('edge-label').value = '';
        this.dom.getElementById('edge-url').value = '';
        var html = '';
        Object.keys(this.options.ARROW_STYLES).forEach(function (key) {
            html += '<option value="' + key + '">' + _this.options.ARROW_STYLES[key].alias + '</option>';
        });
        this.dom.getElementById('edge-style').innerHTML = html;
        this.dom.getElementById('edge-saveButton').onclick = this.addDataEdge.bind(this, data, callback);
        this.dom.getElementById('edge-cancelButton').onclick = this.clearPopUp.bind(this);
        this.dom.getElementById('network-edge-popUp').style.display = 'block';
    };
    InteractionUI.prototype.addEdgeCallback = function (data, callback) {
        if (data.from == data.to) {
            var r = confirm('Do you want to connect the node to itself?');
            if (r == true) {
                this.addEdgeCallbackHelper(data, callback);
            }
        }
        else {
            this.addEdgeCallbackHelper(data, callback);
        }
    };
    InteractionUI.prototype.deleteEdgeCallback = function (data, callback) {
        console.log(data);
        this.theoryGraph.deleteEdges(data['edges']);
    };
    InteractionUI.prototype.deleteNodeCallback = function (data, callback) {
        console.log(data);
        this.theoryGraph.deleteNodes(data['nodes'], data['edges']);
    };
    InteractionUI.prototype.editEdgeCallbackHelper = function (data, callback) {
        var _this = this;
        // filling in the popup DOM elements
        this.dom.getElementById('edge-operation').innerHTML = 'Edit Edge';
        this.dom.getElementById('edge-id').value = data.id;
        this.dom.getElementById('edge-label').value = (typeof data.label != 'undefined') ? data.label : '';
        this.dom.getElementById('edge-url').value = (typeof data.url != 'undefined') ? data.url : '';
        var html = '';
        Object.keys(this.options.ARROW_STYLES).forEach(function (key) {
            html += '<option value="' + key + '">' + _this.options.ARROW_STYLES[key].alias + '</option>';
        });
        this.dom.getElementById('edge-style').innerHTML = html;
        this.dom.getElementById('edge-saveButton').onclick = this.editDataEdge.bind(this, data, callback);
        this.dom.getElementById('edge-cancelButton').onclick = this.clearPopUp.bind(this);
        this.dom.getElementById('network-edge-popUp').style.display = 'block';
    };
    InteractionUI.prototype.editEdgeCallback = function (data, callback) {
        if (data.from == data.to) {
            var r = confirm('Do you want to connect the node to itself?');
            if (r == true) {
                this.editEdgeCallbackHelper(data, callback);
            }
        }
        else {
            this.editEdgeCallbackHelper(data, callback);
        }
    };
    return InteractionUI;
}());
exports["default"] = InteractionUI;

function Options(external)
{
	if(typeof external.serverBaseURL !== "undefined")
	{
		this.serverBaseURL=this.external.serverBaseURL;
	}
	else
	{
		this.serverBaseURL = "/";
	}
	
	this.serverUrl =
	  typeof serverBaseURL == "undefined" || this.serverBaseURL == undefined
		? window.location.protocol == "file:"
		  ? "/"
		  : "/mh/mmt/"
		: this.serverBaseURL;
	if (
	  window.location.hostname === "localhost" ||
	  window.location.hostname === "127.0.0.1" ||
	  window.location.hostname === ""
	)
	
	if(typeof external.serverUrl !== "undefined")
	{
		this.serverUrl=this.external.serverUrl;
	}
	
	if(typeof external.isMathhub == "undefined" || external.isMathhub == false)
	{
		this.serverUrl = "/";
	}

	// URL for getting menu-entries in side-menu
	this.menuEntriesURL = this.serverUrl + ":jgraph/menu?id=";

	// URL parts for getting graphdata, construction looks like:
	// graphDataURL + graphDataURLTypeParameterName + concreteTypeValue + "&" + graphDataURLDataParameterName + concreteGraphdataValue
	this.graphDataURL = this.serverUrl + ":jgraph/json?";
	// For Backend
	this.graphDataURLTypeParameterName = "key";
	this.graphDataURLDataParameterName = "uri";
	// For TGView
	this.graphDataURLTypeParameterNameTGView = "type";
	this.graphDataURLDataParameterNameTGView = "graphdata";
	this.graphDataURLHighlightParameterNameTGView = "highlight";
	this.graphDataURLSourceParameterNameTGView = "source";
	this.graphDataURLDataSourceParameterNameTGView = "uri";

	this.external=external;

	if (typeof this.external == "undefined")
	{
		this.external={};
	}
	
	if (typeof this.external.viewOnlyMode == "undefined")
	{
		this.external.viewOnlyMode=false;
	}
	
	if (typeof this.external.graphdata == "undefined")
	{
		this.external.graphdata=getParameterByName(this.graphDataURLDataParameterNameTGView);
	}

	if (typeof this.external.type == "undefined")
	{
		this.external.type=getParameterByName(this.graphDataURLTypeParameterNameTGView);
	}
	
	if (typeof this.external.isMathhub == "undefined")
	{
		this.external.isMathhub=true;
	}
	
	if (typeof this.external.highlight == "undefined")
	{
		this.external.highlight=getParameterByName(this.graphDataURLHighlightParameterNameTGView);
	}
	
	if (typeof this.external.source == "undefined")
	{
		this.external.source=getParameterByName(this.graphDataURLSourceParameterNameTGView);
	}
	
	
	console.log(this);
	
	// Colors to select for colorizing nodes in graph
	this.colorizingNodesArray = [
	  "#CCCCFF",
	  "#FFFFCC",
	  "#FFCC99",
	  "#CCFFCC",
	  "#DDDDDD",
	  "#FFCCCC"
	];

	// Color to used for highlighting nodes given by URI parameter
	this.highlightColorByURI = "#ff8080";

	this.LEGEND_PANEL_OPTIONS = 
	{
		physics: 
		{	
			enabled: false,
			stabilization: false
		},
		interaction:
		{
			dragNodes:false,
			dragView: false,
			hideEdgesOnDrag: false,
			hideNodesOnDrag: false,
			hover: false,
			hoverConnectedEdges: false,
			keyboard: {
			  enabled: false,
			  speed: {x: 10, y: 10, zoom: 0.02},
			  bindToWindow: true
			},
			multiselect: false,
			navigationButtons: false,
			selectable: false,
			selectConnectedEdges: false,
			tooltipDelay: 300,
			zoomView: false
		},
		nodes: 
		{
			physics:false,
			shapeProperties: 
			{
				useImageSize: true,  // only for image and circularImage shapes
				useBorderWithImage: true  // only for image shape
			}
		},
		edges: 
		{
			smooth: 
			{
				enabled: true,
				type: "straightCross",
				roundness: 0.3
			}
		},
	};

	// Options for theory-graph in general
	this.THEORY_GRAPH_OPTIONS = {
	  physics: {
		enabled: false,
		stabilization: true,
		solver: "barnesHut",
		barnesHut: {
		  avoidOverlap: 1
		},
		stabilization: {
		  enabled: true,
		  iterations: 5 // maximum number of iteration to stabilize
		}
	  },
	  interaction: {
		multiselect: true
	  },
	  nodes: {
		physics: false,
		shapeProperties: {
		  useImageSize: true, // only for image and circularImage shapes
		  useBorderWithImage: true // only for image shape
		}
	  },
	  edges: {
		smooth: {
		  enabled: true,
		  type: "straightCross",
		  roundness: 0.3
		}
	  }
	  /*
	  ,
	  manipulation:
	  {
		addNode: addNodeCallback,
		editNode: editNodeCallback,
		deleteNode: deleteNodeCallback,
		addEdge: addEdgeCallback,
		editEdge: editEdgeCallback,
		deleteEdge: deleteEdgeCallback
	  }
	  
	  /*
		/*layout: 
		{
			hierarchical: 
			{
				sortMethod: "directed",
				direction: "LR"
			}
		}*/
	};

	// All available arrow styles
	this.ARROW_STYLES = {
	  include: {
		color: "#cccccc",
		colorHighlight: "#cccccc",
		colorHover: "#cccccc",
		dashes: false,
		circle: false,
		directed: true,
		smoothEdge: true,
		width: 1,
		alias: "Include-Edges"
	  },
	  modelinclude: {
		color: "black",
		colorHighlight: "black",
		colorHover: "black",
		dashes: false,
		circle: false,
		directed: false,
		smoothEdge: false,
		width: 1,
		alias: "Model Includes-Edges"
	  },
	  meta: {
		color: "green",
		colorHighlight: "green",
		colorHover: "green",
		dashes: true,
		circle: true,
		directed: true,
		smoothEdge: true,
		width: 1,
		alias: "Meta-Edges"
	  },
	  alignment: {
		color: "red",
		colorHighlight: "red",
		colorHover: "red",
		dashes: true,
		circle: false,
		directed: false,
		smoothEdge: true,
		width: 1,
		alias: "Alignment-Edges"
	  },
	  view: {
		color: "black",
		colorHighlight: "black",
		colorHover: "black",
		dashes: false,
		circle: false,
		directed: true,
		smoothEdge: true,
		width: 1,
		alias: "View-Edges"
	  },
	  structure: {
		color: "#cccccc",
		colorHighlight: "#cccccc",
		colorHover: "#cccccc",
		dashes: true,
		circle: false,
		directed: true,
		smoothEdge: true,
		width: 1,
		alias: "Structure-Edges"
	  }
	};

	// All available node styles
	this.NODE_STYLES = {
	  model: {
		shape: "square",
		color: "#DDDDDD",
		colorBorder: "#222222",
		colorHighlightBorder: "#444444",
		colorHighlight: "#EEEEEE",
		dashes: false,
		alias: "Model-Nodes"
	  },
	  border: {
		shape: "circle",
		color: "#E8E8E8",
		colorBorder: "#D8D8D8",
		colorHighlightBorder: "#A8A8A8",
		colorHighlight: "#D8D8D8",
		dashes: false,
		alias: "Border-Nodes"
	  },
	  theory: {
		shape: "circle",
		color: "#D2E5FF",
		colorBorder: "#2B7CE9",
		colorHighlightBorder: "#2B7CE9",
		colorHighlight: "#D2E5FF",
		dashes: false,
		alias: "Theory-Nodes"
	  },
	  boundarycondition: {
		shape: "square",
		color: "#EEEEEE",
		colorBorder: "#DDDDDD",
		colorHighlightBorder: "#CCCCCC",
		colorHighlight: "#DDDDDD",
		dashes: true,
		alias: "Boundary-Condition-Nodes"
	  }
	};

	// All available graph types (for MMT menu)
	this.GRAPH_TYPES = [
	  {
		id: "thgraph",
		menuText: "Th. Graph",
		tooltip: ""
	  },
	  {
		id: "pgraph",
		menuText: "P Graph",
		tooltip: ""
	  },
	  {
		id: "docgraph",
		menuText: "Doc Graph",
		tooltip: ""
	  },
	  {
		id: "archivegraph",
		menuText: "Archive Graph",
		tooltip: ""
	  },
	  {
		id: "mpd",
		menuText: "MPD Graph",
		tooltip: "MPD Graph-Viewer"
	  }
	];
}

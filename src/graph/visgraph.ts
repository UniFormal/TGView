import { IGraphJSONNode, IGraphJSONEdge } from "../graph";
import { INodeStyle, IArrowStyle } from "../Configuration";

declare module 'vis' {
	interface NetworkNodes {
		[index: string]: CleanNode & Position
	}
	interface Network {
		getConnectedNodes(nodeOrEdgeId: IdType, direction: string): IdType[];
		body: { nodes: NetworkNodes };
		canvas: {frame: {canvas: HTMLCanvasElement}};
		clustering: Network;
	}
	interface DataSet<T extends DataItem | DataGroup | Node | Edge> {
		update(data: Partial<T> | Partial<T>[], senderId?: IdType): IdType[];
	}
}

export interface IDirtyGraph {
	nodes?: DirtyNode[],
	edges?: DirtyEdge[],
}

export type DirtyNode = Partial<CleanNode>;
export type CleanNode = vis.Node & IGraphJSONNode & NodeRuntimeProps;

interface NodeRuntimeProps {
	id: string;

	// TODO: Figure this out
	options: Partial<CleanNode>,

	membership: number;

	widthConstraint?: {
		minimum: number;
		maximum: number;
	}
}

/**
 * Cleans up a user-provided node and applies the appropriate style
 * @param nodeIn 
 * @param NODE_STYLES 
 */
export function cleanNode(nodeIn: DirtyNode, NODE_STYLES: Record<string, INodeStyle>): CleanNode {
	const node: CleanNode = {
		// all the properties with constant defaults
		style: 'no-style-provided',
		shape: 'square',
		label: '',
		previewhtml: '',
		mathml: '',
		url: '',
		childsURL: '',

		membership: 0,

		options: {
			hidden: false,
		},

		// the input
		...nodeIn,

		// all the fields with a default based on the input
		id: (nodeIn.id !== undefined ? nodeIn.id : 'no-id-provided').toString(),
	};

	const style = NODE_STYLES[node.style];

	// style, shape, id, label, previewhtml, mathml, url, x, y, childsURL
	
	if(node.style !== undefined && style) {
		// clean the shape info
		const hasPreviewOrMath = (node.previewhtml && node.previewhtml.length>10) || (node.mathml && node.mathml.length>10);				
		if (style.shape === 'ellipse' || style.shape === 'circle') {
			node.shape = hasPreviewOrMath ? 'circularImage' : 'ellipse';
		} else if(style.shape === 'square') {
			node.shape = hasPreviewOrMath ? 'image' : 'square';
		} else {
			node.shape = hasPreviewOrMath ? 'image' : style.shape;
		}

		// Setup color
		if (node.color === undefined || typeof node.color === 'string') {
			node.color = {highlight: {}};
		}

		if (style.color) { node.color.background = style.color; }
		if (style.colorBorder) { node.color.border = style.colorBorder; }
		if (style.colorHighlightBorder) { node.color.border = style.colorBorder; }
		if (style.colorHighlight) { node.color.highlight = style.colorHighlight; }

		// fix shape properties
		if (node.shapeProperties === undefined) {
			node.shapeProperties = {} as any;
		}

		if (style.dashes) { (node.shapeProperties as any).borderDashes = [5, 5]; }
	}

	// assume it is clean now and we have added the missing properties
	return node;
}


export type DirtyEdge = Partial<vis.Edge & IGraphJSONEdge>;
export type CleanEdge = vis.Edge & IGraphJSONEdge & EdgeRuntimeProps;

interface EdgeRuntimeProps {
	id: string;
}

/**
 * Cleans up a user-provided edge and applies the appropriate style
 * @param nodeIn 
 * @param NODE_STYLES 
 */
export function cleanEdge(edgeIn: DirtyEdge, ARROW_STYLES: Record<string, IArrowStyle>): CleanEdge {
	const edge: CleanEdge = {
		from: 'none',
		to: 'none',
		style: 'no-style-provided',
		clickText: '',
		weight: '',
		url: '',

		// the input
		...edgeIn,

		id: (edgeIn.id != undefined ? edgeIn.id : 'no-id-provided').toString()
	};

	const style = ARROW_STYLES[edge.style || ''];
	if (edge.style && style) {
		edge.arrows = {
			to: {
				enabled: style.directed,
				type: style.circle ? 'circle' : 'arrow'
			}
		};

		if(style.smoothEdge) { edge.smooth = false; }
		
		edge.dashes = style.dashes;
		edge.width = style.width;
		edge.color = {
			color: style.color,
			highlight: style.colorHighlight,
			hover: style.colorHover
		}
	}
	return edge;
}

/**
 * Ensures that all Ids with array are unique
 * @param array 
 */
export function ensureUniqueIds<T extends {id?: string}>(array: Array<T>): Array<T> {
	const knownIds = new Set<string>();
	
	return array.map((e, i) => {
		if (e.id !== undefined) {

			// if we have an already known id
			// add a unique prefix to it to make sure it becomes unique
			if (knownIds.has(e.id)) {
				e.id += '_' + i;
			}

			// and store that we had this id
			knownIds.add(e.id);
		}
		
		// return the element
		return e;
	});
}
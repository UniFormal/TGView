import { IGraphJSONNode, IGraphJSONEdge } from "../graph";
import { INodeStyle, IArrowStyle } from "../Configuration";

declare module 'vis' {
	interface NetworkNodes {
		[index: number]: Node // options: hidden?
		[index: string]: Node // options: hidden?
	}
	interface Network {
		getConnectedNodes(nodeOrEdgeId: IdType, direction: string): IdType[];
		body: { nodes: NetworkNodes };
		canvas: {frame: {canvas: HTMLCanvasElement}};
		clustering: Network;
	}
	interface Node {
		widthConstraint?: Partial<{minimum: number, maximum: number}>
	}
}

export type DirtyNode = Partial<CleanNode>;
export type CleanNode = vis.Node & IGraphJSONNode;

/**
 * Applies a nodes style
 */
export function applyNodeStyle(node: DirtyNode, NODE_STYLES: Record<string, INodeStyle>): CleanNode {
	const style = NODE_STYLES[node.style || ''];
	
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
	return node as CleanNode;
}


export type DirtyEdge = Partial<CleanEdge>;
export type CleanEdge = vis.Edge & IGraphJSONEdge;

/**
 * Applies an edges style
 * @param edge 
 * @param ARROW_STYLES 
 */
export function applyEdgeStyle(edge: DirtyEdge, ARROW_STYLES: Record<string, IArrowStyle>): CleanEdge {
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
	return edge as CleanEdge;
}
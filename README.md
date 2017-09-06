# TGView
GraphViewer for TheoryGraphs

## Technical

Menu-Entry for Side-Menu
- menuText (text shown in side-menu)
- id (internal id)
- uri (Location of achieve on server)
- type (Default graph type to open)
- hasChildren (true when achieve has children)

Node in graph
- style (any NODE_STYLE, e.g. "model")
- shape (circle, ellipse, square)
- mathml (MathML code/script for MPD viewer)
- id (internal id)
- label (text shown)

Edge in graph
- from (Node id of from-Node)
- to (Node id of to-Node)
- style (any EDGE_STYLE, e.g. "include")
- clickText (Text shown when edge is clicked)

NODE_STYLES
Available Entities (see globalOptions.js for details):
- model
- theory
Entity-Options:
-- shape (circle, square)

ARROW_STYLES
Available Entities (see globalOptions.js for details):
- include
- meta
- alignment
- view 
- structure
Entity-Options:
-- color (default color)
-- colorHighlight (color on click)
-- colorHover (color on mouse hover)
-- dashes (dashed line; true/false)
-- circle (line ends with circle; true/false)
-- directed (line ends with arrow; true/false)


Example JSON for Nodes+Edges (Random example without any deeper meaning):
```javascript
{
  "nodes" : 
  [
    {
      "id" : "http:\/\/mathhub.info\/Teaching\/KRMT?AbelianGroup",
      "style" : "theory",
      "label" : "AbelianGroup",
      "url" : "\/?http:\/\/mathhub.info\/Teaching\/KRMT?AbelianGroup"
    }, 
    {
      "id" : "http:\/\/mathhub.info\/Teaching\/KRMT?Abelian",
      "style" : "theory",
      "label" : "Abelian",
      "url" : "\/?http:\/\/mathhub.info\/Teaching\/KRMT?Abelian",
      "mathml" : "[Optional] <math><mi>&pi;</mi><mo>&InvisibleTimes;</mo><msup><mi>r</mi><mn>2</mn></msup></math>"
    },
    ...
  ],
  "edges" : 
  [
    {
      "id" : "http:\/\/mathhub.info\/Teaching\/KRMT?AbelianEdge",
      "style" : "view",
      "from" : "http:\/\/mathhub.info\/Teaching\/KRMT?Abelian",
      "to" : "\/?http:\/\/mathhub.info\/Teaching\/KRMT?AbelianGroup",
      "label" : "Abelian Edge",
      "url" : "\/?http:\/\/mathhub.info\/Teaching\/KRMT?AbelianEdge",
      "clickText": "Some Text when clicked"
    }, 
    ...
  ]
}
```

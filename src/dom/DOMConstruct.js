"use strict";
exports.__esModule = true;
var jquery_1 = require("jquery");
// TODO: Instead of using the DomPrefix all over the code assign the important element inside of this class
// e.g. this.sideNavElement = document.getElementById(...) // whatever
// and eventually generate a prefix that is only needed during construction
var DOMConstruct = /** @class */ (function () {
    function DOMConstruct(config) {
        this.config = config;
        // grab the main element
        var mainElement = this.config.preferences.mainContainer;
        if (!mainElement) {
            throw new Error('Can not find mainElement');
        }
        // store it
        this.mainElement = mainElement;
        this.mainElement$ = jquery_1["default"](mainElement);
        // set the innerHTML
        this.mainElement.innerHTML = HTMLTemplate(config.preferences.prefix);
    }
    DOMConstruct.prototype.destroy = function () {
        // clear the main element -- which should remove extra event handlers
        this.mainElement$.empty();
    };
    /**
     * Gets an element of the created DOM
     * @param id
     */
    DOMConstruct.prototype.getElementById = function (id, surpressOutsideOfElementWarning) {
        // TODO: Cache this function
        if (surpressOutsideOfElementWarning === void 0) { surpressOutsideOfElementWarning = false; }
        if (id.startsWith(this.config.preferences.prefix)) {
            console.warn('Possibly incorrect use of DOMConstruct.getElementById(' + DOMConstruct.formatSelector(id) + '): Id of element to fetch starts with prefix. ');
        }
        // Find the element with the given id on the page
        var element = document.getElementById(this.config.preferences.prefix + id);
        if (!element) {
            throw new Error('Element with ID ' + id + ' does not exist');
        }
        // make sure that the element is contained with the DOM
        if (!surpressOutsideOfElementWarning && !this.mainElement.contains(element)) {
            console.warn('Insecure use of DOMConstruct.getElementById(' + DOMConstruct.formatSelector(id) + '): Element with ID ' + id + ' is not contained within mainElement');
        }
        // else return the element itself
        return element;
    };
    /**
     * Gets an element of the created DOM as a jQuery reference
     * @param id
     */
    DOMConstruct.prototype.$$ = function (id, surpressOutsideOfElementWarning) {
        if (surpressOutsideOfElementWarning === void 0) { surpressOutsideOfElementWarning = false; }
        return jquery_1["default"](this.getElementById(id, surpressOutsideOfElementWarning));
    };
    /**
     * Gets an element of the created DOM using a jQuery selector
     * @param selector
     */
    DOMConstruct.prototype.$ = function (selector, surpressOutsideOfElementWarning) {
        if (surpressOutsideOfElementWarning === void 0) { surpressOutsideOfElementWarning = false; }
        if (selector.startsWith('#')) {
            console.warn('Insecure use of DOMConstruct.$(' + DOMConstruct.formatSelector(selector) + '): Fetch elements by id using DOMConstruct.$$() to add prefixes. ');
        }
        // try finding the element inside of the mainElement
        var insideElement = this.mainElement$.find(selector);
        if (insideElement.length > 0) {
            return insideElement;
        }
        var onEntirePage = jquery_1["default"](selector);
        // if that doesn't work
        if (!surpressOutsideOfElementWarning) {
            if (onEntirePage.length > 0) {
                console.warn('Insecure use of DOMConstruct.$(' + DOMConstruct.formatSelector(selector) + '): No element found inside of mainElement. ');
            }
            else {
                console.warn('Insecure use of DOMConstruct.$(' + DOMConstruct.formatSelector(selector) + '): Element not found. ');
            }
        }
        return onEntirePage;
    };
    DOMConstruct.formatSelector = function (selector) {
        return '\'' + selector.replace('\\', '\\\\').replace('\'', '\\\'') + '\'';
    };
    return DOMConstruct;
}());
exports["default"] = DOMConstruct;
function HTMLTemplate(prefix) {
    // TODO: Format this nicer, so that it's actually readable
    return "\n      <div id=\"" + prefix + "mySidenav\" class=\"tgview sidenav\">\n         <a href=\"javascript:void(0)\" id=\"" + prefix + "closeNav\" class=\"closebtn\">&times;</a>\n         <div id=\"" + prefix + "theory_tree_div\" name=\"" + prefix + "theory_tree_div\" class=\"tgview theoryTreeClass\"  style=\"float:left;height:82%;\">\n            <span style=\"font-weight: bold; font-size: 110%;\"> MathHub Archives </span>\n            <div id=\"" + prefix + "theory_tree\" ></div>\n         </div>\n      </div>\n      <div id=\"" + prefix + "mainbox\" style=\"float:left;width:99%; padding-left:10px; \">\n         <div id=\"" + prefix + "shareIcons\" class=\"tgview jssocials\" style=\"position: absolute;left:40px; text-align: center;width:95.5%\"></div>\n         <div id=\"" + prefix + "menuButtonsDiv\">\n            <button style=\"font-size:24px;cursor:pointer;margin:0px;\" id=\"" + prefix + "leftMenuButton\" class=\"tgview myButton\">&gt;</button>\n            <button style=\"font-size:24px;cursor:pointer;right:16px;margin:0px;position:absolute\" id=\"" + prefix + "rightMenuButton\" class=\"tgview myButton\">&lt;</button>\n            <br /><br />\n         </div>\n         <div id=\"" + prefix + "mySidenav2\" class=\"tgview sidenav2\">\n            <a href=\"javascript:void(0)\" id=\"" + prefix + "closeNav2\" class=\"closebtn\" >&times;</a>\n            <div class=\"tgview toolSelector\" id=\"" + prefix + "toolSelector\">\n               <div id=\"" + prefix + "generalMenu\" class=\"tgview generalMenu\" name=\"" + prefix + "generalMenu\">\n                  <div id=\"" + prefix + "edgesShowHideDiv\" name=\"" + prefix + "edgesShowHideDiv\" style=\"max-height:200px; overflow:auto; width:99%\">\n                  </div>\n                  <br /><br />\n                  <select name=\"" + prefix + "nodeSpacingBox\" id=\"" + prefix + "nodeSpacingBox\"  >\n                     <option value=\"0.66\">Tiny Node-Spacing</option>\n                     <option value=\"1.5\">Small Node-Spacing</option>\n                     <option value=\"3\">Smaller Node-Spacing</option>\n                     <option value=\"4\" selected>Normal Node-Spacing</option>\n                     <option value=\"5\">Bigger Node-Spacing</option>\n                     <option value=\"7\">Big Node-Spacing</option>\n                     <option value=\"10\">Huge Node-Spacing</option>\n                  </select>\n                  <select name=\"" + prefix + "layoutBox\" id=\"" + prefix + "layoutBox\"  >\n                     <option value=\"0\">Strictly Hierarchical Layout</option>\n                     <option value=\"1\" selected>Semi Hierarchical Layout</option>\n                     <option value=\"2\">Forces Driven Layout</option>\n               <option value=\"3\">Manual Focus Layout</option>\n         <option value=\"4\">Water Driven Layout</option>\n                  </select>\n                  <br /><br />\n                  <!--\n                     <button onClick=\"changeMethod(0);\" title=\"Standard Layout\" class=\"tgview myButton\" style=\"width:32px;height:26px\"><div style=\"margin-top:2px\" class=\"tgview standardIcon\"></div></button>\n                     <button onClick=\"changeMethod(1);\" title=\"Hierarchical Layout\"  class=\"tgview myButton\" style=\"width:32px;height:26px\"><div style=\"margin-top:2px\" class=\"hierarchicalIcon\"></div></button>\n                     -->\n                  <div style=\"float:left\" class=\"tgview colorPicker\" id=\"" + prefix + "colorPicker\" name=\"" + prefix + "colorPicker\">\n                  </div>\n                  <br /><br />\n                  <button id=\"" + prefix + "undoButton\"  title=\"Undo last Action\" class=\"tgview myButton\" style=\"width:32px;height:26px\">\n                     <div style=\"margin-top:2px\" class=\"tgview undoIcon\"></div>\n                  <button id=\"" + prefix + "redoButton\" title=\"Redo last Action\" class=\"tgview myButton\" style=\"width:32px;height:26px;margin-left:4px;\">\n                     <div style=\"margin-top:2px\" class=\"tgview redoIcon\"></div>\n                  <button id=\"" + prefix + "selectionModeButton\"  title=\"Switch Selection Mode\" class=\"tgview myButton\" style=\"width:32px;height:26px;margin-left:4px;\">\n                     <div style=\"margin-top:2px\" class=\"tgview crosshairIcon\"></div>\n                  <button id=\"" + prefix + "downloadButton\" title=\"Download Graph\" class=\"tgview myButton\" style=\"width:32px;height:26px;margin-left:4px;margin-right:4px;\">\n                     <div style=\"margin-top:2px\" class=\"tgview downloadIcon\"></div>\n                  <button id=\"" + prefix + "clusterButton\"  class=\"tgview myButton\">Cluster Nodes</button>\n                  <button id=\"" + prefix + "cageButton\" class=\"tgview myButton\">Cage Nodes</button>\n            <button id=\"" + prefix + "manualHideButton\"  class=\"tgview myButton\">Hide selected Nodes</button>\n            <button id=\"" + prefix + "manualShowButton\" class=\"tgview myButton\">Show all manual hidden Nodes</button>\n                  <button id=\"" + prefix + "helpButton\"  class=\"tgview myButton\">Help</button>\n                  <button id=\"" + prefix + "selectNodes\" class=\"tgview myButton\">Select Nodes By Pathname</button>\n               <button id=\"" + prefix + "clusterNodesColor\"  class=\"tgview myButton\">Cluster Nodes</button>\n                  <br />\n                  <br />\n                  Upload JSON:\n                  <input type=\"file\" id=\"" + prefix + "jsonLoader\" name=\"" + prefix + "jsonLoader\"/>\n                  <br />\n                  <br />\n                  <form action=\"\">\n                     <input type=\"radio\" id=\"" + prefix + "iframeRadio\" name=\"" + prefix + "embedding\"  value=\"iframe\"> Embed graph in HTML using IFrame (recommended)<br>\n                     <input type=\"radio\" id=\"" + prefix + "htmlRadio\" name=\"" + prefix + "embedding\"  value=\"html\"> Embed graph in HTML using JS<br>\n                     <input type=\"radio\" id=\"" + prefix + "parameterRadio\" name=\"" + prefix + "embedding\"  value=\"parameter\"> Embed graph in URI<br>\n                     <input type=\"radio\" id=\"" + prefix + "uriRadio\" name=\"" + prefix + "embedding\"  value=\"uri\"> Download graph from server (default) <br>\n                     <input type=\"radio\" id=\"" + prefix + "jsonRadio\" name=\"" + prefix + "embedding\" value=\"harddisk\"> Save graph to harddisk as JSON\n                     <br />\n                     <br />\n                     <textarea rows=\"2\" id=\"" + prefix + "uriTextarea\" cols=\"42\" readonly></textarea>\n                     <br />\n                     <textarea rows=\"4\" id=\"" + prefix + "informationTextarea\" cols=\"42\" readonly > </textarea>\n                  </form>\n               </div>\n            </div>\n         </div>\n         <div id=\"" + prefix + "wholeNetwork\" class=\"tgview wholeNetwork\">\n            <div id=\"" + prefix + "mynetwork\" style=\"top:0px;left:0px;position: absolute; -moz-user-select: none; width: 100%; height: 100%;\">\n            </div>\n         <div id=\"" + prefix + "mynetworkLegend\" style=\" border: 2px dashed #D1D1D1; border-radius: 5px;opacity: 0.95; top:95%;left:0px;position: absolute; -moz-user-select: none; width: 99.9%; height: 5%;background-color:#FBFBFB\">\n            </div>\n            <canvas id=\"" + prefix + "toolCanvas\" style=\"display:none;z-index:1000;top:0px;left:0px;position: absolute;\" width=\"1200\" height=\"600\"></canvas>\n            <div id=\"" + prefix + "statusBar\" style=\"z-index:1001;top:40px;left:8px;position: absolute;\">\n               ...\n            </div>\n         </div>\n      </div>\n      <div id=\"" + prefix + "helpDialog\" title=\"Help\">\n         <p>You can select more than one node by holding CTRL and clicking on nodes to select! <br>\n            You can also draw rectangles around nodes to select them by activating \"Selection Mode\".\n         </p>\n      </div>\n      <p></p>\n      <span id='" + prefix + "string_span' style='float:left;font-size: 17px; display:none'></span>\n      <div id=\"" + prefix + "network-popUp\" class=\"tgview network-popup\">\n         <span id=\"" + prefix + "operation\" class=\"tgview operation\">node</span> <br>\n         <table style=\"margin:auto;\" class=\"tgview legend_table\">\n            <tr>\n               <td>Id</td>\n               <td><input id=\"" + prefix + "node-id\" value=\"new value\" /></td>\n            </tr>\n            <tr>\n               <td>Label</td>\n               <td><input id=\"" + prefix + "node-label\" value=\"new value\" /></td>\n            </tr>\n            <tr>\n               <td>URL</td>\n               <td><input id=\"" + prefix + "node-url\" value=\"new value\" /></td>\n            </tr>\n            <tr>\n               <td>MathML</td>\n               <td><textarea rows=\"4\" cols=\"26\" id=\"" + prefix + "node-mathml\"></textarea></td>\n            </tr>\n            <tr>\n               <td>Class</td>\n               <td><select id=\"" + prefix + "node-style\"></select></td>\n            </tr>\n         </table>\n         <input type=\"button\" value=\"save\" id=\"" + prefix + "saveButton\" />\n         <input type=\"button\" value=\"cancel\" id=\"" + prefix + "cancelButton\" />\n      </div>\n      <div id=\"" + prefix + "network-edge-popUp\" class=\"tgview network-edge-popUp\">\n         <span id=\"" + prefix + "edge-operation\" class=\"tgview edge-operation\">edge</span> <br>\n         <table style=\"margin:auto;\" class=\"tgview legend_table\">\n            <tr>\n               <td>Id</td>\n               <td><input id=\"" + prefix + "edge-id\" value=\"new value\" /></td>\n            </tr>\n            <tr>\n               <td>Label</td>\n               <td><input id=\"" + prefix + "edge-label\" value=\"\" /></td>\n            </tr>\n            <tr>\n               <td>URL</td>\n               <td><input id=\"" + prefix + "edge-url\" value=\"\" /></td>\n            </tr>\n            <tr>\n               <td>Class</td>\n               <td><select id=\"" + prefix + "edge-style\"></select></td>\n            </tr>\n         </table>\n         <input type=\"button\" value=\"save\" id=\"" + prefix + "edge-saveButton\" />\n         <input type=\"button\" value=\"cancel\" id=\"" + prefix + "edge-cancelButton\" />\n      </div>\n      <ul class='tgview custom-menu' style=\"z-index:100\">\n         <li data-action=\"openWindow\">Open Theory</li>\n         <li data-action=\"showURL\">Show URI</li>\n         <li data-action=\"inferType\">Infer Type</li>\n         <li data-action=\"showDecl\">Show Declaration</li>\n         <li data-action=\"openCluster\">Open Cluster</li>\n         <li data-action=\"childNodes\">Get Child-Nodes</li>\n      </ul>\n      <ul class='tgview custom-menu-side' id=\"" + prefix + "side-menu\" style=\"z-index:2000\">\n      </ul>\n      <div id=\"" + prefix + "tooltip-container\" class=\"tgview custom-tooltip\" style=\"z-index:101\"></div>\n   ";
}

import { Configuration } from "../Configuration";
import JQuery from 'jquery';

// TODO: Instead of using the DomPrefix all over the code assign the important element inside of this class
// e.g. this.sideNavElement = document.getElementById(...) // whatever
// and eventually generate a prefix that is only needed during construction

export default class DOMConstruct {
   constructor(readonly config: Configuration) {
      // grab the main element
      var mainElement = document.getElementById(this.config.preferences.mainContainer);
      if (!mainElement) { throw new Error('Can not find mainElement'); }

      // store it
      this.mainElement = mainElement;
      this.mainElement$ = JQuery(mainElement);

      // set the innerHTML
      this.mainElement.innerHTML = HTMLTemplate(config.preferences.prefix);
   }

   readonly mainElement: HTMLElement
   readonly mainElement$: JQuery<HTMLElement>;

   destroy() {
      // clear the main element -- which should remove extra event handlers
      this.mainElement$.empty();
   }

   /**
    * Gets an element of the created DOM
    * @param id 
    */
   getElementById<T extends HTMLElement = HTMLElement>(id: string) : T {
      // TODO: Cache this function

      if(id.startsWith(this.config.preferences.prefix)) {
         console.warn('Possibly incorrect use of DOMConstruct.getElementById(): Id of element to fetch starts with prefix. ');
      }

      // Find the element with the given id on the page
      const element = document.getElementById(this.config.preferences.prefix + id);
      if (!element) { throw new Error('Element with ID '+id+' does not exist'); }

      // make sure that the element is contained with the DOM
      if (!this.mainElement.contains(element)){
         throw new Error('Element with ID '+id+' is not conained with mainElement');
      }

      // else return the element itself
      return element as T;
   }

   /**
    * Gets an element of the created DOM as a jQuery reference
    * @param id 
    */
   $$<T extends HTMLElement = HTMLElement>(id: string) : JQuery<T> {
      return JQuery(this.getElementById<T>(id));
   }

   /**
    * Gets an element of the created DOM using a jQuery selector
    * @param selector 
    */
   $<T extends HTMLElement = HTMLElement>(selector: string) : JQuery<T> {
      if (selector.startsWith('#')) {
         console.warn('Insecure use of DOMConstruct.$(): Fetch elements by id using DOMConstruct.$$() to add prefixes. ');
      }
      return this.mainElement$.find(selector) as JQuery<T>;
   }
}

function HTMLTemplate(prefix: string): string {
   // TODO: Format this nicer, so that it's actually readable
   return `<div id="${prefix}mySidenav" class="sidenav"> <a href="javascript:void(0)" id="${prefix}closeNav" class="closebtn">&times;</a> <div id="${prefix}theory_tree_div" name="${prefix}theory_tree_div" class="theoryTreeClass" style="float:left;height:82%;"> <span style="font-weight: bold; font-size: 110%;"> MathHub Archives </span> <div id="${prefix}theory_tree" ></div></div></div><div id="${prefix}mainbox" style="float:left;width:99%; padding-left:10px; "> <div id="${prefix}shareIcons" class="jssocials" style="position: absolute;left:40px; text-align: center;width:95.5%"></div><div id="${prefix}menuButtonsDiv"> <button style="font-size:24px;cursor:pointer;margin:0px;" id="${prefix}leftMenuButton" class="myButton">&gt;</button> <button style="font-size:24px;cursor:pointer;right:16px;margin:0px;position:absolute" id="${prefix}rightMenuButton" class="myButton">&lt;</button> <br/><br/> </div><div id="${prefix}mySidenav2" class="sidenav2"> <a href="javascript:void(0)" id="${prefix}closeNav2" class="closebtn" >&times;</a> <div class="toolSelector" id="${prefix}toolSelector"> <div class="generalMenu" id="${prefix}generalMenu" name="${prefix}generalMenu"> <div id="${prefix}edgesShowHideDiv" name="${prefix}edgesShowHideDiv" style="max-height:200px; overflow:auto; width:99%"> </div><br/><br/> <select name="${prefix}nodeSpacingBox" id="${prefix}nodeSpacingBox" > <option value="0.66">Tiny Node-Spacing</option> <option value="1.5">Small Node-Spacing</option> <option value="3">Smaller Node-Spacing</option> <option value="4" selected>Normal Node-Spacing</option> <option value="5">Bigger Node-Spacing</option> <option value="7">Big Node-Spacing</option> <option value="10">Huge Node-Spacing</option> </select> <select name="${prefix}layoutBox" id="${prefix}layoutBox" > <option value="0">Strictly Hierarchical Layout</option> <option value="1" selected>Semi Hierarchical Layout</option> <option value="2">Forces Driven Layout</option> <option value="3">Manual Focus Layout</option><option value="4">Water Driven Layout</option> </select> <br/><br/><!-- <button onClick="changeMethod(0);" title="Standard Layout" class="myButton" style="width:32px;height:26px"><div style="margin-top:2px" class="standardIcon"></div></button> <button onClick="changeMethod(1);" title="Hierarchical Layout" class="myButton" style="width:32px;height:26px"><div style="margin-top:2px" class="hierarchicalIcon"></div></button> --> <div style="float:left" class="colorPicker" id="${prefix}colorPicker" name="${prefix}colorPicker"> </div><br/><br/> <button id="${prefix}undoButton" title="Undo last Action" class="myButton" style="width:32px;height:26px"> <div style="margin-top:2px" class="undoIcon"></div><button id="${prefix}redoButton" title="Redo last Action" class="myButton" style="width:32px;height:26px;margin-left:4px;"> <div style="margin-top:2px" class="redoIcon"></div><button id="${prefix}selectionModeButton" title="Switch Selection Mode" class="myButton" style="width:32px;height:26px;margin-left:4px;"> <div style="margin-top:2px" class="crosshairIcon"></div><button id="${prefix}downloadButton" title="Download Graph" class="myButton" style="width:32px;height:26px;margin-left:4px;margin-right:4px;"> <div style="margin-top:2px" class="downloadIcon"></div><button id="${prefix}clusterButton" class="myButton">Cluster Nodes</button> <button id="${prefix}cageButton" class="myButton">Cage Nodes</button> <button id="${prefix}manualHideButton" class="myButton">Hide selected Nodes</button> <button id="${prefix}manualShowButton" class="myButton">Show all manual hidden Nodes</button> <button id="${prefix}helpButton" class="myButton">Help</button> <button id="${prefix}selectNodes" class="myButton">Select Nodes By Pathname</button> <button id="${prefix}clusterNodesColor" class="myButton">Cluster Nodes</button> <br/> <br/> Upload JSON: <input type="file" id="${prefix}jsonLoader" name="${prefix}jsonLoader"/> <br/> <br/> <form action=""> <input type="radio" id="${prefix}iframeRadio" name="${prefix}embedding" value="iframe"> Embed graph in HTML using IFrame (recommended)<br><input type="radio" id="${prefix}htmlRadio" name="${prefix}embedding" value="html"> Embed graph in HTML using JS<br><input type="radio" id="${prefix}parameterRadio" name="${prefix}embedding" value="parameter"> Embed graph in URI<br><input type="radio" id="${prefix}uriRadio" name="${prefix}embedding" value="uri"> Download graph from server (default) <br><input type="radio" id="${prefix}jsonRadio" name="${prefix}embedding" value="harddisk"> Save graph to harddisk as JSON <br/> <br/> <textarea rows="2" id="${prefix}uriTextarea" cols="42" readonly></textarea> <br/> <textarea rows="4" id="${prefix}informationTextarea" cols="42" readonly > </textarea> </form> </div></div></div><div id="${prefix}wholeNetwork" class="wholeNetwork"> <div id="${prefix}mynetwork" style="top:0px;left:0px;position: absolute; -moz-user-select: none; width: 100%; height: 100%;"> </div><div id="${prefix}mynetworkLegend" style=" border: 2px dashed #D1D1D1; border-radius: 5px;opacity: 0.95; top:95%;left:0px;position: absolute; -moz-user-select: none; width: 99.9%; height: 5%;background-color:#FBFBFB"> </div><canvas id="${prefix}toolCanvas" style="display:none;z-index:1000;top:0px;left:0px;position: absolute;" width="1200" height="600"></canvas> <div id="${prefix}statusBar" style="z-index:1001;top:40px;left:8px;position: absolute;"> ... </div></div></div><div id="${prefix}helpDialog" title="Help"> <p>You can select more than one node by holding CTRL and clicking on nodes to select! <br>You can also draw rectangles around nodes to select them by activating "Selection Mode". </p></div><p></p><span id="${prefix}string_span" style="float:left;font-size: 17px; diyplay:none"></span> <div class="network-popUp" id="${prefix}network-popUp"> <span class="operation" id="${prefix}operation">node</span> <br><table style="margin:auto;"> <tr> <td>Id</td><td><input id="${prefix}node-id" value="new value"/></td></tr><tr> <td>Label</td><td><input id="${prefix}node-label" value="new value"/></td></tr><tr> <td>URL</td><td><input id="${prefix}node-url" value="new value"/></td></tr><tr> <td>MathML</td><td><textarea rows="4" cols="26" id="${prefix}node-mathml"></textarea></td></tr><tr> <td>Class</td><td><select id="${prefix}node-style"></select></td></tr></table> <input type="button" value="save" id="${prefix}saveButton"/> <input type="button" value="cancel" id="${prefix}cancelButton"/> </div><div class="network-edge-popUp " id="${prefix}network-edge-popUp"> <span class="edge-operation" id="${prefix}edge-operation">edge</span> <br><table style="margin:auto;"> <tr> <td>Id</td><td><input id="${prefix}edge-id" value="new value"/></td></tr><tr> <td>Label</td><td><input id="${prefix}edge-label" value=""/></td></tr><tr> <td>URL</td><td><input id="${prefix}edge-url" value=""/></td></tr><tr> <td>Class</td><td><select id="${prefix}edge-style"></select></td></tr></table> <input type="button" value="save" id="${prefix}edge-saveButton"/> <input type="button" value="cancel" id="${prefix}edge-cancelButton"/> </div><ul class="custom-menu" style="z-index:100"> <li data-action="openWindow">Open Theory</li><li data-action="showURL">Show URI</li><li data-action="inferType">Infer Type</li><li data-action="showDecl">Show Declaration</li><li data-action="openCluster">Open Cluster</li><li data-action="childNodes">Get Child-Nodes</li></ul> <ul class="custom-menu-side" id="${prefix}side-menu" style="z-index:2000"> </ul> <div id="${prefix}tooltip-container" class="custom-tooltip" style="z-index:101"></div>`
}

/*
         <div id="'+options.external.prefix+'mySidenav" class="sidenav">
            <a href="javascript:void(0)" id="'+options.external.prefix+'closeNav" class="closebtn">&times;</a>
            <div id="'+options.external.prefix+'theory_tree_div" name="'+options.external.prefix+'theory_tree_div" class="theoryTreeClass"  style="float:left;height:82%;">
               <span style="font-weight: bold; font-size: 110%;"> MathHub Archives </span>
               <div id="'+options.external.prefix+'theory_tree" ></div>
            </div>
         </div>
         <div id="'+options.external.prefix+'mainbox" style="float:left;width:99%; padding-left:10px; ">
            <div id="'+options.external.prefix+'shareIcons" class="jssocials" style="position: absolute;left:40px; text-align: center;width:95.5%"></div>
            <div id="'+options.external.prefix+'menuButtonsDiv">
               <button style="font-size:24px;cursor:pointer;margin:0px;" id="'+options.external.prefix+'leftMenuButton" class="myButton">&gt;</button>
               <button style="font-size:24px;cursor:pointer;right:16px;margin:0px;position:absolute" id="'+options.external.prefix+'rightMenuButton" class="myButton">&lt;</button>
               <br /><br />
            </div>
            <div id="'+options.external.prefix+'mySidenav2" class="sidenav2">
               <a href="javascript:void(0)" id="'+options.external.prefix+'closeNav2" class="closebtn" >&times;</a>
               <div class="toolSelector" id="'+options.external.prefix+'toolSelector">
                  <div id="'+options.external.prefix+'generalMenu" class="generalMenu" name="'+options.external.prefix+'generalMenu">
                     <div id="'+options.external.prefix+'edgesShowHideDiv" name="'+options.external.prefix+'edgesShowHideDiv" style="max-height:200px; overflow:auto; width:99%">
                     </div>
                     <br /><br />
                     <select name="'+options.external.prefix+'nodeSpacingBox" id="'+options.external.prefix+'nodeSpacingBox"  >
                        <option value="0.66">Tiny Node-Spacing</option>
                        <option value="1.5">Small Node-Spacing</option>
                        <option value="3">Smaller Node-Spacing</option>
                        <option value="4" selected>Normal Node-Spacing</option>
                        <option value="5">Bigger Node-Spacing</option>
                        <option value="7">Big Node-Spacing</option>
                        <option value="10">Huge Node-Spacing</option>
                     </select>
                     <select name="'+options.external.prefix+'layoutBox" id="'+options.external.prefix+'layoutBox"  >
                        <option value="0">Strictly Hierarchical Layout</option>
                        <option value="1" selected>Semi Hierarchical Layout</option>
                        <option value="2">Forces Driven Layout</option>
                  <option value="3">Manual Focus Layout</option>
            <option value="4">Water Driven Layout</option>
                     </select>
                     <br /><br />
                     <!--
                        <button onClick="changeMethod(0);" title="Standard Layout" class="myButton" style="width:32px;height:26px"><div style="margin-top:2px" class="standardIcon"></div></button>
                        <button onClick="changeMethod(1);" title="Hierarchical Layout"  class="myButton" style="width:32px;height:26px"><div style="margin-top:2px" class="hierarchicalIcon"></div></button>
                        -->
                     <div style="float:left" class="colorPicker" id="'+options.external.prefix+'colorPicker" name="'+options.external.prefix+'colorPicker">
                     </div>
                     <br /><br />
                     <button id="'+options.external.prefix+'undoButton"  title="Undo last Action" class="myButton" style="width:32px;height:26px">
                        <div style="margin-top:2px" class="undoIcon"></div>
                     <button id="'+options.external.prefix+'redoButton" title="Redo last Action" class="myButton" style="width:32px;height:26px;margin-left:4px;">
                        <div style="margin-top:2px" class="redoIcon"></div>
                     <button id="'+options.external.prefix+'selectionModeButton"  title="Switch Selection Mode" class="myButton" style="width:32px;height:26px;margin-left:4px;">
                        <div style="margin-top:2px" class="crosshairIcon"></div>
                     <button id="'+options.external.prefix+'downloadButton" title="Download Graph" class="myButton" style="width:32px;height:26px;margin-left:4px;margin-right:4px;">
                        <div style="margin-top:2px" class="downloadIcon"></div>
                     <button id="'+options.external.prefix+'clusterButton"  class="myButton">Cluster Nodes</button>
                     <button id="'+options.external.prefix+'cageButton" class="myButton">Cage Nodes</button>
               <button id="'+options.external.prefix+'manualHideButton"  class="myButton">Hide selected Nodes</button>
               <button id="'+options.external.prefix+'manualShowButton" class="myButton">Show all manual hidden Nodes</button>
                     <button id="'+options.external.prefix+'helpButton"  class="myButton">Help</button>
                     <button id="'+options.external.prefix+'selectNodes" class="myButton">Select Nodes By Pathname</button>
                  <button id="'+options.external.prefix+'clusterNodesColor"  class="myButton">Cluster Nodes</button>
                     <br />
                     <br />
                     Upload JSON:
                     <input type="file" id="'+options.external.prefix+'jsonLoader" name="'+options.external.prefix+'jsonLoader"/>
                     <br />
                     <br />
                     <form action="">
                        <input type="radio" id="'+options.external.prefix+'iframeRadio" name="'+options.external.prefix+'embedding"  value="iframe"> Embed graph in HTML using IFrame (recommended)<br>
                        <input type="radio" id="'+options.external.prefix+'htmlRadio" name="'+options.external.prefix+'embedding"  value="html"> Embed graph in HTML using JS<br>
                        <input type="radio" id="'+options.external.prefix+'parameterRadio" name="'+options.external.prefix+'embedding"  value="parameter"> Embed graph in URI<br>
                        <input type="radio" id="'+options.external.prefix+'uriRadio" name="'+options.external.prefix+'embedding"  value="uri"> Download graph from server (default) <br>
                        <input type="radio" id="'+options.external.prefix+'jsonRadio" name="'+options.external.prefix+'embedding" value="harddisk"> Save graph to harddisk as JSON
                        <br />
                        <br />
                        <textarea rows="2" id="'+options.external.prefix+'uriTextarea" cols="42" readonly></textarea>
                        <br />
                        <textarea rows="4" id="'+options.external.prefix+'informationTextarea" cols="42" readonly > </textarea>
                     </form>
                  </div>
               </div>
            </div>
            <div id="'+options.external.prefix+'wholeNetwork" class="wholeNetwork">
               <div id="'+options.external.prefix+'mynetwork" style="top:0px;left:0px;position: absolute; -moz-user-select: none; width: 100%; height: 100%;">
               </div>
            <div id="'+options.external.prefix+'mynetworkLegend" style=" border: 2px dashed #D1D1D1; border-radius: 5px;opacity: 0.95; top:95%;left:0px;position: absolute; -moz-user-select: none; width: 99.9%; height: 5%;background-color:#FBFBFB">
               </div>
               <canvas id="'+options.external.prefix+'toolCanvas" style="display:none;z-index:1000;top:0px;left:0px;position: absolute;" width="1200" height="600"></canvas>
               <div id="'+options.external.prefix+'statusBar" style="z-index:1001;top:40px;left:8px;position: absolute;">
                  ...
               </div>
            </div>
         </div>
         <div id="'+options.external.prefix+'helpDialog" title="Help">
            <p>You can select more than one node by holding CTRL and clicking on nodes to select! <br>
               You can also draw rectangles around nodes to select them by activating "Selection Mode".
            </p>
         </div>
         <p></p>
         <span id='string_span' style='float:left;font-size: 17px; diyplay:none'></span>
         <div id="'+options.external.prefix+'network-popUp" class="network-popup">
            <span id="'+options.external.prefix+'operation" class="operation">node</span> <br>
            <table style="margin:auto;">
               <tr>
                  <td>Id</td>
                  <td><input id="'+options.external.prefix+'node-id" value="new value" /></td>
               </tr>
               <tr>
                  <td>Label</td>
                  <td><input id="'+options.external.prefix+'node-label" value="new value" /></td>
               </tr>
               <tr>
                  <td>URL</td>
                  <td><input id="'+options.external.prefix+'node-url" value="new value" /></td>
               </tr>
               <tr>
                  <td>MathML</td>
                  <td><textarea rows="4" cols="26" id="'+options.external.prefix+'node-mathml"></textarea></td>
               </tr>
               <tr>
                  <td>Class</td>
                  <td><select id="'+options.external.prefix+'node-style"></select></td>
               </tr>
            </table>
            <input type="button" value="save" id="'+options.external.prefix+'saveButton" />
            <input type="button" value="cancel" id="'+options.external.prefix+'cancelButton" />
         </div>
         <div id="'+options.external.prefix+'network-edge-popUp" class="network-edge-popUp">
            <span id="'+options.external.prefix+'edge-operation" class="edge-operation">edge</span> <br>
            <table style="margin:auto;">
               <tr>
                  <td>Id</td>
                  <td><input id="'+options.external.prefix+'edge-id" value="new value" /></td>
               </tr>
               <tr>
                  <td>Label</td>
                  <td><input id="'+options.external.prefix+'edge-label" value="" /></td>
               </tr>
               <tr>
                  <td>URL</td>
                  <td><input id="'+options.external.prefix+'edge-url" value="" /></td>
               </tr>
               <tr>
                  <td>Class</td>
                  <td><select id="'+options.external.prefix+'edge-style"></select></td>
               </tr>
            </table>
            <input type="button" value="save" id="'+options.external.prefix+'edge-saveButton" />
            <input type="button" value="cancel" id="'+options.external.prefix+'edge-cancelButton" />
         </div>
         <ul class='custom-menu' style="z-index:100">
            <li data-action="openWindow">Open Theory</li>
            <li data-action="showURL">Show URI</li>
            <li data-action="inferType">Infer Type</li>
            <li data-action="showDecl">Show Declaration</li>
            <li data-action="openCluster">Open Cluster</li>
            <li data-action="childNodes">Get Child-Nodes</li>
         </ul>
         <ul class='custom-menu-side' id="'+options.external.prefix+'side-menu" style="z-index:2000">
         </ul>
         <div id="'+options.external.prefix+'tooltip-container" class="custom-tooltip" style="z-index:101"></div>
      */
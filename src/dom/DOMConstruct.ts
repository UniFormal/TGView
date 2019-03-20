import { Configuration } from '../Configuration';
import JQuery from 'jquery';

// TODO: Instead of using the DomPrefix all over the code assign the important element inside of this class
// e.g. this.sideNavElement = document.getElementById(...) // whatever
// and eventually generate a prefix that is only needed during construction

export default class DOMConstruct {
   constructor(readonly config: Configuration) {
      // grab the main element
      var mainElement = this.config.preferences.mainContainer;
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
   getElementById<T extends HTMLElement = HTMLElement>(id: string, surpressOutsideOfElementWarning: boolean = false) : T {
      // TODO: Cache this function

      if(id.startsWith(this.config.preferences.prefix)) {
         // tslint:disable-next-line: no-console
         console.warn('Possibly incorrect use of DOMConstruct.getElementById('+DOMConstruct.formatSelector(id)+'): Id of element to fetch starts with prefix. ');
      }

      // Find the element with the given id on the page
      const element = document.getElementById(this.config.preferences.prefix + id);
      if (!element) { throw new Error('Element with ID '+id+' does not exist'); }

      // make sure that the element is contained with the DOM
      if (!surpressOutsideOfElementWarning && !this.mainElement.contains(element)){
         // tslint:disable-next-line: no-console
         console.warn('Insecure use of DOMConstruct.getElementById('+DOMConstruct.formatSelector(id)+'): Element with ID '+id+' is not contained within mainElement');
      }

      // else return the element itself
      return element as T;
   }

   /**
    * Gets an element of the created DOM as a jQuery reference
    * @param id 
    */
   $$<T extends HTMLElement = HTMLElement>(id: string, surpressOutsideOfElementWarning: boolean = false) : JQuery<T> {
      return JQuery(this.getElementById<T>(id, surpressOutsideOfElementWarning));
   }

   /**
    * Gets an element of the created DOM using a jQuery selector
    * @param selector 
    */
   $<T extends HTMLElement = HTMLElement>(selector: string, surpressOutsideOfElementWarning: boolean = false) : JQuery<T> {
      if (selector.startsWith('#')) {
         // tslint:disable-next-line: no-console
         console.warn('Insecure use of DOMConstruct.$('+DOMConstruct.formatSelector(selector)+'): Fetch elements by id using DOMConstruct.$$() to add prefixes. ');
      }
      
      // try finding the element inside of the mainElement
      const insideElement = this.mainElement$.find(selector) as JQuery<T>;
      if(insideElement.length > 0) { 
         return insideElement; 
      }

      const onEntirePage = JQuery(selector);

      // if that doesn't work
      if(!surpressOutsideOfElementWarning) {
         if (onEntirePage.length > 0) {
            // tslint:disable-next-line: no-console
            console.warn('Insecure use of DOMConstruct.$('+DOMConstruct.formatSelector(selector)+'): No element found inside of mainElement. ');
         } else {
            // tslint:disable-next-line: no-console
            console.warn('Insecure use of DOMConstruct.$('+DOMConstruct.formatSelector(selector)+'): Element not found. ');
         }
      }

      return onEntirePage as JQuery<T>;
   }

   private static formatSelector(selector: string) {
      return '\'' + selector.replace('\\', '\\\\').replace('\'', '\\\'') + '\'';
   }
}

function HTMLTemplate(prefix: string): string {
   // TODO: Format this nicer, so that it's actually readable
   return `
      <div id="${prefix}mySidenav" class="tgview sidenav">
         <a href="javascript:void(0)" id="${prefix}closeNav" class="closebtn">&times;</a>
         <div id="${prefix}theory_tree_div" name="${prefix}theory_tree_div" class="tgview theoryTreeClass"  style="float:left;height:82%;">
            <span style="font-weight: bold; font-size: 110%;"> MathHub Archives </span>
            <div id="${prefix}theory_tree" ></div>
         </div>
      </div>
      <div id="${prefix}mainbox" style="float:left;width:99%; padding-left:10px; ">
         <div id="${prefix}shareIcons" class="tgview jssocials" style="position: absolute;left:40px; text-align: center;width:95.5%"></div>
         <div id="${prefix}menuButtonsDiv">
            <button style="font-size:24px;cursor:pointer;margin:0px;" id="${prefix}leftMenuButton" class="tgview myButton">&gt;</button>
            <button style="font-size:24px;cursor:pointer;right:16px;margin:0px;position:absolute" id="${prefix}rightMenuButton" class="tgview myButton">&lt;</button>
            <br /><br />
         </div>
         <div id="${prefix}mySidenav2" class="tgview sidenav2">
            <a href="javascript:void(0)" id="${prefix}closeNav2" class="closebtn" >&times;</a>
            <div class="tgview toolSelector" id="${prefix}toolSelector">
               <div id="${prefix}generalMenu" class="tgview generalMenu" name="${prefix}generalMenu">
                  <div id="${prefix}edgesShowHideDiv" name="${prefix}edgesShowHideDiv" style="max-height:200px; overflow:auto; width:99%">
                  </div>
                  <br /><br />
                  <select name="${prefix}nodeSpacingBox" id="${prefix}nodeSpacingBox"  >
                     <option value="0.66">Tiny Node-Spacing</option>
                     <option value="1.5">Small Node-Spacing</option>
                     <option value="3">Smaller Node-Spacing</option>
                     <option value="4" selected>Normal Node-Spacing</option>
                     <option value="5">Bigger Node-Spacing</option>
                     <option value="7">Big Node-Spacing</option>
                     <option value="10">Huge Node-Spacing</option>
                  </select>
                  <select name="${prefix}layoutBox" id="${prefix}layoutBox"  >
                     <option value="0">Strictly Hierarchical Layout</option>
                     <option value="1" selected>Semi Hierarchical Layout</option>
                     <option value="2">Forces Driven Layout</option>
               <option value="3">Manual Focus Layout</option>
         <option value="4">Water Driven Layout</option>
                  </select>
                  <br /><br />
                  <!--
                     <button onClick="changeMethod(0);" title="Standard Layout" class="tgview myButton" style="width:32px;height:26px"><div style="margin-top:2px" class="tgview standardIcon"></div></button>
                     <button onClick="changeMethod(1);" title="Hierarchical Layout"  class="tgview myButton" style="width:32px;height:26px"><div style="margin-top:2px" class="hierarchicalIcon"></div></button>
                     -->
                  <div style="float:left" class="tgview colorPicker" id="${prefix}colorPicker" name="${prefix}colorPicker">
                  </div>
                  <br /><br />
                  <button id="${prefix}undoButton"  title="Undo last Action" class="tgview myButton" style="width:32px;height:26px">
                     <div style="margin-top:2px" class="tgview undoIcon"></div>
                  <button id="${prefix}redoButton" title="Redo last Action" class="tgview myButton" style="width:32px;height:26px;margin-left:4px;">
                     <div style="margin-top:2px" class="tgview redoIcon"></div>
                  <button id="${prefix}selectionModeButton"  title="Switch Selection Mode" class="tgview myButton" style="width:32px;height:26px;margin-left:4px;">
                     <div style="margin-top:2px" class="tgview crosshairIcon"></div>
                  <button id="${prefix}downloadButton" title="Download Graph" class="tgview myButton" style="width:32px;height:26px;margin-left:4px;margin-right:4px;">
                     <div style="margin-top:2px" class="tgview downloadIcon"></div>
                  <button id="${prefix}clusterButton"  class="tgview myButton">Cluster Nodes</button>
                  <button id="${prefix}cageButton" class="tgview myButton">Cage Nodes</button>
            <button id="${prefix}manualHideButton"  class="tgview myButton">Hide selected Nodes</button>
            <button id="${prefix}manualShowButton" class="tgview myButton">Show all manual hidden Nodes</button>
                  <button id="${prefix}helpButton"  class="tgview myButton">Help</button>
                  <button id="${prefix}selectNodes" class="tgview myButton">Select Nodes By Pathname</button>
               <button id="${prefix}clusterNodesColor"  class="tgview myButton">Cluster Nodes</button>
                  <br />
                  <br />
                  Upload JSON:
                  <input type="file" id="${prefix}jsonLoader" name="${prefix}jsonLoader"/>
                  <br />
                  <br />
                  <form action="">
                     <input type="radio" id="${prefix}iframeRadio" name="${prefix}embedding"  value="iframe"> Embed graph in HTML using IFrame (recommended)<br>
                     <input type="radio" id="${prefix}htmlRadio" name="${prefix}embedding"  value="html"> Embed graph in HTML using JS<br>
                     <input type="radio" id="${prefix}parameterRadio" name="${prefix}embedding"  value="parameter"> Embed graph in URI<br>
                     <input type="radio" id="${prefix}uriRadio" name="${prefix}embedding"  value="uri"> Download graph from server (default) <br>
                     <input type="radio" id="${prefix}jsonRadio" name="${prefix}embedding" value="harddisk"> Save graph to harddisk as JSON
                     <br />
                     <br />
                     <textarea rows="2" id="${prefix}uriTextarea" cols="42" readonly></textarea>
                     <br />
                     <textarea rows="4" id="${prefix}informationTextarea" cols="42" readonly > </textarea>
                  </form>
               </div>
            </div>
         </div>
         <div id="${prefix}wholeNetwork" class="tgview wholeNetwork">
            <div id="${prefix}mynetwork" style="top:0px;left:0px;position: absolute; -moz-user-select: none; width: 100%; height: 100%;">
            </div>
         <div id="${prefix}mynetworkLegend" style=" border: 2px dashed #D1D1D1; border-radius: 5px;opacity: 0.95; top:95%;left:0px;position: absolute; -moz-user-select: none; width: 99.9%; height: 5%;background-color:#FBFBFB">
            </div>
            <canvas id="${prefix}toolCanvas" style="display:none;z-index:1000;top:0px;left:0px;position: absolute;" width="1200" height="600"></canvas>
            <div id="${prefix}statusBar" style="z-index:1001;top:40px;left:8px;position: absolute;">
               ...
            </div>
         </div>
      </div>
      <div id="${prefix}helpDialog" title="Help">
         <p>You can select more than one node by holding CTRL and clicking on nodes to select! <br>
            You can also draw rectangles around nodes to select them by activating "Selection Mode".
         </p>
      </div>
      <p></p>
      <span id='${prefix}string_span' style='float:left;font-size: 17px; display:none'></span>
      <div id="${prefix}network-popUp" class="tgview network-popup">
         <span id="${prefix}operation" class="tgview operation">node</span> <br>
         <table style="margin:auto;" class="tgview legend_table">
            <tr>
               <td>Id</td>
               <td><input id="${prefix}node-id" value="new value" /></td>
            </tr>
            <tr>
               <td>Label</td>
               <td><input id="${prefix}node-label" value="new value" /></td>
            </tr>
            <tr>
               <td>URL</td>
               <td><input id="${prefix}node-url" value="new value" /></td>
            </tr>
            <tr>
               <td>MathML</td>
               <td><textarea rows="4" cols="26" id="${prefix}node-mathml"></textarea></td>
            </tr>
            <tr>
               <td>Class</td>
               <td><select id="${prefix}node-style"></select></td>
            </tr>
         </table>
         <input type="button" value="save" id="${prefix}saveButton" />
         <input type="button" value="cancel" id="${prefix}cancelButton" />
      </div>
      <div id="${prefix}network-edge-popUp" class="tgview network-edge-popUp">
         <span id="${prefix}edge-operation" class="tgview edge-operation">edge</span> <br>
         <table style="margin:auto;" class="tgview legend_table">
            <tr>
               <td>Id</td>
               <td><input id="${prefix}edge-id" value="new value" /></td>
            </tr>
            <tr>
               <td>Label</td>
               <td><input id="${prefix}edge-label" value="" /></td>
            </tr>
            <tr>
               <td>URL</td>
               <td><input id="${prefix}edge-url" value="" /></td>
            </tr>
            <tr>
               <td>Class</td>
               <td><select id="${prefix}edge-style"></select></td>
            </tr>
         </table>
         <input type="button" value="save" id="${prefix}edge-saveButton" />
         <input type="button" value="cancel" id="${prefix}edge-cancelButton" />
      </div>
      <ul class='tgview custom-menu' style="z-index:100">
         <li data-action="openWindow">Open Theory</li>
         <li data-action="showURL">Show URI</li>
         <li data-action="inferType">Infer Type</li>
         <li data-action="showDecl">Show Declaration</li>
         <li data-action="openCluster">Open Cluster</li>
         <li data-action="childNodes">Get Child-Nodes</li>
      </ul>
      <ul class='tgview custom-menu-side' id="${prefix}side-menu" style="z-index:2000">
      </ul>
      <div id="${prefix}tooltip-container" class="tgview custom-tooltip" style="z-index:101"></div>
   `;
}
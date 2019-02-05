// @ts-check

// TODO: Instead of using the DomPrefix all over the code assign the important element inside of this class
// e.g. this.sideNavElement = document.getElementById(...) // whatever
// and eventually generate a prefix that is only needed during construction

/**
 * Creates a DOM Structure for TGView
 * @param {string} containerNameIn 
 * @param {import('./options').Options} optionsIn 
 * @class
 */
export default function DOMCreator(containerNameIn, optionsIn)
{
	var options=optionsIn;
	var containerName=containerNameIn;
	
	var html='<div id="'+options.external.prefix+'mySidenav" class="sidenav"> <a href="javascript:void(0)" id="'+options.external.prefix+'closeNav" class="closebtn">&times;</a> <div id="'+options.external.prefix+'theory_tree_div" name="'+options.external.prefix+'theory_tree_div" class="theoryTreeClass" style="float:left;height:82%;"> <span style="font-weight: bold; font-size: 110%;"> MathHub Archives </span> <div id="'+options.external.prefix+'theory_tree" ></div></div></div><div id="'+options.external.prefix+'mainbox" style="float:left;width:99%; padding-left:10px; "> <div id="'+options.external.prefix+'shareIcons" class="jssocials" style="position: absolute;left:40px; text-align: center;width:95.5%"></div><div id="'+options.external.prefix+'menuButtonsDiv"> <button style="font-size:24px;cursor:pointer;margin:0px;" id="'+options.external.prefix+'leftMenuButton" class="myButton">&gt;</button> <button style="font-size:24px;cursor:pointer;right:16px;margin:0px;position:absolute" id="'+options.external.prefix+'rightMenuButton" class="myButton">&lt;</button> <br/><br/> </div><div id="'+options.external.prefix+'mySidenav2" class="sidenav2"> <a href="javascript:void(0)" id="'+options.external.prefix+'closeNav2" class="closebtn" >&times;</a> <div class="toolSelector" id="'+options.external.prefix+'toolSelector"> <div class="generalMenu" id="'+options.external.prefix+'generalMenu" name="'+options.external.prefix+'generalMenu"> <div id="'+options.external.prefix+'edgesShowHideDiv" name="'+options.external.prefix+'edgesShowHideDiv" style="max-height:200px; overflow:auto; width:99%"> </div><br/><br/> <select name="'+options.external.prefix+'nodeSpacingBox" id="'+options.external.prefix+'nodeSpacingBox" > <option value="0.66">Tiny Node-Spacing</option> <option value="1.5">Small Node-Spacing</option> <option value="3">Smaller Node-Spacing</option> <option value="4" selected>Normal Node-Spacing</option> <option value="5">Bigger Node-Spacing</option> <option value="7">Big Node-Spacing</option> <option value="10">Huge Node-Spacing</option> </select> <select name="'+options.external.prefix+'layoutBox" id="'+options.external.prefix+'layoutBox" > <option value="0">Strictly Hierarchical Layout</option> <option value="1" selected>Semi Hierarchical Layout</option> <option value="2">Forces Driven Layout</option> <option value="3">Manual Focus Layout</option><option value="4">Water Driven Layout</option> </select> <br/><br/><!-- <button onClick="changeMethod(0);" title="Standard Layout" class="myButton" style="width:32px;height:26px"><div style="margin-top:2px" class="standardIcon"></div></button> <button onClick="changeMethod(1);" title="Hierarchical Layout" class="myButton" style="width:32px;height:26px"><div style="margin-top:2px" class="hierarchicalIcon"></div></button> --> <div style="float:left" class="colorPicker" id="'+options.external.prefix+'colorPicker" name="'+options.external.prefix+'colorPicker"> </div><br/><br/> <button id="'+options.external.prefix+'undoButton" title="Undo last Action" class="myButton" style="width:32px;height:26px"> <div style="margin-top:2px" class="undoIcon"></div><button id="'+options.external.prefix+'redoButton" title="Redo last Action" class="myButton" style="width:32px;height:26px;margin-left:4px;"> <div style="margin-top:2px" class="redoIcon"></div><button id="'+options.external.prefix+'selectionModeButton" title="Switch Selection Mode" class="myButton" style="width:32px;height:26px;margin-left:4px;"> <div style="margin-top:2px" class="crosshairIcon"></div><button id="'+options.external.prefix+'downloadButton" title="Download Graph" class="myButton" style="width:32px;height:26px;margin-left:4px;margin-right:4px;"> <div style="margin-top:2px" class="downloadIcon"></div><button id="'+options.external.prefix+'clusterButton" class="myButton">Cluster Nodes</button> <button id="'+options.external.prefix+'cageButton" class="myButton">Cage Nodes</button> <button id="'+options.external.prefix+'manualHideButton" class="myButton">Hide selected Nodes</button> <button id="'+options.external.prefix+'manualShowButton" class="myButton">Show all manual hidden Nodes</button> <button id="'+options.external.prefix+'helpButton" class="myButton">Help</button> <button id="'+options.external.prefix+'selectNodes" class="myButton">Select Nodes By Pathname</button> <button id="'+options.external.prefix+'clusterNodesColor" class="myButton">Cluster Nodes</button> <br/> <br/> Upload JSON: <input type="file" id="'+options.external.prefix+'jsonLoader" name="'+options.external.prefix+'jsonLoader"/> <br/> <br/> <form action=""> <input type="radio" id="'+options.external.prefix+'iframeRadio" name="'+options.external.prefix+'embedding" value="iframe"> Embed graph in HTML using IFrame (recommended)<br><input type="radio" id="'+options.external.prefix+'htmlRadio" name="'+options.external.prefix+'embedding" value="html"> Embed graph in HTML using JS<br><input type="radio" id="'+options.external.prefix+'parameterRadio" name="'+options.external.prefix+'embedding" value="parameter"> Embed graph in URI<br><input type="radio" id="'+options.external.prefix+'uriRadio" name="'+options.external.prefix+'embedding" value="uri"> Download graph from server (default) <br><input type="radio" id="'+options.external.prefix+'jsonRadio" name="'+options.external.prefix+'embedding" value="harddisk"> Save graph to harddisk as JSON <br/> <br/> <textarea rows="2" id="'+options.external.prefix+'uriTextarea" cols="42" readonly></textarea> <br/> <textarea rows="4" id="'+options.external.prefix+'informationTextarea" cols="42" readonly > </textarea> </form> </div></div></div><div id="'+options.external.prefix+'wholeNetwork" class="wholeNetwork"> <div id="'+options.external.prefix+'mynetwork" style="top:0px;left:0px;position: absolute; -moz-user-select: none; width: 100%; height: 100%;"> </div><div id="'+options.external.prefix+'mynetworkLegend" style=" border: 2px dashed #D1D1D1; border-radius: 5px;opacity: 0.95; top:95%;left:0px;position: absolute; -moz-user-select: none; width: 99.9%; height: 5%;background-color:#FBFBFB"> </div><canvas id="'+options.external.prefix+'toolCanvas" style="display:none;z-index:1000;top:0px;left:0px;position: absolute;" width="1200" height="600"></canvas> <div id="'+options.external.prefix+'statusBar" style="z-index:1001;top:40px;left:8px;position: absolute;"> ... </div></div></div><div id="'+options.external.prefix+'helpDialog" title="Help"> <p>You can select more than one node by holding CTRL and clicking on nodes to select! <br>You can also draw rectangles around nodes to select them by activating "Selection Mode". </p></div><p></p><span id="'+options.external.prefix+'string_span" style="float:left;font-size: 17px; diyplay:none"></span> <div class="network-popUp" id="'+options.external.prefix+'network-popUp"> <span class="operation" id="'+options.external.prefix+'operation">node</span> <br><table style="margin:auto;"> <tr> <td>Id</td><td><input id="'+options.external.prefix+'node-id" value="new value"/></td></tr><tr> <td>Label</td><td><input id="'+options.external.prefix+'node-label" value="new value"/></td></tr><tr> <td>URL</td><td><input id="'+options.external.prefix+'node-url" value="new value"/></td></tr><tr> <td>MathML</td><td><textarea rows="4" cols="26" id="'+options.external.prefix+'node-mathml"></textarea></td></tr><tr> <td>Class</td><td><select id="'+options.external.prefix+'node-style"></select></td></tr></table> <input type="button" value="save" id="'+options.external.prefix+'saveButton"/> <input type="button" value="cancel" id="'+options.external.prefix+'cancelButton"/> </div><div class="network-edge-popUp " id="'+options.external.prefix+'network-edge-popUp"> <span class="edge-operation" id="'+options.external.prefix+'edge-operation">edge</span> <br><table style="margin:auto;"> <tr> <td>Id</td><td><input id="'+options.external.prefix+'edge-id" value="new value"/></td></tr><tr> <td>Label</td><td><input id="'+options.external.prefix+'edge-label" value=""/></td></tr><tr> <td>URL</td><td><input id="'+options.external.prefix+'edge-url" value=""/></td></tr><tr> <td>Class</td><td><select id="'+options.external.prefix+'edge-style"></select></td></tr></table> <input type="button" value="save" id="'+options.external.prefix+'edge-saveButton"/> <input type="button" value="cancel" id="'+options.external.prefix+'edge-cancelButton"/> </div><ul class="custom-menu" style="z-index:100"> <li data-action="openWindow">Open Theory</li><li data-action="showURL">Show URI</li><li data-action="inferType">Infer Type</li><li data-action="showDecl">Show Declaration</li><li data-action="openCluster">Open Cluster</li><li data-action="childNodes">Get Child-Nodes</li></ul> <ul class="custom-menu-side" id="'+options.external.prefix+'side-menu" style="z-index:2000"> </ul> <div id="'+options.external.prefix+'tooltip-container" class="custom-tooltip" style="z-index:101"></div>';  
	var mainEle=document.getElementById(containerName);
	mainEle.innerHTML=html;
	
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
}
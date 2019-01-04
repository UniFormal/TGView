function DOMCreator(containerNameIn)
{
	var containerName=containerNameIn;
	
	var html='<div id="mySidenav" class="sidenav"> <a href="javascript:void(0)" id="closeNav" class="closebtn">&times;</a> <div id="theory_tree_div" name="theory_tree_div" class="theoryTreeClass" style="float:left;height:82%;"> <span style="font-weight: bold; font-size: 110%;"> MathHub Archives </span> <div id="theory_tree" ></div></div></div><div id="mainbox" style="float:left;width:99%; padding-left:10px; "> <div id="shareIcons" class="jssocials" style="position: absolute;left:40px; text-align: center;width:95.5%"></div><div id="menuButtonsDiv"> <button style="font-size:24px;cursor:pointer;margin:0px;" id="leftMenuButton" class="myButton">&gt;</button> <button style="font-size:24px;cursor:pointer;right:16px;margin:0px;position:absolute" id="rightMenuButton" class="myButton">&lt;</button> <br/><br/> </div><div id="mySidenav2" class="sidenav2"> <a href="javascript:void(0)" id="closeNav2" class="closebtn" >&times;</a> <div class="toolSelector" id="toolSelector"> <div id="generalMenu" name="generalMenu"> <div id="edgesShowHideDiv" name="edgesShowHideDiv" style="max-height:200px; overflow:auto; width:99%"> </div><br/><br/> <select name="nodeSpacingBox" id="nodeSpacingBox" > <option value="0.66">Tiny Node-Spacing</option> <option value="1.5">Small Node-Spacing</option> <option value="3">Smaller Node-Spacing</option> <option value="4" selected>Normal Node-Spacing</option> <option value="5">Bigger Node-Spacing</option> <option value="7">Big Node-Spacing</option> <option value="10">Huge Node-Spacing</option> </select> <select name="layoutBox" id="layoutBox" > <option value="0">Strictly Hierarchical Layout</option> <option value="1" selected>Semi Hierarchical Layout</option> <option value="2">Forces Driven Layout</option> <option value="3">Manual Focus Layout</option><option value="4">Water Driven Layout</option> </select> <br/><br/><!-- <button onClick="changeMethod(0);" title="Standard Layout" class="myButton" style="width:32px;height:26px"><div style="margin-top:2px" class="standardIcon"></div></button> <button onClick="changeMethod(1);" title="Hierarchical Layout" class="myButton" style="width:32px;height:26px"><div style="margin-top:2px" class="hierarchicalIcon"></div></button> --> <div style="float:left" id="colorPicker" name="colorPicker"> </div><br/><br/> <button id="undoButton" title="Undo last Action" class="myButton" style="width:32px;height:26px"> <div style="margin-top:2px" class="undoIcon"></div><button id="redoButton" title="Redo last Action" class="myButton" style="width:32px;height:26px;margin-left:4px;"> <div style="margin-top:2px" class="redoIcon"></div><button id="selectionModeButton" title="Switch Selection Mode" class="myButton" style="width:32px;height:26px;margin-left:4px;"> <div style="margin-top:2px" class="crosshairIcon"></div><button id="downloadButton" title="Download Graph" class="myButton" style="width:32px;height:26px;margin-left:4px;margin-right:4px;"> <div style="margin-top:2px" class="downloadIcon"></div><button id="clusterButton" class="myButton">Cluster Nodes</button> <button id="cageButton" class="myButton">Cage Nodes</button> <button id="manualHideButton" class="myButton">Hide selected Nodes</button> <button id="manualShowButton" class="myButton">Show all manual hidden Nodes</button> <button id="helpButton" class="myButton">Help</button> <button id="selectNodes" class="myButton">Select Nodes By Pathname</button> <button id="clusterNodesColor" class="myButton">Cluster Nodes</button> <br/> <br/> Upload JSON: <input type="file" id="jsonLoader" name="jsonLoader"/> <br/> <br/> <form action=""> <input type="radio" id="iframeRadio" name="embedding" value="iframe"> Embed graph in HTML using IFrame (recommended)<br><input type="radio" id="htmlRadio" name="embedding" value="html"> Embed graph in HTML using JS<br><input type="radio" id="parameterRadio" name="embedding" value="parameter"> Embed graph in URI<br><input type="radio" id="uriRadio" name="embedding" value="uri"> Download graph from server (default) <br><input type="radio" id="jsonRadio" name="embedding" value="harddisk"> Save graph to harddisk as JSON <br/> <br/> <textarea rows="2" id="uriTextarea" cols="42" readonly></textarea> <br/> <textarea rows="4" id="informationTextarea" cols="42" readonly > </textarea> </form> </div></div></div><div id="wholeNetwork"> <div id="mynetwork" style="top:0px;left:0px;position: absolute; -moz-user-select: none; width: 100%; height: 100%;"> </div><div id="mynetworkLegend" style=" border: 2px dashed #D1D1D1; border-radius: 5px;opacity: 0.95; top:95%;left:0px;position: absolute; -moz-user-select: none; width: 99.9%; height: 5%;background-color:#FBFBFB"> </div><canvas id="toolCanvas" style="display:none;z-index:1000;top:0px;left:0px;position: absolute;" width="1200" height="600"></canvas> <div id="statusBar" style="z-index:1001;top:40px;left:8px;position: absolute;"> ... </div></div></div><div id="helpDialog" title="Help"> <p>You can select more than one node by holding CTRL and clicking on nodes to select! <br>You can also draw rectangles around nodes to select them by activating "Selection Mode". </p></div><p></p><span id="string_span" style="float:left;font-size: 17px; diyplay:none"></span> <div id="network-popUp"> <span id="operation">node</span> <br><table style="margin:auto;"> <tr> <td>Id</td><td><input id="node-id" value="new value"/></td></tr><tr> <td>Label</td><td><input id="node-label" value="new value"/></td></tr><tr> <td>URL</td><td><input id="node-url" value="new value"/></td></tr><tr> <td>MathML</td><td><textarea rows="4" cols="26" id="node-mathml"></textarea></td></tr><tr> <td>Class</td><td><select id="node-style"></select></td></tr></table> <input type="button" value="save" id="saveButton"/> <input type="button" value="cancel" id="cancelButton"/> </div><div id="network-edge-popUp"> <span id="edge-operation">edge</span> <br><table style="margin:auto;"> <tr> <td>Id</td><td><input id="edge-id" value="new value"/></td></tr><tr> <td>Label</td><td><input id="edge-label" value=""/></td></tr><tr> <td>URL</td><td><input id="edge-url" value=""/></td></tr><tr> <td>Class</td><td><select id="edge-style"></select></td></tr></table> <input type="button" value="save" id="edge-saveButton"/> <input type="button" value="cancel" id="edge-cancelButton"/> </div><ul class="custom-menu" style="z-index:100"> <li data-action="openWindow">Open Theory</li><li data-action="showURL">Show URI</li><li data-action="inferType">Infer Type</li><li data-action="showDecl">Show Declaration</li><li data-action="openCluster">Open Cluster</li><li data-action="childNodes">Get Child-Nodes</li></ul> <ul class="custom-menu-side" id="side-menu" style="z-index:2000"> </ul> <div id="tooltip-container" class="custom-tooltip" style="z-index:101"></div>';  
	var mainEle=document.getElementById(containerName);
	mainEle.innerHTML=html;
	
		/*
		<div id="mySidenav" class="sidenav">
         <a href="javascript:void(0)" id="closeNav" class="closebtn">&times;</a>
         <div id="theory_tree_div" name="theory_tree_div" class="theoryTreeClass"  style="float:left;height:82%;">
            <span style="font-weight: bold; font-size: 110%;"> MathHub Archives </span>
            <div id="theory_tree" ></div>
         </div>
      </div>
      <div id="mainbox" style="float:left;width:99%; padding-left:10px; ">
         <div id="shareIcons" class="jssocials" style="position: absolute;left:40px; text-align: center;width:95.5%"></div>
         <div id="menuButtonsDiv">
            <button style="font-size:24px;cursor:pointer;margin:0px;" id="leftMenuButton" class="myButton">&gt;</button>
            <button style="font-size:24px;cursor:pointer;right:16px;margin:0px;position:absolute" id="rightMenuButton" class="myButton">&lt;</button>
            <br /><br /> 
         </div>
         <div id="mySidenav2" class="sidenav2">
            <a href="javascript:void(0)" id="closeNav2" class="closebtn" >&times;</a>
            <div class="toolSelector" id="toolSelector">
               <div id="generalMenu" name="generalMenu">
                  <div id="edgesShowHideDiv" name="edgesShowHideDiv" style="max-height:200px; overflow:auto; width:99%">
                  </div>
                  <br /><br />
                  <select name="nodeSpacingBox" id="nodeSpacingBox"  >
                     <option value="0.66">Tiny Node-Spacing</option>
                     <option value="1.5">Small Node-Spacing</option>
                     <option value="3">Smaller Node-Spacing</option>
                     <option value="4" selected>Normal Node-Spacing</option>
                     <option value="5">Bigger Node-Spacing</option>
                     <option value="7">Big Node-Spacing</option>
                     <option value="10">Huge Node-Spacing</option>
                  </select>
                  <select name="layoutBox" id="layoutBox"  >
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
                  <div style="float:left" id="colorPicker" name="colorPicker"> 
                  </div>
                  <br /><br />
                  <button id="undoButton"  title="Undo last Action" class="myButton" style="width:32px;height:26px">
                     <div style="margin-top:2px" class="undoIcon"></div>
                  <button id="redoButton" title="Redo last Action" class="myButton" style="width:32px;height:26px;margin-left:4px;">
                     <div style="margin-top:2px" class="redoIcon"></div>
                  <button id="selectionModeButton"  title="Switch Selection Mode" class="myButton" style="width:32px;height:26px;margin-left:4px;">
                     <div style="margin-top:2px" class="crosshairIcon"></div>
                  <button id="downloadButton" title="Download Graph" class="myButton" style="width:32px;height:26px;margin-left:4px;margin-right:4px;">
                     <div style="margin-top:2px" class="downloadIcon"></div>
                  <button id="clusterButton"  class="myButton">Cluster Nodes</button>
                  <button id="cageButton" class="myButton">Cage Nodes</button>
				  <button id="manualHideButton"  class="myButton">Hide selected Nodes</button>
				  <button id="manualShowButton" class="myButton">Show all manual hidden Nodes</button>
                  <button id="helpButton"  class="myButton">Help</button>
                  <button id="selectNodes" class="myButton">Select Nodes By Pathname</button>
				   <button id="clusterNodesColor"  class="myButton">Cluster Nodes</button>
                  <br />
                  <br />
                  Upload JSON:
                  <input type="file" id="jsonLoader" name="jsonLoader"/>
                  <br />
                  <br />
                  <form action="">
                     <input type="radio" id="iframeRadio" name="embedding"  value="iframe"> Embed graph in HTML using IFrame (recommended)<br>
                     <input type="radio" id="htmlRadio" name="embedding"  value="html"> Embed graph in HTML using JS<br>
                     <input type="radio" id="parameterRadio" name="embedding"  value="parameter"> Embed graph in URI<br>
                     <input type="radio" id="uriRadio" name="embedding"  value="uri"> Download graph from server (default) <br>
                     <input type="radio" id="jsonRadio" name="embedding" value="harddisk"> Save graph to harddisk as JSON
                     <br />
                     <br />
                     <textarea rows="2" id="uriTextarea" cols="42" readonly></textarea>
                     <br />
                     <textarea rows="4" id="informationTextarea" cols="42" readonly > </textarea>
                  </form>
               </div>
            </div>
         </div>
         <div id="wholeNetwork">
            <div id="mynetwork" style="top:0px;left:0px;position: absolute; -moz-user-select: none; width: 100%; height: 100%;">
            </div>
			<div id="mynetworkLegend" style=" border: 2px dashed #D1D1D1; border-radius: 5px;opacity: 0.95; top:95%;left:0px;position: absolute; -moz-user-select: none; width: 99.9%; height: 5%;background-color:#FBFBFB">
            </div>
            <canvas id="toolCanvas" style="display:none;z-index:1000;top:0px;left:0px;position: absolute;" width="1200" height="600"></canvas>
            <div id="statusBar" style="z-index:1001;top:40px;left:8px;position: absolute;">	
               ...
            </div>
         </div>
      </div>
      <div id="helpDialog" title="Help">
         <p>You can select more than one node by holding CTRL and clicking on nodes to select! <br>
            You can also draw rectangles around nodes to select them by activating "Selection Mode".
         </p>
      </div>
      <p></p>
      <span id='string_span' style='float:left;font-size: 17px; diyplay:none'></span>
      <div id="network-popUp">
         <span id="operation">node</span> <br>
         <table style="margin:auto;">
            <tr>
               <td>Id</td>
               <td><input id="node-id" value="new value" /></td>
            </tr>
            <tr>
               <td>Label</td>
               <td><input id="node-label" value="new value" /></td>
            </tr>
            <tr>
               <td>URL</td>
               <td><input id="node-url" value="new value" /></td>
            </tr>
            <tr>
               <td>MathML</td>
               <td><textarea rows="4" cols="26" id="node-mathml"></textarea></td>
            </tr>
            <tr>
               <td>Class</td>
               <td><select id="node-style"></select></td>
            </tr>
         </table>
         <input type="button" value="save" id="saveButton" />
         <input type="button" value="cancel" id="cancelButton" />
      </div>
      <div id="network-edge-popUp">
         <span id="edge-operation">edge</span> <br>
         <table style="margin:auto;">
            <tr>
               <td>Id</td>
               <td><input id="edge-id" value="new value" /></td>
            </tr>
            <tr>
               <td>Label</td>
               <td><input id="edge-label" value="" /></td>
            </tr>
            <tr>
               <td>URL</td>
               <td><input id="edge-url" value="" /></td>
            </tr>
            <tr>
               <td>Class</td>
               <td><select id="edge-style"></select></td>
            </tr>
         </table>
         <input type="button" value="save" id="edge-saveButton" />
         <input type="button" value="cancel" id="edge-cancelButton" />
      </div>
      <ul class='custom-menu' style="z-index:100">
         <li data-action="openWindow">Open Theory</li>
         <li data-action="showURL">Show URI</li>
         <li data-action="inferType">Infer Type</li>
         <li data-action="showDecl">Show Declaration</li>
         <li data-action="openCluster">Open Cluster</li>
         <li data-action="childNodes">Get Child-Nodes</li>
      </ul>
      <ul class='custom-menu-side' id="side-menu" style="z-index:2000">
      </ul>
      <div id="tooltip-container" class="custom-tooltip" style="z-index:101"></div>
	  */
}
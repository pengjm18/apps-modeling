// default color of all ui elements
var defColor = "gray";
// highlight color of all ui elements
var highlightColor = "#fff";
// highlight color of all buttons
var highlightColorButton = "#FFC125";



/**
 * Class for managing a tree view.
 * The optional elementsCheckable flag indicates whether the tree nodes should be checkable (default: true).
 */
SimpleTreeViewer = function(treeElementID, elementsCheckable){
    this.checkable = true;

    if (arguments.length >= 2)
        this.checkable = elementsCheckable;

    this.treeID = treeElementID;
};


/**
 * Adds a node to a group of the tree.
 * @param id ID of the new node
 * @param text Label of the new node
 * @param group Group where the node should be added. If left out, the new node is added to the root node.
 */
SimpleTreeViewer.prototype.addNode = function (id, text, group) {
    var groupNode;

    if (arguments.length >= 3)
    {
        groupNode = this.getNode(group);
    }
    else
    {
        groupNode = $("#" + this.treeID).dynatree("getRoot");
    }

    groupNode.addChild({
        title: text,
        key: id,
        //icon: "primitives.jpg",
        select: true,
        activate: true,
        hideCheckbox: !this.checkable
    });
};


SimpleTreeViewer.prototype.addGroup = function (id, text) {

    var rootNode = $("#" + this.treeID).dynatree("getRoot");

    var childNode = rootNode.addChild({
        title: text,
        key: id,
        isFolder: true,
        select: true,
        selectMode: 3,
        expand: true,
        hideCheckbox: !this.checkable
    });

    rootNode.addChild(childNode);
};


SimpleTreeViewer.prototype.moveExistingNodeToGroup = function (node, group) {
    var node  = this.getNode(node);
    var group = this.getNode(group);

    node.move(group);
};


SimpleTreeViewer.prototype.getNode = function (id) {
    return $("#" + this.treeID).dynatree("getTree").getNodeByKey(id);
};


SimpleTreeViewer.prototype.removeNode = function (id) {
    this.getNode(id).remove();
};


SimpleTreeViewer.prototype.rename = function (id, name) {
    var node = this.getNode(id);
    node.data.title = name;
    node.render();
};


SimpleTreeViewer.prototype.activate = function (id) {
    var tree = $("#" + this.treeID).dynatree("getTree");
    tree.activateKey(id);
};



/*
 * The UI object handles the getter and setter function for all GUI elements
 * @returns {UI}
 */
function UI(primitiveManager){
    
    // Variables that handle the toggle behaviour of the toolbars
    var fadeSwitch = [0, 0];
    // primitive parameter map to synchronize names between editor and x3dom
    this.primitiveParameterMap = createParameterMap("PrimitiveParameterMap.xml");

    this.treeViewer = new SimpleTreeViewer("tree");

    this.catalogueTreeNodes     = [];

    // color picker component
    var farbtasticPicker = null;
    // primitive type for 2D-Editor
    var primitivType = null;
    // primitive position for 2D-Editor
    var primitivePos = null;
    // specifies whether we are in "group mode"
    // this means that no single primitive, but a group is being transformed etc.
    var groupMode = false;

    var that = this;


    /*
     * Indicates whether the group mode is currently active (i.e., if we currently handle a group or a single primitive)
     * @returns {boolean}
     */
    this.groupModeActive = function(){
        return groupMode;
    };



    /*
     * Indicates whether the group mode is currently active (i.e., if we currently handle a group or a single primitive)
     * @returns {null}
     */
    this.toggleGroupMode = function(val){
        groupMode = val;

        if (val){
            primitiveManager.enableTransformationUI();
            primitiveManager.updateTransformUIFromCurrentObject();
            primitiveManager.highlightCurrentBoundingVolume(true);

            ui.RBAccordion.disable(true);
        }
        else
        {
            ui.RBAccordion.disable(false);
        }
    };



    /*
     * Initializes the UIComponent
     * @returns {Null}
     */
    this.initialize = function(){ 
        that.TBPlane = that.newImageProperty("DeletePlane", true);
        that.TBGrid = that.newImageProperty("DeleteAxis", true);
        that.TBHand = that.newImageProperty("ButtonHand", true);
        that.TBTranslate = that.newImageProperty("ButtonVerschieben", true);
        that.TBScale = that.newImageProperty("ButtonSkalieren", true);
        that.TBRotate = that.newImageProperty("ButtonRotieren", true);
        that.TBGroup = that.newImageProperty("ButtonGroup", true);
        that.TBUngroup = that.newImageProperty("ButtonUngroup", true);
        that.TBSnapToGrid = that.newImageProperty("ButtonSnapToGrid", true);
        that.TBSnap = that.newImageProperty("SnapPoints", true);
        that.TBAutoSave = that.newImageProperty("ButtonAutoSave", true);
        that.TBViewpoints = that.newComboBoxProperty("Viewpoints", true);
       
        that.BBPrimName = that.newTextProperty("primitiveName", true);
        that.BBDelete = that.newImageProperty("deletePrimitive", true);
        that.BBClone = that.newImageProperty("clonePrimitiveGroup", true);
        
        that.BBTransMode = that.newLabelProperty("transformMode");
        that.BBTX = that.newLabelProperty("tx");
        that.BBTY = that.newLabelProperty("ty");
        that.BBTZ = that.newLabelProperty("tz");

        that.BBTransX = that.newSpinnerProperty("amountX");
        $("#amountX").spinner({
            step: 0.1,
            min: 0.0,
            stop:function(e,ui){
                var clampedValue = clamp(that.BBTransX.min, 
                                         that.BBTransX.max, 
                                         that.BBTransX.get());
                if (clampedValue > 0 || clampedValue < 0)                        
                    that.BBTransX.set(clampedValue);
                
                primitiveManager.updatePrimitiveTransformFromUI();
            }
        });

        that.BBTransY = that.newSpinnerProperty("amountY");
        $("#amountY").spinner({
            step: 0.1,
            min: 0.0,
            stop:function(e,ui){
                var clampedValue = clamp(that.BBTransY.min, 
                                         that.BBTransY.max, 
                                         that.BBTransY.get());
                if (clampedValue > 0 || clampedValue < 0)                        
                    that.BBTransY.set(clampedValue);
                
                primitiveManager.updatePrimitiveTransformFromUI();
            }
        });
        
        that.BBTransZ = that.newSpinnerProperty("amountZ");
        $("#amountZ").spinner({
            step: 0.1,
            min: 0.0,
            stop:function(e,ui){
                var clampedValue = clamp(that.BBTransZ.min, 
                                         that.BBTransZ.max, 
                                         that.BBTransZ.get());
                if (clampedValue > 0 || clampedValue < 0)                        
                    that.BBTransZ.set(clampedValue);
                
                primitiveManager.updatePrimitiveTransformFromUI();
            }
        });

        // scrollbar for primitives of left bar   		
        $('#divs').slimScroll({
                height: '99%',
                size: '10px',
                color: '#FFFFFF',
                position: 'left'
        });

        $('#refPnts').slimScroll({
            height: '99%',
            size: '10px',
            color: '#FFFFFF',
            position: 'left'
        });
        
        
        $('#properties').slimScroll({
            height: '100%',
            size: '10px',
            color: '#FFFFFF',
            position: 'right'
        });

        // context menu for creating primitives by clicking with right mouse button
        $('#innerContextMenu').slimScroll({
            height: '160px',
            size: '10px',
            color: '#FFF',
            position: 'right',
            alwaysVisible: true,
            railVisible: true,
            railColor: '#AAA'
        });

        // Initialization of the treeview
        $("#tree").dynatree({
            checkbox: true,
            selectMode: 3,
            clickFolderMode: 1,
            fx: { height: "toggle", duration: 500 },
            onFocus: function(node) {
                node.scheduleAction("cancel");
                
            },
            onSelect: function(select, node) { 
                function recursiveSelection(tempNode){
                    if (tempNode.data.isFolder){
                        for (var i = 0; i < tempNode.childList.length; i++){
                            recursiveSelection(tempNode.childList[i]);
                        }
                    }
                    else {
                        primitiveManager.setPrimitiveVisibility(tempNode.data.key, tempNode.isSelected());
                        if (tempNode.isActive()){
                            if (tempNode.isSelected())
                                primitiveManager.highlightCurrentObject(true);
                        }
                    }
                }
                
                recursiveSelection(node);
                if (!node.data.isFolder)
                    primitiveManager.setPrimitiveVisibility(node.data.key, select);
            },
            onBlur: function(node) {
                node.scheduleAction("cancel");
            },
            onActivate: function(node){
                if (node.isSelected()) {
                    that.treeViewer.activate(node.data.key);
                    primitiveManager.selectObject(node.data.key);
                }
            }
        });


        ///BEGIN TODO: MERGE THIS WITH THE OTHER INIT CODE ABOVE TO MINIMIZE CODE DUPLICATION
        ///-----------
        if ($("#catalogueTree"))
        {

            $("#catalogueTree").dynatree({
                checkbox: true,
                selectMode: 3,
                clickFolderMode: 1,
                fx: null,
                onFocus: function(node) {
                    node.scheduleAction("cancel");

                },
                onSelect: function(select, node) {
                    function recursiveSelection(tempNode){
                        if (tempNode.data.isFolder){
                            for (var i = 0; i < tempNode.childList.length; i++){
                                recursiveSelection(tempNode.childList[i]);
                            }
                        }
                        else {
                            /*
                            primitiveManager.setPrimitiveVisibility(tempNode.data.key, tempNode.isSelected());

                            if (tempNode.isActive()){
                                if (tempNode.isSelected())
                                    primitiveManager.highlightCurrentObject(true);
                            }
                             */
                        }
                    }

                    recursiveSelection(node);
                    //if (!node.data.isFolder)
                    //    primitiveManager.setPrimitiveVisibility(node.data.key, select);
                    },
                    onBlur: function(node) {
                        node.scheduleAction("cancel");
                    },
                    onActivate: function(node){
                        var parentNode;
                        var typeName;

                        if (node.isSelected()) {

                            parentNode = node.getParent();

                            if (parentNode)
                            {
                                typeName = parentNode.data.key + "_" + node.data.key;
                                primitiveManager.addComponent(typeName);
                            }
                        }
                    }
            });

        }
        //END TODO
        ///-----------

        $("#snapToGrid").switchButton({
            checked: false,
            width: 20,
            height: 13,
            button_width: 10,
            on_label: 'Snap to grid',
            off_label: 'Snap off'
            }).change(function(){
        });
        

        //TODO: something is currently wrong with the scrollbars
        $('.treeViewDiv').slimScroll({
            height: '100%',
            size: '10px',
            color: '#FFFFFF',
            position: 'right'
        });

        // symbols of accordion on right bar
        var iconsAccordion = 
        {
                header: "ui-icon-circle-arrow-e",
                activeHeader: "ui-icon-circle-arrow-s"
        };

        // creation of the accordion on the right bar
        that.RBAccordion = $("#accordeon-oben");

        that.RBAccordion.accordion({
                heightStyle: "content",
                collapsible: false,
                active: false,
                icons: iconsAccordion,
                activate: function(event, ui) {
                    if (ui.newHeader.text() === "Material Editor"){
                        document.getElementById("diffuse").focus();
                        that.setMaterial(primitiveManager.getCurrentObject().getMaterial());
                    }
                }
        });


        $("#accordion_left").accordion({
                heightStyle: "content",
                collapsible: false,
                active: false,
                icons: iconsAccordion,
                activate: function(event, ui) {
                    // ?
                }
        });


        that.RBAccordion.disable = function(bool){
            $("#accordeon-oben").accordion("option", { disabled: bool });
        };

        farbtasticPicker = $.farbtastic('#picker');
        var p = $('#picker').css('opacity', 1.0);
        var selected;
        $('.colorwell')
            .each(function () { farbtasticPicker.linkTo(this); $(this).css('opacity', 1.0); })
            .focus(function() {
                    if (selected) {
                      $(selected).css('opacity', 1.0).removeClass('colorwell-selected');
                      $(selected).onchange = function() {
                          //
                      };
                    }
                    farbtasticPicker.linkTo(this);
                    p.css('opacity', 1);
                    $(selected = this).css('opacity', 1).addClass('colorwell-selected');
            });
            
        $("#transparency").spinner({
            min: 0.0,
            max: 1.0, 
            step: 0.1,
            stop:function(e,ui){
                primitiveManager.changePrimitiveMaterial("transparency");
            }
        });
        
        $("#shininess").spinner({
            min: 0.0,
            max: 1.0,
            step: 0.1,
            stop:function(e,ui){
                primitiveManager.changePrimitiveMaterial("shininess");
            }
        });

        $("#DeletePlane").tooltip();
        $("#DeleteAxis").tooltip();
        $("#warning").tooltip();
        
        that.TBGrid.highlight();
        that.TBPlane.highlight();

        primitiveManager.setUI(that);
    };
    
    
    
    /*
     * Clamps value on min and max if required
     * @param {string} min minimal range of value
     * @param {string} max maximum range of value
     * @param {string} value param that should be clamped
     * @returns (clamped value)
     */
    function clamp(min, max, value) {
        min = parseFloat(min);
        max = parseFloat(max);
        if (min !== null && !isNaN(min) && value < min)
            return min;
        else if (max !== null && !isNaN(max) && value > max)
            return max;

        return value;
    }
    
    
    
    /*
     * Initializes all special components of the Component Editor UI 
     * @returns {Null}
     */
    this.initializeComponentEditorSpecialUI = function (){

        for (var prim in that.primitiveParameterMap){
            this.addLeftbarElement(that.primitiveParameterMap[prim].image,
                              that.primitiveParameterMap[prim].editorName);
            this.addContextMenuEntry(that.primitiveParameterMap[prim].editorName);
        }
        
        // disable default behavior which opens another context menu by itself
        document.getElementById('contextMenu').oncontextmenu = function(evt) {
            evt.preventDefault();
            evt.stopPropagation();
            evt.returnValue = false;
            return false;
        };
        
        //Initialize 2D-Editor
        var editor2DCanvas = $('#Editor2D-Canvas');
        editor2DCanvas.editor2D();
        editor2DCanvas.on('modechanged', this.editor2D_onModeChanged);
        editor2DCanvas.on('readychanged', this.editor2D_onReadyChanged);
    };
    
    

    /*
     * Initializes all special components of the Plant Editor UI 
     * @returns {Null}
     */
    this.initializePlantEditorSpecialUI = function (){

    };
    
    

    /*
     * Adds a button for a given component type.
     * TODO: this is just for debugging.
     */
    this.addComponentType = function(typeName, imgSrc){
        //create the button, and configure its behavior
        var divID = document.createElement("div");

        // @mlimper: the following 4 lines are for drag and drop of components, the ids are important for defining type
        divID.setAttribute("id", typeName);

        divID.setAttribute('draggable', "true");
        divID.ondragstart = controller.dragComponent;

        divID.innerHTML = "<img src='" + imgSrc + "' id='icon_" + typeName + "' width='100%' height='100%'>";
        //

        divID.setAttribute("style", "float:left; width: 70px; height: 70px; margin: 5px; padding: 0px; border: solid 1px " +
                            defColor + "; border-radius: 5px;");

        divID.setAttribute("onmouseover", "this.style.cursor='pointer'; this.style.border = 'solid 1px " + highlightColor +
                           "'; document.getElementById('" + typeName + "_inner').style.color = '" + highlightColor + "';");
        divID.setAttribute("onmouseout", "this.style.cursor='pointer'; this.style.border = 'solid 1px " + defColor +
                           "'; document.getElementById('" + typeName + "_inner').style.color = '" + highlightColor + "';");
        divID.setAttribute("onmouseleave", "this.style.cursor='pointer'; this.style.border = 'solid 1px " + defColor +
                           "'; document.getElementById('" + typeName + "_inner').style.color = '" + highlightColor + "';");

        divID.onclick = function () {
            primitiveManager.addComponent(typeName);
        };

        var innerIDDiv = document.createElement("div");
        innerIDDiv.setAttribute("id", typeName + "_inner");
        innerIDDiv.setAttribute("style", "color: " + highlightColor + "; margin-top: " +
                                (typeName.length > 20 ? "-50" : "-40") + "px; text-align: center;"); // hack
        innerIDDiv.innerHTML = typeName;

        divID.appendChild(innerIDDiv);
        document.getElementById("componentCatalogueDebugDiv").appendChild(divID);

        primitiveManager.primType_counter[typeName] = 0;
    };



    /*
     * Creates an array with primitives an their parameters, including
     * a mapping between the x3dom names and editor names and a default value
     * @param {string} file path to map source file (XML)
     * @returns {Array}
     */
    function createParameterMap(file){
       var xhttp = new XMLHttpRequest();
       xhttp.open("GET", file, false);
       xhttp.send();
       
       var xmlDoc = xhttp.responseXML.childNodes[0];
       var primitives = xmlDoc.getElementsByTagName("Primitive");
       
       var primitiveParameterMap = [];
       for (var i = 0; i < primitives.length; i++){
            var currPrim = primitives[i];
            primitiveParameterMap[currPrim.getAttribute("editorName")] =
            { editorName: currPrim.getAttribute("editorName"),
              x3domName: currPrim.getAttribute("x3domName"),
              image: currPrim.getAttribute("image"),
              parameters : [] };

            var parameters = currPrim.getElementsByTagName("Parameter");
            for (var j = 0; j < parameters.length; j++){
                var currParam = parameters[j];
                primitiveParameterMap[currPrim.getAttribute("editorName")].parameters.push(
                { editorName: currParam.getAttribute("editorName"),
                  x3domName: currParam.getAttribute("x3domName"),
                  value: currParam.textContent,
                  min: currParam.getAttribute("min"),
                  max: currParam.getAttribute("max"),
                  type: (currParam.getAttribute("type") !== null) ? currParam.getAttribute("type") : "spinner",
                  render: (currParam.getAttribute("render") !== null) ? currParam.getAttribute("render") : "true",
                  step: (currParam.getAttribute("step") !== null) ? currParam.getAttribute("step") :
                                            (currParam.getAttribute("type") !== "angle") ? 0.1 : 1.0,
                  isOrigin: (currParam.getAttribute("isOrigin") !== null) ? Boolean(currParam.getAttribute("isOrigin")) : false,
                  isRefPoint: (currParam.getAttribute("isRefPoint") !== null) ? Boolean(currParam.getAttribute("isRefPoint")) : false
                } );
            }
            primitiveParameterMap[currPrim.getAttribute("editorName")].parameters.isOrigin = currPrim.getAttribute("isOrigin") !== null ? 
                                                                                             Boolean(currPrim.getAttribute("isOrigin")) : false;
            primitiveParameterMap[currPrim.getAttribute("editorName")].parameters.isRefPoint = currPrim.getAttribute("isRefPoint") !== null ? 
                                                                                             Boolean(currPrim.getAttribute("isRefPoint")) : false;
       }
       
       return primitiveParameterMap;
    }
    
    
    
    /*
     * Creates a new text field property with getter and setter of function
     * @param {id} identifier in the html document where the value should be get/set
     * @returns {property with getter and setter}
     */
    this.newSpinnerProperty = function(id){
        var obj = {};

        obj.get = function(){
            return $("#" + id).spinner("value");
        };
        
        obj.set = function(value){
            $("#" + id).spinner("value", value);
        };
        
        obj.disable = function(bool){
            $("#" + id).spinner( "option", "disabled", bool );
        };
        
        obj.step = function(step){
            if (typeof step === 'undefined')
            {
                return $("#" + id).spinner( "option", "step");
            }
            else
            {
                return $("#" + id).spinner( "option", "step", step );
            }
        };
        
        obj.min = function(min){
            $("#" + id).spinner( "option", "min", min );
        };
        
        obj.max = function(max){
            $("#" + id).spinner( "option", "max", max );
        };
        
        return obj;
    };
    
    
    
    /*
     * Creates a new text field property with getter and setter of function
     * @param {id} identifier in the html document where the value should be get/set
     * @returns {property with getter and setter}
     */
    this.newTextProperty = function(id, toolTip){
        var obj = {};

        obj.get = function(){
            return document.getElementById(id).value;
        };
        
        obj.set = function(value){
            document.getElementById(id).value = value;
        };
        
        obj.disable = function(bool){
            var o = document.getElementById(id);
            if (bool)
                o.style.opacity="0.5";
            else
                o.style.opacity="1.0";
            o.disabled = bool;
        };
        
        if (toolTip)
            $("#"+id).tooltip();
        
        return obj;
    };


    /*
     * Creates a new label property with getter and setter of function
     * @param {id} identifier in the html document where the value should be get/set
     * @returns {property with getter and setter}
     */
    this.newLabelProperty = function(id){
        var obj = {};

        obj.get = function(){
            return document.getElementById(id).textContent;
        };
        
        obj.set = function(value){
            document.getElementById(id).textContent = value;
        };
        
        return obj;
    };
    
    
    
    /*
     * Creates a new image property with getter and setter of function
     * @param {id} identifier in the html document where the value should be get/set
     * @returns {property with getter and setter}
     */
    this.newImageProperty = function(id, toolTip){
        
        var obj = {};
        obj.highlighted = false;

        obj.get = function(){
            return document.getElementById(id).value;
        };
        
        obj.set = function(value){
            document.getElementById(id).textContent = value;
        };
        
        obj.setImage = function(url){
            document.getElementById(id).src = url;
        };
        
        obj.highlight = function(){
            document.getElementById(id).style.border = "solid 1px " + highlightColorButton;
            obj.highlighted = true;
        };
        
        obj.dehighlight = function(){
            document.getElementById(id).style.border = "solid 1px " + defColor;
            obj.highlighted = false;
        };
        
        
        obj.disable = function(bool){
            var obj = document.getElementById(id);
            if (bool)
                obj.style.opacity="0.5";
            else
                obj.style.opacity="1.0";
            obj.disabled = bool;
        };
        
        if (toolTip)
            $("#"+id).tooltip();
        
        return obj;
    };
    
    
    
    /*
     * Creates a new combobox property with getter and setter of function
     * @param {id} identifier in the html document where the value should be get/set
     * @returns {property with getter and setter}
     */
    this.newComboBoxProperty = function(id, toolTip){
        var obj = {};

        obj.get = function(index){
            return document.getElementById(id)[index];
        };
        
        obj.set = function(index, value){
            document.getElementById(id)[index].text = value;
        };
        
        obj.disable = function(bool){
            var obj = document.getElementById(id);
            if (bool)
                obj.style.opacity="0.5";
            else
                obj.style.opacity="1.0";
            obj.disabled = bool;
        };
        
        obj.idMap = function(index){
            return document.getElementById(id)[index].primitive.idMap(index);
        };
        
        obj.selectedIndex = function(){
            return document.getElementById(id).selectedIndex;
        };
        
        obj.selectIndex = function(index){
            document.getElementById(id).selectedIndex = index;
        };
        
        obj.add = function(option){
            document.getElementById(id).add(option,null);
        };
        
        obj.remove = function(index){
            document.getElementById(id).remove(index);
        };
        
        if (toolTip)
            $("#"+id).tooltip();
        
        return obj;
    };
    
    

    /*
     * Toggeling fade function of the left toolbar
     */
    this.fadeLeft = function(){
       if (fadeSwitch[0] === 0){
           $("#Links").animate(
           {
               left: "-207px"
           }, 250);
           fadeSwitch[0]++;
       }
       else {
           $("#Links").animate(
           {
               left: "0px"
           }, 250);
           fadeSwitch[0]--;
       }
    };


   /*
    * Toggeling fade function of the right toolbar
    */
   this.fadeRight = function(){
       if (fadeSwitch[1] === 0){
           $("#Rechts").animate(
           {
               right: "-190px"
           }, 250);
           fadeSwitch[1]++;
       }
       else {
           $("#Rechts").animate(
           {
               right: "0px"
           }, 250);
           fadeSwitch[1]--;
       }
    }; 
       
    
    var statisticsTick = false;
    /*
     * Show or hide stats
     */
    this.showStatistik = function(htmlID)
    {
        statisticsTick = !statisticsTick;
        if (statisticsTick){
            document.getElementById(htmlID+"_tick").style.visibility = "visible";
        }
        else {
            document.getElementById(htmlID+"_tick").style.visibility = "hidden";
        }
        document.getElementById("x3d").runtime.statistics();
    };


    var infoTick = false;
    /*
     * Show or hide debug log
     */
    this.showInfo = function(htmlID)
    {
        infoTick = !infoTick;
        if (infoTick){
            document.getElementById(htmlID+"_tick").style.visibility = "visible";
        }
        else {
            document.getElementById(htmlID+"_tick").style.visibility = "hidden";
        }
    	document.getElementById("x3d").runtime.debug();
    };


    /*
     * switch between tri, line, pnt mode
     */
    this.togglePoints = function(elem)
    {
        var showPnts = document.getElementById('x3d').runtime.togglePoints(true);
        elem.innerHTML = (showPnts == 0) ? "Points" : ((showPnts == 1) ? "Lines": "Faces");
    };

    
    
	/*  
     * Show the 2D-Editor
     */
    this.editor2D_show = function(mustBeClosed)
    {
        $('#Editor2D-Canvas').editor2D('clear');
        $('#Editor2D-Icon-Accept').removeClass('Editor2D-Icon-Accept').addClass('Editor2D-Icon-Accept-Inactive');
        $('#Editor2D-Icon-Snap').removeClass('Editor2D-Icon-Snap').addClass('Editor2D-Icon-Snap-Active');
        $('#Editor2D-Canvas').editor2D('setSnapToGrid', true);
        $('#Editor2D-Canvas').editor2D('setMustClosed', mustBeClosed);
        $('#Editor2D-Overlay').css('display', 'block');
	};

    /*
     * Hide the 2D-Editor
     */
    this.editor2D_hide = function()
    {
        $('#Editor2D-Overlay').css('display', 'none');
    };

    /*
     * Create new drawing area
     */
    this.editor2D_new = function()
    {
        $('#Editor2D-Canvas').editor2D('clear');
    };

    /*
     * Reset 2D-Editor view
     */
    this.editor2D_reset = function()
    {
        $('#Editor2D-Canvas').editor2D('resetView');
    };

    /*
     * Handle 2D-Editors 'modechanged' event
     */
    this.editor2D_onModeChanged = function(evt)
    {
        that.editor2D_mode(evt.originalEvent.detail.mode);
    };

    /*
     * Handle 2D-Editors 'readychanged' event
     */
    this.editor2D_onReadyChanged = function(evt)
    {
        if (evt.originalEvent.detail.ready)
        {
            $('#Editor2D-Icon-Accept').removeClass('Editor2D-Icon-Accept-Inactive').addClass('Editor2D-Icon-Accept');
        }
        else
        {
            $('#Editor2D-Icon-Accept').removeClass('Editor2D-Icon-Accept').addClass('Editor2D-Icon-Accept-Inactive');
        }
    };

    /*
     * Toggle Snap to Grid
     */
    this.editor2D_toggleSnap = function()
    {
        var snapToGrid = $('#Editor2D-Canvas').editor2D('getSnapToGrid');

        if (snapToGrid)
        {
            $('#Editor2D-Icon-Snap').removeClass('Editor2D-Icon-Snap-Active').addClass('Editor2D-Icon-Snap');
            $('#Editor2D-Canvas').editor2D('setSnapToGrid', false);
        }
        else
        {
            $('#Editor2D-Icon-Snap').removeClass('Editor2D-Icon-Snap').addClass('Editor2D-Icon-Snap-Active');
            $('#Editor2D-Canvas').editor2D('setSnapToGrid', true);
        }
    };

    /*
     * Change 2D-Editors mode
     */
    this.editor2D_mode = function(mode)
    {
        this.editor2D_resetIcons();

        switch (mode)
        {
            case 0:
                $('#Editor2D-Icon-Pen').removeClass('Editor2D-Icon-Pen').addClass('Editor2D-Icon-Pen-Active');
                $('#Editor2D-Canvas').editor2D('changeMode', 0);
                break;
            case 1:
                $('#Editor2D-Icon-Pointer').removeClass('Editor2D-Icon-Pointer').addClass('Editor2D-Icon-Pointer-Active');
                $('#Editor2D-Canvas').editor2D('changeMode', 1);
                break;
            case 2:
                $('#Editor2D-Icon-Eraser').removeClass('Editor2D-Icon-Eraser').addClass('Editor2D-Icon-Eraser-Active');
                $('#Editor2D-Canvas').editor2D('changeMode', 2);
                break;
            case 3:
                $('#Editor2D-Icon-Move').removeClass('Editor2D-Icon-Move').addClass('Editor2D-Icon-Move-Active');
                $('#Editor2D-Canvas').editor2D('changeMode', 3);
                break;
            case 4:
                $('#Editor2D-Icon-Zoom').removeClass('Editor2D-Icon-Zoom').addClass('Editor2D-Icon-Zoom-Active');
                $('#Editor2D-Canvas').editor2D('changeMode', 4);
                break;
        }
    };

    /*
     * Handle 2D-Editors 'modechanged' event
     */
    this.editor2D_create = function () {
        if ($('#Editor2D-Canvas').editor2D('isReady')) {
            //Hide editor
            this.editor2D_hide();

            //Get points
            var points = $('#Editor2D-Canvas').editor2D('samplePoints');

            that.primitiveParameterMap[primitivType].parameters.push({
                render: "false",
                editorName: "Cross Section",
                x3domName: "crossSection",
                value: points.toString()
            });

            var obj = primitiveManager.addPrimitive(
                        that.primitiveParameterMap[primitivType].x3domName,
                        that.primitiveParameterMap[primitivType].parameters);

            obj.setTranslationAsVec(primitivePos);
            primitiveManager.selectObject(obj.getID());
        }
    };


        /*
         * Reset all 2D-Editor icon states
         */
        this.editor2D_resetIcons = function () {
            $('#Editor2D-Icon-Pen').removeClass('Editor2D-Icon-Pen-Active').addClass('Editor2D-Icon-Pen');
            $('#Editor2D-Icon-Pointer').removeClass('Editor2D-Icon-Pointer-Active').addClass('Editor2D-Icon-Pointer');
            $('#Editor2D-Icon-Eraser').removeClass('Editor2D-Icon-Eraser-Active').addClass('Editor2D-Icon-Eraser');
            $('#Editor2D-Icon-Move').removeClass('Editor2D-Icon-Move-Active').addClass('Editor2D-Icon-Move');
            $('#Editor2D-Icon-Zoom').removeClass('Editor2D-Icon-Zoom-Active').addClass('Editor2D-Icon-Zoom');
        };

        /*
         * Adds one primitive element to the left bar
         * @returns (undefined)
         */
        this.addLeftbarElement = function(img, name) {
            var divID = document.createElement("div");
            divID.setAttribute("id", name);

            divID.setAttribute('draggable', "true");
            divID.ondragstart = controller.drag;

            divID.innerHTML = "<img src='" + img + "' id='icon_" + name + "' width='100%' height='100%'>";
            divID.setAttribute("style",
                "float:left; width: 70px; height: 70px; margin: 5px; padding: 0px; border: solid 1px " +
                    defColor + "; border-radius: 5px;");

            divID.setAttribute("onmouseover",
                "this.style.cursor='pointer'; this.style.border = 'solid 1px " + highlightColor +
                    "'; document.getElementById('" + name + "_inner').style.color = '" + highlightColor + "';");
            divID.setAttribute("onmouseout",
                "this.style.cursor='pointer'; this.style.border = 'solid 1px " + defColor +
                    "'; document.getElementById('" + name + "_inner').style.color = '" + highlightColor + "';");
            divID.setAttribute("onmouseleave",
                "this.style.cursor='pointer'; this.style.border = 'solid 1px " + defColor +
                    "'; document.getElementById('" + name + "_inner').style.color = '" + highlightColor + "';");

            if (name == "Extrusion" || name == "Solid of Revolution") {
                divID.onclick = function () {
                    var mustBeClosed = (name == "Extrusion");
                    that.editor2D_show(mustBeClosed);
                    that.setPrimitiveTypeNameAndPos(name, new x3dom.fields.SFVec3f(0, 0, 0));
                };
            }
            else {
                divID.onclick = function () {
                    primitiveManager.addPrimitive(that.primitiveParameterMap[name].x3domName,
                        that.primitiveParameterMap[name].parameters);
                };
            }

            var divIDinnen = document.createElement("div");
            divIDinnen.setAttribute("id", name + "_inner");
            divIDinnen.setAttribute("style", "color: " + highlightColor + "; margin-top: " +
                (name.length > 20 ? "-50" : "-40") + "px; text-align: center;");    // hack
            divIDinnen.innerHTML = name;

            divID.appendChild(divIDinnen);
            document.getElementById("divs").appendChild(divID);

            primitiveManager.primType_counter[that.primitiveParameterMap[name].x3domName] = 0;
        };


        this.setPrimitiveTypeNameAndPos = function(name, pos) {
            primitivType = name;
            primitivePos = pos;
        };


        this.addContextMenuEntry = function(name) {
            var div = document.getElementById("innerContextMenu");
            var that = this;

            var divPrim = document.createElement("div");
            divPrim.setAttribute("id", "ctx_" + name);
            divPrim.setAttribute("class", "ContextMenuEntry");
            divPrim.innerHTML = name;

            div.appendChild(divPrim);

            divPrim.onclick = function () {
                if (name == "Extrusion" || name == "Solid of Revolution") {
                    that.editor2D_show( (name == "Extrusion") );
                    that.setPrimitiveTypeNameAndPos(name, primitivePos);
                }
                else {
                    var obj = primitiveManager.addPrimitive(
                        that.primitiveParameterMap[name].x3domName,
                        that.primitiveParameterMap[name].parameters);

                    if (obj) {  // null if 2nd origin
                        obj.setTranslationAsVec(primitivePos);
                        primitiveManager.selectObject(obj.getID());
                    }
                }
                document.getElementById("contextMenu").style.display = "none";
            };
        };


        this.createElemOnClick = function(event) {
            var div = document.getElementById("contextMenu");
            var runtime = document.getElementById("x3d").runtime;
            var canvas = runtime.canvas;

            // if right button released and not navigating or interacting
            if (event.button == 2 && !canvas.doc._viewarea.isMoving()) {
                var elem = canvas.canvas.offsetParent;
                var canvasPos = elem.getBoundingClientRect();

                var x = canvasPos.left + event.layerX;
                var y = canvasPos.top  + event.layerY;

                // get ray from eye through mouse position and calc dist to ground plane
                var ray = runtime.getViewingRay(event.layerX, event.layerY);
                var len = 100;

                // if ray not parallel to plane and reasonably near then use d
                if (Math.abs(ray.dir.y) > x3dom.fields.Eps) {
                    var d = -ray.pos.y / ray.dir.y;
                    len = (d < len) ? d : len;
                }

                primitivePos = ray.pos.add(ray.dir.multiply(len));

                div.style.left = (x - 1) + "px";
                div.style.top  = (y - 1) + "px";
                div.style.display = "table-cell";
            }
            else {
                div.style.display = "none";
            }
        };


        /*
         * Clears all the properties on the right bar
         * @returns (undefined)
         */
        this.clearParameters = function () {
            var properties = document.getElementById("properties");
            for (var i = (properties.children.length - 1); i >= 0; i--) {
                properties.removeChild(properties.children[i]);
            }
        };


        /*
         * Creates all given parameters and adds it to the right bar
         * @param {x3dom geometry} geometry where the parameters should be set
         * @returns (undefined)
         */
        this.createParameters = function (parameters, prim) {
            for (var i = 0; i < parameters.length; i++) {
                this.addRightbarElement({param: parameters[i],
                                         id:    "property_" + i,
                                         primitive: prim});
            }
        };


        /*
         * Adds one parameter value to the right bar
         * @param {object} object includes editorName and x3domName of parameter and
         * the value that should be set
         * @returns (Null)
         */
        this.addRightbarElement = function(object) {
            if (object.param.render !== null && object.param.render === "false")
                return;

            var divID = document.createElement("div");
            divID.setAttribute("style", "float: left; margin-bottom: 10px; border-bottom: 1px solid gray; padding-bottom: 10px;");
            if (object.param.type === "bool")
                boolProperty();
            else if (object.param.type === "vec2")
                vecProperty(2);
            else if (object.param.type === "vec3")
                vecProperty(3);
            else
                normalProperty();


            /*
             * Clamps value on min and max if required
             * @param {string} min minimal range of value
             * @param {string} max maximum range of value
             * @param {string} value param that should be clamped
             * @returns (clamped value)
             */
            function clamp(min, max, value) {
                min = parseFloat(min);
                max = parseFloat(max);
                if (min !== null && value < min)
                    return min;
                else if (max !== null && value > max)
                    return max;

                return value;
            }


            function normalProperty() {
                var newLabel = document.createElement("label");
                newLabel.setAttribute("style", "float: left; width: 100%; margin-bottom: 5px;");
                newLabel.innerHTML = object.param.editorName;

                var newInput = document.createElement("input");
                newInput.setAttribute("style", "float: left; width: 100%;");
                newInput.id = object.id;
                newInput.value = object.param.value;

                divID.appendChild(newLabel);
                divID.appendChild(newInput);
                document.getElementById("properties").appendChild(divID);

                $("#" + object.id).spinner({
                    step: object.param.step,
                    min: object.param.min,
                    max: object.param.max,
                    stop: function (e, ui) {
                        if (object.param.type === "angle") {
                            object.primitive.setAttribute(object.param.x3domName,
                                clamp(object.param.min, object.param.max, document.getElementById(object.id).value) * Math.PI / 180);
                        }
                        else {
                            object.primitive.setAttribute(object.param.x3domName,
                                clamp(object.param.min, object.param.max, document.getElementById(object.id).value));
                        }

                        object.param.value = clamp(object.param.min, object.param.max, document.getElementById(object.id).value);
                        document.getElementById(object.id).value = object.param.value;

                        primitiveManager.highlightCurrentObject(true);
                    }
                });
            }


            function boolProperty() {
                var newLabel = document.createElement("label");
                newLabel.setAttribute("style", "float: left; width: 100%; margin-bottom: 5px;");
                newLabel.innerHTML = object.param.editorName;

                var newInput = document.createElement("input");
                newInput.setAttribute("style", "float: left; width: 100%;");
                newInput.id = object.id;
                newInput.value = object.param.value;

                divID.appendChild(newLabel);
                divID.appendChild(newInput);
                document.getElementById("properties").appendChild(divID);

                $("#" + object.id).switchButton({
                    checked: object.param.value,
                    width: 58,
                    height: 15,
                    button_width: 29,
                    on_label: 'true',
                    off_label: 'false'
                })
                    .change(function () {
                        object.primitive.setAttribute(object.param.x3domName,
                            document.getElementById(object.id).checked);
                        object.param.value = document.getElementById(object.id).checked;

                        // fake param HACK, field obviously doesn't exist
                        if (object.param.x3domName == "positive") {
                            var material = primitiveManager.getMaterialFor(object.primitive);
                            primitiveManager.highlightCurrentObject(false);

                            if (!object.param.value)
                                material.setAttribute("diffuseColor", "#E77F65");
                            else
                                material.setAttribute("diffuseColor", "#3F7EBD");
                            //farbtasticPicker.setColor(material.getAttribute("diffuseColor"));
                            console.log(material.getAttribute("diffuseColor"));
                        }
                    });
            }


            function vecProperty(vecSize) {
                var labels = ["X:", "Y:", "Z:"];
                var i;

                var newLabel = document.createElement("label");
                newLabel.setAttribute("style", "float: left; margin-bottom: 5px; width: 100%;");
                newLabel.innerHTML = object.param.editorName;
                divID.appendChild(newLabel);

                for (i = 0; i < vecSize; i++) {
                    var outerDiv = document.createElement("div");
                    outerDiv.setAttribute("style", "float: left; margin-bottom: 5px;");

                    var descLabel = document.createElement("label");
                    descLabel.setAttribute("style", "float: left; width: 25px;");
                    descLabel.innerHTML = labels[i];
                    divID.appendChild(descLabel);

                    var newInput = document.createElement("input");
                    newInput.setAttribute("style", "float: left; width: 80px;");
                    newInput.id = object.id + "_" + i;
                    newInput.value = object.param.value.split(",")[i];
                    outerDiv.appendChild(descLabel);
                    outerDiv.appendChild(newInput);
                    divID.appendChild(outerDiv);
                }

                document.getElementById("properties").appendChild(divID);

                for (i = 0; i < vecSize; i++) {
                    $("#" + object.id + "_" + i).spinner({
                        step: object.param.step,
                        min: object.param.min,
                        max: object.param.max,

                        stop: function (e, ui) {
                            var obj0 = document.getElementById(object.id + "_0");
                            var obj1 = document.getElementById(object.id + "_1");
                            var obj2 = document.getElementById(object.id + "_2");

                            var obj0val = clamp(object.param.min, object.param.max, obj0.value);
                            var obj1val = clamp(object.param.min, object.param.max, obj1.value);
                            var obj2val = clamp(object.param.min, object.param.max, obj2.value);

                            object.param.value = obj0val + "," + obj1val + "," + obj2val;
                            object.primitive.setAttribute(object.param.x3domName, object.param.value);

                            obj0.value = obj0val;
                            obj1.value = obj1val;
                            obj2.value = obj2val;

                            primitiveManager.highlightCurrentObject(true);
                        }
                    });
                }
            }
        };


        /*
         * Sets all parameters of a material to the material editor on the right bar
         * @param {material} material includes diffuse, specular, emissive color,
         * shininess and transparency
         * @returns (Null)
         */
        this.setMaterial = function (material) {
            if ($("#accordeon-oben").accordion("option", "active") === 1) {
                var colorfield = document.getElementById("diffuse");
                var color = material.getAttribute("diffuseColor");
                colorfield.focus();
                farbtasticPicker.setColor(color);

                colorfield = document.getElementById("specular");
                color = material.getAttribute("specularColor");
                colorfield.focus();
                farbtasticPicker.setColor(color);

                colorfield = document.getElementById("emissive");
                color = material.getAttribute("emissiveColor");
                colorfield.focus();
                farbtasticPicker.setColor(color);

                document.getElementById("transparency").value = material.getAttribute("transparency");
                document.getElementById("shininess").value = material.getAttribute("shininess");

                document.getElementById("diffuse").focus();
            }
        };



        this.buildCatalogueTreeFromGroupsAndNodes = function(){
            $("#catalogueTree").dynatree("getRoot").removeChildren();

            var i;
            var nodeData;

            for (i = 0; i < this.catalogueTreeNodes.length; ++i)
            {
                nodeData = this.catalogueTreeNodes[i];

                if (nodeData.groupName == "")
                {
                    this.catalogueTreeViewer.addGroup(nodeData.name, nodeData.name);
                }
            }

            for (i = 0; i < this.catalogueTreeNodes.length; ++i)
            {
                nodeData = this.catalogueTreeNodes[i];

                if (nodeData.groupName != "")
                {
                    this.catalogueTreeViewer.addNode(nodeData.name, nodeData.name, nodeData.groupName);
                }
            }
        };



        this.componentSearchFieldChanged = function(str) {
            this.limitCatalogueTreeToMatchingEntries(str);
        };



        this.limitCatalogueTreeToMatchingEntries = function(str, caseSensitive){
            //unfortunately, with the "dynatree" tree view, there is not other way than removing nodes
            this.buildCatalogueTreeFromGroupsAndNodes();

            var strContains;
            var i;
            var root         = $("#catalogueTree").dynatree("getRoot");
            var rootChildren = root.getChildren();

            //by default, the search is not case sensitive
            if (arguments.length >= 2 && caseSensitive)
            {
                strContains = function(strA, strB)
                {
                    return (strA.indexOf(strB) != -1);
                }
            }
            else
            {
                strContains = function(strA, strB)
                {
                    return (strA.toLowerCase().indexOf(strB.toLowerCase()) != -1);
                }
            }

            var removeNonMatchingNodes = function(node)
            {
                var j;
                var children;

                if (!node.data.isFolder && !strContains(node.data.title, str))
                {
                    node.remove();
                }
                else
                {
                    children = node.getChildren();

                    for (j = 0; children && j < children.length; ++j)
                    {
                        removeNonMatchingNodes(children[j]);
                    }
                }
            };

            for (i = 0; i < rootChildren.length; ++i)
            {
                removeNonMatchingNodes(rootChildren[i]);
            }
        };

}

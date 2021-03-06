
window.URL = window.URL || window.webkitURL;


//this map holds the information whether a component with a given name has already been registered
var registeredComponentTypeToX3DStrings = {};


function clearRegisteredComponentX3DStrings(){
    registeredComponentTypeToX3DStrings = {};
}


function getOrCreateRegisteredComponentX3DString(typeName, x3dStr){
    var inlineElement;
    var modelStringURLBlob;
    var modelStringURL;

    if (typeof registeredComponentTypeToX3DStrings[typeName] === 'undefined')
    {
        registeredComponentTypeToX3DStrings[typeName] = x3dStr;

        inlineElement = document.createElement("inline");
        inlineElement.setAttribute('nameSpaceName', "NS_" + typeName);
        inlineElement.setAttribute('mapDEFToID', "true");

        //create a blob from the component's x3d representation, and use it as url for the inline node
        modelStringURLBlob = new Blob([x3dStr], {type: 'text/plain'});

        modelStringURL = window.URL.createObjectURL(modelStringURLBlob);

        inlineElement.setAttribute("DEF", "COMPONENT_" + typeName);
        inlineElement.setAttribute("url", modelStringURL);

        document.getElementById('componentsRoot').appendChild(inlineElement);

        primitiveManager.primType_counter[typeName] = 0;
    }

    return registeredComponentTypeToX3DStrings[typeName];
}


Component.prototype = new TransformableObject();
Component.prototype.constructor = Component;

function Component(typeName){
    //here, we assume that the component type has already been registered!
    if (typeof registeredComponentTypeToX3DStrings[typeName] === 'undefined')
    {
        x3dom.debug.logError("Cannot create component instance of type \"" + typeName + "\", no such type registered.");
        return;
    }

    //not very elegant, but necessary because of the dynamic id
    //(which differs among instances, in contrast to other members of the prototype)
    this.init();

    var that = this;

    this.domNode = document.createElement("inline");

    // USE attribute must be set before attaching to tree because only in attach this is evaluated
    //this.domNode.setAttribute("USE", "COMPONENT_" + typeName);

    //===============
    // workaround (instead of USEing it, brute-force reloading the inlined scene)
    var modelStringURLBlob = new Blob([getOrCreateRegisteredComponentX3DString(typeName)], {type: 'text/plain'});
    var modelStringURL     = window.URL.createObjectURL(modelStringURLBlob);
    this.domNode.setAttribute("url", modelStringURL);
    //===============

    this.matrixTransformNode.appendChild(this.domNode);

    document.getElementById('root').appendChild(this.matrixTransformNode);

    // wrapper for adding moving functionality, last param is callback function,
    // must be called _after_ having added node to tree since otherwise uninitialized
    new x3dom.Moveable(document.getElementById("x3d"),
        this.matrixTransformNode,
        function(elem, pos){ primitiveManager.objectMoved(elem, pos, that); },
        controller.getGridSize());
}

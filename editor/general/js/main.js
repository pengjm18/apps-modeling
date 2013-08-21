// PrimitiveManager handles the adding of new primitives and their behaviour
var primitiveManager = new PrimitiveManager();
// UI handles all the access to all gui elements
var ui = new UI(primitiveManager);
// Controller that handles the activation of the transformation modes
var controller = new Controller(ui);
// Variable that defines the handling mode
var HANDLING_MODE = "translation";


window.onload = function(){
    ui.initialize(); 
    controller.Activate("hand");
    primitiveManager.clearTransformationValues();
    
    
    /* Bitte nicht entfernen, ist zum testen, wenn dann auskommentieren */
    var snapping = new Snapping();
    snapping.testObject();
};


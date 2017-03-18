/**
 * Created by ezmeyers on 4/12/16.
 */
var db, sketchController;

var drawingColor = "#000";

//call init function straightaway
init();

function init(){
    sketchController = $("#sketchpad").sketch().data('sketch');
    $("#colorpicker").on("input", setDrawingColor);
    $("#sizepicker").on("input", setDrawingSize);


}

//drawing tool event handlers

function setDrawingColor(event){
    sketchController.color = this.value;
}

function setDrawingSize(event){
    sketchController.size = this.value;
}
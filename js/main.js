const planets = {};

var txOrbit;
var ejectOrbit;
var captureOrbit;


let currentTime = 1;
let displayedTime = 0;



function initialize(){
    
    initializeMFD();
    initializeScreen();

    getPlanetsXML( ()=>{
        initializeSVG();
        console.log("intialized");
        troubleShoot();
    });

}

function troubleShoot(){
    console.log("troubleshoot");
    //initializeEjectionOrbit();
}


$(document).ready(function () {
    
    console.log("document loaded");    

    initialize();

})


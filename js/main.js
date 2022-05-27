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
        
        initializeSolarSystemSVG();
        setSolarSystemSVG();

        console.log("intialized");
        troubleShoot();
    });

}

function troubleShoot(){
    console.log("troubleshoot");
    //initializeEjectionOrbit();
}


function onDocumentReady(){
    console.log("document loaded");

    initialize();
}



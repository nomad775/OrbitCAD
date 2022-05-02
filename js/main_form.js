
const planets = { };

let originName = "Kerbin";
let destinationName = "Duna";
let disabledDestName = "Kerbin";

var transferOrbit;

var currentTime = 0;
var displayedTime = 0;

const displayedTimeChangeEvent = new Event('displayedTimeChange');

function initializeFromQueryString(){

    let params = new URLSearchParams(location.search);
    let hasParams = params.has("utY");
    
    if(!hasParams){
        console.log("no history");
        return false;
    }

    console.log("from history");
    
    originName = params.get("origin");
    destinationName = params.get("destination");
    disabledDestName = originName;

    let y = params.get("utY");
    let d = params.get("utD");
    let h = params.get("utH");
    let m = params.get("utM");

    currentTime = (y - 1) * secondsPerYear + (d - 1) * secondsPerDay + h * secondsPerHour + m * secondsPerMinute;

    document.forms["origin-destination"]["utY"].value = y;
    document.forms["origin-destination"]["utD"].value = d;
    document.forms["origin-destination"]["utH"].value = h;
    document.forms["origin-destination"]["utM"].value = m;

    document.forms["origin-destination"]["origin"].value = originName;
    document.forms["origin-destination"]["destination"].value = destinationName;

    console.log("origin-destination from history");

    return true;
}

function initializeForm(){

    let originOpt = document.getElementById("originSet")
    originOpt.addEventListener("click", originChange)
    originOpt.addEventListener("change", (e) => transferOrbit.eventHandler(e));
    
    let destOpt = document.getElementById("destinationSet")
    destOpt.addEventListener("click", destinationChange)
    destOpt.addEventListener("change", (e) => transferOrbit.eventHandler(e));
    
    let alignCheck = document.getElementById("chkAlign");
    alignCheck.addEventListener("change", (e) => transferOrbit.eventHandler(e));

    window.addEventListener("displayedTimeChange", displayedTimeChange);

    document.forms["origin-destination"]["origin"].value = originName;
    document.forms["origin-destination"]["destination"].value = destinationName;
    
    originChange();
    destinationChange();
}

function initialize() {

    getPlanetsXML( () => {

        initializeFromQueryString();
        initializeScreen();
        initializeSolarSystemSVG();
        initializeTransferOrbit();
        initializeForm();

        currentTimeChange();

        zoomTxOrbit();


        console.log("initialized");

    });
}




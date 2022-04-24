
const planets = { };

var txOrbit;

var currentTime = 0;
var displayedTime = 0;

function initializeFromQueryString(){

    let params = new URLSearchParams(location.search);
    let hasParams = params.has("utY");
    
    if(!hasParams){
        console.log("no history");
        return false;
    }

    console.log("from history");
    console.log(params.get("origin"));
    console.log(params.get("destination"));

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

    console.log("initialized from history");

    return true;
}

function initialize() {

    getPlanetsXML(() => {

    initializeFromQueryString();

    window.addEventListener("displayedTimeChange", displayedTimeChange);

    let originOpt = document.getElementById("originSet")

    originOpt.addEventListener("click", originChange)
    originOpt.addEventListener("change", (e) => svgTxOrbit.eventHandler(e));
    originOpt.value = originName;

    let destOpt = document.getElementById("destinationSet")
    destOpt.addEventListener("click", destinationChange)
    destOpt.addEventListener("change", (e) => svgTxOrbit.eventHandler(e));
    destOpt.value = destinationName;


    initializeScreen();
    initializeSolarSystemSVG();
    setSolarSystemSVG();
    txOrbit = initializeTransferOrbit();
    initializeTransferSVG(txOrbit);

    currentTimeChange();

    //displayedTime=txOrbit.solveTForRdv(currentTime);
    //window.dispatchEvent(displayedTimeChangeEvent);

    zoomTxOrbit();

    console.log("intialized");

    });
}

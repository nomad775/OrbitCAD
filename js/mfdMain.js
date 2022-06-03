const planets = {};

let currentTime = 1;
let displayedTime = 0;

var txOrbit;
var ejectOrbit;
var captureOrbit;

const timeChangeEvent = new Event('timeChange');
const displayedTimeChangeEvent = new Event('displayedTimeChange');


// ---------- page 1 ----------

function setTime(name) {

    let dialog = document.getElementById('timeEntry');
    //let form = document.getElementById("frmTimeEntry");
    //form["field"].value = name;
    
    dialog.showModal();

    let optButton = document.getElementById("optB0");
    optButton.checked = false;
}

function getTime() {

    var form = document.getElementById('frmTimeEntry');

    if (form.returnValue = "Submit") {
        console.log("TIME SET")
        let name = form.field.value;
        let uts = form.utS.value;

        document.forms["initializeTransfer"]["utNow"].value = uts;
        displayedTime = uts;

        window.dispatchEvent(timeChangeEvent);
    }

}

function planetClickAsInput(event, planetName){

    console.log(planetName + " clicked");

    let inputField = document.forms["frmBottom"]["bottom"].value;

    var fieldName;

    switch (Number(inputField)){
        case 0:
            fieldName="set ut";
            break;
        case 1:
            fieldName="origin";
            document.forms["initializeTransfer"]["origin"].value = planetName;
            break;
        case 2:
            fieldName="destination";
            document.forms["initializeTransfer"]["destination"].value = planetName;
            break;
    }

    let optButton = document.getElementById("optB"+inputField);
    optButton.checked=false;

    console.log(fieldName);
    let origin = document.forms["initializeTransfer"]["origin"].value;
    let destination = document.forms["initializeTransfer"]["destination"].value;

    let mainForm = document.forms["initializeTransfer"];
    let isValid = mainForm.checkValidity() && (origin != destination);

    document.getElementById("optB5").disabled= !isValid;

}

function next(){
    
    console.log("next");
    document.forms["initializeTransfer"].submit();

}

// ---------- end page 1 ----------



// --------- page 2 ---------

function initializeTransfer(originName, destinationName, utNow){
    
    transferOrbit = new SVGTransfer(originName, destinationName);
    displayedTime = transferOrbit.solveTForRdv(utNow);
    window.dispatchEvent(displayedTimeChangeEvent);
}

function setAlt(){

    let dialog = document.getElementById('altEntry');
    dialog.showModal();

    let optButton = document.getElementById("optB0");
    optButton.checked = false;
}

function fromPrev() {

    console.log("start 2");

    let params = new URLSearchParams(location.search);

    let page = params.get("page");
    let utNow = params.get("utNow");
    let originName = params.get("origin");
    let destinationName = params.get("destination");

    // document.getElementById("outCurrentTime").textContent = convertSecondsToDateObj(utNow).toString();
    // document.getElementById("outOrigin").textContent = originName;
    // document.getElementById("outDestination").textContent = destinationName;

    var svg = document.getElementById("planetSystem");
    svg.addEventListener("mousemove", mouseMove);

    //planetsData = window.localStorage.getItem("planetsXML");
    //createPlanetObjectsFromXML(planetsData, () => { });

    let originPlanet = planets[originName];
    let destinationPlanet = planets[destinationName];

    let txOrbit = new TransferOrbit(originPlanet, destinationPlanet);

    if (type == "capture") {

        planetName = destinationName;
        t = toa;
        txOrbit.update(t);
        v3 = txOrbit.v3d;
        outbound = false;

        document.getElementById("outOrigin").toggleAttribute("active");
        document.getElementById("outDestination").classList.add("active");

    } else {

        planetName = originName;
        t = tod;
        txOrbit.update(t);
        v3 = txOrbit.v3o;
        outbound = true;

        document.getElementById("outOrigin").classList.add("active");
        // document.getElementById("outDestination").textContent = destinationName;
    }

    let peAlt = 100000
    initializeEjectionSVG(planetName, t, peAlt, v3, outbound);
    peChange();

}

function peChange() {

    let form = document.forms["parkOrbit"];
    let peAlt = form["peAlt"].value * 1000;

    updateHypSVG(peAlt)

    let theOrbit = hypOrbit;

    let pe = theOrbit.peAlt / 1000;
    let lnPe = theOrbit.lnPe;
    let dv = theOrbit.deltaV;
    let tof = theOrbit.TOF;

    let params = new URLSearchParams(location.search);
    let todTx = Number(params.get("tod"));
    let tod = todTx - tof;

    document.getElementById("outPe").textContent = pe;
    document.getElementById("outLnPe").textContent = radToDeg(lnPe, 1);
    document.getElementById("outDv").textContent = dv.toFixed(2);
    document.getElementById("outTod").textContent = convertSecondsToDateObj(tod).toString();

    document.getElementById("outTurnAngle").textContent = radToDeg(theOrbit.turnAngle, 2);
    document.getElementById("outV2Angle").textContent = radToDeg(theOrbit.v2Angle, 2);
    document.getElementById("outV2AngleDelta").textContent = radToDeg(theOrbit.v2AngleDelta, 2);
    document.getElementById("outEjectionAngle").textContent = 90 + radToDeg(theOrbit.turnAngle);

    document.getElementById("outA").textContent = theOrbit.a.toFixed(0);
    document.getElementById("outE").textContent = theOrbit.e.toFixed(4);
    document.getElementById("outTof").textContent = convertSecondsToDateObj(tof).toString();

    document.getElementById("nodeLn").textContent = radToDeg(lnPe, 1);
    document.getElementById("nodeDv").textContent = dv.toFixed(2);
    document.getElementById("nodeTod").textContent = convertSecondsToDateObj(tod).toString();

    scaleText();
}

function validate() {

    let form = document.forms["parkOrbit"];

    if (form["circular"].checked) {
        return true;
    }

    let pe = Number(document.forms["parkOrbit"]["pe"].value);
    let ap = Number(document.forms["parkOrbit"]["ap"].value);
    let valid = !(pe > ap);
    console.log(pe, ap, pe > ap);
    return valid;
}


// ----- end page 2 -----

function setActiveView(params){

    switch(params.page){
        case 1:
            setSolarSystemSVG();
            break;
        case 2:
            setSolarSystemSVG();
            initializeTransfer(params.originName, params.destinationName, params.utNow);
            break;
        case 3:
            let origin = planets[params.originName];
            setPlanetSystemSVG(origin.eqR, origin.soi);
            initializeEjectionSVG(params.originName, 0, 100000, 3000, true)
        break;
    }

}

function setActivePage(dataObj) {

    let buttonData = dataObj["pageFunctions"];
    let inputFields = dataObj["inputFields"];
    let outputFields = dataObj["outputFields"];
    let activePanels = dataObj["activePanels"];

    // if(activePage != undefined) activePage.setInactive();
    // activePage = buttons[id];
    // activePage.setActive();

    // set buttons
    buttonData.forEach((button) => {

        let labelId = `lbl${button.id.toUpperCase()}`;
        let inputId = `opt${button.id.toUpperCase()}`;

        let label = document.getElementById(labelId);
        let input = document.getElementById(inputId);

        let isDisabled = !(Boolean(button.label)) || !(button.disabled == undefined || button.disabled == "");

        label.textContent = button.label;

        if (isDisabled) {
            input.setAttribute("disabled", true);
        }
        
        let fn = Function(button.fn);
        input.onclick = fn;
    
    }
    );

    // buttons["b0"].setActive();
    return;

   
}


function initializeMFD(pageNumber) {

    console.log("initalize MFD");

    fetch(`transferApp_P${pageNumber}.json`).then(response => response.json()).then(data => setActivePage(data));
    
}

function parseQueryString(){

    let params = new URLSearchParams(location.search);
    
    let page = Number(params.get("page"));
    let utNow = Number(params.get("utNow"));
    let originName = params.get("origin");
    let destinationName = params.get("destination");

    page = (page == 0) ? 1 : page;

    return {"page": page, "utNow": utNow, "originName": originName, "destinationName": destinationName};
}

function initialize() {

    let params = parseQueryString();

    initializeMFD(params.page);
    initializeScreen();

    getPlanetsXML(() => {

        initializeSolarSystemSVG();
        setActiveView(params);

        console.log("intialized");
        // troubleShoot();
    });

}

function troubleShoot() {
    console.log("troubleshoot");
    //initializeEjectionOrbit();
}

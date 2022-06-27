
let currentTime = 1;
let displayedTime = 1;

const timeChangeEvent = new Event('timeChange');
const displayedTimeChangeEvent = new Event('displayedTimeChange');


// ---------- page 1 ----------

function initializeForms(){

    console.log("initialize forms");

    let frmTime = document.forms["frmTimeEntry"];
    let frmTransfer = document.forms["initializeTransfer"];
   
    frmTime.addEventListener('input', (e)=>{
        frmTime.utS.value = convertDateToSeconds(frmTime.utY.value, frmTime.utD.value, frmTime.utH.value, frmTime.utM.value, true);
    })
    
    frmTime.addEventListener('submit', (e) => {
        frmTransfer.utNow.value = frmTime.utS.value;
        frmTransfer.utNow.dispatchEvent(new Event('change'));
    })

    frmTransfer.utNow.addEventListener("change", (e)=>{
        setTime();
    })

    frmTransfer.origin.addEventListener("change", setOriginMarker);
    frmTransfer.destination.addEventListener("change", setDestinationMarker);
    
    //window.addEventListener("displayedTimeChange", setOriginMarker);
    //window.addEventListener("displayedTimeChange", setDestinationMarker);
    //window.addEventListener("displayedTimeChange", setAlignment);

    document.froms["options"]["alignToLn0"].addEventListener("click", "setAlignment()");
}

function getTime() {
        
    let dialog = document.getElementById('timeEntry');
    let form = document.forms["frmTimeEntry"];
        
    let ut = convertSecondsToDateObj(displayedTime, false);
    
    form.utY.value = Number(ut.y);
    form.utD.value = Number(ut.d);
     
    form.utH.value = Number(ut.h);
    form.utM.value = Number(ut.m);

    form.utS.value = displayedTime;

    dialog.showModal();

    let optButton = document.getElementById("optB0");
    optButton.checked = false;
}

function setTime(){

    let frmTransfer = document.forms["initializeTransfer"];
    displayedTime = frmTransfer.utNow.value;
    
    console.log("time set to " + convertSecondsToDateObj(displayedTime, false).toString() );

    window.dispatchEvent(displayedTimeChangeEvent);

    setOriginMarker();
    setDestinationMarker();

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
            document.forms["initializeTransfer"]["origin"].dispatchEvent(new Event("change"));
            break;
        case 2:
            fieldName="destination";
            document.forms["initializeTransfer"]["destination"].value = planetName;
            document.forms["initializeTransfer"]["destination"].dispatchEvent(new Event("change"));
            break;
    }

    let optButton = document.getElementById("optB"+inputField);
    optButton.checked=false;

    console.log(fieldName);
   
}

function setOriginMarker(){

    console.log("set origin marker");

    let planetName = document.forms["initializeTransfer"]["origin"].value;

    if(!planetName) return;

    let outArrow = solarSystemSVG.getElementById("outArrow");
    let originPlanet = svgPlanets[planetName];
    
    //originPlanet.update(displayedTime);

    let cxo = originPlanet.cx;
    let cyo = originPlanet.cy;
    let lno = radToDeg(originPlanet.ln);

    outArrow.setAttribute("x", cxo);
    outArrow.setAttribute("y", cyo);
    outArrow.setAttribute("transform", `rotate(${-lno}, ${cxo}, ${cyo})`);

    document.querySelector("output[name='origin']").value = planetName;
    
    setAlignment();
    setNext();
}

function setDestinationMarker(){

    let planetName = document.forms["initializeTransfer"]["destination"].value;

    if(!planetName) return;

    let inArrow = solarSystemSVG.getElementById("inArrow");
    let planetD = svgPlanets[planetName];
    let cxd = planetD.cx;
    let cyd = planetD.cy;
    let lnd = radToDeg(planetD.ln);

    inArrow.setAttribute("x", cxd);
    inArrow.setAttribute("y", cyd);
    inArrow.setAttribute("transform", `rotate(${-lnd}, ${cxd}, ${cyd})`);

    document.querySelector("output[name='destination']").value = planetName;
    setNext();
    //op.classList.remove("activeFn");
}

function setNext(){

    let origin = document.forms["initializeTransfer"]["origin"].value;
    let destination = document.forms["initializeTransfer"]["destination"].value;
    
    let mainForm = document.forms["initializeTransfer"];
    let isValid = mainForm.checkValidity() && (origin != destination);
    
    document.getElementById("optB5").disabled = !isValid;

}

function next(){
    
    console.log("next");
    //document.forms["fmrBottom"]
    document.getElementById("optB5").checked = false;
    document.forms["initializeTransfer"]["page"].value = 2;
    document.forms["initializeTransfer"].submit();
}

// ---------- end page 1 ----------



// --------- page 2 ---------

function initializeTransfer(originName, destinationName, utNow){
    
    console.log("initialize transfer");
    dimPlanets();
    transferOrbit = new SVGTransfer(originName, destinationName);
    displayedTime = transferOrbit.solveTForRdv(utNow);
    window.dispatchEvent(displayedTimeChangeEvent);
}

function gotoPage(pageNumber){
    document.forms["initializeTransfer"]["page"].value = pageNumber;
    document.forms["initializeTransfer"].submit();
}
// ----- end page 2 -----

// ---------- page 3 ----------

function setEjection(){

    let origin = planets[transferOrbit.originName];

    let name= origin.name;
    let t = transferOrbit.tod;
    let peAlt = 100000;
    let v3 = transferOrbit.v3o;

    let eqR = origin.eqR;
    let soi = origin.soi;

    //setPlanetSystemSVG(eqR, soi);
    initializeEjectionSVG(name, t, peAlt, v3, true);
    peChange(peAlt);
    
}

function setAlt() {

    let dialog = document.getElementById('altEntry');
    dialog.showModal();

    let optButton = document.getElementById("optB0");
    optButton.checked = false;
}


function setCapture(){

    let destination = planets[transferOrbit.destinationName];

    let name = destination.name;
    let t = transferOrbit.toa;
    let peAlt = 100000;
    let v3 = transferOrbit.v3d;

    let eqR = destination.eqR;
    let soi = destination.soi;

    setPlanetSystemSVG(eqR, soi);
    initializeEjectionSVG(name, t, peAlt, v3, false);
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

    // document.getElementById("outPe").textContent = pe;
    // document.getElementById("outLnPe").textContent = radToDeg(lnPe, 1);
    // document.getElementById("outDv").textContent = dv.toFixed(2);
    // document.getElementById("outTod").textContent = convertSecondsToDateObj(tod).toString();

    // document.getElementById("outTurnAngle").textContent = radToDeg(theOrbit.turnAngle, 2);
    // document.getElementById("outV2Angle").textContent = radToDeg(theOrbit.v2Angle, 2);
    // document.getElementById("outV2AngleDelta").textContent = radToDeg(theOrbit.v2AngleDelta, 2);
    // document.getElementById("outEjectionAngle").textContent = 90 + radToDeg(theOrbit.turnAngle);

    // document.getElementById("outA").textContent = theOrbit.a.toFixed(0);
    // document.getElementById("outE").textContent = theOrbit.e.toFixed(4);
    // document.getElementById("outTof").textContent = convertSecondsToDateObj(tof).toString();

    let svg = document.getElementById("svgObject").contentDocument;

    svg.getElementById("nodePe").textContent = pe;
    svg.getElementById("nodeLn").textContent = radToDeg(lnPe, 1);
    svg.getElementById("nodeDv").textContent = dv.toFixed(2);
    svg.getElementById("nodeTod").textContent = convertSecondsToDateObj(tod).toString();

    scaleText();
}

// ---------- end page 3 ----------


function setActiveView(params){

    switch(Number(params.page)){

        case 1:
            console.log("setting page 1");
            setSolarSystemSVG();                // sets svg, initial zoom, zoom limits, etc
            initializeForms();
            break;
        case 2:
            console.log("setting page 2");
            
            setSolarSystemSVG().then(
                function(x){
                    initializeTransfer(params.originName, params.destinationName, params.utNow);
                });
            break;
        case 3:
            
            params.originName="Kerbin";
            let origin = planets[params.originName];
            
            setPlanetSystemSVG(params.originName).then(function(){
                initializeEjectionSVG(params.originName, 0, 100000, 3000, true)
                peChange(1000000);
            });

            // document.forms["options"]["alignToLn0"].addEventListener("click", ???)

            break;
    }

}

function initializeOrbitalMechanics(params){

    getPlanetsXML(() => {

        console.log("planets data loaded");

        setActiveView(params);
        
    });

}

function initializeMFDfromFile(pageNumber) {

    console.log("initalize MFD buttons");

    fetch(`transferApp_P${pageNumber}.json`).then(response => response.json()).then( (dataObj) => 
        
        {
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
                let isChecked = !(button.checked == undefined || button.checked == "");

                label.textContent = button.label;

                if (isDisabled) {
                    input.setAttribute("disabled", true);
                }

                if (isChecked) {
                    input.setAttribute("checked", true);
                }

                let fn = Function(button.fn);
                input.onclick = fn;

            }
            );

        });

}

function parseQueryString(){

    let params = new URLSearchParams(location.search);
    
    let page = Number(params.get("page"));
    let utNow = Number(params.get("utNow"));
    let originName = params.get("origin");
    let destinationName = params.get("destination");

    document.forms["initializeTransfer"]["utNow"].value = utNow
    document.forms["initializeTransfer"]["origin"].value = originName;
    document.forms["initializeTransfer"]["destination"].value = destinationName

    page = (page == 0) ? document.forms["initializeTransfer"]["page"].value : page;

    return {"page": page, "utNow": utNow, "originName": originName, "destinationName": destinationName};
}

function initialize() {

    let params = parseQueryString();

    initializeMFDfromFile(params.page);
    initializeOrbitalMechanics(params);

}

function troubleShoot() {
    console.log("troubleshoot");
    //initializeEjectionOrbit();

    var form = document.getElementById('frmTimeEntry');
    var uts = form.utS.value;

    var x = form.returnValue = "Submit"

    uts = Number(document.forms["initializeTransfer"]["utNow"].value);
    setTime(uts);       

    setNext(); // sets next as active or inactive as needed


    // setOriginMarker();
    // setDestinationMarker();
    // setAlignment();

    //document.forms["options"]["alignToPrograde"].click();
}

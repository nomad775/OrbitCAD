
let currentTime = 1;
let displayedTime = 1;

const timeChangeEvent = new Event('timeChange');
const displayedTimeChangeEvent = new Event('displayedTimeChange');


// ---------- page 1 ----------

function initializeForms(){

    let frmTime = document.forms["frmTimeEntry"];
    let frmTransfer = document.forms["initializeTransfer"];
   
    frmTime.addEventListener('input', (e)=>{
        frmTime.utS.value = convertDateToSeconds(frmTime.utY.value, frmTime.utD.value, frmTime.utH.value, frmTime.utM.value, true);;
    })
    
    frmTime.addEventListener('submit', (e) => {
        frmTransfer.utNow.value = utS.value;
        frmTransfer.utNow.dispatchEvent(new Event('change'));
    })

    frmTransfer.utNow.addEventListener("change", (e)=>{
        displayedTime = frmTransfer.utNow.value;
        window.dispatchEvent(displayedTimeChangeEvent);
    })

    frmTransfer.origin.addEventListener("change", setOriginMarker);
    frmTransfer.destination.addEventListener("change", setDestinationMarker);
    
    window.addEventListener("displayedTimeChange", setOriginMarker);
    window.addEventListener("displayedTimeChange", setDestinationMarker);
    window.addEventListener("displayedTimeChange", setAlignment);
}

function getTime() {
        
    let dialog = document.getElementById('timeEntry');
    let form = document.forms["frmTimeEntry"];
        
    let ut = convertSecondsToDateObj(displayedTime, false);
    
    form.utY.value = Number(ut.y);
    form.utD.value = Number(ut.d);
     
    form.utH.value = Number(ut.h);
    form.utM.value = Number(ut.m);

    form.utS.value = ut;

    dialog.showModal();

    let optButton = document.getElementById("optB0");
    optButton.checked = false;
}

function z_setTime(overrideTime) {

    var form = document.getElementById('frmTimeEntry');
    var uts = 0;
    
    if (!(overrideTime == undefined || overrideTime == null)) {
        uts = overrideTime;
    }else if (form.returnValue = "Submit") {
        uts = form.utS.value;
    }else{
        return;
    }

    document.forms["initializeTransfer"]["utNow"].value = uts;
    displayedTime = uts;
    document.querySelector("output[name='utNow']").value = convertSecondsToDateObj(uts).toString();

    window.dispatchEvent(displayedTimeChangeEvent);
    
    //setOriginMarker();
    //setDestinationMarker();
    //setAlignment();

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

    let planetName = document.forms["initializeTransfer"]["origin"].value;

    if(!planetName) return;

    let outArrow = solarSystemSVG.getElementById("outArrow");
    let planetO = svgPlanets[planetName];
    let cxo = planetO.cx;
    let cyo = planetO.cy;
    let lno = radToDeg(planetO.ln);

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
    document.forms["fmrBottom"]
    document.getElementById("optB5").checked = false;
    document.forms["initializeTransfer"].submit();
}

// ---------- end page 1 ----------



// --------- page 2 ---------

function initializeTransfer(originName, destinationName, utNow){
    transferOrbit = new SVGTransfer(originName, destinationName);
    displayedTime = transferOrbit.solveTForRdv(utNow);
    window.dispatchEvent(displayedTimeChangeEvent);
}

function z_setTransferView(){
    setSolarSystemSVG();
    dimPlanets();
    
}

function z_fromPrev() {

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
    setPlanetSystemSVG();
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

    setPlanetSystemSVG(eqR, soi);
    initializeEjectionSVG(name, t, peAlt, v3, true);
    peChange(peAlt);
    
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

function setAlt() {

    let dialog = document.getElementById('altEntry');
    dialog.showModal();

    let optButton = document.getElementById("optB0");
    optButton.checked = false;
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

    document.getElementById("nodePe").textContent = pe;
    document.getElementById("nodeLn").textContent = radToDeg(lnPe, 1);
    document.getElementById("nodeDv").textContent = dv.toFixed(2);
    document.getElementById("nodeTod").textContent = convertSecondsToDateObj(tod).toString();

    scaleText();
}

// ---------- end page 3 ----------


function setActiveView(params){

    switch(params.page){
        case 1:
            setSolarSystemSVG();                // sets svg, initial zoom, zoom limits, etc
            initializeSolarSystemSVGelements(); // set planet and orbit svg elements
            initializeForms();
            //setTime();
            break;
        case 2:
            setSolarSystemSVG();
            initializeSolarSystemSVGelements(); // set svg elements
            dimPlanets();
            initializeTransfer(params.originName, params.destinationName, params.utNow);
            break;
        case 3:
            let origin = planets[params.originName];
            setPlanetSystemSVG(origin.eqR, origin.soi);
            initializeEjectionSVG(params.originName, 0, 100000, 3000, true)
        break;
    }

}

function initializeOrbitalMechanics(params){

    getPlanetsXML(() => {

        setActiveView(params);

        console.log("intialized");
        //troubleShoot();
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

    page = (page == 0) ? 1 : page;

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

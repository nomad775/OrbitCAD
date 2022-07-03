
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
    
    document.forms["options"]["alignToLn0"].addEventListener("click", setAlignment);

    document.querySelector("output[name='utNow']").textContent = convertSecondsToDateObj(displayedTime).toString();
    
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
    document.querySelector("output[name='utNow']").textContent = convertSecondsToDateObj(displayedTime).toString();
    window.dispatchEvent(displayedTimeChangeEvent);

    setAlignment();
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

    let form =  document.forms["initializeTransfer"]
    form["tod"].value = displayedTime;
    form["v3o"].value = transferOrbit.v3o.toFixed(0);
    form["toa"].value = transferOrbit.toa.toFixed(0);
    form["v3d"].value = transferOrbit.v3d.toFixed(0);

    document.querySelector("output[name='utNow']").textContent = convertSecondsToDateObj(displayedTime).toString();
    window.dispatchEvent(displayedTimeChangeEvent);

    document.forms["options"]["alignToLn0"].addEventListener("click", setAlignment);
}

function gotoPage(pageNumber){
    document.forms["initializeTransfer"]["page"].value = pageNumber;
    document.forms["initializeTransfer"].submit();
}
// ----- end page 2 -----



// ---------- page 3 ----------

function getAlt() {

    let dialog = document.getElementById('altEntry');
    dialog.showModal();

    let optButton = document.getElementById("optB0");
    optButton.checked = false;
}


function setPeAlt() {

    let form = document.forms["frmAltEntry"];
    let units = form["units"].value;
    let peAlt = form["alt"].value * 1000;

    document.forms["initializeTransfer"]["originPark"].value = peAlt;

    updateHypSVG()

    let theOrbit = hypOrbit;

    let pe = theOrbit.peAlt / 1000;
    let lnPe = theOrbit.lnPe;
    let dv = theOrbit.deltaV;
    let tof = theOrbit.TOF;

    let params = new URLSearchParams(location.search);
    let todTx = Number(params.get("tod"));
    let tod = todTx - tof;

    let svg = document.getElementById("svgObject").contentDocument;

    svg.getElementById("nodePe").textContent = pe;
    svg.getElementById("nodeLn").textContent = radToDeg(lnPe, 1);
    svg.getElementById("nodeDv").textContent = dv.toFixed(2);
    svg.getElementById("nodeTod").textContent = convertSecondsToDateObj(tod).toString();

    scaleText();
}

// ---------- end page 3 ----------


function setCapture() {

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

function setActiveView(params){

    switch(Number(params.page)){

        case 1:
            console.log("setting page 1");
            setSolarSystemSVG();                // sets svg, initial zoom, zoom limits, etc
            initializeForms();
            break;
        case 2:
            console.log("setting page 2");
            
            setSolarSystemSVG().then(function(x){
                initializeTransfer(params.originName, params.destinationName, params.utNow);
                });
            break;
        case 3:
            
            setPlanetSystemSVG(params.originName).then(function(){
                initializeEjectionSVG(params.originName, params.tod, 100000, params.v3o, true);
                setPeAlt(100000)
                document.getElementById('altEntry').addEventListener("submit", setPeAlt);
                document.forms["options"]["alignToLn0"].addEventListener("click", updateHypSVG);
            });
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
    let tod = params.get("tod");
    let v3o = params.get("v3o");
    let originPark = params.get("originPark");

    let toa = params.get("toa");
    let v3d = params.get("v3d");
    let destinationPark = params.get("destinationPark");

    let form = document.forms["initializeTransfer"];
    form["utNow"].value = utNow;
    form["origin"].value = originName;
    form["destination"].value = destinationName;
    form["tod"].value = tod;
    form["v3o"].value = v3o;
    form["toa"].value = toa;
    form["v3d"].value = v3d;
    form["originPark"].value = originPark;
    form["destinationPark"].value = destinationPark;

    page = (page == 0) ? document.forms["initializeTransfer"]["page"].value : page;

    return { "page": page, "utNow": utNow, "originName": originName, "destinationName": destinationName, "tod": tod, "v3o": v3o, "toa": toa, "v3d": v3d, "originPark": originPark, "destinationPark": destinationPark};
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

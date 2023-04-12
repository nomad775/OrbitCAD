
let currentTime = 1;
let displayedTime = 1;

const timeChangeEvent = new Event('timeChange');
const displayedTimeChangeEvent = new Event('displayedTimeChange');
const svgZoomEvent = new Event("svgZoom")

// ---------- page 1 functions ----------
// set UT, origin and destination

function initializeForms(){

    console.log("...initialize forms");

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

    //document.forms["options"]["zoom"].addEventListener("svgZoom", (e) => {console.log("resize", e)});

    console.log("...forms initialized");
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
    dialog

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

    let originPlanet = svgPlanets[planetName];
    
    let cxo = originPlanet.cx;
    let cyo = originPlanet.cy;
    let lno = radToDeg(originPlanet.ln);
    
    let outArrow = solarSystemSVG.getElementById("outArrow");

    outArrow.classList.remove("transferInit");
    outArrow.setAttribute("x", cxo);
    outArrow.setAttribute("y", cyo);
    outArrow.setAttribute("transform", `rotate(${-lno}, ${cxo}, ${cyo})`);

    document.querySelector("output[name='originName']").value = planetName;
    
    //setAlignment();

    setNext();
}

function setDestinationMarker(){

    let planetName = document.forms["initializeTransfer"]["destination"].value;

    if(!planetName) return;

    let planetD = svgPlanets[planetName];
    let cxd = planetD.cx;
    let cyd = planetD.cy;
    let lnd = radToDeg(planetD.ln);
    
    let inArrow = solarSystemSVG.getElementById("inArrow");
    inArrow.classList.remove("transferInit");

    inArrow.setAttribute("x", cxd);
    inArrow.setAttribute("y", cyd);
    inArrow.setAttribute("transform", `rotate(${-lnd}, ${cxd}, ${cyd})`);

    document.querySelector("output[name='destinationName']").value = planetName;
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
    
    let formData = new FormData(document.forms["initializeTransfer"]);
    for(const e of formData){
        console.log(e);
    }
    //console.log(formData.values().toArray());
    
    document.forms["initializeTransfer"].submit();
}

// --------- end page 1 ----------



// --------- page 2 ---------
// solve for transfer

function initializeTransfer(originName, destinationName, utNow){
    
    console.log("initialize transfer");

    dimPlanets();

    let svgDoc = document.getElementById("svgObject").contentDocument;

    // removes rule that hides transfer items
    let styleSheet = svgDoc.styleSheets[0];
    styleSheet.deleteRule(10);
    
    transferOrbit = new SVGTransfer(originName, destinationName);
    displayedTime = transferOrbit.solveTForRdv(utNow);

    let form =  document.forms["initializeTransfer"]
    form["tod"].value = displayedTime;
    form["v3o"].value = transferOrbit.v3o.toFixed(0);
    form["toa"].value = transferOrbit.toa.toFixed(0);
    form["v3d"].value = transferOrbit.v3d.toFixed(0);
    //form["originPark"].value = 100000;    //should already be set by parse query string
    //form["destinationPark"].value = 100000;

    let dv_eject = transferOrbit.ejectDv;
    let dv_capture = transferOrbit.captureDv;
    let dv_planeChange = transferOrbit.planeChangeDv();
    let dv_total = dv_eject + dv_capture + dv_planeChange;

    let ro = transferOrbit.ro - eqr_sun;
    let rd = transferOrbit.rd - eqr_sun;

    let apAlt = ro > rd ? ro : rd;
    let peAlt = ro < rd ? ro : rd;

    let ln_o = radToDeg(transferOrbit.Ln_o);
    let ln_d = radToDeg(transferOrbit.Ln_d);
    let ln_rdv = radToDeg(transferOrbit.Ln_r);
    let ln_da = radToDeg(transferOrbit.Ln_da);
    let err = radToDeg(transferOrbit.rdvDiff);

    document.querySelector("output[name='utNow']").textContent = convertSecondsToDateObj(utNow).toString();
    document.querySelector("output[name='totalDv']").textContent = dv_total.toFixed(2);
    //document.querySelector("output[name='tod']").textContent = convertSecondsToDateObj(displayedTime).toString();
    //document.querySelector("output[name='eject_dv']").textContent = dv_eject.toFixed(2);
    //document.querySelector("output[name='planeChange_dv']").textContent = dv_planeChange.toFixed(2);
    //document.querySelector("output[name='capture_dv']").textContent = dv_capture.toFixed(2);
    
    window.dispatchEvent(displayedTimeChangeEvent);

    document.forms["options"]["alignToLn0"].addEventListener("click", setAlignment);
    zoomTxOrbit();
}

function info(){

    let div = document.getElementById("screenHTML");
    
}
// ----- end page 2 -----



// ---------- page 3 & 5 ----------
// ejection and capture - set PE

function getAlt() {

    // set to current pe alt
    let peAlt;

    if (hypOrbit.outbound) {
        peAlt = document.forms["initializeTransfer"]["originPark"].value;
    } else {
        peAlt = document.forms["initializeTransfer"]["destinationPark"].value;
    }

    document.forms["frmAltEntry"]["alt"].value = peAlt / 1000;
    
    // show form for new alt
    let dialog = document.getElementById('altEntry');
    dialog.showModal();

    let optButton = document.getElementById("optB0");
    optButton.checked = false;
}

function setPeAlt() {

    let form = document.forms["frmAltEntry"];
    let units = form["units"].value;
    let peAlt = form["alt"].value * 1000;

    if(hypOrbit.outbound){
        document.forms["initializeTransfer"]["originPark"].value = peAlt;
    }else{
        document.forms["initializeTransfer"]["destinationPark"].value = peAlt;
    }

    updateHypSVG()

    let theOrbit = hypOrbit;

    let pe = theOrbit.peAlt / 1000;
    let lnPe = theOrbit.lnPe;
    let dv = theOrbit.deltaV;
    let tof = theOrbit.TOF;

    let params = new URLSearchParams(location.search);
    let todTx = Number(params.get("tod"));
    let tod = todTx - tof;


    // screen html node text
    let outbound = theOrbit.outbound;

    let qPe = theOrbit.lnPe - theOrbit.lnp;
    if(!outbound){qPe += Math.PI};
    qPe = modRev(qPe);

    let x = Math.cos(qPe);
    let y = Math.sin(qPe);

    console.log(Math.sign(x), Math.sign(y));

    let el2 = document.getElementById("nodeDiv");
    
    if(Math.sign(x)<0){
        el2.style.left = "20px";
    }else{
        el2.style.right="20px";
    }

    if(Math.sign(y)<0){
        el2.style.bottom = "20px";
    }else{
        el2.style.top = "20px";
    }

    // set node text
    document.getElementById("peText").textContent = "PE: " + pe + " km";
    document.getElementById("utText").textContent = "TOD: " + convertSecondsToDateObj(tod).toString();
    document.getElementById("lnText").textContent = "LN: " + radToDeg(lnPe, 1);
    document.getElementById("dvText").textContent = "dV: " + dv.toFixed(2);

    // set total dV display
    document.querySelector("output[name='totalDv']").textContent = dv_total.toFixed(2);
}

// ---------- end page 3 ----------


// ------------- page 4 ------------
// inclination

function setTransferOrbit(originName, destinationName, tod){

    console.log("set transfer");
    
    dimPlanets();
    
    let svgDoc = document.getElementById("svgObject").contentDocument;
    
    // removes rule that hides transfer items
    let styleSheet = svgDoc.styleSheets[0];
    styleSheet.deleteRule(10);
    
    // set transfer orbit 
    displayedTime = tod;

    transferOrbit = new SVGTransfer(originName, destinationName);
    transferOrbit.update(tod);

    // set labels
    svgDoc.getElementById("originLabel").setAttribute("width", "0%");
    svgDoc.getElementById("destLabel").setAttribute("width", "0%")

    let label = svgDoc.getElementById("planeChangeLabel");
    label.setAttribute("width", "35%");
    label.setAttribute("height", "35%");
    window.dispatchEvent(displayedTimeChangeEvent);
    

    if (transferOrbit.crossProduct > 0) {
        svgDoc.getElementById("ascendingNode").setAttribute("width", "3%");
        svgDoc.getElementById("ascendingNode").setAttribute("height", "3%");
    } else {
        svgDoc.getElementById("descendingNode").setAttribute("width", "3%");
        svgDoc.getElementById("descendingNode").setAttribute("height", "3%");
    }

    document.querySelector("output[name='utNow']").textContent = convertSecondsToDateObj(displayedTime).toString();
    document.forms["options"]["alignToLn0"].addEventListener("click", setAlignment);
    
    zoomPlanetOrbit(transferOrbit.svgEllipse);
}

// ---------- end page 4 ----------


// ========== initialization and general functions ==========

function gotoPage(pageNumber) {

    let form = document.forms["initializeTransfer"];

    if(pageNumber==1){
        location.search="";
        form.reset();
    }else{
        form["page"].value = pageNumber;
        form.submit();
    }
}


function setActiveView(params){

     console.log("..setting active page");

    switch(Number(params.page)){

        case 1:
            // origin/destination selection
            console.log("..setting page 1 ...");
            setSolarSystemSVG();    // sets svg, initial zoom, zoom limits, etc
            initializeForms();
            break;
        case 2:
            // transfer orbit
            console.log("..setting page 2");
            setSolarSystemSVG().then(function(x){
                initializeTransfer(params.originName, params.destinationName, params.utNow);
                });
            break;
        case 3:
            // ejection
            console.log("..setting page 3")
            setPlanetSystemSVG(params.originName).then(function(){

                initializeHyperbolicSVG(params.originName, params.tod, params.originPark, params.v3o, true);

                document.getElementById('altEntry').addEventListener("submit", setPeAlt);
                document.forms["options"]["alignToLn0"].addEventListener("click", updateHypSVG);
                
                document.querySelector("output[name='utNow']").textContent = convertSecondsToDateObj(params.utNow).toString();
            });
            break;
        case 4:
            // plane change
            console.log("..setting page 4");
            setSolarSystemSVG().then(function (x) {
                setTransferOrbit(params.originName, params.destinationName, params.tod);
            });
            break;
        case 5:
            // capture
            console.log("..setting page 5")
            setPlanetSystemSVG(params.destinationName).then(function () {
                initializeHyperbolicSVG(params.destinationName, params.toa, params.destinationPark, params.v3d, false);
                document.getElementById('altEntry').addEventListener("submit", setPeAlt);
                document.forms["options"]["alignToLn0"].addEventListener("click", updateHypSVG);
                document.querySelector("output[name='utNow']").textContent = convertSecondsToDateObj(params.utNow).toString();
            });
            break;
    }

}

function initializeOrbitalMechanics(params){

    console.log(".starting orbital mechanics initialization")

    getPlanetsXML(() => {

        console.log(".orbital mechanics initialized");

        setActiveView(params);
        
    });

}

function initializeMFDfromFile(params) {

    console.log(".starting MFD initialization...");

    let pageNumber = params.page;

    fetch(`transferApp_P${pageNumber}.json`).then(response => response.json()).then( (dataObj) => 
        
        {
            let buttonData = dataObj["pageFunctions"];
            let inputFields = dataObj["inputFields"];
            let outputFields = dataObj["outputFields"];
            let activePanels = dataObj["activePanels"];

            // set buttons
            //console.log("initalize MFD buttons");
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

            outputFields.forEach((field) =>{

                if(params[field]){
                    console.log(".." + field + " = ", params[field]);
                    document.querySelector(`output[name='${field}']`).textContent = params[field];
                }

            });

            console.log(".MFD initialized");
        });

}

function parseQueryString(){

    let params = new URLSearchParams(location.search);
    let i = params.length;
    console.log(params.entries.length);


    let page = Number(params.get("page"));
    let utNow = Number(params.get("utNow"));
    let originName = params.get("origin");
    let destinationName = params.get("destination");
    let tod = Number(params.get("tod"));
    let v3o = Number(params.get("v3o"));
    let originPark = Number(params.get("originPark"));
    let toa = Number(params.get("toa"));
    let v3d = Number(params.get("v3d"));
    let destinationPark = Number(params.get("destinationPark"));

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

    console.log("====================================");
    console.log(planets);
    console.log("initializing...")

    let params = parseQueryString();

    initializeMFDfromFile(params);
    initializeOrbitalMechanics(params);

}
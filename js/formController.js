
function originChange() {

    //console.log("changing origin");

    originName = document.forms["origin-destination"]["origin"].value;

    toggleDestinationOption(originName);
    
    updateQueryString();
}

function toggleDestinationOption(originName) {

    // enable destination option that was disabled before origin change
    let disabledDest = document.forms["origin-destination"]["optDest" + disabledDestName];
    disabledDest.disabled = false;

    console.log("destination " + disabledDestName + " re-enabled");
    console.log("origin changed to " + originName);

    // disable destination option that is the same as the current origin
    // so that origin and destination cannot be the same
    disabledDestName = originName;
    disabledDest = document.forms["origin-destination"]["optDest" + disabledDestName];
    disabledDest.disabled = true;

    console.log("destination " + disabledDestName + " disabled");

    // if new origin is the current destination then
    // set new destination to Kerbin or
    // if new origin is Kerbin, set new destination to Duna

    if (disabledDest.checked) {

        let kerbin = document.forms["origin-destination"]["optDestKerbin"];
        let duna = document.forms["origin-destination"]["optDestDuna"]

        //set destination to kerbin
        //destinationOption.checked=false;
        //kerbin.checked=true;

        if (originName == "Kerbin") {
            //duna.disabled = false;
            //duna.checked = true;
            duna.click();
        } else {

            //console.log("origin was destination.");
            //console.log("changing destination to kerbin");
            kerbin.click();
        }
    }

}

function destinationChange() {

    destinationName = document.forms["origin-destination"]["destination"].value;
    //transferOrbit.destinationPlanet = planets[destinationName];

    //displayedTime = transferOrbit.solveTForRdv(currentTime);
    //window.dispatchEvent(displayedTimeChangeEvent);

    updateQueryString();
    //zoomTxOrbit();

    //console.log("destination changed to " + destinationName);
}

function currentTimeChange() {

    console.log('current time changed')

    let y = document.forms["origin-destination"]["utY"].value;
    let d = document.forms["origin-destination"]["utD"].value;
    let h = document.forms["origin-destination"]["utH"].value;
    let m = document.forms["origin-destination"]["utM"].value;

    currentTime = (y - 1) * secondsPerYear + (d - 1) * secondsPerDay + h * secondsPerHour + m * secondsPerMinute;

    displayedTime = transferOrbit.solveTForRdv(currentTime);
    window.dispatchEvent(displayedTimeChangeEvent);

    document.forms["origin-destination"]["utSeconds"].value = currentTime;
    document.getElementById("outCurrentTime").textContent = convertSecondsToDateObj(currentTime).toString();

    updateQueryString();
}

function displayedTimeChange(event) {

    //console.log("time change caught : display time " + displayedTime);

    //document.getElementById("outDisplayedTime").textContent = convertSecondsToDateObj(displayedTime).toString();
    document.forms["origin-destination"]["tod"].value = Math.round(displayedTime);
    document.forms["origin-destination"]["toa"].value = Math.round(transferOrbit.toa);

    updateOutput();
}

function alignmentChange(e) {

    if (e.target.checked) {
        alignSolarSystem(-transferOrbit.Ln_o);
        console.log("align ", -radToDeg(transferOrbit.Ln_o))
    } else {
        alignSolarSystem(0);
        console.log("align ", 0)
    }
}

function updateOutput() {

    let eject = Number(transferOrbit.ejectDv);
    let inc = Number(transferOrbit.planeChangeDv());
    let capture = Number(transferOrbit.captureDv);
    let total = eject + inc + capture;

    document.getElementById("outOrigin").textContent = transferOrbit.originPlanet.name;
    document.getElementById("outDestination").textContent = transferOrbit.destinationPlanet.name;
    
    document.getElementById("outEtd").textContent = convertSecondsToDateObj(displayedTime).toString();
    document.getElementById("outOriginLnEtd").textContent = radToDeg(transferOrbit.Ln_o);
    document.getElementById("outDestinationLnEtd").textContent = radToDeg(transferOrbit.Ln_d);
    document.getElementById("outPhaeAngleEtd").textContent = radToDeg(transferOrbit.phaseAngle);
    document.getElementById("outEjectDv").textContent = eject.toFixed(2);

    document.getElementById("outPlaneChangeDv").textContent = inc.toFixed(2);

    document.getElementById("outEta").textContent = convertSecondsToDateObj(transferOrbit.toa).toString();
    document.getElementById("outOriginLnEta").textContent = radToDeg(transferOrbit.Ln_o);
    document.getElementById("outDestinationLnEta").textContent = radToDeg(transferOrbit.Ln_da);
    document.getElementById("outCaptureDv").textContent = capture.toFixed(2);
    
    document.getElementById("outTotalDv").textContent = total.toFixed(2);

    document.getElementById("outTxA").textContent = transferOrbit.a.toFixed(0);
    document.getElementById("outTxE").textContent = transferOrbit.e.toFixed(4);
    document.getElementById("outTxI").textContent = 0;
    document.getElementById("outTxArgPe").textContent = radToDeg(transferOrbit.Ln_pe);
    document.getElementById("outTxLan").textContent = 0;

    document.getElementById("outMeanEstimate").textContent = convertSecondsToDateObj(transferOrbit.getMeanEstimate(0), false).toString();

}

function updateQueryString() {

    let frmElement = document.querySelector("form");
    let frmData = new FormData(frmElement);

    let params = new URLSearchParams(frmData);

    let url = window.location.pathname;
    url += "?" + params.toString();

    //const url = new URL(window.location.href);
    //url.searchParams.set(key, value);
    window.history.pushState({}, '', url.toString());
}

function onSubmit(event) {

    // if form action attribute is blank then form data is appended to current location
    // inject location with parameter into history to back button returns to current state

    let frmElement = document.querySelector("form");
    let frmData = new FormData(frmElement);

    let params = new URLSearchParams(frmData);

    let url = window.location.pathname;
    url += "?" + params.toString();

    console.log(params.toString());
    console.log(url);

    window.history.pushState({}, "", url);


    //event.preventDefault();

    // for (let [name, value] of fd) {
    //         params.append(`${name}`, `${value}`); // key1 = value1, then key2 = value2
    // }


    return;

}
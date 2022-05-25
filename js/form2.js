var planets = {};
var txOrbit;
//var ejectionOrbit;

function fromPrev() {

    console.log("start 2");

    let params = new URLSearchParams(location.search);

    let utNow = params.get("utNow");
    let type = params.get("orbit");
    let originName = params.get("origin");
    let destinationName = params.get("destination");
    let tod = Number(params.get("tod"));
    let toa = Number(params.get("toa"));

    // let y = params.get("utY");
    // let d = params.get("utD");
    // let h = params.get("utH");
    // let m = params.get("utM");
    //let utNow = `y${y} d${d} ${h}:${m}`

    document.getElementById("outCurrentTime").textContent = convertSecondsToDateObj(utNow).toString();
    document.getElementById("outOrigin").textContent = originName;
    document.getElementById("outDestination").textContent = destinationName;
    
    document.getElementById("outTxTod").textContent = convertSecondsToDateObj(tod).toString();

    // input to pass on to next
    document.forms["parkOrbit"]["origin"].value = originName;
    document.forms["parkOrbit"]["destination"].value = destinationName;

    //document.forms["parkOrbit"]["utY"].value = y;
    //document.forms["parkOrbit"]["utD"].value = d;
    //document.forms["parkOrbit"]["utH"].value = h;
    //document.forms["parkOrbit"]["utM"].value = m;
    
    document.forms["parkOrbit"]["utNow"].value = utNow;

    document.forms["parkOrbit"]["tod"].value = Math.round(tod);
    document.forms["parkOrbit"]["toa"].value = Math.round(toa);

    var svg = document.getElementById("planetSystem");
    svg.addEventListener("mousemove", mouseMove);

    planetsData = window.localStorage.getItem("planetsXML");
    createPlanetObjectsFromXML(planetsData, () => { });

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
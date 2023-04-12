
var viewBox;
var initialViewBoxWidth;

var mapWidth;
var mapHeight;

var zoom = 1;

var minZoom = .9;
var maxZoom = 5;

var pointerCount = 0;

var pointerA;
var pointerB;
var lastD;

let zoomAnchorX = 0;
let zoomAnchorY = 0;


// ===== ZOOM =====
function zoomWheel(event) {

    var v = event.deltaY;
    //deltaY is + 100 or -100

    zoomPerCent(Math.sign(v) * .25);

    event.preventDefault();
    event.stopImmediatePropagation();
}

function zoomPerCent(amount) {


    let w1 = viewBox.width;
    let h1 = viewBox.height;
    let x1 = viewBox.x;
    let y1 = viewBox.y;

    let p = 1 + amount;
    let a = amount * w1;

    w = w1 * p;
    h = h1 * p;
    x = x1 - a * zoomAnchorX / mapWidth;
    y = y1 - a * zoomAnchorY / mapHeight;

    zoom = Math.round(initialViewBoxWidth/ w * 100)/100;

    if(zoom < maxZoom && zoom > minZoom){
        zoomWindow(x, y, w, h);
    }
}

function zoomWindow(x0,y0,w,h){

    viewBox.x = x0;
    viewBox.y = y0;

    viewBox.height = h;
    viewBox.width = w;

    let zoom = initialViewBoxWidth / viewBox.width;
    
    window.dispatchEvent(svgZoomEvent);
    document.getElementById("zoom").textContent = Math.round(initialViewBoxWidth / viewBox.width * 100) / 100;

    //scaleText();
}

// ----- Zoom By Orbit -----
function zoomPlanetOrbit(orbit){

    //let orbit = svgOrbits[planetName];

    let x = (orbit.ox + orbit.dx) / 2;
    let y = (orbit.oy + orbit.dy) / 2;
    let a = orbit.a;

    let o = new DOMPoint(x, y);

    let element = orbit.element;
    let transformList = element.parentElement.transform.baseVal;
    //let transformList = solarSystemSVG.getElementById(planetName + "Orbit").parentElement.transform.baseVal;

    if(transformList.length==1){
        
        var angle = transformList[0].angle;

        o = o.matrixTransform(new DOMMatrix().rotate(angle))
        
    }
    
    zoomWindow( (o.x - a) * 1.1, (o.y - a) * 1.1, 2 * a * 1.1, 2 * a * 1.1);

}

function zoomTxOrbit() { //planet1, planet2){

    var planet1 = transferOrbit.originPlanet;
    var planet2 = transferOrbit.destinationPlanet;

    var planetO;

    if (planet1.sma > planet2.sma) {
        planetO = planet1;
    } else {
        planetO = planet2;
    }

    zoomPlanetOrbit(svgOrbits[planetO.name]);
}

function zoomTxOrbit2(){

}

function zoomAll(event) {
    zoomPlanetOrbit(svgOrbits["Eeloo"]);
}


// ======== POINTER MANAGER ==========

function pointerDown(event){
    
    event.preventDefault();
    event.stopImmediatePropagation();

    pointerCount += 1;

    console.log("PC" + pointerCount, "DOWN");

    if(event.pointerType=="mouse") return;

    if(pointerCount==1){
        //console.log("A: ", event);
        pointerA = event;
    }else{
        //console.log("B:", event);
        pointerB = event;
    }

    
}

function pointerUp(event){

    pointerCount -= 1;

    console.log("PC" + pointerCount, "UP");

    if(pointerCount<0) pointerCount = 0;

    if(event.pointerType=="mouse") return;

    if(event.pointerId==pointerA.pointerId){
        pointerA = null;
    }else{
        pointerB = null;
    }


}

function pointerMove(event) {

    let isPan = (event.pointerType="mouse" && event.buttons == 1) || (event.pointerType=="touch" && pointerCount == 1);
    let isPinchZoom = (event.pointerType=="touch" && pointerCount == 2);

    document.getElementById("xyCoordinates").textContent = "is pinch  " +  isPinchZoom;

    console.log("move", isPinchZoom);

    //event.preventDefault();
    //event.stopImmediatePropagation();

    document.getElementById("xyCoordinates").textContent = "PC" + pointerCount;

    if(isPan) pan(event);
    if(isPinchZoom){

        if(event.pointerId == pointerA.pointerId){
            pointerA = event;
        }
        if(event.pointerId == pointerB.pointerId){
            pointerB = event;
        }

        pinchZoom(event);
    }
        

    
        // let vbX = viewBox.x;
        // let vbY = viewBox.y;

        // let vbwidth = viewBox.width;
        // let vbheight = viewBox.height;

        // let mouseX = event.offsetX;
        // let mouseY = event.offsetY;

        // let dx = (vbwidth / mapWidth * mouseX + vbX) * unitFactor / scaleFactor;
        // let dy = -(vbheight / mapHeight * mouseY + vbY) * unitFactor / scaleFactor;

        // let r = Math.hypot(dx, dy);
        // let theta = radToDeg(modRev(Math.atan2(dy, dx)));

        // zoomAnchorX = mouseX;
        // zoomAnchorY = mouseY;

        // document.getElementById("xyCoordinates").textContent = (`${dx.toFixed(2)}, ${dy.toFixed(2)}`);
        // document.getElementById("polarCoordinates").textContent = (`${r.toFixed(2)} <  ${theta.toFixed(2)}deg`);
    

}


function pan(event){
    //console.log(event, isPan);

    //pan
    viewBox.x -= event.movementX * viewBox.width / mapWidth;
    viewBox.y -= event.movementY * viewBox.height / mapHeight;

   

}

function pinchZoom(event){

    let ax = pointerA.clientX;
    let ay = pointerA.clientY;

    let bx = pointerB.clientX;
    let by = pointerB.clientY;

    let dx = ax - bx;
    let dy = ay - by;

    let d = Math.hypot(dx, dy);
    let dd = lastD-d;

    console.log("pz", ax, bx);

    document.getElementById("xyCoordinates").textContent = "pinch zoom "  + d.toFixed(2);

    lastD = d;

    if(dd<0){
        amount = -.05
    }else{
        amount = .05;
    }

    zoomAnchorX = (ax + bx) / 2;
    zoomAnchorY = (ay + by) / 2;

    //document.getElementById("polarCoordinates").textContent = amount.toFixed(2);
    zoomPerCent(amount);
}

function toggleMouseDown(event) {
    boolDown = !boolDown;
}

function touchDown(event) {
    lastX = event.clientX;
    lastY = event.clientY;
}

function touchUp() {
    lastX = NaN;
    lastY = NaN;
}

function z_pan(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    //if(!mouseDown.active) return;
    //if (boolDown) {
    if (event.touches.length == 1) {

        let x = event.touches[0].clientX;
        let y = event.touches[0].clientY;

        let dx = x - lastX;
        let dy = y - lastY;

        if (!isNaN(dx) && !isNaN(dy)) {

            viewBox.x -= dx * 2;
            viewBox.y -= dy * 2;

        }

        lastX = x;
        lastY = y;

    } else {

        let x0 = event.touches[0].clientX;
        let y0 = event.touches[0].clientY;
        let x1 = event.touches[1].clientX;
        let y1 = event.touches[1].clientY;
        let d = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
        let deltaD = lastD - d;

        if (d > lastD) {
            zoom(-150);
        } else {
            zoom(150)
        }

        lastD = d;
    }
}


function z_scaleText() {

    //let svg = document.getElementById("planetSystem");
    let svg = document.getElementById("svgObject").contentDocument.getElementById("planetSystem");
    let gnode = svg.getElementById("gnode");

    if (gnode == null) return;

    let currentWidth = viewBox.width;
    let scaleValue = mapWidth / currentWidth;

    let scaleTransform = svg.createSVGTransform();
    scaleTransform.setScale(10, 20);
    gnode.transform.baseVal.appendItem(scaleTransform);

    console.log("scale text value: ", scaleValue)

}




function initializeSVG() {

    console.log("....initializing svg");

    let obj = document.getElementById("svgObject");
    let svg = obj.contentDocument.rootElement;

    //mouseDown = { active: false, x: 0, y: 0 };
    //boolDown = false;

    svg.addEventListener("pointerdown", pointerDown);
    svg.addEventListener("pointerup", pointerUp);
    svg.addEventListener("pointermove", pointerMove);
    svg.addEventListener("mousewheel", zoomWheel);
    
    svg.style.touchaction = "none";

    //onpointerdown = "toggleMouseDown(event)"
    //onpointerup = "toggleMouseDown(event)"
    //onmouseleave = "boolDown=false"
  
    mapWidth = svg.scrollWidth;
    mapHeight = svg.scrollHeight;

    viewBox = svg.viewBox.baseVal;

    initialViewBoxWidth = viewBox.width;

    document.getElementById("outer").scrollLeft = 49;
    
    console.log("....svg initialized");
}


function loadSVG(svgName, callback) {

    console.log("....loading svg : " + svgName);

    let obj = document.getElementById("svgObject");
    obj.setAttribute("data", svgName);

    return new Promise(resolve => {
        window.setTimeout(()=>{resolve("loaded")}
            ,300
        );
    });
}


async function setPlanetSystemSVG(planetName) {

    console.log("setting planet system SVG");

    scaleFactor = 1 / 1e6;
    unitScale = 1 / 1e6;

    let planet = planets[planetName];
    
    let eqR = planet.eqR;
    let soi = planet.soi;

    minZoom = .5;
    maxZoom = soi / eqR * 2;

    await loadSVG("planetSystem.svg");

    let svg = document.getElementById("svgObject").contentDocument.rootElement;
    
    svg.viewBox.baseVal.x = -soi * scaleFactor / 2;
    svg.viewBox.baseVal.y = -soi * scaleFactor / 2;
    svg.viewBox.baseVal.width = soi * scaleFactor;
    svg.viewBox.baseVal.height = soi * scaleFactor;

    initializeSVG();
}


async function setSolarSystemSVG() {

    console.log("...setting solar system SVG");

    scaleFactor = 1 / 1e8;
    unitScale = 1 / 1e9;

    maxZoom = 150;
    minZoom = .9;

    await loadSVG("solarSystem.svg");
          initializeSVG();
          initializeSolarSystemSVGelements();

    window.dispatchEvent(displayedTimeChangeEvent);
}

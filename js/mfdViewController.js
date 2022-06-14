var viewBox;
var initialViewBoxWidth;

var mapWidth;
var mapHeight;

var zoom = 1;

var minZoom = .9;
var maxZoom = 5;

let zoomAnchorX = 0;
let zoomAnchorY = 0;

var boolDown;
var mouseDown;

var lastD;
var lastTouch;
var lastX;
var lastY;


let start, previousTimeStamp;
let dir, err; delta=1;
let animationDone;

function mouseMove(event){
    
    if(event.buttons==1){
        
        //pan
        viewBox.x -= event.movementX * viewBox.width/mapWidth;
        viewBox.y -= event.movementY * viewBox.height/mapHeight;

        event.preventDefault();
        event.stopImmediatePropagation();

    }else{

        let vbX = viewBox.x;
        let vbY = viewBox.y;
        
        let vbwidth = viewBox.width;
        let vbheight = viewBox.height;
        
        let mouseX = event.offsetX;
        let mouseY = event.offsetY;
        
        let dx = (vbwidth / mapWidth * mouseX + vbX) *  unitFactor/scaleFactor;
        let dy = -(vbheight / mapHeight * mouseY + vbY) * unitFactor/scaleFactor;
        
        let r = Math.hypot(dx,dy);
        let theta = radToDeg(modRev(Math.atan2(dy,dx)));

        zoomAnchorX = mouseX;
        zoomAnchorY = mouseY;
        
        // document.getElementById("xyCoordinates").textContent = (`${dx.toFixed(2)}, ${dy.toFixed(2)}`);
        // document.getElementById("polarCoordinates").textContent = (`${r.toFixed(2)} <  ${theta.toFixed(2)}deg`);
    }
        
}
    
function mouseLeave(event){
    mouseX = null;
    mouseY = null;

    zoomAnchorX=0;
    zoomAnchorY=0;
}

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
    
    //document.getElementById("zoom").textContent = `zoom ${Math.round(initialViewBoxWidth / viewBox.width * 100) / 100}`;

    //scaleText();
}

function zoomPlanetOrbit(planetName){

    let orbit = svgOrbits[planetName];

    let x = (orbit.ox + orbit.dx) / 2;
    let y = (orbit.oy + orbit.dy) / 2;
    let a = orbit.a;

    let o = new DOMPoint(x, y);

    let transformList = document.getElementById(planetName + "Orbit").parentElement.transform.baseVal;

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

    zoomPlanetOrbit(planetO.name);
}

function zoomAll(event) {
    zoomPlanetOrbit("Eeloo");
}


function scaleText() {

    let svg = document.getElementById("planetSystem");
    let gnode = document.getElementById("gnode");

    if (gnode == null) return;

    let w = viewBox.width;

    let s1 = 18 * w / mapWidth * 10;
    let M = svg.createSVGMatrix();
    M = M.scale(s1);
    let T = svg.createSVGTransformFromMatrix(M)
    gnode.transform.baseVal.replaceItem(T, 1);

}

function toggleMouseDown(event) {
    boolDown = !boolDown;
}

function mouseUp(event){
}

function touchDown(event) {
    lastX = event.clientX;
    lastY = event.clientY;
}

function touchUp() {
    lastX = NaN;
    lastY = NaN;
}


function setSolarSystemSVG() {

    console.log("set solar system SVG");

    // switch SVG's
    document.getElementById("planetSystem").setAttribute("display", "none");
    document.getElementById("solarSystem").setAttribute("display", "initial");

    scaleFactor = 1 / 1e8;
    unitScale = 1 / 1e9;

    // set viewBox to new SVG
    var svg = document.getElementById("solarSystem");
    viewBox = svg.viewBox.baseVal;

    initialViewBoxWidth = viewBox.width;
    mapWidth = svg.scrollWidth;
    mapHeight = svg.scrollHeight;

    maxZoom = 150;
    minZoom = .9;

}

var svgSet;

function setPlanetSystemSVG(eqR, soi) {

    console.log("set to planet system SVG");

    // if (svgSet){
    //     let w = 200 / scaleFactor;
    //     //zoomWindow(-w/2,-w/2,w,w)
    //     return;
    // }
    // svgSet=true;

    // switch SVG's
    document.getElementById("solarSystem").setAttribute("display", "none");
    document.getElementById("planetSystem").setAttribute("display", "initial");
    
    scaleFactor = 1 / 1e6;
    unitFactor = 1 / 1e6;

    // set viewBox to new SVG
    var svg = document.getElementById("planetSystem");

    mapWidth = svg.scrollWidth;
    mapHeight = svg.scrollHeight;

    svg.viewBox.baseVal.x = -soi * scaleFactor;
    svg.viewBox.baseVal.y = -soi * scaleFactor;
    svg.viewBox.baseVal.width = soi * scaleFactor * 2;
    svg.viewBox.baseVal.height = soi * scaleFactor * 2;
    
    viewBox = svg.viewBox.baseVal;
    initialViewBoxWidth = viewBox.width;

    minZoom = .5;
    maxZoom = soi/eqR * 2;

}


function startAnimation(theDir, callback) {
    dir = Math.sign(theDir);
    errDir = transferOrbit.err;
    window.requestAnimationFrame(animationStep);
}

function animationStep(timestamp) {

    if (start === undefined) { start = timestamp; }

    const elapsed = timestamp - start;

    if (previousTimeStamp !== timestamp) {

        // previous step has completed

        displayedTime += dir * (1 * 6 * 60 * 60) * delta;
        window.dispatchEvent(displayedTimeChangeEvent);

        var lastErrDir = err;

        err = transferOrbit.err;

        var sign = Math.sign(err * lastErrDir);

        //console.log(err, sign);

        if (sign == -1 && Math.abs(err) > .00001) {

            delta *= .5;
            dir = -dir;

            //console.log(delta);
        }


        if (Math.abs(transferOrbit.err) < .0001 || elapsed > 1000 * 6 * 1) {

            animationDone = true;
            start = undefined;
            delta = 1;
            activeButton.setInactive();
            return;
        }


        previousTimeStamp = timestamp
        window.requestAnimationFrame(animationStep);

    }
}

function initializeScreen(){

    console.log("initialize screen controls");

    mouseDown = { active: false, x: 0, y: 0 };
    boolDown = false;
    
    var svg1 = document.getElementById("solarSystem");
    svg1.addEventListener("mousemove", mouseMove);

    var svg2 = document.getElementById("planetSystem");
    svg2.addEventListener("mousemove", mouseMove);

    setSolarSystemSVG();
}

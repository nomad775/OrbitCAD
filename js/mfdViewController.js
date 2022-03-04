var viewBox;
var boolDown;
var mouseDown;

var lastD;
var lastTouch;
var lastX;
var lastY;

let zoomAnchorX;
let zoomAnchorY;

let start, previousTimeStamp;
let dir, err; delta=1;
let animationDone;

function mouseOver(event){
    
    if(event.buttons==1){
        
        //pan
        viewBox.x -= event.movementX * viewBox.width/360;
        viewBox.y -= event.movementY * viewBox.height/360;
        event.preventDefault();
        event.stopImmediatePropagation();

    }else{

        let imgWidth = 360;
        let imgHeight =360;
        
        let vbX = viewBox.x;
        let vbY = viewBox.y;
        
        let vbwidth = viewBox.width;
        let vbheight = viewBox.height;
        
        let mouseX = event.offsetX;
        let mouseY = event.offsetY;
        
        let dx = vbwidth / imgWidth * mouseX + vbX
        let dy = -(vbheight / imgHeight * mouseY + vbY)
        
        let r = Math.hypot(dx,dy)
        let theta = Math.atan2(dy,dx) * 180/Math.PI
        
        dx = Math.round(dx*100)/100;
        dy = Math.round(dy*100)/100;
        
        r = Math.round(r*100)/100;
        theta = Math.round(theta*100)/100
        
        zoomAnchorX = mouseX;
        zoomAnchorY = mouseY;
        
        $("#xyCoordinates").text(`${dx}, ${dy}`);
        $("#polarCoordinates").text(`${r} <  ${theta}deg`);
        $("#zoom").text(` zoom ${Math.round(1900 / viewBox.width * 100) / 100}`);
    }
        
}
    
function mouseLeave(event){
    mouseX = null;
    mouseY = null;
}

function zoomWheel(event) {

    var v = event.deltaY;
    //deltaY is + 100 or -100

    var zoomPercent = Math.sign(v) * viewBox.width * .25;

    zoom(zoomPercent);

    event.preventDefault();
    event.stopImmediatePropagation();
    $("#zoom").text(` zoom ${Math.round(1900/viewBox.width*100)/100}`);
}

function zoom(amount) {
    
    viewBox.width += amount;
    viewBox.height += amount;

    viewBox.x += -amount * zoomAnchorX / 360;
    viewBox.y += -amount * zoomAnchorY / 360; //  / 2;

    //if (viewBox.width < 1) viewBox.width = 1;
    
    //if (viewBox.x < -1900) viewBox.x = -1900;
    //if (viewBox.y < -1900) viewBox.y = -1900;

    //if (viewBox.height > 2000) viewBox.height = 2000;
    //if (viewBox.width > 2000) viewBox.width = 2000;

    //if (viewBox.x > -200) viewBox.x = -200;
    //if (viewBox.y > -200) viewBox.y = -200;

    //if (viewBox.height < 30) viewBox.height = 30;
    //if (viewBox.width < 30) viewBox.width = 30;

    /* var r = 12 / rScale[zoom];
     console.log(r);

     document.querySelectorAll(".planet").forEach(
         function(item, index){
             var radius = item.attributes.getNamedItem("r");
             radius.nodeValue=r; //25/zoom;
             console.log("R:" + r);
         }
     )*/
}

function zoomPlanet(planetName){

    let svgPlanet = svgPlanets[planetName];

    let r = svgPlanet.soi * 1.1;

    let x = svgPlanet.x-r/2;
    let y = svgPlanet.y-r/2;

    viewBox.x = x;
    viewBox.y = y;
    viewBox.height = r;
    viewBox.width = r;

}

function zoomWindow(x0,y0,w,h){

    viewBox.x = x0;
    viewBox.y = y0;
    viewBox.height = h;
    viewBox.width = w;

}


function zoomPlanetOrbit(planetName){

    let element = document.getElementById(planetName + "Orbit");
    
    let boundingBox = element.getBBox();

    viewBox.x=  boundingBox.x;
    viewBox.y = boundingBox.y;
    viewBox.width = boundingBox.width;
    viewBox.height = boundingBox.height;
}

function zoomAll(event) {
    zoomPlanetOrbit("Eeloo");
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

function pan(event) {

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


function setSolarSystemSVG() {

    // switch SVG's
    $("#solarSystem").attr("display", "initial");
    $("#planetSystem").attr("display", "none");

    scaleFactor = 1 / 1e8;

    // set viewBox to new SVG
    var svg = document.getElementById("solarSystem");
    viewBox = svg.viewBox.baseVal;
}

function setPlanetSystemSVG(thePlanet) {

    console.log("set to planet system SVG");

    // switch SVG's
    $("#solarSystem").attr("display", "none");
    $("#planetSystem").attr("display", "initial");

    scaleFactor = 1 / 1e6;

    // set viewBox to new SVG
    var svg = document.getElementById("planetSystem");
    viewBox = svg.viewBox.baseVal;

    let r = thePlanet.r;
    let soi = thePlanet.soi;
    let Ln = txOrbit.Ln_o;

    Ln = modRev(Ln+Math.PI);

    let sx = 2 * soi * scaleFactor * Math.cos(Ln);
    let sy = -2 * soi * scaleFactor * Math.sin(Ln);
   
    $("#planetSystemPlanet").attr("r", r * scaleFactor);
    $("#planetSystemSOI").attr("r", soi * scaleFactor);
    
    $("#sunDir").attr("x2", sx).attr("y2", sy);

    $("#prograde").attr("x1", sy).attr("y1", -sx);
    $("#prograde").attr("x2", -sy).attr("y2", sx);
}


function startAnimation(theDir, callback) {
    dir = Math.sign(theDir);
    errDir = txOrbit.err;
    window.requestAnimationFrame(animationStep);
}

function animationStep(timestamp) {

    if (start === undefined) { start = timestamp; }

    const elapsed = timestamp - start;

    if (previousTimeStamp !== timestamp) {

        // previous step has completed

        displayedTime += dir * (1 * 6 * 60 * 60) * delta;
        window.dispatchEvent(timeChangeEvent);

        var lastErrDir = err;

        err = txOrbit.err;

        var sign = Math.sign(err * lastErrDir);

        //console.log(err, sign);

        if (sign == -1 && Math.abs(err) > .00001) {

            delta *= .5;
            dir = -dir;

            //console.log(delta);
        }


        if (Math.abs(txOrbit.err) < .0001 || elapsed > 1000 * 6 * 1) {

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
    
    var svg = document.getElementById("solarSystem");
    svg.addEventListener("mousemove", mouseOver);

    var svg2 = document.getElementById("planetSystem");
    svg2.addEventListener("mousemove", mouseOver);

    setSolarSystemSVG();
}

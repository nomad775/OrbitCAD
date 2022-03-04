const svgOrbits = [];
const svgPlanets = [];

var svgTxOrbit = {};
var svgEjectOrbit = {};
var svgCaptureOrbit = {};

const timeChangeEvent = new Event('timeChange');

var scaleFactor  = 1/1e8;

var r = 10;

const Direction = {CCW: 1, CW: -1}

class SVGplanet {

    constructor(planet, elementId) {

        this.planet = planet;

        if (elementId == undefined) {
            this.jqPlanet = $("#" + planet.name);
        } else {
            this.jqPlanet = $(elementId);
        }

        this.soi = planet.soi * scaleFactor;
        
        this.x = 0;
        this.y = 0;

        let that = this;
        window.addEventListener("timeChange", (e) => { that.eventHandler(e) });

        //console.log("svg planet : " + this.planet.name);
        
    }

    update(t) {

        var Ln = this.planet.LnAtTimeT(t);
        var r = this.planet.rAtLn(Ln) * scaleFactor;

        this.x = r * Math.cos(Ln);
        this.y = -r * Math.sin(Ln);

        this.jqPlanet.attr("cx", this.x);
        this.jqPlanet.attr("cy", this.y);

    }

    eventHandler(event) {

        switch (event.type) {
            case "timeChange":
                this.update(displayedTime);
                //console.log("updated to " + displayedTime);
                break;

            case 1:
                r = this.jqPlanet.attr("r");
                this.jqPlanet.attr("r", r * zoomFactor);
                break;

            default:

                break;
        }

    }

}

class SVGellipiticalOrbit{

    constructor(elementId, object1, t){
        
        this.element = document.getElementById(elementId);
        
        console.log("elliptical orbit " + elementId);
        console.log(this.element);

        this.jqOrbit = $(elementId);
        this.definingObject = object1;
        this.update(t);

    }
    
    update(t){
        
        if( this.definingObject instanceof Planet){
            
            var thePlanet = this.definingObject;
            
            var Ln0 = thePlanet.Ln0;
            var Ln1 = Ln0 + pi;
            
            var r0 = thePlanet.rAtLn(Ln0) * scaleFactor;
            var r1 = thePlanet.rAtLn(Ln1) * scaleFactor;
            
            var Ln = Ln1;
            
        }else if( this.definingObject instanceof TransferOrbit)
        {
            
            this.definingObject.update(t);
            
            var theTxOrbit = this.definingObject
            
            var Ln = theTxOrbit.Ln_o + pi;
            
            var r0 = theTxOrbit.ro * scaleFactor;
            var r1 = theTxOrbit.rd * scaleFactor;
        }
        
        this.a = (r0+r1)/2;
        this.b = Math.sqrt(r0*r1);
        
        this.ox = r0 * Math.cos(Ln+pi);
        this.oy = -r0 * Math.sin(Ln+pi);
        
        this.dx = r1 * Math.cos(Ln);
        this.dy = -r1 * Math.sin(Ln);
        
        this.ang = -Ln * 180/pi;
        
        var data = `M ${this.ox} ${this.oy} A ${this.a} ${this.b} ${this.ang} 0 0 ${this.dx} ${this.dy} A ${this.a} ${this.b} ${this.ang} 0 0 ${this.ox} ${this.oy}`
        
        this.element.setAttributeNS(null, "d", data);
        //this.jqOrbit.attr("d", data);
    }
}

class svgPartialArc{

    constructor(id, orbit, startObj, endObj){
        
        this.element = document.getElementById(id);
        this.jqOrbit = $("#" + id);
        
        this.orbit = orbit;
        this.startObj = startObj;
        this.endObj = endObj;
        
        this.update();

    }
    
    update(){
        
        let a = this.orbit.a;
        let b = this.orbit.b;
        let ang = this.orbit.ang;
        
        let ox = this.startObj.attr("cx");
        let oy = this.startObj.attr("cy");
        
        let dx = this.endObj.attr("cx");
        let dy = this.endObj.attr("cy");

        let ang1 = Math.atan2(-oy, ox);
        let ang2 = Math.atan2(-dy, dx);

        let f = 0;
        //console.log(this.jqOrbit.attr("id"));

        if (this.jqOrbit.attr("id") == "destTOF") {
            f=1
            let cross = ox * dy - dx * oy;
            if (cross < 0) f = 0;
        }

        var data = `M ${ox} ${oy} A ${a} ${b} ${ang} ${f} 0 ${dx} ${dy}`
        
        //this.jqOrbit.attr("d", data);
        
        this.element.setAttributeNS(null, "d", data);
        //console.log("arc updated");
        //console.log(data);
        //console.log(this.jqOrbit);
    }

    updatePoints(ox,oy,dx,dy){

        let a = this.orbit.a;
        let b = this.orbit.b;
        let ang = this.orbit.ang;
        let f = 0;
        var data = `M ${ox} ${oy} A ${a} ${b} ${ang} ${f} 0 ${dx} ${dy}`

        this.jqOrbit.attr("d", data);
       
    }
}

class SVGtransfer{
    
    theTxOrbit;

    tod = 0;
    toa = 0;
    tof = 0;

    svgEllipse = {};

    svgCl = $("#line1");
    svgMarker = $("#txMarker");

    svgDestinationArc;
    svgTxArc;

    constructor(){

        //console.log("txOrbit in svg constructor");
        //console.log(txOrbit);

        this.theTxOrbit = txOrbit;

        this.originName = txOrbit.originPlanet.name;
        this.destinationName = txOrbit.destinationPlanet.name;

        this.svgEllipse = new SVGellipiticalOrbit("txOrbit", txOrbit, 0)

        this.svgOrigin = svgPlanets[this.originName];
        this.svgDestination = svgPlanets[this.destinationName];
        this.svgDestinationFuture = $("#planet_destination_future");

        //this.svgOriginOrbit = $("#"+ originName + "Orbit");
        this.svgOriginOrbit = svgOrbits[originName];
        this.svgDestinationOrbit = svgOrbits[this.destinationName];
        
        this.svgDestinationArc = new svgPartialArc("destTOF", this.svgDestinationOrbit, this.svgDestination.jqPlanet, $("#planet_destination_future"));

        this.svgTxArc = new svgPartialArc("txTOF", this.svgEllipse, this.svgOrigin.jqPlanet, this.svgMarker)

        this.svgOrigin.jqPlanet.attr("r", 16);
        this.svgDestination.jqPlanet.attr("r", 16);

        this.update(displayedTime);
        //this.svgDestinationArc.update();
        //this.svgTxArc.update();

        let that = this;
        window.addEventListener("timeChange", (e) => { that.eventHandler(e) });
    }

    eventHandler(event) {

        switch (event.type) {
            case "timeChange":
                this.update(displayedTime);
                //console.log("updated to " + displayedTime);
                break;

            case 1:
                r = this.jqPlanet.attr("r");
                this.jqPlanet.attr("r", r * zoomFactor);
                break;

            default:

                break;
        }

    }

    update(t){

        this.svgEllipse.update(t);

        let ox = this.svgEllipse.ox;
        let oy = this.svgEllipse.oy;
        let dx = this.svgEllipse.dx;
        let dy = this.svgEllipse.dy;

        // txOrbit decorations
        this.svgCl.attr("x1", ox);
        this.svgCl.attr("y1", oy);
        this.svgCl.attr("x2", dx);
        this.svgCl.attr("y2", dy);

        let transform = `translate(${dx},${dy})`
        this.svgMarker.attr("transform", transform);

        this.svgTxArc.updatePoints(ox, oy, dx, dy);

        var toa = t + txOrbit.tof;

        var Ln_f = txOrbit.destinationPlanet.LnAtTimeT(toa);
        var r_f =  txOrbit.destinationPlanet.rAtLn(Ln_f) * scaleFactor;

        var fx = r_f * Math.cos(Ln_f);
        var fy = -r_f * Math.sin(Ln_f);

        this.svgDestinationFuture.attr("cx", fx);
        this.svgDestinationFuture.attr("cy", fy);

        var Ln_t = txOrbit.destinationPlanet.LnAtTimeT(displayedTime);
        var cr =   txOrbit.destinationPlanet.rAtLn(Ln_t) * scaleFactor;
        var cx = cr * Math.cos(Ln_t);
        var cy = -cr * Math.sin(Ln_t);

        this.svgDestinationArc.updatePoints(cx,cy,fx,fy)
    }

}

class SVGhyperbolicOrbit{

    constructor(theHyperbolicOrbit, direction){

        this.orbit = theHyperbolicOrbit;
        this.direction = direction

        this.update();

        this.drawHyperbola();
    }

    update(){

        this.a = this.orbit.a * scaleFactor;
        this.c = (-this.orbit.a + this.orbit.rp) * scaleFactor;
        this.b = Math.sqrt(this.c ** 2 - this.a ** 2);

        let soi = this.orbit.bodySOI * scaleFactor
        let thetaSOI = this.orbit.thetaSOI;
        
        this.endx = soi * Math.cos(thetaSOI);
        this.endy = -soi * Math.sin(thetaSOI);

        this.LnPe = this.orbit.lnPe;
    }

    drawHyperbola(){
       
        // requires a, b, c of hyperbola
        // requires endx, endy - soi and thetaSOI
        // rotation - LnPe

        // full curve is A B C D
        // bottom half is A E H J (capture)
        // top half is J I G D (eject)

        let ax = 2 * this.a + this.c;
        let ay = this.b * Math.sqrt(3);

        let bx = 2 / 3 * this.a + this.c ;
        let by = this.b * (48 - 26 * Math.sqrt(3)) / 18;

        let cx = bx;
        let cy = -by;

        let dx = ax;
        let dy = -ay;

        // points for half-ing
        let ex = (ax + bx) / 2;
        let ey = (ay + by) / 2;

        let fx = (bx + cx) / 2;
        let fy = (by + cy) / 2;

        let gx = (cx + dx) / 2;
        let gy = (cy + dy) / 2;


        let hx = (ex + fx) / 2;
        let hy = (ey + fy) / 2;

        let ix = (fx + gx) / 2;
        let iy = (fy + gy) / 2;

        let jx = (hx + ix) / 2;
        let jy = (hy + iy) / 2;

        

        let path ="";

        if(this.direction == Direction.CCW){
            // top half
            path = `M ${jx},${jy} C ${ix},${iy} ${gx},${gy} ${dx},${dy} L ${this.endx},${this.endy}`;
            console.log("ejection", path);
        }else{
            // bottom
            //path = `M ${ax},${ay} C ${ex},${ey} ${hx},${hy} ${jx},${jy} L ${this.endx},${this.endy}`;

            // full hyperbola
            path = `M ${this.endx}, ${-this.endy} L ${ax},${ay} C ${bx},${by} ${cx},${cy} ${dx},${dy} L${this.endx}, ${this.endy}`;
            console.log("capture", path);

            this.LnPe += Math.PI;
        }

        console.log("lnPe " + this.LnPe);
        

        let hyp = document.getElementById("hyperbola");
        hyp.setAttributeNS(null, "d", path);

        $("#axis").attr("x2", this.c);
        $("#asymptote").attr("x1", this.c);
        $("#asymptote").attr("x2", this.endx).attr("y2", this.endy);
        
        let hypGroup = document.getElementById("hyperbolaGroup");
        hypGroup.setAttributeNS(null, "transform", `rotate(${this.LnPe*180/Math.PI})`)
    }
}


function setTxViewBox(){ //planet1, planet2){

    var planet1 = txOrbit.originPlanet;
    var planet2 = txOrbit.destinationPlanet;

    var planetO;
    
    if(planet1.sma > planet2.sma){
        planetO = planet1;
    }else{
        planetO = planet2;
    }
    
    var a = planetO.sma * scaleFactor + r;
    var cx = planetO.cx * scaleFactor;
    var cy = planetO.cy * scaleFactor;
    
    
    // $("#scaleCircle1").attr("r", a);
    
    // $("#scaleCircle2").attr("r", a);
    // $("#scaleCircle2").attr("cx", -cx);
    // $("#scaleCircle2").attr("cy", cy);
    
    var left = (-a-cx).toFixed(3);
    var top = (-a+cy).toFixed(3);
    
    var width = 2*a;
    var height = 2*a;
    
    var box = left + " " + top + " " + width + " " + height;
    
    $("#solarSystem").attr("viewBox", box);
    
   /* var rMax_o = planet2.sma + 2*planet2.c;
    var rMax_d = planet1.sma + 2*planet1.c;
    
    if(rMax_o > rMax_d){
        rMax = rMax_o;
    }else{
        rMax = rMax_d;
    }

    scaleFactor = 1/(1e8)*svgWidth/(rMax/1e8);*/
}


function initializeTransferSVG(){

    console.log("initialize transfer SVG");

    // dim other planets
    for (let planet in svgPlanets) {
        svgPlanets[planet].jqPlanet.attr("r", 8);
    };

    //    INITIALIZE SVG
    svgTxOrbit = new SVGtransfer();
   
    setTxViewBox();

}

function initializeEjectionSVG(ejectionOrbit, direction){
    
    console.log("initialize ejection SVG");

    setPlanetSystemSVG(txOrbit.originPlanet);

    // adjust planet features
    let r = ejectionOrbit.bodyEqR * scaleFactor;
    let soi = ejectionOrbit.bodySOI * scaleFactor;

    let park = ejectionOrbit.rp * scaleFactor;
    let Ln = txOrbit.Ln_o;

    let sx = -2 * soi * Math.cos(Ln);
    let sy = 2 * soi * Math.sin(Ln);
    
    $("#planetSystemPlanet").attr("r", r );
    $("#planetSystemSOI").attr("r", soi);
    $("#planetSystemPark").attr("r", park);
    
    $("#sunDir").attr("x2",sx).attr("y2", sy);

    $("#prograde").attr("x1", sy).attr("y1", -sx);
    $("#prograde").attr("x2",-sy).attr("y2", sx);

    svgEjectOrbit = new SVGhyperbolicOrbit(ejectionOrbit, Direction.CCW);
    
    let z = 6 * r ;
    zoomWindow(-z/2, -z/2, z, z)

}


function initializeCaptureSVG(captureOrbit, direction){

    console.log("initialize capture SVG");

    setPlanetSystemSVG(txOrbit.destinationPlanet);

    // adjust planet features
    let r = captureOrbit.bodyEqR * scaleFactor;
    let soi = captureOrbit.bodySOI * scaleFactor;

    let park = captureOrbit.rp * scaleFactor;
    let Ln = txOrbit.Ln_d;

    let sx = -2 * soi * Math.cos(Ln);
    let sy = 2 * soi * Math.sin(Ln);

    $("#planetSystemPlanet").attr("r", r);
    $("#planetSystemSOI").attr("r", soi);
    $("#planetSystemPark").attr("r", park);

    $("#sunDir").attr("x2", sx).attr("y2", sy);

    $("#prograde").attr("x1", sy).attr("y1", -sx);
    $("#prograde").attr("x2", -sy).attr("y2", sx);

    svgCaptureOrbit = new SVGhyperbolicOrbit(ejectionOrbit, Direction.CW);
    
    let z = 6 * r;
    zoomWindow(-z / 2, -z / 2, z, z)
}

function initializeSVG() {

    console.log("initialize SVG");

    for(let planetName in planets){

        let curPlanet = planets[planetName];

        let svgPlanet = new SVGplanet(curPlanet);
        svgPlanets[planetName] = svgPlanet;

        let orbitName = planetName+"Orbit";
        let svgOrbit = new SVGellipiticalOrbit(orbitName, curPlanet, 0);
        svgOrbits[planetName] = svgOrbit;

    }

}






function drawHyperbolaCubicSpline(H) {

    //let ns = "http://www.w3.org/2000/svg"
    //var hyp = document.createElementNS(ns, "path");
    //let H = new HyperbolicOrbit(planets["Kerbin"], 100000, 2257);

    //var svgContainer = document.getElementById("planetSystem");

    let hyp = document.getElementById("hyperbola");

    let a = H.sma;
    let e = H.ecc;
    let pe = 800000;
    let soi = planets["Kerbin"].soi;
    let p = a * (1 - e * e);
    let c = -a + pe;
    let b = Math.sqrt(c * c - a * a);

    let thetaSOI = Math.acos((p / soi - 1) / e);
    let endx = soi * Math.cos(thetaSOI) * scaleFactor;
    let endy = -soi * Math.sin(thetaSOI) * scaleFactor;

    let ax = 2 * a * scaleFactor + c * scaleFactor;
    let ay = b * Math.sqrt(3) * scaleFactor;

    let bx = 2 / 3 * a * scaleFactor + c * scaleFactor;
    let by = b * (48 - 26 * Math.sqrt(3)) / 18 * scaleFactor;

    let cx = bx;
    let cy = -by;

    let dx = ax;
    let dy = -ay;

    // points for half-ing
    let ex = (ax + bx) / 2;
    let ey = (ay + by) / 2;

    let fx = (bx + cx) / 2;
    let fy = (by + cy) / 2;

    let gx = (cx + dx) / 2;
    let gy = (cy + dy) / 2;


    let hx = (ex + fx) / 2;
    let hy = (ey + fy) / 2;

    let ix = (fx + gx) / 2;
    let iy = (fy + gy) / 2;

    let jx = (hx + ix) / 2;
    let jy = (hy + iy) / 2;

    // full curve is A B C D
    // bottom half is A E H J
    // top half is J I G D

    //path = `M ${ax},${ay} C ${bx},${by} ${cx},${cy} ${dx},${dy}`;
    //path = `M ${ax},${ay} C ${ex},${ey} ${hx},${hy} ${jx},${jy}`;
    path = `M ${jx},${jy} C ${ix},${iy} ${gx},${gy} ${dx},${dy} L ${endx},${endy}`;

    hyp.setAttributeNS(null, "d", path);

    $("#axis").attr("x2", c * scaleFactor);
    $("#asymptote").attr("x1", c * scaleFactor);
    $("#asymptote").attr("x2", endx).attr("y2", endy);

    //hyp.setAttributeNS(null, "id", "ejectOrbit");
    //hyp.setAttributeNS(null, "stroke", "red");
    //hyp.setAttributeNS(null, "stroke-width", "1px");
    //hyp.setAttributeNS(null, "fill", "none");

    //svgContainer.appendChild(hyp);
}

function drawHyperbola(planet, pathPoints) {

    let ns = "http://www.w3.org/2000/svg"
    let hyp = document.createElementNS(ns, "path");

    let H = new HyperbolicOrbit(planets["Kerbin"], 100000, 2257);

    console.log(H);

    let a = H.a;
    let e = H.ecc;
    let pe = 700000;
    let soi = planets["Kerbin"].soi;
    let p = a * (1 - e * e);
    let c = a - pe;

    let thetaSoI = Math.acos((p / soi - 1) / e);

    path = "M " + pe * scaleFactor + ",0 L ";

    for (let i = 0; i <= thetaSoI; i += thetaSoI / 30) {

        let r = a * (1 - e ** 2) / (1 + e * Math.cos(i)) * scaleFactor;

        let x = r * Math.cos(i);
        let y = -r * Math.sin(i);

        path += `${x},${y} `;
    }

    hyp.setAttributeNS(null, "d", path);

    hyp.setAttributeNS(null, "stroke", "black");
    hyp.setAttributeNS(null, "stroke-width", "1px");
    hyp.setAttributeNS(null, "fill", "none");

    //let rotate = `rotate(${planet.LnPe * 180 / Math.PI},${cx}${cy})`;
    //hyp.setAttributeNS(null, "transform", rotate);

    var svgContainer = document.getElementById("solarSystem");
    svgContainer.appendChild(hyp);

    $("#soiMarker").attr("r", soi * scaleFactor);
    $("#peMarker").attr("r", 700000 * scaleFactor);

    $("#axis").attr("x2", -c * scaleFactor);

    $("#asymptote").attr("x1", -c * scaleFactor);

    let eta = Math.acos(-1 / e);

    $("#asymptote").attr("x2", soi * scaleFactor * Math.cos(eta) - c * scaleFactor);
    $("#asymptote").attr("y2", -soi * scaleFactor * Math.sin(eta));

    console.log("eta " + eta * 180 / Math.PI);
}

function drawHyperbolaSpline() {

    let ns = "http://www.w3.org/2000/svg"
    var hyp = document.createElementNS(ns, "path");

    let H = new HyperbolicOrbit(planets["Kerbin"], 100000, 2257);
    console.log(H);

    let a = H.a;
    let e = H.ecc;
    let pe = 700000;
    let soi = planets["Kerbin"].soi;
    let p = a * (1 - e * e);
    let c = -a + pe;
    //let b = Math.sqrt(c*c - a*a);


    // first point at pe
    let x1 = pe * scaleFactor;
    let y1 = 0;

    // control point is intersection of tangents
    // first tangent is vertical (90degs)
    // second tangent is the flight angle at p
    let cx1 = pe * scaleFactor;
    let cy1 = (pe * e - p) * scaleFactor;

    // seconds point at parameter (theta = 90)
    let x2 = 0;
    let y2 = -p * scaleFactor;

    // solve for second intersection of tangents
    // flight path angle at p (theta = 90) is e
    let phi = Math.atan(e);
    let eta = Math.acos(-1 / e);

    let alpha = eta + phi - Math.PI;
    let beta = Math.PI - phi;
    let gamma = Math.PI - eta;

    let h = (c - p / e) * Math.sin(beta) / Math.sin(alpha);

    console.log(p / e);
    console.log("eta : " + eta * 180 / Math.PI);
    console.log("phi : " + phi * 180 / Math.PI);
    console.log("alpha: " + alpha * 180 / Math.PI);

    // second control point
    let cx2 = (c - h * Math.cos(gamma)) * scaleFactor;
    let cy2 = -h * Math.sin(gamma) * scaleFactor;

    // end point
    let thetaSoI = Math.acos((p / soi - 1) / e);
    let x3 = soi * Math.cos(thetaSoI) * scaleFactor;
    let y3 = -soi * Math.sin(thetaSoI) * scaleFactor;

    console.log("TA soi : " + thetaSoI * 180 / Math.PI);

    //path = `M ${x1},${y1} `;
    //path += `Q ${cx1},${cy1} ${x2},${y2} ${cx2},${cy2} ${x3},${y3} `;
    path = `M ${x2},${y2} `;
    path += `Q ${cx2},${cy2} ${x3},${y3}`;

    console.log(path);

    hyp.setAttributeNS(null, "d", path);

    hyp.setAttributeNS(null, "stroke", "red");
    hyp.setAttributeNS(null, "stroke-width", "1px");
    hyp.setAttributeNS(null, "fill", "none");
    //ellipse.setAttributeNS(null, "transform", rotate);

    var svgContainer = document.getElementById("solarSystem");
    svgContainer.appendChild(hyp);

    var circle = document.createElementNS(ns, "circle");
    circle.setAttributeNS(null, "cx", cx2);
    circle.setAttributeNS(null, "cy", cy2);
    circle.setAttributeNS(null, "r", .001);

    circle.setAttributeNS(null, "stroke", "red");
    circle.setAttributeNS(null, "stroke-width", "1px");
    circle.setAttributeNS(null, "fill", "none");

    svgContainer.appendChild(circle);
    zoomWindow(-soi * scaleFactor / 2, -soi * scaleFactor / 2, soi * scaleFactor, soi * scaleFactor)

    var line = document.createElementNS(ns, "line");
    line.setAttributeNS(null, "x1", x2);
    line.setAttributeNS(null, "y1", y2);

    line.setAttributeNS(null, "x2", cx2);
    line.setAttributeNS(null, "y2", cy2);

    line.setAttributeNS(null, "stroke", "green");
    line.setAttributeNS(null, "stroke-width", "1px");
    line.setAttributeNS(null, "fill", "none");

    svgContainer.appendChild(line);
}

function drawEllipse(planet) {
    let ns = "http://www.w3.org/2000/svg"
    var ellipse = document.createElementNS(ns, "ellipse");

    console.log(planet.sma);
    let a = planet.sma;
    let c = planet.c;
    let b = Math.sqrt(a * a - c * c);

    a *= scaleFactor;
    b *= scaleFactor;

    let cx = -planet.cx * scaleFactor;
    let cy = planet.cy * scaleFactor;

    let rotate = `rotate(${planet.LnPe * 180 / Math.PI},${cx}${cy})`;

    ellipse.setAttributeNS(null, "cx", cx);
    ellipse.setAttributeNS(null, "cy", cy);
    ellipse.setAttributeNS(null, "rx", a);
    ellipse.setAttributeNS(null, "ry", b);

    ellipse.setAttributeNS(null, "stroke", "black");
    ellipse.setAttributeNS(null, "stroke-width", "3px");
    ellipse.setAttributeNS(null, "fill", "none");
    ellipse.setAttributeNS(null, "transform", rotate);

    var svgContainer = document.getElementById("solarSystem");
    svgContainer.appendChild(ellipse);

}
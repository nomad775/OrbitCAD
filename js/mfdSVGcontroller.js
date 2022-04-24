const svgOrbits = [];
const svgPlanets = [];

var svgTxOrbit = {};
var hypOrbit = {};
var svgCaptureOrbit = {};

const displayedTimeChangeEvent = new Event('displayedTimeChange');

var scaleFactor  = 1/1e8;
var unitFactor = 1/1e9;
var showAligned = true;

var r = 10;

const Direction = {CCW: 1, CW: -1}

class SVGplanet {

    constructor(planet) {

        this.planet = planet;

        this.element = document.getElementById(planet.name);

        this.soi = planet.soi * scaleFactor;
        
        this.x = 0;
        this.y = 0;

        let that = this;
        window.addEventListener("displayedTimeChange", (e) => { that.eventHandler(e) });
        this.element.addEventListener("click", (e) => {that.eventHandler(e)});

        //this.element.addEventListener("click",planetClickAsInput(i,planet.name);        
    }

    toggleHighlight(){
        this.element.classList.toggle("highlight");
    }

    update(t) {

        var Ln = this.planet.LnAtTimeT(t);
        var r = this.planet.rAtLn(Ln) * scaleFactor;

        this.x = r * Math.cos(Ln);
        this.y = -r * Math.sin(Ln);

        this.element.setAttribute("cx", this.x);
        this.element.setAttribute("cy", this.y);

    }

    eventHandler(event) {

        switch (event.type) {
            case "displayedTimeChange":
                //console.log("time change caught : svg planet " + displayedTime)
                this.update(displayedTime);
                break;

            case "transferChange":
                this.update();
                break;

            case "click":
                console.log("Planet clicked");
                planetClickAsInput(event, this.planet.name)

            default:

                break;
        }

    }

}

class SVGellipiticalOrbit{

    constructor(elementId, object1, t){
        
        this.element = document.getElementById(elementId);
        
        //console.log("elliptical orbit for : " + elementId);
        //console.log(this.element);

        //this.jqOrbit = $("#" + elementId);
        this.definingObject = object1;
        this.update(t);

    }
    
    toggleHighlight(){
        this.element.classList.toggle("highlight");
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
       
        this.orbit = orbit;
        this.startObj = startObj;
        this.endObj = endObj;
        
        this.update();

    }
    
    update(){
        
        let ox = this.startObj.getAttribute("cx");
        let oy = this.startObj.getAttribute("cy");
        
        let dx = this.endObj.getAttribute("cx");
        let dy = this.endObj.getAttribute("cy");

        this.updatePoints(ox, oy, dx, dy);

    }

    updatePoints(ox,oy,dx,dy){

        let a = this.orbit.a;
        let b = this.orbit.b;
        let ang = this.orbit.ang;

        let ang1 = Math.atan2(-oy, ox);
        let ang2 = Math.atan2(-dy, dx);

        let cross = ox * dy - dx * oy;
        let f = cross > 0 ? 1 : 0;

        let cross2 = Math.asin(Math.cos(ang1) * Math.sin(ang2) - Math.sin(ang1) * Math.cos(ang2))
        
        /// f1 is large arc flag
        let f1 = cross2 < 0 ? 1 : 0;
        /// f2 is direction, 1 is ccw; 0 cw
        let f2 = 0;

        var data = `M ${ox} ${oy} A ${a} ${b} ${ang} ${f1} ${f2} ${dx} ${dy}`

        this.element.setAttributeNS(null, "d", data);
       
    }
}

class SVGtransfer{
    
    txOrbit;

    tod = 0;
    toa = 0;
    tof = 0;

    svgEllipse = {};

    svgCl = document.getElementById("line1");
    svgMarker = document.getElementById("txMarker");

    svgDestinationArc;
    svgTxArc;

    constructor(theTxOrbit){

        //console.log("txOrbit in svg constructor");
        //console.log(txOrbit);

        this.txOrbit = theTxOrbit;

        this.originName = this.txOrbit.originPlanet.name;
        this.destinationName = this.txOrbit.destinationPlanet.name;

        this.svgEllipse = new SVGellipiticalOrbit("txOrbit", this.txOrbit, 0)

        this.svgOrigin = svgPlanets[this.originName];
        this.svgDestination = svgPlanets[this.destinationName];
        this.svgDestinationFuture = document.getElementById("planet_destination_future");

        this.svgOriginOrbit = svgOrbits[this.originName];
        this.svgDestinationOrbit = svgOrbits[this.destinationName];
        
        this.svgDestinationArc = new svgPartialArc("destTOF", this.svgDestinationOrbit, this.svgDestination.element, this.svgDestinationFuture);

        this.svgTxArc = new svgPartialArc("txTOF", this.svgEllipse, this.svgOrigin.element, this.svgMarker)

        this.svgOrigin.element.setAttribute("r", 16);
        this.svgDestination.element.setAttribute("r", 16);

        this.update(displayedTime);
        //this.svgDestinationArc.update();
        //this.svgTxArc.update();

        let that = this;
        window.addEventListener("displayedTimeChange", (e) => { that.eventHandler(e) });
    }

    eventHandler(event) {

        switch (event.type) {
            case "displayedTimeChange":
                //console.log("time change caught : svg transfer " + displayedTime);
                this.update(displayedTime);
                break;

            case "change":
                if(event.target.name == "origin") {
                    this.originChange();
                }else
                { this.destinationChange();}
                
            default:

            break;
        }

    }

    originChange(){

        this.svgOrigin.toggleHighlight();
        this.svgOriginOrbit.toggleHighlight();

        this.svgOrigin = svgPlanets[originName];
        this.svgOriginOrbit = svgOrbits[originName];

        this.svgOrigin.toggleHighlight();
        this.svgOriginOrbit. toggleHighlight();
        
    }

    destinationChange(){

        this.svgDestination.toggleHighlight();
        this.svgDestinationOrbit.toggleHighlight();

        this.svgDestination = svgPlanets[destinationName];
        this.svgDestinationOrbit = svgOrbits[destinationName];

        this.svgDestinationArc.startObj = this.svgDestination.element;
        this.svgDestinationArc.orbit = this.svgDestinationOrbit;
        this.svgDestinationArc.update();

        this.svgDestination.toggleHighlight();
        this.svgDestinationOrbit.toggleHighlight();


    }

    update(t){

        this.svgEllipse.update(t);

        let ox = this.svgEllipse.ox;
        let oy = this.svgEllipse.oy;
        let dx = this.svgEllipse.dx;
        let dy = this.svgEllipse.dy;

        // txOrbit decorations
        // centerline
        this.svgCl.setAttribute("x1", ox);
        this.svgCl.setAttribute("y1", oy);
        this.svgCl.setAttribute("x2", dx);
        this.svgCl.setAttribute("y2", dy);

        // marker
        let transform = `translate(${dx},${dy})`
        this.svgMarker.setAttribute("transform", transform);

        // tx tof arc
        this.svgTxArc.updatePoints(ox, oy, dx, dy);

        // destination planet- future
        var toa = t + this.txOrbit.tof;

        var Ln_f = this.txOrbit.destinationPlanet.LnAtTimeT(toa);
        var r_f =  this.txOrbit.destinationPlanet.rAtLn(Ln_f) * scaleFactor;

        var fx = r_f * Math.cos(Ln_f);
        var fy = -r_f * Math.sin(Ln_f);

        this.svgDestinationFuture.setAttribute("cx", fx);
        this.svgDestinationFuture.setAttribute("cy", fy);

        this.svgDestinationArc.update(t);

        var Ln_t = this.txOrbit.destinationPlanet.LnAtTimeT(displayedTime);
        var cr =   this.txOrbit.destinationPlanet.rAtLn(Ln_t) * scaleFactor;
        var cx = cr * Math.cos(Ln_t);
        var cy = -cr * Math.sin(Ln_t);

    
    }

}

class SVGhyperbolicOrbit extends HyperbolicOrbit{

    constructor(bodyName, t, peAlt, v3, outbound){

        super(bodyName, t, peAlt, v3);

        this.outbound = outbound;
        
        this.update(peAlt);
    }

    update(peAlt){

        super.update(peAlt);

        this.rpScaled = this.rp * scaleFactor;

        //this.pe = super.rp * scaleFactor;
        let a = this.a * scaleFactor;
        let c = this.c * scaleFactor;
        let b = this.b * scaleFactor;
        
        let soi = this.soi * scaleFactor
        let thetaSOI = this.thetaSoi;
       
        let endx = soi * Math.sin(thetaSOI);
        let endy = soi * Math.cos(thetaSOI);
        
        let theta = super.getRotation(this.outbound);

        let vpx = this.vpy;
        let vpy = this.vpx;
        let v3 = super.v3;
        let fa = this.fa;

        this.drawVelocitiesVertical(soi, vpx, vpy, v3, fa);
        this.drawHyperbola(a, b, c, endx, endy, theta);
    }

    drawVelocitiesVertical(soi, vpy, vpx, v3, fa) {

        // draw velocities of planet and transfer orbit
        // to show justification of ejection angle
        // drawn with transfer velocity vertical
        // planet velocity includes flight angle

        // scale so planet velocity is 1.5 times soi
        
        let vscale = soi / vpy * 1.5;
        
        let vpx2 = vpx * vscale;
        let vpy2 = -vpy * vscale;
        
        let vpx1 = soi * Math.sin(fa);
        let vpy1 = -soi;

        let vsx2 = 0;
        let vsy2 = -v3 * vscale;
        
        let vsx1 = 0;
        let vsy1 = -soi;

        document.getElementById("planetV").setAttribute("x1", vpx1);
        document.getElementById("planetV").setAttribute("y1", vpy1);
        document.getElementById("planetV").setAttribute("x2", vpx2);
        document.getElementById("planetV").setAttribute("y2", vpy2);

        document.getElementById("shipV").setAttribute("x1", vsx1);
        document.getElementById("shipV").setAttribute("y1", vsy1);
        document.getElementById("shipV").setAttribute("x2", vsx2);
        document.getElementById("shipV").setAttribute("y2", vsy2);

        document.getElementById("shipRelV").setAttribute("x1", vpx2);
        document.getElementById("shipRelV").setAttribute("y1", vpy2-.25);
        document.getElementById("shipRelV").setAttribute("x2", vsx2);
        document.getElementById("shipRelV").setAttribute("y2", vsy2-.25);

    }

    drawHyperbola(a, b, c, endx, endy, theta){
        
        // requires a, b, c of hyperbola
        // requires endx, endy - soi and thetaSOI
        // rotation - LnPe

        // pe at y=0 (horizontal axis), open to the left
        // points lettered ccw, starting at bottom, soi

        // re-done to draw vertical
        // swapped ax and ay; bx and by
        // top half now right half

        // left half is A E H J (inbound, capture)
        // right half is J I G D (outbount, eject)

        // full curve is A B C D

        let ay = 2 * a + c;
        let ax = -b * Math.sqrt(3);

        let by = 2 / 3 * a + c ;
        let bx = -b * (48 - 26 * Math.sqrt(3)) / 18;

        let cx = -bx;
        let cy = by;

        let dx = -ax;
        let dy = ay;

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

        let path = "";

        let m = this.mirrored ? -1: 1;
        let k = 1;

        if(this.outbound){ 
            path = `M ${m * jx},${jy} C ${m * ix},${iy} ${m * gx},${gy} ${m * dx},${dy} L ${m * endx},${endy}`;
        }else{
            k = -1
            path = `M ${-endx},${m * endy} L ${ax},${m * ay} C ${ex},${m * ey} ${hx},${m * hy} ${jx},${m * jy}`;            
        }
    
        // full hyperbola
        //path = `M ${-this.endx}, ${this.endy} L ${ax},${ay} C ${bx},${by} ${cx},${cy} ${dx},${dy} L${this.endx}, ${this.endy}`;


        let hyp = document.getElementById("hyperbola");
        hyp.setAttributeNS(null, "d", path);

        document.getElementById("axis").setAttribute("y1", 0);
        document.getElementById("axis").setAttribute("x1", 0);

        document.getElementById("axis").setAttribute("y2", m * c);
        document.getElementById("axis").setAttribute("x2", 0);

        document.getElementById("asymptote").setAttribute("y1", m * c);
        document.getElementById("asymptote").setAttribute("x1", 0);
        
        document.getElementById("asymptote").setAttribute("x2", k * m * endx);
        document.getElementById("asymptote").setAttribute("y2", endy);
        
        document.getElementById("peMarker").setAttribute("cx", jx);
        document.getElementById("peMarker").setAttribute("cy", jy);

        let hypGroup = document.getElementById("hyperbolaGroup");
        hypGroup.setAttributeNS(null, "transform", `rotate(${-radToDeg(theta)})`)
        
    }
}


function setNodeText(){

    let svg = document.getElementById("planetSystem");
    let planet = document.getElementById("planetSystemPlanet");
    let pe = svg.getElementById("peMarker");
    let node = document.getElementById("gnode");

    let pt0 = svg.createSVGPoint();
    let pt = svg.createSVGPoint();

    let x = pe.cx.baseVal.value;
    let y = pe.cy.baseVal.value;

    pt.x = x;
    pt.y = y;

    let ctm0 = planet.getCTM();
    let ctm = pe.getCTM();
    
    pt0 = pt0.matrixTransform(ctm0);
    pt = pt.matrixTransform(ctm);

    pt.x = (pt.x - pt0.x) / ctm0.a;
    pt.y = (pt.y - pt0.y) / ctm0.a;

    //console.log(x,y);
    //console.log(pt0);
    //console.log(pt);

    node.setAttribute("transform", `translate(${pt.x + .1}, ${pt.y + .1}), scale(1)`);    
}

function initializeCaptureSVG(captureOrbit, mirrored) {

    console.log("initialize capture SVG");
    
    setPlanetSystemSVG(txOrbit.destinationPlanet);

    // adjust planet features
    let eqR = captureOrbit.eqR * scaleFactor;
    let soi = captureOrbit.soi * scaleFactor;
    let park = captureOrbit.rp * scaleFactor;

    let ln = txOrbit.Ln_da;
    
    let fa = captureOrbit.fa;

    let x = soi * Math.sin(fa);
    let y = -soi * Math.cos(fa);

    document.getElementById("planetSystemPlanet").setAttribute("r", eqR);
    document.getElementById("planetSystemSOI").setAttribute("r", soi);
    document.getElementById("planetSystemPark").setAttribute("r", park);

    document.getElementById("sunDir").setAttribute("x2", -soi);
    document.getElementById("sunDir").setAttribute("y2", 0);

    document.getElementById("shipOrbit").setAttribute("x1", 0);
    document.getElementById("shipOrbit").setAttribute("y1", soi);
    document.getElementById("shipOrbit").setAttribute("x2", 0);
    document.getElementById("shipOrbit").setAttribute("y2", -soi);

    document.getElementById("planetOrbit").setAttribute("x1", x);
    document.getElementById("planetOrbit").setAttribute("y1", y);
    document.getElementById("planetOrbit").setAttribute("x2", -x);
    document.getElementById("planetOrbit").setAttribute("y2", -y);

    svgCaptureOrbit = new SVGhyperbolicOrbit(captureOrbit, false, mirrored);

    if (!showAligned) {
        document.getElementById("alignment").setAttribute("transform", "rotate(180)");
    } else {
        document.getElementById("alignment").setAttribute("transform", `rotate(${-radToDeg(ln)})`);
    }
}

function updateHypSVG(peAlt){

    hypOrbit.update(peAlt);

    let svgPe = hypOrbit.rpScaled;
    let ln = hypOrbit.lnp;
    let fa = hypOrbit.fa;

    document.getElementById("planetSystemPark").setAttribute("r", svgPe);


    if (showAligned) {
        document.getElementById("alignment").setAttribute("transform", `rotate(${-radToDeg(ln)})`);
    } else {
    }
    document.getElementById("alignment").setAttribute("transform", `rotate(${-radToDeg(fa)})`);

    setNodeText();

}

function initializeEjectionSVG(bodyName, t, peAlt, v3, outbound){
    
    console.log("initialize ejection SVG");
    
    hypOrbit = new SVGhyperbolicOrbit(bodyName, t, peAlt, v3, outbound);

    setPlanetSystemSVG(hypOrbit.eqR, hypOrbit.soi);

    // adjust planet features
    let r = hypOrbit.eqR * scaleFactor;
    let soi = hypOrbit.soi * scaleFactor;
    let park = hypOrbit.rp * scaleFactor;
    let ln = hypOrbit.lnp;
    let fa = hypOrbit.fa;
    let x = soi * Math.sin(fa);
    let y = -soi * Math.cos(fa);
    
    // circles
    document.getElementById("planetSystemPlanet").setAttribute("r", r);
    document.getElementById("planetSystemSOI").setAttribute("r", soi);
    document.getElementById("planetSystemPark").setAttribute("r", park);

    // lines
    document.getElementById("sunDir").setAttribute("x2", -soi);
    document.getElementById("sunDir").setAttribute("y2", 0); 

    document.getElementById("shipOrbit").setAttribute("x1", 0);
    document.getElementById("shipOrbit").setAttribute("y1", soi);
    document.getElementById("shipOrbit").setAttribute("x2", 0);
    document.getElementById("shipOrbit").setAttribute("y2", -soi);

    document.getElementById("planetOrbit").setAttribute("x1", x);
    document.getElementById("planetOrbit").setAttribute("y1", y);
    document.getElementById("planetOrbit").setAttribute("x2", -x);
    document.getElementById("planetOrbit").setAttribute("y2", -y);

    setNodeText();

    updateHypSVG(park);

    // set initial zoom (park orbit is half of screen)
    let w = park * 4;
    zoomWindow(-w/2, -w/2, w, w);

    
}


function initializeTransferSVG(theTxOrbit) {

    console.log("initialize transfer SVG");

    // dim other planets
    for (let planet in svgPlanets) {
        svgPlanets[planet].element.classList.add("dimPlanet");
    };

    svgPlanets[originName].toggleHighlight();
    svgOrbits[originName].toggleHighlight();

    svgPlanets[destinationName].toggleHighlight();
    svgOrbits[destinationName].toggleHighlight();

    //    INITIALIZE SVG
    svgTxOrbit = new SVGtransfer(theTxOrbit);

}


function initializeSolarSystemSVG() {

    console.log("initialize solar system SVG");

    for(let planetName in planets){

        let curPlanet = planets[planetName];

        let svgPlanet = new SVGplanet(curPlanet);
        svgPlanets[planetName] = svgPlanet;

        let orbitName = planetName+"Orbit";
        let svgOrbit = new SVGellipiticalOrbit(orbitName, curPlanet, 0);
        
        svgOrbits[planetName] = svgOrbit;

    }

}

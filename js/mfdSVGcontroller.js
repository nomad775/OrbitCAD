const svgOrbits = [];
const svgPlanets = [];

var svgTxOrbit = {};
var svgEjectOrbit = {};
var svgCaptureOrbit = {};

const displayedTimeChangeEvent = new Event('displayedTimeChange');

var scaleFactor  = 1/1e8;
var unitFactor = 1/1e9;

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
    
    theTxOrbit;

    tod = 0;
    toa = 0;
    tof = 0;

    svgEllipse = {};

    svgCl = document.getElementById("line1");
    svgMarker = document.getElementById("txMarker");

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
        var toa = t + txOrbit.tof;

        var Ln_f = txOrbit.destinationPlanet.LnAtTimeT(toa);
        var r_f =  txOrbit.destinationPlanet.rAtLn(Ln_f) * scaleFactor;

        var fx = r_f * Math.cos(Ln_f);
        var fy = -r_f * Math.sin(Ln_f);

        this.svgDestinationFuture.setAttribute("cx", fx);
        this.svgDestinationFuture.setAttribute("cy", fy);

        this.svgDestinationArc.update(t);

        var Ln_t = txOrbit.destinationPlanet.LnAtTimeT(displayedTime);
        var cr =   txOrbit.destinationPlanet.rAtLn(Ln_t) * scaleFactor;
        var cx = cr * Math.cos(Ln_t);
        var cy = -cr * Math.sin(Ln_t);

        //this.svgDestinationArc.updatePoints(cx,cy,fx,fy)
    }

}

class SVGhyperbolicOrbit{

    constructor(theHyperbolicOrbit, outbound, mirrored){

        this.orbit = theHyperbolicOrbit;
        this.outbound = outbound;
        this.mirrored = mirrored;

        this.update();

        this.drawHyperbola();
        this.drawVelocitiesVertical();
    }

    update(){

        this.a = this.orbit.a * scaleFactor;
        this.c = (-this.orbit.a + this.orbit.rp) * scaleFactor;
        this.b = Math.sqrt(this.c ** 2 - this.a ** 2);

        let soi = this.orbit.soi * scaleFactor
        let thetaSOI = this.orbit.thetaSoi;
        
        this.endx = soi * Math.cos(thetaSOI);
        this.endy = -soi * Math.sin(thetaSOI);

        this.LnPe = this.orbit.lnPe(this.outbound, this.mirrored);
    }

    drawVelocities(){
        
        let vscale = this.orbit.soi * scaleFactor/2 /this.orbit.vp;
        
        let vpx = this.orbit.vpx * vscale;
        let vpy = -this.orbit.vpy * vscale;

        document.getElementById("planetV").setAttribute("x1", 0);
        document.getElementById("planetV").setAttribute("y1", 0);
        document.getElementById("planetV").setAttribute("x2", vpx);
        document.getElementById("planetV").setAttribute("y2", vpy);

        let vsx = this.orbit.v3x * vscale;
        let vsy = -this.orbit.v3y * vscale;

        document.getElementById("shipV").setAttribute("x1", 0);
        document.getElementById("shipV").setAttribute("y1", 0);
        document.getElementById("shipV").setAttribute("x2", vsx);
        document.getElementById("shipV").setAttribute("y2", vsy);

        document.getElementById("shipRelV").setAttribute("x1", vpx);
        document.getElementById("shipRelV").setAttribute("y1", vpy);
        document.getElementById("shipRelV").setAttribute("x2", vsx);
        document.getElementById("shipRelV").setAttribute("y2", vsy);

        document.getElementById("shipRelV2").setAttribute("x", -vpx);
        document.getElementById("shipRelV2").setAttribute("y", -vpy);
        //document.getElementById("shipRelV2").setAttribute("transform", `translate(${this.endx}, ${this.endy})`);
        let ctm = document.getElementById("hyperbolaGroup").getCTM();
        console.log(ctm);
        document.getElementById("shipRelV").setCTM=ctm;

    }

    drawVelocitiesVertical() {

        let soi = this.orbit.soi * scaleFactor;
        let offset = 0; // this.orbit.b * scaleFactor;

        let vscale = .001;

        let vpx = -this.orbit.vp * Math.cos(this.orbit.fa) * vscale;
        let vpy = -this.orbit.vp * Math.sin(this.orbit.fa) * vscale;

        document.getElementById("planetV").setAttribute("x1", offset);
        document.getElementById("planetV").setAttribute("y1", soi);
        document.getElementById("planetV").setAttribute("x2", vpx);
        document.getElementById("planetV").setAttribute("y2", vpy);

        let vsx = offset;
        let vsy = this.orbit.v3 * vscale;

        document.getElementById("shipV").setAttribute("x1", offset);
        document.getElementById("shipV").setAttribute("y1", soi);
        document.getElementById("shipV").setAttribute("x2", vsx);
        document.getElementById("shipV").setAttribute("y2", vsy);

        document.getElementById("shipRelV").setAttribute("x1", vsx);
        document.getElementById("shipRelV").setAttribute("y1", vsy);
        document.getElementById("shipRelV").setAttribute("x2", vpx);
        document.getElementById("shipRelV").setAttribute("y2", vpy);

        let x = radToDeg(Math.atan2(vsy-vpy,vsx-vsy));
        document.getElementById("velocities").setAttribute("transform", `rotate(${radToDeg(-this.orbit.lnp)})`);

        let x1 = soi * Math.cos(this.orbit.thetaSoi - this.orbit.lnPe);
        let y1 = soi * Math.sin(this.orbit.thetaSoi - this.orbit.lnPe);

        let x2 = x1 + 10 * Math.sin(this.orbit.delta);
        let y2 = y1 + 10 * Math.cos(this.orbit.delta);

        //document.getElementById("shipRelV").setAttribute("x1", x1);
        //document.getElementById("shipRelV").setAttribute("y1", y1);
        //document.getElementById("shipRelV").setAttribute("x2", x2);
        //document.getElementById("shipRelV").setAttribute("y2", y2);

    }

    drawHyperbola(){
        
        // requires a, b, c of hyperbola
        // requires endx, endy - soi and thetaSOI
        // rotation - LnPe

        // pe at y=0 (horizontal axis), open to the left
        // points lettered ccw, starting at bottom, soi

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

        let path = "";
        let m = this.mirrored ? -1: 1;

        if(this.outbound){ 
            path = `M ${m * jx},${jy} C ${m* ix},${iy} ${m * gx},${gy} ${m * dx},${dy} L ${m * this.endx},${this.endy}`;
        }else{
            this.endy *= -1
            path = `M ${m * this.endx},${this.endy} L ${m * ax},${ay} C ${m* ex},${ey} ${m * hx},${hy} ${m * jx},${jy}`;            
        }
    
        // full hyperbola
        //path = `M ${this.endx}, ${-this.endy} L ${ax},${ay} C ${bx},${by} ${cx},${cy} ${dx},${dy} L${this.endx}, ${this.endy}`;


        let hyp = document.getElementById("hyperbola");
        hyp.setAttributeNS(null, "d", path);

        document.getElementById("axis").setAttribute("x2", m * this.c);

        document.getElementById("asymptote").setAttribute("x1", m * this.c);
        
        document.getElementById("asymptote").setAttribute("x2", m * this.endx);
        document.getElementById("asymptote").setAttribute("y2", this.endy);
        
        let hypGroup = document.getElementById("hyperbolaGroup");
        hypGroup.setAttributeNS(null, "transform", `rotate(${-radToDeg(this.LnPe)})`)

    }
}


function initializeTransferSVG(){

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
    svgTxOrbit = new SVGtransfer();

}

function initializeEjectionSVG(ejectionOrbit, mirrored){
    
    console.log("initialize ejection SVG");
    
    // adjust planet features
    let r = ejectionOrbit.eqR * scaleFactor;
    let soi = ejectionOrbit.soi * scaleFactor;
    
    let park = ejectionOrbit.rp * scaleFactor;
    let Ln = txOrbit.Ln_o;
    
    let sx = 2 * soi * Math.cos(Ln + Math.PI);
    let sy = -2 * soi * Math.sin(Ln + Math.PI);

    setPlanetSystemSVG(txOrbit.originPlanet);
    
    document.getElementById("planetSystemPlanet").setAttribute("r", r);
    document.getElementById("planetSystemSOI").setAttribute("r", soi);
    document.getElementById("planetSystemPark").setAttribute("r", park);

    document.getElementById("sunDir").setAttribute("x2", sx);
    document.getElementById("sunDir").setAttribute("y2", sy); 

    document.getElementById("prograde").setAttribute("x1", sy);
    document.getElementById("prograde").setAttribute("y1", -sx);
    document.getElementById("prograde").setAttribute("x2", -sy);
    document.getElementById("prograde").setAttribute("y2", sx);

    svgEjectOrbit = new SVGhyperbolicOrbit(ejectionOrbit, true, mirrored);
    
    let z = 3 * park ;
    zoomWindow(-z/2, -z/2, z, z)

}

function initializeCaptureSVG(captureOrbit, mirrored){

    console.log("initialize capture SVG");

    setPlanetSystemSVG(txOrbit.destinationPlanet);

    // adjust planet features
    let eqR = captureOrbit.eqR * scaleFactor;
    let soi = captureOrbit.soi * scaleFactor;

    let park = captureOrbit.rp * scaleFactor;
    let Ln = txOrbit.Ln_da;
    
    let sunDirX =  Math.cos(Ln + Math.PI) * 3 * soi;
    let sunDirY = -Math.sin(Ln + Math.PI) * 3 * soi;

    let planetOrbitRadius = txOrbit.destinationPlanet.rAtLn(Ln);
    let phi = txOrbit.destinationPlanet.flightAngleAtTheta(Ln - txOrbit.destinationPlanet.LnPe);
    
    let vp = txOrbit.vd;
    let vs = txOrbit.v_arrive;

    let vpX = vp * Math.cos(phi);
    let vpY = vp * Math.sin(phi);

    let vrelX = vs - vpX;
    let vrelY = vpY;

    let vrel = Math.hypot(vrelX, vrelY);
    let vang = Math.atan2(vrelY,vrelX);

    // prograde directions
    let txPrograde = Ln + Math.PI/2;
    let planetPrograde = txPrograde + phi;

    let planetProgradeX = Math.cos(planetPrograde);
    let planetProgradeY = -Math.sin(planetPrograde);

    let xi = planetProgradeX * soi;
    let yi = planetProgradeY * soi;

    let shipProgradeX = Math.cos(txPrograde);
    let shipProgradeY = -Math.sin(txPrograde);

    let shipVelX = - soi * Math.cos(vang);
    let shipVelY = soi * Math.sin(vang);

    document.getElementById("planetSystemPlanet").setAttribute("r", eqR);
    document.getElementById("planetSystemSOI").setAttribute("r", soi);
    document.getElementById("planetSystemPark").setAttribute("r", park);

    document.getElementById("sunDir").setAttribute("x2", sunDirX);
    document.getElementById("sunDir").setAttribute("y2", sunDirY);

    document.getElementById("planetOrbit").setAttribute("x1", -planetProgradeX * 3 * soi);
    document.getElementById("planetOrbit").setAttribute("y1", -planetProgradeY * 3 * soi);
    document.getElementById("planetOrbit").setAttribute("x2", planetProgradeX * 3 * soi);
    document.getElementById("planetOrbit").setAttribute("y2", planetProgradeY * 3 * soi);

    // document.getElementById("shipV").setAttribute("x1", xi);
    // document.getElementById("shipV").setAttribute("y1", yi);
    // document.getElementById("shipV").setAttribute("x2", shipProgradeX * 3 + xi);
    // document.getElementById("shipV").setAttribute("y2", shipProgradeY * 3 + yi);

    //document.getElementById("shipVel").setAttribute("x1", shipProgradeX);
    //document.getElementById("shipVel").setAttribute("y1", shipProgradeY);
    //document.getElementById("shipVel").setAttribute("x2", planetProgradeX);
    //document.getElementById("shipVel").setAttribute("y2", planetProgradeY);

    svgCaptureOrbit = new SVGhyperbolicOrbit(captureOrbit, false, mirrored);
    
    let z = 6 * r;
    zoomWindow(-z / 2, -z / 2, z, z)

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

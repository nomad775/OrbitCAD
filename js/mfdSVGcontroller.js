var solarSystemSVG;

const svgOrbits = [];
const svgPlanets = [];

var transferOrbit = {};
var hypOrbit = {};

var scaleFactor  = 1/1e8;
var unitFactor = 1/1e9;

var r = 10;


class SVGplanet extends Planet{
    
    cx = 0;
    cy = 0;
    ln = 0;

    constructor(planet, name) {

        name = name ? name: planet.name;

        super(name, planet.sma, planet.ecc, planet.inc, planet.LAN, planet.argPe, planet.mean0, mu_sun, planet.eqR, planet.soi, planet.mu);

        this.planet = planet;

        this.element = solarSystemSVG.getElementById(name);

        this.soi = planet.soi * scaleFactor;
        this.cx = planet.cx * scaleFactor;
        this.cy = planet.cy * scaleFactor;
        this.ln = planet.LnAtTimeT(0);

        let thisObj = this;
        window.addEventListener("displayedTimeChange", (e) => { thisObj.eventHandler(e) });
        this.element.addEventListener("click", (e) => {thisObj.eventHandler(e)});
        this.update(displayedTime);
    }

    toggleHighlight(){
        this.element.classList.add("highlight");
    }

    update(t) {

        this.ln = this.planet.LnAtTimeT(t);
        let r = this.rAtLn(this.ln) * scaleFactor;

        this.cx = r * Math.cos(this.ln);
        this.cy = -r * Math.sin(this.ln);

        this.element.setAttribute("cx", this.cx);
        this.element.setAttribute("cy", this.cy);

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
                planetClickAsInput(event, this.planet.name)

            default:

                break;
        }

    }

}

class SVGellipiticalOrbit{

    constructor(elementId, object1, t){
        
        this.element = solarSystemSVG.getElementById(elementId);
       
        this.definingObject = object1;
        this.update(t);

    }
    
    toggleHighlight(){
        this.element.classList.add("highlight");
    }

    update(t){
        
        if( this.definingObject instanceof Planet){
            
            var thePlanet = this.definingObject;
            
            var Ln0 = thePlanet.Ln0;
            var Ln1 = Ln0 + pi;
            
            var r0 = thePlanet.rAtLn(Ln0) * scaleFactor;
            var r1 = thePlanet.rAtLn(Ln1) * scaleFactor;
            
            var Ln = Ln1;
            
        }else if( this.definingObject instanceof SVGTransfer)
        {
            
            //this.definingObject.update(t);
            
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
    }
}

class svgPartialArc{

    constructor(id, orbit, startObj, endObj){
        
        this.element = solarSystemSVG.getElementById(id);
       
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

class SVGTransfer extends TransferOrbit{

    svgEllipse = {};

    svgCl = solarSystemSVG.getElementById("line1");
    svgMarker = solarSystemSVG.getElementById("txMarker");

    svgDestinationArc;
    svgTxArc;

    constructor(originName, destinationName){

        let originPlanet = planets[originName];
        let destinationPlanet = planets[destinationName];

        super(originPlanet, destinationPlanet)

        this.originName = originName;
        this.destinationName = destinationName;

        //this.svgEllipse = new SVGellipiticalOrbit("txOrbit", this.txOrbit, 0)
        this.svgEllipse = new SVGellipiticalOrbit("txOrbit", this, 0)
        
        this.svgOrigin = svgPlanets[this.originName];
        this.svgDestination = svgPlanets[this.destinationName];
        this.svgDestinationFuture = solarSystemSVG.getElementById("planet_destination_future");

        this.svgOriginOrbit = svgOrbits[this.originName];
        this.svgDestinationOrbit = svgOrbits[this.destinationName];
        
        this.svgDestinationArc = new svgPartialArc("destTOF", this.svgDestinationOrbit, this.svgDestination.element, this.svgDestinationFuture);
        this.svgTxArc = new svgPartialArc("txTOF", this.svgEllipse, this.svgOrigin.element, this.svgMarker)

        this.svgOrigin.element.setAttribute("r", 16);
        this.svgDestination.element.setAttribute("r", 16);

        this.svgOrigin.toggleHighlight();
        this.svgOriginOrbit.toggleHighlight();

        this.svgDestination.toggleHighlight();
        this.svgDestinationOrbit.toggleHighlight();
       
        let that = this;
        window.addEventListener("displayedTimeChange", (e) => { that.eventHandler(e) });

        document.forms["options"]["alignToLn0"].addEventListener("change", (e)=>that.eventHandler(e))
    }

    eventHandler(event) {

        switch (event.type) {
            case "displayedTimeChange":
                console.log("time change caught : svg transfer " + displayedTime);
                this.update(displayedTime);
                break;

            case "change":

                switch (event.target.name){
                    case "origin":
                        this.originChange(event.target.value);
                        break;
                    case "destination":
                        this.destinationChange(event.target.value);
                        break;
                    case "alignToLn0":
                        this.alignToLn0 = event.target.checked;
                        this.setAlignment();
                }
                
            default:

            break;
        }

    }

    originChange(name){

        this.originName = name;
        this.originPlanet = planets[name];

        this.svgOrigin.toggleHighlight();
        this.svgOriginOrbit.toggleHighlight();

        this.svgOrigin = svgPlanets[name];
        this.svgOriginOrbit = svgOrbits[name];

        this.svgOrigin.toggleHighlight();
        this.svgOriginOrbit. toggleHighlight();
        
        displayedTime = this.solveTForRdv(currentTime);
        window.dispatchEvent(displayedTimeChangeEvent);

        zoomTxOrbit();
    }

    destinationChange(name){

        this.destinationName = name;
        this.destinationPlanet = planets[name];

        displayedTime = this.solveTForRdv(currentTime);
        window.dispatchEvent(displayedTimeChangeEvent);

        this.svgDestination.toggleHighlight();
        this.svgDestinationOrbit.toggleHighlight();

        this.svgDestination = svgPlanets[name];
        this.svgDestinationOrbit = svgOrbits[name];

        this.svgDestinationArc.startObj = this.svgDestination.element;
        this.svgDestinationArc.orbit = this.svgDestinationOrbit;
        this.svgDestinationArc.update();

        this.svgDestination.toggleHighlight();
        this.svgDestinationOrbit.toggleHighlight();

        zoomTxOrbit();
    }

    update(t){

        console.log("transfer update");

        super.update(t);
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
        //this.svgMarker.setAttribute("transform", transform);

        // tx tof arc
        this.svgTxArc.updatePoints(ox, oy, dx, dy);

        // destination planet- future
        var toa = t + this.tof; //super

        var Ln_f = this.destinationPlanet.LnAtTimeT(toa); //super
        var r_f =  this.destinationPlanet.rAtLn(Ln_f) * scaleFactor; //super

        var fx = r_f * Math.cos(Ln_f);
        var fy = -r_f * Math.sin(Ln_f);

        this.svgDestinationFuture.setAttribute("cx", fx);
        this.svgDestinationFuture.setAttribute("cy", fy);

        this.svgDestinationArc.update(t);

        // var Ln_t = this.destinationPlanet.LnAtTimeT(displayedTime); //super
        // var cr =   this.destinationPlanet.rAtLn(Ln_t) * scaleFactor; //super
        // var cx = cr * Math.cos(Ln_t);
        // var cy = -cr * Math.sin(Ln_t);

        this.setAlignment();

        //zoomTxOrbit();
    }

    setAlignment(){

        //if (document.forms["options"]["alignToLn0"].checked) {
        //    solarSystemSVG.getElementById("gSolarSystemAlign").setAttribute("transform", "");
        //} else {
        //    let ln = radToDeg(this.Ln_o) //super
        //    console.log(ln);
        //    solarSystemSVG.setAttribute("transform", `rotate(${ln})`);
        //}
        setAlignment();
        zoomTxOrbit();
    }
}

function dimPlanets() {

    for (let planet in svgPlanets) {
        svgPlanets[planet].element.classList.remove("highlight");
        svgPlanets[planet].element.classList.add("dimPlanet");
    };

}

function unDimPlanets() {

    console.log("undim");

    for (let planet in svgPlanets) {

        svgPlanets[planet].element.classList.remove("dimPlanet");
    };

    for (let orbit in svgOrbits) {

        svgOrbits[orbit].element.classList.remove("highlight");
    };
}

function setAlignment() {

    let alignToLn0 = document.forms["options"]["alignToLn0"].checked;
    let originName = document.forms["initializeTransfer"]["origin"].value;

    if (!originName) return;

    let origin = planets[originName];

    let ln = origin.LnAtTimeT(displayedTime);
    theta = alignToLn0 ? 0 : -ln;

    solarSystemSVG.getElementById("gSolarSystemAlign").setAttribute("transform", `rotate(${-radToDeg(theta)})`);
    document.getElementById("alignmentMarker").setAttribute("transform", `rotate(${-radToDeg(theta)})`)

}
 
function initializeSolarSystemSVGelements() {

    console.log("...initialize solar system SVG elements");

    solarSystemSVG = document.getElementById("svgObject").contentDocument.getElementById("solarSystem");

    for(let planetName in planets){

        let curPlanet = planets[planetName];

        let svgPlanet = new SVGplanet(curPlanet);
        svgPlanets[planetName] = svgPlanet;

        let orbitName = planetName+"Orbit";
        let svgOrbit = new SVGellipiticalOrbit(orbitName, curPlanet, 0);
        
        svgOrbits[planetName] = svgOrbit;

    }
}




// hyperbolic orbit functions

class SVGhyperbolicOrbit extends HyperbolicOrbit {

    constructor(bodyName, t, peAlt, v3, outbound) {

        super(bodyName, t, peAlt, v3);

        this.outbound = outbound;

        this.svg = document.getElementById("svgObject").contentDocument.getElementById("planetSystem");

        this.update(peAlt);
        
    }

    update(peAlt) {

        console.log("hyp orbit update")

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
        
        let svg = document.getElementById("svgObject").contentDocument.getElementById("planetSystem");
        svg.getElementById("planetSystemPark").setAttribute("r", this.rpScaled);

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

        let vpcx2 = 2 * this.eqR * scaleFactor * Math.sin(fa);
        let vpcy2 = -2 * this.eqR * scaleFactor * Math.cos(fa);

        let vsx2 = 0;
        let vsy2 = -v3 * vscale;

        let vsx1 = 0;
        let vsy1 = -soi;

        let svg = document.getElementById("svgObject").contentDocument.getElementById("planetSystem");

        let elPlanetV = svg.getElementById("planetV");
        let elPlanetVclose = svg.getElementById("planetVclose");
        let elShipV = svg.getElementById("shipV");
        let elShipRelV = svg.getElementById("shipRelV");

        elPlanetV.setAttribute("x1", vpx1);
        elPlanetV.setAttribute("y1", vpy1);
        elPlanetV.setAttribute("x2", vpx2);
        elPlanetV.setAttribute("y2", vpy2);

        elPlanetVclose.setAttribute("x1", 0);
        elPlanetVclose.setAttribute("y1", 0);
        elPlanetVclose.setAttribute("x2", vpcx2);
        elPlanetVclose.setAttribute("y2", vpcy2);

        elShipV.setAttribute("x1", vsx1);
        elShipV.setAttribute("y1", vsy1);
        elShipV.setAttribute("x2", vsx2);
        elShipV.setAttribute("y2", vsy2);

        elShipRelV.setAttribute("x1", vpx2);
        elShipRelV.setAttribute("y1", vpy2 - .25);
        elShipRelV.setAttribute("x2", vsx2);
        elShipRelV.setAttribute("y2", vsy2 - .25);

    }

    drawHyperbola(a, b, c, endx, endy, theta) {

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

        let by = 2 / 3 * a + c;
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

        let m = this.mirrored ? -1 : 1;
        let k = 1;

        if (this.outbound) {
            path = `M ${m * jx},${jy} C ${m * ix},${iy} ${m * gx},${gy} ${m * dx},${dy} L ${m * endx},${endy}`;
        } else {
            k = -1
            path = `M ${-endx},${m * endy} L ${ax},${m * ay} C ${ex},${m * ey} ${hx},${m * hy} ${jx},${m * jy}`;
        }

        // full hyperbola
        //path = `M ${-this.endx}, ${this.endy} L ${ax},${ay} C ${bx},${by} ${cx},${cy} ${dx},${dy} L${this.endx}, ${this.endy}`;

        let svg = document.getElementById("svgObject").contentDocument.getElementById("planetSystem");

        let hyp = svg.getElementById("hyperbola");
        hyp.setAttributeNS(null, "d", path);
        
        svg.getElementById("axis").setAttribute("y1", 0);
        svg.getElementById("axis").setAttribute("x1", 0);

        svg.getElementById("axis").setAttribute("y2", m * c);
        svg.getElementById("axis").setAttribute("x2", 0);

        svg.getElementById("asymptote").setAttribute("y1", m * c);
        svg.getElementById("asymptote").setAttribute("x1", 0);

        svg.getElementById("asymptote").setAttribute("x2", k * m * endx);
        svg.getElementById("asymptote").setAttribute("y2", endy);

        svg.getElementById("peMarker").setAttribute("cx", jx);
        svg.getElementById("peMarker").setAttribute("cy", jy);

        let hypGroup = svg.getElementById("hyperbolaGroup");
        hypGroup.setAttributeNS(null, "transform", `rotate(${-radToDeg(theta)})`)

    }
}


function setNodeText() {

    let svg = document.getElementById("svgObject").contentDocument.getElementById("planetSystem");
    //let svg = document.getElementById("planetSystem");
    
    let planet = svg.getElementById("planetSystemPlanet");
    let pe = svg.getElementById("peMarker");
    let node = svg.getElementById("gnode");

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

function updateHypSVG() {
    
    let peAlt = Number(document.forms["initializeTransfer"]["originPark"].value);
    
    hypOrbit.update(peAlt);
    setNodeText();
    
    let alignToLn0 = document.forms["options"]["alignToLn0"].checked;
    let io = hypOrbit.outbound ? 0 : Math.PI;

    let ln = hypOrbit.lnp;
    let fa = hypOrbit.fa;
    let theta = alignToLn0 ? fa + io : ln;

    let svg = document.getElementById("svgObject").contentDocument.getElementById("planetSystem");

    svg.getElementById("gPlanetSystemAlign").setAttribute("transform", `rotate(${-radToDeg(theta)})`);
    document.getElementById("alignmentMarker").setAttribute("transform", `rotate(${-radToDeg(theta)})`)

}


function initializeEjectionSVG(bodyName, t, peAlt, v3, outbound) {

    console.log("initialize ejection SVG");

    hypOrbit = new SVGhyperbolicOrbit(bodyName, t, peAlt, v3, outbound);

    // adjust planet features
    let r = hypOrbit.eqR * scaleFactor;
    let soi = hypOrbit.soi * scaleFactor;
    let park = hypOrbit.rp * scaleFactor;
    let ln = hypOrbit.lnp;
    let fa = hypOrbit.fa;
    let x = soi * Math.sin(fa);
    let y = -soi * Math.cos(fa);

    let svg = document.getElementById("svgObject").contentDocument.getElementById("planetSystem");

    // circles
    svg.getElementById("planetSystemPlanet").setAttribute("r", r);
    svg.getElementById("planetSystemSOI").setAttribute("r", soi);
    svg.getElementById("planetSystemPark").setAttribute("r", park);

    // lines
    svg.getElementById("sunDir").setAttribute("x2", -soi);
    svg.getElementById("sunDir").setAttribute("y2", 0);

    svg.getElementById("shipOrbit").setAttribute("x1", 0);
    svg.getElementById("shipOrbit").setAttribute("y1", soi);
    svg.getElementById("shipOrbit").setAttribute("x2", 0);
    svg.getElementById("shipOrbit").setAttribute("y2", -soi);

    svg.getElementById("planetOrbit").setAttribute("x1", x);
    svg.getElementById("planetOrbit").setAttribute("y1", y);
    svg.getElementById("planetOrbit").setAttribute("x2", -x);
    svg.getElementById("planetOrbit").setAttribute("y2", -y);

    setNodeText();

    //updateHypSVG(park);

    // set initial zoom (park orbit is half of screen)
    let w = park * 4;
    zoomWindow(-w / 2, -w / 2, w, w);
}








var solarSystemSVG;

const svgOrbits = [];
const svgPlanets = [];

var transferOrbit = {};
var hypOrbit = {};

var scaleFactor  = 1/1e8;
var unitFactor = 1/1e9;
  

class SVGplanet extends Planet{
    
    cx = 0;
    cy = 0;
    ln = 0;

    constructor(planet, name) {

        name = name ? name: planet.name;

        super(name, planet.sma, planet.ecc, planet.inc, planet.LAN, planet.argPe, planet.mean0, mu_sun, planet.eqR, planet.soi, planet.mu, planet.color);

        this.planet = planet;

        this.element = solarSystemSVG.getElementById(name);

        this.soi = planet.soi * scaleFactor;
        this.cx = planet.cx * scaleFactor;
        this.cy = planet.cy * scaleFactor;
        this.ln = planet.LnAtTimeT(0);

        this.color = planet.color;
        this.element.setAttribute("fill", this.color);

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
    //svgAscendingNode = solarSystemSVG.getElementById("planeChangeMarker");

    svgDestinationArc;
    svgTxArc;

    constructor(originName, destinationName){

        let originPlanet = planets[originName];
        let destinationPlanet = planets[destinationName];

        super(originPlanet, destinationPlanet)

        this.originName = originName;
        this.destinationName = destinationName;

        this.svgEllipse = new SVGellipiticalOrbit("txOrbit", this, 0)
        
        this.svgOrigin = svgPlanets[this.originName];
        this.svgOrigin_t0 = new SVGplanet(originPlanet, "origin_t0");
        this.svgOrigin_t2 = new SVGplanet(originPlanet, "origin_t2");

        this.svgDestination = svgPlanets[this.destinationName];
        this.svgDestination_t0 = new SVGplanet(destinationPlanet, "destination_t0");
        this.svgDestination_t2 = new SVGplanet(destinationPlanet, "destination_t2");

        this.svgOriginOrbit = svgOrbits[this.originName];
        this.svgDestinationOrbit = svgOrbits[this.destinationName];
        
        this.svgDestinationArc = new svgPartialArc("destTOF", this.svgDestinationOrbit, this.svgDestination.element, this.svgDestination_t2.element);
        this.svgTxArc = new svgPartialArc("txTOF", this.svgEllipse, this.svgOrigin.element, this.svgMarker)

        this.svgOrigin_t0.element.classList.add("phantom");
        this.svgOrigin_t2.element.classList.add("phantom");
        this.svgDestination_t0.element.classList.add("phantom");

        this.svgOrigin.toggleHighlight();
        this.svgOriginOrbit.toggleHighlight();

        this.svgDestination.toggleHighlight();
        this.svgDestinationOrbit.toggleHighlight();
       
        let that = this;
        window.addEventListener("displayedTimeChange", (e) => { that.eventHandler(e) });
        window.addEventListener("svgZoom", (e)  => {that.eventHandler(e)});

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

            case "svgZoom":
                console.log("Zoom Changed");
                this.setOriginLabel();
                this.setDestinationLabel();
                this.setPlaneChangeLabel();

            default:

            break;
        }

    }

    z_originChange(name){

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

    z_destinationChange(name){

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

        // transfer ellipse
        this.svgEllipse.update(t);

        let ox = this.svgEllipse.ox;
        let oy = this.svgEllipse.oy;
        let dx = this.svgEllipse.dx;
        let dy = this.svgEllipse.dy;

        // centerline
        this.svgCl.setAttribute("x1", ox);
        this.svgCl.setAttribute("y1", oy);
        this.svgCl.setAttribute("x2", dx);
        this.svgCl.setAttribute("y2", dy);

        // marker
        //let transform = `translate(${dx},${dy})`
        //this.svgMarker.setAttribute("transform", transform);

        // tx tof arc
        this.svgTxArc.updatePoints(ox, oy, dx, dy);

        // phantom planets at t0 and t2
        let form = document.forms["initializeTransfer"];
        let utnow = form["utNow"].value;

        let t0 = utnow;
        let t2 = t + this.tof;

        this.svgOrigin_t0.update(t0);
        this.svgOrigin_t2.update(t2);

        this.svgDestination_t0.update(t0);       
        this.svgDestination_t2.update(t2);

        this.svgDestinationArc.update(t);

        // plane change markers
        let pcDv = super.planeChangeDv();
        this.setPlaneChangeLabel(pcDv);

        let xA = Math.cos(this.LAN) * this.r_LAN * scaleFactor;
        let yA = -Math.sin(this.LAN) * this.r_LAN * scaleFactor;

        let xD = -Math.cos(this.LAN) * this.r_LDN * scaleFactor;
        let yD = Math.sin(this.LAN) * this.r_LDN * scaleFactor;

        //this.svgAscendingNode.cx.baseVal.value = x;
        //this.svgAscendingNode.cy.baseVal.value = y;

        let an = solarSystemSVG.getElementById("planeChangeMarkerA");
        let dn = solarSystemSVG.getElementById("planeChangeMarkerD");

        an.cx.baseVal.value = xA;
        an.cy.baseVal.value = yA;

        dn.cx.baseVal.value = xD;
        dn.cy.baseVal.value = yD;

        this.setAlignment();

        // this is redunant???
        this.setOriginLabel(t);
        this.setDestinationLabel(t2, dx, dy);

    }

    setAlignment(){

        setAlignment();

        //zoomPlanetOrbit(this.svgEllipse);
        //zoomTxOrbit();

        this.setOriginLabel();
        this.setDestinationLabel();
        this.setPlaneChangeLabel();

    }

    setDestinationLabel(t){

        let destT = convertSecondsToDateObj(this.toa).toString();
        let destAlt = ((this.rd - eqr_sun)/1000).toFixed(0);
        let destV = this.vd.toFixed(2);
        let destLn = radToDeg(this.svgDestination_t2.ln, 2);

        //let r = Math.hypot(dx, dy);

        solarSystemSVG.getElementById("t3").textContent = destT;
        solarSystemSVG.getElementById("destAlt").textContent = destAlt;
        solarSystemSVG.getElementById("destV").textContent = destV;
        solarSystemSVG.getElementById("destLn").textContent = destLn;

        let pt = getLocationOfElement(solarSystemSVG, this.svgDestination_t2.element);
        let label = solarSystemSVG.getElementById("destLabel");
        let w = label.width.baseVal.value;
        let r = this.svgDestination_t2.element.r.baseVal.value;

        let vbLeft = viewBox.x;
        let labelLeft = pt.x;
        let dx = 0;

        if(labelLeft < vbLeft){
            dx = vbLeft - labelLeft;
        }

        label.x.baseVal.value = pt.x + dx;
        label.y.baseVal.value = pt.y + r;
        console.log("dest r", r);
    }

    setOriginLabel(){

        let originT = convertSecondsToDateObj(displayedTime).toString();
        let originAlt = ((this.ro - eqr_sun)/1000).toFixed(0);
        let originV = this.vo.toFixed(2);
        let originLn = radToDeg(this.svgOrigin.ln, 2);

        solarSystemSVG.getElementById("t1").textContent = originT;
        solarSystemSVG.getElementById("originAlt").textContent = originAlt;
        solarSystemSVG.getElementById("originV").textContent = originV;
        solarSystemSVG.getElementById("originLn").textContent = originLn;

        let pt = getLocationOfElement(solarSystemSVG, this.svgOrigin.element);

        let label = solarSystemSVG.getElementById("originLabel");
        let w = label.width.baseVal.value;
        let r = this.svgOrigin.element.r.baseVal.value;

        let vbRight = viewBox.x + viewBox.width;
        let labelRight = pt.x + w;
        let dx = 0;

        if(labelRight > vbRight){
            let m = vbRight - (pt.x + w);
            dx = -(labelRight - vbRight);
        }

        label.x.baseVal.value = pt.x + dx;
        label.y.baseVal.value = pt.y + r;
        console.log("origin r ", r, vbRight)
    }

    setPlaneChangeLabel(){

        let dv = super.planeChangeDv();

        solarSystemSVG.getElementById("pcI").textContent = radToDeg(this.i);
        solarSystemSVG.getElementById("pcLn").textContent = radToDeg(this.LnPC);
        solarSystemSVG.getElementById("pcDv").textContent = dv.toFixed(2);
        

        let planeChangeMarkerA = solarSystemSVG.getElementById("planeChangeMarkerA");
        let an = solarSystemSVG.getElementById("ascendingNode");

        let ptA = getLocationOfElement(solarSystemSVG, planeChangeMarkerA);
        an.x.baseVal.value = ptA.x;
        an.y.baseVal.value = ptA.y;

        let planeChangeMarkerB = solarSystemSVG.getElementById("planeChangeMarkerD");
        let dn = solarSystemSVG.getElementById("descendingNode");

        let ptD = getLocationOfElement(solarSystemSVG, planeChangeMarkerB);
        dn.x.baseVal.value = -ptD.x;
        dn.y.baseVal.value = -ptD.y;

        let pt = this.crossProduct > 0 ? ptA : ptD;
        
        try {

            let pcLabel = solarSystemSVG.getElementById("planeChangeLabel");

            let w = pcLabel.width.baseVal.value;
            let h = pcLabel.height.baseVal.value;

            let vbRight = viewBox.x + viewBox.width;
            let labelRight = pt.x + w;

            let dx = -w / 2;
            let dy = h / 3;

            pcLabel.x.baseVal.value = pt.x + dx;
            pcLabel.y.baseVal.value = pt.y + dy;
        
        } catch {

        }
        
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

function initializeSolarSystemSVGelements() {

    console.log("....initialize solar system SVG elements");

    solarSystemSVG = document.getElementById("svgObject").contentDocument.getElementById("solarSystem");

    for(let planetName in planets){

        let curPlanet = planets[planetName];

        let svgPlanet = new SVGplanet(curPlanet);
        svgPlanets[planetName] = svgPlanet;

        let orbitName = planetName+"Orbit";
        let svgOrbit = new SVGellipiticalOrbit(orbitName, curPlanet, 0);
        
        svgOrbits[planetName] = svgOrbit;

    }

    console.log("....solar system SVG elements initialized");
}


// misc/ test functions

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

function getLocationOfElement(svg, element) {

    let svgCTM = svg.getCTM();
    //let svgScale = Math.sqrt(Math.abs(svgCTM.a * svgCTM.d - svgCTM.c * svgCTM.b));
    //let svgRot = Math.acos(svgCTM.a / svgScale);
    //let svgTx = svgCTM.e;
    //let svgTy = svgCTM.f;
    
    let elCTM = element.getCTM();
    //let elScale = Math.sqrt(Math.abs(elCTM.a * elCTM.d - elCTM.c * elCTM.b));
    //let elRot = Math.acos(elCTM.a/elScale);
    //let elTx = elCTM.e;
    //let elTy = elCTM.f;

    let elRelCTM =svg.createSVGMatrix();
    let INV = svgCTM.inverse();
    elRelCTM = INV.multiply(elCTM) 

    let pt1 = svg.createSVGPoint();

    let x = element.cx.baseVal.value;
    let y = element.cy.baseVal.value;

    pt1.x = x;
    pt1.y = y;

    pt1 = pt1.matrixTransform(elRelCTM);

    return pt1;

}

function scaleTextBox() {

    let svg = document.getElementById("svgObject").contentDocument.getElementById("solarSystem");
    let svgCTM = svg.getCTM();
    let svgScale = Math.sqrt(Math.abs(svgCTM.a * svgCTM.d - svgCTM.c * svgCTM.b));

    console.log("svg scale", svgScale);

    let testRect = svg.getElementById("testRect");
    testRect.setAttribute("transform", `scale(${1/svgScale})`);

    //testRect.transform.baseVal.initialize(T);
    //T.setScale(1 / svgScale, 1 / svgScale);
    //testRect.transform.baseVal.appendItem(T);
}

function createSVGElement(){

    let ns = solarSystemSVG.namespaceURI;
    let textElement = document.createElementNS(ns,"text");
    textElement.x = 100;
    textElement.y = 100;
    
    solarSystemSVG.appendChild(textElement);
}


// hyperbolic orbit functions

class SVGhyperbolicOrbit extends HyperbolicOrbit {

    constructor(bodyName, t, peAlt, v3, outbound) {

        super(bodyName, t, peAlt, v3);

        this.outbound = outbound;

        this.svg = document.getElementById("svgObject").contentDocument.getElementById("planetSystem");

        //this.update(peAlt);
        
    }

    update(peAlt) {

        console.log("hyp orbit update")

        super.update(peAlt);

        this.rpScaled = this.rp * scaleFactor;

        //this pe = super.rp * scaleFactor;
        let a = this.a * scaleFactor;
        let c = this.c * scaleFactor;
        let b = this.b * scaleFactor;

        let soi = this.soi * scaleFactor
        let thetaSOI = this.thetaSoi;

        let endx = soi * Math.sin(thetaSOI);
        let endy = soi * Math.cos(thetaSOI);

        //let theta = super.getRotation(this.outbound);
        let k = this.outbound ? -1 : 1;
        let theta = modRev(this.v2Angle + k * this.turnAngle);
        //this.thetaPe = modRev(-Math.PI/2 + theta + this.fa);
     
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
        // arrow head scale
        let ascale = soi * .1;

        // v_planet, at planet
        let vpcx2 =  2 * this.eqR * scaleFactor * Math.sin(fa);
        let vpcy2 = -2 * this.eqR * scaleFactor * Math.cos(fa);

        // v_planet, at SOI  
        let vpx1 =  soi * Math.sin(fa);
        let vpy1 = -soi;

        let vpx2 =  vpx * vscale;
        let vpy2 = -vpy * vscale;

        // v_ship, at SOI
        let vsx2 =  0;
        let vsy2 = -v3 * vscale;

        let vsx1 =  0;
        let vsy1 = -soi;
        
        let svg = document.getElementById("svgObject").contentDocument.getElementById("planetSystem");

        let elPlanetV = svg.getElementById("planetV");
        let elPlanetVclose = svg.getElementById("planetVclose");
        let elShipV = svg.getElementById("shipV");
        let elShipRelV = svg.getElementById("shipRelV");

        elPlanetVclose.setAttribute("x1", 0);
        elPlanetVclose.setAttribute("y1", 0);
        elPlanetVclose.setAttribute("x2", vpcx2);
        elPlanetVclose.setAttribute("y2", vpcy2);

        svg.getElementById("planetVcloseArrow").setAttribute("x", vpcx2);
        svg.getElementById("planetVcloseArrow").setAttribute("y", vpcy2);
        svg.getElementById("planetVcloseArrow").setAttribute("transform", `rotate(${radToDeg(fa)},${vpcx2}, ${vpcy2})`);

        let w2 = .03; //vpcy2 * .00010;
        let w = .1 * this.eqR * scaleFactor;

        svg.getElementById("planetVcloseArrow").setAttribute("width", w);
        svg.getElementById("planetVcloseArrow").setAttribute("height",w*4);

        svg.getElementById("arrowHead").setAttribute("width", ascale / 4);
        svg.getElementById("arrowHead").setAttribute("height", ascale);
        // planet velocity
        elPlanetV.setAttribute("x1", vpx1);
        elPlanetV.setAttribute("y1", vpy1);
        elPlanetV.setAttribute("x2", vpx2);
        elPlanetV.setAttribute("y2", vpy2);

        let planetVarrow = svg.getElementById("planetVArrow");
        planetVarrow.setAttribute("transform", `rotate(${radToDeg(fa)},${vpx2}, ${vpy2})`);
        planetVarrow.setAttribute("x", vpx2);
        planetVarrow.setAttribute("y", vpy2);

        // ship velocity
        elShipV.setAttribute("x1", vsx1);
        elShipV.setAttribute("y1", vsy1);
        elShipV.setAttribute("x2", vsx2);
        elShipV.setAttribute("y2", vsy2);

        svg.getElementById("shipVArrow").setAttribute("x", vsx2);
        svg.getElementById("shipVArrow").setAttribute("y", vsy2);
        
        // relative velocity
        elShipRelV.setAttribute("x1", vpx2);
        elShipRelV.setAttribute("y1", vpy2);
        elShipRelV.setAttribute("x2", vsx2);
        elShipRelV.setAttribute("y2", vsy2);

        let relAngle = Math.atan2(vsy2-vpy2, vsx2-vpx2);
        svg.getElementById("shipRelVArrow").setAttribute("x", vsx2);
        svg.getElementById("shipRelVArrow").setAttribute("y", vsy2);
        svg.getElementById("shipRelVArrow").setAttribute("transform", `rotate(${(90+radToDeg(relAngle))},${vsx2}, ${vsy2})`);
        
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

function setNodeText(){

    let svg = document.getElementById("svgObject").contentDocument.getElementById("planetSystem");
    
    //copied from update PE
    let theOrbit = hypOrbit;

    let pe = theOrbit.peAlt / 1000;
    let lnPe = theOrbit.lnPe;
    let dv = theOrbit.deltaV;
    let tof = theOrbit.TOF;

    let params = new URLSearchParams(location.search);
    let todTx = Number(params.get("tod"));
    let tod = todTx - tof;
    
    svg.getElementById("nodePe").textContent = pe;
    svg.getElementById("nodeLn").textContent = radToDeg(lnPe, 1);
    svg.getElementById("nodeDv").textContent = dv.toFixed(2);
    svg.getElementById("nodeTod").textContent = convertSecondsToDateObj(tod).toString();


}

function svgPeAngle(){
    // determines the angle of PE relative to the SVG
    // i.e. 0 degrees is at the 3 o'clock position

    let k = hypOrbit.outbound ? -1 : 1;
    let theta = modRev(hypOrbit.v2Angle + k * hypOrbit.turnAngle);
    let thetaPe = modRev(k * Math.PI / 2 + theta + hypOrbit.fa);

    return thetaPe;

}

function updateHypSVG() {
    
    let peAlt;

    if(hypOrbit.outbound){
        peAlt = Number(document.forms["initializeTransfer"]["originPark"].value);
    }else{
        peAlt = Number(document.forms["initializeTransfer"]["destinationPark"].value);
    }
    
    hypOrbit.update(peAlt);
    
    let alignToLn0 = document.forms["options"]["alignToLn0"].checked;
    let io = hypOrbit.outbound ? 0 : Math.PI;

    let ln = hypOrbit.lnp;
    let fa = hypOrbit.fa;
    let theta = alignToLn0 ? ln : fa + io;
    let invTheta = alignToLn0 ? 0 : ln;

    let svg = document.getElementById("svgObject").contentDocument.getElementById("planetSystem");

    svg.getElementById("gPlanetSystemAlign").setAttribute("transform", `rotate(${-radToDeg(theta)})`);
    document.getElementById("alignmentMarker").setAttribute("transform", `rotate(${-radToDeg(invTheta)})`)

    setNodeText();
}


function initializeHyperbolicSVG(bodyName, t, peAlt, v3, outbound) {

    console.log("initialize hyperbolic SVG");

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
    //svg.getElementById("planetSystemPlanet").setAttribute("fill", "red");
    svg.getElementById("planetSystemPlanet").style.fill = planets[bodyName].color;

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

    svg.getElementById("ln0").setAttribute("x2", soi * Math.cos(-ln));
    svg.getElementById("ln0").setAttribute("y2", -soi * Math.sin(-ln));

    // set initial zoom (park orbit is half of screen)
    updateHypSVG();

    let thetaPe = svgPeAngle();
    let peX = Math.cos(thetaPe);
    let peY = Math.sin(thetaPe);

    let w = park * 4;
    let l = peX > 0 ? -.3 * w : -.7 * w;
    //let top = peY > 0 ? -.5 * w : -.5 * w;
    let top=-.55 * w;
    
    zoomWindow(l, top, w, w);

    //set text position
    
    peX = 1.2 * hypOrbit.rpScaled * Math.cos(thetaPe);
    peY = 1.2 * hypOrbit.rpScaled * Math.sin(thetaPe);

    let node = svg.getElementById("nodeInSymbol");    
    let nodeBox = node.getBBox();
    let dx = nodeBox.width;
    let dy = nodeBox.height;

    if(peX < 0){peX -= dx};
    if(peY > 0){peY += dy};
    
    node.setAttribute("x", peX);
    node.setAttribute("y", -peY);
}
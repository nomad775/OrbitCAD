

class Orbit{

    name = "theName";

    sma = 0;
    ecc = 0;
    LnPe = 0;
    mean0 = 0;

    period = 0;

    c = 0;
    cx = 0;
    cy = 0;

    constructor(name, sma, ecc, inc, lan, argPe, mean0, mu_parent) {

        this.name = name;

        this.sma = sma;
        this.ecc = ecc;
        this.inc = inc;
        this.LAN = lan;
        this.argPe = argPe;
        this.mean0 = mean0;

        this.LnPe = modRev(argPe + lan, 8);

        this.period = 2 * pi * Math.sqrt(this.sma ** 3 / mu_sun);
        this.theta0 = this.trueAnomaly(mean0);
        this.Ln0 = this.LnPe + this.theta0;

        this.c = ecc * sma;

        this.cx = this.c * Math.cos(this.LnPe);
        this.cy = this.c * Math.sin(this.LnPe);
    }

    trueAnomaly(M) {

        // eccentric anomaly
        var E = M;

        for (var i = 0; i < 7; i++) {
            E = M + this.ecc * Math.sin(E);
        }

        // true anomaly
        var theta = 2 * Math.atan(Math.sqrt((1 + this.ecc) / (1 - this.ecc)) * Math.tan(E / 2))

        return modRev(theta, 4);
    }

    MeanLnAtTimeT(t) {
        var percent = t / this.period;
        var M = percent * 2 * pi + this.mean0;
        var Ln = M + this.LnPe;

        return modRev(Ln, 4);
    }

    LnAtTimeT(t) {

        var percent = t / this.period;

        //mean anomaly relative to Pe
        var M = percent * 2 * pi + this.mean0;

        // true anomaly
        var theta = this.trueAnomaly(M);
        var Ln = this.LnPe + theta

        return modRev(Ln, 4);
    }

    rAtLn(Ln) {
        var r = this.sma * (1 - this.ecc ** 2) / (1 + this.ecc * Math.cos(Ln - this.LnPe))
        return r;
    }


    v(r) {
        //v^2 = k(2/r-1/a)
        //v^2 = [k/p](1+e^2+2*e*cos(?))

        return Math.sqrt(mu_sun * (2 / r - 1 / this.sma));
    }

    flightAngleAtTheta(ln) {

        let theta = modRev(ln - this.LnPe);
        let fa = Math.atan(this.ecc * Math.sin(theta) / (1 + this.ecc * Math.cos(theta)))

        //console.log("theta", radToDeg(theta));
        //console.log("FA", radToDeg(fa));

        return fa;
    }
}

class Planet extends Orbit {

    moons = [];

    constructor(name, sma, ecc, inc, LAN, argPe, mean0, parentMu, eqR, soi, bodyMu) {

        let muParent = mu_sun;

        super(name, sma, ecc, inc, LAN, argPe, mean0, muParent);

        this.eqR = eqR;
        this.soi = soi
        this.mu = bodyMu;

    }

}

class HyperbolicOrbit{

    _mu;
    _eqR;
    _soi;
    _v3;

    _a;
    
    constructor(bodyName, t, peAlt, v3){

        this.body = planets[bodyName];
        this._mu = this.body.mu;
        this._eqR = this.body.eqR;
        this._soi = this.body.soi;
        
        this._t = t;
        this._v3 = v3;

        // calculate 'a' of hyperbolic orbit
        // using v_r = sqrt(mu * (2/r - 1/a)) for r=SOI
        // v_r is the known required velocity for the transfer orbit
        // the required value for 'a' can be calucated by
        // v_r^2/mu = 2/r - 1/a => 2/r - v^2/mu = 1/a

        this.getVelocitieds(this.body, t, v3);

        this._a = 1 / (2 / this._soi - this.v2 ** 2 / this._mu);

        this.update(peAlt);
    }

    get a(){
        return this._a;
    }

    get soi(){
        return this._soi;
    }

    get eqR(){
        return this._eqR;
    }

    get v3(){
        return this._v3;
    }

    update(peAlt) {

        this.peAlt = peAlt;
        this.rp = peAlt + this._eqR;

        // e = c / a;
        this.e = (-this._a + this.rp) / -this._a;
        this.p = this._a * (1 - this.e ** 2);
        this.b = Math.sqrt(-this._a * this.p);

        this.c = (-this._a + this.rp);
        //this.b = Math.sqrt(this.c ** 2 - this.a ** 2); - from SVG hyperbolic orbit

        this.turnAngle = Math.asin(1 / this.e);
        // this is the angle from horizontal (velocity direction at pe) to V_infinity
        // in orbital mechanics this is delta / 2 (half the turn angle)

        this.thetaSoi = modRev(Math.acos((this.p / this._soi - 1) / this.e));

        // calculate v1 from vis-viva eqn
        // calculate v0 from circluar orbit
        let v1 = Math.sqrt(this._mu * (2 / this.rp - 1 / this.a));
        let v0 = Math.sqrt(this._mu / this.rp);

        this.deltaV = v1 - v0;

    }

    getVelocitieds(body, t, v3) {

        // v0 - velocity at Pe, parking orbit
        // v1 - velocity at Pe, hyperbolic orbit
        // v2 - velocity at SOI, relative to planet
        // v3 - velocity at SOI, relative to sun, required for tx orbit

        // assume v3 is in vertical direction
        // local horizon is vertical
        // vp includes horizontal component from flight angle

        this.lnp = body.LnAtTimeT(t);
        let r = body.rAtLn(this.lnp);
        this.vp = body.v(r);

        this.fa = body.flightAngleAtTheta(this.lnp);

        this.vpx = this.vp * Math.sin(this.fa);
        this.vpy = this.vp * Math.cos(this.fa);

        // relative velocity is difference in vertical components
        // plus the horizontal component of the planet velocity

        this.v2x = -this.vpx;
        this.v2y = v3 - this.vpy;

        this.v2 = Math.hypot(this.v2x, this.v2y);
        this.v2Angle = Math.atan2(this.v2y, this.v2x);

        //this.v2AngleDelta = Math.asin(this.v2x / this.v2);
    }

    getRotation(outbound){

        // inital coordinate system:
        // planet at LN0, planet velocity roughly vertical (upwards) (off by flight angle)
        // calling the left leg the inbound leg and right leg the outbound leg (assume CCW orbit)
        // hyperbola opening upwards (pe at 270deg)
        // rotate hyperbola to align vertical 

        let theta;

        if(outbound){

            // rotate right leg CCW by turn angle
            // let r1 = -this.turnAngle + Math.PI/2;
            // align to v2
            // let r2 = this.v2Angle - Math.PI/2;

            theta = this.v2Angle - this.turnAngle

        }else{

            // rotate left leg CW by turn angle
            // let r1 = this.turnAngle - Math.PI/2
            // align to v2
            // let r2 = this.v2Angle + Math.PI/2;

            theta = this.v2Angle + this.turnAngle;
        }

        this.lnPe = modRev(this.lnp - Math.PI/2 + theta);

        return theta;
        
    }

    get TOF(){

        // time of flight
        let theta = Math.acos((this.p / this._soi - 1) / this.e);
        let F = Math.acosh((this.e + Math.cos(theta)) / (1 + this.e * Math.cos(theta)));

        //let theta = Math.acos(a / (a + r_pe));
        //let F2 = 2 * Math.atanh(Math.sqrt((this.e - 1) / (this.e + 1)) * Math.tan(theta / 2));

        let M = this.e * Math.sinh(F) - F;
        let TOF = Math.sqrt((-this.a) ** 3 / this._mu) * M;

        return TOF;
    }

}

class TransferOrbit {

    tod;
    tof;

    Ln_o;
    Ln_r;

    constructor(originPlanet, destinationPlanet) {

        this.originPlanet = originPlanet;
        this.destinationPlanet = destinationPlanet;

    }

    getMeanEstimate(t) {

        let r1 = this.originPlanet.sma;
        let P1 = this.originPlanet.period;
        let Ln1 = this.originPlanet.MeanLnAtTimeT(t);

        let r2 = this.destinationPlanet.sma;
        let P2 = this.destinationPlanet.period;
        let Ln2 = this.destinationPlanet.MeanLnAtTimeT(t);

        let relAngVel = 2 * pi / P2 - 2 * pi / P1;
        let dir = Math.sign(relAngVel);

        let phi = modRev(Ln2 - Ln1);

        let a = (r1 + r2) / 2
        let tof = pi * Math.sqrt(a ** 3 / mu_sun);

        let deltaTheta = tof * (2 * pi) / P2;
        let phix = pi - deltaTheta;

        let epsilon = modRev(dir * (phix - phi));
        let deltaT = dir * epsilon / relAngVel;

        this.meanEstimate = t + deltaT;

        return t + deltaT;
    }

    update(t) {

        this.tod = t;

        // planets at departure
        this.Ln_o = this.originPlanet.LnAtTimeT(t);
        this.Ln_d = this.destinationPlanet.LnAtTimeT(t);
        this.Ln_r = modRev(this.Ln_o + pi);

        this.phaseAngle = Math.abs(this.Ln_o - this.Ln_d);

        // tx orbit
        this.ro = this.originPlanet.rAtLn(this.Ln_o);
        this.rd = this.destinationPlanet.rAtLn(this.Ln_r);

        this.Ln_pe = this.ro < this.rd ? this.Ln_o : this.Ln_r;

        // to-do: this duplicates elliptical orbit calculations
        this.a = (this.ro + this.rd) / 2;
        this.b = Math.sqrt(this.ro * this.rd);
        this.e = Math.sqrt(this.a ** 2 - this.b ** 2) / this.a;

        this.tof = pi * Math.sqrt(this.a ** 3 / mu_sun);
        this.toa = t + this.tof;

        // rendenzvous at arrival
        this.Ln_da = this.destinationPlanet.LnAtTimeT(t + this.tof);

        //this.err = this.da - this.Ln_r;
        this.rdvDiff = -Math.asin(Math.cos(this.Ln_r) * Math.sin(this.Ln_da) - Math.sin(this.Ln_r) * Math.cos(this.Ln_da));
        // derived from cross product


        // velocity at departure
        this.vo = this.originPlanet.v(this.ro);
        this.v3o = Math.sqrt(mu_sun * (2 / this.ro - 1 / this.a));

        let eject = new HyperbolicOrbit(this.originPlanet.name, t, 100000, this.v3o);
        this.ejectDv = eject.deltaV;
        
        // velocity at destination
        this.vd = this.destinationPlanet.v(this.rd)
        this.v3d = Math.sqrt(mu_sun * (2 / this.rd - 1 / this.a));

        let capture = new HyperbolicOrbit(this.destinationPlanet.name, this.toa, 100000, this.v3d);
        this.captureDv = capture.deltaV;
        
    }

    solveTForRdv(startTime) {

        let mu = mu_sun;

        let t = this.getMeanEstimate(startTime);

        this.update(t);

        let diff = this.rdvDiff;
        let i = 0;

        do {

            i++;

            let n_o = Math.sqrt(mu / this.ro ** 3);
            let n_d = Math.sqrt(mu / this.rd ** 3);

            let relAngVel = n_d - n_o;

            let deltaT = diff / relAngVel;

            t = t + deltaT;

            this.update(t);

            diff = this.rdvDiff;

        } while (Math.abs(diff) > .0001 && i < 30);

        return Math.round(t);
    }

    planeChangeDv() {

        let io = this.originPlanet.inc;
        let LANo = this.originPlanet.LAN;

        let id = this.destinationPlanet.inc;
        let LANd = this.destinationPlanet.LAN;

        //vector normal to orbit orbit
        let ax = Math.sin(LANo) * Math.sin(io);
        let ay = -Math.cos(LANo) * Math.sin(io);
        let az = Math.cos(io);

        //vector normal to destination orbit
        let bx = Math.sin(LANd) * Math.sin(id);
        let by = -Math.cos(LANd) * Math.sin(id);
        let bz = Math.cos(id);

        //vector towards AN/DN is cross product
        let cx = ay * bz - az * by;
        let cy = az * bx - ax * bz;
        let cz = ax * by - ay * bx;

        //angle between normal vectors = angle between planes
        //cross product = mag A * mag B * sin(theta); mag A = mag B = 1
        let mag = Math.sqrt(cx ** 2 + cy ** 2 + cz ** 2);
        let inc = Math.asin(mag);
        let Ln = Math.acos(cx / mag);

        let r = this.a * (1 - this.e ** 2) / (1 + this.e * Math.cos(Ln - this.Ln_pe));

        let v = Math.sqrt(mu_sun * (2 / r - 1 / this.a));
        let dV = 2 * v * Math.sin(inc / 2);

        return dV;
    }
}

function createPlanetObjectsFromXML(data, callback){
    
    //console.log(data);

    const parser = new DOMParser();
    const xml = parser.parseFromString(data, "text/xml");

    let planetsData = xml.getElementsByTagName("planet");
    
    for(let planetData of planetsData){

        let name= planetData.getAttribute("name");
        let soi = Number(planetData.getElementsByTagName("soi")[0].textContent);
        let bodyMu = Number(planetData.getElementsByTagName("mu")[0].textContent);
        let eqR = Number(planetData.getElementsByTagName("radius")[0].textContent);
        let orbit = planetData.getElementsByTagName("orbit")[0];

        let sma =   Number(orbit.getElementsByTagName("sma")[0].textContent);
        let ecc =   Number(orbit.getElementsByTagName("ecc")[0].textContent);
        let argPe = Number(orbit.getElementsByTagName("argPe")[0].textContent) * Math.PI/180;
        let LAN = Number(orbit.getElementsByTagName("lan")[0].textContent) * Math.PI / 180;
        let mean0 = Number(orbit.getElementsByTagName("mean0")[0].textContent);
        let inc = Number(orbit.getElementsByTagName("inc")[0].textContent) * Math.PI / 180;

        let planet = new Planet(name, sma, ecc, inc, LAN, argPe, mean0, mu_sun, eqR, soi, bodyMu);

        planets[name] = planet;
        
    }

    callback();
}

function getPlanetsXML(callback) {

    console.log("initialize planet data");

    var fileName = "kspPlanets.xml";
    
    fetch("kspPlanets.xml").then(response => response.text()).then(data => {
        window.localStorage.setItem("planetsXML", data);
        console.log("xml data saved");
        createPlanetObjectsFromXML(data, callback)
    });
}






function z_initializeEjectionOrbit(theTxOrbit) {

    console.log("initialize ejection orbit");

    let originPlanet = theTxOrbit.originPlanet;
    let t = theTxOrbit.tod;
    let v3 = Math.abs(theTxOrbit.v3o);

    let isForm = location.toString().includes("form");
    let peAlt;
    if (isForm) {
        peAlt = document.forms["parkOrbit"]["peAlt"].value * 1000;
    } else {
        peAlt = fields["parkPe"].value * 1000;
    }

    // create hyperbolic orbit
    ejectionOrbit = new HyperbolicOrbit(originPlanet, t, peAlt, v3);

    initializeEjectionSVG(ejectionOrbit);

    return ejectionOrbit;
}


var transferChangeEvent = new Event('transferChange');

class Planet{
    
    name="theName";

    sma = 0;
    ecc = 0;
    LnPe = 0;
    mean0 = 0;

    r = 0;
    mu = 0;
    soi = 0;

    period=0;
    
    c = 0;
    cx = 0;
    cy = 0;

    constructor(name, sma, ecc, inc, LAN, argPe, mean0, mu, soi, r){

        this.name = name;

        this.sma = sma;
        this.ecc = ecc;
        this.inc = inc;
        this.LAN = LAN;
        this.argPe = argPe;
        this.mean0 = mean0;

        this.mu = mu;
        this.r = r;
        this.soi = soi
        
        this.LnPe = modRev(argPe + LAN, 8);

        this.period = 2*pi*Math.sqrt(this.sma**3/mu_sun);
        this.theta0 = this.trueAnomaly(mean0);
        this.Ln0 = this.LnPe + this.theta0;
        
        this.c = ecc * sma;
        this.cx = this.c * Math.cos(this.LnPe);
        this.cy = this.c * Math.sin(this.LnPe);
    }

    trueAnomaly(M){
        
        // eccentric anomaly
        var E = M;
        
        for(var i=0;i<7;i++){
            E = M + this.ecc * Math.sin(E);
        }
        
        // true anomaly
        var theta = 2*Math.atan(Math.sqrt((1+this.ecc)/(1-this.ecc))*Math.tan(E/2))
        
        return modRev(theta, 4);
    }
    
    MeanLnAtTimeT(t){
        var percent = t/this.period;
        var M = percent * 2*pi + this.mean0;
        var Ln = M + this.LnPe;
        
        return modRev(Ln, 4);
    }
    
    LnAtTimeT(t){
        
        var percent = t/this.period;
        
        //mean anomaly relative to Pe
        var M = percent * 2*pi + this.mean0;
        
        // true anomaly
        var theta = this.trueAnomaly(M);
        var Ln = this.LnPe + theta
        
        return modRev(Ln, 4);
    }

    rAtLn(Ln){
        var r = this.sma * (1 - this.ecc**2 )/(1+this.ecc * Math.cos(Ln-this.LnPe))
        return r;        
    }

     
    v(r) {
        //v^2 = k(2/r-1/a)
        //v^2 = [k/p](1+e^2+2*e*cos(?))

        return Math.sqrt(mu_sun * (2 / r - 1 / this.sma));
    }

    flightAngelAtTheta(theta) {
        return Math.atan(this.ecc * Math.sin(theta) / (1 + this.ecc * Math.cos(theta)));
    }
}

class TransferOrbit{
    
    tod;
    tof;

    Ln_o;
    Ln_r;

    constructor(originPlanet, destinationPlanet){
        
        this.originPlanet = originPlanet;
        this.destinationPlanet = destinationPlanet;
        
        this.update(0);
    }

    meanEstimate(t) {

        let r1 = this.originPlanet.sma;
        let P1 = this.originPlanet.period;
        let Ln1 = this.originPlanet.MeanLnAtTimeT(t);

        let r2 = this.destinationPlanet.sma;
        let P2 = this.destinationPlanet.period;
        let Ln2 = this.destinationPlanet.MeanLnAtTimeT(t);

        let relAngVel = 2*pi/P2 - 2*pi/P1;
        let dir = Math.sign(relAngVel);

        let phi = modRev(Ln2 - Ln1);

        let a = (r1 + r2) / 2
        let tof = pi * Math.sqrt(a ** 3 / mu_sun);

        let deltaTheta = tof * (2 * pi) / P2;
        let phix = pi - deltaTheta;
              
        let epsilon = modRev(dir * (phix - phi));
        let deltaT = dir * epsilon / relAngVel;

        window.dispatchEvent(transferChangeEvent);

        return t + deltaT;
    }

    update(t){

        this.tod = t;

        this.Ln_o = this.originPlanet.LnAtTimeT(t);
        this.Ln_r = modRev(this.Ln_o + pi);

        this.LnPe = this.Ln_o < this.Ln_r ? this.Ln_o : this.Ln_r;
        
        this.ro = this.originPlanet.rAtLn(this.Ln_o);
        this.rd = this.destinationPlanet.rAtLn(this.Ln_r);

        this.vo = this.originPlanet.v(this.ro);
        this.vd = this.destinationPlanet.v(this.rd)

        this.a = (this.ro + this.rd)/2;
        this.b = Math.sqrt(this.ro * this.rd);
        this.e = Math.sqrt(this.a ** 2 - this.b ** 2) / this.a;

        this.tof = pi * Math.sqrt(this.a**3/mu_sun);
        
        this.Ln_d = this.destinationPlanet.LnAtTimeT(t+this.tof);

        this.err = this.Ln_d - this.Ln_r;


        this.v_depart = Math.sqrt(mu_sun * (2 / this.ro - 1 / this.a));
        this.v_arrive = Math.sqrt(mu_sun * (2 / this.rd - 1 / this.a));

        this.v_soi_o = this.v_depart - this.vo;
        this.v_soi_d = this.v_arrive - this.vd;

        window.dispatchEvent(transferChangeEvent);

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
        let Ln = Math.acos(cx/mag);

        let r = this.a * (1 - this.e ** 2) / (1 + this.e * Math.cos(Ln - this.LnPe));

        let v = Math.sqrt(mu_sun * (2 / r - 1 / this.a));
        let dV = 2 * v * Math.sin(inc / 2);

        return dV;
    }
   
}

class HyperbolicOrbit{

    _mu;
    _soi;
    _v2;
    _eqR;

    _rp;

    _a;
    _e;
    _p;

    constructor(body, bodyLn, peAlt, v_soi){

        this._mu = body.mu;
        this._eqR = body.r;
        this._soi = body.soi;
        this._v2 = v_soi;
        this._bodyLn = bodyLn;
        this._rp = body.r + peAlt;


        // v0 - velocity of pe (e.g. parking orbit)
        // v1 - velocity at Pe, after dV applied, required to obtain v2 at SOI
        // v2 - velocity at SOI, relative to planet
        // v3 - velocity just past SOI, relative to sun, required for tx orbit
    
        //let v3 = txOrbit.v_depart;
        //let v2 = v3 - txOrbit.v_origin;
        //let v2 = v_soi;

        

        // calculate sma of hyperbolic orbit
        // using v_r = sqrt(mu * (2/r - 1/a)) for r=SOI
        // v_r is the known required velocity for the transfer orbit
        // the required value for a can be calucated
        // v_r^2/mu = 2/r - 1/a => 2/r - v^2/mu = 1/a

        //let a = Math.abs(1/(2/soi - v2**2/mu));
        //let e = Math.abs((a + r_pe) / a);
        //let l = -a * (1 - e ** 2);
        
        //this.sma = -a;
        //this.ecc = e;
        //this.p = l;


        // calculate v1 from vis-viva eqn
        //let v1 = Math.sqrt(mu*(2/r_pe + 1/a));
        //let v0 = Math.sqrt(mu/r_pe);
        //let deltaV = v1 - v0;
    
        // theta is angle between a and f (focus), where f = a + r_pe
        // ejection angle is pi - theta, also is half of turning angle

        //let theta = Math.acos(a / (a + r_pe));
        //let ejectionAngle = (pi - theta);
    
    }

    set peAlt(thePeAlt) {
        this._rp = this._eqR + thePeAlt;
    }

    get a(){

        // calculate a of hyperbolic orbit
        // using v_r = sqrt(mu * (2/r - 1/a)) for r=SOI
        // v_r is the known required velocity for the transfer orbit
        // the required value for a can be calucated by
        // v_r^2/mu = 2/r - 1/a => 2/r - v^2/mu = 1/a
        this._a = 1 / (2 / this._soi - this._v2 ** 2 / this._mu);
        return this._a;
    }

    get e(){
        // e = c/a
        // c = abs(a) + r_p
        this._e = (-this._a + this._rp) / -this._a;
        return this._e;
    }

    get p(){
        this._p = this.a * (1 - this.e ** 2);
        return this._p;
    }

    get rp(){
        return this._rp;
    }

    get TOF(){

        // time of flight
        let theta = Math.acos((this._p / this._soi - 1) / this._e);
        let F = Math.acosh((this._e + Math.cos(theta)) / (1 + this._e * Math.cos(theta)));

        //let theta = Math.acos(a / (a + r_pe));
        //let F2 = 2 * Math.atanh(Math.sqrt((this.e - 1) / (this.e + 1)) * Math.tan(theta / 2));

        let M = this._e * Math.sinh(F) - F;
        let TOF = Math.sqrt((this._a) ** 3 / this._mu) * M;

        return convertSecondsToDateObj(TOF);
    }

    get thetaSOI(){
        return Math.acos((this.p/this._soi - 1)/this._e);
    }

    get turnAngle() {
        return Math.asin(1 / this._e);
    }

    get lnPe(){
        return -this.bodyLn + this.turnAngle;
    }

    get bodyLn(){
        return this._bodyLn;
    }

    get bodyEqR(){
        return this._eqR;
    }

    get bodySOI(){
        return this._soi;
    }

    calculateDeltaV(){
        
        // v0 - velocity of pe (e.g. parking orbit)
        // v1 - velocity at Pe, after dV applied, required to obtain v2 at SOI
        // v2 - velocity at SOI, relative to planet
        // v3 - velocity just past SOI, relative to sun, required for tx orbit
    
        //let v3 = txOrbit.v_depart;
        //let v2 = v3 - txOrbit.v_origin;

        // calculate v1 from vis-viva eqn
        let v1 = Math.sqrt(this._mu * (2 / this_rp + 1 / this._a));
        let v0 = Math.sqrt(this._mu / this._rp);

        return deltaV = v1 - v0;
    }

    trueAnomaly(M) {

        // eccentric anomaly
        var H = M;

        for (var i = 0; i < 7; i++) {
            H = this.ecc * Math.sinh(H) - H;
        }

        // true anomaly
        var theta = 2 * Math.atan(Math.sqrt((1 + this.ecc) / (1 - this.ecc)) * Math.tanh(H / 2))

        return modRev(theta, 4);
    }

    rAtTA(TA) {
        var r = this._a * (1 - this._e ** 2) / (1 + this._e * Math.cos(TA))
        return r;
    }

}

function initializeCaptureOrbit(){
    
    console.log("initialize capture orbit");
    
    let destinationPlanet = txOrbit.destinationPlanet;
    let vSOI = txOrbit.v_soi_d;

    let peAlt = fields["capPe"].value * 1000;

    console.log(peAlt);

    // create hyperbolic orbit
    ejectionOrbit = new HyperbolicOrbit(destinationPlanet, txOrbit.Ln_d, peAlt, vSOI);

    initializeCaptureSVG(ejectionOrbit, Direction.CCW);

}

function initializeEjectionOrbit(){
    
    console.log("initialize ejection orbit");
    //console.log(fields["ejectPe"]);

    let originPlanet = txOrbit.originPlanet;
    let vSOI = txOrbit.v_soi_o;

    let peAlt = fields["parkPe"].value * 1000;

    console.log(peAlt);

    // create hyperbolic orbit
    ejectionOrbit = new HyperbolicOrbit(originPlanet, txOrbit.Ln_o, peAlt, vSOI);

    initializeEjectionSVG(ejectionOrbit, Direction.CCW);

}

function initializeTransferOrbit() {

    console.log("initialize transfer orbit");

    origin = fields["origin"].value;
    destination = fields["destination"].value;
    
    originPlanet = planets[origin];
    destinationPlanet = planets[destination];

    txOrbit = new TransferOrbit(originPlanet, destinationPlanet);
    
    window.addEventListener("transferChange", onTransferChange);
    
    initializeTransferSVG();

    // SET AT MEAN ESTIMATE
    displayedTime = Math.round(txOrbit.meanEstimate(displayedTime));
    date = convertSecondsToUT(displayedTime);
    
    window.dispatchEvent(timeChangeEvent);

    console.log("mean estimate " + date.toString());

}

function createPlanetObject(){
    
    let name;

    $(this).attr("name", function(index, curValue){
        name = curValue;
    });

    let sma = Number($(this).find("orbit sma").text());
    let ecc = Number($(this).find("orbit ecc").text());
    let argPe = Number($(this).find("orbit argPe").text()) * pi / 180;
    let LAN = Number($(this).find("orbit lan").text()) * pi / 180;
    let mean0 = Number($(this).find("orbit mean0").text());
    let inc = Number($(this).find("orbit inc").text()) * pi / 180;

    let soi = Number($(this).find("soi").text());
    let mu = Number($(this).find("mu").text());
    let r = Number($(this).find("radius").text());

    planet = new Planet(name, sma, ecc, inc, LAN, argPe, mean0, mu, soi, r);

    planets[name] = planet;
 
    index = planets.length-1;
   
}

function doXML(data){
    console.log(data);
}


function getPlanetsXML(callback) {

    console.log("getting planet data");

    var fileName = "kspPlanets.xml";
    var ajax = $.get(fileName);

    ajax.done(
        function (data) {
            $("planets", data).children().each(createPlanetObject)
            callback()
        }
    );

    //fetch("kspPlanets.xml").then(response => response.text()).then(data => doXML(data));
}

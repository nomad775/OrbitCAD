
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


function onTransferChange(event){

    //console.log("transfer event fired");

    fields["lnChase"].value = txOrbit.Ln_r;
    fields["lnTarget"].value = txOrbit.Ln_t;
    fields["lnDiff"].value = txOrbit.err;

    var dataId = fields["lnChase"].dataElement;
    var element = document.getElementById(dataId);
    
    //console.log($(dataId));

    document.getElementById("lnChase").innerText = Math.round(txOrbit.Ln_r * 180/Math.PI * 10)/10;
    document.getElementById("lnTarget").innerText = Math.round(txOrbit.Ln_t * 180/Math.PI * 10)/10;
    document.getElementById("lnDiff").innerText = Math.round(txOrbit.err * 180/Math.PI * 10)/10;

    let utDate = convertSecondsToDateObj(displayedTime);

    let utY = utDate.y;
    let utD = utDate.d;
    let utH = utDate.h;
    let utM = utDate.m;

    document.querySelector("input[name='utY']").value = utY;
    document.querySelector("input[name='utD']").value = utD;
    document.querySelector("input[name='utH']").value = utH;
    document.querySelector("input[name='utM']").value = utM;

    let a = txOrbit.a;
    let e = txOrbit.e;

    let ap = Math.round(a*(1+e));
    let pe = Math.round(a*(1-e));

    document.querySelector("input[name='ap']").value = ap;
    document.querySelector("input[name='pe']").value = pe;

    document.querySelector("input[name='lan']").value = 0;
    document.querySelector("input[name='argPe']").value = Math.round(txOrbit.LnPe * 180/Math.PI * 10)/10;
}

function onEjectionChange(event){
    //check pe and ap
    
    // update orbit
    ejectOrbit.ap = ap;
    ejectOrbit.pe = pe;

    // update svg

}
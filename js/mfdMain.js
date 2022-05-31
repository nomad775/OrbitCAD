const planets = {};

let currentTime = 1;
let displayedTime = 0;


// ---------- page 1 ----------
var txOrbit;
var ejectOrbit;
var captureOrbit;

function setTime(name) {

    let dialog = document.getElementById('timeEntry');
    let form = document.getElementById("frmTimeEntry");
    form["field"].value = name;
    dialog.showModal();
}

function getTime() {

    var form = document.getElementById('frmTimeEntry');

    if (form.returnValue = "Submit") {
        console.log("SET")
        let name = form.field.value;
        let uts = form.utS.value;

        document.forms["initializeTransfer"]["utNow"].value = uts;
        displayedTime = uts;
        window.dispatchEvent(timeChangeEvent);
    }

    activeButton.setInactive();

}

function bottomRadioButtonChanged(){
    console.log("bottom radio button changed");
}

function planetClickAsInput(event, planetId){

    console.log(planetId + " clicked");

    let inputField = document.forms["frmBottom"]["bottom"].value;
    var fieldName;

    switch (Number(inputField)){
        case 0:
            fieldName="set ut";
            break;
        case 1:
            fieldName="origin";
            break;
        case 2:
            fieldName="destination";
            break;
    }

    let optButton = document.getElementById("optB"+inputField);
    optButton.checked=false;

    console.log(fieldName);

    
    //activeField.value = planetId;
    //updateDisplay(activeField.id);

    //activeField.callback();

}

function setTime(name){

    let dialog = document.getElementById('timeEntry');
    let form = document.getElementById("frmTimeEntry");
    form["field"].value = name;
    dialog.showModal();    
}

function getTime(){
    
    var form = document.getElementById('frmTimeEntry');
    
    if(form.returnValue = "Submit"){
        console.log("SET")
        let name = form.field.value;
        let uts = form.utS.value;

        document.forms["initializeTransfer"]["utNow"].value = uts;
        displayedTime = uts;
        window.dispatchEvent(timeChangeEvent);
    }

    activeButton.setInactive();

}

// ---------- end page 1 ----------


function setActivePage(dataObj) {

    let buttonData = dataObj["pageFunctions"];
    let inputFields = dataObj["inputFields"];
    let outputFields = dataObj["outputFields"];
    let activePanels = dataObj["activePanels"];

    // if(activePage != undefined) activePage.setInactive();
    // activePage = buttons[id];
    // activePage.setActive();

    // set buttons
    buttonData.forEach((button) => {

        let labelId = `lbl${button.id.toUpperCase()}`;
        let inputId = `opt${button.id.toUpperCase()}`;

        let label = document.getElementById(labelId);
        let input = document.getElementById(inputId);

        let isDisabled = !(Boolean(button.label)) || !(button.disabled == undefined || button.disabled == "");

        label.textContent = button.label;

        if (isDisabled) {
            input.setAttribute("disabled", true);
        }

        let fn = Function(button.fn);

    }
    );

    // buttons["b0"].setActive();
    return;

    // update input fields
    if (inputFields.length > 0) {
        inputFields.forEach(fieldId => {
            updateDisplay(fieldId, fields[fieldId].value);
        })
    }

    // update outputfields
    outputFields.forEach(fieldId => {
        $(fields[fieldId].labelElement).text(fields[fieldId].label);
        updateDisplay(fieldId, fields[fieldId].value);
    })

    // set all display panels as inactive
    $("#pePanelUnit").removeClass("paramDisp").addClass("paramDisp_inactive");
    $("#apPanelUnit").removeClass("paramDisp").addClass("paramDisp_inactive");
    $("#lanPanelUnit").removeClass("paramDisp").addClass("paramDisp_inactive");
    $("#argPePanelUnit").removeClass("paramDisp").addClass("paramDisp_inactive");
    $("#utPanelUnit").removeClass("paramDisp").addClass("paramDisp_inactive");
    $("#tPePanelUnit").removeClass("paramDisp").addClass("paramDisp_inactive");
    $("#lnPanelUnit").removeClass("paramDisp").addClass("paramDisp_inactive");

    // set active panels
    activePanels.forEach(panelPath => {
        $(panelPath).removeClass("paramDisp_inactive").addClass("paramDisp");
    })

}

function initializeMFD() {

    console.log("initalize MFD");

    fetch("transferApp_P1.json").then(response => response.json()).then(data => setActivePage(data));
    
}


function initialize() {

    initializeMFD();
    initializeScreen();

    getPlanetsXML(() => {

        initializeSolarSystemSVG();
        setSolarSystemSVG();

        console.log("intialized");
        troubleShoot();
    });

}

function troubleShoot() {
    console.log("troubleshoot");
    //initializeEjectionOrbit();
}

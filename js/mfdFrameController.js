
var pages = {};
var buttons = {};
var fields = {};

var activePage;
var activeButton;
var activeField;

class Button {

    _label = "";
    _fn;
    _isActive = false;
    _isDisabled = false;

    constructor(idStr, btnElementStr, labelElementStr) {

        console.log(idStr);

        this.btnGroup = document.getElementById(idStr);
        console.log(this.btnGroup);

        //this.buttonElement = $(btnElementStr);
        
        this.labelElement = this.btnGroup.getElementsByTagName("text").item(0);
        
        console.log(this.labelElement);
    
    }

    setActive(toggle) {

        this._isActive = true;
        //this.labelElement.parent.addClass("btnLabel-active");

        
        let jqElement = $(this.btnGroup)
        
        jqElement.addClass("btnLabel-active").removeClass("btnLabel");
        jqElement.removeClass("btnLabel-disabled");

        console.log(jqElement);

        if(toggle) activeButton.setInactive();
        activeButton = this;
    }

    setInactive() {

        this._isActive = false;
        $(this.btnGroup).removeClass("btnLabel-active")
        $(this.btnGroup).addClass("btnLabel");
        
    }

    setDisabled(){

        this._isDisabled = true;

        let jqElement = $(this.btnGroup)
        jqElement.removeClass("btnLabel");
        jqElement.removeClass("btnLabel-active");

        jqElement.addClass("btnLabel-disabled");

    }

    setEnabled() {

        this._isDisabled = false;

        let jqElement = $(this.btnGroup)
        jqElement.removeClass("btnLabel-disabled");
        jqElement.removeClass("btnLabel-active");

        jqElement.addClass("btnLabel");

    }
    
    click() {
        
        console.log(this._label + " click");

        this.setActive();
        this._fn();
    }

    set label(theLabel) {
        this._label = theLabel;
        this.labelElement.textContent = theLabel;
    }

    set fn(fn) {
        this._fn = fn;
    }

}


function updateDisplay(id, override) {

    let field = fields[id];
    let value = field.value;

    $(field.dataElement).each(function () { $(this).text(value) });
    $(field.dataElement).each(function () { $(this).val(value) });
}

function setActiveField(id) {
    // sets field to receive input

    //deactive current active field
    if(activeField != undefined){
        $(activeField.dataElement).addClass("fn");
        $(activeField.dataElement).removeClass("activeFn");
    }
    

    if (id == "none") {
        activeField = undefined;
        return;
    }

    activeField = fields[id];

    $(activeField.dataElement).val("");
    //activeField.value = NaN;

    $(activeField.dataElement).addClass("activeFn");
    $(activeField.dataElement).removeClass("fn");

    //scroll to keyboard
    //window.scroll(0, 400);

    //console.log("active field", activeField);
}

function setActivePage(id) {

    //console.log(activeButton);
    if(activeButton != undefined) activeButton.setInactive();

    dataObj = pages[id];

    let buttonData = dataObj["pageFunctions"];
    let inputFields = dataObj["inputFields"];
    let outputFields = dataObj["outputFields"];
    let activePanels = dataObj["activePanels"];

    if(activePage != undefined) activePage.setInactive();
    activePage = buttons[id];
    activePage.setActive();

    // set buttons
    buttonData.forEach(element => {

        let id = element.id;
        let label = element.label
        let fn = eval(element.fn);

        buttons[id].label = label;
        buttons[id].fn = fn;

    });

    // update input fields
    if(inputFields.length>0){
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

function setAppData(appData) { 

    console.log("starting app : " + appData.app + "  (async from initialize MFD)");

    appData.pages.forEach(page => {

        let id = page.id;

        buttons[id].label = page.label;
        buttons[id].fn = Function(page.fn);

        pages[id] = page.pageData;

        if (pages[id].pageFunctions != Array[0]) {

            pages[id].pageFunctions.forEach(pageFn => {

                pageFn.fn = Function(pageFn.fn);
            })
        }
    })

    setActivePage("t1");

}



function keyPress(event, k) {
    //event is mouse event from button click
    event.preventDefault();
    event.stopPropagation();

    if (k == "E") {
        activeField.value = $(activeField.dataElement).val();
        activeField.callback();
        return;
    }

    if (k == "B") {
        let field = $(activeField.dataElement);
        let newVal = field.val().slice(0, -1);
        field.val(newVal);
        //console.log(newVal);
        return;
    }

    var dataElement = $(activeField.dataElement);
    dataElement.val(dataElement.val() + k);

}

function planetClickAsInput(event, planetId){

    console.log("planet clicked", planetId, "for active field ", activeField);

    activeField.value = planetId;
    updateDisplay(activeField.id);

    activeField.callback();

}

function processTimeFields(yField, dField, hField, mField, outField, isUT) {

    y = fields[yField].value;
    d = fields[dField].value;
    h = fields[hField].value;
    m = fields[mField].value;

    s = convertDateToSeconds(y, d, h, m, isUT);

    fields[outField].value = s;

    fields[outField].callback();

    displayedTime = s;
    window.dispatchEvent(timeChangeEvent);
}


function initializeButtonElements() {

    buttons["b0"] = new Button("b0", "#btnB0", "#btnLabelB0");
    buttons["b1"] = new Button("b1", "#btnB1", "#btnLabelB1");
    buttons["b2"] = new Button("b2", "#btnB2", "#btnLabelB2");
    buttons["b3"] = new Button("b3", "#btnB3", "#btnLabelB3");
    buttons["b4"] = new Button("b4", "#btnB4", "#btnLabelB4");
    buttons["b5"] = new Button("b5", "#btnB5", "#btnLabelB5");

    buttons["t0"] = new Button("t0", "#btnT0", "#btnLabelT0");
    buttons["t1"] = new Button("t1", "#btnT1", "#btnLabelT1");
    buttons["t2"] = new Button("t2", "#btnT2", "#btnLabelT2");
    buttons["t3"] = new Button("t3", "#btnT3", "#btnLabelT3");
    buttons["t4"] = new Button("t4", "#btnT4", "#btnLabelT4");
    buttons["t5"] = new Button("t5", "#btnT5", "#btnLabelT5");
}


function initializeMFD() {

    console.log("initalize MFD");

    initGlobalFields();
    initializeButtonElements();

    fetch("transferApp.json").then(response => response.json()).then(data => setAppData(data));
    
    buttons["t1"].setActive();
    
}



function onOriginDestinationChange() {

    if (fields["origin"].value != "Origin" && fields["destination"].value != "Destination") {
        activeButton.setInactive();
        buttons["b5"].setActive();
    }
    else{
        buttons["b5"].setDisabled();
        activeButton.setInactive();
    }


}

function initGlobalFields() {

    let setInactive = () => { activeButton.setInactive(); setActiveField("none"); }

    fields["utY"] = { value: 1, dataElement: "input[name='utY']", callback: () => { setActiveField("utD") } };
    fields["utD"] = { value: 1, dataElement: "input[name='utD']", callback: () => { setActiveField("utH") } };
    fields["utH"] = { value: 0, dataElement: "input[name='utH']", callback: () => { setActiveField("utM") } };
    fields["utM"] = { value: 0, dataElement: "input[name='utM']", callback: () => { setActiveField("none"); activeButton.setInactive(); processTimeFields("utY", "utD", "utH", "utM", "utNow", true); } };

    //

    fields["utNow"] = { value: 0, dataElement: "", callback: () => { currentTime = this.value; } };

    fields["origin"] =      { id: "origin",      label: "ORIGIN",      value: "Origin",      x: 0, buttonLabel: '', labelElement: '#junk', dataElement: "#originName",      callback: ()=> {onOriginDestinationChange();} };
    fields["destination"] = { id: "destination", label: "DESTINATION", value: "Destination", x: 0, buttonLabel: '', labelElement: '#junk', dataElement: "#destinationName", callback: ()=> {onOriginDestinationChange();} };


    fields["parkPe"] = { value: 101, dataElement: "input[name='pe']", callback: setInactive };
    fields["parkAp"] = { value: 102, dataElement: "input[name='ap']", callback: setInactive };

    fields["capPe"] = { value: 100,  dataElement: "input[name='pe']", callback: setInactive };
    fields["capAp"] = { value: 100,  dataElement: "input[name='ap']", callback: setInactive };

    fields["ejectPe"] = { value: 101, dataElement: "input[name='pe']", callback: setInactive };
    
    fields["utMean"] = { id: "utMean",  label: "UT",      value: "y1 d1 0:00", labelElement: '#UT',   dataElement: "#junk"};
    fields["toa"]    = { id: "toa",     label: "UT",      value: "y1 d1 0:00", labelElement: '#junk', dataElement: "#junk"};
    
    fields["lnChase"] ={ id: "lnChase", label: "Ln-C",    value: "180",        labelElement: '#junk', dataElement: "#lnChase" };
    fields["lnTarget"]={ id: "lnTarget",label: "Ln-T",    value: "180",        labelElement: '#junk', dataElement: "#lnTarget"};
    fields["lnDiff"] = { id: "lnDiff",  label: "Ln-Diff", value: "180",        labelElement: '#junk', dataElement: "#lnDiff"  };

    fields["txVdepart"] = {value: 1905};

    // PARK - OUTPUT
    
    fields["ejectVpeCir"] = { value: 0, label: "V PE CIR", labelElement: "#table2 tr:eq(1) td:eq(0)", dataElement: "#table2 tr:eq(1) td:eq(1)" };
    fields["ejectVpeHyp"] = { value: 0, label: "V PE HYP", labelElement: "#table2 tr:eq(2) td:eq(0)", dataElement: "#table2 tr:eq(2) td:eq(1)" };
    fields["ejectDv"] = { value: 0, label: "DV EJECT", labelElement: "#table2 tr:eq(3) td:eq(0)", dataElement: "[id^='ejectDv']" };
    fields["ejectTOF"] = { value: 0, label: "TOF TO SOI", labelElement: "#table2 tr:eq(4) td:eq(0)", dataElement: "#table2 tr:eq(4) td:eq(1)" };
    fields["ejectTOD"] = { value: 0, label: "TOD", labelElement: "#table2 tr:eq(5) td:eq(0)", dataElement: "#table2 tr:eq(5) td:eq(1)" };
    fields["ejectAngle"] = { value: 0, label: "EJECTION ANGLE", labelElement: "#table2 tr:eq(6) td:eq(0)", dataElement: "#table2 tr:eq(6) td:eq(1)" };

    // PHASE - INPUT FIELDS

    fields["tPeY"] = { value: 0, dataElement: "input[name='tPeY']", callback: () => { setActiveField("tPeD") } };
    fields["tPeD"] = { value: 0, dataElement: "input[name='tPeD']", callback: () => { setActiveField("tPeH") } };
    fields["tPeH"] = { value: 0, dataElement: "input[name='tPeH']", callback: () => { setActiveField("tPeM") } };
    fields["tPeM"] = { value: 0, dataElement: "input[name='tPeM']", callback: () => { setActiveField("none"); activeButton.setInactive(); } };

    fields["lan"] =   { value: 0, labelElement: "#b3Label", dataElement: "input[name='lan']",   callback: setInactive };
    fields["argPe"] = { value: 0, labelElement: "#b3Label", dataElement: "input[name='argPe']", callback: setInactive };

    //output fields

    fields["lnTx"] = { value: 0, label: "LN DEPART", labelElement: "#table2 tr:eq(1) td:eq(0)", dataElement: "#table2 tr:eq(1) td:eq(1)" };
    fields["phaseMnvT"] = { value: 0, label: "MNV T", labelElement: "#table2 tr:eq(2) td:eq(0)", dataElement: "#table2 tr:eq(2) td:eq(1)" };

    fields["phaseOrbits"] = { value: 0, label: "ORBITS UNTIL DEPART", labelElement: "#table2 tr:eq(3) td:eq(0)", dataElement: "#table2 tr:eq(3) td:eq(1)" };

    fields["phasePe"] = { value: 0, label: "SET PE", labelElement: "#table3 tr:eq(0) td:eq(0)", dataElement: "#table3 tr:eq(0) td:eq(1)" };
    fields["phaseAp"] = { value: 0, label: "SET AP", labelElement: "#table3 tr:eq(1) td:eq(0)", dataElement: "#table3 tr:eq(1) td:eq(1)" };
    fields["phasePeriod"] = { value: 0, label: "SET PERIOD", labelElement: "#table3 tr:eq(2) td:eq(0)", dataElement: "#table3 tr:eq(2) td:eq(1)" };
    fields["phaseDv"] = { value: 0, label: "PHASE DV", labelElement: "#table3 tr:eq(3) td:eq(0)", dataElement: "#table3 tr:eq(3) td:eq(1)" };

    fields["phasePe2"] = { value: 0, label: "SET PE", labelElement: "#table3 tr:eq(0) td:eq(0)", dataElement: "#table3 tr:eq(0) td:eq(2)" };
    fields["phaseAp2"] = { value: 0, label: "SET AP", labelElement: "#table3 tr:eq(1) td:eq(0)", dataElement: "#table3 tr:eq(1) td:eq(2)" };
    fields["phasePeriod2"] = { value: 0, label: "SET PERIOD", labelElement: "#table3 tr:eq(2) td:eq(0)", dataElement: "#table3 tr:eq(2) td:eq(2)" };
    fields["phaseDv2"] = { value: 0, label: "PHASE DV", labelElement: "#table3 tr:eq(3) td:eq(0)", dataElement: "#table3 tr:eq(3) td:eq(2)" };


    // CAPTURE INPUT FIELDS
    

    fields["capVsoi"] = { value: 0, label: "V SOI", labelElement: "#table2 tr:eq(1) td:eq(0)", dataElement: "#table2 tr:eq(1) td:eq(1)" };
    fields["capVpeHyp"] = { value: 0, label: "V PE HYP", labelElement: "#table2 tr:eq(2) td:eq(0)", dataElement: "#table2 tr:eq(2) td:eq(1)" };
    fields["capVpeCir"] = { value: 0, label: "V PE CIR", labelElement: "#table2 tr:eq(3) td:eq(0)", dataElement: "#table2 tr:eq(3) td:eq(1)" };
    fields["capDv"] = { value: 0, label: "CAPTURE DV ", labelElement: "#table2 tr:eq(4) td:eq(0)", dataElement: "[id^='capDv']" };

    //trip summary

    //ejection dv used twice, receiving element qry string uses "starts with" selector
    $("#table1 tr:eq(1) td:eq(1)").attr("id", "ejectDv1");


    $("#table1 tr:eq(3) td:eq(1)").attr("id", "capDv1");
    $("#table2 tr:eq(4) td:eq(1)").attr("id", "capDv2");

    fields["dvPlaneChange"] = { value: 0, label: "PLANE CHANGE", dataElement: "#table1 tr:eq(2) td:eq(1)" };
    fields["dvTotal"] = { value: 0, label: "TOTAL", dataElement: "#table1 tr:eq(4) td:eq(1)" };
}



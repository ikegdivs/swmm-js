// Chartspecs and DataElement should be eliminated, so do not do anything with it.
// dataElements are classes for data row/objects.
class DataElement{
    constructor(cat, y){
        // cat: a category, numeric value.
        //this.cat = new Date(2000, 0, 1, cat.split(':')[0], cat.split(':')[1]);
        this.cat = cat;
        // y: independent numeric value.
        this.y = y;
    }
}

// ChartSpecs holds the general display parameters and data for a chart.
class ChartSpecs {
    // Constructor for parts of the chart that depend upon the data.
    constructor(data){
        // The x/y relational data for the chart.
        this.data = data;

        // Establish the basic parameters of the display
        // The starting position of the chart.
        this.chartBodyX = 50;
        this.chartBodyY = 0;
        // The relative size of the axes.
        this.xScaleWidth = 300;
        this.yScaleHeight = 200;
        // The number of tick marks on the x axis.
        this.numTicks = 5;
        // The amount of space to allocate for text,e etc. on the x and y axes.
        this.textBuffer = 60;
        this.topMargin = 10;

        // Take calcs out of loop functions.
        this.theMax = 0;
        this.theExtents;
    }
    
    // The maximum value of the independent variable.
    get maxVal() {
        return d3.max(this.data, d => d.y);
    }

    // To create a scaling Y function for the chart, use this getter.
    get scaleY() {
        return d3.scaleLinear()
            .range([this.yScaleHeight, 0])
            .domain([0, this.theMax]);
    }

    // To create a scaling X function for the chart, use this getter.
    get scaleX() {
        return d3.scaleTime()
            .range([0, this.xScaleWidth])
            //.domain(d3.extent(this.data, d=>d.cat))
            .domain(this.theExtents)
    }

    setMax(){
        this.theMax = d3.max(this.data, d=>d.y);
    }

    setExtents(){
        this.theExtents = d3.extent(this.data, d=>d.cat)
    }
}


// When the document is loaded:
// Create some data
// Draw a line chart with the data.
document.addEventListener("DOMContentLoaded", function() {

    // Personalization variables.
    let fileName = null;
    let authorName = null;
    let description = null;

    
    /////////////////////////////////////////////
    // Cover modal: for project intros, demos, etc.
    /////////////////////////////////////////////
    $('#modalCover').modal('toggle');

    /////////////////////////////////////////////
    // Visualization elements - temporary
    /////////////////////////////////////////////
    // dataObj is an array of dataElement objects.
    dataObj = [];
    let viz_svg01 = d3.select("#viz_svg01");
    let inpText = null;


    /////////////////////////////////////////////
    // Modal controls.
    /////////////////////////////////////////////
    // Get the modal
    let modal = document.getElementById("myModal");
    $('.modal-backdrop').remove();
    

    /////////////////////////////////////////////
    // Project Tree controls.
    /////////////////////////////////////////////

    // Setting up to process input file.
    Module.onRuntimeInitialized = _ => {
        // Process the metadata file
        // Load info.json
        fetchRetry('./data/info.json', 500, 20, {headers: {'Content-Type': 'application/json', 'Accept': 'application/json'}});
    }

    // Listen for requests to open the default file.
    const demoElement = document.getElementById("nav-file-demo");
    demoElement.addEventListener('click', loadDemo, false);
    function loadDemo() {
        jQuery.get('./data/Mod.inp', function(contents){
            processInput(contents);
        })
    }

    // Listen for requests to create a new file.
    const newFileElement = document.getElementById("nav-file-new");
    newFileElement.addEventListener('click', createNewFile, false);
    function createNewFile() {
        document.getElementById('inpFile').value =
`[TITLE]
;;Project Title/Notes

[OPTIONS]
;;Option             Value
FLOW_UNITS           CFS
INFILTRATION         HORTON
FLOW_ROUTING         KINWAVE
LINK_OFFSETS         DEPTH
MIN_SLOPE            0
ALLOW_PONDING        NO
SKIP_STEADY_STATE    NO

START_DATE           03/26/2021
START_TIME           00:00:00
REPORT_START_DATE    03/26/2021
REPORT_START_TIME    00:00:00
END_DATE             03/26/2021
END_TIME             06:00:00
SWEEP_START          1/1
SWEEP_END            12/31
DRY_DAYS             0
REPORT_STEP          00:15:00
WET_STEP             00:05:00
DRY_STEP             01:00:00
ROUTING_STEP         0:00:30 

INERTIAL_DAMPING     PARTIAL
NORMAL_FLOW_LIMITED  BOTH
FORCE_MAIN_EQUATION  H-W
VARIABLE_STEP        0.75
LENGTHENING_STEP     0
MIN_SURFAREA         0
MAX_TRIALS           0
HEAD_TOLERANCE       0
SYS_FLOW_TOL         5
LAT_FLOW_TOL         5

[EVAPORATION]
;;Evap Data      Parameters
;;-------------- ----------------
CONSTANT         0.0
DRY_ONLY         NO

[REPORT]
;;Reporting Options
INPUT      NO
CONTROLS   NO
SUBCATCHMENTS ALL
NODES ALL
LINKS ALL

[TAGS]

[MAP]
DIMENSIONS 0.000 0.000 10000.000 10000.000
Units      None

[COORDINATES]
;;Node           X-Coord            Y-Coord           
;;-------------- ------------------ ------------------

[VERTICES]
;;Link           X-Coord            Y-Coord           
;;-------------- ------------------ ------------------
`
        processInput(document.getElementById('inpFile').value);
    }

    // Listen for requests to run the simulation.
    const runElement = document.getElementById("nav-project-runsimulation");
    runElement.addEventListener('click', runSimulation, false);
    function runSimulation() {
        //processInput(document.getElementById('inpFile').value);
        // Pop up the processing modal.
        $('#modalSpinner').modal('show')
        runModelClick();
    }


    // Listen for requests to display a project summary.
    const summaryElement = document.getElementById("nav-project-summary");
    summaryElement.addEventListener('click', displayProjectSummary, false);
    function displayProjectSummary(){
        modalProjectSummary();
    }

    // Listen for requests to display a report status 
    const reportstatusElement = document.getElementById("nav-report-status");
    reportstatusElement.addEventListener('click', displayReportStatus, false);
    function displayReportStatus() {
        modalReportStatus();
    }

    // Listen for requests to open an .inp file.
    const inputElement = document.getElementById("nav-file-input");
    inputElement.addEventListener('change', handleFiles, false);
    function handleFiles() {
        const fileList = this.files;

        let fr = new FileReader();
        fr.onload=function(){
            if(fr.result){inpText = 
                processInput(fr.result)
            }
        }

        fr.readAsText(fileList[0]);
    }

    // Listen for requests to change the language:
    const languageElement = document.getElementById("navbarLanguageLink");
    languageElement.addEventListener('click', displayLanguageModal, false);
    function displayLanguageModal() {
        $('#modalLanguage').modal('toggle');
    }
    

    // Listen for requests to request an .inp file from a server.
    /*const serverRequestElement = document.getElementById("nav-file-server");
    serverRequestElement.addEventListener('click', handleServerFiles, false);
    function handleServerFiles() {
        // Show the modal.
        $('#remote-modal').modal('toggle');
        let xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://raw.githubusercontent.com/ikegdivs/ikegdivs.github.io/main/swmm_multimodel/data/input.inp', true);
        xhr.responseType = 'text';
        $('#remoteModalOutput').text('XX10');

        xhr.onload = function(e) {
            window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem
            $('#remoteModalOutput').text('XX12');
            window.requestFileSystem(TEMPORARY, 0, function(fs){
            //window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, function(fs){
                $('#remoteModalOutput').text('XX13');
                fs.root.getFile('input.inp', {create: true}, function(fileEntry){
                    $('#remoteModalOutput').text('XX14');
                    fileEntry.createWriter(function(writer) {
                        writer.onwrite = function(e){}
                        writer.onerror = function(e){}

                        let blob = xhr.response
                        $('#remoteModalOutput').text('XX15');
                        processInput(blob);
                        $('#remoteModalOutput').text('XX16');
                    })
                })
            })
        }

        xhr.send();
    }*/

    // Listen for requests to save an .inp file.
    const saveElement = document.getElementById("save");
    saveElement.addEventListener('click', saveFile, false);
    function saveFile() {
        swmmjs.svg.save();
    }
})


// Read the input file (text). 
// Parse the data into memory. 
// Run the model.

function processInput(inpText){
    try
    {
        $('#modalSpinner').modal('show');
        document.getElementById('inpFile').value = inpText;
        swmmjs.loadModel(swmmjs.Module)
        //swmmjs.run(swmmjs.Module);
        $('#modalSpinner').modal('hide');
    } catch (e) {
        console.log('/input.inp creation failed');
        $('#modalSpinner').modal('hide');
    }
}


// representData draws the chart
// location is an svg where the chart will be drawn.
// theseSpecs is an object of class ChartSpecs
function representData(location, theseSpecs){
    // Create the viewbox. This viewbox helps define the visible portions
    // of the chart, but it also helps when making the chart responsive.
    location.attr('viewBox', ` 0 0 ${theseSpecs.xScaleWidth + theseSpecs.chartBodyX + theseSpecs.textBuffer} ${theseSpecs.yScaleHeight + theseSpecs.textBuffer + theseSpecs.topMargin}`);

    // Add groups to the svg for the body of the chart, the x axis, and the y axis.
    body = location.append('g')
        .attr('id', 'chartBody')
        .attr('transform', `translate(${theseSpecs.chartBodyX}, ${theseSpecs.topMargin})`);
    location.append('g')
        .attr('id', 'yAxis')
        .call(d3.axisLeft(theseSpecs.scaleY))
        .attr('transform', `translate(${theseSpecs.chartBodyX}, ${theseSpecs.topMargin})`);
    location.append('g')
        .attr('id', 'xAxis')
        .attr('transform', `translate(${theseSpecs.chartBodyX}, ${theseSpecs.yScaleHeight + theseSpecs.topMargin})`);

    // Create the location for the line
    body.append('path')

    drawLine(theseSpecs, d3.curveLinear);
}

// drawLine creates the line.
// theseSpecs: an object of class ChartSpecs
// curveType: a d3 curve type
/*function drawLine(theseSpecs, curveType){
    // Create the line
    let line = d3.line()
        .x(function(d) { return theseSpecs.scaleX(d.cat); })
        .y(function(d) { return theseSpecs.scaleY(d.y); })
        .curve(curveType)

    // Create a join on 'path' and the data
    let join = d3.selectAll('#chartBody path')
        .data([theseSpecs.data]);

    // Establish the styles for the line
    join.style('stroke', 'rgba(255, 0, 0, 1')
        .style('fill', 'none')
        .style('stroke-width', '0.2vw')

    // Perform a transition, if there is any data to transition.
    join.transition()
        .duration(1000)
        .attr('d', line)
    
    // Remove any unnecesary objects.
    join.exit()
        .remove()

    // Update the y axis.
    d3.selectAll('#yAxis')
        .call(d3.axisLeft(theseSpecs.scaleY))

    // Update the x axis.
    d3.selectAll('#xAxis')
        .call(
            d3.axisBottom(theseSpecs.scaleX)
            .ticks(5)
            .tickFormat(d3.timeFormat('%Y-%m-%d %H:%M'))
        )
        .selectAll('text')
        //split the date and time onto two lines for the xAxis
        .call(function(t){
            t.each(function(d){
                let self = d3.select(this);
                var s = self.text().split(' ');
                self.text('');
                self.append('tspan')
                    .attr('x', 0)
                    .attr('dy', 0)
                    .text(s[0]);
                self.append('tspan')
                    .attr('x', '-2em')
                    .attr('dy', '1em')
                    .text(s[1]);
            })
        })
        .style('text-anchor', 'end')
        .attr('dx', '-0.8em')
        .attr('dy', '0.15em')
        .attr('transform', 'rotate(-65)');

}*/

function drawLine(theseSpecs, curveType){
    theseSpecs.setMax();
    theseSpecs.setExtents();
    // Create the line
    let line = d3.line()
        .x(function(d) { return theseSpecs.scaleX(d.cat); })
        .y(function(d) { return theseSpecs.scaleY(d.y); })
        .curve(curveType)

    // Create a join on 'path' and the data
    let join = d3.selectAll('#chartBody')
        .append('path')
        .attr('d', line(theseSpecs.data))
        .attr('stroke', 'rgba(255, 125, 125, 1)')
        .attr('stroke-width', '2px')
        .style('fill', 'none')

    // Update the y axis.
    d3.selectAll('#yAxis')
        .call(d3.axisLeft(theseSpecs.scaleY))

    // Update the x axis.
    d3.selectAll('#xAxis')
        .call(
            d3.axisBottom(theseSpecs.scaleX)
            .ticks(5)
            .tickFormat(d3.timeFormat('%Y-%m-%d %H:%M'))
        )
        .selectAll('text')
        //split the date and time onto two lines for the xAxis
        .call(function(t){
            t.each(function(d){
                let self = d3.select(this);
                var s = self.text().split(' ');
                self.text('');
                self.append('tspan')
                    .attr('x', 0)
                    .attr('dy', 0)
                    .text(s[0]);
                self.append('tspan')
                    .attr('x', '-2em')
                    .attr('dy', '1em')
                    .text(s[1]);
            })
        })
        .style('text-anchor', 'end')
        .attr('dx', '-0.8em')
        .attr('dy', '0.15em')
        .attr('transform', 'rotate(-65)');

}

const swmm_run = Module.cwrap('swmm_run', 'number', ['string', 'string', 'string']);

/*function runModelClick(){
    // dataObj is an array of dataElement objects.
    dataObj = [];
    let inpText = null;
    // Create a set of dataElements.

    //Get the input file for parsing:
    // Since we are running a model, it would be a good idea to
    // instead, write the current model objects into a string field,
    // then send that string field to the executable.
    // --1: How does save translate the model to a string:
    //   A: Via svg.save() in swmm.js
    // --2: Can I modify svg.save to instead call a string creation function.
    //      This function can then be called by this click event as well, so no files
    //      need to be saved (though it would be a good idea to save a file before you run it, right?)
    // --3: New function is called svg.dataToInpString().
    // --4: How can I send the inpString to the swmm_run file? it looks like inpText can be used for that.
    fetch('data/info.json')
        .then(response => response.text())
        .then((data) => {
        inpText = swmmjs.svg.dataToInpString();
        
        try
        {
            FS.createPath('/', '/', true, true);
            FS.ignorePermissions = true;
            var f = FS.findObject('input.inp');
            if (f) {
                FS.unlink('input.inp');
            }
            FS.createDataFile('/', 'input.inp', inpText, true, true);

            async function processModel(){
                    swmm_run("/input.inp", "data/Example1x.rpt", "data/out.out");
                    return 1;
            }

            processModel().then(function (){
                let rpt = Module.intArrayToString(FS.findObject('data/Example1x.rpt').contents);
                document.getElementById('rptFile').innerHTML = rpt;
                modalReportStatus();
            })

        } catch (e) {
            console.log('/input.inp creation failed');
            // Remove the processing modal.
            $('#modalSpinner').modal('hide')
            
        } finally{
            // Remove the processing modal.
            $('#modalSpinner').modal('hide')
        }
        console.log('runran')
    })
}*/

/////////////////////////////////////////////////////////////////////////
// Network file functions
/////////////////////////////////////////////////////////////////////////

function wait(delay){
    return new Promise((resolve) => setTimeout(resolve, delay));
}

function fetchRetry(url, delay, tries, fetchOptions = {}){
    function onError(err){
        triesLeft = tries - 1;
        if(!triesLeft){
            throw err;
        }
        return wait(delay).then(() => fetchRetry(url, delay, triesLeft, fetchOptions));
    }

    fetch(url, fetchOptions).then(response => response.json()).catch(onError)
    .then((info) => {
        try{
            $('#loadInfo').text(JSON.stringify(info))
        } catch{
            $('#loadInfo').text(info)
        }
        $('#coverTitle').text(info[0].Title);
        // For each entry in info[0].Files: 
        //  -- add the Title to the dropdown select
        //  -- clicking on the select will:
        //     -- close the modal.
        //     -- load the selected file.
        info[0].Files.forEach(function(value, i) {
            $('#coverDropdown').append('<a class="dropdown-item" id="coverModel'+i+'">'+ value.Title +'</a>')
            document.getElementById("coverModel"+i).addEventListener('click', 
            function () {
                jQuery.get(value.FileLoc, function(contents){
                    processInput(contents);
                })
                $('#modalCover').modal('toggle');
            },
            false)
        })
    }).catch(onError)
}

function runModelClick(){
    // dataObj is an array of dataElement objects.
    dataObj = [];
    let inpText = null;
    // Create a set of dataElements.

    //Get the input file for parsing:
    // Since we are running a model, it would be a good idea to
    // instead, write the current model objects into a string field,
    // then send that string field to the executable.
    // --1: How does save translate the model to a string:
    //   A: Via svg.save() in swmm.js
    // --2: Can I modify svg.save to instead call a string creation function.
    //      This function can then be called by this click event as well, so no files
    //      need to be saved (though it would be a good idea to save a file before you run it, right?)
    // --3: New function is called svg.dataToInpString().
    // --4: How can I send the inpString to the swmm_run file? it looks like inpText can be used for that.
    fetch('data/info.json')
        .then(response => response.text())
        .then((data) => {
        inpText = swmmjs.svg.dataToInpString();
        
        try
        {
            FS.createPath('/', '/', true, true);
            FS.ignorePermissions = true;
            var f = FS.findObject('input.inp');
            if (f) {
                FS.unlink('input.inp');
            }
            FS.createDataFile('/', 'input.inp', inpText, true, true);

            async function processModel(){
                    swmm_run("/input.inp", "data/Example1x.rpt", "data/out.out");
                    return 1;
            }

            processModel().then(function (){
                let rpt = Module.intArrayToString(FS.findObject('data/Example1x.rpt').contents);
                document.getElementById('rptFile').innerHTML = rpt;
                modalReportStatus();
            })

        } catch (e) {
            console.log('/input.inp creation failed');
            // Remove the processing modal.
            $('#modalSpinner').modal('hide')
            
        } finally{
            // Remove the processing modal.
            $('#modalSpinner').modal('hide')
        }
        console.log('runran')
    })
}

/*************************************
 * Ripple effect for buttons
 */

 var buttons = document.body.getElementsByClassName("ripplebutton");

 Array.prototype.forEach.call(buttons, function (btn) {
     btn.addEventListener('click', createRipple);
 });
 
 function createRipple(e) {
     var children = this.getElementsByClassName('wave-ripple');
     while(children.length > 0){
         children[0].parentNode.removeChild(children[0]);
     };
     
     for(let i = 0; i < 4; i++){
        var circle = document.createElement('div');
        circle.style["position"] = 'absolute';  
        this.appendChild(circle);      
    
        var d = Math.max(this.clientWidth, this.clientHeight);
        var eRect = this.getBoundingClientRect()
        
        circle.style.width = circle.style.height = d*(10+2*i)/10 + 'px';
        circle.style.left = e.clientX - eRect.left - d / 2 + 'px';
        circle.style.top = e.clientY - eRect.top - d / 2 + 'px';
        circle.classList.add('wave-ripple');
     }
 }
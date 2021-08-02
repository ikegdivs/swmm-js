// This is a support file for the demo_001.html page. 
// This is test code that will be considered for incorporation to presentation scripts.
// 

// This code should:
//   - Load up data for a given model (demo_001.inp, demo_001.rpt, demo_001.out).
//   - Present the model in a spatial display.
//   - Describe the demo.
//   - Show the input rainfail pattern.
//   - Show the output pipe flow for a given pipe.




// When the document is loaded:
// Create some data
// Draw a line chart with the data.
document.addEventListener("DOMContentLoaded", function() {
    // Open up the file for the article.
    // This should not be hardcoded, it should be found in the article markdown file.
    // Yes, this is an indicator of the need for proper file interaction.
    // Open the input file.
    jQuery.get('./data/demo_001.inp', function(contents){
        processInput(contents);
        buildSwitchList();
        demoRun();
    })
})

function demoRun(){
    // dataObj is an array of dataElement objects.
    dataObj = [];
    let inpText = null;
    // Create a set of dataElements.

    //Get the input file for parsing:
    // Since we are running a model, it would be a good idea to
    // write the current model objects into a string field,
    // then send that string field to the executable.
    // --1: Translate the model to a string vSia svg.save() in swmm.js
    // --2: Modify svg.save to instead call a string creation function.
    //      This function can then be called by this click event as well, so no files
    //      need to be saved (though it would be a good idea to save a file before you run it, right?)
    // --3: New function is called svg.dataToInpString().
    // --4: To send the inpString to the swmm_run file, inpText can be used.
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

                async function createFile(){
                    FS.createDataFile('/', 'input.inp', inpText, true, true)
                    return 0;
                }

                createFile().then(
                    processModel().then(function (){
                        demoChart();
                    })
                )

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

// When results target has been fully identified by the user,
// clicking this button will show a time-based plot of the results for that object.
function demoChart(){
    let dataObj = [];
    // Identify where the chart will be drawn.
    let viz_svg01 = d3.select("#demo_svg_01");

    // Get the swmmresult.  This should be redone once I can actually drag in single variables instead of 
    // reading the whole file into objects.
    input = new d3.swmmresult();
    // Once again, this should be a model-associated constant.
    val = input.parse('data/out.out');

    // Get the ID and type of the object that will be charted, and get the type of information that is necessary as well.
    let objectName = '10'
    let objectType = 'LINK'
    let variable = '1'
    
    // First: Utilize the start and end times of the model, along with the time step in order to create the fully realized chart.
    let reportStartDate = '01/01/1998';
    let reportStartTime = '00:00:00';
    let reportStep =      '00:01:00';

    // Create a date object using the reportStartDate and reportStartTime.
    let thisDateStep = moment(reportStartDate + ' ' + reportStartTime);
    // Create a duration object using reportStep.
    let stepDuration = moment.duration(reportStep)
    // For every step, increase the time by the value of reportStep.
    for(let i = 1; !!val[i]; i++){
        // Use the incremented date object 
        let thisDate = moment(new Date(thisDateStep));
        //dataObj.push(new DataElement('00:'+i.toString().padStart(2, '0'), val[i][objectType][parseInt(objectName)][parseInt(variable)]));
        dataObj.push(new DataElement(thisDate._d, val[i][objectType][objectName][parseInt(variable)]));
        // increment thisDateStep
        thisDateStep.add(stepDuration)
    }

    // Create a new chartSpecs object and populate it with the data.
    theseSpecs = new ChartSpecs(dataObj);

    //$("#viz_svgTS").empty();
    $('#demo_svg_01').empty();
    // Prepare the chart and draw it.
    representData(viz_svg01, theseSpecs);
}

// Call this function after the model has loaded.
// For every junction, add an <li><div><input><label> to the #demo001-list <ul>
// After adding the <li>, add a .change() to the <input> that
// references the name of the node.
function buildSwitchList(){
    // For every conduit,
    swmmjs.model.CONDUITS.forEach((cond, index) => {
        // Add a <li><div><input><label> to the list
        document.getElementById('demo001-list').insertAdjacentHTML('beforeend', `<li style="margin-top: 5px; padding-top: 5px;">
            <div class="custom-control custom-switch">
            <input class="custom-control-input" type="checkbox" id="option`+ index +`">
            <label class="custom-control-label" style="transform: scale(1.5)" stylefor="option`+ index +`" for="option`+ index +`">Link `+ index +`</label>
            </div>
            </li>`)
        // Add a toggle function to new element
        // On use of the demo toggle, include inflow to a node in the model
        $('#option'+index).change(function(){
            // if the toggle is on, add the node inflow marker to the node.
            if($(this).prop('checked') === true){
                cond.Roughness = 0.024;
            } else {
                // remove any inflow to the node
                cond.Roughness = 0.012;
            }

            // Rerun the model:
            demoRun();
        })
    })
}


// When the document is loaded:
// Create some data
// Draw a line chart with the data.
function drawTimeseries(){
    // dataObj is an array of dataElement objects.
    dataObj = [];
    let viz_svg01 = d3.select("#viz_svg01");

    // Create a set of 10 dataElements.
    /*for(i = 0; i < 10; i++){
        dataObj.push(new DataElement(i, i));
    }*/
    let table = Tabulator.prototype.findTable('#tableTimeseries')[0];
    id = $('#timeseries-name').val()

    table.getData().forEach(function(el){
        // - 3: Place a new entry in the timeseries entries with el.TimeSeries = id
        //swmmjs.model['TIMESERIES'].push({TimeSeries:id, Value:el.Value, Date:el.Date, Time:el.Time})
        dataObj.push(new DataElement(el.Time, el.Value))
    })
    
    // Create a new chartSpecs object and populate it with the data.
    theseSpecs = new ChartSpecs(dataObj);

    // Prepare the chart and draw it.
    representData(viz_svg01, theseSpecs);

    // If the user changes the selection on the dropdown selection box, adjust the curve function of the chart line.
    /*$('#formControlSelector').on('change', function(event){
        // Get the input from the drop down.
        userVal = $(event.currentTarget).prop('value');

        drawLine(theseSpecs, d3[userVal])
    })*/
}

function doStuff(location, theseSpecs){
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
        .call(d3.axisBottom(theseSpecs.scaleX))
        .attr('transform', `translate(${theseSpecs.chartBodyX}, ${theseSpecs.yScaleHeight + theseSpecs.topMargin})`);

    // Create the location for the line
    body.append('path')

    drawLine(theseSpecs, d3.curveLinear);
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
        .call(d3.axisBottom(theseSpecs.scaleX))
        .attr('transform', `translate(${theseSpecs.chartBodyX}, ${theseSpecs.yScaleHeight + theseSpecs.topMargin})`);

    // Create the location for the line
    body.append('path')

    drawLine(theseSpecs, d3.curveLinear);
}

// drawLine creates the line.
// theseSpecs: an object of class ChartSpecs
// curveType: a d3 curve type
function drawLine(theseSpecs, curveType){
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
        .call(d3.axisBottom(theseSpecs.scaleX))
}






// Parser for SWMM INP files
d3.inp = function() {
    function inp() {
    }

    inp.bindVals = function(){
        // Get the modal
        var modal = document.getElementById("myModal");

        // Get the <span> element that closes the modal
        var span = document.getElementsByClassName("close")[0];

        
        // Alter display property of a group of elements.
        function hideOrShow(classDesc, displayType){
            items = document.getElementsByClassName(classDesc);
            Array.from(items).forEach(item => {
                item.style.display = displayType;
                item.value = '';
            })
        }

        // When the user clicks on <span> (x), close the modal
        span.onclick = function() {
            modal.style.display = "none";
            // Make the edit texts disappear
            hideOrShow('modaledit', 'none');
            // Make the labels disappear.
            hideOrShow('modallabel', 'none');
        }

        // When the user clicks anywhere outside of the modal, close it
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
                // Make the edit texts disappear
                hideOrShow('modaledit', 'none');
                // Make the labels disappear.
                hideOrShow('modallabel', 'none');
            }
        }

        // Populates and displays a modal based upon the string in parentObject, using the data associated with itemID.
        function populateModalByParentID(parentObject, itemID){
            if(parentObject === '#modalInflows'){
                populateModalInflows(itemID)
            }
        }

        function populateModalInflows(itemID){
            // iterator
            let index = 0;
            // parent element is the modal dialog
            let parent = document.getElementById('#modalInflows');
            // current row element
            let thisRow = null;
            // current column element.
            let thisCol = null;
            // generic element
            let thisEl = null;

            if(!parent){
                console.log('Could not populate general modal');
                return null;
            }

            // Remove save button event listeners via cloning
            $('#save-general-modal').off();
            let oEl = document.getElementById('save-general-modal');
            let nEl = oEl.cloneNode(true);
            oEl.parentNode.replaceChild(nEl, oEl);
            // Clean up the modal
            while(parent.firstChild){
                parent.removeChild(parent.firstChild);
            }

            // Print the objectID
            thisEl = parent.appendChild(document.createElement('p'));
            thisEl.classList.add('modalinfo')
            thisEl.id = 'testid';
            thisEl.innerText = itemID; 
        }

        //Add input and label elements to modal using an ID structure.
        // For modals that do not use an ID strcture, try populateModal().
        // Input to this function is an array of objects of the format:
        //
        // [{inputName: 'Invert',           The name of the variable when accessed through the parent object.
        //   labelText: 'Invert',           The text that will show in the label for the input.
        //   inputType: 'text',             The type of data that is expected for the input object.
        //   parentObject: 'JUNCTIONS'}]    The name of the parent object.
        //                 or
        //                 '#modalID'}]     The id of the modal that this button will call.
        // To use this structure, call swmmjs.model.[parentObject][itemID][inputName]
        function populateModalID(inputArray, itemID){
            // iterator
            let index = 0;
            // parent element is the modal dialog
            let parent = document.getElementById('generalModal');
            // current row element
            let thisRow = null;
            // current column element.
            let thisCol = null;
            // generic element
            let thisEl = null;

            if(!parent){
                console.log('Could not populate general modal');
                return null;
            }

            // Remove save button event listeners via cloning
            $('#save-general-modal').off();
            let oEl = document.getElementById('save-general-modal');
            let nEl = oEl.cloneNode(true);
            oEl.parentNode.replaceChild(nEl, oEl);
            // Clean up the modal
            while(parent.firstChild){
                parent.removeChild(parent.firstChild);
            }

            // Add an input element
            thisEl = parent.appendChild(document.createElement('p'));
            thisEl.classList.add('modalinfo')
            thisEl.id = 'testid';
            thisEl.innerText = itemID; 

            // For every entry in the inputArray
            inputArray.forEach(item => {
                // Create the modalLabelId and modalEditId strings
                let modalLabelId = 'modallabel' + (index + 1).toString().padStart(2, '0');
                let modalEditId =  'modaledit' + (index + 1).toString().padStart(2, '0');

                // If this is the first entry in this row, create the form-row object
                if(index % 2 == 0){
                    thisRow = parent.appendChild(document.createElement('div'));
                    thisRow.classList.add('form-row');
                }

                // Add a column div
                thisCol = thisRow.appendChild(document.createElement('div'));
                thisCol.classList.add('col-md-6');
                thisCol.classList.add('mb-6');

                // Add a label element
                thisEl = thisCol.appendChild(document.createElement('label'));
                thisEl.classList.add('modallabel');
                thisEl.id = modalLabelId;
                thisEl.setAttribute('for', modalEditId);
                thisEl.innerText = item.labelText;

                // Add an input element
                thisEl = thisCol.appendChild(document.createElement('input'));
                thisEl.classList.add('form-control')
                thisEl.classList.add('modaledit')
                thisEl.id = modalEditId;
                thisEl.setAttribute('name', modalEditId);
                thisEl.setAttribute('type', item.inputType);

                if(item.parentObject==='TAGS'){
                    // With tags, links and nodes can both have the same id, so the menu needs to 
                    // know if the tag is for a node or a junction.
                    if(item.inputName==='Node'){
                        // Check for object.type='Node' and object.ID = itemID;
                        function tagQuery(thisObj){
                            return thisObj.Type==='Node' && thisObj.ID === itemID; 
                        }
                        // For every tag element
                        let thisArray = Object.values(swmmjs.model[item.parentObject]);

                        let thisEl = thisArray.findIndex(tagQuery);
                        if(thisEl >= 0){
                            document.getElementById(modalEditId).value = swmmjs.model[item.parentObject][thisEl].Tag;
                        } else {
                            document.getElementById(modalEditId).value = '';
                        }
                    }
                } else {
                    // If type === 'button', give the button some text
                    if(item.inputType==='button'){
                        thisEl.value = 'Edit';
                        thisEl.classList.add('btn-secondary');
                        thisEl.setAttribute('data-toggle', 'modal');
                        thisEl.setAttribute('data-target', item.parentObject);

                        // Add an event to handle clicks. These usually bring up a modal for editing.
                        $(thisEl).click(function(e){
                            // populateModalByParentID populates and displays modals based upon the 
                            // modalID passed in this object as parentObject.
                            populateModalByParentID(item.parentObject, itemID);
                        })


                    } else{
                        // If type is 'text', just place the value into the text box.
                        thisEl.value = swmmjs.model[item.parentObject][itemID][item.inputName]
                    }
                }

                // Add a tooltip element
                thisEl = thisCol.appendChild(document.createElement('div'));
                thisEl.classList.add('valid-tooltip');
                thisEl.innerText = 'Valid entry';

                // Save the values if the 'Save' button is clicked.
                document.getElementById('save-general-modal').addEventListener('click', ()=>{
                    if(item.parentObject==='TAGS'){
                        if(document.getElementById(modalEditId).value.length > 0){
                            // With tags, links and nodes can both have the same id, so the menu needs to 
                            // know if the tag is for a node or a junction.
                            if(item.inputName==='Node'){
                                // Check for object.type='Node' and object.ID = itemID;
                                function tagQuery(thisObj){
                                    return thisObj.Type==='Node' && thisObj.ID === itemID; 
                                }
                                // For every tag element
                                let thisArray = Object.values(swmmjs.model[item.parentObject]);

                                let thisEl = thisArray.findIndex(tagQuery);
                                if(thisEl >= 0){
                                    swmmjs.model[item.parentObject][thisEl].Tag = document.getElementById(modalEditId).value;
                                } else {
                                    let arraySize = Object.keys(swmmjs.model[item.parentObject]).length
                                    swmmjs.model[item.parentObject][arraySize] = [];
                                    swmmjs.model[item.parentObject][arraySize].Type = 'Node';
                                    swmmjs.model[item.parentObject][arraySize].ID = itemID;
                                    swmmjs.model[item.parentObject][arraySize].Tag = document.getElementById(modalEditId).value;
                                }
                            }
                        }
                    } else {
                        if(swmmjs.model[item.parentObject][itemID][item.inputName]){
                            swmmjs.model[item.parentObject][itemID][item.inputName] = document.getElementById(modalEditId).value;
                        }
                        
                    }
                })

                // Increase the iterator.
                index++;
            })
        }

        //Add input and label elements to modal using an ID structure.
        // For modals that do not use an ID strcture, try populateModal().
        // Input to this function is an array of objects of the format:
        //
        // [{inputName: 'Invert',           The name of the variable when accessed through the parent object.
        //   labelText: 'Invert',           The text that will show in the label for the input.
        //   inputType: 'text',             The type of data that is expected for the input object.
        //   parentObject: 'JUNCTIONS'}]    The name of the parent object.
        // To use this structure, call swmmjs.model.[parentObject][itemID][inputName]
        function populateSecondaryModalID(inputArray, itemID){
            // iterator
            let index = 0;
            // parent element is the modal dialog
            let parent = document.getElementById('generalModal2');
            // current row element
            let thisRow = null;
            // current column element.
            let thisCol = null;
            // generic element
            let thisEl = null;

            if(!parent){
                console.log('Could not populate general modal');
                return null;
            }

            // Remove save button event listeners via cloning
            $('#save-general-modal2').off();
            let oEl = document.getElementById('save-general-modal2');
            let nEl = oEl.cloneNode(true);
            oEl.parentNode.replaceChild(nEl, oEl);
            // Clean up the modal
            while(parent.firstChild){
                parent.removeChild(parent.firstChild);
            }

            // Add an input element
            thisEl = parent.appendChild(document.createElement('p'));
            thisEl.classList.add('modalinfo')
            thisEl.id = 'testid2';
            thisEl.innerText = itemID; 

            // For every entry in the inputArray
            inputArray.forEach(item => {
                // Create the modalLabelId and modalEditId strings
                let modalLabelId = 'modal2label' + (index + 1).toString().padStart(2, '0');
                let modalEditId =  'modal2edit' + (index + 1).toString().padStart(2, '0');

                // If this is the first entry in this row, create the form-row object
                if(index % 2 == 0){
                    thisRow = parent.appendChild(document.createElement('div'));
                    thisRow.classList.add('form-row');
                }

                // Add a column div
                thisCol = thisRow.appendChild(document.createElement('div'));
                thisCol.classList.add('col-md-6');
                thisCol.classList.add('mb-6');

                // Add a label element
                thisEl = thisCol.appendChild(document.createElement('label'));
                thisEl.classList.add('modallabel');
                thisEl.id = modalLabelId;
                thisEl.setAttribute('for', modalEditId);
                thisEl.innerText = item.labelText;

                // Add an input element
                thisEl = thisCol.appendChild(document.createElement('input'));
                thisEl.classList.add('form-control')
                thisEl.classList.add('modaledit')
                thisEl.id = modalEditId;
                thisEl.setAttribute('name', modalEditId);
                thisEl.setAttribute('type', item.inputType);
                
                // If type is 'text', just place the value into the text box.
                thisEl.value = swmmjs.model[item.parentObject][itemID][item.inputName];

                // Add a tooltip element
                thisEl = thisCol.appendChild(document.createElement('div'));
                thisEl.classList.add('valid-tooltip');
                thisEl.innerText = 'Valid entry';

                // Save the values if the 'Save' button is clicked.
                document.getElementById('save-general-modal').addEventListener('click', ()=>{
                    if(swmmjs.model[item.parentObject][itemID][item.inputName]){
                        swmmjs.model[item.parentObject][itemID][item.inputName] = document.getElementById(modalEditId).value;
                    }
                })

                // Increase the iterator.
                index++;
            })
        }

        //Add input and label elements to modal using an ID structure.
        // Input to this function is an array of objects of the format:
        //
        // [{inputName: 'Invert',           The name of the variable when accessed through the parent object.
        //   labelText: 'Invert',           The text that will show in the label for the input.
        //   inputType: 'text',             The type of data that is expected for the input object.
        //   parentObject: 'JUNCTIONS'}]    The name of the parent object.
        // To use this structure, call swmmjs.model.[parentObject][inputName]
        function populateModal(inputArray){
            // iterator
            let index = 0;
            // parent element is the modal dialog
            let parent = document.getElementById('generalModal');
            // current row element
            let thisRow = null;
            // current column element.
            let thisCol = null;
            // generic element
            let thisEl = null;
            let oEl = document.getElementById('save-general-modal');
            let nEl = oEl.cloneNode(true);

            if(!parent){
                console.log('Could not populate general modal');
                return null;
            }

            // Remove save button event listeners via cloning
            $('#save-general-modal').off();
            oEl.parentNode.replaceChild(nEl, oEl);
            // Clean up the modal
            while(parent.firstChild){
                parent.removeChild(parent.firstChild);
            }

            // Add an input element
            thisEl = parent.appendChild(document.createElement('p'));
            thisEl.classList.add('modalinfo')

            // For every entry in the inputArray
            inputArray.forEach(item => {
                // Create the modalLabelId and modalEditId strings
                let modalLabelId = 'modallabel' + (index + 1).toString().padStart(2, '0');
                let modalEditId =  'modaledit' + (index + 1).toString().padStart(2, '0');

                // If this is the first entry in this row, create the form-row object
                if(index % 2 == 0){
                    thisRow = parent.appendChild(document.createElement('div'));
                    thisRow.classList.add('form-row');
                }

                // Add a column div
                thisCol = thisRow.appendChild(document.createElement('div'));
                thisCol.classList.add('col-md-6');
                thisCol.classList.add('mb-6');

                // Add a label element
                thisEl = thisCol.appendChild(document.createElement('label'));
                thisEl.classList.add('modallabel');
                thisEl.id = modalLabelId;
                thisEl.setAttribute('for', modalEditId);
                thisEl.innerText = item.labelText;

                // Add an input element
                thisEl = thisCol.appendChild(document.createElement('input'));
                thisEl.classList.add('form-control')
                thisEl.classList.add('modaledit')
                thisEl.id = modalEditId;
                thisEl.setAttribute('name', modalEditId);
                thisEl.setAttribute('type', item.inputType);
                thisEl.value = swmmjs.model[item.parentObject][item.inputName].Value

                // Add a tooltip element
                thisEl = thisCol.appendChild(document.createElement('div'));
                thisEl.classList.add('valid-tooltip');
                thisEl.innerText = 'Valid entry';

                // Save the values if the 'Save' button is clicked.
                document.getElementById('save-general-modal').addEventListener('click', ()=>{
                    swmmjs.model[item.parentObject][item.inputName].Value = document.getElementById(modalEditId).value;
                })

                // Increase the iterator.
                index++;
            })
        }

        // When creating new nodes, you will need a unique node id
        function getUniqueNodeID(){
            let id = 0;
            let idList = [];
            // Push indexes from JUNCTIONS to numlist
            swmmjs.model.JUNCTIONS.forEach(function(value, i){
                idList.push(i);
            })
            // Push indexes from SUBCATCHMENTS to numlist
            swmmjs.model.SUBCATCHMENTS.forEach(function(value, i){
                idList.push(i);
            })
            // Push indexes from OUTFALLS to numlist
            swmmjs.model.OUTFALLS.forEach(function(value, i){
                idList.push(i);
            })
            // Push indexes from DIVIDERS to numlist
            swmmjs.model.DIVIDERS.forEach(function(value, i){
                idList.push(i);
            })
            // Push indexes from STORAGE to numlist
            swmmjs.model.STORAGE.forEach(function(value, i){
                idList.push(i);
            })

            // Get the first integer that is not in numlist
            for(let i = 1; id === 0; i++){
                if(idList.indexOf(i) === -1){
                    id = i;
                }
            }

            return id;
        }

        // When creating new raingages, you will need a unique node id
        function getUniqueRaingageID(){
            let id = 0;
            let idList = [];
            // Push indexes from JUNCTIONS to numlist
            swmmjs.model.RAINGAGES.forEach(function(value, i){
                idList.push(i);
            })

            // Get the first integer that is not in numlist
            for(let i = 1; id === 0; i++){
                if(idList.indexOf(i) === -1){
                    id = i;
                }
            }

            return id;
        }

        // When creating new nodes, you will need a unique node id
        function getUniqueLinkID(){
            let id = 0;
            let idList = [];
            // Push indexes from JUNCTIONS to numlist
            swmmjs.model.CONDUITS.forEach(function(value, i){
                idList.push(i);
            })
            // Push indexes from SUBCATCHMENTS to numlist
            swmmjs.model.PUMPS.forEach(function(value, i){
                idList.push(i);
            })
            // Push indexes from OUTFALLS to numlist
            swmmjs.model.ORIFICES.forEach(function(value, i){
                idList.push(i);
            })
            // Push indexes from DIVIDERS to numlist
            swmmjs.model.WEIRS.forEach(function(value, i){
                idList.push(i);
            })
            // Push indexes from STORAGE to numlist
            swmmjs.model.OUTLETS.forEach(function(value, i){
                idList.push(i);
            })

            // Get the first integer that is not in numlist
            for(let i = 1; id === 0; i++){
                if(idList.indexOf(i) === -1){
                    id = i;
                }
            }

            return id;
        }

        function getUniqueTimeseriesID(){
            let id = 0;
            let idList = [];
            // Push indexes from TIMESERIES to numlist
            swmmjs.model.TIMESERIES.forEach(function(value, i){
                idList.push(value.TimeSeries);
            })

            // Get the first integer that is not in numlist
            for(let i = 1; id === 0; i++){
                if(idList.indexOf(i) === -1 && idList.indexOf(i.toString()) === -1){
                    id = i;
                }
            }

            return id;
        }

        // Clicking on the chart button creates the intro modal interface for time series plotting
        // This is not the same as "Time Series", which is an input object type.
        // This is for viewing results.
        $('#btnPMChart').click(function(e){
            // Show the modal.
            $('#modalTSPlotSelection').modal('toggle');
        })

        // Changing the tsplotselection-objecttype should fill the selection dropdown with available ids,
        // as well as filling the tsplotselection-variable drop down
        $('#tsplotselection-objecttype').on('change', function(){
            input = new d3.swmmresult();
            val = input.parse('data/out.out');
            let objectType = $('#tsplotselection-objecttype').val();
            let selected = 'selected'
            let objectVarType = 0;
            $('#tsplotselection-objectname').empty();
            Object.entries(val[1][objectType]).forEach(el => {
                // populate #tsplotselection-objectname with <option> elements
                $('#tsplotselection-objectname').append('<option value="'+el[0]+'" '+selected+'>'+el[0]+'</option>')
                selected = '';
            })

            selected = 'selected'
            $('#tsplotselection-variable').empty();
            if( $('#tsplotselection-objecttype').val() === 'SUBCATCH'){
                objectVarType = 0
            } else if($('#tsplotselection-objecttype').val() === 'NODE'){
                objectVarType = 1
            } else if($('#tsplotselection-objecttype').val() === 'LINK'){
                objectVarType = 2
            }
            Object.entries(input.VARCODE[objectVarType]).forEach(el => {
                // populate #tsplotselection-variable with <option> elements
                $('#tsplotselection-variable').append('<option value="'+el[0]+'" '+selected+'>'+el[1]+'</option>')
                selected = '';
            })
        })


        // When results target has been fully identified by the user,
        // clicking this button will show a time-based plot of the results for that object.
        $('#modal-timepatterns-display').click(function(e){
            // Show the modal
            $('#modalTSPlot').modal('toggle');
            let dataObj = [];
            let viz_svg01 = d3.select("#viz_svgTS");

            input = new d3.swmmresult();
            val = input.parse('data/out.out');

            let objectName = document.getElementById('tsplotselection-objectname').value;
            let objectType = document.getElementById('tsplotselection-objecttype').value;
            let variable = document.getElementById('tsplotselection-variable').value;
            for(let i = 1; !!val[i]; i++){
                dataObj.push(new DataElement('00:'+i.toString().padStart(2, '0'), val[i][objectType][parseInt(objectName)][parseInt(variable)]));
            }
        
            // Create a new chartSpecs object and populate it with the data.
            theseSpecs = new ChartSpecs(dataObj);

            // Prepare the chart and draw it.
            representData(viz_svg01, theseSpecs);
        })

        // Enable clicking to create entities
        $('#btnPMAdd').click(function(e){
            let svg = d3.select('#svgSimple');

            // switch statements on the current target of the subselectcaption div
            if($('#subselectcaption').text() === 'Rain Gages'){
                // Set the click effect to 'createJunction'
                swmmjs.model.clickEffect = 'createRaingage';

                svg.on('click', function() {
                    // If the model is not in create junction mode, return.
                    if(swmmjs.model.clickEffect !== 'createRaingage'){
                        svg.on('click', null);
                        return;
                    // Change the model click effect to edit.
                    } else {
                        swmmjs.model.clickEffect = 'edit';
                    }

                    let xy = d3.mouse(this);
                    let transform = d3.zoomTransform(svg.node());
                    let xy1 = transform.invert(xy);
                    let id = 0;

                    // Create a new id
                    id = getUniqueRaingageID();

                    swmmjs.model.RAINGAGES[id] = {Description: '', Format: 'INTENSITY', Interval: '1:00', SCF: 1.0, Source: 'TIMESERIES', SeriesName: '*', FileName: '*', StationID: '*', RainUnits: 'IN'}

                    swmmjs.model['SYMBOLS'][id] = [];
                    swmmjs.model['SYMBOLS'][id]['XCoord'] = Math.floor(xy1[0])
                    swmmjs.model['SYMBOLS'][id]['YCoord'] = Math.floor(swmmjs.svg.top - xy1[1])

                    d3.select('#svgSimple').select('g').append('g').attr('id', id).attr('class', 'symbol_ graingage').append('circle')
                        .attr('cx', xy1[0])
                        .attr('cy', xy1[1])
                        .attr('r', swmmjs.svg.nodeSize)
                        .attr('data-x', xy1[0])
                        .attr('data-y', xy1[1])
                        .attr('onclick', 'modalEditRaingages('+id+');')
                        .attr('title', id)
                        .attr('onmouseover', 'swmmjs.svg.tooltip(evt.target)')
                        .attr('onmouseout', 'swmmjs.svg.clearTooltips(evt.target)')
                        .attr('class', 'raingage')
                        .attr('fill', 'rgba(125, 125, 255, 1)');

                    // Spawn an editing window for the junction object
                    modalEditRaingages(id);

                    swmmjs.model.clickEffect = 'edit';
                    svg.on('click', null);
                    populateRaingagesList();
                })
            }

            // switch statements on the current target of the subselectcaption div
            if($('#subselectcaption').text() === 'Junctions'){
                // Set the click effect to 'createJunction'
                swmmjs.model.clickEffect = 'createJunction';

                svg.on('click', function() {
                    // If the model is not in create junction mode, return.
                    if(swmmjs.model.clickEffect !== 'createJunction'){
                        svg.on('click', null);
                        return;
                    // Change the model click effect to edit.
                    } else {
                        swmmjs.model.clickEffect = 'edit';
                    }

                    let xy = d3.mouse(this);
                    let transform = d3.zoomTransform(svg.node());
                    let xy1 = transform.invert(xy);
                    let id = 0;

                    // Create a new id
                    id = getUniqueNodeID();

                    swmmjs.model.JUNCTIONS[id] = {Description: '', Invert: 0, Dmax: 0, Dinit: 0, Dsurch: 0, Aponded: 0}

                    swmmjs.model['COORDINATES'][id] = [];
                    swmmjs.model['COORDINATES'][id]['x'] = Math.floor(xy1[0])
                    swmmjs.model['COORDINATES'][id]['y'] = Math.floor(swmmjs.svg.top - xy1[1])

                    color = (swmmjs.INPUT === swmmjs.mode ? swmmjs.defaultColor: nodeColors[r(v)]);
                    d3.select('#svgSimple').select('g').append('g').attr('id', id).attr('class', 'node_ gjunction').append('circle')
                        .attr('cx', xy1[0])
                        .attr('cy', xy1[1])
                        .attr('r', swmmjs.svg.nodeSize)
                        .attr('data-x', xy1[0])
                        .attr('data-y', xy1[1])
                        .attr('onclick', 'modalEditJunctions('+id+');')
                        .attr('title', id)
                        .attr('onmouseover', 'swmmjs.svg.tooltip(evt.target)')
                        .attr('onmouseout', 'swmmjs.svg.clearTooltips(evt.target)')
                            .attr('class', 'junction')
                        .attr('fill', color);
                        
                    // Spawn an editing window for the junction object
                    modalEditJunctions(id);

                    swmmjs.model.clickEffect = 'edit';
                    svg.on('click', null);
                    populateJunctionsList();
                })
            }

            if($('#subselectcaption').text() === 'Outfalls'){
                // Set the click effect to 'createOutfall'
                swmmjs.model.clickEffect = 'createOutfall';

                svg.on('click', function() {
                    // If the model is not in create outfall mode, return.
                    if(swmmjs.model.clickEffect !== 'createOutfall'){
                        svg.on('click', null);
                        return;
                    // Change the model click effect to edit.
                    } else {
                        swmmjs.model.clickEffect = 'edit';
                    }

                    let xy = d3.mouse(this);
                    let transform = d3.zoomTransform(svg.node());
                    let xy1 = transform.invert(xy);
                    let id = 0;

                    // Create a new id
                    id = getUniqueNodeID();

                    swmmjs.model.OUTFALLS[id] = {Description: '', Inflows: 'NO', StageData: '', Treatment: 'NO', Invert: 0, Gated: 'NO', Type: 'FREE'}

                    swmmjs.model['COORDINATES'][id] = [];
                    swmmjs.model['COORDINATES'][id]['x'] = Math.floor(xy1[0])
                    swmmjs.model['COORDINATES'][id]['y'] = Math.floor(swmmjs.svg.top - xy1[1])

                    color = (swmmjs.INPUT === swmmjs.mode ? swmmjs.defaultColor: nodeColors[r(v)]);
                    d3.select('#svgSimple').select('g').append('g').attr('id', id).attr('class', 'node_ goutfall').append('polygon')
                    .attr('points', (xy1[0] - swmmjs.svg.nodeSize) + ' ' + (xy1[1] - swmmjs.svg.nodeSize) + ' ' +
                    (xy1[0] + swmmjs.svg.nodeSize) + ' ' + (xy1[1] - swmmjs.svg.nodeSize) + ' ' +
                    xy1[0] + ' ' + (xy1[1] + swmmjs.svg.nodeSize))
                    .attr('title', id)
                    .attr('data-x', xy1[0])
                    .attr('data-y', xy1[1])
                    .attr('data-y0', swmmjs.svg.top - xy1[1])
                    .attr('onclick', 'modalEditOutfalls('+id+');')
                    .attr('onmouseover', 'swmmjs.svg.tooltip(evt.target)')
                    .attr('onmouseout', 'swmmjs.svg.clearTooltips(evt.target)')
                        .attr('class', 'outfall')
                    .attr('fill', color);
                        
                    // Spawn an editing window for the junction object
                    modalEditOutfalls(id);

                    swmmjs.model.clickEffect = 'edit';
                    svg.on('click', null);
                    
                    // Refresh the selection list
                    populateOutfallsList();
                })
            }

            if($('#subselectcaption').text() === 'Dividers'){
                // Set the click effect to 'createDivider'
                swmmjs.model.clickEffect = 'createDivider';

                svg.on('click', function() {
                    // If the model is not in create divider mode, return.
                    if(swmmjs.model.clickEffect !== 'createDivider'){
                        svg.on('click', null);
                        return;
                    // Change the model click effect to edit.
                    } else {
                        swmmjs.model.clickEffect = 'edit';
                    }

                    let xy = d3.mouse(this);
                    let transform = d3.zoomTransform(svg.node());
                    let xy1 = transform.invert(xy);
                    let id = 0;

                    // Create a new id
                    id = getUniqueNodeID();

                    // Dividers have a funny table structure. The structure is dependent upon the 'Type' value. 
                    // The divider data is under the column of 'Parameters'. Every time the 'Type' changes, the parameters must also change.
                    // I think it is best to use the actual names of the subparameters
                    // Variable     Divider Type    Represents      Acceptable Values
                    // P1           OVERFLOW        NONE            NONE
                    // P1           CUTOFF          Cutoff Flow     numbers
                    // P1           TABLUAR         Curve Name     *, name of curve
                    // P1           WEIR            Min. Flow       numbers
                    // P2           WEIR            Max. Depth      numbers
                    // P3           Coefficient     Coefficient     numbers
                    swmmjs.model.DIVIDERS[id] = {Description: '', Invert: 0, DivertedLink: '*', Type: 'CUTOFF', P1: 0, P2: 0, P3: 0, Dmax: 0, Dinit: 0, Dsurch: 0, Aponded: 0}

                    swmmjs.model['COORDINATES'][id] = [];
                    swmmjs.model['COORDINATES'][id]['x'] = Math.floor(xy1[0])
                    swmmjs.model['COORDINATES'][id]['y'] = Math.floor(svg.top - xy1[1])

                    color = (swmmjs.INPUT === swmmjs.mode ? swmmjs.defaultColor: nodeColors[r(v)]);
                        
                    d3.select('#svgSimple').select('g').append('g').attr('id', id).attr('class', 'node_ gdivider').append('polygon')
                    .attr('points', 
                        xy1[0]                         + ' ' + (xy1[1] - swmmjs.svg.nodeSize) + ' ' +
                        (xy1[0] - swmmjs.svg.nodeSize) + ' ' + (xy1[1]) + ' ' +
                        xy1[0]                         + ' ' + (xy1[1] + swmmjs.svg.nodeSize) + ' ' +
                        (xy1[0] + swmmjs.svg.nodeSize) + ' ' + (xy1[1])
                        )
                    .attr('title', id)
                    .attr('data-x', xy1[0])
                    .attr('data-y', xy1[1])
                    .attr('data-y0', swmmjs.svg.top - xy1[1])
                    .attr('onclick', 'modalEditDividers('+id+');')
                    .attr('onmouseover', 'swmmjs.svg.tooltip(evt.target)')
                    .attr('onmouseout', 'swmmjs.svg.clearTooltips(evt.target)')
                        .attr('class', 'divider')
                    .attr('fill', color);
                        
                    // Spawn an editing window for the junction object
                    modalEditDividers(id);

                    swmmjs.model.clickEffect = 'edit';
                    svg.on('click', null);
                    
                    // Refresh the selection list
                    populateDividersList();
                })
            }

            if($('#subselectcaption').text() === 'Storage Units'){
                // Set the click effect to 'createDivider'
                swmmjs.model.clickEffect = 'createStorage';

                svg.on('click', function() {
                    // If the model is not in create storage mode, return.
                    if(swmmjs.model.clickEffect !== 'createStorage'){
                        svg.on('click', null);
                        return;
                    // Change the model click effect to edit.
                    } else {
                        swmmjs.model.clickEffect = 'edit';
                    }

                    let xy = d3.mouse(this);
                    let transform = d3.zoomTransform(svg.node());
                    let xy1 = transform.invert(xy);
                    let id = 0;

                    // Create a new id
                    id = getUniqueNodeID();

                    // Storage Units have a funny table structure. The structure is dependent upon the 'Storage Curve' value. 
                    // The divider data is under the column of 'Parameters'. Every time the 'Storage Curve' changes, the parameters must also change.
                    // I think it is best to use the actual names of the subparameters
                    // Variable     Divider Type    Represents      Acceptable Values
                    // P1           OVERFLOW        NONE            NONE
                    // P1           CUTOFF          Cutoff Flow     numbers
                    // P1           TABLUAR         Curve Name     *, name of curve
                    // P1           WEIR            Min. Flow       numbers
                    // P2           WEIR            Max. Depth      numbers
                    // P3           Coefficient     Coefficient     numbers
                    swmmjs.model.STORAGE[id] = {Description: '', Invert: 0, Dmax: 0, Dinit: 0, Curve: 'FUNCTIONAL', CurveName: '', Coefficient: 1000, Exponent: 0, Constant: 0, Aponded: 0, Fevap: 0, SeepRate: 0}

                    swmmjs.model['COORDINATES'][id] = [];
                    swmmjs.model['COORDINATES'][id]['x'] = Math.floor(xy1[0])
                    swmmjs.model['COORDINATES'][id]['y'] = Math.floor(svg.top - xy1[1])

                    color = (swmmjs.INPUT === swmmjs.mode ? swmmjs.defaultColor: nodeColors[r(v)]);
                        
                    d3.select('#svgSimple').select('g').append('g').attr('id', id).attr('class', 'node_ gstorage').append('polygon')
                    .attr('points', 
                        (xy1[0] - swmmjs.svg.nodeSize) + ' ' + (xy1[1] + swmmjs.svg.nodeSize) + ' ' +
                        (xy1[0] + swmmjs.svg.nodeSize) + ' ' + (xy1[1] + swmmjs.svg.nodeSize) + ' ' +
                        (xy1[0] + swmmjs.svg.nodeSize) + ' ' + (xy1[1] - swmmjs.svg.nodeSize) + ' ' +
                        (xy1[0] - swmmjs.svg.nodeSize) + ' ' + (xy1[1] - swmmjs.svg.nodeSize)
                        )
                    .attr('title', id)
                    .attr('data-x', xy1[0])
                    .attr('data-y', xy1[1])
                    .attr('data-y0', swmmjs.svg.top - xy1[1])
                    .attr('onclick', 'modalEditStorageunits('+id+');')
                    .attr('onmouseover', 'swmmjs.svg.tooltip(evt.target)')
                    .attr('onmouseout', 'swmmjs.svg.clearTooltips(evt.target)')
                        .attr('class', 'storage')
                    .attr('fill', color);
                    
                    // Spawn an editing window for the junction object
                    modalEditStorageunits(id);

                    swmmjs.model.clickEffect = 'edit';
                    svg.on('click', null);
                    
                    // Refresh the selection list
                    populateStorageList();
                })
            }

            if($('#subselectcaption').text() === 'Conduits'){
                swmmjs.model.clickEffect = 'createConduit'
                // idlist keeps track of which nodes are used to create the conduit.
                let idlist = [];

                let svg = d3.select('#svgSimple');

                // Prepare to click only on nodes to create a junction.
                // The UI should stay in createConduit mode until the
                // complete link has been created.

                // 1: user clicks on a node
                // 2: Node is given a class of 'usnode' (changes node color)
                // 3: user clicks on a second node
                // 4: using the usnode and dsnode, add an entry into the CONDUITS array.

                // When a user clicks on a node, push the id of the node to the idlist
                //$('.node_').click(function(e){
                d3.selectAll('.node_').on('click', function(){
                    // Get the first circle child of this element
                    let child = this.firstChild;
                    $(this).addClass('selected');
                    idlist.push({ID: this.id, x: $(child).attr('data-x'), y: $(child).attr('data-y')})
                    
                    // If there are more than two objects in idlist, end the edit and create the conduit
                    if(idlist.length >= 2){
                        // Remove the click effect from the nodes
                        d3.selectAll('.node_').on('click', null);
                        $('.node_').removeClass('selected');

                        // Create a CONDUITS object.
                        // Create a new id
                        let id = getUniqueLinkID();

                        // Create the conduit
                        swmmjs.model['CONDUITS'][id] = {FromNode: idlist[0].ID, InOffset: 0, InitFlow: 0, Length: 400, MaxFlow: 0, OutOffset: 0, Roughness: 0.01, ToNode: idlist[1].ID};
                            
                        swmmjs.model['XSECTIONS'][id] = {Shape: 'CIRCULAR', Geom1: 1.5, Geom2: 0, Geom3: 0, Geom4: 0, Barrels: 1}
                        swmmjs.model['LOSSES'][id] = {Kin: 0, Kout: 0, Kavg: 0, FlapGate: 'NO', SeepRate: 0};
                        // Add the conduit to the map
                        d3.select('#svgSimple').select('g').append('g').attr('id', id).attr('class', 'link_ gconduit').append('line')
                        .attr('x1', idlist[0].x)
                        .attr('y1', idlist[0].y)
                        .attr('x2', idlist[1].x)
                        .attr('y2', idlist[1].y)
                        .attr('onclick', 'modalEditConduits('+id+');')
                        .attr('title', id)
                        .attr('onmouseover', 'swmmjs.svg.tooltip(evt.target)')
                        .attr('onmouseout', 'swmmjs.svg.clearTooltips(evt.target)')
                            .attr('class', 'conduit')
                        .attr('stroke', color)
                        .attr('stroke-width', 45);

                        // Change back to an editing environment
                        swmmjs.model.clickEffect = 'edit';
                    }
                })
            }

            if($('#subselectcaption').text() === 'Pumps'){
                swmmjs.model.clickEffect = 'createPump'
                // idlist keeps track of which nodes are used to create the link.
                let idlist = [];

                let svg = d3.select('#svgSimple');

                // Prepare to click only on nodes to create a junction.
                // The UI should stay in createPump mode until the
                // complete link has been created.

                // 1: user clicks on a node
                // 2: Node is given a class of 'selected' (changes node color)
                // 3: user clicks on a second node
                // 4: using the usnode and dsnode, add an entry into the PUMPS array.

                // When a user clicks on a node, push the id of the node to the idlist
                d3.selectAll('.node_').on('click', function(){
                    // Get the first circle child of this element
                    let child = this.firstChild;
                    $(this).addClass('selected');
                    idlist.push({ID: this.id, x: $(child).attr('data-x'), y: $(child).attr('data-y')})
                    
                    // If there are more than two objects in idlist, end the edit and create the link
                    if(idlist.length >= 2){
                        // Remove the click effect from the nodes
                        d3.selectAll('.node_').on('click', null);
                        $('.node_').removeClass('selected');

                        // Create a PUMPS object.
                        // Create a new id
                        let id = getUniqueLinkID();

                        // Create the link
                        swmmjs.model['PUMPS'][id] = {Node1: idlist[0].ID, Node2: idlist[1].ID, Description: '', Curve: '*', Status: 'OFF', Dstart: 0, Doff: 0};
                            
                        // Add the link to the map
                        d3.select('#svgSimple').select('g').append('g').attr('id', id).attr('class', 'link_ gpump').append('line')
                        .attr('x1', idlist[0].x)
                        .attr('y1', idlist[0].y)
                        .attr('x2', idlist[1].x)
                        .attr('y2', idlist[1].y)
                        .attr('onclick', 'modalEditPumps("'+id+'");')
                        .attr('title', id)
                        .attr('onmouseover', 'swmmjs.svg.tooltip(evt.target)')
                        .attr('onmouseout', 'swmmjs.svg.clearTooltips(evt.target)')
                        .attr('class', 'pump')
                        .attr('stroke', color)
                        .attr('stroke-width', 45);

                        // Change back to an editing environment
                        swmmjs.model.clickEffect = 'edit';
                    }
                })
            }

            if($('#subselectcaption').text() === 'Orifices'){
                swmmjs.model.clickEffect = 'createOrifice'
                // idlist keeps track of which nodes are used to create the link.
                let idlist = [];

                let svg = d3.select('#svgSimple');

                // When a user clicks on a node, push the id of the node to the idlist
                d3.selectAll('.node_').on('click', function(){
                    // Get the first circle child of this element
                    let child = this.firstChild;
                    $(this).addClass('selected');
                    idlist.push({ID: this.id, x: $(child).attr('data-x'), y: $(child).attr('data-y')})
                    
                    // If there are more than two objects in idlist, end the edit and create the link
                    if(idlist.length >= 2){
                        // Remove the click effect from the nodes
                        d3.selectAll('.node_').on('click', null);
                        $('.node_').removeClass('selected');

                        // Create a ORIFICE object.
                        // Create a new id
                        let id = getUniqueLinkID();

                        // Create the link
                        swmmjs.model['ORIFICES'][id] = {FromNode: idlist[0].ID, 
                                                        ToNode: idlist[1].ID, 
                                                        Description: '', 
                                                        Type: 'SIDE', 
                                                        InletOffset: 0, 
                                                        Qcoeff: 0, 
                                                        Gated: 'NO',
                                                        CloseTime: 0};

                        swmmjs.model['XSECTIONS'][id] = {Shape: 'CIRCULAR', Geom1: 1.5, Geom2: 0, Geom3: 0, Geom4: 0, Barrels: 1}
                            
                        // Add the link to the map
                        d3.select('#svgSimple').select('g').append('g').attr('id', id).attr('class', 'link_ gorifice').append('line')
                        .attr('x1', idlist[0].x)
                        .attr('y1', idlist[0].y)
                        .attr('x2', idlist[1].x)
                        .attr('y2', idlist[1].y)
                        .attr('onclick', 'modalEditOrifices("'+id+'");')
                        .attr('title', id)
                        .attr('onmouseover', 'swmmjs.svg.tooltip(evt.target)')
                        .attr('onmouseout', 'swmmjs.svg.clearTooltips(evt.target)')
                        .attr('class', 'orifice')
                        .attr('stroke', color)
                        .attr('stroke-width', 45);

                        // Change back to an editing environment
                        swmmjs.model.clickEffect = 'edit';
                    }
                })
            }

            if($('#subselectcaption').text() === 'Weirs'){
                swmmjs.model.clickEffect = 'createWeir'
                // idlist keeps track of which nodes are used to create the link.
                let idlist = [];

                let svg = d3.select('#svgSimple');

                // When a user clicks on a node, push the id of the node to the idlist
                d3.selectAll('.node_').on('click', function(){
                    // Get the first circle child of this element
                    let child = this.firstChild;
                    $(this).addClass('selected');
                    idlist.push({ID: this.id, x: $(child).attr('data-x'), y: $(child).attr('data-y')})
                    
                    // If there are more than two objects in idlist, end the edit and create the link
                    if(idlist.length >= 2){
                        // Remove the click effect from the nodes
                        d3.selectAll('.node_').on('click', null);
                        $('.node_').removeClass('selected');

                        // Create a WEIR object.
                        // Create a new id
                        let id = getUniqueLinkID();

                        // Create the link
                        swmmjs.model['WEIRS'][id] = {FromNode: idlist[0].ID, 
                                                        ToNode: idlist[1].ID, 
                                                        Description: '', 
                                                        Type: 'TRANSVERSE', 
                                                        CrestHt: 0,
                                                        Qcoeff: 0,
                                                        Gated: 'NO',
                                                        EndCon: 0,
                                                        EndCoeff: 0};

                        swmmjs.model['XSECTIONS'][id] = {Shape: 'CIRCULAR', Geom1: 1.5, Geom2: 0, Geom3: 0, Geom4: 0, Barrels: 1}
                            
                        // Add the link to the map
                        d3.select('#svgSimple').select('g').append('g').attr('id', id).attr('class', 'link_ gweir').append('line')
                        .attr('x1', idlist[0].x)
                        .attr('y1', idlist[0].y)
                        .attr('x2', idlist[1].x)
                        .attr('y2', idlist[1].y)
                        .attr('onclick', 'modalEditWeirs("'+id+'");')
                        .attr('title', id)
                        .attr('onmouseover', 'swmmjs.svg.tooltip(evt.target)')
                        .attr('onmouseout', 'swmmjs.svg.clearTooltips(evt.target)')
                        .attr('class', 'weir')
                        .attr('stroke', color)
                        .attr('stroke-width', 45);

                        // Change back to an editing environment
                        swmmjs.model.clickEffect = 'edit';
                    }
                })
            }

            if($('#subselectcaption').text() === 'Outlets'){
                swmmjs.model.clickEffect = 'createOutlet'
                // idlist keeps track of which nodes are used to create the link.
                let idlist = [];

                // When a user clicks on a node, push the id of the node to the idlist
                d3.selectAll('.node_').on('click', function(){
                    // Get the first circle child of this element
                    let child = this.firstChild;
                    $(this).addClass('selected');
                    idlist.push({ID: this.id, x: $(child).attr('data-x'), y: $(child).attr('data-y')})
                    
                    // If there are more than two objects in idlist, end the edit and create the link
                    if(idlist.length >= 2){
                        // Remove the click effect from the nodes
                        d3.selectAll('.node_').on('click', null);
                        $('.node_').removeClass('selected');

                        // Create a OUTLET object.
                        // Create a new id
                        let id = getUniqueLinkID();

                        // Create the link
                        swmmjs.model['OUTLETS'][id] = {FromNode: idlist[0].ID, 
                                                        ToNode: idlist[1].ID, 
                                                        Description: '', 
                                                        CrestHt: 0,
                                                        Gated: 'NO',
                                                        Type: 'TABULAR/DEPTH', 
                                                        Qcoeff: 0,
                                                        Qexpon: 0,
                                                        QTable: '*'};

                        // Add the link to the map
                        d3.select('#svgSimple').select('g').append('g').attr('id', id).attr('class', 'link_ goutlet').append('line')
                        .attr('x1', idlist[0].x)
                        .attr('y1', idlist[0].y)
                        .attr('x2', idlist[1].x)
                        .attr('y2', idlist[1].y)
                        .attr('onclick', 'modalEditOutlets("'+id+'");')
                        .attr('title', id)
                        .attr('onmouseover', 'swmmjs.svg.tooltip(evt.target)')
                        .attr('onmouseout', 'swmmjs.svg.clearTooltips(evt.target)')
                        .attr('class', 'outlet')
                        .attr('stroke', color)
                        .attr('stroke-width', 45);

                        // Change back to an editing environment
                        swmmjs.model.clickEffect = 'edit';
                    }
                })
            }

            // clearEditLayer is used to remove nodes and lines that are used for the express purpose of creating new 
            // geospatial object.s
            function clearEditLayer(){
                $('.tempNode').remove();
                $('.tempLine').remove();
            }

            // switch statements on the current target of the subselectcaption div
            if($('#subselectcaption').text() === 'Subcatchments'){
                // Set the click effect to 'createSubcatchment'
                swmmjs.model.clickEffect = 'createSubcatchment';
                // pointList keeps track of the points that have been created to make this polygon
                let pointList = [];

                // When a user clicks on the svg, create a temporary point and add the position to the pointlist. 
                // If there are more than two points in pointList, create a line using the points in pointlist.  
                // If the user clicks on the first point again: 
                //   -- if there are only two points in point list
                //     -- else push the points to swmmjs.model['Polygons'][id].push({Subcatchment: id, x: xy1[0] - swmmjs.svg.nodeSize, y: swmmjs.svg.top - xy1[1] + swmmjs.svg.nodeSize}).
                //   -- delete temporary points and lines, set clickEffect to 'edit'
                svg.on('click', function() {
                    // If the model is not in create subcatchment mode, 
                    // delete the temporary polygon and return.
                    if(swmmjs.model.clickEffect !== 'createSubcatchment'){
                        clearEditLayer();
                        svg.on('click', null);
                        return;
                    }

                    // Add a point to pointList and to the svg 
                    let xy = d3.mouse(this);
                    let transform = d3.zoomTransform(svg.node());
                    let xy1 = transform.invert(xy);
                    
                    pointList.push({x: xy1[0], y: xy1[1]})

                    d3.select('#svgSimple').select('g').append('g').attr('class', 'tempNode').append('circle')
                        .attr('cx', xy1[0])
                        .attr('cy', xy1[1])
                        .attr('r', swmmjs.svg.nodeSize)
                        .attr('data-x', xy1[0])
                        .attr('data-y', xy1[1])
                        .attr('class', 'tempNodeObj')
                        .attr('fill', 'rgba(125, 255, 125, 1)');

                    // If that is the only point in pointList, set that point's onClick function to 'completePolygon'.
                    if(pointList.length === 1){
                        // completePolygon takes all of the points in the pointList and creates a new polygon
                        d3.select('.tempNodeObj').on('click', 
                            function (){
                                if(pointList.length > 2){
                                    // Create a new id
                                    id = getUniqueNodeID();

                                    swmmjs.model.SUBCATCHMENTS[id] = {Description: '', RainGage: '*', Outlet: '*', Area: 5, Width: 500, PctSlope: 0.5, PctImperv: 25, CurbLen: 0, SnowPack: ''}

                                    swmmjs.model.SUBAREAS[id] = {NImperv: 0.01, NPerv: 0.1, SImperv: 0.05, SPerv: 0.05, PctZero: 25, RouteTo: 'OUTLET', PctRouted: 100}
                                    
                                    swmmjs.model['Polygons'][id] = [];

                                    // For every point in pointList, push to 'Polygons'
                                    let points = '';
                                    pointList.forEach(function(el){
                                        swmmjs.model['Polygons'][id].push({Subcatchment: id, x: el.x - swmmjs.svg.nodeSize, y: swmmjs.svg.top - el.y + swmmjs.svg.nodeSize})
                                        points += el.x + ' ' + (el.y) + ' ';
                                    })

                                    // Create the subcatchment object.
                                    d3.select('#svgSimple').select('g').append('g').attr('id', id).attr('class', 'polygon_ gpolygon').append('polygon')
                                        .attr('points', points)
                                        .attr('title', id)
                                        .attr('onmouseover', 'swmmjs.svg.tooltip(evt.target)')
                                        .attr('onmouseout', 'swmmjs.svg.clearTooltips(evt.target)')
                                        .attr('onclick', 'modalEditSubcatchments("'+id+'");')
                                        .attr('class', 'polygon')
                                        .attr('fill', 'transparent')
                                        .attr("stroke-width", 7)
                                        .attr("stroke", 'rgba(0, 0, 0, 1');
                
                                    // Spawn an editing window for the junction object
                                    modalEditSubcatchments(id);
                
                                    swmmjs.model.clickEffect = 'edit';
                                    svg.on('click', null);
                                    populateSubcatchmentsList();
                                    clearEditLayer();
                                } else {
                                    // If there are less than 3 points to the polygon, return.
                                    return;
                                }
                            }
                        )
                    }
                })
            } 

            if($('#subselectcaption').text() === 'Time Series'){
                // Create a time series object
                swmmjs.model.clickEffect = 'edit'
                id = getUniqueTimeseriesID();
                
                swmmjs.model['TIMESERIES'].push({TimeSeries:id, Value: 0, Date: '', Time: '00:00'})

                // open the Time Series modal using the new id
                modalEditTimeseries(id);
            }

        })

        //Bind project elements for click response.
        $('#pmTitle').click(function(e){
            // Show the modal.
            modalEditTitlenotes();
        })

        $('#pmOptions').click(function(e){
            // Place 'Options' in the subselectcaption text.
            $('#subselectcaption').text('Options');

            // Create the structure of the subselect list.
            let listJSON = [];
            listJSON.push({labelText: 'General',    elementId: 'subselectlist-general', function: modalEditGeneral});
            listJSON.push({labelText: 'Dates',    elementId: 'subselectlist-dates', function: modalEditDates});
            listJSON.push({labelText: 'Time Steps',    elementId: 'subselectlist-timesteps', function: modalEditTimesteps});
            listJSON.push({labelText: 'Dynamic Wave',    elementId: 'subselectlist-dynamicwave', function: modalEditDynamicwave});
            listJSON.push({labelText: 'Interface Files',    elementId: 'subselectlist-interfacefiles', function: modalEditInterfacefiles});
            listJSON.push({labelText: 'Reporting',    elementId: 'subselectlist-reporting', function: modalEditReporting});

            populateSelectList(listJSON);
        })

        $('#pmClimatology').click(function(e){
            // Place 'Climatology' in the subselectcaption text.
            $('#subselectcaption').text('Climatology');

            // Create the structure of the subselect list.
            let listJSON = [];
            listJSON.push({labelText: 'Temperature',    elementId: 'subselectlist-temperature', function: modalEditTemperature});
            listJSON.push({labelText: 'Evaporation',    elementId: 'subselectlist-evaporation', function: modalEditEvaporation});
            listJSON.push({labelText: 'Wind Speed',    elementId: 'subselectlist-windspeed'});
            listJSON.push({labelText: 'Snow Melt',    elementId: 'subselectlist-snowmelt'});
            listJSON.push({labelText: 'Areal Depletion',    elementId: 'subselectlist-arealdepletion'});

            populateSelectList(listJSON);
        })

        $('#pmRaingages').click(function(e){
            populateRaingagesList();
        })

        function populateRaingagesList(){
            // Place 'Rain Gages' in the subselectcaption text.
            $('#subselectcaption').text('Rain Gages');
            let listJSON = [];

            // Create the structure of the subselect list.
            if(!!swmmjs.model.RAINGAGES){
                Object.entries(swmmjs.model.RAINGAGES).forEach(item => {
                    listJSON.push({labelText: item[0],    elementId: 'subselectlist-raingage' + item.key, function: modalEditRaingages});
                })
            }

            populateSelectList(listJSON);
        }

        $('#pmSubcatchments').click(function(e){
            populateSubcatchmentsList();
        })

        function populateSubcatchmentsList(){
            // Place 'Subcatchments' in the subselectcaption text.
            $('#subselectcaption').text('Subcatchments');
            let listJSON = [];

            // Create the structure of the subselect list.
            if(!!swmmjs.model.SUBCATCHMENTS){
                Object.entries(swmmjs.model.SUBCATCHMENTS).forEach(item => {
                    listJSON.push({labelText: item[0],    elementId: 'subselectlist-subcatchment' + item.key, function: modalEditSubcatchments});
                })
            }

            populateSelectList(listJSON);
        }

        $('#pmJunctions').click(function(e){
            populateJunctionsList();
        })

        function populateJunctionsList(){
            // Place 'Junctions' in the subselectcaption text.
            $('#subselectcaption').text('Junctions');
            let listJSON = [];

            // Create the structure of the subselect list.
            if(!!swmmjs.model.JUNCTIONS){
                Object.entries(swmmjs.model.JUNCTIONS).forEach(item => {
                    listJSON.push({labelText: item[0],    elementId: 'subselectlist-junction' + item.key, function: modalEditJunctions});
                })
            }

            populateSelectList(listJSON);
        }

        $('#pmOutfalls').click(function(e){
            populateOutfallsList();
        })

        function populateOutfallsList(){
            // Place 'Outfalls' in the subselectcaption text.
            $('#subselectcaption').text('Outfalls');
            let listJSON = [];

            // Create the structure of the subselect list.
            if(!!swmmjs.model.OUTFALLS){
                Object.entries(swmmjs.model.OUTFALLS).forEach(item => {
                    listJSON.push({labelText: item[0],    elementId: 'subselectlist-outfall' + item.key, function: modalEditOutfalls});
                })
            }
            populateSelectList(listJSON);
        }

        $('#pmDividers').click(function(e){
            populateDividersList();
        })

        function populateDividersList(){
            // Place 'Dividers' in the subselectcaption text.
            $('#subselectcaption').text('Dividers');
            let listJSON = [];

            // Create the structure of the subselect list.
            if(!!swmmjs.model.DIVIDERS){
                Object.entries(swmmjs.model.DIVIDERS).forEach(item => {
                    listJSON.push({labelText: item[0],    elementId: 'subselectlist-divider' + item.key, function: modalEditDividers});
                })
            }
            populateSelectList(listJSON);
        }

        $('#pmStorageUnits').click(function(e){
            populateStorageList();
        })

        function populateStorageList(){
            // Place 'Storage Units' in the subselectcaption text.
            $('#subselectcaption').text('Storage Units');
            let listJSON = [];

            // Create the structure of the subselect list.
            if(!!swmmjs.model.STORAGE){
                Object.entries(swmmjs.model.STORAGE).forEach(item => {
                    listJSON.push({labelText: item[0],    elementId: 'subselectlist-storageunits' + item.key, function: modalEditStorageunits});
                })
            }

            populateSelectList(listJSON);
        }

        $('#pmConduits').click(function(e){
            populateConduitsList();
        })

        function populateConduitsList(){
            // Place 'Conduits' in the subselectcaption text.
            $('#subselectcaption').text('Conduits');
            let listJSON = [];

            // Create the structure of the subselect list.
            if(!!swmmjs.model.CONDUITS){
                Object.entries(swmmjs.model.CONDUITS).forEach(item => {
                    listJSON.push({labelText: item[0],    elementId: 'subselectlist-conduits' + item.key, function: modalEditConduits});
                })
            }

            populateSelectList(listJSON);
        }

        $('#pmPollutants').click(function(e){
            populatePollutantsList();
        })

        function populatePollutantsList(){
            // Place 'Pollutants' in the subselectcaption text.
            $('#subselectcaption').text('Pollutants');
            let listJSON = [];

            // Create the structure of the subselect list.
            if(!!swmmjs.model.POLLUTANTS){
                Object.entries(swmmjs.model.POLLUTANTS).forEach(item => {
                    listJSON.push({labelText: item[0],    elementId: 'subselectlist-pollutants' + item.key, function: modalEditPollutants});
                })
            }

            populateSelectList(listJSON);
        }

        $('#pmLanduses').click(function(e){
            populateLandusesList();
        })

        function populateLandusesList(){
            // Place 'Land Uses' in the subselectcaption text.
            $('#subselectcaption').text('Land Uses');
            let listJSON = [];

            // Create the structure of the subselect list.
            if(!!swmmjs.model.LANDUSES){
                Object.entries(swmmjs.model.LANDUSES).forEach(item => {
                    listJSON.push({labelText: item[0],    elementId: 'subselectlist-landuses' + item.key, function: modalEditLanduses});
                })
            }

            populateSelectList(listJSON);
        }

        $('#pmPumps').click(function(e){
            populatePumpsList();
        })

        function populatePumpsList(){
            // Place 'Options' in the subselectcaption text.
            $('#subselectcaption').text('Pumps');
            let listJSON = [];

            // Create the structure of the subselect list.
            
            if(!!swmmjs.model.PUMPS){
                Object.entries(swmmjs.model.PUMPS).forEach(item => {
                    listJSON.push({labelText: item[0],    elementId: 'subselectlist-pumps' + item.key, function: modalEditPumps});
                })
            }

            populateSelectList(listJSON);
        }

        $('#pmOrifices').click(function(e){
            populateOrificesList();
        })

        function populateOrificesList(){
            // Place 'Options' in the subselectcaption text.
            $('#subselectcaption').text('Orifices');
            let listJSON = [];

            // Create the structure of the subselect list.
            if(!!swmmjs.model.ORIFICES){
                Object.entries(swmmjs.model.ORIFICES).forEach(item => {
                    listJSON.push({labelText: item[0],    elementId: 'subselectlist-orifices' + item.key});
                })
            }

            populateSelectList(listJSON);
        }

        $('#pmWeirs').click(function(e){
            populateWeirsList();
        })

        function populateWeirsList(){
            // Place 'Options' in the subselectcaption text.
            $('#subselectcaption').text('Weirs');
            let listJSON = [];

            // Create the structure of the subselect list.
            if(!!swmmjs.model.WEIRS){
                Object.entries(swmmjs.model.WEIRS).forEach(item => {
                    listJSON.push({labelText: item[0],    elementId: 'subselectlist-weirs' + item.key});
                })
            }

            populateSelectList(listJSON);
        }

        $('#pmOutlets').click(function(e){
            populateOutletsList();
        })

        function populateOutletsList(){
            // Place 'Options' in the subselectcaption text.
            $('#subselectcaption').text('Outlets');
            let listJSON = [];

            // Create the structure of the subselect list.
            if(!!swmmjs.model.OUTLETS){
                Object.entries(swmmjs.model.OUTLETS).forEach(item => {
                    listJSON.push({labelText: item[0],    elementId: 'subselectlist-outlets' + item.key});
                })
            }

            populateSelectList(listJSON);
        }

        $('#pmTimeSeries').click(function(e){
            populateTimeseriesList();
        })

        function populateTimeseriesList(){
            // Place 'Time SEries' in the subselectcaption text.
            $('#subselectcaption').text('Time Series');
            let listJSON = [];
            let listVals = []

            // Create the structure of the subselect list.
            if(!!swmmjs.model.TIMESERIES){
                Object.entries(swmmjs.model.TIMESERIES).forEach(item => {
                    // If this timeseries isn't in the list yet, add it to listJSON
                    if(listVals.indexOf(item[1].TimeSeries) === -1){
                        listVals.push(item[1].TimeSeries)
                        listJSON.push({labelText: item[1].TimeSeries,    elementId: 'subselectlist-timeseries' + item.key, function: modalEditTimeseries});
                    }
                })
            }

            populateSelectList(listJSON);
        }

        //Add input and label elements to modal using an ID structure.
        // Input to this function is an array of objects of the format:
        //
        // [{labelText: 'General',                      The printed name of the element.
        //   elementId: 'subselectlist-general',        The id of the element.
        //   [optional]function: modalEditJunction}]    The function fired on click.
        // To use this structure, call swmmjs.model.[parentObject][inputName]
        function populateSelectList(inputArray){
            // Identify where objects will be placed.
            let parent = document.getElementById('subselectlist');
            // Generic Element
            let el;

            // Clean up the list
            while(parent.firstChild){
                parent.removeChild(parent.firstChild);
            }

            // For every entry in the inputArray
            inputArray.forEach(item => {

                // Add list element
                el = parent.appendChild(document.createElement('li'));
                el.classList.add('nav-item');
    
                // Add a
                el = el.appendChild(document.createElement('a'));
                el.classList.add('nav-link');
                el.setAttribute('aria-current', 'page');
                el.setAttribute('href', '#');
    
                // Add div
                el = el.appendChild(document.createElement('div'));
                
                el.setAttribute('id', item.elementId);
                el.innerText = item.labelText;
                // If a function was passed in itemArray, use it on click
                if(typeof item.function !== 'undefined'){
                    $(el).click(function(e){
                        item.function(item.labelText);
                    })
                } else {
                    el.setAttribute('data-toggle', 'modal');
                    el.setAttribute('data-target', '#myModal');
                }
            })
        }
     
        // Translate a date from the datetime input format (yyyy-MM-dd) to model format (MM/DD/YYYY) 
        function untranslateDate(date){
            let thisDate = date.split('-');
            let outVal = thisDate[1]+'/'+thisDate[2]+'/'+thisDate[0]
            return outVal;
        }

        // Translate a date from the model format (MM/DD/YYYY) to datetime input format (yyyy-MM-dd)
        function translateDate(date){
            let thisDate = new Date(date.split('/'));
            let outVal = thisDate.toLocaleDateString('en-CA', {year: 'numeric', month: '2-digit', day: '2-digit'});
            return outVal;
        }

        // Translate a date from the datetime input format (yyyy-MM-dd) to sweep format (MM/DD) 
        function untranslateSweepDate(date){
            let thisDate = date.split('-');
            let outVal = thisDate[1]+'/'+thisDate[2]
            return outVal;
        }

        /////////////////////////////////////////////////////////////
        // Title/Notes Modal 
        /////////////////////////////////////////////////////////////

        var modalEditTitlenotes = function(id){
            // Show the modal.
            $('#modalTitlenotes').modal('toggle');

            // Build the text string
            let textStr = ''

            for (let entry in swmmjs.model['TITLE']) {
                textStr += swmmjs.model['TITLE'][entry].TitleNotes + '\n';
            }

            $('#titlenotes').val(textStr)
        }

        $('#save-modal-titlenotes').click(function(e){
            saveModalTitlenotes()
        })

        function saveModalTitlenotes(){
            let lines = [];
            swmmjs.model['TITLE'] = [];

            lines = $('#titlenotes').val().split('\n')
            for(let line in lines){
                swmmjs.model['TITLE'].push({TitleNotes: lines[line]});
            }
            // Show the modal.
            $('#modalTitlenotes').modal('toggle');
        }

        /////////////////////////////////////////////////////////////
        // General Modal 
        /////////////////////////////////////////////////////////////

        var modalEditGeneral = function(id){
            // Show the modal.
            $('#modalGeneral').modal('toggle');
            
            // Process Models
            document.getElementById('general-rainfallrunoff').checked = true;
            if(swmmjs.model['OPTIONS']['IGNORE_RAINFALL']){
                if(swmmjs.model['OPTIONS']['IGNORE_RAINFALL'].Value === 'YES'){
                    document.getElementById('general-rainfallrunoff').checked = false;
                }
            }
            document.getElementById('general-rdii').checked = true;
            if(swmmjs.model['OPTIONS']['IGNORE_RDII']){
                if(swmmjs.model['OPTIONS']['IGNORE_RDII'].Value === 'YES'){
                    document.getElementById('general-rdii').checked = false;
                }
            }
            document.getElementById('general-snowmelt').checked = true;
            if(swmmjs.model['OPTIONS']['IGNORE_SNOWMELT']){
                if(swmmjs.model['OPTIONS']['IGNORE_SNOWMELT'].Value === 'YES'){
                    document.getElementById('general-snowmelt').checked = false;
                }
            }
            document.getElementById('general-groundwater').checked = true;
            if(swmmjs.model['OPTIONS']['IGNORE_GROUNDWATER']){
                if(swmmjs.model['OPTIONS']['IGNORE_GROUNDWATER'].Value === 'YES'){
                    document.getElementById('general-groundwater').checked = false;
                }
            }
            document.getElementById('general-flowrouting').checked = true;
            if(swmmjs.model['OPTIONS']['IGNORE_ROUTING']){
                if(swmmjs.model['OPTIONS']['IGNORE_ROUTING'].Value === 'YES'){
                    document.getElementById('general-flowrouting').checked = false;
                }
            }
            document.getElementById('general-wq').checked = true;
            if(swmmjs.model['OPTIONS']['IGNORE_QUALITY']){
                if(swmmjs.model['OPTIONS']['IGNORE_QUALITY'].Value === 'YES'){
                    document.getElementById('general-wq').checked = false;
                }
            }

            //Miscellaneous
            if(swmmjs.model['OPTIONS']['ALLOW_PONDING']){
                if(swmmjs.model['OPTIONS']['ALLOW_PONDING'].Value === 'YES'){
                    document.getElementById('general-allowponding').checked = true;
                }
            }
            if(swmmjs.model['REPORT']['CONTROLS']){
                if(swmmjs.model['REPORT']['CONTROLS'].Value === 'YES'){
                    document.getElementById('general-reportcontrolactions').checked = true;
                }
            }
            if(swmmjs.model['REPORT']['INPUT']){
                if(swmmjs.model['REPORT']['INPUT'].Value === 'YES'){
                    document.getElementById('general-reportinputsummary').checked = true;
                }
            }
            if(swmmjs.model['OPTIONS']['MIN_SLOPE']){
                $('#general-minconduitslope').val(swmmjs.model['OPTIONS']['MIN_SLOPE'].Value);
            }

            // Infiltration Model
            if(swmmjs.model['OPTIONS']['INFILTRATION'].Value === 'HORTON'){
                document.getElementById('general-horton').checked = true;
            } else if(swmmjs.model['OPTIONS']['INFILTRATION'].Value === 'MODIFIED_HORTON'){
                document.getElementById('general-modifiedhorton').checked = true;
            } else if(swmmjs.model['OPTIONS']['INFILTRATION'].Value === 'GREEN_AMPT'){
                document.getElementById('general-greenampt').checked = true;
            } else if(swmmjs.model['OPTIONS']['INFILTRATION'].Value === 'CURVE_NUMBER'){
                document.getElementById('general-curvenumber').checked = true;
            }

            // Routing Model
            if(swmmjs.model['OPTIONS']['FLOW_ROUTING'].Value === 'STEADY'){
                document.getElementById('general-steadyflow').checked = true;
            } else if(swmmjs.model['OPTIONS']['FLOW_ROUTING'].Value === 'KINWAVE'){
                document.getElementById('general-kinematicwave').checked = true;
            } else if(swmmjs.model['OPTIONS']['FLOW_ROUTING'].Value === 'DYNWAVE'){
                document.getElementById('general-dynamicwave').checked = true;
            } 

            $('#save-modal-general').click(function(e){
                saveModalGeneral()
            })
        }

        function saveModalGeneral(){
            // Process Models
            if(document.getElementById('general-rainfallrunoff').checked){
                swmmjs.model['OPTIONS']['IGNORE_RAINFALL'] = [];
                swmmjs.model['OPTIONS']['IGNORE_RAINFALL'].Value = 'NO'
            } else {
                swmmjs.model['OPTIONS']['IGNORE_RAINFALL'] = [];
                swmmjs.model['OPTIONS']['IGNORE_RAINFALL'].Value = 'YES'
            }

            if(document.getElementById('general-rdii').checked){
                swmmjs.model['OPTIONS']['IGNORE_RDII'] = [];
                swmmjs.model['OPTIONS']['IGNORE_RDII'].Value = 'NO'
            } else {
                swmmjs.model['OPTIONS']['IGNORE_RDII'] = [];
                swmmjs.model['OPTIONS']['IGNORE_RDII'].Value = 'YES'
            }
            
            if(document.getElementById('general-snowmelt').checked){
                swmmjs.model['OPTIONS']['IGNORE_SNOWMELT'] = [];
                swmmjs.model['OPTIONS']['IGNORE_SNOWMELT'].Value = 'NO'
            } else {
                swmmjs.model['OPTIONS']['IGNORE_SNOWMELT'] = [];
                swmmjs.model['OPTIONS']['IGNORE_SNOWMELT'].Value = 'YES'
            }
            
            if(document.getElementById('general-groundwater').checked){
                swmmjs.model['OPTIONS']['IGNORE_GROUNDWATER'] = [];
                swmmjs.model['OPTIONS']['IGNORE_GROUNDWATER'].Value = 'NO'
            } else {
                swmmjs.model['OPTIONS']['IGNORE_GROUNDWATER'] = [];
                swmmjs.model['OPTIONS']['IGNORE_GROUNDWATER'].Value = 'YES'
            }
            
            if(document.getElementById('general-flowrouting').checked){
                swmmjs.model['OPTIONS']['IGNORE_ROUTING'] = [];
                swmmjs.model['OPTIONS']['IGNORE_ROUTING'].Value = 'NO'
            } else {
                swmmjs.model['OPTIONS']['IGNORE_ROUTING'] = [];
                swmmjs.model['OPTIONS']['IGNORE_ROUTING'].Value = 'YES'
            }
            
            if(document.getElementById('general-wq').checked){
                swmmjs.model['OPTIONS']['IGNORE_QUALITY'] = [];
                swmmjs.model['OPTIONS']['IGNORE_QUALITY'].Value = 'NO'
            } else {
                swmmjs.model['OPTIONS']['IGNORE_QUALITY'] = [];
                swmmjs.model['OPTIONS']['IGNORE_QUALITY'].Value = 'YES'
            }

            // Miscellaneous
            if(document.getElementById('general-allowponding').checked){
                swmmjs.model['OPTIONS']['ALLOW_PONDING'] = [];
                swmmjs.model['OPTIONS']['ALLOW_PONDING'].Value = 'YES'
            } else {
                swmmjs.model['OPTIONS']['ALLOW_PONDING'] = [];
                swmmjs.model['OPTIONS']['ALLOW_PONDING'].Value = 'NO'
            }
            if(document.getElementById('general-reportcontrolactions').checked){
                swmmjs.model['REPORT']['CONTROLS'] = [];
                swmmjs.model['REPORT']['CONTROLS'].Value = 'YES'
            } else {
                swmmjs.model['REPORT']['CONTROLS'] = [];
                swmmjs.model['REPORT']['CONTROLS'].Value = 'NO'
            }
            if(document.getElementById('general-reportinputsummary').checked){
                swmmjs.model['REPORT']['INPUT'] = [];
                swmmjs.model['REPORT']['INPUT'].Value = 'YES'
            } else {
                swmmjs.model['REPORT']['INPUT'] = [];
                swmmjs.model['REPORT']['INPUT'].Value = 'NO'
            }

            // Infiltration Model
            if(document.getElementById('general-horton').checked === true){
                swmmjs.model['OPTIONS']['INFILTRATION'].Value = 'HORTON';
            } else if(document.getElementById('general-modifiedhorton').checked === true){
                swmmjs.model['OPTIONS']['INFILTRATION'].Value = 'MODIFIED_HORTON';
            } else if(document.getElementById('general-greenampt').checked === true){
                swmmjs.model['OPTIONS']['INFILTRATION'].Value = 'GREEN_AMPT';
            } else if(document.getElementById('general-curvenumber').checked === true){
                swmmjs.model['OPTIONS']['INFILTRATION'].Value = 'CURVE_NUMBER';
            }

            // Routing Model
            if(document.getElementById('general-steadyflow').checked === true){
                swmmjs.model['OPTIONS']['FLOW_ROUTING'].Value = 'STEADY';
            } else if(document.getElementById('general-kinematicwave').checked === true){
                swmmjs.model['OPTIONS']['FLOW_ROUTING'].Value = 'KINWAVE';
            } else if(document.getElementById('general-dynamicwave').checked === true){
                swmmjs.model['OPTIONS']['FLOW_ROUTING'].Value = 'DYNWAVE';
            }

            swmmjs.model['OPTIONS']['MIN_SLOPE'].Value = $('#general-minconduitslope').val();
        }


        // Establish HH:MM:SS styles for text timepickers
        let hhmmssitems = document.getElementsByClassName('texthhmmss');
        Array.from(hhmmssitems).forEach(item => {
            item.addEventListener('change', function(e){
                item.style.color = 'rgba(0, 0, 0, 1)';
                item.checkValidity();
            })
            item.addEventListener('invalid', function(e){
                item.style.color = 'rgba(255, 125, 125, 1)';
            })
        })

        /////////////////////////////////////////////////////////////
        // Timesteps Modal 
        /////////////////////////////////////////////////////////////

        var modalEditTimesteps = function(id){
            // Show the modal.
            $('#modalTimesteps').modal('toggle');

            $('#timesteps-reportingperiod').val(swmmjs.model['OPTIONS']['REPORT_STEP'].Value)
            $('#timesteps-dwrperiod').val(swmmjs.model['OPTIONS']['DRY_STEP'].Value)
            $('#timesteps-wwrperiod').val(swmmjs.model['OPTIONS']['WET_STEP'].Value)
            $('#timesteps-routing').val(swmmjs.model['OPTIONS']['ROUTING_STEP'].Value)
            $('#timesteps-skip').val(swmmjs.model['OPTIONS']['SKIP_STEADY_STATE'].Value)

            if(swmmjs.model['OPTIONS']['SKIP_STEADY_STATE'].Value === 'YES'){
                document.getElementById('timesteps-skip').checked = true
            } else {
                document.getElementById('timesteps-skip').checked = false;
            }

            $('#timesteps-systemflowtolerance').val(swmmjs.model['OPTIONS']['SYS_FLOW_TOL'].Value)
            $('#timesteps-lateralflowtolerance').val(swmmjs.model['OPTIONS']['LAT_FLOW_TOL'].Value)

            $('#save-modal-timesteps').click(function(e){
                saveModalTimesteps()
            })
        }
        
        function saveModalTimesteps(){
            swmmjs.model['OPTIONS']['REPORT_STEP'].Value = $('#timesteps-reportingperiod').val()
            swmmjs.model['OPTIONS']['DRY_STEP'].Value = $('#timesteps-dwrperiod').val()
            swmmjs.model['OPTIONS']['WET_STEP'].Value = $('#timesteps-wwrperiod').val()
            swmmjs.model['OPTIONS']['ROUTING_STEP'].Value = $('#timesteps-routing').val()
            swmmjs.model['OPTIONS']['SKIP_STEADY_STATE'].Value = $('#timesteps-skip').val()

            if(document.getElementById('timesteps-skip').checked === true){
                swmmjs.model['OPTIONS']['SKIP_STEADY_STATE'].Value = 'YES'
            } else {
                swmmjs.model['OPTIONS']['SKIP_STEADY_STATE'].Value = 'NO'
            }

            swmmjs.model['OPTIONS']['SYS_FLOW_TOL'].Value = $('#timesteps-systemflowtolerance').val()
            swmmjs.model['OPTIONS']['LAT_FLOW_TOL'].Value = $('#timesteps-lateralflowtolerance').val()
        }

        /////////////////////////////////////////////////////////////
        // Dates Modal 
        /////////////////////////////////////////////////////////////

        var modalEditDates = function(id){
            // Show the modal.
            $('#modalDates').modal('toggle');

            $('#dates-startdateanalysis').val(translateDate(swmmjs.model['OPTIONS']['START_DATE'].Value))
            $('#dates-starttimeanalysis').val(swmmjs.model['OPTIONS']['START_TIME'].Value)
            $('#dates-startdatereport').val(translateDate(swmmjs.model['OPTIONS']['REPORT_START_DATE'].Value))
            $('#dates-starttimereport').val(swmmjs.model['OPTIONS']['REPORT_START_TIME'].Value)
            $('#dates-enddateanalysis').val(translateDate(swmmjs.model['OPTIONS']['END_DATE'].Value))
            $('#dates-endtimeanalysis').val(swmmjs.model['OPTIONS']['END_TIME'].Value)
            $('#dates-startsweeping').val(translateDate(swmmjs.model['OPTIONS']['SWEEP_START'].Value))
            $('#dates-endsweeping').val(translateDate(swmmjs.model['OPTIONS']['SWEEP_END'].Value))
            $('#dates-antecedentdrydays').val(swmmjs.model['OPTIONS']['DRY_DAYS'].Value)

            $('#save-modal-dates').click(function(e){
                saveModalDates()
            })
        }

        function saveModalDates(){
            swmmjs.model['OPTIONS']['START_DATE'].Value = untranslateDate($('#dates-startdateanalysis').val())
            swmmjs.model['OPTIONS']['START_TIME'].Value = $('#dates-starttimeanalysis').val()
            swmmjs.model['OPTIONS']['REPORT_START_DATE'].Value = untranslateDate($('#dates-startdatereport').val())
            swmmjs.model['OPTIONS']['REPORT_START_TIME'].Value = $('#dates-starttimereport').val()
            swmmjs.model['OPTIONS']['END_DATE'].Value = untranslateDate($('#dates-enddateanalysis').val())
            swmmjs.model['OPTIONS']['END_TIME'].Value = $('#dates-endtimeanalysis').val()
            swmmjs.model['OPTIONS']['SWEEP_START'].Value = untranslateSweepDate($('#dates-startsweeping').val())
            swmmjs.model['OPTIONS']['SWEEP_END'].Value = untranslateSweepDate($('#dates-endsweeping').val())
            swmmjs.model['OPTIONS']['DRY_DAYS'].Value = $('#dates-antecedentdrydays').val()
        }

        /////////////////////////////////////////////////////////////
        // Dynamic Wave Modal 
        /////////////////////////////////////////////////////////////

        var modalEditDynamicwave = function(id){
            // Show the modal.
            $('#modalDynamicwave').modal('toggle');

            if(swmmjs.model['OPTIONS']['INERTIAL_DAMPING'].Value === 'NONE'){
                document.getElementById('dynamicwave-keep').checked = true;
            } else if(swmmjs.model['OPTIONS']['INERTIAL_DAMPING'].Value === 'PARTIAL'){
                document.getElementById('dynamicwave-dampen').checked = true;
            } else if(swmmjs.model['OPTIONS']['INERTIAL_DAMPING'].Value === 'FULL'){
                document.getElementById('dynamicwave-ignore').checked = true;
            } 
            if(swmmjs.model['OPTIONS']['NORMAL_FLOW_LIMITED'].Value === 'SLOPE'){
                document.getElementById('dynamicwave-slope').checked = true;
            } else if(swmmjs.model['OPTIONS']['NORMAL_FLOW_LIMITED'].Value === 'FROUDE'){
                document.getElementById('dynamicwave-froudeno').checked = true;
            } else if(swmmjs.model['OPTIONS']['NORMAL_FLOW_LIMITED'].Value === 'BOTH'){
                document.getElementById('dynamicwave-both').checked = true;
            } 
            if(swmmjs.model['OPTIONS']['FORCE_MAIN_EQUATION'].Value === 'H-W'){
                document.getElementById('dynamicwave-hw').checked = true;
            } else if(swmmjs.model['OPTIONS']['FORCE_MAIN_EQUATION'].Value === 'D-W'){
                document.getElementById('dynamicwave-dw').checked = true;
            } 
            if(swmmjs.model['OPTIONS']['VARIABLE_STEP'] && swmmjs.model['OPTIONS']['VARIABLE_STEP'].Value != "0"){
                document.getElementById('dynamicwave-variablesteps').checked = true;
            } else {
                swmmjs.model['OPTIONS']['VARIABLE_STEP'] = [];
                swmmjs.model['OPTIONS']['VARIABLE_STEP'].Value = 0.00;
                document.getElementById('dynamicwave-variablesteps').checked = false;
            } 
            $('#dynamicwave-adjustedby').val(swmmjs.model['OPTIONS']['VARIABLE_STEP'].Value)
            $('#dynamicwave-timestep').val(swmmjs.model['OPTIONS']['LENGTHENING_STEP'].Value)
            $('#dynamicwave-surfarea').val(swmmjs.model['OPTIONS']['MIN_SURFAREA'].Value)
            $('#dynamicwave-maxtrials').val(swmmjs.model['OPTIONS']['MAX_TRIALS'].Value)
            $('#dynamicwave-ctol').val(swmmjs.model['OPTIONS']['HEAD_TOLERANCE'].Value)
        }

        $('#save-modal-dynamicwave').click(function(e){
            saveModalDynamicwave()
        })

        function saveModalDynamicwave(){
            // Show the modal.
            $('#modalDynamicwave').modal('toggle');


            if(document.getElementById('dynamicwave-keep').checked === true){
                swmmjs.model['OPTIONS']['INERTIAL_DAMPING'].Value = 'NONE';
            } else if(document.getElementById('dynamicwave-dampen').checked === true){
                swmmjs.model['OPTIONS']['INERTIAL_DAMPING'].Value = 'PARTIAL';
            } else if(document.getElementById('dynamicwave-ignore').checked === true){
                swmmjs.model['OPTIONS']['INERTIAL_DAMPING'].Value = 'FULL';
            } 
            if(document.getElementById('dynamicwave-slope').checked === true){
                swmmjs.model['OPTIONS']['NORMAL_FLOW_LIMITED'].Value = 'SLOPE';
            } else if(document.getElementById('dynamicwave-froudeno').checked === true){
                swmmjs.model['OPTIONS']['NORMAL_FLOW_LIMITED'].Value = 'FROUDE';
            } else if(document.getElementById('dynamicwave-both').checked === true){
                swmmjs.model['OPTIONS']['NORMAL_FLOW_LIMITED'].Value = 'BOTH';
            } 
            if(document.getElementById('dynamicwave-hw').checked === true){
                swmmjs.model['OPTIONS']['FORCE_MAIN_EQUATION'].Value = 'H-W';
            } else if(document.getElementById('dynamicwave-dw').checked === true){
                swmmjs.model['OPTIONS']['FORCE_MAIN_EQUATION'].Value = 'D-W';
            } 
            if(document.getElementById('dynamicwave-variablesteps').checked === true){
                swmmjs.model['OPTIONS']['VARIABLE_STEP'] = [];
                swmmjs.model['OPTIONS']['VARIABLE_STEP'].Value = $('#dynamicwave-adjustedby').val();
            } else {
                swmmjs.model['OPTIONS']['VARIABLE_STEP'] = [];
                swmmjs.model['OPTIONS']['VARIABLE_STEP'].Value = "0";
            } 

            swmmjs.model['OPTIONS']['LENGTHENING_STEP'].Value = $('#dynamicwave-timestep').val()
            swmmjs.model['OPTIONS']['MIN_SURFAREA'].Value = $('#dynamicwave-surfarea').val()
            swmmjs.model['OPTIONS']['MAX_TRIALS'].Value = $('#dynamicwave-maxtrials').val()
            swmmjs.model['OPTIONS']['HEAD_TOLERANCE'].Value = $('#dynamicwave-ctol').val()
        }

        /////////////////////////////////////////////////////////////
        // Interface Files Modal 
        /////////////////////////////////////////////////////////////

        var modalEditInterfacefiles = function(id){
            // Show the modal.
            $('#modalInterfacefiles').modal('toggle');
        }

        $('#save-modal-interfacefiles').click(function(e){
            saveModalInterfacefiles()
        })

        function saveModalInterfacefiles(){
            // Show the modal.
            $('#modalInterfacefiles').modal('toggle');
        }

        /////////////////////////////////////////////////////////////
        // Reporting Modal 
        /////////////////////////////////////////////////////////////

        var modalEditReporting = function(id){
            // Show the modal.
            $('#modalReporting').modal('toggle');
        }

        $('#save-modal-reporting').click(function(e){
            saveModalReporting()
        })

        function saveModalReporting(){
            // Show the modal.
            $('#modalReporting').modal('toggle');
        }

        /////////////////////////////////////////////////////////////
        // Temperature Modal 
        /////////////////////////////////////////////////////////////

        var modalEditTemperature = function(id){
            // Show the modal.
            $('#modalTemperature').modal('toggle');
            
            // Add a set of options to the temperature-ts selectbox
            //<option value="TS2">TS2</option>
            // Each option is the Gage (id) value of a raingage. This is usually a string, like "RG1"
            // You can find the selected value in swmmjs.model['TEMPERATURE']['TIMESERIES'], but
            // the list of available options is found in swmmjs.model['TIMESERIES'][n].TimeSeries, but this is
            // not condensed, so the values in swmmjs.model['TIMESERIES'][n].TimeSeries should be iterated over,
            // then added to a list of availabe timeseries. This dynamic iteration is necesary because 
            // the timeseries themselves are also editable.

            // Array to hold names of TimeSeries
            let tsNames = [];

            // Empty the timeseries select options
            $('#temperature-ts').empty();

            // Add a default empty 'None' option to the timeseries select options.
            $('#temperature-ts').append('<option value="">None</option>')

            // If the value of any of these options matches the one in the model,
            // then mark that option as selected.
            // Make sure to check if the TEMPERATURE object exists.
            if(typeof swmmjs.model['TEMPERATURE'] === 'undefined'){
                swmmjs.model['TEMPERATURE'] = [];
                swmmjs.model['TEMPERATURE'].TimeSeries = [];
                swmmjs.model['TEMPERATURE'].TimeSeries.Value = ''
            }

            // Foreach el in swmmjs.model['TIMESERIES']
            Object.entries(swmmjs.model.TIMESERIES).forEach(el => {
                // Get the value el.TimeSeries
                if(tsNames.indexOf(el[1].TimeSeries) === -1){
                    let selected = '';
                    if(swmmjs.model['TEMPERATURE'].TimeSeries.Value === el[1].TimeSeries){
                        selected = 'selected'
                    }
                    tsNames.push(el[1].TimeSeries)
                    // Use tsNames to populate #temperature-ts with <option> elements
                    $('#temperature-ts').append('<option value="'+el[1].TimeSeries+'" '+selected+'>'+el[1].TimeSeries+'</option>')
                }
            })
        }

        $('#save-modal-temperature').click(function(e){
            saveModalTemperature()
        })

        function saveModalTemperature(){
            // Show the modal.
            $('#modalTemperature').modal('toggle');

            // Get the selected option: none, data, or file
            // If no data is checked, remove the temperature timeseries from the model
            if(document.getElementById('temperature-nodata').checked === true){
                // If there is no TEMPERATURE data interface, make one
                if(typeof swmmjs.model['TEMPERATURE'] === 'undefined'){
                    swmmjs.model['TEMPERATURE'] = [];
                    swmmjs.model['TEMPERATURE'].TimeSeries = ''
                }
                swmmjs.model['TEMPERATURE']['TimeSeries'] = null;
            } else if(document.getElementById('temperature-timeseries').checked === true){
                // If there is no TEMPERATURE data interface, make one
                if(typeof swmmjs.model['TEMPERATURE'] === 'undefined'){
                    swmmjs.model['TEMPERATURE'] = [];
                }
                swmmjs.model['TEMPERATURE']['TimeSeries'] = [];
                // Use the selected option from the timeseries window
                let thisEl = document.getElementById('temperature-ts')
                swmmjs.model['TEMPERATURE']['TimeSeries'].Value = thisEl.options[thisEl.selectedIndex].value;
            } 
        }

        /////////////////////////////////////////////////////////////
        // Evaporation Modal 
        /////////////////////////////////////////////////////////////

        var modalEditEvaporation = function(id){
            // Show the modal.
            $('#modalEvaporation').modal('toggle');

            // Make sure to check if the EVAPORATION object exists.
            if(typeof swmmjs.model['EVAPORATION'] === 'undefined'){
                swmmjs.model['EVAPORATION'] = [];
            }
        }

        $('#save-modal-evaporation').click(function(e){
            saveModalEvaporation()
        })

        function saveModalEvaporation(){
            // Show the modal.
            $('#modalEvaporation').modal('toggle');
        }

        /////////////////////////////////////////////////////////////
        // Rain Gages Modal 
        /////////////////////////////////////////////////////////////

        $('#save-modal-raingages').click(function(e){
            saveModalRaingages()
        })

        function saveModalRaingages(){
            // Reassign the id of the raingage if the user has changed the name value
            id = $('#raingages-form-id').val();

            // If the user has changed the value
            if(id !== $('#raingages-name').val()) {
                // Copy the elements of the old object into a new object using the key name
                Object.defineProperty(
                    swmmjs.model['RAINGAGES'], 
                    $('#raingages-name').val(), 
                    Object.getOwnPropertyDescriptor(swmmjs.model['RAINGAGES'], id)
                );
                // Delete the old object
                delete swmmjs.model['RAINGAGES'][id]

                // Copy the elements of the old object into a new object using the key name
                Object.defineProperty(
                    swmmjs.model['SYMBOLS'], 
                    $('#raingages-name').val(), 
                    Object.getOwnPropertyDescriptor(swmmjs.model['SYMBOLS'], id)
                );
                // Delete the old object
                delete swmmjs.model['SYMBOLS'][id];

                id = $('#raingages-name').val();
            }

            // If the are values in the x-coordinate/ycoordinate box, save them
            if($('#raingages-xcoordinate').val() !== '' && $('#raingages-ycoordinate').val() !== ''){
                swmmjs.model['SYMBOLS'][id] = [];
                swmmjs.model['SYMBOLS'][id]['XCoord'] = $('#raingages-xcoordinate').val()
                swmmjs.model['SYMBOLS'][id]['YCoord'] = $('#raingages-ycoordinate').val()
            }


            // If there are tags, and one of the tags has this RG id, use the tag
            // Check for object.type='Node' and object.ID = itemID;
            function tagQuery(thisObj){
                return thisObj.Type==='Gage' && thisObj.ID === id; 
            }
            // For every tag element
            let thisArray = Object.values(swmmjs.model['TAGS']);

            // Find the tag that matches this RG id
            let thisEl = thisArray.findIndex(tagQuery);
            if(thisEl >= 0){
                swmmjs.model['TAGS'][thisEl].Tag = $('#raingages-tag').val();
            } else {
                // If there is no tag with this value, and there is a value in the input, 
                // create a new tag
                if($('#raingages-tag').val() !== ''){
                    swmmjs.model['TAGS'][Object.keys(swmmjs.model['TAGS']).length] = {Type: 'Gage', ID: id, Tag: $('#raingages-tag').val()}
                }
            }
            
            swmmjs.model['RAINGAGES'][id]['Description'] = $('#raingages-description').val()
            swmmjs.model['RAINGAGES'][id]['Format'] = $('#raingages-rainformat').val()
            swmmjs.model['RAINGAGES'][id]['Interval'] = $('#raingages-timeinterval').val()
            swmmjs.model['RAINGAGES'][id]['SCF'] = $('#raingages-snowcatchfactor').val()
            swmmjs.model['RAINGAGES'][id]['Source'] = $('#raingages-datasource').val()
            swmmjs.model['RAINGAGES'][id]['SeriesName'] = $('#raingages-timeseriesname').val()
            swmmjs.model['RAINGAGES'][id]['FileName'] = $('#raingages-datafilename').val()
            swmmjs.model['RAINGAGES'][id]['StationID'] = $('#raingages-stationid').val()
            swmmjs.model['RAINGAGES'][id]['RainUnits'] = $('#raingages-rainunits').val()

            // Close the modal.
            $('#modalRaingages').modal('toggle');

            // Refresh the Raingages list.
            populateRaingagesList();
        }

        /////////////////////////////////////////////////////////////
        // Object ID Change Handlers
        // changeD3ObjectID("1", "JUNCTIONS", $('#junctions-name').val())
        /////////////////////////////////////////////////////////////
        function changeD3ObjectID(id, section, newID){
            // Copy the elements of the old object into a new object using the key name
            Object.defineProperty(
                swmmjs.model[section], 
                newID, 
                Object.getOwnPropertyDescriptor(swmmjs.model[section], id)
            );
            // Delete the old object
            delete swmmjs.model[section][id]

            // Change the id of the d3 element
            d3.selectAll('[id="'+id+'"]').filter('.gjunction')
                .attr('id', newID)
                .select('.junction')
                .attr('title', newID)
                .attr('onclick', 'modalEditJunctions("'+newID+'");')
        }

        // changeObjectID("1", "COORDINATES", $('#junctions-name').val())
        function changeObjectID(id, section, newID){
            // Copy the elements of the old object into a new object using the key name
            Object.defineProperty(
                swmmjs.model[section], 
                newID, 
                Object.getOwnPropertyDescriptor(swmmjs.model[section], id)
            );
            // Delete the old object
            delete swmmjs.model[secion][id];
        }

        /////////////////////////////////////////////////////////////
        // Tag Change Handlers
        // changeTags('Node', '2', $('#junctions-tag').val())
        /////////////////////////////////////////////////////////////
        function changeTags(tagType, id, newTag){
            // If there are tags, and one of the tags has this id, use the tag
            // Check for object.type='Node' and object.ID = itemID;
            function tagQuery(thisObj){
                return thisObj.Type===tagType && thisObj.ID === id; 
            }
            // For every tag element
            let thisArray = Object.values(swmmjs.model['TAGS']);

            // Find the tag that matches this RG id
            let thisEl = thisArray.findIndex(tagQuery);
            if(thisEl >= 0){
                swmmjs.model['TAGS'][thisEl].Tag = newTag;
            } else {
                // If there is no tag with this value, and there is a value in the input, 
                // create a new tag
                if(newTag !== ''){
                    swmmjs.model['TAGS'].push({'Type': tagType, 'ID': id, 'Tag': newTag})
                }
            }
        }

        /////////////////////////////////////////////////////////////
        // Junctions Modal 
        /////////////////////////////////////////////////////////////
        $('#save-modal-junctions').click(function(e){
            saveModalJunctions()
        })

        function saveModalJunctions(){
            // Reassign the id of the object if the user has changed the name value
            id = $('#junctions-form-id').val();

            // If the user has changed the value
            if(id !== $('#junctions-name').val()) {
                changeD3ObjectID(id, "JUNCTIONS", $('#junctions-name').val())
                changeObjectID(id, "COORDINATES", $('#junctions-name').val())
        
                id = parseInt($('#junctions-name').val()).toString();
            }

            // If the are values in the x-coordinate/ycoordinate box, save them
            if($('#junctions-xcoordinate').val() !== '' && $('#junctions-ycoordinate').val() !== ''){
                swmmjs.model['COORDINATES'][id] = [];
                swmmjs.model['COORDINATES'][id]['x'] = $('#junctions-xcoordinate').val()
                swmmjs.model['COORDINATES'][id]['y'] = $('#junctions-ycoordinate').val()
            }

            // Update any changes in tags
            changeTags('Node', id, $('#junctions-tag').val())
            
            // Update the base data
            swmmjs.model['JUNCTIONS'][id]['Description'] = $('#junctions-description').val()
            swmmjs.model['JUNCTIONS'][id]['Invert'] = $('#junctions-invertel').val()
            swmmjs.model['JUNCTIONS'][id]['Dmax'] = $('#junctions-maxdepth').val()
            swmmjs.model['JUNCTIONS'][id]['Dinit'] = $('#junctions-initialdepth').val()
            swmmjs.model['JUNCTIONS'][id]['Dsurch'] = $('#junctions-surchargedepth').val()
            swmmjs.model['JUNCTIONS'][id]['Aponded'] = $('#junctions-pondedarea').val()

            // Close the modal.
            $('#modalJunctions').modal('toggle');

            // Refresh the Raingages list.
            populateJunctionsList();
        }

        /////////////////////////////////////////////////////////////
        // Outfalls Modal 
        /////////////////////////////////////////////////////////////

        $('#save-modal-outfalls').click(function(e){
            saveModalOutfalls()
        })

        function saveModalOutfalls(){
            // Reassign the id of the object if the user has changed the name value
            id = $('#outfalls-form-id').val();

            // If the user has changed the value
            if(id !== $('#outfalls-name').val()) {
                changeD3ObjectID(id, "OUTFALLS", $('#outfalls-name').val())
                changeObjectID(id, "COORDINATES", $('#outfalls-name').val())
        
                id = parseInt($('#outfalls-name').val()).toString();
            }

            // If the are values in the x-coordinate/ycoordinate box, save them
            if($('#outfalls-xcoordinate').val() !== '' && $('#outfalls-ycoordinate').val() !== ''){
                swmmjs.model['COORDINATES'][id] = [];
                swmmjs.model['COORDINATES'][id]['x'] = $('#outfalls-xcoordinate').val()
                swmmjs.model['COORDINATES'][id]['y'] = $('#outfalls-ycoordinate').val()
            }

            // Update any changes in tags
            changeTags('Node', id, $('#outfalls-tag').val())
            
            swmmjs.model['OUTFALLS'][id]['Description'] = $('#outfalls-description').val()
            swmmjs.model['OUTFALLS'][id]['Inflows'] = $('#outfalls-inflows').val()
            swmmjs.model['OUTFALLS'][id]['Treatment'] = $('#outfalls-treatment').val()
            swmmjs.model['OUTFALLS'][id]['Invert'] = $('#outfalls-invertel').val()
            swmmjs.model['OUTFALLS'][id]['Gated'] = $('#outfalls-tidegate').val()
            swmmjs.model['OUTFALLS'][id]['Type'] = $('#outfalls-type').val()

            // Close the modal.
            $('#modalOutfalls').modal('toggle');

            // Refresh the Raingages list.
            populateOutfallsList();
        }

        /////////////////////////////////////////////////////////////
        // Conduits Modal 
        /////////////////////////////////////////////////////////////
        
        $('#save-modal-conduits').click(function(e){
            saveModalConduits()
        })

        function saveModalConduits(){
            // Reassign the id of the object if the user has changed the name value
            id = $('#conduits-form-id').val();
        
            // If the user has changed the value
            if(id !== $('#conduits-name').val()) {
                changeD3ObjectID(id, "CONDUITS", $('#conduits-name').val())
                changeObjectID(id, "XSECTIONS", $('#conduits-name').val())
        
                id = parseInt($('#conduits-name').val()).toString();
            }

            // Update any changes in tags
            changeTags('Link', id, $('#conduits-tag').val())
            
            swmmjs.model['CONDUITS'][id]['FromNode'] = $('#conduits-inletnode').val()
            swmmjs.model['CONDUITS'][id]['ToNode'] = $('#conduits-outletnode').val()
            swmmjs.model['CONDUITS'][id]['Description'] = $('#conduits-description').val()
            swmmjs.model['XSECTIONS'][id]['Shape'] = $('#conduits-shape').val()
            swmmjs.model['XSECTIONS'][id]['Geom1'] = $('#conduits-maxdepth').val()
            swmmjs.model['CONDUITS'][id]['Length'] = $('#conduits-length').val()
            swmmjs.model['CONDUITS'][id]['Roughness'] = $('#conduits-roughness').val()
            swmmjs.model['CONDUITS'][id]['InOffset'] = $('#conduits-inletoffset').val()
            swmmjs.model['CONDUITS'][id]['OutOffset'] = $('#conduits-outletoffset').val()
            swmmjs.model['CONDUITS'][id]['InitFlow'] = $('#conduits-initialflow').val()
            swmmjs.model['CONDUITS'][id]['MaxFlow'] = $('#conduits-maximumflow').val()
            // If there are no losses for this pipe, create some
            if(typeof swmmjs.model.LOSSES[id] === 'undefined'){
                swmmjs.model.LOSSES[id] = {Kin: 0, Kout: 0, Kavg: 0, FlapGate: 'NO', SeepRate: 0};
            }
            swmmjs.model['LOSSES'][id]['Kin'] = $('#conduits-entrylosscoeff').val()
            swmmjs.model['LOSSES'][id]['Kout'] = $('#conduits-exitlosscoeff').val()
            swmmjs.model['LOSSES'][id]['Kavg'] = $('#conduits-avglosscoeff').val()
            swmmjs.model['LOSSES'][id]['SeepRate'] = $('#conduits-seepagelossrate').val()
            swmmjs.model['LOSSES'][id]['FlapGate'] = $('#conduits-flapgate').val()
        
            // Close the modal.
            $('#modalConduits').modal('toggle');
        
            // Refresh the Pumps list.
            populateConduitsList();
        }

        // Clicking on a conduit in the map will open a modal
        $('.link_').click(function(e){
            if(this.classList.contains('gconduit')){
                modalEditConduits(this.id);
            }
        })
        
        /////////////////////////////////////////////////////////////
        // Pumps Modal 
        /////////////////////////////////////////////////////////////

        $('#save-modal-pumps').click(function(e){
            saveModalPumps()
        })
        
        function saveModalPumps(){
            // Reassign the id of the object if the user has changed the name value
            id = $('#pumps-form-id').val();
        
            // If the user has changed the value
            if(id !== $('#pumps-name').val()) {
                changeD3ObjectID(id, "PUMPS", $('#pumps-name').val())
        
                id = parseInt($('#pumps-name').val()).toString();
            }

            // Update any changes in tags
            changeTags('Link', id, $('#pumps-tag').val())
            
            swmmjs.model['PUMPS'][id]['Description'] = $('#pumps-description').val()
            swmmjs.model['PUMPS'][id]['Node1'] = $('#pumps-inletnode').val()
            swmmjs.model['PUMPS'][id]['Node2'] = $('#pumps-outletnode').val()
            swmmjs.model['PUMPS'][id]['Curve'] = $('#pumps-pumpcurve').val()
            swmmjs.model['PUMPS'][id]['Status'] = $('#pumps-initialstatus').val()
            swmmjs.model['PUMPS'][id]['Dstart'] = $('#pumps-startupdepth').val()
            swmmjs.model['PUMPS'][id]['Doff'] = $('#pumps-shutoffdepth').val()
        
            // Close the modal.
            $('#modalPumps').modal('toggle');
        
            // Refresh the Pumps list.
            populatePumpsList();
        }
        
        // Clicking on a pump in the map will open a modal
        $('.link_').click(function(e){
            if(this.classList.contains('gpump')){
                modalEditPumps(this.id);
            }
        })

        /////////////////////////////////////////////////////////////
        // Orifices Modal 
        /////////////////////////////////////////////////////////////

        $('#save-modal-orifices').click(function(e){
            saveModalOrifices()
        })
        
        function saveModalOrifices(){
            // Reassign the id of the object if the user has changed the name value
            id = $('#orifices-form-id').val();
        
            // If the user has changed the value
            if(id !== $('#orifices-name').val()) {
                changeD3ObjectID(id, "ORIFICES", $('#orifices-name').val())
                changeObjectID(id, "XSECTIONS", $('#orifices-name').val())
        
                id = parseInt($('#orifices-name').val()).toString();
            }
        
            // Update any changes in tags
            changeTags('Link', id, $('#orifices-tag').val())
            
            swmmjs.model['ORIFICES'][id]['FromNode'] = $('#orifices-inletnode').val()
            swmmjs.model['ORIFICES'][id]['ToNode'] = $('#orifices-outletnode').val()
            swmmjs.model['ORIFICES'][id]['Description'] = $('#orifices-description').val()
            swmmjs.model['ORIFICES'][id]['Type'] = $('#orifices-type').val()
            swmmjs.model['XSECTIONS'][id]['Shape'] = $('#orifices-shape').val()
            swmmjs.model['XSECTIONS'][id]['Geom1'] = $('#orifices-height').val()
            swmmjs.model['XSECTIONS'][id]['Geom2'] = $('#orifices-width').val()
            swmmjs.model['ORIFICES'][id]['InletOffset'] = $('#orifices-inletoffset').val()
            swmmjs.model['ORIFICES'][id]['Qcoeff'] = $('#orifices-dischargecoeff').val()
            swmmjs.model['ORIFICES'][id]['Gated'] = $('#orifices-flapgate').val()
            swmmjs.model['ORIFICES'][id]['CloseTime'] = $('#orifices-time').val()

            // Close the modal.
            $('#modalOrifices').modal('toggle');
        
            // Refresh the Orifices list.
            populateOrificesList();
        }
        
        // Clicking on a orifice in the map will open a modal
        $('.link_').click(function(e){
            if(this.classList.contains('gorifice')){
                modalEditOrifices(this.id);
            }
        })

        /////////////////////////////////////////////////////////////
        // Weirs Modal 
        /////////////////////////////////////////////////////////////

        $('#save-modal-weirs').click(function(e){
            saveModalWeirs()
        })
        
        function saveModalWeirs(){
            // Reassign the id of the object if the user has changed the name value
            id = $('#orifices-form-id').val();
        
            // If the user has changed the value
            if(id !== $('#weirs-name').val()) {
                changeD3ObjectID(id, "WEIRS", $('#weirs-name').val())
                changeObjectID(id, "XSECTIONS", $('#weirs-name').val())
        
                id = parseInt($('#weirs-name').val()).toString();
            }
        
            // Update any changes in tags
            changeTags('Link', id, $('#weirs-tag').val())
            
            swmmjs.model['WEIRS'][id]['FromNode'] = $('#weirs-inletnode').val()
            swmmjs.model['WEIRS'][id]['ToNode'] = $('#weirs-outletnode').val()
            swmmjs.model['WEIRS'][id]['Description'] = $('#weirs-description').val()
            swmmjs.model['WEIRS'][id]['Type'] = $('#weirs-type').val()
            swmmjs.model['XSECTIONS'][id]['Geom1'] = $('#weirs-height').val()
            swmmjs.model['XSECTIONS'][id]['Geom2'] = $('#weirs-length').val()
            swmmjs.model['XSECTIONS'][id]['Geom3'] = $('#weirs-sideslope').val()
            swmmjs.model['WEIRS'][id]['CrestHt'] = $('#weirs-inletoffset').val()
            swmmjs.model['WEIRS'][id]['Qcoeff'] = $('#weirs-dischargecoeff').val()
            swmmjs.model['WEIRS'][id]['Gated'] = $('#weirs-flapgate').val()
            swmmjs.model['WEIRS'][id]['EndCon'] = $('#weirs-endcontractions').val()
            swmmjs.model['WEIRS'][id]['EndCoeff'] = $('#weirs-endcoeff').val()

            // Close the modal.
            $('#modalWeirs').modal('toggle');
        
            // Refresh the Weirs list.
            populateWeirsList();
        }

        /////////////////////////////////////////////////////////////
        // Outlets Modal 
        /////////////////////////////////////////////////////////////

        $('#save-modal-outlets').click(function(e){
            saveModalOutlets()
        })
        
        function saveModalOutlets(){
            // Reassign the id of the object if the user has changed the name value
            id = $('#outlets-form-id').val();
        
            // If the user has changed the value
            if(id !== $('#outlets-name').val()) {
                changeD3ObjectID(id, "OUTLETS", $('#outlets-name').val())
        
                id = parseInt($('#outlets-name').val()).toString();
            }
        
            // Update any changes in tags
            changeTags('Link', id, $('#outlets-tag').val())
            
            swmmjs.model['OUTLETS'][id]['FromNode'] = $('#outlets-inletnode').val()
            swmmjs.model['OUTLETS'][id]['ToNode'] = $('#outlets-outletnode').val()
            swmmjs.model['OUTLETS'][id]['Description'] = $('#outlets-description').val()
            swmmjs.model['OUTLETS'][id]['CrestHt'] = $('#outlets-inletoffset').val()
            swmmjs.model['OUTLETS'][id]['Gated'] = $('#outlets-flapgate').val()
            swmmjs.model['OUTLETS'][id]['Type'] = $('#outlets-ratingcurve').val()
            swmmjs.model['OUTLETS'][id]['Qcoeff'] = $('#outlets-functionalcurvecoefficient').val()
            swmmjs.model['OUTLETS'][id]['Qexpon'] = $('#outlets-functionalcurveexponent').val()
            swmmjs.model['OUTLETS'][id]['QTable'] = $('#outlets-tabularcurvename').val()

            // Close the modal.
            $('#modalOutlets').modal('toggle');
        
            // Refresh the Outlets list.
            populateOutletsList();
        }

        /////////////////////////////////////////////////////////////
        // Subcatchments Modal 
        /////////////////////////////////////////////////////////////

        $('#save-modal-subcatchments').click(function(e){
            saveModalSubcatchments()
        })

        function saveModalSubcatchments(){
            // Reassign the id of the subcatchment if the user has changed the name value
            id = $('#subcatchments-form-id').val();
        
            // If the user has changed the value
            if(id !== $('#subcatchments-name').val()) {
                // Copy the elements of the old object into a new object using the key name
                Object.defineProperty(
                    swmmjs.model['SUBCATCHMENTS'], 
                    $('#subcatchments-name').val(), 
                    Object.getOwnPropertyDescriptor(swmmjs.model['SUBCATCHMENTS'], id)
                );
                // Delete the old object
                delete swmmjs.model['SUBCATCHMENTS'][id]
        
                // Copy the elements of the old object into a new object using the key name
                Object.defineProperty(
                    swmmjs.model['SUBAREAS'], 
                    $('#subcatchments-name').val(), 
                    Object.getOwnPropertyDescriptor(swmmjs.model['SUBAREAS'], id)
                );
                // Delete the old object
                delete swmmjs.model['SUBAREAS'][id]
        
                id = $('#subcatchments-name').val();
            }
        
            // If there are tags, and one of the tags has this subcatchment id, use the tag
            // Check for object.type='Node' and object.ID = itemID;
            function tagQuery(thisObj){
                return thisObj.Type==='Subcatch' && thisObj.ID === id; 
            }
            // For every tag element
            let thisArray = Object.values(swmmjs.model['TAGS']);
        
            // Find the tag that matches this RG id
            let thisEl = thisArray.findIndex(tagQuery);
            if(thisEl >= 0){
                swmmjs.model['TAGS'][thisEl].Tag = $('#subcatchments-tag').val();
            } else {
                // If there is no tag with this value, and there is a value in the input, 
                // create a new tag
                if($('#subcatchments-tag').val() !== ''){
                    swmmjs.model['TAGS'][Object.keys(swmmjs.model['TAGS']).length] = {Type: 'Subcatch', ID: id, Tag: $('#subcatchments-tag').val()}
                }
            }
            
            swmmjs.model['SUBCATCHMENTS'][id]['Description'] = $('#subcatchments-description').val()
            swmmjs.model['SUBCATCHMENTS'][id]['RainGage'] = $('#subcatchments-raingage').val()
            swmmjs.model['SUBCATCHMENTS'][id]['Outlet'] =$('#subcatchments-outlet').val()
            swmmjs.model['SUBCATCHMENTS'][id]['Area'] = $('#subcatchments-area').val()
            swmmjs.model['SUBCATCHMENTS'][id]['Width'] = $('#subcatchments-width').val()
            swmmjs.model['SUBCATCHMENTS'][id]['PctSlope'] = $('#subcatchments-pctslope').val()
            swmmjs.model['SUBCATCHMENTS'][id]['PctImperv'] = $('#subcatchments-pctimperv').val()
            swmmjs.model['SUBAREAS'][id]['NImperv'] = $('#subcatchments-nimperv').val()
            swmmjs.model['SUBAREAS'][id]['NPerv'] = $('#subcatchments-nperv').val()
            swmmjs.model['SUBAREAS'][id]['SImperv'] = $('#subcatchments-dstoreimperv').val()
            swmmjs.model['SUBAREAS'][id]['SPerv'] = $('#subcatchments-dstoreperv').val()
            swmmjs.model['SUBAREAS'][id]['PctZero'] = $('#subcatchments-pctzeroimperv').val()
            swmmjs.model['SUBAREAS'][id]['RouteTo'] = $('#subcatchments-subarearouting').val()
            swmmjs.model['SUBAREAS'][id]['PctRouted'] = $('#subcatchments-pctrouted').val()
            swmmjs.model['SUBCATCHMENTS'][id]['CurbLen'] = $('#subcatchments-curblength').val()
            swmmjs.model['SUBCATCHMENTS'][id]['SnowPack'] = $('#subcatchments-snowpack').val()
        
            
            // Close the modal.
            $('#modalSubcatchments').modal('toggle');
        
            // Refresh the Project menu list.
            populateSubcatchmentsList();
        
            // Set the clickEffect to 'edit'
            swmmjs.model.clicEffect = 'edit';
        }

        /////////////////////////////////////////////////////////////
        // Pollutants Modal 
        /////////////////////////////////////////////////////////////

        var modalEditPollutants = function(id){
            // Show the modal.
            $('#modalPollutants').modal('toggle');

            // Retain the original ID for editing purposes.
            $('#pollutants-form-id').val(id);

            // Make sure to check if the POLLUTANTS object exists.
            if(typeof swmmjs.model['POLLUTANTS'] === 'undefined'){
                swmmjs.model['POLLUTANTS'] = [];
            } else {
                $('#pollutants-name').val(id)

                $('#pollutants-units').val(swmmjs.model['POLLUTANTS'][id]['Units'])
                $('#pollutants-rainconcen').val(swmmjs.model['POLLUTANTS'][id]['Crdii'])
                $('#pollutants-gwconcen').val(swmmjs.model['POLLUTANTS'][id]['Cgw'])
                $('#pollutants-iiconcen').val(swmmjs.model['POLLUTANTS'][id]['Crdii'])
                $('#pollutants-dwfconcen').val(swmmjs.model['POLLUTANTS'][id]['Cdwf'])
                $('#pollutants-decaycoeff').val(swmmjs.model['POLLUTANTS'][id]['Kdecay'])
                $('#pollutants-snowonly').val(swmmjs.model['POLLUTANTS'][id]['SnowOnly'])
                $('#pollutants-copollutant').val(swmmjs.model['POLLUTANTS'][id]['CoPollutant'])
                $('#pollutants-cofraction').val(swmmjs.model['POLLUTANTS'][id]['CoFrac'])
            }
        }

        $('#save-modal-pollutants').click(function(e){
            saveModalPollutants()
        })

        function saveModalPollutants(){
            // Reassign the id of the pollutant if the user has changed the name value
            id = $('#pollutants-form-id').val();

            // If the user has changed the value
            if(id !== $('#pollutants-name').val()) {
                // Copy the elements of the old object into a new object using the key name
                Object.defineProperty(
                    swmmjs.model['POLLUTANTS'], 
                    $('#pollutants-name').val(), 
                    Object.getOwnPropertyDescriptor(swmmjs.model['POLLUTANTS'], id)
                );
                // Delete the old object
                delete swmmjs.model['POLLUTANTS'][id]

                id = $('#pollutants-name').val();
            }
            
            swmmjs.model['POLLUTANTS'][id]['Units'] = $('#pollutants-units').val()
            swmmjs.model['POLLUTANTS'][id]['Crdii'] = $('#pollutants-rainconcen').val()
            swmmjs.model['POLLUTANTS'][id]['Cgw'] = $('#pollutants-gwconcen').val()
            swmmjs.model['POLLUTANTS'][id]['Crdii'] = $('#pollutants-iiconcen').val()
            swmmjs.model['POLLUTANTS'][id]['Cdwf'] = $('#pollutants-dwfconcen').val()
            swmmjs.model['POLLUTANTS'][id]['Kdecay'] = $('#pollutants-decaycoeff').val()
            swmmjs.model['POLLUTANTS'][id]['SnowOnly'] = $('#pollutants-snowonly').val()
            swmmjs.model['POLLUTANTS'][id]['CoPollutant'] = $('#pollutants-copollutant').val()
            swmmjs.model['POLLUTANTS'][id]['CoFrac'] = $('#pollutants-cofraction').val()

            // Close the modal.
            $('#modalPollutants').modal('toggle');

            // Refresh the Pollutants list.
            populatePollutantsList();
        }

        /////////////////////////////////////////////////////////////
        // Land Uses Modal 
        /////////////////////////////////////////////////////////////

        // When the buildup pollutant is selected, change the values in the buildup section
        //let thisEl = document.getElementById('landuses-bpollutant');
        // 2: For the/When a pollutant is selected:
        // 3: If there is an association between the pollutant and the land use in the BUILDUP table,
        // If there are buildup values, and the 'selected' pollutant is in the buildup values table 
        function selectBPollutant(id){
            function buildupQuery(thisObj){
                let thisEl = document.getElementById('landuses-bpollutant');
                return thisObj.LandUse===id && thisObj.Pollutant === thisEl.options[thisEl.selectedIndex].value;
            }
            // For every pollutant element
            let thisArray = Object.values(swmmjs.model['BUILDUP']);

            // Find the pollutant that matches this land use id
            let thisEl = thisArray.findIndex(buildupQuery);
            if(thisEl >= 0){
                // The currently selected pollutant has values associated with this land use
                // fill the data with the associated values
                $('#landuses-bfunction').val(swmmjs.model['BUILDUP'][thisEl].Function)
                $('#landuses-maxbuildup').val(swmmjs.model['BUILDUP'][thisEl].Coeff1)
                $('#landuses-rateconstant').val(swmmjs.model['BUILDUP'][thisEl].Coeff2)
                $('#landuses-powersatconstant').val(swmmjs.model['BUILDUP'][thisEl].Coeff3)
                $('#landuses-normalizer').val(swmmjs.model['BUILDUP'][thisEl].Normalizer)
            } else {
                $('#landuses-bfunction').val('NONE');
                $('#landuses-maxbuildup').val('')
                $('#landuses-rateconstant').val('')
                $('#landuses-powersatconstant').val('')
                $('#landuses-normalizer').val('')
            }
        }

        // When the washoff pollutant is selected, change the values in the washoff section
        //thisEl = document.getElementById('landuses-wpollutant');
        // 2: For the/When a pollutant is selected:
        // 3: If there is an association between the pollutant and the land use in the WASHOFF table,
        // If there are washoff values, and the 'selected' pollutant is in the washoff values table 
        function selectWPollutant(id){
            function washoffQuery(thisObj){
                let thisEl = document.getElementById('landuses-wpollutant');
                return thisObj.LandUse===id && thisObj.Pollutant === thisEl.options[thisEl.selectedIndex].value;
            }
            // For every pollutant element
            let thisArray = Object.values(swmmjs.model['WASHOFF']);

            // Find the pollutant that matches this land use id
            let thisEl = thisArray.findIndex(washoffQuery);
            if(thisEl >= 0){
                // The currently selected pollutant has values associated with this land use
                // fill the data with the associated values
                $('#landuses-wfunction').val(swmmjs.model['WASHOFF'][thisEl].Function)
                $('#landuses-coefficient').val(swmmjs.model['WASHOFF'][thisEl].Coeff1)
                $('#landuses-exponent').val(swmmjs.model['WASHOFF'][thisEl].Coeff2)
                $('#landuses-cleaningeffic').val(swmmjs.model['WASHOFF'][thisEl].Coeff3)
                $('#landuses-bmpeffic').val(swmmjs.model['WASHOFF'][thisEl].Normalizer)

            } else {
                $('#landuses-bfunction').val('NONE');
                $('#landuses-maxbuildup').val('')
                $('#landuses-rateconstant').val('')
                $('#landuses-powersatconstant').val('')
                $('#landuses-normalizer').val('')
            }
        }

        // When a Buildup pollutant is selected, refresh the interface
        $('#landuses-bpollutant').on('change', function(){
            selectBPollutant($('#landuses-name').val())
        })

        // When a Buildup pollutant is selected, refresh the interface
        $('#landuses-wpollutant').on('change', function(){
            selectWPollutant($('#landuses-name').val())
        })

        var modalEditLanduses = function(id){
            // Show the modal.
            $('#modalLanduses').modal('toggle');

            // Retain the original ID for editing purposes.
            $('#landuses-form-id').val(id);

            // Make sure to check if the LANDUSES object exists.
            if(typeof swmmjs.model['LANDUSES'] === 'undefined'){
                swmmjs.model['LANDUSES'] = [];
            } else {
                $('#landuses-name').val(id)

                $('#landuses-description').val(swmmjs.model['LANDUSES'][id]['Description'])
                $('#landuses-sweepinterval').val(swmmjs.model['LANDUSES'][id]['SweepInterval'])
                $('#landuses-sweepavailability').val(swmmjs.model['LANDUSES'][id]['FractionAvailable'])
                $('#landuses-sweeplastswept').val(swmmjs.model['LANDUSES'][id]['LastCleaned'])
                // Buildup section
                // Buildup has two keys: 'Land Use' and 'Pollutant'.
                // Should use a search function to populate these values
                // This also means this should be a drop-down menu that changes when the drop-downs
                // are selected. I'm starting to think this might do better as a tabbed modal also, but 
                // I'm not going to go that way right now.

                // TODO:
                // Create a select/option structure.
                // Fill that select/option structure with all of the available pollutant options.
                // It is possible for a Land Use to have no associated pollutant structure in the 
                // buildup-washoff section, and it is a good idea to keep them separate: 10,000 taxlots
                // with 10,000 pollutants is goofy. Test if this Land Use does not have a buildup washoff relationship
                // with a pollutant and if one doesn't exist, create one. Unfortunately, SWMM may already
                // create relationships between ALL pollutants and ALL landuses, so this may be something
                // that needs to be cleaned up from the original code.

                // IF the equation is NONE, then eliminate the pollutant/landuse combo from 
                // the buildup/washoff arrays/tables. Current swmm ui seems to require the association,
                // but I'm hoping that's just a UI thing.

                // 1: Populate a select list with all of the pollutants
                
                let selected = 'selected';

                $('#landuses-bpollutant').empty();
                Object.entries(swmmjs.model.POLLUTANTS).forEach(el => {
                    // populate #landuses-bpollutant with <option> elements
                    $('#landuses-bpollutant').append('<option value="'+el[0]+'" '+selected+'>'+el[0]+'</option>')
                    selected = '';
                })

                $('#landuses-wpollutant').empty();
                Object.entries(swmmjs.model.POLLUTANTS).forEach(el => {
                    // populate #landuses-bpollutant with <option> elements
                    $('#landuses-wpollutant').append('<option value="'+el[0]+'" '+selected+'>'+el[0]+'</option>')
                    selected = '';
                })

                selectBPollutant(id);
                selectWPollutant(id);
            }
        }

        $('#save-modal-landuses').click(function(e){
            saveModalLanduses()
        })

        function saveModalLanduses(){
            // Reassign the id of the pollutant if the user has changed the name value
            id = $('#landuses-form-id').val();

            // If the user has changed the value
            if(id !== $('#landuses-name').val()) {
                // Copy the elements of the old object into a new object using the key name
                Object.defineProperty(
                    swmmjs.model['LANDUSES'], 
                    $('#landuses-name').val(), 
                    Object.getOwnPropertyDescriptor(swmmjs.model['LANDUSES'], id)
                );
                // Delete the old object
                delete swmmjs.model['LANDUSES'][id]

                id = $('#landuses-name').val();
            }

            

            swmmjs.model['LANDUSES'][id]['Description'] = $('#landuses-description').val()
            swmmjs.model['LANDUSES'][id]['SweepInterval'] = $('#landuses-sweepinterval').val()
            swmmjs.model['LANDUSES'][id]['FractionAvailable'] = $('#landuses-sweepavailability').val()
            swmmjs.model['LANDUSES'][id]['LastCleaned'] = $('#landuses-sweeplastswept').val()

            // If the buildup function is not 'NONE', save the buildup parameters to the BUILDUP object
            if($('#landuses-bfunction').val() !== 'NONE'){
                // Copy the TAGS method for saving to tables that involve two keys.
                function buildupQuery(thisObj){
                    let thisEl = document.getElementById('landuses-bpollutant');
                    return thisObj.LandUse===id && thisObj.Pollutant === thisEl.options[thisEl.selectedIndex].value;
                }
                // For every tag element
                let thisArray = Object.values(swmmjs.model['BUILDUP']);

                // Find the pollutant that matches this landuse id
                let thisEl = thisArray.findIndex(buildupQuery);
                if(thisEl >= 0){
                    swmmjs.model['BUILDUP'][thisEl].Function = $('#landuses-bfunction').val()
                    swmmjs.model['BUILDUP'][thisEl].Coeff1 = $('#landuses-maxbuildup').val()
                    swmmjs.model['BUILDUP'][thisEl].Coeff2 = $('#landuses-rateconstant').val()
                    swmmjs.model['BUILDUP'][thisEl].Coeff3 = $('#landuses-powersatconstant').val()
                    swmmjs.model['BUILDUP'][thisEl].Normalizer = $('#landuses-normalizer').val()
                } else {
                    // If there is no buildup with this value, and there is a value in the input, 
                    // create a new buildup
                    if($('#landuses-bpollutant').val() !== ''){
                        swmmjs.model['BUILDUP'].push({  'Coeff1': $('#landuses-maxbuildup').val(), 
                                                        'Coeff2': $('#landuses-rateconstant').val(), 
                                                        'Coeff3': $('#landuses-powersatconstant').val(), 
                                                        'Function': $('#landuses-bfunction').val(), 
                                                        'LandUse': id, 
                                                        'Normalizer': $('#landuses-normalizer').val(), 
                                                        'Pollutant': $('#landuses-bpollutant').val()})
                    }
                }
            }

            // If the washoff function is not 'NONE', save the washoff parameters to the WASHOFF object
            if($('#landuses-wfunction').val() !== 'NONE'){
                // Copy the TAGS method for saving to tables that involve two keys.
                function washoffQuery(thisObj){
                    let thisEl = document.getElementById('landuses-wpollutant');
                    return thisObj.LandUse===id && thisObj.Pollutant === thisEl.options[thisEl.selectedIndex].value;
                }
                // For every washoff element
                let thisArray = Object.values(swmmjs.model['WASHOFF']);

                // Find the pollutant that matches this landuse id
                let thisEl = thisArray.findIndex(washoffQuery);
                if(thisEl >= 0){
                    swmmjs.model['WASHOFF'][thisEl].Function = $('#landuses-wfunction').val()
                    swmmjs.model['WASHOFF'][thisEl].Coeff1 = $('#landuses-coefficient').val()
                    swmmjs.model['WASHOFF'][thisEl].Coeff2 = $('#landuses-exponent').val()
                    swmmjs.model['WASHOFF'][thisEl].Ecleaning = $('#landuses-cleaningeffic').val()
                    swmmjs.model['WASHOFF'][thisEl].Ebmp = $('#landuses-bmpeffic').val()
                } else {
                    // If there is no buildup with this value, and there is a value in the input, 
                    // create a new buildup
                    if($('#landuses-wpollutant').val() !== ''){
                        swmmjs.model['WASHOFF'].push({  'Coeff1': $('#landuses-coefficient').val(), 
                                                        'Coeff2': $('#landuses-exponent').val(), 
                                                        'Ecleaning': $('#landuses-cleaningeffic').val(), 
                                                        'Function': $('#landuses-wfunction').val(), 
                                                        'LandUse': id, 
                                                        'Ebmp': $('#landuses-bmpeffic').val(), 
                                                        'Pollutant': $('#landuses-wpollutant').val()})
                    }
                }
            }
            

            // Close the modal.
            $('#modalLanduses').modal('toggle');

            // Refresh the Landuses list.
            populateLandusesList();
        }

        /////////////////////////////////////////////////////////////
        // Time Series Modal 
        /////////////////////////////////////////////////////////////

        var modalEditTimeseries = function(id){
            // Show the modal.
            $('#modalTimeseries').modal('toggle');
            $('#timeseries-form-id').val(id);
            $('#timeseries-form-id').text(id);
            $('#timeseries-name').val(id);

            // Make sure to check if the TIMESERIES object exists.
            if(typeof swmmjs.model['TIMESERIES'] === 'undefined'){
                swmmjs.model['TIMESERIES'] = [];
            }

            // Create an editable object type for the time series table
            // because the time series tables are all just one table in the data so:
            let timeseriesTabulatorData = [];
            swmmjs.model['TIMESERIES'].forEach(function(el){
                if(el.TimeSeries === id){
                    timeseriesTabulatorData.push({Date: el.Date, Time: el.Time, Value:el.Value})
                }
            })

            let timeseriesTabulator = new Tabulator("#tableTimeseries", {
                data: timeseriesTabulatorData,
                layout: "fitColumns",
                columns:[{title:"Date", sorter:"date", field:"Date", editor:"input"},
                        {title:"Time", sorter:"number", field:"Time", editor:"input"},
                        {title:"Value", field:"Value", editor:"number", editorParams:{min:0, step:0.01}},],
            } );
        }

        // Clicking on the timeseries-view button will bring up the timeseries chart modal.
        $('#timeseries-view').click(function(e){
            modalDisplayTimeseries();
        })

        // Clicking on the timeseries-create-row button will create a new row in the given timeseries
        $('#timeseries-create-row').click(function(e){
            let table = Tabulator.prototype.findTable('#tableTimeseries')[0];
            id = $('#timeseries-name').val()

            table.addRow(Object.assign({}, {Date: '', Time: '00:00', Value: 0}))
        })

        function modalDisplayTimeseries(){
            // Show the modal.
            $('#modalTimeserieschart').modal('toggle');
            drawTimeseries();
        }

        $('#save-modal-timeseries').click(function(e){
            saveModalTimeseries()
        })

        function saveModalTimeseries(){
            id = $('#timeseries-form-id').val();
            // On save:
            // - 1: delete the timeseries entries where el.TimeSeries === id
            swmmjs.model['TIMESERIES'] = swmmjs.model['TIMESERIES'].filter(item => item.TimeSeries.toString() !== id.toString())

            // - 2: for every row in the '#tableTimeseries' table
            let table = Tabulator.prototype.findTable('#tableTimeseries')[0];
            id = $('#timeseries-name').val()

            table.getData().forEach(function(el){
                // - 3: Place a new entry in the timeseries entries with el.TimeSeries = id
                swmmjs.model['TIMESERIES'].push({TimeSeries:id, Value:el.Value, Date:el.Date, Time:el.Time})
            })
            // Hide the modal.
            $('#modalTimeseries').modal('toggle');

            populateTimeseriesList();
        }
    }

    /////////////////////////////////////////////////////////////
    // .inp parsing function.
    /////////////////////////////////////////////////////////////

    inp.parse = function(text) {
        var regex = {
            section: /^\s*\[\s*([^\]]*)\s*\].*$/,
            value: /\s*([^\s]+)([^;]*).*$/,
            description: /^\s*;.*$/,
            comment: /^\s*;;.*$/
        },
        parser = {
            LOSSES: function(section, key, line) {
                var m = [];
                line = key + line;
                m.push(line)
                m.push(line.slice(17,28))
                m.push(line.slice(28,39))
                m.push(line.slice(39,50))
                m.push(line.slice(50,61))
                m.push(line.slice(61,line.length))
                if (m && m.length)
                        section[key] = {Kin: parseFloat(m[1]), Kout: m[2].trim(), Kavg: m[3].trim(), FlapGate: m[4].trim(), SeepRate: m[5].trim()};
            },
            // TITLE Title/Notes needs to consume all of the lines until the next section.
            // Older code just takes in a single line.
            TITLE: function(section, key, line) {
                var m = line.match(/(.*)+/);
                if (m && m.length > 1)
                    section[Object.keys(section).length] = {TitleNotes: key + line};
            },
            OPTIONS: function(section, key, line) {
                    var m = line.match(/\s+([//\-:a-zA-Z0-9\.]+)/);
                    if (m && m.length)
                        section[key] = {Value: m[1]};
            },
            EVAPORATION: function(section, key, line) {
                    var m = line.match(/\s+([//\-:a-zA-Z0-9\.]+)/);
                    if (m && m.length)
                        section[key] = {Value: m[1]};
            },
            TEMPERATURE: function(section, key, line) {
                var m = [];
                line = key + line;
                m.push(line)
                m.push(line.slice(19,line.length))
                if (m && m.length)
                        section[key] = {Value: m[1].trim()};
            },
            RAINGAGES: function(section, key, line) {
                    var m = line.match(/\s+([a-zA-Z0-9\.]+)\s+([:0-9\.]+)\s+([0-9\.]+)\s+([A-Za-z0-9\.]+)\s+([A-Za-z0-9\.]+)/);
                    if (m && m.length)
                        section[key] = {Format: m[1], Interval: m[2], SCF: m[3], Source: m[4], SeriesName: m[5], Description: curDesc};
                        //swmmjs.model.RAINGAGES[id] = {Description: '', Format: 'INTENSITY', Interval: '1:00', SCF: 1.0, Source: 'TIMESERIES', SeriesName: '*', FileName: '*', StationID: '*', RainUnits: 'IN'}
            },
            INFILTRATION: function(section, key, line) {
                    var m = line.match(/\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)/);
                    if (m && m.length)
                        section[key] = {MaxRate: parseFloat(m[1]), MinRate: parseFloat(m[2]), Decay: parseFloat(m[3]), DryTime: parseFloat(m[4]), MaxInfil: parseFloat(m[5])};
            },
            JUNCTIONS: function(section, key, line, curDesc) {
                    var m = line.match(/\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)/);
                    if (m && m.length)
                        section[key] = {Invert: parseFloat(m[1]), Dmax: parseFloat(m[2]), Dinit: parseFloat(m[3]), Dsurch: parseFloat(m[4]), Aponded: parseFloat(m[5]), Description: curDesc};
            },
            OUTFALLS: function(section, key, line) {
                var m = [];
                line = key + line;
                m.push(line)
                m.push(line.slice(17,28))
                m.push(line.slice(28,39))
                m.push(line.slice(39,56))
                m.push(line.slice(56,line.length))
                if (m && m.length)
                        section[key] = {Invert: parseFloat(m[1]), Type: m[2].trim(), StageData: m[3].trim(), Gated: m[4].trim()};
            },
            DIVIDERS: function(section, key, line) {
                var m = [];
                line = key + line;
                m.push(line)
                m.push(line.slice(17,28))  // Invert
                m.push(line.slice(28,45))  // Diverted Link
                m.push(line.slice(45,56))  // Type

                if (m && m.length){
                        if(m[3].trim() === 'WEIR'){
                            m.push(line.slice(56,67))  // P1
                            m.push(line.slice(67,78))  // P2
                            m.push(line.slice(78,89))  // P3
                            m.push(line.slice(89,100))  // P4
                            m.push(line.slice(100,111))  // P5
                            m.push(line.slice(111,122))  // P6
                            m.push(line.slice(122,line.length))  // P7

                            section[key] = {Invert: parseFloat(m[1]), 
                                            DivertedLink: m[2].trim(), 
                                            Type: m[3].trim(), 
                                            P1: parseFloat(m[4]), 
                                            P2: parseFloat(m[5]), 
                                            P3: parseFloat(m[6]), 
                                            Dmax: parseFloat(m[7]), 
                                            Dinit: parseFloat(m[8]), 
                                            Dsurch: parseFloat(m[9]), 
                                            Aponded: parseFloat(m[10]), 
                                            Description: curDesc}
                        } else if (m[3].trim() === 'CUTOFF'){
                            m.push(line.slice(56,67))  // P1
                            m.push(line.slice(67,78))  // P2
                            m.push(line.slice(78,89))  // P3
                            m.push(line.slice(89,100))  // P4
                            m.push(line.slice(100,line.length))  // P5

                            section[key] = {Invert: parseFloat(m[1]), 
                                            DivertedLink: m[2].trim(), 
                                            Type: m[3].trim(), 
                                            P1: parseFloat(m[4]), 
                                            P2: 0, 
                                            P3: 0, 
                                            Dmax: parseFloat(m[5]), 
                                            Dinit: parseFloat(m[6]), 
                                            Dsurch: parseFloat(m[7]), 
                                            Aponded: parseFloat(m[8]), 
                                            Description: curDesc}
                        } else if (m[3].trim() === 'TABULAR'){
                            m.push(line.slice(56,73))  // P1, table name
                            m.push(line.slice(73,84))  // P2, Dmax
                            m.push(line.slice(84,95))  // P3, Dinit
                            m.push(line.slice(95,106)) // P4, Dsurch
                            m.push(line.slice(106,line.length)) // P5, Aponded

                            section[key] = {Invert: parseFloat(m[1]), 
                                            DivertedLink: m[2].trim(), 
                                            Type: m[3].trim(), 
                                            P1: m[4].trim(), 
                                            P2: 0, 
                                            P3: 0, 
                                            Dmax: parseFloat(m[5]), 
                                            Dinit: parseFloat(m[6]), 
                                            Dsurch: parseFloat(m[7]), 
                                            Aponded: parseFloat(m[8]), 
                                            Description: curDesc}
                        } else if (m[3].trim() === 'OVERFLOW'){
                            m.push(line.slice(56,67))  // P1
                            m.push(line.slice(67,78))  // P2
                            m.push(line.slice(78,89))  // P3
                            m.push(line.slice(89,line.length))  // P4
                            section[key] = {Invert: parseFloat(m[1]), 
                                            DivertedLink: m[2].trim(), 
                                            Type: m[3].trim(), 
                                            P1: 0, 
                                            P2: 0, 
                                            P3: 0, 
                                            Dmax: parseFloat(m[4]), 
                                            Dinit: parseFloat(m[5]), 
                                            Dsurch: parseFloat(m[6]), 
                                            Aponded: parseFloat(m[7]), 
                                            Description: curDesc}
                        }
                }

            },
            STORAGE: function(section, key, line) {
                var m = [];
                line = key + line;
                m.push(line)
                m.push(line.slice(17,26))  // Invert
                m.push(line.slice(26,35))  // Dmax
                m.push(line.slice(35,45))  // Dinit
                m.push(line.slice(45,56))  // Curve

                if (m && m.length){
                        if(m[4].trim() === 'FUNCTIONAL'){
                            m.push(line.slice(56,66))  // P1
                            m.push(line.slice(66,76))  // P2
                            m.push(line.slice(76,85))  // P3
                            m.push(line.slice(85,94))  // P4
                            m.push(line.slice(94,103))  // P5
                            m.push(line.slice(103,line.length))  // P6

                            section[key] = {Invert: parseFloat(m[1]), 
                                            Dmax: parseFloat(m[2]), 
                                            Dinit: parseFloat(m[3]), 
                                            Curve: m[4].trim(), 
                                            Coefficient: parseFloat(m[5]), 
                                            Exponent: parseFloat(m[6]), 
                                            Constant: parseFloat(m[7]),
                                            CurveName: '',
                                            Aponded: parseFloat(m[8]), 
                                            Fevap: parseFloat(m[9]), 
                                            SeepRate: parseFloat(m[10]), 
                                            Description: curDesc}
                        } else if (m[4].trim() === 'TABULAR'){
                            m.push(line.slice(56,85))  // P1
                            m.push(line.slice(85,94))  // P4
                            m.push(line.slice(94,103))  // P5
                            m.push(line.slice(103,line.length))  // P6

                            section[key] = {Invert: parseFloat(m[1]), 
                                            Dmax: parseFloat(m[2]), 
                                            Dinit: parseFloat(m[3]), 
                                            Curve: m[4].trim(),
                                            Coefficient: 0, 
                                            Exponent: 0, 
                                            Constant: 0,
                                            CurveName: m[5].trim(),
                                            Aponded: parseFloat(m[6]), 
                                            Fevap: parseFloat(m[7]), 
                                            SeepRate: parseFloat(m[8]), 
                                            Description: curDesc}
                        }
                }

            },
            COORDINATES: function(section, key, line) {
                var m = line.match(/\s*(-?[0-9\.]+)\s+(-?[0-9\.]+)/);
                if (m && m.length && 3 === m.length)
                    section[key] = {x: parseFloat(m[1]), y: parseFloat(m[2])};
            },
            Polygons: function(section, key, line) {
                var m = line.match(/\s*(-?[0-9\.]+)\s+(-?[0-9\.]+)/);
                        if (!section[key]) 
                            section[key] = [];
                        if (Object.keys(section[key]).length === 0)
                            section[key] = [];
                if (m && m.length && 3 === m.length) {
                            var coord = {x: parseFloat(m[1]), y: parseFloat(m[2])};
                    section[key].push(coord);
                        }
            },
            LABELS: function(section, key, line) {
                var m = line.match(/\s+([-?[0-9\.]+)\s+"([^"]+)"/);
                if (m && m.length && 3 === m.length)
                    section[Object.keys(section).length] = {x: parseFloat(key), y: parseFloat(m[1]), label: m[2]};
            },
            CONDUITS: function(section, key, line) {
                var m = line.match(/\s*([^\s;]+)\s+([^\s;]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([^;]).*/);
                if (m && m.length && (8 === m.length || 9 === m.length)) {
                    section[key] = {FromNode: m[1], ToNode: m[2], 
                    Length: parseFloat(m[3]), Roughness: parseFloat(m[4]),
                    InOffset: parseFloat(m[5]), OutOffset: parseFloat(m[6]), InitFlow: m[7], MaxFlow: m[8], Description: curDesc};
                }
            },
            SUBCATCHMENTS: function(section, key, line) {
                var m = line.match(/\s*([^\s;]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([^;]).*/);
                if (m && m.length && 9 === m.length) {
                    section[key] = {RainGage: m[1], Outlet: parseFloat(m[2]), 
                    Area: parseFloat(m[3]), PctImperv: parseFloat(m[4]),
                    Width: parseFloat(m[5]), PctSlope: parseFloat(m[6]), CurbLen: parseFloat(m[7]), SnowPack: m[8], Description: curDesc};
                }
            },
            SUBAREAS: function(section, key, line) {
                var m = [];
                line = key + line;
                m.push(line)
                m.push(line.slice(17,28))
                m.push(line.slice(28,39))
                m.push(line.slice(39,50))
                m.push(line.slice(50,61))
                m.push(line.slice(61,72))
                m.push(line.slice(72,83))
                m.push(line.slice(83, line.length))
                if (m && m.length)
                        section[key] = {NImperv: parseFloat(m[1]), 
                                        NPerv: parseFloat(m[2]), 
                                        SImperv: parseFloat(m[3]), 
                                        SPerv: parseFloat(m[4]), 
                                        PctZero: parseFloat(m[5]), 
                                        RouteTo: m[6].trim(), 
                                        PctRouted: m[7].trim()};
            },
            PUMPS: function(section, key, line) {
                //var m = line.match(/\s*([^\s;]+)\s+([^\s;]+)\s+([^\s;]+)\s+([^\s;]+).*/);
                var m = [];
                line = key + line;
                m.push(line)
                m.push(line.slice(17,34))
                m.push(line.slice(34,51))
                m.push(line.slice(51,68))
                m.push(line.slice(68,77))
                m.push(line.slice(77,86))
                m.push(line.slice(86, line.length))
                if (m && m.length)
                        section[key] = {Node1: parseFloat(m[1]), 
                                        Node2: parseFloat(m[2]), 
                                        Curve: m[3].trim(), 
                                        Status: m[4].trim(), 
                                        Dstart: parseFloat(m[5]), 
                                        Doff: parseFloat(m[6]),
                                        Description: curDesc
                }
            },
            /*
            [ORIFICES]
            ;;Orifice        From Node        To Node          Type         CrestHt    Qcoeff     Gated    CloseTime 
            ;;-------------- ---------------- ---------------- ------------ ---------- ---------- -------- ----------
            3                9                19               SIDE         3          0.65       NO       4         
            */
            ORIFICES: function(section, key, line) {
                var m = [];
                line = key + line;
                m.push(line)
                m.push(line.slice(17,34))
                m.push(line.slice(34,51))
                m.push(line.slice(51,64))
                m.push(line.slice(64,75))
                m.push(line.slice(75,86))
                m.push(line.slice(86,95))
                m.push(line.slice(95, line.length))
                if (m && m.length)
                        section[key] = {FromNode: parseFloat(m[1]), 
                                        ToNode: parseFloat(m[2]), 
                                        Type: m[3].trim(), 
                                        CrestHt: parseFloat(m[4]), 
                                        Qcoeff: parseFloat(m[5]), 
                                        Gated: m[6].trim(),
                                        CloseTime: parseFloat(m[7]),
                                        Description: curDesc
                }
            },
            /*
            [WEIRS]
            ;;Weir           From Node        To Node          Type         CrestHt    Qcoeff     Gated    EndCon   EndCoeff  
            ;;-------------- ---------------- ---------------- ------------ ---------- ---------- -------- -------- ----------
            9                20               24               SIDEFLOW     4          3.33       YES      1        6         
            */
            WEIRS: function(section, key, line) {
                var m = [];
                line = key + line;
                m.push(line)
                m.push(line.slice(17,34))
                m.push(line.slice(34,51))
                m.push(line.slice(51,64))
                m.push(line.slice(64,75))
                m.push(line.slice(75,86))
                m.push(line.slice(86,95))
                m.push(line.slice(95,104))
                m.push(line.slice(104, line.length))
                if (m && m.length)
                        section[key] = {FromNode: parseFloat(m[1]), 
                                        ToNode: parseFloat(m[2]), 
                                        Type: m[3].trim(), 
                                        CrestHt: parseFloat(m[4]), 
                                        Qcoeff: parseFloat(m[5]), 
                                        Gated: m[6].trim(),
                                        EndCon: parseFloat(m[7]),
                                        EndCoeff: parseFloat(m[8]),
                                        Description: curDesc
                }
            },

            /*
            [OUTLETS]
            ;;Outlet         From Node        To Node          CrestHt    Type            QTable/Qcoeff    Qexpon     Gated   
            ;;-------------- ---------------- ---------------- ---------- --------------- ---------------- ---------- --------
            17               21               16               1          TABULAR/DEPTH   curve22                     YES     
            */
            OUTLETS: function(section, key, line) {
                var m = [];
                line = key + line;
                m.push(line)
                m.push(line.slice(17,34))
                m.push(line.slice(34,51))
                m.push(line.slice(51,62))
                m.push(line.slice(62,78))
                m.push(line.slice(78,95))
                m.push(line.slice(95,106))
                m.push(line.slice(106, line.length))
                if (m && m.length){
                        let outletTableName = '*';
                        let outletCoeff = 0;
                        if(m[4].trim() === 'TABULAR/HEAD' || m[4].trim() === 'TABULAR/DEPTH'){
                            outletTableName = m[5].trim();
                        } else {
                            outletCoeff = parseFloat(m[5]);
                        }
                        section[key] = {FromNode: parseFloat(m[1]), 
                                        ToNode: parseFloat(m[2]), 
                                        CrestHt: parseFloat(m[3]), 
                                        Type: m[4].trim(),
                                        Qcoeff: outletCoeff, 
                                        QTable: outletTableName,
                                        Qexpon: parseFloat(m[6]),
                                        Gated: m[7].trim(),
                                        Description: curDesc
                        }
                }
            },
            XSECTIONS: function(section, key, line) {
                var m = line.match(/\s*([^\s;]+)\s+([^\s;]+)\s+([0-9\.]+)\s+([^\s;]+)\s+([^\s;]+)\s+([0-9\.]+).*/);
                if (m && m.length && 7 === m.length) {
                    section[key] = {Shape: m[1], Geom1: m[2], Geom2: m[3], Geom3: m[4], Geom4: m[5], Barrels: m[6]};
                }
            },
            POLLUTANTS: function(section, key, line) {
                var m = [];
                line = key + line;
                m.push(line)
                m.push(line.slice(17,24))
                m.push(line.slice(24,35))
                m.push(line.slice(35,46))
                m.push(line.slice(46,57))
                m.push(line.slice(57,68))
                m.push(line.slice(68,79))
                m.push(line.slice(79,96))
                m.push(line.slice(96,107))
                m.push(line.slice(107,118))
                m.push(line.slice(118,line.length))
                if (m && m.length)
                        section[key] = {Units: m[1].trim(), 
                                        Cppt: parseFloat(m[2]), 
                                        Cgw: parseFloat(m[3]), 
                                        Crdii: parseFloat(m[4]), 
                                        Kdecay: parseFloat(m[5]), 
                                        SnowOnly: m[6].trim(), 
                                        CoPollutant: m[7].trim(), 
                                        CoFrac: parseFloat(m[8]), 
                                        Cdwf: parseFloat(m[9]),  
                                        Cinit: parseFloat(m[10])};
            },
            LANDUSES: function(section, key, line) {
                var m = [];
                line = key + line;
                m.push(line)
                m.push(line.slice(17,28))
                m.push(line.slice(28,39))
                m.push(line.slice(39,line.length))
                if (m && m.length)
                        section[key] = {Interval: m[1].trim(), Available: m[2].trim(), Cleaned: m[3].trim()};
            },
            COVERAGES: function(section, key, line) {
                var m = [];
                line = key + line;
                m.push(line)
                m.push(line.slice(17,34))
                m.push(line.slice(34,line.length))
                if (m && m.length)
                        section[key] = {LandUse: m[1].trim(), Percent: parseFloat(m[2])};
            },
            LOADINGS: function(section, key, line) {
                var m = [];
                line = key + line;
                m.push(line)
                m.push(line.slice(17,34))
                m.push(line.slice(34,line.length))
                if (m && m.length)
                        section[key] = {Pollutant: m[1].trim(), InitLoad: parseFloat(m[2])};
            },
            BUILDUP: function(section, key, line) {
                var m = [];
                line = key + line;
                m.push(line)
                m.push(line.slice(0, 17))
                m.push(line.slice(17,34))
                m.push(line.slice(34,45))
                m.push(line.slice(45,56))
                m.push(line.slice(56,67))
                m.push(line.slice(67,78))
                m.push(line.slice(78,line.length))
                if (m && m.length)
                        section[Object.keys(section).length] = {
                                        LandUse: m[1].trim(), 
                                        Pollutant: m[2].trim(), 
                                        Function: m[3].trim(),
                                        Coeff1: parseFloat(m[4]) || 0,
                                        Coeff2: parseFloat(m[5]) || 0,
                                        Coeff3: parseFloat(m[6]) || 0,
                                        Normalizer: m[7].trim()};
            },  
            WASHOFF: function(section, key, line) {
                var m = [];
                line = key + line;
                m.push(line)
                m.push(line.slice(0, 17))
                m.push(line.slice(17,34))
                m.push(line.slice(34,45))
                m.push(line.slice(45,56))
                m.push(line.slice(56,67))
                m.push(line.slice(67,78))
                m.push(line.slice(78,line.length))
                if (m && m.length)
                        section[Object.keys(section).length] = {
                                        LandUse: m[1].trim(), 
                                        Pollutant: m[2].trim(), 
                                        Function: m[3].trim(),
                                        Coeff1: parseFloat(m[4]) || 0,
                                        Coeff2: parseFloat(m[5]) || 0,
                                        Ecleaning: parseFloat(m[6]) || 0,
                                        Ebmp: m[7].trim()};
            },    
            TIMESERIES: function(section, key, line) {
                var m = [];
                line = key + line;
                m.push(line)
                m.push(line.slice(17,28))
                m.push(line.slice(28,39))
                m.push(line.slice(39,line.length))
                if (m && m.length)
                        section[Object.keys(section).length] = {
                                        TimeSeries: key.trim(),
                                        Date: m[1].trim(), 
                                        Time: m[2].trim(),
                                        Value: parseFloat(m[3])};
            },  
            VERTICES: function(section, key, line) {
                var m = line.match(/\s*(-?[0-9\.]+)\s+(-?[0-9\.]+)/),
                v = section[key] || [],
                c = {};
                if (m && m.length && 3 === m.length) {
                    c.x = parseFloat(m[1]);
                    c.y = parseFloat(m[2]);
                }
                v[v.length] = c;
                section[key] = v;
            },
            REPORT: function(section, key, line) {
                    var m = line.match(/\s+([//\-:a-zA-Z0-9\.]+)/);
                    if (m && m.length)
                        section[key] = {Value: m[1]};
            },
            TAGS: function(section, key, line) {
                var m = [];
                line = key + line;
                m.push(line)
                m.push(line.slice(0, 11))
                m.push(line.slice(11,28))
                m.push(line.slice(28,line.length))
                /*if (m && m.length)
                        section[Object.keys(section).length] = {
                                        Type: m[1].trim(), 
                                        ID: m[2].trim(), 
                                        Tag: m[3].trim()};*/
                if (m && m.length)
                section.push({
                                Type: m[1].trim(), 
                                ID: m[2].trim(), 
                                Tag: m[3].trim()});
            },
            SYMBOLS: function(section, key, line) {
                var m = [];
                line = key + line;
                m.push(line)
                m.push(line.slice(17,36))
                m.push(line.slice(36,line.length))
                if (m && m.length)
                        section[key] = {XCoord: parseFloat(m[1]), 
                                        YCoord: parseFloat(m[2])};
            },  
            TIMES: function(section, key, line) { // to do: check
                var m = line.match(/(CLOCKTIME|START|TIMESTEP)\s+([^\s].*[^\s])\s*/i);
                if (m && m.length && 3 === m.length) {
                    section[(key + ' ' + m[1]).toUpperCase()] = m[2];
                }
                else {
                    section[key.toUpperCase()] = line.replace(/^\s+/, '').replace(/\s+$/, '');
                }
            }
                // add other if neccesary
        },
        model = {   SUBCATCHMENTS: [], SUBAREAS: [], CONDUITS: [], XSECTIONS: [], LOSSES: [],  PUMPS: [], ORIFICES: [], WEIRS: [], OUTLETS: [], 
                    TRANSECTS: [], CONTROLS: [], COORDINATES: [], Polygons: [], LABELS: [], SYMBOLS: [],
                    JUNCTIONS: [], STORAGE: [], OUTFALLS: [], DIVIDERS: [], RAINGAGES: [], TIMESERIES: [],
                    clickEffect: 'edit'},
        lines = text.split(/\r\n|\r|\n/),
            section = null;
        let curDesc = '';
        lines.forEach(function(line) {
            // If the entry is a comment, then attempt to assign it as the description for the current
            // object, or return nothing.
            if (regex.comment.test(line)) {
                curDesc = '';
                return;
            }
            else if (regex.description.test(line)) {
                // Get the comment without the semicolon
                curDesc = line.slice(1, line.length);

            } else if (regex.section.test(line)) {
                var s = line.match(regex.section);
                // If the section has not yet been created, create one.
                if ('undefined' === typeof model[s[1]])
                    //model[s[1]] = {};
                    model[s[1]] = [];
                section = s[1];
            } else if (regex.value.test(line)) {
                var v = line.match(regex.value);
                if (parser[section])
                    parser[section](model[section], v[1], v[2], curDesc);
                else
                    model[section][v[1]] = v[2];
                curDesc = '';
            };
        });

	    return model;
    };

    return inp;
};

// Read SWMM binary result files
d3.swmmresult = function() {
    function swmmresult() { }

    const SUBCATCH = 0,
        NODE     = 1,
        LINK     = 2,
        SYS      = 3,
        POLLUT   = 4,
        RECORDSIZE = 4;                       // number of bytes per file record

    TYPECODE = { // not used
        0: {1: 'Area'},
        1: {0: 'Junction',
            1: 'Outfall',
            2: 'Storage',
            3: 'Divider'},
        2: {0: 'Conduit',
            1: 'Pump',
            2: 'Orifice',
            3: 'Weir',
            4: 'Outlet'}
    };
            
    swmmresult.VARCODE = { 
        0: {0: 'Rainfall',
            1: 'Snow_depth',
            2: 'Evaporation_loss',
            3: 'Infiltration_loss',
            4: 'Runoff_rate',
            5: 'Groundwater_outflow',
            6: 'Groundwater_elevation',
            7: 'Soil_moisture',
            8: 'Pollutant_washoff'},
        1: {0: 'Depth_above_invert',
            1: 'Hydraulic_head',
            2: 'Volume_stored_ponded',
            3: 'Lateral_inflow',
            4: 'Total_inflow',
            5: 'Flow_lost_flooding'},
        2: {0: 'Flow_rate',
            1: 'Flow_depth',
            2: 'Flow_velocity',
            3: 'Froude_number',
            4: 'Capacity'},
        4: {0: 'Air_temperature',
            1: 'Rainfall',
            2: 'Snow_depth',
            3: 'Evaporation_infiltration',
            4: 'Runoff',
            5: 'Dry_weather_inflow',
            6: 'Groundwater_inflow',
            7: 'RDII_inflow',
            8: 'User_direct_inflow',
            9: 'Total_lateral_inflow',
            10: 'Flow_lost_to_flooding',
            11: 'Flow_leaving_outfalls',
            12: 'Volume_stored_water',
            13: 'Evaporation_rate',
            14: 'Potential_PET'}
    };
    
    _SWMM_FLOWUNITS = { // not used
            0: 'CFS',
            1: 'GPM',
            2: 'MGD',
            3: 'CMS',
            4: 'LPS',
            5: 'LPD'
    };    
    swmmresult.i4 = Module._malloc(4);
    swmmresult.string = Module._malloc(255);

    swmmresult.parse = function(filename, size) {
        console.log('Parsing swmm results...')
	    var c = (FS.findObject(filename) ? FS.findObject(filename).contents : (typeof filename === "object"? filename : undefined)),
		r = {},
		er = swmmresult;
        
        this.offsetOID = 0;

        this.SWMM_Nperiods = 0,              // number of reporting periods
        this.SWMM_FlowUnits = 0,             // flow units code
        this.SWMM_Nsubcatch = 0,             // number of subcatchments
        this.SWMM_Nnodes = 0,                // number of drainage system nodes
        this.SWMM_Nlinks = 0,                // number of drainage system links
        this.SWMM_Npolluts = 0,              // number of pollutants tracked
        this.SWMM_StartDate = new Date(),              // start date of simulation
        this.SWMM_ReportStep = 0;            // reporting time step (seconds)	
        
        this.SubcatchVars = 0,               // number of subcatch reporting variable
        this.NodeVars = 0,                   // number of node reporting variables
        this.LinkVars = 0,                   // number of link reporting variables
        this.SysVars = 0,                    // number of system reporting variables
        this.StartPos = 0,                   // file position where results start
        this.BytesPerPeriod = 0;             // bytes used for results in each period
        
        var
            magic1, magic2, errCode, version;
        var
            offset, offset0;
            
        var stat = null;
        try {
            if (c)
                stat = FS.stat(filename);
        } catch (e) {
            stat = size || "undefined";
            console.log(e);
        }
        
        if (stat) {
            var size = (stat.size ? stat.size : stat);
            if (size < 14*RECORDSIZE) {
                return 1;
            }
            this.offsetOID = er.readInt(c, size-6*RECORDSIZE, RECORDSIZE);
            offset0 = er.readInt(c, size-5*RECORDSIZE, RECORDSIZE);
            this.StartPos = er.readInt(c, size-4*RECORDSIZE, RECORDSIZE);
            this.SWMM_Nperiods = er.readInt(c, size-3*RECORDSIZE, RECORDSIZE);
            errCode = er.readInt(c, size-2*RECORDSIZE, RECORDSIZE);
            magic2 = er.readInt(c, size-RECORDSIZE, RECORDSIZE);
            magic1 = er.readInt(c, 0, RECORDSIZE);
            
            if (magic1 !== magic2) return 1;
            else if (errCode !== 0) return 1;
            else if (this.SWMM_Nperiods===0) return 1;
            
            version = er.readInt(c, RECORDSIZE, RECORDSIZE);
            this.SWMM_FlowUnits = er.readInt(c, 2*RECORDSIZE, RECORDSIZE);
            this.SWMM_Nsubcatch = er.readInt(c, 3*RECORDSIZE, RECORDSIZE);
            this.SWMM_Nnodes = er.readInt(c, 4*RECORDSIZE, RECORDSIZE);
            this.SWMM_Nlinks = er.readInt(c, 5*RECORDSIZE, RECORDSIZE);
            this.SWMM_Npolluts = er.readInt(c, 6*RECORDSIZE, RECORDSIZE);
            
            // Skip over saved subcatch/node/link input values
            offset = (this.SWMM_Nsubcatch+2) * RECORDSIZE     // Subcatchment area
                       + (3*this.SWMM_Nnodes+4) * RECORDSIZE  // Node type, invert & max depth
                       + (5*this.SWMM_Nlinks+6) * RECORDSIZE; // Link type, z1, z2, max depth & length
            offset = offset0 + offset;

            this.SubcatchVars = er.readInt(c, offset, RECORDSIZE);
            this.NodeVars = er.readInt(c, offset + (this.SubcatchVars*RECORDSIZE), RECORDSIZE);
            this.LinkVars = er.readInt(c, offset + (this.SubcatchVars*RECORDSIZE) + (this.NodeVars*RECORDSIZE), RECORDSIZE);
            this.SysVars = er.readInt(c, offset + (this.SubcatchVars*RECORDSIZE) + (this.NodeVars*RECORDSIZE) + (this.LinkVars*RECORDSIZE), RECORDSIZE);
            
            offset = this.StartPos - 3*RECORDSIZE;
            var days = (er.readInt(c, offset, 2*RECORDSIZE)+1);
            this.SWMM_StartDate = new Date('12/31/1899');
            this.SWMM_StartDate = new Date(this.SWMM_StartDate.setDate(this.SWMM_StartDate.getDate() + days));
            this.SWMM_ReportStep = er.readInt(c, offset + 2*RECORDSIZE, RECORDSIZE);
            
            this.SubcatchVars = (8 + this.SWMM_Npolluts);
            this.NodeVars = (6 + this.SWMM_Npolluts);
            this.LinkVars = (5 + this.SWMM_Npolluts);
            this.SysVars = 15;
            
            this.BytesPerPeriod = RECORDSIZE*(2 + 
                    this.SWMM_Nsubcatch*this.SubcatchVars +
                    this.SWMM_Nnodes*this.NodeVars +
                    this.SWMM_Nlinks*this.LinkVars +
                    this.SysVars); 
            
            var variables = {};
            var nr = this.offsetOID;
            // Object names
            var subcatch = {}, node = {}, link = {}, pollut = {};
            for (var i =0; i< this.SWMM_Nsubcatch; i++) {
                var no = er.readInt(c, nr, RECORDSIZE);
                subcatch[i] = [ Module.intArrayToString(Array.prototype.slice.call(c,nr, nr + no + RECORDSIZE)).replace(/[^a-z0-9_\.]/gi, '') ];
                nr = nr + no + RECORDSIZE;
            }
            variables['SUBCATCH'] = {};
            variables['SUBCATCH']['items'] = subcatch;
            
            for (var i =0; i< this.SWMM_Nnodes; i++) {
                var no = er.readInt(c, nr, RECORDSIZE);
                node[i] = [ Module.intArrayToString(Array.prototype.slice.call(c,nr, nr + no + RECORDSIZE)).replace(/[^a-z0-9_\.]/gi, '') ];
                nr = nr + no + RECORDSIZE;
            }
            variables['NODE'] = {};
            variables['NODE']['items'] = node;
            
            for (var i =0; i< this.SWMM_Nlinks; i++) {
                var no = er.readInt(c, nr, RECORDSIZE);
                link[i] = [ Module.intArrayToString(Array.prototype.slice.call(c,nr, nr + no + RECORDSIZE)).replace(/[^a-z0-9_\.]/gi, '') ];
                nr = nr + no + RECORDSIZE;
            }
            variables['LINK'] = {};
            variables['LINK']['items'] = link;
            
            for (var i =0; i< this.SWMM_Npolluts; i++) {
                var no = er.readInt(c, nr, RECORDSIZE);
                pollut[i] = Module.intArrayToString(Array.prototype.slice.call(c,nr, nr + no + RECORDSIZE)).replace(/[^a-z0-9_\.]/gi, '');
                nr = nr + no + RECORDSIZE;
            }
            variables['POLLUT'] = {};
            variables['POLLUT']['items'] = pollut;
            
            while (nr<offset0) {
                var nm = er.readInt(c, nr, RECORDSIZE);
                variables.nm = nm;
                nr = nr + RECORDSIZE;
            }
            // Object properties
            nr = offset0;
            
            var vals = [];
            
            no = er.readInt(c, nr, RECORDSIZE);
            nr = nr + RECORDSIZE;
            vals.push(no);
            no = er.readInt(c, nr, RECORDSIZE);
            nr = nr + RECORDSIZE;
            vals.push(no);
            variables['SUBCATCH']['init'] = vals;
            
            vals = [];
            for (var i =0; i< this.SWMM_Nsubcatch; i++) {
                var no = er.readInt(c, nr, RECORDSIZE);
                nr = nr + RECORDSIZE;
                vals.push(no);
            }
            variables['SUBCATCH']['properties'] = vals;
            
            vals = [];
            no = er.readInt(c, nr, RECORDSIZE);
            nr = nr + RECORDSIZE;
            vals.push(no);
            no = er.readInt(c, nr, RECORDSIZE);
            nr = nr + RECORDSIZE;
            vals.push(no);
            no = er.readInt(c, nr, RECORDSIZE);
            nr = nr + RECORDSIZE;
            vals.push(no);
            no = er.readInt(c, nr, RECORDSIZE);
            nr = nr + RECORDSIZE;
            vals.push(no);
            variables['NODE']['init'] = vals;
            
            vals = [];
            for (var i =0; i< this.SWMM_Nnodes; i++) {
                var el = {};
                var val = [];
                var no = er.readInt(c, nr, RECORDSIZE);
                nr = nr + RECORDSIZE;
                val.push(no);
                no = er.readFloat(c, nr, RECORDSIZE);
                nr = nr + RECORDSIZE;
                val.push(no);
                no = er.readFloat(c, nr, RECORDSIZE);
                nr = nr + RECORDSIZE;
                val.push(no);
                el[variables['NODE']['items'][i]] = val;
                vals.push(el);
            }
            variables['NODE']['properties'] = vals;

            vals = [];
            no = er.readInt(c, nr, RECORDSIZE);
            nr = nr + RECORDSIZE;
            vals.push(no);
            no = er.readInt(c, nr, RECORDSIZE);
            nr = nr + RECORDSIZE;
            vals.push(no);
            no = er.readInt(c, nr, RECORDSIZE);
            nr = nr + RECORDSIZE;
            vals.push(no);
            no = er.readInt(c, nr, RECORDSIZE);
            nr = nr + RECORDSIZE;
            vals.push(no);
            no = er.readInt(c, nr, RECORDSIZE);
            nr = nr + RECORDSIZE;
            vals.push(no);
            no = er.readInt(c, nr, RECORDSIZE);
            nr = nr + RECORDSIZE;
            vals.push(no);
            variables['LINK']['init'] = vals;

            vals = [];
            for (var i =0; i< this.SWMM_Nlinks; i++) {
                var el = {};
                var val = [];
                var no = er.readInt(c, nr, RECORDSIZE);
                nr = nr + RECORDSIZE;
                val.push(no);
                no = er.readFloat(c, nr, RECORDSIZE);
                nr = nr + RECORDSIZE;
                val.push(no);
                no = er.readFloat(c, nr, RECORDSIZE);
                nr = nr + RECORDSIZE;
                val.push(no);
                no = er.readFloat(c, nr, RECORDSIZE);
                nr = nr + RECORDSIZE;
                val.push(no);
                no = er.readFloat(c, nr, RECORDSIZE);
                nr = nr + RECORDSIZE;
                val.push(no);
                el[variables['LINK']['items'][i]] = val;
                vals.push(el);
            }
            variables['LINK']['properties'] = vals;
            
            r['objects'] = variables;
            
            //reporting variables - 
            //SubcatchVars = 8;
            //NodeVars = 6;
            //LinkVars = 5;
            this.StartPosResult = this.StartPos;
            for (var i = 1; i <= this.SWMM_Nperiods; i++) {
                r[i] = {};
                var no = undefined;
                var vals = {};
                var el = [];
                
                this.StartPosResult += 2*RECORDSIZE;
                
                for (var j = 0; j < this.SWMM_Nsubcatch; j++) {
                    el = [];
                    for (var k = 0; k < this.SubcatchVars ; k++) { //2 = 1 number of subcatchment variables + 1 pollutants
                        no = er.getswmmresultoffset(SUBCATCH, j, k, i);
                        el.push(er.readFloat(c, no, RECORDSIZE));
                    }
                    vals[variables['SUBCATCH']['items'][j]] = el;
                }
                r[i]['SUBCATCH'] = vals;

                vals = {};
                for (var j = 0; j <  this.SWMM_Nnodes; j++) {
                    el = [];
                    for (var k = 0; k < this.NodeVars; k++) {
                        no = er.getswmmresultoffset(NODE, j, k, i);
                        el.push(er.readFloat(c, no, RECORDSIZE));
                    }
                    vals[variables['NODE']['items'][j]] = el;
                }
                r[i]['NODE'] = vals;

                vals = {};
                for (var j = 0; j <  this.SWMM_Nlinks; j++) {
                    el = [];
                    for (var k = 0; k < this.LinkVars; k++) {
                        no = er.getswmmresultoffset(LINK, j, k, i);
                        el.push(er.readFloat(c, no, RECORDSIZE));
                    }
                    vals[variables['LINK']['items'][j]] = el;
                }
                r[i]['LINK'] = vals;

                vals = {};
                el = [];
                for (var k = 0; k < this.SysVars; k++) {
                    no = er.getswmmresultoffset(SYS, j, k, i);
                    el.push(er.readFloat(c, no, RECORDSIZE));
                }
                r[i]['SYS'] = el;

                this.StartPosResult = no + RECORDSIZE;
            }
        }
        
        return r;
    };

    swmmresult.getswmmresultoffset = function(iType, iIndex, vIndex, period ) {
        var offset1, offset2;
        offset1 = this.StartPosResult; // + (period-1)*this.BytesPerPeriod + 2*RECORDSIZE;
        
        if ( iType === SUBCATCH ) 
          offset2 = (iIndex*(this.SubcatchVars) + vIndex);
        else if (iType === NODE) 
          offset2 = (this.SWMM_Nsubcatch*this.SubcatchVars + iIndex*this.NodeVars + vIndex);
        else if (iType === LINK)
          offset2 = (this.SWMM_Nsubcatch*this.SubcatchVars + this.SWMM_Nnodes*this.NodeVars + iIndex*this.LinkVars + vIndex);
        else if (iType === SYS) 
            offset2 = (this.SWMM_Nsubcatch*this.SubcatchVars + this.SWMM_Nnodes*this.NodeVars + this.SWMM_Nlinks*this.LinkVars + vIndex);
        
        return offset1 + RECORDSIZE * offset2;
    };
    
    swmmresult.readInt = function(content, offset, recordsize) {
        Module.HEAP8.set(new Int8Array(content.slice(offset, offset + recordsize)), swmmresult.i4);
        return Module.getValue(swmmresult.i4, 'i32');
    };

    swmmresult.readFloat = function(content, offset, recordsize) {
        Module.HEAP8.set(new Int8Array(content.slice(offset, offset + recordsize)), swmmresult.i4);
        return Module.getValue(swmmresult.i4, 'float');
    };

    return swmmresult;
};

var margin = {top: 1, right: 1, bottom: 6, left: 1},
    width = 300 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var formatNumber = d3.format(",.3f"),
    format = function(d) {
        var units = swmmjs.model['OPTIONS']['Units'].replace(/\s*/g,'') || 'CMD',
                u = swmmjs.unit(units, $('#linkResult').val().toUpperCase());
        return formatNumber(d)+' '+u;
    },
    color = d3.scaleOrdinal(d3.schemeCategory10);

var swmmjs = function() {
    swmmjs = function() {
    };

    swmmjs.INPUT = 1;
    
    swmmjs.nodesections = ['JUNCTIONS', 'STORAGE', 'OUTFALLS', 'DIVIDERS'];
    swmmjs.linksections = ['CONDUITS', 'PUMPS'];

    swmmjs.mode = swmmjs.INPUT;
    swmmjs.success = false;
    swmmjs.results = false;
    swmmjs.colors = {'NODES': false, 'LINKS': false};
    swmmjs.model = false;
    swmmjs.currentScale = 1;
    swmmjs.currentPosition = [];
    swmmjs.renderLegend = false;
    swmmjs.defaultColor = '#636363';
    
    swmmjs.setMode = function(mode) {
        swmmjs.mode = mode;
        if(swmmjs.renderLegend)
            $('#legend').show();
        else
            $('#legend').hide();
            
        swmmjs.render();
    };

    // Render the map
    swmmjs.svg = function() {
	    var svg = function() {};
	
	// ======================================================================================================
	// This product includes color specifications and designs 
	// developed by Cynthia Brewer (http://colorbrewer.org/).
	// See ../../COPYING for licensing details.
	// RdYlGn
	svg.colors =  {'NODES': ["#d7191c","#fdae61","#ffffbf","#a6d96a","#1a9641"],
	// RdBu
	    'LINKS': ["#ca0020","#f4a582","#f7f7f7","#92c5de","#0571b0"]};
	// ======================================================================================================

	svg.width = window.innerWidth || document.documentElement.clientWidth || d.getElementsByTagName('body')[0].clientWidth;
	svg.nodemap = {};
	svg.lastNodeId = 0;
	svg.links = [];
	svg.nodes = [];
	svg.nodeSize = 1;
        svg.minx = undefined;
        svg.maxx = undefined;
        svg.miny = undefined;
        svg.maxy = undefined;
        svg.top = undefined;
        svg.strokeWidth = undefined;

	svg.removeAll = function(el) {
	    el.selectAll('line').remove();
	    el.selectAll('circle').remove();
	    el.selectAll('rect').remove();
	    el.selectAll('polygon').remove();
	    el.selectAll('text').remove();
	    el.selectAll('g').remove();
	};

	svg.tooltip = function(element) {
            var a = (element ? element.attributes : this.attributes),
                text = (a ? a['title'].value : '');
        
	    if(swmmjs.INPUT !== swmmjs.mode && swmmjs.success) {
		var fmt = d3.format('0.3f'),
                    nodeResult = $('#nodeResult').val().toUpperCase(),
                    v = (swmmjs.results[$('#time').val()] ? (swmmjs.results[$('#time').val()]['NODE'][text] ? swmmjs.results[$('#time').val()]['NODE'][text][nodeResult] : '') : '');
                text = fmt(v);
	    }

            document.getElementById('tooltip').style.display = 'block';
            document.getElementById('tooltip').style.backgroundColor = 'white';
            document.getElementById('tooltip').style.position = 'absolute';
            document.getElementById('tooltip').style.left = (swmmjs.currentPosition[0]+10) + 'px';
            document.getElementById('tooltip').style.top = (swmmjs.currentPosition[1]+10) + 'px';
            document.getElementById('tooltip').innerHTML = text;

	};

	svg.clearTooltips = function(element) {
            document.getElementById('tooltip').style.display = 'none';
	};


    // Creates a string in the style of an .inp file. This is used for either running a model
    // or saving a model. Once saving is more seamless, models should be autosaved before running.
    // Right now, autosaving just adds more clicks.
    svg.dataToInpString = function(){
        let model = swmmjs.model;
        let inpString = '';
        let secStr = '';
        
        secStr = 'TITLE';
        inpString += '[TITLE]\n'
        for (let entry in model[secStr]) {
            inpString += model[secStr][entry].TitleNotes;
            inpString += '\n';
        }
        
        secStr = 'OPTIONS';
        inpString +='[OPTIONS]\n;;Option             Value\n'
        for (let entry in model[secStr]) {
            inpString += entry.padEnd(21, ' ');
            inpString += model[secStr][entry].Value;
            inpString += '\n';
        }
        inpString += '\n';

        secStr = 'EVAPORATION';
        inpString +='[EVAPORATION]\n;;Evap Data      Parameters\n;;-------------- ----------------\n'
        for (let entry in model[secStr]) {
            inpString += entry.padEnd(17, ' ');
            inpString += model[secStr][entry].Value;
            inpString += '\n';
        }
        inpString += '\n';

        secStr = 'TEMPERATURE';
        inpString +='[TEMPERATURE]\n;;Temp/Wind/Snow   Source/Data\n'
        for (let entry in model[secStr]) {
            inpString += entry.padEnd(19, ' ');
            inpString += model[secStr][entry].Value;
            inpString += '\n';
        }
        inpString += '\n';

        secStr = 'RAINGAGES';
        inpString +='[RAINGAGES]\n;;Gage           Format    Interval SCF      Source\n;;-------------- --------- ------ ------ ----------\n'
        for (let entry in model[secStr]) {
            // If there is a description, save it.
            if(typeof model[secStr][entry].Description !== 'undefined' && model[secStr][entry].Description.length > 0){
                inpString += ';' + model[secStr][entry].Description + '\n';
            }
            inpString += entry.padEnd(17, ' ');
            inpString += model[secStr][entry].Format.padEnd(10, ' ');
            inpString += model[secStr][entry].Interval.padEnd(7, ' ');
            inpString += model[secStr][entry].SCF.toString().padEnd(7, ' ');
            inpString += model[secStr][entry].Source.padEnd(11, ' ');
            inpString += model[secStr][entry].SeriesName.padEnd(11, ' ');
            inpString += '\n';
        }
        inpString += '\n';

        secStr = 'SUBCATCHMENTS';
        inpString +='[SUBCATCHMENTS]\n;;Subcatchment   Rain Gage        Outlet           Area     %Imperv  Width    %Slope   CurbLen  Snow Pack       \n;;-------------- ---------------- ---------------- -------- -------- -------- -------- -------- ----------------\n'
        for (let entry in model[secStr]) {
            inpString += entry.padEnd(17, ' ');
            inpString += model[secStr][entry].RainGage.padEnd(17, ' ');
            inpString += model[secStr][entry].Outlet.toString().padEnd(17, ' ');
            inpString += model[secStr][entry].Area.toString().padEnd(9, ' ');
            inpString += model[secStr][entry].PctImperv.toString().padEnd(9, ' ');
            inpString += model[secStr][entry].Width.toString().padEnd(9, ' ');
            inpString += model[secStr][entry].PctSlope.toString().padEnd(9, ' ');
            inpString += model[secStr][entry].CurbLen.toString().padEnd(9, ' ');
            inpString += model[secStr][entry].SnowPack.padEnd(17, ' ');
            inpString += '\n';
        }
        inpString += '\n';

        secStr = 'SUBAREAS';
        inpString +='[SUBAREAS]\n;;Subcatchment   N-Imperv   N-Perv     S-Imperv   S-Perv     PctZero    RouteTo    PctRouted \n;;-------------- ---------- ---------- ---------- ---------- ---------- ---------- ----------\n'
        for (let entry in model[secStr]) {
            inpString += entry.padEnd(17, ' ');
            inpString += model[secStr][entry].NImperv.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].NPerv.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].SImperv.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].SPerv.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].PctZero.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].RouteTo.padEnd(11, ' ');
            inpString += model[secStr][entry].PctRouted.toString().padEnd(11, ' ');
            inpString += '\n';
        }
        inpString += '\n';

        secStr = 'INFILTRATION';
        inpString +='[INFILTRATION]\n;;Subcatchment   MaxRate    MinRate    Decay      DryTime    MaxInfil  \n;;-------------- ---------- ---------- ---------- ---------- ----------\n'        
        for (let entry in model[secStr]) {
            inpString += entry.padEnd(17, ' ');
            inpString += model[secStr][entry].MaxRate.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].MinRate.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Decay.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].DryTime.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].MaxInfil.toString().padEnd(11, ' ');
            inpString += '\n';
        }
        inpString += '\n';

        secStr = 'JUNCTIONS';
        inpString +='[JUNCTIONS]\n;;Junction       Invert     Dmax       Dinit      Dsurch     Aponded   \n;;-------------- ---------- ---------- ---------- ---------- ----------\n'        
        for (let entry in model[secStr]) {
            // If there is a description, save it.
            if(typeof model[secStr][entry].Description !== 'undefined' && model[secStr][entry].Description.length > 0){
                inpString += ';' + model[secStr][entry].Description + '\n';
            }
            inpString += entry.padEnd(17, ' ');
            inpString += model[secStr][entry].Invert.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Dmax.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Dinit.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Dsurch.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Aponded.toString().padEnd(11, ' ');
            inpString += '\n';
        }
        inpString += '\n';

        secStr = 'OUTFALLS';
        inpString +='[OUTFALLS]\n;;Outfall        Invert     Type       Stage Data       Gated   \n;;-------------- ---------- ---------- ---------------- --------\n'        
        for (let entry in model[secStr]) {
            // If there is a description, save it.
            if(typeof model[secStr][entry].Description !== 'undefined' && model[secStr][entry].Description.length > 0){
                inpString += ';' + model[secStr][entry].Description + '\n';
            }
            inpString += entry.padEnd(17, ' ');
            inpString += model[secStr][entry].Invert.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Type.padEnd(11, ' ');
            inpString += model[secStr][entry].StageData.padEnd(17, ' ');
            inpString += model[secStr][entry].Gated.padEnd(9, ' ');
            inpString += '\n';
        }
        inpString += '\n';

        secStr = 'DIVIDERS';
        inpString +='[DIVIDERS]\n;;Divider        Invert     Diverted Link    Type       Parameters\n;;-------------- ---------- ---------------- ---------- ----------\n'        
        for (let entry in model[secStr]) {
            // If there is a description, save it.
            if(typeof model[secStr][entry].Description !== 'undefined' && model[secStr][entry].Description.length > 0){
                inpString += ';' + model[secStr][entry].Description + '\n';
            }
            inpString += entry.padEnd(17, ' ');
            inpString += model[secStr][entry].Invert.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].DivertedLink.padEnd(17, ' ');
            inpString += model[secStr][entry].Type.padEnd(11, ' ');
            if(model[secStr][entry].Type === 'TABULAR'){
                inpString += model[secStr][entry].P1.padEnd(17, ' ');
            } else if(model[secStr][entry].Type !== 'OVERFLOW'){
                inpString += model[secStr][entry].P1.toString().padEnd(11, ' ');
            }
            if(model[secStr][entry].Type === 'WEIR'){
                inpString += model[secStr][entry].P2.toString().padEnd(11, ' ');
                inpString += model[secStr][entry].P3.toString().padEnd(11, ' ');
            }
            inpString += model[secStr][entry].Dmax.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Dinit.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Dsurch.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Aponded.toString().padEnd(11, ' ');
            inpString += '\n';
        }
        inpString += '\n';

        secStr = 'STORAGE';
        inpString +='[STORAGE]\n;;Storage Node   Invert   Dmax     Dinit     Curve      Name/Params                  Aponded  Fevap    SeepRate\n;;-------------- -------- -------- --------- ---------- ---------------------------- -------- -------- --------\n'        
        for (let entry in model[secStr]) {
            // If there is a description, save it.
            if(typeof model[secStr][entry].Description !== 'undefined' && model[secStr][entry].Description.length > 0){
                inpString += ';' + model[secStr][entry].Description + '\n';
            }
            inpString += entry.padEnd(17, ' ');
            inpString += model[secStr][entry].Invert.toString().padEnd(9, ' ');
            inpString += model[secStr][entry].Dmax.toString().padEnd(9, ' ');
            inpString += model[secStr][entry].Dinit.toString().padEnd(9, ' ');
            inpString += model[secStr][entry].Curve.padEnd(11, ' ');


            if(model[secStr][entry].Curve === 'TABULAR'){
                inpString += model[secStr][entry].CurveName.padEnd(29, ' ');
            } else if(model[secStr][entry].Curve === 'FUNCTIONAL'){
                inpString += model[secStr][entry].Coefficient.toString().padEnd(10, ' ');
                inpString += model[secStr][entry].Exponent.toString().padEnd(10, ' ');
                inpString += model[secStr][entry].Constant.toString().padEnd(9, ' ');
            }
            inpString += model[secStr][entry].Aponded.toString().padEnd(9, ' ');
            inpString += model[secStr][entry].Fevap.toString().padEnd(9, ' ');
            inpString += model[secStr][entry].SeepRate.toString().padEnd(9, ' ');
            inpString += '\n';
        }
        inpString += '\n';

        secStr = 'CONDUITS';
        inpString +='[CONDUITS]\n;;Conduit        From Node        To Node          Length     Roughness  InOffset   OutOffset  InitFlow   MaxFlow   \n;;-------------- ---------------- ---------------- ---------- ---------- ---------- ---------- ---------- ----------\n'        
        for (let entry in model[secStr]) {
            // If there is a description, save it.
            if(typeof model[secStr][entry].Description !== 'undefined' && model[secStr][entry].Description.length > 0){
                inpString += ';' + model[secStr][entry].Description + '\n';
            }
            inpString += entry.padEnd(17, ' ');
            inpString += model[secStr][entry].FromNode.toString().padEnd(17, ' ');
            inpString += model[secStr][entry].ToNode.toString().padEnd(17, ' ');
            inpString += model[secStr][entry].Length.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Roughness.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].InOffset.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].OutOffset.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].InitFlow.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].MaxFlow.toString().padEnd(11, ' ');
            inpString += '\n';
        }
        inpString += '\n';

        secStr = 'PUMPS';
        inpString +='[PUMPS]\n;;Pump           From Node        To Node          PumpCurve        Status   Dstart   Doff    \n;;-------------- ---------------- ---------------- ---------------- ------ -------- --------\n'        
        for (let entry in model[secStr]) {
            // If there is a description, save it.
            if(typeof model[secStr][entry].Description !== 'undefined' && model[secStr][entry].Description.length > 0){
                inpString += ';' + model[secStr][entry].Description + '\n';
            }
            inpString += entry.padEnd(17, ' ');
            inpString += model[secStr][entry].Node1.toString().padEnd(17, ' ');
            inpString += model[secStr][entry].Node2.toString().padEnd(17, ' ');
            inpString += model[secStr][entry].Curve.padEnd(17, ' ');
            inpString += model[secStr][entry].Status.padEnd(9, ' ');
            inpString += model[secStr][entry].Dstart.toString().padEnd(9, ' ');
            inpString += model[secStr][entry].Doff.toString().padEnd(9, ' ');
            inpString += '\n';
        }
        inpString += '\n';

        /*
        [ORIFICES]
        ;;Orifice        From Node        To Node          Type         CrestHt    Qcoeff     Gated    CloseTime 
        ;;-------------- ---------------- ---------------- ------------ ---------- ---------- -------- ----------
        3                9                19               SIDE         3          0.65       NO       4         
        */
        secStr = 'ORIFICES';
        inpString +='[ORIFICES]\n;;Orifice        From Node        To Node          Type         CrestHt    Qcoeff     Gated    CloseTime \n;;-------------- ---------------- ---------------- ------------ ---------- ---------- -------- ----------\n'        
        for (let entry in model[secStr]) {
            // If there is a description, save it.
            if(typeof model[secStr][entry].Description !== 'undefined' && model[secStr][entry].Description.length > 0){
                inpString += ';' + model[secStr][entry].Description + '\n';
            }
            inpString += entry.padEnd(17, ' ');
            inpString += model[secStr][entry].FromNode.toString().padEnd(17, ' ');
            inpString += model[secStr][entry].ToNode.toString().padEnd(17, ' ');
            inpString += model[secStr][entry].Type.padEnd(13, ' ');
            inpString += model[secStr][entry].CrestHt.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Qcoeff.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Gated.padEnd(9, ' ');
            inpString += model[secStr][entry].CloseTime.toString().padEnd(10, ' ');
            inpString += '\n';
        }
        inpString += '\n';
        /*
        [WEIRS]
        ;;Weir           From Node        To Node          Type         CrestHt    Qcoeff     Gated    EndCon   EndCoeff  
        ;;-------------- ---------------- ---------------- ------------ ---------- ---------- -------- -------- ----------
        9                20               24               SIDEFLOW     4          3.33       YES      1        6         
        */

        secStr = 'WEIRS';
        inpString +='[WEIRS]\n;;Weir           From Node        To Node          Type         CrestHt    Qcoeff     Gated    EndCon   EndCoeff  \n;;-------------- ---------------- ---------------- ------------ ---------- ---------- -------- -------- ----------\n'        
        for (let entry in model[secStr]) {
            // If there is a description, save it.
            if(typeof model[secStr][entry].Description !== 'undefined' && model[secStr][entry].Description.length > 0){
                inpString += ';' + model[secStr][entry].Description + '\n';
            }
            inpString += entry.padEnd(17, ' ');
            inpString += model[secStr][entry].FromNode.toString().padEnd(17, ' ');
            inpString += model[secStr][entry].ToNode.toString().padEnd(17, ' ');
            inpString += model[secStr][entry].Type.padEnd(13, ' ');
            inpString += model[secStr][entry].CrestHt.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Qcoeff.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Gated.toString().padEnd(9, ' ');
            inpString += model[secStr][entry].EndCon.toString().padEnd(9, ' ');
            inpString += model[secStr][entry].EndCoeff.toString().padEnd(10, ' ');
            inpString += '\n';
        }
        inpString += '\n';

            /*
            [OUTLETS]
            ;;Outlet         From Node        To Node          CrestHt    Type            QTable/Qcoeff    Qexpon     Gated   
            ;;-------------- ---------------- ---------------- ---------- --------------- ---------------- ---------- --------
            17               21               16               1          TABULAR/DEPTH   curve22                     YES     

            */

        secStr = 'OUTLETS';
        inpString +='[OUTLETS]\n;;Outlet         From Node        To Node          CrestHt    Type            QTable/Qcoeff    Qexpon     Gated   \n;;-------------- ---------------- ---------------- ---------- --------------- ---------------- ---------- --------\n'        
        for (let entry in model[secStr]) {
            // If there is a description, save it.
            if(typeof model[secStr][entry].Description !== 'undefined' && model[secStr][entry].Description.length > 0){
                inpString += ';' + model[secStr][entry].Description + '\n';
            }
            inpString += entry.padEnd(17, ' ');
            inpString += model[secStr][entry].FromNode.toString().padEnd(17, ' ');
            inpString += model[secStr][entry].ToNode.toString().padEnd(17, ' ');
            inpString += model[secStr][entry].CrestHt.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Type.toString().padEnd(16, ' ');
            // If the type is TABULAR/DEPTH or TABULAR/HEAD, then QTable is in QTable/Qcoeff, else, Qcoeff is in QTable/Qcoeff
            if(model[secStr][entry].Type === 'TABULAR/DEPTH' || model[secStr][entry].Type === 'TABULAR/HEAD'){
                inpString += model[secStr][entry].QTable.toString().padEnd(17, ' ');
            } else {
                inpString += model[secStr][entry].Qcoeff.toString().padEnd(17, ' ');
            }
            inpString += model[secStr][entry].Qexpon.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Gated.toString().padEnd(8, ' ');
            inpString += '\n';
        }
        inpString += '\n';

        secStr = 'XSECTIONS';
        inpString +='[XSECTIONS]\n;;Link           Shape        Geom1            Geom2      Geom3      Geom4      Barrels   \n;;-------------- ------------ ---------------- ---------- ---------- ---------- ----------\n'        
        for (let entry in model[secStr]) {
            inpString += entry.padEnd(17, ' ');
            inpString += model[secStr][entry].Shape.padEnd(13, ' ');
            inpString += model[secStr][entry].Geom1.toString().padEnd(17, ' ');
            inpString += model[secStr][entry].Geom2.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Geom3.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Geom4.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Barrels.toString().padEnd(11, ' ');
            inpString += '\n';
        }
        inpString += '\n';

        secStr = 'LOSSES';
        inpString +='[LOSSES]\n;;Link           Kin        Kout       Kavg       Flap Gate  SeepRate  \n;;-------------- ---------- ---------- ---------- ---------- ----------\n'        
        for (let entry in model[secStr]) {
            inpString += entry.padEnd(17, ' ');
            inpString += model[secStr][entry].Kin.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Kout.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Kavg.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].FlapGate.padEnd(11, ' ');
            inpString += model[secStr][entry].SeepRate.toString().padEnd(11, ' ');
            inpString += '\n';
        }
        inpString += '\n';

        secStr = 'POLLUTANTS';
        inpString +='[POLLUTANTS]\n;;Pollutant      Units  Cppt       Cgw        Crdii      Kdecay     SnowOnly   Co-Pollutant     Co-Frac    Cdwf       Cinit     \n;;-------------- ------ ---------- ---------- ---------- ---------- ---------- ---------------- ---------- ---------- ----------\n'        
        for (let entry in model[secStr]) {
            inpString += entry.padEnd(17, ' ');
            inpString += model[secStr][entry].Units.padEnd(7, ' ');
            inpString += model[secStr][entry].Cppt.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Cgw.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Crdii.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Kdecay.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].SnowOnly.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].CoPollutant.padEnd(17, ' ');
            inpString += model[secStr][entry].CoFrac.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Cdwf.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Cinit.toString().padEnd(11, ' ');
            inpString += '\n';
        }
        inpString += '\n';

        secStr = 'LANDUSES';
        inpString +='[LANDUSES]\n;;               Cleaning   Fraction   Last      \n;;Land Use       Interval   Available  Cleaned   \n;;-------------- ---------- ---------- ----------\n'        
        for (let entry in model[secStr]) {
            inpString += entry.padEnd(17, ' ');
            inpString += model[secStr][entry].Interval.padEnd(11, ' ');
            inpString += model[secStr][entry].Available.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Cleaned.padEnd(11, ' ');
            inpString += '\n';
        }
        inpString += '\n';

        secStr = 'COVERAGES';
        inpString +='[COVERAGES]\n;;Subcatchment   Land Use         Percent   \n;;-------------- ---------------- ----------\n'        
        for (let entry in model[secStr]) {
            inpString += entry.padEnd(17, ' ');
            inpString += model[secStr][entry].LandUse.padEnd(17, ' ');
            inpString += model[secStr][entry].Percent.toString().padEnd(11, ' ');
            inpString += '\n';
        }
        inpString += '\n';

        secStr = 'LOADINGS';
        inpString +='[LOADINGS]\n;;Subcatchment   Pollutant        InitLoad  \n;;-------------- ---------------- ----------\n'        
        for (let entry in model[secStr]) {
            inpString += entry.padEnd(17, ' ');
            inpString += model[secStr][entry].Pollutant.padEnd(17, ' ');
            inpString += model[secStr][entry].InitLoad.toString().padEnd(11, ' ');
            inpString += '\n';
        }
        inpString += '\n';

        secStr = 'BUILDUP';
        inpString +='[BUILDUP]\n;;Land Use       Pollutant        Function   Coeff1     Coeff2     Coeff3     Normalizer\n;;-------------- ---------------- ---------- ---------- ---------- ---------- ----------\n'        
        for (let entry in model[secStr]) {
            inpString += model[secStr][entry].LandUse.padEnd(17, ' ');
            inpString += model[secStr][entry].Pollutant.padEnd(17, ' ');
            inpString += model[secStr][entry].Function.padEnd(11, ' ');
            inpString += model[secStr][entry].Coeff1.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Coeff2.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Coeff3.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Normalizer.padEnd(11, ' ');
            inpString += '\n';
        }
        inpString += '\n';

        secStr = 'WASHOFF';
        inpString +='[WASHOFF]\n;;Land Use       Pollutant        Function   Coeff1     Coeff2     Ecleaning  Ebmp      \n;;-------------- ---------------- ---------- ---------- ---------- ---------- ----------\n'        
        for (let entry in model[secStr]) {
            inpString += model[secStr][entry].LandUse.padEnd(17, ' ');
            inpString += model[secStr][entry].Pollutant.padEnd(17, ' ');
            inpString += model[secStr][entry].Function.padEnd(11, ' ');
            inpString += model[secStr][entry].Coeff1.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Coeff2.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Ecleaning.toString().padEnd(11, ' ');
            inpString += model[secStr][entry].Ebmp.padEnd(11, ' ');
            inpString += '\n';
        }
        inpString += '\n';

        secStr = 'TIMESERIES';
        inpString +='[TIMESERIES]\n;;Time Series    Date       Time       Value     \n;;-------------- ---------- ---------- ----------\n'        
        for (let entry in model[secStr]) {
            inpString += model[secStr][entry].TimeSeries.padEnd(17, ' ');
            inpString += model[secStr][entry].Date.padEnd(11, ' ');
            inpString += model[secStr][entry].Time.padEnd(11, ' ');
            inpString += model[secStr][entry].Value.toString().padEnd(11, ' ');
            inpString += '\n';
        }
        inpString += '\n';

        secStr = 'REPORT';
        inpString +='[REPORT]\n;;Reporting Options\n'
        for (let entry in model[secStr]) {
            inpString += entry.padEnd(21, ' ');
            inpString += model[secStr][entry].Value;
            inpString += '\n';
        }
        inpString += '\n';

        secStr = 'TAGS';
        inpString +='[TAGS]\n'
        for (let entry in Object.values(model[secStr])) {
            inpString += model[secStr][entry].Type.padEnd(11, ' ');
            inpString += model[secStr][entry].ID.padEnd(17, ' ');
            inpString += model[secStr][entry].Tag;
            inpString += '\n';
        }
        inpString += '\n';

        secStr = 'MAP';
        inpString +='[MAP]\n'
        for (let entry in model[secStr]) {
            inpString += entry.padEnd(21, ' ');
            inpString += model[secStr][entry].Value;
            inpString += '\n';
        }
        inpString += '\n';

        secStr = 'COORDINATES';
        inpString +='[COORDINATES]\n;;Node           X-Coord            Y-Coord           \n;;-------------- ------------------ ------------------\n'        
        for (let entry in model[secStr]) {
            inpString += entry.padEnd(17, ' ');
            inpString += model[secStr][entry].x.toString().padEnd(19, ' ');
            inpString += model[secStr][entry].y.toString().padEnd(19, ' ');
            inpString += '\n';
        }
        inpString += '\n';

        secStr = 'VERTICES';
        inpString +='[VERTICES]\n;;Link           X-Coord            Y-Coord           \n;;-------------- ------------------ ------------------\n'        
        for (let entry in model[secStr]) {
            for (let point in model[secStr][entry]){
                inpString += entry.padEnd(17, ' ');
                inpString += model[secStr][entry][point].x.toString().padEnd(19, ' ');
                inpString += model[secStr][entry][point].y.toString().padEnd(19, ' ');
                inpString += '\n';
            }
        }
        inpString += '\n';

        secStr = 'Polygons';
        inpString +='[Polygons]\n;;Subcatchment   X-Coord            Y-Coord           \n;;-------------- ------------------ ------------------\n'        
        for (let entry in model[secStr]) {
            for (let point in model[secStr][entry]){
                inpString += entry.padEnd(17, ' ');
                inpString += model[secStr][entry][point].x.toString().padEnd(19, ' ');
                inpString += model[secStr][entry][point].y.toString().padEnd(19, ' ');
                inpString += '\n';
            }
        }
        inpString += '\n';

        secStr = 'SYMBOLS';
        inpString +='[SYMBOLS]\n;;Gage           X-Coord            Y-Coord           \n;;-------------- ------------------ ------------------\n'        
        for (let entry in model[secStr]) {
            inpString += entry.padEnd(17, ' ');
            inpString += model[secStr][entry].XCoord.toString().padEnd(19, ' ');
            inpString += model[secStr][entry].YCoord.toString().padEnd(19, ' ');
            inpString += '\n';
        }
        inpString += '\n';

        return inpString;
    }

    // svg.save is called when a save button is clicked.
    svg.save = function() {
        inpString = svg.dataToInpString();

        let fileOut = 'AutoInp.inp';
        let blob = new Blob([inpString], {type: 'text/csv'});
        if(window.navigator.msSaveOrOpenBlob){
            window.navigator.msSaveBlob(blob, fileOut);
        } else {
            let elem = window.document.createElement('a');
            elem.href = window.URL.createObjectURL(blob);
            elem.download = fileOut;
            document.body.appendChild(elem);
            elem.click();
            document.body.removeChild(elem);

            //window.URL.revokeObjectURL(elem.href);
        }
    }

	svg.render = function() {
        // If there is a current zoom applied, record that zoom and apply it at the end of the rerender.

	    var el = d3.select('#svgSimple').select('g'),
		    model = swmmjs.model,		
		    linksections = ['CONDUITS', 'PUMPS', 'ORIFICES', 'WEIRS', 'OUTLETS'],
		    step = $('#time').val(),
		    nodeResult = $('#nodeResult').val().toUpperCase(),
		    linkResult = $('#linkResult').val().toUpperCase();
	    svg.removeAll(el);

        if (!el._groups[0][0]) { 
            // nothing found 
            d3.select('#svgSimple').append('g');
            el = d3.select('#svgSimple').select('g');
            // Create the default view object
            /*el.append('rect')
                .attr('width', '1000')
                .attr('height', '1000')
                .attr('fill', 'rgba(0, 0, 0, 0)')
                .attr('stroke', 'rgba(0, 0, 0, 0)')*/
        }

	    if ('object' !== typeof model.COORDINATES)
		return;
            
            var coords = d3.values(model.COORDINATES),
		    x = function(c) {
                return c.x
            },
		    y = function(c) {
                return c.y
            };
            svg.minx = d3.min(coords, x);
            svg.maxx = d3.max(coords, x);
            svg.miny = d3.min(coords, y);
            svg.maxy = d3.max(coords, y);
            
            if (!svg.minx || !svg.maxx || !svg.miny || !svg.maxy){
                svg.minx = 0;
                svg.maxx = 1000;
                svg.miny = 0;
                svg.maxy = 1000;
            }
            
            var height = (svg.maxy - svg.miny),
                width = (svg.maxx - svg.minx),
                scale = width * 0.1;
            
            svg.strokeWidth = height / 200;
            svg.top = svg.maxy + scale;

            d3.select('#svgSimple').attr('viewBox', (svg.minx - scale) + ' ' + 0 + ' ' + (width + 2 * scale) + ' ' + (height + 2 * scale));
	    //el.attr('viewBox', (svg.minx - scale) + ' ' + 0 + ' ' + (width + 2 * scale) + ' ' + (height + 2 * scale));

	    svg.nodeSize = height / 75,
	    el.append('circle')
		    .attr('cx', svg.minx + width / 2)
		    .attr('cy', svg.top - height / 2)
		    .attr('r', svg.nodeSize)
		    .attr('style', 'fill: black');
	    var c = d3.select('circle');
	    if (c && c[0] && c[0][0] && c[0][0].getBoundingClientRect)
	    {
		var r = c[0][0].getBoundingClientRect();
		if (r && r.height && r.width) {
		    svg.nodeSize = svg.nodeSize / r.height * 10;
		}
	    }
	    svg.removeAll(el);

        // Render polygons
        if (model.Polygons) {
            for (var polygon in model.Polygons) {
                var c = model.Polygons[polygon],			
                        color = swmmjs.defaultColor;
                var points = '';
                Object.keys(c).forEach(function(key) {
                    points += c[key].x + ' ' + (svg.top - c[key].y) + ' ';
                });
                el.append('g').attr('id',polygon).attr('class', 'polygon_ gpolygon').append('polygon')
                            .attr('points', points)
                            .attr('title', polygon)
                            .attr('onmouseover', 'swmmjs.svg.tooltip(evt.target)')
                            .attr('onmouseout', 'swmmjs.svg.clearTooltips(evt.target)')
                            .attr('onclick', 'modalEditSubcatchments('+polygon+');')
                            .attr('class', 'polygon')
                            .attr('fill', 'transparent')
                            .attr("stroke-width", 7)
                            .attr("stroke", color);
            }
        }

	    // Render links
	    for (var section in linksections) {
            var s = linksections[section];
            if (model[s]) {
                for (var link in model[s]) {
                    var l = model[s][link],
                        node1 = l.FromNode || l.Node1 || false,
                        node2 = l.ToNode || l.Node2 || false,
                        c1 = model.COORDINATES[node1] || false,
                        c2 = model.COORDINATES[node2] || false,
                        v = (swmmjs.results[step] ? ( swmmjs.results[step]['LINK'] ? (swmmjs.results[step]['LINK'][link] ? swmmjs.results[step]['LINK'][link][linkResult] : 0) : 0 ) : 0),
                        r = swmmjs.colors['LINKS'],
                        linkColors = swmmjs.svg.colors['LINKS'],
                        color = (swmmjs.INPUT === swmmjs.mode ? swmmjs.defaultColor: linkColors[r(v)]);
                    
                    if (c1 && c2) {
                        var centerx = (c1.x + c2.x) / 2,
                            centery = (c1.y + c2.y) / 2,
                            angle = 180 / Math.PI * Math.atan2(c1.y - c2.y, c2.x - c1.x),
                            transform = 'rotate(' + angle + ' ' + centerx + ' ' + (svg.top - centery) + ')';
                        if (model['VERTICES'][link]) {
                            // Render polylines  
                            var v = model['VERTICES'][link],
                                d = 'M ' + c1.x + ' ' + (svg.top - c1.y);
                            for (var point in v) {
                                var p = v[point];
                                d = d + ' L ' + p.x + ' ' + (svg.top - p.y);
                            }
                            d = d + ' L ' + c2.x + ' ' + (svg.top - c2.y);
                            el.append('g').attr('id', link).attr('class', 'link_ gvertice').append('path')
                                .attr('stroke', color)
                                .attr('fill', 'none')
                                .attr('d', d)
                                .attr('class', 'vertice')
                                .attr('stroke-width', svg.strokeWidth);

                        } 
                        if ('CONDUITS' === s) {
                            // If this conduit is already a vertice, just update the vertice object with 
                            // the conduit attributes:
                            if(model['VERTICES'][link]){
                                d3.select('[id="'+link+'"]')
                                    .attr('class', 'link_ gconduit')
                                d3.select('[id="'+link+'"].gconduit').select('path')
                                    .attr('title', link)
                                    .attr('onclick', 'modalEditConduits('+link+');')
                                    .attr('onmouseover', 'swmmjs.svg.tooltip(evt.target)')
                                    .attr('onmouseout', 'swmmjs.svg.clearTooltips(evt.target)')
                                    .attr('stroke', color)
                                    .attr('class', 'conduit')
                                    .attr('stroke-width', svg.strokeWidth)
                            } else {
                                el.append('g').attr('id', link).attr('class', 'link_ gconduit').append('line')
                                    .attr('x1', c1.x)
                                    .attr('y1', svg.top - c1.y)
                                    .attr('x2', c2.x)
                                    .attr('y2', svg.top - c2.y)
                                    .attr('title', link)
                                    .attr('onclick', 'modalEditConduits('+link+');')
                                    .attr('onmouseover', 'swmmjs.svg.tooltip(evt.target)')
                                    .attr('onmouseout', 'swmmjs.svg.clearTooltips(evt.target)')
                                    .attr('stroke', color)
                                    .attr('class', 'conduit')
                                    .attr('stroke-width', svg.strokeWidth)
                            }
                            
                        } else if ('PUMPS' === s) {
                            // line
                            el.append('g').attr('id', link).attr('class', 'link_ gpump').append('line')
                                .attr('x1', c1.x)
                                .attr('y1', svg.top - c1.y)
                                .attr('x2', c2.x)
                                .attr('y2', svg.top - c2.y)
                                .attr('title', link)
                                .attr('onclick', 'modalEditPumps('+link+');')
                                .attr('onmouseover', 'swmmjs.svg.tooltip(evt.target)')
                                .attr('onmouseout', 'swmmjs.svg.clearTooltips(evt.target)')
                                .attr('stroke', color)
                                .attr('class', 'pump')
                                .attr('stroke-width', svg.strokeWidth);
                            // pump
                            /*el.append('g').attr('id', 'id'+link).attr('class', 'link_ gpump1').append('circle')
                                .attr('cx', centerx)
                                .attr('cy', svg.top - centery)
                                .attr('r', svg.nodeSize)
                                .attr('class', 'pump1')
                                .attr('style', 'fill:'+color+';');
                            el.append('g').attr('id', 'id'+link).attr('class', 'link_ gpump2').append('rect')
                                .attr('width', svg.nodeSize * 1.5)
                                .attr('height', svg.nodeSize)
                                .attr('x', centerx)
                                .attr('y', svg.top - centery - svg.nodeSize)
                                .attr('data-x', centerx)
                                .attr('data-y', centery)
                                .attr('transform', transform)
                                .attr('class', 'pump2')
                                .attr('style', 'fill:'+color+';');*/
                        } else if ('ORIFICES' === s) {
                            // line
                            el.append('g').attr('id', link).attr('class', 'link_ gorifice').append('line')
                                .attr('x1', c1.x)
                                .attr('y1', svg.top - c1.y)
                                .attr('x2', c2.x)
                                .attr('y2', svg.top - c2.y)
                                .attr('title', link)
                                .attr('onclick', 'modalEditOrifices('+link+');')
                                .attr('onmouseover', 'swmmjs.svg.tooltip(evt.target)')
                                .attr('onmouseout', 'swmmjs.svg.clearTooltips(evt.target)')
                                .attr('stroke', color)
                                .attr('class', 'orifice')
                                .attr('stroke-width', svg.strokeWidth);
                        } else if ('WEIRS' === s) {
                            // line
                            el.append('g').attr('id', link).attr('class', 'link_ gweir').append('line')
                                .attr('x1', c1.x)
                                .attr('y1', svg.top - c1.y)
                                .attr('x2', c2.x)
                                .attr('y2', svg.top - c2.y)
                                .attr('title', link)
                                .attr('onclick', 'modalEditWeirs('+link+');')
                                .attr('onmouseover', 'swmmjs.svg.tooltip(evt.target)')
                                .attr('onmouseout', 'swmmjs.svg.clearTooltips(evt.target)')
                                .attr('stroke', color)
                                .attr('class', 'weir')
                                .attr('stroke-width', svg.strokeWidth);
                        } else if ('OUTLETS' === s) {
                            // line
                            el.append('g').attr('id', link).attr('class', 'link_ goutlet').append('line')
                                .attr('x1', c1.x)
                                .attr('y1', svg.top - c1.y)
                                .attr('x2', c2.x)
                                .attr('y2', svg.top - c2.y)
                                .attr('title', link)
                                .attr('onclick', 'modalEditOutlets('+link+');')
                                .attr('onmouseover', 'swmmjs.svg.tooltip(evt.target)')
                                .attr('onmouseout', 'swmmjs.svg.clearTooltips(evt.target)')
                                .attr('stroke', color)
                                .attr('class', 'outlet')
                                .attr('stroke-width', svg.strokeWidth);
                        }
                    }
                }
            }
	    }
	    // Render nodes
	    for (var coordinate in model.COORDINATES)
	    {
            var c = model.COORDINATES[coordinate],			
                v = (swmmjs.results[step] ? (swmmjs.results[step]['NODE'] ? (swmmjs.results[step]['NODE'][coordinate] ? swmmjs.results[step]['NODE'][coordinate][nodeResult] : 0) : 0) : 0),
                r = swmmjs.colors['NODES'],
                nodeColors = swmmjs.svg.colors['NODES'],
                color = (swmmjs.INPUT === swmmjs.mode ? swmmjs.defaultColor: nodeColors[r(v)]);
            if (model.STORAGE[coordinate]) {
                el.append('g').attr('id', coordinate).attr('class', 'node_ gstorage').append('rect')
                    .attr('width', svg.nodeSize * 2)
                    .attr('height', svg.nodeSize * 2)
                    .attr('x', c.x - svg.nodeSize)
                    .attr('y', svg.top - c.y - svg.nodeSize)
                    .attr('data-x', c.x)
                    .attr('data-y', svg.top - c.y)
                                .attr('data-y0', c.y)
                    .attr('title', coordinate)
                    .attr('onclick', 'modalEditStorageunits('+coordinate+');')
                    .attr('onmouseover', 'swmmjs.svg.tooltip(evt.target)')
                    .attr('onmouseout', 'swmmjs.svg.clearTooltips(evt.target)')
                        .attr('class', 'storage')
                    .attr('fill', color);
            } else if (model.OUTFALLS[coordinate]) {
                el.append('g').attr('id',coordinate).attr('class', 'node_ goutfall').append('polygon')
                    .attr('points', (c.x - svg.nodeSize) + ' ' + (svg.top - c.y - svg.nodeSize) + ' ' +
                    (c.x + svg.nodeSize) + ' ' + (svg.top - c.y - svg.nodeSize) + ' ' +
                    c.x + ' ' + (svg.top - c.y + svg.nodeSize))
                    .attr('title', coordinate)
                    .attr('data-x', c.x)
                    .attr('data-y', svg.top - c.y)
                                .attr('data-y0', c.y)
                    .attr('onclick', 'modalEditOutfalls('+coordinate+');')
                    .attr('onmouseover', 'swmmjs.svg.tooltip(evt.target)')
                    .attr('onmouseout', 'swmmjs.svg.clearTooltips(evt.target)')
                        .attr('class', 'outfall')
                    .attr('fill', color);
            }else if (model.DIVIDERS[coordinate]) {
                el.append('g').attr('id',coordinate).attr('class', 'node_ gdivider').append('polygon')
                    .attr('points', 
                    c.x                         + ' ' + (svg.top - c.y - swmmjs.svg.nodeSize) + ' ' +
                    (c.x - swmmjs.svg.nodeSize) + ' ' + (svg.top - c.y) + ' ' +
                    c.x                         + ' ' + (svg.top - c.y + swmmjs.svg.nodeSize) + ' ' +
                    (c.x + swmmjs.svg.nodeSize) + ' ' + (svg.top - c.y))
                    .attr('title', coordinate)
                    .attr('data-x', c.x)
                    .attr('data-y', svg.top - c.y)
                                .attr('data-y0', c.y)
                    .attr('onclick', 'modalEditDividers('+coordinate+');')
                    .attr('onmouseover', 'swmmjs.svg.tooltip(evt.target)')
                    .attr('onmouseout', 'swmmjs.svg.clearTooltips(evt.target)')
                        .attr('class', 'divider')
                    .attr('fill', color);
            } else if (model.JUNCTIONS[coordinate])  {
                el.append('g').attr('id',coordinate).attr('class', 'node_ gjunction').append('circle')
                    .attr('cx', c.x)
                    .attr('cy', swmmjs.svg.top - c.y)
                    .attr('r', swmmjs.svg.nodeSize)
                    .attr('data-x', c.x)
                    .attr('data-y', swmmjs.svg.top - c.y)
                    .attr('onclick', 'modalEditJunctions('+coordinate+');')
                    .attr('title', coordinate)
                    .attr('onmouseover', 'swmmjs.svg.tooltip(evt.target)')
                    .attr('onmouseout', 'swmmjs.svg.clearTooltips(evt.target)')
                        .attr('class', 'junction')
                    .attr('fill', color);
            }
	    }

        for (var symbol in model.SYMBOLS)
	    {
            var c = model.SYMBOLS[symbol]
            if (model.RAINGAGES[symbol]) {
                el.append('g').attr('id', symbol).attr('class', 'node_ graingage').append('circle')
                    .attr('cx', c.XCoord)
                    .attr('cy', swmmjs.svg.top - c.YCoord)
                    .attr('r', swmmjs.svg.nodeSize)
                    .attr('data-x', c.XCoord)
                    .attr('data-y', swmmjs.svg.top - c.YCoord)
                    .attr('title', symbol)
                    .attr('onclick', 'modalEditRaingages("'+symbol+'");')
                    .attr('onmouseover', 'swmmjs.svg.tooltip(evt.target)')
                    .attr('onmouseout', 'swmmjs.svg.clearTooltips(evt.target)')
                    .attr('class', 'raingage')
                    .attr('fill', 'rgba(125, 125, 255, 1)');
            }
        }

	    // Render labels
	    for (var label in model['LABELS']) {
		var l = model['LABELS'][label],
			t = (l['label'] ? l['label'] : '');
                if (t !== '') {
                    el.append('g').append('text')
                            .attr('x', (l['x']?l['x']:0) - swmmjs.svg.nodeSize * t.length / 3)
                            .attr('y', swmmjs.svg.top - (l['y']?l['y']:0) + swmmjs.svg.nodeSize * 2)
                            .text(t)
			    .attr('data-x', l['x'])
			    .attr('data-y', l['y'])
			    .attr('data-label', t)
                            .attr('style', 'font-family: Verdana, Arial, sans; font-size:' + (swmmjs.svg.nodeSize * 2) + 'px;')
                            .attr('class', 'label')
                            .attr('fill', swmmjs.defaultColor);
                }
	    }
            
        var vis = d3.select('#svgSimple');

        // zoom behaviour
        var zoom = d3.zoom().scaleExtent([0.1, 50]);
        zoom.on('zoom', function() { swmmjs.currentScale = d3.event.transform.k; swmmjs.applyScale(svg); });
        vis.call(zoom);

        swmmjs.applyScale(svg);
        
        vis.on('mousemove', function() {
            swmmjs.currentPosition = [d3.event.pageX, d3.event.pageY]; // log the mouse x,y position
            let svgEl = document.getElementById('svgSimple');
            let pt = svgEl.createSVGPoint();
            pt.x = d3.event.pageX;
            pt.y = d3.event.pageY;
            let globalPoint = pt.matrixTransform(svgEl.getScreenCTM().inverse());
            document.getElementById('xy').innerHTML = 'X: ' + (pt.x) + ', Y: ' + (pt.y);

            var xy = d3.mouse(this);
            var transform = d3.zoomTransform(vis.node());
            let xy1 = transform.invert(xy);
            
            document.getElementById('xy2').innerHTML = 'X: ' + (xy1[0]).toFixed(0) + ', Y: ' + (svg.top - xy1[1]).toFixed(0);
        });

    };

        return svg;
    };
    
    swmmjs.applyScale = function(svg) {
        var scaleFactor = 1;
        //vertice
        d3.select('#svgSimple > g').selectAll('.vertice').each(function() { 
            this.setAttribute('stroke-width', scaleFactor * svg.strokeWidth / swmmjs.currentScale );
        });
        //conduit
        d3.select('#svgSimple > g').selectAll('.conduit').each(function() { 
            this.setAttribute('stroke-width', scaleFactor * svg.strokeWidth / swmmjs.currentScale );
        });
        //junction
        d3.select('#svgSimple > g').selectAll('.junction').each(function() { 
            this.setAttribute('r', svg.nodeSize / swmmjs.currentScale );
        });
        //outfall
        d3.select('#svgSimple > g').selectAll('.outfall').each(function() { 
            this.setAttribute('points', (parseFloat(this.dataset.x) - 1.5 * scaleFactor * svg.nodeSize / swmmjs.currentScale) + ' ' + 
                                (parseFloat(svg.top) - parseFloat(this.dataset.y0) - 1.5 * scaleFactor * svg.nodeSize / swmmjs.currentScale) + ' ' +
                                (parseFloat(this.dataset.x) + 1.5 * scaleFactor * svg.nodeSize / swmmjs.currentScale) + ' ' + 
                                (parseFloat(svg.top) - parseFloat(this.dataset.y0) - 1.5 * scaleFactor * svg.nodeSize / swmmjs.currentScale) + ' ' +
                                parseFloat(this.dataset.x) + ' ' + 
                                (parseFloat(svg.top) - parseFloat(this.dataset.y0) + 1.5 * scaleFactor * svg.nodeSize / swmmjs.currentScale));
        });
        //storage
        d3.select('#svgSimple > g').selectAll('.storage').each(function() { 
            this.setAttribute('height', svg.nodeSize / swmmjs.currentScale * 2);
            this.setAttribute('width', svg.nodeSize / swmmjs.currentScale * 2);
            this.setAttribute('x', parseFloat(this.dataset.x) - svg.nodeSize / swmmjs.currentScale);
            this.setAttribute('y', svg.top - parseFloat(this.dataset.y0) - svg.nodeSize / swmmjs.currentScale);
        });
        //pump
        d3.select('#svgSimple > g').selectAll('.pump1').each(function() { 
            this.setAttribute('r', svg.nodeSize / swmmjs.currentScale );
        });
        d3.select('#svgSimple > g').selectAll('.pump2').each(function() { 
            this.setAttribute('width', svg.nodeSize / swmmjs.currentScale * 1.5);
            this.setAttribute('height', svg.nodeSize / swmmjs.currentScale );
            this.setAttribute('y', svg.top - parseFloat(this.dataset.y) - svg.nodeSize / swmmjs.currentScale);
        });
        //label
        d3.select('#svgSimple > g').selectAll('.label').each(function() { 
            this.setAttribute('x', (parseFloat(this.dataset.x)?parseFloat(this.dataset.x):0) - svg.nodeSize / swmmjs.currentScale * this.dataset.label.length / 3);
            this.setAttribute('y', svg.top - (parseFloat(this.dataset.y)?parseFloat(this.dataset.y):0) + svg.nodeSize / swmmjs.currentScale * 2);
            this.setAttribute('style', 'font-family: Verdana, Arial, sans; font-size:' + (svg.nodeSize / swmmjs.currentScale * 2) + 'px;')
        });
        if (d3.event) {
            d3.select('#svgSimple > g')
              .attr('transform', d3.event.transform);
        }
    };
    
    swmmjs.svg = swmmjs.svg();

    swmmjs.renderAnalysis = function(renderLegendInput) {	
	var renderLegend = renderLegendInput || swmmjs.renderLegend;
	
	if (!swmmjs.success)
	    swmmjs.renderInput();
	else {
	    var time = $('#time').val(),
		nodes = (swmmjs.results[time] ? swmmjs.results[time]['NODE'] : null),
		links = (swmmjs.results[time] ? swmmjs.results[time]['LINK'] : null),		
		nodeResult = $('#nodeResult').val().toUpperCase(),
		linkResult = $('#linkResult').val().toUpperCase();
        
	    if (swmmjs.INPUT === swmmjs.mode)
		swmmjs.mode = swmmjs.ANALYSIS;
            
	    swmmjs.colors['NODES'] = d3.scaleQuantile().range(d3.range(5));
	    swmmjs.colors['NODES'].domain(d3.values(nodes).map(function(n) {
		return n[nodeResult];
	    }));
	    swmmjs.colors['LINKS'] = d3.scaleQuantile().range(d3.range(5));
	    swmmjs.colors['LINKS'].domain(d3.values(links).map(function(n) {
		return n[linkResult];
	    }));
	    svg = swmmjs.svg;
            
        if (nodeResult === '') {
            swmmjs.mode = swmmjs.INPUT;
        }
            
	    svg.render();
	    d3.select('#legend ul').remove();
	    if(renderLegend) {
		var legend = d3.select('#legend'),
			ul = legend.append('ul').attr('class', 'list-group'),
			fmt = d3.format('0.3f'),
			elements = ['Nodes', 'Links'];
		for(var el in elements) {
                    try {
                        var	el = elements[el],
                                singular = el.substr(0, el.length - 1)
                                range = swmmjs.colors[el.toUpperCase()],			    
                                quantiles = range.quantiles(),
                                v = [fmt(d3.min(range.domain()))];
                        ul.append('li').text(singular+' '+$('#'+singular.toLowerCase()+'Result').val()).attr('class', 'list-group-item active');
                        for(var q in quantiles)
                        {
                           v[v.length] = fmt(quantiles[q]);
                        }
                        v[v.length] = fmt(d3.max(range.domain()));
                        for(var i = 1; i < v.length; i++)
                        {
                            var li = ul.append('li')			    
                                    .attr('class', 'list-group-item'),
                                value = (parseFloat(v[i-1]) + parseFloat(v[i]))/2;
                            li.append('span')
                                    .attr('style', 'background:'+swmmjs.svg.colors[el.toUpperCase()][range(value)])
                                    .attr('class', 'legendcolor')
                                    .text(' ');
                            li.append('span')
                                .text(' '+v[i-1]+' to '+v[i]);
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }
	    }		
	}
    };

    swmmjs.renderInput = function() {
	    swmmjs.svg.render();
    };

    swmmjs.readBin = function(success) {
	    swmmjs.results = (success ? d3.swmmresult().parse('/report.bin') : false);
    };

    swmmjs.render = function() {
        if (swmmjs.INPUT === swmmjs.mode)
            swmmjs.renderInput();
        else
            swmmjs.renderAnalysis();
    };
    
    swmmjs.setSuccess = function(success) {
        var time = d3.select('#time');
        swmmjs.success = success;
        swmmjs.readBin(success);
        time.selectAll('option').remove();
        swmmjs.model = d3.inp().parse(document.getElementById('inpFile').value)
        
        if (swmmjs.results) {
            var reportTime = (swmmjs.model['OPTIONS'] ? new Date(swmmjs.model['OPTIONS']['REPORT_START_DATE']+swmmjs.model['OPTIONS']['REPORT_STEP']) : undefined);
                var reportTimestep = (reportTime ? reportTime.getHours()*60 + reportTime.getMinutes() : undefined);
            for (var t in swmmjs.results) {
            time.append('option')
                        .attr('value', t)
                        .text(swmmjs.formatDate(reportTime));
            reportTime = new Date(reportTime.setMinutes(reportTime.getMinutes() + reportTimestep));
            } 
        }
        swmmjs.render();

        /////////////////////////////////////////
        // Bind model values
        d3.inp().bindVals();

        /////////////////////////////////////////
    };

    swmmjs.loadModel = function() {
        swmmjs.model = d3.inp().parse(document.getElementById('inpFile').value)
        
        swmmjs.render();

        /////////////////////////////////////////
        // Bind model values
        d3.inp().bindVals();

        /////////////////////////////////////////
    };

    swmmjs.formatDate = function(date) {
        return (date.getDate()<10 ? "0" : "") + date.getDate() + "." + ((date.getMonth() +1)<10 ? "0" : "") + (date.getMonth() +1) + "." + (date.getYear()+1900) + " " + (date.getHours()<10 ? "0" : "") + date.getHours() + ":" + (date.getMinutes()<10 ? "0" : "") + date.getMinutes(); 
    };
    
    swmmjs.unit = function(units, parameter) {
	var u = '';
	switch(parameter) {
	    case 'INVERT':
		switch(units)
		{
                    default:
			u = 'm';
			break;
		}
		break;
	    case 'MAXDEPTH':
		switch(units)
		{
		   default:
		       u = 'm';
		       break;
		}
		break;
	   case 'ROUGHNESS':
	       switch(units)
	       {
		   default:
		       u = '';
		       break;
	       }
	       break;
	   case 'SLOPE':
	       switch(units)
	       {
		   default:
		       u = '%';
		       break;
	       }
	       break;
	}
	return u;
    };

    //swmmjs.run = function(Module) {
    swmmjs.run = function() {
        FS.quit();
        Module.arguments = ['/input.inp', '/report.txt', '/report.bin'];
        Module.calledRun = false;
        Module.preRun = [function () {
                try
                {
                    FS.createPath('/', '/', true, true);
                    FS.ignorePermissions = true;
                    var inp = document.getElementById('inpFile').value;
                    var f = FS.findObject('input.inp');
                    if (f) {
                        FS.unlink('input.inp');
                    }
                    FS.createDataFile('/', 'input.inp', inp, true, true);
                } catch (e) {
                    console.log('/input.inp creation failed');
                }
            }];
        Module.postRun = [function () {
                try {
                    swmmjs.renderAnalysis();
                    var rpt = Module.intArrayToString(FS.findObject('/report.txt').contents);
                    document.getElementById('rptFile').innerHTML = rpt;
                    Module['calledRun'] = false;
                    console.log('Run complete.')
                } catch (e) {
                    console.log(e);
                }
            }];
        Module.print = (function () {
            var element = document.getElementById('output');
            if (element)
                element.value = ''; // clear browser cache
            return function (text) {
                if (arguments.length > 1)
                    text = Array.prototype.slice.call(arguments).join(' ');
                console.log(text);
                if (element) {
                    element.value += text + "\n";
                    element.scrollTop = element.scrollHeight; // focus on bottom
                }
            };
        })();
        Module.printErr = function (text) {
            if (arguments.length > 1)
                text = Array.prototype.slice.call(arguments).join(' ');
            console.error(text);
        };
        /*Module.canvas = (function () {
            var canvas = document.getElementById('canvas');

            // As a default initial behavior, pop up an alert when webgl context is lost. To make your
            // application robust, you may want to override this behavior before shipping!
            // See http://www.khronos.org/registry/webgl/specs/latest/1.0/#5.15.2
            canvas.addEventListener("webglcontextlost", function (e) {
                alert('WebGL context lost. You will need to reload the page.');
                e.preventDefault();
            }, false);

            return canvas;
        })();*/
        Module.setStatus = function (text) {
            var statusElement = document.getElementById('status');

            var progressElement = document.getElementById('progress');
            if (!Module.setStatus.last)
                Module.setStatus.last = {time: Date.now(), text: ''};
            if (text === Module.setStatus.last.text) {
                return;
            }
            var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
            var now = Date.now();
            if (m && now - Module.setStatus.last.time < 30)
                return; // if this is a progress update, skip it if too soon
            Module.setStatus.last.time = now;
            Module.setStatus.last.text = text;
            if (m) {
                text = m[1];
                progressElement.value = parseInt(m[2]) * 100;
                progressElement.max = parseInt(m[4]) * 100;
                progressElement.hidden = false;
            } else {
                progressElement.value = null;
                progressElement.max = null;
                progressElement.hidden = true;
            }
            statusElement.innerHTML = text;
            if (text === "") {
                swmmjs.setSuccess(true);
                exitRuntime();
                console.log(JSON.stringify(swmmjs.results));
            } 
        };
        Module.totalDependencies = 0;
        Module.monitorRunDependencies = function (left) {
            this.totalDependencies = Math.max(this.totalDependencies, left);
            Module.setStatus(left ? 'Preparing... (' + (this.totalDependencies - left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
        };

        Module.setStatus('Downloading...');
        window.onerror = function (event) {
            // TODO: do not warn on ok events like simulating an infinite loop or exitStatus
            Module.setStatus('Exception thrown, see JavaScript console');
            Module.setStatus = function (text) {
                if (text)
                    Module.printErr('[post-exception status] ' + text);
            };
        };

        Module['calledRun'] = false;
        Module['run'](Module.arguments);

        console.log('Run complete.')
    };

    return swmmjs;
};

swmmjs = swmmjs();

/////////////////////////////////////////////////////////////
// Outfalls Modal 
/////////////////////////////////////////////////////////////

var modalEditOutfalls = function(id){
    // If the model is not in edit mode, return
    if(swmmjs.model.clickEffect !== 'edit'){
        return;
    }

    // Show the modal.
    $('#modalOutfalls').modal('toggle');

    // Retain the original ID for editing purposes.
    $('#outfalls-form-id').val(id);

    // Make sure to check if the OUTFALLS object exists.
    if(typeof swmmjs.model['OUTFALLS'] === 'undefined'){
        swmmjs.model['OUTFALLS'] = [];
    } else {
        $('#outfalls-name').val(id)
        // If there are coordinates, and one of the coordinates has this outfalls id, use the xy position of that
        if(typeof swmmjs.model['COORDINATES'] !== 'undefined'){
            $('#outfalls-xcoordinate').val(swmmjs.model['COORDINATES'][id]['x'])
            $('#outfalls-ycoordinate').val(swmmjs.model['COORDINATES'][id]['y'])
        }

        // If there are tags, and one of the tags has this id, use the tag
        // Check for object.type='Node' and object.ID = itemID;
        function tagQuery(thisObj){
            return thisObj.Type==='Node' && thisObj.ID === id; 
        }
        // For every tag element
        let thisArray = Object.values(swmmjs.model['TAGS']);

        // Find the tag that matches this RG id
        let thisEl = thisArray.findIndex(tagQuery);
        if(thisEl >= 0){
            $('#outfalls-tag').val(swmmjs.model['TAGS'][thisEl].Tag);
        } else {
            $('#outfalls-tag').val('');
        }

        $('#outfalls-name').val(id)
        $('#outfalls-description').val(swmmjs.model['OUTFALLS'][id]['Description'])
        $('#outfalls-inflows').val(swmmjs.model['OUTFALLS'][id]['Inflows'])
        $('#outfalls-treatment').val(swmmjs.model['OUTFALLS'][id]['Treatment'])
        $('#outfalls-invertel').val(swmmjs.model['OUTFALLS'][id]['Invert'])
        $('#outfalls-tidegate').val(swmmjs.model['OUTFALLS'][id]['Gated'])
        $('#outfalls-type').val(swmmjs.model['OUTFALLS'][id]['Type'])
    }
}

/////////////////////////////////////////////////////////////
// Dividers Modal 
/////////////////////////////////////////////////////////////

var modalEditDividers = function(id){
    // If the model is not in edit mode, return
    if(swmmjs.model.clickEffect !== 'edit'){
        return;
    }

    // Show the modal.
    $('#modalDividers').modal('toggle');

    // Retain the original ID for editing purposes.
    $('#dividers-form-id').val(id);

    // Make sure to check if the DIVIDERS object exists.
    if(typeof swmmjs.model['DIVIDERS'] === 'undefined'){
        swmmjs.model['DIVIDERS'] = [];
    } else {
        $('#dividers-name').val(id)
        // If there are coordinates, and one of the coordinates has this dividers id, use the xy position of that
        if(typeof swmmjs.model['COORDINATES'] !== 'undefined'){
            $('#dividers-xcoordinate').val(swmmjs.model['COORDINATES'][id]['x'])
            $('#dividers-ycoordinate').val(swmmjs.model['COORDINATES'][id]['y'])
        }

        // If there are tags, and one of the tags has this id, use the tag
        // Check for object.type='Node' and object.ID = itemID;
        function tagQuery(thisObj){
            return thisObj.Type==='Node' && thisObj.ID === id; 
        }
        // For every tag element
        let thisArray = Object.values(swmmjs.model['TAGS']);

        // Find the tag that matches this RG id
        let thisEl = thisArray.findIndex(tagQuery);
        if(thisEl >= 0){
            $('#dividers-tag').val(swmmjs.model['TAGS'][thisEl].Tag);
        } else {
            $('#dividers-tag').val('');
        }

        $('#dividers-name').val(id)
        $('#dividers-description').val(swmmjs.model['DIVIDERS'][id]['Description'])
        $('#dividers-inflows').val(swmmjs.model['DIVIDERS'][id]['Inflows'])
        $('#dividers-treatment').val(swmmjs.model['DIVIDERS'][id]['Treatment'])
        $('#dividers-invertel').val(swmmjs.model['DIVIDERS'][id]['Invert'])
        $('#dividers-maxdepth').val(swmmjs.model['DIVIDERS'][id]['Dmax'])
        $('#dividers-initialdepth').val(swmmjs.model['DIVIDERS'][id]['Dinit'])
        $('#dividers-surchargedepth').val(swmmjs.model['DIVIDERS'][id]['Dsurch'])
        $('#dividers-aponded').val(swmmjs.model['DIVIDERS'][id]['Aponded'])
        $('#dividers-divertedlink').val(swmmjs.model['DIVIDERS'][id]['DivertedLink'])
        $('#dividers-type').val(swmmjs.model['DIVIDERS'][id]['Type'])
        if(swmmjs.model['DIVIDERS'][id]['Type'] === 'CUTOFF'){
            $('#dividers-cutoffflow').val(swmmjs.model['DIVIDERS'][id]['P1'])
        } else {
            $('#dividers-cutoffflow').val(0)
        }
        if(swmmjs.model['DIVIDERS'][id]['Type'] === 'TABULAR'){
            $('#dividers-curvename').val(swmmjs.model['DIVIDERS'][id]['P1'])
        } else {
            $('#dividers-curvename').val('')
        }
        if(swmmjs.model['DIVIDERS'][id]['Type'] === 'WEIR'){
            $('#dividers-weirflow').val(swmmjs.model['DIVIDERS'][id]['P1'])
            $('#dividers-weirdepth').val(swmmjs.model['DIVIDERS'][id]['P2'])
            $('#dividers-weircoefficient').val(swmmjs.model['DIVIDERS'][id]['P3'])
        } else {
            $('#dividers-weirflow').val(0)
            $('#dividers-weirdepth').val(0)
            $('#dividers-weircoefficient').val(0)
        }
    }
}


/////////////////////////////////////////////////////////////
// Storage Units Modal 
/////////////////////////////////////////////////////////////
var modalEditStorageunits = function(id){
    // If the model is not in edit mode, return
    if(swmmjs.model.clickEffect !== 'edit'){
        return;
    }
    
    // Show the modal.
    $('#modalStorageunits').modal('toggle');

    // Retain the original ID for editing purposes.
    $('#storageunits-form-id').val(id);

    // Make sure to check if the STORAGE object exists.
    if(typeof swmmjs.model['STORAGE'] === 'undefined'){
        swmmjs.model['STORAGE'] = [];
    } else {
        $('#storageunits-name').val(id)
        // If there are coordinates, and one of the coordinates has this storage id, use the xy position of that
        if(typeof swmmjs.model['COORDINATES'] !== 'undefined'){
            $('#storageunits-xcoordinate').val(swmmjs.model['COORDINATES'][id]['x'])
            $('#storageunits-ycoordinate').val(swmmjs.model['COORDINATES'][id]['y'])
        }

        // If there are tags, and one of the tags has this id, use the tag
        // Check for object.type='Node' and object.ID = itemID;
        function tagQuery(thisObj){
            return thisObj.Type==='Node' && thisObj.ID === id; 
        }
        // For every tag element
        let thisArray = Object.values(swmmjs.model['TAGS']);

        // Find the tag that matches this Storage Unit id
        let thisEl = thisArray.findIndex(tagQuery);
        if(thisEl >= 0){
            $('#storageunits-tag').val(swmmjs.model['TAGS'][thisEl].Tag);
        } else {
            $('#storageunits-tag').val('');
        }

        $('#storageunits-name').val(id)
        $('#storageunits-description').val(swmmjs.model['STORAGE'][id]['Description'])

        $('#storageunits-inflows').val(swmmjs.model['STORAGE'][id]['Inflows'])
        $('#storageunits-treatment').val(swmmjs.model['STORAGE'][id]['Treatment'])
        $('#storageunits-invertel').val(swmmjs.model['STORAGE'][id]['Invert'])
        $('#storageunits-maxdepth').val(swmmjs.model['STORAGE'][id]['Dmax'])
        $('#storageunits-initialdepth').val(swmmjs.model['STORAGE'][id]['Dinit'])
        $('#storageunits-aponded').val(swmmjs.model['STORAGE'][id]['Aponded'])
        $('#storageunits-evapfactor').val(swmmjs.model['STORAGE'][id]['Fevap'])
        $('#storageunits-seepagerate').val(swmmjs.model['STORAGE'][id]['SeepRate'])
        $('#storageunits-storagecurve').val(swmmjs.model['STORAGE'][id]['Curve'])

        if(swmmjs.model['STORAGE'][id]['Curve'] === 'FUNCTIONAL'){
            $('#dividers-coefficient').val(swmmjs.model['STORAGE'][id]['Coefficient'])
            $('#dividers-exponent').val(swmmjs.model['STORAGE'][id]['Exponent'])
            $('#dividers-constant').val(swmmjs.model['STORAGE'][id]['Constant'])
        } else {
            $('#dividers-coefficient').val(0)
            $('#dividers-exponent').val(0)
            $('#dividers-constant').val(0)
        }
        if(swmmjs.model['STORAGE'][id]['Curve'] === 'TABULAR'){
            $('#dividers-curvename').val(swmmjs.model['STORAGE'][id]['CurveName'])
        } else {
            $('#dividers-curvename').val('')
        }
    }
}

/////////////////////////////////////////////////////////////
// Tag Retriever
// getTag('Node', '2', $('#junctions-tag'))
/////////////////////////////////////////////////////////////
function getTag(tagType, id, el){
    // If there are tags, and one of the tags has this id, use the tag
    // Check for object.type='Node' and object.ID = itemID;
    function tagQuery(thisObj){
        return thisObj.Type===tagType && thisObj.ID === id; 
    }
    // For every tag element
    let thisArray = Object.values(swmmjs.model['TAGS']);

    // Find the tag that matches this RG id
    let thisEl = thisArray.findIndex(tagQuery);
    if(thisEl >= 0){
        el.val(swmmjs.model['TAGS'][thisEl].Tag);
    } else {
        el.val('');
    }
}

/////////////////////////////////////////////////////////////
// Junctions Modal 
/////////////////////////////////////////////////////////////

var modalEditJunctions = function(id){
    // If the model is not in edit mode, return
    if(swmmjs.model.clickEffect !== 'edit'){
        return;
    }

    // Show the modal.
    $('#modalJunctions').modal('toggle');

    // Retain the original ID for editing purposes.
    $('#junctions-form-id').val(id);

    // Make sure to check if the JUNCTIONS object exists.
    if(typeof swmmjs.model['JUNCTIONS'] === 'undefined'){
        swmmjs.model['JUNCTIONS'] = [];
    } else {
        $('#junctions-name').val(id)
        // If there are coordinates, and one of the coordinates has this junction id, use the xy position of that
        if(typeof swmmjs.model['COORDINATES'] !== 'undefined'){
            $('#junctions-xcoordinate').val(swmmjs.model['COORDINATES'][id]['x'])
            $('#junctions-ycoordinate').val(swmmjs.model['COORDINATES'][id]['y'])
        }

        // Get any tags for this object
        getTag('Node', id.toString(), $('#junctions-tag'))

        $('#junctions-name').val(id)
        $('#junctions-description').val(swmmjs.model['JUNCTIONS'][id]['Description'])
        $('#junctions-invertel').val(swmmjs.model['JUNCTIONS'][id]['Invert'])
        $('#junctions-maxdepth').val(swmmjs.model['JUNCTIONS'][id]['Dmax'])
        $('#junctions-initialdepth').val(swmmjs.model['JUNCTIONS'][id]['Dinit'])
        $('#junctions-surchargedepth').val(swmmjs.model['JUNCTIONS'][id]['Dsurch'])
        $('#junctions-pondedarea').val(swmmjs.model['JUNCTIONS'][id]['Aponded'])
    }
}

/////////////////////////////////////////////////////////////
// Subcatchments Modal 
/////////////////////////////////////////////////////////////

var modalEditSubcatchments = function(id){
    // If the model is not in edit mode, return
    if(swmmjs.model.clickEffect !== 'edit'){
        return;
    }
    // Show the modal.
    $('#modalSubcatchments').modal('toggle');

    // Track the id of the original object
    $('#subcatchments-form-id').val(id);

    // Make sure to check if the SUBCATCHMENTS object exists.
    if(typeof swmmjs.model['SUBCATCHMENTS'] === 'undefined'){
        swmmjs.model['SUBCATCHMENTS'] = [];
    } else {
        $('#subcatchments-name').val(id)
        
        getTag('Subcatch', id.toString(), $('#subcatchments-tag'))

        $('#subcatchments-description').val(swmmjs.model['SUBCATCHMENTS'][id]['Description'])
        $('#subcatchments-raingage').val(swmmjs.model['SUBCATCHMENTS'][id]['RainGage'])
        $('#subcatchments-outlet').val(swmmjs.model['SUBCATCHMENTS'][id]['Outlet'])
        $('#subcatchments-area').val(swmmjs.model['SUBCATCHMENTS'][id]['Area'])
        $('#subcatchments-width').val(swmmjs.model['SUBCATCHMENTS'][id]['Width'])
        $('#subcatchments-pctslope').val(swmmjs.model['SUBCATCHMENTS'][id]['PctSlope'])
        $('#subcatchments-pctimperv').val(swmmjs.model['SUBCATCHMENTS'][id]['PctImperv'])
        $('#subcatchments-nimperv').val(swmmjs.model['SUBAREAS'][id]['NImperv'])
        $('#subcatchments-nperv').val(swmmjs.model['SUBAREAS'][id]['NPerv'])
        $('#subcatchments-dstoreimperv').val(swmmjs.model['SUBAREAS'][id]['SImperv'])
        $('#subcatchments-dstoreperv').val(swmmjs.model['SUBAREAS'][id]['SPerv'])
        $('#subcatchments-pctzeroimperv').val(swmmjs.model['SUBAREAS'][id]['PctZero'])
        $('#subcatchments-subarearouting').val(swmmjs.model['SUBAREAS'][id]['RouteTo'])
        $('#subcatchments-pctrouted').val(swmmjs.model['SUBAREAS'][id]['PctRouted'])
        $('#subcatchments-curblength').val(swmmjs.model['SUBCATCHMENTS'][id]['CurbLen'])
        $('#subcatchments-snowpack').val(swmmjs.model['SUBCATCHMENTS'][id]['SnowPack'])
    }
}

/////////////////////////////////////////////////////////////
// Project Summary Modal 
/////////////////////////////////////////////////////////////

var modalProjectSummary = function(){
    // Show the modal.
    $('#modalProjectSummary').modal('toggle');
    if(typeof swmmjs.model['RAINGAGES'] !== 'undefined')
    $('#summary-raingages').val(Object.keys(swmmjs.model['RAINGAGES']).length)
    if(typeof swmmjs.model['SUBCATCHMENTS'] !== 'undefined')
    $('#summary-subcatchments').val(Object.keys(swmmjs.model['SUBCATCHMENTS']).length)
    if(typeof swmmjs.model['AQUIFERS'] !== 'undefined')
    $('#summary-aquifers').val(Object.keys(swmmjs.model['AQUIFERS']).length)
    if(typeof swmmjs.model['SNOWPACKS'] !== 'undefined')
    $('#summary-snowpacks').val(Object.keys(swmmjs.model['SNOWPACKS']).length)
    if(typeof swmmjs.model['HYDROGRAPHS'] !== 'undefined')
    $('#summary-rdiihydrographs').val(Object.keys(swmmjs.model['HYDROGRAPHS']).length)
    $('#summary-infiltrationmodel').val(swmmjs.model['OPTIONS']['INFILTRATION'].Value)
    if(typeof swmmjs.model['JUNCTIONS'] !== 'undefined')
    $('#summary-junctionnodes').val(Object.keys(swmmjs.model['JUNCTIONS']).length)
    if(typeof swmmjs.model['OUTFALLS'] !== 'undefined')
    $('#summary-outfallnodes').val(Object.keys(swmmjs.model['OUTFALLS']).length)
    if(typeof swmmjs.model['DIVIDERS'] !== 'undefined')
    $('#summary-dividernodes').val(Object.keys(swmmjs.model['DIVIDERS']).length)
    if(typeof swmmjs.model['STORAGE'] !== 'undefined')
    $('#summary-storagenodes').val(Object.keys(swmmjs.model['STORAGE']).length)
    if(typeof swmmjs.model['CONDUITS'] !== 'undefined')
    $('#summary-conduitlinks').val(Object.keys(swmmjs.model['CONDUITS']).length)
    if(typeof swmmjs.model['PUMPS'] !== 'undefined')
    $('#summary-pumplinks').val(Object.keys(swmmjs.model['PUMPS']).length)
    if(typeof swmmjs.model['ORIFICES'] !== 'undefined')
    $('#summary-orificelinks').val(Object.keys(swmmjs.model['ORIFICES']).length)
    if(typeof swmmjs.model['WEIRS'] !== 'undefined')
    $('#summary-weirlinks').val(Object.keys(swmmjs.model['WEIRS']).length)
    if(typeof swmmjs.model['OUTLETS'] !== 'undefined')
    $('#summary-outletlinks').val(Object.keys(swmmjs.model['OUTLETS']).length)
    $('#summary-flowunits').val(swmmjs.model['OPTIONS']['FLOW_UNITS'].Value)
    $('#summary-flowrouting').val(swmmjs.model['OPTIONS']['FLOW_ROUTING'].Value)
    if(typeof swmmjs.model['CONTROLS'] !== 'undefined')
    $('#summary-controlrules').val(Object.keys(swmmjs.model['CONTROLS']).length)
    if(typeof swmmjs.model['POLLUTANTS'] !== 'undefined')
    $('#summary-pollutants').val(Object.keys(swmmjs.model['POLLUTANTS']).length)
    if(typeof swmmjs.model['LANDUSES'] !== 'undefined')
    $('#summary-landuses').val(Object.keys(swmmjs.model['LANDUSES']).length)
    if(typeof swmmjs.model['INFLOWS'] !== 'undefined')
    $('#summary-tsinflows').val(Object.keys(swmmjs.model['INFLOWS']).length)
    if(typeof swmmjs.model['DWF'] !== 'undefined')
    $('#summary-dwinflows').val(Object.keys(swmmjs.model['DWF']).length)
    if(typeof swmmjs.model['GROUNDWATER'] !== 'undefined')
    $('#summary-gwinflows').val(Object.keys(swmmjs.model['GROUNDWATER']).length)
    if(typeof swmmjs.model['RDII'] !== 'undefined')
    $('#summary-rdiiinflows').val(Object.keys(swmmjs.model['RDII']).length)
    if(typeof swmmjs.model['LID_CONTROLS'] !== 'undefined')
    $('#summary-lidcontrols').val(Object.keys(swmmjs.model['LID_CONTROLS']).length)
    if(typeof swmmjs.model['TREATMENT'] !== 'undefined')
    $('#summary-treatmentunits').val(Object.keys(swmmjs.model['TREATMENT']).length)
}


/////////////////////////////////////////////////////////////
// Report Status Modal 
/////////////////////////////////////////////////////////////

var modalReportStatus = function(){
    // Show the modal.
    $('#modalReportStatus').modal('toggle');
    $('#reportStatusTextbox').text(document.getElementById('rptFile').innerHTML)
}

/////////////////////////////////////////////////////////////
// Conduits Modal 
/////////////////////////////////////////////////////////////

var modalEditConduits = function(id){
    // If the model is not in edit mode, return
    if(swmmjs.model.clickEffect !== 'edit'){
        return;
    }

    // Show the modal.
    $('#modalConduits').modal('toggle');

    // Retain the original ID for editing purposes.
    $('#conduits-form-id').val(id);

    // Make sure to check if the CONDUITS object exists.
    if(typeof swmmjs.model['CONDUITS'] === 'undefined'){
        swmmjs.model['CONDUITS'] = [];
    } else {
        // Get any tags for this object
        getTag('Link', id.toString(), $('#conduits-tag'))

        $('#conduits-name').val(id)
        $('#conduits-inletnode').val(swmmjs.model['CONDUITS'][id]['FromNode'])
        $('#conduits-outletnode').val(swmmjs.model['CONDUITS'][id]['ToNode'])
        $('#conduits-description').val(swmmjs.model['CONDUITS'][id]['Description'])
        $('#conduits-shape').val(swmmjs.model['XSECTIONS'][id]['Shape'])
        $('#conduits-maxdepth').val(swmmjs.model['XSECTIONS'][id]['Geom1'])
        $('#conduits-length').val(swmmjs.model['CONDUITS'][id]['Length'])
        $('#conduits-roughness').val(swmmjs.model['CONDUITS'][id]['Roughness'])
        $('#conduits-inletoffset').val(swmmjs.model['CONDUITS'][id]['InOffset'])
        $('#conduits-outletoffset').val(swmmjs.model['CONDUITS'][id]['OutOffset'])
        $('#conduits-initialflow').val(swmmjs.model['CONDUITS'][id]['InitFlow'])
        $('#conduits-maximumflow').val(swmmjs.model['CONDUITS'][id]['MaxFlow'])
        // If there are no losses for this pipe, create some
        if(typeof swmmjs.model.LOSSES[id] === 'undefined'){
            swmmjs.model.LOSSES[id] = {Kin: 0, Kout: 0, Kavg: 0, FlapGate: 'NO', SeepRate: 0};
        }
        $('#conduits-entrylosscoeff').val(swmmjs.model['LOSSES'][id]['Kin'])
        $('#conduits-exitlosscoeff').val(swmmjs.model['LOSSES'][id]['Kout'])
        $('#conduits-avglosscoeff').val(swmmjs.model['LOSSES'][id]['Kavg'])
        $('#conduits-seepagelossrate').val(swmmjs.model['LOSSES'][id]['SeepRate'])
        $('#conduits-flapgate').val(swmmjs.model['LOSSES'][id]['FlapGate'])
    }
}


/////////////////////////////////////////////////////////////
// Pumps Modal 
/////////////////////////////////////////////////////////////

var modalEditPumps = function(id){
    // If the model is not in edit mode, return
    if(swmmjs.model.clickEffect !== 'edit'){
        return;
    }

    // Show the modal.
    $('#modalPumps').modal('toggle');

    // Retain the original ID for editing purposes.
    $('#pumps-form-id').val(id);

    // Make sure to check if the PUMPS object exists.
    if(typeof swmmjs.model['PUMPS'] === 'undefined'){
        swmmjs.model['PUMPS'] = [];
    } else {
        // Get any tags for this object
        getTag('Link', id.toString(), $('#pumps-tag'))

        $('#pumps-name').val(id)
        $('#pumps-inletnode').val(swmmjs.model['PUMPS'][id]['Node1'])
        $('#pumps-outletnode').val(swmmjs.model['PUMPS'][id]['Node2'])
        $('#pumps-description').val(swmmjs.model['PUMPS'][id]['Description'])

        $('#pumps-pumpcurve').val(swmmjs.model['PUMPS'][id]['Curve'])
        $('#pumps-initialstatus').val(swmmjs.model['PUMPS'][id]['Status'])
        $('#pumps-startupdepth').val(swmmjs.model['PUMPS'][id]['Dstart'])
        $('#pumps-shutoffdepth').val(swmmjs.model['PUMPS'][id]['Doff'])
    }
}

/////////////////////////////////////////////////////////////
// Orifices Modal 
/////////////////////////////////////////////////////////////

var modalEditOrifices = function(id){
    // If the model is not in edit mode, return
    if(swmmjs.model.clickEffect !== 'edit'){
        return;
    }

    // Show the modal.
    $('#modalOrifices').modal('toggle');

    // Retain the original ID for editing purposes.
    $('#orifices-form-id').val(id);

    // Make sure to check if the ORIFICES object exists.
    if(typeof swmmjs.model['ORIFICES'] === 'undefined'){
        swmmjs.model['ORIFICES'] = [];
    } else {
        // Get any tags for this object
        getTag('Link', id.toString(), $('#orifices-tag'))

        $('#orifices-name').val(id)
        $('#orifices-inletnode').val(swmmjs.model['ORIFICES'][id]['FromNode'])
        $('#orifices-outletnode').val(swmmjs.model['ORIFICES'][id]['ToNode'])
        $('#orifices-description').val(swmmjs.model['ORIFICES'][id]['Description'])
        $('#orifices-type').val(swmmjs.model['ORIFICES'][id]['Type'])
        $('#orifices-shape').val(swmmjs.model['XSECTIONS'][id]['Shape'])
        $('#orifices-height').val(swmmjs.model['XSECTIONS'][id]['Geom1'])
        $('#orifices-width').val(swmmjs.model['XSECTIONS'][id]['Geom2'])
        $('#orifices-inletoffset').val(swmmjs.model['ORIFICES'][id]['InletOffset'])
        $('#orifices-dischargecoeff').val(swmmjs.model['ORIFICES'][id]['Qcoeff'])
        $('#orifices-flapgate').val(swmmjs.model['ORIFICES'][id]['Gated'])
        $('#orifices-time').val(swmmjs.model['ORIFICES'][id]['CloseTime'])
        
    }
}

/////////////////////////////////////////////////////////////
// Weirs Modal 
/////////////////////////////////////////////////////////////

var modalEditWeirs = function(id){
    // If the model is not in edit mode, return
    if(swmmjs.model.clickEffect !== 'edit'){
        return;
    }

    // Show the modal.
    $('#modalWeirs').modal('toggle');

    // Retain the original ID for editing purposes.
    $('#weirs-form-id').val(id);

    // Make sure to check if the WEIRS object exists.
    if(typeof swmmjs.model['WEIRS'] === 'undefined'){
        swmmjs.model['WEIRS'] = [];
    } else {
        // Get any tags for this object
        getTag('Link', id.toString(), $('#weirs-tag'))

        $('#weirs-name').val(id)
        $('#weirs-inletnode').val(swmmjs.model['WEIRS'][id]['FromNode'])
        $('#weirs-outletnode').val(swmmjs.model['WEIRS'][id]['ToNode'])
        $('#weirs-description').val(swmmjs.model['WEIRS'][id]['Description'])
        $('#weirs-type').val(swmmjs.model['WEIRS'][id]['Type'])
        $('#weirs-height').val(swmmjs.model['XSECTIONS'][id]['Geom1'])
        $('#weirs-length').val(swmmjs.model['XSECTIONS'][id]['Geom2'])
        $('#weirs-sideslope').val(swmmjs.model['XSECTIONS'][id]['Geom3'])
        $('#weirs-inletoffset').val(swmmjs.model['WEIRS'][id]['CrestHt'])
        $('#weirs-dischargecoeff').val(swmmjs.model['WEIRS'][id]['Qcoeff'])
        $('#weirs-flapgate').val(swmmjs.model['WEIRS'][id]['Gated'])
        $('#weirs-endcontractions').val(swmmjs.model['WEIRS'][id]['EndCon'])
        $('#weirs-endcoeff').val(swmmjs.model['WEIRS'][id]['EndCoeff'])
        
    }
}

/////////////////////////////////////////////////////////////
// Outlets Modal 
/////////////////////////////////////////////////////////////

var modalEditOutlets = function(id){
    // If the model is not in edit mode, return
    if(swmmjs.model.clickEffect !== 'edit'){
        return;
    }

    // Show the modal.
    $('#modalOutlets').modal('toggle');

    // Retain the original ID for editing purposes.
    $('#outlets-form-id').val(id);

    // Make sure to check if the OUTLETS object exists.
    if(typeof swmmjs.model['OUTLETS'] === 'undefined'){
        swmmjs.model['OUTLETS'] = [];
    } else {
        // Get any tags for this object
        getTag('Link', id.toString(), $('#outlets-tag'))

        $('#outlets-name').val(id)
        $('#outlets-inletnode').val(swmmjs.model['OUTLETS'][id]['FromNode'])
        $('#outlets-outletnode').val(swmmjs.model['OUTLETS'][id]['ToNode'])
        $('#outlets-description').val(swmmjs.model['OUTLETS'][id]['Description'])
        $('#outlets-inletoffset').val(swmmjs.model['OUTLETS'][id]['CrestHt'])
        $('#outlets-flapgate').val(swmmjs.model['OUTLETS'][id]['Gated'])
        $('#outlets-ratingcurve').val(swmmjs.model['OUTLETS'][id]['Type'])
        $('#outlets-functionalcurvecoefficient').val(swmmjs.model['OUTLETS'][id]['Qcoeff'])
        $('#outlets-functionalcurveexponent').val(swmmjs.model['OUTLETS'][id]['Qexpon'])
        $('#outlets-tabularcurvename').val(swmmjs.model['OUTLETS'][id]['QTable'])
    }
}

/////////////////////////////////////////////////////////////
// Rain Gages Modal 
/////////////////////////////////////////////////////////////

var modalEditRaingages = function(id){
    // Show the modal.
    $('#modalRaingages').modal('toggle');

    // Retain the original ID for editing purposes.
    $('#raingages-form-id').val(id);

    // Make sure to check if the RAINGAGES object exists.
    if(typeof swmmjs.model['RAINGAGES'] === 'undefined'){
        swmmjs.model['RAINGAGES'] = [];
    } else {
        $('#raingages-name').val(id)
        // If there are symbols, and one of the symbols has this RG id, use the xy position of that
        if(typeof swmmjs.model['SYMBOLS'] !== 'undefined' && typeof swmmjs.model['SYMBOLS'][id] !== 'undefined'){
            $('#raingages-xcoordinate').val(swmmjs.model['SYMBOLS'][id]['XCoord'])
            $('#raingages-ycoordinate').val(swmmjs.model['SYMBOLS'][id]['YCoord'])
        }

        // If there are tags, and one of the tags has this RG id, use the tag
        // Check for object.type='Node' and object.ID = itemID;
        function tagQuery(thisObj){
            return thisObj.Type==='Gage' && thisObj.ID === id; 
        }
        // For every tag element
        let thisArray = Object.values(swmmjs.model['TAGS']);

        // Find the tag that matches this RG id
        let thisEl = thisArray.findIndex(tagQuery);
        if(thisEl >= 0){
            $('#raingages-tag').val(swmmjs.model['TAGS'][thisEl].Tag);
        } else {
            $('#raingages-tag').val('');
        }

        $('#raingages-description').val(swmmjs.model['RAINGAGES'][id]['Description'])
        $('#raingages-rainformat').val(swmmjs.model['RAINGAGES'][id]['Format'])
        $('#raingages-timeinterval').val(swmmjs.model['RAINGAGES'][id]['Interval'])
        $('#raingages-snowcatchfactor').val(swmmjs.model['RAINGAGES'][id]['SCF'])
        $('#raingages-datasource').val(swmmjs.model['RAINGAGES'][id]['Source'])
        $('#raingages-timeseriesname').val(swmmjs.model['RAINGAGES'][id]['SeriesName'])
        $('#raingages-datafilename').val(swmmjs.model['RAINGAGES'][id]['FileName'])
        $('#raingages-stationid').val(swmmjs.model['RAINGAGES'][id]['StationID'])
        $('#raingages-rainunits').val(swmmjs.model['RAINGAGES'][id]['RainUnits'])
    }
}

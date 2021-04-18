//-----------------------------------------------------------------------------
//   iface.c
//
//   Project:  EPA SWMM5
//   Version:  5.1
//   Date:     03/20/14   (Build 5.1.001)
//   Author:   L. Rossman
//
//   Routing interface file functions.
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
//  Imported variables
//-----------------------------------------------------------------------------
//var Qcf = [];                   // flow units conversion factors
                                       // (see swmm5.c)

//-----------------------------------------------------------------------------                  
//  Shared variables
//-----------------------------------------------------------------------------                  
var      IfaceFlowUnits;        // flow units for routing interface file
var      IfaceStep;             // interface file time step (sec)
var      NumIfacePolluts;       // number of pollutants in interface file
var     IfacePolluts = [];          // indexes of interface file pollutants
var      NumIfaceNodes;         // number of nodes on interface file
var     IfaceNodes = [];            // indexes of nodes on interface file
var OldIfaceValues = [];        // interface flows & WQ at previous time
var NewIfaceValues = [];        // interface flows & WQ at next time
var   IfaceFrac;             // fraction of interface file time step
var OldIfaceDate;          // previous date of interface values
var NewIfaceDate;          // next date of interface values

//-----------------------------------------------------------------------------
//  External Functions (declared in funcs.h)
//-----------------------------------------------------------------------------
//  iface_readFileParams     (called by input_readLine)
//  iface_openRoutingFiles   (called by routing_open)
//  iface_closeRoutingFiles  (called by routing_close)
//  iface_getNumIfaceNodes   (called by addIfaceInflows in routing.c)
//  iface_getIfaceNode       (called by addIfaceInflows in routing.c)
//  iface_getIfaceFlow       (called by addIfaceInflows in routing.c)
//  iface_getIfaceQual       (called by addIfaceInflows in routing.c)
//  iface_saveOutletResults  (called by output_saveResults)


//=============================================================================
// char* tok[], int ntoks
function iface_readFileParams(tok, ntoks)
//
//  Input:   tok[] = array of string tokens
//           ntoks = number of tokens
//  Output:  returns an error code
//  Purpose: reads interface file information from a line of input data.
//
//  Data format is:
//  USE/SAVE  FileType  FileName
//
{
    let  k;
    let  j;

    // --- determine file disposition and type
    if ( ntoks < 2 ) return error_setInpError(ERR_ITEMS, "");
    k = findmatch(tok[0], FileModeWords);
    if ( k < 0 ) return error_setInpError(ERR_KEYWORD, tok[0]);
    j = findmatch(tok[1], FileTypeWords);
    if ( j < 0 ) return error_setInpError(ERR_KEYWORD, tok[1]);
    if ( ntoks < 3 ) return 0;

    // --- process file name
    switch ( j )
    {
      case RAINFALL_FILE:
        Frain.mode = k;
        sstrncpy(Frain.name, tok[2], MAXFNAME);
        break;

      case RUNOFF_FILE:
        Frunoff.mode = k;
        sstrncpy(Frunoff.name, tok[2], MAXFNAME);
        break;

      case HOTSTART_FILE:
        if ( k == USE_FILE )
        {
            Fhotstart1.mode = k;
            sstrncpy(Fhotstart1.name, tok[2], MAXFNAME);
        }
        else if ( k == SAVE_FILE )
        {
            Fhotstart2.mode = k;
            sstrncpy(Fhotstart2.name, tok[2], MAXFNAME);
        }
        break;

      case RDII_FILE:
        Frdii.mode = k;
        sstrncpy(Frdii.name, tok[2], MAXFNAME);
        break;

      case INFLOWS_FILE:
        if ( k != USE_FILE ) return error_setInpError(ERR_ITEMS, "");
        Finflows.mode = k;
        sstrncpy(Finflows.name, tok[2], MAXFNAME);
        break;

      case OUTFLOWS_FILE:
        if ( k != SAVE_FILE ) return error_setInpError(ERR_ITEMS, "");
        Foutflows.mode = k;
        sstrncpy(Foutflows.name, tok[2], MAXFNAME);
        break;
    }
    return 0;
}

//=============================================================================

function iface_openRoutingFiles()
//
//  Input:   none
//  Output:  none
//  Purpose: opens routing interface files.
//
{
    // --- initialize shared variables
    NumIfacePolluts = 0;
    IfacePolluts = null;
    NumIfaceNodes = 0;
    IfaceNodes = null;
    OldIfaceValues = null;
    NewIfaceValues = null;

    // --- check that inflows & outflows files are not the same
    if ( Foutflows.mode != NO_FILE && Finflows.mode != NO_FILE )
    {
        if ( strcomp(Foutflows.name, Finflows.name) )
        {
            report_writeErrorMsg(ERR_ROUTING_FILE_NAMES, "");
            return;
        }
    }

    // --- open the file for reading or writing
    if ( Foutflows.mode == SAVE_FILE ) openFileForOutput();
    if ( Finflows.mode == USE_FILE ) openFileForInput();
}

//=============================================================================

function iface_closeRoutingFiles()
//
//  Input:   none
//  Output:  none
//  Purpose: closes routing interface files.
//
{
    FREE(IfacePolluts);
    FREE(IfaceNodes);
    if ( OldIfaceValues != null ) project_freeMatrix(OldIfaceValues);
    if ( NewIfaceValues != null ) project_freeMatrix(NewIfaceValues);
    if ( Finflows.file )  fclose(Finflows.file);
    if ( Foutflows.file ) fclose(Foutflows.file);
}

//=============================================================================
// DateTime currentDate
function iface_getNumIfaceNodes(currentDate)
//
//  Input:   currentDate = current date/time
//  Output:  returns number of interface nodes if data exists or
//           0 otherwise
//  Purpose: reads inflow data from interface file at current date.
//
{
    // --- return 0 if file begins after current date
    if ( OldIfaceDate > currentDate ) return 0;

    // --- keep updating new interface values until current date bracketed
    while ( NewIfaceDate < currentDate && NewIfaceDate != NO_DATE )
    {
        setOldIfaceValues();
        readNewIfaceValues();
    }

    // --- return 0 if no data available
    if ( NewIfaceDate == NO_DATE ) return 0;

    // --- find fraction current date is bewteen old & new interface dates
    IfaceFrac = (currentDate - OldIfaceDate) / (NewIfaceDate - OldIfaceDate);
    IfaceFrac = MAX(0.0, IfaceFrac);
    IfaceFrac = MIN(IfaceFrac, 1.0);

    // --- return number of interface nodes
    return NumIfaceNodes;
}

//=============================================================================
// int index
function iface_getIfaceNode(index)
//
//  Input:   index = interface file node index
//  Output:  returns project node index
//  Purpose: finds index of project node associated with interface node index
//
{
    if ( index >= 0 && index < NumIfaceNodes ) return IfaceNodes[index];
    else return -1;
}

//=============================================================================
// int index
function iface_getIfaceFlow(index)
//
//  Input:   index = interface file node index
//  Output:  returns inflow to node
//  Purpose: finds interface flow for particular node index.
//
{
    let q1, q2;

    if ( index >= 0 && index < NumIfaceNodes )
    {
        // --- interpolate flow between old and new values
        q1 = OldIfaceValues[index][0];
        q2 = NewIfaceValues[index][0];
        return (1.0 - IfaceFrac)*q1 + IfaceFrac*q2;
    }
    else return 0.0;
}

//=============================================================================
// int index, int pollut
function iface_getIfaceQual(index,  pollut)
//
//  Input:   index = index of node on interface file
//           pollut = index of pollutant on interface file
//  Output:  returns inflow pollutant concentration
//  Purpose: finds interface concentration for particular node index & pollutant.
//
{
    let    j;
    let c1, c2;

    if ( index >= 0 && index < NumIfaceNodes )
    {
        // --- find index of pollut on interface file
        j = IfacePolluts[pollut];
        if ( j < 0 ) return 0.0;

        // --- interpolate flow between old and new values
        //     (remember that 1st col. of values matrix is for flow)
        c1 = OldIfaceValues[index][j+1];
        c2 = NewIfaceValues[index][j+1];
        return (1.0 - IfaceFrac)*c1 + IfaceFrac*c2;
    }
    else return 0.0;
}

//=============================================================================
// DateTime reportDate, FILE* file
function iface_saveOutletResults(reportDate, file)
//
//  Input:   reportDate = reporting date/time
//           file = ptr. to interface file
//  Output:  none
//  Purpose: saves system outflows to routing interface file.
//
{
    let i, p, yr, mon, day, hr, min, sec;
    let theDate; // char[25]
    let returnObj;
    //datetime_decodeDate(reportDate, yr, mon, day);
    ////////////////////////////////////
    returnObj = {year: yr, month: mon, day: day}
    datetime_decodeDate(reportDate, returnObj);
    yr = returnObj.year;
    mon = returnObj.month;
    day = returnObj.day;
    ////////////////////////////////////
    //datetime_decodeTime(reportDate, hr, min, sec);
    ////////////////////////////////////
    returnObj = {h: hr, min: m, s: sec}
    datetime_decodeTime(reportDate, returnObj);
    hr = returnObj.h;
    min = returnObj.m;
    sec = returnObj.s;
    ////////////////////////////////////

    let val1 = yr.toString().padStart(4, '0')
    let val2 = mon.toString().padStart(2, '0')
    let val3 = day.toString().padStart(2, '0')
    let val4 = hr.toString().padStart(2, '0')
    let val5 = min.toString().padStart(2, '0')
    let val6 = sec.toString().padStart(2, '0')
    theDate = ` ${val1} ${val2}  ${val3}  ${val4}  ${val5}  ${val6} `;
    for (i=0; i<Nobjects[NODE]; i++)
    {
        // --- check that node is an outlet node
        if ( !isOutletNode(i) ) continue;

        // --- write node ID, date, flow, and quality to file
        fprintf(file, "\n%-16s", Node[i].ID);
        fprintf(file, "%s", theDate);
        fprintf(file, " %-10f", Node[i].inflow * UCF(FLOW));
        for ( p = 0; p < Nobjects[POLLUT]; p++ )
        {
            fprintf(file, " %-10f", Node[i].newQual[p]);
        }
    }
}

//=============================================================================

function openFileForOutput()
//
//  Input:   none
//  Output:  none
//  Purpose: opens a routing interface file for writing.
//
{
    let i, n;

    // --- open the routing file for writing text
    Foutflows.file = fopen(Foutflows.name, "wt");
    if ( Foutflows.file == null )
    {
        report_writeErrorMsg(ERR_ROUTING_FILE_OPEN, Foutflows.name);
        return;
    }

    // --- write title & reporting time step to file
    fprintf(Foutflows.file, "SWMM5 Interface File");
    fprintf(Foutflows.file, "\n%s", Title[0]);
    fprintf(Foutflows.file, "\n%-4d - reporting time step in sec", ReportStep);

    // --- write number & names of each constituent (including flow) to file
    fprintf(Foutflows.file, "\n%-4d - number of constituents as listed below:",
            Nobjects[POLLUT] + 1);
    fprintf(Foutflows.file, "\nFLOW %s", FlowUnitWords[FlowUnits]);
    for (i=0; i<Nobjects[POLLUT]; i++)
    {
        fprintf(Foutflows.file, "\n%s %s", Pollut[i].ID,
            QualUnitsWords[Pollut[i].units]);
    }

    // --- count number of outlet nodes
    n = 0;
    for (i=0; i<Nobjects[NODE]; i++)
    {
        if ( isOutletNode(i) ) n++;
    }

    // --- write number and names of outlet nodes to file
    fprintf(Foutflows.file, "\n%-4d - number of nodes as listed below:", n);
    for (i=0; i<Nobjects[NODE]; i++)
    {
          if ( isOutletNode(i) )
            fprintf(Foutflows.file, "\n%s", Node[i].ID);
    }

    // --- write column headings
    fprintf(Foutflows.file,
        "\nNode             Year Mon Day Hr  Min Sec FLOW      ");
    for (i=0; i<Nobjects[POLLUT]; i++)
    {
        fprintf(Foutflows.file, " %-10s", Pollut[i].ID);
    }

    // --- if reporting starts immediately, save initial outlet values
    if ( ReportStart == StartDateTime )
    {
        iface_saveOutletResults(ReportStart, Foutflows.file);
    }
}

//=============================================================================

function openFileForInput()
//
//  Input:   none
//  Output:  none
//  Purpose: opens a routing interface file for reading.
//
{
    let   err;                         // error code
    let  line;             // line from Routing interface file
    let  s;                // general string variable

    // --- open the routing interface file for reading text
    Finflows.file = fopen(Finflows.name, "rt");
    if ( Finflows.file == null )
    {
        report_writeErrorMsg(ERR_ROUTING_FILE_OPEN, Finflows.name);
        return;
    }

    // --- check for correct file type
    fgets(line, MAXLINE, Finflows.file);
    sscanf(line, "%s", s);
    if ( !strcomp(s, "SWMM5") )
    {
        report_writeErrorMsg(ERR_ROUTING_FILE_FORMAT, Finflows.name);
        return;
    }

    // --- skip title line
    fgets(line, MAXLINE, Finflows.file);

    // --- read reporting time step (sec)
    IfaceStep = 0;
    fgets(line, MAXLINE, Finflows.file);
    sscanf(line, "%d", IfaceStep);
    if ( IfaceStep <= 0 )
    {
        report_writeErrorMsg(ERR_ROUTING_FILE_FORMAT, Finflows.name);
        return;
    }

    // --- match constituents in file with those in project
    err = getIfaceFilePolluts();
    if ( err > 0 )
    {
        report_writeErrorMsg(err, Finflows.name);
        return;
    }

    // --- match nodes in file with those in project
    err = getIfaceFileNodes();
    if ( err > 0 )
    {
        report_writeErrorMsg(err, Finflows.name);
        return;
    }

    // --- create matrices for old & new interface flows & WQ values
    OldIfaceValues = project_createMatrix(NumIfaceNodes,
                                         1+NumIfacePolluts);
    NewIfaceValues = project_createMatrix(NumIfaceNodes,
                                         1+NumIfacePolluts);
    if ( OldIfaceValues == null || NewIfaceValues == null )
    {
        report_writeErrorMsg(ERR_MEMORY, "");
        return;
    }

    // --- read in new interface flows & WQ values
    readNewIfaceValues();
    OldIfaceDate = NewIfaceDate;
}

//=============================================================================

function  getIfaceFilePolluts()
//
//  Input:   none
//  Output:  returns an error code
//  Purpose: reads names of pollutants saved on the inflows interface file.
//
{
    let   i, j;
    let  line;             // line from inflows interface file
    let  s1;               // general string variable
    let  s2;         

    // --- read number of pollutants (minus FLOW)
    fgets(line, MAXLINE, Finflows.file);
    sscanf(line, "%d", NumIfacePolluts);
    NumIfacePolluts--;
    if ( NumIfacePolluts < 0 ) return ERR_ROUTING_FILE_FORMAT;

    // --- read flow units
    fgets(line, MAXLINE, Finflows.file);
    sscanf(line, "%s %s", s1, s2);
    if ( !strcomp(s1, "FLOW") )  return ERR_ROUTING_FILE_FORMAT;
    IfaceFlowUnits = findmatch(s2, FlowUnitWords);
    if ( IfaceFlowUnits < 0 ) return ERR_ROUTING_FILE_FORMAT;

    // --- allocate memory for pollutant index array
    if ( Nobjects[POLLUT] > 0 )
    {
        //IfacePolluts = (int *) calloc(Nobjects[POLLUT], sizeof(int));
        IfacePolluts = new Array(Nobjects[POLLUT])
        if ( !IfacePolluts ) return ERR_MEMORY;
        for (i=0; i<Nobjects[POLLUT]; i++) IfacePolluts[i] = -1;
    }

    // --- read pollutant names & units
    if ( NumIfacePolluts > 0 )
    {
        // --- check each pollutant name on file with project's pollutants
        for (i=0; i<NumIfacePolluts; i++)
        {
            if ( feof(Finflows.file) ) return ERR_ROUTING_FILE_FORMAT;
            fgets(line, MAXLINE, Finflows.file);
            sscanf(line, "%s %s", s1, s2);
            if ( Nobjects[POLLUT] > 0 )
            {
                j = project_findObject(POLLUT, s1);
                if ( j < 0 ) continue;
                if ( !strcomp(s2, QualUnitsWords[Pollut[j].units]) )
                    return ERR_ROUTING_FILE_NOMATCH;
                IfacePolluts[j] = i;
            }
        }
    }
    return 0;
}

//=============================================================================

function getIfaceFileNodes()
//
//  Input:   none
//  Output:  returns an error code
//  Purpose: reads names of nodes contained on inflows interface file.
//
{
    let   i;
    let  line;             // line from inflows interface file
    let  s;                // general string variable

    // --- read number of interface nodes
    fgets(line, MAXLINE, Finflows.file);
    sscanf(line, "%d", NumIfaceNodes);
    if ( NumIfaceNodes <= 0 ) return ERR_ROUTING_FILE_FORMAT;

    // --- allocate memory for interface nodes index array
    //IfaceNodes = (int *) calloc(NumIfaceNodes, sizeof(int));
    IfaceNodes = new Array(NumIfaceNodes);
    if ( !IfaceNodes ) return ERR_MEMORY;

    // --- read names of interface nodes from file & save their indexes
    for ( i=0; i<NumIfaceNodes; i++ )
    {
        if ( feof(Finflows.file) ) return ERR_ROUTING_FILE_FORMAT;
        fgets(line, MAXLINE, Finflows.file);
        sscanf(line, "%s", s);
        IfaceNodes[i] = project_findObject(NODE, s);
    }

    // --- skip over column headings line
    if ( feof(Finflows.file) ) return ERR_ROUTING_FILE_FORMAT;
    fgets(line, MAXLINE, Finflows.file);
    return 0;
}

//=============================================================================

function readNewIfaceValues()
//
//  Input:   none
//  Output:  none
//  Purpose: reads data from inflows interface file for next date.
//
{
    let    i, j;
    let  s;
    let    yr = 0, mon = 0, day = 0,
		   hr = 0, min = 0, sec = 0;   // year, month, day, hour, minute, second
    let   line;            // line from interface file

    // --- read a line for each interface node
    NewIfaceDate = NO_DATE;
    for (i=0; i<NumIfaceNodes; i++)
    {
        if ( feof(Finflows.file) ) return;
        fgets(line, MAXLINE, Finflows.file);

        // --- parse date & time from line
        if ( strtok(line, SEPSTR) == null ) return;
        s = strtok(null, SEPSTR);
        if ( s == null ) return;
        yr  = atoi(s);
        s = strtok(null, SEPSTR);
        if ( s == null ) return;
        mon = atoi(s);
        s = strtok(null, SEPSTR);
        if ( s == null ) return;
        day = atoi(s);
        s = strtok(null, SEPSTR);
        if ( s == null ) return;
        hr  = atoi(s);
        s = strtok(null, SEPSTR);
        if ( s == null ) return;
        min = atoi(s);
        s = strtok(null, SEPSTR);
        if ( s == null ) return;
        sec = atoi(s);

        // --- parse flow value
        s = strtok(null, SEPSTR);
        if ( s == null ) return;
        NewIfaceValues[i][0] = atof(s) / Qcf[IfaceFlowUnits]; 

        // --- parse pollutant values
        for (j=1; j<=NumIfacePolluts; j++)
        {
            s = strtok(null, SEPSTR);
            if ( s == null ) return;
            NewIfaceValues[i][j] = atof(s);
        }

    }

    // --- encode date & time values
    NewIfaceDate = datetime_encodeDate(yr, mon, day) +
                   datetime_encodeTime(hr, min, sec);
}

//=============================================================================

function setOldIfaceValues()
//
//  Input:   none
//  Output:  none
//  Purpose: replaces old values read from routing interface file with new ones. 
//
{
    let i, j;
    OldIfaceDate = NewIfaceDate;
    for ( i=0; i<NumIfaceNodes; i++)
    {
        for ( j=0; j<NumIfacePolluts+1; j++ )
        {
            OldIfaceValues[i][j] = NewIfaceValues[i][j];
        }
    }
}

//=============================================================================
// int i
function  isOutletNode(i)
//
//  Input:   i = node index
//  Output:  returns 1 if node is an outlet, 0 if not.
//  Purpose: determines if a node is an outlet point or not.
//
{
    // --- for DW routing only outfalls are outlets
    if ( RouteModel == DW )
    {
        return (Node[i].type == OUTFALL);
    }

    // --- otherwise outlets are nodes with no outflow links (degree is 0)
    else return (Node[i].degree == 0);
}

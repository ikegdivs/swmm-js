//-----------------------------------------------------------------------------
//   output.c
//
//   Project:  EPA SWMM5
//   Version:  5.1
//   Date:     03/20/14  (Build 5.1.001)
//             03/19/15  (Build 5.1.008)
//             08/05/15  (Build 5.1.010)
//             05/10/18  (Build 5.1.013)
//             03/01/20  (Build 5.1.014)
//   Author:   L. Rossman (EPA)
//
//   Binary output file access functions.
//
//   Build 5.1.008:
//   - Possible divide by zero for reported system wide variables avoided.
//   - Updating of maximum node depth at reporting times added.
//
//   Build 5.1.010:
//   - Potentional ET added to list of system-wide variables saved to file.
//
//   Build 5.1.013:
//   - Names NsubcatchVars, NnodeVars & NlinkVars replaced with
//     NumSubcatchVars, NumNodeVars & NumLinkVars 
//   - Support added for saving average node & link routing results to
//     binary file in each reporting period.
//
//   Build 5.1.014:
//   - Incorrect loop limit fixed in function output_saveAvgResults.
//
//-----------------------------------------------------------------------------

//enum InputDataType {
var INPUT_TYPE_CODE = 0 
var INPUT_AREA = 1 
var INPUT_INVERT = 2
var INPUT_MAX_DEPTH = 3
var INPUT_OFFSET = 4 
var INPUT_LENGTH = 5

/*typedef struct                                                                 //(5.1.013)
{                                                                              //
    REAL4* xAvg;                                                               //
}   TAvgResults; */                                                              //
TAvgResults = [];

//-----------------------------------------------------------------------------
//  Shared variables    
//-----------------------------------------------------------------------------
var IDStartPos;           // starting file position of ID names
var InputStartPos;        // starting file position of input data
var OutputStartPos;       // starting file position of output data
var BytesPerPeriod;       // bytes saved per simulation time period
var NumSubcatchVars;      // number of subcatchment output variables
var NumNodeVars;          // number of node output variables
var NumLinkVars;          // number of link output variables
var NumSubcatch;          // number of subcatchments reported on
var NumNodes;             // number of nodes reported on
var NumLinks;             // number of links reported on
var NumPolluts;           // number of pollutants reported on
var SysResults = new Array(MAX_SYS_RESULTS);    // values of system output vars.

//static TAvgResults* AvgLinkResults;                                            //(5.1.013)
//static TAvgResults* AvgNodeResults;                                            //
//static int          Nsteps;                                                    //
AvgLinkResults = [];                                            //(5.1.013)
AvgNodeResults = [];                                            //
var Nsteps;   

//-----------------------------------------------------------------------------
//  Exportable variables (shared with report.c)
//-----------------------------------------------------------------------------
var SubcatchResults;
var NodeResults;
var LinkResults;

//-----------------------------------------------------------------------------
//  External functions (declared in funcs.h)
//-----------------------------------------------------------------------------
//  output_open                   (called by swmm_start in swmm5.c)
//  output_end                    (called by swmm_end in swmm5.c)
//  output_close                  (called by swmm_close in swmm5.c)
//  output_updateAvgResults       (called by swmm_step in swmm5.c)             //(5.1.013)
//  output_saveResults            (called by swmm_step in swmm5.c)
//  output_checkFileSize          (called by swmm_report)
//  output_readDateTime           (called by routines in report.c)
//  output_readSubcatchResults    (called by report_Subcatchments)
//  output_readNodeResults        (called by report_Nodes)
//  output_readLinkResults        (called by report_Links)


//=============================================================================

function output_open()
//
//  Input:   none
//  Output:  returns an error code
//  Purpose: writes basic project data to binary output file.
//
{
    let   j;
    let   m;
    let  k;
    let x;
    let z;
    let hexdata = ''; // Hexadecimal string that is translated to binary.

    // --- open binary output file
    output_openOutFile();
    if ( ErrorCode ) return ErrorCode;

    // --- ignore pollutants if no water quality analsis performed
    if ( IgnoreQuality ) NumPolluts = 0;
    else NumPolluts = Nobjects[POLLUT];

    // --- subcatchment results consist of Rainfall, Snowdepth, Evap, 
    //     Infil, Runoff, GW Flow, GW Elev, GW Sat, and Washoff
    NumSubcatchVars = MAX_SUBCATCH_RESULTS - 1 + NumPolluts;

    // --- node results consist of Depth, Head, Volume, Lateral Inflow,
    //     Total Inflow, Overflow and Quality
    NumNodeVars = MAX_NODE_RESULTS - 1 + NumPolluts;

    // --- link results consist of Depth, Flow, Velocity, Volume,              //(5.1.013)
    //     Capacity and Quality
    NumLinkVars = MAX_LINK_RESULTS - 1 + NumPolluts;

    // --- get number of objects reported on
    NumSubcatch = 0;
    NumNodes = 0;
    NumLinks = 0;
    for (j=0; j<Nobjects[SUBCATCH]; j++) if (Subcatch[j].rptFlag) NumSubcatch++;
    for (j=0; j<Nobjects[NODE]; j++) if (Node[j].rptFlag) NumNodes++;
    for (j=0; j<Nobjects[LINK]; j++) if (Link[j].rptFlag) NumLinks++;

    /*BytesPerPeriod = sizeof(REAL8)
        + NumSubcatch * NumSubcatchVars * sizeof(REAL4)
        + NumNodes * NumNodeVars * sizeof(REAL4)
        + NumLinks * NumLinkVars * sizeof(REAL4)
        + MAX_SYS_RESULTS * sizeof(REAL4);*/
    BytesPerPeriod = 8
        + NumSubcatch * NumSubcatchVars * 4
        + NumNodes * NumNodeVars * 4
        + NumLinks * NumLinkVars * 4
        + MAX_SYS_RESULTS * 4;
    Nperiods = 0;

    SubcatchResults = null;
    NodeResults = null;
    LinkResults = null;
    //SubcatchResults = (REAL4 *) calloc(NumSubcatchVars, sizeof(REAL4));
    //NodeResults = (REAL4 *) calloc(NumNodeVars, sizeof(REAL4));
    //LinkResults = (REAL4 *) calloc(NumLinkVars, sizeof(REAL4));
    SubcatchResults = new Array(NumSubcatchVars);
    NodeResults = new Array(NumNodeVars);
    LinkResults = new Array(NumLinkVars);
    if ( !SubcatchResults || !NodeResults || !LinkResults )
    {
        report_writeErrorMsg(ERR_MEMORY, "");
        return ErrorCode;
    }

    // --- allocate memory to store average node & link results per period     //(5.1.013)
    AvgNodeResults = null;                                                     //
    AvgLinkResults = null;                                                     //
    if ( RptFlags.averages && !output_openAvgResults() )                       //
    {                                                                          //
        report_writeErrorMsg(ERR_MEMORY, "");                                  //
        return ErrorCode;                                                      //
    }                                                                          //

    /*fseek(Fout.file, 0, SEEK_SET);
    k = MAGICNUMBER;
    fwrite(k, sizeof(INT4), 1, Fout.file);   // Magic number
    k = VERSION;
    fwrite(k, sizeof(INT4), 1, Fout.file);   // Version number
    k = FlowUnits;
    fwrite(k, sizeof(INT4), 1, Fout.file);   // Flow units
    k = NumSubcatch;
    fwrite(k, sizeof(INT4), 1, Fout.file);   // # subcatchments
    k = NumNodes;
    fwrite(k, sizeof(INT4), 1, Fout.file);   // # nodes
    k = NumLinks;
    fwrite(k, sizeof(INT4), 1, Fout.file);   // # links
    k = NumPolluts;
    fwrite(k, sizeof(INT4), 1, Fout.file);   // # pollutants*/
    // 
    
    // Write the data to a hexadecimal string
    k = MAGICNUMBER;
    hexdata = hexdata +  toBytes32(k);   // Magic number
    k = VERSION;
    hexdata = hexdata +  toBytes32(k);   // Version number
    k = FlowUnits;
    hexdata = hexdata +  toBytes32(k);   // Flow units
    k = NumSubcatch;
    hexdata = hexdata +  toBytes32(k);   // # subcatchments
    k = NumNodes;
    hexdata = hexdata +  toBytes32(k);   // # nodes
    k = NumLinks;
    hexdata = hexdata +  toBytes32(k);   // # links
    k = NumPolluts;
    hexdata = hexdata +  toBytes32(k);   // # pollutants

    /////////
    // This may need a little explanation:
    // Prior to this: create a hexadecimal text string var.
    //   name the hexadecimal string ""hexdata"" 
    // Use the following function to translate the hexadecimal file into a binary file.
    var byteArray = new Uint8Array(hexdata.match(/.{2}/g).map(e => parseInt(e, 16)));


    // --- save ID names of subcatchments, nodes, links, & pollutants 
    //IDStartPos = ftell(Fout.file);
    // This may go better if I keep on appending hex strings and then only 
    // translate to blob when it is imperative.
    IDStartPos = byteArray.length;
    for (j=0; j<Nobjects[SUBCATCH]; j++)
    {
        if ( Subcatch[j].rptFlag ) output_saveID(Subcatch[j].ID, Fout.file);
    }
    for (j=0; j<Nobjects[NODE];     j++)
    {
        if ( Node[j].rptFlag ) output_saveID(Node[j].ID, Fout.file);
    }
    for (j=0; j<Nobjects[LINK];     j++)
    {
        if ( Link[j].rptFlag ) output_saveID(Link[j].ID, Fout.file);
    }
    for (j=0; j<NumPolluts; j++) output_saveID(Pollut[j].ID, Fout.file);

    // --- save codes of pollutant concentration units
    for (j=0; j<NumPolluts; j++)
    {
        k = Pollut[j].units;
        //fwrite(k, sizeof(INT4), 1, Fout.file);
        hexdata = hexdata +  toBytes32(k);  
    }

    //InputStartPos = ftell(Fout.file);
    InputStartPos = hexdata.length;

    // --- save subcatchment area
    k = 1;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k);  
    k = INPUT_AREA;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k);  
    for (j=0; j<Nobjects[SUBCATCH]; j++)
    {
         if ( !Subcatch[j].rptFlag ) continue;
         SubcatchResults[0] = (Subcatch[j].area * UCF(LANDAREA));
         //fwrite(SubcatchResults[0], sizeof(REAL4), 1, Fout.file);
         hexdata = hexdata +  toBytes32f(SubcatchResults[0]);  
    }

    // --- save node type, invert, & max. depth
    k = 3;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    k = INPUT_TYPE_CODE;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k);  
    k = INPUT_INVERT;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k);  
    k = INPUT_MAX_DEPTH;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k);  
    for (j=0; j<Nobjects[NODE]; j++)
    {
        if ( !Node[j].rptFlag ) continue;
        k = Node[j].type;
        NodeResults[0] = (REAL4)(Node[j].invertElev * UCF(LENGTH));
        NodeResults[1] = (REAL4)(Node[j].fullDepth * UCF(LENGTH));
        //fwrite(k, sizeof(INT4), 1, Fout.file);
        hexdata = hexdata +  toBytes32(k);  
        //fwrite(NodeResults, sizeof(REAL4), 2, Fout.file);
        hexdata = hexdata +  toBytes32f(NodeResults[0]);  
        hexdata = hexdata +  toBytes32f(NodeResults[1]);  
    }

    // --- save link type, offsets, max. depth, & length
    k = 5;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 
    k = INPUT_TYPE_CODE;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 
    k = INPUT_OFFSET;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 
    k = INPUT_OFFSET;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 
    k = INPUT_MAX_DEPTH;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 
    k = INPUT_LENGTH;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 

    for (j=0; j<Nobjects[LINK]; j++)
    {
        if ( !Link[j].rptFlag ) continue;
        k = Link[j].type;
        if ( k == PUMP )
        {
            for (m=0; m<4; m++) LinkResults[m] = 0.0;
        }
        else
        {
            LinkResults[0] = (Link[j].offset1 * UCF(LENGTH));
            LinkResults[1] = (Link[j].offset2 * UCF(LENGTH));
            if ( Link[j].direction < 0 )
            {
                x = LinkResults[0];
                LinkResults[0] = LinkResults[1];
                LinkResults[1] = x;
            }
            if ( k == OUTLET ) LinkResults[2] = 0.0;
            else LinkResults[2] = (Link[j].xsect.yFull * UCF(LENGTH));
            if ( k == CONDUIT )
            {
                m = Link[j].subIndex;
                LinkResults[3] = (Conduit[m].length * UCF(LENGTH));
            }
            else LinkResults[3] = 0.0;
        }
        //fwrite(k, sizeof(INT4), 1, Fout.file);
        hexdata = hexdata +  toBytes32(k); 
        //fwrite(LinkResults, sizeof(REAL4), 4, Fout.file);
        for (let u=0; u<4; u++) hexdata = hexdata +  toBytes32f(LinkResults[u]);
         
    }

    // --- save number & codes of subcatchment result variables
    k = NumSubcatchVars;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 
    k = SUBCATCH_RAINFALL;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 
    k = SUBCATCH_SNOWDEPTH;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 
    k = SUBCATCH_EVAP;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 
    k = SUBCATCH_INFIL;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 
    k = SUBCATCH_RUNOFF;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 
    k = SUBCATCH_GW_FLOW;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 
    k = SUBCATCH_GW_ELEV;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 
    k = SUBCATCH_SOIL_MOIST;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 

    for (j=0; j<NumPolluts; j++) 
    {
        k = SUBCATCH_WASHOFF + j;
        //fwrite(k, sizeof(INT4), 1, Fout.file);
        hexdata = hexdata +  toBytes32(k); 
    }

    // --- save number & codes of node result variables
    k = NumNodeVars;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 
    k = NODE_DEPTH;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 
    k = NODE_HEAD;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 
    k = NODE_VOLUME;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 
    k = NODE_LATFLOW;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 
    k = NODE_INFLOW;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 
    k = NODE_OVERFLOW;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 
    for (j=0; j<NumPolluts; j++)
    {
        k = NODE_QUAL + j;
        //fwrite(k, sizeof(INT4), 1, Fout.file);
        hexdata = hexdata +  toBytes32(k); 
    }

    // --- save number & codes of link result variables
    k = NumLinkVars;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 
    k = LINK_FLOW;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 
    k = LINK_DEPTH;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 
    k = LINK_VELOCITY;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 
    k = LINK_VOLUME;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 
    k = LINK_CAPACITY;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 
    for (j=0; j<NumPolluts; j++)
    {
        k = LINK_QUAL + j;
        //fwrite(k, sizeof(INT4), 1, Fout.file);
        hexdata = hexdata +  toBytes32(k); 
    }

    // --- save number & codes of system result variables
    k = MAX_SYS_RESULTS;
    //fwrite(k, sizeof(INT4), 1, Fout.file);
    hexdata = hexdata +  toBytes32(k); 
    for (k=0; k<MAX_SYS_RESULTS; k++) {
        //fwrite(k, sizeof(INT4), 1, Fout.file);
        hexdata = hexdata +  toBytes32(k); 
    }

    // --- save starting report date & report step
    //     (if reporting start date > simulation start date then
    //      make saved starting report date one reporting period
    //      prior to the date of the first reported result)
    z = ReportStep/86400.0;
    if ( StartDateTime + z > ReportStart ) z = StartDateTime;
    else
    {
        z = Math.floor((ReportStart - StartDateTime)/z) - 1.0;
        z = StartDateTime + z*ReportStep/86400.0;
    }
    //fwrite(z, sizeof(REAL8), 1, Fout.file);
    hexdata = hexdata +  z.toString(16); 
    k = ReportStep;

    /*if ( fwrite(k, sizeof(INT4), 1, Fout.file) < 1)
    {
        report_writeErrorMsg(ERR_OUT_WRITE, "");
        return ErrorCode;
    }*/
    hexdata = hexdata +  toBytes32(k); 

    //var byteArray = new Uint8Array(hexdata.match(/.{2}/g).map(e => parseInt(e, 16)));
    //var blob = new Blob([byteArray], {type: 'application/octet-stream'})
    //fout.contents = blob;

    Fout.contents = hexdata;

    OutputStartPos = hexdata.length;
    if ( Fout.mode == SCRATCH_FILE ) output_checkFileSize();
    return ErrorCode;
}

//=============================================================================

function  output_checkFileSize()
//
//  Input:   none
//  Output:  none
//  Purpose: checks if the size of the binary output file will be too big
//           to access using an integer file pointer variable.
//
{
    if ( RptFlags.subcatchments != NONE ||
         RptFlags.nodes != NONE ||
         RptFlags.links != NONE )
    {
        if ( OutputStartPos + BytesPerPeriod * TotalDuration
             / 1000.0 / ReportStep >= MAXFILESIZE )
        {
            report_writeErrorMsg(ERR_FILE_SIZE, "");
        }
    }
}


//=============================================================================

function output_openOutFile()
//
//  Input:   none
//  Output:  none
//  Purpose: opens a project's binary output file.
//
{
    // --- close output file if already opened
    if (Fout.file != null) fclose(Fout.file); 

    // --- else if file name supplied then set file mode to SAVE
    else if (Fout.name.length != 0) Fout.mode = SAVE_FILE;

    // --- otherwise set file mode to SCRATCH & generate a name
    else
    {
        Fout.mode = SCRATCH_FILE;
        getTempFileName(Fout.name);
    }

    // --- try to open the file
    if ( (Fout.file = fopen(Fout.name, "w+b")) == null)
    {
        writecon(FMT14);
        ErrorCode = ERR_OUT_FILE;
    }
}

//=============================================================================
// double reportTime
function output_saveResults(reportTime)
//
//  Input:   reportTime = elapsed simulation time (millisec)
//  Output:  none
//  Purpose: writes computed results for current report time to binary file.
//
{
    let i;
    //extern TRoutingTotals StepFlowTotals;  // defined in massbal.c             //(5.1.013)
    let reportDate = getDateTime(reportTime);
    let date;

    // --- initialize system-wide results
    if ( reportDate < ReportStart ) return;
    for (i=0; i<MAX_SYS_RESULTS; i++) SysResults[i] = 0.0;

    // --- save date corresponding to this elapsed reporting time
    date = reportDate;
    fwrite(date, sizeof(REAL8), 1, Fout.file);

    // --- save subcatchment results
    if (Nobjects[SUBCATCH] > 0)
        output_saveSubcatchResults(reportTime, Fout.file);

    // --- save average routing results over reporting period if called for    //(5.1.013)
    if ( RptFlags.averages ) output_saveAvgResults(Fout.file);                 //

    // --- otherwise save interpolated point routing results                   //(5.1.013)
    else                                                                       //
    {
        if (Nobjects[NODE] > 0)
            output_saveNodeResults(reportTime, Fout.file);
        if (Nobjects[LINK] > 0)
            output_saveLinkResults(reportTime, Fout.file);
    }

    // --- update & save system-wide flows 
    SysResults[SYS_FLOODING] = (REAL4)(StepFlowTotals.flooding * UCF(FLOW));
    SysResults[SYS_OUTFLOW] = (REAL4)(StepFlowTotals.outflow * UCF(FLOW));
    SysResults[SYS_DWFLOW] = (REAL4)(StepFlowTotals.dwInflow * UCF(FLOW));
    SysResults[SYS_GWFLOW] = (REAL4)(StepFlowTotals.gwInflow * UCF(FLOW));
    SysResults[SYS_IIFLOW] = (REAL4)(StepFlowTotals.iiInflow * UCF(FLOW));
    SysResults[SYS_EXFLOW] = (REAL4)(StepFlowTotals.exInflow * UCF(FLOW));
    SysResults[SYS_INFLOW] = SysResults[SYS_RUNOFF] +
                             SysResults[SYS_DWFLOW] +
                             SysResults[SYS_GWFLOW] +
                             SysResults[SYS_IIFLOW] +
                             SysResults[SYS_EXFLOW];
    fwrite(SysResults, sizeof(REAL4), MAX_SYS_RESULTS, Fout.file);

    // --- save outfall flows to interface file if called for
    if ( Foutflows.mode == SAVE_FILE && !IgnoreRouting ) 
        iface_saveOutletResults(reportDate, Foutflows.file);
    Nperiods++;
}

//=============================================================================

function output_end()
//
//  Input:   none
//  Output:  none
//  Purpose: writes closing records to binary file.
//
{
    let k;
    fwrite(IDStartPos, sizeof(INT4), 1, Fout.file);
    fwrite(InputStartPos, sizeof(INT4), 1, Fout.file);
    fwrite(OutputStartPos, sizeof(INT4), 1, Fout.file);
    k = Nperiods;
    fwrite(k, sizeof(INT4), 1, Fout.file);
    k = error_getCode(ErrorCode);
    fwrite(k, sizeof(INT4), 1, Fout.file);
    k = MAGICNUMBER;
    if (fwrite(k, sizeof(INT4), 1, Fout.file) < 1)
    {
        report_writeErrorMsg(ERR_OUT_WRITE, "");
    }
}

//=============================================================================

function output_close()
//
//  Input:   none
//  Output:  none
//  Purpose: frees memory used for accessing the binary file.
//
{
    FREE(SubcatchResults);
    FREE(NodeResults);
    FREE(LinkResults);
    output_closeAvgResults();                                                  //(5.1.013)
}

//=============================================================================
// char* id, FILE* file
// Changed FILE* file to an object that 
// has the .contents attribute: hasContents
function output_saveID(id, hasContents)
//
//  Input:   id = name of an object
//           file = ptr. to binary output file
//  Output:  none
//  Purpose: writes an object's name to the binary output file.
//
{
    let n = id.length;
    //fwrite(n, sizeof(INT4), 1, file);
    hasContents.contents = hasContents.contents +  toBytes32(n); 
    //fwrite(id, sizeof(char), n, file);
    hasContents.contents = hasContents.contents +  toBytes32a(id); 
}

//=============================================================================
// double reportTime, FILE* file
function output_saveSubcatchResults(reportTime, file)
//
//  Input:   reportTime = elapsed simulation time (millisec)
//           file = ptr. to binary output file
//  Output:  none
//  Purpose: writes computed subcatchment results to binary file.
//
{
    let      j;
    let   f;
    let   area;
    let    totalArea = 0.0; 
    let reportDate = getDateTime(reportTime);

    // ret facil
    let returnObj;
    let returnVal;

    // --- update reported rainfall at each rain gage
    for ( j=0; j<Nobjects[GAGE]; j++ )
    {
        gage_setReportRainfall(j, reportDate);
    }

    // --- find where current reporting time lies between latest runoff times
    f = (reportTime - OldRunoffTime) / (NewRunoffTime - OldRunoffTime);

    // --- write subcatchment results to file
    for ( j=0; j<Nobjects[SUBCATCH]; j++)
    {
        // --- retrieve interpolated results for reporting time & write to file
        ////////////////////////////////////
        returnObj = {x: SubcatchResults}
        returnVal = subcatch_getResults(j, f, returnObj)
        SubcatchResults = returnObj.x;
        ////////////////////////////////////
        //subcatch_getResults(j, f, SubcatchResults);
        if ( Subcatch[j].rptFlag )
            fwrite(SubcatchResults, sizeof(REAL4), NumSubcatchVars, file);

        // --- update system-wide results
        area = Subcatch[j].area * UCF(LANDAREA);
        totalArea += area;
        SysResults[SYS_RAINFALL] +=
            (REAL4)(SubcatchResults[SUBCATCH_RAINFALL] * area);
        SysResults[SYS_SNOWDEPTH] +=
            (REAL4)(SubcatchResults[SUBCATCH_SNOWDEPTH] * area);
        SysResults[SYS_EVAP] +=
            (REAL4)(SubcatchResults[SUBCATCH_EVAP] * area);
        if ( Subcatch[j].groundwater ) SysResults[SYS_EVAP] += 
            (REAL4)(Subcatch[j].groundwater.evapLoss * UCF(EVAPRATE) * area);
        SysResults[SYS_INFIL] +=
            (REAL4)(SubcatchResults[SUBCATCH_INFIL] * area);
        SysResults[SYS_RUNOFF] += SubcatchResults[SUBCATCH_RUNOFF];
    }

    // --- normalize system-wide results to catchment area
    if ( totalArea > 0.0 )
    {
        SysResults[SYS_EVAP]      /= totalArea;
        SysResults[SYS_RAINFALL]  /= totalArea;
        SysResults[SYS_SNOWDEPTH] /= totalArea;
        SysResults[SYS_INFIL]     /= totalArea;
    }

    // --- update system temperature and PET
    if ( UnitSystem == SI ) f = (5./9.) * (Temp.ta - 32.0);
    else f = Temp.ta;
    SysResults[SYS_TEMPERATURE] = f;
    f = Evap.rate * UCF(EVAPRATE);
    SysResults[SYS_PET] = f;

}

//=============================================================================

////  This function was re-written for release 5.1.013.  ////                  //(5.1.013)
// double reportTime, FILE* file
function output_saveNodeResults(reportTime, file)
//
//  Input:   reportTime = elapsed simulation time (millisec)
//           file = ptr. to binary output file
//  Output:  none
//  Purpose: writes computed node results to binary file.
//
{
    let j;

    // --- find where current reporting time lies between latest routing times
    let f = (reportTime - OldRoutingTime) /
               (NewRoutingTime - OldRoutingTime);

    // --- write node results to file
    for (j=0; j<Nobjects[NODE]; j++)
    {
        // --- retrieve interpolated results for reporting time & write to file
        node_getResults(j, f, NodeResults);
        if ( Node[j].rptFlag )
            fwrite(NodeResults, sizeof(REAL4), NumNodeVars, file);
        stats_updateMaxNodeDepth(j, NodeResults[NODE_DEPTH]);

        // --- update system-wide storage volume 
        SysResults[SYS_STORAGE] += NodeResults[NODE_VOLUME];
    }
}

//=============================================================================
// double reportTime, FILE* file
function output_saveLinkResults(reportTime, file)
//
//  Input:   reportTime = elapsed simulation time (millisec)
//           file = ptr. to binary output file
//  Output:  none
//  Purpose: writes computed link results to binary file.
//
{
    let j;
    let f;
    let z;

    // --- find where current reporting time lies between latest routing times
    f = (reportTime - OldRoutingTime) / (NewRoutingTime - OldRoutingTime);

    // --- write link results to file
    for (j=0; j<Nobjects[LINK]; j++)
    {
        // --- retrieve interpolated results for reporting time & write to file
        if (Link[j].rptFlag)
        {
            link_getResults(j, f, LinkResults);
            fwrite(LinkResults, sizeof(REAL4), NumLinkVars, file);
        }

        // --- update system-wide results
        z = ((1.0-f)*Link[j].oldVolume + f*Link[j].newVolume) * UCF(VOLUME);
        SysResults[SYS_STORAGE] += z;
    }
}

//=============================================================================
// int period, DateTime* days
function output_readDateTime(period, days)
//
//  Input:   period = index of reporting time period
//  Output:  days = date/time value
//  Purpose: retrieves the date/time for a specific reporting period
//           from the binary output file.
//
{
    let bytePos = OutputStartPos + (period-1)*BytesPerPeriod;
    fseek(Fout.file, bytePos, SEEK_SET);
    days = NO_DATE;
    fread(days, sizeof(REAL8), 1, Fout.file);
}

//=============================================================================
// int period, int index
function output_readSubcatchResults(period, index)
//
//  Input:   period = index of reporting time period
//           index = subcatchment index
//  Output:  none
//  Purpose: reads computed results for a subcatchment at a specific time
//           period.
//
{
    let bytePos = OutputStartPos + (period-1)*BytesPerPeriod;
    bytePos += sizeof(REAL8) + index*NumSubcatchVars*sizeof(REAL4);
    fseek(Fout.file, bytePos, SEEK_SET);
    fread(SubcatchResults, sizeof(REAL4), NumSubcatchVars, Fout.file);
}

//=============================================================================
// int period, int index
function output_readNodeResults(period, index)
//
//  Input:   period = index of reporting time period
//           index = node index
//  Output:  none
//  Purpose: reads computed results for a node at a specific time period.
//
{
    let bytePos = OutputStartPos + (period-1)*BytesPerPeriod;
    bytePos += sizeof(REAL8) + NumSubcatch*NumSubcatchVars*sizeof(REAL4);
    bytePos += index*NumNodeVars*sizeof(REAL4);
    fseek(Fout.file, bytePos, SEEK_SET);
    fread(NodeResults, sizeof(REAL4), NumNodeVars, Fout.file);
}

//=============================================================================
// int period, int index
function output_readLinkResults(period, index)
//
//  Input:   period = index of reporting time period
//           index = link index
//  Output:  none
//  Purpose: reads computed results for a link at a specific time period.
//
{
    let bytePos = OutputStartPos + (period-1)*BytesPerPeriod;
    bytePos += sizeof(REAL8) + NumSubcatch*NumSubcatchVars*sizeof(REAL4);
    bytePos += NumNodes*NumNodeVars*sizeof(REAL4);
    bytePos += index*NumLinkVars*sizeof(REAL4);
    fseek(Fout.file, bytePos, SEEK_SET);
    fread(LinkResults, sizeof(REAL4), NumLinkVars, Fout.file);
    fread(SysResults, sizeof(REAL4), MAX_SYS_RESULTS, Fout.file);
}

////  The following functions were added for release 5.1.013.  ////            //(5.1.013)

//=============================================================================
//  Functions for saving average results within a reporting period to file.
//=============================================================================

function output_openAvgResults()
{
    let i;
    
    // --- allocate memory for averages at reportable nodes
    //AvgNodeResults = (TAvgResults *)calloc(NumNodes, sizeof(TAvgResults));
    for(let i = 0; i < NumNodes; i++){AvgNodeResults.push(new TAvgResults())}
    
    if ( AvgNodeResults == null ) return false;
    for (i = 0; i < NumNodes; i++ ) AvgNodeResults[i].xAvg = null;

    // --- allocate memory for averages at reportable links
    //AvgLinkResults = (TAvgResults *)calloc(NumLinks, sizeof(TAvgResults));
    for(let i = 0; i < NumLinks; i++){AvgLinkResults.push(new TAvgResults())}

    if (AvgLinkResults == null)
    {
        output_closeAvgResults();
        return false;
    }
    for (i = 0; i < NumLinks; i++) AvgLinkResults[i].xAvg = null;

    // --- allocate memory for each reportable variable for each reportable node
    for (i = 0; i < NumNodes; i++)
    {
        //AvgNodeResults[i].xAvg = (REAL4*) calloc(NumNodeVars, sizeof(REAL4));
        AvgNodeResults[i].xAvg = new Array(NumNodeVars);
        if (AvgNodeResults[i].xAvg == null)
        {
            output_closeAvgResults();
            return false;
        }
    }

    // --- allocate memory for each reportable variable for each reportable link
    for (i = 0; i < NumLinks; i++)
    {
        //AvgLinkResults[i].xAvg = (REAL4*)calloc(NumLinkVars, sizeof(REAL4));
        AvgLinkResults[i].xAvg = new Array(NumLinkVars);
        if (AvgLinkResults[i].xAvg == null)
        {
            output_closeAvgResults();
            return false;
        }
    }
    return true;
}

//=============================================================================

function output_closeAvgResults()
{
    let i;
    if (AvgNodeResults)
    {
        for (i = 0; i < NumNodes; i++)  FREE(AvgNodeResults[i].xAvg); 
        FREE(AvgNodeResults);
    }
    if (AvgLinkResults)
    {
        for (i = 0; i < NumLinks; i++)  FREE(AvgLinkResults[i].xAvg);
        FREE(AvgLinkResults);
    }
}

//=============================================================================

function output_initAvgResults()
{
    let i, j;
    Nsteps = 0;
    for (i = 0; i < NumNodes; i++)
    {
        for (j = 0; j < NumNodeVars; j++) AvgNodeResults[i].xAvg[j] = 0.0;
    }
    for (i = 0; i < NumLinks; i++)
    {
        for (j = 0; j < NumLinkVars; j++) AvgLinkResults[i].xAvg[j] = 0.0;
    }
}

//=============================================================================

function output_updateAvgResults()
{
    let i, j, k, sign;

    // --- update average accumulations for nodes
    k = 0;
    for (i = 0; i < Nobjects[NODE]; i++)
    {
        if ( !Node[i].rptFlag ) continue;
        node_getResults(i, 1.0, NodeResults);
        for (j = 0; j < NumNodeVars; j++)
        {
            AvgNodeResults[k].xAvg[j] += NodeResults[j];
        }
        k++;
    }

    // --- update average accumulations for links
    k = 0;
    for (i = 0; i < Nobjects[LINK]; i++)
    {
        if ( !Link[i].rptFlag ) continue;
        link_getResults(i, 1.0, LinkResults);

        // --- save sign of current flow rate
        sign = SGN(LinkResults[LINK_FLOW]);

        // --- add current results to average accumulation
        for (j = 0; j < NumLinkVars; j++)
        {
            // --- accumulate flow so its sign (+/-) will equal that of most
            //     recent flow result
            if ( j == LINK_FLOW )
            {
                AvgLinkResults[k].xAvg[j] =
                    sign * (ABS(AvgLinkResults[k].xAvg[j]) + ABS(LinkResults[j]));
            }

            // --- link capacity is another special case
            else if (j == LINK_CAPACITY)
            {
                // --- accumulate capacity (fraction full) for conduits 
                if ( Link[i].type == CONDUIT )
                    AvgLinkResults[k].xAvg[j] += LinkResults[j];

                // --- for other links capacity is pump speed or regulator
                //     opening fraction which shouldn't be averaged
                //     (multiplying by Nsteps+1 will preserve last value
                //     when average results are taken in saveAvgResults())
                else  
                    AvgLinkResults[k].xAvg[j] = LinkResults[j] * (Nsteps+1);
            }

            // --- accumulation for all other reported results
            else AvgLinkResults[k].xAvg[j] += LinkResults[j];
        }
        k++;
    }
    Nsteps++;
}

//=============================================================================
// FILE* file
function output_saveAvgResults(file)
{
    let i, j;

    // --- examine each reportable node
    for (i = 0; i < NumNodes; i++)
    {
        // --- determine the node's average results
        for (j = 0; j < NumNodeVars; j++)
        {
            NodeResults[j] = AvgNodeResults[i].xAvg[j] / Nsteps;
        }

        // --- save average results to file
        fwrite(NodeResults, sizeof(REAL4), NumNodeVars, file);
    }

    // --- update each node's max depth and contribution to system storage
    for (i = 0; i < Nobjects[NODE]; i++)
    {
        stats_updateMaxNodeDepth(i, Node[i].newDepth * UCF(LENGTH));
        SysResults[SYS_STORAGE] += (REAL4)(Node[i].newVolume * UCF(VOLUME));
    }

    // --- examine each reportable link
    for (i = 0; i < NumLinks; i++)
    {
        // --- determine the link's average results
        for (j = 0; j < NumLinkVars; j++)
        {
            LinkResults[j] = AvgLinkResults[i].xAvg[j] / Nsteps;
        }

        // --- save average results to file
        fwrite(LinkResults, sizeof(REAL4), NumLinkVars, file);
    }
 
    // --- add each link's volume to total system storage
    for (i = 0; i < Nobjects[LINK]; i++)                                       //(5.1.014)
    {
        SysResults[SYS_STORAGE] += (REAL4)(Link[i].newVolume * UCF(VOLUME));
    }

    // --- re-initialize average results for all nodes and links
    output_initAvgResults();
}

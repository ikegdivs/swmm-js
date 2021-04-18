//-----------------------------------------------------------------------------
//   rdii.c
//
//   Project:  EPA SWMM5
//   Version:  5.1
//   Date:     03/20/14   (Build 5.1.001)
//             04/04/14   (Build 5.1.003)
//             04/14/14   (Build 5.1.004)
//             09/15/14   (Build 5.1.007)
//             03/01/20   (Build 5.1.014)
//   Author:   L. Rossman (EPA)
//             R. Dickinson (CDM)
//
//   RDII processing functions.
//
//   Note: RDII means rainfall dependent infiltration/inflow,
//         UH means unit hydrograph.
//
//   Build 5.1.007:
//   - Ignore RDII option implemented.
//   - Rainfall climate adjustment implemented.
//
//   Build 5.1.014:
//   - Fixes bug related to isUsed property of a unit hydrograph's rain gage.
//-----------------------------------------------------------------------------


//-----------------------------------------------------------------------------
// Definition of 4-byte integer, 4-byte real and 8-byte real types
//-----------------------------------------------------------------------------
var INT4  
//#define REAL4 float
//#define REAL8 double
var FILE_STAMP = "SWMM5-RDII"

//-----------------------------------------------------------------------------
// Constants
//-----------------------------------------------------------------------------
var ZERO_RDII = 0.0001;       // Minimum non-zero RDII inflow (cfs)
var FileStamp = FILE_STAMP;

//-----------------------------------------------------------------------------
// Data Structures
//-----------------------------------------------------------------------------
// enum FileTypes {BINARY, TEXT};         // File mode types
var BINARY = 0
var TEXT = 1

class TUHData                         // Data for a single unit hydrograph
{                                      // -------------------------------------
   constructor(){
    this.pastRain = [];                 // array of past rainfall values
    this.pastMonth;                // month in which past rainfall occurred
    this.period;                   // current UH time period
    this.hasPastRain;              // true if > 0 past periods with rain
    this.maxPeriods;               // max. past rainfall periods
    this.drySeconds;               // time since last nonzero rainfall
    this.iaUsed;                   // initial abstraction used (in or mm)
   }
} ;

class TUHGroup                         // Data for a unit hydrograph group
{                                      //---------------------------------
    constructor(){
        this.isUsed;                   // true if UH group used by any nodes
        this.rainInterval;             // time interval for RDII processing (sec)
        this.area;                     // sewered area covered by UH's gage (ft2)
        this.rdii;                     // rdii flow (in rainfall units)
        this.ageDate;                 // calendar date of rain gage period
        this.lastDate;                 // date of last rdii computed
        this.uh = [new TUHData(), new TUHData(), new TUHData()] // uh[3]; // data for each unit hydrograph
    }
} ;

//-----------------------------------------------------------------------------
// Shared Variables
//-----------------------------------------------------------------------------
//static TUHGroup*  UHGroup;             // processing data for each UH group
var  UHGroup = [];             // processing data for each UH group
var RdiiStep;            // RDII time step (sec)
var NumRdiiNodes;        // number of nodes w/ RDII data
var RdiiNodeIndex = [];       // indexes of nodes w/ RDII data
var  RdiiNodeFlow = [];        // inflows for nodes with RDII
var  RdiiFlowUnits;       // RDII flow units code
var  RdiiStartDate;       // start date of RDII inflow period
var RdiiEndDate;         // end date of RDII inflow period
var TotalRainVol;        // total rainfall volume (ft3)
var TotalRdiiVol;        // total RDII volume (ft3)
var RdiiFileType;        // type (binary/text) of RDII file


//-----------------------------------------------------------------------------
//  External functions (declared in funcs.h)
//-----------------------------------------------------------------------------
//  rdii_readRdiiInflow     (called from parseLine in input.c)
//  rdii_deleteRdiiInflow   (called from deleteObjects in project.c)
//  rdii_initUnitHyd        (called from createObjects in project.c)
//  rdii_readUnitHydParams  (called from parseLine in input.c)
//  rdii_openRdii           (called from rain_open)
//  rdii_closeRdii          (called from rain_close)
//  rdii_getNumRdiiFlows    (called from addRdiiInflows in routing.c)
//  rdii_getRdiiFlow        (called from addRdiiInflows in routing.c)

//=============================================================================
//                   Management of RDII-Related Data
//=============================================================================
// char* tok[], int ntoks
function rdii_readRdiiInflow(tok, ntoks)
//
//  Input:   tok[] = array of string tokens
//           ntoks = number of tokens
//  Output:  returns an error code
//  Purpose: reads properties of an RDII inflow from a line of input.
//
{
    let j, k;
    let a;
    //TRdiiInflow* inflow;
    let inflow;

    // return facilitators
    let returnObj;
    let returnVal;

    // --- check for proper number of items
    if ( ntoks < 3 ) return error_setInpError(ERR_ITEMS, "");

    // --- check that node receiving RDII exists
    j = project_findObject(NODE, tok[0]);
    if ( j < 0 ) return error_setInpError(ERR_NAME, tok[0]);

    // --- check that RDII unit hydrograph exists
    k = project_findObject(UNITHYD, tok[1]);
    if ( k < 0 ) return error_setInpError(ERR_NAME, tok[1]);

    // --- read in sewer area value
    ////////////////////////////////////
    returnObj = {y: a}
    returnVal = getDouble(tok[2], returnObj);
    a = returnObj.y;
    ////////////////////////////////////
    if ( !returnVal || a < 0.0 )
    //if ( null == (a = getDouble(tok[2])) || a < 0.0 )
        return error_setInpError(ERR_NUMBER, tok[2]);

    // --- create the RDII inflow object if it doesn't already exist
    inflow = Node[j].rdiiInflow;
    if ( inflow == null )
    {
        inflow = new TRdiiInflow();
        //inflow = (TRdiiInflow *) malloc(sizeof(TRdiiInflow));
        if ( !inflow ) return error_setInpError(ERR_MEMORY, "");
    }

    // --- assign UH & area to inflow object
    inflow.unitHyd = k;
    inflow.area = a / UCF(LANDAREA);

    // --- assign inflow object to node
    Node[j].rdiiInflow = inflow;
    return 0;
}

//=============================================================================
// int j
function rdii_initUnitHyd(j)
//
//  Input:   j = UH group index
//  Output:  none
//  Purpose: initializes properties of a unit hydrograph group.
//
{
    let i;                             // individual UH index
    let m;                             // month index

    for ( m=0; m<12; m++)
    {
        for (i=0; i<3; i++)
        {
            UnitHyd[j].iaMax[m][i]   = 0.0;
            UnitHyd[j].iaRecov[m][i] = 0.0;
            UnitHyd[j].iaInit[m][i]  = 0.0;
            UnitHyd[j].r[m][i]       = 0.0;
            UnitHyd[j].tPeak[m][i]   = 0;
            UnitHyd[j].tBase[m][i]   = 0;
        }
    }
}

//=============================================================================
// char* tok[], int ntoks
function rdii_readUnitHydParams(tok, ntoks)
//
//  Input:   tok[] = array of string tokens
//           ntoks = number of tokens
//  Output:  returns an error code
//  Purpose: reads parameters of an RDII unit hydrograph from a line of input.
//
{
    let i, j, k, m, g;
    let x = new Array(6);

    // return facilitators
    let returnObj;
    let returnVal;

    // --- check that RDII UH object exists in database
    j = project_findObject(UNITHYD, tok[0]);
    if ( j < 0 ) return error_setInpError(ERR_NAME, tok[0]);

    // --- assign UH ID to name in hash table
    if ( UnitHyd[j].ID == null )
        UnitHyd[j].ID = project_findID(UNITHYD, tok[0]);

    // --- line has 2 tokens; assign rain gage to UH object
    if ( ntoks == 2 )
    {
        g = project_findObject(GAGE, tok[1]);
        if ( g < 0 ) return error_setInpError(ERR_NAME, tok[1]);
        UnitHyd[j].rainGage = g;
        Gage[g].isUsed = true;
        return 0;
    }
    else if ( ntoks < 6 ) return error_setInpError(ERR_ITEMS, "");

    // --- find which month UH params apply to
    m = datetime_findMonth(tok[1]);
    if ( m == 0 )
    {
        if ( !match(tok[1], w_ALL) )
            return error_setInpError(ERR_KEYWORD, tok[1]);
    }

    // --- find type of UH being specified
    k = findmatch(tok[2], UHTypeWords);

    // --- if no type match, try using older UH line format
    if ( k < 0 ) return readOldUHFormat(j, m, tok, ntoks);

    // --- read the R-T-K parameters
    for ( i = 0; i < 3; i++ )
    {
        ////////////////////////////////////
        returnObj = {y: x[i]}
        returnVal = getDouble(tok[i+3], returnObj);
        x[i] = returnObj.y;
        ////////////////////////////////////
        if( !returnVal )
        //if ( ! getDouble(tok[i+3], x[i]) )
            return error_setInpError(ERR_NUMBER, tok[i+3]);
    }

    // --- read the IA parameters if present
    for (i = 3; i < 6; i++)
    {
        x[i] = 0.0;
        if ( ntoks > i+3 )
        {
            ////////////////////////////////////
            returnObj = {y: x[i]}
            returnVal = getDouble(tok[i+3], returnObj);
            x[i] = returnObj.y;
            ////////////////////////////////////
            if( !returnVal )
            //if ( ! getDouble(tok[i+3], x[i]) )
                return error_setInpError(ERR_NUMBER, tok[i+2]);
        }
    }

    // --- save UH params
    setUnitHydParams(j, k, m, x);
    return 0;
}

//=============================================================================
// int j, int m, char* tok[], int ntoks
function readOldUHFormat(j, m, tok, ntoks)
//
//  Input:   j = unit hydrograph index
//           m = month of year (0 = all months)
//           tok[] = array of string tokens
//           ntoks = number of tokens
//  Output:  returns an error code
//  Purpose: reads parameters of a set of RDII unit hydrographs from a line of
//           input.
//
{
    let    i, k;
    let  p = new Array(9), x = new Array(6);

    // return facilitators
    let returnObj;
    let returnVal;

    // --- check for proper number of tokens
    if ( ntoks < 11 ) return error_setInpError(ERR_ITEMS, "");

    // --- read 3 sets of r-t-k values
    for ( i = 0; i < 9; i++ )
    {
        ////////////////////////////////////
        returnObj = {y: p[i]}
        returnVal = getDouble(tok[i+2], returnObj);
        p[i] = returnObj.y;
        ////////////////////////////////////
        if( !returnVal )
        //if ( ! getDouble(tok[i+2], p[i]) )
            return error_setInpError(ERR_NUMBER, tok[i+2]);
    }

    // --- read initial abstraction parameters
    for (i = 0; i < 3; i++)
    {
        x[i+3] = 0.0;
        if ( ntoks > i+11 )
        {
            ////////////////////////////////////
            returnObj = {y: x[i+3]}
            returnVal = getDouble(tok[i+11], returnObj);
            x[i+3] = returnObj.y;
            ////////////////////////////////////
            if( !returnVal )
            //if ( ! getDouble(tok[i+11], x[i+3]) )
                return error_setInpError(ERR_NUMBER, tok[i+11]);
        }
    }

    // --- save UH parameters
    for ( k = 0; k < 3; k++)
    {
        for ( i = 0; i < 3; i++)
        {
            x[i] = p[3*k + i];
            setUnitHydParams(j, k, m, x);
        }
    }
    return 0;
}

//=============================================================================
// int j, int i, int m, double x[]
function setUnitHydParams(j, i, m, x)
//
//  Input:   j = unit hydrograph index
//           i = type of UH response (short, medium or long term)
//           m = month of year (0 = all months)
//           x = array of UH parameters
//  Output:  none
//  Purpose: assigns parameters to a unit hydrograph for a specified month of year.
//
{
    let    m1, m2;                     // start/end month indexes
    let    t,                          // UH time to peak (hrs)
           k,                          // UH k-value
           tBase;                      // UH base time (hrs)

    // --- find range of months that share same parameter values
    if ( m == 0 )
    {
        m1 = 0;
        m2 = 11;
    }
    else
    {
        m1 = m-1;
        m2 = m1;
    }

    // --- for each month in the range
    for (m=m1; m<=m2; m++)
    {
        // --- set UH response ratio, time to peak, & base time
        UnitHyd[j].r[m][i] = x[0];
        t = x[1];
        k = x[2];
        tBase = t * (1.0 + k);                              // hours
        UnitHyd[j].tPeak[m][i] = (long)(t * 3600.);         // seconds
        UnitHyd[j].tBase[m][i] = (long)(tBase * 3600.);     // seconds

        // -- set initial abstraction parameters
        UnitHyd[j].iaMax[m][i]   = x[3];
        UnitHyd[j].iaRecov[m][i] = x[4];
        UnitHyd[j].iaInit[m][i]  = x[5];
    }
}

//=============================================================================
// int j
function rdii_deleteRdiiInflow(j)
//
//  Input:   j = node index
//  Output:  none
//  Purpose: deletes the RDII inflow object for a node.
//
{
    if ( Node[j].rdiiInflow )
    {
        Node[j].rdiiInflow = null;
    }
}


//=============================================================================
//                 Reading Inflow Data From a RDII File
//=============================================================================

function rdii_openRdii()
//
//  Input:   none
//  Output:  none
//  Purpose: opens an exisiting RDII interface file or creates a new one.
//
{
    let  fStamp = FILE_STAMP;

    RdiiNodeIndex = null;
    RdiiNodeFlow = null;
    NumRdiiNodes = 0;
    RdiiStartDate = NO_DATE;

    // --- create the RDII file if existing file not being used
    if ( IgnoreRDII ) return;
    if ( Frdii.mode != USE_FILE ) createRdiiFile();
    if ( Frdii.mode == NO_FILE || ErrorCode ) return;

    // --- try to open the RDII file in binary mode
    Frdii.file = fopen(Frdii.name, "rb");
    if ( Frdii.file == null)
    {
        if ( Frdii.mode == SCRATCH_FILE )
        {
            report_writeErrorMsg(ERR_RDII_FILE_SCRATCH, "");
        }
        else
        {
            report_writeErrorMsg(ERR_RDII_FILE_OPEN, Frdii.name);
        }
        return;
    }

    // --- check for valid file stamp
    fread(fStamp, sizeof(char), strlen(FileStamp), Frdii.file);
    if ( strcmp(fStamp, FileStamp) == 0 )
    {
        RdiiFileType = BINARY;
        ErrorCode = readRdiiFileHeader();
    }

    // --- if stamp invalid try to open the file in text mode
    else
    {
        fclose(Frdii.file);
        RdiiFileType = TEXT;
        openRdiiTextFile();
    }

    // --- catch any error
    if ( ErrorCode )
    {
        report_writeErrorMsg(ErrorCode, Frdii.name);
    }

    // --- read the first set of RDII flows form the file
    else readRdiiFlows();
}

//=============================================================================

function openRdiiTextFile()
{
    // --- try to open the RDII file in text mode
    Frdii.file = fopen(Frdii.name, "rt");
    if ( Frdii.file == null)
    {
        if ( Frdii.mode == SCRATCH_FILE )
        {
            report_writeErrorMsg(ERR_RDII_FILE_SCRATCH, "");
        }
        else
        {
            report_writeErrorMsg(ERR_RDII_FILE_OPEN, Frdii.name);
        }
        return;
    }

    // --- read header records from file
    ErrorCode = readRdiiTextFileHeader();
    if ( ErrorCode )
    {
        report_writeErrorMsg(ErrorCode, Frdii.name);
    }
}

//=============================================================================

function rdii_closeRdii()
//
//  Input:   none
//  Output:  none
//  Purpose: closes the RDII interface file.
//
{
    if ( Frdii.file ) fclose(Frdii.file);
    if ( Frdii.mode == SCRATCH_FILE ) remove(Frdii.name);
    FREE(RdiiNodeIndex);
    FREE(RdiiNodeFlow);
}

//=============================================================================
// DateTime aDate
function rdii_getNumRdiiFlows(aDate)
//
//  Input:   aDate = current date/time
//  Output:  returns 0 if no RDII flow or number of nodes with RDII inflows
//  Purpose: finds number of RDII inflows at a specified date.
//
{
    // --- default result is 0 indicating no RDII inflow at specified date
    if ( NumRdiiNodes == 0 ) return 0;
    if ( !Frdii.file ) return 0;

    // --- keep reading RDII file as need be
    while ( !feof(Frdii.file) )
    {
        // --- return if date of current RDII inflow not reached yet
        if ( RdiiStartDate == NO_DATE ) return 0;
        if ( aDate < RdiiStartDate ) return 0;

        // --- return RDII node count if specified date falls
        //     within time interval of current RDII inflow
        if ( aDate < RdiiEndDate ) return NumRdiiNodes;

        // --- otherwise get next date and RDII flow values from file
        else readRdiiFlows();
    }
    return 0;
}

//=============================================================================
// int i, int* j, double* q
function rdii_getRdiiFlow(i, j, q)
//
//  Input:   i = RDII node index
//           j = pointer to project node index
//           q = pointer to RDII flow rate
//  Output:  sets node index and RDII inflow for node
//  Purpose: finds index and current RDII inflow for an RDII node.
//
{
    if ( i >= 0 && i < NumRdiiNodes )
    {
        j = RdiiNodeIndex[i];
        q = RdiiNodeFlow[i];
    }
}

//=============================================================================

function readRdiiFileHeader()
//
//  Input:   none
//  Output:  returns error code
//  Purpose: reads header information from a binary RDII file.
//
{
    let i, j;

    // --- extract time step and number of RDII nodes
    fread(RdiiStep, sizeof(INT4), 1, Frdii.file);
    if ( RdiiStep <= 0 ) return ERR_RDII_FILE_FORMAT;
    fread(NumRdiiNodes, sizeof(INT4), 1, Frdii.file);
    if ( NumRdiiNodes <= 0 ) return ERR_RDII_FILE_FORMAT;

    // --- allocate memory for RdiiNodeIndex & RdiiNodeFlow arrays
    //RdiiNodeIndex = (int *) calloc(NumRdiiNodes, sizeof(int));
    RdiiNodeIndex = new Array(NumRdiiNodes);
    if ( !RdiiNodeIndex ) return ERR_MEMORY;
    //RdiiNodeFlow = (REAL4 *) calloc(NumRdiiNodes, sizeof(REAL4));
    RdiiNodeFlow = new Array(NumRdiiNodes);
    if ( !RdiiNodeFlow ) return ERR_MEMORY;

    // --- read indexes of RDII nodes
    if ( feof(Frdii.file) ) return ERR_RDII_FILE_FORMAT;
    fread(RdiiNodeIndex, sizeof(INT4), NumRdiiNodes, Frdii.file);
    for ( i=0; i<NumRdiiNodes; i++ )
    {
        j = RdiiNodeIndex[i];
        if ( Node[j].rdiiInflow == null ) return ERR_RDII_FILE_FORMAT;
    }
    if ( feof(Frdii.file) ) return ERR_RDII_FILE_FORMAT;
    return 0;
}

//=============================================================================

function readRdiiTextFileHeader()
//
//  Input:   none
//  Output:  returns error code
//  Purpose: reads header information from a text RDII file.
//
{
    let  i;
    let  line;             // line from RDII data file
    let  s1;               // general string variable
    let  s2;

    // --- check for correct file type
    fgets(line, MAXLINE, Frdii.file);
    sscanf(line, "%s", s1);
    if ( strcmp(s1, "SWMM5") != 0 ) return ERR_RDII_FILE_FORMAT;

    // --- skip title line
    fgets(line, MAXLINE, Frdii.file);

    // --- read RDII UH time step interval (sec)
    RdiiStep = 0;
    fgets(line, MAXLINE, Frdii.file);
    sscanf(line, "%d", RdiiStep);
    if ( RdiiStep <= 0 ) return ERR_RDII_FILE_FORMAT;

    // --- skip over line with number of constituents (= 1 for RDII)
    fgets(line, MAXLINE, Frdii.file);

    // --- read flow units
    fgets(line, MAXLINE, Frdii.file);
    sscanf(line, "%s %s", s1, s2);
    RdiiFlowUnits = findmatch(s2, FlowUnitWords);
    if ( RdiiFlowUnits < 0 ) return ERR_RDII_FILE_FORMAT;

    // --- read number of RDII nodes
    fgets(line, MAXLINE, Frdii.file);
    if ( sscanf(line, "%d", NumRdiiNodes) < 1 ) return ERR_RDII_FILE_FORMAT;

    // --- allocate memory for RdiiNodeIndex & RdiiNodeFlow arrays
    //RdiiNodeIndex = calloc(NumRdiiNodes, sizeof(int));
    RdiiNodeIndex = new Array(NumRdiiNodes);
    if ( !RdiiNodeIndex ) return ERR_MEMORY;
    //RdiiNodeFlow = (REAL4 *) calloc(NumRdiiNodes, sizeof(REAL4));
    RdiiNodeFlow = new Array(NumRdiiNodes)
    if ( !RdiiNodeFlow ) return ERR_MEMORY;

    // --- read names of RDII nodes from file & save their indexes
    for ( i=0; i<NumRdiiNodes; i++ )
    {
        if ( feof(Frdii.file) ) return ERR_RDII_FILE_FORMAT;
        fgets(line, MAXLINE, Frdii.file);
        sscanf(line, "%s", s1);
        RdiiNodeIndex[i] = project_findObject(NODE, s1);
    }

    // --- skip column heading line
    if ( feof(Frdii.file) ) return ERR_RDII_FILE_FORMAT;
    fgets(line, MAXLINE, Frdii.file);
    return 0;
}

//=============================================================================

function readRdiiFlows()
//
//  Input:   none
//  Output:  none
//  Purpose: reads date and flow values of next RDII inflows from RDII file.
//
{
    if ( RdiiFileType == TEXT ) readRdiiTextFlows();
    else
    {
        RdiiStartDate = NO_DATE;
        RdiiEndDate = NO_DATE;
        if ( feof(Frdii.file) ) return;
        fread(RdiiStartDate, sizeof(DateTime), 1, Frdii.file);
        if ( RdiiStartDate == NO_DATE ) return;
        if ( fread(RdiiNodeFlow, sizeof(REAL4), NumRdiiNodes, Frdii.file) < NumRdiiNodes ) RdiiStartDate = NO_DATE;
        else RdiiEndDate = datetime_addSeconds(RdiiStartDate, RdiiStep);
    }
}

//=============================================================================

function readRdiiTextFlows()
//
//  Input:   none
//  Output:  none
//  Purpose: reads date and flow values of next RDII inflows from RDII file.
//
{
    let    i, n;
    let    yr = 0, mon = 0, day = 0,
		   hr = 0, min = 0, sec = 0;   // year, month, day, hour, minute, second
    let    x;                          // RDII flow in original units
    let    line;            // line from RDII data file
    let    s;               // node ID label (not used)

    RdiiStartDate = NO_DATE;
    for (i=0; i<NumRdiiNodes; i++)
    {
        if ( feof(Frdii.file) ) return;
        fgets(line, MAXLINE, Frdii.file);
        n = sscanf(line, "%s %d %d %d %d %d %d %lf",
            s, yr, mon, day, hr, min, sec, x);
        if ( n < 8 ) return;
        RdiiNodeFlow[i] = (REAL4)(x / Qcf[RdiiFlowUnits]);
    }
    RdiiStartDate = datetime_encodeDate(yr, mon, day) +
                    datetime_encodeTime(hr, min, sec);
    RdiiEndDate = datetime_addSeconds(RdiiStartDate, RdiiStep);
}


//=============================================================================
//                   Creation of a RDII Interface File
//=============================================================================

function createRdiiFile()
//
//  Input:   none
//  Output:  none
//  Purpose: computes time history of RDII inflows and saves them to file.
//
{
    let hasRdii;                  // true when total RDII > 0
    let elapsedTime;              // current elapsed time (sec)
    let duration;                 // duration being analyzed (sec)
    let currentDate;              // current calendar date/time

    // --- set RDII reporting time step to Runoff wet step
    RdiiStep = WetStep;

    // --- count nodes with RDII data
    NumRdiiNodes = getNumRdiiNodes();

    // --- if no RDII nodes then re-set RDII file usage to NO_FILE
    if ( NumRdiiNodes == 0 )
    {
        Frdii.mode = NO_FILE;
        return;
    }

    // --- otherwise set file usage to SCRATCH if originally set to NO_FILE
    else if ( Frdii.mode == NO_FILE ) Frdii.mode = SCRATCH_FILE;

    // --- validate RDII data
    validateRdii();
    initGageData();
    if ( ErrorCode ) return;

    // --- open RDII processing system
    openRdiiProcessor();
    if ( !ErrorCode )
    {
        // --- initialize rain gage & UH processing data
        initUnitHydData();

        // --- convert total simulation duration from millisec to sec
        duration = TotalDuration / 1000.0;

        // --- examine rainfall record over each RdiiStep time step
        elapsedTime = 0.0;
        while ( elapsedTime <= duration && !ErrorCode )
        {
            // --- compute current calendar date/time
            currentDate = StartDateTime + elapsedTime / SECperDAY;

            // --- update rainfall at all rain gages
            getRainfall(currentDate);

            // --- compute convolutions of past rainfall with UH's
            getUnitHydRdii(currentDate);

            // --- find RDII at all nodes
            hasRdii = getNodeRdii();

            // --- save RDII at all nodes to file for current date
            if ( hasRdii ) saveRdiiFlows(currentDate);

            // --- advance one time step
            elapsedTime += RdiiStep;
        }
    }

    // --- close RDII processing system
    closeRdiiProcessor();
}

//=============================================================================

function  getNumRdiiNodes()
//
//  Input:   none
//  Output:  returns node count
//  Purpose: counts number of nodes that receive RDII inflow.
//
{
    let j,                             // node index
        n;                             // node count

    n = 0;
    for (j=0; j<Nobjects[NODE]; j++)
    {
        if ( Node[j].rdiiInflow ) n++;
    }
    return n;
}

//=============================================================================

function validateRdii()
//
//  Input:   none
//  Output:  none
//  Purpose: validates UH and RDII inflow object data.
//
{
    let    i,                          // node index
           j,                          // UH group index
           k,                          // individual UH index
           m;                          // month index
    let rsum;                       // sum of UH r-values
//  long   gageInterval;               // rain gage time interval

    // --- check each unit hydrograph for consistency
    for (j=0; j<Nobjects[UNITHYD]; j++)
    {
        for (m=0; m<12; m++)
        {
            rsum = 0.0;
            for (k=0; k<3; k++)
            {
                // --- if no base time then UH doesn't exist
                if ( UnitHyd[j].tBase[m][k] == 0 ) continue;

                // --- restriction on time to peak being less than the
                //     rain gage's recording interval no longer applies

                // --- can't have negative UH parameters
                if ( UnitHyd[j].tPeak[m][k] < 0.0 )
                {
                    report_writeErrorMsg(ERR_UNITHYD_TIMES, UnitHyd[j].ID);
                }

                // --- can't have negative UH response ratio
                if ( UnitHyd[j].r[m][k] < 0.0 )
                {
                    report_writeErrorMsg(ERR_UNITHYD_RATIOS, UnitHyd[j].ID);
                }
                else rsum += UnitHyd[j].r[m][k];
            }
            if ( rsum > 1.01 )
            {
                report_writeErrorMsg(ERR_UNITHYD_RATIOS, UnitHyd[j].ID);
            }
        }
    }

    // --- check each node's RDII inflow object
    for (i=0; i<Nobjects[NODE]; i++)
    {
        if ( Node[i].rdiiInflow )
        {
            // --- check that sewer area is non-negative
            if ( Node[i].rdiiInflow.area < 0.0 )
            {
                report_writeErrorMsg(ERR_RDII_AREA, Node[i].ID);
            }
        }
    }
}

//=============================================================================

function openRdiiProcessor()
//
//  Input:   none
//  Output:  none
//  Purpose: opens RDII processing system.
//
{
    let j;                             // object index
    let n;                             // RDII node count

    // --- set RDII processing arrays to null
    UHGroup = null;
    RdiiNodeIndex = null;
    RdiiNodeFlow = null;
    TotalRainVol = 0.0;
    TotalRdiiVol = 0.0;

    // --- allocate memory used for RDII processing
    if ( !allocRdiiMemory() )
    {
        report_writeErrorMsg(ERR_MEMORY, "");
        return;
    }

    // --- open & initialize RDII file
    if ( !openNewRdiiFile() )
    {
        report_writeErrorMsg(ERR_RDII_FILE_SCRATCH, "");
        return;
    }

    // --- identify index of each node with RDII inflow
    n = 0;
    for (j=0; j<Nobjects[NODE]; j++)
    {
        if ( Node[j].rdiiInflow )
        {
            RdiiNodeIndex[n] = j;
            n++;
        }
    }
}

//=============================================================================

function  allocRdiiMemory()
//
//  Input:   none
//  Output:  returns true if successful, false if not
//  Purpose: allocates memory used for RDII processing .
//
//
{
    let i;                             // UH group index
    let k;                             // UH index
    let n;                             // number of past rain periods

    // --- allocate memory for RDII processing data for UH groups
    // UHGroup = (TUHGroup *) calloc(Nobjects[UNITHYD], sizeof(TUHGroup));
    var UHGroup = [];
    for(let u = 0; u < Nobjects[UNITHYD]; u++){UHGroup.push(new TUHGroup())}
    if ( !UHGroup ) return false;

    // --- allocate memory for past rainfall data for each UH in each group
    for (i=0; i<Nobjects[UNITHYD]; i++)
    {
        UHGroup[i].rainInterval = getRainInterval(i);
        for (k=0; k<3; k++)
        {
            UHGroup[i].uh[k].pastRain = null;
            UHGroup[i].uh[k].pastMonth = null;
            UHGroup[i].uh[k].maxPeriods = getMaxPeriods(i, k);
            n = UHGroup[i].uh[k].maxPeriods;
            if ( n > 0 )
            {
                UHGroup[i].uh[k].pastRain =
                    //(double *) calloc(n, sizeof(double));
                    new Array(n);
                if ( !UHGroup[i].uh[k].pastRain ) return false;
                UHGroup[i].uh[k].pastMonth =
                    //(char *) calloc(n, sizeof(char));
                    new Array(n)
                if ( !UHGroup[i].uh[k].pastMonth ) return false;
            }
        }
    }

    // --- allocate memory for RDII indexes & inflow at each node w/ RDII data
    //RdiiNodeIndex = (int *) calloc(NumRdiiNodes, sizeof(int));
    RdiiNodeIndex = new Array(NumRdiiNodes);
    if ( !RdiiNodeIndex ) return false;
    //RdiiNodeFlow = (REAL4 *) calloc(NumRdiiNodes, sizeof(REAL4));
    RdiiNodeFlow = new Array(NumRdiiNodes)
    if ( !RdiiNodeFlow ) return false;
    return true;
}

//=============================================================================
// int i
function  getRainInterval(i)
//
//  Input:   i = UH group index
//  Output:  returns a time interval (sec)
//  Purpose: finds rainfall processing time interval for a unit hydrograph group.
//
{
    let ri;        // rainfal processing time interval for the UH group
    let tLimb;     // duration of a UH's rising & falling limbs
    let k, m;

    // --- begin with UH group time step equal to wet runoff step
    ri = WetStep;

    // --- examine each UH in the group
    for (m=0; m<12; m++)
    {
        for (k=0; k<3; k++)
        {
            // --- make sure the UH exists
            if ( UnitHyd[i].tPeak[m][k] > 0 )
            {
                // --- reduce time step if rising/falling limb is smaller
                tLimb = UnitHyd[i].tPeak[m][k];
                ri = MIN(ri, tLimb);
                tLimb = UnitHyd[i].tBase[m][k] - tLimb;
                if ( tLimb > 0 ) ri = MIN(ri, tLimb);
            }
        }
    }
    return ri;
}

//=============================================================================
// int i, int k
function  getMaxPeriods(i, k)
//
//  Input:   i = UH group index
//           k = UH index
//  Output:  returns number of past rainfall values
//  Purpose: finds number of past rainfall values to save for a UH.
//
{
    let   m,                           // month index
          n,                           // number of time periods
          nMax,                        // maximum number of time periods
          rainInterval;                // rainfall processing interval (sec)

    // --- examine each monthly set of UHs
    rainInterval = UHGroup[i].rainInterval;
    nMax = 0;
    for (m=0; m<12; m++)
    {
        // --- compute number of time periods in UH base
        n = (UnitHyd[i].tBase[m][k] / rainInterval) + 1;

        // --- update number of time periods to be saved
        nMax = MAX(n, nMax);
    }
    return nMax;
}

//=============================================================================

function initGageData()
//
//  Input:   none
//  Output:  none
//  Purpose: initializes state of Unit Hydrograph rain gages.
//
{
    let i;                             // unit hyd. index
    let g;                             // rain gage index

    // --- first initialize the state of each rain gage
    for (g=0; g<Nobjects[GAGE]; g++)
    {
        if ( Gage[g].tSeries >= 0 )
        {
            table_tseriesInit(Tseries[Gage[g].tSeries]);
        }
        gage_initState(g);
    }

    // --- then flag each gage that is used by a Unit Hydrograph set
    for (i=0; i<Nobjects[UNITHYD]; i++)
    {
        g = UnitHyd[i].rainGage;
        if ( g >= 0 )
        {
            // --- if UH's gage uses same time series as a previous gage,
            //     then assign the latter gage to the UH
            if ( Gage[g].coGage >= 0 )
            {
                UnitHyd[i].rainGage = Gage[g].coGage;
            }
        }
    }
}

//=============================================================================

function initUnitHydData()
//
//  Input:   none
//  Output:  none
//  Purpose: initializes unit hydrograph processing data.
//
{
    let i,                             // UH group index
        j,                             // node index
        k,                             // UH index
        n;                             // RDII node index
//  int g,                             // rain gage index
    let month;                         // month index

    // --- initialize UHGroup entries for each Unit Hydrograph
    month = datetime_monthOfYear(StartDateTime) - 1;
    for (i=0; i<Nobjects[UNITHYD]; i++)
    {
        for (k=0; k<3; k++)
        {
            // --- make the first recorded rainfall begin a new RDII event
            // --- (new RDII event occurs when dry period > base of longest UH)
            UHGroup[i].uh[k].drySeconds =
                (UHGroup[i].uh[k].maxPeriods * UHGroup[i].rainInterval) + 1;
            UHGroup[i].uh[k].period = UHGroup[i].uh[k].maxPeriods + 1;
            UHGroup[i].uh[k].hasPastRain = false;

            // --- assign initial abstraction used
            UHGroup[i].uh[k].iaUsed = UnitHyd[i].iaInit[month][k];
        }

        // --- initialize gage date to simulation start date
        UHGroup[i].gageDate = StartDateTime;
        UHGroup[i].area = 0.0;
        UHGroup[i].rdii = 0.0;
    }

    // --- assume each UH group is not used
    for (i=0; i<Nobjects[UNITHYD]; i++) UHGroup[i].isUsed = false;

    // --- look at each node with RDII inflow
    for (n=0; n<NumRdiiNodes; n++)
    {
        // --- mark as used the UH group associated with the node
        j = RdiiNodeIndex[n];
        i = Node[j].rdiiInflow.unitHyd;
        UHGroup[i].isUsed = true;

        // --- add node's sewer area to UH group's area
        UHGroup[i].lastDate = StartDateTime;
        UHGroup[i].area += Node[j].rdiiInflow.area;
    }
}

//=============================================================================

function openNewRdiiFile()
//
//  Input:   none
//  Output:  returns true if successful, false if not
//  Purpose: opens a new RDII interface file.
//
{
    let j;                             // node index

    // --- create a temporary file name if scratch file being used
    if ( Frdii.mode == SCRATCH_FILE ) getTempFileName(Frdii.name);

    // --- open the RDII file as a formatted text file
    Frdii.file = fopen(Frdii.name, "w+b");
    if ( Frdii.file == null )
    {
        return false;
    }

    // --- write file stamp to RDII file
    fwrite(FileStamp, sizeof(char), strlen(FileStamp), Frdii.file);

    // --- initialize the contents of the file with RDII time step (sec),
    //     number of RDII nodes, and index of each node
    fwrite(RdiiStep, sizeof(INT4), 1, Frdii.file);
    fwrite(NumRdiiNodes, sizeof(INT4), 1, Frdii.file);
    for (j=0; j<Nobjects[NODE]; j++)
    {
        if ( Node[j].rdiiInflow ) fwrite(j, sizeof(INT4), 1, Frdii.file);
    }
    return true;
}

//=============================================================================
// DateTime currentDate
function getRainfall(currentDate)
//
//  Input:   currentDate = current calendar date/time
//  Output:  none
//  Purpose: determines rainfall at current RDII processing date.
//
//
{
    let      j;                        // UH group index
    let      k;                        // UH index
    let      g;                        // rain gage index
    let      i;                        // past rainfall index
    let      month;                    // month of current date
    let      rainInterval;             // rainfall interval (sec)
    let   rainDepth;                // rainfall depth (inches or mm)
    let   excessDepth;              // excess rainfall depth (inches or mm))
    let gageDate;                 // calendar date for rain gage

    // --- examine each UH group
    month = datetime_monthOfYear(currentDate) - 1;
    for (g = 0; g < Nobjects[GAGE]; g++) Gage[g].isCurrent = false;
    for (j = 0; j < Nobjects[UNITHYD]; j++)
    {
        // --- repeat until gage's date reaches or exceeds current date
        g = UnitHyd[j].rainGage;
        rainInterval = UHGroup[j].rainInterval;
        while ( UHGroup[j].gageDate < currentDate )
        {
            // --- get rainfall volume over gage's recording interval
            //     at gage'a current date (in original depth units)
            gageDate = UHGroup[j].gageDate;
            Adjust.rainFactor = Adjust.rain[datetime_monthOfYear(gageDate)-1];
            if (!Gage[g].isCurrent)
            {
                gage_setState(g, gageDate);
                Gage[g].isCurrent = true;
            }
            rainDepth = Gage[g].rainfall * rainInterval / 3600.0;

            // --- update amount of total rainfall volume (ft3)
            TotalRainVol += rainDepth / UCF(RAINDEPTH) * UHGroup[j].area;

            // --- compute rainfall excess for each UH in the group
            for (k=0; k<3; k++)
            {
                // --- adjust rainfall volume for any initial abstraction
                excessDepth = applyIA(j, k, gageDate, rainInterval, rainDepth);

                // --- adjust extent of dry period for the UH
                updateDryPeriod(j, k, excessDepth, rainInterval);

                // --- add rainfall to list of past values,
                //     wrapping array index if necessary
                i = UHGroup[j].uh[k].period;
                if ( i >= UHGroup[j].uh[k].maxPeriods ) i = 0;
                UHGroup[j].uh[k].pastRain[i] = excessDepth;
                UHGroup[j].uh[k].pastMonth[i] = month;
                UHGroup[j].uh[k].period = i + 1;
            }

            // --- advance rain date by gage recording interval
            UHGroup[j].gageDate = datetime_addSeconds(gageDate, rainInterval);
        }
    }
}

//=============================================================================
// int j, int k, DateTime aDate, double dt, double rainDepth
function  applyIA(j, k, aDate, dt, rainDepth)
//
//  Input:   j = UH group index
//           k = unit hydrograph index
//           aDate = current date/time
//           dt = time interval (sec)
//           rainDepth = unadjusted rain depth (in or mm)
//  Output:  returns rainfall adjusted for initial abstraction (IA)
//  Purpose: adjusts rainfall for any initial abstraction and updates the
//           amount of available initial abstraction actually used.
//
{
    let m;
    let ia, netRainDepth;

    // --- determine amount of unused IA
    m = datetime_monthOfYear(aDate) - 1;
    ia = UnitHyd[j].iaMax[m][k] - UHGroup[j].uh[k].iaUsed;
    ia = Math.max(ia, 0.0);

    // --- case where there's some rainfall
    if ( rainDepth > 0.0 )
    {
        // --- reduce rain depth by unused IA
        netRainDepth = rainDepth - ia;
        netRainDepth = Math.max(netRainDepth, 0.0);

        // --- update amount of IA used up
        ia = rainDepth - netRainDepth;
        UHGroup[j].uh[k].iaUsed += ia;
    }

    // --- case where there's no rainfall
    else
    {
        // --- recover a portion of the IA already used
        UHGroup[j].uh[k].iaUsed -= dt / 86400. * UnitHyd[j].iaRecov[m][k];
        UHGroup[j].uh[k].iaUsed = Math.max(UHGroup[j].uh[k].iaUsed, 0.0);
        netRainDepth = 0.0;
    }
    return netRainDepth;
}

//=============================================================================
// int j, int k, double rainDepth, int rainInterval
function updateDryPeriod(j, k, rainDepth, rainInterval)
//
//  Input:   j = UH group index
//           k = unit hydrograph index
//           rainDepth = excess rain depth (in or mm)
//           rainInterval = rainfall time interval (sec)
//  Output:  none
//  Purpose: adjusts the length of the dry period between rainfall events.
//
{
    let i;

    // --- if rainfall occurs
    if ( rainDepth > 0.0 )
    {
        // --- if previous dry period long enough then begin
        //     new RDII event with time period index set to 0
        if ( UHGroup[j].uh[k].drySeconds >= rainInterval *
            UHGroup[j].uh[k].maxPeriods )
        {
            for (i=0; i<UHGroup[j].uh[k].maxPeriods; i++)
            {
                UHGroup[j].uh[k].pastRain[i] = 0.0;
            }
            UHGroup[j].uh[k].period = 0;
        }
        UHGroup[j].uh[k].drySeconds = 0;
        UHGroup[j].uh[k].hasPastRain = true;
    }

    // --- if no rainfall, update duration of dry period
    else
    {
        UHGroup[j].uh[k].drySeconds += rainInterval;
        if ( UHGroup[j].uh[k].drySeconds >=
            rainInterval * UHGroup[j].uh[k].maxPeriods )
        {
            UHGroup[j].uh[k].hasPastRain = false;
        }
        else UHGroup[j].uh[k].hasPastRain = true;
    }
}

//=============================================================================
// DateTime currentDate
function getUnitHydRdii(currentDate)
//
//  Input:   currentDate = current calendar date/time
//  Output:  none
//  Purpose: computes RDII generated by past rainfall for each UH group.
//
{
    let   j;                           // UH group index
    let   k;                           // UH index
    let   rainInterval;                // rainfall time interval (sec)

    // --- examine each UH group
    for (j=0; j<Nobjects[UNITHYD]; j++)
    {
        // --- skip calculation if group not used by any RDII node or if
        //     current date hasn't reached last date RDII was computed
        if ( !UHGroup[j].isUsed ) continue;
        if ( currentDate < UHGroup[j].lastDate ) continue;

        // --- update date RDII last computed
        UHGroup[j].lastDate = UHGroup[j].gageDate;

        // --- perform convolution for each UH in the group
        rainInterval = UHGroup[j].rainInterval;
        UHGroup[j].rdii = 0.0;
        for (k=0; k<3; k++)
        {
            if ( UHGroup[j].uh[k].hasPastRain )
            {
                UHGroup[j].rdii += getUnitHydConvol(j, k, rainInterval);
            }
        }
    }
}

//=============================================================================
// int j, int k, int rainInterval
function getUnitHydConvol(j, k, rainInterval)
//
//  Input:   j = UH group index
//           k = UH index
//           rainInterval = rainfall time interval (sec)
//  Output:  returns a RDII flow value
//  Purpose: computes convolution of Unit Hydrographs with past rainfall.
//
{
    let    i;                          // previous rainfall period index
    let    m;                          // month of year index
    let    p;                          // UH time period index
    let    pMax;                       // max. number of periods
    let t;                          // UH time value (sec)
    let u;                          // UH ordinate
    let v;                          // rainfall volume
    let rdii;                       // RDII flow
    //TUHData* uh;                       // UH data
    let uh = [];

    // --- initialize RDII, rain period index and UH period index
    rdii = 0.0;
    uh = UHGroup[j].uh[k];
    i = uh.period - 1;
    if ( i < 0 ) i = uh.maxPeriods - 1;
    pMax = uh.maxPeriods;
    p = 1;

    // --- evaluate each time period of UH's
    while ( p < pMax )
    {
        // --- if rain period has rainfall
        v = uh.pastRain[i];
        m = uh.pastMonth[i];
        if ( v > 0.0 )
        {
            // --- find mid-point time of UH period in seconds
            t = ((p) - 0.5) * rainInterval;

            // --- convolute rain volume with UH ordinate
            u = getUnitHydOrd(j, m, k, t) * UnitHyd[j].r[m][k];
            rdii += u * v;
        }

        // --- move to next UH period & previous rainfall period
        p = p + 1;
        i = i - 1;
        if ( i < 0 ) i = uh.maxPeriods - 1;
    }
    return rdii;
}

//=============================================================================
// int h, int m, int k, double t
function getUnitHydOrd(h, m, k, t)
//
//  Input:   h = index of UH group
//           m = month index
//           k = individual UH index
//           t = UH time (sec)
//  Output:  returns ordinate of a unit hydrograph
//  Purpose: gets ordinate of a particular unit hydrograph at specified time.
//
{
    let qPeak;                      // peak flow of unit hydrograph
    let f;                          // fraction of time to/from peak on UH
    let t1;                         // time to peak on UH (sec)
    let t2;                         // time after peak on UH (sec)
    let tBase;                      // base time of UH (sec)

    // --- return 0 if past end of UH time base
    tBase = UnitHyd[h].tBase[m][k];
    if ( t >= tBase ) return 0.0;

    // --- compute peak value of UH in original rainfall units (in/hr or mm/hr)
    qPeak = 2. / tBase * 3600.0;

    // --- break UH base into times before & after peak flow
    t1 = UnitHyd[h].tPeak[m][k];
    t2 = tBase - t1;

    // --- find UH flow at time t
    if ( t <= t1 ) f = t / t1;
    else           f = 1.0 - (t - t1) / t2;
    return Math.max(f, 0.0) * qPeak;
}

//=============================================================================

function getNodeRdii()
//
//  Input:   none
//  Output:  returns true if any node has RDII inflow, false if not
//  Purpose: computes current RDII inflow at each node.
//
{
    let   hasRdii = false;             // true if any node has some RDII
    let   i;                           // UH group index
    let   j;                           // node index
    let   n;                           // number of nodes w/ RDII
    let rdii;                       // RDII flow (cfs)

    // --- examine each node w/ RDII data
    for (n = 0; n < NumRdiiNodes; n++)
    {
        // --- identify node's index in project's data base
        j = RdiiNodeIndex[n];

        // --- apply node's sewer area to UH RDII to get node RDII in CFS
        i = Node[j].rdiiInflow.unitHyd;
        rdii = UHGroup[i].rdii * Node[j].rdiiInflow.area / UCF(RAINFALL);
        if ( rdii < ZERO_RDII ) rdii = 0.0;
        else hasRdii = true;

        // --- update total RDII volume
        RdiiNodeFlow[n] = rdii;
        if ( rdii > 0.0 )
        {
            TotalRdiiVol += rdii * RdiiStep;
        }
    }
    return hasRdii;
}

//=============================================================================
// DateTime currentDate
function saveRdiiFlows(currentDate)
//
//  Input:   currentDate = current calendar date/time
//  Output:  none
//  Purpose: saves current set of RDII inflows in current flow units to file.
//
{
    fwrite(currentDate, sizeof(DateTime), 1, Frdii.file);
    fwrite(RdiiNodeFlow, sizeof(REAL4), NumRdiiNodes, Frdii.file);
}

//=============================================================================

function  closeRdiiProcessor()
//
//  Input:   none
//  Output:  none
//  Purpose: closes RDII processing system.
//
{
    // --- write rainfall & RDII totals to report file
    if ( !ErrorCode )
    {
        report_writeRdiiStats(TotalRainVol, TotalRdiiVol);
    }

    // --- free allocated memory and close RDII file
    freeRdiiMemory();
    if ( Frdii.file ) fclose(Frdii.file);
}

//=============================================================================

function freeRdiiMemory()
//
//  Input:   none
//  Output:  none
//  Purpose: frees memory used for RDII processing.
//
{
    let i;
    let k;
    if ( UHGroup )
    {
        for (i = 0; i < Nobjects[UNITHYD]; i++)
        {
            for (k=0; k<3; k++)
            {
                FREE(UHGroup[i].uh[k].pastRain);
                FREE(UHGroup[i].uh[k].pastMonth);
            }
        }
        FREE(UHGroup);
    }
    FREE(RdiiNodeIndex);
    FREE(RdiiNodeFlow);
}

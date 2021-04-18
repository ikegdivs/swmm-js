//-----------------------------------------------------------------------------
//   lid.h
//
//   Project: EPA SWMM5
//   Version: 5.1
//   Date:    03/20/14   (Build 5.1.001)
//            03/19/15   (Build 5.1.008)
//            08/01/16   (Build 5.1.011)
//            03/14/17   (Build 5.1.012)
//            05/10/18   (Build 5.1.013)
//   Author:  L. Rossman (US EPA)
//
//   Public interface for LID functions.
//
//   Build 5.1.008:
//   - Support added for Roof Disconnection LID.
//   - Support added for separate routing of LID drain flows.
//   - Detailed LID reporting modified.
//
//   Build 5.1.011:
//   - Water depth replaces moisture content for LID's pavement layer.
//   - Arguments for lidproc_saveResults() modified.
//
//   Build 5.1.012:
//   - Redefined meaning of wasDry in TLidRptFile structure.
//
//   Build 5.1.013:
//   - New member fromPerv added to TLidUnit structure to allow LID
//     units to also treat pervious area runoff.
//   - New members hOpen and hClose addded to TDrainLayer to open/close
//     drain when certain heads are reached.
//   - New member qCurve added to TDrainLayer to allow underdrain flow to
//     be adjusted by a curve of multiplier v. head.
//   - New array drainRmvl added to TLidProc to allow for underdrain
//     pollutant removal values.
//   - New members added to TPavementLayer and TLidUnit to support
//     unclogging permeable pavement at fixed intervals.
//
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
//  Enumerations
//-----------------------------------------------------------------------------
//enum LidTypes {
var    BIO_CELL = 0                // bio-retention cell
var    RAIN_GARDEN = 1             // rain garden
var    GREEN_ROOF = 2              // green roof
var    INFIL_TRENCH = 3            // infiltration trench
var    POROUS_PAVEMENT = 4         // porous pavement
var    RAIN_BARREL = 5             // rain barrel
var    VEG_SWALE = 6               // vegetative swale
var    ROOF_DISCON = 7            // roof disconnection

//enum TimePeriod {
var    PREVIOUS = 0                // previous time period
var    CURRENT = 1                // current time period

//-----------------------------------------------------------------------------
//  Data Structures
//-----------------------------------------------------------------------------
var MAX_LAYERS = 4

// LID Surface Layer
class TSurfaceLayer
{
    constructor(){
        this.thickness;          // depression storage or berm ht. (ft)
        this.voidFrac;           // available fraction of storage volume
        this.roughness;          // surface Mannings n
        this.surfSlope;          // land surface slope (fraction)
        this.sideSlope;          // swale side slope (run/rise)
        this.alpha;              // slope/roughness term in Manning eqn.
        this.canOverflow;        // 1 if immediate outflow of excess water
    }
}  ;

// LID Pavement Layer
class TPavementLayer
{
    constructor(){
        this.thickness;           // layer thickness (ft)
        this.voidFrac;            // void volume / total volume
        this.impervFrac;          // impervious area fraction
        this.kSat;                // permeability (ft/sec)
        this.clogFactor;          // clogging factor
        this.regenDays;           // clogging regeneration interval (days)     //(5.1.013)
        this.regenDegree;         // degree of clogging regeneration           //
    }
}  ;

// LID Soil Layer
class TSoilLayer
{
    constructor(){
        this.thickness;          // layer thickness (ft)
        this.porosity;           // void volume / total volume
        this.fieldCap;           // field capacity
        this.wiltPoint;          // wilting point
        this.suction;            // suction head at wetting front (ft)
        this.kSat;               // saturated hydraulic conductivity (ft/sec)
        this.kSlope;             // slope of log(K) v. moisture content curve
    }
}  ;

// LID Storage Layer
class TStorageLayer
{
    constructor(){
        this.thickness;          // layer thickness (ft)
        this.voidFrac;           // void volume / total volume
        this.kSat;               // saturated hydraulic conductivity (ft/sec)
        this.clogFactor;         // clogging factor
    }
}  ;

// Underdrain System (part of Storage Layer)
class TDrainLayer
{
    constructor(){
        this.coeff;              // underdrain flow coeff. (in/hr or mm/hr)
        this.expon;              // underdrain head exponent (for in or mm)
        this.offset;             // offset height of underdrain (ft)
        this.delay;              // rain barrel drain delay time (sec)
        this.hOpen;              // head when drain opens (ft)                //(5.1.013)
        this.hClose;             // head when drain closes (ft)               //
        this.qCurve;             // curve controlling flow rate (optional)    //
    }
}  ;

// Drainage Mat Layer (for green roofs)
class TDrainMatLayer
{
    constructor(){
        this.thickness;          // layer thickness (ft)
        this.voidFrac;           // void volume / total volume
        this.roughness;          // Mannings n for green roof drainage mats
        this.alpha;              // slope/roughness term in Manning equation
    }
}  ;

// LID Process - generic LID design per unit of area
class TLidProc
{
    constructor(){
        this.ID;            // identifying name
        this.lidType;       // type of LID
        this.surface = new TSurfaceLayer();       // surface layer parameters
        this.pavement = new TPavementLayer();      // pavement layer parameters
        this.soil = new TSoilLayer();          // soil layer parameters
        this.storage = new TStorageLayer();       // storage layer parameters
        this.drain = new TDrainLayer();         // underdrain system parameters
        this.drainMat = new TDrainMatLayer();      // drainage mat layer
        this.drainRmvl = [];     // underdrain pollutant removals             //(5.1.013)
    }
}  ;

// Water Balance Statistics
class TWaterBalance
{
    constructor(){
        this.inflow;        // total inflow (ft)
        this.evap;          // total evaporation (ft)
        this.infil;         // total infiltration (ft)
        this.surfFlow;      // total surface runoff (ft)
        this.drainFlow;     // total underdrain flow (ft)
        this.initVol;       // initial stored volume (ft)
        this.finalVol;      // final stored volume (ft)
    }
}  ;

// LID Report File
class TLidRptFile
{
    constructor(){
        this.file = new FILE();               // file pointer
        this.wasDry;             // number of successive dry periods
        this.results;//[256];       // results for current time period
    }
}   ;

// LID Unit - specific LID process applied over a given area
class TLidUnit
{
    constructor(){
        this.lidIndex;       // index of LID process
        this.number;         // number of replicate units
        this.area;           // area of single replicate unit (ft2)
        this.fullWidth;      // full top width of single unit (ft)
        this.botWidth;       // bottom width of single unit (ft)
        this.initSat;        // initial saturation of soil & storage layers
        this.fromImperv;     // fraction of impervious area runoff treated
        this.fromPerv;       // fraction of pervious area runoff treated       //(5.1.013)
        this.toPerv;         // 1 if outflow sent to pervious area; 0 if not
        this.drainSubcatch;  // subcatchment receiving drain flow
        this.drainNode;      // node receiving drain flow
        this.rptFile = new TLidRptFile();    // pointer to detailed report file
    
        this.soilInfil = new TGrnAmpt();      // infil. object for biocell soil layer
        this.surfaceDepth;   // depth of ponded water on surface layer (ft)
        this.paveDepth;      // depth of water in porous pavement layer
        this.soilMoisture;   // moisture content of biocell soil layer
        this.storageDepth;   // depth of water in storage layer (ft)
    
        // net inflow - outflow from previous time step for each LID layer (ft/s)
        this.oldFluxRates = new Array(MAX_LAYERS);
    
        this.dryTime;        // time since last rainfall (sec)
        this.oldDrainFlow;   // previous drain flow (cfs)
        this.newDrainFlow;   // current drain flow (cfs)
        this.volTreated;     // total volume treated (ft)                      //(5.1.013)
        this.nextRegenDay;   // next day when unit regenerated                 //
        this.waterBalance = new TWaterBalance();     // water balance quantites
    }
}  ;


//-----------------------------------------------------------------------------
//   lid.c
//
//   Project:  EPA SWMM5
//   Version:  5.1
//   Date:     03/20/14   (Build 5.1.001)
//             05/19/14   (Build 5.1.006)
//             09/15/14   (Build 5.1.007)
//             03/19/15   (Build 5.1.008)
//             04/30/15   (Build 5.1.009)
//             08/05/15   (Build 5.1.010)
//             08/01/16   (Build 5.1.011)
//             03/14/17   (Build 5.1.012)
//             05/10/18   (Build 5.1.013)
//             03/01/20   (Build 5.1.014)
//             04/01/20   (Build 5.1.015)
//   Author:   L. Rossman (US EPA)
//
//   This module handles all data processing involving LID (Low Impact
//   Development) practices used to treat runoff for individual subcatchments
//   within a project. The actual computation of LID performance is made by
//   functions within the lidproc.c module. See LidTypes below for the types
//   of LIDs that can be modeled.
//
//   An LID process is described by the TLidProc data structure and consists of
//   size-independent design data for the different vertical layers that make
//   up a specific type of LID. The collection of these LID process designs is
//   stored in the LidProcs array.
//
//   When a member of LidProcs is to be deployed in a particular subcatchment,
//   its sizing and treatment data are stored in a TLidUnit data structure.
//   The collection of all TLidUnits deployed in a subcatchment is held in a
//   TLidGroup list data structure. The LidGroups array contains a TLidGroup
//   list for each subcatchment in the project.
//
//   During a runoff time step, each subcatchment calls the lid_getRunoff()
//   function to compute flux rates and a water balance through each layer
//   of each LID unit in the subcatchment. The resulting outflows (runoff,
//   drain flow, evaporation and infiltration) are added to those computed
//   for the non-LID portion of the subcatchment.
//
//   An option exists for the detailed time series of flux rates and storage
//   levels for a specific LID unit to be written to a text file named by the
//   user for viewing outside of the SWMM program.
//
//   Build 5.1.008:
//   - More input error reporting added.
//   - Rooftop Disconnection added to the types of LIDs.
//   - LID drain flows are now tracked separately.
//   - LID drain flows can now be routed to separate outlets.
//   - Check added to insure LID flows not returned to nonexistent pervious area.
//
//   Build 5.1.009:
//   - Fixed bug where LID's could return outflow to non-LID area when LIDs
//     make up entire subcatchment.
//
//   Build 5.1.010:
//   - Support for new Modified Green Ampt infiltration model added.
//   - Imported variable HasWetLids now properly initialized.
//   - Initial state of reporting (lidUnit.rptFile.wasDry) changed to
//     prevent duplicate printing of first line of detailed report file.
//
//   Build 5.1.011:
//   - The top of the storage layer is no longer used as a limit for an
//     underdrain offset thus allowing upturned drains to be modeled.
//   - Column headings for the detailed LID report file were modified.
//
//   Build 5.1.012:
//   - Redefined initialization of wasDry for LID reporting.
//
//   Build 5.1.013:
//   - Support added for LID units treating pervious area runoff.
//   - Support added for open/closed head levels and multiplier v. head 
//     control curve for underdrain flow.
//   - Support added for unclogging permeable pavement at fixed intervals.
//   - Support added for pollutant removal in underdrain flow.
//
//   Build 5.1.014:
//   - Fixed bug in creating LidProcs when there are no subcatchments.
//   - Fixed bug in adding underdrain pollutant loads to mass balances.
//
//   Build 5.1.015:
//   - Support added for mutiple infiltration methods within a project.
//-----------------------------------------------------------------------------


var ERR_PAVE_LAYER = " - check pavement layer parameters"
var ERR_SOIL_LAYER = " - check soil layer parameters"
var ERR_STOR_LAYER = " - check storage layer parameters"
var ERR_SWALE_SURF = " - check swale surface parameters"
var ERR_GREEN_AMPT = " - check subcatchment Green-Ampt parameters"
var ERR_DRAIN_OFFSET = " - drain offset exceeds storage height"
var ERR_DRAIN_HEADS = " - invalid drain open/closed heads"                   //(5.1.013)
var ERR_SWALE_WIDTH = " - invalid swale width"

//-----------------------------------------------------------------------------
//  Enumerations
//-----------------------------------------------------------------------------
//enum LidLayerTypes {
var    SURF = 0                    // surface layer
var    SOIL = 1                    // soil layer
var    STOR = 2                    // storage layer
var    PAVE = 3                    // pavement layer
var    DRAINMAT = 4                // drainage mat layer
var    DRAIN = 5                   // underdrain system
var    REMOVALS = 6               // pollutant removals                             //(5.1.013)

//// Note: DRAINMAT must be placed before DRAIN so the two keywords can
///        be distinguished from one another when parsing a line of input. 

var LidLayerWords =
    ["SURFACE", "SOIL", "STORAGE", "PAVEMENT", "DRAINMAT", "DRAIN",
     "REMOVALS", null];                                                        //(5.1.013)

var LidTypeWords =
    ["BC",                   //bio-retention cell
     "RG",                   //rain garden
     "GR",                   //green roof
     "IT",                   //infiltration trench
     "PP",                   //porous pavement
     "RB",                   //rain barrel
     "VS",                   //vegetative swale
     "RD",                   //rooftop disconnection
     null];

//-----------------------------------------------------------------------------
//  Data Structures
//-----------------------------------------------------------------------------

// LID List - list of LID units contained in an LID group
class  LidList
{
    constructor(){
        this.lidUnit = new TLidUnit();     // TLidUnit* ptr. to a LID unit
        this.nextLidUnit;                  // LidList*  
    }
};

class  TLidList
{
    constructor(){
        this.lidUnit = new TLidUnit();     // TLidUnit* ptr. to a LID unit
        this.nextLidUnit;                  // LidList*  
    }
};

// LID Group - collection of LID units applied to a specific subcatchment
class LidGroup
{
    constructor(){
        this.pervArea;      // amount of pervious area in group (ft2)
        this.flowToPerv;    // total flow sent to pervious area (cfs)
        this.oldDrainFlow;  // total drain flow in previous period (cfs)
        this.newDrainFlow;  // total drain flow in current period (cfs)
        this.lidList;       // TLidList* list of LID units in the group
    }
};

class TLidGroup
{
    constructor(){
        this.pervArea;      // amount of pervious area in group (ft2)
        this.flowToPerv;    // total flow sent to pervious area (cfs)
        this.oldDrainFlow;  // total drain flow in previous period (cfs)
        this.newDrainFlow;  // total drain flow in current period (cfs)
        this.lidList;       // TLidList* list of LID units in the group
    }
};

//-----------------------------------------------------------------------------
//  Shared Variables
//-----------------------------------------------------------------------------
var LidProcs = [];            // TLidProc*  array of LID processes
var LidCount;            // number of LID processes
var LidGroups = [];           // TLidGroup* array of LID process groups
var GroupCount;          // number of LID groups (subcatchments)

var EvapRate;            // evaporation rate (ft/s)
var NativeInfil;         // native soil infil. rate (ft/s)
var MaxNativeInfil;      // native soil infil. rate limit (ft/s)

//-----------------------------------------------------------------------------
//  Imported Variables (from SUBCATCH.C)
//-----------------------------------------------------------------------------
// Volumes (ft3) for a subcatchment over a time step 
var Vevap;               // evaporation
var Vpevap;              // pervious area evaporation
var Vinfil;              // non-LID infiltration
var VlidInfil;           // infiltration from LID units
var VlidIn;              // impervious area flow to LID units
var VlidOut;             // surface outflow from LID units
var VlidDrain;           // drain outflow from LID units
var VlidReturn;          // LID outflow returned to pervious area
var HasWetLids;          // true if any LIDs are wet
                                       // (from RUNOFF.C)

//-----------------------------------------------------------------------------
//  External Functions (prototyped in lid.h)
//-----------------------------------------------------------------------------
//  lid_create               called by createObjects in project.c
//  lid_delete               called by deleteObjects in project.c
//  lid_validate             called by project_validate
//  lid_initState            called by project_init

//  lid_readProcParams       called by parseLine in input.c
//  lid_readGroupParams      called by parseLine in input.c

//  lid_setOldGroupState     called by subcatch_setOldState
//  lid_setReturnQual        called by findLidLoads in surfqual.c
//  lid_getReturnQual        called by subcatch_getRunon

//  lid_getPervArea          called by subcatch_getFracPerv
//  lid_getFlowToPerv        called by subcatch_getRunon
//  lid_getSurfaceDepth      called by subcatch_getDepth
//  lid_getDepthOnPavement   called by sweptSurfacesDry in subcatch.c
//  lid_getStoredVolume      called by subcatch_getStorage
//  lid_getRunon             called by subcatch_getRunon
//  lid_getRunoff            called by subcatch_getRunoff

//  lid_addDrainRunon        called by subcatch_getRunon
//  lid_addDrainLoads        called by surfqual_getWashoff
//  lid_addDrainInflow       called by addLidDrainInflows in routing.c

//  lid_writeSummary         called by inputrpt_writeInput
//  lid_writeWaterBalance    called by statsrpt_writeReport

//=============================================================================
// int lidCount, int subcatchCount
function lid_create(lidCount, subcatchCount)
//
//  Purpose: creates an array of LID objects.
//  Input:   n = number of LID processes
//  Output:  none
//
{
    let j;

    //... assign null values to LID arrays
    LidProcs = [];
    LidGroups = [];
    LidCount = lidCount;

    //... create LID groups
    GroupCount = subcatchCount;
    if ( GroupCount > 0 )
    {
        //LidGroups = (TLidGroup *) calloc(GroupCount, sizeof(TLidGroup));
        for(let i = 0; i < GroupCount; i++){LidGroups.push(new TLidGroup())}
        if ( LidGroups.length == 0 )
        {
            ErrorCode = ERR_MEMORY;
            return;
        }
    }

    //... initialize LID groups
    //for (j = 0; j < GroupCount; j++) LidGroups[j] = null;
    
    //... create LID objects
    if ( LidCount == 0 ) return;
    //LidProcs = (TLidProc *) calloc(LidCount, sizeof(TLidProc));
    for(let i = 0; i < LidCount; i++){LidProcs.push(new TLidProc())}
    if ( LidProcs == null )
    {
        ErrorCode = ERR_MEMORY;
        return;
    }

    //... initialize LID objects
    for (j = 0; j < LidCount; j++)
    {
        LidProcs[j].lidType = -1;
        LidProcs[j].surface.thickness = 0.0;
        LidProcs[j].surface.voidFrac = 1.0;
        LidProcs[j].surface.roughness = 0.0;
        LidProcs[j].surface.surfSlope = 0.0;
        LidProcs[j].pavement.thickness = 0.0;
        LidProcs[j].soil.thickness = 0.0;
        LidProcs[j].storage.thickness = 0.0;
        LidProcs[j].storage.kSat = 0.0;
        LidProcs[j].drain.coeff = 0.0;
        LidProcs[j].drain.offset = 0.0;
        LidProcs[j].drainMat.thickness = 0.0;
        LidProcs[j].drainMat.roughness = 0.0;
        LidProcs[j].drainRmvl = null;                                          //(5.1.013)
        LidProcs[j].drainRmvl =                                      //
                                calloc(Nobjects[POLLUT], sizeof(double));      //
        if (LidProcs[j].drainRmvl == null)                                     //
        {                                                                      //
            ErrorCode = ERR_MEMORY;                                            //
            return;                                                            //
        }                                                                      // 
    }
}

//=============================================================================

function lid_delete()
//
//  Purpose: deletes all LID objects
//  Input:   none
//  Output:  none
//
{
    let j;
    for (j = 0; j < GroupCount; j++) freeLidGroup(j);
    FREE(LidGroups);
    for (j = 0; j < LidCount; j++) FREE(LidProcs[j].drainRmvl);                //(5.1.013)
    FREE(LidProcs);
    GroupCount = 0;
    LidCount = 0;
}

//=============================================================================
// int j
function freeLidGroup(j)
//
//  Purpose: frees all LID units associated with a subcatchment.
//  Input:   j = group (or subcatchment) index
//  Output:  none
//
{
    let  lidGroup = LidGroups[j];
    let  lidList;
    let  lidUnit;
    let  nextLidUnit;

    if ( lidGroup == null ) return;
    lidList = lidGroup.lidList;
    while (lidList)
    {
        lidUnit = lidList.lidUnit;
        if ( lidUnit.rptFile )
        {
            if ( lidUnit.rptFile.file ) fclose(lidUnit.rptFile.file);
            lidUnit.rptFile = null;
        }
        nextLidUnit = lidList.nextLidUnit;
        
        lidUnit = null;
        lidList = null;
        lidList = nextLidUnit;
    }
    lidGroup = [];
    LidGroups[j] = null;
}

//=============================================================================
// char* toks[], int ntoks
function lid_readProcParams(toks, ntoks)
//
//  Purpose: reads LID process information from line of input data file
//  Input:   toks = array of string tokens
//           ntoks = number of tokens
//  Output:  returns error code
//
//  Format for first line that defines a LID process is:
//    LID_ID  LID_Type
//
//  Followed by some combination of lines below depending on LID_Type:
//    LID_ID  SURFACE   <parameters>
//    LID_ID  PAVEMENT  <parameters>
//    LID_ID  SOIL      <parameters>
//    LID_ID  STORAGE   <parameters>
//    LID_ID  DRAIN     <parameters>
//    LID_ID  DRAINMAT  <parameters>
//    LID_ID  REMOVALS  <parameters>                                           //(5.1.013)
//
{
    let j, m;

    // --- check for minimum number of tokens
    if ( ntoks < 2 ) return error_setInpError(ERR_ITEMS, "");

    // --- check that LID exists in database
    j = project_findObject(LID, toks[0]);
    if ( j < 0 ) return error_setInpError(ERR_NAME, toks[0]);

    // --- assign ID if not done yet
    if ( LidProcs[j].ID == null )
        LidProcs[j].ID = project_findID(LID, toks[0]);

    // --- check if second token is the type of LID
    m = findmatch(toks[1], LidTypeWords);
    if ( m >= 0 )
    {
        LidProcs[j].lidType = m;
        return 0;
    }

    // --- check if second token is name of LID layer
    else m = findmatch(toks[1], LidLayerWords);

    // --- read input parameters for the identified layer
    switch (m)
    {
    case SURF:  return readSurfaceData(j, toks, ntoks);
    case SOIL:  return readSoilData(j, toks, ntoks);
    case STOR:  return readStorageData(j, toks, ntoks);
    case PAVE:  return readPavementData(j, toks, ntoks);
    case DRAIN: return readDrainData(j, toks, ntoks);
    case DRAINMAT: return readDrainMatData(j, toks, ntoks);
    case REMOVALS: return readRemovalsData(j, toks, ntoks);                    //(5.1.013)
    }
    return error_setInpError(ERR_KEYWORD, toks[1]);
}

//=============================================================================
// char* toks[], int ntoks
function lid_readGroupParams(toks, ntoks)
//
//  Purpose: reads input data for a LID unit placed in a subcatchment.
//  Input:   toks = array of string tokens
//           ntoks = number of tokens
//  Output:  returns error code
//
//  Format of input data line is:
//    Subcatch_ID  LID_ID  Number  Area  Width  InitSat  FromImp  ToPerv
//                                              (RptFile  DrainTo  FromPerv)   //(5.1.013)
//  where:
//    Subcatch_ID    = name of subcatchment
//    LID_ID         = name of LID process
//    Number     (n) = number of replicate units
//    Area    (x[0]) = area of each unit
//    Width   (x[1]) = outflow width of each unit
//    InitSat (x[2]) = % that LID is initially saturated
//    FromImp (x[3]) = % of impervious runoff sent to LID
//    ToPerv  (x[4]) = 1 if outflow goes to pervious sub-area; 0 if not
//    RptFile        = name of detailed results file (optional)
//    DrainTo        = name of subcatch/node for drain flow (optional)
//    FromPerv (x[5]) = % of pervious runoff sent to LID                       //(5.1.013)
//
{
    let        i, j, k, n;
    let     x = new Array(6);                                                           //(5.1.013)
    let      fname = null;
    let        drainSubcatch = -1, drainNode = -1;

    // return facilitators
    let returnObj;
    let returnVal;

    //... check for valid number of input tokens
    if ( ntoks < 8 ) return error_setInpError(ERR_ITEMS, "");

    //... find subcatchment
    j = project_findObject(SUBCATCH, toks[0]);
    if ( j < 0 ) return error_setInpError(ERR_NAME, toks[0]);

    //... find LID process in list of LID processes
    k = project_findObject(LID, toks[1]);
    if ( k < 0 ) return error_setInpError(ERR_NAME, toks[1]);

    //... get number of replicates
    n = parseInt(toks[2]);
    if ( n < 0 ) return error_setInpError(ERR_NUMBER, toks[2]);
    if ( n == 0 ) return 0;

    //... convert next 4 tokens to doubles
    for (i = 3; i <= 7; i++)
    {
        ////////////////////////////////////
        returnObj = {y: x[i-3]}
        returnVal = getDouble(toks[i], returnObj);
        x[i-3] = returnObj.y;
        ////////////////////////////////////
        if( !returnVal || x[i-3] < 0.0 )
        //if ( null == (x[i-3] = getDouble(toks[i])) || x[i-3] < 0.0 )
            return error_setInpError(ERR_NUMBER, toks[i]);
    }

    //... check for valid percentages on tokens 5 & 6 (x[2] & x[3])
    for (i = 2; i <= 3; i++) if ( x[i] > 100.0 )
        return error_setInpError(ERR_NUMBER, toks[i+3]);

    //... read optional report file name
    if ( ntoks >= 9 && strcmp(toks[8], "*") != 0 ) fname = toks[8];

    //... read optional underdrain outlet
    if ( ntoks >= 10 && strcmp(toks[9], "*") != 0 )
    {
        drainSubcatch = project_findObject(SUBCATCH, toks[9]);
        if ( drainSubcatch < 0 )
        {
            drainNode = project_findObject(NODE, toks[9]);
            if ( drainNode < 0 ) return error_setInpError(ERR_NAME, toks[9]);
        }
    }

    //... read percent of pervious area treated by LID unit                    //(5.1.013)
    x[5] = 0.0;                                                                //
    if (ntoks >= 11)                                                           //
    {                                                                          //
        ////////////////////////////////////
        returnObj = {y: x[5]}
        returnVal = getDouble(toks[10], returnObj);
        x[5] = returnObj.y;
        ////////////////////////////////////
        if( !returnVal || x[5] < 0.0 || x[5] > 100.0 )
        //if (null == (x[5] = getDouble(toks[10])) || x[5] < 0.0 || x[5] > 100.0)         //
            return error_setInpError(ERR_NUMBER, toks[10]);                    //
    }                                                                          //

    //... create a new LID unit and add it to the subcatchment's LID group
    return addLidUnit(j, k, n, x, fname, drainSubcatch, drainNode);
}

//=============================================================================
// int j, int k, int n, double x[], char* fname,
//    int drainSubcatch, int drainNode
function addLidUnit(j, k, n, x, fname, drainSubcatch, drainNode)
//
//  Purpose: adds an LID unit to a subcatchment's LID group.
//  Input:   j = subcatchment index
//           k = LID control index
//           n = number of replicate units
//           x = LID unit's parameters
//           fname = name of detailed performance report file
//           drainSubcatch = index of subcatchment receiving underdrain flow
//           drainNode = index of node receiving underdrain flow
//  Output:  returns an error code
//
{
    let  lidUnit = [];
    let  lidList = [];
    let lidGroup;

    //... create a LID group (pointer to an LidGroup struct)
    //    if one doesn't already exist
    lidGroup = LidGroups[j];
    if ( !lidGroup )
    {
        //lidGroup = (struct LidGroup *) malloc(sizeof(struct LidGroup));
        lidGroup = new LidGroup();

        if ( !lidGroup ) return error_setInpError(ERR_MEMORY, "");
        lidGroup.lidList = null;
        LidGroups[j] = lidGroup;
    }

    //... create a new LID unit to add to the group
    //lidUnit = (TLidUnit *) malloc(sizeof(TLidUnit));
    lidUnit = new TLidUnit();
    if ( !lidUnit ) return error_setInpError(ERR_MEMORY, "");
    lidUnit.rptFile = null;

    //... add the LID unit to the group
    //lidList = (TLidList *) malloc(sizeof(TLidList));
    lidList = new TLidList();
    if ( !lidList )
    {
        //free(lidUnit);
        lidUnit = null;
        return error_setInpError(ERR_MEMORY, "");
    }
    lidList.lidUnit = lidUnit;
    lidList.nextLidUnit = lidGroup.lidList;
    lidGroup.lidList = lidList;

    //... assign parameter values to LID unit
    lidUnit.lidIndex     = k;
    lidUnit.number       = n;
    lidUnit.area         = x[0] / SQR(UCF(LENGTH));
    lidUnit.fullWidth    = x[1] / UCF(LENGTH);
    lidUnit.initSat      = x[2] / 100.0;
    lidUnit.fromImperv   = x[3] / 100.0;
    lidUnit.toPerv       = (x[4] > 0.0);
    lidUnit.fromPerv     = x[5] / 100.0;                                      //(5.1.013)
    lidUnit.drainSubcatch = drainSubcatch;
    lidUnit.drainNode     = drainNode;

    //... open report file if it was supplied
    if ( fname != null )
    {
        if ( !createLidRptFile(lidUnit, fname) ) 
            return error_setInpError(ERR_RPT_FILE, fname);
    }
    return 0;
}

//=============================================================================
// TLidUnit* lidUnit, char* fname
function createLidRptFile(lidUnit, fname)
{
    let rptFile;
    
    //rptFile = (TLidRptFile *) malloc(sizeof(TLidRptFile));
    rptFile = new TLidRptFile();
    if ( rptFile == null ) return 0;
    lidUnit.rptFile = rptFile;
    rptFile.contents = fopen(fname, "wt");
    if ( rptFile.file == null ) return 0;
    return 1;
}

//=============================================================================
// int j, char* toks[], int ntoks
function readSurfaceData(j, toks, ntoks)
//
//  Purpose: reads surface layer data for a LID process from line of input
//           data file
//  Input:   j = LID process index 
//           toks = array of string tokens
//           ntoks = number of tokens
//  Output:  returns error code
//
//  Format of data is:
//  LID_ID  SURFACE  StorageHt  VegVolFrac  Roughness  SurfSlope  SideSlope  DamHt
//
{
    let    i;
    let x = new Array(5);

    if ( ntoks < 7 ) return error_setInpError(ERR_ITEMS, "");
    for (i = 2; i < 7; i++)
    {
        ////////////////////////////////////
        returnObj = {y: x[i-2]}
        returnVal = getDouble(toks[i], returnObj);
        x[i-2] = returnObj.y;
        ////////////////////////////////////
        if( !returnVal || x[i-2] < 0.0 )
        //if ( null == (x[i-2] = getDouble(toks[i])) || x[i-2] < 0.0 )
            return error_setInpError(ERR_NUMBER, toks[i]);
    }
    if ( x[1] >= 1.0 ) return error_setInpError(ERR_NUMBER, toks[3]);           
    if ( x[0] == 0.0 ) x[1] = 0.0;

    LidProcs[j].surface.thickness     = x[0] / UCF(RAINDEPTH);
    LidProcs[j].surface.voidFrac      = 1.0 - x[1];
    LidProcs[j].surface.roughness     = x[2];
    LidProcs[j].surface.surfSlope     = x[3] / 100.0;
    LidProcs[j].surface.sideSlope     = x[4];
    return 0;
}

//=============================================================================
// int j, char* toks[], int ntoks
function readPavementData(j, toks, ntoks)
//
//  Purpose: reads pavement layer data for a LID process from line of input
//           data file
//  Input:   j = LID process index 
//           toks = array of string tokens
//           ntoks = number of tokens
//  Output:  returns error code
//
//  Format of data is:
//    LID_ID PAVEMENT  Thickness  VoidRatio  FracImperv  Permeability  ClogFactor
//                                                        (RegenDays RegenDegree) //(5.1.013)
//
{
    let    i;
    let x = new Array(7);                                                               //(5.1.013)

    // return facilitators
    let returnObj;
    let returnVal;

    if ( ntoks < 7 ) return error_setInpError(ERR_ITEMS, "");
    for (i = 2; i < 7; i++)
    {
        ////////////////////////////////////
        returnObj = {y: x[i-2]}
        returnVal = getDouble(toks[i], returnObj);
        x[i-2] = returnObj.y;
        ////////////////////////////////////
        if( !returnVal || x[i-2] < 0.0 )
        //if ( null == (x[i-2] = getDouble(toks[i])) || x[i-2] < 0.0 )
            return error_setInpError(ERR_NUMBER, toks[i]);
    }

    // ... read optional clogging regeneration properties                      //(5.1.013)
    x[5] = 0.0;                                                                //
    if (ntoks > 7)                                                             //
    {                
        ////////////////////////////////////
        returnObj = {y: x[5]}
        returnVal = getDouble(toks[7], returnObj);
        x[5] = returnObj.y;
        ////////////////////////////////////
        if( !returnVal || x[5] < 0.0 )                                                          //
        //if (null == (x[5] = getDouble(toks[7])) || x[5] < 0.0)                          //
            return error_setInpError(ERR_NUMBER, toks[7]);                     //
    }                                                                          //
    x[6] = 0.0;                                                                //
    if (ntoks > 8)                                                             //
    {                                                                          //
        ////////////////////////////////////
        returnObj = {y: x[6]}
        returnVal = getDouble(toks[8], returnObj);
        x[6] = returnObj.y;
        ////////////////////////////////////
        if( !returnVal || x[6] < 0.0 || x[6] > 1.0 )
        //if (null == (x[6] = getDouble(toks[8])) || x[6] < 0.0 || x[6] > 1.0)            //
            return error_setInpError(ERR_NUMBER, toks[8]);                     //
    }                                                                          //

    //... convert void ratio to void fraction
    x[1] = x[1]/(x[1] + 1.0);

    LidProcs[j].pavement.thickness    = x[0] / UCF(RAINDEPTH);
    LidProcs[j].pavement.voidFrac     = x[1];
    LidProcs[j].pavement.impervFrac   = x[2];
    LidProcs[j].pavement.kSat         = x[3] / UCF(RAINFALL);
    LidProcs[j].pavement.clogFactor   = x[4];
    LidProcs[j].pavement.regenDays    = x[5];                                  //(5.1.013)
    LidProcs[j].pavement.regenDegree  = x[6];                                  //
    return 0;
}

//=============================================================================
// int j, char* toks[], int ntoks
function readSoilData(j, toks, ntoks)
//
//  Purpose: reads soil layer data for a LID process from line of input
//           data file
//  Input:   j = LID process index 
//           toks = array of string tokens
//           ntoks = number of tokens
//  Output:  returns error code
//
//  Format of data is:
//    LID_ID  SOIL  Thickness  Porosity  FieldCap  WiltPt Ksat  Kslope  Suction
//
{
    let    i;
    let x = new Array(7);

    //return facilitators
    let returnObj;
    let returnVal;

    if ( ntoks < 9 ) return error_setInpError(ERR_ITEMS, "");
    for (i = 2; i < 9; i++)
    {
        ////////////////////////////////////
        returnObj = {y: x[i-2]}
        returnVal = getDouble(toks[i], returnObj);
        x[i-2] = returnObj.y;
        ////////////////////////////////////
        if( !returnVal || x[i-2] < 0.0 )
        //if ( null == (x[i-2] = getDouble(toks[i])) || x[i-2] < 0.0 )
            return error_setInpError(ERR_NUMBER, toks[i]);
    }
    LidProcs[j].soil.thickness = x[0] / UCF(RAINDEPTH);
    LidProcs[j].soil.porosity  = x[1];
    LidProcs[j].soil.fieldCap  = x[2];
    LidProcs[j].soil.wiltPoint = x[3];
    LidProcs[j].soil.kSat      = x[4] / UCF(RAINFALL);
    LidProcs[j].soil.kSlope    = x[5];
    LidProcs[j].soil.suction   = x[6] / UCF(RAINDEPTH);
    return 0;
}

//=============================================================================
// int j, char* toks[], int ntoks
function readStorageData(j, toks, ntoks)
//
//  Purpose: reads drainage layer data for a LID process from line of input
//           data file
//  Input:   j = LID process index 
//           toks = array of string tokens
//           ntoks = number of tokens
//  Output:  returns error code
//
//  Format of data is:
//    LID_ID STORAGE  Thickness  VoidRatio  Ksat  ClogFactor 
//
{
    let    i;
    let x = new Array(6);

    // return facilitators
    let returnObj;
    let returnVal;

    //... read numerical parameters
    if ( ntoks < 6 ) return error_setInpError(ERR_ITEMS, "");
    for (i = 2; i < 6; i++)
    {
        ////////////////////////////////////
        returnObj = {y: x[i-2]}
        returnVal = getDouble(toks[i], returnObj);
        x[i-2] = returnObj.y;
        ////////////////////////////////////
        if( !returnVal || x[i-2] < 0.0 )
        //if ( null == (x[i-2] = getDouble(toks[i]))  || x[i-2] < 0.0 )
            return error_setInpError(ERR_NUMBER, toks[i]);
    }

    //... convert void ratio to void fraction
    x[1] = x[1]/(x[1] + 1.0);

    //... save parameters to LID storage layer structure
    LidProcs[j].storage.thickness   = x[0] / UCF(RAINDEPTH);
    LidProcs[j].storage.voidFrac    = x[1];
    LidProcs[j].storage.kSat        = x[2] / UCF(RAINFALL);
    LidProcs[j].storage.clogFactor  = x[3];
    return 0;
}
 
//=============================================================================
// int j, char* toks[], int ntoks
function readDrainData(j, toks, ntoks)
//
//  Purpose: reads underdrain data for a LID process from line of input
//           data file
//  Input:   j = LID process index 
//           toks = array of string tokens
//           ntoks = number of tokens
//  Output:  returns error code
//
//  Format of data is:
//    LID_ID DRAIN  coeff  expon  offset  delay hOpen hClose curve             //(5.1.013)
//
{
    let    i;
    let x = new Array(6);                                                               //(5.1.013)

    // return facilitators
    let returnObj;
    let returnVal;

    //... read numerical parameters
    if ( ntoks < 6 ) return error_setInpError(ERR_ITEMS, "");
    for (i = 0; i < 6; i++) x[i] = 0.0;                                        //(5.1.013)
    for (i = 2; i < 8; i++)                                                    //
    {
        ////////////////////////////////////
        returnObj = {y: x[i-2]}
        returnVal = getDouble(toks[i], returnObj);
        x[i-2] = returnObj.y;
        ////////////////////////////////////
        if( ntoks > i && !returnVal || x[i-2] < 0.0 )
        //if ( ntoks > i && null == (x[i-2] = getDouble(toks[i])) || x[i-2] < 0.0 )      //(5.1.013)
            return error_setInpError(ERR_NUMBER, toks[i]);
    }

    i = -1;                                                                    //(5.1.013)
    if ( ntoks >= 9 )                                                          //
    {                                                                          //
        i = project_findObject(CURVE, toks[8]);                                //
        if (i < 0) return error_setInpError(ERR_NAME, toks[8]);                //
    }                                                                          //

    //... save parameters to LID drain layer structure
    LidProcs[j].drain.coeff  = x[0];
    LidProcs[j].drain.expon  = x[1];
    LidProcs[j].drain.offset = x[2] / UCF(RAINDEPTH);
    LidProcs[j].drain.delay  = x[3] * 3600.0;
    LidProcs[j].drain.hOpen  = x[4] / UCF(RAINDEPTH);                          //(5.1.013)
    LidProcs[j].drain.hClose = x[5] / UCF(RAINDEPTH);                          //
    LidProcs[j].drain.qCurve = i;                                              //
    return 0;
}
 
//=============================================================================
// int j, char* toks[], int ntoks
function readDrainMatData(j, toks, ntoks)
//
//  Purpose: reads drainage mat data for a LID process from line of input
//           data file
//  Input:   j = LID process index 
//           toks = array of string tokens
//           ntoks = number of tokens
//  Output:  returns error code
//
//  Format of data is:
//    LID_ID DRAINMAT  thickness  voidRatio  roughness
//
{
    let    i;
    let x = new Array(3);

    // return facilitators
    let returnObj;
    let returnVal;

    //... read numerical parameters
    if ( ntoks < 5 ) return error_setInpError(ERR_ITEMS, "");
    if ( LidProcs[j].lidType != GREEN_ROOF ) return 0;
    for (i = 2; i < 5; i++)
    {
        ////////////////////////////////////
        returnObj = {y: x[i-2]}
        returnVal = getDouble(toks[i], returnObj);
        x[i-2] = returnObj.y;
        ////////////////////////////////////
        if( !returnVal || x[i-2] < 0.0 )
        //if ( null == (x[i-2] = getDouble(toks[i])) || x[i-2] < 0.0 )
            return error_setInpError(ERR_NUMBER, toks[i]);
    }

    //... save parameters to LID drain layer structure
    LidProcs[j].drainMat.thickness = x[0] / UCF(RAINDEPTH);;
    LidProcs[j].drainMat.voidFrac  = x[1];
    LidProcs[j].drainMat.roughness = x[2];
    return 0;
}

//=============================================================================

////  This function was added to release 5.1.013.  ////                        //(5.1.013)
// int j, char* toks[], int ntoks
function readRemovalsData(j, toks, ntoks)
//
//  Purpose: reads pollutant removal data for a LID process from line of input
//           data file
//  Input:   j = LID process index 
//           toks = array of string tokens
//           ntoks = number of tokens
//  Output:  returns error code
//
//  Format of data is:
//    LID_ID REMOVALS  pollut1  %removal1  pollut2  %removal2  ...
//
{
    let    i = 2;
    let    p;
    let rmvl;

    // return facilitators
    let returnObj;
    let returnVal;

    //... start with 3rd token
    if (ntoks < 4) return error_setInpError(ERR_ITEMS, "");
    while (ntoks > i)
    {
        //... find pollutant index from its name
        p = project_findObject(POLLUT, toks[i]);
        if (p < 0) return error_setInpError(ERR_NAME, toks[i]);

        //... check that a next token exists
        i++;
        if (ntoks == i) return error_setInpError(ERR_ITEMS, "");

        //... get the % removal value from the next token
        ////////////////////////////////////
        returnObj = {y: rmvl}
        returnVal = getDouble(toks[i], returnObj);
        rmvl = returnObj.y;
        ////////////////////////////////////
        if( !returnVal || rmvl < 0.0 || rmvl > 100.0 )
        //if (!(rmvl = getDouble(toks[i])) || rmvl < 0.0 || rmvl > 100.0)
            return error_setInpError(ERR_NUMBER, toks[i]);

        //... save the pollutant removal for the LID process as a fraction
        LidProcs[j].drainRmvl[p] = rmvl / 100.0;
        i++;
    }
    return 0;
}
//=============================================================================

function lid_writeSummary()
//
//  Purpose: writes summary of LID processes used to report file.
//  Input:   none
//  Output:  none
//
{
    let        j, k;
    let     pctArea;
    let  lidUnit; //TLidUnit*
    let  lidList; // TLidList*
    let  lidGroup; //TLidGroup 
    // String formatted values
    let val1, val2, val3, val4, val5, val6
 
    Frpt.contents +=  `\n`;
    Frpt.contents +=  `\n`;
    Frpt.contents +=  `\n  *******************`;
    Frpt.contents +=  `\n  LID Control Summary`;
    Frpt.contents +=  `\n  *******************`;


    Frpt.contents +=  
`\n                                   No. of        Unit        Unit      %% Area    %% Imperv      %% Perv`; //(5.1.013)
    Frpt.contents +=                                                                                           //
`\n  Subcatchment     LID Control      Units        Area       Width     Covered     Treated     Treated`;    //
    Frpt.contents +=                                                                                         //
`\n  ---------------------------------------------------------------------------------------------------`;    //

    for (j = 0; j < GroupCount; j++)
    {
        lidGroup = LidGroups[j];
        if ( lidGroup == null ) continue;
        lidList = lidGroup.lidList;
        while ( lidList )
        {
            lidUnit = lidList.lidUnit;
            k = lidUnit.lidIndex;
            pctArea = lidUnit.area * lidUnit.number / Subcatch[j].area * 100.0;
            Frpt.contents += `\n  ${Subcatch[j].ID.padEnd(16, ' ')} ${LidProcs[k].ID.padEnd(16, ' ')}`

            val1 = lidUnit.number.padStart(6, ' ')
            val2 = (lidUnit.area * SQR(UCF(LENGTH))).toFixed(2).padStart(10, ' ')
            val3 = (lidUnit.fullWidth * UCF(LENGTH)).toFixed(2).padStart(10, ' ')
            val4 = pctArea.toFixed(2).padStart(10, ' ')
            val5 = (lidUnit.fromImperv*100.0).toFixed(2).padStart(10, ' ')
            val6 = (lidUnit.fromPerv*100.0).toFixed(2).padStart(10, ' ')
            Frpt.contents += `%6d  %10.2f  %10.2f  %10.2f  %10.2f  %10.2f`  //(5.1.013)

            lidList = lidList.nextLidUnit;
        }
    }
}

//=============================================================================

function lid_validate()
//
//  Purpose: validates LID process and group parameters.
//  Input:   none 
//  Output:  none
//
{
    let j;
    for (j = 0; j < LidCount; j++) validateLidProc(j);
    for (j = 0; j < GroupCount; j++) validateLidGroup(j);
}

//=============================================================================
// int j
function validateLidProc(j)
//
//  Purpose: validates LID process parameters.
//  Input:   j = LID process index 
//  Output:  none
//
{
    let layerMissing = false;

    //... check that LID type was supplied
    if ( LidProcs[j].lidType < 0 )
    {
        report_writeErrorMsg(ERR_LID_TYPE, LidProcs[j].ID);
        return;
    }

    //... check that required layers were defined
    switch (LidProcs[j].lidType)
    {
    case BIO_CELL:
    case RAIN_GARDEN:
        if ( LidProcs[j].soil.thickness <= 0.0 ) layerMissing = true;
        break;
    case GREEN_ROOF:
        if ( LidProcs[j].soil.thickness <= 0.0 ) layerMissing = true; 
        if ( LidProcs[j].drainMat.thickness <= 0.0) layerMissing = true;
        break;
    case POROUS_PAVEMENT:
        if ( LidProcs[j].pavement.thickness  <= 0.0 ) layerMissing = true;
        break;
    case INFIL_TRENCH:
        if ( LidProcs[j].storage.thickness <= 0.0 ) layerMissing = true;
        break;
    }
    if ( layerMissing )
    {
        report_writeErrorMsg(ERR_LID_LAYER, LidProcs[j].ID);
        return;
    }

    //... check pavement layer parameters
    if ( LidProcs[j].lidType == POROUS_PAVEMENT )
    {
        if ( LidProcs[j].pavement.thickness  <= 0.0 
        ||   LidProcs[j].pavement.kSat       <= 0.0 
        ||   LidProcs[j].pavement.voidFrac   <= 0.0
        ||   LidProcs[j].pavement.voidFrac   >  1.0
        ||   LidProcs[j].pavement.impervFrac >  1.0 )

        {
            strcpy(Msg, LidProcs[j].ID);
            strcat(Msg, ERR_PAVE_LAYER);
            report_writeErrorMsg(ERR_LID_PARAMS, Msg);
        }
    }

    //... check soil layer parameters
    if ( LidProcs[j].soil.thickness > 0.0 )
    {
        if ( LidProcs[j].soil.porosity      <= 0.0 
        ||   LidProcs[j].soil.fieldCap      >= LidProcs[j].soil.porosity
        ||   LidProcs[j].soil.wiltPoint     >= LidProcs[j].soil.fieldCap
        ||   LidProcs[j].soil.kSat          <= 0.0
        ||   LidProcs[j].soil.kSlope        <  0.0 )
        {
            strcpy(Msg, LidProcs[j].ID);
            strcat(Msg, ERR_SOIL_LAYER);
            report_writeErrorMsg(ERR_LID_PARAMS, Msg);
        }
    }

    //... check storage layer parameters
    if ( LidProcs[j].storage.thickness > 0.0 )
    {
        if ( LidProcs[j].storage.voidFrac <= 0.0 ||
             LidProcs[j].storage.voidFrac > 1.0 )
        {
            strcpy(Msg, LidProcs[j].ID);
            strcat(Msg, ERR_STOR_LAYER);
            report_writeErrorMsg(ERR_LID_PARAMS, Msg);
        }
    }

    //... if no storage layer adjust void fraction and drain offset 
    else
    {    
        LidProcs[j].storage.voidFrac = 1.0;
        LidProcs[j].drain.offset = 0.0;
    }

    //... check for invalid drain open/closed heads                            //(5.1.013)
    if (LidProcs[j].drain.hOpen > 0.0 &&                                       //
        LidProcs[j].drain.hOpen <= LidProcs[j].drain.hClose)                   //
    {                                                                          //
        strcpy(Msg, LidProcs[j].ID);                                           //
        strcat(Msg, ERR_DRAIN_HEADS);                                          //
        report_writeErrorMsg(ERR_LID_PARAMS, Msg);                             //
    }                                                                          //

    //... compute the surface layer's overland flow constant (alpha)
    if ( LidProcs[j].lidType == VEG_SWALE )
    {
        if ( LidProcs[j].surface.roughness * 
             LidProcs[j].surface.surfSlope <= 0.0 ||
             LidProcs[j].surface.thickness == 0.0
           )
        {
            strcpy(Msg, LidProcs[j].ID);
            strcat(Msg, ERR_SWALE_SURF);
            report_writeErrorMsg(ERR_LID_PARAMS, Msg);
        }
        else LidProcs[j].surface.alpha = 
            1.49 * Math.sqrt(LidProcs[j].surface.surfSlope) /
                LidProcs[j].surface.roughness;
    }
    else
    {
        //... compute surface overland flow coeff.
        if ( LidProcs[j].surface.roughness > 0.0 )
            LidProcs[j].surface.alpha = 1.49 / LidProcs[j].surface.roughness *
                                        Math.sqrt(LidProcs[j].surface.surfSlope);
        else LidProcs[j].surface.alpha = 0.0;
    }

    //... compute drainage mat layer's flow coeff.
    if ( LidProcs[j].drainMat.roughness > 0.0 )
    {
        LidProcs[j].drainMat.alpha = 1.49 / LidProcs[j].drainMat.roughness *
                                    Math.sqrt(LidProcs[j].surface.surfSlope);
    }
    else LidProcs[j].drainMat.alpha = 0.0;


    //... convert clogging factors to void volume basis
    if ( LidProcs[j].pavement.thickness > 0.0 )
    {
        LidProcs[j].pavement.clogFactor *= 
            LidProcs[j].pavement.thickness * LidProcs[j].pavement.voidFrac *
            (1.0 - LidProcs[j].pavement.impervFrac);
    }
    if ( LidProcs[j].storage.thickness > 0.0 )
    {
        LidProcs[j].storage.clogFactor *=
            LidProcs[j].storage.thickness * LidProcs[j].storage.voidFrac;
    }
    else LidProcs[j].storage.clogFactor = 0.0;

    //... for certain LID types, immediate overflow of excess surface water
    //    occurs if either the surface roughness or slope is zero
    LidProcs[j].surface.canOverflow = true;
    switch (LidProcs[j].lidType)
    {
        case ROOF_DISCON: LidProcs[j].surface.canOverflow = false; break;
        case INFIL_TRENCH:
        case POROUS_PAVEMENT:
        case BIO_CELL:
        case RAIN_GARDEN:
        case GREEN_ROOF:
            if ( LidProcs[j].surface.alpha > 0.0 )
                LidProcs[j].surface.canOverflow = false;
    }

    //... rain barrels have 100% void space and impermeable bottom
    if ( LidProcs[j].lidType == RAIN_BARREL )
    {
        LidProcs[j].storage.voidFrac = 1.0;
        LidProcs[j].storage.kSat = 0.0;
    }

    //... set storage layer parameters of a green roof 
    if ( LidProcs[j].lidType == GREEN_ROOF )
    {
        LidProcs[j].storage.thickness = LidProcs[j].drainMat.thickness;
        LidProcs[j].storage.voidFrac = LidProcs[j].drainMat.voidFrac;
        LidProcs[j].storage.clogFactor = 0.0;
        LidProcs[j].storage.kSat = 0.0;
    }
}

//=============================================================================
// int j
function validateLidGroup(j)
//
//  Purpose: validates properties of LID units grouped in a subcatchment.
//  Input:   j = subcatchment index 
//  Output:  returns 1 if data are valid, 0 if not
//
{
    let        k;
    let     p = new Array(3);
    let     totalArea = Subcatch[j].area;
    let     totalLidArea = 0.0;
    let     fromImperv = 0.0;
    let     fromPerv = 0.0;                                                 //(5.1.013)
    let  lidUnit;  //TLidUnit*
    let  lidList;  //TLidList*
    let  lidGroup; //TLidGroup  

    lidGroup = LidGroups[j];
    if ( lidGroup == null ) return;
    lidList = lidGroup.lidList;
    while ( lidList )
    {
        lidUnit = lidList.lidUnit;
        k = lidUnit.lidIndex;

        //... update contributing fractions
        totalLidArea += (lidUnit.area * lidUnit.number);
        fromImperv += lidUnit.fromImperv;
        fromPerv += lidUnit.fromPerv;                                         //(5.1.013)

        //... assign biocell soil layer infiltration parameters
        lidUnit.soilInfil.Ks = 0.0;
        if ( LidProcs[k].soil.thickness > 0.0 )
        {
            p[0] = LidProcs[k].soil.suction * UCF(RAINDEPTH);
            p[1] = LidProcs[k].soil.kSat * UCF(RAINFALL);
            p[2] = (LidProcs[k].soil.porosity - LidProcs[k].soil.wiltPoint) *
                   (1.0 - lidUnit.initSat);
            if ( grnampt_setParams((lidUnit.soilInfil), p) == false )
            {
                strcpy(Msg, LidProcs[k].ID);
                strcat(Msg, ERR_SOIL_LAYER);
                report_writeErrorMsg(ERR_LID_PARAMS, Msg);
            }
        }
        
        //... assign vegetative swale infiltration parameters
        if ( LidProcs[k].lidType == VEG_SWALE )
        {
            if ( Subcatch[j].infilModel == GREEN_AMPT ||                       //(5.1.015)
                 Subcatch[j].infilModel == MOD_GREEN_AMPT )                    //(5.1.015)
            {
                grnampt_getParams(j, p);                                       //(5.1.015)
                if ( grnampt_setParams((lidUnit.soilInfil), p) == false )
                {
                    strcpy(Msg, LidProcs[k].ID);
                    strcat(Msg, ERR_GREEN_AMPT);
                    report_writeErrorMsg(ERR_LID_PARAMS, Msg);
                }
            }
            if ( lidUnit.fullWidth <= 0.0 )
            {
                strcpy(Msg, LidProcs[k].ID);
                strcat(Msg, ERR_SWALE_WIDTH);
                report_writeErrorMsg(ERR_LID_PARAMS, Msg);
            }
        }

        //... LID unit cannot send outflow back to subcatchment's
        //    pervious area if none exists
        if ( Subcatch[j].fracImperv >= 0.999 ) lidUnit.toPerv = 0;

        //... assign drain outlet if not set by user
        if ( lidUnit.drainNode == -1 && lidUnit.drainSubcatch == -1 )
        {
            lidUnit.drainNode = Subcatch[j].outNode;
            lidUnit.drainSubcatch = Subcatch[j].outSubcatch;
        }
        lidList = lidList.nextLidUnit;
    }

    //... check contributing area fractions
    if ( totalLidArea > 1.001 * totalArea )
    {
        report_writeErrorMsg(ERR_LID_AREAS, Subcatch[j].ID);
    }
    if ( fromImperv > 1.001 || fromPerv > 1.001 )                              //(5.1.013)
    {
        report_writeErrorMsg(ERR_LID_CAPTURE_AREA, Subcatch[j].ID);
    }

    //... Make subcatchment LID area equal total area if the two are close
    if ( totalLidArea > 0.999 * totalArea ) totalLidArea = totalArea;
    Subcatch[j].lidArea = totalLidArea;
}

//=============================================================================

function lid_initState()
//
//  Purpose: initializes the internal state of each LID in a subcatchment.
//  Input:   none 
//  Output:  none
//
{
    let i, j, k;
    let  lidUnit; //TLidUnit*
    let  lidList; // TLidList*
    let  lidGroup; //TLidGroup
    let     initVol;
    let     initDryTime = StartDryDays * SECperDAY;

    HasWetLids = false;
    for (j = 0; j < GroupCount; j++)
    {
        //... check if group exists
        lidGroup = LidGroups[j];
        if ( lidGroup == null ) continue;

        //... initialize group variables
        lidGroup.pervArea = 0.0;
        lidGroup.flowToPerv = 0.0;
        lidGroup.oldDrainFlow = 0.0;
        lidGroup.newDrainFlow = 0.0;

        //... examine each LID in the group
        lidList = lidGroup.lidList;
        while ( lidList )
        {
            //... initialize depth & moisture content
            lidUnit = lidList.lidUnit;
            k = lidUnit.lidIndex;
            lidUnit.surfaceDepth = 0.0;
            lidUnit.storageDepth = 0.0;
            lidUnit.soilMoisture = 0.0;
            lidUnit.paveDepth = 0.0;
            lidUnit.dryTime = initDryTime;
            lidUnit.volTreated = 0.0;                                         //(5.1.013)
            lidUnit.nextRegenDay = LidProcs[k].pavement.regenDays;            //
            initVol = 0.0;
            if ( LidProcs[k].soil.thickness > 0.0 )
            {
                lidUnit.soilMoisture = LidProcs[k].soil.wiltPoint + 
                    lidUnit.initSat * (LidProcs[k].soil.porosity -
                    LidProcs[k].soil.wiltPoint);
                initVol += lidUnit.soilMoisture * LidProcs[k].soil.thickness;
            }
            if ( LidProcs[k].storage.thickness > 0.0 )
            {
                lidUnit.storageDepth = lidUnit.initSat *
                    LidProcs[k].storage.thickness;
                initVol += lidUnit.storageDepth * LidProcs[k].storage.voidFrac;
            }
            if ( LidProcs[k].drainMat.thickness > 0.0 )
            {
                lidUnit.storageDepth = lidUnit.initSat *
                    LidProcs[k].drainMat.thickness;
                initVol += lidUnit.storageDepth * LidProcs[k].drainMat.voidFrac;
            }
            if ( lidUnit.initSat > 0.0 ) HasWetLids = true;

            //... initialize water balance totals
            lidproc_initWaterBalance(lidUnit, initVol);
            lidUnit.volTreated = 0.0;

            //... initialize report file for the LID
            if ( lidUnit.rptFile )
            {
                initLidRptFile(Title[0], LidProcs[k].ID, Subcatch[j].ID, lidUnit);
            }

            //... initialize drain flows
            lidUnit.oldDrainFlow = 0.0;
            lidUnit.newDrainFlow = 0.0;

            //... set previous flux rates to 0
            for (i = 0; i < MAX_LAYERS; i++)
            {    
                lidUnit.oldFluxRates[i] = 0.0;
            }

            //... initialize infiltration state variables
            if ( lidUnit.soilInfil.Ks > 0.0 )
                grnampt_initState((lidUnit.soilInfil));

            //... add contribution to pervious LID area
            if ( isLidPervious(lidUnit.lidIndex) )
                lidGroup.pervArea += (lidUnit.area * lidUnit.number);
            lidList = lidList.nextLidUnit;
        }
    }
}

//=============================================================================
//int j
function  lid_setOldGroupState(j)
//
//  Purpose: saves the current drain flow rate for the LIDs in a subcatchment.
//  Input:   j = subcatchment index 
//  Output:  none
//
{
    let  lidList;  //TLidList*
    if ( LidGroups[j] != null )
    {
        LidGroups[j].oldDrainFlow = LidGroups[j].newDrainFlow;
        LidGroups[j].newDrainFlow = 0.0;
        lidList = LidGroups[j].lidList;
        while (lidList)
        {
            lidList.lidUnit.oldDrainFlow = lidList.lidUnit.newDrainFlow;
            lidList.lidUnit.newDrainFlow = 0.0;
            lidList = lidList.nextLidUnit;
        }
    }
}

//=============================================================================
//int k
function isLidPervious(k)
//
//  Purpose: determines if a LID process allows infiltration or not.
//  Input:   k = LID process index 
//  Output:  returns 1 if process is pervious or 0 if not
//
{
    return ( LidProcs[k].storage.thickness == 0.0 ||
             LidProcs[k].storage.kSat > 0.0 );
}

//=============================================================================
// int j
function getSurfaceDepth(j)
//
//  Purpose: computes the depth (volume per unit area) of ponded water on the
//           surface of all LIDs within a subcatchment.
//  Input:   j = subcatchment index 
//  Output:  returns volumetric depth of ponded water (ft)
//
{
    let    k;
    let depth = 0.0;
    let  lidUnit;  //TLidUnit*
    let  lidList;  // TLidList*
    let lidGroup; //TLidGroup 

    lidGroup = LidGroups[j];
    if ( lidGroup == null ) return 0.0;
    if ( Subcatch[j].lidArea == 0.0 ) return 0.0;
    lidList = lidGroup.lidList;
    while ( lidList )
    {
        lidUnit = lidList.lidUnit;
        k = lidUnit.lidIndex;
        depth += lidUnit.surfaceDepth * LidProcs[k].surface.voidFrac *
                 lidUnit.area * lidUnit.number;
        lidList = lidList.nextLidUnit;
    }
    return depth / Subcatch[j].lidArea;
}

//=============================================================================
// int j
function lid_getPervArea(j)
//
//  Purpose: retrieves amount of pervious LID area in a subcatchment.
//  Input:   j = subcatchment index
//  Output:  returns amount of pervious LID area (ft2)
//
{
    if ( LidGroups[j] ) return LidGroups[j].pervArea;
    else return 0.0;
}

//=============================================================================
// int j
function   lid_getFlowToPerv(j)
//
//  Purpose: retrieves flow returned from LID treatment to pervious area of
//           a subcatchment.
//  Input:   j = subcatchment index
//  Output:  returns flow returned to pervious area (cfs)
//
{
    if ( LidGroups[j] != null ) return LidGroups[j].flowToPerv;
    return 0.0;
}

//=============================================================================
// int j
function lid_getStoredVolume(j)
//
//  Purpose: computes stored volume of water for all LIDs 
//           grouped within a subcatchment.
//  Input:   j = subcatchment index 
//  Output:  returns stored volume of water (ft3)
//
{
    let total = 0.0;
    let  lidUnit; // TLidUnit*
    let  lidList;  // TLidList*
    let  lidGroup; // TLidGroup

    lidGroup = LidGroups[j];
    if ( lidGroup == null || Subcatch[j].lidArea == 0.0 ) return 0.0;
    lidList = lidGroup.lidList;
    while ( lidList )
    {
        lidUnit = lidList.lidUnit;
        total += lidUnit.waterBalance.finalVol * lidUnit.area * lidUnit.number;
        lidList = lidList.nextLidUnit;
    }
    return total;
}

//=============================================================================
// int j, int timePeriod
function  lid_getDrainFlow(j, timePeriod)
//
//  Purpose: returns flow from all of a subcatchment's LID drains for
//           a designated time period
//  Input:   j = subcatchment index 
//           timePeriod = either PREVIOUS or CURRENT
//  Output:  total drain flow (cfs) from the subcatchment.
{
    if ( LidGroups[j] != null )
    {
        if ( timePeriod == PREVIOUS ) return LidGroups[j].oldDrainFlow;
        else return LidGroups[j].newDrainFlow;
    }
    return 0.0;
}

//=============================================================================

////  This function was modified for relelase 5.1.013.  ////                   //(5.1.013)
// int j, double c[], double tStep
function  lid_addDrainLoads(j, c, tStep)
//
//  Purpose: adds pollutant loads routed from drains to system
//           mass balance totals.
//  Input:   j = subcatchment index
//           c = array of pollutant washoff concentrations (mass/L)
//           tStep =  time step (sec)
//  Output:  none.
//
{
    let    isRunoffLoad;     // true if drain becomes external runoff load
    let    p;                // pollutant index
    let r;                // pollutant fractional removal 
    let w;                // pollutant mass load (lb or kg)
    let  lidUnit; // TLidUnit*
    let  lidList; // TLidList*
    let  lidGroup;  // TLidGroup

    //... check if LID group exists
    lidGroup = LidGroups[j];
    if ( lidGroup != null )
    {
        //... examine each LID unit in the group
        lidList = lidGroup.lidList;
        while ( lidList )
        {
            lidUnit = lidList.lidUnit;
 
            //... see if unit's drain flow becomes external runoff
            isRunoffLoad = (lidUnit.drainNode >= 0 ||
                            lidUnit.drainSubcatch == j);
            
            //... for each pollutant not routed back on to subcatchment surface
            if (!lidUnit.toPerv) for (p = 0; p < Nobjects[POLLUT]; p++)
            {
                //... get mass load flowing through the drain
                w = lidUnit.newDrainFlow * c[p] * tStep * LperFT3 * Pollut[p].mcf;

                //... get fractional removal for this load
                r = LidProcs[lidUnit.lidIndex].drainRmvl[p];

                //... update system mass balance totals
                massbal_updateLoadingTotals(BMP_REMOVAL_LOAD, p, r*w);
                if (isRunoffLoad)
                    massbal_updateLoadingTotals(RUNOFF_LOAD, p, w*(1.0 - r));
            }

            // process next LID unit in the group
            lidList = lidList.nextLidUnit;
        }
    }
}

//=============================================================================
// int j
function lid_addDrainRunon(j)
//
//  Purpose: adds drain flows from LIDs in a given subcatchment to the
//           subcatchments that were designated to receive them 
//  Input:   j = index of subcatchment contributing underdrain flows
//  Output:  none.
//
{
    let i;                   // index of an LID unit's LID process             //(5.1.013)
    let k;                   // index of subcatchment receiving LID drain flow
    let p;                   // pollutant index
    let q;                // drain flow rate (cfs)
    let w;                // mass of polllutant from drain flow             //(5.1.013)
    let  lidUnit; // TLidUnit*
    let  lidList; // TLidList*
    let  lidGroup;  // TLidGroup

    //... check if LID group exists
    lidGroup = LidGroups[j];
    if ( lidGroup != null )
    {
        //... examine each LID in the group
        lidList = lidGroup.lidList;
        while ( lidList )
        {
            //... see if LID's drain discharges to another subcatchment
            lidUnit = lidList.lidUnit;
            i = lidUnit.lidIndex;                                             //(5.1.013)
            k = lidUnit.drainSubcatch;
            if ( k >= 0 && k != j )
            {
                //... distribute drain flow across subcatchment's areas
                q = lidUnit.oldDrainFlow;
                subcatch_addRunonFlow(k, q);

                //... add pollutant loads from drain to subcatchment
                //    (newQual[] contains loading rate (mass/sec) at this
                //    point which is converted later on to a concentration)
                for (p = 0; p < Nobjects[POLLUT]; p++)
                {
                    w = q * Subcatch[j].oldQual[p] * LperFT3;                  //(5.1.013)
                    w = w * (1.0 - LidProcs[i].drainRmvl[p]);                  //
                    Subcatch[k].newQual[p] += w;                               //
                }
            }
            lidList = lidList.nextLidUnit;
        }
    }
}

//=============================================================================
// int j, double f
function  lid_addDrainInflow(j, f)
//
//  Purpose: adds LID drain flow to conveyance system nodes 
//  Input:   j = subcatchment index
//           f = time interval weighting factor
//  Output:  none.
//
//  Note:    this function updates the total lateral flow (Node[].newLatFlow)
//           and pollutant mass (Node[].newQual[]) inflow seen by nodes that
//           receive drain flow from the LID units in subcatchment j.
{
    let        i,            // LID process index                              //(5.1.013)
               k,            // node index
               p;            // pollutant index
    let     q,            // drain flow (cfs)
               w, w1, w2;    // pollutant mass loads (mass/sec)
    let  lidUnit; // TLidUnit*
    let  lidList; // TLidList*
    let  lidGroup; // TLidGroup

    //... check if LID group exists
    lidGroup = LidGroups[j];
    if ( lidGroup != null )
    {
        //... examine each LID in the group
        lidList = lidGroup.lidList;
        while ( lidList )
        {
            //... see if LID's drain discharges to conveyance system node
            lidUnit = lidList.lidUnit;
            i = lidUnit.lidIndex;                                             //(5.1.013)
            k = lidUnit.drainNode;
            if ( k >= 0 )
            {
                //... add drain flow to node's wet weather inflow
                q = (1.0 - f) * lidUnit.oldDrainFlow + f * lidUnit.newDrainFlow;
                Node[k].newLatFlow += q;
                massbal_addInflowFlow(WET_WEATHER_INFLOW, q);

                //... add pollutant load, based on parent subcatchment quality 
                for (p = 0; p < Nobjects[POLLUT]; p++)
                {
                    //... get previous & current drain loads
                    w1 = lidUnit.oldDrainFlow * Subcatch[j].oldQual[p];
                    w2 = lidUnit.newDrainFlow * Subcatch[j].newQual[p]; 

                    //... add interpolated load to node's wet weather loading
                    w = (1.0 - f) * w1 + f * w2;
                    w = w * (1.0 - LidProcs[i].drainRmvl[p]);                  //(5.1.013)
                    Node[k].newQual[p] += w;
                    massbal_addInflowQual(WET_WEATHER_INFLOW, p, w);
                }
            }
            lidList = lidList.nextLidUnit;
        }
    }
}

//=============================================================================
// int j, double tStep
function lid_getRunoff(j, tStep)
//
//  Purpose: computes runoff and drain flows from the LIDs in a subcatchment.
//  Input:   j     = subcatchment index 
//           tStep = time step (sec)
//  Output:  updates following global quantities after LID treatment applied:
//           Vevap, Vpevap, VlidInfil, VlidIn, VlidOut, VlidDrain.
//
{
    let  theLidGroup; // TLidGroup      // group of LIDs placed in the subcatchment
    let  lidList;    // TLidList*       // list of LID units in the group
    let  lidUnit;    // TLidUnit*       // a member of the list of LID units
    let lidArea;               // area of an LID unit
    let qImperv = 0.0;         // runoff from impervious areas (cfs)
    let qPerv = 0.0;           // runoff from pervious areas (cfs)          //(5.1.013)
    let lidInflow = 0.0;       // inflow to an LID unit (ft/s) 
    let qRunoff = 0.0;         // surface runoff from all LID units (cfs)
    let qDrain = 0.0;          // drain flow from all LID units (cfs)
    let qReturn = 0.0;         // LID outflow returned to pervious area (cfs) 

    //... return if there are no LID's
    theLidGroup = LidGroups[j];
    if ( !theLidGroup ) return;
    lidList = theLidGroup.lidList;
    if ( !lidList ) return;

    //... determine if evaporation can occur
    EvapRate = Evap.rate;
    if ( Evap.dryOnly && Subcatch[j].rainfall > 0.0 ) EvapRate = 0.0;

    //... find subcatchment's infiltration rate into native soil
    findNativeInfil(j, tStep);

    //... get impervious and pervious area runoff from non-LID
    //    portion of subcatchment (cfs)
    if ( Subcatch[j].area > Subcatch[j].lidArea )
    {    
        qImperv = getImpervAreaRunoff(j);
        qPerv = getPervAreaRunoff(j);                                          //(5.1.013)
    }

    //... evaluate performance of each LID unit placed in the subcatchment
    while ( lidList )
    {
        //... find area of the LID unit
        lidUnit = lidList.lidUnit;
        lidArea = lidUnit.area * lidUnit.number;

        //... if LID unit has area, evaluate its performance
        if ( lidArea > 0.0 )
        {
            //... find runoff from non-LID area treated by LID area (ft/sec)
            lidInflow = (qImperv * lidUnit.fromImperv +                       //(5.1.013)
                         qPerv * lidUnit.fromPerv) / lidArea;                 //

            //... update total runoff volume treated
            VlidIn += lidInflow * lidArea * tStep;

            //... add rainfall onto LID inflow (ft/s)
            lidInflow = lidInflow + Subcatch[j].rainfall;

            // ... add upstream runon only if LID occupies full subcatchment
            if ( Subcatch[j].area == Subcatch[j].lidArea )
            {
                lidInflow += Subcatch[j].runon;
            }

            //... evaluate the LID unit's performance, updating the LID group's
            //    total surface runoff, drain flow, and flow returned to
            //    pervious area 
            evalLidUnit(j, lidUnit, lidArea, lidInflow, tStep,
                        qRunoff, qDrain, qReturn);
        }
        lidList = lidList.nextLidUnit;
    }

    //... save the LID group's total drain & return flows
    theLidGroup.newDrainFlow = qDrain;
    theLidGroup.flowToPerv = qReturn;

    //... save the LID group's total surface, drain and return flow volumes
    VlidOut = qRunoff * tStep; 
    VlidDrain = qDrain * tStep;
    VlidReturn = qReturn * tStep;
}

//=============================================================================
// int j, double tStep
function findNativeInfil(j, tStep)
//
//  Purpose: determines a subcatchment's current infiltration rate into
//           its native soil.
//  Input:   j = subcatchment index
//           tStep    = time step (sec)
//  Output:  sets values for module-level variables NativeInfil
//
{
    let nonLidArea;

    //... subcatchment has non-LID pervious area
    nonLidArea = Subcatch[j].area - Subcatch[j].lidArea;
    if ( nonLidArea > 0.0 && Subcatch[j].fracImperv < 1.0 )
    {
        NativeInfil = Vinfil / nonLidArea / tStep;
    }

    //... otherwise find infil. rate for the subcatchment's rainfall + runon
    else
    {
        NativeInfil = infil_getInfil(j, tStep,
                                     Subcatch[j].rainfall,
                                     Subcatch[j].runon,
                                     getSurfaceDepth(j));                      //(5.1.015)
    }

    //... see if there is any groundwater-imposed limit on infil.
    if ( !IgnoreGwater && Subcatch[j].groundwater )
    {
        MaxNativeInfil = Subcatch[j].groundwater.maxInfilVol / tStep;
    }
    else MaxNativeInfil = BIG;
}

//=============================================================================
// int j
function getImpervAreaRunoff(j)
//
//  Purpose: computes runoff from impervious area of a subcatchment that
//           is available for LID treatment.
//  Input:   j = subcatchment index
//  Output:  returns runoff flow rate (cfs)
//
{
    let    i;
    let q = 0.0,          // runoff rate (ft/sec)
           nonLidArea;       // non-LID area (ft2)

    // --- runoff from impervious area w/ & w/o depression storage
    for (i = IMPERV0; i <= IMPERV1; i++)
    {
        q += Subcatch[j].subArea[i].runoff * Subcatch[j].subArea[i].fArea;
    }

    // --- adjust for any fraction of runoff sent to pervious area
    if ( Subcatch[j].subArea[IMPERV0].routeTo == TO_PERV &&
         Subcatch[j].fracImperv < 1.0 )
    {
        q *= Subcatch[j].subArea[IMPERV0].fOutlet;
    }
    nonLidArea = Subcatch[j].area - Subcatch[j].lidArea;
    return q * nonLidArea;
}

//=============================================================================

////  This function was added for release 5.1.013.  ////                       //(5.1.013)
// int j
function getPervAreaRunoff(j)
//
//  Purpose: computes runoff from pervious area of a subcatchment that
//           is available for LID treatment.
//  Input:   j = subcatchment index
//  Output:  returns runoff flow rate (cfs)
//
{
    let q = 0.0,          // runoff rate (ft/sec)
           nonLidArea;       // non-LID area (ft2)

    // --- runoff from pervious area
    q = Subcatch[j].subArea[PERV].runoff * Subcatch[j].subArea[PERV].fArea;

    // --- adjust for any fraction of runoff sent to impervious area
    if (Subcatch[j].subArea[PERV].routeTo == TO_IMPERV &&
        Subcatch[j].fracImperv > 0.0)
    {
        q *= Subcatch[j].subArea[PERV].fOutlet;
    }
    nonLidArea = Subcatch[j].area - Subcatch[j].lidArea;
    return q * nonLidArea;
}

//=============================================================================
// int j, TLidUnit* lidUnit, double lidArea, double lidInflow,
//    double tStep, double *qRunoff, double *qDrain, double *qReturn
function evalLidUnit(j, lidUnit, lidArea, lidInflow,
     tStep, qRunoff, qDrain, qReturn)
//
//  Purpose: evaluates performance of a specific LID unit over current time step.
//  Input:   j         = subcatchment index
//           lidUnit   = ptr. to LID unit being evaluated
//           lidArea   = area of LID unit
//           lidInflow = inflow to LID unit (ft/s)
//           tStep     = time step (sec)
//  Output:  qRunoff   = sum of surface runoff from all LIDs (cfs)
//           qDrain    = sum of drain flows from all LIDs (cfs)
//           qReturn   = sum of LID flows returned to pervious area (cfs)
//
{
    let lidProc;   // TLidProc*    // LID process associated with lidUnit
    let lidRunoff,        // surface runoff from LID unit (cfs)
           lidEvap,          // evaporation rate from LID unit (ft/s)
           lidInfil,         // infiltration rate from LID unit (ft/s)
           lidDrain;         // drain flow rate from LID unit (ft/s & cfs)

    //... identify the LID process of the LID unit being analyzed
    lidProc = LidProcs[lidUnit.lidIndex];

    //... initialize evap and infil losses
    lidEvap = 0.0;
    lidInfil = 0.0;

    //... find surface runoff from the LID unit (in cfs)
    lidRunoff = lidproc_getOutflow(lidUnit, lidProc, lidInflow, EvapRate,
                                  NativeInfil, MaxNativeInfil, tStep,
                                  lidEvap, lidInfil, lidDrain) * lidArea;
    
    //... convert drain flow to CFS
    lidDrain *= lidArea;

    //... revise flows if LID outflow returned to pervious area
    if ( lidUnit.toPerv && Subcatch[j].area > Subcatch[j].lidArea )
    {
        //... surface runoff is always returned
        qReturn += lidRunoff;
        lidRunoff = 0.0;

        //... drain flow returned if it has same outlet as subcatchment
        if ( lidUnit.drainNode == Subcatch[j].outNode &&
            lidUnit.drainSubcatch == Subcatch[j].outSubcatch )
        {
            qReturn += lidDrain;
            lidDrain = 0.0;
        }
    }
 
    //... update system flow balance if drain flow goes to a
    //    conveyance system node
    if ( lidUnit.drainNode >= 0 )
    {
        massbal_updateRunoffTotals(RUNOFF_DRAINS, lidDrain * tStep);
    }

    //... save new drain outflow
    lidUnit.newDrainFlow = lidDrain;

    //... update moisture losses (ft3)
    Vevap  += lidEvap * tStep * lidArea;
    VlidInfil += lidInfil * tStep * lidArea;
    if ( isLidPervious(lidUnit.lidIndex) )
    {
        Vpevap += lidEvap * tStep * lidArea;
    }

    //... update time since last rainfall (for Rain Barrel emptying)
    if ( Subcatch[j].rainfall > MIN_RUNOFF ) lidUnit.dryTime = 0.0;
    else lidUnit.dryTime += tStep;

    //... update LID water balance and save results
    lidproc_saveResults(lidUnit, UCF(RAINFALL), UCF(RAINDEPTH));

    //... update LID group totals
    qRunoff += lidRunoff;
    qDrain += lidDrain;
}

//=============================================================================

function lid_writeWaterBalance()
//
//  Purpose: writes a LID performance summary table to the project's report file.
//  Input:   none
//  Output:  none
//
{
    let        j;
    let        k = 0;
    let     ucf = UCF(RAINDEPTH);
    let     inflow;
    let     outflow;
    let     err;
    let  lidUnit; // TLidUnit*
    let  lidList; // TLidList*
    let  lidGroup; // TLidGroup

    // String formatting values
    let val1, val2, val3, val4, val5, val6, val7

    //... check that project has LIDs
    for ( j = 0; j < GroupCount; j++ )
    {
        if ( LidGroups[j] ) k++;
    }
    if ( k == 0 ) return;

    //... write table header
    Frpt.contents +=
    `\n`
    +`\n  ***********************`
    +`\n  LID Performance Summary`
    +`\n  ***********************\n`;

    Frpt.contents +=
`\n  --------------------------------------------------------------------------------------------------------------------`
+`\n                                         Total      Evap     Infil   Surface    Drain    Initial     Final  Continuity`
+`\n                                        Inflow      Loss      Loss   Outflow   Outflow   Storage   Storage       Error`;
    if ( UnitSystem == US ) Frpt.contents +=
`\n  Subcatchment      LID Control             in        in        in        in        in        in        in           %%`;
    else Frpt.contents +=
+`\n  Subcatchment      LID Control             mm        mm        mm        mm        mm        mm        mm           %%`;
    Frpt.contents +=
+`\n  --------------------------------------------------------------------------------------------------------------------`;

    //... examine each LID unit in each subcatchment
    for ( j = 0; j < GroupCount; j++ )
    {
        lidGroup = LidGroups[j];
        if ( !lidGroup || Subcatch[j].lidArea == 0.0 ) continue;
        lidList = lidGroup.lidList;
        while ( lidList )
        {
            //... write water balance components to report file
            lidUnit = lidList.lidUnit;
            k = lidUnit.lidIndex;

            val1 = Subcatch[j].ID.padEnd(16, ' ')
            val2 = LidProcs[k].ID.padEnd(16, ' ')
            Frpt.contents += `\n  ${val1}  ${val2}`

            val1 = (lidUnit.waterBalance.inflow*ucf).toFixed(2).padStart(10)
            val2 = (lidUnit.waterBalance.evap*ucf).toFixed(2).padStart(10)
            val3 = (lidUnit.waterBalance.infil*ucf).toFixed(2).padStart(10)
            val4 = (lidUnit.waterBalance.surfFlow*ucf).toFixed(2).padStart(10)
            val5 = (lidUnit.waterBalance.drainFlow*ucf).toFixed(2).padStart(10)
            val6 = (lidUnit.waterBalance.initVol*ucf).toFixed(2).padStart(10)
            val7 = (lidUnit.waterBalance.finalVol*ucf).toFixed(2).padStart(10)
            Frpt.contents += `${val1}${val2}${val3}${val4}${val5}${val6}${val7}`

            //... compute flow balance error
            inflow = lidUnit.waterBalance.initVol + 
                     lidUnit.waterBalance.inflow;
            outflow = lidUnit.waterBalance.finalVol +
                      lidUnit.waterBalance.evap +
                      lidUnit.waterBalance.infil +
                      lidUnit.waterBalance.surfFlow +
                      lidUnit.waterBalance.drainFlow;
            if ( inflow > 0.0 ) err = (inflow - outflow) / inflow;
            else                err = 1.0;
            Frpt.contents += `  ${(err*100.0).toFixed(2).padStart(10)}`;
            lidList = lidList.nextLidUnit;
        }
    }
}

//=============================================================================
// char* title, char* lidID, char* subcatchID, TLidUnit* lidUnit
function initLidRptFile(title, lidID, subcatchID, lidUnit)
//
//  Purpose: initializes the report file used for a specific LID unit
//  Input:   title = project's title
//           lidID = LID process name
//           subcatchID = subcatchment ID name
//           lidUnit = ptr. to LID unit
//  Output:  none
//
{
    let colCount = 14;
    let head1 = [
        "\n                    \t", "  Elapsed\t",
        "    Total\t", "    Total\t", "  Surface\t", " Pavement\t", "     Soil\t",
        "  Storage\t", "  Surface\t", "    Drain\t", "  Surface\t", " Pavement\t",
        "     Soil\t", "  Storage"];
    let head2 = [
        "\n                    \t", "     Time\t",
        "   Inflow\t", "     Evap\t", "    Infil\t", "     Perc\t", "     Perc\t",
        "    Exfil\t", "   Runoff\t", "  OutFlow\t", "    Level\t", "    Level\t",
        " Moisture\t", "    Level"];
    let units1 = [
        "\nDate        Time    \t", "    Hours\t",
        "    in/hr\t", "    in/hr\t", "    in/hr\t", "    in/hr\t", "    in/hr\t",
        "    in/hr\t", "    in/hr\t", "    in/hr\t", "   inches\t", "   inches\t",
        "  Content\t", "   inches"];
    let units2 = [
        "\nDate        Time    \t", "    Hours\t",
        "    mm/hr\t", "    mm/hr\t", "    mm/hr\t", "    mm/hr\t", "    mm/hr\t",
        "    mm/hr\t", "    mm/hr\t", "    mm/hr\t", "       mm\t", "       mm\t",
        "  Content\t", "       mm"];
    let line9 = " ---------";
    let   i;
    let f = lidUnit.rptFile.contents; //FILE*

    //... check that file was opened
    if ( f ==  null ) return;

    //... write title lines
    f += "SWMM5 LID Report File\n"
    f += "\nProject:  " + title;
    f += "\nLID Unit: "+lidID+" in Subcatchment "+subcatchID+"\n"

    //... write column headings
    for ( i = 0; i < colCount; i++) f += head1[i];
    for ( i = 0; i < colCount; i++) f += head2[i];
    if (  UnitSystem == US )
    {
        for ( i = 0; i < colCount; i++) f += units1[i];
    }
    else for ( i = 0; i < colCount; i++) f += units2[i];
    f += "\n----------- --------";
    for ( i = 1; i < colCount; i++) f += "\t" + line9;

    //... initialize LID dryness state
    lidUnit.rptFile.wasDry = 1;
    lidUnit.rptFile.results = "";
}

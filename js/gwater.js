//-----------------------------------------------------------------------------
//   gwater.c
//
//   Project:  EPA SWMM5
//   Version:  5.1
//   Date:     03/19/14  (Build 5.1.000)
//             09/15/14  (Build 5.1.007)
//             03/19/15  (Build 5.1.008)
//             08/05/15  (Build 5.1.010)
//   Author:   L. Rossman
//
//   Groundwater functions.
//
//   Build 5.1.007:
//   - User-supplied function for deep GW seepage flow added.
//   - New variable names for use in user-supplied GW flow equations added.
//
//   Build 5.1.008:
//   - More variable names for user-supplied GW flow equations added.
//   - Subcatchment area made into a shared variable.
//   - Evaporation loss initialized to 0.
//   - Support for collecting GW statistics added.
//
//   Build 5.1.010:
//   - Unsaturated hydraulic conductivity added to GW flow equation variables.
//
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
//  Constants
//-----------------------------------------------------------------------------
var GWTOL = 0.0001;    // ODE solver tolerance
var XTOL  = 0.001;     // tolerance for moisture & depth

//enum   GWstates {
var THETA = 0                // moisture content of upper GW zone
var LOWERDEPTH = 1;          // depth of lower saturated GW zone

//enum   GWvariables {
var gwvHGW = 0                        // water table height (ft)
var gwvHSW = 0                        // surface water height (ft)
var gwvHCB = 0                        // channel bottom height (ft)
var gwvHGS = 0                        // ground surface height (ft)
var gwvKS = 0                         // sat. hyd. condutivity (ft/s)
var gwvK = 0                          // unsat. hyd. conductivity (ft/s)
var gwvTHETA = 0                      // upper zone moisture content
var gwvPHI = 0                        // soil porosity
var gwvFI = 0                         // surface infiltration (ft/s) 
var gwvFU = 0                         // uper zone percolation rate (ft/s)
var gwvA = 0                          // subcatchment area (ft2)
var gwvMAX = 0 

// Names of GW variables that can be used in GW outflow expression
var GWVarWords = ["HGW", "HSW", "HCB", "HGS", "KS", "K",
                             "THETA", "PHI", "FI", "FU", "A", null];

//-----------------------------------------------------------------------------
//  Shared variables
//-----------------------------------------------------------------------------
//  NOTE: all flux rates are in ft/sec, all depths are in ft.
var Area;            // subcatchment area (ft2)
var Infil_gw;           // infiltration rate from surface
var MaxEvap;         // max. evaporation rate
var AvailEvap;       // available evaporation rate
var UpperEvap;       // evaporation rate from upper GW zone
var LowerEvap;       // evaporation rate from lower GW zone
var UpperPerc;       // percolation rate from upper to lower zone
var LowerLoss;       // loss rate from lower GW zone
var GWFlow;          // flow rate from lower zone to conveyance node
var MaxUpperPerc;    // upper limit on UpperPerc
var MaxGWFlowPos;    // upper limit on GWFlow when its positve
var MaxGWFlowNeg;    // upper limit on GWFlow when its negative
var FracPerv;        // fraction of surface that is pervious
var TotalDepth;      // total depth of GW aquifer
var Theta;           // moisture content of upper zone
var HydCon;          // unsaturated hydraulic conductivity (ft/s)
var Hgw;             // ht. of saturated zone
var Hstar;           // ht. from aquifer bottom to node invert
var Hsw;             // ht. from aquifer bottom to water surface
var Tstep;           // current time step (sec)
var A;     // TAquifer           // aquifer being analyzed
var GW;    // TGroundwater*      // groundwater object being analyzed
var LatFlowExpr; // MathExpr*    // user-supplied lateral GW flow expression
var DeepFlowExpr;// MathExpr*    // user-supplied deep GW flow expression

//-----------------------------------------------------------------------------
//  External Functions (declared in funcs.h)
//-----------------------------------------------------------------------------
//  gwater_readAquiferParams     (called by input_readLine)
//  gwater_readGroundwaterParams (called by input_readLine)
//  gwater_readFlowExpression    (called by input_readLine)
//  gwater_deleteFlowExpression  (called by deleteObjects in project.c)
//  gwater_validateAquifer       (called by swmm_open)
//  gwater_validate              (called by subcatch_validate) 
//  gwater_initState             (called by subcatch_initState)
//  gwater_getVolume             (called by massbal_open & massbal_getGwaterError)
//  gwater_getGroundwater        (called by getSubareaRunoff in subcatch.c)
//  gwater_getState              (called by saveRunoff in hotstart.c)
//  gwater_setState              (called by readRunoff in hotstart.c)

//=============================================================================
// int j, char* tok[], int ntoks
function gwater_readAquiferParams(j, tok, ntoks)
//
//  Input:   j = aquifer index
//           tok[] = array of string tokens
//           ntoks = number of tokens
//  Output:  returns error message
//  Purpose: reads aquifer parameter values from line of input data
//
//  Data line contains following parameters:
//    ID, porosity, wiltingPoint, fieldCapacity,     conductivity,
//    conductSlope, tensionSlope, upperEvapFraction, lowerEvapDepth,
//    gwRecession,  bottomElev,   waterTableElev,    upperMoisture
//    (evapPattern)
//
{
    let   i, p;
    let x = new Array(12);
    let id;
    // return facilitators
    let returnObj;
    let returnVal;

    // --- check that aquifer exists
    if ( ntoks < 13 ) return error_setInpError(ERR_ITEMS, "");
    id = project_findID(AQUIFER, tok[0]);
    if ( id == null ) return error_setInpError(ERR_NAME, tok[0]);

    // --- read remaining tokens as numbers
    for (i = 0; i < 11; i++) x[i] = 0.0;
    for (i = 1; i < 13; i++)
    {
        ////////////////////////////////////
        returnObj = {y: x[i-1]}
        returnVal = getDouble(tok[i], returnObj);
        x[i-1] = returnObj.y;
        ////////////////////////////////////
        if(!returnVal) 
        //if ( null == (x[i-1] = getDouble(tok[i])))
            return error_setInpError(ERR_NUMBER, tok[i]);
    }

    // --- read upper evap pattern if present
    p = -1;
    if ( ntoks > 13 )
    {
        p = project_findObject(TIMEPATTERN, tok[13]);
        if ( p < 0 ) return error_setInpError(ERR_NAME, tok[13]);
    }

    // --- assign parameters to aquifer object
    Aquifer[j].ID = id;
    Aquifer[j].porosity       = x[0];
    Aquifer[j].wiltingPoint   = x[1];
    Aquifer[j].fieldCapacity  = x[2];
    Aquifer[j].conductivity   = x[3] / UCF(RAINFALL);
    Aquifer[j].conductSlope   = x[4];
    Aquifer[j].tensionSlope   = x[5] / UCF(LENGTH);
    Aquifer[j].upperEvapFrac  = x[6];
    Aquifer[j].lowerEvapDepth = x[7] / UCF(LENGTH);
    Aquifer[j].lowerLossCoeff = x[8] / UCF(RAINFALL);
    Aquifer[j].bottomElev     = x[9] / UCF(LENGTH);
    Aquifer[j].waterTableElev = x[10] / UCF(LENGTH);
    Aquifer[j].upperMoisture  = x[11];
    Aquifer[j].upperEvapPat   = p;
    return 0;
}

//=============================================================================
// char* tok[], int ntoks
function gwater_readGroundwaterParams(tok, ntoks)
//
//  Input:   tok[] = array of string tokens
//           ntoks = number of tokens
//  Output:  returns error code
//  Purpose: reads groundwater inflow parameters for a subcatchment from
//           a line of input data.
//
//  Data format is:
//  subcatch  aquifer  node  surfElev  a1  b1  a2  b2  a3  fixedDepth +
//            (nodeElev  bottomElev  waterTableElev  upperMoisture )
//
{
    let    i, j, k, m, n;
    let x = new Array(11);
    let gw; // TGroundwater*
    // return facilitators
    let returnVal;
    let returnObj;

    // --- check that specified subcatchment, aquifer & node exist
    if ( ntoks < 3 ) return error_setInpError(ERR_ITEMS, "");
    j = project_findObject(SUBCATCH, tok[0]);
    if ( j < 0 ) return error_setInpError(ERR_NAME, tok[0]);

    // --- check for enough tokens
    if ( ntoks < 11 ) return error_setInpError(ERR_ITEMS, "");

    // --- check that specified aquifer and node exists
    k = project_findObject(AQUIFER, tok[1]);
    if ( k < 0 ) return error_setInpError(ERR_NAME, tok[1]);
    n = project_findObject(NODE, tok[2]);
    if ( n < 0 ) return error_setInpError(ERR_NAME, tok[2]);

    // -- read in the flow parameters
    for ( i = 0; i < 7; i++ )
    {
        ////////////////////////////////////
        returnObj = {y: x[i]}
        returnVal = getDouble(tok[i+3], returnObj);
        x[i] = returnObj.y;
        ////////////////////////////////////
        if(!returnVal) 
        //if ( null == (x[i] = getDouble(tok[i+3]))) 
            return error_setInpError(ERR_NUMBER, tok[i+3]);
    }

    // --- read in optional depth parameters
    for ( i = 7; i < 11; i++)
    {
        x[i] = MISSING;
        m = i + 3;
        if ( ntoks > m && tok[m] != '*' )
        {    
            ////////////////////////////////////
            returnObj = {y: x[i]}
            returnVal = getDouble(tok[m], returnObj);
            x[i] = returnObj.y;
            ////////////////////////////////////
            if(!returnVal) 
            //if (null == (x[i] = getDouble(tok[m]))) 
                return error_setInpError(ERR_NUMBER, tok[m]);
            if ( i < 10 ) x[i] /= UCF(LENGTH);
        }
    }

    // --- create a groundwater flow object
    if ( !Subcatch[j].groundwater )
    {
        //gw = (TGroundwater *) malloc(sizeof(TGroundwater));
        gw = new TGroundwater();
        if ( !gw ) return error_setInpError(ERR_MEMORY, "");
        Subcatch[j].groundwater = gw;
    }
    else gw = Subcatch[j].groundwater;

    // --- populate the groundwater flow object with its parameters
    gw.aquifer    = k;
    gw.node       = n;
    gw.surfElev   = x[0] / UCF(LENGTH);
    gw.a1         = x[1];
    gw.b1         = x[2];
    gw.a2         = x[3];
    gw.b2         = x[4];
    gw.a3         = x[5];
    gw.fixedDepth = x[6] / UCF(LENGTH);
    gw.nodeElev   = x[7];                       //already converted to ft.
    gw.bottomElev     = x[8];
    gw.waterTableElev = x[9];
    gw.upperMoisture  = x[10];
    return 0;
}

//=============================================================================
// char* tok[], int ntoks
function gwater_readFlowExpression(tok, ntoks)
//
//  Input:   tok[] = array of string tokens
//           ntoks = number of tokens
//  Output:  returns error code
//  Purpose: reads mathematical expression for lateral or deep groundwater
//           flow for a subcatchment from a line of input data.
//
//  Format is: subcatch LATERAL/DEEP <expr>
//     where subcatch is the ID of the subcatchment, LATERAL is for lateral
//     GW flow, DEEP is for deep GW flow and <expr> is any well-formed math
//     expression. 
//
{
    let   i, j, k;
    let  exprStr;
    let expr;  //MathExpr*

    // --- return if too few tokens
    if ( ntoks < 3 ) return error_setInpError(ERR_ITEMS, "");

    // --- check that subcatchment exists
    j = project_findObject(SUBCATCH, tok[0]);
    if ( j < 0 ) return error_setInpError(ERR_NAME, tok[0]);

    // --- check if expression is for lateral or deep GW flow
    k = 1;
    if ( match(tok[1], "LAT") ) k = 1;
    else if ( match(tok[1], "DEEP") ) k = 2;
    else return error_setInpError(ERR_KEYWORD, tok[1]);

    // --- concatenate remaining tokens into a single string
    strcpy(exprStr, tok[2]);
    for ( i = 3; i < ntoks; i++)
    {
        strcat(exprStr, " ");
        strcat(exprStr, tok[i]);
    }

    // --- delete any previous flow eqn.
    if ( k == 1 ) mathexpr_delete(Subcatch[j].gwLatFlowExpr);
    else          mathexpr_delete(Subcatch[j].gwDeepFlowExpr);

    // --- create a parsed expression tree from the string expr
    //     (getVariableIndex is the function that converts a GW
    //      variable's name into an index number) 
    expr = mathexpr_create(exprStr, getVariableIndex);
    if ( expr == null ) return error_setInpError(ERR_TREATMENT_EXPR, "");

    // --- save expression tree with the subcatchment
    if ( k == 1 ) Subcatch[j].gwLatFlowExpr = expr;
    else          Subcatch[j].gwDeepFlowExpr = expr;
    return 0;
}

//=============================================================================
// int j
function gwater_deleteFlowExpression(j)
//
//  Input:   j = subcatchment index
//  Output:  none
//  Purpose: deletes a subcatchment's custom groundwater flow expressions.
//
{
    mathexpr_delete(Subcatch[j].gwLatFlowExpr);
    mathexpr_delete(Subcatch[j].gwDeepFlowExpr);
}

//=============================================================================
// int j
function  gwater_validateAquifer(j)
//
//  Input:   j = aquifer index
//  Output:  none
//  Purpose: validates groundwater aquifer properties .
//
{
	let p;

    if ( Aquifer[j].porosity          <= 0.0 
    ||   Aquifer[j].fieldCapacity     >= Aquifer[j].porosity
    ||   Aquifer[j].wiltingPoint      >= Aquifer[j].fieldCapacity
    ||   Aquifer[j].conductivity      <= 0.0
    ||   Aquifer[j].conductSlope      <  0.0
    ||   Aquifer[j].tensionSlope      <  0.0
    ||   Aquifer[j].upperEvapFrac     <  0.0
    ||   Aquifer[j].lowerEvapDepth    <  0.0
    ||   Aquifer[j].waterTableElev    <  Aquifer[j].bottomElev
    ||   Aquifer[j].upperMoisture     >  Aquifer[j].porosity 
    ||   Aquifer[j].upperMoisture     <  Aquifer[j].wiltingPoint )
        report_writeErrorMsg(ERR_AQUIFER_PARAMS, Aquifer[j].ID);

    p = Aquifer[j].upperEvapPat;
    if ( p >= 0 && Pattern[p].type != MONTHLY_PATTERN )
    {
        report_writeErrorMsg(ERR_AQUIFER_PARAMS, Aquifer[j].ID);
    }
}

//=============================================================================
// int j
function  gwater_validate(j)
{
    let  a;  // TAquifer       // Aquifer data structure
    let  gw; // TGroundwater*  // Groundwater data structure
    
    gw = Subcatch[j].groundwater;
    if ( gw )
    {
        a = Aquifer[gw.aquifer];

        // ... use aquifer values for missing groundwater parameters
        if ( gw.bottomElev == MISSING ) gw.bottomElev = a.bottomElev;
        if ( gw.waterTableElev == MISSING ) gw.waterTableElev = a.waterTableElev;
        if ( gw.upperMoisture == MISSING ) gw.upperMoisture = a.upperMoisture;

        // ... ground elevation can't be below water table elevation
        if ( gw.surfElev < gw.waterTableElev )
            report_writeErrorMsg(ERR_GROUND_ELEV, Subcatch[j].ID);
    }
}

//=============================================================================
// int j
function  gwater_initState(j)
//
//  Input:   j = subcatchment index
//  Output:  none
//  Purpose: initializes state of subcatchment's groundwater.
//
{
    let  a;    // TAquifer     // Aquifer data structure
    let gw;    // TGroundwater*// Groundwater data structure
    
    gw = Subcatch[j].groundwater;
    if ( gw )
    {
        a = Aquifer[gw.aquifer];

        // ... initial moisture content
        gw.theta = gw.upperMoisture;
        if ( gw.theta >= a.porosity )
        {
            gw.theta = a.porosity - XTOL;
        }

        // ... initial depth of lower (saturated) zone
        gw.lowerDepth = gw.waterTableElev - gw.bottomElev;
        if ( gw.lowerDepth >= gw.surfElev - gw.bottomElev )
        {
            gw.lowerDepth = gw.surfElev - gw.bottomElev - XTOL;
        }

        // ... initial lateral groundwater outflow
        gw.oldFlow = 0.0;
        gw.newFlow = 0.0;
        gw.evapLoss = 0.0;

        // ... initial available infiltration volume into upper zone
        gw.maxInfilVol = (gw.surfElev - gw.waterTableElev) *
                          (a.porosity - gw.theta) /
                          subcatch_getFracPerv(j);
    }
}

//=============================================================================
// int j, double x[]
function gwater_getState(j, x)
//
//  Input:   j = subcatchment index
//  Output:  x[] = array of groundwater state variables
//  Purpose: retrieves state of subcatchment's groundwater.
//
{
    let gw = Subcatch[j].groundwater;
    x[0] = gw.theta;
    x[1] = gw.bottomElev + gw.lowerDepth;
    x[2] = gw.newFlow;
    x[3] = gw.maxInfilVol;
}

//=============================================================================
// int j, double x[]
function gwater_setState(j, x)
//
//  Input:   j = subcatchment index
//           x[] = array of groundwater state variables
//  Purpose: assigns values to a subcatchment's groundwater state.
//
{
    let gw = Subcatch[j].groundwater;
    if ( gw == null ) return;
    gw.theta = x[0];
    gw.lowerDepth = x[1] - gw.bottomElev;
    gw.oldFlow = x[2];
    if ( x[3] != MISSING ) gw.maxInfilVol = x[3];
}

//=============================================================================
// int j
function gwater_getVolume(j)
//
//  Input:   j = subcatchment index
//  Output:  returns total volume of groundwater in ft/ft2
//  Purpose: finds volume of groundwater stored in upper & lower zones
//
{
    let a;     // TAquifer
    let gw;    // TGroundwater*
    let upperDepth;
    gw = Subcatch[j].groundwater;
    if ( gw == null ) return 0.0;
    a = Aquifer[gw.aquifer];
    upperDepth = gw.surfElev - gw.bottomElev - gw.lowerDepth;
    return (upperDepth * gw.theta) + (gw.lowerDepth * a.porosity);
}

//=============================================================================
// int j, double evap, double infil, double tStep
function gwater_getGroundwater(j, evap, infil, tStep)
//
//  Purpose: computes groundwater flow from subcatchment during current time step.
//  Input:   j     = subcatchment index
//           evap  = pervious surface evaporation volume consumed (ft3)
//           infil = surface infiltration volume (ft3)
//           tStep = time step (sec)
//  Output:  none
//
{
    let    n;                          // node exchanging groundwater
    let x = new Array(2);                       // upper moisture content & lower depth 
    let vUpper;                     // upper vol. available for percolation
    let nodeFlow;                   // max. possible GW flow from node

    // --- save subcatchment's groundwater and aquifer objects to 
    //     shared variables
    GW = Subcatch[j].groundwater;
    if ( GW == null ) return;
    LatFlowExpr = Subcatch[j].gwLatFlowExpr;
    DeepFlowExpr = Subcatch[j].gwDeepFlowExpr;
    A = Aquifer[GW.aquifer];

    // --- get fraction of total area that is pervious
    FracPerv = subcatch_getFracPerv(j);
    if ( FracPerv <= 0.0 ) return;
    Area = Subcatch[j].area;

    // --- convert infiltration volume (ft3) to equivalent rate
    //     over entire GW (subcatchment) area
    infil = infil / Area / tStep;
    Infil_gw = infil;
    Tstep = tStep;

    // --- convert pervious surface evaporation already exerted (ft3)
    //     to equivalent rate over entire GW (subcatchment) area
    evap = evap / Area / tStep;

    // --- convert max. surface evap rate (ft/sec) to a rate
    //     that applies to GW evap (GW evap can only occur
    //     through the pervious land surface area)
    MaxEvap = Evap.rate * FracPerv;

    // --- available subsurface evaporation is difference between max.
    //     rate and pervious surface evap already exerted
    AvailEvap = MAX((MaxEvap - evap), 0.0);

    // --- save total depth & outlet node properties to shared variables
    TotalDepth = GW.surfElev - GW.bottomElev;
    if ( TotalDepth <= 0.0 ) return;
    n = GW.node;

    // --- establish min. water table height above aquifer bottom at which
    //     GW flow can occur (override node's invert if a value was provided
    //     in the GW object)
    if ( GW.nodeElev != MISSING ) Hstar = GW.nodeElev - GW.bottomElev;
    else Hstar = Node[n].invertElev - GW.bottomElev;
    
    // --- establish surface water height (relative to aquifer bottom)
    //     for drainage system node connected to the GW aquifer
    if ( GW.fixedDepth > 0.0 )
    {
        Hsw = GW.fixedDepth + Node[n].invertElev - GW.bottomElev;
    }
    else Hsw = Node[n].newDepth + Node[n].invertElev - GW.bottomElev;

    // --- store state variables (upper zone moisture content, lower zone
    //     depth) in work vector x
    x[THETA] = GW.theta;
    x[LOWERDEPTH] = GW.lowerDepth;

    // --- set limit on percolation rate from upper to lower GW zone
    vUpper = (TotalDepth - x[LOWERDEPTH]) * (x[THETA] - A.fieldCapacity);
    vUpper = MAX(0.0, vUpper); 
    MaxUpperPerc = vUpper / tStep;

    // --- set limit on GW flow out of aquifer based on volume of lower zone
    MaxGWFlowPos = x[LOWERDEPTH]*A.porosity / tStep;

    // --- set limit on GW flow into aquifer from drainage system node
    //     based on min. of capacity of upper zone and drainage system
    //     inflow to the node
    MaxGWFlowNeg = (TotalDepth - x[LOWERDEPTH]) * (A.porosity - x[THETA])
                   / tStep;
    nodeFlow = (Node[n].inflow + Node[n].newVolume/tStep) / Area;
    MaxGWFlowNeg = -MIN(MaxGWFlowNeg, nodeFlow);
    
    // --- integrate eqns. for d(Theta)/dt and d(LowerDepth)/dt
    //     NOTE: ODE solver must have been initialized previously
    odesolve_integrate(x, 2, 0, tStep, GWTOL, tStep, getDxDt);
    
    // --- keep state variables within allowable bounds
    x[THETA] = MAX(x[THETA], A.wiltingPoint);
    if ( x[THETA] >= A.porosity )
    {
        x[THETA] = A.porosity - XTOL;
        x[LOWERDEPTH] = TotalDepth - XTOL;
    }
    x[LOWERDEPTH] = MAX(x[LOWERDEPTH],  0.0);
    if ( x[LOWERDEPTH] >= TotalDepth )
    {
        x[LOWERDEPTH] = TotalDepth - XTOL;
    }

    // --- save new values of state values
    GW.theta = x[THETA];
    GW.lowerDepth  = x[LOWERDEPTH];
    getFluxes(GW.theta, GW.lowerDepth);
    GW.oldFlow = GW.newFlow;
    GW.newFlow = GWFlow;
    GW.evapLoss = UpperEvap + LowerEvap;

    //--- find max. infiltration volume (as depth over
    //    the pervious portion of the subcatchment)
    //    that upper zone can support in next time step
    GW.maxInfilVol = (TotalDepth - x[LOWERDEPTH]) *
                      (A.porosity - x[THETA]) / FracPerv;

    // --- update GW mass balance
    updateMassBal(Area, tStep);

    // --- update GW statistics 
    stats_updateGwaterStats(j, infil, GW.evapLoss, GWFlow, LowerLoss,
        GW.theta, GW.lowerDepth + GW.bottomElev, tStep);
}

//=============================================================================
// double area, double tStep
function updateMassBal(area, tStep)
//
//  Input:   area  = subcatchment area (ft2)
//           tStep = time step (sec)
//  Output:  none
//  Purpose: updates GW mass balance with volumes of water fluxes.
//
{
    let vInfil;                     // infiltration volume
    let vUpperEvap;                 // upper zone evap. volume
    let vLowerEvap;                 // lower zone evap. volume
    let vLowerPerc;                 // lower zone deep perc. volume
    let vGwater;                    // volume of exchanged groundwater
    let ft2sec = area * tStep;

    vInfil     = Infil_gw * ft2sec;
    vUpperEvap = UpperEvap * ft2sec;
    vLowerEvap = LowerEvap * ft2sec;
    vLowerPerc = LowerLoss * ft2sec;
    vGwater    = 0.5 * (GW.oldFlow + GW.newFlow) * ft2sec;
    massbal_updateGwaterTotals(vInfil, vUpperEvap, vLowerEvap, vLowerPerc,
                               vGwater);
}

//=============================================================================
// double theta, double lowerDepth
function  getFluxes(theta, lowerDepth)
//
//  Input:   upperVolume = vol. depth of upper zone (ft)
//           upperDepth  = depth of upper zone (ft)
//  Output:  none
//  Purpose: computes water fluxes into/out of upper/lower GW zones.
//
{
    let upperDepth;

    // return facilitators
    let returnObj;
    let returnVal;

    // --- find upper zone depth
    lowerDepth = MAX(lowerDepth, 0.0);
    lowerDepth = MIN(lowerDepth, TotalDepth);
    upperDepth = TotalDepth - lowerDepth;

    // --- save lower depth and theta to global variables
    Hgw = lowerDepth;
    Theta = theta;

    // --- find evaporation rate from both zones
    getEvapRates(theta, upperDepth);

    // --- find percolation rate from upper to lower zone
    UpperPerc = getUpperPerc(theta, upperDepth);
    UpperPerc = MIN(UpperPerc, MaxUpperPerc);

    // --- find loss rate to deep GW
    if ( DeepFlowExpr != null ){
        ////////////////////////////////////
        returnObj = {expr: DeepFlowExpr, getVariableValue: function (varIndex)
            //
            //  Input:   varIndex = index of a GW variable
            //  Output:  returns current value of GW variable
            //  Purpose: finds current value of a GW variable.
            //
            {
                switch (varIndex)
                {
                case gwvHGW:  return Hgw * UCF(LENGTH);
                case gwvHSW:  return Hsw * UCF(LENGTH);
                case gwvHCB:  return Hstar * UCF(LENGTH);
                case gwvHGS:  return TotalDepth * UCF(LENGTH);
                case gwvKS:   return A.conductivity * UCF(RAINFALL);
                case gwvK:    return HydCon * UCF(RAINFALL);
                case gwvTHETA:return Theta;
                case gwvPHI:  return A.porosity;
                case gwvFI:   return Infil_gw * UCF(RAINFALL); 
                case gwvFU:   return UpperPerc * UCF(RAINFALL);
                case gwvA:    return Area * UCF(LANDAREA);
                default:      return 0.0;
                }
            }}
        returnVal = mathexpr_eval(returnObj);
        DeepFlowExpr = returnObj.expr;
        ////////////////////////////////////
        LowerLoss = returnVal / UCF(RAINFALL)
        //LowerLoss = mathexpr_eval(DeepFlowExpr, getVariableValue) / UCF(RAINFALL);
    }
    else{
        LowerLoss = A.lowerLossCoeff * lowerDepth / TotalDepth;
    }
    LowerLoss = Math.min(LowerLoss, lowerDepth/Tstep);

    // --- find GW flow rate from lower zone to drainage system node
    GWFlow = getGWFlow(lowerDepth);
    if ( LatFlowExpr != null )
    {
        ////////////////////////////////////
        returnObj = {expr: LatFlowExpr, getVariableValue: function (varIndex)
            //
            //  Input:   varIndex = index of a GW variable
            //  Output:  returns current value of GW variable
            //  Purpose: finds current value of a GW variable.
            //
            {
                switch (varIndex)
                {
                case gwvHGW:  return Hgw * UCF(LENGTH);
                case gwvHSW:  return Hsw * UCF(LENGTH);
                case gwvHCB:  return Hstar * UCF(LENGTH);
                case gwvHGS:  return TotalDepth * UCF(LENGTH);
                case gwvKS:   return A.conductivity * UCF(RAINFALL);
                case gwvK:    return HydCon * UCF(RAINFALL);
                case gwvTHETA:return Theta;
                case gwvPHI:  return A.porosity;
                case gwvFI:   return Infil_gw * UCF(RAINFALL); 
                case gwvFU:   return UpperPerc * UCF(RAINFALL);
                case gwvA:    return Area * UCF(LANDAREA);
                default:      return 0.0;
                }
            }}
        returnVal = mathexpr_eval(returnObj);
        LatFlowExpr = returnObj.expr;
        ////////////////////////////////////
        GWFlow += returnVal / UCF(GWFLOW)
        //GWFlow += mathexpr_eval(LatFlowExpr, getVariableValue) / UCF(GWFLOW);
    }
    if ( GWFlow >= 0.0 ) GWFlow = MIN(GWFlow, MaxGWFlowPos);
    else GWFlow = MAX(GWFlow, MaxGWFlowNeg);
}

//=============================================================================
////////////////////////////////////
//let returnObj = {v1: val1, v2: val2}
//let returnVal = getDdDt(t, returnObj)
//val1 = returnObj.v1;
//val2 = returnObj.v2
////////////////////////////////////
function  getDxDt(t, inObj)
//
//  Input:   t    = current time (not used)
//           x    = array of state variables
//  Output:  dxdt = array of time derivatives of state variables
//  Purpose: computes time derivatives of upper moisture content 
//           and lower depth.
//
{
    let qUpper;    // inflow - outflow for upper zone (ft/sec)
    let qLower;    // inflow - outflow for lower zone (ft/sec)
    let denom;

    getFluxes(inObj.v1[THETA], inObj.v1[LOWERDEPTH]);
    qUpper = Infil_gw - UpperEvap - UpperPerc;
    qLower = UpperPerc - LowerLoss - LowerEvap - GWFlow;

    // --- d(upper zone moisture)/dt = (net upper zone flow) /
    //                                 (upper zone depth)
    denom = TotalDepth - inObj.v1[LOWERDEPTH];
    if (denom > 0.0)
        inObj.v2[THETA] = qUpper / denom;
    else
        inObj.v2[THETA] = 0.0;

    // --- d(lower zone depth)/dt = (net lower zone flow) /
    //                              (upper zone moisture deficit)
    denom = A.porosity - inObj.v1[THETA];
    if (denom > 0.0)
        inObj.v2[LOWERDEPTH] = qLower / denom;
    else
        inObj.v2[LOWERDEPTH] = 0.0;
}

//=============================================================================
// double theta, double upperDepth
function getEvapRates(theta, upperDepth)
//
//  Input:   theta      = moisture content of upper zone
//           upperDepth = depth of upper zone (ft)
//  Output:  none
//  Purpose: computes evapotranspiration out of upper & lower zones.
//
{
    let p, month;
    let f;
    let lowerFrac, upperFrac;

    // --- no GW evaporation when infiltration is occurring
    UpperEvap = 0.0;
    LowerEvap = 0.0;
    if ( Infil_gw > 0.0 ) return;

    // --- get monthly-adjusted upper zone evap fraction
    upperFrac = A.upperEvapFrac;
    f = 1.0;
    p = A.upperEvapPat;
    if ( p >= 0 )
    {
        month = datetime_monthOfYear(getDateTime(NewRunoffTime));
        f = Pattern[p].factor[month-1];
    }
    upperFrac *= f;

    // --- upper zone evaporation requires that soil moisture
    //     be above the wilting point
    if ( theta > A.wiltingPoint )
    {
        // --- actual evap is upper zone fraction applied to max. potential
        //     rate, limited by the available rate after any surface evap 
        UpperEvap = upperFrac * MaxEvap;
        UpperEvap = MIN(UpperEvap, AvailEvap);
    }

    // --- check if lower zone evaporation is possible
    if ( A.lowerEvapDepth > 0.0 )
    {
        // --- find the fraction of the lower evaporation depth that
        //     extends into the saturated lower zone
        lowerFrac = (A.lowerEvapDepth - upperDepth) / A.lowerEvapDepth;
        lowerFrac = MAX(0.0, lowerFrac);
        lowerFrac = MIN(lowerFrac, 1.0);

        // --- make the lower zone evap rate proportional to this fraction
        //     and the evap not used in the upper zone
        LowerEvap = lowerFrac * (1.0 - upperFrac) * MaxEvap;
        LowerEvap = MIN(LowerEvap, (AvailEvap - UpperEvap));
    }
}

//=======================================// double theta, double upperDepth
function getUpperPerc(theta, upperDepth)
//
//  Input:   theta      = moisture content of upper zone
//           upperDepth = depth of upper zone (ft)
//  Output:  returns percolation rate (ft/sec)
//  Purpose: finds percolation rate from upper to lower zone.
//
{
    let delta;                       // unfilled water content of upper zone
    let dhdz;                        // avg. change in head with depth
    let hydcon;                      // unsaturated hydraulic conductivity

    // --- no perc. from upper zone if no depth or moisture content too low    
    if ( upperDepth <= 0.0 || theta <= A.fieldCapacity ) return 0.0;

    // --- compute hyd. conductivity as function of moisture content
    delta = theta - A.porosity;
    hydcon = A.conductivity * exp(delta * A.conductSlope);

    // --- compute integral of dh/dz term
    delta = theta - A.fieldCapacity;
    dhdz = 1.0 + A.tensionSlope * 2.0 * delta / upperDepth;

    // --- compute upper zone percolation rate
    HydCon = hydcon;
    return hydcon * dhdz;
}

//=============================================================================
// double lowerDepth
function getGWFlow(lowerDepth)
//
//  Input:   lowerDepth = depth of lower zone (ft)
//  Output:  returns groundwater flow rate (ft/sec)
//  Purpose: finds groundwater outflow from lower saturated zone.
//
{
    let q, t1, t2, t3;

    // --- water table must be above Hstar for flow to occur
    if ( lowerDepth <= Hstar ) return 0.0;

    // --- compute groundwater component of flow
    if ( GW.b1 == 0.0 ) t1 = GW.a1;
    else t1 = GW.a1 * Math.pow( (lowerDepth - Hstar)*UCF(LENGTH), GW.b1);

    // --- compute surface water component of flow
    if ( GW.b2 == 0.0 ) t2 = GW.a2;
    else if (Hsw > Hstar)
    {
        t2 = GW.a2 * Math.pow( (Hsw - Hstar)*UCF(LENGTH), GW.b2);
    }
    else t2 = 0.0;

    // --- compute groundwater/surface water interaction term
    t3 = GW.a3 * lowerDepth * Hsw * UCF(LENGTH) * UCF(LENGTH);

    // --- compute total groundwater flow
    q = (t1 - t2 + t3) / UCF(GWFLOW); 
    if ( q < 0.0 && GW.a3 != 0.0 ) q = 0.0;
    return q;
}

//=============================================================================
// char* s
function  getVariableIndex(s)
//
//  Input:   s = name of a groundwater variable
//  Output:  returns index of groundwater variable
//  Purpose: finds position of GW variable in list of GW variable names.
//
{
    let k;

    k = findmatch(s, GWVarWords);
    if ( k >= 0 ) return k;
    return -1;
}

//=============================================================================
// int varIndex
function getVariableValue(varIndex)
//
//  Input:   varIndex = index of a GW variable
//  Output:  returns current value of GW variable
//  Purpose: finds current value of a GW variable.
//
{
    switch (varIndex)
    {
    case gwvHGW:  return Hgw * UCF(LENGTH);
    case gwvHSW:  return Hsw * UCF(LENGTH);
    case gwvHCB:  return Hstar * UCF(LENGTH);
    case gwvHGS:  return TotalDepth * UCF(LENGTH);
    case gwvKS:   return A.conductivity * UCF(RAINFALL);
    case gwvK:    return HydCon * UCF(RAINFALL);
    case gwvTHETA:return Theta;
    case gwvPHI:  return A.porosity;
    case gwvFI:   return Infil_gw * UCF(RAINFALL); 
    case gwvFU:   return UpperPerc * UCF(RAINFALL);
    case gwvA:    return Area * UCF(LANDAREA);
    default:      return 0.0;
    }
}

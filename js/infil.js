//-----------------------------------------------------------------------------
//   infil.h
//
//   Project: EPA SWMM5
//   Version: 5.1
//   Date:    03/20/14   (Build 5.1.001)
//            09/15/14   (Build 5.1.007)
//            08/05/15   (Build 5.1.010)
//            05/10/18   (Build 5.1.013)
//            04/01/20   (Build 5.1.015)
//   Author:  L. Rossman (US EPA)
//
//   Public interface for infiltration functions.
//
//   Build 5.1.010:
//   - New Modified Green Ampt infiltration option added.
//
//   Build 5.1.013:
//   - New function infil_setInfilFactor() added.
//
//   Build 5.1.015:
//   - Support added for multiple infiltration methods within a project.
//-----------------------------------------------------------------------------

//---------------------
// Enumerated Constants
//---------------------
//enum InfilType {
var HORTON = 0                     // Horton infiltration
var MOD_HORTON = 1                 // Modified Horton infiltration
var GREEN_AMPT = 2                 // Green-Ampt infiltration
var MOD_GREEN_AMPT = 3             // Modified Green-Ampt infiltration
var CURVE_NUMBER = 4               // SCS Curve Number infiltration

//---------------------
// Horton Infiltration
//---------------------
class THorton
{
    constructor(){
        this.f0;              // initial infil. rate (ft/sec)
        this.fmin;            // minimum infil. rate (ft/sec)
        this.Fmax;            // maximum total infiltration (ft);
        this.decay;           // decay coeff. of infil. rate (1/sec)
        this.regen;           // regeneration coeff. of infil. rate (1/sec)
        //-----------------------------
        this.tp;              // present time on infiltration curve (sec)
        this.Fe;              // cumulative infiltration (ft)
    }
}  ;


//-------------------------
// Green-Ampt Infiltration
//-------------------------
class TGrnAmpt
{
    constructor(){
        this.S;               // avg. capillary suction (ft)
        this.Ks;              // saturated conductivity (ft/sec)
        this.IMDmax;          // max. soil moisture deficit (ft/ft)
        //-----------------------------
        this.IMD;             // current initial soil moisture deficit
        this.F;               // current cumulative infiltrated volume (ft)
        this.Fu;              // current upper zone infiltrated volume (ft)
        this.Lu;              // depth of upper soil zone (ft)
        this.T;               // time until start of next rain event (sec)
        this.Sat;             // saturation flag
    }
}  ;


//--------------------------
// Curve Number Infiltration
//--------------------------
class TCurveNum
{
    constructor(){
        this.Smax;            // max. infiltration capacity (ft)
        this.regen;           // infil. capacity regeneration constant (1/sec)
        this.Tmax;            // maximum inter-event time (sec)
        //-----------------------------
        this.S;               // current infiltration capacity (ft)
        this.F;               // current cumulative infiltration (ft)
        this.P;               // current cumulative precipitation (ft)
        this.T;               // current inter-event time (sec)
        this.Se;              // current event infiltration capacity (ft)
        this.f;               // previous infiltration rate (ft/sec)
    }
}  ;

//-----------------------------------------------------------------------------
//   Exported Variables
//-----------------------------------------------------------------------------
// type: THorton
var  HortInfil;
// type: TGrnAmpt
var  GAInfil;
// type: TCurveNum
var  CNInfil;

//-----------------------------------------------------------------------------
//   infil.c
//
//   Project:  EPA SWMM5
//   Version:  5.1
//   Date:     03/20/14  (Build 5.1.001)
//             09/15/14  (Build 5.1.007)
//             03/19/15  (Build 5.1.008)
//             08/05/15  (Build 5.1.010)
//             08/01/16  (Build 5.1.011)
//             05/10/17  (Build 5.1.013)
//             04/01/20  (Build 5.1.015)
//   Author:   L. Rossman
//
//   Infiltration functions.
//
//   Build 5.1.007:
//   - Revised formula for infiltration capacity recovery for the Modified
//     Horton method.
//   - The Green-Ampt functions were re-written.
//
//   Build 5.1.008:
//   - Monthly adjustment factors applied to hydraulic conductivity.
//
//   Build 5.1.010:
//   - Support for Modified Green Ampt model added.
//   - Green-Ampt initial recovery time set to 0.
//
//   Build 5.1.011:
//   - Monthly hydraulic conductivity factor also applied to Fu parameter
//     for Green-Ampt infiltration.
//   - Prevented computed Horton infiltration from dropping below f0.
//
//   Build 5.1.013:
//   - Support added for subcatchment-specific time patterns that adjust
//     hydraulic conductivity.
//
//   Build 5.1.015:
//   - Support added for multiple infiltration methods within a project.
//-----------------------------------------------------------------------------


//-----------------------------------------------------------------------------
//  Local Variables
//-----------------------------------------------------------------------------
class TInfil {
    constructor(){
        this.horton = new THorton();        // THorton   
        this.grnAmpt = new TGrnAmpt();       // TGrnAmpt  
        this.curveNum = new TCurveNum();      // TCurveNum
    }
} ;
//TInfil *Infil;
var Infil = [];

var Fumax;   // saturated water volume in upper soil zone (ft)
var InfilFactor;                                                     //(5.1.013)

//-----------------------------------------------------------------------------
//  External Functions (declared in infil.h)
//-----------------------------------------------------------------------------
//  infil_create     (called by createObjects in project.c)
//  infil_delete     (called by deleteObjects in project.c)
//  infil_readParams (called by input_readLine)
//  infil_initState  (called by subcatch_initState)
//  infil_getState   (called by writeRunoffFile in hotstart.c)
//  infil_setState   (called by readRunoffFile in hotstart.c)
//  infil_getInfil   (called by getSubareaRunoff in subcatch.c)

//  Called locally and by storage node methods in node.c
//  grnampt_setParams
//  grnampt_initState
//  grnampt_getInfil


//=============================================================================
// int n
function infil_create(n)
//
//  Purpose: creates an array of infiltration objects.
//  Input:   n = number of subcatchments
//  Output:  none
//
{
    //Infil = (TInfil *) calloc(n, sizeof(TInfil));
    for(let i = 0; i < n; i++){Infil.push(new TInfil())}
    if (Infil == null) ErrorCode = ERR_MEMORY;
    InfilFactor = 1.0;
    return;
}

//=============================================================================

function infil_delete()
//
//  Purpose: deletes infiltration objects associated with subcatchments
//  Input:   none
//  Output:  none
//
{
    Infil = null;
}

//=============================================================================
//int m, char* tok[], int ntoks
function infil_readParams(m, tok, ntoks)
//
//  Input:   m = default infiltration model
//           tok[] = array of string tokens
//           ntoks = number of tokens
//  Output:  returns an error code
//  Purpose: sets infiltration parameters from a line of input data.
//
//  Format of data line is:
//     subcatch  p1  p2 ... (infilMethod)
{
    let   i, j, n, status;
    let x = new Array(5);

    //return facilitators
    let returnObj;
    let returnVal;

    // --- check that subcatchment exists
    j = project_findObject(SUBCATCH, tok[0]);
    if ( j < 0 ) return error_setInpError(ERR_NAME, tok[0]);

    // --- check for infiltration method keyword is last token 
    i = findmatch(tok[ntoks-1], InfilModelWords);
    if ( i >= 0 )
    {
        m = i; 
        --ntoks;
    }

    // --- number of input tokens depends on infiltration model m
    if      ( m == HORTON )         n = 5; 
    else if ( m == MOD_HORTON )     n = 5;
    else if ( m == GREEN_AMPT )     n = 4;
    else if ( m == MOD_GREEN_AMPT ) n = 4;
    else if ( m == CURVE_NUMBER )   n = 4;
    else return 0; 

    if ( ntoks < n ) return error_setInpError(ERR_ITEMS, "");
   
    // --- parse numerical values from tokens
    for (i = 0; i < 5; i++) x[i] = 0.0;
    for (i = 1; i < n; i++)
    {
        ////////////////////////////////////
        returnObj = {y: x[i - 1]}
        returnVal = getDouble(tok[i], returnObj);
        x[i - 1] = returnObj.y;
        ////////////////////////////////////
        if( !returnVal ) 
        //if (null == (x[i - 1] = getDouble(tok[i])))
            return error_setInpError(ERR_NUMBER, tok[i]);
    }

    // --- special case for Horton infil. - last parameter is optional
    if ( (m == HORTON || m == MOD_HORTON) && ntoks > n )
    {
        ////////////////////////////////////
        returnObj = {y: x[n-1]}
        returnVal = getDouble(tok[n], returnObj);
        x[n-1] = returnObj.y;
        ////////////////////////////////////
        if(!returnVal)
        //if ( null == (x[n-1] = getDouble(tok[n])))
            return error_setInpError(ERR_NUMBER, tok[n]);
    }

    // --- assign parameter values to infil, infilModel object
    Subcatch[j].infil = j;
    Subcatch[j].infilModel = m;
    switch (m)
    {
      case HORTON:
      case MOD_HORTON:   status = horton_setParams(Infil[j].horton, x);
                         break;
      case GREEN_AMPT:
      case MOD_GREEN_AMPT:
                         status = grnampt_setParams(Infil[j].grnAmpt, x);
                         break;
      case CURVE_NUMBER: status = curvenum_setParams(Infil[j].curveNum, x);
                         break;
      default:           status = TRUE;
    }
    if ( !status ) return error_setInpError(ERR_NUMBER, "");
    return 0;
}

//=============================================================================
// int j
function infil_initState(j)
//
//  Input:   j = subcatchment index
//  Output:  none
//  Purpose: initializes state of infiltration for a subcatchment.
//
{
    switch (Subcatch[j].infilModel)
    {
      case HORTON:
      case MOD_HORTON:   horton_initState(Infil[j].horton);   break;
      case GREEN_AMPT:
      case MOD_GREEN_AMPT:
                         grnampt_initState(Infil[j].grnAmpt);    break;
      case CURVE_NUMBER: curvenum_initState(Infil[j].curveNum);   break;
    }
}

//=============================================================================
// int j, double x[]
function infil_getState(j, x)
//
//  Input:   j = subcatchment index
//  Output:  x = subcatchment's infiltration state
//  Purpose: retrieves the current infiltration state for a subcatchment.
//
{
    switch (Subcatch[j].infilModel)
    {
      case HORTON:
      case MOD_HORTON:   horton_getState(Infil[j].horton, x); break;
      case GREEN_AMPT:
      case MOD_GREEN_AMPT:
                         grnampt_getState(Infil[j].grnAmpt, x);   break;
      case CURVE_NUMBER: curvenum_getState(Infil[j].curveNum, x); break;
    }
}

//=============================================================================
// int j, double x[]
function infil_setState(j, x)
//
//  Input:   j = subcatchment index
//           m = infiltration method code
//  Output:  none
//  Purpose: sets the current infiltration state for a subcatchment.
//
{
    switch (Subcatch[j].infilModel)
    {
      case HORTON:
      case MOD_HORTON:   horton_setState(Infil[j].horton, x); break;
      case GREEN_AMPT:
      case MOD_GREEN_AMPT:
                         grnampt_setState(Infil[j].grnAmpt, x);   break;
      case CURVE_NUMBER: curvenum_setState(Infil[j].curveNum, x); break;
    }
}

//=============================================================================

////  New function added for release 5.1.013.  ////                            //(5.1.013)
// int j
function infil_setInfilFactor(j)
//
//  Input:   j = subcatchment index
//  Output:  none
//  Purpose: assigns a value to the infiltration adjustment factor.
{
    let m;
    let p;

    // ... set factor to the global conductivity adjustment factor
    InfilFactor = Adjust.hydconFactor;

    // ... override global factor with subcatchment's adjustment if assigned 
    if (j >= 0)
    {
        p = Subcatch[j].infilPattern;
        if (p >= 0 && Pattern[p].type == MONTHLY_PATTERN)
        {
            m = datetime_monthOfYear(getDateTime(OldRunoffTime)) - 1;
            InfilFactor = Pattern[p].factor[m];
        }
    }
}

//=============================================================================
// int j, double tstep, double rainfall,
//     double runon, double depth
function infil_getInfil(j, tstep, rainfall,
                     runon, depth)
//
//  Input:   j = subcatchment index
//           tstep = runoff time step (sec)
//           rainfall = rainfall rate (ft/sec)
//           runon = runon rate from other sub-areas or subcatchments (ft/sec)
//           depth = depth of surface water on subcatchment (ft)
//  Output:  returns infiltration rate (ft/sec)
//  Purpose: computes infiltration rate depending on infiltration method.
//
{
    switch (Subcatch[j].infilModel)
    {
      case HORTON:
          return horton_getInfil(Infil[j].horton, tstep, rainfall+runon, depth);

      case MOD_HORTON:
          return modHorton_getInfil(Infil[j].horton, tstep, rainfall+runon,
                                    depth);

      case GREEN_AMPT:
      case MOD_GREEN_AMPT:
        return grnampt_getInfil(Infil[j].grnAmpt, tstep, rainfall+runon, depth,
            Subcatch[j].infilModel);

      case CURVE_NUMBER:
        depth += runon / tstep;
        return curvenum_getInfil(Infil[j].curveNum, tstep, rainfall, depth);

      default:
        return 0.0;
    }
}

//=============================================================================
// THorton *infil, double p[]
function horton_setParams(infil, p)
//
//  Input:   infil = ptr. to Horton infiltration object
//           p[] = array of parameter values
//  Output:  returns TRUE if parameters are valid, FALSE otherwise
//  Purpose: assigns Horton infiltration parameters to a subcatchment.
//
{
    let k;
    for (k = 0; k < 5; k++) if ( p[k] < 0.0 ) return FALSE;

    // --- max. & min. infil rates (ft/sec)
    infil.f0   = p[0] / UCF(RAINFALL);
    infil.fmin = p[1] / UCF(RAINFALL);

    // --- convert decay const. to 1/sec
    infil.decay = p[2] / 3600.;

    // --- convert drying time (days) to a regeneration const. (1/sec)
    //     assuming that former is time to reach 98% dry along an
    //     exponential drying curve
    if (p[3] == 0.0 ) p[3] = TINY;
    infil.regen = -Math.log(1.0-0.98) / p[3] / SECperDAY;

    // --- optional max. infil. capacity (ft) (p[4] = 0 if no value supplied)
    infil.Fmax = p[4] / UCF(RAINDEPTH);
    if ( infil.f0 < infil.fmin ) return FALSE;
    return TRUE;
}

//=============================================================================
// THorton *infil
function horton_initState(infil)
//
//  Input:   infil = ptr. to Horton infiltration object
//  Output:  none
//  Purpose: initializes time on Horton infiltration curve for a subcatchment.
//
{
    infil.tp = 0.0;
    infil.Fe = 0.0;
}

//=============================================================================
// THorton *infil, double x[]
function horton_getState(infil, x)
{
    x[0] = infil.tp;
    x[1] = infil.Fe;
}
// THorton *infil, double x[]
function horton_setState(infil, x)
{
    infil.tp = x[0];
    infil.Fe = x[1];
}

//=============================================================================
// THorton *infil, double tstep, double irate, double depth
function horton_getInfil(infil, tstep, irate, depth)
//
//  Input:   infil = ptr. to Horton infiltration object
//           tstep =  runoff time step (sec),
//           irate = net "rainfall" rate (ft/sec),
//                 = rainfall + snowmelt + runon - evaporation
//           depth = depth of ponded water (ft).
//  Output:  returns infiltration rate (ft/sec)
//  Purpose: computes Horton infiltration for a subcatchment.
//
{
    // --- assign local variables
    let    iter;
    let fa, fp = 0.0;
    let Fp, F1, t1, tlim, ex, kt;
    let FF, FF1, r;
    let f0   = infil.f0 * InfilFactor;                                     //(5.1.013)
    let fmin = infil.fmin * InfilFactor;                                   //(5.1.013)
    let Fmax = infil.Fmax;
    let tp   = infil.tp;
    let df   = f0 - fmin;
    let kd   = infil.decay;
    let kr   = infil.regen * Evap.recoveryFactor;

    // --- special cases of no infil. or constant infil
    if ( df < 0.0 || kd < 0.0 || kr < 0.0 ) return 0.0;
    if ( df == 0.0 || kd == 0.0 )
    {
        fp = f0;
        fa = irate + depth / tstep;
        if ( fp > fa ) fp = fa;
        return MAX(0.0, fp);
    }

    // --- compute water available for infiltration
    fa = irate + depth / tstep;

    // --- case where there is water to infiltrate
    if ( fa > ZERO )
    {
        // --- compute average infil. rate over time step
        t1 = tp + tstep;         // future cumul. time
        tlim = 16.0 / kd;        // for tp >= tlim, f = fmin
        if ( tp >= tlim )
        {
            Fp = fmin * tp + df / kd;
            F1 = Fp + fmin * tstep;
        }
        else
        {
            Fp = fmin * tp + df / kd * (1.0 - Math.exp(-kd * tp));
            F1 = fmin * t1 + df / kd * (1.0 - Math.exp(-kd * t1));
        }
        fp = (F1 - Fp) / tstep;
        fp = MAX(fp, fmin);

        // --- limit infil rate to available infil
        if ( fp > fa ) fp = fa;

        // --- if fp on flat portion of curve then increase tp by tstep
        if ( t1 > tlim ) tp = t1;

        // --- if infil < available capacity then increase tp by tstep
        else if ( fp < fa ) tp = t1;

        // --- if infil limited by available capacity then
        //     solve F(tp) - F1 = 0 using Newton-Raphson method
        else
        {
            F1 = Fp + fp * tstep;
            tp = tp + tstep / 2.0;
            for ( iter=1; iter<=20; iter++ )
            {
                kt = MIN( 60.0, kd*tp );
                ex = Math.exp(-kt);
                FF = fmin * tp + df / kd * (1.0 - ex) - F1;
                FF1 = fmin + df * ex;
                r = FF / FF1;
                tp = tp - r;
                if ( Math.abs(r) <= 0.001 * tstep ) break;
            }
        }

        // --- limit cumulative infiltration to Fmax
        if ( Fmax > 0.0 )
        {
            if ( infil.Fe + fp * tstep > Fmax )
                fp = (Fmax - infil.Fe) / tstep;
            fp = MAX(fp, 0.0);
            infil.Fe += fp * tstep;
        }
    }

    // --- case where infil. capacity is regenerating; update tp.
    else if (kr > 0.0)
    {
        r = Math.exp(-kr * tstep);
        tp = 1.0 - Math.exp(-kd * tp);
        tp = -Math.log(1.0 - r*tp) / kd;

        // reduction in cumulative infiltration
        if ( Fmax > 0.0 )
        {
            infil.Fe = fmin*tp + (df/kd)*(1.0 - Math.exp(-kd*tp));
        }
    }
    infil.tp = tp;
    return fp;
}

//=============================================================================
// THorton *infil, double tstep, double irate,
//    double depth
function modHorton_getInfil(infil, tstep, irate,
                         depth)
//
//  Input:   infil = ptr. to Horton infiltration object
//           tstep =  runoff time step (sec),
//           irate = net "rainfall" rate (ft/sec),
//                 = rainfall + snowmelt + runon
//           depth = depth of ponded water (ft).
//  Output:  returns infiltration rate (ft/sec)
//  Purpose: computes modified Horton infiltration for a subcatchment.
//
{
    // --- assign local variables
    let f  = 0.0;
    let fp, fa;
    let f0 = infil.f0 * InfilFactor;                                       //(5.1.013)
    let fmin = infil.fmin * InfilFactor;                                   //(5.1.013)
    let df = f0 - fmin;
    let kd = infil.decay;
    let kr = infil.regen * Evap.recoveryFactor;

    // --- special cases of no or constant infiltration
    if ( df < 0.0 || kd < 0.0 || kr < 0.0 ) return 0.0;
    if ( df == 0.0 || kd == 0.0 )
    {
        fp = f0;
        fa = irate + depth / tstep;
        if ( fp > fa ) fp = fa;
        return MAX(0.0, fp);
    }

    // --- compute water available for infiltration
    fa = irate + depth / tstep;

    // --- case where there is water to infiltrate
    if ( fa > ZERO )
    {
        // --- saturated condition
        if ( infil.Fmax > 0.0 && infil.Fe >= infil.Fmax ) return 0.0;

        // --- potential infiltration
        fp = f0 - kd * infil.Fe;
        fp = MAX(fp, fmin);

        // --- actual infiltration
        f = MIN(fa, fp);

        // --- new cumulative infiltration minus seepage
        infil.Fe += MAX((f - fmin), 0.0) * tstep;
        if ( infil.Fmax > 0.0 ) infil.Fe = MAX(infil.Fe, infil.Fmax);
    }

    // --- reduce cumulative infiltration for dry condition
    else if (kr > 0.0)
    {
        infil.Fe *= Math.exp(-kr * tstep);
        infil.Fe = MAX(infil.Fe, 0.0);
    }
    return f;
}

//=============================================================================
// int j, double p[]
function grnampt_getParams(j, p)
//
//  Input:   j = subcatchment index
//           p[] = array of parameter values
//  Output:  none
//  Purpose: retrieves Green-Ampt infiltration parameters for a subcatchment.
//
{
    p[0] = Infil[j].grnAmpt.S * UCF(RAINDEPTH);   // Capillary suction head (ft)
    p[1] = Infil[j].grnAmpt.Ks * UCF(RAINFALL);   // Sat. hyd. conductivity (ft/sec)
    p[2] = Infil[j].grnAmpt.IMDmax;               // Max. init. moisture deficit
}

//=============================================================================
// TGrnAmpt *infil, double p[]
function grnampt_setParams(infil, p)
//
//  Input:   infil = ptr. to Green-Ampt infiltration object
//           p[] = array of parameter values
//  Output:  returns TRUE if parameters are valid, FALSE otherwise
//  Purpose: assigns Green-Ampt infiltration parameters to a subcatchment.
//
{
    let ksat;                       // sat. hyd. conductivity in in/hr

    if ( p[0] < 0.0 || p[1] <= 0.0 || p[2] < 0.0 ) return FALSE;
    infil.S      = p[0] / UCF(RAINDEPTH);   // Capillary suction head (ft)
    infil.Ks     = p[1] / UCF(RAINFALL);    // Sat. hyd. conductivity (ft/sec)
    infil.IMDmax = p[2];                    // Max. init. moisture deficit

    // --- find depth of upper soil zone (ft) using Mein's eqn.
    ksat = infil.Ks * 12. * 3600.;
    infil.Lu = 4.0 * Math.sqrt(ksat) / 12.;
    return TRUE;
}

//=============================================================================
// TGrnAmpt *infil
function grnampt_initState(infil)
//
//  Input:   infil = ptr. to Green-Ampt infiltration object
//  Output:  none
//  Purpose: initializes state of Green-Ampt infiltration for a subcatchment.
//
{
    if (infil == null) return;
    infil.IMD = infil.IMDmax;
    infil.Fu = 0.0;
    infil.F = 0.0;
    infil.Sat = FALSE;
    infil.T = 0.0;
}
// TGrnAmpt *infil, double x[]
function grnampt_getState(infil, x)
{
    x[0] = infil.IMD;
    x[1] = infil.F;
    x[2] = infil.Fu;
    x[3] = infil.Sat;
    x[4] = infil.T;
}
// TGrnAmpt *infil, double x[]
function grnampt_setState(infil, x)
{
    infil.IMD = x[0];
    infil.F   = x[1];
    infil.Fu  = x[2];
    infil.Sat = x[3];
    infil.T   = x[4];
}

//=============================================================================
// TGrnAmpt *infil, double tstep, double irate,
//    double depth, int modelType
function grnampt_getInfil(infil, tstep, irate,
 depth,  modelType) 
//
//  Input:   infil = ptr. to Green-Ampt infiltration object
//           tstep =  time step (sec),
//           irate = net "rainfall" rate to upper zone (ft/sec);
//                 = rainfall + snowmelt + runon,
//                   does not include ponded water (added on below)
//           depth = depth of ponded water (ft)
//           modelType = either GREEN_AMPT or MOD_GREEN_AMPT 
//  Output:  returns infiltration rate (ft/sec)
//  Purpose: computes Green-Ampt infiltration for a subcatchment
//           or a storage node.
//
{
    // --- find saturated upper soil zone water volume
    Fumax = infil.IMDmax * infil.Lu * Math.sqrt(InfilFactor);                     //(5.1.013)

    // --- reduce time until next event
    infil.T -= tstep;

    // --- use different procedures depending on upper soil zone saturation
    if ( infil.Sat ) return grnampt_getSatInfil(infil, tstep, irate, depth);
    else return grnampt_getUnsatInfil(infil, tstep, irate, depth, modelType);
}

//=============================================================================
// TGrnAmpt *infil, double tstep, double irate,
//    double depth, int modelType
function grnampt_getUnsatInfil(infil, tstep, irate,
    depth, modelType)
//
//  Input:   infil = ptr. to Green-Ampt infiltration object
//           tstep =  runoff time step (sec),
//           irate = net "rainfall" rate to upper zone (ft/sec);
//                 = rainfall + snowmelt + runon,
//                   does not include ponded water (added on below)
//           depth = depth of ponded water (ft)
//           modelType = either GREEN_AMPT or MOD_GREEN_AMPT
//  Output:  returns infiltration rate (ft/sec)
//  Purpose: computes Green-Ampt infiltration when upper soil zone is
//           unsaturated.
//
{
    let ia, c1, F2, dF, Fs, kr, ts;
    let ks = infil.Ks * InfilFactor;                                       //(5.1.013)
    let lu = infil.Lu * Math.sqrt(InfilFactor);                                 //(5.1.013)

    // --- get available infiltration rate (rainfall + ponded water)
    ia = irate + depth / tstep;
    if ( ia < ZERO ) ia = 0.0;

    // --- no rainfall so recover upper zone moisture
    if ( ia == 0.0 )
    {
        if ( infil.Fu <= 0.0 ) return 0.0;
        kr = lu / 90000.0 * Evap.recoveryFactor; 
        dF = kr * Fumax * tstep;
        infil.F -= dF;
        infil.Fu -= dF;
        if ( infil.Fu <= 0.0 )
        {
            infil.Fu = 0.0;
            infil.F = 0.0;
            infil.IMD = infil.IMDmax;
            return 0.0;
        }

        // --- if new wet event begins then reset IMD & F
        if ( infil.T <= 0.0 )
        {
            infil.IMD = (Fumax - infil.Fu) / lu; 
            infil.F = 0.0;
        }
        return 0.0;
    }

    // --- rainfall does not exceed Ksat
    if ( ia <= ks )
    {
        dF = ia * tstep;
        infil.F += dF;
        infil.Fu += dF;
        infil.Fu = MIN(infil.Fu, Fumax);
        if ( modelType == GREEN_AMPT &&  infil.T <= 0.0 )
        {
            infil.IMD = (Fumax - infil.Fu) / lu;
            infil.F = 0.0;
        }
        return ia;
    }

    // --- rainfall exceeds Ksat; renew time to drain upper zone
    infil.T = 5400.0 / lu / Evap.recoveryFactor; 

    // --- find volume needed to saturate surface layer
    Fs = ks * (infil.S + depth) * infil.IMD / (ia - ks);

    // --- surface layer already saturated
    if ( infil.F > Fs )
    {
        infil.Sat = TRUE;
        return grnampt_getSatInfil(infil, tstep, irate, depth);
    }

    // --- surface layer remains unsaturated
    if ( infil.F + ia*tstep < Fs )
    {
        dF = ia * tstep;
        infil.F += dF;
        infil.Fu += dF;
        infil.Fu = MIN(infil.Fu, Fumax);
        return ia;
    }

    // --- surface layer becomes saturated during time step;
    // --- compute portion of tstep when saturated
    ts  = tstep - (Fs - infil.F) / ia;
    if ( ts <= 0.0 ) ts = 0.0;

    // --- compute new total volume infiltrated
    c1 = (infil.S + depth) * infil.IMD;
    F2 = grnampt_getF2(Fs, c1, ks, ts);
    if ( F2 > Fs + ia*ts ) F2 = Fs + ia*ts;

    // --- compute infiltration rate
    dF = F2 - infil.F;
    infil.F = F2;
    infil.Fu += dF;
    infil.Fu = MIN(infil.Fu, Fumax);
    infil.Sat = TRUE;
    return dF / tstep;
}

//=============================================================================
// TGrnAmpt *infil, double tstep, double irate,
//    double depth
function grnampt_getSatInfil(infil, tstep, irate,
     depth)
//
//  Input:   infil = ptr. to Green-Ampt infiltration object
//           tstep =  runoff time step (sec),
//           irate = net "rainfall" rate to upper zone (ft/sec);
//                 = rainfall + snowmelt + runon,
//                   does not include ponded water (added on below)
//           depth = depth of ponded water (ft).
//  Output:  returns infiltration rate (ft/sec)
//  Purpose: computes Green-Ampt infiltration when upper soil zone is
//           saturated.
//
{
    let ia, c1, dF, F2;
    let ks = infil.Ks * InfilFactor;                                       //(5.1.013)
    let lu = infil.Lu * Math.sqrt(InfilFactor);                                 //(5.1.013)

    // --- get available infiltration rate (rainfall + ponded water)
    ia = irate + depth / tstep;
    if ( ia < ZERO ) return 0.0;

    // --- re-set new event recovery time
    infil.T = 5400.0 / lu / Evap.recoveryFactor;

    // --- solve G-A equation for new cumulative infiltration volume (F2)
    c1 = (infil.S + depth) * infil.IMD;
    F2 = grnampt_getF2(infil.F, c1, ks, tstep);
    dF = F2 - infil.F;

    // --- all available water infiltrates -- set saturated state to false
    if ( dF > ia * tstep )
    {
        dF = ia * tstep;
        infil.Sat = FALSE;
    }

    // --- update total infiltration and upper zone moisture deficit
    infil.F += dF;
    infil.Fu += dF;
    infil.Fu = MIN(infil.Fu, Fumax);
    return dF / tstep;
}

//=============================================================================
// double f1, double c1, double ks, double ts
function grnampt_getF2(f1, c1, ks, ts)
//
//  Input:   f1 = old infiltration volume (ft)
//           c1 = head * moisture deficit (ft)
//           ks = sat. hyd. conductivity (ft/sec)
//           ts = time step (sec)
//  Output:  returns infiltration volume at end of time step (ft)
//  Purpose: computes new infiltration volume over a time step
//           using Green-Ampt formula for saturated upper soil zone.
//
{
    let    i;
    let f2 = f1;
    let f2min;
    let df2;
    let c2;

    // --- find min. infil. volume
    f2min = f1 + ks * ts;

    // --- use min. infil. volume for 0 moisture deficit
    if ( c1 == 0.0 ) return f2min;

    // --- use direct form of G-A equation for small time steps
    //     and c1/f1 < 100
    if ( ts < 10.0 && f1 > 0.01 * c1 )
    {
        f2 = f1 + ks * (1.0 + c1/f1) * ts;
        return MAX(f2, f2min);
    }

    // --- use Newton-Raphson method to solve integrated G-A equation
    //     (convergence limit reduced from that used in previous releases)
    c2 = c1 * Math.log(f1 + c1) - ks * ts;
    for ( i = 1; i <= 20; i++ )
    {
        df2 = (f2 - f1 - c1 * Math.log(f2 + c1) + c2) / (1.0 - c1 / (f2 + c1) );
        if ( Math.abs(df2) < 0.00001 )
        {
            return MAX(f2, f2min);
        }
        f2 -= df2;
    }
    return f2min;
}

//=============================================================================
// TCurveNum *infil, double p[]
function curvenum_setParams(infil, p)
//
//  Input:   infil = ptr. to Curve Number infiltration object
//           p[] = array of parameter values
//  Output:  returns TRUE if parameters are valid, FALSE otherwise
//  Purpose: assigns Curve Number infiltration parameters to a subcatchment.
//
{

    // --- convert Curve Number to max. infil. capacity
    if ( p[0] < 10.0 ) p[0] = 10.0;
    if ( p[0] > 99.0 ) p[0] = 99.0;
    infil.Smax    = (1000.0 / p[0] - 10.0) / 12.0;
    if ( infil.Smax < 0.0 ) return FALSE;

    // --- convert drying time (days) to a regeneration const. (1/sec)
    if ( p[2] > 0.0 )  infil.regen =  1.0 / (p[2] * SECperDAY);
    else return FALSE;

    // --- compute inter-event time from regeneration const. as in Green-Ampt
    infil.Tmax = 0.06 / infil.regen;

    return TRUE;
}

//==================================// ===========================================
// TCurveNum *infil
function curvenum_initState(infil)
//
//  Input:   infil = ptr. to Curve Number infiltration object
//  Output:  none
//  Purpose: initializes state of Curve Number infiltration for a subcatchment.
//
{
    infil.S  = infil.Smax;
    infil.P  = 0.0;
    infil.F  = 0.0;
    infil.T  = 0.0;
    infil.Se = infil.Smax;
    infil.f  = 0.0;
}
// TCurveNum *infil, double x[]
function curvenum_getState(infil, x)
{
    x[0] = infil.S;
    x[1] = infil.P;
    x[2] = infil.F;
    x[3] = infil.T;
    x[4] = infil.Se;
    x[5] = infil.f;
}
// TCurveNum *infil, double x[]
function curvenum_setState(infil, x)
{
    infil.S  = x[0];
    infil.P  = x[1];
    infil.F  = x[2];
    infil.T  = x[3];
    infil.Se = x[4];
    infil.f  = x[5];
}

//=============================================================================
// TCurveNum *infil, double tstep, double irate,
//    double depth
function curvenum_getInfil(infil, tstep, irate, depth)
//
//  Input:   infil = ptr. to Curve Number infiltration object
//           tstep = runoff time step (sec),
//           irate = rainfall rate (ft/sec);
//           depth = depth of runon + ponded water (ft)
//  Output:  returns infiltration rate (ft/sec)
//  Purpose: computes infiltration rate using the Curve Number method.
//  Note:    this function treats runon from other subcatchments as part
//           of the ponded depth and not as an effective rainfall rate.
{
    let F1;                         // new cumulative infiltration (ft)
    let f1 = 0.0;                   // new infiltration rate (ft/sec)
    let fa = irate + depth/tstep;   // max. available infil. rate (ft/sec)

    // --- case where there is rainfall
    if ( irate > ZERO )
    {
        // --- check if new rain event
        if ( infil.T >= infil.Tmax )
        {
            infil.P = 0.0;
            infil.F = 0.0;
            infil.f = 0.0;
            infil.Se = infil.S;
        }
        infil.T = 0.0;

        // --- update cumulative precip.
        infil.P += irate * tstep;

        // --- find potential new cumulative infiltration
        F1 = infil.P * (1.0 - infil.P / (infil.P + infil.Se));

        // --- compute potential infiltration rate
        f1 = (F1 - infil.F) / tstep;
        if ( f1 < 0.0 || infil.S <= 0.0 ) f1 = 0.0;

    }

    // --- case of no rainfall
    else
    {
        // --- if there is ponded water then use previous infil. rate
        if ( depth > MIN_TOTAL_DEPTH && infil.S > 0.0 )
        {
            f1 = infil.f;
            if ( f1*tstep > infil.S ) f1 = infil.S / tstep;
        }

        // --- otherwise update inter-event time
        else infil.T += tstep;
    }

    // --- if there is some infiltration
    if ( f1 > 0.0 )
    {
        // --- limit infil. rate to max. available rate
        f1 = MIN(f1, fa);
        f1 = MAX(f1, 0.0);

        // --- update actual cumulative infiltration
        infil.F += f1 * tstep;

        // --- reduce infil. capacity if a regen. constant was supplied
        if ( infil.regen > 0.0 )
        {
            infil.S -= f1 * tstep;
            if ( infil.S < 0.0 ) infil.S = 0.0;
        }
    }

    // --- otherwise regenerate infil. capacity
    else
    {
        infil.S += infil.regen * infil.Smax * tstep * Evap.recoveryFactor;
        if ( infil.S > infil.Smax ) infil.S = infil.Smax;
    }
    infil.f = f1;
    return f1;
}

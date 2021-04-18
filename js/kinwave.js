//-----------------------------------------------------------------------------
//   kinwave.c
//
//   Project:  EPA SWMM5
//   Version:  5.1
//   Date:     03/20/14  (Build 5.1.001)
//             03/19/15  (Build 5.1.008)
//             03/01/20  (Build 5.1.014)
//   Author:   L. Rossman (EPA)
//             M. Tryby (EPA)
//
//   Kinematic wave flow routing functions.
//
//   Build 5.1.008:
//   - Conduit inflow passed to function that computes conduit losses.
//
//   Build 5.1.014:
//   - Arguments to function link_getLossRate changed.
//
//-----------------------------------------------------------------------------


//-----------------------------------------------------------------------------
//  Constants 
//-----------------------------------------------------------------------------
var WX      = 0.6;     // distance weighting
var WT      = 0.6;     // time weighting
var EPSIL   = 0.001;   // convergence criterion

//-----------------------------------------------------------------------------
//  Shared variables
//-----------------------------------------------------------------------------
var   Beta1;
var   C1;
var   C2;
var   Afull;
var   Qfull;
//static TXsect*  pXsect;
var pXsect;

//-----------------------------------------------------------------------------
//  External functions (declared in funcs.h)
//-----------------------------------------------------------------------------
//  kinwave_execute  (called by flowrout_execute)
////////////////////////////////////
//let returnObj = {qinflow: qin, qoutflow: qout}
//let returnVal = kinwave_execute(j, returnObj, tStep);
//qin  = returnObj.qinflow;
//qout = returnObj.qoutflow;
////////////////////////////////////
//=============================================================================
// int j, double* qinflow, double* qoutflow, double tStep
function kinwave_execute(j,  inObj, tStep)
//
//  Input:   j = link index
//           qinflow = inflow at current time (cfs)
//           tStep = time step (sec)
//  Output:  qoutflow = outflow at current time (cfs),
//           returns number of iterations used
//  Purpose: finds outflow over time step tStep given flow entering a
//           conduit using Kinematic Wave flow routing.
//
//
//                               ^ q3 
//  t                            |   
//  |          qin, ain |-------------------| qout, aout
//  |                   |  Flow --.        |
//  |---. x     q1, a1 |-------------------| q2, a2
//
//
{
    if(inObj.qinflow > 0){
        let xxx = 0;
    }
    if(j === 3 ){
        let xxx = 0;
    }
    let    k;
    let    result = 1;
    let dxdt, dq;
    let ain, aout;
    let qin, qout;
    let a1, a2, q1, q2, q3;

    let returnObj;
    let returnVal;

    // --- no routing for non-conduit link
    inObj.qoutflow = inObj.qinflow; 
    if ( Link[j].type != CONDUIT ) return result;

    // --- no routing for dummy xsection
    if ( Link[j].xsect.type == DUMMY ) return result;

    // --- assign module-level variables
    pXsect = Link[j].xsect;
    Qfull = Link[j].qFull;
    Afull = Link[j].xsect.aFull;
    k = Link[j].subIndex;
    Beta1 = Conduit[k].beta / Qfull;
 
    // --- normalize previous flows
    q1 = Conduit[k].q1 / Qfull;
    q2 = Conduit[k].q2 / Qfull;

    // --- normalize inflow
    qin = inObj.qinflow / Conduit[k].barrels / Qfull;

    // --- compute evaporation and infiltration loss rate
	q3 = link_getLossRate(j, qin*Qfull) / Qfull;                               //(5.1.014)

    // --- normalize previous areas
    a1 = Conduit[k].a1 / Afull;
    a2 = Conduit[k].a2 / Afull;

    // --- use full area when inlet flow >= full flow
    if ( qin >= 1.0 ) ain = 1.0;

    // --- get normalized inlet area corresponding to inlet flow
    else ain = xsect_getAofS(pXsect, qin/Beta1) / Afull;

    // --- check for no flow
    if ( qin <= TINY && q2 <= TINY )
    {
        qout = 0.0;
        aout = 0.0;
    }

    // --- otherwise solve finite difference form of continuity eqn.
    else
    {
        // --- compute constant factors
        dxdt = link_getLength(j) / tStep * Afull / Qfull;
        dq   = q2 - q1;
        C1   = dxdt * WT / WX;
        C2   = (1.0 - WT) * (ain - a1);
        C2   = C2 - WT * a2;
        C2   = C2 * dxdt / WX;
        C2   = C2 + (1.0 - WX) / WX * dq - qin;
        C2   = C2 + q3 / WX;

        // --- starting guess for aout is value from previous time step
        aout = a2;

        // --- solve continuity equation for aout
        ////////////////////////////////////
        returnObj = {aout: aout}
        returnVal = solveContinuity(qin, ain, returnObj);
        aout  = returnObj.aout;
        ////////////////////////////////////
        //result = solveContinuity(qin, ain, aout);
        result = returnVal;

        // --- report error if continuity eqn. not solved
        if ( result == -1 )
        {
            report_writeErrorMsg(ERR_KINWAVE, Link[j].ID);
            return 1;
        }
        if ( result <= 0 ) result = 1;

        // --- compute normalized outlet flow from outlet area
        qout = Beta1 * xsect_getSofA(pXsect, aout*Afull);
        if ( qin > 1.0 ) qin = 1.0;
    }

    // --- save new flows and areas
    Conduit[k].q1 = qin * Qfull;
    Conduit[k].a1 = ain * Afull;
    Conduit[k].q2 = qout * Qfull;
    Conduit[k].a2 = aout * Afull;
    Conduit[k].fullState =
        link_getFullState(Conduit[k].a1, Conduit[k].a2, Afull);
    inObj.qinflow  = Conduit[k].q1 * Conduit[k].barrels;
    inObj.qoutflow = Conduit[k].q2 * Conduit[k].barrels;
    return result;
}

//=============================================================================
// double qin, double ain, double* aout
////////////////////////////////////
//let returnObj = {aout: aout}
//let returnVal = solveContinuity(j, ain, returnObj);
//aout  = returnObj.aout;
////////////////////////////////////
//function solveContinuity(qin, ain, aout)
function solveContinuity(qin, ain, inObj)
//
//  Input:   qin = upstream normalized flow
//           ain = upstream normalized area
//           aout = downstream normalized area
//  Output:  new value for aout; returns an error code
//  Purpose: solves continuity equation f(a) = Beta1*S(a) + C1*a + C2 = 0
//           for 'a' using the Newton-Raphson root finder function.
//           Return code has the following meanings:
//           >= 0 number of function evaluations used
//           -1   Newton function failed
//           -2   flow always above max. flow
//           -3   flow always below zero
//
//     Note: pXsect (pointer to conduit's cross-section), and constants Beta1,
//           C1, and C2 are module-level shared variables assigned values
//           in kinwave_execute().
//
{
    let    n;                          // # evaluations or error code
    let aLo, aHi, aTmp;             // lower/upper bounds on a
    let fLo, fHi;                   // lower/upper bounds on f
    let tol = EPSIL;                // absolute convergence tol.

    // ret facil
    let returnObj;
    let returnVal;

    // --- first determine bounds on 'a' so that f(a) passes through 0.

    // --- set upper bound to area at full flow
    aHi = 1.0;
    fHi = 1.0 + C1 + C2;

    // --- try setting lower bound to area where section factor is maximum
    aLo = xsect_getAmax(pXsect) / Afull;
    if ( aLo < aHi )
    {
        fLo = ( Beta1 * pXsect.sMax ) + (C1 * aLo) + C2;
    }
    else fLo = fHi;

    // --- if fLo and fHi have same sign then set lower bound to 0
    if ( fHi*fLo > 0.0 )
    {
        aHi = aLo;
        fHi = fLo;
        aLo = 0.0;
        fLo = C2;
    }

    // --- proceed with search for root if fLo and fHi have different signs
    if ( fHi*fLo <= 0.0 )
    {
        // --- start search at midpoint of lower/upper bounds
        //     if initial value outside of these bounds
		if ( inObj.aout < aLo || inObj.aout > aHi ) inObj.aout = 0.5*(aLo + aHi);

        // --- if fLo > fHi then switch aLo and aHi
        if ( fLo > fHi )
        {
            aTmp = aLo;
            aLo  = aHi;
            aHi  = aTmp;
        }

        // --- call the Newton root finder method passing it the 
        //     evalContinuity function to evaluate the function
        //     and its derivatives
        ////////////////////////////////////
        returnObj = {rts: inObj.aout, p: null}
        returnVal = findroot_Newton(aLo, aHi, returnObj, tol, evalContinuity)
        inObj.aout = returnObj.rts;
        ////////////////////////////////////
        n = returnVal;
        //n = findroot_Newton(aLo, aHi, inObj.aout, tol, evalContinuity, null);

        // --- check if root finder succeeded
        if ( n <= 0 ) n = -1;
    }

    // --- if lower/upper bound functions both negative then use full flow
    else if ( fLo < 0.0 )
    {
        if ( qin > 1.0 ) inObj.aout = ain;
        else inObj.aout = 1.0;
        n = -2;
    }

    // --- if lower/upper bound functions both positive then use no flow
    else if ( fLo > 0 )
    {
        inObj.aout = 0.0;
        n = -3;
    }
    else n = -1;
    return n;
}

//=============================================================================
////////////////////////////////////
//let returnObj = {f: val1, df: val2, p: val3}
//let returnVal = evalContinuity(a, returnObj)
//val1 = returnObj.f;
//val2 = returnObj.df;
//val3 = returnObj.p;
////////////////////////////////////
function evalContinuity(a, inObj)
//void evalContinuity(double a, double* f, double* df, void* p)
//
//  Input:   a = outlet normalized area
//  Output:  f = value of continuity eqn.
//           df = derivative of continuity eqn.
//  Purpose: computes value of continuity equation (f) and its derivative (df)
//           w.r.t. normalized area for link with normalized outlet area 'a'.
//
{
    inObj.f  = (Beta1 * xsect_getSofA(pXsect, a*Afull)) + (C1 * a) + C2;
    inObj.df = (Beta1 * Afull * xsect_getdSdA(pXsect, a*Afull)) + C1;
}

//=============================================================================

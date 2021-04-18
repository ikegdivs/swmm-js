//-----------------------------------------------------------------------------
//   findroot.c
//
//   Finds solution of func(x) = 0 using either the Newton-Raphson
//   method or Ridder's Method.
//   Based on code from Numerical Recipes in C (Cambridge University
//   Press, 1992).
//
//   Date:     11/19/13
//   Author:   L. Rossman
//-----------------------------------------------------------------------------

function SIGN(a,b) {
    if(b >= 0.0) {
        return Math.abs(a);
     } else {
        return -Math.abs(a);
     } 
}
var MAXIT = 60

////////////////////////////////////
//let returnObj = {rts: val1, p: val2}
//let returnVal = findroot_Newton(x1, x2, returnObj, xacc, func)
//val1 = returnObj.rts;
//val2 = returnObj.p
////////////////////////////////////
function findroot_Newton(x1, x2, inObj, xacc, func)
//int findroot_Newton(double x1, double x2, double* rts, double xacc,
//                    void (*func) (double x, double* f, double* df, void* p),
//					void* p)
//
//  Using a combination of Newton-Raphson and bisection, find the root of a
//  function func bracketed between x1 and x2. The root, returned in rts,
//  will be refined until its accuracy is known within +/-xacc. func is a
//  user-supplied routine, that returns both the function value and the first
//  derivative of the function. p is a pointer to any auxilary data structure
//  that func may require. It can be NULL if not needed. The function returns
//  the number of function evaluations used or 0 if the maximum allowed
//  iterations were exceeded.
//
// NOTES:
// 1. The calling program must insure that the signs of func(x1) and func(x2)
//    are not the same, otherwise x1 and x2 do not bracket the root.
// 2. If func(x1) > func(x2) then the order of x1 and x2 should be
//    switched in the call to Newton.
//
{
    let j, n = 0;
    let df, dx, dxold, f, x;
    let temp, xhi, xlo;

    // ret facil
    let returnObj;
    let returnVal;

    // Initialize the "stepsize before last" and the last step.
    x = inObj.rts;
    xlo = x1;
    xhi = x2;
    dxold = Math.abs(x2-x1);
    dx = dxold;

    ////////////////////////////////////
    returnObj = {f: f, df: df, p: inObj.p}
    returnVal = func(x, returnObj)
    f = returnObj.f;
    df = returnObj.df;
    inObj.p = returnObj.p;
    ////////////////////////////////////
    //func(x, &f, &df, inObj.p);
    n++;

    // Loop over allowed iterations.
    for (j=1; j<=MAXIT; j++)
    {
        // Bisect if Newton out of range or not decreasing fast enough.
        if ( ( ( (x-xhi)*df-f)*((x-xlo)*df-f) >= 0.0
        || (Math.abs(2.0*f) > Math.abs(dxold*df) ) ) )
        {
            dxold = dx;
            dx = 0.5*(xhi-xlo);
            x = xlo + dx;
            if ( xlo == x ) break;
        }

        // Newton step acceptable. Take it.
        else
        {
            dxold = dx;
            dx = f/df;
            temp = x;
            x -= dx;
            if ( temp == x ) break;
        }

        // Convergence criterion.
        if ( Math.abs(dx) < xacc ) break;
 
        // Evaluate function. Maintain bracket on the root.
        ////////////////////////////////////
        returnObj = {f: f, df: df, p: inObj.p}
        returnVal = func(x, returnObj)
        f = returnObj.f;
        df = returnObj.df;
        inObj.p = returnObj.p;
        ////////////////////////////////////
        //func(x, &f, &df, inObj.p);
        n++;
        if ( f < 0.0 ) xlo = x;
        else           xhi = x;
    }
    inObj.rts = x;
    if ( n <= MAXIT) return n;
    else return 0;
};


////////////////////////////////////
//let returnObj = {p: val1}
//let returnVal = findroot_Ridder(x1, x2, xacc, func, returnObj)
//val1 = returnObj.p;
////////////////////////////////////
function findroot_Ridder(x1, x2, xacc, func, inObj)
//double findroot_Ridder(double x1, double x2, double xacc,
//	double (*func)(double, void* p), void* p)
{
    let j;
    let ans, fhi, flo, fm, fnew, s, xhi, xlo, xm, xnew;

    // ret facil
    let returnObj;
    let returnVal;

    ////////////////////////////////////
    returnObj = {p: inObj.p}
    returnVal = func(x1, returnObj)
    inObj.p = returnObj.p;
    flo = returnVal;
    ////////////////////////////////////
    //flo = func(x1, inObj.p);
    ////////////////////////////////////
    returnObj = {p: inObj.p}
    returnVal = func(x2, returnObj)
    inObj.p = returnObj.p;
    fhi = returnVal;
    ////////////////////////////////////
    //fhi = func(x2, inObj.p);
    if ( flo == 0.0 ) return x1;
    if ( fhi == 0.0 ) return x2;
    ans = 0.5*(x1+x2);
    if ( (flo > 0.0 && fhi < 0.0) || (flo < 0.0 && fhi > 0.0) )
    {
        xlo = x1;
        xhi = x2;
        for (j=1; j<=MAXIT; j++) {
            xm = 0.5*(xlo + xhi);

            ////////////////////////////////////
            returnObj = {p: inObj.p}
            returnVal = func(xm, returnObj)
            inObj.p = returnObj.p;
            fm = returnVal;
            ////////////////////////////////////
            //fm = func(xm, inObj.p);
            s = sqrt( fm*fm - flo*fhi );
            if (s == 0.0) return ans;
            xnew = xm + (xm-xlo)*( (flo >= fhi ? 1.0 : -1.0)*fm/s );
            if ( Math.abs(xnew - ans) <= xacc ) break;
            ans = xnew;

            ////////////////////////////////////
            returnObj = {p: inObj.p}
            returnVal = func(ans, returnObj)
            inObj.p = returnObj.p;
            fnew = returnVal;
            ////////////////////////////////////
            //fnew = func(ans, inObj.p);
            if ( SIGN(fm, fnew) != fm)
            {
                xlo = xm;
                flo = fm;
                xhi = ans;
                fhi = fnew;
            }
            else if ( SIGN(flo, fnew) != flo )
            {
                xhi = ans;
                fhi = fnew;
            }
            else if ( SIGN(fhi, fnew) != fhi)
            {
                xlo = ans;
                flo = fnew;
            }
            else return ans;
            if ( Math.abs(xhi - xlo) <= xacc ) return ans;
        }
        return ans;
    }
    return -1.e20;
}

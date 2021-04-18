//-----------------------------------------------------------------------------
//   treatmnt.c
//
//   Project:  EPA SWMM5
//   Version:  5.1
//   Date:     03/20/14   (Build 5.1.001)
//             03/19/15   (Build 5.1.008)
//   Author:   L. Rossman
//
//   Pollutant treatment functions.
//
//   Build 5.1.008:
//   - A bug in evaluating recursive calls to treatment functions was fixed. 
//
//-----------------------------------------------------------------------------


//-----------------------------------------------------------------------------
//  Constants
//-----------------------------------------------------------------------------
var PVMAX = 5;            // number of process variables
//enum   ProcessVarType {
var pvHRT = 0          // hydraulic residence time
var pvDT = 1           // time step duration
var pvFLOW = 2         // flow rate
var pvDEPTH = 3        // water height above invert
var pvAREA = 4;        // storage surface area

//-----------------------------------------------------------------------------
//  Shared variables
//-----------------------------------------------------------------------------
var ErrCode;                // treatment error code
var J;                      // index of node being analyzed
var Dt;                     // curent time step (sec)
var Q;                      // node inflow (cfs)
var V;                      // node volume (ft3)
var R = [];                      // array of pollut. removals
var Cin = [];                    // node inflow concentrations

//-----------------------------------------------------------------------------
//  External functions (declared in funcs.h)
//-----------------------------------------------------------------------------
//  treatmnt_open           (called from routing_open)
//  treatment_close         (called from routing_close)
//  treatmnt_readExpression (called from parseLine in input.c)
//  treatmnt_delete         (called from deleteObjects in project.c)
//  treatmnt_setInflow      (called from qualrout_execute)
//  treatmnt_treat          (called from findNodeQual in qualrout.c)


//=============================================================================
// void
function  treatmnt_open()
//
//  Input:   none
//  Output:  returns true if successful, false if not
//  Purpose: allocates memory for computing pollutant removals by treatment.
//
{
    R = null;
    Cin = null;
    if ( Nobjects[POLLUT] > 0 )
    {
        // R = (double *) calloc(Nobjects[POLLUT], sizeof(double));
        R = new Array(Nobjects[POLLUT]);
        // Cin = (double *) calloc(Nobjects[POLLUT], sizeof(double));
        Cin = new Array(Nobjects[POLLUT]);
        if ( R == null || Cin == null)
        {
            report_writeErrorMsg(ERR_MEMORY, "");
            return false;
        }
    }
    return true;
}

//=============================================================================
// void
function treatmnt_close()
//
//  Input:   none
//  Output:  returns an error code
//  Purpose: frees memory used for computing pollutant removals by treatment.
//
{
    FREE(R);
    FREE(Cin);
}

//=============================================================================
// char* tok[], int ntoks
function  treatmnt_readExpression(tok, ntoks)
//
//  Input:   tok[] = array of string tokens
//           ntoks = number of tokens
//  Output:  returns an error code
//  Purpose: reads a treatment expression from a tokenized line of input.
//
{
    let  s;
    let expr = '';
    let   i, j, k, p;
    //MathExpr* equation;                // ptr. to a math. expression
    let equation;

    // --- retrieve node & pollutant
    if ( ntoks < 3 ) return error_setInpError(ERR_ITEMS, "");
    j = project_findObject(NODE, tok[0]);
    if ( j < 0 ) return error_setInpError(ERR_NAME, tok[0]);
    p = project_findObject(POLLUT, tok[1]);
    if ( p < 0 ) return error_setInpError(ERR_NAME, tok[1]);

    // --- concatenate remaining tokens into a single string
    strcpy(s, tok[2]);
    for ( i=3; i<ntoks; i++)
    {
        strcat(s, " ");
        strcat(s, tok[i]);
    }

    // --- check treatment type
    if      ( UCHAR(s[0]) == 'R' ) k = 0;
    else if ( UCHAR(s[0]) == 'C' ) k = 1;
    else return error_setInpError(ERR_KEYWORD, tok[2]);

    // --- start treatment expression after equals sign
    expr = strchr(s, '=');
    if ( expr == null ) return error_setInpError(ERR_KEYWORD, "");
    else expr++;

    // --- create treatment objects at node j if they don't already exist
    if ( Node[j].treatment == null )
    {
        if ( !createTreatment(j) ) return error_setInpError(ERR_MEMORY, "");
    }

    // --- create a parsed expression tree from the string expr
    //     (getVariableIndex is the function that converts a treatment
    //      variable's name into an index number) 
    equation = mathexpr_create(expr, getVariableIndex);
    if ( equation == null )
        return error_setInpError(ERR_TREATMENT_EXPR, "");

    // --- save the treatment parameters in the node's treatment object
    Node[j].treatment[p].treatType = k;
    Node[j].treatment[p].equation = equation;
    return 0;
}

//=============================================================================
// int j
function treatmnt_delete(j)
//
//  Input:   j = node index
//  Output:  none
//  Purpose: deletes the treatment objects for each pollutant at a node.
//
{
    let p;
    if ( Node[j].treatment )
    {
        for (p=0; p<Nobjects[POLLUT]; p++)
            mathexpr_delete(Node[j].treatment[p].equation);
        Node[j].treatment = null;
    }
    Node[j].treatment = null;
}

//=============================================================================
// double qIn, double wIn[]
function  treatmnt_setInflow(qIn, wIn)
//
//  Input:   j = node index
//           qIn = flow inflow rate (cfs)
//           wIn = pollutant mass inflow rate (mass/sec)
//  Output:  none
//  Purpose: computes and saves array of inflow concentrations to a node.
//
{
    let    p;
    if ( qIn > 0.0 )
        for (p = 0; p < Nobjects[POLLUT]; p++) Cin[p] = wIn[p]/qIn;
    else
        for (p = 0; p < Nobjects[POLLUT]; p++) Cin[p] = 0.0;
}

//=============================================================================
// int j, double q, double v, double tStep
function  treatmnt_treat(j, q, v, tStep)
//
//  Input:   j     = node index
//           q     = inflow to node (cfs)
//           v     = volume of node (ft3)
//           tStep = routing time step (sec)
//  Output:  none
//  Purpose: updates pollutant concentrations at a node after treatment.
//
{
    let    p;                          // pollutant index
    let cOut;                       // concentration after treatment
    let massLost;                   // mass lost by treatment per time step
    //TTreatment* treatment;             // pointer to treatment object
    let treatment;

    // --- set locally shared variables for node j
    if ( Node[j].treatment == null ) return;
    ErrCode = 0;
    J  = j;                            // current node
    Dt = tStep;                        // current time step
    Q  = q;                            // current inflow rate
    V  = v;                            // current node volume

    // --- initialze each removal to indicate no value 
    for ( p = 0; p < Nobjects[POLLUT]; p++) R[p] = -1.0;

    // --- determine removal of each pollutant
    for ( p = 0; p < Nobjects[POLLUT]; p++)
    {
        // --- removal is zero if there is no treatment equation
        treatment = Node[j].treatment[p];
        if ( treatment.equation == null ) R[p] = 0.0;

        // --- no removal for removal-type expression when there is no inflow 
	    else if ( treatment.treatType == REMOVAL && q <= ZERO ) R[p] = 0.0;

        // --- otherwise evaluate the treatment expression to find R[p]
        else getRemoval(p);
    }

    // --- check for error condition
    if ( ErrCode == ERR_CYCLIC_TREATMENT )
    {
         report_writeErrorMsg(ERR_CYCLIC_TREATMENT, Node[J].ID);
    }

    // --- update nodal concentrations and mass balances
    else for ( p = 0; p < Nobjects[POLLUT]; p++ )
    {
        if ( R[p] == 0.0 ) continue;
        treatment = Node[j].treatment[p];

        // --- removal-type treatment equations get applied to inflow stream

        if ( treatment.treatType == REMOVAL )
        {
            // --- if no pollutant in inflow then cOut is current nodal concen.
            if ( Cin[p] == 0.0 ) cOut = Node[j].newQual[p];

            // ---  otherwise apply removal to influent concen.
            else cOut = (1.0 - R[p]) * Cin[p];

            // --- cOut can't be greater than mixture concen. at node
            //     (i.e., in case node is a storage unit) 
            cOut = MIN(cOut, Node[j].newQual[p]);
        }

        // --- concentration-type equations get applied to nodal concentration
        else
        {
            cOut = (1.0 - R[p]) * Node[j].newQual[p];
        }

        // --- mass lost must account for any initial mass in storage 
        massLost = (Cin[p]*q*tStep + Node[j].oldQual[p]*Node[j].oldVolume - 
                   cOut*(q*tStep + Node[j].oldVolume)) / tStep; 
        massLost = MAX(0.0, massLost); 

        // --- add mass loss to mass balance totals and revise nodal concentration
        massbal_addReactedMass(p, massLost);
        Node[j].newQual[p] = cOut;
    }
}

//=============================================================================
// int j
function  createTreatment(j)
//
//  Input:   j = node index
//  Output:  returns true if successful, false if not
//  Purpose: creates a treatment object for each pollutant at a node.
//
{
    let p;
    //Node[j].treatment = (TTreatment *) calloc(Nobjects[POLLUT], sizeof(TTreatment));
    for(let i = 0; i < Nobjects[POLLUT]; i++){Node[j].treatment.push(new TTreatment())}
    
    if ( Node[j].treatment == null )
    {
        return false;
    }
    for (p = 0; p < Nobjects[POLLUT]; p++)
    {
        Node[j].treatment[p].equation = null;
    }
    return true;
}

//=============================================================================
// char* s
function  getVariableIndex(s)
//
//  Input:   s = name of a process variable or pollutant
//  Output:  returns index of process variable or pollutant
//  Purpose: finds position of process variable/pollutant in list of names.
//
{
    // --- check for a process variable first
    let k;
    let m = PVMAX;                     // PVMAX is number of process variables

    k = findmatch(s, ProcessVarWords);
    if ( k >= 0 ) return k;

    // --- then check for a pollutant concentration
    k = project_findObject(POLLUT, s);
    if ( k >= 0 ) return (k + m);

    // --- finally check for a pollutant removal
    if ( UCHAR(s[0]) == 'R' && s[1] == '_')
    {
        k = project_findObject(POLLUT, s+2);
        if ( k >= 0 ) return (Nobjects[POLLUT] + k + m);
    }
    return -1;
}

//=============================================================================
// int varCode
function getVariableValue(varCode)
//
//  Input:   varCode = code number of process variable or pollutant
//  Output:  returns current value of variable
//  Purpose: finds current value of a process variable or pollutant concen.,
//           making reference to the node being evaluated which is stored in
//           shared variable J.
//
{
    let    p;
    let a1, a2, y;
    //TTreatment* treatment;
    let treatment;

    // --- variable is a process variable
    if ( varCode < PVMAX )
    {
        switch ( varCode )
        {
          case pvHRT:                                 // HRT in hours
            if ( Node[J].type == STORAGE )
            {
                return Storage[Node[J].subIndex].hrt / 3600.0;
            }
            else return 0.0;

          case pvDT:
            return Dt;                                // time step in seconds

          case pvFLOW:
            return Q * UCF(FLOW);                     // flow in user's units

          case pvDEPTH:
            y = (Node[J].oldDepth + Node[J].newDepth) / 2.0;
            return y * UCF(LENGTH);                   // depth in ft or m

          case pvAREA:
            a1 = node_getSurfArea(J, Node[J].oldDepth);
            a2 = node_getSurfArea(J, Node[J].newDepth);
            return (a1 + a2) / 2.0 * UCF(LENGTH) * UCF(LENGTH);
            
          default: return 0.0;
        }
    }

    // --- variable is a pollutant concentration
    else if ( varCode < PVMAX + Nobjects[POLLUT] )
    {
        p = varCode - PVMAX;
        treatment = Node[J].treatment[p];
        if ( treatment.treatType == REMOVAL ) return Cin[p];
        return Node[J].newQual[p];
    }

    // --- variable is a pollutant removal
    else
    {
        p = varCode - PVMAX - Nobjects[POLLUT];
        if ( p >= Nobjects[POLLUT] ) return 0.0;
        return getRemoval(p);
    }
}

//=============================================================================
// int p
function  getRemoval(p)
//
//  Input:   p = pollutant index
//  Output:  returns fractional removal of pollutant
//  Purpose: computes removal of a specific pollutant
//
{
    let c0 = Node[J].newQual[p];    // initial node concentration
    let r;                          // removal value
    //TTreatment* treatment;
    let treatment;

    // return facilitators;
    let returnObj;
    let returnVal;

    // --- case where removal already being computed for another pollutant
    if ( R[p] > 1.0 || ErrCode )
    {
        ErrCode = 1;
        return 0.0;
    }

    // --- case where removal already computed
    if ( R[p] >= 0.0 && R[p] <= 1.0 ) return R[p];

    // --- set R[p] to value > 1 to show that value is being sought
    //     (prevents infinite recursive calls in case two removals
    //     depend on each other)
    R[p] = 10.0;

    // --- case where current concen. is zero
    if ( c0 == 0.0 )
    {
        R[p] = 0.0;
        return 0.0;
    }

    // --- apply treatment eqn.
    treatment = Node[J].treatment[p];
    ////////////////////////////////////
    returnObj = {expr: treatment.equation, getVariableValue: function (varCode)
        //
        //  Input:   varCode = code number of process variable or pollutant
        //  Output:  returns current value of variable
        //  Purpose: finds current value of a process variable or pollutant concen.,
        //           making reference to the node being evaluated which is stored in
        //           shared variable J.
        //
        {
            let    p;
            let a1, a2, y;
            //TTreatment* treatment;
            let treatment;
        
            // --- variable is a process variable
            if ( varCode < PVMAX )
            {
                switch ( varCode )
                {
                  case pvHRT:                                 // HRT in hours
                    if ( Node[J].type == STORAGE )
                    {
                        return Storage[Node[J].subIndex].hrt / 3600.0;
                    }
                    else return 0.0;
        
                  case pvDT:
                    return Dt;                                // time step in seconds
        
                  case pvFLOW:
                    return Q * UCF(FLOW);                     // flow in user's units
        
                  case pvDEPTH:
                    y = (Node[J].oldDepth + Node[J].newDepth) / 2.0;
                    return y * UCF(LENGTH);                   // depth in ft or m
        
                  case pvAREA:
                    a1 = node_getSurfArea(J, Node[J].oldDepth);
                    a2 = node_getSurfArea(J, Node[J].newDepth);
                    return (a1 + a2) / 2.0 * UCF(LENGTH) * UCF(LENGTH);
                    
                  default: return 0.0;
                }
            }
        
            // --- variable is a pollutant concentration
            else if ( varCode < PVMAX + Nobjects[POLLUT] )
            {
                p = varCode - PVMAX;
                treatment = Node[J].treatment[p];
                if ( treatment.treatType == REMOVAL ) return Cin[p];
                return Node[J].newQual[p];
            }
        
            // --- variable is a pollutant removal
            else
            {
                p = varCode - PVMAX - Nobjects[POLLUT];
                if ( p >= Nobjects[POLLUT] ) return 0.0;
                return getRemoval(p);
            }
        }}
    returnVal = mathexpr_eval(returnObj);
    treatment.equation = returnObj.expr;
    ////////////////////////////////////
    r = returnVal;
    //r = mathexpr_eval(treatment.equation, getVariableValue);
    r = MAX(0.0, r);

    // --- case where treatment eqn. is for removal
    if ( treatment.treatType == REMOVAL )
    {
        r = MIN(1.0, r);
        R[p] = r;
    }

    // --- case where treatment eqn. is for effluent concen.
    else
    {
        r = MIN(c0, r);
        R[p] = 1.0 - r/c0;
    }
    return R[p];
}

//=============================================================================

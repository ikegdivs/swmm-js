
class TStorageVol{
    constructor(k, v){
        // Storage unit index
        this.k = k;
        // Storage unit volume (ft3)
        this.v = v;
    }
}

//
//  Input:   j = node index
//           type = node type code
//           k = index of node type
//           tok[] = array of string tokens
//           ntoks = number of tokens
//  Output:  returns an error code
//  Purpose: reads node properties from a tokenized line of input.
//
function node_readParams(j, type, k, tok, ntoks){
    switch ( type )
    {
      case JUNCTION: return junc_readParams(j, k, tok, ntoks);
      case OUTFALL:  return outfall_readParams(j, k, tok, ntoks);
      case STORAGE:  return storage_readParams(j, k, tok, ntoks);
      case DIVIDER:  return divider_readParams(j, k, tok, ntoks);
      default:       return 0;
    }
}


//=============================================================================

function  node_setParams(j, type, k, x)
//
//  Input:   j = node index
//           type = node type code
//           k = index of node type
//           x[] = array of property values
//  Output:  none
//  Purpose: assigns property values to a node.
//
{
    Node[j].type       = type;
    Node[j].subIndex   = k;
    Node[j].invertElev = x[0] / UCF(LENGTH);
    Node[j].crownElev  = Node[j].invertElev;
    Node[j].initDepth  = 0.0;
    Node[j].newVolume  = 0.0;
    Node[j].fullVolume = 0.0;
    Node[j].fullDepth  = 0.0;
    Node[j].surDepth   = 0.0;
    Node[j].pondedArea = 0.0;
    Node[j].degree     = 0;
    switch (type)
    {
      case JUNCTION:
        Node[j].fullDepth = x[1] / UCF(LENGTH);
        Node[j].initDepth = x[2] / UCF(LENGTH);
        Node[j].surDepth  = x[3] / UCF(LENGTH);
        Node[j].pondedArea = x[4] / (UCF(LENGTH)*UCF(LENGTH));
        break;

      case OUTFALL:
        Outfall[k].type        = x[1];
        Outfall[k].fixedStage  = x[2] / UCF(LENGTH);
        Outfall[k].tideCurve   = x[3];
        Outfall[k].stageSeries = x[4];
        Outfall[k].hasFlapGate = x[5];
        Outfall[k].routeTo     = x[6];
        Outfall[k].wRouted     = null;
        if ( Outfall[k].routeTo >= 0 )
        {
            /*Outfall[k].wRouted =
                (double *) calloc(Nobjects[POLLUT], sizeof(double));*/
            Outfall[k].wRouted = new Array(Nobjects[POLLUT]);
        }
        break;

      case STORAGE:
        Node[j].fullDepth  = x[1] / UCF(LENGTH);
        Node[j].initDepth  = x[2] / UCF(LENGTH);
        Storage[k].aCoeff  = x[3];
        Storage[k].aExpon  = x[4];
        Storage[k].aConst  = x[5];
        Storage[k].aCurve  = x[6];

        // Surcharge depth replaces ponded area                                //(5.1.013)
        Node[j].surDepth   = x[7] / UCF(LENGTH);                               //
        
        Storage[k].fEvap   = x[8];
        break;

      case DIVIDER:
        Divider[k].link      = x[1];
        Divider[k].type      = x[2];
        Divider[k].flowCurve = x[3];
        Divider[k].qMin      = x[4] / UCF(FLOW);
        Divider[k].dhMax     = x[5];
        Divider[k].cWeir     = x[6];
        Node[j].fullDepth    = x[7] / UCF(LENGTH);
        Node[j].initDepth    = x[8] / UCF(LENGTH);
        Node[j].surDepth     = x[9] / UCF(LENGTH);
        Node[j].pondedArea   = x[10] / (UCF(LENGTH)*UCF(LENGTH));
        break;
    }
}

//=============================================================================

function  node_validate(j)
//
//  Input:   j = node index
//  Output:  none
//  Purpose: validates a node's properties.
//
{
    let inflow = new TDwfInflow();

    // ret facil
    let returnObj;
    let returnVal;

    // --- see if full depth was increased to accommodate conduit crown
    if ( Node[j].fullDepth > Node[j].oldDepth && Node[j].oldDepth > 0.0 )
    {
        report_writeWarningMsg(WARN02, Node[j].ID);
    }

    // --- check that initial depth does not exceed max. depth
    if ( Node[j].initDepth > Node[j].fullDepth + Node[j].surDepth )
        report_writeErrorMsg(ERR_NODE_DEPTH, Node[j].ID);

    // --- check for negative volume for storage node at full depth            //(5.1.015)
    if (Node[j].type == STORAGE)                                               //
        if (node_getVolume(j, Node[j].fullDepth) < 0.0)                        //
            report_writeErrorMsg(ERR_STORAGE_VOLUME, Node[j].ID);              //

    if ( Node[j].type == DIVIDER ) divider_validate(j);

    // --- initialize dry weather inflows
    inflow = Node[j].dwfInflow;
    while (inflow)
    {
        ////////////////////////////////////
        returnObj = {inflow: inflow}
        returnVal = inflow_initDwfInflow(returnObj)
        inflow = returnObj.inflow;
        ////////////////////////////////////

        //inflow_initDwfInflow(inflow);
        inflow = inflow.next;
    }
}


//=============================================================================

function node_initState(j)
//
//  Input:   j = node index
//  Output:  none
//  Purpose: initializes a node's state variables at start of simulation.
//
{
    let p, k;

    // --- initialize depth
    Node[j].oldDepth = Node[j].initDepth;
    Node[j].newDepth = Node[j].oldDepth;
    Node[j].crownElev = Node[j].invertElev;

    Node[j].fullVolume = node_getVolume(j, Node[j].fullDepth);
    Node[j].oldVolume = node_getVolume(j, Node[j].oldDepth);
    Node[j].newVolume = Node[j].oldVolume;

    // --- initialize water quality state
    for (p = 0; p < Nobjects[POLLUT]; p++)
    {
        Node[j].oldQual[p]  = 0.0;
        Node[j].newQual[p]  = 0.0;
    }

    // --- initialize any inflow
    Node[j].oldLatFlow = 0.0;
    Node[j].newLatFlow = 0.0;
    Node[j].losses = 0.0;

    // --- initialize storage nodes
    if ( Node[j].type == STORAGE )
    {
        // --- set hydraulic residence time to 0
        k = Node[j].subIndex;
        Storage[k].hrt = 0.0;

        // --- initialize exfiltration properties
        if ( Storage[k].exfil ) exfil_initState(k);
    }

    // --- initialize flow stream routed from outfall onto a subcatchment
    if ( Node[j].type == OUTFALL )
    {
        k = Node[j].subIndex;
        if ( Outfall[k].routeTo >= 0 )
        {
            Outfall[k].vRouted = 0.0;
            for (p = 0; p < Nobjects[POLLUT]; p++) Outfall[k].wRouted[p] = 0.0;
        }
    }
}

//=============================================================================

function node_setOldHydState(j)
//
//  Input:   j = node index
//  Output:  none
//  Purpose: replaces a node's old hydraulic state values with new ones.
//
{
    Node[j].oldDepth    = Node[j].newDepth;
    Node[j].oldVolume   = Node[j].newVolume;
}

//=============================================================================

function node_setOldQualState(j)
//
//  Input:   j = node index
//  Output:  none
//  Purpose: replaces a node's old water quality state values with new ones.
//
{
    let p;
    for (p = 0; p < Nobjects[POLLUT]; p++)
    {
        Node[j].oldQual[p] = Node[j].newQual[p];
        Node[j].newQual[p] = 0.0;
    }
}

//=============================================================================

function node_initInflow(j, tStep)
//
//  Input:   j = node index
//           tStep = time step (sec)
//  Output:  none
//  Purpose: initializes a node's inflow at start of next time step.
//
{
    // --- initialize inflow & outflow
    Node[j].oldFlowInflow = Node[j].inflow;
    Node[j].oldNetInflow  = Node[j].inflow - Node[j].outflow;
    Node[j].inflow = Node[j].newLatFlow;
    Node[j].outflow = Node[j].losses;

    // --- set overflow to any excess stored volume
    if ( Node[j].newVolume > Node[j].fullVolume )
        Node[j].overflow = (Node[j].newVolume - Node[j].fullVolume) / tStep;
    else Node[j].overflow = 0.0;
}

//=============================================================================

function node_getDepth(j, v)
//
//  Input:   j = node index
//           v = volume (ft3)
//  Output:  returns depth of water at a node (ft)
//  Purpose: computes a node's water depth from its volume.
//
{
    switch ( Node[j].type )
    {
      case STORAGE: return storage_getDepth(j, v);
      default:      return 0.0;
    }
}

//=============================================================================

function node_getVolume(j, d)
//
//  Input:   j = node index
//           d = water depth (ft)
//  Output:  returns volume of water at a node (ft3)
//  Purpose: computes volume stored at a node from its water depth.
//
{
    switch ( Node[j].type )
    {
      case STORAGE: return storage_getVolume(j, d);

      default:
        if ( Node[j].fullDepth > 0.0 )
            return Node[j].fullVolume * (d / Node[j].fullDepth);
        else return 0.0;
    }
}

//=============================================================================

function  node_getSurfArea(j, d)
//
//  Input:   j = node index
//           d = water depth (ft)
//  Output:  returns surface area of water at a node (ft2)
//  Purpose: computes surface area of water stored at a node from water depth.
//
{
    switch (Node[j].type)
    {
      case STORAGE: return storage_getSurfArea(j, d);
      default:      return 0.0;        
    }
}

//=============================================================================

function node_getOutflow(j, k)
//
//  Input:   j = node index
//           k = link index
//  Output:  returns flow rate (cfs)
//  Purpose: computes outflow from node available for inflow into a link.
//
{
    switch ( Node[j].type )
    {
      case DIVIDER: return divider_getOutflow(j, k);
      case STORAGE: return storage_getOutflow(j, k);
      default:      return Node[j].inflow + Node[j].overflow;
    }
}

//=============================================================================

function node_getMaxOutflow(j, q, tStep)
//
//  Input:   j = node index
//           q = original outflow rate (cfs)
//           tStep = time step (sec)
//  Output:  returns modified flow rate (cfs)
//  Purpose: limits outflow rate from a node with storage volume.
//
{
    let qMax;
    if ( Node[j].fullVolume > 0.0 )
    {
        qMax = Node[j].inflow + Node[j].oldVolume / tStep;
        if ( q > qMax ) q = qMax;
    }
    return MAX(0.0, q);
}

//=============================================================================
// This should be taking in isFlooded's parent 
function node_getSystemOutflow(j, isFlooded)
//
//  Input:   j = node index
//           isFlooded = TRUE if node becomes flooded
//  Output:  returns flow rate lost from system (cfs)
//  Purpose: computes flow rate at outfalls and flooded nodes.
//
{
    let outflow = 0.0;;

    // --- assume there is no flooding
    isFlooded = FALSE;

    // --- if node is an outfall
    if ( Node[j].type == OUTFALL )
    {
        // --- node receives inflow from outfall conduit
        if ( Node[j].outflow == 0.0 ) outflow = Node[j].inflow;

        // --- node sends flow into outfall conduit
        //     (therefore it has a negative outflow)
        else
        {
            if ( Node[j].inflow == 0.0 )
            {
                outflow = -Node[j].outflow;
                Node[j].inflow = Math.abs(outflow);
            }
        }

        // --- set overflow and volume to 0
        Node[j].overflow = 0.0;
        Node[j].newVolume = 0.0;
    }

    // --- node is a terminal node under Steady or Kin. Wave routing
    else if ( RouteModel != DW &&
              Node[j].degree == 0 &&
              Node[j].type != STORAGE
            )
    {
        if ( Node[j].outflow == 0.0 ) outflow = Node[j].inflow;
        Node[j].overflow = 0.0;
        Node[j].newVolume = 0.0;
    }

    // --- otherwise node is an interior node and any
    //     overflow is considered as system outflow and flooding
    else 
    {
        if ( Node[j].newVolume <= Node[j].fullVolume)
            outflow = Node[j].overflow;
        if ( outflow > 0.0 ) isFlooded = TRUE;
    }
    return outflow;
}

//=============================================================================

function node_getResults(j, f, x)
//
//  Input:   j = node index
//           f = weighting factor
//           x[] = array of nodal reporting variables
//  Output:  none
//  Purpose: computes weighted average of old and new results at a node.
//
{
    let p;
    let z;
    let f1 = 1.0 - f;

    z = (f1 * Node[j].oldDepth + f * Node[j].newDepth) * UCF(LENGTH);
    x[NODE_DEPTH] = z;
    z = Node[j].invertElev * UCF(LENGTH);
    x[NODE_HEAD] = x[NODE_DEPTH] + z;
    z = (f1*Node[j].oldVolume + f*Node[j].newVolume) * UCF(VOLUME);
    x[NODE_VOLUME]  = z;
    z = (f1*Node[j].oldLatFlow + f*Node[j].newLatFlow) * UCF(FLOW); 
    x[NODE_LATFLOW] = z;
    z = (f1*Node[j].oldFlowInflow + f*Node[j].inflow) * UCF(FLOW);
    x[NODE_INFLOW] = z;
    z = Node[j].overflow * UCF(FLOW);
    x[NODE_OVERFLOW] = z;

    if ( !IgnoreQuality ) for (p = 0; p < Nobjects[POLLUT]; p++)
    {
        z = f1*Node[j].oldQual[p] + f*Node[j].newQual[p];
        x[NODE_QUAL+p] = z;
    }
}

//=============================================================================

function   node_setOutletDepth(j, yNorm, yCrit, z)
//
//  Input:   j = node index
//           yNorm = normal flow depth (ft)
//           yCrit = critical flow depth (ft)
//           z = offset of connecting outfall link from node invert (ft)
//  Output:  none
//  Purpose: sets water depth at a node that serves as an outlet point.
//
{
    switch (Node[j].type)
    {
      // --- do nothing if outlet is a storage unit
      case STORAGE:
        return;

      // --- if outlet is a designated outfall then use outfall's specs
      case OUTFALL:
        outfall_setOutletDepth(j, yNorm, yCrit, z);
        break;

      // --- for all other nodes, use min. of critical & normal depths
      default:
        if ( z > 0.0 ) Node[j].newDepth = 0.0;
        else Node[j].newDepth = MIN(yNorm, yCrit);
    }
}

//=============================================================================

function node_getPondedArea(j, d)
//
//  Input:   j = node index
//           d = water depth (ft)
//  Output:  returns surface area of water at a node (ft2)
//  Purpose: computes surface area of water at a node based on depth.
//
{
    let a;

    // --- use regular getSurfArea function if node not flooded
    if ( d <= Node[j].fullDepth || Node[j].pondedArea == 0.0 )
    {
        return node_getSurfArea(j, d);
    }

    // --- compute ponded depth
    d = d - Node[j].fullDepth;

    // --- use ponded area for flooded node
    a = Node[j].pondedArea;
    if ( a <= 0.0 ) a = node_getSurfArea(j, Node[j].fullDepth);
    return a;
}

//=============================================================================

function node_getLosses(j, tStep)
//
//  Input:   j = node index
//           tStep = time step (sec)
//  Output:  returns water loss rate at node (ft3)
//  Purpose: computes the rates of evaporation and infiltration over a given
//           time step for a node.
//
{
    if ( Node[j].type == STORAGE ) return storage_getLosses(j, tStep);
    else return 0.0;
}

//=============================================================================
//                   J U N C T I O N   M E T H O D S
//=============================================================================

function junc_readParams(j, k, tok, ntoks)
//
//  Input:   j = node index
//           k = junction index
//           tok[] = array of string tokens
//           ntoks = number of tokens
//  Output:  returns an error message
//  Purpose: reads a junction's properties from a tokenized line of input.
//
//  Format of input line is:
//     nodeID  elev  maxDepth  initDepth  surDepth  aPond 
{
    let  i;
    let  x = new Array(6);
    let  id;

    // return facilitators
    let returnObj;
    let returnVal;

    if ( ntoks < 2 ) return error_setInpError(ERR_ITEMS, "");
    id = project_findID(NODE, tok[0]);
    if ( id == null ) return error_setInpError(ERR_NAME, tok[0]);

    // --- parse invert elev., max. depth, init. depth, surcharged depth,
    //     & ponded area values
    for ( i = 1; i <= 5; i++ )
    {
        x[i-1] = 0.0;
        if ( i < ntoks )
        {
            ////////////////////////////////////
            returnObj = {y: x[i-1]}
            returnVal = getDouble(tok[i], returnObj);
            x[i-1] = returnObj.y;
            ////////////////////////////////////
            if( !returnVal )
            //if ( null == (x[i-1] = getDouble(tok[i])) )
                return error_setInpError(ERR_NUMBER, tok[i]);
        }
    }

    // --- check for non-negative values (except for invert elev.)
    for ( i = 1; i <= 4; i++ )
    {
        if ( x[i] < 0.0 ) return error_setInpError(ERR_NUMBER, tok[i+1]);
    }

    // --- add parameters to junction object
    Node[j].ID = id;
    node_setParams(j, JUNCTION, k, x);
    return 0;
}

//=============================================================================
//                   S T O R A G E   M E T H O D S
//=============================================================================

function storage_readParams(j, k, tok, ntoks)
//
//  Input:   j = node index
//           k = storage unit index
//           tok[] = array of string tokens
//           ntoks = number of tokens
//  Output:  returns an error message
//  Purpose: reads a storage unit's properties from a tokenized line of input.
//
//  Format of input line is:
//     nodeID  elev  maxDepth  initDepth  FUNCTIONAL a1 a2 a0 surDepth fEvap (infil) //(5.1.013)
//     nodeID  elev  maxDepth  initDepth  TABULAR    curveID  surDepth fEvap (infil) //
//
{
    let i, m, n;
    let x = new Array(9);
    let id;

    // return facilitators
    let returnObj;
    let returnVal;

    // --- get ID name
    if ( ntoks < 6 ) return error_setInpError(ERR_ITEMS, '');
    id = project_findID(NODE, tok[0]);
    if ( id == null ) return error_setInpError(ERR_NAME, tok[0]);

    // --- get invert elev, max. depth, & init. depth
    for ( i = 1; i <= 3; i++ )
    {
        ////////////////////////////////////
        returnObj = {y: x[i-1]}
        returnVal = getDouble(tok[i], returnObj);
        x[i-1] = returnObj.y;
        ////////////////////////////////////
        if( !returnVal )
        //if ( null == (x[i-1] = getDouble(tok[i])) )
            return error_setInpError(ERR_NUMBER, tok[i]);
    }

    // --- get surf. area relation type
    m = findmatch(tok[4], RelationWords);
    if ( m < 0 ) return error_setInpError(ERR_KEYWORD, tok[4]);
    x[3] = 0.0;                        // a1 
    x[4] = 0.0;                        // a2
    x[5] = 0.0;                        // a0
    x[6] = -1.0;                       // curveID
    x[7] = 0.0;                        // aPond
    x[8] = 0.0;                        // fEvap

    // --- get surf. area function coeffs.
    if ( m == FUNCTIONAL )
    {
        for (i=5; i<=7; i++)
        {
            if ( i < ntoks )
            {
                ////////////////////////////////////
                returnObj = {y: x[i-2]}
                returnVal = getDouble(tok[i], returnObj);
                x[i-2] = returnObj.y;
                ////////////////////////////////////
                if( !returnVal )
                //if ( null == (x[i-2] = getDouble(tok[i])) )
                    return error_setInpError(ERR_NUMBER, tok[i]);
            }
        }
        n = 8;
    }

    // --- get surf. area curve name
    else
    {
        m = project_findObject(CURVE, tok[5]);
        if ( m < 0 ) return error_setInpError(ERR_NAME, tok[5]);
        x[6] = m;
        n = 6;
    }

    // --- ponded area replaced by surcharge depth                             //(5.1.013)
    if ( ntoks > n)
    {
        ////////////////////////////////////
        returnObj = {y: x[7]}
        returnVal = getDouble(tok[n], returnObj);
        x[7] = returnObj.y;
        ////////////////////////////////////
        if( !returnVal )
        //if ( null == (x[7] = getDouble(tok[n])) )
            return error_setInpError(ERR_NUMBER, tok[n]);
        n++;
    }

    // --- get evaporation fraction if present
    if ( ntoks > n )
    {
        ////////////////////////////////////
        returnObj = {y: x[8]}
        returnVal = getDouble(tok[n], returnObj);
        x[8] = returnObj.y;
        ////////////////////////////////////
        if( !returnVal )
        //if ( null == (x[8] = getDouble(tok[n])) )
            return error_setInpError(ERR_NUMBER, tok[n]);
        n++;
    }

    // --- add parameters to storage unit object
    Node[j].ID = id;
    node_setParams(j, STORAGE, k, x);

    // --- read exfiltration parameters if present
    if ( ntoks > n ) return exfil_readStorageParams(k, tok, ntoks, n);
    return 0;
}

//=============================================================================

function storage_getDepth(j, v)
//
//  Input:   j = node index
//           v = volume (ft3)
//  Output:  returns depth of water at a storage node (ft)
//  Purpose: computes a storage node's water depth from its volume.
//
{
    let k = Node[j].subIndex;
    let i = Storage[k].aCurve;
    let d, e;
    let storageVol = new TStorageVol();
    
    // ret facil
    let returnObj;
    let returnVal;

    // --- return max depth if a max. volume has been computed
    //     and volume is > max. volume
    if ( Node[j].fullVolume > 0.0
    &&   v >= Node[j].fullVolume ) return Node[j].fullDepth;
    if ( v == 0.0 ) return 0.0;

    // --- use tabular area v. depth curve
    if ( i >= 0 )
        return table_getInverseArea(Curve[i], v*UCF(VOLUME)) / UCF(LENGTH);

    // --- use functional area v. depth relation
    else
    {
        v *= UCF(VOLUME);
        if ( Storage[k].aExpon == 0.0 )
        {
            d = v / (Storage[k].aConst + Storage[k].aCoeff);
        }
        else if ( Storage[k].aConst == 0.0 )
        {
            e = 1.0 / (Storage[k].aExpon + 1.0);
            d = Math.pow(v / (Storage[k].aCoeff * e), e);
        }
        else
        {
            storageVol.k = k;
            storageVol.v = v;
            d = v / (Storage[k].aConst + Storage[k].aCoeff);
            ////////////////////////////////////
            returnObj = {rts: d, p: storageVol}
            returnVal = findroot_Newton(0.0, Node[j].fullDepth*UCF(LENGTH)
                            , returnObj, 0.001, storage_getVolDiff)
            d = returnObj.rts;
            storageVol = returnObj.p
            ////////////////////////////////////
            //findroot_Newton(0.0, Node[j].fullDepth*UCF(LENGTH), d,
            //                0.001, storage_getVolDiff, storageVol);            
        }
        d /= UCF(LENGTH);
        if ( d > Node[j].fullDepth ) d = Node[j].fullDepth;
        return d;
    }
}

//=============================================================================

function  storage_getVolDiff(y, f, df, p)
//
//  Input:   y = depth of water (ft)
//  Output:  f = volume of water (ft3)
//           df = dVolume/dDepth (ft2)
//  Purpose: computes volume and its derivative with respect to depth
//           at storage node Kstar using the node's area versus depth function.
//
{
    let    k;
    let e, v;

    // ... cast void pointer p to a TStorageVol object
    k = p.k;

    // ... find storage volume at depth y
    e = Storage[k].aExpon + 1.0;
    v = Storage[k].aConst * y + Storage[k].aCoeff / e * Math.pow(y, e);

    // ... compute difference between this volume and target volume
    //     as well as its derivative w.r.t. y
    f = v - p.v;
    df = Storage[k].aConst + Storage[k].aCoeff * Math.pow(y, e-1.0);
}

//=============================================================================

function storage_getVolume(j, d)
//
//  Input:   j = node index
//           d = depth (ft)
//  Output:  returns volume of stored water (ft3)
//  Purpose: computes a storage node's water volume from its depth.
//
{
    let k = Node[j].subIndex;
    let i = Storage[k].aCurve;
    let v;

    // --- return full volume if depth >= max. depth
    if ( d == 0.0 ) return 0.0;
    if ( d >= Node[j].fullDepth
    &&   Node[j].fullVolume > 0.0 ) return Node[j].fullVolume;

    // --- use table integration if area v. depth table exists
    if ( i >= 0 )
      return table_getArea(Curve[i], d*UCF(LENGTH)) / UCF(VOLUME);

    // --- otherwise use functional area v. depth relation
    else
    {
        d *= UCF(LENGTH);
        v = Storage[k].aConst * d;
        v += Storage[k].aCoeff / (Storage[k].aExpon+1.0) *
        Math.pow(d, Storage[k].aExpon+1.0);
        return v / UCF(VOLUME);

    }
}

//=============================================================================

function storage_getSurfArea(j, d)
//
//  Input:   j = node index
//           d = depth (ft)
//  Output:  returns surface area (ft2)
//  Purpose: computes a storage node's surface area from its water depth.
//
{
    let area;
    let k = Node[j].subIndex;
    let i = Storage[k].aCurve;
    if ( i >= 0 )
        area = table_lookupEx(Curve[i], d*UCF(LENGTH));
    else
    {
        if ( Storage[k].aCoeff <= 0.0 ) area = Storage[k].aConst;
        else if ( Storage[k].aExpon == 0.0 )
            area = Storage[k].aConst + Storage[k].aCoeff;
        else area = Storage[k].aConst + Storage[k].aCoeff *
                Math.pow(d*UCF(LENGTH), Storage[k].aExpon);
    }
    return area / UCF(LENGTH) / UCF(LENGTH);
}

//=============================================================================

function storage_getOutflow(j, i)
//
//  Input:   j = node index
//           i = link index
//  Output:  returns flow from storage node into conduit link (cfs)
//  Purpose: finds outflow from a storage node into its connecting conduit link
//           ( non-conduit links have their own getInflow functions).
//
{
    let    k;
    let a, y;

    // --- link must be a conduit
    if ( Link[i].type != CONDUIT ) return 0.0;

    // --- find depth of water in conduit
    y = Node[j].newDepth - Link[i].offset1;

    // --- return 0 if conduit empty or full flow if full
    if ( y <= 0.0 ) return 0.0;
    if ( y >= Link[i].xsect.yFull ) return Link[i].qFull;

    // --- if partially full, return normal flow
    k = Link[i].subIndex;
    a = xsect_getAofY(Link[i].xsect, y);
    return Conduit[k].beta * xsect_getSofA(Link[i].xsect, a);
}

//=============================================================================

function storage_getLosses(j, tStep)
//
//  Input:   j = node index
//           tStep = time step (sec)
//  Output:  returns evaporation + infiltration rate (cfs)
//  Purpose: computes combined rate of water evaporated & infiltrated from
//           a storage node.
//
{
    let k;
    let depth;
    let area;
    let evapRate = 0.0;
    let exfilRate = 0.0;
    let totalLoss = 0.0;
    let lossRatio;
    let exfil = new TExfil();

        // --- get node's evap. rate (ft/s) &  exfiltration object
        k = Node[j].subIndex;
        evapRate = Evap.rate * Storage[k].fEvap;
        exfil = Storage[k].exfil;

        // --- if either of these apply
        if ( evapRate > 0.0 || exfil != null) 
        {
            // --- obtain storage depth & surface area 
            depth = Node[j].newDepth;
            area = storage_getSurfArea(j, depth);

            // --- compute evap rate over this area (cfs)
            if (Node[j].newVolume > FUDGE)
                evapRate = area * evapRate;

            // --- find exfiltration rate (cfs) through bottom and side banks
            if ( exfil != null )
            {
                exfilRate = exfil_getLoss(exfil, tStep, depth, area);
            }

            // --- total loss over time step cannot exceed stored volume
            totalLoss = (evapRate + exfilRate) * tStep;
            if ( totalLoss > Node[j].newVolume )
            {
                lossRatio = Node[j].newVolume / totalLoss;
                evapRate *= lossRatio;
                exfilRate *= lossRatio; 
            }
        }
 
    // --- save evap & infil losses at the node
    Storage[Node[j].subIndex].evapLoss = evapRate * tStep;
    Storage[Node[j].subIndex].exfilLoss = exfilRate * tStep;
    return evapRate + exfilRate;
}

//=============================================================================
//                   D I V I D E R   M E T H O D S
//=============================================================================

function divider_readParams(j, k, tok, ntoks)
//
//  Input:   j = node index
//           k = divider index
//           tok[] = array of string tokens
//           ntoks = number of tokens
//  Output:  returns an error message
//  Purpose: reads a flow divider's properties from a tokenized line of input.
//
//  Format of input line is:
//    nodeID  elev  divLink  TABULAR  curveID (optional params)
//    nodeID  elev  divLink  OVERFLOW (optional params)
//    nodeID  elev  divLink  CUTOFF  qCutoff (optional params)
//    nodeID  elev  divLink  WEIR    qMin  dhMax  cWeir (optional params)
//  where optional params are:
//    maxDepth  initDepth  surDepth  aPond    
//
{
    let i, m, m1, m2, n;
    let x = new Array(11);
    let id;

    // return facilitators
    let returnObj;
    let returnVal;

    // --- get ID name
    if ( ntoks < 4 ) return error_setInpError(ERR_ITEMS, "");
    id = project_findID(NODE, tok[0]);
    if ( id == null ) return error_setInpError(ERR_NAME, tok[0]);

    // --- get invert elev.
    ////////////////////////////////////
    returnObj = {y: x[0]}
    returnVal = getDouble(tok[1], returnObj);
    x[0] = returnObj.y;
    ////////////////////////////////////
    if( !returnVal )
    //if ( null == (x[0] = getDouble(tok[1])) ) 
        return error_setInpError(ERR_NUMBER, tok[1]);

    // --- initialize parameter values
    for ( i=1; i<11; i++) x[i] = 0.0;

    // --- check if no diverted link supplied
    if ( tok[2].length == 0 || strcmp(tok[2], "*") == 0 ) x[1] = -1.0;

    // --- otherwise get index of diverted link
    else
    {
        m1 = project_findObject(LINK, tok[2]);
        if ( m1 < 0 ) return error_setInpError(ERR_NAME, tok[2]);
        x[1] = m1;
    }
    
    // --- get divider type
	n = 4;
    m1 = findmatch(tok[3], DividerTypeWords);
    if ( m1 < 0 ) return error_setInpError(ERR_KEYWORD, tok[3]);
    x[2] = m1;

    // --- get index of flow diversion curve for Tabular divider
    x[3] = -1;
    if ( m1 == TABULAR_DIVIDER )
    {
        if ( ntoks < 5 ) return error_setInpError(ERR_ITEMS, "");
        m2 = project_findObject(CURVE, tok[4]);
        if ( m2 < 0 ) return error_setInpError(ERR_NAME, tok[4]);
        x[3] = m2;
        n = 5;
    }

    // --- get cutoff flow for Cutoff divider
    if ( m1 == CUTOFF_DIVIDER )
    {
        if ( ntoks < 5 ) return error_setInpError(ERR_ITEMS, "");
        ////////////////////////////////////
        returnObj = {y: x[4]}
        returnVal = getDouble(tok[4], returnObj);
        x[4] = returnObj.y;
        ////////////////////////////////////
        if( !returnVal )
        //if ( null == (x[4] = getDouble(tok[4])) )
            return error_setInpError(ERR_NUMBER, tok[4]);
        n = 5;
    }

    // --- get qmin, dhMax, & cWeir for Weir divider
    if ( m1 == WEIR_DIVIDER )
    {
        if ( ntoks < 7 ) return error_setInpError(ERR_ITEMS, "");
        for (i=4; i<7; i++){
            ////////////////////////////////////
            returnObj = {y: x[i]}
            returnVal = getDouble(tok[i], returnObj);
            x[i] = returnObj.y;
            ////////////////////////////////////
            if( !returnVal )
            //if ( null == (x[i] = getDouble(tok[i])) )
                return error_setInpError(ERR_NUMBER, tok[i]);
        }
        n = 7;
    }

    // --- no parameters needed for Overflow divider
    if ( m1 == OVERFLOW_DIVIDER ) n = 4;

    // --- retrieve optional full depth, init. depth, surcharged depth
    //      & ponded area
    m = 7;
    for (i=n; i<ntoks && m<11; i++)
    {
        ////////////////////////////////////
        returnObj = {y: x[m]}
        returnVal = getDouble(tok[i], returnObj);
        x[m] = returnObj.y;
        ////////////////////////////////////
        if( !returnVal )
        //if ( null == (x[m] = getDouble(tok[i])) )
        {
            return error_setInpError(ERR_NUMBER, tok[i]);
        }
        m++;
    }
 
    // --- add parameters to data base
    Node[j].ID = id;
    node_setParams(j, DIVIDER, k, x);
    return 0;
}

//=============================================================================

function  divider_validate(j)
//
//  Input:   j = node index
//  Output:  none
//  Purpose: validates a flow divider's properties.
//
{
    let i, k;

    // --- check that diverted link is attached to divider
    k = Node[j].subIndex;
    i = Divider[k].link;
    if ( i < 0 || ( Link[i].node1 != j && Link[i].node2 != j) )
    {
        report_writeErrorMsg(ERR_DIVIDER_LINK, Node[j].ID);
    }

    // --- validate parameters supplied for weir-type divider
    if ( Divider[k].type == WEIR_DIVIDER )
    {
        if ( Divider[k].dhMax <= 0.0 || Divider[k].cWeir <= 0.0 )
            report_writeErrorMsg(ERR_WEIR_DIVIDER, Node[j].ID);
        else
        {
            // --- find flow when weir is full
            Divider[k].qMax = Divider[k].cWeir * Math.pow(Divider[k].dhMax, 1.5)
                              / UCF(FLOW);
            if ( Divider[k].qMin > Divider[k].qMax )
                report_writeErrorMsg(ERR_WEIR_DIVIDER, Node[j].ID);
        }
    }
}

//=============================================================================

function divider_getOutflow(j, k)
//
//  Input:   j = node index
//           k = index of diversion link
//  Output:  returns diverted flow rate (cfs)
//  Purpose: computes flow sent through divider node into its diversion link.
//
//  NOTE: requires that links be previously sorted so that the non-diversion
//        link always gets evaluated before the diversion link
{
    let i;                      // index of divider node
    let m;                      // index of diverted flow table
    let qIn;                    // inflow to divider
    let qOut;                   // diverted outflow
    let f;                      // fraction of weir divider full

    qIn = Node[j].inflow + Node[j].overflow;
    i = Node[j].subIndex;
    switch ( Divider[i].type )
    {
      case CUTOFF_DIVIDER:
        if ( qIn <= Divider[i].qMin ) qOut = 0.0;
        else qOut = qIn - Divider[i].qMin;
        break;

      case OVERFLOW_DIVIDER:
        // --- outflow sent into non-diversion link is simply node's inflow
        if ( k != Divider[i].link ) qOut = qIn;

        // --- diversion link receives any excess of node's inflow and
        //     outflow sent previously into non-diversion link
        else qOut = qIn - Node[j].outflow;
        if ( qOut < FLOW_TOL ) qOut = 0.0;
        return qOut;

      case WEIR_DIVIDER:
        // --- no flow if inflow < qMin
        if ( qIn <= Divider[i].qMin ) qOut = 0.0;

        // --- otherwise use weir eqn.
        else
        {
            // --- find fractional depth of flow over weir
            f = (qIn - Divider[i].qMin) /
                (Divider[i].qMax - Divider[i].qMin);

            // --- if weir surcharged, use orifice eqn.
            if ( f > 1.0 ) qOut = Divider[i].qMax * Math.sqrt(f);
            
            // --- otherwise use weir eqn.
            else qOut = Divider[i].cWeir *
                    Math.pow(f*Divider[i].dhMax, 1.5) / UCF(FLOW);
        }
        break;

      case TABULAR_DIVIDER:
        m = Divider[i].flowCurve;
        if ( m >= 0 )
            qOut = table_lookup(Curve[m], qIn * UCF(FLOW)) / UCF(FLOW);
        else qOut = 0.0;
        break;

      default: qOut = 0.0;
    }

    // --- make sure outflow doesn't exceed inflow
    if ( qOut > qIn ) qOut = qIn;

    // --- if link k not the diversion link, then re-define qOut as 
    //     the undiverted flow
    if ( k != Divider[i].link )
    {
        qOut = qIn - qOut;
    }
    return qOut;
}


//=============================================================================
//                    O U T F A L L   M E T H O D S
//=============================================================================

function outfall_readParams(j, k, tok, ntoks)
//
//  Input:   j = node index
//           k = outfall index
//           tok[] = array of string tokens
//           ntoks = number of tokens
//  Output:  returns an error message
//  Purpose: reads an outfall's properties from a tokenized line of input.
//
//  Format of input line is:
//    nodeID  elev  FIXED  fixedStage (flapGate) (routeTo)
//    nodeID  elev  TIDAL  curveID (flapGate) (routeTo)
//    nodeID  elev  TIMESERIES  tseriesID (flapGate) (routTo)
//    nodeID  elev  FREE (flapGate) (routeTo)
//    nodeID  elev  NORMAL (flapGate) (routeTo)
//
{
    let i, m, n;
    let x = new Array(7);
    let id;

    // return facilitators
    let returnObj;
    let returnVal;

    if ( ntoks < 3 ) return error_setInpError(ERR_ITEMS, "");
    id = project_findID(NODE, tok[0]);                      // node ID
    if ( id == null )
        return error_setInpError(ERR_NAME, tok[0]);

    ////////////////////////////////////
    returnObj = {y: x[0]}
    returnVal = getDouble(tok[1], returnObj);
    x[0] = returnObj.y;
    ////////////////////////////////////
    if( !returnVal )
    //if ( null == (x[0] = getDouble(tok[1])) )                       // invert elev. 
        return error_setInpError(ERR_NUMBER, tok[1]);
    i = findmatch(tok[2], OutfallTypeWords);               // outfall type
    if ( i < 0 ) return error_setInpError(ERR_KEYWORD, tok[2]);
    x[1] = i;                                              // outfall type
    x[2] = 0.0;                                            // fixed stage
    x[3] = -1.;                                            // tidal curve
    x[4] = -1.;                                            // tide series
    x[5] = 0.;                                             // flap gate
    x[6] = -1.;                                            // route to subcatch//(5.1.008)

    n = 4;
    if ( i >= FIXED_OUTFALL )
    {
        if ( ntoks < 4 ) return error_setInpError(ERR_ITEMS, "");
        n = 5;
        switch ( i )
        {
        case FIXED_OUTFALL:                                // fixed stage
          ////////////////////////////////////
          returnObj = {y: x[2]}
          returnVal = getDouble(tok[3], returnObj);
          x[2] = returnObj.y;
          ////////////////////////////////////
          if( !returnVal )
          //if ( null == (x[2] = getDouble(tok[3])) )
              return error_setInpError(ERR_NUMBER, tok[3]);
          break;
        case TIDAL_OUTFALL:                                // tidal curve
          m = project_findObject(CURVE, tok[3]);              
          if ( m < 0 ) return error_setInpError(ERR_NAME, tok[3]);
          x[3] = m;
          break;
        case TIMESERIES_OUTFALL:                           // stage time series
          m = project_findObject(TSERIES, tok[3]);            
          if ( m < 0 ) return error_setInpError(ERR_NAME, tok[3]);
          x[4] = m;
          Tseries[m].refersTo = TIMESERIES_OUTFALL;
        }
    }
    if ( ntoks == n )
    {
        m = findmatch(tok[n-1], NoYesWords);               // flap gate
        if ( m < 0 ) return error_setInpError(ERR_KEYWORD, tok[n-1]);
        x[5] = m;
    }

    if ( ntoks == n+1)
    {
        m = project_findObject(SUBCATCH, tok[n]);
        if ( m < 0 ) return error_setInpError(ERR_NAME, tok[n]);
        x[6] = m;
    }

    Node[j].ID = id;
    node_setParams(j, OUTFALL, k, x);
    return 0;
}

//=============================================================================

function outfall_setOutletDepth(j, yNorm, yCrit, z)
//
//  Input:   j = node index
//           yNorm = normal flow depth in outfall conduit (ft)
//           yCrit = critical flow depth in outfall conduit (ft)
//           z = height to outfall conduit invert (ft)
//  Output:  none
//  Purpose: sets water depth at an outfall node.
//
{
    let x, y;                     // x,y values in table
    let yNew;                     // new depth above invert elev. (ft)
    let stage;                    // water elevation at outfall (ft)
    let k;                        // table index
    let i = Node[j].subIndex;     // outfall index
    let currentDate = new Date();              // current date/time in days

    // ret facil
    let returnObj;
    let returnVal;

    switch ( Outfall[i].type )
    {
      case FREE_OUTFALL:
        if ( z > 0.0 ) Node[j].newDepth = 0.0;
        else Node[j].newDepth = MIN(yNorm, yCrit);
        return;

      case NORMAL_OUTFALL:
        if ( z > 0.0 ) Node[j].newDepth = 0.0;
        else Node[j].newDepth = yNorm;
        return;

      case FIXED_OUTFALL:
        stage = Outfall[i].fixedStage;
        break;

      case TIDAL_OUTFALL:
        k = Outfall[i].tideCurve;

        ////////////////////////////////////
        returnObj = {x: x, y: y}
        returnVal = table_getFirstEntry(Curve[k], returnObj)
        x = returnObj.x;
        y = returnObj.y;
        ////////////////////////////////////
        //table_getFirstEntry(Curve[k], x, y);
        currentDate = NewRoutingTime / MSECperDAY;
        x += ( currentDate - Math.floor(currentDate) ) * 24.0;
        stage = table_lookup(Curve[k], x) / UCF(LENGTH);
        break;

      case TIMESERIES_OUTFALL:
        k = Outfall[i].stageSeries;
        currentDate = StartDateTime + NewRoutingTime / MSECperDAY;
        ////////////////////////////////////
        returnObj = {table: Tseries[k]}
        returnVal = table_tseriesLookup(returnObj, currentDate, true);
        Tseries[k] = returnObj.table;
        ////////////////////////////////////
        stage = returnVal / UCF(LENGTH);
        //stage = table_tseriesLookup(Tseries[k], currentDate, true) / UCF(LENGTH);
        break;
      default: stage = Node[j].invertElev;
    }

    // --- now determine depth at node given outfall stage elev.
 
    // --- let critical flow depth be min. of critical & normal depth
    yCrit = MIN(yCrit, yNorm);

    // --- if elev. of critical depth is below outfall stage elev. then
    //     the outfall stage determines node depth
    if ( yCrit + z + Node[j].invertElev < stage )
    {
        yNew = stage - Node[j].invertElev;
    }

    // --- otherwise if the outfall conduit lies above the outfall invert
    else if ( z > 0.0 )
    {
        // --- if the outfall stage lies below the bottom of the outfall
        //     conduit then the result is distance from node invert to stage
        if ( stage < Node[j].invertElev + z )
            yNew = MAX(0.0, (stage - Node[j].invertElev));

        // --- otherwise stage lies between bottom of conduit and critical
        //     depth in conduit so result is elev. of critical depth
        else yNew = z + yCrit;
    }

    // --- and for case where there is no conduit offset and outfall stage
    //     lies below critical depth, then node depth = critical depth 
    else yNew = yCrit;
    Node[j].newDepth = yNew;
}

//=============================================================================

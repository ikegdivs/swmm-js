//-----------------------------------------------------------------------------
//   inflow.c
//
//   Project:  EPA SWMM5
//   Version:  5.1
//   Date:     03/20/14  (Build 5.1.001)
//   Author:   L. Rossman
//
//   Manages any Direct External or Dry Weather Flow inflows
//   that have been assigned to nodes of the drainage system.
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
//  External Functions (declared in funcs.h)
//-----------------------------------------------------------------------------
//  inflow_initDwfPattern   (called createObjects in project.c)
//  inflow_readExtInflow    (called by input_readLine)
//  inflow_readDwfInflow    (called by input_readLine)
//  inflow_deleteExtInflows (called by deleteObjects in project.c)
//  inflow_deleteDwfInflows (called by deleteObjects in project.c)
//  inflow_getExtInflow     (called by addExternalInflows in routing.c)
//  inflow_getDwfInflow     (called by addDryWeatherInflows in routing.c)
//  inflow_getPatternFactor

//=============================================================================

function inflow_readExtInflow(tok, ntoks)
//int inflow_readExtInflow(char* tok[], int ntoks)
//
//  Input:   tok[] = array of string tokens
//           ntoks = number of tokens
//  Output:  returns an error message
//  Purpose: reads parameters of a direct external inflow from a line of input.
//
//  Formats of data line are:
//     nodeID  FLOW      tSeriesID  (FLOW         1.0          scaleFactor  baseline  basePat)
//     nodeID  pollutID  tSeriesID  (CONCEN/MASS  unitsFactor  scaleFactor  baseline  basePat)
//
{
    let    j;                          // object index
    let    param;                      // FLOW (-1) or pollutant index
    let    type = CONCEN_INFLOW;       // FLOW, CONCEN or MASS inflow
    let    tseries = -1;               // time series index
    let    basePat = -1;               // baseline pattern
    let cf = 1.0;                   // units conversion factor
    let sf = 1.0;                   // scaling factor
    let baseline = 0.0;             // baseline value

    // return facilitators
    let returnObj;
    let returnVal;

    // --- find index of node receiving the inflow
    if ( ntoks < 3 ) return error_setInpError(ERR_ITEMS, "");
    j = project_findObject(NODE, tok[0]);
    if ( j < 0 ) return error_setInpError(ERR_NAME, tok[0]);

    // --- find index of inflow pollutant or use -1 for FLOW
    param = project_findObject(POLLUT, tok[1]);
    if ( param < 0 )
    {
        if ( match(tok[1], w_FLOW) === 1){
            param = -1;
        }
        else{
            return error_setInpError(ERR_NAME, tok[1]);
        } 
    }

    // --- find index of inflow time series (if supplied) in data base
    if ( tok[2].length > 0 )
    {
        tseries = project_findObject(TSERIES, tok[2]);
        if ( tseries < 0 ) return error_setInpError(ERR_NAME, tok[2]);
        Tseries[tseries].refersTo = EXTERNAL_INFLOW;
    }

    // --- assign type & cf values for a FLOW inflow
    if (param == -1)
    {
        type = FLOW_INFLOW;
    }

    // --- do the same for a pollutant inflow
    if ( ntoks >= 4 && param > -1)
    {
        if      ( match(tok[3], w_CONCEN) ) type = CONCEN_INFLOW;
        else if ( match(tok[3], w_MASS) )   type = MASS_INFLOW;
        else    return error_setInpError(ERR_KEYWORD, tok[3]);
        if ( ntoks >= 5 && type == MASS_INFLOW )
        {
            ////////////////////////////////////
            returnObj = {y: cf}
            returnVal = getDouble(tok[4], returnObj);
            cf = returnObj.y;
            ////////////////////////////////////
            if(!returnVal)
            //if ( ! getDouble(tok[4], &cf) )
            {
                return error_setInpError(ERR_NUMBER, tok[4]);
            }
            if ( cf <= 0.0 ) return error_setInpError(ERR_NUMBER, tok[4]);
        }
    }

    // --- get sf and baseline values
    if ( ntoks >= 6 )
    {
        ////////////////////////////////////
        returnObj = {y: sf}
        returnVal = getDouble(tok[5], returnObj);
        sf = returnObj.y;
        ////////////////////////////////////
        if(!returnVal)
        //if ( ! getDouble(tok[5], &sf) )
        {
            return error_setInpError(ERR_NUMBER, tok[5]);
        }
    }
    if ( ntoks >= 7 )
    {
        ////////////////////////////////////
        returnObj = {y: baseline}
        returnVal = getDouble(tok[6], returnObj);
        baseline = returnObj.y;
        ////////////////////////////////////
        if(!returnVal)
        //if ( ! getDouble(tok[6], &baseline) )
        {
            return error_setInpError(ERR_NUMBER, tok[6]);
        }
    }

    // --- get baseline time pattern
    if ( ntoks >= 8 )
    {
        basePat = project_findObject(TIMEPATTERN, tok[7]);
        if ( basePat < 0 ) return error_setInpError(ERR_NAME, tok[7]);
    }

    return(inflow_setExtInflow(j, param, type, tseries, basePat,
        cf, baseline, sf));
}


////////////////////////////////////
//let returnObj = {cf: val1}
//let returnVal = inflow_validate(param, type, tseries, basePat, inObj)
//val1 = returnObj.cf;
////////////////////////////////////
function inflow_validate(param, type, tseries, basePat, inObj)
//int inflow_validate(int param, int type, int tseries, int basePat, double *cf)
// 
// Purpose: Validates Inflow
// Input:  param = -1 for Flow or Index of Pollutant
//         type = FLOW_INFLOW, CONCEN_INFLOW or MASS_INFLOW
//         tSeries = Time Series Index
//         basePat = Base Pattern Index
// Output: cf = Unit Conversion
// Return: returns Error Code
{
    let errcode = 0;

    // Validate param
    if (param >= Nobjects[POLLUT])
    {
        errcode = ERR_API_POLLUT_INDEX;
    }
    // Validate Type
    else if (type != FLOW_INFLOW 
             && type != CONCEN_INFLOW 
             && type != MASS_INFLOW)
    {
        errcode = ERR_KEYWORD;
    }
    // Validate Timeseries Index
    else if (tseries >= Nobjects[TSERIES])
    {
        errcode = ERR_API_TSERIES_INDEX;
    }
    // Validate Timepattern Index
    else if (basePat >= Nobjects[TIMEPATTERN])
    {
        errcode = ERR_API_PATTERN_INDEX;
    }
    else
    {
        // --- assign type & cf values for a FLOW inflow
        if ( type == FLOW_INFLOW )
        {
            inObj.cf = 1.0/UCF(FLOW);
        }
        // --- include LperFT3 term in conversion factor for MASS_INFLOW
        else if ( type == MASS_INFLOW ) 
        {
            inObj.cf /= LperFT3;		
        }
    }

    return(errcode);
}


function inflow_setExtInflow(j, param, type, tseries, basePat, cf, baseline, sf)
//int inflow_setExtInflow(int j, int param, int type, int tseries, int basePat,
//                        double cf, double baseline, double sf)
// Purpose:  This function assigns property values to the inflow object 
// Inputs:   j = Node index
//           param = FLOW (-1) or pollutant index
//           type = FLOW, CONCEN or MASS inflow
//           tSeries = time series index
//           basePat = baseline pattern
//           cf = units conversion factor
//           baseline = baseline inflow value
//           sf = scaling factor
// Return:   returns Error Code

{
    let errcode = 0;
    //TExtInflow* inflow;            // external inflow object
    let inflow 
    
    // return facilitators
    let returnObj;
    let returnVal;

    // Validate Inflow
    ////////////////////////////////////
    returnObj = {cf: cf}
    returnVal = inflow_validate(param, type, tseries, basePat, returnObj)
    cf = returnObj.cf;
    ////////////////////////////////////
    errcode = returnVal
    //errcode = inflow_validate(param, type, tseries, basePat, &cf);

    if (errcode == 0)
    {

        // --- check if an external inflow object for this constituent already exists
        inflow = Node[j].extInflow;
        while ( inflow )
        {
            if ( inflow.param == param ) break;
            inflow = inflow.next;
        }

        // --- if it doesn't exist, then create it
        if ( inflow == null )
        {
            //inflow = (TExtInflow *) malloc(sizeof(TExtInflow));
            inflow = new TExtInflow();
            if ( inflow == null ) 
            {
                return error_setInpError(ERR_MEMORY, "");
            }
            inflow.next = Node[j].extInflow;
            Node[j].extInflow = inflow;
        }

        // Assigning Values to the inflow object 
        inflow.param    = param;
        inflow.type     = type;
        inflow.tSeries  = tseries;
        inflow.cFactor  = cf;
        inflow.sFactor  = sf;
        inflow.baseline = baseline;
        inflow.basePat  = basePat;
        inflow.extIfaceInflow = 0.0;
    }
    return(errcode);
}

//=============================================================================

function inflow_deleteExtInflows(j)
//void inflow_deleteExtInflows(int j)
//
//  Input:   j = node index
//  Output:  none
//  Purpose: deletes all time series inflow data for a node.
//
{
    //TExtInflow* inflow1;
    //TExtInflow* inflow2;
    let inflow1;
    let inflow2;

    inflow1 = Node[j].extInflow;
    while ( inflow1 )
    {
        inflow2 = inflow1.next;
        //free(inflow1);
        inflow1 = null;
        inflow1 = inflow2; 
    }
}

//=============================================================================
function inflow_getExtInflow(inflow, aDate)
//double inflow_getExtInflow(TExtInflow* inflow, DateTime aDate)
//
//  Input:   inflow = external inflow data structure
//           aDate = current simulation date/time
//  Output:  returns current value of external inflow parameter
//  Purpose: retrieves the value of an external inflow at a specific
//           date and time.
//
{
    let month, day, hour;
    let p = inflow.basePat;      // baseline pattern
    let k = inflow.tSeries;      // time series index
    let cf = inflow.cFactor;     // units conversion factor
    let sf = inflow.sFactor;     // scaling factor
    let blv = inflow.baseline;   // baseline value
    let tsv = 0.0;                // time series value
    let extIfaceInflow = inflow.extIfaceInflow;// external interfacing inflow

    // ret facil
    let returnObj;
    let returnVal;

    if ( p >= 0 )
    {
        month = datetime_monthOfYear(aDate) - 1;
        day   = datetime_dayOfWeek(aDate) - 1;
        hour  = datetime_hourOfDay(aDate);
        blv  *= inflow_getPatternFactor(p, month, day, hour);
    }
    if ( k >= 0 ) {
        ////////////////////////////////////
        returnObj = {table: Tseries[k]}
        returnVal = table_tseriesLookup(returnObj, aDate, false);
        Tseries[k] = returnObj.table;
        ////////////////////////////////////
        tsv = returnVal;
        //tsv = table_tseriesLookup(&Tseries[k], aDate, false) * sf;
    }
    return cf * (tsv + blv) + cf * extIfaceInflow;
}

//=============================================================================

function inflow_readDwfInflow(tok, ntoks)
//int inflow_readDwfInflow(char* tok[], int ntoks)
//
//  Input:   tok[] = array of string tokens
//           ntoks = number of tokens
//  Output:  returns an error message
//  Purpose: reads dry weather inflow parameters from line of input data.
//
//  Format of data line is:
//    nodeID  FLOW/pollutID  avgValue  (pattern1 pattern2  ... pattern4)
//
{
    let    i;
    let    j;                          // node index
    let    k;                          // pollutant index (-1 for flow)
    let    m;                          // time pattern index
    let    pats = new Array(4);                    // time pattern index array
    let    x;                          // avg. DWF value
    //TDwfInflow* inflow;                // dry weather flow inflow object
    let inflow

    // return facilitators
    let returnObj;
    let returnVal;

    // --- find index of node receiving the inflow
    if ( ntoks < 3 ) return error_setInpError(ERR_ITEMS, "");
    j = project_findObject(NODE, tok[0]);
    if ( j < 0 ) return error_setInpError(ERR_NAME, tok[0]);

    // --- find index of inflow pollutant (-1 for FLOW) 
    k = project_findObject(POLLUT, tok[1]);
    if ( k < 0 )
    {
        if ( match(tok[1], w_FLOW) ) k = -1;
        else return error_setInpError(ERR_NAME, tok[1]);
    }

    // --- get avg. value of DWF inflow
    ////////////////////////////////////
    returnObj = {y: x}
    returnVal = getDouble(tok[2], returnObj);
    x = returnObj.y;
    ////////////////////////////////////
    if(!returnVal)
    //if ( !getDouble(tok[2], &x) )
        return error_setInpError(ERR_NUMBER, tok[2]);
    if ( k == -1 ) x /= UCF(FLOW);

    // --- get time patterns assigned to the inflow
    for (i=0; i<4; i++) pats[i] = -1;
    for (i=3; i<7; i++)
    {
        if ( i >= ntoks ) break;
        if ( tok[i].length == 0 ) continue;
        m = project_findObject(TIMEPATTERN, tok[i]);
        if ( m < 0 ) return error_setInpError(ERR_NAME, tok[i]);
        pats[i-3] = m;
    }

    // --- check if inflow for this constituent already exists
    inflow = Node[j].dwfInflow;
    while ( inflow )
    {
        if ( inflow.param == k ) break;
        inflow = inflow.next;
    }

    // --- if it doesn't exist, then create it
    if ( inflow == null )
    {
        //inflow = (TDwfInflow *) malloc(sizeof(TDwfInflow));
        inflow = new TDwfInflow();
        if ( inflow == null ) return error_setInpError(ERR_MEMORY, "");
        inflow.next = Node[j].dwfInflow;
        Node[j].dwfInflow = inflow;
    }

    // --- assign property values to the inflow object
    inflow.param = k;
    inflow.avgValue = x;
    for (i=0; i<4; i++) inflow.patterns[i] = pats[i];
    return 0;
}

//=============================================================================

function inflow_deleteDwfInflows(j)
//void inflow_deleteDwfInflows(int j)
//
//  Input:   j = node index
//  Output:  none
//  Purpose: deletes all dry weather inflow data for a node.
//
{
    //TDwfInflow* inflow1;
    //TDwfInflow* inflow2;
    let inflow1;
    let inflow2;

    inflow1 = Node[j].dwfInflow;
    while ( inflow1 )
    {
        inflow2 = inflow1.next;
        inflow1 = null;
        //free(inflow1);
        inflow1 = inflow2; 
    }
}

//=============================================================================
////////////////////////////////////
//let returnObj = {inflow: val1}
//let returnVal = inflow_initDwfInflow(returnObj)
//val1 = returnObj.inflow;
////////////////////////////////////
function   inflow_initDwfInflow(inObj)
//void   inflow_initDwfInflow(TDwfInflow* inflow)
//
//  Input:   inflow = dry weather inflow data structure
//  Output:  none
//  Purpose: initialzes a dry weather inflow by ordering its time patterns.
//
//  This function sorts the user-supplied time patterns for a dry weather
//  inflow in the order of the PatternType enumeration (monthly, daily,
//  weekday hourly, weekend hourly) to help speed up pattern processing.
//
{
    let i, p;
    let tmpPattern = new Array(4);  // index of each type of DWF pattern

    // --- assume no patterns were supplied
    for (i=0; i<4; i++) tmpPattern[i] = -1;

    // --- assign supplied patterns to proper position (by type) in tmpPattern
    for (i=0; i<4; i++)
    {
        p = inObj.inflow.patterns[i];
        if ( p >= 0 ) tmpPattern[Pattern[p].type] = p;
    }

    // --- re-fill inflow pattern array by pattern type
    for (i=0; i<4; i++) inObj.inflow.patterns[i] = tmpPattern[i];
}

//=============================================================================
////////////////////////////////////
//let returnObj = {inflow: val1}
//let returnVal = inflow_getDwfInflow(inObj, month, day, hour)
//val1 = returnObj.inflow;
////////////////////////////////////
function inflow_getDwfInflow(inObj, month, day, hour)
//double inflow_getDwfInflow(TDwfInflow* inflow, int month, int day, int hour)
//
//  Input:   inflow = dry weather inflow data structure
//           month = current month of year of simulation
//           day = current day of week of simulation
//           hour = current hour of day of simulation
//  Output:  returns value of dry weather inflow parameter
//  Purpose: computes dry weather inflow value at a specific point in time.
//
{
    let p1, p2;                     // pattern index
    let f = 1.0;                    // pattern factor

    p1 = inObj.inflow.patterns[MONTHLY_PATTERN];
    if ( p1 >= 0 ) f *= inflow_getPatternFactor(p1, month, day, hour);
    p1 = inObj.inflow.patterns[DAILY_PATTERN];
    if ( p1 >= 0 ) f *= inflow_getPatternFactor(p1, month, day, hour);
    p1 = inObj.inflow.patterns[HOURLY_PATTERN];
    p2 = inObj.inflow.patterns[WEEKEND_PATTERN];
    if ( p2 >= 0 )
    {
        if ( day == 0 || day == 6 )
            f *= inflow_getPatternFactor(p2, month, day, hour);
        else if ( p1 >= 0 )
            f *= inflow_getPatternFactor(p1, month, day, hour);
    }
    else if ( p1 >= 0 ) f *= inflow_getPatternFactor(p1, month, day, hour);
    return f * inObj.inflow.avgValue;

}

//=============================================================================

function inflow_initDwfPattern(j)
//void inflow_initDwfPattern(int j)
//
//  Input:   j = time pattern index
//  Output:  none
//  Purpose: initialzes a dry weather inflow time pattern.
//
{
    let i;
    for (i=0; i<24; i++) Pattern[j].factor[i] = 1.0;
    Pattern[j].count = 0;
    Pattern[j].type  = -1;
    Pattern[j].ID    = null;
}

//=============================================================================

function inflow_readDwfPattern(tok, ntoks)
//
//  Input:   tok[] = array of string tokens
//           ntoks = number of tokens
//  Output:  returns an error message
//  Purpose: reads values of a time pattern from a line of input data.
//
//  Format of data line is:
//    patternID  patternType  value(1) value(2) ...
//    patternID  value(n)  value(n+1) ....          (for continuation lines)
{
    let i, j, k, n = 1;

    // return faciliators
    let returnObj;
    let returnVal;

    // --- check for minimum number of tokens
    if ( ntoks < 2 ) return error_setInpError(ERR_ITEMS, "");

    // --- check that pattern exists in database
    j = project_findObject(TIMEPATTERN, tok[0]);
    if ( j < 0 ) return error_setInpError(ERR_NAME, tok[0]);

    // --- check if this is first line of pattern
    //     (ID pointer will not have been assigned yet)
    if ( Pattern[j].ID == null )
    {
        // --- assign ID pointer & pattern type
        Pattern[j].ID = project_findID(TIMEPATTERN, tok[0]);
        k = findmatch(tok[1], PatternTypeWords);
        if ( k < 0 ) return error_setInpError(ERR_KEYWORD, tok[1]);
        Pattern[j].type = k;
        n = 2;
    }

    // --- start reading pattern factors from rest of line
    while ( ntoks > n && Pattern[j].count < 24 )
    {
        i = Pattern[j].count;
        ////////////////////////////////////
        returnObj = {y: Pattern[j].factor[i]}
        returnVal = getDouble(tok[n], returnObj);
        Pattern[j].factor[i] = returnObj.y;
        ////////////////////////////////////
        if(!returnVal)
        //if ( !getDouble(tok[n], &Pattern[j].factor[i]) )
            return error_setInpError(ERR_NUMBER, tok[n]);
        Pattern[j].count++;
        n++;
    }
    return 0;
}

//=============================================================================

function inflow_getPatternFactor(p, month, day, hour)
//double inflow_getPatternFactor(int p, int month, int day, int hour)
//
//  Input:   p = time pattern index
//           month = current month of year of simulation
//           day = current day of week of simulation
//           hour = current hour of day of simulation
//  Output:  returns value of a time pattern multiplier
//  Purpose: computes time pattern multiplier for a specific point in time.
{
    switch ( Pattern[p].type )
    {
      case MONTHLY_PATTERN:
        if ( month >= 0 && month < 12 ) return Pattern[p].factor[month];
        break;
      case DAILY_PATTERN:
        if ( day >= 0 && day < 7 ) return Pattern[p].factor[day];
        break;
      case HOURLY_PATTERN:
        if ( hour >= 0 && hour < 24 ) return Pattern[p].factor[hour];
        break;
      case WEEKEND_PATTERN:
        if ( day == 0 || day == 6 )
        {
            if ( hour >= 0 && hour < 24 ) return Pattern[p].factor[hour];
        }
        break;
    }
    return 1.0;
}

//=============================================================================
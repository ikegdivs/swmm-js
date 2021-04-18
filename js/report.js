//-----------------------------------------------------------------------------
//   report.c
//
//   Project:  EPA SWMM5
//   Version:  5.1
//   Date:     03/21/2014  (Build 5.1.001)
//             04/14/14    (Build 5.1.004)
//             09/15/14    (Build 5.1.007)
//             04/02/15    (Build 5.1.008)
//             08/01/16    (Build 5.1.011)
//             03/14/17    (Build 5.1.012)
//             05/10/18    (Build 5.1.013)
//             03/01/20    (Build 5.1.014)
//             05/18/20    (Build 5.1.015)
//   Author:   L. Rossman (EPA)
//
//   Report writing functions.
//
//   Build 5.1.004:
//   - Ignore RDII option reported.
//
//   Build 5.1.007:
//   - Total exfiltration loss reported.
//
//   Build 5.1.008:
//   - Number of threads option reported.
//   - LID drainage volume and outfall runon reported.
//   - "Internal Outflow" label changed to "Flooding Loss" in Flow Routing
//     Continuity table.
//   - Exfiltration loss added into Quality Routing Continuity table.
//
//   Build 5.1.011:
//   - Blank line added after writing project title.
//   - Text of error message saved to global variable ErrorMsg.
//   - Global variable Warnings incremented after warning message issued.
//
//   Build 5.1.012:
//   - System time step statistics adjusted for time in steady state.
//
//   Build 5.1.013:
//   - Parsing of AVERAGES report option added to report_readOptions().
//   - Name of surcharge method reported in report_writeOptions().
//   - Missing format specifier added to fprintf() in report_writeErrorCode.
//
//   Build 5.1.014:
//   - Fixed bug in confusing keywords with ID names in report_readOptions().
//
//   Build 5.1.015:
//   - Fixes bug in summary statistics when Report Start date > Start Date.
//   - Support added for grouped freqency table of routing time steps.
//-----------------------------------------------------------------------------
function WRITE(x) {(report_writeLine((x)))}
var LINE_10 = "----------"
var LINE_12 = "------------"
var LINE_51 = "---------------------------------------------------"
var LINE_64 = "----------------------------------------------------------------"


//-----------------------------------------------------------------------------
//  Shared variables
//-----------------------------------------------------------------------------
var SysTime;

//-----------------------------------------------------------------------------
//  Imported variables
//-----------------------------------------------------------------------------
var SubcatchResults;         // Results vectors defined in OUTPUT.C
var NodeResults;             //  "
var LinkResults;             //  "
var ErrString;               // defined in ERROR.C

//=============================================================================

function report_readOptions(tok, ntoks)
//
//  Input:   tok[] = array of string tokens
//           ntoks = number of tokens
//  Output:  returns an error code
//  Purpose: reads reporting options from a line of input
//
{
    let  k;
    let  j, m, t;
    if ( ntoks < 2 ) return error_setInpError(ERR_ITEMS, "");
    k = findmatch(tok[0], ReportWords);
    if ( k < 0 ) return error_setInpError(ERR_KEYWORD, tok[0]);
    switch ( k )
    {
      case 0: // Input
        m = findmatch(tok[1], NoYesWords);
        if      ( m == YES ) RptFlags.input = TRUE;
        else if ( m == NO )  RptFlags.input = FALSE;
        else                 return error_setInpError(ERR_KEYWORD, tok[1]);
        return 0;

      case 1: // Continuity
        m = findmatch(tok[1], NoYesWords);
        if      ( m == YES ) RptFlags.continuity = TRUE;
        else if ( m == NO )  RptFlags.continuity = FALSE;
        else                 return error_setInpError(ERR_KEYWORD, tok[1]);
        return 0;

      case 2: // Flow Statistics
        m = findmatch(tok[1], NoYesWords);
        if      ( m == YES ) RptFlags.flowStats = TRUE;
        else if ( m == NO )  RptFlags.flowStats = FALSE;
        else                 return error_setInpError(ERR_KEYWORD, tok[1]);
        return 0;

      case 3: // Controls
        m = findmatch(tok[1], NoYesWords);
        if      ( m == YES ) RptFlags.controls = TRUE;
        else if ( m == NO )  RptFlags.controls = FALSE;
        else                 return error_setInpError(ERR_KEYWORD, tok[1]);
        return 0;

      case 4:  m = SUBCATCH;  break;  // Subcatchments
      case 5:  m = NODE;      break;  // Nodes
      case 6:  m = LINK;      break;  // Links

      case 7: // Node Statistics
        m = findmatch(tok[1], NoYesWords);
        if      ( m == YES ) RptFlags.nodeStats = TRUE;
        else if ( m == NO )  RptFlags.nodeStats = FALSE;
        else                 return error_setInpError(ERR_KEYWORD, tok[1]);
        return 0;

      case 8: // Averages                                                      //(5.1.013)
        m = findmatch(tok[1], NoYesWords);                                     //
        if      (m == YES) RptFlags.averages = TRUE;                           //
        else if (m == NO)  RptFlags.averages = FALSE;                          //
        else               return error_setInpError(ERR_KEYWORD, tok[1]);      //
        return 0;                                                              //

      default: return error_setInpError(ERR_KEYWORD, tok[1]);
    }

    if (strcomp(tok[1], w_NONE))
        k = NONE;
    else if (strcomp(tok[1], w_ALL))
        k = ALL;
    else
    {
        k = SOME;
        for (t = 1; t < ntoks; t++)
        {
            j = project_findObject(m, tok[t]);
            if ( j < 0 ) return error_setInpError(ERR_NAME, tok[t]);
            switch ( m )
            {
              case SUBCATCH:  Subcatch[j].rptFlag = TRUE;  break;
              case NODE:      Node[j].rptFlag = TRUE;  break;
              case LINK:      Link[j].rptFlag = TRUE;  break;
            }
        }
    }
    switch ( m )
    {
      case SUBCATCH: RptFlags.subcatchments = k;  break;
      case NODE:     RptFlags.nodes = k;  break;
      case LINK:     RptFlags.links = k;  break;
    }
    return 0;
}

//=============================================================================
// char *line
function report_writeLine(line)
//
//  Input:   line = line of text
//  Output:  none
//  Purpose: writes line of text to report file.
//
{
    //if ( Frpt.file ) Frpt.contents += "\n  %s", line);
    if ( Frpt.contents ) Frpt.contents += "\n  " + line;
}

//=============================================================================
function format_time(s) {
    const dtFormat = new Intl.DateTimeFormat('en-GB', {
        timeStyle: 'medium',
        timeZone: 'UTC'
    });

    return dtFormat.format(new Date(s * 1e3));
}
function report_writeSysTime()
//
//  Input:   none
//  Output:  none
//  Purpose: writes starting/ending processing times to report file.
//
{
    let    theTime = new Array(9);
    let  elapsedTime;
    let  endTime;
    if ( Frpt.contents )
    {
        //Frpt.contents += FMT20.format(ctime(SysTime));
        Frpt.contents += format_time(SysTime);
        endTime = Math.floor(Date.now() / 1000);;
        //Frpt.contents += FMT20a.format(ctime(endTime));
        Frpt.contents += format_time(endTime);
        elapsedTime = endTime - SysTime;
        Frpt.contents += FMT21;
        if ( elapsedTime < 1.0 ) Frpt.contents += "< 1 sec" //Frpt.contents += "< 1 sec");
        else
        {
            elapsedTime /= SECperDAY;
            if (elapsedTime >= 1.0)
            {
                //Frpt.contents += "%d.", floor(elapsedTime));
                Frpt.contents += `${elapsedTime}`
                elapsedTime -= Math.floor(elapsedTime);
            }
            theTime = datetime_timeToStr(elapsedTime, theTime);
            //Frpt.contents += "%s", theTime);
            Frpt.contents += `${theTime}`
        }
    }
}


//=============================================================================
//      SIMULATION OPTIONS REPORTING
//=============================================================================

function report_writeLogo()
//
//  Input:   none
//  Output:  none
//  Purpose: writes report header lines to report file.
//
{
    Frpt.contents += FMT08;
    Frpt.contents += FMT09;
    Frpt.contents += FMT10;
    SysTime = Math.floor(Date.now() / 1000);                    // Save starting wall clock time
}

//=============================================================================

function report_writeTitle()
//
//  Input:   none
//  Output:  none
//  Purpose: writes project title to report file.
//
{
    let i;
    let lineCount = 0;
    if ( ErrorCode ) {return};
    for (i=0; i<MAXTITLE; i++) if ( Title[i].length > 0 )
    {
        WRITE(Title[i]);
        lineCount++;
    }
    if ( lineCount > 0 ) WRITE("");
}

//=============================================================================

function report_writeOptions()
//
//  Input:   none
//  Output:  none
//  Purpose: writes analysis options in use to report file.
//
{
    let str;
    WRITE("");
    WRITE("*********************************************************");
    WRITE("NOTE: The summary statistics displayed in this report are");
    WRITE("based on results found at every computational time step,  ");
    WRITE("not just on results from each reporting time step.");
    WRITE("*********************************************************");
    WRITE("");
    WRITE("****************");
    WRITE("Analysis Options");
    WRITE("****************");
    Frpt.contents += `\n  Flow Units ............... ${FlowUnitWords[FlowUnits]}`
    Frpt.contents += "\n  Process Models:";
    Frpt.contents += "\n    Rainfall/Runoff ........ ";
    if ( IgnoreRainfall || Nobjects[GAGE] == 0 )
        Frpt.contents += "NO";
    else Frpt.contents += "YES";

    Frpt.contents += "\n    RDII ................... ";
    if ( IgnoreRDII || Nobjects[UNITHYD] == 0 )
        Frpt.contents += "NO";
    else Frpt.contents += "YES";

    Frpt.contents += "\n    Snowmelt ............... ";
    if ( IgnoreSnowmelt || Nobjects[SNOWMELT] == 0 )
        Frpt.contents += "NO";
    else Frpt.contents += "YES";
    Frpt.contents += "\n    Groundwater ............ ";
    if ( IgnoreGwater || Nobjects[AQUIFER] == 0 )
        Frpt.contents += "NO";
    else Frpt.contents += "YES";
    Frpt.contents += "\n    Flow Routing ........... ";
    if ( IgnoreRouting || Nobjects[LINK] == 0 )
        Frpt.contents += "NO";
    else
    {
        Frpt.contents += "YES";
        Frpt.contents += "\n    Ponding Allowed ........ ";
        if ( AllowPonding ) Frpt.contents += "YES"
        else                Frpt.contents += "NO";
    }
    Frpt.contents += "\n    Water Quality .......... ";
    if ( IgnoreQuality || Nobjects[POLLUT] == 0 )
        Frpt.contents += "NO";
    else Frpt.contents += "YES";

    if ( Nobjects[SUBCATCH] > 0 )
    Frpt.contents += `\n  Infiltration Method ...... ${InfilModelWords[InfilModel]}`
    if ( Nobjects[LINK] > 0 )
    Frpt.contents += `\n  Flow Routing Method ...... ${RouteModelWords[RouteModel]}`

    if (RouteModel == DW)                                                      //(5.1.013)
    Frpt.contents += `\n  Surcharge Method ......... ${SurchargeWords[SurchargeMethod]}`                                      //(5.1.013)

    str = datetime_dateToStr(StartDate, str);
    Frpt.contents += `\n  Starting Date ............ ${str}`
    str = datetime_timeToStr(StartTime, str);
    Frpt.contents += ` ${str}`
    str = datetime_dateToStr(EndDate, str);
    Frpt.contents += `\n  Ending Date .............. ${str}`
    str = datetime_timeToStr(EndTime, str);
    Frpt.contents += ` ${str}`
    Frpt.contents += `\n  Antecedent Dry Days ...... ${StartDryDays.toFixed(1)}`;
    str = datetime_timeToStr(datetime_encodeTime(0, 0, ReportStep), str);
    Frpt.contents += `\n  Report Time Step ......... ${str}`
    if ( Nobjects[SUBCATCH] > 0 )
    {
        str = datetime_timeToStr(datetime_encodeTime(0, 0, WetStep), str);
        Frpt.contents += `\n  Wet Time Step ............ ${str}`
        str = datetime_timeToStr(datetime_encodeTime(0, 0, DryStep), str);
        Frpt.contents += `\n  Dry Time Step ............ ${str}`
    }
    if ( Nobjects[LINK] > 0 )
    {
        Frpt.contents += `\n  Routing Time Step ........ ${RouteStep.toFixed(2)} sec`;
		if ( RouteModel == DW )
		{
		Frpt.contents += `\n  Variable Time Step ....... `
		if ( CourantFactor > 0.0 ) Frpt.contents += "YES"
		else                       Frpt.contents += "NO"
		Frpt.contents += `\n  Maximum Trials ........... ${MaxTrials}`
        Frpt.contents += `\n  Number of Threads ........ ${NumThreads}`
		Frpt.contents += `\n  Head Tolerance ........... ${(HeadTol*UCF(LENGTH)).toFixed(6)} `;
		if ( UnitSystem == US ) Frpt.contents += "ft"
		else                    Frpt.contents += "m"
		}
    }
    WRITE("");
}


//=============================================================================
//      RAINFALL FILE REPORTING
//=============================================================================
// int i
// TRainStats* r
function report_writeRainStats(i,  r)
//
//  Input:   i = rain gage index
//           r = rain file summary statistics
//  Output:  none
//  Purpose: writes summary of rain data read from file to report file.
//
{
    let date1 = "***********";
    let date2 = "***********";
    if ( i < 0 )
    {
        WRITE("");
        WRITE("*********************");
        WRITE("Rainfall File Summary");
        WRITE("*********************");
        Frpt.contents +=
"\n  Station    First        Last         Recording   Periods    Periods    Periods";
        Frpt.contents +=
"\n  ID         Date         Date         Frequency  w/Precip    Missing    Malfunc.";
        Frpt.contents +=
"\n  -------------------------------------------------------------------------------\n";
    }
    else
    {
        if ( r.startDate != NO_DATE ) date1 = datetime_dateToStr(r.startDate, date1);
        if ( r.endDate   != NO_DATE ) date2 = datetime_dateToStr(r.endDate, date2);
        Frpt.contents += `  ${staID} ${date1}  ${date2}  ${Gage[i].rainInterval/60} min    ${r.periodsRain}     ${r.periodsMissing}     ${r.periodsMalfunc}\n`
    }
}


//=============================================================================
//      RDII REPORTING
//=============================================================================
// double rainVol
// double rdiiVol
function report_writeRdiiStats(rainVol, rdiiVol)
//
//  Input:   rainVol = total rainfall volume over sewershed
//           rdiiVol = total RDII volume produced
//  Output:  none
//  Purpose: writes summary of RDII inflow to report file.
//
{
    let ratio;
    let ucf1, ucf2;

    ucf1 = UCF(LENGTH) * UCF(LANDAREA);
    if ( UnitSystem == US) ucf2 = MGDperCFS / SECperDAY;
    else                   ucf2 = MLDperCFS / SECperDAY;

    WRITE(``);
    Frpt.contents +=
    `\n  **********************           Volume        Volume`;
    if ( UnitSystem == US) Frpt.contents +=
    `\n  Rainfall Dependent I/I        acre-feet      10^6 gal`;
    else Frpt.contents +=
    `\n  Rainfall Dependent I/I        hectare-m      10^6 ltr`;
    Frpt.contents +=
    `\n  **********************        ---------     ---------`;

    Frpt.contents += `\n  Sewershed Rainfall ......${(rainVol * ucf1).toFixed(3).padStart(14, ' ')}${(rainVol * ucf2).toFixed(3).padStart(14, ' ')}`

    Frpt.contents += `\n  RDII Produced ...........${(rdiiVol * ucf1).toFixed(3).padStart(14, ' ')}${(rdiiVol * ucf2).toFixed(3).padStart(14, ' ')}`

    if ( rainVol == 0.0 ) ratio = 0.0;
    else ratio = rdiiVol / rainVol;
    Frpt.contents += `\n  RDII Ratio ..............${(ratio).toFixed(3).padStart(14, ' ')}`
    WRITE(``);
}


//=============================================================================
//      CONTROL ACTIONS REPORTING
//=============================================================================

function   report_writeControlActionsHeading()
{
    WRITE("");
    WRITE("*********************");
    WRITE("Control Actions Taken");
    WRITE("*********************");
    Frpt.contents += "\n";
}

//=============================================================================
// DateTime aDate, 
// char* linkID, 
// double value,
// char* ruleID
function   report_writeControlAction(aDate, linkID, value, ruleID)
//
//  Input:   aDate  = date/time of rule action
//           linkID = ID of link being controlled
//           value  = new status value of link
//           ruleID = ID of rule implementing the action
//  Output:  none
//  Purpose: reports action taken by a control rule.
//
{
    let     theDate;
    let     theTime;
    theDate = datetime_dateToStr(aDate, theDate);
    theTime = datetime_timeToStr(aDate, theTime);
    let val1 = theDate.padStart(11, ' ')
    let val2 = theTime.padStart(8, ' ')
    let val3 = linkID
    let val4 = value.toFixed(2).padStart(6)
    let val5 = ruleID
    Frpt.contents +=
            `  ${val1}: ${val2} Link ${val3} setting changed to ${val5} by Control ${val5}\n`
}


//=============================================================================
//      CONTINUITY ERROR REPORTING
//=============================================================================
// TRunoffTotals* totals, 
// double totalArea
function report_writeRunoffError(totals, totalArea)
//
//  Input:  totals = accumulated runoff totals
//          totalArea = total area of all subcatchments
//  Output:  none
//  Purpose: writes runoff continuity error to report file.
//
{
    // Values for string translation
    let val1 = 0;
    let val2 = 0;

    if ( Frunoff.mode == USE_FILE )
    {
        WRITE("");
        Frpt.contents +=
        "\n  **************************"
        +"\n  Runoff Quantity Continuity"
        +"\n  **************************"
        +`\n  Runoff supplied by interface file ${Frunoff.name}`
        WRITE("");
        return;
    }

    if ( totalArea == 0.0 ) return;
    WRITE("");

    Frpt.contents +=
    "\n  **************************        Volume         Depth";
    if ( UnitSystem == US) Frpt.contents += 
    "\n  Runoff Quantity Continuity     acre-feet        inches";
    else Frpt.contents += 
    "\n  Runoff Quantity Continuity     hectare-m            mm";
    Frpt.contents += 
    "\n  **************************     ---------       -------";

    if ( totals.initStorage > 0.0 )
    {
        val1 = (totals.initStorage * UCF(LENGTH) * UCF(LANDAREA)).toFixed(3).padStart(14, ' ');
        val2 = (totals.initStorage / totalArea * UCF(RAINDEPTH)).toFixed(3).padStart(14, ' ');
        Frpt.contents += `\n  Initial LID Storage ......${val1}${val2}`;
    }

    if ( Nobjects[SNOWMELT] > 0 )
    {
        val1 = (totals.initSnowCover * UCF(LENGTH) * UCF(LANDAREA)).toFixed(3).padStart(14, ' ');
        val2 = (totals.initSnowCover / totalArea * UCF(RAINDEPTH)).toFixed(3).padStart(14, ' ');
        Frpt.contents += `\n  Initial Snow Cover .......${val1}${val2}`;
    }

    val1 = (totals.rainfall * UCF(LENGTH) * UCF(LANDAREA)).toFixed(3).padStart(14, ' ');
    val2 = (totals.rainfall / totalArea * UCF(RAINDEPTH)).toFixed(3).padStart(14, ' ');
    Frpt.contents += `\n  Total Precipitation ......${val1}${val2}`;

    if ( totals.runon > 0.0 )
    {
        val1 = (totals.runon * UCF(LENGTH) * UCF(LANDAREA)).toFixed(3).padStart(14, ' ');
        val2 = (totals.runon / totalArea * UCF(RAINDEPTH)).toFixed(3).padStart(14, ' ');
        Frpt.contents += `\n  Outfall Runon ............${val1}${val2}`;
    }

    val1 = (totals.evap * UCF(LENGTH) * UCF(LANDAREA)).toFixed(3).padStart(14, ' ');
    val2 = (totals.evap / totalArea * UCF(RAINDEPTH)).toFixed(3).padStart(14, ' ');
    Frpt.contents += `\n  Evaporation Loss .........${val1}${val2}`

    val1 = (totals.infil * UCF(LENGTH) * UCF(LANDAREA)).toFixed(3).padStart(14, ' ');
    val2 = (totals.infil / totalArea * UCF(RAINDEPTH)).toFixed(3).padStart(14, ' ');
    Frpt.contents += `\n  Infiltration Loss ........${val1}${val2}`;

    val1 = (totals.runoff * UCF(LENGTH) * UCF(LANDAREA)).toFixed(3).padStart(14, ' ');
    val2 = (totals.runoff / totalArea * UCF(RAINDEPTH)).toFixed(3).padStart(14, ' ');
    Frpt.contents += `\n  Surface Runoff ...........${val1}${val2}`

    if ( totals.drains > 0.0 )
    {
        val1 = (totals.drains * UCF(LENGTH) * UCF(LANDAREA)).toFixed(3).padStart(14, ' ');
        val2 = (totals.drains / totalArea * UCF(RAINDEPTH)).toFixed(3).padStart(14, ' ');
        Frpt.contents += `\n  LID Drainage .............${val1}${val2}`
    }

    if ( Nobjects[SNOWMELT] > 0 )
    {
        val1 = (totals.snowRemoved * UCF(LENGTH) * UCF(LANDAREA)).toFixed(3).padStart(14, ' ');
        val2 = (totals.snowRemoved / totalArea * UCF(RAINDEPTH)).toFixed(3).padStart(14, ' ');
        Frpt.contents += `\n  Snow Removed .............${val1}${val2}`

        val1 = (totals.finalSnowCover * UCF(LENGTH) * UCF(LANDAREA)).toFixed(3).padStart(14, ' ');
        val2 = (totals.finalSnowCover / totalArea * UCF(RAINDEPTH)).toFixed(3).padStart(14, ' ');
        Frpt.contents += `\n  Final Snow Cover .........${val1}${val2}`
    }

    val1 = (totals.finalStorage * UCF(LENGTH) * UCF(LANDAREA)).toFixed(3).padStart(14, ' ');
    val2 = (totals.finalStorage / totalArea * UCF(RAINDEPTH)).toFixed(3).padStart(14, ' ');
    Frpt.contents += `\n  Final Storage ............${val1}${val2}`

    Frpt.contents += `\n  Continuity Error (%%) .....${totals.pctError}`
    WRITE(``);
}

//=============================================================================
// TLoadingTotals* totals
function report_writeLoadingError(totals)
//
//  Input:   totals = accumulated pollutant loading totals
//           area = total area of all subcatchments
//  Output:  none
//  Purpose: writes runoff loading continuity error to report file.
//
{
    let p1, p2;
    p1 = 1;
    p2 = MIN(5, Nobjects[POLLUT]);
    while ( p1 <= Nobjects[POLLUT] )
    {
        report_LoadingErrors(p1-1, p2-1, totals);
        p1 = p2 + 1;
        p2 = p1 + 4;
        p2 = MIN(p2, Nobjects[POLLUT]);
    }
}

//=============================================================================
// int p1, 
// int p2, 
// TLoadingTotals* totals
function report_LoadingErrors(p1, p2, totals)
//
//  Input:   p1 = index of first pollutant to report
//           p2 = index of last pollutant to report
//           totals = accumulated pollutant loading totals
//           area = total area of all subcatchments
//  Output:  none
//  Purpose: writes runoff loading continuity error to report file for
//           up to 5 pollutants at a time.
//
{
    let    i;
    let    p;
    let cf = 1.0;
    let   units;

    WRITE("");
    Frpt.contents += "\n  **************************";
    for (p = p1; p <= p2; p++)
    {
        Frpt.contents += Pollut[p].ID.padStart(14, ' ')
    }
    Frpt.contents += "\n  Runoff Quality Continuity ";
    for (p = p1; p <= p2; p++)
    {
        i = UnitSystem;
        if ( Pollut[p].units == COUNT ) i = 2;
        units = LoadUnitsWords[i];
        Frpt.contents += units.padStart(14, ' ');
    }
    Frpt.contents += "\n  **************************";
    for (p = p1; p <= p2; p++)
    {
        Frpt.contents += "    ----------";
    }

    Frpt.contents += "\n  Initial Buildup ..........";
    for (p = p1; p <= p2; p++)
    {
        Frpt.contents += (totals[p].initLoad*cf).toFixed(3).padStart(14, ' ');
    }
    Frpt.contents += "\n  Surface Buildup ..........";
    for (p = p1; p <= p2; p++)
    {
        Frpt.contents += (totals[p].buildup*cf).toFixed(3).padStart(14, ' ');
    }
    Frpt.contents += "\n  Wet Deposition ...........";
    for (p = p1; p <= p2; p++)
    {
        Frpt.contents += (totals[p].deposition*cf).toFixed(3).padStart(14, ' ');
    }
    Frpt.contents += "\n  Sweeping Removal .........";
    for (p = p1; p <= p2; p++)
    {
        Frpt.contents += (totals[p].sweeping*cf).toFixed(3).padStart(14, ' ');
    }
    Frpt.contents += "\n  Infiltration Loss ........";
    for (p = p1; p <= p2; p++)
    {
        Frpt.contents += (totals[p].infil*cf).toFixed(3).padStart(14, ' ');
    }
    Frpt.contents += "\n  BMP Removal ..............";
    for (p = p1; p <= p2; p++)
    {
        Frpt.contents += (totals[p].bmpRemoval*cf).toFixed(3).padStart(14, ' ');
    }
    Frpt.contents += "\n  Surface Runoff ...........";
    for (p = p1; p <= p2; p++)
    {
        Frpt.contents += (totals[p].runoff*cf).toFixed(3).padStart(14, ' ');
    }
    Frpt.contents += "\n  Remaining Buildup ........";
    for (p = p1; p <= p2; p++)
    {
        Frpt.contents += (totals[p].finalLoad*cf).toFixed(3).padStart(14, ' ');
    }
    Frpt.contents += "\n  Continuity Error (%%) .....";
    for (p = p1; p <= p2; p++)
    {
        Frpt.contents += (totals[p].pctError).toFixed(3).padStart(14, ' ');
    }
    WRITE("");
}

//=============================================================================
// TGwaterTotals* totals, 
// double gwArea
function report_writeGwaterError(totals, gwArea)
//
//  Input:   totals = accumulated groundwater totals
//           gwArea = total area of all subcatchments with groundwater
//  Output:  none
//  Purpose: writes groundwater continuity error to report file.
//
{
    // values for strings
    let val1 = 0;
    let val2 = 0;

    WRITE("");
    Frpt.contents += 
    "\n  **************************        Volume         Depth";
    if ( UnitSystem == US) Frpt.contents += 
    "\n  Groundwater Continuity         acre-feet        inches";
    else Frpt.contents += 
    "\n  Groundwater Continuity         hectare-m            mm";
    Frpt.contents += 
    "\n  **************************     ---------       -------";
    val1 = (totals.initStorage * UCF(LENGTH) * UCF(LANDAREA)).toFixed(3).padStart(14, ' ');
    val2 = (totals.initStorage / gwArea * UCF(RAINDEPTH)).toFixed(3).padStart(14, ' ');
    Frpt.contents += `\n  Initial Storage ..........${val1}${val2}`

    val1 = (totals.infil * UCF(LENGTH) * UCF(LANDAREA)).toFixed(3).padStart(14, ' ');
    val2 = (totals.infil / gwArea * UCF(RAINDEPTH)).toFixed(3).padStart(14, ' ');
    Frpt.contents += `\n  Infiltration .............${val1}${val2}`

    val1 = (totals.upperEvap * UCF(LENGTH) * UCF(LANDAREA)).toFixed(3).padStart(14, ' ');
    val2 = (totals.upperEvap / gwArea * UCF(RAINDEPTH)).toFixed(3).padStart(14, ' ');
    Frpt.contents += `\n  Upper Zone ET ............${val1}${val2}`
            
    val1 = (totals.lowerEvap * UCF(LENGTH) * UCF(LANDAREA)).toFixed(3).padStart(14, ' ');
    val2 = (totals.lowerEvap / gwArea * UCF(RAINDEPTH)).toFixed(3).padStart(14, ' ');
    Frpt.contents += `\n  Lower Zone ET ............${val1}${val2}`
            
    val1 = (totals.lowerPerc * UCF(LENGTH) * UCF(LANDAREA)).toFixed(3).padStart(14, ' ');
    val2 = (totals.lowerPerc / gwArea * UCF(RAINDEPTH)).toFixed(3).padStart(14, ' ');
    Frpt.contents += `\n  Deep Percolation .........${val1}${val2}`
            
    val1 = (totals.gwater * UCF(LENGTH) * UCF(LANDAREA)).toFixed(3).padStart(14, ' ');
    val2 = (totals.gwater / gwArea * UCF(RAINDEPTH)).toFixed(3).padStart(14, ' ');
    Frpt.contents += `\n  Groundwater Flow .........${val1}${val2}`
            
    val1 = (totals.finalStorage * UCF(LENGTH) * UCF(LANDAREA)).toFixed(3).padStart(14, ' ');
    val2 = (totals.finalStorage / gwArea * UCF(RAINDEPTH)).toFixed(3).padStart(14, ' ');
    Frpt.contents += `\n  Final Storage ............${val1}${val2}`
            
    Frpt.contents += `\n  Continuity Error (%%) .....${totals.pctError}`

    WRITE("");
}

//=============================================================================
// TRoutingTotals *totals
function report_writeFlowError(totals)
//
//  Input:  totals = accumulated flow routing totals
//  Output:  none
//  Purpose: writes flow routing continuity error to report file.
//
{
    let ucf1, ucf2;

    // String formatting variables
    let val1, val2;

    ucf1 = UCF(LENGTH) * UCF(LANDAREA);
    if ( UnitSystem == US) ucf2 = MGDperCFS / SECperDAY;
    else                   ucf2 = MLDperCFS / SECperDAY;

    WRITE("");
    Frpt.contents += 
    "\n  **************************        Volume        Volume";
    if ( UnitSystem == US) Frpt.contents += 
    "\n  Flow Routing Continuity        acre-feet      10^6 gal";
    else Frpt.contents += 
    "\n  Flow Routing Continuity        hectare-m      10^6 ltr";
    Frpt.contents += 
    "\n  **************************     ---------     ---------";

    val1 = (totals.dwInflow * ucf1).toFixed(3).padStart(14, ' ');
    val2 = (totals.dwInflow * ucf2).toFixed(3).padStart(14, ' ');
    Frpt.contents += `\n  Dry Weather Inflow .......${val1}${val2}`

    val1 = (totals.wwInflow * ucf1).toFixed(3).padStart(14, ' ');
    val2 = (totals.wwInflow * ucf2).toFixed(3).padStart(14, ' ');
    Frpt.contents += `\n  Wet Weather Inflow .......${val1}${val2}`

    val1 = (totals.gwInflow * ucf1).toFixed(3).padStart(14, ' ');
    val2 = (totals.gwInflow * ucf2).toFixed(3).padStart(14, ' ');
    Frpt.contents += `\n  Groundwater Inflow .......${val1}${val2}`
    
    val1 = (totals.iiInflow * ucf1).toFixed(3).padStart(14, ' ');
    val2 = (totals.iiInflow * ucf2).toFixed(3).padStart(14, ' ');
    Frpt.contents += `\n  RDII Inflow ..............${val1}${val2}`

    val1 = (totals.exInflow * ucf1).toFixed(3).padStart(14, ' ');
    val2 = (totals.exInflow * ucf2).toFixed(3).padStart(14, ' ');
    Frpt.contents += `\n  External Inflow ..........${val1}${val2}`

    val1 = (totals.outflow * ucf1).toFixed(3).padStart(14, ' ');
    val2 = (totals.outflow * ucf2).toFixed(3).padStart(14, ' ');
    Frpt.contents += `\n  External Outflow .........${val1}${val2}`

    val1 = (totals.flooding * ucf1).toFixed(3).padStart(14, ' ');
    val2 = (totals.flooding * ucf2).toFixed(3).padStart(14, ' ');
    Frpt.contents += `\n  Flooding Loss ............${val1}${val2}`

    val1 = (totals.evapLoss * ucf1).toFixed(3).padStart(14, ' ');
    val2 = (totals.evapLoss * ucf2).toFixed(3).padStart(14, ' ');
    Frpt.contents += `\n  Evaporation Loss .........${val1}${val2}`

    val1 = (totals.seepLoss * ucf1).toFixed(3).padStart(14, ' ');
    val2 = (totals.seepLoss * ucf2).toFixed(3).padStart(14, ' ');
    Frpt.contents += `\n  Exfiltration Loss ........${val1}${val2}`

    val1 = (totals.initStorage * ucf1).toFixed(3).padStart(14, ' ');
    val2 = (totals.initStorage * ucf2).toFixed(3).padStart(14, ' ');
    Frpt.contents += `\n  Initial Stored Volume ....${val1}${val2}`

    val1 = (totals.finalStorage * ucf1).toFixed(3).padStart(14, ' ');
    val2 = (totals.finalStorage * ucf2).toFixed(3).padStart(14, ' ');
    Frpt.contents += `\n  Final Stored Volume ......${val1}${val2}`

    val1 = (totals.pctError).toFixed(3).padStart(14, ' ');
    Frpt.contents += `\n  Continuity Error (%%) .....${val1}`
    WRITE("");
}

//=============================================================================
// TRoutingTotals* QualTotals
function report_writeQualError(QualTotals)
//
//  Input:   totals = accumulated quality routing totals for each pollutant
//  Output:  none
//  Purpose: writes quality routing continuity error to report file.
//
{
    let p1, p2;
    p1 = 1;
    p2 = MIN(5, Nobjects[POLLUT]);
    while ( p1 <= Nobjects[POLLUT] )
    {
        report_QualErrors(p1-1, p2-1, QualTotals);
        p1 = p2 + 1;
        p2 = p1 + 4;
        p2 = MIN(p2, Nobjects[POLLUT]);
    }
}

//=============================================================================
// int p1, 
// int p2, 
// TRoutingTotals* QualTotals
function report_QualErrors(p1, p2, QualTotals)
{
    let   i;
    let   p;
    let  units;

    // String formatting variables
    let val, val2;

    WRITE("");
    Frpt.contents += "\n  **************************";
    for (p = p1; p <= p2; p++)
    {
        Frpt.contents += Pollut[p].ID.padStart(14, ' ');
    }
    Frpt.contents += "\n  Quality Routing Continuity";
    for (p = p1; p <= p2; p++)
    {
        i = UnitSystem;
        if ( Pollut[p].units == COUNT ) i = 2;
        //strcpy(units, LoadUnitsWords[i]);
        units = LoadUnitsWords[i];
        Frpt.contents += units.padStart(14, ' ');
    }
    Frpt.contents += "\n  **************************";
    for (p = p1; p <= p2; p++)
    {
        Frpt.contents += "    ----------";
    }

    Frpt.contents += "\n  Dry Weather Inflow .......";
    for (p = p1; p <= p2; p++)
    {
        Frpt.contents += (QualTotals[p].dwInflow).toFixed(3).padStart(14, ' ');
    }

    Frpt.contents += "\n  Wet Weather Inflow .......";
    for (p = p1; p <= p2; p++)
    {
        Frpt.contents += (QualTotals[p].wwInflow).toFixed(3).padStart(14, ' ');
    }

    Frpt.contents += "\n  Groundwater Inflow .......";
    for (p = p1; p <= p2; p++)
    {
        Frpt.contents += (QualTotals[p].gwInflow).toFixed(3).padStart(14, ' ');
    }

    Frpt.contents += "\n  RDII Inflow ..............";
    for (p = p1; p <= p2; p++)
    {
        Frpt.contents += (QualTotals[p].iiInflow).toFixed(3).padStart(14, ' ');
    }

    Frpt.contents += "\n  External Inflow ..........";
    for (p = p1; p <= p2; p++)
    {
        Frpt.contents += ( QualTotals[p].exInflow).toFixed(3).padStart(14, ' ');
    }

    Frpt.contents += "\n  External Outflow .........";
    for (p = p1; p <= p2; p++)
    {
        Frpt.contents += (QualTotals[p].outflow).toFixed(3).padStart(14, ' ');
    }

    Frpt.contents += "\n  Flooding Loss ............";
    for (p = p1; p <= p2; p++)
    {
        Frpt.contents += (QualTotals[p].flooding).toFixed(3).padStart(14, ' ');
    }

    Frpt.contents += "\n  Exfiltration Loss ........";
    for (p = p1; p <= p2; p++)
    {
        Frpt.contents += (QualTotals[p].seepLoss).toFixed(3).padStart(14, ' ');
    }

    Frpt.contents += "\n  Mass Reacted .............";
    for (p = p1; p <= p2; p++)
    {
        Frpt.contents += (QualTotals[p].reacted).toFixed(3).padStart(14, ' ');
    }

    Frpt.contents += "\n  Initial Stored Mass ......";
    for (p = p1; p <= p2; p++)
    {
        Frpt.contents += (QualTotals[p].initStorage).toFixed(3).padStart(14, ' ');
    }

    Frpt.contents += "\n  Final Stored Mass ........";
    for (p = p1; p <= p2; p++)
    {
        Frpt.contents += (QualTotals[p].finalStorage).toFixed(3).padStart(14, ' ');
    }

    Frpt.contents += "\n  Continuity Error (%%) .....";
    for (p = p1; p <= p2; p++)
    {
        Frpt.contents += (QualTotals[p].pctError).toFixed(3).padStart(14, ' ');
    }
    WRITE("");
}

//=============================================================================
// TMaxStats maxMassBalErrs[], 
// TMaxStats maxCourantCrit[],
// int nMaxStats
function report_writeMaxStats(maxMassBalErrs, maxCourantCrit, nMaxStats)
//
//  Input:   maxMassBal[] = nodes with highest mass balance errors
//           maxCourantCrit[] = nodes most often Courant time step critical
//           maxLinkTimes[] = links most often Courant time step critical
//           nMaxStats = number of most critical nodes/links saved
//  Output:  none
//  Purpose: lists nodes & links with highest mass balance errors and
//           time Courant time step critical
//
{
    let i, j, k;

    if ( RouteModel != DW || Nobjects[LINK] == 0 ) return;
    if ( nMaxStats <= 0 ) return;
    if ( maxMassBalErrs[0].index >= 0 )
    {
        WRITE("");
        WRITE("*************************");
        WRITE("Highest Continuity Errors");
        WRITE("*************************");
        for (i=0; i<nMaxStats; i++)
        {
            j = maxMassBalErrs[i].index;
            if ( j < 0 ) continue;
            Frpt.contents += `\n  Node "+Node[j].ID+" (${maxMassBalErrs[i].value.toFixed(2)}%%)`
        }
        WRITE("");
    }

    if ( CourantFactor == 0.0 ) return;
    WRITE("");
    WRITE("***************************");
    WRITE("Time-Step Critical Elements");
    WRITE("***************************");
    k = 0;
    for (i=0; i<nMaxStats; i++)
    {
        j = maxCourantCrit[i].index;
        if ( j < 0 ) continue;
        k++;
        if ( maxCourantCrit[i].objType == NODE )
             Frpt.contents += "\n  Node " + Node[j].ID;
        else Frpt.contents += "\n  Link " + Link[j].ID;
        Frpt.contents += ` (${maxCourantCrit[i].value.toFixed(2)}%%)`
    }
    if ( k == 0 ) Frpt.contents += "\n  None";
    WRITE("");
}

//=============================================================================
// TMaxStats flowTurns[], 
// int nMaxStats
function report_writeMaxFlowTurns(flowTurns, nMaxStats)
//
//  Input:   flowTurns[] = links with highest number of flow turns
//           nMaxStats = number of links in flowTurns[]
//  Output:  none
//  Purpose: lists links with highest number of flow turns (i.e., fraction
//           of time periods where the flow is higher (or lower) than the
//           flows in the previous and following periods).
//
{
    let i, j;

    if ( Nobjects[LINK] == 0 ) return;
    WRITE("");
    WRITE("********************************");
    WRITE("Highest Flow Instability Indexes");
    WRITE("********************************");
    if ( nMaxStats <= 0 || flowTurns[0].index <= 0 )
        Frpt.contents += "\n  All links are stable.";
    else
    {
        for (i=0; i<nMaxStats; i++)
        {
            j = flowTurns[i].index;
            if ( j < 0 ) continue;
            Frpt.contents += "\n  Link "+Link[j].ID+` (${flowTurns[i].value.toFixed(0)}%.0f)`
        }
    }
    WRITE("");
}

//=============================================================================
// TSysStats* sysStats
function report_writeSysStats(sysStats)
//
//  Input:   sysStats = simulation statistics for overall system
//  Output:  none
//  Purpose: writes simulation statistics for overall system to report file.
//
// ${sysStats.minTimeStep.toFixed(2).padStart(7, ' ')}
{
    let x;
    let eventStepCount;  // Routing steps taken during reporting period   //(5.1.015)

    eventStepCount = ReportStepCount - sysStats.steadyStateCount;           //(5.1.015)
    if ( Nobjects[LINK] == 0 || TotalStepCount == 0
        || eventStepCount == 0.0 ) return; 
    WRITE("");
    WRITE("*************************");
    WRITE("Routing Time Step Summary");
    WRITE("*************************");
    Frpt.contents += 
        `\n  Minimum Time Step           :  ${sysStats.minTimeStep.toFixed(2).padStart(7, ' ')} sec`
    Frpt.contents += 
        `\n  Average Time Step           :  ${(sysStats.avgTimeStep / eventStepCount).toFixed(2).padStart(7, ' ')} sec`
    Frpt.contents += 
        `\n  Maximum Time Step           :  ${sysStats.maxTimeStep.toFixed(2).padStart(7, ' ')} sec`
    x = (1.0 - sysStats.avgTimeStep * 1000.0 / NewRoutingTime) * 100.0;
    Frpt.contents += 
        `\n  Percent in Steady State     :  ${MIN(x, 100.0).toFixed(2).padStart(7, ' ')}`;
    Frpt.contents += 
        `\n  Average Iterations per Step :  ${(sysStats.avgStepCount / eventStepCount).toFixed(2).padStart(7, ' ')}`
    Frpt.contents += 
        `\n  Percent Not Converging      :  ${(100.0 * NonConvergeCount / eventStepCount).toFixed(2).padStart(7, ' ')}`

    // --- write grouped frequency table of variable routing time steps        //(5.1.015)
    if (RouteModel == DW && CourantFactor > 0.0)                               //
        report_RouteStepFreq(sysStats);                                        //
    WRITE("");
}

//=============================================================================
// TSysStats* sysStats
////  New function added to release 5.1.015.  ////                             //(5.1.015)
function report_RouteStepFreq(sysStats)
//
//  Input:   sysStats = simulation statistics for overall system
//  Output:  none
//  Purpose: writes grouped frequency table of routing time steps to report file.
//
{
    let totalSteps = 0.0;
    let    i;

    for (i = 1; i < TIMELEVELS; i++)
        totalSteps += sysStats.timeStepCounts[i];
    Frpt.contents += 
        "\n  Time Step Frequencies       :";
    for (i = 1; i < TIMELEVELS; i++){
        let val1 = sysStats.timeStepIntervals[i-1].toFixed(3).padStart(6, ' ')
        let val2 = sysStats.timeStepIntervals[i].toFixed(3).padStart(6, ' ')
        let val3 = (100.0 * (sysStats.timeStepCounts[i]) / totalSteps).toFixed(2).padStart(7, ' ')
        Frpt.contents += 
            `\n     ${val1} - ${val2} sec      :  ${val3} %%`
    }
}


//=============================================================================
//      SIMULATION RESULTS REPORTING
//=============================================================================

function report_writeReport()
//
//  Input:   none
//  Output:  none
//  Purpose: writes simulation results to report file.
//
{
    if ( ErrorCode ) return;
    if ( Nperiods == 0 ) return;
    if ( RptFlags.subcatchments != NONE
         && ( IgnoreRainfall == FALSE ||
              IgnoreSnowmelt == FALSE ||
              IgnoreGwater == FALSE)
       ) report_Subcatchments();

    if ( IgnoreRouting == TRUE && IgnoreQuality == TRUE ) return;
    if ( RptFlags.nodes != NONE ) report_Nodes();
    if ( RptFlags.links != NONE ) report_Links();
}

//=============================================================================

function report_Subcatchments()
//
//  Input:   none
//  Output:  none
//  Purpose: writes results for selected subcatchments to report file.
//
{
    let      j, p, k;
    let      period;
    let days;
    let     theDate;
    let     theTime;
    let      hasSnowmelt = (Nobjects[SNOWMELT] > 0 && !IgnoreSnowmelt);
    let      hasGwater   = (Nobjects[AQUIFER] > 0  && !IgnoreGwater);
    let      hasQuality  = (Nobjects[POLLUT] > 0 && !IgnoreQuality);

    if ( Nobjects[SUBCATCH] == 0 ) return;
    WRITE("");
    WRITE("********************");
    WRITE("Subcatchment Results");
    WRITE("********************");
    k = 0;
    for (j = 0; j < Nobjects[SUBCATCH]; j++)
    {
        if ( Subcatch[j].rptFlag == TRUE )
        {
            report_SubcatchHeader(Subcatch[j].ID);
            for ( period = 1; period <= Nperiods; period++ )
            {
                output_readDateTime(period, days);
                theDate = datetime_dateToStr(days, theDate);
                theTime = datetime_timeToStr(days, theTime);
                output_readSubcatchResults(period, k);

                let val1 = theDate.padStart(11, ' ')
                let val2 = theTime.padStart(8, ' ')
                let val3 = SubcatchResults[SUBCATCH_RAINFALL].toFixed(3).padStart(10, ' ')
                let val4 = (SubcatchResults[SUBCATCH_EVAP]/24.0 + SubcatchResults[SUBCATCH_INFIL]).toFixed(3).padStart(10, ' ')
                let val5 = SubcatchResults[SUBCATCH_RUNOFF].toFixed(4).padStart(10, ' ')
                Frpt.contents += `\n  ${val1} ${val2} ${val3}${val4}${val5}`
                if ( hasSnowmelt )
                    Frpt.contents += `  ${SubcatchResults[SUBCATCH_SNOWDEPTH].toFixed(3).padStart(10, ' ')}`
                        
                if ( hasGwater )
                    Frpt.contents += `${SubcatchResults[SUBCATCH_GW_ELEV].toFixed(3).padStart(10, ' ')}${SubcatchResults[SUBCATCH_GW_FLOW].toFixed(4).padStart(10, ' ')}`
                if ( hasQuality )
                    for (p = 0; p < Nobjects[POLLUT]; p++)
                        Frpt.contents += SubcatchResults[SUBCATCH_WASHOFF+p].toFixed(3).padStart(10, ' ')
            }
            WRITE("");
            k++;
        }
    }
}

//=============================================================================
// char *id
function  report_SubcatchHeader(id)
//
//  Input:   id = subcatchment ID name
//  Output:  none
//  Purpose: writes table headings for subcatchment results to report file.
//
{
    let i;
    let hasSnowmelt = (Nobjects[SNOWMELT] > 0 && !IgnoreSnowmelt);
    let hasGwater   = (Nobjects[AQUIFER] > 0  && !IgnoreGwater);
    let hasQuality  = (Nobjects[POLLUT] > 0 && !IgnoreQuality);

    // --- print top border of header
    WRITE("");
    Frpt.contents += "\n  <<< Subcatchment "+id+" >>>"
    WRITE(LINE_51);
    if ( hasSnowmelt  > 0 ) Frpt.contents += LINE_12;
    if ( hasGwater )
    {
        Frpt.contents += LINE_10;
        Frpt.contents += LINE_10;
    }
    if ( hasQuality )
    {
        for (i = 0; i < Nobjects[POLLUT]; i++) Frpt.contents += LINE_10;
    }

    // --- print first line of column headings
    Frpt.contents += 
    "\n  Date        Time        Precip.    Losses    Runoff";
    if ( hasSnowmelt ) Frpt.contents += "  Snow Depth";
    if ( hasGwater   ) Frpt.contents += "  GW Elev.   GW Flow";
    if ( hasQuality ) for (i = 0; i < Nobjects[POLLUT]; i++)
        Frpt.contents += Pollut[i].ID.padStart(10, ' ');

    // --- print second line of column headings
    if ( UnitSystem == US ) Frpt.contents += 
    `\n                            in/hr     in/hr ${FlowUnitWords[FlowUnits].padStart(9, ' ')}`
    else Frpt.contents += 
    `\n                            mm/hr     mm/hr ${FlowUnitWords[FlowUnits].padStart(9, ' ')}`
    if ( hasSnowmelt )
    {
        if ( UnitSystem == US ) Frpt.contents += "      inches";
        else                    Frpt.contents += "     mmeters";
    }
    if ( hasGwater )
    {
        if ( UnitSystem == US )
            Frpt.contents += `      feet ${FlowUnitWords[FlowUnits].padStart(9, ' ')}`
        else
            Frpt.contents += `    meters ${FlowUnitWords[FlowUnits].padStart(9, ' ')}`
    }
    if ( hasQuality ) for (i = 0; i < Nobjects[POLLUT]; i++)
        Frpt.contents += QualUnitsWords[Pollut[i].units].padStart(10, ' ')

    // --- print lower border of header
    WRITE(LINE_51);
    if ( hasSnowmelt ) Frpt.contents += LINE_12;
    if ( hasGwater )
    {
        Frpt.contents += LINE_10;
        Frpt.contents += LINE_10;
    }
    if ( hasQuality ) for (i = 0; i < Nobjects[POLLUT]; i++)
        Frpt.contents += LINE_10;
}

//=============================================================================

function report_Nodes()
//
//  Input:   none
//  Output:  none
//  Purpose: writes results for selected nodes to report file.
//
{
    let      j, p, k;
    let      period;
    let days;
    let     theDate;
    let     theTime;

    if ( Nobjects[NODE] == 0 ) return;
    WRITE("");
    WRITE("************");
    WRITE("Node Results");
    WRITE("************");
    k = 0;
    for (j = 0; j < Nobjects[NODE]; j++)
    {
        if ( Node[j].rptFlag == TRUE )
        {
            report_NodeHeader(Node[j].ID);
            for ( period = 1; period <= Nperiods; period++ )
            {
                output_readDateTime(period, days);
                theDate = datetime_dateToStr(days, theDate);
                theTime = datetime_timeToStr(days, theTime);
                output_readNodeResults(period, k);

                let val1 = theDate.padStart(11, ' ')
                let val2 = theTime.padStart(8, ' ')
                let val3 = NodeResults[NODE_INFLOW].toFixed(3).padStart(9, ' ')
                let val4 = NodeResults[NODE_OVERFLOW].toFixed(3).padStart(9, ' ')
                let val5 = NodeResults[NODE_DEPTH].toFixed(3).padStart(9, ' ')
                let val6 = NodeResults[NODE_HEAD].toFixed(3).padStart(9, ' ')
                Frpt.contents += `\n  ${val1} ${val2}  ${val3} ${val4} ${val5} ${val6}`
                if ( !IgnoreQuality ) for (p = 0; p < Nobjects[POLLUT]; p++)
                    Frpt.contents += NodeResults[NODE_QUAL + p].toFixed(3).padStart(9, ' ')
            }
            WRITE("");
            k++;
        }
    }
}

//=============================================================================
// char *id
function  report_NodeHeader(id)
//
//  Input:   id = node ID name
//  Output:  none
//  Purpose: writes table headings for node results to report file.
//
{
    let i;
    let lengthUnits;
    WRITE("");
    Frpt.contents += "\n  <<< Node "+id+" >>>"
    WRITE(LINE_64);
    for (i = 0; i < Nobjects[POLLUT]; i++) Frpt.contents += LINE_10;

    Frpt.contents += 
    "\n                           Inflow  Flooding     Depth      Head";
    if ( !IgnoreQuality ) for (i = 0; i < Nobjects[POLLUT]; i++)
        Frpt.contents += Pollut[i].ID.padStart(10, ' ')
    if ( UnitSystem == US) lengthUnits = "feet";
    else lengthUnits = "meters";

    let val1 = FlowUnitWords[FlowUnits].padStart(9, ' ')
    let val2 = FlowUnitWords[FlowUnits].padStart(9, ' ')
    let val3 = lengthUnits.padStart(9, ' ')
    let val4 = lengthUnits.padStart(9, ' ')
    Frpt.contents += 
    `\n  Date        Time      ${val1} ${val2} ${val3} ${val4}`
    if ( !IgnoreQuality ) for (i = 0; i < Nobjects[POLLUT]; i++)
        Frpt.contents += QualUnitsWords[Pollut[i].units].padStart(10, ' ')

    WRITE(LINE_64);
    if ( !IgnoreQuality )
        for (i = 0; i < Nobjects[POLLUT]; i++) Frpt.contents += LINE_10;
}

//=============================================================================

function report_Links()
//
//  Input:   none
//  Output:  none
//  Purpose: writes results for selected links to report file.
//
{
    let      j, p, k;
    let      period;
    let days;
    let     theDate;
    let     theTime;

    if ( Nobjects[LINK] == 0 ) return;
    WRITE("");
    WRITE("************");
    WRITE("Link Results");
    WRITE("************");
    k = 0;
    for (j = 0; j < Nobjects[LINK]; j++)
    {
        if ( Link[j].rptFlag == TRUE )
        {
            report_LinkHeader(Link[j].ID);
            for ( period = 1; period <= Nperiods; period++ )
            {
                output_readDateTime(period, days);
                theDate = datetime_dateToStr(days, theDate);
                theTime = datetime_timeToStr(days, theTime);
                output_readLinkResults(period, k);

                let val1 = theDate.padStart(11, ' ')
                let val2 = theTime.padStart(8, ' ')
                let val3 = LinkResults[LINK_FLOW].toFixed(3).padStart(9, ' ')
                let val4 = LinkResults[LINK_VELOCITY].toFixed(3).padStart(9, ' ')
                let val5 = LinkResults[LINK_DEPTH].toFixed(3).padStart(9, ' ')
                let val6 = LinkResults[LINK_CAPACITY].toFixed(3).padStart(9, ' ')
                Frpt.contents += `\n  ${val1} ${val2}  ${val3} ${val4} ${val5} ${val6}`
                if ( !IgnoreQuality ) for (p = 0; p < Nobjects[POLLUT]; p++)
                    Frpt.contents += " " + LinkResults[LINK_QUAL + p].toFixed(3).padStart(9, ' ');
            }
            WRITE("");
            k++;
        }
    }
}

//=============================================================================
// char *id
function  report_LinkHeader(id)
//
//  Input:   id = link ID name
//  Output:  none
//  Purpose: writes table headings for link results to report file.
//
{
    let i;
    WRITE("");
    Frpt.contents += "\n  <<< Link "+id+" >>>";
    WRITE(LINE_64);
    for (i = 0; i < Nobjects[POLLUT]; i++) Frpt.contents += LINE_10;

    Frpt.contents += 
    "\n                             Flow  Velocity     Depth  Capacity/";
    if ( !IgnoreQuality ) for (i = 0; i < Nobjects[POLLUT]; i++)
        Frpt.contents += Pollut[i].ID.padStart(10, ' ');

    if ( UnitSystem == US )
        Frpt.contents += 
        `\n  Date        Time     ${FlowUnitWords[FlowUnits].padStart(10, ' ')}    ft/sec      feet   Setting `;
    else
        Frpt.contents += 
        `\n  Date        Time     ${FlowUnitWords[FlowUnits].padStart(10, ' ')}     m/sec    meters   Setting `;

    if ( !IgnoreQuality ) for (i = 0; i < Nobjects[POLLUT]; i++)
        Frpt.contents += " " + QualUnitsWords[Pollut[i].units].padStart(9, ' ');

    WRITE(LINE_64);
    if ( !IgnoreQuality )
        for (i = 0; i < Nobjects[POLLUT]; i++) Frpt.contents += LINE_10;
}


//=============================================================================
//      ERROR REPORTING
//=============================================================================
// int code, 
// char* s
function report_writeErrorMsg(code, s)
//
//  Input:   code = error code
//           s = error message text
//  Output:  none
//  Purpose: writes error message to report file.
//
{
    if ( Frpt.contents )
    {
        WRITE("");
        Frpt.contents += error_getMsg(code) + s;
    }
    ErrorCode = code;

    // --- save message to ErrorMsg if it's not for a line of input data
    if ( ErrorCode <= ERR_INPUT || ErrorCode >= ERR_FILE_NAME )
    {                                                
        ErrorMsg = error_getMsg(ErrorCode) + s;
    }
}

//=============================================================================

function report_writeErrorCode()
//
//  Input:   none
//  Output:  none
//  Purpose: writes error message to report file.
//
{
    if ( Frpt.contents )
    {
        if ( (ErrorCode >= ERR_MEMORY && ErrorCode <= ERR_TIMESTEP)
        ||   (ErrorCode >= ERR_FILE_NAME && ErrorCode <= ERR_OUT_FILE)
        ||   (ErrorCode == ERR_SYSTEM) )
            Frpt.contents += error_getMsg(ErrorCode);                 //(5.1.013)
    }
}

//=============================================================================
// int k, int sect, char* line, long lineCount
function report_writeInputErrorMsg(k, sect, line, lineCount)
//
//  Input:   k = error code
//           sect = number of input data section where error occurred
//           line = line of data containing the error
//           lineCount = line number of data file containing the error
//  Output:  none
//  Purpose: writes input error message to report file.
//
{
    if ( Frpt.contents )
    {
        report_writeErrorMsg(k, ErrString);
        if ( sect < 0 ) Frpt.contents += lineCount.toString();
        else            Frpt.contents += lineCount.toString() + SectWords[sect];
        Frpt.contents += "\n  " + line;
    }
}

//=============================================================================
// char* msg, char* id
function report_writeWarningMsg(msg, id)
//
//  Input:   msg = text of warning message
//           id = ID name of object that message refers to
//  Output:  none
//  Purpose: writes a warning message to the report file.
//
{
    Frpt.contents += "\n  "+msg+" "+ id;
    Warnings++;
}

//=============================================================================
// int code, TTable *tseries
function report_writeTSeriesErrorMsg(code, tseries)
//
//  Input:   tseries = pointer to a time series
//  Output:  none
//  Purpose: writes the date where a time series' data is out of order.
//
{
    let     theDate;
    let     theTime;
    let x;

    if (code == ERR_CURVE_SEQUENCE)
    {
        x = tseries.x2;
        theDate = datetime_dateToStr(x, theDate);
        theTime = datetime_timeToStr(x, theTime);
        report_writeErrorMsg(ERR_TIMESERIES_SEQUENCE, tseries.ID);
        Frpt.contents += " at "+theDate+" "+theTime+"."
    }
    else report_writeErrorMsg(code, tseries.ID);
}

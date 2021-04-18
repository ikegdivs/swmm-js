//-----------------------------------------------------------------------------
//   statsrpt.c
//
//   Project:  EPA SWMM5
//   Version:  5.1
//   Date:     03/20/14 (Build 5.1.001)
//             09/15/14 (Build 5.1.007)
//             03/19/15 (Build 5.1.008)
//             04/30/15 (Build 5.1.009)
//             08/01/16 (Build 5.1.011)
//             05/10/18 (Build 5.1.013)
//             04/01/20 (Build 5.1.015)
//   Author:   L. Rossman
//
//   Report writing functions for summary statistics.
//
//   Build 5.1.008:
//   - New Groundwater Summary table added.
//   - Reported Max. Depth added to Node Depth Summary table.
//
//   Build 5.1.009:
//   - Units on column heading in Node Inflow Summary table fixed.
//
//   Build 5.1.011:
//   - Redundant units conversion on max. reported node depth removed.
//   - Node Surcharge table only produced for dynamic wave routing.
//
//   Build 5.1.013:
//   - Pervious and impervious runoff added to Subcatchment Runoff Summary.
//
//   Build 5.1.015:
//   - Fixes bug in summary statistics when Report Start date > Start Date.
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
//  Imported variables
//-----------------------------------------------------------------------------
/*extern TSubcatchStats* SubcatchStats;          // defined in STATS.C
extern TNodeStats*     NodeStats;
extern TLinkStats*     LinkStats;
extern TStorageStats*  StorageStats;
extern TOutfallStats*  OutfallStats;
extern TPumpStats*     PumpStats;
extern double          MaxOutfallFlow;
extern double          MaxRunoffFlow;
extern double*         NodeInflow;             // defined in MASSBAL.C
extern double*         NodeOutflow;            // defined in massbal.c
*/


function WRITE(x) {report_writeLine((x))}

var FlowFmt = '';
var Vcf;

// string formatting function
// can take in a number or a string
// returns a string with a ' ' padding
function formatFloat(num, padding, floatingPoints){
    return num.toFixed(floatingPoints).padStart(padding);
}

// string formatting function
// replaces FlowFmt constant
function flowFmt(num){
    // --- set number of decimal places for reporting flow values
    if ( FlowUnits == MGD || FlowUnits == CMS ) {
        return num.toFixed(3).padStart(9);
    }
    else {
        return num.toFixed(2).padStart(9);
    }
}

//=============================================================================

function statsrpt_writeReport()
//
//  Input:   none
//  Output:  none
//  Purpose: reports simulation summary statistics.
//
{
    // --- set number of decimal places for reporting flow values
    if ( FlowUnits == MGD || FlowUnits == CMS ) FlowFmt = "%9.3f"
    else FlowFmt = "%9.2f";

    // --- volume conversion factor from ft3 to Mgal or Mliters
    if (UnitSystem == US) Vcf = 7.48 / 1.0e6;
    else                  Vcf = 28.317 / 1.0e6;

    // --- report summary results for subcatchment runoff 
    if ( Nobjects[SUBCATCH] > 0 )
    {
        if ( !IgnoreRainfall ||
             (Nobjects[SNOWMELT] > 0 && !IgnoreSnowmelt) ||
             (Nobjects[AQUIFER] > 0  && !IgnoreGwater) )
        {
            writeSubcatchRunoff();
            lid_writeWaterBalance();
            if ( !IgnoreGwater ) writeGroundwater();
            if ( Nobjects[POLLUT] > 0 && !IgnoreQuality) writeSubcatchLoads();
        }
    }

    // --- report summary results for flow routing
    if ( Nobjects[LINK] > 0 && !IgnoreRouting )
    {
        writeNodeDepths();
        writeNodeFlows();
        if ( RouteModel == DW ) writeNodeSurcharge();
        writeNodeFlooding();
        writeStorageVolumes();
        writeOutfallLoads();
        writeLinkFlows();
        writeFlowClass();
        writeLinkSurcharge();
        writePumpFlows();
        if ( Nobjects[POLLUT] > 0 && !IgnoreQuality) writeLinkLoads();
    }
}

//=============================================================================

function writeSubcatchRunoff()
{
    let    j;
    let a, x, r;

    if ( Nobjects[SUBCATCH] == 0 ) return;
    WRITE("");
    WRITE("***************************");
    WRITE("Subcatchment Runoff Summary");
    WRITE("***************************");
    WRITE("");
    Frpt.contents += 

////////  Segment below modified for release 5.1.013.  /////////

`\n  ------------------------------------------------------------------------------------------------------------------------------`+
`\n                            Total      Total      Total      Total     Imperv       Perv      Total       Total     Peak  Runoff`+
`\n                           Precip      Runon       Evap      Infil     Runoff     Runoff     Runoff      Runoff   Runoff   Coeff`;
    if ( UnitSystem == US ) Frpt.contents +=
`\n  Subcatchment                 in         in         in         in         in         in         in    ${VolUnitsWords[UnitSystem].padStart(8, ' ')}      ${FlowUnitWords[FlowUnits].padStart(3, ' ')}`
    else Frpt.contents +=
`\n  Subcatchment                 mm         mm         mm         mm         mm         mm         mm    ${VolUnitsWords[UnitSystem].padStart(8, ' ')}      ${FlowUnitWords[FlowUnits].padStart(3, ' ')}`
    Frpt.contents +=
`\n  ------------------------------------------------------------------------------------------------------------------------------`;

/////////////////////////////////////////////////////////////////

    for ( j = 0; j < Nobjects[SUBCATCH]; j++ )
    {
        a = Subcatch[j].area;
        if ( a == 0.0 ) continue;
        Frpt.contents += `\n  ${Subcatch[j].ID.padStart(20, ' ')}`
        
        x = SubcatchStats[j].precip * UCF(RAINDEPTH);
        Frpt.contents += ` ${(x/a).toFixed(2).padStart(10, ' ')}`
        
        x = SubcatchStats[j].runon * UCF(RAINDEPTH);
        Frpt.contents += ` ${(x/a).toFixed(2).padStart(10, ' ')}`
        
        x = SubcatchStats[j].evap * UCF(RAINDEPTH);
        Frpt.contents += ` ${(x/a).toFixed(2).padStart(10, ' ')}`
        
        x = SubcatchStats[j].infil * UCF(RAINDEPTH); 
        Frpt.contents += ` ${(x/a).toFixed(2).padStart(10, ' ')}`
    
        x = SubcatchStats[j].impervRunoff * UCF(RAINDEPTH); 
        Frpt.contents += ` ${(x/a).toFixed(2).padStart(10, ' ')}`                   //
        
        x = SubcatchStats[j].pervRunoff * UCF(RAINDEPTH); 
        Frpt.contents += ` ${(x/a).toFixed(2).padStart(10, ' ')}`                    //
        
        x = SubcatchStats[j].runoff * UCF(RAINDEPTH);
        Frpt.contents += ` ${(x/a).toFixed(2).padStart(10, ' ')}`
        
        x = SubcatchStats[j].runoff * Vcf;
        Frpt.contents += ` ${(x).toFixed(2).padStart(12, ' ')}`
        
        x = SubcatchStats[j].maxFlow * UCF(FLOW);
        Frpt.contents += ` ${(x).toFixed(2).padStart(8, ' ')}`
        
        r = SubcatchStats[j].precip + SubcatchStats[j].runon;
        if ( r > 0.0 ) r = SubcatchStats[j].runoff / r;
        Frpt.contents += ` ${(r).toFixed(3).padStart(8, ' ')}`
    }
    WRITE("");
}

//=============================================================================
// void
function    writeGroundwater()
{
    let i, j;
    let count = 0;
    let totalSeconds = NewRunoffTime / 1000.;
    let x =  new Array(9);

    if ( Nobjects[SUBCATCH] == 0 ) return;
    for ( j = 0; j < Nobjects[SUBCATCH]; j++ )
    {
        if ( Subcatch[j].groundwater != NULL ) count++;
    }
    if ( count == 0 ) return;

    WRITE("");
    WRITE("*******************");
    WRITE("Groundwater Summary");
    WRITE("*******************");
    WRITE("");
    Frpt.contents +=

`\n  -----------------------------------------------------------------------------------------------------`+
`\n                                            Total    Total  Maximum  Average  Average    Final    Final`+
`\n                          Total    Total    Lower  Lateral  Lateral    Upper    Water    Upper    Water`+
`\n                          Infil     Evap  Seepage  Outflow  Outflow   Moist.    Table   Moist.    Table`;
    if ( UnitSystem == US ) Frpt.contents +=
`\n  Subcatchment               in       in       in       in      ${FlowUnitWords[FlowUnits].padEnd(3, ' ')}                ft                ft`
    else Frpt.contents +=
`\n  Subcatchment               mm       mm       mm       mm      ${FlowUnitWords[FlowUnits].padEnd(3, ' ')}                 m                 m`
    Frpt.contents +=
`\n  -----------------------------------------------------------------------------------------------------`;

    for ( j = 0; j < Nobjects[SUBCATCH]; j++ )
    {
        if ( Subcatch[j].area == 0.0 || Subcatch[j].groundwater == NULL ) continue;
        Frpt.contents += `\n  ${Subcatch[j].ID.padStart(20, ' ')}`;
        x[0] = Subcatch[j].groundwater.stats.infil * UCF(RAINDEPTH);
        x[1] = Subcatch[j].groundwater.stats.evap * UCF(RAINDEPTH);
        x[2] = Subcatch[j].groundwater.stats.deepFlow * UCF(RAINDEPTH);
        x[3] = Subcatch[j].groundwater.stats.latFlow * UCF(RAINDEPTH);
        x[4] = Subcatch[j].groundwater.stats.maxFlow * UCF(FLOW) * Subcatch[j].area;
        x[5] = Subcatch[j].groundwater.stats.avgUpperMoist / totalSeconds;
        x[6] = Subcatch[j].groundwater.stats.avgWaterTable * UCF(LENGTH) /
               totalSeconds;
        x[7] = Subcatch[j].groundwater.stats.finalUpperMoist;
        x[8] = Subcatch[j].groundwater.stats.finalWaterTable * UCF(LENGTH);
        for (i = 0; i < 9; i++) Frpt.contents += ` ${( x[i]).toFixed(2).padStart(8, ' ')}`
    }
    WRITE(``);
}

//=============================================================================

function writeSubcatchLoads()
{
    let i, j, p;
    let x;
    let totals = []; 
    let  units;
    let  subcatchLine = "--------------------";
    let  pollutLine   = "--------------";

    // --- create an array to hold total loads for each pollutant
    //totals = (double *) calloc(Nobjects[POLLUT], sizeof(double));
    totals = new Array(Nobjects[POLLUT]);
    if ( totals )
    {
        // --- print the table headings 
        WRITE(``);
        WRITE("****************************");
        WRITE("Subcatchment Washoff Summary");
        WRITE("****************************");
        WRITE(``);
        Frpt.contents += "\n  " + subcatchLine;
        for (p = 0; p < Nobjects[POLLUT]; p++) Frpt.contents += "%s" + pollutLine;
        Frpt.contents += "\n                      ";
        for (p = 0; p < Nobjects[POLLUT]; p++) Frpt.contents += Pollut[p].ID.padStart(14, ' ');
        Frpt.contents += "\n  Subcatchment        ";
        for (p = 0; p < Nobjects[POLLUT]; p++)
        {
            i = UnitSystem;
            if ( Pollut[p].units == COUNT ) i = 2;
            units = LoadUnitsWords[i]
            Frpt.contents += units.padStart(14, ' ');
            totals[p] = 0.0;
        }
        Frpt.contents += "\n  " + subcatchLine;
        for (p = 0; p < Nobjects[POLLUT]; p++) Frpt.contents +=  pollutLine;

        // --- print the pollutant loadings from each subcatchment
        for ( j = 0; j < Nobjects[SUBCATCH]; j++ )
        {
            Frpt.contents += "\n  " + Subcatch[j].ID.padEnd(20, ' ');
            for (p = 0; p < Nobjects[POLLUT]; p++)
            {
                x = Subcatch[j].totalLoad[p];
                totals[p] += x;
                if ( Pollut[p].units == COUNT ) x = Math.log10(x);
                Frpt.contents +=  x.toFixed(3).padStart(14, ' ')
            }
        }

        // --- print the total loading of each pollutant
        Frpt.contents +=  "\n  " + subcatchLine
        for (p = 0; p < Nobjects[POLLUT]; p++) Frpt.contents +=  pollutLine
        Frpt.contents +=  "\n  System              "
        for (p = 0; p < Nobjects[POLLUT]; p++)
        {
            x = totals[p];
            if ( Pollut[p].units == COUNT ) x = Math.log10(x);
            Frpt.contents +=  x.toFixed(3).padStart(14, ' ')
        }
        //free(totals);
        totals = [];
        WRITE("");
    }
}

//=============================================================================

function writeNodeDepths()
//
//  Input:   none
//  Output:  none
//  Purpose: writes simulation statistics for nodes to report file.
//
{
    let j, days, hrs, mins;
    let returnObj;
    if ( Nobjects[LINK] == 0 ) return;

    WRITE(``);
    WRITE(`******************`);
    WRITE(`Node Depth Summary`);
    WRITE(`******************`);
    WRITE(``);

    Frpt.contents +=  
`\n  ---------------------------------------------------------------------------------`+
`\n                                 Average  Maximum  Maximum  Time of Max    Reported`+
`\n                                   Depth    Depth      HGL   Occurrence   Max Depth`;
    if ( UnitSystem == US ) Frpt.contents +=  
`\n  Node                 Type         Feet     Feet     Feet  days hr:min        Feet`;
    else Frpt.contents +=  
`\n  Node                 Type       Meters   Meters   Meters  days hr:min      Meters`;
    Frpt.contents +=  
`\n  ---------------------------------------------------------------------------------`;

    for ( j = 0; j < Nobjects[NODE]; j++ )
    {
        Frpt.contents +=  `\n  `+  Node[j].ID.padEnd(20, ' ')
        Frpt.contents +=  ` %-9s `, NodeTypeWords[Node[j].type].padEnd(9, ' ')

        ////////////////////////////////////////
        returnObj = {days: days, hrs: hrs, mins: mins}
        getElapsedTime(NodeStats[j].maxDepthDate, returnObj)
        days = returnObj.days
        hrs = returnObj.hrs
        mins = returnObj.mins
        ////////////////////////////////////////
        //getElapsedTime(NodeStats[j].maxDepthDate, &days, &hrs, &mins);

        val1 = (NodeStats[j].avgDepth / ReportStepCount * UCF(LENGTH)).toFixed(2).padStart(7, ' ')              //(5.1.015)
        val2 = (NodeStats[j].maxDepth * UCF(LENGTH)).toFixed(2).padStart(7, ' ')
        val3 = ((NodeStats[j].maxDepth + Node[j].invertElev) * UCF(LENGTH)).toFixed(2).padStart(7, ' ')
        val4 = (days.toString()).padStart(4, ' ')
        val5 = (hrs.toString()).padStart(2, '0')
        val6 = (mins.toString()).padStart(2, '0')
        val7 = (NodeStats[j].maxRptDepth).toFixed(2).padStart(10, ' ')
        Frpt.contents +=  `${val1}  ${val2}  ${val3}  ${val4}  ${val5}:${val6}  ${val7}`
    }
    WRITE(``);
}

//=============================================================================

function writeNodeFlows()
//
//  Input:   none
//  Output:  none
//  Purpose: writes flow statistics for nodes to report file.
//
{
    let j;
    let days1, hrs1, mins1;

    // return object
    let returnObj;

    WRITE(``);
    WRITE(`*******************`);
    WRITE(`Node Inflow Summary`);
    WRITE(`*******************`);
    WRITE(``);

    let val1 = FlowUnitWords[FlowUnits].padStart(3, ' ')
    let val2 = FlowUnitWords[FlowUnits].padStart(4, ' ')
    let val3 = VolUnitsWords[UnitSystem].padStart(8, ' ')
    let val4 = VolUnitsWords[UnitSystem].padStart(8, ' ')
    Frpt.contents +=  
`\n  -------------------------------------------------------------------------------------------------`+
`\n                                  Maximum  Maximum                  Lateral       Total        Flow`+
`\n                                  Lateral    Total  Time of Max      Inflow      Inflow     Balance`+
`\n                                   Inflow   Inflow   Occurrence      Volume      Volume       Error`+
`\n  Node                 Type           ${val1}      ${val2}  days hr:min    ${val3}s    ${val4}     Percent`

    Frpt.contents +=  
`\n  -------------------------------------------------------------------------------------------------`

    for ( j = 0; j < Nobjects[NODE]; j++ )
    {
        Frpt.contents += `\n  ` + Node[j].ID.padEnd(20, ' ')
        Frpt.contents += ` ` + NodeTypeWords[Node[j].type].padEnd(9);
        ////////////////////////////////////////
        returnObj = {days: days1, hrs: hrs1, mins: mins1}
        getElapsedTime(NodeStats[j].maxInflowDate, returnObj)
        days1 = returnObj.days
        hrs1 = returnObj.hrs
        mins1 = returnObj.mins
        ////////////////////////////////////////
        //getElapsedTime(NodeStats[j].maxInflowDate, &days1, &hrs1, &mins1);
        Frpt.contents += flowFmt(NodeStats[j].maxLatFlow * UCF(FLOW));
        Frpt.contents += flowFmt(NodeStats[j].maxInflow * UCF(FLOW));
        
        Frpt.contents += `  ${days1.toString().padStart(4, ' ')}  ${hrs1.toString().padStart(2, '0')}:${mins1.toString().padStart(2, '0')}`;
        Frpt.contents += (NodeStats[j].totLatFlow * Vcf).toExponential(8).padStart(12);
        Frpt.contents += (NodeInflow[j] * Vcf).toExponential(8).padStart(12);
        if ( Math.abs(NodeOutflow[j]) < 1.0 )
            Frpt.contents += ((NodeInflow[j]-NodeOutflow[j])*Vcf*1.0e6).toFixed(3).padStart(12, ' ') + ` ` +
                VolUnitsWords2[UnitSystem].padStart(3, ' ')
        else
            Frpt.contents += ((NodeInflow[j]-NodeOutflow[j]) /
                                          NodeOutflow[j]*100.).toFixed(3).padStart(12, ' ') 
    }
    WRITE(``);
}

//=============================================================================

function writeNodeSurcharge()
{
    let    j, n = 0;
    let t, d1, d2;

    WRITE(``);
    WRITE(`**********************`);
    WRITE(`Node Surcharge Summary`);
    WRITE(`**********************`);
    WRITE(``);

    for ( j = 0; j < Nobjects[NODE]; j++ )
    {
        if ( Node[j].type == OUTFALL ) continue;
        if ( NodeStats[j].timeSurcharged == 0.0 ) continue;
        t = MAX(0.01, (NodeStats[j].timeSurcharged / 3600.0));
        if ( n == 0 )
        {
            WRITE(`Surcharging occurs when water rises above the top of the highest conduit.`);
            Frpt.contents += 
`\n  ---------------------------------------------------------------------`+
`\n                                               Max. Height   Min. Depth`+
`\n                                   Hours       Above Crown    Below Rim`;
    if ( UnitSystem == US ) Frpt.contents += 
`\n  Node                 Type      Surcharged           Feet         Feet`;
    else Frpt.contents += 
`\n  Node                 Type      Surcharged         Meters       Meters`;
    Frpt.contents += 
`\n  ---------------------------------------------------------------------`;
            n = 1;
        }
        Frpt.contents += `\n  ` + Node[j].ID.padEnd(20, ' ');
        Frpt.contents += ` %-9s`, NodeTypeWords[Node[j].type].padEnd(9, ' ');
        d1 = NodeStats[j].maxDepth + Node[j].invertElev - Node[j].crownElev;
        if ( d1 < 0.0 ) d1 = 0.0;
        d2 = Node[j].fullDepth - NodeStats[j].maxDepth;
        if ( d2 < 0.0 ) d2 = 0.0;
        Frpt.contents += `  ${t.toFixed(2).padStart(9, ' ')}      ${(d1*UCF(LENGTH)).toFixed(3).padStart(9, ' ')}    ${(d2*UCF(LENGTH)).toFixed(3).padStart(9, ' ')}`
    }
    if ( n == 0 ) WRITE(`No nodes were surcharged.`);
    WRITE(``);
}

//=============================================================================

function writeNodeFlooding()
{
    let    j, n = 0;
    let    days, hrs, mins;
    let t;

    // return object for write functions
    let returnObj;

    WRITE(``);
    WRITE(`*********************`);
    WRITE(`Node Flooding Summary`);
    WRITE(`*********************`);
    WRITE(``);

    for ( j = 0; j < Nobjects[NODE]; j++ )
    {
        if ( Node[j].type == OUTFALL ) continue;
        if ( NodeStats[j].timeFlooded == 0.0 ) continue;
        t = Math.max(0.01, (NodeStats[j].timeFlooded / 3600.0));

        if ( n == 0 )
        {
            WRITE(`Flooding refers to all water that overflows a node, whether it ponds or not.`);
            Frpt.contents += 
`\n  --------------------------------------------------------------------------`+
`\n                                                             Total   Maximum`+
`\n                                 Maximum   Time of Max       Flood    Ponded`+
`\n                        Hours       Rate    Occurrence      Volume`
            if ( RouteModel == DW ) Frpt.contents += `     Depth`;
            else                    Frpt.contents += `    Volume`;
            Frpt.contents += 
`\n  Node                 Flooded       ${FlowUnitWords[FlowUnits].padStart(3, ' ')}   days hr:min    ${VolUnitsWords[UnitSystem].padStart(8, ' ')}`
            if ( RouteModel == DW )      Frpt.contents +=  `    ${PondingUnitsWords[UnitSystem].padStart(6, ' ')}`
            else if ( UnitSystem == US ) Frpt.contents +=  `  1000 ft3`;
            else                         Frpt.contents +=  `   1000 m3`;
            Frpt.contents += 
`\n  --------------------------------------------------------------------------`;
            n = 1;
        }
        Frpt.contents +=  `\n  `+ Node[j].ID.padEnd(20);
        Frpt.contents +=  ` ${t.toFixed(2).padStart(7, ' ')} `;
        Frpt.contents += flowFmt(NodeStats[j].maxOverflow * UCF(FLOW));

        returnObj = {days: days, hrs: hrs, mins: mins}
        getElapsedTime(NodeStats[j].maxOverflowDate, returnObj)
        days = returnObj.days
        hrs = returnObj.hrs
        mins = returnObj.mins
        //getElapsedTime(NodeStats[j].maxOverflowDate, &days, &hrs, &mins);
        Frpt.contents += `   ${days.padStart(4, ' ')}  ${hrs.padStart(2, '0')}:${mins.padStart(2, '0')}`
        Frpt.contents += (NodeStats[j].volFlooded * Vcf).toFixed(3).padStart(12, ' ');
        if ( RouteModel == DW )
            Frpt.contents += ` ` +
                ((NodeStats[j].maxDepth - Node[j].fullDepth) * UCF(LENGTH)).toFixed(3).padStart(9, ' ')
        else
            Frpt.contents += ` `+ 
                (NodeStats[j].maxPondedVol / 1000.0 * UCF(VOLUME)).toFixed(3).padStart(9, ' ')
    }

    if ( n == 0 ) WRITE(`No nodes were flooded.`);
    WRITE(``);
}

//=============================================================================

function writeStorageVolumes()
//
//  Input:   none
//  Output:  none
//  Purpose: writes simulation statistics for storage units to report file.
//
{
    let    j, k, days, hrs, mins;
    let avgVol, maxVol, pctAvgVol, pctMaxVol;
    let addedVol, pctEvapLoss, pctSeepLoss;

    if ( Nnodes[STORAGE] > 0 )
    {
        WRITE(``);
        WRITE(`**********************`);
        WRITE(`Storage Volume Summary`);
        WRITE(`**********************`);
        WRITE(``);

        Frpt.contents += 
`\n  --------------------------------------------------------------------------------------------------`+
`\n                         Average     Avg  Evap Exfil       Maximum     Max    Time of Max    Maximum`+
`\n                          Volume    Pcnt  Pcnt  Pcnt        Volume    Pcnt     Occurrence    Outflow`
        if ( UnitSystem == US ) Frpt.contents += 
`\n  Storage Unit          1000 ft3    Full  Loss  Loss      1000 ft3    Full    days hr:min        `
        else Frpt.contents += 
`\n  Storage Unit           1000 m3    Full  Loss  Loss       1000 m3    Full    days hr:min        `
        Frpt.contents +=  FlowUnitWords[FlowUnits].padStart(3, ' ')
        Frpt.contents += 
`\n  --------------------------------------------------------------------------------------------------`

        for ( j = 0; j < Nobjects[NODE]; j++ )
        {
            if ( Node[j].type != STORAGE ) continue;
            k = Node[j].subIndex;
            Frpt.contents += `\n  ` + Node[j].ID.padEnd(20, ' ')
            avgVol = StorageStats[k].avgVol / ReportStepCount;         //(5.1.015)
            maxVol = StorageStats[k].maxVol;
            pctMaxVol = 0.0;
            pctAvgVol = 0.0;
            if ( Node[j].fullVolume > 0.0 )
            {
                pctAvgVol = avgVol / Node[j].fullVolume * 100.0;
                pctMaxVol = maxVol / Node[j].fullVolume * 100.0;
            }
            pctEvapLoss = 0.0;
            pctSeepLoss = 0.0;
            addedVol = NodeInflow[j] + StorageStats[k].initVol;
            if ( addedVol > 0.0 )
            {
                pctEvapLoss = StorageStats[k].evapLosses / addedVol * 100.0;
                pctSeepLoss = StorageStats[k].exfilLosses / addedVol * 100.0;
            }

            let val1 = (avgVol*UCF(VOLUME)/1000.0).toFixed(3).padStart(10, ' ')
            let val2 = pctAvgVol.toFixed(0).padStart(4, ' ')
            let val3 = pctEvapLoss.toFixed(0).padStart(4, ' ')
            let val4 = pctSeepLoss.toFixed(0).padStart(4, ' ')
            let val5 = (maxVol*UCF(VOLUME)/1000.0).toFixed(3).padStart(10, ' ')
            let val6 = pctMaxVol.toFixed(0).padStart(4, ' ')
            Frpt.contents += `${val1}    ${val2}  ${val3}  ${val4}    ${val5}    ${val6}`

            let returnObj = {days: days, hrs: hrs, mins: mins}
            getElapsedTime(StorageStats[k].maxVolDate, returnObj)
            days = returnObj.days
            hrs = returnObj.hrs
            mins = returnObj.mins
            //getElapsedTime(StorageStats[k].maxVolDate, &days, &hrs, &mins);
            Frpt.contents += `    ${days.padStart(4, ' ')}  ${hrs.padStart(2, '0')}:${mins.padStart(2, '0')}  `
            Frpt.contents += flowFmt(StorageStats[k].maxFlow*UCF(FLOW));
        }
        WRITE(``);
    }
}

//=============================================================================

function writeOutfallLoads()
//
//  Input:   node
//  Output:  none
//  Purpose: writes simulation statistics for outfall nodess to report file.
//
{
    let  units;
    let  i, j, k, p;
    let  x;
    let  outfallCount, flowCount;
    let  flowSum, freqSum, volSum;
    totals = [];

    if ( Nnodes[OUTFALL] > 0 )
    {
        // --- initial totals
        //totals = (double *) calloc(Nobjects[POLLUT], sizeof(double));
        totals = new Array(Nobjects[POLLUT]);
        for (p=0; p<Nobjects[POLLUT]; p++) totals[p] = 0.0;
        flowSum = 0.0;
        freqSum = 0.0;
        volSum  = 0.0;

        // --- print table title
        WRITE(``);
        WRITE(`***********************`);
        WRITE(`Outfall Loading Summary`);
        WRITE(`***********************`);
        WRITE(``);

        // --- print table column headers
        Frpt.contents += 
 `\n  -----------------------------------------------------------`; 
        for (p = 0; p < Nobjects[POLLUT]; p++) Frpt.contents +=  `--------------`;
        Frpt.contents += 
 `\n                         Flow       Avg       Max       Total`;
        for (p=0; p<Nobjects[POLLUT]; p++) Frpt.contents += `         Total`;
        Frpt.contents += 
 `\n                         Freq      Flow      Flow      Volume`;
        for (p = 0; p < Nobjects[POLLUT]; p++) Frpt.contents +=  Pollut[p].ID.padStart(14, ' ');
        
        let val1 = FlowUnitWords[FlowUnits].padStart(3, ' ')
        let val2 = FlowUnitWords[FlowUnits].padStart(3, ' ')
        let val3 = VolUnitsWords[UnitSystem].padStart(8, ' ')
        Frpt.contents += 
 `\n  Outfall Node           Pcnt       ${val1}       ${val2}    ${val3}`

        for (p = 0; p < Nobjects[POLLUT]; p++)
        {
            i = UnitSystem;
            if ( Pollut[p].units == COUNT ) i = 2;
            units = LoadUnitsWords[i];
            Frpt.contents += units.padStart(14, ' ')
        }
        Frpt.contents += 
 `\n  -----------------------------------------------------------`;
        for (p = 0; p < Nobjects[POLLUT]; p++) Frpt.contents += `--------------`;

        // --- identify each outfall node
        for (j=0; j<Nobjects[NODE]; j++)
        {
            if ( Node[j].type != OUTFALL ) continue;
            k = Node[j].subIndex;
            flowCount = OutfallStats[k].totalPeriods;

            // --- print node ID, flow freq., avg. flow, max. flow & flow vol.
            Frpt.contents += `\n  ` + Node[j].ID.padEnd(20, ' ')
            x = 100.*flowCount/ReportStepCount;                        //(5.1.015)
            Frpt.contents += x.toFixed(2).padStart(7)
            freqSum += x;
            if ( flowCount > 0 )
                x = OutfallStats[k].avgFlow*UCF(FLOW)/flowCount;
            else
                x = 0.0;
            flowSum += x;

            Frpt.contents += ` `
            Frpt.contents += flowFmt(x);
            Frpt.contents += ` `;
            Frpt.contents += flowFmt(OutfallStats[k].maxFlow*UCF(FLOW));
            Frpt.contents += (NodeInflow[j] * Vcf).toFixed(3).padStart(12, ' ')
            volSum += NodeInflow[j];

            // --- print load of each pollutant for outfall
            for (p=0; p<Nobjects[POLLUT]; p++)
            {
                x = OutfallStats[k].totalLoad[p] * LperFT3 * Pollut[p].mcf;
                totals[p] += x;
                if ( Pollut[p].units == COUNT ) x = LOG10(x);
                Frpt.contents += x.toFixed(3).padStart(14, ' ')
            }
        }

        // --- print total outfall loads
        outfallCount = Nnodes[OUTFALL];
        Frpt.contents += 
 `\n  -----------------------------------------------------------`; 
        for (p = 0; p < Nobjects[POLLUT]; p++) Frpt.contents += `--------------`;

        Frpt.contents += `\n  System              ${(freqSum/outfallCount).toFixed(2).padStart(7, ' ')} `
        Frpt.contents += flowFmt(flowSum);
        Frpt.contents += ` `;
        Frpt.contents += flowFmt(MaxOutfallFlow*UCF(FLOW));
        Frpt.contents += (volSum * Vcf).toFixed(3).padStart(12, ' ')

        for (p = 0; p < Nobjects[POLLUT]; p++)
        {
            x = totals[p];
            if ( Pollut[p].units == COUNT ) x = LOG10(x);
            Frpt.contents += x.toFixed(3).padStart(14)
        }
        WRITE(``);
        //free(totals);
        totals = [];
    } 
}

//=============================================================================

function writeLinkFlows()
//
//  Input:   none
//  Output:  none
//  Purpose: writes simulation statistics for links to report file.
//
{
    let j, k, days, hrs, mins;
    let v, fullDepth;

    if (Nobjects[LINK] == 0) return;
    WRITE(``);
    WRITE(`********************`);
    WRITE(`Link Flow Summary`);
    WRITE(`********************`);
    WRITE(``);

    Frpt.contents += 
        `\n  -----------------------------------------------------------------------------`+
        `\n                                 Maximum  Time of Max   Maximum    Max/    Max/`+
        `\n                                  |Flow|   Occurrence   |Veloc|    Full    Full`
    if (UnitSystem == US) Frpt.contents += 
        `\n  Link                 Type          ${FlowUnitWords[FlowUnits].padStart(3)}  days hr:min    ft/sec    Flow   Depth`
    else Frpt.contents += 
        `\n  Link                 Type          ${FlowUnitWords[FlowUnits].padStart(3)}  days hr:min     m/sec    Flow   Depth`
        Frpt.contents += 
        `\n  -----------------------------------------------------------------------------`

    for (j = 0; j < Nobjects[LINK]; j++)
    {
        // --- print link ID
        k = Link[j].subIndex;
        Frpt.contents += `\n  ` + Link[j].ID.padEnd(20, ' ') 

        // --- print link type
        if (Link[j].xsect.type == DUMMY) Frpt.contents +=  ` DUMMY   `;
        else if (Link[j].xsect.type == IRREGULAR) Frpt.contents += ` CHANNEL `;
        else Frpt.contents += ` ${LinkTypeWords[Link[j].type].padEnd(7, ' ')} `;

        // --- print max. flow & time of occurrence
        let returnObj = {days: days, hrs: hrs, mins: mins}
        getElapsedTime(LinkStats[j].maxFlowDate, returnObj)
        days = returnObj.days
        hrs = returnObj.hrs
        mins = returnObj.mins
        //getElapsedTime(LinkStats[j].maxFlowDate, &days, &hrs, &mins);
        Frpt.contents += flowFmt(LinkStats[j].maxFlow*UCF(FLOW));
        Frpt.contents += `  ${days.toString().padStart(4, ' ')}  ${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`

        // --- print max flow / flow capacity for pumps
        if (Link[j].type == PUMP && Link[j].qFull > 0.0)
        {
            Frpt.contents +=  `          `
            Frpt.contents +=  `  ` + 
                (LinkStats[j].maxFlow / Link[j].qFull).toFixed(2).padStart(6, ' ');
            continue;
        }

        // --- stop printing for dummy conduits
        if (Link[j].xsect.type == DUMMY) continue;

        // --- stop printing for outlet links (since they don't have xsections)
        if (Link[j].type == OUTLET) continue;

        // --- print max velocity & max/full flow for conduits
        if (Link[j].type == CONDUIT)
        {
            v = LinkStats[j].maxVeloc*UCF(LENGTH);
            if (v > 50.0) Frpt.contents +=  `    >50.00`;
            else Frpt.contents +=  `   ` + v.toFixed(2).padStart(7, ' ')
            Frpt.contents +=  `  ` +
                (LinkStats[j].maxFlow / Link[j].qFull / Conduit[k].barrels).toFixed(2).padStart(6, ' ');
        }
        else Frpt.contents +=  `                  `;

        // --- print max/full depth
        fullDepth = Link[j].xsect.yFull;
        if (Link[j].type == ORIFICE &&
            Orifice[k].type == BOTTOM_ORIFICE) fullDepth = 0.0;
        if (fullDepth > 0.0)
        {
            Frpt.contents +=  `  ` + (LinkStats[j].maxDepth / fullDepth).toFixed(2).padStart(6);
        }
        else Frpt.contents +=  `        `;
    }
    WRITE(``);
}

//=============================================================================

function writeFlowClass()
//
//  Input:   none
//  Output:  none
//  Purpose: writes flow classification fro each conduit to report file.
//
{
    let   i, j, k;

    if ( RouteModel != DW ) return;
    WRITE(``);
    WRITE(`***************************`);
    WRITE(`Flow Classification Summary`);
    WRITE(`***************************`);
    WRITE(``);
    Frpt.contents +=  
`\n  -------------------------------------------------------------------------------------`
`\n                      Adjusted    ---------- Fraction of Time in Flow Class ---------- `
`\n                       /Actual         Up    Down  Sub   Sup   Up    Down  Norm  Inlet `
`\n  Conduit               Length    Dry  Dry   Dry   Crit  Crit  Crit  Crit  Ltd   Ctrl  `
`\n  -------------------------------------------------------------------------------------`;
    for ( j = 0; j < Nobjects[LINK]; j++ )
    {
        if ( Link[j].type != CONDUIT ) continue;
        if ( Link[j].xsect.type == DUMMY ) continue;
        k = Link[j].subIndex;
        Frpt.contents += `\n  ` + Link[j].ID.padEnd(20, ' ')
        Frpt.contents += `  ${(Conduit[k].modLength / Conduit[k].length).toFixed(2).padStart(6)} `
        for ( i=0; i<MAX_FLOW_CLASSES; i++ )
        {
            Frpt.contents += `  ` +
                (LinkStats[j].timeInFlowClass[i] /= ReportStepCount).toFixed(2).padStart(4);   //(5.1.015)
        }
        Frpt.contents += `  ` + (LinkStats[j].timeNormalFlow /
                                      (NewRoutingTime/1000.0)).toFixed(2).padStart(4)
        Frpt.contents += `  ` + (LinkStats[j].timeInletControl /
                                      (NewRoutingTime/1000.0)).toFixed(2).padStart(4)
    }
    WRITE(``);
}

//=============================================================================

function writeLinkSurcharge()
{
    let    i, j, n = 0;
    let t = new Array(5);

    WRITE(``);
    WRITE(`*************************`);
    WRITE(`Conduit Surcharge Summary`);
    WRITE(`*************************`);
    WRITE(``);
    for ( j = 0; j < Nobjects[LINK]; j++ )
    {
        if ( Link[j].type != CONDUIT ||
             Link[j].xsect.type == DUMMY ) continue; 
        t[0] = LinkStats[j].timeSurcharged / 3600.0;
        t[1] = LinkStats[j].timeFullUpstream / 3600.0;
        t[2] = LinkStats[j].timeFullDnstream / 3600.0;
        t[3] = LinkStats[j].timeFullFlow / 3600.0;
        if ( t[0] + t[1] + t[2] + t[3] == 0.0 ) continue;
        t[4] = LinkStats[j].timeCapacityLimited / 3600.0;
        for (i=0; i<5; i++) t[i] = Math.max(0.01, t[i]);
        if (n == 0)
        {
            Frpt.contents +=  
`\n  ----------------------------------------------------------------------------`+
`\n                                                           Hours        Hours `+
`\n                         --------- Hours Full --------   Above Full   Capacity`+
`\n  Conduit                Both Ends  Upstream  Dnstream   Normal Flow   Limited`+
`\n  ----------------------------------------------------------------------------`;
            n = 1;
        }
        Frpt.contents += `\n  ` + Link[j].ID.padEnd(20, ' ');
        let val1 = t[0].toFixed(2).padStart(8, ' ')
        let val2 = t[1].toFixed(2).padStart(8, ' ')
        let val3 = t[2].toFixed(2).padStart(8, ' ')
        let val4 = t[3].toFixed(2).padStart(8, ' ')
        let val5 = t[4].toFixed(2).padStart(8, ' ')
        Frpt.contents += `    ${val1}  ${val2}  ${val3}  ${val4}     ${val5}`
    }
    if ( n == 0 ) WRITE(`No conduits were surcharged.`);
    WRITE(``);
}

//=============================================================================

function writePumpFlows()
//
//  Input:   none
//  Output:  none
//  Purpose: writes simulation statistics for pumps to report file.
//
{
    let    j, k;
    let avgFlow, pctUtilized, pctOffCurve1, pctOffCurve2, totalSeconds;
    // String formatting variables
    let var1, var2, var3, var4, var5, var6, var7;

    if ( Nlinks[PUMP] == 0 ) return;

    WRITE(``);
    WRITE(`***************`);
    WRITE(`Pumping Summary`);
    WRITE(`***************`);
    WRITE(``);


    var1 = FlowUnitWords[FlowUnits].padStart(3, ' ')
    var2 = FlowUnitWords[FlowUnits].padStart(3, ' ')
    var3 = FlowUnitWords[FlowUnits].padStart(3, ' ')
    var4 = VolUnitsWords[UnitSystem].padStart(8, ' ')
    Frpt.contents += 
`\n  ---------------------------------------------------------------------------------------------------------`+
`\n                                                  Min       Avg       Max     Total     Power    %% Time Off`+
`\n                        Percent   Number of      Flow      Flow      Flow    Volume     Usage    Pump Curve`+
`\n  Pump                 Utilized   Start-Ups       ${var1}       ${var2}       ${var3}  ${var4}     Kw-hr    Low   High`+
`\n  ---------------------------------------------------------------------------------------------------------`
    for ( j = 0; j < Nobjects[LINK]; j++ )
    {
        if ( Link[j].type != PUMP ) continue;
        k = Link[j].subIndex;
        Frpt.contents += `\n  ` + Link[j].ID.padEnd(20, ' ')
        totalSeconds = NewRoutingTime / 1000.0;
        pctUtilized = PumpStats[k].utilized / totalSeconds * 100.0;
        avgFlow = PumpStats[k].avgFlow;
        if ( PumpStats[k].totalPeriods > 0 )
            avgFlow /=  PumpStats[k].totalPeriods;
        
        var1 = pctUtilized.toFixed(2).padStart(8, ' ')
        var2 = PumpStats[k].startUps.padStart(10, ' ')
        var3 = (PumpStats[k].minFlow*UCF(FLOW)).toFixed(2).padStart(9, ' ')
        var4 = (avgFlow*UCF(FLOW)).toFixed(2).padStart(9, ' ')
        var5 = (PumpStats[k].maxFlow*UCF(FLOW)).toFixed(2).padStart(9, ' ')
        var6 = (PumpStats[k].volume*Vcf).toFixed(3).padStart(9, ' ')
        var7 = PumpStats[k].energy.toFixed(2).padStart(9, ' ')
        Frpt.contents += ` %8.2f  %10d %9.2f %9.2f %9.2f %9.3f %9.2f`

        pctOffCurve1 = PumpStats[k].offCurveLow;
        pctOffCurve2 = PumpStats[k].offCurveHigh;
        if ( PumpStats[k].utilized > 0.0 )
        {
            pctOffCurve1 = pctOffCurve1 / PumpStats[k].utilized * 100.0;
            pctOffCurve2 = pctOffCurve2 / PumpStats[k].utilized * 100.0;
        }
        var1 = pctOffCurve1.toFixed(1).padStart(6, ' ')
        var2 = pctOffCurve2.toFixed(1).padStart(6, ' ')
        Frpt.contents += ` %6.1f %6.1f` 
    }
    WRITE(``);
}

//=============================================================================

function writeLinkLoads()
{
    let i, j, p;
    let x;
    let  units;
    let  linkLine = `--------------------`;
    let  pollutLine   = `--------------`;
    
    // --- print the table headings 
    WRITE(``);
    WRITE(`***************************`);
    WRITE(`Link Pollutant Load Summary`);
    WRITE(`***************************`);
    WRITE(``);
    Frpt.contents += `\n  ` + linkLine;
    for (p = 0; p < Nobjects[POLLUT]; p++) Frpt.contents += pollutLine;
    Frpt.contents += `\n                      `;
    for (p = 0; p < Nobjects[POLLUT]; p++) Frpt.contents += Pollut[p].ID.padStart(14, ' ');
    Frpt.contents += `\n  Link                `;
    for (p = 0; p < Nobjects[POLLUT]; p++)
    {
        i = UnitSystem;
        if ( Pollut[p].units == COUNT ) i = 2;
        units = LoadUnitsWords[i];
        Frpt.contents += units.padStart(14, ' ');
    }
    Frpt.contents += `\n ` + linkLine;
    for (p = 0; p < Nobjects[POLLUT]; p++) Frpt.contents +=  pollutLine;
    
    // --- print the pollutant loadings carried by each link
    for ( j = 0; j < Nobjects[LINK]; j++ )
    {
        Frpt.contents += `\n  ` + Link[j].ID.padEnd(20, ' ');
        for (p = 0; p < Nobjects[POLLUT]; p++)
        {
            x = Link[j].totalLoad[p] * LperFT3 * Pollut[p].mcf;
            if ( Pollut[p].units == COUNT ) x = Math.log10(x);
            if ( x < 10000. ) Frpt.contents += x.toFixed(3).padStart(14);
            else Frpt.contents += `%14.3e`, x.toExponential().padStart(14);
        }
    }
    WRITE(``);
    }

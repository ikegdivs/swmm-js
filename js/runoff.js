//-----------------------------------------------------------------------------
//   runoff.c
//
//   Project:  EPA SWMM5
//   Version:  5.1
//   Date:     03/20/14   (Build 5.1.001)
//             09/15/14   (Build 5.1.007)
//             03/19/15   (Build 5.1.008)
//             08/01/16   (Build 5.1.011)
//             03/14/17   (Build 5.1.012)
//             03/01/20   (Build 5.1.014)
//   Author:   L. Rossman
//             M. Tryby
//
//   Runoff analysis functions.
//
//   Build 5.1.007:
//   - Climate file now opened in climate.c module.
//
//   Build 5.1.008:
//   - Memory for runoff pollutant load now allocated and freed in this module.
//   - Runoff time step chosen so that simulation does not exceed total duration.
//   - State of LIDs considered when choosing wet or dry time step.
//   - More checks added to skip over subcatchments with zero area.
//   - Support added for sending outfall node discharge onto a subcatchment.
//
//   Build 5.1.011:
//   - Runoff wet time step kept aligned with reporting times.
//   - Prior runoff time step used to convert returned outfall volume to flow.
//
//   Build 5.1.012:
//   - Runoff wet time step no longer kept aligned with reporting times.
//
//   Build 5.1.014:
//   - Fixed street sweeping bug.
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// Shared variables
//-----------------------------------------------------------------------------
var  IsRaining;                // true if precip. falls on study area
var  HasRunoff;                // true if study area generates runoff
var  HasSnow;                  // true if any snow cover on study area
var  Nsteps;                   // number of runoff time steps taken
var  MaxSteps;                 // final number of runoff time steps
var  MaxStepsPos;              // position in Runoff interface file
                                //    where MaxSteps is saved

//-----------------------------------------------------------------------------
//  Exportable variables 
//-----------------------------------------------------------------------------
var HasWetLids;  // true if any LIDs are wet (used in lidproc.c)
var OutflowLoad = []; // exported pollutant mass load (used in surfqual.c)

//-----------------------------------------------------------------------------
//  Imported variables
//-----------------------------------------------------------------------------
//extern float* SubcatchResults;         // Results vector defined in OUTPUT.C

//-----------------------------------------------------------------------------
//  External functions (declared in funcs.h)
//-----------------------------------------------------------------------------
// runoff_open     (called from swmm_start in swmm5.c)
// runoff_execute  (called from swmm_step in swmm5.c)
// runoff_close    (called from swmm_end in swmm5.c)


//=============================================================================

function runoff_open()
//
//  Input:   none
//  Output:  returns the global error code
//  Purpose: opens the runoff analyzer.
//
{
    IsRaining = false;
    HasRunoff = false;
    HasSnow = false;
    Nsteps = 0;

    // --- open the Ordinary Differential Equation solver
    if ( !odesolve_open(MAXODES) ) report_writeErrorMsg(ERR_ODE_SOLVER, "");

    // --- allocate memory for pollutant runoff loads
    OutflowLoad = null;
    if ( Nobjects[POLLUT] > 0 )
    {
        //OutflowLoad = (double *) calloc(Nobjects[POLLUT], sizeof(double));
        OutflowLoad = new Array(Nobjects[POLLUT])
        if ( !OutflowLoad ) report_writeErrorMsg(ERR_MEMORY, "");
    }

    // --- see if a runoff interface file should be opened
    switch ( Frunoff.mode )
    {
      case USE_FILE:
        if ( (Frunoff.file = fopen(Frunoff.name, "r+b")) == null)
            report_writeErrorMsg(ERR_RUNOFF_FILE_OPEN, Frunoff.name);
        else runoff_initFile();
        break;
      case SAVE_FILE:
        if ( (Frunoff.file = fopen(Frunoff.name, "w+b")) == null)
            report_writeErrorMsg(ERR_RUNOFF_FILE_OPEN, Frunoff.name);
        else runoff_initFile();
        break;
    }
    return ErrorCode;
}

//=============================================================================

function runoff_close()
//
//  Input:   none
//  Output:  none
//  Purpose: closes the runoff analyzer.
//
{
    // --- close the ODE solver
    odesolve_close();

    // --- free memory for pollutant runoff loads
    FREE(OutflowLoad);

    // --- close runoff interface file if in use
    if ( Frunoff.file )
    {
        // --- write to file number of time steps simulated
        if ( Frunoff.mode == SAVE_FILE )
        {
            fseek(Frunoff.file, MaxStepsPos, SEEK_SET);
            fwrite(Nsteps, sizeof(int), 1, Frunoff.file);
        }
        fclose(Frunoff.file);
    }

    // --- close climate file if in use
    if ( Fclimate.file ) fclose(Fclimate.file);
}

//=============================================================================

function runoff_execute()
//
//  Input:   none
//  Output:  none
//  Purpose: computes runoff from each subcatchment at current runoff time.
//
{
    let      j;                        // object index
    let      day;                      // day of calendar year
    let   runoffStep;               // runoff time step (sec)
    let   oldRunoffStep;            // previous runoff time step (sec)
    let   runoff;                   // subcatchment runoff (ft/sec)
    let currentDate;              // current date/time 
    let     canSweep;                 // true if street sweeping can occur

    if ( ErrorCode ) return;

    // --- find previous runoff time step in sec
    oldRunoffStep = (NewRunoffTime - OldRunoffTime) / 1000.0;

    // --- convert elapsed runoff time in milliseconds to a calendar date
    currentDate = getDateTime(NewRunoffTime);

    // --- update climatological conditions
    climate_setState(currentDate);

    // --- if no subcatchments then simply update runoff elapsed time
    if ( Nobjects[SUBCATCH] == 0 )
    {
        OldRunoffTime = NewRunoffTime;
        NewRunoffTime += (1000 * DryStep);
        NewRunoffTime = Math.min(NewRunoffTime, TotalDuration);
        return;
    }

    // --- update current rainfall at each raingage
    //     NOTE: must examine gages in sequential order due to possible
    //     presence of co-gages (gages that share same rain time series).
    IsRaining = false;
    for (j = 0; j < Nobjects[GAGE]; j++)
    {
        gage_setState(j, currentDate);
        if ( Gage[j].rainfall > 0.0 ) IsRaining = true;
    }

    // --- read runoff results from interface file if applicable
    if ( Frunoff.mode == USE_FILE )
    {
        runoff_readFromFile();
        return;
    }

    // --- see if street sweeping can occur on current date
    day = datetime_dayOfYear(currentDate);
    if ( SweepStart <= SweepEnd )
    {
        if ( day >= SweepStart && day <= SweepEnd ) canSweep = true;
    }
    else if ( day <= SweepEnd || day >= SweepStart ) canSweep = true;
    else canSweep = false;

    // --- get runoff time step (in seconds)
    runoffStep = runoff_getTimeStep(currentDate);
    if ( runoffStep <= 0.0 )
    {
        ErrorCode = ERR_TIMESTEP;
        return;
    }

    // --- update runoff time clock (in milliseconds)
    OldRunoffTime = NewRunoffTime;
    NewRunoffTime += (1000 * runoffStep);

    // --- adjust runoff step so that total duration not exceeded
    if ( NewRunoffTime > TotalDuration )
    {
        runoffStep = (TotalDuration - OldRunoffTime) / 1000.0;
        NewRunoffTime = TotalDuration;
    }

    // --- update old state of each subcatchment, 
    for (j = 0; j < Nobjects[SUBCATCH]; j++) subcatch_setOldState(j);

    // --- determine any runon from drainage system outfall nodes
    if ( oldRunoffStep > 0.0 ) runoff_getOutfallRunon(oldRunoffStep);

    // --- determine runon from upstream subcatchments, and implement snow removal
    for (j = 0; j < Nobjects[SUBCATCH]; j++)
    {
        if ( Subcatch[j].area == 0.0 ) continue;
        subcatch_getRunon(j);
        if ( !IgnoreSnowmelt ) snow_plowSnow(j, runoffStep);
    }
    
    // --- determine runoff and pollutant buildup/washoff in each subcatchment
    HasSnow = false;
    HasRunoff = false;
    HasWetLids = false;
    for (j = 0; j < Nobjects[SUBCATCH]; j++)
    {
        // --- find total runoff rate (in ft/sec) over the subcatchment
        //     (the amount that actually leaves the subcatchment (in cfs)
        //     is also computed and is stored in Subcatch[j].newRunoff)
        if ( Subcatch[j].area == 0.0 ) continue;
        runoff = subcatch_getRunoff(j, runoffStep);

        // --- update state of study area surfaces
        if ( runoff > 0.0 ) HasRunoff = true;
        if ( Subcatch[j].newSnowDepth > 0.0 ) HasSnow = true;

        // --- skip pollutant buildup/washoff if quality ignored
        if ( IgnoreQuality ) continue;

        // --- add to pollutant buildup if runoff is negligible
        if ( runoff < MIN_RUNOFF ) surfqual_getBuildup(j, runoffStep); 

        // --- reduce buildup by street sweeping
        if ( canSweep && Subcatch[j].rainfall <= MIN_RUNOFF)
            surfqual_sweepBuildup(j, currentDate);

        // --- compute pollutant washoff 
        surfqual_getWashoff(j, runoff, runoffStep);
    }

    // --- update tracking of system-wide max. runoff rate
    stats_updateMaxRunoff();

    // --- save runoff results to interface file if one is used
    Nsteps++;
    if ( Frunoff.mode == SAVE_FILE )
    {
        runoff_saveToFile(runoffStep);
    }

    // --- reset subcatchment runon to 0
    for (j = 0; j < Nobjects[SUBCATCH]; j++) Subcatch[j].runon = 0.0;
}

//=============================================================================
// DateTime currentDate
function runoff_getTimeStep(currentDate)
//
//  Input:   currentDate = current simulation date/time
//  Output:  time step (sec)
//  Purpose: computes a time step to use for runoff calculations.
//
{
    let  j;
    let timeStep;
    let maxStep = DryStep;

    // --- find shortest time until next evaporation or rainfall value
    //     (this represents the maximum possible time step)
    timeStep = datetime_timeDiff(climate_getNextEvapDate(), currentDate);
    if ( timeStep > 0.0 && timeStep < maxStep ) maxStep = timeStep;
    for (j = 0; j < Nobjects[GAGE]; j++)
    {
        timeStep = datetime_timeDiff(gage_getNextRainDate(j, currentDate),
                   currentDate);
        if ( timeStep > 0 && timeStep < maxStep ) maxStep = timeStep;
    }

    // --- determine whether wet or dry time step applies
    if ( IsRaining || HasSnow || HasRunoff || HasWetLids )
    {
        timeStep = WetStep;
    }
    else timeStep = DryStep;

    // --- limit time step if necessary
    if ( timeStep > maxStep ) timeStep = maxStep;
    return timeStep;
}

//=============================================================================
// void
function runoff_initFile()
//
//  Input:   none
//  Output:  none
//  Purpose: initializes a Runoff Interface file for saving results.
//
{
    let   nSubcatch;
    let   nPollut;
    let   flowUnits;
    let  fileStamp = "SWMM5-RUNOFF";
    let  fStamp = "SWMM5-RUNOFF";

    MaxSteps = 0;
    if ( Frunoff.mode == SAVE_FILE )
    {
        // --- write file stamp, # subcatchments & # pollutants to file
        nSubcatch = Nobjects[SUBCATCH];
        nPollut = Nobjects[POLLUT];
        flowUnits = FlowUnits;
        fwrite(fileStamp, sizeof(char), ileStamp.length, Frunoff.file);
        fwrite(nSubcatch, sizeof(int), 1, Frunoff.file);
        fwrite(nPollut, sizeof(int), 1, Frunoff.file);
        fwrite(flowUnits, sizeof(int), 1, Frunoff.file);
        MaxStepsPos = ftell(Frunoff.file); 
        fwrite(MaxSteps, sizeof(int), 1, Frunoff.file);
    }

    if ( Frunoff.mode == USE_FILE )
    {
        // --- check that interface file contains proper header records
        fread(fStamp, sizeof(char), fileStamp.length, Frunoff.file);
        if ( strcmp(fStamp, fileStamp) != 0 )
        {
            report_writeErrorMsg(ERR_RUNOFF_FILE_FORMAT, "");
            return;
        }
        nSubcatch = -1;
        nPollut = -1;
        flowUnits = -1;
        fread(nSubcatch, sizeof(int), 1, Frunoff.file);
        fread(nPollut, sizeof(int), 1, Frunoff.file);
        fread(flowUnits, sizeof(int), 1, Frunoff.file);
        fread(MaxSteps, sizeof(int), 1, Frunoff.file);
        if ( nSubcatch != Nobjects[SUBCATCH]
        ||   nPollut   != Nobjects[POLLUT]
        ||   flowUnits != FlowUnits
        ||   MaxSteps  <= 0 )
        {
             report_writeErrorMsg(ERR_RUNOFF_FILE_FORMAT, "");
        }
    }
}

//=============================================================================
// float tStep
function  runoff_saveToFile(tStep)
//
//  Input:   tStep = runoff time step (sec)
//  Output:  none
//  Purpose: saves current runoff results to Runoff Interface file.
//
{
    let j;
    let n = MAX_SUBCATCH_RESULTS + Nobjects[POLLUT] - 1;
    

    fwrite(tStep, sizeof(float), 1, Frunoff.file);
    for (j=0; j<Nobjects[SUBCATCH]; j++)
    {
        ////////////////////////////////////
        returnObj = {x: SubcatchResults}
        returnVal = subcatch_getResults(j, 1.0, returnObj)
        SubcatchResults = returnObj.x;
        ////////////////////////////////////
        //subcatch_getResults(j, 1.0, SubcatchResults);
        fwrite(SubcatchResults, sizeof(float), n, Frunoff.file);
    }
}

//=============================================================================
// void
function  runoff_readFromFile()
//
//  Input:   none
//  Output:  none
//  Purpose: reads runoff results from Runoff Interface file for current time.
//
{
    let    i, j;
    let    nResults;                   // number of results per subcatch.
    let    kount;                      // count of items read from file
    let  tStep;                      // runoff time step (sec)
    let gw; //TGroundwater* gw;                  // ptr. to Groundwater object

    // --- make sure not past end of file
    if ( Nsteps > MaxSteps )
    {
         report_writeErrorMsg(ERR_RUNOFF_FILE_END, "");
         return;
    }

    // --- replace old state with current one for all subcatchments
    for (j = 0; j < Nobjects[SUBCATCH]; j++) subcatch_setOldState(j);

    // --- read runoff time step
    kount = 0;
    kount += fread(tStep, sizeof(float), 1, Frunoff.file);

    // --- compute number of results saved for each subcatchment
    nResults = MAX_SUBCATCH_RESULTS + Nobjects[POLLUT] - 1;

    // --- for each subcatchment
    for (j = 0; j < Nobjects[SUBCATCH]; j++)
    {
        // --- read vector of saved results
        kount += fread(SubcatchResults, sizeof(float), nResults, Frunoff.file);

        // --- extract hydrologic results, converting units where necessary
        //     (results were saved to file in user's units)
        Subcatch[j].newSnowDepth = SubcatchResults[SUBCATCH_SNOWDEPTH] /
                                   UCF(RAINDEPTH);
        Subcatch[j].evapLoss     = SubcatchResults[SUBCATCH_EVAP] /
                                   UCF(RAINFALL);
        Subcatch[j].infilLoss    = SubcatchResults[SUBCATCH_INFIL] /
                                   UCF(RAINFALL);
        Subcatch[j].newRunoff    = SubcatchResults[SUBCATCH_RUNOFF] /
                                   UCF(FLOW);
        gw = Subcatch[j].groundwater;
        if ( gw )
        {
            gw.newFlow    = SubcatchResults[SUBCATCH_GW_FLOW] / UCF(FLOW);
            gw.lowerDepth = Aquifer[gw.aquifer].bottomElev -
                             (SubcatchResults[SUBCATCH_GW_ELEV] / UCF(LENGTH));
            gw.theta      = SubcatchResults[SUBCATCH_SOIL_MOIST];
        }

        // --- extract water quality results
        for (i = 0; i < Nobjects[POLLUT]; i++)
        {
            Subcatch[j].newQual[i] = SubcatchResults[SUBCATCH_WASHOFF + i];
        }
    }

    // --- report error if not enough values were read
    if ( kount < 1 + Nobjects[SUBCATCH] * nResults )
    {
         report_writeErrorMsg(ERR_RUNOFF_FILE_READ, "");
         return;
    }

    // --- update runoff time clock
    OldRunoffTime = NewRunoffTime;
    NewRunoffTime = OldRunoffTime + (tStep)*1000.0;
    NewRunoffTime = MIN(NewRunoffTime, TotalDuration);
    Nsteps++;
}

//=============================================================================

// double tStep
function runoff_getOutfallRunon(tStep)
//
//  Input:   tStep = previous runoff time step (sec)
//  Output:  none
//  Purpose: adds flow and pollutant loads leaving drainage system outfalls
//           during the previous runoff time step to designated subcatchments.
//
{
    let i, k, p;
    let w;

    // --- examine each outfall node
    for (i = 0; i < Nnodes[OUTFALL]; i++)
    {
        // --- ignore node if outflow not re-routed onto a subcatchment
        k = Outfall[i].routeTo;
        if ( k < 0 ) continue;
        if ( Subcatch[k].area == 0.0 ) continue;

        // --- add outfall's flow to subcatchment as runon and re-set routed
        //     flow volume to 0
        subcatch_addRunonFlow(k, Outfall[i].vRouted/tStep);
        massbal_updateRunoffTotals(RUNOFF_RUNON, Outfall[i].vRouted);
        Outfall[i].vRouted = 0.0;

        // --- add outfall's pollutant load on to subcatchment's wet
        //     deposition load and re-set routed load to 0
        //     (Subcatch.newQual is being used as a temporary load accumulator)
        for (p = 0; p < Nobjects[POLLUT]; p++)
        {
            w = Outfall[i].wRouted[p] * LperFT3;
            massbal_updateLoadingTotals(DEPOSITION_LOAD, p, w * Pollut[p].mcf);
            Subcatch[k].newQual[p] += w / tStep;
            Outfall[i].wRouted[p] = 0.0;
        }
    }
}

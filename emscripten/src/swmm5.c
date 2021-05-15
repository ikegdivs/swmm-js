#include <emscripten.h>

//-----------------------------------------------------------------------------
//   swmm5.c
//
//   Project:  EPA SWMM5
//   Version:  5.1
//   Date:     03/19/14  (Build 5.1.001)
//             03/19/15  (Build 5.1.008)
//             08/01/16  (Build 5.1.011)
//             03/14/17  (Build 5.1.012)
//             05/10/18  (Build 5.1.013)
//             04/01/20  (Build 5.1.015)
//   Author:   L. Rossman
//
//   This is the main module of the computational engine for Version 5 of
//   the U.S. Environmental Protection Agency's Storm Water Management Model
//   (SWMM). It contains functions that control the flow of computations.
//
//   This engine should be compiled into a shared object library whose API
//   functions are listed in swmm5.h.
//
//   Build 5.1.008:
//   - Support added for the MinGW compiler.
//   - Reporting of project options moved to swmm_start. 
//   - Hot start file now read before routing system opened.
//   - Final routing step adjusted so that total duration not exceeded.
//
//   Build 5.1.011:
//   - Made sure that MS exception handling only used with MS C compiler.
//   - Added name of module handling an exception to error report.
//   - Elapsed simulation time now saved to new global variable ElaspedTime.
//   - Added swmm_getError() function that retrieves error code and message.
//   - Changed WarningCode to Warnings (# warnings issued).
//   - Added swmm_getWarnings() function to retrieve value of Warnings.
//   - Fixed error code returned on swmm_xxx functions.
//
//   Build 5.1.012:
//   - #include <direct.h> only used when compiled for Windows.
//
//   Build 5.1.013:
//   - Support added for saving average results within a reporting period.
//   - SWMM engine now always compiled to a shared object library.
//
//   Build 5.1.015:
//   - Fixes bug in summary statistics when Report Start date > Start Date.
//-----------------------------------------------------------------------------
#define _CRT_SECURE_NO_DEPRECATE

// --- define WINDOWS
#undef WINDOWS
#ifdef _WIN32
  #define WINDOWS
#endif
#ifdef __WIN32__
  #define WINDOWS
#endif

// --- define EXH (MS Windows exception handling)
#undef EXH         // indicates if exception handling included
#ifdef WINDOWS
  #ifdef _MSC_VER
  #define EXH
  #endif
#endif

// --- include Windows & exception handling headers
#ifdef WINDOWS
  #include <windows.h>
  #include <direct.h>
#endif
#ifdef EXH
  #include <excpt.h>
#endif

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <time.h>
#include <float.h>

//-----------------------------------------------------------------------------
//  SWMM's header files
//
//  Note: the directives listed below are also contained in headers.h which
//        is included at the start of most of SWMM's other code modules.
//-----------------------------------------------------------------------------
#include "stdint.h"
#include "consts.h"                    // defined constants
#include "macros.h"                    // macros used throughout SWMM
#include "enums.h"                     // enumerated variables
#include "error.h"                     // error message codes
#include "datetime.h"                  // date/time functions
#include "objects.h"                   // definitions of SWMM's data objects
#include "funcs.h"                     // declaration of all global functions
#include "text.h"                      // listing of all text strings 
#define  EXTERN                        // defined as 'extern' in headers.h
#include "globals.h"                   // declaration of all global variables
#include "keywords.h"

#include "swmm5.h"                     // declaration of SWMM's API functions

#define  MAX_EXCEPTIONS 100            // max. number of exceptions handled

//-----------------------------------------------------------------------------
//  Unit conversion factors
//-----------------------------------------------------------------------------
const double Ucf[10][2] = 
      {//  US      SI
      {43200.0,   1097280.0 },         // RAINFALL (in/hr, mm/hr --> ft/sec)
      {12.0,      304.8     },         // RAINDEPTH (in, mm --> ft)
      {1036800.0, 26334720.0},         // EVAPRATE (in/day, mm/day --> ft/sec)
      {1.0,       0.3048    },         // LENGTH (ft, m --> ft)
      {2.2956e-5, 0.92903e-5},         // LANDAREA (ac, ha --> ft2)
      {1.0,       0.02832   },         // VOLUME (ft3, m3 --> ft3)
      {1.0,       1.608     },         // WINDSPEED (mph, km/hr --> mph)
      {1.0,       1.8       },         // TEMPERATURE (deg F, deg C --> deg F)
      {2.203e-6,  1.0e-6    },         // MASS (lb, kg --> mg)
      {43560.0,   3048.0    }          // GWFLOW (cfs/ac, cms/ha --> ft/sec)
      };
const double Qcf[6] =                  // Flow Conversion Factors:
    {1.0,     448.831, 0.64632,        // cfs, gpm, mgd --> cfs
     0.02832, 28.317,  2.4466 };       // cms, lps, mld --> cfs

//-----------------------------------------------------------------------------
//  Shared variables
//-----------------------------------------------------------------------------
static int  IsOpenFlag;           // TRUE if a project has been opened
static int  IsStartedFlag;        // TRUE if a simulation has been started
static int  SaveResultsFlag;      // TRUE if output to be saved to binary file
static int  ExceptionCount;       // number of exceptions handled
static int  DoRunoff;             // TRUE if runoff is computed
static int  DoRouting;            // TRUE if flow routing is computed

//-----------------------------------------------------------------------------
//  External API functions (prototyped in swmm5.h)
//-----------------------------------------------------------------------------
//  swmm_run
//  swmm_open
//  swmm_start
//  swmm_step
//  swmm_end
//  swmm_report
//  swmm_close
//  swmm_getMassBalErr
//  swmm_getVersion

//-----------------------------------------------------------------------------
//  Local functions
//-----------------------------------------------------------------------------
static void execRouting(void);

// Exception filtering function
#ifdef EXH
static int  xfilter(int xc, char* module, double elapsedTime, long step);
#endif

//=============================================================================
EMSCRIPTEN_KEEPALIVE
int DLLEXPORT  swmm_run(char* f1, char* f2, char* f3)
//
//  Input:   f1 = name of input file
//           f2 = name of report file
//           f3 = name of binary output file
//  Output:  returns error code
//  Purpose: runs a SWMM simulation.
//
{
    long newHour, oldHour = 0;
    long theDay, theHour;
    double elapsedTime = 0.0;

    // --- initialize flags                                                    //(5.1.013)
    IsOpenFlag = FALSE;                                                        //
    IsStartedFlag = FALSE;                                                     //
    SaveResultsFlag = TRUE;                                                    //

    // --- open the files & read input data
    ErrorCode = 0;
    swmm_open(f1, f2, f3);

    // --- run the simulation if input data OK
    if ( !ErrorCode )
    {
        // --- initialize values
        swmm_start(TRUE);

        // --- execute each time step until elapsed time is re-set to 0
        if ( !ErrorCode )
        {
            writecon("\n o  Simulating day: 0     hour:  0");
            do
            {
                swmm_step(&elapsedTime);
                newHour = (long)(elapsedTime * 24.0);
                if ( newHour > oldHour )
                {
                    theDay = (long)elapsedTime;
                    theHour = (long)((elapsedTime - floor(elapsedTime)) * 24.0);
                    writecon("\b\b\b\b\b\b\b\b\b\b\b\b\b\b");
                    sprintf(Msg, "%-5ld hour: %-2ld", theDay, theHour);        //(5.1.013)
                    writecon(Msg);
                    oldHour = newHour;
                }
            } while ( elapsedTime > 0.0 && !ErrorCode );
            writecon("\b\b\b\b\b\b\b\b\b\b\b\b\b\b"
                     "\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b");
            writecon("Simulation complete           ");
        }

        // --- clean up
        swmm_end();
    }

    // --- report results
    if ( Fout.mode == SCRATCH_FILE ) swmm_report();

    // --- close the system
    swmm_close();
    return error_getCode(ErrorCode);
}


extern uint8_t* fill_array(int n);


uint8_t* fill_array(int n){
    uint8_t arr[n];
    for(uint8_t i=0; i< n; ++i) arr[i] = i;
    return arr;
}

//=============================================================================
char* EMSCRIPTEN_KEEPALIVE DLLEXPORT swmm_transcribe(char* f1, char* f2, char* f3)
//
//  Input:   f1 = name of input file
//           f2 = name of report file
//           f3 = name of binary output file
//  Output:  returns error code
//  Purpose: opens a SWMM project.
//
{
// --- to be safe, reset the state of the floating point unit                  //(5.1.013)
#ifdef WINDOWS                                                                 //(5.1.013)
    _fpreset();
#endif

    char JX[99999];
#ifdef EXH
    // --- begin exception handling here
    __try
#endif
    {
        // temp char for numbers
        char numStr[50];
        // Size of arrays
        size_t arrayN;

        swmm_open(f1, f2, f3);
        // Translate the input file into a JSON object and return to main
        // TITLE
        strcpy(JX, "{\"Title\": [\n");
        for (int i=0; i<MAXTITLE; i++){
            if ( strlen(Title[i]) > 0 )
            {
                strcat(JX, "\t\"");
                // Remove newlines
                size_t len = strlen(Title[i]);
                for(int ii = 0; ii < len; ii++){
                    if(Title[i][ii] == '\n' || Title[i][ii] == '\r'){
                        Title[i][ii] = '\0';
                    }
                }

                strcat(JX, Title[i]);
                strcat(JX, "\"");
                if(strlen(Title[i+1]) > 0) strcat(JX, ",");
                strcat(JX, "\n");
            }
        }
        strcat(JX, "],\n\"OPTIONS\": {\n");

        // OPTIONS
        sprintf(&JX[strlen(JX)], "\"FLOW_UNITS\":%d,\n", FlowUnits);
        sprintf(&JX[strlen(JX)], "\"INFILTRATION\":\"%s\",\n", InfilModelWords[InfilModel]);
        sprintf(&JX[strlen(JX)], "\"FLOW_ROUTING\":\"%s\",\n", RouteModelWords[RouteModel]);
        sprintf(&JX[strlen(JX)], "\"START_DATE\":%f,\n", StartDate);
        sprintf(&JX[strlen(JX)], "\"START_TIME\":%f,\n", StartTime);
        sprintf(&JX[strlen(JX)], "\"END_DATE\":%f,\n", EndDate);
        sprintf(&JX[strlen(JX)], "\"END_TIME\":%f,\n", EndTime);
        sprintf(&JX[strlen(JX)], "\"REPORT_START_DATE\":%f,\n", ReportStartDate);
        sprintf(&JX[strlen(JX)], "\"REPORT_START_TIME\":%f,\n", ReportStartTime);
        sprintf(&JX[strlen(JX)], "\"SWEEP_START\":%d,\n", SweepStart);
        sprintf(&JX[strlen(JX)], "\"SWEEP_END\":%d,\n", SweepEnd);
        sprintf(&JX[strlen(JX)], "\"DRY_DAYS\":%f,\n", StartDryDays);
        sprintf(&JX[strlen(JX)], "\"WET_STEP\":%d,\n", WetStep);
        sprintf(&JX[strlen(JX)], "\"DRY_STEP\":%d,\n", DryStep);
        sprintf(&JX[strlen(JX)], "\"REPORT_STEP\":%d,\n", ReportStep);
        sprintf(&JX[strlen(JX)], "\"RULE_STEP\":%d,\n", RuleStep);
        sprintf(&JX[strlen(JX)], "\"INERTIAL_DAMPING\":\"%s\",\n", InertDampingWords[InertDamping]);
        sprintf(&JX[strlen(JX)], "\"ALLOW_PONDING\":\"%s\",\n", NoYesWords[AllowPonding]);
        sprintf(&JX[strlen(JX)], "\"SLOPE_WEIGHTING\":\"%s\",\n", NoYesWords[SlopeWeighting]);
        sprintf(&JX[strlen(JX)], "\"SKIP_STEADY_STATE\":\"%s\",\n", NoYesWords[SkipSteadyState]);
        sprintf(&JX[strlen(JX)], "\"IGNORE_RAINFALL\":\"%s\",\n", NoYesWords[IgnoreRainfall]);
        sprintf(&JX[strlen(JX)], "\"IGNORE_SNOWMELT\":\"%s\",\n", NoYesWords[IgnoreSnowmelt]);
        sprintf(&JX[strlen(JX)], "\"IGNORE_GROUNDWATER\":\"%s\",\n", NoYesWords[IgnoreGwater]);
        sprintf(&JX[strlen(JX)], "\"IGNORE_ROUTING\":\"%s\",\n", NoYesWords[IgnoreRouting]);
        sprintf(&JX[strlen(JX)], "\"IGNORE_QUALITY\":\"%s\",\n", NoYesWords[IgnoreQuality]);
        sprintf(&JX[strlen(JX)], "\"IGNORE_RDII\":\"%s\",\n", NoYesWords[IgnoreRDII]);
        sprintf(&JX[strlen(JX)], "\"NORMAL_FLOW_LIMITED\":\"%s\",\n", NormalFlowWords[NormalFlowLtd]);
        sprintf(&JX[strlen(JX)], "\"FORCE_MAIN_EQUATION\":\"%s\",\n", ForceMainEqnWords[ForceMainEqn]);
        sprintf(&JX[strlen(JX)], "\"LINK_OFFSETS\":\"%s\",\n", LinkOffsetWords[LinkOffsets]);
        sprintf(&JX[strlen(JX)], "\"COMPATIBILITY\":%d,\n", Compatibility);
        sprintf(&JX[strlen(JX)], "\"ROUTING_STEP\":%f,\n", RouteStep);
        sprintf(&JX[strlen(JX)], "\"LENGTHENING_STEP\":%f,\n", LengtheningStep);
        sprintf(&JX[strlen(JX)], "\"MINIMUM_STEP\":%f,\n", MinRouteStep);
        sprintf(&JX[strlen(JX)], "\"THREADS\":%d,\n", NumThreads);
        sprintf(&JX[strlen(JX)], "\"VARIABLE_STEP\":%f,\n", CourantFactor);
        sprintf(&JX[strlen(JX)], "\"MIN_SURFAREA\":%f,\n", MinSurfArea);
        sprintf(&JX[strlen(JX)], "\"MIN_SLOPE\":%f,\n", MinSlope*100);
        sprintf(&JX[strlen(JX)], "\"MAX_TRIALS\":%d,\n", MaxTrials);
        sprintf(&JX[strlen(JX)], "\"HEAD_TOLERANCE\":%f,\n", HeadTol);
        sprintf(&JX[strlen(JX)], "\"SYS_FLOW_TOL\":%f,\n", SysFlowTol*100);
        sprintf(&JX[strlen(JX)], "\"LAT_FLOW_TOL\":%f,\n", LatFlowTol*100);
        sprintf(&JX[strlen(JX)], "\"SURCHARGE_METHOD\":%d,\n", SurchargeMethod);
        sprintf(&JX[strlen(JX)], "\"TEMPDIR\":\"%s\"\n", TempDir);
        
        strcat(JX, "}\n"); 
        // end OPTIONS
        // Pattern
        strcat(JX, ",\n\"Pattern\": [\n");
        // Get array size
        arrayN = Nobjects[TIMEPATTERN];
        for (int i=0; i<arrayN; i++){
            sprintf(&JX[strlen(JX)], "\t{\"ID\":\"%s\",\n", Pattern[i].ID);
            sprintf(&JX[strlen(JX)], "\t\"count\":%d,\n", Pattern[i].count);

            strcat(JX, "\"factor\":[");
            for(int ii = 0; ii < 24; ii++){
                sprintf(&JX[strlen(JX)], "%f\n\t", Pattern[i].factor[ii]);
                if(ii < 23){
                    strcat(JX, ",");
                } else {
                    strcat(JX, "],\n");
                }
            }

            sprintf(&JX[strlen(JX)], "\t\"type\":%d}\n", Pattern[i].type);

            if(i != arrayN-1) strcat(JX, ",");
            strcat(JX, "\n");
        }
        strcat(JX, "]\n");
        
        // end Pattern
        // Tseries
        strcat(JX, ",\n\"Tseries\": [\n");
        // Get array size
        arrayN = Nobjects[TSERIES];
        for (int i=0; i<arrayN; i++){
            sprintf(&JX[strlen(JX)], "\t{\"ID\":\"%s\",\n", Tseries[i].ID);
            sprintf(&JX[strlen(JX)], "\t\"curveType\":%d,\n", Tseries[i].curveType);
            sprintf(&JX[strlen(JX)], "\t\"refersTo\":%d,\n", Tseries[i].refersTo);
            sprintf(&JX[strlen(JX)], "\t\"dxMin\":%f,\n", Tseries[i].dxMin);
            sprintf(&JX[strlen(JX)], "\t\"lastDate\":%f,\n", Tseries[i].lastDate);
            sprintf(&JX[strlen(JX)], "\t\"x1\":%f,\n", Tseries[i].x1);
            sprintf(&JX[strlen(JX)], "\t\"x2\":%f,\n", Tseries[i].x2);
            sprintf(&JX[strlen(JX)], "\t\"y1\":%f,\n", Tseries[i].y1);
            sprintf(&JX[strlen(JX)], "\t\"y2\":%f,\n", Tseries[i].y2);

            // File
            strcat(JX, "\t\"file\":{\n");
            sprintf(&JX[strlen(JX)], "\t\t\"name\":\"%s\",\n", Tseries[i].file.name);
            sprintf(&JX[strlen(JX)], "\n\t\t\"mode\":%d},\n", Tseries[i].file.mode);

            // Table
            strcat(JX, "\t\"Table\":[\n");
            TTableEntry* tSpot = Tseries[i].firstEntry;
            while(tSpot){
                sprintf(&JX[strlen(JX)], "\t\t{\"x\":%f,\n", tSpot->x);
                sprintf(&JX[strlen(JX)], "\t\t\"y\":%f}\n", tSpot->y);

                tSpot = tSpot->next;
                if(tSpot) strcat(JX, ",");
                else strcat(JX, "]");
            }
            strcat(JX, "\n}");

            if(i != arrayN-1) strcat(JX, ",");
            strcat(JX, "\n");
        }
        strcat(JX, "],\n");
        // end Tseries 
        // EVAPORATION

        strcat(JX, "\n\"Evap\": {\n");

        sprintf(&JX[strlen(JX)], "\"dryOnly\":%d,\n", Evap.dryOnly);

        strcat(JX, "\"monthlyEvap\":[");
        for(int i = 0; i < 12; i++){
            sprintf(&JX[strlen(JX)], "%f\n\t", Evap.monthlyEvap[i]);
            if(i < 11){
                strcat(JX, ",");
            } else {
                strcat(JX, "],\n");
            }
        }

        strcat(JX, "\"panCoeff\":[");
        for(int i = 0; i < 12; i++){
            sprintf(&JX[strlen(JX)], "%f\n\t", Evap.panCoeff[i]);
            if(i < 11){
                strcat(JX, ",");
            } else {
                strcat(JX, "],\n");
            }
        }
        sprintf(&JX[strlen(JX)], "\"recoveryFactor\":%f,\n", Evap.recoveryFactor);
        sprintf(&JX[strlen(JX)], "\"recoveryPattern\":%d,\n", Evap.recoveryPattern);
        sprintf(&JX[strlen(JX)], "\"tSeries\":%d,\n", Evap.tSeries);
        sprintf(&JX[strlen(JX)], "\"type\":%d,\n", Evap.type);
        sprintf(&JX[strlen(JX)], "\"rate\":%f\n", Evap.rate);

        strcat(JX, "},\n");
        // end EVAPORATION 
        // Adjust
        strcat(JX, "\n\"Adjust\": {\n");

        sprintf(&JX[strlen(JX)], "\"rainFactor\":%f,\n", Adjust.rainFactor);
        sprintf(&JX[strlen(JX)], "\"hydconFactor\":%f,\n", Adjust.hydconFactor);

        strcat(JX, "\"temp\":[");
        for(int i = 0; i < 12; i++){
            sprintf(&JX[strlen(JX)], "%f\n\t", Adjust.temp[i]);
            if(i < 11){
                strcat(JX, ",");
            } else {
                strcat(JX, "],\n");
            }
        }

        strcat(JX, "\"evap\":[");
        for(int i = 0; i < 12; i++){
            sprintf(&JX[strlen(JX)], "%f\n\t", Adjust.evap[i]);
            if(i < 11){
                strcat(JX, ",");
            } else {
                strcat(JX, "],\n");
            }
        }

        strcat(JX, "\"rain\":[");
        for(int i = 0; i < 12; i++){
            sprintf(&JX[strlen(JX)], "%f\n\t", Adjust.rain[i]);
            if(i < 11){
                strcat(JX, ",");
            } else {
                strcat(JX, "],\n");
            }
        }

        strcat(JX, "\"hydcon\":[");
        for(int i = 0; i < 12; i++){
            sprintf(&JX[strlen(JX)], "%f\n\t", Adjust.hydcon[i]);
            if(i < 11){
                strcat(JX, ",");
            } else {
                strcat(JX, "]\n");
            }
        }

        strcat(JX, "},\n");

        // end Adjust 
        // Gage
        strcat(JX, "\n\"Gage\": [\n");
        // Get array size
        arrayN = Nobjects[GAGE];
        for (int i=0; i<arrayN; i++){
            sprintf(&JX[strlen(JX)], "\t{\"ID\":\"%s\",\n", Gage[i].ID);
            sprintf(&JX[strlen(JX)], "\t\"dataSource\":%d,\n", Gage[i].dataSource);
            sprintf(&JX[strlen(JX)], "\t\"tSeries\":%d,\n", Gage[i].tSeries);
            sprintf(&JX[strlen(JX)], "\t\"fname\":\"%s\",\n", Gage[i].fname);
            sprintf(&JX[strlen(JX)], "\t\"staID\":\"%s\",\n", Gage[i].staID);
            sprintf(&JX[strlen(JX)], "\t\"startFileDate\":%f,\n", Gage[i].startFileDate);
            sprintf(&JX[strlen(JX)], "\t\"endFileDate\":%f,\n", Gage[i].endFileDate);
            sprintf(&JX[strlen(JX)], "\t\"rainType\":%d,\n", Gage[i].rainType);
            sprintf(&JX[strlen(JX)], "\t\"rainInterval\":%d,\n", Gage[i].rainInterval);
            sprintf(&JX[strlen(JX)], "\t\"rainUnits\":%d,\n", Gage[i].rainUnits);
            sprintf(&JX[strlen(JX)], "\t\"snowFactor\":%f,\n", Gage[i].snowFactor);
            sprintf(&JX[strlen(JX)], "\t\"unitsFactor\":%f,\n", Gage[i].unitsFactor);
            sprintf(&JX[strlen(JX)], "\t\"coGage\":%d}\n", Gage[i].coGage);

            if(i != arrayN-1) strcat(JX, ",");
        }
        strcat(JX, "],\n");

        // end Gage 
        // Temp
        strcat(JX, "\n\"Temp\": {\n");

        sprintf(&JX[strlen(JX)], "\"dataSource\":%d,\n", Temp.dataSource);
        sprintf(&JX[strlen(JX)], "\"tSeries\":%d,\n", Temp.tSeries);
        sprintf(&JX[strlen(JX)], "\"fileStartDate\":%f,\n", Temp.fileStartDate);
        sprintf(&JX[strlen(JX)], "\"elev\":%f,\n", Temp.elev);
        sprintf(&JX[strlen(JX)], "\"anglat\":%f,\n", Temp.anglat);
        sprintf(&JX[strlen(JX)], "\"dtlong\":%f\n", Temp.dtlong);

        strcat(JX, "},\n");
        
        // end Temp 
        // Fclimate
        strcat(JX, "\n\"Fclimate\": {\n");

        sprintf(&JX[strlen(JX)], "\"name\":\"%s\",\n", Fclimate.name);
        sprintf(&JX[strlen(JX)], "\"mode\":%d,\n", Fclimate.mode);
        sprintf(&JX[strlen(JX)], "\"state\":%d\n", Fclimate.state);

        strcat(JX, "},\n");
        
        // end Fclimate 
        // Wind
        strcat(JX, "\n\"Wind\": {\n");

        sprintf(&JX[strlen(JX)], "\"type\":%d,\n", Wind.type);

        strcat(JX, "\"aws\":[");
        for(int i = 0; i < 12; i++){
            sprintf(&JX[strlen(JX)], "%f\n\t", Wind.aws[i]);
            if(i < 11){
                strcat(JX, ",");
            } else {
                strcat(JX, "]\n");
            }
        }

        strcat(JX, "},\n");

        // end Wind 
        // Snow
        strcat(JX, "\n\"Snow\": {\n");

        sprintf(&JX[strlen(JX)], "\"snotmp\":%f,\n", Snow.snotmp);
        sprintf(&JX[strlen(JX)], "\"tipm\":%f,\n", Snow.tipm);
        sprintf(&JX[strlen(JX)], "\"rnm\":%f,\n", Snow.rnm);

        strcat(JX, "\"adc\":[[");
        for(int i = 0; i < 2; i++){
            for(int ii = 0; ii < 10; ii++){
                sprintf(&JX[strlen(JX)], "%f\n\t", Snow.adc[i][ii]);
                if(ii < 9){
                    strcat(JX, ",");
                } else {
                    strcat(JX, "]\n");
                }
            }
            if(i < 1){
                strcat(JX, ",[");
            } else {
                strcat(JX, "]\n");
            }
        }
        strcat(JX, "},\n");


        // end Snow 
        // Subcatch
        strcat(JX, "\n\"Subcatch\": [\n");
        // Get array size
        arrayN = Nobjects[SUBCATCH];
        for (int i=0; i<arrayN; i++){
            sprintf(&JX[strlen(JX)], "\t{\"ID\":\"%s\",\n", Subcatch[i].ID);
            sprintf(&JX[strlen(JX)], "\t\"rptFlag\":%d,\n", Subcatch[i].rptFlag);
            sprintf(&JX[strlen(JX)], "\t\"gage\":%d,\n", Subcatch[i].gage);
            sprintf(&JX[strlen(JX)], "\t\"outNode\":%d,\n", Subcatch[i].outNode);
            sprintf(&JX[strlen(JX)], "\t\"outSubcatch\":%d,\n", Subcatch[i].outSubcatch);
            sprintf(&JX[strlen(JX)], "\t\"infilModel\":%d,\n", Subcatch[i].infilModel);
            sprintf(&JX[strlen(JX)], "\t\"infil\":%d,\n", Subcatch[i].infil);

            // Sub-areas
            strcat(JX, "\"subArea\":[{");
            for(int j = 0; j < 3; j++){
                sprintf(&JX[strlen(JX)], "\t\"routeTo\":%d,\n", Subcatch[i].subArea[j].routeTo);
                sprintf(&JX[strlen(JX)], "\t\"fOutlet\":%f,\n", Subcatch[i].subArea[j].fOutlet);
                sprintf(&JX[strlen(JX)], "\t\"N\":%f,\n", Subcatch[i].subArea[j].N);
                sprintf(&JX[strlen(JX)], "\t\"fArea\":%f,\n", Subcatch[i].subArea[j].fArea);
                sprintf(&JX[strlen(JX)], "\t\"dStore\":%f\n", Subcatch[i].subArea[j].dStore);

                if(j < 2){
                    strcat(JX, "},\n{");
                } else {
                    strcat(JX, "}\n");
                }
            }
            strcat(JX, "],\n");

            sprintf(&JX[strlen(JX)], "\t\"width\":%f,\n", Subcatch[i].width);
            sprintf(&JX[strlen(JX)], "\t\"area\":%f,\n", Subcatch[i].area);
            sprintf(&JX[strlen(JX)], "\t\"fracImperv\":%f,\n", Subcatch[i].fracImperv);
            sprintf(&JX[strlen(JX)], "\t\"slope\":%f,\n", Subcatch[i].slope);
            sprintf(&JX[strlen(JX)], "\t\"curbLength\":%f,\n", Subcatch[i].curbLength);
            
            strcat(JX, "\"initBuildup\":[");
            for(int j = 0; j < Nobjects[POLLUT]; j++){
                sprintf(&JX[strlen(JX)], "%f\n\t", Subcatch[i].initBuildup[j]);
                if(j < Nobjects[POLLUT]-1){
                    strcat(JX, ",");
                } else {
                    strcat(JX, "],\n");
                }
            }

            // array of land use factors
            strcat(JX, "\"landFactor\":[{");
            for(int j = 0; j < Nobjects[LANDUSE]; j++){
                sprintf(&JX[strlen(JX)], "\t\"fraction\":%f,\n", Subcatch[i].landFactor[j].fraction);

                //buildup
                strcat(JX, "\"buildup\":[");
                for(int k = 0; k < Nobjects[POLLUT]; k++){
                    sprintf(&JX[strlen(JX)], "%f\n\t", Subcatch[i].landFactor[j].buildup[k]);
                    if(k < Nobjects[POLLUT]-1){
                        strcat(JX, ",");
                    } else {
                        strcat(JX, "],\n");
                    }
                }
                sprintf(&JX[strlen(JX)], "\t\"lastSwept\":%f\n", Subcatch[i].landFactor[j].lastSwept);

                if(j < Nobjects[LANDUSE]-1){
                    strcat(JX, "},\n{");
                } else {
                    strcat(JX, "}\n");
                }
            }
            strcat(JX, "],\n");

            // associated groundwater data
            strcat(JX, "\t\"groundwater\":{\n");

            sprintf(&JX[strlen(JX)], "\t\t\"aquifer\":%d,\n", Subcatch[i].groundwater->aquifer);
            sprintf(&JX[strlen(JX)], "\t\t\"node\":%d,\n", Subcatch[i].groundwater->node);
            sprintf(&JX[strlen(JX)], "\t\t\"surfElev\":%f,\n", Subcatch[i].groundwater->surfElev);
            sprintf(&JX[strlen(JX)], "\t\t\"a1\":%f,\n", Subcatch[i].groundwater->a1);
            sprintf(&JX[strlen(JX)], "\t\t\"a2\":%f,\n", Subcatch[i].groundwater->a2);
            sprintf(&JX[strlen(JX)], "\t\t\"a3\":%f,\n", Subcatch[i].groundwater->a3);
            sprintf(&JX[strlen(JX)], "\t\t\"b1\":%f,\n", Subcatch[i].groundwater->b1);
            sprintf(&JX[strlen(JX)], "\t\t\"b2\":%f,\n", Subcatch[i].groundwater->b2);
            sprintf(&JX[strlen(JX)], "\t\t\"fixedDepth\":%f,\n", Subcatch[i].groundwater->fixedDepth);
            sprintf(&JX[strlen(JX)], "\t\t\"nodeElev\":%f,\n", Subcatch[i].groundwater->nodeElev);
            sprintf(&JX[strlen(JX)], "\t\t\"bottomElev\":%f,\n", Subcatch[i].groundwater->bottomElev);
            sprintf(&JX[strlen(JX)], "\t\t\"waterTableElev\":%f,\n", Subcatch[i].groundwater->waterTableElev);
            sprintf(&JX[strlen(JX)], "\t\t\"upperMoisture\":%f\n", Subcatch[i].groundwater->upperMoisture);

            strcat(JX, "},\n");

            // gwLatFlowExpr
            // This is a variable length array of ExprNode structs.
            // int opcode, int ivar, double fvalue
            // array of ExprNode structs
            strcat(JX, "\"gwLatFlowExpr\":[");

            if(Subcatch[i].gwLatFlowExpr){
                
                // rewind the expression
                while(Subcatch[i].gwLatFlowExpr->prev) Subcatch[i].gwLatFlowExpr = Subcatch[i].gwLatFlowExpr->prev;

                // record the expression
                for(struct ExprNode *this = Subcatch[i].gwLatFlowExpr; this; this = this->next){
                    strcat(JX, "{");

                    sprintf(&JX[strlen(JX)], "\t\"opcode\":%d,\n", this->opcode);
                    sprintf(&JX[strlen(JX)], "\t\"ivar\":%d,\n", this->ivar);
                    sprintf(&JX[strlen(JX)], "\t\"fvalue\":%f\n", this->fvalue);

                    strcat(JX, "}");
                    if(this->next) strcat(JX, ",");
                }
            }
            strcat(JX, "],");

            // gwDeepFlowExpr
            // This is a variable length array of ExprNode structs.
            // int opcode, int ivar, double fvalue
            // array of ExprNode structs
            strcat(JX, "\"gwDeepFlowExpr\":[");

            if(Subcatch[i].gwDeepFlowExpr){
                
                // rewind the expression
                while(Subcatch[i].gwDeepFlowExpr->prev) Subcatch[i].gwDeepFlowExpr = Subcatch[i].gwDeepFlowExpr->prev;

                // record the expression
                for(struct ExprNode *this = Subcatch[i].gwDeepFlowExpr; this; this = this->next){
                    strcat(JX, "{");

                    sprintf(&JX[strlen(JX)], "\t\"opcode\":%d,\n", this->opcode);
                    sprintf(&JX[strlen(JX)], "\t\"ivar\":%d,\n", this->ivar);
                    sprintf(&JX[strlen(JX)], "\t\"fvalue\":%f\n", this->fvalue);

                    strcat(JX, "}");
                    if(this->next) strcat(JX, ",");
                }
            }
            strcat(JX, "],");

            strcat(JX, "\"snowpack\":{");

            if(Subcatch[i].snowpack){
                sprintf(&JX[strlen(JX)], "\t\"snowmeltIndex\":%d,\n", Subcatch[i].snowpack->snowmeltIndex);

                strcat(JX, "\t\"fArea\":[");
                for(int j = 0; j < 3; j++){
                    sprintf(&JX[strlen(JX)], "%f\n\t", Subcatch[i].snowpack->fArea[j]);
                    if(j < 2){
                        strcat(JX, ",");
                    } else {
                        strcat(JX, "],\n");
                    }
                }

                strcat(JX, "\t\"wsnow\":[");
                for(int j = 0; j < 3; j++){
                    sprintf(&JX[strlen(JX)], "%f\n\t", Subcatch[i].snowpack->wsnow[j]);
                    if(j < 2){
                        strcat(JX, ",");
                    } else {
                        strcat(JX, "],\n");
                    }
                }

                strcat(JX, "\t\"fw\":[");
                for(int j = 0; j < 3; j++){
                    sprintf(&JX[strlen(JX)], "%f\n\t", Subcatch[i].snowpack->fw[j]);
                    if(j < 2){
                        strcat(JX, ",");
                    } else {
                        strcat(JX, "],\n");
                    }
                }
                
                strcat(JX, "\t\"coldc\":[");
                for(int j = 0; j < 3; j++){
                    sprintf(&JX[strlen(JX)], "%f\n\t", Subcatch[i].snowpack->coldc[j]);
                    if(j < 2){
                        strcat(JX, ",");
                    } else {
                        strcat(JX, "],\n");
                    }
                }

                strcat(JX, "\t\"ati\":[");
                for(int j = 0; j < 3; j++){
                    sprintf(&JX[strlen(JX)], "%f\n\t", Subcatch[i].snowpack->ati[j]);
                    if(j < 2){
                        strcat(JX, ",");
                    } else {
                        strcat(JX, "],\n");
                    }
                }

                strcat(JX, "\t\"sba\":[");
                for(int j = 0; j < 3; j++){
                    sprintf(&JX[strlen(JX)], "%f\n\t", Subcatch[i].snowpack->sba[j]);
                    if(j < 2){
                        strcat(JX, ",");
                    } else {
                        strcat(JX, "],\n");
                    }
                }
    
                strcat(JX, "\t\"awe\":[");
                for(int j = 0; j < 3; j++){
                    sprintf(&JX[strlen(JX)], "%f\n\t", Subcatch[i].snowpack->awe[j]);
                    if(j < 2){
                        strcat(JX, ",");
                    } else {
                        strcat(JX, "],\n");
                    }
                }
                
                strcat(JX, "\t\"sbws\":[");
                for(int j = 0; j < 3; j++){
                    sprintf(&JX[strlen(JX)], "%f\n\t", Subcatch[i].snowpack->sbws[j]);
                    if(j < 2){
                        strcat(JX, ",");
                    } else {
                        strcat(JX, "],\n");
                    }
                }
                
                strcat(JX, "\t\"imelt\":[");
                for(int j = 0; j < 3; j++){
                    sprintf(&JX[strlen(JX)], "%f\n\t", Subcatch[i].snowpack->imelt[j]);
                    if(j < 2){
                        strcat(JX, ",");
                    } else {
                        strcat(JX, "]\n");
                    }
                }
            }

            strcat(JX, "},");
            
            sprintf(&JX[strlen(JX)], "\t\t\"nPervPattern\":%d,\n", Subcatch[i].nPervPattern);
            sprintf(&JX[strlen(JX)], "\t\t\"dStorePattern\":%d,\n", Subcatch[i].dStorePattern);
            sprintf(&JX[strlen(JX)], "\t\t\"infilPattern\":%d\n", Subcatch[i].infilPattern);

            if(i != arrayN-1) strcat(JX, "},");
            else strcat(JX, "}");
        }
        strcat(JX, "],\n");

        // end Subcatch 
        // Node
        strcat(JX, "\n\"Node\": [\n");
        // Get array size
        arrayN = Nobjects[NODE];
        for (int i=0; i<arrayN; i++){
            sprintf(&JX[strlen(JX)], "\t{\"ID\":\"%s\",\n", Node[i].ID);
            sprintf(&JX[strlen(JX)], "\t\"type\":%d,\n", Node[i].type);
            sprintf(&JX[strlen(JX)], "\t\"subIndex\":%d,\n", Node[i].subIndex);
            sprintf(&JX[strlen(JX)], "\t\"rptFlag\":%d,\n", Node[i].rptFlag);
            sprintf(&JX[strlen(JX)], "\t\"invertElev\":%f,\n", Node[i].invertElev);
            sprintf(&JX[strlen(JX)], "\t\"initDepth\":%f,\n", Node[i].initDepth);
            sprintf(&JX[strlen(JX)], "\t\"fullDepth\":%f,\n", Node[i].fullDepth);
            sprintf(&JX[strlen(JX)], "\t\"surDepth\":%f,\n", Node[i].surDepth);
            sprintf(&JX[strlen(JX)], "\t\"pondedArea\":%f,\n", Node[i].pondedArea);
            
            // extInflow
            // This is a variable length array of ExtInflow structs.
            strcat(JX, "\"extInflow\":[");
            if(Node[i].extInflow){
                //for(struct ExprNode *this = Subcatch[i].gwDeepFlowExpr; this; this = this->next){
                for(struct ExtInflow *this = Node[i].extInflow; this; this = this->next){
                    strcat(JX, "{");

                    sprintf(&JX[strlen(JX)], "\t\"param\":%d,\n", this->param);
                    sprintf(&JX[strlen(JX)], "\t\"type\":%d,\n", this->type);
                    sprintf(&JX[strlen(JX)], "\t\"tSeries\":%d,\n", this->tSeries);
                    sprintf(&JX[strlen(JX)], "\t\"basePat\":%d,\n", this->basePat);
                    sprintf(&JX[strlen(JX)], "\t\"cFactor\":%f,\n", this->cFactor);
                    sprintf(&JX[strlen(JX)], "\t\"baseline\":%f,\n", this->baseline);
                    sprintf(&JX[strlen(JX)], "\t\"sFactor\":%f,\n", this->sFactor);
                    sprintf(&JX[strlen(JX)], "\t\"extIfaceInflow\":%f\n", this->extIfaceInflow);

                    strcat(JX, "}\n");
                    if(this->next) strcat(JX, ",");
                }
            }
            strcat(JX, "],");

            // dwfInflow
            // This is a variable length array of DwfInflow structs.
            strcat(JX, "\"dwfInflow\":[");
            if(Node[i].dwfInflow){
                for(struct DwfInflow *this = Node[i].dwfInflow; this; this = this->next){
                    strcat(JX, "{");

                    sprintf(&JX[strlen(JX)], "\t\"param\":%d,\n", this->param);
                    sprintf(&JX[strlen(JX)], "\t\"avgValue\":%f,\n", this->avgValue);
                    strcat(JX, "\t\"patterns\":[");
                    for(int j = 0; j < 4; j++){
                        sprintf(&JX[strlen(JX)], "%d\n\t", this->patterns[j]);
                        if(j < 3){
                            strcat(JX, ",");
                        } else {
                            strcat(JX, "]\n");
                        }
                    }

                    strcat(JX, "}\n");
                    if(this->next) strcat(JX, ",");
                }
            }
            strcat(JX, "],");

            // rdiiInflow
            // This is a variable length array of TRdiiInflow structs.
            strcat(JX, "\"rdiiInflow\":");
            if(Node[i].rdiiInflow){
                strcat(JX, "{");

                sprintf(&JX[strlen(JX)], "\t\"unitHyd\":%d,\n", Node[i].rdiiInflow->unitHyd);
                sprintf(&JX[strlen(JX)], "\t\"area\":%f\n", Node[i].rdiiInflow->area);

                strcat(JX, "}");
            } else {
                strcat(JX, "null");
            }
            strcat(JX, ",\n");

            // treatment
            // This is a nullable TTreatment struct.
            strcat(JX, "\"treatment\":");
            if(Node[i].treatment){
                sprintf(&JX[strlen(JX)], "\t{\"treatType\":%d,\n", Node[i].treatment->treatType);

                // equation
                // This is a variable length array of ExprNode structs.
                // int opcode, int ivar, double fvalue
                // array of ExprNode structs
                strcat(JX, "\t\"equation\":[");

                if(Node[i].treatment->equation){
                    
                    // rewind the expression
                    while(Node[i].treatment->equation->prev) Node[i].treatment->equation = Node[i].treatment->equation->prev;

                    // record the expression
                    for(struct ExprNode *this = Node[i].treatment->equation; this; this = this->next){
                        strcat(JX, "\t{");

                        sprintf(&JX[strlen(JX)], "\t\t\"opcode\":%d,\n", this->opcode);
                        sprintf(&JX[strlen(JX)], "\t\t\"ivar\":%d,\n", this->ivar);
                        sprintf(&JX[strlen(JX)], "\t\t\"fvalue\":%f\n", this->fvalue);

                        strcat(JX, "\t}");
                        if(this->next) strcat(JX, ",");
                    }
                }
                strcat(JX, "\t}");
            } else {
                strcat(JX, "null");
            }

            sprintf(&JX[strlen(JX)], "\t}\n");

            if(i != arrayN-1) strcat(JX, ",");
        }
        strcat(JX, "],\n");

        // end Node 
        // Infil
        strcat(JX, "\n\"Infil\": [\n");
        // Get array size
        arrayN = Nobjects[SUBCATCH];
        for (int i=0; i<arrayN; i++){
            // Infil[i] is the infil for subcatchment i. It has 3 objects:
            // horton (THorton)
            // grnAmpt (TGrnAmpt)
            // curveNum (TCurveNum)
            sprintf(&JX[strlen(JX)], "\t{\"horton\":\n");
            if ( Subcatch[i].infilModel == HORTON ||                       
                 Subcatch[i].infilModel == MOD_HORTON ){
                double p[5];
                horton_getInput(i, p);
                sprintf(&JX[strlen(JX)], "\t\t{\"f0\":%f,\n", p[0]);
                sprintf(&JX[strlen(JX)], "\t\t\"fmin\":%f,\n", p[1]);
                sprintf(&JX[strlen(JX)], "\t\t\"Fmax\":%f,\n", p[2]);
                sprintf(&JX[strlen(JX)], "\t\t\"decay\":%f,\n", p[3]);
                sprintf(&JX[strlen(JX)], "\t\t\"regen\":%f},\n", p[4]);
            } else { sprintf(&JX[strlen(JX)], "null,\n"); }
            sprintf(&JX[strlen(JX)], "\t\n");
            
            sprintf(&JX[strlen(JX)], "\t\"grnAmpt\":\n");
            if ( Subcatch[i].infilModel == GREEN_AMPT ||                       
                 Subcatch[i].infilModel == MOD_GREEN_AMPT ){
                double p[3];
                grnampt_getInput(i, p);
                sprintf(&JX[strlen(JX)], "\t\t{\"S\":%f,\n", p[0]);
                sprintf(&JX[strlen(JX)], "\t\t\"Ks\":%f,\n", p[1]);
                sprintf(&JX[strlen(JX)], "\t\t\"IMDmax\":%f},\n", p[2]);
            } else { sprintf(&JX[strlen(JX)], "null,\n"); }
            sprintf(&JX[strlen(JX)], "\t\n");

            sprintf(&JX[strlen(JX)], "\t\"curveNum\":\n");
            if ( Subcatch[i].infilModel == CURVE_NUMBER ){
                double p[5];
                curveNumber_getInput(i, p);
                sprintf(&JX[strlen(JX)], "\t\t{\"Smax\":%f,\n", p[0]);
                sprintf(&JX[strlen(JX)], "\t\t\"regen\":%f,\n", p[1]);
                sprintf(&JX[strlen(JX)], "\t\t\"Tmax\":%f}\n", p[2]);
            } else { sprintf(&JX[strlen(JX)], "null\n"); }
            sprintf(&JX[strlen(JX)], "\t\n");

            if(i != arrayN-1) strcat(JX, "},");
            else strcat(JX, "}");
        }
        strcat(JX, "],\n");

        // end Infil 
        // Aquifer
        strcat(JX, "\n\"Aquifer\": [\n");
        // Get array size
        arrayN = Nobjects[AQUIFER];
        for (int i=0; i<arrayN; i++){
            sprintf(&JX[strlen(JX)], "\t{\"ID\":\"%s\",\n", Aquifer[i].ID);
            sprintf(&JX[strlen(JX)], "\t\"porosity\":%f,\n", Aquifer[i].porosity);
            sprintf(&JX[strlen(JX)], "\t\"wiltingPoint\":%f,\n", Aquifer[i].wiltingPoint);
            sprintf(&JX[strlen(JX)], "\t\"fieldCapacity\":%f,\n", Aquifer[i].fieldCapacity);
            sprintf(&JX[strlen(JX)], "\t\"conductivity\":%f,\n", Aquifer[i].conductivity);
            sprintf(&JX[strlen(JX)], "\t\"conductSlope\":%f,\n", Aquifer[i].conductSlope);
            sprintf(&JX[strlen(JX)], "\t\"tensionSlope\":%f,\n", Aquifer[i].tensionSlope);
            sprintf(&JX[strlen(JX)], "\t\"upperEvapFrac\":%f,\n", Aquifer[i].upperEvapFrac);
            sprintf(&JX[strlen(JX)], "\t\"lowerEvapDepth\":%f,\n", Aquifer[i].lowerEvapDepth);
            sprintf(&JX[strlen(JX)], "\t\"lowerLossCoeff\":%f,\n", Aquifer[i].lowerLossCoeff);
            sprintf(&JX[strlen(JX)], "\t\"bottomElev\":%f,\n", Aquifer[i].bottomElev);
            sprintf(&JX[strlen(JX)], "\t\"waterTableElev\":%f,\n", Aquifer[i].waterTableElev);
            sprintf(&JX[strlen(JX)], "\t\"upperMoisture\":%f,\n", Aquifer[i].upperMoisture);
            sprintf(&JX[strlen(JX)], "\t\"upperEvapPat\":%d}\n", Aquifer[i].upperEvapPat);

            if(i != arrayN-1) strcat(JX, ",");
        }
        strcat(JX, "],\n");


        // end Aquifer 
        // Snowmelt
        strcat(JX, "\n\"Snowmelt\": [\n");
        // Get array size
        arrayN = Nobjects[SNOWMELT];
        for (int i=0; i<arrayN; i++){
            sprintf(&JX[strlen(JX)], "\t{\"ID\":\"%s\",\n", Snowmelt[i].ID);
            sprintf(&JX[strlen(JX)], "\t\"snn\":%f,\n", Snowmelt[i].snn);

            strcat(JX, "\t\"si\":[");
            for(int j = 0; j < 3; j++){
                sprintf(&JX[strlen(JX)], "%f", Snowmelt[i].si[j]);
                if(j < 2) strcat(JX, ","); else strcat(JX, "],\n");
            }
            strcat(JX, "\t\"dhmin\":[");
            for(int j = 0; j < 3; j++){
                sprintf(&JX[strlen(JX)], "%f", Snowmelt[i].dhmin[j]);
                if(j < 2) strcat(JX, ","); else strcat(JX, "],\n");
            }
            strcat(JX, "\t\"dhmax\":[");
            for(int j = 0; j < 3; j++){
                sprintf(&JX[strlen(JX)], "%f", Snowmelt[i].dhmax[j]);
                if(j < 2) strcat(JX, ","); else strcat(JX, "],\n");
            }
            strcat(JX, "\t\"tbase\":[");
            for(int j = 0; j < 3; j++){
                sprintf(&JX[strlen(JX)], "%f", Snowmelt[i].tbase[j]);
                if(j < 2) strcat(JX, ","); else strcat(JX, "],\n");
            }
            strcat(JX, "\t\"fwfrac\":[");
            for(int j = 0; j < 3; j++){
                sprintf(&JX[strlen(JX)], "%f", Snowmelt[i].fwfrac[j]);
                if(j < 2) strcat(JX, ","); else strcat(JX, "],\n");
            }
            strcat(JX, "\t\"wsnow\":[");
            for(int j = 0; j < 3; j++){
                sprintf(&JX[strlen(JX)], "%f", Snowmelt[i].wsnow[j]);
                if(j < 2) strcat(JX, ","); else strcat(JX, "],\n");
            }
            strcat(JX, "\t\"fwnow\":[");
            for(int j = 0; j < 3; j++){
                sprintf(&JX[strlen(JX)], "%f", Snowmelt[i].fwnow[j]);
                if(j < 2) strcat(JX, ","); else strcat(JX, "],\n");
            }
            sprintf(&JX[strlen(JX)], "\t\"weplow\":%f,\n", Snowmelt[i].weplow);
            strcat(JX, "\t\"sfrac\":[");
            for(int j = 0; j < 5; j++){
                sprintf(&JX[strlen(JX)], "%f", Snowmelt[i].sfrac[j]);
                if(j < 4) strcat(JX, ","); else strcat(JX, "],\n");
            }
            sprintf(&JX[strlen(JX)], "\t\"toSubcatch\":%d}\n", Snowmelt[i].toSubcatch);

            if(i != arrayN-1) strcat(JX, ",");
        }
        strcat(JX, "],\n");

        // end Snowmelt 
        // Outfall
        strcat(JX, "\n\"Outfall\": [\n");
        // Get array size
        arrayN = Nnodes[OUTFALL];
        for (int i=0; i<arrayN; i++){
            sprintf(&JX[strlen(JX)], "\t{\"type\":%d,\n", Outfall[i].type);
            sprintf(&JX[strlen(JX)], "\t\"hasFlapGate\":%d,\n", Outfall[i].hasFlapGate);
            sprintf(&JX[strlen(JX)], "\t\"fixedStage\":%f,\n", Outfall[i].fixedStage);
            sprintf(&JX[strlen(JX)], "\t\"tideCurve\":%d,\n", Outfall[i].tideCurve);
            sprintf(&JX[strlen(JX)], "\t\"stageSeries\":%d,\n", Outfall[i].stageSeries);
            sprintf(&JX[strlen(JX)], "\t\"routeTo\":%d,\n", Outfall[i].routeTo);
            sprintf(&JX[strlen(JX)], "\t\"vRouted\":%f,\n", Outfall[i].vRouted);
            strcat(JX, "\t\"wRouted\":[");
            for(int j = 0; j < Nobjects[POLLUT]; j++){
                sprintf(&JX[strlen(JX)], "%f", Outfall[i].wRouted[j]);
                if(j < Nobjects[POLLUT]-1) strcat(JX, ",");
            }
            strcat(JX, "]\n");
            sprintf(&JX[strlen(JX)], "\t}\n");

            if(i != arrayN-1) strcat(JX, ",");
        }
        strcat(JX, "],");

        // end Outfall 
        // Storage
        strcat(JX, "\n\"Storage\": [\n");
        // Get array size
        arrayN = Nnodes[STORAGE];
        for (int i=0; i<arrayN; i++){
            sprintf(&JX[strlen(JX)], "\t{\"fEvap\":%f,\n", Storage[i].fEvap);
            sprintf(&JX[strlen(JX)], "\t\"aConst\":%f,\n", Storage[i].aConst);
            sprintf(&JX[strlen(JX)], "\t\"aCoeff\":%f,\n", Storage[i].aCoeff);
            sprintf(&JX[strlen(JX)], "\t\"aExpon\":%f,\n", Storage[i].aExpon);
            sprintf(&JX[strlen(JX)], "\t\"aCurve\":%d,\n", Storage[i].aCurve);
            if(Storage[i].exfil){
                sprintf(&JX[strlen(JX)], "\t\"exfil\":{\n");
                if(Storage[i].exfil->btmExfil){
                    sprintf(&JX[strlen(JX)], "\t\t\"btmExfil\":{\n");
                    sprintf(&JX[strlen(JX)], "\t\t\t\"S\":%f,\n", Storage[i].exfil->btmExfil->S);
                    sprintf(&JX[strlen(JX)], "\t\t\t\"Ks\":%f,\n", Storage[i].exfil->btmExfil->Ks);
                    sprintf(&JX[strlen(JX)], "\t\t\t\"IMDmax\":%f\n", Storage[i].exfil->btmExfil->IMDmax);

                    sprintf(&JX[strlen(JX)], "\t\t},\n");
                } else {
                    sprintf(&JX[strlen(JX)], "\t\t\"btmExfil\":null,\n");
                }

                if(Storage[i].exfil->bankExfil){
                    sprintf(&JX[strlen(JX)], "\t\t\"bankExfil\":{\n");
                    sprintf(&JX[strlen(JX)], "\t\t\t\"S\":%f,\n", Storage[i].exfil->bankExfil->S);
                    sprintf(&JX[strlen(JX)], "\t\t\t\"Ks\":%f,\n", Storage[i].exfil->bankExfil->Ks);
                    sprintf(&JX[strlen(JX)], "\t\t\t\"IMDmax\":%f\n", Storage[i].exfil->bankExfil->IMDmax);

                    sprintf(&JX[strlen(JX)], "\t\t},\n");
                } else {
                    sprintf(&JX[strlen(JX)], "\t\t\"bankExfil\":null,\n");
                }

                sprintf(&JX[strlen(JX)], "\t\t\"btmArea\":%f,\n", Storage[i].exfil->btmArea);
                sprintf(&JX[strlen(JX)], "\t\t\"bankMinDepth\":%f,\n", Storage[i].exfil->bankMinDepth);
                sprintf(&JX[strlen(JX)], "\t\t\"bankMaxDepth\":%f,\n", Storage[i].exfil->bankMaxDepth);
                sprintf(&JX[strlen(JX)], "\t\t\"bankMaxArea\":%f}\n", Storage[i].exfil->bankMaxArea);
            } else {
                sprintf(&JX[strlen(JX)], "\t\"exfil\":null}\n");
            }


            if(i != arrayN-1) strcat(JX, ",");
        }
        strcat(JX, "],\n");

        // end Storage 
        // Divider
        strcat(JX, "\n\"Divider\": [\n");
        // Get array size
        arrayN = Nnodes[DIVIDER];
        for (int i=0; i<arrayN; i++){
            sprintf(&JX[strlen(JX)], "\t{\"link\":%d,\n", Divider[i].link);
            sprintf(&JX[strlen(JX)], "\t\"type\":%d,\n", Divider[i].type);
            sprintf(&JX[strlen(JX)], "\t\"qMin\":%f,\n", Divider[i].qMin);
            sprintf(&JX[strlen(JX)], "\t\"qMax\":%f,\n", Divider[i].qMax);
            sprintf(&JX[strlen(JX)], "\t\"dhMax\":%f,\n", Divider[i].dhMax);
            sprintf(&JX[strlen(JX)], "\t\"cWeir\":%f,\n", Divider[i].cWeir);
            sprintf(&JX[strlen(JX)], "\t\"flowCurve\":%d\n", Divider[i].flowCurve);
            sprintf(&JX[strlen(JX)], "\t}\n");

            if(i != arrayN-1) strcat(JX, ",");
        }
        strcat(JX, "],\n");

        // end Divider 
        // Conduit
        strcat(JX, "\n\"Conduit\": [\n");
        // Get array size
        arrayN = Nlinks[CONDUIT];
        for (int i=0; i<arrayN; i++){
            sprintf(&JX[strlen(JX)], "\t{\"length\":%f,\n", Conduit[i].length);
            sprintf(&JX[strlen(JX)], "\t\"roughness\":%f,\n", Conduit[i].roughness);
            sprintf(&JX[strlen(JX)], "\t\"barrels\":%d\n", Conduit[i].barrels);
            sprintf(&JX[strlen(JX)], "\t}\n");

            if(i != arrayN-1) strcat(JX, ",");
        }
        strcat(JX, "],\n");

        // end Conduit 
        // Pump
        strcat(JX, "\n\"Pump\": [\n");
        // Get array size
        arrayN = Nlinks[PUMP];
        for (int i=0; i<arrayN; i++){
            sprintf(&JX[strlen(JX)], "\t{\"type\":%d,\n", Pump[i].type);
            sprintf(&JX[strlen(JX)], "\t\"pumpCurve\":%d,\n", Pump[i].pumpCurve);
            sprintf(&JX[strlen(JX)], "\t\"initSetting\":%f,\n", Pump[i].initSetting);
            sprintf(&JX[strlen(JX)], "\t\"yOn\":%f,\n", Pump[i].yOn);
            sprintf(&JX[strlen(JX)], "\t\"yOff\":%f,\n", Pump[i].yOff);
            sprintf(&JX[strlen(JX)], "\t\"xMin\":%f,\n", Pump[i].xMin);
            sprintf(&JX[strlen(JX)], "\t\"xMax\":%f\n", Pump[i].xMax);
            sprintf(&JX[strlen(JX)], "\t}\n");

            if(i != arrayN-1) strcat(JX, ",");
        }
        strcat(JX, "],\n");

        // end Pump 
        // Orifice
        strcat(JX, "\n\"Orifice\": [\n");
        // Get array size
        arrayN = Nlinks[ORIFICE];
        for (int i=0; i<arrayN; i++){
            sprintf(&JX[strlen(JX)], "\t{\"type\":%d,\n", Orifice[i].type);
            sprintf(&JX[strlen(JX)], "\t\"shape\":%d,\n", Orifice[i].shape);
            sprintf(&JX[strlen(JX)], "\t\"cDisch\":%f,\n", Orifice[i].cDisch);
            sprintf(&JX[strlen(JX)], "\t\"orate\":%f\n", Orifice[i].orate);
            sprintf(&JX[strlen(JX)], "\t}\n");

            if(i != arrayN-1) strcat(JX, ",");
        }
        strcat(JX, "],\n");

        // end Orifice 
        // Weir
        strcat(JX, "\n\"Weir\": [\n");
        // Get array size
        arrayN = Nlinks[WEIR];
        for (int i=0; i<arrayN; i++){
            sprintf(&JX[strlen(JX)], "\t{\"type\":%d,\n", Weir[i].type);
            sprintf(&JX[strlen(JX)], "\t\"cDisch1\":%f,\n", Weir[i].cDisch1);
            sprintf(&JX[strlen(JX)], "\t\"cDisch2\":%f,\n", Weir[i].cDisch2);
            sprintf(&JX[strlen(JX)], "\t\"endCon\":%f,\n", Weir[i].endCon);
            sprintf(&JX[strlen(JX)], "\t\"canSurcharge\":%d,\n", Weir[i].canSurcharge);
            sprintf(&JX[strlen(JX)], "\t\"roadWidth\":%f,\n", Weir[i].roadWidth);
            sprintf(&JX[strlen(JX)], "\t\"roadSurface\":%d,\n", Weir[i].roadSurface);
            sprintf(&JX[strlen(JX)], "\t\"cdCurve\":%d\n", Weir[i].cdCurve);
            sprintf(&JX[strlen(JX)], "\t}\n");

            if(i != arrayN-1) strcat(JX, ",");
        }
        strcat(JX, "],\n");

        // end Weir 
        // Outlet
        strcat(JX, "\n\"Outlet\": [\n");
        // Get array size
        arrayN = Nlinks[OUTLET];
        for (int i=0; i<arrayN; i++){
            sprintf(&JX[strlen(JX)], "\t{\"qCoeff\":%f,\n", Outlet[i].qCoeff);
            sprintf(&JX[strlen(JX)], "\t\"qExpon\":%f,\n", Outlet[i].qExpon);
            sprintf(&JX[strlen(JX)], "\t\"qCurve\":%d,\n", Outlet[i].qCurve);
            sprintf(&JX[strlen(JX)], "\t\"curveType\":%d\n", Outlet[i].curveType);
            sprintf(&JX[strlen(JX)], "\t}\n");

            if(i != arrayN-1) strcat(JX, ",");
        }
        strcat(JX, "],\n");

        // end Outlet 
        // Link (includes XSECTION)
        strcat(JX, "\n\"Link\": [\n");
        // Get array size
        arrayN = Nobjects[LINK];
        for (int i=0; i<arrayN; i++){
            sprintf(&JX[strlen(JX)], "\t{\"ID\":\"%s\",\n", Link[i].ID);
            sprintf(&JX[strlen(JX)], "\t\"type\":%d,\n", Link[i].type);
            sprintf(&JX[strlen(JX)], "\t\"subIndex\":%d,\n", Link[i].subIndex);
            sprintf(&JX[strlen(JX)], "\t\"rptFlag\":%d,\n", Link[i].rptFlag);
            sprintf(&JX[strlen(JX)], "\t\"node1\":%d,\n", Link[i].node1);
            sprintf(&JX[strlen(JX)], "\t\"node2\":%d,\n", Link[i].node2);
            sprintf(&JX[strlen(JX)], "\t\"offset1\":%f,\n", Link[i].offset1);
            sprintf(&JX[strlen(JX)], "\t\"offset2\":%f,\n", Link[i].offset2);
            // xsect
            sprintf(&JX[strlen(JX)], "\t\"xsect\":{\n");
            sprintf(&JX[strlen(JX)], "\t\t\"type\":%d,\n", Link[i].xsect.type);
            sprintf(&JX[strlen(JX)], "\t\t\"culvertCode\":%d,\n", Link[i].xsect.culvertCode);
            sprintf(&JX[strlen(JX)], "\t\t\"transect\":%d,\n", Link[i].xsect.transect);
            sprintf(&JX[strlen(JX)], "\t\t\"yFull\":%f,\n", Link[i].xsect.yFull);
            sprintf(&JX[strlen(JX)], "\t\t\"wMax\":%f,\n", Link[i].xsect.wMax);
            sprintf(&JX[strlen(JX)], "\t\t\"ywMax\":%f,\n", Link[i].xsect.ywMax);
            sprintf(&JX[strlen(JX)], "\t\t\"aFull\":%f,\n", Link[i].xsect.aFull);
            sprintf(&JX[strlen(JX)], "\t\t\"rFull\":%f,\n", Link[i].xsect.rFull);
            sprintf(&JX[strlen(JX)], "\t\t\"sFull\":%f,\n", Link[i].xsect.sFull);
            sprintf(&JX[strlen(JX)], "\t\t\"sMax\":%f\n", Link[i].xsect.sMax);
            sprintf(&JX[strlen(JX)], "\t},\n");
            sprintf(&JX[strlen(JX)], "\t\"q0\":%f,\n", Link[i].q0);
            sprintf(&JX[strlen(JX)], "\t\"qLimit\":%f,\n", Link[i].qLimit);
            sprintf(&JX[strlen(JX)], "\t\"cLossInlet\":%f,\n", Link[i].cLossInlet);
            sprintf(&JX[strlen(JX)], "\t\"cLossOutlet\":%f,\n", Link[i].cLossOutlet);
            sprintf(&JX[strlen(JX)], "\t\"cLossAvg\":%f,\n", Link[i].cLossAvg);
            sprintf(&JX[strlen(JX)], "\t\"seepRate\":%f,\n", Link[i].seepRate);
            sprintf(&JX[strlen(JX)], "\t\"hasFlapGate\":%d\n", Link[i].hasFlapGate);
            sprintf(&JX[strlen(JX)], "\t}\n");

            if(i != arrayN-1) strcat(JX, ",");
        }
        strcat(JX, "],\n");

        // end Link 
        // Transect
        strcat(JX, "\n\"Transect\": [\n");
        // Get array size
        arrayN = Nobjects[TRANSECT];
        for (int i=0; i<arrayN; i++){
            sprintf(&JX[strlen(JX)], "\t{\"ID\":\"%s\",\n", Transect[i].ID);
            sprintf(&JX[strlen(JX)], "\t\"yFull\":%f,\n", Transect[i].yFull);
            sprintf(&JX[strlen(JX)], "\t\"aFull\":%f,\n", Transect[i].aFull);
            sprintf(&JX[strlen(JX)], "\t\"rFull\":%f,\n", Transect[i].rFull);
            sprintf(&JX[strlen(JX)], "\t\"wMax\":%f,\n", Transect[i].wMax);
            sprintf(&JX[strlen(JX)], "\t\"ywMax\":%f,\n", Transect[i].ywMax);
            sprintf(&JX[strlen(JX)], "\t\"sMax\":%f,\n", Transect[i].sMax);
            sprintf(&JX[strlen(JX)], "\t\"aMax\":%f,\n", Transect[i].aMax);
            sprintf(&JX[strlen(JX)], "\t\"lengthFactor\":%f\n", Transect[i].lengthFactor);
            sprintf(&JX[strlen(JX)], "\t}\n");

            if(i != arrayN-1) strcat(JX, ",");
        }
        strcat(JX, "],\n");

        // end Transect 
        // Shape
        strcat(JX, "\n\"Shape\": [\n");
        // Get array size
        arrayN = Nobjects[SHAPE];
        for (int i=0; i<arrayN; i++){
            sprintf(&JX[strlen(JX)], "\t{\"curve\":%d,\n", Shape[i].curve);
            sprintf(&JX[strlen(JX)], "\t\"nTbl\":%d,\n", Shape[i].nTbl);
            sprintf(&JX[strlen(JX)], "\t\"aFull\":%f,\n", Shape[i].aFull);
            sprintf(&JX[strlen(JX)], "\t\"rFull\":%f,\n", Shape[i].rFull);
            sprintf(&JX[strlen(JX)], "\t\"wMax\":%f,\n", Shape[i].wMax);
            sprintf(&JX[strlen(JX)], "\t\"sMax\":%f,\n", Shape[i].sMax);
            sprintf(&JX[strlen(JX)], "\t\"aMax\":%f,\n", Shape[i].aMax);
            strcat(JX, "\t\"areaTbl\":[");
            for(int j = 0; j < N_SHAPE_TBL; j++){
                sprintf(&JX[strlen(JX)], "%f", Shape[i].areaTbl[j]);
                if(j < N_SHAPE_TBL-1) strcat(JX, ","); else strcat(JX, "],\n");
            }
            strcat(JX, "\t\"hradTbl\":[");
            for(int j = 0; j < N_SHAPE_TBL; j++){
                sprintf(&JX[strlen(JX)], "%f", Shape[i].hradTbl[j]);
                if(j < N_SHAPE_TBL-1) strcat(JX, ","); else strcat(JX, "],\n");
            }
            strcat(JX, "\t\"widthTbl\":[");
            for(int j = 0; j < N_SHAPE_TBL; j++){
                sprintf(&JX[strlen(JX)], "%f", Shape[i].widthTbl[j]);
                if(j < N_SHAPE_TBL-1) strcat(JX, ","); else strcat(JX, "]\n");
            }
            sprintf(&JX[strlen(JX)], "\t}\n");

            if(i != arrayN-1) strcat(JX, ",");
        }
        strcat(JX, "],\n");

        /*
        Supporting variables:

        static int    Ntransects;              // total number of transects
        static int    Nstations;               // number of stations in current transect
        Station[Nstations]?
        Elev[Nstations]?
        Transect[Ntransects]
        */

        /*
        //  Transect data should be stored as ID:{NC:{}, X1:{nSta:, . . . }, GR:[{Elevation: , Station: }]}
        //  Because swmm automatically calculates these values without storing them. Maybe add these values
        //  to the structure of Transect or a table or something?
        //  Format of transect data follows that used for HEC-2 program:
        //    NC  nLeft  nRight  nChannel
        //    X1  name  nSta  xLeftBank  xRightBank  0  0  0  xFactor  yFactor
        //    GR  Elevation  Station  ... 
        */

        // end Shape 
        // Losses are a part of Link
        // Pollut
        strcat(JX, "\n\"Pollut\": [\n");
        // Get array size
        arrayN = Nobjects[POLLUT];
        for (int i=0; i<arrayN; i++){
            sprintf(&JX[strlen(JX)], "\t{\"ID\":\"%s\",\n", Pollut[i].ID);
            sprintf(&JX[strlen(JX)], "\t\"units\":%d,\n", Pollut[i].units);
            sprintf(&JX[strlen(JX)], "\t\"mcf\":%f,\n", Pollut[i].mcf);
            sprintf(&JX[strlen(JX)], "\t\"dwfConcen\":%f,\n", Pollut[i].dwfConcen);
            sprintf(&JX[strlen(JX)], "\t\"pptConcen\":%f,\n", Pollut[i].pptConcen);
            sprintf(&JX[strlen(JX)], "\t\"gwConcen\":%f,\n", Pollut[i].gwConcen);
            sprintf(&JX[strlen(JX)], "\t\"rdiiConcen\":%f,\n", Pollut[i].rdiiConcen);
            sprintf(&JX[strlen(JX)], "\t\"initConcen\":%f,\n", Pollut[i].initConcen);
            sprintf(&JX[strlen(JX)], "\t\"kDecay\":%f,\n", Pollut[i].kDecay);
            sprintf(&JX[strlen(JX)], "\t\"coPollut\":%d,\n", Pollut[i].coPollut);
            sprintf(&JX[strlen(JX)], "\t\"coFraction\":%f,\n", Pollut[i].coFraction);
            sprintf(&JX[strlen(JX)], "\t\"snowOnly\":%d\n", Pollut[i].snowOnly);
            sprintf(&JX[strlen(JX)], "\t}\n");

            if(i != arrayN-1) strcat(JX, ",");
        }
        strcat(JX, "],\n");

        // end Pollut 
        // Landuse also shows up in the subcatchments
        // Landuse
        strcat(JX, "\n\"Landuse\": [\n");
        // Get array size
        arrayN = Nobjects[LANDUSE];
        for (int i=0; i<arrayN; i++){
            sprintf(&JX[strlen(JX)], "\t{\"ID\":\"%s\",\n", Landuse[i].ID);
            sprintf(&JX[strlen(JX)], "\t\"sweepInterval\":%f,\n", Landuse[i].sweepInterval);
            sprintf(&JX[strlen(JX)], "\t\"sweepRemoval\":%f,\n", Landuse[i].sweepRemoval);
            sprintf(&JX[strlen(JX)], "\t\"sweepDays0\":%f,\n", Landuse[i].sweepDays0);
            //buildupFunc TBuildup
            strcat(JX, "\n\t\"buildupFunc\": [\n");
            // Get array size
            int arrayO = Nobjects[POLLUT];
            for (int j=0; j<arrayO; j++){
                sprintf(&JX[strlen(JX)], "\t\t{\"normalizer\":%d,\n", Landuse[i].buildupFunc[j].normalizer);
                sprintf(&JX[strlen(JX)], "\t\t\"funcType\":%d,\n", Landuse[i].buildupFunc[j].funcType);
                strcat(JX, "\t\t\"coeff\":[");
                for(int k = 0; k < 3; k++){
                    sprintf(&JX[strlen(JX)], "%f", Landuse[i].buildupFunc[j].coeff[k]);
                    if(k < 3-1) strcat(JX, ","); else strcat(JX, "],\n");
                }
                sprintf(&JX[strlen(JX)], "\t\t\"maxDays\":%f\n", Landuse[i].buildupFunc[j].maxDays);
                sprintf(&JX[strlen(JX)], "\t\t}\n");

            if(j != arrayO-1) strcat(JX, ",");
            }
            strcat(JX, "\t],\n");
            //washoffFunc TWashoff
            strcat(JX, "\n\t\"washoffFunc\": [\n");
            // Get array size
            arrayO = Nobjects[POLLUT];
            for (int j=0; j<arrayO; j++){
                sprintf(&JX[strlen(JX)], "\t\t{\"funcType\":%d,\n", Landuse[i].washoffFunc[j].funcType);
                sprintf(&JX[strlen(JX)], "\t\t\"coeff\":%f,\n", Landuse[i].washoffFunc[j].coeff);
                sprintf(&JX[strlen(JX)], "\t\t\"expon\":%f,\n", Landuse[i].washoffFunc[j].expon);
                sprintf(&JX[strlen(JX)], "\t\t\"sweepEffic\":%f,\n", Landuse[i].washoffFunc[j].sweepEffic);
                sprintf(&JX[strlen(JX)], "\t\t\"bmpEffic\":%f\n", Landuse[i].washoffFunc[j].bmpEffic);
                sprintf(&JX[strlen(JX)], "\t\t}\n");

                if(j != arrayO-1) strcat(JX, ",");
            }
            strcat(JX, "\t]\n");
            sprintf(&JX[strlen(JX)], "\t}\n");

            if(i != arrayN-1) strcat(JX, ",");
        }
        strcat(JX, "],\n");

        // end Landuse 
        // Buildup and Washoff are part of Landuse
        // Coverage is taken care of by the following part of subcatch_readLanduseParams()
        // Subcatch[j].landFactor[m].fraction = f/100.0;
        // Inflow and DWF, and rdii are part of Node.
        // UnitHyd

        strcat(JX, "\n\"UnitHyd\": [\n");
        // Get array size
        arrayN = Nobjects[UNITHYD];
        for (int i=0; i<arrayN; i++){
            sprintf(&JX[strlen(JX)], "\t{\"ID\":\"%s\",\n", UnitHyd[i].ID);
            sprintf(&JX[strlen(JX)], "\t\"rainGage\":%d,\n", UnitHyd[i].rainGage);
            strcat(JX, "\t\"iaMax\":[");
            for(int j = 0; j < 12; j++){
                strcat(JX, "[");
                for(int k = 0; k < 3; k++){
                    sprintf(&JX[strlen(JX)], "%f", UnitHyd[i].iaMax[j][k]);
                    if(k < 3-1) strcat(JX, ","); else strcat(JX, "]\n");
                }
                if(j < 12-1) strcat(JX, ","); else strcat(JX, "],\n");
            }
            strcat(JX, "\t\"iaRecov\":[");
            for(int j = 0; j < 12; j++){
                strcat(JX, "[");
                for(int k = 0; k < 3; k++){
                    sprintf(&JX[strlen(JX)], "%f", UnitHyd[i].iaRecov[j][k]);
                    if(k < 3-1) strcat(JX, ","); else strcat(JX, "]\n");
                }
                if(j < 12-1) strcat(JX, ","); else strcat(JX, "],\n");
            }
            strcat(JX, "\t\"iaInit\":[");
            for(int j = 0; j < 12; j++){
                strcat(JX, "[");
                for(int k = 0; k < 3; k++){
                    sprintf(&JX[strlen(JX)], "%f", UnitHyd[i].iaInit[j][k]);
                    if(k < 3-1) strcat(JX, ","); else strcat(JX, "]\n");
                }
                if(j < 12-1) strcat(JX, ","); else strcat(JX, "],\n");
            }
            strcat(JX, "\t\"r\":[");
            for(int j = 0; j < 12; j++){
                strcat(JX, "[");
                for(int k = 0; k < 3; k++){
                    sprintf(&JX[strlen(JX)], "%f", UnitHyd[i].r[j][k]);
                    if(k < 3-1) strcat(JX, ","); else strcat(JX, "]\n");
                }
                if(j < 12-1) strcat(JX, ","); else strcat(JX, "],\n");
            }
            strcat(JX, "\t\"tBase\":[");
            for(int j = 0; j < 12; j++){
                strcat(JX, "[");
                for(int k = 0; k < 3; k++){
                    sprintf(&JX[strlen(JX)], "\"%ld\"", UnitHyd[i].tBase[j][k]);
                    if(k < 3-1) strcat(JX, ","); else strcat(JX, "]\n");
                }
                if(j < 12-1) strcat(JX, ","); else strcat(JX, "],\n");
            }
            strcat(JX, "\t\"tPeak\":[");
            for(int j = 0; j < 12; j++){
                strcat(JX, "[");
                for(int k = 0; k < 3; k++){
                    sprintf(&JX[strlen(JX)], "\"%ld\"", UnitHyd[i].tPeak[j][k]);
                    if(k < 3-1) strcat(JX, ","); else strcat(JX, "]\n");
                }
                if(j < 12-1) strcat(JX, ","); else strcat(JX, "],\n");
            }
            
            sprintf(&JX[strlen(JX)], "\t}\n");

            if(i != arrayN-1) strcat(JX, ",");
        }
        strcat(JX, "],\n");

        // end UnitHyd 
        // Loadings is taken care of in Subcatch
        // Treatment is taken care of in Nodes
        // Curve
        strcat(JX, "\n\"Curve\": [\n");
        // Get array size
        arrayN = Nobjects[CURVE];
        for (int i=0; i<arrayN; i++){
            sprintf(&JX[strlen(JX)], "\t{\"ID\":\"%s\",\n", Curve[i].ID);
            sprintf(&JX[strlen(JX)], "\t\"curveType\":%d,\n", Curve[i].curveType);
            sprintf(&JX[strlen(JX)], "\t\"refersTo\":%d,\n", Curve[i].refersTo);
            sprintf(&JX[strlen(JX)], "\t\"dxMin\":%f,\n", Curve[i].dxMin);
            sprintf(&JX[strlen(JX)], "\t\"lastDate\":%f,\n", Curve[i].lastDate);
            sprintf(&JX[strlen(JX)], "\t\"x1\":%f,\n", Curve[i].x1);
            sprintf(&JX[strlen(JX)], "\t\"x2\":%f,\n", Curve[i].x2);
            sprintf(&JX[strlen(JX)], "\t\"y1\":%f,\n", Curve[i].y1);
            sprintf(&JX[strlen(JX)], "\t\"y2\":%f,\n", Curve[i].y2);

            // File
            strcat(JX, "\t\"file\":{\n");
            sprintf(&JX[strlen(JX)], "\t\t\"name\":\"%s\",\n", Curve[i].file.name);
            sprintf(&JX[strlen(JX)], "\n\t\t\"mode\":%d},\n", Curve[i].file.mode);

            // Table
            strcat(JX, "\t\"Table\":[\n");
            TTableEntry* tSpot = Curve[i].firstEntry;
            while(tSpot){
                sprintf(&JX[strlen(JX)], "\t\t{\"x\":%f,\n", tSpot->x);
                sprintf(&JX[strlen(JX)], "\t\t\"y\":%f}\n", tSpot->y);

                tSpot = tSpot->next;
                if(tSpot) strcat(JX, ",");
                else strcat(JX, "]");
            }
            strcat(JX, "\n}");

            if(i != arrayN-1) strcat(JX, ",");
            strcat(JX, "\n");
        }
        strcat(JX, "],\n");

        // end Curve 
        // Timeseries is taken care of earlier (for testing)
        // Control
        /*strcat(JX, ",\n\"Control\": [\n");
        // Get array size
        arrayN = Nobjects[CONTROL];
        for (int i=0; i<arrayN; i++){
            sprintf(&JX[strlen(JX)], "\t{\"ID\":\"%s\",\n", Rules[i].ID);
            sprintf(&JX[strlen(JX)], "\t\"priority\":%f,\n", Rules[i].priority);

            // Premises
            strcat(JX, "\t\"Premises\":[\n");
            TPremise* tSpot = Rules[i].firstPremise;
            while(tSpot){
                sprintf(&JX[strlen(JX)], "\t\t{\"type\":%d,\n", tSpot->type);
                sprintf(&JX[strlen(JX)], "\t\t\t\"lhsVar\":{\n");
                sprintf(&JX[strlen(JX)], "\t\t\t\t\"node\":%d,\n", tSpot->lhsVar.node);
                sprintf(&JX[strlen(JX)], "\t\t\t\t\"link\":%d,\n", tSpot->lhsVar.link);
                sprintf(&JX[strlen(JX)], "\t\t\t\t\"attribute\":%d},\n", tSpot->lhsVar.attribute);
                sprintf(&JX[strlen(JX)], "\t\t\t\"rhsVar\":{\n");
                sprintf(&JX[strlen(JX)], "\t\t\t\t\"node\":%d,\n", tSpot->rhsVar.node);
                sprintf(&JX[strlen(JX)], "\t\t\t\t\"link\":%d,\n", tSpot->rhsVar.link);
                sprintf(&JX[strlen(JX)], "\t\t\t\t\"attribute\":%d},\n", tSpot->rhsVar.attribute);
                sprintf(&JX[strlen(JX)], "\t\t\"relation\":%d,\n", tSpot->relation);
                sprintf(&JX[strlen(JX)], "\t\t\"value\":%f}\n", tSpot->value);

                tSpot = tSpot->next;
                if(tSpot) strcat(JX, ",\n");
                else strcat(JX, "],\n");
            }

            // thenActions
            strcat(JX, "\t\"thenActions\":[\n");
            TAction* tSpat = Rules[i].thenActions;
            while(tSpat){
                sprintf(&JX[strlen(JX)], "\t\t{\"rule\":%d,\n", tSpat->rule);
                sprintf(&JX[strlen(JX)], "\t\t\"link\":%d,\n", tSpat->link);
                sprintf(&JX[strlen(JX)], "\t\t\"attribute\":%d,\n", tSpat->attribute);
                sprintf(&JX[strlen(JX)], "\t\t\"curve\":%d,\n", tSpat->curve);
                sprintf(&JX[strlen(JX)], "\t\t\"tseries\":%d,\n", tSpat->tseries);
                sprintf(&JX[strlen(JX)], "\t\t\"value\":%f,\n", tSpat->value);
                sprintf(&JX[strlen(JX)], "\t\t\"kp\":%f,\n", tSpat->kp);
                sprintf(&JX[strlen(JX)], "\t\t\"ki\":%f,\n", tSpat->ki);
                sprintf(&JX[strlen(JX)], "\t\t\"kd\":%f,\n", tSpat->kd);
                sprintf(&JX[strlen(JX)], "\t\t\"e1\":%f,\n", tSpat->e1);
                sprintf(&JX[strlen(JX)], "\t\t\"e2\":%f}", tSpat->e2);

                tSpat = tSpat->next;
                if(tSpat) strcat(JX, ",\n");
                else strcat(JX, "],\n");
            }
            
            // elseActions
            strcat(JX, "\t\"elseActions\":[\n");
            TAction* tSput = Rules[i].elseActions;
            while(tSput){
                sprintf(&JX[strlen(JX)], "\t\t{\"rule\":%d,\n", tSput->rule);
                sprintf(&JX[strlen(JX)], "\t\t\"link\":%d,\n", tSput->link);
                sprintf(&JX[strlen(JX)], "\t\t\"attribute\":%d,\n", tSput->attribute);
                sprintf(&JX[strlen(JX)], "\t\t\"curve\":%d,\n", tSput->curve);
                sprintf(&JX[strlen(JX)], "\t\t\"tseries\":%d,\n", tSput->tseries);
                sprintf(&JX[strlen(JX)], "\t\t\"value\":%f,\n", tSput->value);
                sprintf(&JX[strlen(JX)], "\t\t\"kp\":%f,\n", tSput->kp);
                sprintf(&JX[strlen(JX)], "\t\t\"ki\":%f,\n", tSput->ki);
                sprintf(&JX[strlen(JX)], "\t\t\"kd\":%f,\n", tSput->kd);
                sprintf(&JX[strlen(JX)], "\t\t\"e1\":%f,\n", tSput->e1);
                sprintf(&JX[strlen(JX)], "\t\t\"e2\":%f}", tSput->e2);

                tSput = tSput->next;
                if(tSput) strcat(JX, ",\n");
                else strcat(JX, "]\n");
            }

            strcat(JX, "}");

            if(i != arrayN-1) strcat(JX, ",");
            strcat(JX, "\n");
        }
        strcat(JX, "],\n");*/
        
        // end Control 
        // Report
        strcat(JX, "\n\"RptFlags\": {\n");
        sprintf(&JX[strlen(JX)], "\t\"report\":%d,\n", RptFlags.report);
        sprintf(&JX[strlen(JX)], "\t\"input\":%d,\n", RptFlags.input);
        sprintf(&JX[strlen(JX)], "\t\"subcatchments\":%d,\n", RptFlags.subcatchments);
        sprintf(&JX[strlen(JX)], "\t\"nodes\":%d,\n", RptFlags.nodes);
        sprintf(&JX[strlen(JX)], "\t\"links\":%d,\n", RptFlags.links);
        sprintf(&JX[strlen(JX)], "\t\"continuity\":%d,\n", RptFlags.continuity);
        sprintf(&JX[strlen(JX)], "\t\"flowStats\":%d,\n", RptFlags.flowStats);
        sprintf(&JX[strlen(JX)], "\t\"nodeStats\":%d,\n", RptFlags.nodeStats);
        sprintf(&JX[strlen(JX)], "\t\"controls\":%d,\n", RptFlags.controls);
        sprintf(&JX[strlen(JX)], "\t\"averages\":%d,\n", RptFlags.averages);
        sprintf(&JX[strlen(JX)], "\t\"linesPerPage\":%d\n", RptFlags.linesPerPage);
        sprintf(&JX[strlen(JX)], "}\n");

        // end Report
        // Skipping files
        // LidProcs
        /*strcat(JX, "\n\"LidProcs\": [\n");
        // Get array size
        arrayN = LidCount;
        for (int i=0; i<arrayN; i++){
            sprintf(&JX[strlen(JX)], "\t{\"ID\":\"%s\",\n", LidProcs[i].ID);
            sprintf(&JX[strlen(JX)], "\t\"lidType\":%d,\n", LidProcs[i].lidType);
            sprintf(&JX[strlen(JX)], "\t\"surface\": {\n");
            sprintf(&JX[strlen(JX)], "\t\t\"thickness\":%f,\n", LidProcs[i].surface.thickness);
            sprintf(&JX[strlen(JX)], "\t\t\"voidFrac\":%f,\n", LidProcs[i].surface.voidFrac);
            sprintf(&JX[strlen(JX)], "\t\t\"roughness\":%f,\n", LidProcs[i].surface.roughness);
            sprintf(&JX[strlen(JX)], "\t\t\"surfSlope\":%f,\n", LidProcs[i].surface.surfSlope);
            sprintf(&JX[strlen(JX)], "\t\t\"sideSlope\":%f,\n", LidProcs[i].surface.sideSlope);
            sprintf(&JX[strlen(JX)], "\t\t\"alpha\":%f,\n", LidProcs[i].surface.alpha);
            sprintf(&JX[strlen(JX)], "\t\t\"canOverflow\":%d\n", LidProcs[i].surface.canOverflow);
            sprintf(&JX[strlen(JX)], "\t},\n");
            sprintf(&JX[strlen(JX)], "\t\"pavement\": {\n");
            sprintf(&JX[strlen(JX)], "\t\t\"thickness\":%f,\n", LidProcs[i].pavement.thickness);
            sprintf(&JX[strlen(JX)], "\t\t\"voidFrac\":%f,\n", LidProcs[i].pavement.voidFrac);
            sprintf(&JX[strlen(JX)], "\t\t\"impervFrac\":%f,\n", LidProcs[i].pavement.impervFrac);
            sprintf(&JX[strlen(JX)], "\t\t\"kSat\":%f,\n", LidProcs[i].pavement.kSat);
            sprintf(&JX[strlen(JX)], "\t\t\"clogFactor\":%f,\n", LidProcs[i].pavement.clogFactor);
            sprintf(&JX[strlen(JX)], "\t\t\"regenDays\":%f,\n", LidProcs[i].pavement.regenDays);
            sprintf(&JX[strlen(JX)], "\t\t\"regenDegree\":%f,\n", LidProcs[i].pavement.regenDegree);
            sprintf(&JX[strlen(JX)], "\t},\n");
            sprintf(&JX[strlen(JX)], "\t\"soil\": {\n");
            sprintf(&JX[strlen(JX)], "\t\t\"thickness\":%f,\n", LidProcs[i].soil.thickness);
            sprintf(&JX[strlen(JX)], "\t\t\"porosity\":%f,\n", LidProcs[i].soil.porosity);
            sprintf(&JX[strlen(JX)], "\t\t\"fieldCap\":%f,\n", LidProcs[i].soil.fieldCap);
            sprintf(&JX[strlen(JX)], "\t\t\"wiltPoint\":%f,\n", LidProcs[i].soil.wiltPoint);
            sprintf(&JX[strlen(JX)], "\t\t\"suction\":%f,\n", LidProcs[i].soil.suction);
            sprintf(&JX[strlen(JX)], "\t\t\"kSat\":%f,\n", LidProcs[i].soil.kSat);
            sprintf(&JX[strlen(JX)], "\t\t\"kSlope\":%f,\n", LidProcs[i].soil.kSlope);
            sprintf(&JX[strlen(JX)], "\t},\n");
            sprintf(&JX[strlen(JX)], "\t\"storage\": {\n");
            sprintf(&JX[strlen(JX)], "\t\t\"thickness\":%f,\n", LidProcs[i].storage.thickness);
            sprintf(&JX[strlen(JX)], "\t\t\"voidFrac\":%f,\n", LidProcs[i].storage.voidFrac);
            sprintf(&JX[strlen(JX)], "\t\t\"kSat\":%f,\n", LidProcs[i].storage.kSat);
            sprintf(&JX[strlen(JX)], "\t\t\"clogFactor\":%f,\n", LidProcs[i].storage.clogFactor);
            sprintf(&JX[strlen(JX)], "\t},\n");
            sprintf(&JX[strlen(JX)], "\t\"drain\": {\n");
            sprintf(&JX[strlen(JX)], "\t\t\"coeff\":%f,\n", LidProcs[i].drain.coeff);
            sprintf(&JX[strlen(JX)], "\t\t\"expon\":%f,\n", LidProcs[i].drain.expon);
            sprintf(&JX[strlen(JX)], "\t\t\"offset\":%f,\n", LidProcs[i].drain.offset);
            sprintf(&JX[strlen(JX)], "\t\t\"delay\":%f,\n", LidProcs[i].drain.delay);
            sprintf(&JX[strlen(JX)], "\t\t\"hOpen\":%f,\n", LidProcs[i].drain.hOpen);
            sprintf(&JX[strlen(JX)], "\t\t\"hClose\":%f,\n", LidProcs[i].drain.hClose);
            sprintf(&JX[strlen(JX)], "\t\t\"qCurve\":%d,\n", LidProcs[i].drain.qCurve);
            sprintf(&JX[strlen(JX)], "\t},\n");
            sprintf(&JX[strlen(JX)], "\t\"drainMat\": {\n");
            sprintf(&JX[strlen(JX)], "\t\t\"thickness\":%f,\n", LidProcs[i].drainMat.thickness);
            sprintf(&JX[strlen(JX)], "\t\t\"voidFrac\":%f,\n", LidProcs[i].drainMat.voidFrac);
            sprintf(&JX[strlen(JX)], "\t\t\"roughness\":%f,\n", LidProcs[i].drainMat.roughness);
            sprintf(&JX[strlen(JX)], "\t\t\"alpha\":%f,\n", LidProcs[i].drainMat.alpha);
            sprintf(&JX[strlen(JX)], "\t},\n");
            sprintf(&JX[strlen(JX)], "\t\"drainRmvl\": ");
            strcat(JX, "[");
            for(int j = 0; j < Nobjects[POLLUT]; j++){
                sprintf(&JX[strlen(JX)], "%f", LidProcs[i].drainRmvl[j]);
                if(j < Nobjects[POLLUT]-1) strcat(JX, ","); else strcat(JX, "]\n");
            }
            
            strcat(JX, "}");

            if(i != arrayN-1) strcat(JX, ",");
        }
        strcat(JX, "]\n");*/







        strcat(JX, "}\0");
        swmm_close();
    }

#ifdef EXH
    // --- end of try loop; handle exception here
    __except(xfilter(GetExceptionCode(), "swmm_open", 0.0, 0))
    {
        ErrorCode = ERR_SYSTEM;
    }
#endif
    //return error_getCode(ErrorCode);
    return JX;
}

//=============================================================================

int DLLEXPORT swmm_open(char* f1, char* f2, char* f3)
//
//  Input:   f1 = name of input file
//           f2 = name of report file
//           f3 = name of binary output file
//  Output:  returns error code
//  Purpose: opens a SWMM project.
//
{
// --- to be safe, reset the state of the floating point unit                  //(5.1.013)
#ifdef WINDOWS                                                                 //(5.1.013)
    _fpreset();
#endif

#ifdef EXH
    // --- begin exception handling here
    __try
#endif
    {
        // --- initialize error & warning codes
        datetime_setDateFormat(M_D_Y);
        ErrorCode = 0;
        strcpy(ErrorMsg, "");
        Warnings = 0;
        IsOpenFlag = FALSE;
        IsStartedFlag = FALSE;
        ExceptionCount = 0;

        // --- open a SWMM project
        project_open(f1, f2, f3);
        if ( ErrorCode ) return error_getCode(ErrorCode);
        IsOpenFlag = TRUE;
        report_writeLogo();
        writecon(FMT06);

        // --- retrieve project data from input file
        project_readInput();
        if ( ErrorCode ) return error_getCode(ErrorCode);

        // --- write project title to report file & validate data
        report_writeTitle();
        project_validate();

        // --- write input summary to report file if requested
        if ( RptFlags.input ) inputrpt_writeInput();
    }

#ifdef EXH
    // --- end of try loop; handle exception here
    __except(xfilter(GetExceptionCode(), "swmm_open", 0.0, 0))
    {
        ErrorCode = ERR_SYSTEM;
    }
#endif
    return error_getCode(ErrorCode);
}

//=============================================================================

int DLLEXPORT swmm_start(int saveResults)
//
//  Input:   saveResults = TRUE if simulation results saved to binary file 
//  Output:  returns an error code
//  Purpose: starts a SWMM simulation.
//
{
    // --- check that a project is open & no run started
    if ( ErrorCode ) return error_getCode(ErrorCode);
    if ( !IsOpenFlag || IsStartedFlag )
    {
        report_writeErrorMsg(ERR_NOT_OPEN, "");
        return error_getCode(ErrorCode);
    }

    // --- save saveResults flag to global variable
    SaveResultsFlag = saveResults;
    ExceptionCount = 0;

#ifdef EXH
    // --- begin exception handling loop here
    __try
#endif
    {
        // --- initialize elapsed time in decimal days
        ElapsedTime = 0.0;

        // --- initialize runoff, routing & reporting time (in milliseconds)
        NewRunoffTime = 0.0;
        NewRoutingTime = 0.0;
        ReportTime =   (double)(1000 * ReportStep);
        TotalStepCount = 0;                                                    //(5.1.015)
        ReportStepCount = 0;                                                   //(5.1.015)
        NonConvergeCount = 0;
        IsStartedFlag = TRUE;

        // --- initialize global continuity errors
        RunoffError = 0.0;
        GwaterError = 0.0;
        FlowError = 0.0;
        QualError = 0.0;

        // --- open rainfall processor (creates/opens a rainfall
        //     interface file and generates any RDII flows)
        if ( !IgnoreRainfall ) rain_open();
        if ( ErrorCode ) return error_getCode(ErrorCode);

        // --- initialize state of each major system component
        project_init();

        // --- see if runoff & routing needs to be computed
        if ( Nobjects[SUBCATCH] > 0 ) DoRunoff = TRUE;
        else DoRunoff = FALSE;
        if ( Nobjects[NODE] > 0 && !IgnoreRouting ) DoRouting = TRUE;
        else DoRouting = FALSE;

        // --- open binary output file
        output_open();

        // --- open runoff processor
        if ( DoRunoff ) runoff_open();

        // --- open & read hot start file if present
        if ( !hotstart_open() ) return ErrorCode;

        // --- open routing processor
        if ( DoRouting ) routing_open();

        // --- open mass balance and statistics processors
        massbal_open();
        stats_open();

        // --- write project options to report file 
	    report_writeOptions();
        if ( RptFlags.controls ) report_writeControlActionsHeading();
    }

#ifdef EXH
    // --- end of try loop; handle exception here
    __except(xfilter(GetExceptionCode(), "swmm_start", 0.0, 0))
    {
        ErrorCode = ERR_SYSTEM;
    }
#endif
    return error_getCode(ErrorCode);
}
//=============================================================================

int DLLEXPORT swmm_step(double* elapsedTime)
//
//  Input:   elapsedTime = current elapsed time in decimal days
//  Output:  updated value of elapsedTime,
//           returns error code
//  Purpose: advances the simulation by one routing time step.
//
{
    // --- check that simulation can proceed
    if ( ErrorCode ) return error_getCode(ErrorCode);
    if ( !IsOpenFlag || !IsStartedFlag  )
    {
        report_writeErrorMsg(ERR_NOT_OPEN, "");
        return error_getCode(ErrorCode);
    }

#ifdef EXH
    // --- begin exception handling loop here
    __try
#endif
    {
        // --- if routing time has not exceeded total duration
        if ( NewRoutingTime < TotalDuration )
        {
            // --- route flow & WQ through drainage system
            //     (runoff will be calculated as needed)
            //     (NewRoutingTime is updated)
            execRouting();
        }

////  Following code segment modified for release 5.1.013.  ////               //(5.1.013)
        // --- if saving results to the binary file
        if ( SaveResultsFlag )
        {
            // --- and it's time to save results
            if ( NewRoutingTime >= ReportTime )
            {
                // --- if user requested that average results be saved:
                if ( RptFlags.averages )
                {
                    // --- include latest results in current averages
                    //     if current time equals the reporting time
                    if ( NewRoutingTime == ReportTime ) output_updateAvgResults();

                    // --- save current average results to binary file
                    //     (which will re-set averages to 0)
                    output_saveResults(ReportTime);

                    // --- if current time exceeds reporting period then
                    //     start computing averages for next period
                    if ( NewRoutingTime > ReportTime ) output_updateAvgResults();
                }

                // --- otherwise save interpolated point results
                else output_saveResults(ReportTime);

                // --- advance to next reporting period
                ReportTime = ReportTime + (double)(1000 * ReportStep);
            }

            // --- not a reporting period so update average results if applicable
            else if ( RptFlags.averages ) output_updateAvgResults();
        }
////

        // --- update elapsed time (days)
        if ( NewRoutingTime < TotalDuration )
        {
            ElapsedTime = NewRoutingTime / MSECperDAY;
        }

        // --- otherwise end the simulation
        else ElapsedTime = 0.0;
        *elapsedTime = ElapsedTime;
    }

#ifdef EXH
    // --- end of try loop; handle exception here
    __except(xfilter(GetExceptionCode(), "swmm_step", ElapsedTime, TotalStepCount)) //(5.1.015)
    {
        ErrorCode = ERR_SYSTEM;
    }
#endif
    return error_getCode(ErrorCode);
}

//=============================================================================

void execRouting()
//
//  Input:   none
//  Output:  none
//  Purpose: routes flow & WQ through drainage system over a single time step.
//
{
    double   nextRoutingTime;          // updated elapsed routing time (msec)
    double   routingStep;              // routing time step (sec)

#ifdef EXH
    // --- begin exception handling loop here
    __try
#endif
    {
        // --- determine when next routing time occurs
        TotalStepCount++;                                                      //(5.1.015)
        if ( !DoRouting ) routingStep = MIN(WetStep, ReportStep);
        else routingStep = routing_getRoutingStep(RouteModel, RouteStep);
        if ( routingStep <= 0.0 )
        {
            ErrorCode = ERR_TIMESTEP;
            return;
        }
        nextRoutingTime = NewRoutingTime + 1000.0 * routingStep;

        // --- adjust routing step so that total duration not exceeded
        if ( nextRoutingTime > TotalDuration )
        {
            routingStep = (TotalDuration - NewRoutingTime) / 1000.0;
            routingStep = MAX(routingStep, 1. / 1000.0);
            nextRoutingTime = TotalDuration;
        }

        // --- compute runoff until next routing time reached or exceeded
        if ( DoRunoff ) while ( NewRunoffTime < nextRoutingTime )
        {
            runoff_execute();
            if ( ErrorCode ) return;
        }

        // --- if no runoff analysis, update climate state (for evaporation)
        else climate_setState(getDateTime(NewRoutingTime));
  
        // --- route flows & pollutants through drainage system
        //     (while updating NewRoutingTime)
        if ( DoRouting ) routing_execute(RouteModel, routingStep);
        else
        NewRoutingTime = nextRoutingTime;
    }

#ifdef EXH
    // --- end of try loop; handle exception here
    __except(xfilter(GetExceptionCode(), "execRouting",
                     ElapsedTime, TotalStepCount))                             //(5.1.015)
    {
        ErrorCode = ERR_SYSTEM;
        return;
    }
#endif
}

//=============================================================================

int DLLEXPORT swmm_end(void)
//
//  Input:   none
//  Output:  none
//  Purpose: ends a SWMM simulation.
//
{
    // --- check that project opened and run started
    if ( !IsOpenFlag )
    {
        report_writeErrorMsg(ERR_NOT_OPEN, "");
        return error_getCode(ErrorCode);
    }

    if ( IsStartedFlag )
    {
        // --- write ending records to binary output file
        if ( Fout.file ) output_end();

        // --- report mass balance results and system statistics
        if ( !ErrorCode )
        {
            massbal_report();
            stats_report();
        }

        // --- close all computing systems
        stats_close();
        massbal_close();
        if ( !IgnoreRainfall ) rain_close();
        if ( DoRunoff ) runoff_close();
        if ( DoRouting ) routing_close(RouteModel);
        hotstart_close();
        IsStartedFlag = FALSE;
    }
    return error_getCode(ErrorCode);
}

//=============================================================================

int DLLEXPORT swmm_report()
//
//  Input:   none
//  Output:  returns an error code
//  Purpose: writes simulation results to report file.
//
{
    if ( Fout.mode == SCRATCH_FILE ) output_checkFileSize();
    if ( ErrorCode ) report_writeErrorCode();
    else
    {
        writecon(FMT07);
        report_writeReport();
    }
    return error_getCode(ErrorCode);
}

//=============================================================================

int DLLEXPORT swmm_close()
//
//  Input:   none
//  Output:  returns an error code
//  Purpose: closes a SWMM project.
//
{
    if ( Fout.file ) output_close();
    if ( IsOpenFlag ) project_close();
    report_writeSysTime();
    if ( Finp.file != NULL ) fclose(Finp.file);
    if ( Frpt.file != NULL ) fclose(Frpt.file);
    if ( Fout.file != NULL )
    {
        fclose(Fout.file);
        if ( Fout.mode == SCRATCH_FILE ) remove(Fout.name);
    }
    IsOpenFlag = FALSE;
    IsStartedFlag = FALSE;
    return 0;
}

//=============================================================================

int  DLLEXPORT swmm_getMassBalErr(float* runoffErr, float* flowErr,
                                  float* qualErr)
//
//  Input:   none
//  Output:  runoffErr = runoff mass balance error (percent)
//           flowErr   = flow routing mass balance error (percent)
//           qualErr   = quality routing mass balance error (percent)
//           returns an error code
//  Purpose: reports a simulation's mass balance errors.
//
{
    *runoffErr = 0.0;
    *flowErr   = 0.0;
    *qualErr   = 0.0;

    if ( IsOpenFlag && !IsStartedFlag)
    {
        *runoffErr = (float)RunoffError;
        *flowErr   = (float)FlowError;
        *qualErr   = (float)QualError;
    }
    return 0;
}

//=============================================================================

int  DLLEXPORT swmm_getVersion(void)
//
//  Input:   none
//  Output:  returns SWMM engine version number
//  Purpose: retrieves version number of current SWMM engine which
//           uses a format of xyzzz where x = major version number,
//           y = minor version number, and zzz = build number.
//
//  NOTE: Each New Release should be updated in consts.h
{
    return VERSION;
}

//=============================================================================

int DLLEXPORT swmm_getWarnings(void)
//
//  Input:  none
//  Output: returns number of warning messages issued.
//  Purpose: retireves number of warning messages issued during an analysis.
{
    return Warnings;
}

//=============================================================================

int  DLLEXPORT swmm_getError(char* errMsg, int msgLen)
//
//  Input:   errMsg = character array to hold error message text
//           msgLen = maximum size of errMsg
//  Output:  returns error message code number and text of error message.
//  Purpose: retrieves the code number and text of the error condition that
//           caused SWMM to abort its analysis.
{
    size_t errMsgLen = msgLen;

    // --- copy text of last error message into errMsg
    if ( ErrorCode > 0 && strlen(ErrorMsg) == 0 ) sstrncpy(errMsg, "", 1);
    else
    {
        errMsgLen = MIN(errMsgLen, strlen(ErrorMsg));
        errMsg = sstrncpy(errMsg, ErrorMsg, errMsgLen);
    }

    // --- remove leading line feed from errMsg
    if ( errMsgLen > 0 && errMsg[0] == '\n' ) errMsg[0] = ' ';
    return error_getCode(ErrorCode);
}

//=============================================================================
//   General purpose functions
//=============================================================================

double UCF(int u)
//
//  Input:   u = integer code of quantity being converted
//  Output:  returns a units conversion factor
//  Purpose: computes a conversion factor from SWMM's internal
//           units to user's units
//
{
    if ( u < FLOW ) return Ucf[u][UnitSystem];
    else            return Qcf[FlowUnits];
}

//=============================================================================

char* sstrncpy(char *dest, const char *src, size_t maxlen)
//
//  Input:   dest = string to be copied to
//           src = string to be copied from
//           maxlen = number of characters to copy
//  Output:  returns a pointer to dest
//  Purpose: safe version of standard strncpy function
//
{
     strncpy(dest, src, maxlen);
     dest[maxlen] = '\0';
     return dest;
}

//=============================================================================

int  strcomp(char *s1, char *s2)
//
//  Input:   s1 = a character string
//           s2 = a character string
//  Output:  returns 1 if s1 is same as s2, 0 otherwise
//  Purpose: does a case insensitive comparison of two strings.
//
{
    int i;
    for (i = 0; UCHAR(s1[i]) == UCHAR(s2[i]); i++)
    {
        if (!s1[i+1] && !s2[i+1]) return(1);
    }
    return(0);
}

//=============================================================================

char* getTempFileName(char* fname)
//
//  Input:   fname = file name string (with max size of MAXFNAME)
//  Output:  returns pointer to file name
//  Purpose: creates a temporary file name with path prepended to it.
//
{
// For Windows systems:
#ifdef WINDOWS

    char* name = NULL;
    char* dir = NULL;

    // --- set dir to user's choice of a temporary directory
    if (strlen(TempDir) > 0)
    {
        _mkdir(TempDir);
        dir = TempDir;
    }

    // --- use _tempnam to get a pointer to an unused file name
    name = _tempnam(dir, "swmm");
    if (name == NULL) return NULL;

    // --- copy the file name to fname
    if (strlen(name) < MAXFNAME) strncpy(fname, name, MAXFNAME);
    else fname = NULL;

    // --- free the pointer returned by _tempnam
    free(name);

    // --- return the new contents of fname
    return fname;

// For non-Windows systems:
#else

    // --- use system function mkstemp() to create a temporary file name
    strcpy(fname, "swmmXXXXXX");
    mkstemp(fname);
    return fname;

#endif
}

//=============================================================================

void getElapsedTime(DateTime aDate, int* days, int* hrs, int* mins)
//
//  Input:   aDate = simulation calendar date + time
//  Output:  days, hrs, mins = elapsed days, hours & minutes for aDate
//  Purpose: finds elapsed simulation time for a given calendar date
//
{
    DateTime x;
    int secs;
    x = aDate - StartDateTime;
    if ( x <= 0.0 )
    {
        *days = 0;
        *hrs  = 0;
        *mins = 0;
    }
    else
    {
        *days = (int)x;
        datetime_decodeTime(x, hrs, mins, &secs);
    }
}

//=============================================================================

DateTime getDateTime(double elapsedMsec)
//
//  Input:   elapsedMsec = elapsed milliseconds
//  Output:  returns date/time value
//  Purpose: finds calendar date/time value for elapsed milliseconds of
//           simulation time.
//
{
    return datetime_addSeconds(StartDateTime, (elapsedMsec+1)/1000.0);
}

//=============================================================================

void  writecon(char *s)
//
//  Input:   s = a character string
//  Output:  none
//  Purpose: writes string of characters to the console.
//
{
    fprintf(stdout,"%s",s);
    fflush(stdout);
}

//=============================================================================

#ifdef EXH
int xfilter(int xc, char* module, double elapsedTime, long step)
//
//  Input:   xc          = exception code
//           module      = name of code module where exception was handled
//           elapsedTime = simulation time when exception occurred (days)
//           step        = step count at time when exception occurred
//  Output:  returns an exception handling code
//  Purpose: exception filtering routine for operating system exceptions
//           under Windows and the Microsoft C compiler.
//
{
    int  rc;                           // result code
    long hour;                         // current hour of simulation
    char msg[40];                      // exception type text
    char xmsg[120];                    // error message text
    switch (xc)
    {
    case EXCEPTION_ACCESS_VIOLATION:
        sprintf(msg, "\n  Access violation ");
        rc = EXCEPTION_EXECUTE_HANDLER;
        break;
    case EXCEPTION_FLT_DENORMAL_OPERAND:
        sprintf(msg, "\n  Illegal floating point operand ");
        rc = EXCEPTION_CONTINUE_EXECUTION;
        break;
    case EXCEPTION_FLT_DIVIDE_BY_ZERO:
        sprintf(msg, "\n  Floating point divide by zero ");
        rc = EXCEPTION_CONTINUE_EXECUTION;
        break;
    case EXCEPTION_FLT_INVALID_OPERATION:
        sprintf(msg, "\n  Illegal floating point operation ");
        rc = EXCEPTION_CONTINUE_EXECUTION;
        break;
    case EXCEPTION_FLT_OVERFLOW:
        sprintf(msg, "\n  Floating point overflow ");
        rc = EXCEPTION_CONTINUE_EXECUTION;
        break;
    case EXCEPTION_FLT_STACK_CHECK:
        sprintf(msg, "\n  Floating point stack violation ");
        rc = EXCEPTION_EXECUTE_HANDLER;
        break;
    case EXCEPTION_FLT_UNDERFLOW:
        sprintf(msg, "\n  Floating point underflow ");
        rc = EXCEPTION_CONTINUE_EXECUTION;
        break;
    case EXCEPTION_INT_DIVIDE_BY_ZERO:
        sprintf(msg, "\n  Integer divide by zero ");
        rc = EXCEPTION_CONTINUE_EXECUTION;
        break;
    case EXCEPTION_INT_OVERFLOW:
        sprintf(msg, "\n  Integer overflow ");
        rc = EXCEPTION_CONTINUE_EXECUTION;
        break;
    default:
        sprintf(msg, "\n  Exception %d ", xc);
        rc = EXCEPTION_EXECUTE_HANDLER;
    }
    hour = (long)(elapsedTime / 1000.0 / 3600.0);
    sprintf(xmsg, "%sin module %s at step %d, hour %d",
            msg, module, step, hour);
    if ( rc == EXCEPTION_EXECUTE_HANDLER ||
         ++ExceptionCount >= MAX_EXCEPTIONS )
    {
        strcat(xmsg, " --- execution halted.");
        rc = EXCEPTION_EXECUTE_HANDLER;
    }
    report_writeLine(xmsg);
    return rc;
}
#endif


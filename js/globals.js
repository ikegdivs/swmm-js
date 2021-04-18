//-----------------------------------------------------------------------------
//   globals.h
//
//   Project: EPA SWMM5
//   Version: 5.1
//   Date:    03/19/14  (Build 5.1.000)
//            04/14/14  (Build 5.1.004)
//            09/15/14  (Build 5.1.007)
//            03/19/15  (Build 5.1.008)
//            08/01/16  (Build 5.1.011)
//            03/14/17  (Build 5.1.012)
//            05/10/18  (Build 5.1.013)
//            04/01/20  (Build 5.1.015)
//   Author:  L. Rossman
//
//   Global Variables
//
//   Build 5.1.004:
//   - Ignore RDII option added.
//
//   Build 5.1.007:
//   - Monthly climate variable adjustments added.
//
//   Build 5.1.008:
//   - Number of parallel threads for dynamic wave routing added.
//   - Minimum dynamic wave routing variable time step added.
//
//   Build 5.1.011:
//   - Changed WarningCode to Warnings (# warnings issued)
//   - Added error message text as a variable.
//   - Added elapsed simulation time (in decimal days) variable.
//   - Added variables associated with detailed routing events.
//
//   Build 5.1.012:
//   - InSteadyState variable made local to routing_execute in routing.c.
//
//   Build 5.1.013:
//   - CrownCutoff and RuleStep added as analysis option variables.
//
//   Build 5.1.015:
//   - Fixes bug in summary statistics when Report Start date > Start Date.
//-----------------------------------------------------------------------------


var Finp        = new TFile();  // Input file
var Fout        = new TFile();  // Output file
var Frpt        = new TFile();  // Report file
var Fclimate    = new TFile();  // Climate file
var Frain       = new TFile();  // Rainfall file
var Frunoff     = new TFile();  // Runoff file
var Frdii       = new TFile();  // RDII inflow file
var Fhotstart1  = new TFile();  // Hot start input file
var Fhotstart2  = new TFile();  // Hot start output file
var Finflows    = new TFile();  // Inflows routing file
var Foutflows   = new TFile();  // Outflows routing file

//long
var Nperiods;                 // Number of reporting periods
var TotalStepCount;           // Total routing steps used        //(5.1.015)
var ReportStepCount;          // Reporting routing steps used    //(5.1.015)
var NonConvergeCount;         // Number of non-converging steps

//char
var Msg = '';                                   // Text of output message
var ErrorMsg = '';                              // Text of error message
var Title = new Array(MAXTITLE);                // Project title
var TempDir = '';                               // Temporary file directory


RptFlags = new TRptFlags();                 // Reporting options

//int
var Nobjects = new Array(MAX_OBJ_TYPES)     // Number of each object type
var Nnodes = new Array(MAX_NODE_TYPES)      // Number of each node sub-type
var Nlinks = new Array(MAX_LINK_TYPES)      // Number of each link sub-type
var UnitSystem                              // Unit system
var FlowUnits                               // Flow units
var InfilModel                              // Infiltration method
var RouteModel                              // Flow routing method
var ForceMainEqn                            // Flow equation for force mains
var LinkOffsets                             // Link offset convention
var SurchargeMethod                         // EXTRAN or SLOT method           //(5.1.013)
var AllowPonding                            // Allow water to pond at nodes
var InertDamping                            // Degree of inertial damping
var NormalFlowLtd                           // Normal flow limited
var SlopeWeighting                          // Use slope weighting
var Compatibility                           // SWMM 5/3/4 compatibility
var SkipSteadyState                         // Skip over steady state periods
var IgnoreRainfall                          // Ignore rainfall/runoff
var IgnoreRDII                              // Ignore RDII
var IgnoreSnowmelt                          // Ignore snowmelt
var IgnoreGwater                            // Ignore groundwater
var IgnoreRouting                           // Ignore flow routing
var IgnoreQuality                           // Ignore water quality
var ErrorCode                               // Error code number
var Warnings                                // Number of warning messages
var WetStep                                 // Runoff wet time step (sec)
var DryStep                                 // Runoff dry time step (sec)
var ReportStep                              // Reporting time step (sec)
var RuleStep                                // Rule evaluation time step (sec) //(5.1.013)
var SweepStart                              // Day of year when sweeping starts
var SweepEnd                                // Day of year when sweeping ends
var MaxTrials                               // Max. trials for DW routing
var NumThreads                              // Number of parallel threads used
var NumEvents                               // Number of detailed events
                //InSteadyState;            // System flows remain constant

//double
var RouteStep                // Routing time step (sec)
var MinRouteStep             // Minimum variable time step (sec)
var LengtheningStep          // Time step for lengthening (sec)
var StartDryDays             // Antecedent dry days
var CourantFactor            // Courant time step factor
var MinSurfArea              // Minimum nodal surface area
var MinSlope                 // Minimum conduit slope
var RunoffError              // Runoff continuity error
var GwaterError              // Groundwater continuity error
var FlowError                // Flow routing error
var QualError                // Quality routing error
var HeadTol                  // DW routing head tolerance (ft)
var SysFlowTol               // Tolerance for steady system flow
var LatFlowTol               // Tolerance for steady nodal inflow
var CrownCutoff              // Fractional pipe crown cutoff    //(5.1.013)

var StartDate = new Date()                // Starting date
var StartTime = new Date()                // Starting time
var StartDateTime = new Date()            // Starting Date+Time
var EndDate = new Date()                  // Ending date
var EndTime = new Date()                  // Ending time
var EndDateTime = new Date()              // Ending Date+Time
var ReportStartDate = new Date()          // Report start date
var ReportStartTime = new Date()          // Report start time
var ReportStart = new Date()              // Report start Date+Time

//double
var ReportTime               // Current reporting time (msec)
var OldRunoffTime            // Previous runoff time (msec)
var NewRunoffTime            // Current runoff time (msec)
var OldRoutingTime           // Previous routing time (msec)
var NewRoutingTime           // Current routing time (msec)
var TotalDuration            // Simulation duration (msec)
var ElapsedTime              // Current elapsed time (days)

var Temp        = new TTemp();                     // Temperature data
var Evap        = new TEvap();                     // Evaporation data
var Wind        = new TWind();                     // Wind speed data
var Snow        = new TSnow();                     // Snow melt data
var Adjust      = new TAdjust();                   // Climate adjustments

var Snowmelt = []                // Array of snow melt objects
var Gage = []                     // Array of rain gages
var Subcatch = []                 // Array of subcatchments
var Aquifer = []                  // Array of groundwater aquifers
var UnitHyd = []                  // Array of unit hydrographs
var Node = []                     // Array of nodes
var Outfall = []                  // Array of outfall nodes
var Divider = []                  // Array of divider nodes
var Storage = []                  // Array of storage nodes
var Link = []                     // Array of links
var Conduit = []                  // Array of conduit links
var Pump = []                     // Array of pump links
var Orifice = []                  // Array of orifice links
var Weir = []                     // Array of weir links
var Outlet = []                   // Array of outlet device links
var Pollut = []                   // Array of pollutants
var Landuse = []                  // Array of landuses
var Pattern = []                  // Array of time patterns
var Curve = []                    // Array of curve tables
var Tseries = []                  // Array of time series tables
var Transect = []                 // Array of transect data
var Shape = []                    // Array of custom conduit shapes
var Event = []                    // Array of routing events

/*
var Snowmelt    = new TSnowmelt();                 // Array of snow melt objects
var Gage        = new TGage();                     // Array of rain gages
var Subcatch    = new TSubcatch();                 // Array of subcatchments
var Aquifer     = new TAquifer();                  // Array of groundwater aquifers
var UnitHyd     = new TUnitHyd();                  // Array of unit hydrographs
var Node        = new TNode();                     // Array of nodes
var Outfall     = new TOutfall();                  // Array of outfall nodes
var Divider     = new TDivider();                  // Array of divider nodes
var Storage     = new TStorage();                  // Array of storage nodes
var Link        = new TLink();                     // Array of links
var Conduit     = new TConduit();                  // Array of conduit links
var Pump        = new TPump();                     // Array of pump links
var Orifice     = new TOrifice();                  // Array of orifice links
var Weir        = new TWeir();                     // Array of weir links
var Outlet      = new TOutlet();                   // Array of outlet device links
var Pollut      = new TPollut();                   // Array of pollutants
var Landuse     = new TLanduse();                  // Array of landuses
var Pattern     = new TPattern();                  // Array of time patterns
var Curve       = new TTable();                    // Array of curve tables
var Tseries     = new TTable();                    // Array of time series tables
var Transect    = new TTransect();                 // Array of transect data
var Shape       = new TShape();                    // Array of custom conduit shapes
var Event       = new TEvent();                    // Array of routing events
*/


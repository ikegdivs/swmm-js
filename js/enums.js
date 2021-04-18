//-----------------------------------------------------------------------------
//   enums.h
//
//   Project: EPA SWMM5
//   Version: 5.1
//   Date:    03/20/14  (Build 5.1.001)
//            04/14/14  (Build 5.1.004)
//            09/15/14  (Build 5.1.007)
//            03/19/15  (Build 5.1.008)
//            08/05/15  (Build 5.1.010)
//            08/01/16  (Build 5.1.011)
//            05/10/18  (Build 5.1.013)
//   Author:  L. Rossman
//
//   Enumerated variables
//
//   Build 5.1.004:
//   - IGNORE_RDII for the ignore RDII option added.
//
//   Build 5.1.007:
//   - s_GWF for [GWF] input file section added.
//   - s_ADJUST for [ADJUSTMENTS] input file section added.
//
//   Build 5.1.008:
//   - Enumerations for fullness state of a conduit added.
//   - NUM_THREADS added for number of parallel threads option.
//   - Runoff flow categories added to represent mass balance components.
//
//   Build 5.1.010:
//   - New ROADWAY_WEIR type of weir added.
//   - Potential evapotranspiration (PET) added as a system output variable.
//
//   Build 5.1.011:
//   - s_EVENT added to InputSectionType enumeration.
//
//   Build 5.1.013:
//   - SURCHARGE_METHOD and RULE_STEP options added.
//   - WEIR_CURVE added as a curve type.
//
//-----------------------------------------------------------------------------

//mempool.c
var ALLOC_BLOCK_SIZE =  64000

//-------------------------------------
// Names of major object types
//-------------------------------------

var GAGE = 0                            // rain gage
var SUBCATCH = 1                        // subcatchment
var NODE = 2                            // conveyance system node
var LINK = 3                            // conveyance system link
var POLLUT = 4                          // pollutant
var LANDUSE = 5                         // land use category
var TIMEPATTERN = 6                     // dry weather flow time pattern
var CURVE = 7                           // generic table of values
var TSERIES = 8                         // generic time series of values
var CONTROL = 9                         // conveyance system control rules
var TRANSECT = 10                       // irregular channel cross-section
var AQUIFER = 11                        // groundwater aquifer
var UNITHYD = 12                        // RDII unit hydrograph
var SNOWMELT = 13                       // snowmelt parameter set
var SHAPE = 14                          // custom conduit shape
var LID = 15                            // LID treatment units
var MAX_OBJ_TYPES = 16

//-------------------------------------
// Names of Node sub-types
//-------------------------------------
var MAX_NODE_TYPES = 4

var JUNCTION = 0
var OUTFALL = 1
var STORAGE = 2
var DIVIDER = 3

//-------------------------------------
// Names of Link sub-types
//-------------------------------------
var MAX_LINK_TYPES = 5

var CONDUIT = 0
var PUMP = 1
var ORIFICE = 2
var WEIR = 3
var OUTLET = 4

//-------------------------------------
// File types
//-------------------------------------

var RAINFALL_FILE = 0                   // rainfall file
var RUNOFF_FILE = 1                     // runoff file
var HOTSTART_FILE = 2                   // hotstart file
var RDII_FILE = 3                       // RDII file
var INFLOWS_FILE = 4                    // inflows interface file
var OUTFLOWS_FILE = 5                    // outflows interface file

//-------------------------------------
// File usage types
//-------------------------------------
var NO_FILE = 0                         // no file usage
var SCRATCH_FILE = 1                    // use temporary scratch file
var USE_FILE = 2                        // use previously saved file
var SAVE_FILE = 3                        // save file currently in use

//-------------------------------------
// Rain gage data types
//-------------------------------------

var RAIN_TSERIES = 0                     // rainfall from user-supplied time series
var RAIN_FILE = 1                        // rainfall from external file

//-------------------------------------
// Cross section shape types
//-------------------------------------
 
var DUMMY = 0                           // 0
var CIRCULAR = 1                        // 1      closed
var FILLED_CIRCULAR = 2                 // 2      closed
var RECT_CLOSED = 3                     // 3      closed
var RECT_OPEN = 4                       // 4
var TRAPEZOIDAL = 5                     // 5
var TRIANGULAR = 6                      // 6
var PARABOLIC = 7                       // 7
var POWERFUNC = 8                       // 8
var RECT_TRIANG = 9                     // 9
var RECT_ROUND = 10                      // 10
var MOD_BASKET = 11                      // 11
var HORIZ_ELLIPSE = 12                   // 12     closed
var VERT_ELLIPSE = 13                    // 13     closed
var ARCH = 14                            // 14     closed
var EGGSHAPED = 15                       // 15     closed
var HORSESHOE = 16                       // 16     closed
var GOTHIC = 17                          // 17     closed
var CATENARY = 18                        // 18     closed
var SEMIELLIPTICAL = 19                  // 19     closed
var BASKETHANDLE = 20                    // 20     closed
var SEMICIRCULAR = 21                    // 21     closed
var IRREGULAR = 22                       // 22
var CUSTOM = 23                          // 23     closed
var FORCE_MAIN  = 24                     // 24     closed

//-------------------------------------
// Measurement units types
//-------------------------------------

var US = 0                              // US units
var SI = 1                             // SI (metric) units

 //enum FlowUnitsType {
var CFS = 0                             // cubic feet per second
var GPM = 1                             // gallons per minute
var MGD = 2                             // million gallons per day
var CMS = 3                             // cubic meters per second
var LPS = 4                             // liters per second
var MLD = 5                             // million liters per day

 //enum ConcUnitsType {
var MG = 0                              // Milligrams / L
var UG = 1                              // Micrograms / L
var COUNT = 2                           // Counts / L

//--------------------------------------
// Quantities requiring unit conversions
//--------------------------------------
 //enum ConversionType {
var RAINFALL = 0
var RAINDEPTH = 1
var EVAPRATE = 2
var LENGTH = 3
var LANDAREA = 4
var VOLUME = 5
var WINDSPEED = 6
var TEMPERATURE = 7
var MASS = 8
var GWFLOW = 9
var FLOW = 10                           // Flow must always be listed last

//-------------------------------------
// Computed subcatchment quantities
//-------------------------------------
var MAX_SUBCATCH_RESULTS = 9
 //enum SubcatchResultType {
var SUBCATCH_RAINFALL = 0               // rainfall intensity
var SUBCATCH_SNOWDEPTH = 1              // snow depth
var SUBCATCH_EVAP = 2                   // evap loss
var SUBCATCH_INFIL = 3                  // infil loss
var SUBCATCH_RUNOFF = 4                 // runoff flow rate
var SUBCATCH_GW_FLOW = 5                // groundwater flow rate to node
var SUBCATCH_GW_ELEV = 6                // elevation of saturated gw table
var SUBCATCH_SOIL_MOIST = 7             // soil moisture
var SUBCATCH_WASHOFF = 8                // pollutant washoff concentration

//-------------------------------------
// Computed node quantities
//-------------------------------------
var MAX_NODE_RESULTS = 7
//enum NodeResultType {
var NODE_DEPTH = 0                      // water depth above invert
var NODE_HEAD = 1                       // hydraulic head
var NODE_VOLUME = 2                     // volume stored & ponded
var NODE_LATFLOW = 3                    // lateral inflow rate
var NODE_INFLOW = 4                     // total inflow rate
var NODE_OVERFLOW = 5                   // overflow rate
var NODE_QUAL = 6                       // concentration of each pollutant

//-------------------------------------
// Computed link quantities
//-------------------------------------
var MAX_LINK_RESULTS = 6
//enum LinkResultType {
var LINK_FLOW = 0                        // flow rate
var LINK_DEPTH = 1                       // flow depth
var LINK_VELOCITY = 2                    // flow velocity
var LINK_VOLUME = 3                      // link volume
var LINK_CAPACITY = 4                    // ratio of area to full area
var LINK_QUAL = 5                        // concentration of each pollutant

//-------------------------------------
// System-wide flow quantities
//-------------------------------------
var MAX_SYS_RESULTS = 15
//enum SysFlowType {
     SYS_TEMPERATURE = 0                  // air temperature
     SYS_RAINFALL = 1                     // rainfall intensity
     SYS_SNOWDEPTH = 2                    // snow depth
     SYS_INFIL = 3                        // infil
     SYS_RUNOFF = 4                       // runoff flow
     SYS_DWFLOW = 5                       // dry weather inflow
     SYS_GWFLOW = 6                       // ground water inflow
     SYS_IIFLOW = 7                       // RDII inflow
     SYS_EXFLOW = 8                       // external inflow
     SYS_INFLOW = 9                       // total lateral inflow
     SYS_FLOODING = 10                     // flooding outflow
     SYS_OUTFLOW = 11                      // outfall outflow
     SYS_STORAGE = 12                      // storage volume
     SYS_EVAP = 13                         // evaporation
     SYS_PET = 14                          // potential ET

//-------------------------------------
// Conduit flow classifications
//-------------------------------------
//enum FlowClassType {
var DRY = 0                             // dry conduit
var UP_DRY = 1                          // upstream end is dry
var DN_DRY = 2                          // downstream end is dry
var SUBCRITICAL = 3                     // sub-critical flow
var SUPCRITICAL = 4                     // super-critical flow
var UP_CRITICAL = 5                     // free-fall at upstream end
var DN_CRITICAL = 6                     // free-fall at downstream end
var MAX_FLOW_CLASSES = 7                // number of distinct flow classes
var UP_FULL = 8                         // upstream end is full
var DN_FULL = 9                         // downstream end is full
var ALL_FULL = 10                       // completely full

//------------------------
// Runoff flow categories
//------------------------
//enum RunoffFlowType {
var RUNOFF_RAINFALL = 0                  // rainfall
var RUNOFF_EVAP = 1                      // evaporation
var RUNOFF_INFIL = 2                     // infiltration
var RUNOFF_RUNOFF = 3                    // runoff
var RUNOFF_DRAINS = 4                    // LID drain flow
var RUNOFF_RUNON = 5                     // runon from outfalls

//-------------------------------------
// Surface pollutant loading categories
//-------------------------------------
//enum LoadingType {
var BUILDUP_LOAD = 0                    // pollutant buildup load
var DEPOSITION_LOAD = 1                 // rainfall deposition load
var SWEEPING_LOAD = 2                   // load removed by sweeping
var BMP_REMOVAL_LOAD = 3                // load removed by BMPs
var INFIL_LOAD = 4                      // runon load removed by infiltration
var RUNOFF_LOAD = 5                     // load removed by runoff
var FINAL_LOAD = 6                      // load remaining on surface

//-------------------------------------
// Input data options
//-------------------------------------
//enum RainfallType {
var RAINFALL_INTENSITY = 0              // rainfall expressed as intensity
var RAINFALL_VOLUME = 1                 // rainfall expressed as volume
var CUMULATIVE_RAINFALL = 2             // rainfall expressed as cumulative volume

//enum TempType {
var NO_TEMP = 0                         // no temperature data supplied
var TSERIES_TEMP = 1                    // temperatures come from time series
var FILE_TEMP = 2                       // temperatures come from file

//enum  WindType {
var MONTHLY_WIND = 0                    // wind speed varies by month
var FILE_WIND = 1                       // wind speed comes from file

//enum EvapType {
var CONSTANT_EVAP = 0                   // constant evaporation rate
var MONTHLY_EVAP = 1                    // evaporation rate varies by month
var TIMESERIES_EVAP = 2                 // evaporation supplied by time series
var TEMPERATURE_EVAP = 3                // evaporation from daily temperature
var FILE_EVAP = 4                       // evaporation comes from file
var RECOVERY = 5                        // soil recovery pattern
var DRYONLY = 6                         // evap. allowed only in dry periods

//enum NormalizerType {
var PER_AREA = 0                       // buildup is per unit or area
var PER_CURB = 1                       // buildup is per unit of curb length

//enum BuildupType {
var NO_BUILDUP = 0                      // no buildup
var POWER_BUILDUP = 1                   // power function buildup equation
var EXPON_BUILDUP = 2                   // exponential function buildup equation
var SATUR_BUILDUP = 3                   // saturation function buildup equation
var EXTERNAL_BUILDUP = 4                // external time series buildup

//enum WashoffType {
var NO_WASHOFF = 0                      // no washoff
var EXPON_WASHOFF = 1                   // exponential washoff equation
var RATING_WASHOFF = 2                  // rating curve washoff equation
var EMC_WASHOFF = 3                     // event mean concentration washoff

//enum  SubAreaType {
var IMPERV0 = 0                         // impervious w/o depression storage
var IMPERV1 = 1                         // impervious w/ depression storage
var PERV = 2                            // pervious

//enum RunoffRoutingType {
var TO_OUTLET = 0                       // perv & imperv runoff goes to outlet
var TO_IMPERV = 1                       // perv runoff goes to imperv area
var TO_PERV = 2                        // imperv runoff goes to perv subarea

//enum RouteModelType {
var NO_ROUTING = 0                      // no routing
var SF = 1                              // steady flow model
var KW = 2                              // kinematic wave model
var EKW = 3                             // extended kin. wave model
var DW = 4                              // dynamic wave model

//enum ForceMainType {
var H_W = 0                             // Hazen-Williams eqn.
var D_W = 1                             // Darcy-Weisbach eqn.

//enum OffsetType {
var DEPTH_OFFSET = 0                    // offset measured as depth
var ELEV_OFFSET = 1                     // offset measured as elevation

//enum KinWaveMethodType {
var NORMAL = 0                          // normal method
var MODIFIED = 1                        // modified method

//enum  CompatibilityType {
var SWMM5 = 0                           // SWMM 5 weighting for area & hyd. radius
var SWMM3 = 1                           // SWMM 3 weighting
var SWMM4 = 2                           // SWMM 4 weighting

//enum NormalFlowType {
var SLOPE = 0                           // based on slope only
var FROUDE = 1                          // based on Fr only
var BOTH = 2                            // based on slope & Fr

//enum InertialDampingType {
var NO_DAMPING = 0                      // no inertial damping
var PARTIAL_DAMPING = 1                 // partial damping
var FULL_DAMPING = 2                    // full damping

////  Added to release 5.1.013.  ////                                          //(5.1.013)
//enum  SurchargeMethodType {
var EXTRAN = 0                          // original EXTRAN method
var SLOT = 1                            // Preissmann slot method

//enum InflowType {
var EXTERNAL_INFLOW = 0                 // user-supplied external inflow
var DRY_WEATHER_INFLOW = 1              // user-supplied dry weather inflow
var WET_WEATHER_INFLOW = 2              // computed runoff inflow
var GROUNDWATER_INFLOW = 3              // computed groundwater inflow
var RDII_INFLOW = 4                     // computed I&I inflow
var FLOW_INFLOW = 5                     // inflow parameter is flow
var CONCEN_INFLOW = 6                   // inflow parameter is pollutant concen.
var MASS_INFLOW  = 7                    // inflow parameter is pollutant mass

//enum PatternType {
var MONTHLY_PATTERN = 0                 // DWF multipliers for each month
var DAILY_PATTERN = 1                   // DWF multipliers for each day of week
var HOURLY_PATTERN = 2                  // DWF multipliers for each hour of day
var WEEKEND_PATTERN = 3                 // hourly multipliers for week end days

//enum OutfallType {
var FREE_OUTFALL = 0                    // critical depth outfall condition
var NORMAL_OUTFALL = 1                  // normal flow depth outfall condition
var FIXED_OUTFALL = 2                   // fixed depth outfall condition
var TIDAL_OUTFALL = 3                   // variable tidal stage outfall condition
var TIMESERIES_OUTFALL = 4              // variable time series outfall depth

//enum StorageType {
var TABULAR = 0                         // area v. depth from table
var FUNCTIONAL = 1                      // area v. depth from power function

//enum ReactorType {
var CSTR = 0                            // completely mixed reactor
var PLUG = 1                            // plug flow reactor

//enum TreatmentType {
var REMOVAL = 0                         // treatment stated as a removal
var CONCEN = 1                          // treatment stated as effluent concen.

//enum DividerType {
var CUTOFF_DIVIDER = 0                  // diverted flow is excess of cutoff flow
var TABULAR_DIVIDER = 1                 // table of diverted flow v. inflow
var WEIR_DIVIDER = 2                    // diverted flow proportional to excess flow
var OVERFLOW_DIVIDER = 3                // diverted flow is flow > full conduit flow

//enum PumpCurveType {
var TYPE1_PUMP = 0                      // flow varies stepwise with wet well volume
var TYPE2_PUMP = 1                      // flow varies stepwise with inlet depth
var TYPE3_PUMP = 2                      // flow varies with head delivered
var TYPE4_PUMP = 3                      // flow varies with inlet depth
var IDEAL_PUMP = 4                      // outflow equals inflow

//enum OrificeType {
var SIDE_ORIFICE = 0                    // side orifice
var BOTTOM_ORIFICE = 1                  // bottom orifice

//enum WeirType {
var TRANSVERSE_WEIR = 0                 // transverse weir
var SIDEFLOW_WEIR = 1                   // side flow weir
var VNOTCH_WEIR = 2                     // V-notch (triangular) weir
var TRAPEZOIDAL_WEIR = 3                // trapezoidal weir
var ROADWAY_WEIR = 4                    // FHWA HDS-5 roadway weir

//enum CurveType {
var STORAGE_CURVE = 0                   // surf. area v. depth for storage node
var DIVERSION_CURVE = 1                 // diverted flow v. inflow for divider node
var TIDAL_CURVE = 2                     // water elev. v. hour of day for outfall
var RATING_CURVE = 3                    // flow rate v. head for outlet link
var CONTROL_CURVE = 4                   // control setting v. controller variable
var SHAPE_CURVE = 5                     // width v. depth for custom x-section
var WEIR_CURVE = 6                      // discharge coeff. v. head for weir    //(5.1.013)
var PUMP1_CURVE = 7                     // flow v. wet well volume for pump
var PUMP2_CURVE = 8                     // flow v. depth for pump (discrete)
var PUMP3_CURVE = 9                     // flow v. head for pump (continuous)
var PUMP4_CURVE = 10                    // flow v. depth for pump (continuous)

//enum InputSectionType {
var s_TITLE = 0
var s_OPTION = 1
var s_FILE = 2
var s_RAINGAGE = 3
var s_TEMP = 4
var s_EVAP = 5
var s_SUBCATCH = 6
var s_SUBAREA = 7
var s_INFIL = 8
var s_AQUIFER = 9
var s_GROUNDWATER = 10
var s_SNOWMELT = 11
var s_JUNCTION = 12
var s_OUTFALL = 13
var s_STORAGE = 14
var s_DIVIDER = 15
var s_CONDUIT = 16
var s_PUMP = 17
var s_ORIFICE = 18
var s_WEIR = 19
var s_OUTLET = 20
var s_XSECTION = 21
var s_TRANSECT = 22
var s_LOSSES = 23
var s_CONTROL = 24
var s_POLLUTANT = 25
var s_LANDUSE = 26
var s_BUILDUP = 27
var s_WASHOFF = 28
var s_COVERAGE = 29
var s_INFLOW = 30
var s_DWF = 31
var s_PATTERN = 32
var s_RDII = 33
var s_UNITHYD = 34
var s_LOADING = 35
var s_TREATMENT = 36
var s_CURVE = 37
var s_TIMESERIES = 38
var s_REPORT = 39
var s_COORDINATE = 40
var s_VERTICES = 41
var s_POLYGON = 42
var s_LABEL = 43
var s_SYMBOL = 44
var s_BACKDROP = 45
var s_TAG = 46
var s_PROFILE = 47
var s_MAP = 48
var s_LID_CONTROL = 49
var s_LID_USAGE = 50
var s_GWF = 51
var s_ADJUST = 52
var s_EVENT = 53

//enum InputOptionType {
var FLOW_UNITS = 0
var INFIL_MODEL = 1
var  ROUTE_MODEL = 2
var START_DATE = 3
var START_TIME = 4
var END_DATE = 5
var END_TIME = 6
var REPORT_START_DATE = 7
var REPORT_START_TIME = 8
var SWEEP_START = 9
var SWEEP_END = 10
var START_DRY_DAYS = 11
var WET_STEP = 12
var DRY_STEP = 13
var ROUTE_STEP = 14
var RULE_STEP = 15
var REPORT_STEP = 16
var ALLOW_PONDING = 17
var INERT_DAMPING = 18
var SLOPE_WEIGHTING = 19
var VARIABLE_STEP = 20
var NORMAL_FLOW_LTD = 21
var LENGTHENING_STEP = 22
var MIN_SURFAREA = 23 
var COMPATIBILITY = 24
var SKIP_STEADY_STATE = 25
var TEMPDIR = 26
var IGNORE_RAINFALL = 27
var FORCE_MAIN_EQN = 28
var LINK_OFFSETS = 29
var MIN_SLOPE = 30
var IGNORE_SNOWMELT = 31
var IGNORE_GWATER = 32
var IGNORE_ROUTING = 33
var IGNORE_QUALITY = 34
var MAX_TRIALS = 35
var HEAD_TOL = 36
var SYS_FLOW_TOL = 37
var LAT_FLOW_TOL = 38
var IGNORE_RDII = 39
var MIN_ROUTE_STEP = 40
var NUM_THREADS = 41
var SURCHARGE_METHOD = 42                            //(5.1.013)

//enum  NoYesType {
var NO = 0
var YES = 1

//enum  NoneAllType {
var NONE = 0
var ALL = 1
var SOME = 2



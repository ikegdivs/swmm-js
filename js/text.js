//-----------------------------------------------------------------------------
//   text.h
//
//   Project: EPA SWMM5
//   Version: 5.1
//   Date:    03/19/14  (Build 5.1.001)
//            04/02/14  (Build 5.1.003)
//            04/14/14  (Build 5.1.004)
//            04/23/14  (Build 5.1.005)
//            05/19/14  (Build 5.1.006)
//            09/15/14  (Build 5.1.007)
//            03/19/15  (Build 5.1.008)
//            04/30/15  (Build 5.1.009)
//            08/05/15  (Build 5.1.010)
//            08/01/16  (Build 5.1.011)
//            03/14/17  (Build 5.1.012)
//            05/10/18  (Build 5.1.013)
//            03/01/20  (Build 5.1.014)
//            04/01/20  (Build 5.1.015)
//
//   Author:  L. Rossman
//
//   Text strings
//-----------------------------------------------------------------------------

var  FMT01 = "\tswmm5 <input file> <report file> <output file>\n"

var  FMT03 = " There are errors.\n"
var  FMT04 = " There are warnings.\n"
var  FMT05 = "\n"
var  FMT06 = "\n o  Retrieving project data"
var  FMT07 = "\n o  Writing output report"
var  FMT08 = "\n  EPA STORM WATER MANAGEMENT MODEL - VERSION 5.1 (Build 5.1.015)"         //(5.1.015)
var  FMT09 = "\n  --------------------------------------------------------------"
var  FMT10 = "\n"
var  FMT11  = "\n    Cannot use duplicate file names."
var  FMT12  = "\n    Cannot open input file = "
var  FMT13  = "\n    Cannot open report file = "
var  FMT14  = "\n    Cannot open output file = "
var  FMT15  = "\n    Cannot open temporary output file"
var  FMT16  = "\n  ERROR %d detected. Execution halted."
var  FMT17  = "at line %ld of input file:"                                    //(5.1.013)
var  FMT18  = "at line %ld of %s] section:"                                   //(5.1.013)
var  FMT19  = "\n  Maximum error count exceeded."
var  FMT20  = "\n\n  Analysis begun on:  {0}"
var  FMT20a = "  Analysis ended on:  {0}"
var  FMT21  = "  Total elapsed time: = "

// Warning messages
var  WARN01 = "WARNING 01: wet weather time step reduced to recording interval for Rain Gage"
var  WARN02 = "WARNING 02: maximum depth increased for Node"
var  WARN03 = "WARNING 03: negative offset ignored for Link"
var  WARN04 = "WARNING 04: minimum elevation drop used for Conduit"
var  WARN05 = "WARNING 05: minimum slope used for Conduit"
var  WARN06 = "WARNING 06: dry weather time step increased to the wet weather time step"
var  WARN07 = "WARNING 07: routing time step reduced to the wet weather time step"
var  WARN08 = "WARNING 08: elevation drop exceeds length for Conduit"
var  WARN09 = "WARNING 09: time series interval greater than recording interval for Rain Gage"
var  WARN10a ="WARNING 10: crest elevation is below downstream invert for regulator Link"    //(5.1.013)
var  WARN10b ="WARNING 10: crest elevation raised to downstream invert for regulator Link"   //(5.1.013)
var  WARN11 = "WARNING 11: non-matching attributes in Control Rule"

// Analysis Option Keywords
var   w_FLOW_UNITS        = "FLOW_UNITS"
var   w_INFIL_MODEL       = "INFILTRATION"
var   w_ROUTE_MODEL       = "FLOW_ROUTING"
var   w_START_DATE        = "START_DATE"
var   w_START_TIME        = "START_TIME"
var   w_END_DATE          = "END_DATE"
var   w_END_TIME          = "END_TIME"
var   w_REPORT_START_DATE = "REPORT_START_DATE"
var   w_REPORT_START_TIME = "REPORT_START_TIME"
var   w_SWEEP_START       = "SWEEP_START"
var   w_SWEEP_END         = "SWEEP_END"
var   w_START_DRY_DAYS    = "DRY_DAYS"
var   w_WET_STEP          = "WET_STEP"
var   w_DRY_STEP          = "DRY_STEP"
var   w_ROUTE_STEP        = "ROUTING_STEP"
var   w_REPORT_STEP       = "REPORT_STEP"
var   w_RULE_STEP         = "RULE_STEP"                                       //(5.1.013)
var   w_ALLOW_PONDING     = "ALLOW_PONDING"
var   w_INERT_DAMPING     = "INERTIAL_DAMPING"
var   w_SLOPE_WEIGHTING   = "SLOPE_WEIGHTING"
var   w_VARIABLE_STEP     = "VARIABLE_STEP"
var   w_NORMAL_FLOW_LTD   = "NORMAL_FLOW_LIMITED"
var   w_LENGTHENING_STEP  = "LENGTHENING_STEP"
var   w_MIN_SURFAREA      = "MIN_SURFAREA"
var   w_COMPATIBILITY     = "COMPATIBILITY"
var   w_SKIP_STEADY_STATE = "SKIP_STEADY_STATE"
var   w_TEMPDIR           = "TEMPDIR"
var   w_IGNORE_RAINFALL   = "IGNORE_RAINFALL"
var   w_FORCE_MAIN_EQN    = "FORCE_MAIN_EQUATION"
var   w_LINK_OFFSETS      = "LINK_OFFSETS"
var   w_MIN_SLOPE         = "MIN_SLOPE"
var   w_IGNORE_SNOWMELT   = "IGNORE_SNOWMELT"
var   w_IGNORE_GWATER     = "IGNORE_GROUNDWATER"
var   w_IGNORE_ROUTING    = "IGNORE_ROUTING"
var   w_IGNORE_QUALITY    = "IGNORE_QUALITY"
var   w_MAX_TRIALS        = "MAX_TRIALS"
var   w_HEAD_TOL          = "HEAD_TOLERANCE"
var   w_SYS_FLOW_TOL      = "SYS_FLOW_TOL"
var   w_LAT_FLOW_TOL      = "LAT_FLOW_TOL"
var   w_IGNORE_RDII       = "IGNORE_RDII"
var   w_MIN_ROUTE_STEP    = "MINIMUM_STEP"
var   w_NUM_THREADS       = "THREADS"
var   w_SURCHARGE_METHOD  = "SURCHARGE_METHOD"                                //(5.1.013)

// Flow Units
var   w_CFS               = "CFS"
var   w_GPM               = "GPM"
var   w_MGD               = "MGD"
var   w_CMS               = "CMS"
var   w_LPS               = "LPS"
var   w_MLD               = "MLD"

// Flow Routing Methods
var   w_NF                = "NF"
var   w_KW                = "KW"
var   w_EKW               = "EKW"
var   w_DW                = "DW"

var   w_STEADY            = "STEADY"
var   w_KINWAVE           = "KINWAVE"
var   w_XKINWAVE          = "XKINWAVE"
var   w_DYNWAVE           = "DYNWAVE"

// Surcharge Methods                                                           //(5.1.013)
var   w_EXTRAN            = "EXTRAN"
var   w_SLOT              = "SLOT"

// Infiltration Methods
var   w_HORTON            = "HORTON"
var   w_MOD_HORTON        = "MODIFIED_HORTON"
var   w_GREEN_AMPT        = "GREEN_AMPT"
var   w_MOD_GREEN_AMPT    = "MODIFIED_GREEN_AMPT"
var   w_CURVE_NUMEBR      = "CURVE_NUMBER"

// Normal Flow Criteria
var   w_SLOPE             = "SLOPE"
var   w_FROUDE            = "FROUDE"
var   w_BOTH              = "BOTH"

// Snowmelt Data Keywords
var   w_WINDSPEED         = "WINDSPEED"
var   w_SNOWMELT          = "SNOWMELT"
var   w_ADC               = "ADC"
var   w_PLOWABLE          = "PLOWABLE"

// Evaporation Data Options
var   w_CONSTANT          = "CONSTANT"
var   w_TIMESERIES        = "TIMESERIES"
var   w_TEMPERATURE       = "TEMPERATURE"
var   w_FILE              = "FILE"
var   w_RECOVERY          = "RECOVERY"
var   w_DRYONLY           = "DRY_ONLY"

// DWF Time Pattern Types
var   w_MONTHLY           = "MONTHLY"
var   w_DAILY             = "DAILY"
var   w_HOURLY            = "HOURLY"
var   w_WEEKEND           = "WEEKEND"

// Rainfall Record Types
var   w_INTENSITY         = "INTENSITY"
var   w_VOLUME            = "VOLUME"
var   w_CUMULATIVE        = "CUMULATIVE"

// Unit Hydrograph Types
var   w_SHORT             = "SHORT"
var   w_MEDIUM            = "MEDIUM"
var   w_LONG              = "LONG"

// Internal Runoff Routing Options
var   w_OUTLET            = "OUTLET"
var   w_IMPERV            = "IMPERV"
var   w_PERV              = "PERV"

// Outfall Node Types
var   w_FREE              = "FREE"
var   w_FIXED             = "FIXED"
var   w_TIDAL             = "TIDAL"
var   w_CRITICAL          = "CRITICAL"
var   w_NORMAL            = "NORMAL"

// Flow Divider Node Types
var   w_FUNCTIONAL        = "FUNCTIONAL"
var   w_TABULAR           = "TABULAR"
var   w_CUTOFF            = "CUTOFF"
var   w_OVERFLOW          = "OVERFLOW"

// Pump Curve Types
var   w_TYPE1             = "TYPE1"
var   w_TYPE2             = "TYPE2"
var   w_TYPE3             = "TYPE3"
var   w_TYPE4             = "TYPE4"
var   w_IDEAL             = "IDEAL"

// Pump Curve Variables
var   w_VOLUME            = "VOLUME"
var   w_DEPTH             = "DEPTH"
var   w_HEAD              = "HEAD"

// Orifice Types
var   w_SIDE              = "SIDE"
var   w_BOTTOM            = "BOTTOM"

// Weir Types
var   w_TRANSVERSE        = "TRANSVERSE"
var   w_SIDEFLOW          = "SIDEFLOW"
var   w_VNOTCH            = "V-NOTCH"
var   w_ROADWAY           = "ROADWAY"

// Conduit Cross-Section Shapes
var   w_DUMMY             = "DUMMY"
var   w_CIRCULAR          = "CIRCULAR"
var   w_FILLED_CIRCULAR   = "FILLED_CIRCULAR"
var   w_RECT_CLOSED       = "RECT_CLOSED"
var   w_RECT_OPEN         = "RECT_OPEN"
var   w_TRAPEZOIDAL       = "TRAPEZOIDAL"
var   w_TRIANGULAR        = "TRIANGULAR"
var   w_PARABOLIC         = "PARABOLIC"
var   w_POWERFUNC         = "POWER"
var   w_RECT_TRIANG       = "RECT_TRIANGULAR"
var   w_RECT_ROUND        = "RECT_ROUND"
var   w_MOD_BASKET        = "MODBASKETHANDLE"
var   w_HORIZELLIPSE      = "HORIZ_ELLIPSE"
var   w_VERTELLIPSE       = "VERT_ELLIPSE"
var   w_ARCH              = "ARCH"
var   w_EGGSHAPED         = "EGG"
var   w_HORSESHOE         = "HORSESHOE"
var   w_GOTHIC            = "GOTHIC"
var   w_CATENARY          = "CATENARY"
var   w_SEMIELLIPTICAL    = "SEMIELLIPTICAL"
var   w_BASKETHANDLE      = "BASKETHANDLE"
var   w_SEMICIRCULAR      = "SEMICIRCULAR"
var   w_IRREGULAR         = "IRREGULAR"
var   w_CUSTOM            = "CUSTOM"
var   w_FORCE_MAIN        = "FORCE_MAIN"
var   w_H_W               = "H-W"
var   w_D_W               = "D-W"

// Link Offset Options
var   w_ELEVATION         = "ELEVATION"

// Transect Data Input Codes
var   w_NC                = "NC"
var   w_X1                = "X1"
var   w_GR                = "GR"

// Rain Volume Units
var   w_INCHES            = "IN"
var   w_MMETER            = "MM"

// Flow Volume Units
var   w_MGAL              = "10^6 gal"
var   w_MLTRS             = "10^6 ltr"
var   w_GAL               = "gal"
var   w_LTR               = "ltr"

// Ponded Depth Units
var   w_PONDED_FEET       = "Feet"
var   w_PONDED_METERS     = "Meters"

// Concentration Units
var   w_MGperL            = "MG/L"
var   w_UGperL            = "UG/L"
var   w_COUNTperL         = "#/L"

// Mass Units
var   w_MG                = "MG"
var   w_UG                = "UG"
var   w_COUNT             = "#"

// Load Units
var   w_LBS               = "lbs"
var   w_KG                = "kg"
var   w_LOGN              = "LogN"

// Pollutant Buildup Functions
var   w_POW               = "POW"
var   w_EXP               = "EXP"
var   w_SAT               = "SAT"
var   w_EXT               = "EXT"

// Normalizing Variables for Pollutant Buildup
var   w_PER_AREA          = "AREA"
var   w_PER_CURB          = "CURB"

// Pollutant Washoff Functions
// (EXP function defined above)
var   w_RC                = "RC"
var   w_EMC               = "EMC"

// Treatment Keywords
var   w_REMOVAL           = "REMOVAL"
var   w_RATE              = "RATE"
var   w_HRT               = "HRT"
var   w_DT                = "DT"
var   w_AREA              = "AREA"

// Curve Types
//define  w_STORAGE (defined below)
var   w_DIVERSION         = "DIVERSION"
var   w_TIDAL             = "TIDAL"
var   w_RATING            = "RATING"
var   w_SHAPE             = "SHAPE"
var   w_PUMP1             = "PUMP1"
var   w_PUMP2             = "PUMP2"
var   w_PUMP3             = "PUMP3"
var   w_PUMP4             = "PUMP4"

// Reporting Options
var   w_INPUT             = "INPUT"
var   w_CONTINUITY        = "CONTINUITY"
var   w_FLOWSTATS         = "FLOWSTATS"
var   w_CONTROLS          = "CONTROL"
var   w_NODESTATS         = "NODESTATS"
var   w_AVERAGES          = "AVERAGES"                                        //(5.1.013)

// Interface File Types
var   w_RAINFALL          = "RAINFALL"
var   w_RUNOFF            = "RUNOFF"
var   w_HOTSTART          = "HOTSTART"
var   w_RDII              = "RDII"
var   w_ROUTING           = "ROUTING"
var   w_INFLOWS           = "INFLOWS"
var   w_OUTFLOWS          = "OUTFLOWS"

// Miscellaneous Keywords
var   w_OFF               = "OFF"
var   w_ON                = "ON"
var   w_NO                = "NO"
var   w_YES               = "YES"
var   w_NONE              = "NONE"
var   w_ALL               = "ALL"
var   w_SCRATCH           = "SCRATCH"
var   w_USE               = "USE"
var   w_SAVE              = "SAVE"
var   w_FULL              = "FULL"
var   w_PARTIAL           = "PARTIAL"

// Major Object Types
var   w_GAGE              = "RAINGAGE"
var   w_SUBCATCH          = "SUBCATCH"
var   w_NODE              = "NODE"
var   w_LINK              = "LINK"
var   w_POLLUT            = "POLLUTANT"
var   w_LANDUSE           = "LANDUSE"
var   w_TSERIES           = "TIME SERIES"
var   w_TABLE             = "TABLE"
var   w_UNITHYD           = "HYDROGRAPH"

// Node Sub-Types
var   w_JUNCTION          = "JUNCTION"
var   w_OUTFALL           = "OUTFALL"
var   w_STORAGE           = "STORAGE"
var   w_DIVIDER           = "DIVIDER"

// Link Sub-Types
var   w_CONDUIT           = "CONDUIT"
var   w_PUMP              = "PUMP"
var   w_ORIFICE           = "ORIFICE"
var   w_WEIR              = "WEIR"

// Control Rule Keywords
var   w_RULE              = "RULE"
var   w_IF                = "IF"
var   w_AND               = "AND"
var   w_OR                = "OR"
var   w_THEN              = "THEN"
var   w_ELSE              = "ELSE"
var   w_PRIORITY          = "PRIORITY"

// External Inflow Types
var   w_FLOW              = "FLOW"
var   w_CONCEN            = "CONCEN"
var   w_MASS              = "MASS"

// Variable Units
var   w_FEET              = "FEET"
var   w_METERS            = "METERS"
var   w_FPS               = "FT/SEC"
var   w_MPS               = "M/SEC"
var   w_PCNT              = "PERCENT"
var   w_ACRE              = "acre"
var   w_HECTARE           = "hectare"

// Input File Sections
var   ws_TITLE            = "[TITLE"
var   ws_OPTION           = "[OPTION"
var   ws_FILE             = "[FILE"
var   ws_RAINGAGE         = "[RAINGAGE"
var   ws_TEMP             = "[TEMPERATURE"
var   ws_EVAP             = "[EVAP"
var   ws_SUBCATCH         = "[SUBCATCHMENT"
var   ws_SUBAREA          = "[SUBAREA"
var   ws_INFIL            = "[INFIL"
var   ws_AQUIFER          = "[AQUIFER"
var   ws_GROUNDWATER      = "[GROUNDWATER"
var   ws_SNOWMELT         = "[SNOWPACK"
var   ws_JUNCTION         = "[JUNC"
var   ws_OUTFALL          = "[OUTFALL"
var   ws_STORAGE          = "[STORAGE"
var   ws_DIVIDER          = "[DIVIDER"
var   ws_CONDUIT          = "[CONDUIT"
var   ws_PUMP             = "[PUMP"
var   ws_ORIFICE          = "[ORIFICE"
var   ws_WEIR             = "[WEIR"
var   ws_OUTLET           = "[OUTLET"
var   ws_XSECTION         = "[XSECT"
var   ws_TRANSECT         = "[TRANSECT"
var   ws_LOSS             = "[LOSS"
var   ws_CONTROL          = "[CONTROL"
var   ws_POLLUTANT        = "[POLLUT"
var   ws_LANDUSE          = "[LANDUSE"
var   ws_BUILDUP          = "[BUILDUP"
var   ws_WASHOFF          = "[WASHOFF"
var   ws_COVERAGE         = "[COVERAGE"
var   ws_INFLOW           = "[INFLOW"
var   ws_DWF              = "[DWF"
var   ws_PATTERN          = "[PATTERN"
var   ws_RDII             = "[RDII"
var   ws_UNITHYD          = "[HYDROGRAPH"
var   ws_LOADING          = "[LOADING"
var   ws_TREATMENT        = "[TREATMENT"
var   ws_CURVE            = "[CURVE"
var   ws_TIMESERIES       = "[TIMESERIES"
var   ws_REPORT           = "[REPORT"
var   ws_MAP              = "[MAP"
var   ws_COORDINATE       = "[COORDINATE"
var   ws_VERTICES         = "[VERTICES"
var   ws_POLYGON          = "[POLYGON"
var   ws_SYMBOL           = "[SYMBOL"
var   ws_LABEL            = "[LABEL"
var   ws_BACKDROP         = "[BACKDROP"
var   ws_TAG              = "[TAG"
var   ws_PROFILE          = "[PROFILE"
var   ws_LID_CONTROL      = "[LID_CONTROL"
var   ws_LID_USAGE        = "[LID_USAGE"
var   ws_GW_FLOW          = "[GW_FLOW"     //Deprecated
var   ws_GWF              = "[GWF"
var   ws_ADJUST           = "[ADJUSTMENT"
var   ws_EVENT            = "[EVENT"


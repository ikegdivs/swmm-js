//-----------------------------------------------------------------------------
//   error.h
//
//   Project: EPA SWMM5
//   Version: 5.1
//   Date:    03/20/14  (Build 5.1.001)
//            04/14/20  (Build 5.1.015)
//   Author:  L. Rossman
//
//   Error codes
//
//-----------------------------------------------------------------------------

//const ErrorType {

  //... Runtime Errors
var ERR_NONE = 0,                 //     0
      ERR_MEMORY = 1,               //101  1
      ERR_KINWAVE = 2,              //103  2
      ERR_ODE_SOLVER = 3,           //105  3
      ERR_TIMESTEP = 4,             //107  4

  //... Subcatchment/Aquifer Errors
      ERR_SUBCATCH_OUTLET = 5,      //108  5
      ERR_AQUIFER_PARAMS = 6,       //109  6
      ERR_GROUND_ELEV = 7,          //110  7

  //... Conduit/Pump Errors
      ERR_LENGTH = 8,               //111  8
      ERR_ELEV_DROP = 9,            //112  9
      ERR_ROUGHNESS = 10,            //113  10
      ERR_BARRELS = 11,              //114  11
      ERR_SLOPE = 12,                //115  12
      ERR_NO_XSECT = 13,             //117  13
      ERR_XSECT = 14,                //119  14
      ERR_NO_CURVE = 15,             //121  15
      ERR_PUMP_LIMITS = 16,          //122  16

  //... Topology Errors
      ERR_LOOP = 17,                 //131  17
      ERR_MULTI_OUTLET = 18,         //133  18
      ERR_DUMMY_LINK = 19,           //134  19

  //... Node Errors
      ERR_DIVIDER = 20,              //135  20
      ERR_DIVIDER_LINK = 21,         //136  21
      ERR_WEIR_DIVIDER = 22,         //137  22
      ERR_NODE_DEPTH = 23,           //138  23
      ERR_REGULATOR = 24,            //139  24
      ERR_OUTFALL = 25,              //141  25
      ERR_REGULATOR_SHAPE = 26,      //143  26
      ERR_NO_OUTLETS = 27,           //145  27

  //... RDII Errors
      ERR_UNITHYD_TIMES = 28,        //151  28
      ERR_UNITHYD_RATIOS = 29,       //153  29
      ERR_RDII_AREA = 30,            //155  30

  //... Rain Gage Errors
      ERR_RAIN_FILE_CONFLICT = 31,   //156  31
      ERR_RAIN_GAGE_FORMAT = 32,     //157  32
      ERR_RAIN_GAGE_TSERIES = 33,    //158  33
      ERR_RAIN_GAGE_INTERVAL = 34,   //159  34

  //... Treatment Function Error
      ERR_CYCLIC_TREATMENT = 35,     //161  35

  //... Curve/Time Series Errors
      ERR_CURVE_SEQUENCE = 36,       //171  36
      ERR_TIMESERIES_SEQUENCE = 37,  //173  37

  //... Snowmelt Errors
      ERR_SNOWMELT_PARAMS = 38,      //181  38
      ERR_SNOWPACK_PARAMS = 39,      //182  39

  //... LID Errors
      ERR_LID_TYPE = 40,             //183  40
      ERR_LID_LAYER = 41,            //184  41
      ERR_LID_PARAMS = 42,           //185  42
      ERR_SUBCATCH_LID = 43,         //186  43
      ERR_LID_AREAS = 44,            //187  44
      ERR_LID_CAPTURE_AREA = 45,     //188  45

  //... Simulation Date/Time Errors
      ERR_START_DATE = 46,           //191  46
      ERR_REPORT_DATE = 47,          //193  47
      ERR_REPORT_STEP = 48,          //195  48

  //... Input Parser Errors
      ERR_INPUT = 49,                //200  49
      ERR_LINE_LENGTH = 50,          //201  50
      ERR_ITEMS = 51,                //203  51
      ERR_KEYWORD = 52,              //205  52
      ERR_DUP_NAME = 53,             //207  53
      ERR_NAME = 54,                 //209  54
      ERR_NUMBER = 55,               //211  55
      ERR_DATETIME = 56,             //213  56
      ERR_RULE = 57,                 //217  57
      ERR_TRANSECT_UNKNOWN = 58,     //219  58
      ERR_TRANSECT_SEQUENCE = 59,    //221  59
      ERR_TRANSECT_TOO_FEW = 60,     //223  60
      ERR_TRANSECT_TOO_MANY = 61,    //225  61
      ERR_TRANSECT_MANNING = 62,     //227  62
      ERR_TRANSECT_OVERBANK = 63,    //229  63
      ERR_TRANSECT_NO_DEPTH = 64,    //231  64
      ERR_TREATMENT_EXPR = 65,       //233  65

  //... File Name/Opening Errors
      ERR_FILE_NAME = 66,            //301  66
      ERR_INP_FILE = 67,             //303  67
      ERR_RPT_FILE = 68,             //305  68
      ERR_OUT_FILE = 69,             //307  69
      ERR_OUT_WRITE = 70,            //309  70
      ERR_OUT_READ = 71,             //311  71

  //... Rain File Errors
      ERR_RAIN_FILE_SCRATCH = 72,    //313  72
      ERR_RAIN_FILE_OPEN = 73,       //315  73
      ERR_RAIN_FILE_DATA = 74,       //317  74
      ERR_RAIN_FILE_SEQUENCE = 75,   //318  75
      ERR_RAIN_FILE_FORMAT = 76,     //319  76
      ERR_RAIN_IFACE_FORMAT = 77,    //320  77
      ERR_RAIN_FILE_GAGE = 78,       //321  78

  //... Runoff File Errors
      ERR_RUNOFF_FILE_OPEN = 79,    //323  79
      ERR_RUNOFF_FILE_FORMAT = 80,   //325  80
      ERR_RUNOFF_FILE_END = 81,      //327  81
      ERR_RUNOFF_FILE_READ = 82,     //329  82

  //... Hotstart File Errors
      ERR_HOTSTART_FILE_NAMES = 83,  //330  83
      ERR_HOTSTART_FILE_OPEN = 84,   //331  84
      ERR_HOTSTART_FILE_FORMAT = 85, //333  85
      ERR_HOTSTART_FILE_READ = 86,   //335  86

  //... Climate File Errors
      ERR_NO_CLIMATE_FILE = 87,      //336  87
      ERR_CLIMATE_FILE_OPEN = 88,    //337  88
      ERR_CLIMATE_FILE_READ = 89,    //338  89
      ERR_CLIMATE_END_OF_FILE = 90,  //339  90

  //... RDII File Errors
      ERR_RDII_FILE_SCRATCH = 91,    //341  91
      ERR_RDII_FILE_OPEN = 92,       //343  92
      ERR_RDII_FILE_FORMAT = 93,     //345  93

  //... Routing File Errors
      ERR_ROUTING_FILE_OPEN = 94,    //351  94
      ERR_ROUTING_FILE_FORMAT = 95,  //353  95
      ERR_ROUTING_FILE_NOMATCH = 96, //355  96
      ERR_ROUTING_FILE_NAMES = 97,   //357  97

  //... Time Series File Errors
      ERR_TABLE_FILE_OPEN = 98,      //361  98
      ERR_TABLE_FILE_READ = 99,      //363  99

  //... Runtime Errors
      ERR_SYSTEM = 100,               //401  100
      ERR_NOT_CLOSED = 101,           //402  101
      ERR_NOT_OPEN = 102,             //403  102
      ERR_FILE_SIZE = 103,            //405  103

  //... API Errors
      ERR_API_OUTBOUNDS = 104,        //501  104
      ERR_API_INPUTNOTOPEN = 105,     //502  105
      ERR_API_SIM_NRUNNING = 106,     //503  106
	  ERR_API_WRONG_TYPE = 107,       //504  107
	  ERR_API_OBJECT_INDEX = 108,     //505  108
	  ERR_API_POLLUT_INDEX = 109,     //506  109
	  ERR_API_INFLOWTYPE = 110,       //507  110
	  ERR_API_TSERIES_INDEX = 111,    //508  111
	  ERR_API_PATTERN_INDEX = 112,    //509  112

  //... Additional Errors
      ERR_STORAGE_VOLUME = 113,       //140  113                                     //(5.1.015)
      MAXERRMSG = 114;

//-----------------------------------------------------------------------------
//   error.c
//
//   Project: EPA SWMM5
//   Version: 5.1
//   Date:    03/20/14  (Build 5.1.001)
//            03/19/15  (Build 5.1.008)
//            08/05/15  (Build 5.1.010)
//            04/14/20  (Build 5.1.015)
//   Author:  L. Rossman
//
//   Error messages
//
//   Build 5.1.008:
//   - Text of Error 217 for control rules modified.
//
//   Build 5.1.010:
//   - Text of Error 318 for rainfall data files modified.
//
//   Build 5.1.015:
//   - Added new Error 140 for storage nodes.
//-----------------------------------------------------------------------------

var ERR101 = "\n  ERROR 101: memory allocation error."
var ERR103 = "\n  ERROR 103: cannot solve KW equations for Link %s."
var ERR105 = "\n  ERROR 105: cannot open ODE solver."
var ERR107 = "\n  ERROR 107: cannot compute a valid time step."

var ERR108 = "\n  ERROR 108: ambiguous outlet ID name for Subcatchment %s."
var ERR109 = "\n  ERROR 109: invalid parameter values for Aquifer %s."
var ERR110 = "\n  ERROR 110: ground elevation is below water table for Subcatchment %s."

var ERR111 = "\n  ERROR 111: invalid length for Conduit %s."
var ERR112 = "\n  ERROR 112: elevation drop exceeds length for Conduit %s."
var ERR113 = "\n  ERROR 113: invalid roughness for Conduit %s."
var ERR114 = "\n  ERROR 114: invalid number of barrels for Conduit %s."
var ERR115 = "\n  ERROR 115: adverse slope for Conduit %s."
var ERR117 = "\n  ERROR 117: no cross section defined for Link %s."
var ERR119 = "\n  ERROR 119: invalid cross section for Link %s."
var ERR121 = "\n  ERROR 121: missing or invalid pump curve assigned to Pump %s."
var ERR122 = "\n  ERROR 122: startup depth not higher than shutoff depth for Pump %s."

var ERR131 = "\n  ERROR 131: the following links form cyclic loops in the drainage system:"
var ERR133 = "\n  ERROR 133: Node %s has more than one outlet link."
var ERR134 = "\n  ERROR 134: Node %s has illegal DUMMY link connections."

var ERR135 = "\n  ERROR 135: Divider %s does not have two outlet links."
var ERR136 = "\n  ERROR 136: Divider %s has invalid diversion link."
var ERR137 = "\n  ERROR 137: Weir Divider %s has invalid parameters."
var ERR138 = "\n  ERROR 138: Node %s has initial depth greater than maximum depth."
var ERR139 = "\n  ERROR 139: Regulator %s is the outlet of a non-storage node."
var ERR140 = "\n  ERROR 140: Storage node %s has negative volume at full depth."            //(5.1.015) 
var ERR141 = "\n  ERROR 141: Outfall %s has more than 1 inlet link or an outlet link."
var ERR143 = "\n  ERROR 143: Regulator %s has invalid cross-section shape."
var ERR145 = "\n  ERROR 145: Drainage system has no acceptable outlet nodes."

var ERR151 = "\n  ERROR 151: a Unit Hydrograph in set %s has invalid time base."
var ERR153 = "\n  ERROR 153: a Unit Hydrograph in set %s has invalid response ratios."
var ERR155 = "\n  ERROR 155: invalid sewer area for RDII at node %s."

var ERR156 = "\n  ERROR 156: ambiguous station ID for Rain Gage %s."
var ERR157 = "\n  ERROR 157: inconsistent rainfall format for Rain Gage %s."
var ERR158 = "\n  ERROR 158: time series for Rain Gage %s is also used by another object."
var ERR159 = "\n  ERROR 159: recording interval greater than time series interval for Rain Gage %s."

var ERR161 = "\n  ERROR 161: cyclic dependency in treatment functions at node %s."

var ERR171 = "\n  ERROR 171: Curve %s has invalid or out of sequence data."
var ERR173 = "\n  ERROR 173: Time Series %s has its data out of sequence."

var ERR181 = "\n  ERROR 181: invalid Snow Melt Climatology parameters."
var ERR182 = "\n  ERROR 182: invalid parameters for Snow Pack %s."

var ERR183 = "\n  ERROR 183: no type specified for LID %s."
var ERR184 = "\n  ERROR 184: missing layer for LID %s."
var ERR185 = "\n  ERROR 185: invalid parameter value for LID %s."
var ERR186 = "\n  ERROR 186: invalid parameter value for LID placed in Subcatchment %s."
var ERR187 = "\n  ERROR 187: LID area exceeds total area for Subcatchment %s."
var ERR188 = "\n  ERROR 188: LID capture area exceeds total impervious area for Subcatchment %s."

var ERR191 = "\n  ERROR 191: simulation start date comes after ending date."
var ERR193 = "\n  ERROR 193: report start date comes after ending date."
var ERR195 = "\n  ERROR 195: reporting time step or duration is less than routing time step."

var ERR200 = "\n  ERROR 200: one or more errors in input file."
var ERR201 = "\n  ERROR 201: too many characters in input line "
var ERR203 = "\n  ERROR 203: too few items "
var ERR205 = "\n  ERROR 205: invalid keyword %s "
var ERR207 = "\n  ERROR 207: duplicate ID name %s "
var ERR209 = "\n  ERROR 209: undefined object %s "
var ERR211 = "\n  ERROR 211: invalid number %s "
var ERR213 = "\n  ERROR 213: invalid date/time %s "
var ERR217 = "\n  ERROR 217: control rule clause invalid or out of sequence "  //(5.1.008)
var ERR219 = "\n  ERROR 219: data provided for unidentified transect "
var ERR221 = "\n  ERROR 221: transect station out of sequence "
var ERR223 = "\n  ERROR 223: Transect %s has too few stations." 
var ERR225 = "\n  ERROR 225: Transect %s has too many stations."
var ERR227 = "\n  ERROR 227: Transect %s has no Manning's N."
var ERR229 = "\n  ERROR 229: Transect %s has invalid overbank locations."
var ERR231 = "\n  ERROR 231: Transect %s has no depth."
var ERR233 = "\n  ERROR 233: invalid treatment function expression "

var ERR301 = "\n  ERROR 301: files share same names."
var ERR303 = "\n  ERROR 303: cannot open input file."
var ERR305 = "\n  ERROR 305: cannot open report file."
var ERR307 = "\n  ERROR 307: cannot open binary results file."
var ERR309 = "\n  ERROR 309: error writing to binary results file."
var ERR311 = "\n  ERROR 311: error reading from binary results file."

var ERR313 = "\n  ERROR 313: cannot open scratch rainfall interface file."
var ERR315 = "\n  ERROR 315: cannot open rainfall interface file %s."
var ERR317 = "\n  ERROR 317: cannot open rainfall data file %s."
var ERR318 = "\n  ERROR 318: the following line is out of sequence in rainfall data file %s." //(5.1.010)
var ERR319 = "\n  ERROR 319: unknown format for rainfall data file %s."
var ERR320 = "\n  ERROR 320: invalid format for rainfall interface file."
var ERR321 = "\n  ERROR 321: no data in rainfall interface file for gage %s."

var ERR323 = "\n  ERROR 323: cannot open runoff interface file %s."
var ERR325 = "\n  ERROR 325: incompatible data found in runoff interface file."
var ERR327 = "\n  ERROR 327: attempting to read beyond end of runoff interface file."
var ERR329 = "\n  ERROR 329: error in reading from runoff interface file."

var ERR330 = "\n  ERROR 330: hotstart interface files have same names."
var ERR331 = "\n  ERROR 331: cannot open hotstart interface file %s."
var ERR333 = "\n  ERROR 333: incompatible data found in hotstart interface file."
var ERR335 = "\n  ERROR 335: error in reading from hotstart interface file."

var ERR336 = "\n  ERROR 336: no climate file specified for evaporation and/or wind speed."
var ERR337 = "\n  ERROR 337: cannot open climate file %s."
var ERR338 = "\n  ERROR 338: error in reading from climate file %s."
var ERR339 = "\n  ERROR 339: attempt to read beyond end of climate file %s."

var ERR341 = "\n  ERROR 341: cannot open scratch RDII interface file."
var ERR343 = "\n  ERROR 343: cannot open RDII interface file %s."
var ERR345 = "\n  ERROR 345: invalid format for RDII interface file."

var ERR351 = "\n  ERROR 351: cannot open routing interface file %s."
var ERR353 = "\n  ERROR 353: invalid format for routing interface file %s."
var ERR355 = "\n  ERROR 355: mis-matched names in routing interface file %s."
var ERR357 = "\n  ERROR 357: inflows and outflows interface files have same name."

var ERR361 = "\n  ERROR 361: could not open external file used for Time Series %s."
var ERR363 = "\n  ERROR 363: invalid data in external file used for Time Series %s."

var ERR401 = "\n  ERROR 401: general system error."
var ERR402 = "\n  ERROR 402: cannot open new project while current project still open."
var ERR403 = "\n  ERROR 403: project not open or last run not ended."
var ERR405 = "\n  ERROR 405: amount of output produced will exceed maximum file size;\n             either reduce Ending Date or increase Reporting Time Step."

// API Error Keys
var ERR501 = "\n API Key Error: Object Type Outside Bonds"
var ERR502 = "\n API Key Error: Network Not Initialized (Input file open?)"
var ERR503 = "\n API Key Error: Simulation Not Running"
var ERR504 = "\n API Key Error: Incorrect object type for parameter chosen"
var ERR505 = "\n API Key Error: Object index out of Bounds."
var ERR506 = "\n API Key Error: Invalid Pollutant Index"
var ERR507 = "\n API Key Error: Invalid Inflow Type"
var ERR508 = "\n API Key Error: Invalid Timeseries Index"
var ERR509 = "\n API Key Error: Invalid Pattern Index"

////////////////////////////////////////////////////////////////////////////
//  NOTE: Need to update ErrorMsgs[], ErrorCodes[], and ErrorType
//        (in error.h) whenever a new error message is added.
/////////////////////////////////////////////////////////////////////////////

var ErrorMsgs =
    [ "",     ERR101, ERR103, ERR105, ERR107, ERR108, ERR109, ERR110, ERR111,
      ERR112, ERR113, ERR114, ERR115, ERR117, ERR119, ERR121, ERR122, ERR131,
      ERR133, ERR134, ERR135, ERR136, ERR137, ERR138, ERR139, ERR141, ERR143,
      ERR145, ERR151, ERR153, ERR155, ERR156, ERR157, ERR158, ERR159, ERR161,
      ERR171, ERR173, ERR181, ERR182, ERR183, ERR184, ERR185, ERR186, ERR187,
      ERR188, ERR191, ERR193, ERR195, ERR200, ERR201, ERR203, ERR205, ERR207,
      ERR209, ERR211, ERR213, ERR217, ERR219, ERR221, ERR223, ERR225, ERR227,
      ERR229, ERR231, ERR233, ERR301, ERR303, ERR305, ERR307, ERR309, ERR311,
      ERR313, ERR315, ERR317, ERR318, ERR319, ERR320, ERR321, ERR323, ERR325,
      ERR327, ERR329, ERR330, ERR331, ERR333, ERR335, ERR336, ERR337, ERR338,
      ERR339, ERR341, ERR343, ERR345, ERR351, ERR353, ERR355, ERR357, ERR361,
      ERR363, ERR401, ERR402, ERR403, ERR405, ERR501, ERR502, ERR503, ERR504,
	  ERR505, ERR506, ERR507, ERR508, ERR509, ERR140];                         //(5.1.015)

var ErrorCodes =
    [ 0,      101,    103,    105,    107,    108,    109,    110,    111,
      112,    113,    114,    115,    117,    119,    121,    122,    131,
      133,    134,    135,    136,    137,    138,    139,    141,    143,
      145,    151,    153,    155,    156,    157,    158,    159,    161,
      171,    173,    181,    182,    183,    184,    185,    186,    187,
      188,    191,    193,    195,    200,    201,    203,    205,    207,
      209,    211,    213,    217,    219,    221,    223,    225,    227,
      229,    231,    233,    301,    303,    305,    307,    309,    311,
      313,    315,    317,    318,    319,    320,    321,    323,    325,
      327,    329,    330,    331,    333,    335,    336,    337,    338,
      339,    341,    343,    345,    351,    353,    355,    357,    361,
      363,    401,    402,    403,    405,    501,    502,    503,    504,
	  505,    506,    507,    508,    509,    140];                            //(5.1.015)

var  ErrString;

function error_getMsg(i)
{
    if ( i >= 0 && i < MAXERRMSG ) return ErrorMsgs[i];
    else return ErrorMsgs[0];
};

function  error_getCode(i)
{
    if ( i >= 0 && i < MAXERRMSG ) return ErrorCodes[i];
    else return 0;
}

function  error_setInpError(errcode, s)
{
    //strcpy(ErrString, s);
    ErrString = s;
    return errcode;
}

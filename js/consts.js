//-----------------------------------------------------------------------------
//   consts.h
//
//   Project: EPA SWMM5
//   Version: 5.1
//   Date:    03/20/14  (Build 5.1.001)
//            08/01/16  (Build 5.1.011)
//            05/10/18  (Build 5.1.013)
//            03/01/20  (Build 5.1.014)
//            04/01/20  (Build 5.1.015)
//   Author:  L. Rossman
//
//   Various Constants
//-----------------------------------------------------------------------------

//------------------
// General Constants
//------------------

var VERSION =           51015
var MAGICNUMBER =       516114522
var EOFMARK =           0x1A           // Use 0x04 for UNIX systems
var MAXTITLE =          3              // Max. # title lines
var MAXMSG  =           1024           // Max. # characters in message text
var MAXLINE =           1024           // Max. # characters per input line
var MAXFNAME =          259            // Max. # characters in file name
var MAXTOKS =           40             // Max. items per line of input
var MAXSTATES =         10             // Max. # computed hyd. variables
var MAXODES =           4              // Max. # ODE's to be solved
var NA  =               -1             // NOT APPLICABLE code
var TRUE =              1              // Value for TRUE state
var FALSE =             0              // Value for FALSE state
var BIG =               1.E10          // Generic large value
var TINY =              1.E-6          // Generic small value
var ZERO =              1.E-10         // Effective zero value
var MISSING =           -1.E10         // Missing value code
var PI =                3.141592654    // Value of pi
var GRAVITY =           32.2           // accel. of gravity in US units
var SI_GRAVITY =        9.81           // accel of gravity in SI units
var MAXFILESIZE =       2147483647    // largest file size in bytes

//-----------------------------
// Units factor in Manning Eqn.
//-----------------------------
var PHI = 1.486

//----------------------------------------------
// Definition of measureable runoff flow & depth
//----------------------------------------------
var MIN_RUNOFF_FLOW  =  0.001          // cfs
var MIN_EXCESS_DEPTH =  0.0001         // ft, = 0.03 mm  <NOT USED>
var MIN_TOTAL_DEPTH =   0.004167       // ft, = 0.05 inches
var MIN_RUNOFF =        2.31481e-8     // ft/sec = 0.001 in/hr

//----------------------------------------------------------------------
// Minimum flow, depth & volume used to evaluate steady state conditions
//----------------------------------------------------------------------
var FLOW_TOL =     0.00001  // cfs
var DEPTH_TOL =    0.00001  // ft    <NOT USED>
var VOLUME_TOL =   0.01     // ft3   <NOT USED>

//---------------------------------------------------
// Minimum depth for reporting non-zero water quality
//---------------------------------------------------
//var MIN_WQ_DEPTH  0.01     // ft (= 3 mm)
//var MIN_WQ_FLOW   0.001    // cfs

//-----------------------------------------------------
// Minimum flow depth and area for dynamic wave routing
//-----------------------------------------------------
var FUDGE =   0.0001    // ft or ft2

//---------------------------
// Various conversion factors
//---------------------------
var GPMperCFS =  448.831
var AFDperCFS =  1.9837
var MGDperCFS =  0.64632
var IMGDperCFS = 0.5382
var LPSperCFS =  28.317
var LPMperCFS =  1699.0
var CMHperCFS =  101.94
var CMDperCFS =  2446.6
var MLDperCFS =  2.4466
var M3perFT3 =  0.028317
var LperFT3 =    28.317
var MperFT  =    0.3048
var PSIperFT =   0.4333
var KPAperPSI =  6.895
var KWperHP  =   0.7457
var SECperDAY =  86400
var MSECperDAY = 8.64e7
var MMperINCH =  25.40

//---------------------------
// Token separator characters
//---------------------------
var SEPSTR =   " \t\n\r"



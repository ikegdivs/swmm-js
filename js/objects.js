//-----------------------------------------------------------------------------
//   objects.h
//
//   Project: EPA SWMM5
//   Version: 5.1
//   Date:    03/19/14  (Build 5.1.000)
//            09/15/14  (Build 5.1.007)
//            03/19/15  (Build 5.1.008)
//            08/05/15  (Build 5.1.010)
//            08/01/16  (Build 5.1.011)
//            05/10/18  (Build 5.1.013)
//            04/01/20  (Build 5.1.015)
//
//   Author:  L. Rossman (EPA)
//            M. Tryby (EPA)
//            R. Dickinson (CDM)
//
//   Definitions of data structures.
//
//   Most SWMM 5 "objects" are represented as C data structures.
//
//   The units shown next to each structure's properties are SWMM's
//   internal units and may be different than the units required
//   for the property as it appears in the input file.
//
//   In many structure definitions, a blank line separates the set of
//   input properties from the set of computed output properties.
//
//   Build 5.1.007:
//   - Data structure for monthly adjustments of temperature, evaporation,
//     and rainfall added.
//   - User-supplied equation for deep GW flow added to subcatchment object.
//   - Exfiltration added to storage node object.
//   - Surcharge option added to weir object.
//
//   Build 5.1.008:
//   - Route to subcatchment option added to Outfall data structure.
//   - Hydraulic conductivity added to monthly adjustments data structure.
//   - Total LID drain flow and outfall runon added to Runoff Totals.
//   - Groundwater statistics object added.
//   - Maximum depth for reporting times added to node statistics object.
//
//   Build 5.1.010:
//   - Additional fields added to Weir object to support ROADWAY_WEIR type.
//   - New field added to Link object to record when its setting was changed.
//   - q1Old and q2Old of Link object restored.
//
//   Build 5.1.011:
//   - Description of oldFlow & newFlow for TGroundwater object modified.
//   - Weir shape parameter deprecated.
//   - Added definition of a hydraulic event time period (TEvent).
//
//   Build 5.1.013:
//   - New member 'averages' added to the TRptFlags structure.
//   - Adjustment patterns added to TSubcatch structure.
//   - Members impervRunoff and pervRunoff added to TSubcatchStats structure.
//   - Member cdCurve (weir coeff. curve) added to TWeir structure.
//
//   Build 5.1.015:
//   - Support added for multiple infiltration methods within a project.
//   - Support added for grouped freqency table of routing time steps.
//-----------------------------------------------------------------------------

//-----------------
// FILE INFORMATION
//-----------------
class TFile
{
   constructor(){
      this.name;     // Array of size [MAXFNAME+1]. file name
      this.mode;                 // NO_FILE, SCRATCH, USE, or SAVE
      this.state;                // current state (OPENED, CLOSED)
      //this.file;                 // FILE structure pointer
      this.contents;             // Replacement for file: allows for browser-created reports.
   }
}  ;

//-----------------------------------------
// LINKED LIST ENTRY FOR TABLES/TIME SERIES
//-----------------------------------------
class  TableEntry
{
   constructor(){
      this.x;
      this.y;
      this.next;  //TableEntry
   }
};

class  TTableEntry
{
   constructor(){
      this.x;
      this.y;
      this.next;  //TableEntry
   }
};

//-------------------------
// CURVE/TIME SERIES OBJECT
//-------------------------
class TTable
{
   constructor(){
      this.ID;              // Table/time series ID
      this.curveType;       // type of curve tabulated
      this.refersTo;        // reference to some other object
      this.dxMin;           // smallest x-value interval
      this.lastDate;        // last input date for time series
      this.x1;          // current bracket on x-values
      this.x2;
      this.y1;          // current bracket on y-values
      this.y2;
      this.firstEntry = new TTableEntry();      //TTableEntry first data point
      this.lastEntry = new TTableEntry();       //TTableEntry last data point
      this.thisEntry = new TTableEntry();       //TTableEntry current data point
      this.file = new TFile();            //TFile external data file
      this.contents;        //Replaces this.file for browser models
   }
}  ;

//-----------------
// RAIN GAGE OBJECT
//-----------------
class TGage
{
   constructor(){
      this.ID;              // raingage name
      this.dataSource;      // data from time series or file
      this.tSeries;         // rainfall data time series index
      this.fname; // char[MAXFNAME+1] name of rainfall data file
      this.staID; // char[MAXMSG+1]. station number
      this.startFileDate;   // starting date of data read from file
      this.endFileDate;     // ending date of data read from file
      this.rainType;        // intensity, volume, cumulative
      this.rainInterval;    // recording time interval (seconds)
      this.rainUnits;       // rain depth units (US or SI)
      this.snowFactor;      // snow catch deficiency correction
      //-----------------------------
      this.startFilePos;    // starting byte position in Rain file
      this.endFilePos;      // ending byte position in Rain file
      this.currentFilePos;  // current byte position in Rain file
      this.rainAccum;       // cumulative rainfall
      this.unitsFactor;     // units conversion factor (to inches or mm)
      this.startDate;       // start date of current rainfall
      this.endDate;         // end date of current rainfall
      this.nextDate;        // next date with recorded rainfall
      this.rainfall;        // current rainfall (in/hr or mm/hr)
      this.nextRainfall;    // next rainfall (in/hr or mm/hr)
      this.reportRainfall;  // rainfall value used for reported results
      this.coGage;          // index of gage with same rain timeseries
      this.isUsed;          // TRUE if gage used by any subcatchment
      this.isCurrent;       // TRUE if gage's rainfall is current
   }
}  ;

//-------------------
// TEMPERATURE OBJECT
//-------------------
class TTemp
{
   constructor(){
      this.dataSource;      // data from time series or file
      this.tSeries;         // temperature data time series index
      this.fileStartDate;   // starting date of data read from file
      this.elev;            // elev. of study area (ft)
      this.anglat;          // latitude (degrees)
      this.dtlong;          // longitude correction (hours)
      //-----------------------------
      this.ta;              // air temperature (deg F)
      this.tmax;            // previous day's max. temp. (deg F)
      this.ea;              // saturation vapor pressure (in Hg)
      this.gamma;           // psychrometric constant
      this.tanAnglat;       // tangent of latitude angle
   }
}  ;

//-----------------
// WINDSPEED OBJECT
//-----------------
class TWind
{
   constructor(){
      this.type;             // monthly or file data
      this.aws = new Array(12);          // double[12]. monthly avg. wind speed (mph)
      //-----------------------------
      this.ws;              // wind speed (mph)
   }
}  ;

//------------
// SNOW OBJECT
//------------
class TSnow
{
   constructor(){
      this.snotmp;           // temp. dividing rain from snow (deg F)
      this.tipm;             // antecedent temp. index parameter
      this.rnm;              // ratio of neg. melt to melt coeff.
      //-----------------------------
      this.season;           // snowmelt season
      this.removed;          // total snow plowed out of system (ft3)
      this.adc = Array.from( // Array of [2][10], areal depletion curves
                     Array(2),  
                     () => new Array(4)
                  );
   }
}  ;

//-------------------
// EVAPORATION OBJECT
//-------------------
class TEvap
{
   constructor(){
      this.type;            // type of evaporation data
      this.tSeries;         // time series index
      this.recoveryPattern; // soil recovery factor pattern
      this.dryOnly;         // true if evaporation only in dry periods
      //----------------------------
      this.rate;            // current evaporation rate (ft/sec)
      this.recoveryFactor;  // current soil recovery factor
      // The following are arrays of size 12
      this.monthlyEvap = new Array(12); // monthly evaporation values
      this.panCoeff = new Array(12);    // monthly pan coeff. values
   }
}   ;

//-------------------
// ADJUSTMENTS OBJECT
//-------------------
class TAdjust
{
   constructor(){
      this.rainFactor;      // current rainfall adjustment multiplier
      this.hydconFactor;    // current conductivity multiplier
      // The following are all arrays of size 12
      this.temp = new Array(12);        // monthly temperature adjustments (deg F)
      this.evap = new Array(12);        // monthly evaporation adjustments (ft/s)
      this.rain = new Array(12);        // monthly rainfall adjustment multipliers
      this.hydcon = new Array(12);      // hyd. conductivity adjustment multipliers
   }
}   ;

//-------------
// EVENT OBJECT
//-------------
class TEvent
{
   constructor(){
      this.start;            // event start date
      this.end;              // event end date
   }
}   ;

//-------------------
// AQUIFER OBJECT
//-------------------
class TAquifer
{
   constructor(){
      this.ID;               // aquifer name
      this.porosity;         // soil porosity
      this.wiltingPoint;     // soil wilting point
      this.fieldCapacity;    // soil field capacity
      this.conductivity;     // soil hyd. conductivity (ft/sec)
      this.conductSlope;     // slope of conductivity v. moisture curve
      this.tensionSlope;     // slope of tension v. moisture curve
      this.upperEvapFrac;    // evaporation available in upper zone
      this.lowerEvapDepth;   // evap depth existing in lower zone (ft)
      this.lowerLossCoeff;   // coeff. for losses to deep GW (ft/sec)
      this.bottomElev;       // elevation of bottom of aquifer (ft)
      this.waterTableElev;   // initial water table elevation (ft)
      this.upperMoisture;    // initial moisture content of unsat. zone
      this.upperEvapPat;     // monthly upper evap. adjustment factors
   }
}   ;

//-----------------------
// GROUNDWATER STATISTICS
//-----------------------
class TGWaterStats
{
   constructor(){
      this.infil;           // total infiltration (ft)
      this.evap;            // total evaporation (ft)
      this.latFlow;         // total lateral outflow (ft)
      this.deepFlow;        // total flow to deep aquifer (ft)
      this.avgUpperMoist;   // avg. upper zone moisture
      this.finalUpperMoist; // final upper zone moisture
      this.avgWaterTable;   // avg. water table height (ft)
      this.finalWaterTable; // final water table height (ft)
      this.maxFlow;         // max. lateral outflow (cfs)
   }
}  ;

//------------------------
// GROUNDWATER OBJECT
//------------------------
class TGroundwater
{
   constructor(){
      this.aquifer;        // index of associated gw aquifer
      this.node;           // index of node receiving gw flow
      this.surfElev;       // elevation of ground surface (ft)
      this.a1;             // ground water outflow coeff. & exponent
      this.b1;         
      this.a2;             // surface water outflow coeff. & exponent
      this.b2;         
      this.a3;             // surf./ground water interaction coeff.
      this.fixedDepth;     // fixed surface water water depth (ft)
      this.nodeElev;       // elevation of receiving node invert (ft)
      this.bottomElev;     // bottom elevation of lower GW zone (ft)
      this.waterTableElev; // initial water table elevation (ft)
      this.upperMoisture;  // initial moisture content of unsat. zone
      //----------------------------
      this.theta;          // upper zone moisture content
      this.lowerDepth;     // depth of saturated zone (ft)
      this.oldFlow;        // gw outflow from previous time period (fps)
      this.newFlow;        // gw outflow from current time period (fps)
      this.evapLoss;       // evaporation loss rate (ft/sec)
      this.maxInfilVol;    // max. infil. upper zone can accept (ft)
      this.stats;          // TGWaterStats gw statistics
   }
} ;

//----------------
// SNOWMELT OBJECT
//----------------
// Snowmelt objects contain parameters that describe the melting
// process of snow packs on 3 different types of surfaces:
//   1 - plowable impervious area
//   2 - non-plowable impervious area
//   3 - pervious area
class TSnowmelt
{
   constructor(){
      this.ID;              // snowmelt parameter set name
      this.snn;             // fraction of impervious area plowable
      this.weplow;          // depth at which plowing begins (ft)
      this.toSubcatch;      // index of subcatch receiving plowed snow
      // The following are all arrays of size 3.
      this.si = new Array(3);           // snow depth for 100% cover
      this.dhmin = new Array(3);        // min. melt coeff. for each surface (ft/sec-F)
      this.dhmax = new Array(3);        // max. melt coeff. for each surface (ft/sec-F)
      this.tbase = new Array(3);        // base temp. for melting (F)
      this.fwfrac = new Array(3);       // free water capacity / snow depth
      this.wsnow = new Array(3);        // initial snow depth on each surface (ft)
      this.fwnow = new Array(3);        // initial free water in snow pack (ft)
      this.dhm = new Array(3);          // melt coeff. for each surface (ft/sec-F)
      // The following are arrays of size 5.
      this.sfrac = new Array(5);        // fractions moved to other areas by plowing
   }
}  ;

//----------------
// SNOWPACK OBJECT
//----------------
// Snowpack objects describe the state of the snow melt process on each
// of 3 types of snow surfaces.
class TSnowpack
{
   constructor(){
      this.snowmeltIndex;   // index of snow melt parameter set
      // The following are arrays of size 3
      this.fArea = new Array(3);        // fraction of total area of each surface
      this.wsnow = new Array(3);        // depth of snow pack (ft)
      this.fw = new Array(3);           // depth of free water in snow pack (ft)
      this.coldc = new Array(3);        // cold content of snow pack
      this.ati = new Array(3);          // antecedent temperature index (deg F)
      this.sba = new Array(3);          // initial ASC of linear ADC
      this.awe = new Array(3);          // initial AWESI of linear ADC
      this.sbws = new Array(3);         // final AWESI of linear ADC
      this.imelt = new Array(3);        // immediate melt (ft)
   }
}  ;

//---------------
// SUBAREA OBJECT
//---------------
// An array of 3 subarea objects is associated with each subcatchment object.
// They describe the runoff process on 3 types of surfaces:
//   1 - impervious with no depression storage
//   2 - impervious with depression storage
//   3 - pervious
class TSubarea
{
   constructor(){
      this.routeTo;         // code indicating where outflow is sent
      this.fOutlet;         // fraction of outflow to outlet
      this.N;               // Manning's n
      this.fArea;           // fraction of total area
      this.dStore;          // depression storage (ft)
      //-----------------------------
      this.alpha;           // overland flow factor
      this.inflow;          // inflow rate (ft/sec)
      this.runoff;          // runoff rate (ft/sec)
      this.depth;           // depth of surface runoff (ft)
   }
}  ;

//-------------------------
// LAND AREA LANDUSE FACTOR
//-------------------------
class TLandFactor
{
   constructor(){
      this.fraction;        // fraction of land area with land use
      this.buildup = [];         // array of buildups for each pollutant
      this.lastSwept;       // date/time of last street sweeping
   }
}  ;

//--------------------
// SUBCATCHMENT OBJECT
//--------------------
class TSubcatch
{
   constructor(){
      this.ID;              // subcatchment name
      this.rptFlag;         // reporting flag
      this.gage;            // raingage index
      this.outNode;         // outlet node index
      this.outSubcatch;     // outlet subcatchment index
      this.infilModel;      // infiltration method index                 //(5.1.015)
      this.infil;           // infiltration object index
      this.subArea = [];      // Array size 3 sub-area data
      for(let i = 0; i < 3; i++){this.subArea.push(new TSubarea())}
      this.width;           // overland flow width (ft)
      this.area;            // area (ft2)
      this.fracImperv;      // fraction impervious
      this.slope;           // slope (ft/ft)
      this.curbLength;      // total curb length (ft)
      this.initBuildup = [];     // initial pollutant buildup (mass/ft2)
      this.landFactor = [];      // array of land use factors TLandFactor
      this.groundwater = [];     // associated groundwater data TGroundwater*
      this.gwLatFlowExpr = [];   // user-supplied lateral outflow expression MathExpr*     
      this.gwDeepFlowExpr = [];  // user-supplied deep percolation expression MathExpr*     
      this.snowpack = [];        // associated snow pack data TSnowpack*    
      this.nPervPattern;    // pervious N pattern index                  //(5.1.013)
      this.dStorePattern;   // depression storage pattern index          //
      this.infilPattern;    // infiltration rate pattern index           //
      //-----------------------------
      this.lidArea;         // area devoted to LIDs (ft2)
      this.rainfall;        // current rainfall (ft/sec)
      this.evapLoss;        // current evap losses (ft/sec)
      this.infilLoss;       // current infil losses (ft/sec)
      this.runon;           // runon from other subcatchments (cfs)
      this.oldRunoff;       // previous runoff (cfs)
      this.newRunoff;       // current runoff (cfs)
      this.oldSnowDepth;    // previous snow depth (ft)
      this.newSnowDepth;    // current snow depth (ft)
      this.oldQual = [];         // previous runoff quality (mass/L)
      this.newQual = [];         // current runoff quality (mass/L)
      this.pondedQual = [];      // ponded surface water quality (mass)
      this.totalLoad = [];       // total washoff load (lbs or kg)
   }
   
}  ;

//-----------------------
// TIME PATTERN DATA
//-----------------------
class TPattern
{
   constructor(){
      this.ID;              // time pattern name
      this.type;            // time pattern type code
      this.count;           // number of factors
      this.factor = new Array(24);          // Array size 24time pattern factors
   }
}  ;

//------------------------------
// DIRECT EXTERNAL INFLOW OBJECT
//------------------------------
class ExtInflow
{
   constructor(){
      this.param;           // pollutant index (flow = -1)
      this.type;            // CONCEN or MASS
      this.tSeries;         // index of inflow time series
      this.basePat;         // baseline time pattern
      this.cFactor;         // units conversion factor for mass inflow
      this.baseline;        // constant baseline value
      this.sFactor;         // time series scaling factor
      this.extIfaceInflow;  // external interfacing inflow
      this.next; 
   }          // ExtInflow pointer to next inflow data object
};

class TExtInflow
{
   constructor(){
      this.param;           // pollutant index (flow = -1)
      this.type;            // CONCEN or MASS
      this.tSeries;         // index of inflow time series
      this.basePat;         // baseline time pattern
      this.cFactor;         // units conversion factor for mass inflow
      this.baseline;        // constant baseline value
      this.sFactor;         // time series scaling factor
      this.extIfaceInflow;  // external interfacing inflow
      this.next; 
   }          // ExtInflow pointer to next inflow data object
};

//-------------------------------
// DRY WEATHER FLOW INFLOW OBJECT
//-------------------------------
class DwfInflow
{
   constructor(){
      this.param;          // pollutant index (flow = -1)
      this.avgValue;       // average value (cfs or concen.)
      this.patterns = new Array(4);       // monthly, daily, hourly, weekend time patterns, array of 4
      this.next;  
   }         // /*DwfInflow*/ pointer to next inflow data object
};

class TDwfInflow
{
   constructor(){
      this.param;          // pollutant index (flow = -1)
      this.avgValue;       // average value (cfs or concen.)
      this.patterns = new Array(4);       // monthly, daily, hourly, weekend time patterns, array of 4
      this.next;  
   }         // /*DwfInflow*/ pointer to next inflow data object
};


//-------------------
// RDII INFLOW OBJECT
//-------------------
class TRdiiInflow
{
   constructor(){
      this.unitHyd;         // index of unit hydrograph
      this.area;
   }            // area of sewershed (ft2)
}  ;

//-----------------------------
// UNIT HYDROGRAPH GROUP OBJECT
//-----------------------------
class TUnitHyd
{
   constructor(){
      this.ID;              // name of the unit hydrograph object
      this.rainGage;        // index of rain gage
      // The following are all [12][3] arrays.
      this.iaMax = Array.from(Array(12), () => new Array(3));    // max. initial abstraction (IA) (in or mm)
      this.iaRecov = Array.from(Array(12), () => new Array(3));  // IA recovery rate (in/day or mm/day)
      this.iaInit = Array.from(Array(12), () => new Array(3));   // starting IA (in or mm)
      this.r = Array.from(Array(12), () => new Array(3));        // fraction of rainfall becoming I&I
      this.tBase = Array.from(Array(12), () => new Array(3));    // time base of each UH in each month (sec)
      this.tPeak = Array.from(Array(12), () => new Array(3));    // time to peak of each UH in each month (sec)
   }
}  ;

//-----------------
// TREATMENT OBJECT
//-----------------
class TTreatment
{
   constructor(){
      this.treatType;       // treatment equation type: REMOVAL/CONCEN
      this.equation;        // treatment eqn. as tokenized math terms
   }
};

//------------
// NODE OBJECT
//------------
class TNode
{
   constructor(){
      this.ID;              // node ID
      this.type;            // node type code
      this.subIndex;        // index of node's sub-category
      this.rptFlag;         // reporting flag
      this.invertElev;      // invert elevation (ft)
      this.initDepth;       // initial storage level (ft)
      this.fullDepth;       // dist. from invert to surface (ft)
      this.surDepth;        // added depth under surcharge (ft)
      this.pondedArea;      // area filled by ponded water (ft2)
      this.extInflow;       // pointer to external inflow data
      this.dwfInflow;       // pointer to dry weather flow inflow data
      this.rdiiInflow;      // pointer to RDII inflow data
      this.treatment = [];       // array of treatment data
      //-----------------
      this.degree;          // number of outflow links
      this.updated;         // true if state has been updated
      this.crownElev;       // top of highest flowing closed conduit (ft)
      this.inflow;          // total inflow (cfs)
      this.outflow;         // total outflow (cfs)
      this.losses;          // evap + exfiltration loss (ft3)
      this.oldVolume;       // previous volume (ft3)
      this.newVolume;       // current volume (ft3)
      this.fullVolume;      // max. storage available (ft3)
      this.overflow;        // overflow rate (cfs)
      this.oldDepth;        // previous water depth (ft)
      this.newDepth;        // current water depth (ft)
      this.oldLatFlow;      // previous lateral inflow (cfs)
      this.newLatFlow;      // current lateral inflow (cfs)
      this.oldQual = [];         // previous quality state
      this.newQual = [];         // current quality state
      this.oldFlowInflow;   // previous flow inflow
      this.oldNetInflow;    // previous net inflow
   }
} 

//---------------
// OUTFALL OBJECT
//---------------
class TOutfall
{
   constructor(){
      this.type;               // outfall type code
      this.hasFlapGate;        // true if contains flap gate
      this.fixedStage;         // fixed outfall stage (ft)
      this.tideCurve;          // index of tidal stage curve
      this.stageSeries;        // index of outfall stage time series
      this.routeTo;            // subcatchment index routed onto
      this.vRouted;            // flow volume routed (ft3)
      this.wRouted = [];            // pollutant load routed (mass)
   }
}  ;

//--------------------
// STORAGE UNIT OBJECT
//--------------------
class TStorage
{
   constructor(){
      this.fEvap;             // fraction of evaporation realized
      this.aConst;            // surface area at zero height (ft2)
      this.aCoeff;            // coeff. of area v. height curve
      this.aExpon;            // exponent of area v. height curve
      this.aCurve;            // index of tabulated area v. height curve
      this.exfil;             // TExfil ptr. to exfiltration object
      //-------------------
      this.hrt;               // hydraulic residence time (sec)
      this.evapLoss;          // evaporation loss (ft3)
      this.exfilLoss;         // exfiltration loss (ft3)
   }
}  ;

//--------------------
// FLOW DIVIDER OBJECT
//--------------------
class TDivider
{
   constructor(){
      this.link;              // index of link with diverted flow
      this.type;              // divider type code
      this.qMin;              // minimum inflow for diversion (cfs)
      this.qMax;              // flow when weir is full (cfs)
      this.dhMax;             // height of weir (ft)
      this.cWeir;             // weir discharge coeff.
      this.flowCurve;         // index of inflow v. diverted flow curve
   }
}  ;

//-----------------------------
// CROSS SECTION DATA STRUCTURE
//-----------------------------
class TXsect
{
   constructor(){
      this.type;            // type code of cross section shape
      this.culvertCode;     // type of culvert (if any)
      this.transect;        // index of transect/shape (if applicable)
      this.yFull;           // depth when full (ft)
      this.wMax;            // width at widest point (ft)
      this.ywMax;           // depth at widest point (ft)
      this.aFull;           // area when full (ft2)
      this.rFull;           // hyd. radius when full (ft)
      this.sFull;           // section factor when full (ft^4/3)
      this.sMax;            // section factor at max. flow (ft^4/3)
      // These variables have different meanings depending on section shape
      this.yBot;            // depth of bottom section
      this.aBot;            // area of bottom section
      this.sBot;            // slope of bottom section
      this.rBot;            // radius of bottom section
   }
}  ;

//--------------------------------------
// CROSS SECTION TRANSECT DATA STRUCTURE
//--------------------------------------
var  N_TRANSECT_TBL = 51       // size of transect geometry tables

class TTransect
{
   constructor(){
      this.ID;                        // section ID
      this.yFull;                     // depth when full (ft)
      this.aFull;                     // area when full (ft2)
      this.rFull;                     // hyd. radius when full (ft)
      this.wMax;                      // width at widest point (ft)
      this.ywMax;                     // depth at max width (ft)
      this.sMax;                      // section factor at max. flow (ft^4/3)
      this.aMax;                      // area at max. flow (ft2)
      this.lengthFactor;              // floodplain / channel length
      //--------------------------------------
      this.roughness;                 // Manning's n
      this.areaTbl = new Array(N_TRANSECT_TBL); // Array size [N_TRANSECT_TBL]. table of area v. depth
      this.hradTbl = new Array(N_TRANSECT_TBL);                   // Array size [N_TRANSECT_TBL]. table of hyd. radius v. depth
      this.widthTbl = new Array(N_TRANSECT_TBL);                  // Array size [N_TRANSECT_TBL]. table of top width v. depth
      this.nTbl;                      // size of geometry tables
   }
}   ;

//-------------------------------------
// CUSTOM CROSS SECTION SHAPE STRUCTURE
//-------------------------------------
var N_SHAPE_TBL = 51           // size of shape geometry tables
class TShape
{
   constructor(){
      this.curve;                     // index of shape curve
      this.nTbl;                      // size of geometry tables
      this.aFull;                     // area when full
      this.rFull;                     // hyd. radius when full
      this.wMax;                      // max. width
      this.sMax;                      // max. section factor
      this.aMax;                      // area at max. section factor
      this.areaTbl = new Array(N_SHAPE_TBL);      // double[N_SHAPE_TBL]. table of area v. depth
      this.hradTbl = new Array(N_SHAPE_TBL);      // double[N_SHAPE_TBL]. table of hyd. radius v. depth
      this.widthTbl = new Array(N_SHAPE_TBL);     // double[N_SHAPE_TBL]. table of top width v. depth
   }
}   ;

//------------
// LINK OBJECT
//------------
class TLink
{
   constructor(){
      this.ID;              // link ID
      this.type;            // link type code
      this.subIndex;        // index of link's sub-category
      this.rptFlag;         // reporting flag
      this.node1;           // start node index
      this.node2;           // end node index
      this.offset1;         // ht. above start node invert (ft)
      this.offset2;         // ht. above end node invert (ft)
      this.xsect;           // TXsect. cross section data
      this.q0;              // initial flow (cfs)
      this.qLimit;          // constraint on max. flow (cfs)
      this.cLossInlet;      // inlet loss coeff.
      this.cLossOutlet;     // outlet loss coeff.
      this.cLossAvg;        // avg. loss coeff.
      this.seepRate;        // seepage rate (ft/sec)
      this.hasFlapGate;     // true if flap gate present
      //-----------------------------
      this.oldFlow;         // previous flow rate (cfs)
      this.newFlow;         // current flow rate (cfs)
      this.oldDepth;        // previous flow depth (ft)
      this.newDepth;        // current flow depth (ft)
      this.oldVolume;       // previous flow volume (ft3)
      this.newVolume;       // current flow volume (ft3)
      this.surfArea1;       // upstream surface area (ft2)
      this.surfArea2;       // downstream surface area (ft2)
      this.qFull;           // flow when full (cfs)
      this.setting;         // current control setting
      this.targetSetting;   // target control setting
      this.timeLastSet;     // time when setting was last changed
      this.froude;          // Froude number
      this.oldQual = [];         // previous quality state
      this.newQual = [];         // current quality state
      this.totalLoad = [];       // total quality mass loading
      this.flowClass;       // flow classification
      this.dqdh;            // change in flow w.r.t. head (ft2/sec)
      this.direction;       // flow direction flag
      this.bypassed;        // bypass dynwave calc. flag
      this.normalFlow;      // normal flow limited flag
      this.inletControl;    // culvert inlet control flag
   }
}  ;

//---------------
// CONDUIT OBJECT
//---------------
class TConduit
{
   constructor(){
      this.length;          // conduit length (ft)
      this.roughness;       // Manning's n
      this.barrels;         // number of barrels
      //-----------------------------
      this.modLength;       // modified conduit length (ft)
      this.roughFactor;     // roughness factor for DW routing
      this.slope;           // slope
      this.beta;            // discharge factor
      this.qMax;            // max. flow (cfs)
      this.a1;              // upstream & downstream areas (ft2)
      this.a2;
      this.q1;              // upstream & downstream flows per barrel (cfs)
      this.q2;          
      this.q1Old;           // previous values of q1 & q2 (cfs)
      this.q2Old;
      this.evapLossRate;    // evaporation rate (cfs)
      this.seepLossRate;    // seepage rate (cfs)
      this.capacityLimited; // capacity limited flag
      this.superCritical;   // super-critical flow flag
      this.hasLosses;       // local losses flag
      this.fullState;       // determines if either or both ends full
   }
}  ;

//------------
// PUMP OBJECT
//------------
class TPump
{
   constructor(){
      this.type;            // pump type
      this.pumpCurve;       // pump curve table index
      this.initSetting;     // initial speed setting
      this.yOn;             // startup depth (ft)
      this.yOff;            // shutoff depth (ft)
      this.xMin;            // minimum pt. on pump curve
      this.xMax;            // maximum pt. on pump curve
   }
}  ;


//---------------
// ORIFICE OBJECT
//---------------
class TOrifice
{
   constructor(){
      this.type;            // orifice type code
      this.shape;           // orifice shape code
      this.cDisch;          // discharge coeff.
      this.orate;           // time to open/close (sec)
      //-----------------------------
      this.cOrif;           // coeff. for orifice flow (ft^2.5/sec)
      this.hCrit;           // inlet depth where weir flow begins (ft)
      this.cWeir;           // coeff. for weir flow (cfs)
      this.length;          // equivalent length (ft)
      this.surfArea;        // equivalent surface area (ft2)
   }
}  ;

//------------
// WEIR OBJECT
//------------
class TWeir
{
   constructor(){
      this.type;            // weir type code
      this.cDisch1;         // discharge coeff.
      this.cDisch2;         // discharge coeff. for ends
      this.endCon;          // end contractions
      this.canSurcharge;    // true if weir can surcharge
      this.roadWidth;       // width for ROADWAY weir
      this.roadSurface;     // road surface material
      this.cdCurve;         // discharge coeff. curve index              //(5.1.013)
      //-----------------------------
      this.cSurcharge;      // orifice coeff. for surcharge
      this.length;          // equivalent length (ft)
      this.slope;           // slope for Vnotch & Trapezoidal weirs
      this.surfArea;        // equivalent surface area (ft2)
   }
}  ;

//---------------------
// OUTLET DEVICE OBJECT
//---------------------
class TOutlet
{
   constructor(){
      this.qCoeff;          // discharge coeff.
      this.qExpon;          // discharge exponent
      this.qCurve;          // index of discharge rating curve
      this.curveType;       // rating curve type
   }
}   

//-----------------
// POLLUTANT OBJECT
//-----------------
class TPollut
{
   constructor(){
      this.ID;              // Pollutant ID
      this.units;           // units
      this.mcf;             // mass conversion factor
      this.dwfConcen;       // dry weather sanitary flow concen.
      this.pptConcen;       // precip. concen.
      this.gwConcen;        // groundwater concen.
      this.rdiiConcen;      // RDII concen.
      this.initConcen;      // initial concen. in conveyance network
      this.kDecay;          // decay constant (1/sec)
      this.coPollut;        // co-pollutant index
      this.coFraction;      // co-pollutant fraction
      this.snowOnly;        // TRUE if buildup occurs only under snow
   }
}  ;

//------------------------
// BUILDUP FUNCTION OBJECT
//------------------------
class TBuildup
{
   constructor(){
      this.normalizer;      // normalizer code (area or curb length)
      this.funcType;        // buildup function type code
      this.coeff = new Array(3);           // Array of size 3. Coeffs. of buildup function
      this.maxDays;         // time to reach max. buildup (days)
   }
}  ;

//------------------------
// WASHOFF FUNCTION OBJECT
//------------------------
class TWashoff
{
   constructor(){
      this.funcType;        // washoff function type code
      this.coeff;           // function coeff.
      this.expon;           // function exponent
      this.sweepEffic;      // street sweeping fractional removal
      this.bmpEffic;        // best mgt. practice fractional removal
   }
}  ;

//---------------
// LANDUSE OBJECT
//---------------
class TLanduse
{
   constructor(){
      this.ID;              // landuse name
      this.sweepInterval;   // street sweeping interval (days)
      this.sweepRemoval;    // fraction of buildup available for sweeping
      this.sweepDays0;      // days since last sweeping at start
      this.buildupFunc = [];     // TBuildup. array of buildup functions for pollutants
      this.washoffFunc = [];     // TWashoff. array of washoff functions for pollutants
   }
}  ;

//--------------------------
// REPORTING FLAGS STRUCTURE
//--------------------------
class TRptFlags
{
   constructor(){
      this.report;          // TRUE if results report generated
      this.input;           // TRUE if input summary included
      this.subcatchments;   // TRUE if subcatchment results reported
      this.nodes;           // TRUE if node results reported
      this.links;           // TRUE if link results reported
      this.continuity;      // TRUE if continuity errors reported
      this.flowStats;       // TRUE if routing link flow stats. reported
      this.nodeStats;       // TRUE if routing node depth stats. reported
      this.controls;        // TRUE if control actions reported
      this.averages;        // TRUE if average results reported          //(5.1.013)
      this.linesPerPage;    // number of lines printed per page
   }
}  ;

//-------------------------------
// CUMULATIVE RUNOFF TOTALS
//-------------------------------
class TRunoffTotals
{                                 // All volume totals are in ft3.
   constructor(){
      this.rainfall;        // rainfall volume
      this.evap;            // evaporation loss
      this.infil;           // infiltration loss
      this.runoff;          // runoff volume
      this.drains;          // LID drains
      this.runon;           // runon from outfalls
      this.initStorage;     // inital surface storage
      this.finalStorage;    // final surface storage
      this.initSnowCover;   // initial snow cover
      this.finalSnowCover;  // final snow cover
      this.snowRemoved;     // snow removal
      this.pctError;        // continuity error (%)
   }
}  ;

//--------------------------
// CUMULATIVE LOADING TOTALS
//--------------------------
class TLoadingTotals
{                                 // All loading totals are in lbs.
   constructor(){
      this.initLoad;        // initial loading
      this.buildup;         // loading added from buildup
      this.deposition;      // loading added from wet deposition
      this.sweeping;        // loading removed by street sweeping
      this.bmpRemoval;      // loading removed by BMPs
      this.infil;           // loading removed by infiltration
      this.runoff;          // loading removed by runoff
      this.finalLoad;       // final loading
      this.pctError;        // continuity error (%)
   }
}  ;

//------------------------------
// CUMULATIVE GROUNDWATER TOTALS
//------------------------------
class TGwaterTotals
{                                 // All GW flux totals are in feet.
   constructor(){
      this.infil;           // surface infiltration
      this.upperEvap;       // upper zone evaporation loss
      this.lowerEvap;       // lower zone evaporation loss
      this.lowerPerc;       // percolation out of lower zone
      this.gwater;          // groundwater flow
      this.initStorage;     // initial groundwater storage
      this.finalStorage;    // final groundwater storage
      this.pctError;        // continuity error (%)
   }
}  ;

//----------------------------
// CUMULATIVE ROUTING TOTALS
//----------------------------
class TRoutingTotals
{                                  // All routing totals are in ft3.
   constructor(){
      this.dwInflow;         // dry weather inflow
      this.wwInflow;         // wet weather inflow
      this.gwInflow;         // groundwater inflow
      this.iiInflow;         // RDII inflow
      this.exInflow;         // direct inflow
      this.flooding;         // internal flooding
      this.outflow;          // external outflow
      this.evapLoss;         // evaporation loss
      this.seepLoss;         // seepage loss
      this.reacted;          // reaction losses
      this.initStorage;      // initial storage volume
      this.finalStorage;     // final storage volume
      this.pctError;         // continuity error
   }
}  ;

//-----------------------
// SYSTEM-WIDE STATISTICS
//-----------------------
var TIMELEVELS = 6                                          //(5.1.015)
class TSysStats
{
   constructor(){
      this.minTimeStep;
      this.maxTimeStep;
      this.avgTimeStep;
      this.avgStepCount;
      this.steadyStateCount;
      this.timeStepIntervals = new Array(TIMELEVELS); // Array of size [TIMELEVELS];      //(5.1.015)
      this.timeStepCounts = new Array(TIMELEVELS);    // Array of size [TIMELEVELS];      //(5.1.015)   
   }
   
}  ;

//--------------------
// RAINFALL STATISTICS
//--------------------
class TRainStats
{
   constructor(){
      this.startDate;
      this.endDate;
      this.periodsRain;
      this.periodsMissing;
      this.periodsMalfunc;
   }
}  ;

//------------------------
// SUBCATCHMENT STATISTICS
//------------------------
class TSubcatchStats
{
   constructor(){
      this.precip;
      this.runon;
      this.evap;
      this.infil;
      this.runoff;
      this.maxFlow;
      this.impervRunoff;                                                 //(5.1.013)
      this.pervRunoff;                                                   //
   }
}  ;

//----------------
// NODE STATISTICS
//----------------
class TNodeStats
{
   constructor(){
      this.avgDepth;
      this.maxDepth;
      this.maxDepthDate;
      this.maxRptDepth;
      this.volFlooded;
      this.timeFlooded;
      this.timeSurcharged;
      this.timeCourantCritical;
      this.totLatFlow;
      this.maxLatFlow;
      this.maxInflow;
      this.maxOverflow;
      this.maxPondedVol;
      this.maxInflowDate;
      this.maxOverflowDate;
   }
}  ;

//-------------------
// STORAGE STATISTICS
//-------------------
class TStorageStats
{
   constructor(){
      this.initVol;
      this.avgVol;
      this.maxVol;
      this.maxFlow;
      this.evapLosses;
      this.exfilLosses;
      this.maxVolDate;
   }
}  ;

//-------------------
// OUTFALL STATISTICS
//-------------------
class TOutfallStats
{
   constructor(){
      this.avgFlow;
      this.maxFlow;
      this.totalLoad = [];
      this.totalPeriods;
   }
}  ;

//----------------
// PUMP STATISTICS
//----------------
class TPumpStats
{
   constructor(){
      this.utilized;
      this.minFlow;
      this.avgFlow;
      this.maxFlow;
      this.volume;
      this.energy;
      this.offCurveLow;
      this.offCurveHigh;
      this.startUps;
      this.totalPeriods;
   }
}  ;

//----------------
// LINK STATISTICS
//----------------
class TLinkStats
{
   constructor(){
      this.maxFlow;
      this.maxFlowDate;
      this.maxVeloc;
      this.maxDepth;
      this.timeNormalFlow;
      this.timeInletControl;
      this.timeSurcharged;
      this.timeFullUpstream;
      this.timeFullDnstream;
      this.timeFullFlow;
      this.timeCapacityLimited;
      this.timeInFlowClass = new Array(MAX_FLOW_CLASSES)      // Array of size [MAX_FLOW_CLASSES];
      this.timeCourantCritical;
      this.flowTurns;
      this.flowTurnSign;
   }
}  ;

//-------------------------
// MAXIMUM VALUE STATISTICS
//-------------------------
class TMaxStats
{
   constructor(){
      this.objType;         // either NODE or LINK
      this.index;           // node or link index
      this.value;           // value of node or link statistic
   }
}  ;

//------------------
// REPORT FIELD INFO
//------------------
class TRptField
{
   constructor(){
      this.Name;        // Array [80]. name of reported variable
      this.Units;       // Array [80]. units of reported variable
      this.Enabled;         // TRUE if appears in report table
      this.Precision;       // number of decimal places when reported
   }
}  ;


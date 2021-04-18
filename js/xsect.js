//-----------------------------------------------------------------------------
//   xsect.c
//
//   Project:  EPA SWMM5
//   Version:  5.1
//   Date:     03/20/14   (Build 5.1.001)
//             03/14/17   (Build 5.1.012)
//             05/10/18   (Build 5.1.013)
//   Author:   L. Rossman (EPA)
//             M. Tryby (EPA)
//
//   Cross section geometry functions.
//
//   The primary functions are:
//      getAofY   -- returns area given depth
//      getWofY   -- returns top width given depth
//      getRofY   -- returns hyd. radius given depth
//      getYofA   -- returns flow depth given area
//      getRofA   -- returns hyd. radius given area
//      getSofA   -- returns section factor given area
//      getAofS   -- returns area given section factor
//      getdSdA   -- returns derivative of section factor w.r.t. area
//   where
//      Y = flow depth
//      A = flow area
//      R = hyd. radius
//      S = section factor = A*R^(2/3)
//
//   Build 5.1.012:
//   - Height at max. width for Modified Baskethandle shape corrected.
//
//   Build 5.1.013:
//   - Width at full height set to 0 for closed rectangular shape.
//-----------------------------------------------------------------------------


//#include "xsect.dat"    // File containing geometry tables for rounded shapes
//-----------------------------------------------------------------------------
//   xsection.dat
//
//   Project:  EPA SWMM5
//   Version:  5.1
//   Date:     03/20/14   (Build 5.1.001)
//   Author:   L. Rossman
//
//   Tables of relative geometric properties for rounded cross-sections.
//
//   Tables are named using the following convention:
//     A_xxx   = area / full area v. depth / full depth for shape xxx
//     Y_xxx   = depth / full depth v. area / full area for shape xxx
//     W_xxx   = width / max. width v. depth / full depth for shape xxx
//     R_xxx   = hyd. radius / hyd. radius at full depth v. depth /
//               full depth for shape xxx
//     S_xxx   = section factor / section factor at full depth v. area /
//               area at full depth for shape xxx
//     N_Z_xxx = number of equal intervals between 0.0 and 1.0 in the
//               table for parameter Z and shape xxx.
//-----------------------------------------------------------------------------

//=============================================================================
//  CIRCULAR SHAPE
//=============================================================================

var    N_A_Circ   = 51;
var A_Circ =     // A/Afull v. Y/Yfull
[0.0,.00471,.0134,.024446,.0374,.05208,.0680,.08505,.1033,.12236,
     .1423,.16310,.1845,.20665,.2292,.25236,.2759,.29985,.3242,.34874,
     .3736,.39878,.4237,.44907,.4745,.500,.5255,.55093,.5763,.60135,
     .6264,.65126,.6758,.70015,.7241,.74764,.7708,.79335,.8154,.83690,
     .8576,.87764,.8967,.91495,.9320,.94792,.9626,.97555,.9866,.99516,1.000];

var    N_R_Circ   = 51;
var R_Circ =    // R/Rfull v. Y/Yfull
[.0100,.0528,.1048,.1556,.2052,.254,.3016,.3484,.3944,.4388,
 .4824,.5248,.5664,.6064,.6456,.6836,.7204,.7564,.7912,.8244,
 .8568,.888,.9176,.9464,.9736,1.00,1.024,1.048,1.070,1.0912,1.110,1.1272,
 1.144,1.1596,1.174,1.1848,1.194,1.2024,1.210,1.2148,
 1.217,1.2172,1.215,1.2104,1.203,1.192,1.178,1.1584,1.132,1.094,1.000];

 var    N_Y_Circ   = 51;
 var Y_Circ =    // Y/Yfull v. A/Afull
[0.0, 0.05236, 0.08369, 0.11025, 0.13423, 0.15643, 0.17755, 0.19772, 0.21704,
      0.23581, 0.25412, 0.27194, 0.28948, 0.30653, 0.32349, 0.34017, 0.35666,
      0.37298, 0.38915, 0.40521, 0.42117, 0.43704, 0.45284, 0.46858, 0.4843,
      0.50000, 0.51572, 0.53146, 0.54723, 0.56305, 0.57892, 0.59487, 0.61093,
      0.62710, 0.64342, 0.65991, 0.67659, 0.69350, 0.71068, 0.72816, 0.74602,
      0.76424, 0.78297, 0.80235, 0.82240, 0.84353, 0.86563, 0.88970, 0.91444,
      0.94749, 1.0];

var    N_S_Circ   = 51;
var S_Circ =    // S/Sfull v. A/Afull
[0.0, 0.00529, 0.01432, 0.02559, 0.03859, 0.05304, 0.06877, 0.08551, 0.10326,
      0.12195, 0.14144, 0.16162, 0.18251, 0.2041,  0.22636, 0.24918, 0.27246,
      0.29614, 0.32027, 0.34485, 0.36989, 0.39531, 0.42105, 0.44704, 0.47329,
      0.4998,  0.52658, 0.55354, 0.58064, 0.60777, 0.63499, 0.66232, 0.68995,
      0.7177,  0.74538, 0.77275, 0.79979, 0.82658, 0.8532,  0.87954, 0.90546,
      0.93095, 0.95577, 0.97976, 1.00291, 1.02443, 1.04465, 1.06135, 1.08208,
      1.07662, 1.0];

var    N_W_Circ   = 51;
var W_Circ =    // W/Wmax v. Y/Yfull
[0.0,   .2800,   .3919,   .4750,   .5426,   .6000,   .6499,   .6940,   .7332,
        .7684,   .8000,   .8285,   .8542,   .8773,   .8980,   .9165,   .9330, 
        .9474,   .9600,   .9708,   .9798,   .9871,   .9928,   .9968,   .9992,
        1.000,   .9992,   .9968,   .9928,   .9871,   .9798,   .9708,   .9600,
        .9474,   .9330,   .9165,   .8980,   .8773,   .8542,   .8285,   .8000,
        .7684,   .7332,   .6940,   .6499,   .6000,   .5426,   .4750,   .3919,
        .2800,   .0];

//=============================================================================
//  EGG SHAPE
//=============================================================================

var    N_A_Egg   = 26;
var A_Egg =
[.0000,.0150,.0400,.0550,.0850,.1200,.1555,.1900,.2250,.2750,
 .3200,.3700,.4200,.4700,.5150,.5700,.6200,.6800,.7300,.7800, 
 .8350,.8850,.9250,.9550,.9800,1.000];

var    N_R_Egg   = 26;
var R_Egg =
[.0100,.0970,.2160,.3020,.3860,.4650,.5360,.6110,.6760,.7350, 
 .7910,.8540,.9040,.9410,1.008,1.045,1.076,1.115,1.146,1.162, 
 1.186,1.193,1.186,1.162,1.107,1.000];

var    N_Y_Egg   = 51;
var Y_Egg = 
[0.0, 0.04912, 0.08101, 0.11128, 0.14161, 0.16622, 0.18811, 0.21356, 0.23742,
      0.25742, 0.27742, 0.29741, 0.31742, 0.33742, 0.35747, 0.37364, 0.4,
      0.41697, 0.43372, 0.45,    0.46374, 0.47747, 0.49209, 0.50989, 0.53015,
      0.55,    0.56429, 0.57675, 0.58834, 0.6,     0.61441, 0.62967, 0.64582,
      0.66368, 0.68209, 0.7,     0.71463, 0.72807, 0.74074, 0.75296, 0.765,
      0.77784, 0.79212, 0.80945, 0.82936, 0.85,    0.86731, 0.88769, 0.914,
      0.95,    1.0];

var    N_S_Egg   = 51;
var S_Egg = 
[0.0, 0.00295, 0.01331, 0.02629, 0.04,    0.05657, 0.075,   0.09432, 0.11473,
      0.13657, 0.15894, 0.1803,  0.20036, 0.22,    0.23919, 0.25896, 0.28,
      0.30504, 0.33082, 0.35551, 0.37692, 0.39809, 0.42,    0.44625, 0.47321,
      0.5,     0.52255, 0.54481, 0.56785, 0.59466, 0.62485, 0.65518, 0.68181,
      0.70415, 0.72585, 0.74819, 0.77482, 0.80515, 0.83534, 0.86193, 0.88465,
      0.9069,  0.93,    0.95866, 0.98673, 1.01238, 1.03396, 1.05,    1.06517,
      1.0538,  1.0];

var    N_W_Egg   = 26;
var W_Egg =
[.0,    .2980,   .4330,   .5080,   .5820,   .6420,   .6960,   .7460,   .7910,
        .8360,   .8660,   .8960,   .9260,   .9560,   .9700,   .9850,   1.000,
        .9850,   .9700,   .9400,   .8960,   .8360,   .7640,   .6420,   .3100,
	.0];


//=============================================================================
//  HORSESHOE SHAPE
//=============================================================================

var    N_A_Horseshoe   = 26;
var A_Horseshoe =
[.0000,.0181,.0508,.0908,.1326,.1757,.2201,.2655,.3118,.3587,
 .4064,.4542,.5023,.5506,.5987,.6462,.6931,.7387,.7829,.8253, 
 .8652,.9022,.9356,.9645,.9873,1.000];

var    N_R_Horseshoe   = 26;
var R_Horseshoe =
[.0100,.1040,.2065,.3243,.4322,.5284,.6147,.6927,.7636,.8268, 
 .8873,.9417,.9905,1.036,1.077,1.113,1.143,1.169,1.189,1.202, 
 1.208,1.206,1.195,1.170,1.126,1.000];

var    N_Y_Horseshoe   = 51;
var Y_Horseshoe =
[0.0, 0.04146, 0.07033, 0.09098, 0.10962, 0.12921, 0.14813, 0.16701, 0.18565,
      0.20401, 0.22211, 0.23998, 0.25769, 0.27524, 0.29265, 0.3099,  0.32704,
      0.34406, 0.36101, 0.3779,  0.39471, 0.41147, 0.42818, 0.44484, 0.46147,
      0.47807, 0.49468, 0.51134, 0.52803, 0.54474, 0.56138, 0.57804, 0.59478,
      0.61171, 0.62881, 0.64609, 0.6635,  0.68111, 0.69901, 0.71722, 0.73583,
      0.7549,  0.77447, 0.79471, 0.81564, 0.83759, 0.86067, 0.88557, 0.91159,
      0.9452,  1.0];

var    N_S_Horseshoe   = 51;
var S_Horseshoe =
[0.0, 0.00467, 0.01237, 0.02268, 0.03515, 0.04943, 0.06525, 0.08212, 0.10005,
      0.11891, 0.13856, 0.15896, 0.18004, 0.20172, 0.22397, 0.24677, 0.27006,
      0.2938,  0.3179,  0.34237, 0.3672,  0.39239, 0.41792, 0.44374, 0.46984,
      0.49619, 0.52276, 0.5495,  0.5764,  0.60345, 0.63065, 0.65795, 0.68531,
      0.71271, 0.74009, 0.76738, 0.79451, 0.82144, 0.84814, 0.8745,  0.90057,
      0.92652, 0.95244, 0.97724, 0.99988, 1.02048, 1.03989, 1.05698, 1.07694,
      1.07562, 1.0];

var    N_W_Horseshoe   = 26;
var W_Horseshoe =
[   .0,      .5878,   .8772,   .8900,   .9028,   .9156,   .9284,   .9412,
    .9540,   .9668,   .9798,   .9928,   .9992,   .9992,   .9928,   .9798,
    .9600,   .9330,   .8980,   .8542,   .8000,   .7332,   .6499,   .5426,
    .3919,   .0];


//=============================================================================
//  GOTHIC SHAPE
//=============================================================================

var    N_Y_Gothic   = 51;
var Y_Gothic =
[0.0, 0.04522, 0.07825, 0.10646, 0.12645, 0.14645, 0.16787, 0.18641, 0.20129,
      0.22425, 0.24129, 0.25624, 0.27344, 0.29097, 0.30529, 0.32607, 0.33755,
      0.35073, 0.36447, 0.37558, 0.4,     0.4181,  0.43648, 0.45374, 0.46805,
      0.48195, 0.49626, 0.51352, 0.5319,  0.55,    0.56416, 0.57787, 0.59224,
      0.6095,  0.62941, 0.65,    0.67064, 0.69055, 0.70721, 0.72031, 0.73286,
      0.74632, 0.76432, 0.78448, 0.80421, 0.82199, 0.84363, 0.87423, 0.90617,
      0.93827, 1.0];

var    N_S_Gothic   = 51;
var S_Gothic =
[0.0, 0.005,   0.0174,  0.03098, 0.04272, 0.055,   0.0698,  0.0862,  0.10461,
      0.12463, 0.145,   0.16309, 0.18118, 0.2,     0.22181, 0.24487, 0.26888,
      0.2938,  0.31901, 0.34389, 0.36564, 0.38612, 0.4072,  0.43,    0.45868,
      0.48895, 0.52,    0.55032, 0.5804,  0.61,    0.63762, 0.66505, 0.6929,
      0.72342, 0.75467, 0.785,   0.81165, 0.83654, 0.86,    0.88253, 0.90414,
      0.925,   0.94486, 0.96475, 0.98567, 1.00833, 1.03,    1.0536,  1.065,
      1.055,   1.0];

var    N_W_Gothic   = 21;
var W_Gothic =
[0.0,   0.286,   0.643,   0.762,   0.833,   0.905,   0.952,   0.976,   0.976,
        1.0,     1.0,     0.976,   0.976,   0.952,   0.905,   0.833,   0.762,
        0.667,   0.524,   0.357,   0.0];


//=============================================================================
//  CATENARY SHAPE
//=============================================================================

var    N_Y_Catenary   = 51;
var Y_Catenary =
[0.0, 0.02974, 0.06439, 0.08433, 0.10549, 0.12064, 0.13952, 0.1556,  0.17032,
      0.18512, 0.20057, 0.21995, 0.24011, 0.25892, 0.27595, 0.29214, 0.30802,
      0.32372, 0.33894, 0.35315, 0.36557, 0.37833, 0.3923,  0.4097,  0.42982,
      0.45,    0.46769, 0.48431, 0.5,     0.51466, 0.52886, 0.54292, 0.55729,
      0.57223, 0.5878,  0.60428, 0.62197, 0.64047, 0.6598,  0.67976, 0.7,
      0.71731, 0.73769, 0.76651, 0.8,     0.8209,  0.84311, 0.87978, 0.91576,
      0.95,    1.0];

var    N_S_Catenary   = 51;
var S_Catenary =
[0.0, 0.00605, 0.01455, 0.0254,  0.03863, 0.0543,  0.07127, 0.08778, 0.10372,
      0.12081, 0.14082, 0.16375, 0.18779, 0.21157, 0.23478, 0.25818, 0.28244,
      0.30741, 0.33204, 0.35505, 0.37465, 0.39404, 0.41426, 0.43804, 0.46531,
      0.49357, 0.52187, 0.54925, 0.57647, 0.60321, 0.62964, 0.65639, 0.68472,
      0.71425, 0.74303, 0.76827, 0.79168, 0.815,   0.84094, 0.86707, 0.89213,
      0.91607, 0.94,    0.96604, 0.99,    1.00714, 1.02158, 1.03814, 1.05,
      1.05,    1.0];

var    N_W_Catenary   = 21;
var W_Catenary =
[0.0,    0.6667,  0.8222,  0.9111,  0.9778,  1.0000,  1.0000,  0.9889,  0.9778,
         0.9556,  0.9333,  0.8889,  0.8444,  0.8000,  0.7556,  0.7000,  0.6333,
         0.5556,  0.4444,  0.3333,  0.0];


//=============================================================================
//  SEMI-ELLIPTICAL SHAPE
//=============================================================================

var    N_Y_SemiEllip   = 51;
var Y_SemiEllip =
[0.0, 0.03075, 0.05137, 0.07032, 0.09,    0.11323, 0.13037, 0.14519, 0.15968,
      0.18459, 0.19531, 0.21354, 0.22694, 0.23947, 0.25296, 0.265,   0.27784,
      0.29212, 0.3097,  0.32982, 0.35,    0.36738, 0.3839,  0.4,     0.41667,
      0.43333, 0.45,    0.46697, 0.48372, 0.5,     0.51374, 0.52747, 0.54209,
      0.5595,  0.57941, 0.6,     0.62,    0.64,    0.66,    0.68,    0.7,
      0.71843, 0.73865, 0.76365, 0.7926,  0.82088, 0.85,    0.88341, 0.90998,
      0.93871, 1.0];

var    N_S_SemiEllip   = 51;
var S_SemiEllip =
[0.0, 0.00438, 0.01227, 0.02312, 0.03638, 0.05145, 0.06783, 0.085,   0.10093,
      0.11752, 0.1353,  0.15626, 0.17917, 0.20296, 0.22654, 0.24962, 0.27269,
      0.29568, 0.31848, 0.34152, 0.365,   0.38941, 0.41442, 0.44,    0.46636,
      0.49309, 0.52,    0.54628, 0.57285, 0.6,     0.62949, 0.65877, 0.68624,
      0.71017, 0.73304, 0.75578, 0.77925, 0.80368, 0.83114, 0.8595,  0.88592,
      0.90848, 0.93,    0.95292, 0.97481, 0.99374, 1.01084, 1.02858, 1.04543,
      1.05,    1.0];

var    N_W_SemiEllip   = 21;
var W_SemiEllip =
[0.0,    0.7000,  0.9800,  1.0000,  1.0000,  1.0000,  0.9900,  0.9800,  0.9600,
         0.9400,  0.9100,  0.8800,  0.8400,  0.8000,  0.7500,  0.7000,  0.6400,
         0.5600,  0.4600,  0.3400,  0.0];


//=============================================================================
//  BASKETHANDLE SHAPE
//=============================================================================

var    N_A_Baskethandle   = 26;
var A_Baskethandle =
[.0000,.0173,.0457,.0828,.1271,.1765,.2270,.2775,.3280,.3780,
 .4270,.4765,.5260,.5740,.6220,.6690,.7160,.7610,.8030,.8390, 
 .8770,.9110,.9410,.9680,.9880,1.000];

var    N_R_Baskethandle   = 26;
var R_Baskethandle =
[.0100,.0952,.1890,.2730,.3690,.4630,.5600,.6530,.7430,.8220, 
 .8830,.9490,.9990,1.055,1.095,1.141,1.161,1.188,1.206,1.206, 
 1.206,1.205,1.196,1.168,1.127,1.000];

var    N_Y_BasketHandle   = 51;
var Y_BasketHandle =
[0.0, 0.04112, 0.0738,  0.1,     0.12236, 0.14141, 0.15857, 0.17462, 0.18946,
      0.20315, 0.21557, 0.22833, 0.2423,  0.25945, 0.27936, 0.3,     0.3204,
      0.34034, 0.35892, 0.37595, 0.39214, 0.40802, 0.42372, 0.43894, 0.45315,
      0.46557, 0.47833, 0.4923,  0.50945, 0.52936, 0.55,    0.57,    0.59,
      0.61023, 0.63045, 0.65,    0.66756, 0.68413, 0.7,     0.71481, 0.72984,
      0.74579, 0.76417, 0.78422, 0.80477, 0.82532, 0.85,    0.88277, 0.915,
      0.95,    1.0];

var    N_S_BasketHandle   = 51;
var S_BasketHandle =
[0.0, 0.00758, 0.01812, 0.03,    0.03966, 0.04957, 0.0623,  0.07849, 0.09618,
      0.11416, 0.13094, 0.14808, 0.16583, 0.18381, 0.20294, 0.225,   0.2547,
      0.28532, 0.31006, 0.32804, 0.34555, 0.36944, 0.40032, 0.43203, 0.46004,
      0.47849, 0.49591, 0.51454, 0.5381,  0.56711, 0.6,     0.64092, 0.68136,
      0.71259, 0.73438, 0.755,   0.78625, 0.8188,  0.85,    0.8679,  0.88483,
      0.90431, 0.9369,  0.97388, 1.00747, 1.033,   1.05,    1.05464, 1.06078,
      1.055,   1.0];

var    N_W_BasketHandle   = 26;
var W_BasketHandle =
[0.0, 0.49,    0.667,   0.82,    0.93,    1.00,    1.00,    1.00,    0.997,
      0.994,   0.988,   0.982,   0.967,   0.948,   0.928,   0.904,   0.874,
      0.842,   0.798,   0.75,    0.697,   0.637,   0.567,   0.467,   0.342,
      0.0];


//=============================================================================
//  SEMI-CIRCULAR SHAPE
//=============================================================================

var    N_Y_SemiCirc   = 51;
var Y_SemiCirc =
[0.0, 0.04102, 0.07407, 0.1,     0.11769, 0.13037, 0.14036, 0.15,    0.16546,
      0.18213, 0.2,     0.22018, 0.2403,  0.25788, 0.27216, 0.285,   0.29704,
      0.30892, 0.32128, 0.33476, 0.35,    0.36927, 0.38963, 0.41023, 0.43045,
      0.45,    0.46769, 0.48431, 0.5,     0.51443, 0.52851, 0.54271, 0.55774,
      0.57388, 0.59101, 0.60989, 0.63005, 0.65,    0.66682, 0.68318, 0.7,
      0.71675, 0.73744, 0.76651, 0.8,     0.8209,  0.84311, 0.87978, 0.91576,
      0.95, 1.0];

var    N_S_SemiCirc   = 51;
var S_SemiCirc =
[0.0, 0.00757, 0.01815, 0.03,    0.0358,  0.04037, 0.04601, 0.055,   0.07475,
      0.09834, 0.125,   0.1557,  0.18588, 0.20883, 0.223,   0.23472, 0.24667,
      0.26758, 0.29346, 0.32124, 0.35,    0.3772,  0.4054,  0.43541, 0.46722,
      0.5,     0.53532, 0.56935, 0.6,     0.61544, 0.62811, 0.6417,  0.66598,
      0.7001,  0.73413, 0.76068, 0.78027, 0.8,     0.82891, 0.85964, 0.89,
      0.9127,  0.93664, 0.96677, 1.0,     1.02661, 1.04631, 1.05726, 1.06637,
      1.06,    1.0];

var    N_W_SemiCirc   = 21;
var W_SemiCirc =
[0.0, 0.5488,  0.8537,  1.0000,  1.0000,  0.9939,  0.9878,  0.9756,  0.9634,
      0.9451,  0.9207,  0.8902,  0.8537,  0.8171,  0.7683,  0.7073,  0.6463,
      0.5732,  0.4756,  0.3354,  0.0];

//=============================================================================
//  SIZES FOR STANDARD ELLIPSE SHAPES
//=============================================================================

var NumCodesEllipse = 23;

//  Minor  axis (inches)
var MinorAxis_Ellipse =
[ 14,19,22,24,27,29,32,34,38,43,48,53,58,63,68,72,77,82,87,92,97,106,116];

//  Major axis (inches)
var MajorAxis_Ellipse =
[ 23,30,34,38,42,45,49,53,60,68,76,83,91,98,106,113, 121,128,136,143,151,
  166,180];

//  Full area (sq.ft.)
var Afull_Ellipse =
[ 1.80,3.30,4.10,5.10,6.30,7.40,8.80,10.20,12.90,16.60,20.50,24.80,29.50,34.60,
  40.10,46.10,52.40,59.20,66.40,74.00,82.00,99.20,118.60];

//  Full hydraulic radius (ft)
var Rfull_Ellipse =
[ 0.367,0.490,0.546,0.613,0.686,0.736,0.812,0.875,0.969,1.106,1.229,1.352,
  1.475,1.598,1.721,1.845,1.967,2.091,2.215,2.340,2.461,2.707,2.968];

//=============================================================================
//  HORIZONTAL ELLIPSE SHAPE
//=============================================================================

var    N_A_HorizEllipse   = 26;
var A_HorizEllipse =
[ .0000,.0150,.0400,.0650,.0950,.1300,.1650,.2050,.2500,.3000,
  .3550,.4150,.4800,.5200,.5850,.6450,.7000,.7500,.7950,.8350,
  .8700,.9050,.9350,.9600,.9850,1.000];

var    N_R_HorizEllipse   = 26;
var R_HorizEllipse =
[ .0100,.0764,.1726,.2389,.3274,.4191,.5120,.5983,.6757,.7630,
  .8326,.9114,.9702,1.030,1.091,1.146,1.185,1.225,1.257,1.274,
  1.290,1.282,1.274,1.257,1.185,1.000];

var    N_W_HorizEllipse   = 26;
var W_HorizEllipse =
[ .0,.3919,.5426,.6499,.7332,.8000,.8542,.8980,.9330,.9600,
  .9798,.9928,.9992,.9992,.9928,.9798,.9600,.9330,.8980,.8542,
  .8000,.7332,.6499,.5426,.3919,.0];


//=============================================================================
//  VERTICAL ELLIPSE SHAPE
//=============================================================================

var    N_A_VertEllipse   = 26;
var A_VertEllipse =
[ .0000,.0100,.0400,.0700,.1000,.1400,.1850,.2300,.2800,.3300,
  .3800,.4300,.4800,.5200,.5700,.6200,.6700,.7200,.7700,.8150,
  .8600,.9000,.9300,.9600,.9900,1.000];

var    N_R_VertEllipse   = 26;
var R_VertEllipse =
[ .0100,.1250,.2436,.3536,.4474,.5484,.6366,.7155,.7768,.8396,
  .8969,.9480,.9925,1.023,1.053,1.084,1.107,1.130,1.154,1.170,
  1.177,1.177,1.170,1.162,1.122,1.000];

var    N_W_VertEllipse   = 26;
var W_VertEllipse =
[ .0,.3919,.5426,.6499,.7332,.8000,.8542,.8980,.9330,.9600,
  .9798,.9928,.9992,.9992,.9928,.9798,.9600,.9330,.8980,.8542,
  .8000,.7332,.6499,.5426,.3919,.0];


//=============================================================================
//  ARCH SHAPE
//=============================================================================

var NumCodesArch = 102;

var Yfull_Arch =     // NOTE: these are in inches
[    
     /* Concrete */
     11,13.5,15.5,18,22.5,26.625,31.3125,36,40,45,54,62,
     72,77.5,87.125,96.875,106.5,

     /* Corrugated Steel (2-2/3 x 1/2 inch Corrugation) */
     13,15,18,20,24,29,33,38,43,47,52,57,

     /* Corrugated Steel (3 x 1 inch Corrugation) */
     31,36,41,46,51,55,59,63,67,71,75,79,83,87,91,  // 2nd value corrected

     /* Structural Plate (6 x 2 inch Corrugation - Bolted Seams
        19-inch Corner Radius */
     55,57,59,61,63,65,67,69,71,73,75,77,79,81,83,85,87,89,91,
     93,95,97,100,101,103,105,107,109,111,113,115,118,119,121,

     /* Structural Plate (6 x 2 inch Corrugation - Bolted Seams
        31-inch Corner Radius */
     112,114,116,118,120,122,124,126,128,130,132,134,
     136,138,140,142,144,146,148,150,152,154,156,158];

var Wmax_Arch =      // NOTE: these are in inches
[
     /* Concrete */
     18,22,26,28.5,36.25,43.75,51.125,58.5,65,73,88,102,
     115,122,138,154,168.75,

     /* Corrugated Steel (2 2/3 x 1/2 inch corrugation) */
     17,21,24,28,35,42,49,57,64,71,77,83,

     /* Corrugated Steel (3 x 1 inch Corrugation) */
     40,46,53,60,66,73,81,87,95,103,112,117,128,137,142,


     /* Structural Plate (6 x 2 inch Corrugation - Bolted Seams
        19-inch Corner Radius */
     73,76,81,84,87, 92,95,98,103,106,112,114,117,123,128,131,137,139,
     142,148,150,152,154,161,167,169,171,178,184,186,188,190,197,199,

     /* Structural Plate (6 x 2 inch Corrugation - Bolted Seams
        31-inch Corner Radius */
     159,162,168,170,173,179,184,187,190,195,198,204,
     206,209,215,217,223,225,231,234,236,239,245,247];

var Afull_Arch =
[    1.1,1.65,2.2,2.8,4.4,6.4,8.8,11.4,14.3,17.7,25.6,34.6,
     44.5,51.7,66,81.8,99.1,1.1,1.6,2.2,2.9,4.5,6.5,8.9,11.6,14.7,18.1,
     21.9,26,7,9.4,12.3,15.6,19.3,23.2,27.4,32.1,37,42.4,48,54.2,60.5,
     67.4,74.5,22,24,26,28,31,33,35,38,40,43,46,49,52,55,58,61,64,67,
     71,74,78,81,85,89,93,97,101,105,109,113,118,122,126,131,97,102,
     105,109,114,118,123,127,132,137,142,146,151,157,161,167,172,177,
     182,188,194,200,205,211];

var Rfull_Arch =
[    0.25,0.3,0.36,0.45,0.56,0.68,0.8,0.9,1.01,1.13,1.35,
     1.57,1.77,1.92,2.17,2.42,2.65,0.324,0.374,0.449,0.499,0.598,0.723,
     0.823,0.947,1.072,1.171,1.296,1.421,0.773,0.773,1.022,1.147,1.271,
     1.371,1.471,1.570,1.670,1.770,1.869,1.969,2.069,2.168,2.268,1.371,
     1.421,1.471,1.520,1.570,1.620,1.670,1.720,1.770,1.820,1.869,1.919,
     1.969,2.019,2.069,2.119,2.168,2.218,2.268,2.318,2.368,2.418,2.493,
     2.517,2.567,2.617,2.667,2.717,2.767,2.817,2.866,2.941,2.966,3.016,
     2.792,2.841,2.891,2.941,2.991,3.041,3.091,3.141,3.190,3.240,3.290,
     3.340,3.390,3.440,3.490,3.539,3.589,3.639,3.689,3.739,3.789,3.838,
     3.888,3.938];

var    N_A_Arch   = 26;
var A_Arch =
[ .0000,.0200,.0600,.1000,.1400,.1900,.2400,.2900,.3400,.3900,
  .4400,.4900,.5400,.5900,.6400,.6900,.7350,.7800,.8200,.8600,
  .8950,.9300,.9600,.9850,.9950,1.000];

var    N_R_Arch   = 26;
var R_Arch =
[ .0100,.0983,.1965,.2948,.3940,.4962,.5911,.6796,.7615,.8364,
  .9044,.9640,1.018,1.065,1.106,1.142,1.170,1.192,1.208,1.217,
  1.220,1.213,1.196,1.168,1.112,1.000];

var    N_W_Arch   = 26;
var W_Arch =
[ .0,.6272,.8521,.9243,.9645,.9846,.9964,.9988,.9917,.9811,
  .9680,.9515,.9314,.9101,.8864,.8592,.8284,.7917,.7527,.7065,
  .6544,.5953,.5231,.4355,.3195,.0];

////////////////////////////////////////////////

var  RECT_ALFMAX        = 0.97
var  RECT_TRIANG_ALFMAX = 0.98
var  RECT_ROUND_ALFMAX  = 0.98


//-----------------------------------------------------------------------------
// Constants
//-----------------------------------------------------------------------------
// Ratio of area at max. flow to full area
// (= 1.0 for open shapes, < 1.0 for closed shapes)
var  Amax = [
                     1.0,     //  DUMMY
                     0.9756,  //  CIRCULAR
                     0.9756,  //  FILLED_CIRCULAR
                     0.97,    //  RECT_CLOSED
                     1.0,     //  RECT_OPEN
                     1.0,     //  TRAPEZOIDAL
                     1.0,     //  TRIANGULAR
                     1.0,     //  PARABOLIC
                     1.0,     //  POWERFUNC
                     0.98,    //  RECT_TRIANG
                     0.98,    //  RECT_ROUND
                     0.96,    //  MOD_BASKET
                     0.96,    //  HORIZ_ELLIPSE
                     0.96,    //  VERT_ELLIPSE
                     0.92,    //  ARCH
                     0.96,    //  EGGSHAPED
                     0.96,    //  HORSESHOE
                     0.96,    //  GOTHIC
                     0.98,    //  CATENARY
                     0.98,    //  SEMIELLIPTICAL
                     0.96,    //  BASKETHANDLE
                     0.96,    //  SEMICIRCULAR
                     1.0,     //  IRREGULAR
                     0.96,    //  CUSTOM
                     0.9756]; //  FORCE_MAIN

//-----------------------------------------------------------------------------
//  Shared variables
//-----------------------------------------------------------------------------
class TXsectStar
{
    constructor(){
        this.s;                // section factor
        this.qc;               // critical flow
        this.xsect ;   // TXsect*          // pointer to a cross section object
    }
} ;

//-----------------------------------------------------------------------------
//  External functions (declared in funcs.h)
//-----------------------------------------------------------------------------
//  xsect_isOpen
//  xsect_setParams
//  xsect_setIrregXsectParams
//  xsect_setCustomXsectParams
//  xsect_getAmax
//  xsect_getSofA
//  xsect_getYofA
//  xsect_getRofA
//  xsect_getAofS
//  xsect_getdSdA
//  xsect_getAofY
//  xsect_getRofY
//  xsect_getWofY
//  xsect_getYcrit


//=============================================================================
// int type
function xsect_isOpen(type)
//
//  Input:   type = type of xsection shape
//  Output:  returns 1 if xsection is open, 0 if not
//  Purpose: determines if a xsection type is open or closed.
//
{
    return ((Amax[type] >= 1.0) ? 1 : 0);
}

//=============================================================================
// TXsect *xsect, int type, double p[], double ucf
function xsect_setParams(xsect, type, p, ucf)
//
//  Input:   xsect = ptr. to a cross section data structure
//           type = xsection shape type
//           p[] = vector or xsection parameters
//           ucf = units correction factor
//  Output:  returns TRUE if successful, FALSE if not
//  Purpose: assigns parameters to a cross section's data structure.
//
{
    let    index;
    let aMax, theta;

    if ( type != DUMMY && p[0] <= 0.0 ) return FALSE;
    xsect.type  = type;
    switch ( xsect.type )
    {
    case DUMMY:
        xsect.yFull = TINY;
        xsect.wMax  = TINY;
        xsect.aFull = TINY;
        xsect.rFull = TINY;
        xsect.sFull = TINY;
        xsect.sMax  = TINY;
        break;

    case CIRCULAR:
        xsect.yFull = p[0]/ucf;
        xsect.wMax  = xsect.yFull;
        xsect.aFull = PI / 4.0 * xsect.yFull * xsect.yFull;
        xsect.rFull = 0.2500 * xsect.yFull;
        xsect.sFull = xsect.aFull * Math.pow(xsect.rFull, 2./3.);
        xsect.sMax  = 1.08 * xsect.sFull;
        xsect.ywMax = 0.5 * xsect.yFull;
        break;

    case FORCE_MAIN:
        xsect.yFull = p[0]/ucf;
        xsect.wMax  = xsect.yFull;
        xsect.aFull = PI / 4.0 * xsect.yFull * xsect.yFull;
        xsect.rFull = 0.2500 * xsect.yFull;
        xsect.sFull = xsect.aFull * Math.pow(xsect.rFull, 0.63);
        xsect.sMax  = 1.06949 * xsect.sFull;
        xsect.ywMax = 0.5 * xsect.yFull;

        // --- save C-factor or roughness in rBot position
        xsect.rBot  = p[1];
        break;

    case FILLED_CIRCULAR:
        if ( p[1] >= p[0] ) return FALSE;

        // --- initially compute full values for unfilled pipe
        xsect.yFull = p[0]/ucf;
        xsect.wMax  = xsect.yFull;
        xsect.aFull = PI / 4.0 * xsect.yFull * xsect.yFull;
        xsect.rFull = 0.2500 * xsect.yFull;

        // --- find:
        //     yBot = depth of filled bottom
        //     aBot = area of filled bottom
        //     sBot = width of filled bottom
        //     rBot = wetted perimeter of filled bottom
        xsect.yBot  = p[1]/ucf;
        xsect.aBot  = circ_getAofY(xsect, xsect.yBot);
        xsect.sBot  = xsect_getWofY(xsect, xsect.yBot);
        xsect.rBot  = xsect.aBot / (xsect.rFull *
                       lookup(xsect.yBot/xsect.yFull, R_Circ, N_R_Circ));

        // --- revise full values for filled bottom
        xsect.aFull -= xsect.aBot;
        xsect.rFull = xsect.aFull /
                       (PI*xsect.yFull - xsect.rBot + xsect.sBot);
        xsect.sFull = xsect.aFull * Math.pow(xsect.rFull, 2./3.);
        xsect.sMax  = 1.08 * xsect.sFull;
        xsect.yFull -= xsect.yBot;
        xsect.ywMax = 0.5 * xsect.yFull;
        break;

    case EGGSHAPED:
        xsect.yFull = p[0]/ucf;
        xsect.aFull = 0.5105 * xsect.yFull * xsect.yFull;
        xsect.rFull = 0.1931 * xsect.yFull;
        xsect.sFull = xsect.aFull * Math.pow(xsect.rFull, 2./3.);
        xsect.sMax  = 1.065 * xsect.sFull;
        xsect.wMax  = 2./3. * xsect.yFull;
        xsect.ywMax = 0.64 * xsect.yFull;
        break;

    case HORSESHOE:
        xsect.yFull = p[0]/ucf;
        xsect.aFull = 0.8293 * xsect.yFull * xsect.yFull;
        xsect.rFull = 0.2538 * xsect.yFull;
        xsect.sFull = xsect.aFull * Math.pow(xsect.rFull, 2./3.);
        xsect.sMax  = 1.077 * xsect.sFull;
        xsect.wMax  = 1.0 * xsect.yFull;
        xsect.ywMax = 0.5 * xsect.yFull;
        break;

    case GOTHIC:
        xsect.yFull = p[0]/ucf;
        xsect.aFull = 0.6554 * xsect.yFull * xsect.yFull;
        xsect.rFull = 0.2269 * xsect.yFull;
        xsect.sFull = xsect.aFull * Math.pow(xsect.rFull, 2./3.);
        xsect.sMax  = 1.065 * xsect.sFull;
        xsect.wMax  = 0.84 * xsect.yFull;
        xsect.ywMax = 0.45 * xsect.yFull;
        break;

    case CATENARY:
        xsect.yFull = p[0]/ucf;
        xsect.aFull = 0.70277 * xsect.yFull * xsect.yFull;
        xsect.rFull = 0.23172 * xsect.yFull;
        xsect.sFull = xsect.aFull * Math.pow(xsect.rFull, 2./3.);
        xsect.sMax  = 1.05 * xsect.sFull;
        xsect.wMax  = 0.9 * xsect.yFull;
        xsect.ywMax = 0.25 * xsect.yFull;
        break;

    case SEMIELLIPTICAL:
        xsect.yFull = p[0]/ucf;
        xsect.aFull = 0.785 * xsect.yFull * xsect.yFull;
        xsect.rFull = 0.242 * xsect.yFull;
        xsect.sFull = xsect.aFull * Math.pow(xsect.rFull, 2./3.);
        xsect.sMax  = 1.045 * xsect.sFull;
        xsect.wMax  = 1.0 * xsect.yFull;
        xsect.ywMax = 0.15 * xsect.yFull;
        break;

    case BASKETHANDLE:
        xsect.yFull = p[0]/ucf;
        xsect.aFull = 0.7862 * xsect.yFull * xsect.yFull;
        xsect.rFull = 0.2464 * xsect.yFull;
        xsect.sFull = xsect.aFull * Math.pow(xsect.rFull, 2./3.);
        xsect.sMax  = 1.06078 * xsect.sFull;
        xsect.wMax  = 0.944 * xsect.yFull;
        xsect.ywMax = 0.2 * xsect.yFull;
        break;

    case SEMICIRCULAR:
        xsect.yFull = p[0]/ucf;
        xsect.aFull = 1.2697 * xsect.yFull * xsect.yFull;
        xsect.rFull = 0.2946 * xsect.yFull;
        xsect.sFull = xsect.aFull * Math.pow(xsect.rFull, 2./3.);
        xsect.sMax  = 1.06637 * xsect.sFull;
        xsect.wMax  = 1.64 * xsect.yFull;
        xsect.ywMax = 0.15 * xsect.yFull;
        break;

    case RECT_CLOSED:
        if ( p[1] <= 0.0 ) return FALSE;
        xsect.yFull = p[0]/ucf;
        xsect.wMax  = p[1]/ucf;
        xsect.aFull = xsect.yFull * xsect.wMax;
        xsect.rFull = xsect.aFull / (2.0 * (xsect.yFull + xsect.wMax));
        xsect.sFull = xsect.aFull * Math.pow(xsect.rFull, 2./3.);
        aMax = RECT_ALFMAX * xsect.aFull;
        xsect.sMax = aMax * Math.pow(rect_closed_getRofA(xsect, aMax), 2./3.);
        xsect.ywMax = xsect.yFull;
        break;

    case RECT_OPEN:
        if ( p[1] <= 0.0 ) return FALSE;
        xsect.yFull = p[0]/ucf;
        xsect.wMax  = p[1]/ucf;
        if (p[2] < 0.0 || p[2] > 2.0) return FALSE;   //# sides to ignore
        xsect.sBot = p[2];
        xsect.aFull = xsect.yFull * xsect.wMax;
        xsect.rFull = xsect.aFull / ((2.0 - xsect.sBot) *
                       xsect.yFull + xsect.wMax);
        xsect.sFull = xsect.aFull * Math.pow(xsect.rFull, 2./3.);
        xsect.sMax  = xsect.sFull;
        xsect.ywMax = xsect.yFull;
        break;

    case RECT_TRIANG:
        if ( p[1] <= 0.0 || p[2] <= 0.0 ) return FALSE;
        xsect.yFull = p[0]/ucf;
        xsect.wMax  = p[1]/ucf;
        xsect.yBot  = p[2]/ucf;
        xsect.ywMax = xsect.yFull;

        // --- area of bottom triangle
        xsect.aBot  = xsect.yBot * xsect.wMax / 2.0;

        // --- slope of bottom side wall
        xsect.sBot  = xsect.wMax / xsect.yBot / 2.0;

        // --- length of side wall per unit of depth
        xsect.rBot  = Math.sqrt( 1. + xsect.sBot * xsect.sBot );

        xsect.aFull = xsect.wMax * (xsect.yFull - xsect.yBot / 2.0);
        xsect.rFull = xsect.aFull / (2.0 * xsect.yBot * xsect.rBot + 2.0 *
                        (xsect.yFull - xsect.yBot) + xsect.wMax);
        xsect.sFull = xsect.aFull * Math.pow(xsect.rFull, 2./3.);
        aMax = RECT_TRIANG_ALFMAX * xsect.aFull;
        xsect.sMax  = aMax * Math.pow(rect_triang_getRofA(xsect, aMax), 2./3.);
        break;

    case RECT_ROUND:
        if ( p[1] <= 0.0 ) return FALSE;
        if ( p[2] < p[1]/2.0 ) p[2] = p[1]/2.0;
        xsect.yFull = p[0]/ucf;
        xsect.wMax  = p[1]/ucf;
        xsect.rBot  = p[2]/ucf;

        // --- angle of circular arc
        theta = 2.0 * Math.asin(xsect.wMax / 2.0 / xsect.rBot);

        // --- area of circular bottom
        xsect.aBot  = xsect.rBot * xsect.rBot /
                       2.0 * (theta - Math.sin(theta));

        // --- section factor for circular bottom
        xsect.sBot  = Math.PI * xsect.rBot * xsect.rBot *
                    Math.pow(xsect.rBot/2.0, 2./3.);

        // --- depth of circular bottom
        xsect.yBot  = xsect.rBot * (1.0 - Math.cos(theta/2.0));
        xsect.ywMax = xsect.yFull;

        xsect.aFull = xsect.wMax * (xsect.yFull - xsect.yBot) + xsect.aBot;
        xsect.rFull = xsect.aFull / (xsect.rBot * theta + 2.0 *
                        (xsect.yFull - xsect.yBot) + xsect.wMax);
        xsect.sFull = xsect.aFull * Math.pow(xsect.rFull, 2./3.);
        aMax = RECT_ROUND_ALFMAX * xsect.aFull;
        xsect.sMax = aMax * Math.pow(rect_round_getRofA(xsect, aMax), 2./3.);
        break;

    case MOD_BASKET:
        if ( p[1] <= 0.0 ) return FALSE;
        if ( p[2] < p[1]/2.0 ) p[2] = p[1]/2.0;
        xsect.yFull = p[0]/ucf;
        xsect.wMax  = p[1]/ucf;

        // --- radius of circular arc
        xsect.rBot = p[2]/ucf;

        // --- angle of circular arc
        theta = 2.0 * Math.asin(xsect.wMax / 2.0 / xsect.rBot);
        xsect.sBot = theta;

        // --- height of circular arc
        xsect.yBot = xsect.rBot * (1.0 - Math.cos(theta/2.0));
        xsect.ywMax = xsect.yFull - xsect.yBot;

        // --- area of circular arc
        xsect.aBot = xsect.rBot * xsect.rBot /
                      2.0 * (theta - Math.sin(theta));

        // --- full area
        xsect.aFull = (xsect.yFull - xsect.yBot) * xsect.wMax +
                       xsect.aBot;

        // --- full hydraulic radius & section factor
        xsect.rFull = xsect.aFull / (xsect.rBot * theta + 2.0 *
                        (xsect.yFull - xsect.yBot) + xsect.wMax);
        xsect.sFull = xsect.aFull * Math.pow(xsect.rFull, 2./3.);

        // --- area corresponding to max. section factor
        xsect.sMax = xsect_getSofA(xsect, Amax[MOD_BASKET]*xsect.aFull);
        break;

    case TRAPEZOIDAL:
        if ( p[1] < 0.0 || p[2] < 0.0 || p[3] < 0.0 ) return FALSE;
        xsect.yFull = p[0]/ucf;
        xsect.ywMax = xsect.yFull;

        // --- bottom width
        xsect.yBot = p[1]/ucf;

        // --- avg. slope of side walls
        xsect.sBot  = ( p[2] + p[3] )/2.0;
        if ( xsect.yBot == 0.0 && xsect.sBot == 0.0 ) return FALSE;

        // --- length of side walls per unit of depth
        xsect.rBot  = Math.sqrt( 1.0 + p[2]*p[2] ) + Math.sqrt( 1.0 + p[3]*p[3] );

        // --- top width
        xsect.wMax = xsect.yBot + xsect.yFull * (p[2] + p[3]);

        xsect.aFull = ( xsect.yBot + xsect.sBot * xsect.yFull ) * xsect.yFull;
        xsect.rFull = xsect.aFull / (xsect.yBot + xsect.yFull * xsect.rBot);
        xsect.sFull = xsect.aFull * Math.pow(xsect.rFull, 2./3.);
        xsect.sMax  = xsect.sFull;
        break;

    case TRIANGULAR:
        if ( p[1] <= 0.0 ) return FALSE;
        xsect.yFull = p[0]/ucf;
		xsect.wMax  = p[1]/ucf;
        xsect.ywMax = xsect.yFull;

        // --- slope of side walls
        xsect.sBot  = xsect.wMax / xsect.yFull / 2.;

        // --- length of side wall per unit of depth
        xsect.rBot  = Math.sqrt( 1. + xsect.sBot * xsect.sBot );

        xsect.aFull = xsect.yFull * xsect.yFull * xsect.sBot;
        xsect.rFull = xsect.aFull / (2.0 * xsect.yFull * xsect.rBot);
        xsect.sFull = xsect.aFull * Math.pow(xsect.rFull, 2./3.);
        xsect.sMax  = xsect.sFull;
        break;

    case PARABOLIC:
        if ( p[1] <= 0.0 ) return FALSE;
        xsect.yFull = p[0]/ucf;
        xsect.wMax  = p[1]/ucf;
        xsect.ywMax = xsect.yFull;

        // --- rBot :: 1/c^.5, where y = c*x^2 is eqn. of parabolic shape
        xsect.rBot  = xsect.wMax / 2.0 / Math.sqrt(xsect.yFull);

        xsect.aFull = (2./3.) * xsect.yFull * xsect.wMax;
        xsect.rFull = xsect_getRofY(xsect, xsect.yFull);
        xsect.sFull = xsect.aFull * Math.pow(xsect.rFull, 2./3.);
        xsect.sMax  = xsect.sFull;
        break;

    case POWERFUNC:
        if ( p[1] <= 0.0 || p[2] <= 0.0 ) return FALSE;
        xsect.yFull = p[0]/ucf;
        xsect.wMax  = p[1]/ucf;
        xsect.ywMax = xsect.yFull;
        xsect.sBot  = 1.0 / p[2];
        xsect.rBot  = xsect.wMax / (xsect.sBot + 1) /
                        Math.pow(xsect.yFull, xsect.sBot);
        xsect.aFull = xsect.yFull * xsect.wMax / (xsect.sBot+1);
        xsect.rFull = xsect_getRofY(xsect, xsect.yFull);
        xsect.sFull = xsect.aFull * Math.pow(xsect.rFull, 2./3.);
        xsect.sMax  = xsect.sFull;
        break;

    case HORIZ_ELLIPSE:
        if ( p[1] == 0.0 ) p[2] = p[0];
        if ( p[2] > 0.0 )                        // std. ellipse pipe
        {
            index = floor(p[2]) - 1;        // size code
            if ( index < 0 ||
                 index >= NumCodesEllipse ) return FALSE;
            xsect.yFull = MinorAxis_Ellipse[index]/12.;
            xsect.wMax  = MajorAxis_Ellipse[index]/12.;
            xsect.aFull = Afull_Ellipse[index];
            xsect.rFull = Rfull_Ellipse[index];
        }
        else
        {
            // --- length of minor axis
            xsect.yFull = p[0]/ucf;

            // --- length of major axis
            if ( p[1] < 0.0 ) return FALSE;
            xsect.wMax = p[1]/ucf;
            xsect.aFull = 1.2692 * xsect.yFull * xsect.yFull;
            xsect.rFull = 0.3061 * xsect.yFull;
        }
        xsect.sFull = xsect.aFull * Math.pow(xsect.rFull, 2./3.);
        xsect.sMax  = xsect.sFull;
        xsect.ywMax = 0.48 * xsect.yFull;
        break;

    case VERT_ELLIPSE:
        if ( p[1] == 0.0 ) p[2] = p[0];
        if ( p[2] > 0.0 )                        // std. ellipse pipe
        {
            index = floor(p[2]) - 1;        // size code
            if ( index < 0 ||
                 index >= NumCodesEllipse ) return FALSE;
            xsect.yFull = MajorAxis_Ellipse[index]/12.;
            xsect.wMax  = MinorAxis_Ellipse[index]/12.;
            xsect.aFull = Afull_Ellipse[index];
            xsect.rFull = Rfull_Ellipse[index];
        }
        else
        {
            // --- length of major axis
            if ( p[1] < 0.0 ) return FALSE;

            // --- length of minor axis
            xsect.yFull = p[0]/ucf;
            xsect.wMax = p[1]/ucf;
            xsect.aFull = 1.2692 * xsect.wMax * xsect.wMax;
            xsect.rFull = 0.3061 * xsect.wMax;
        }
        xsect.sFull = xsect.aFull * Math.pow(xsect.rFull, 2./3.);
        xsect.sMax  = xsect.sFull;
        xsect.ywMax = 0.48 * xsect.yFull;
        break;

    case ARCH:
        if ( p[1] == 0.0 ) p[2] = p[0];
        if ( p[2] > 0.0 )                        // std. arch pipe
        {
            index = floor(p[2]) - 1;        // size code
            if ( index < 0 ||
                 index >= NumCodesArch ) return FALSE;
            xsect.yFull = Yfull_Arch[index]/12.;     // Yfull units are inches
            xsect.wMax  = Wmax_Arch[index]/12.;      // Wmax units are inches
            xsect.aFull = Afull_Arch[index];
            xsect.rFull = Rfull_Arch[index];
        }
        else                                     // non-std. arch pipe
        {
            if ( p[1] < 0.0 ) return FALSE;
            xsect.yFull = p[0]/ucf;
            xsect.wMax  = p[1]/ucf;
            xsect.aFull = 0.7879 * xsect.yFull * xsect.wMax;
            xsect.rFull = 0.2991 * xsect.yFull;
        }
        xsect.sFull = xsect.aFull * Math.pow(xsect.rFull, 2./3.);
        xsect.sMax  = xsect.sFull;
        xsect.ywMax = 0.28 * xsect.yFull;
        break;
    }
    return TRUE;
}

//=============================================================================
// TXsect *xsect
function xsect_setIrregXsectParams(xsect)
//
//  Input:   xsect = ptr. to a cross section data structure
//  Output:  none
//  Purpose: assigns transect parameters to an irregular shaped cross section.
//
{
    let index = xsect.transect;
    let     i, iMax;
    let  wMax;
    let wTbl = Transect[index].widthTbl;

    xsect.yFull = Transect[index].yFull;
    xsect.wMax  = Transect[index].wMax;
    xsect.aFull = Transect[index].aFull;
    xsect.rFull = Transect[index].rFull;
    xsect.sFull = xsect.aFull * Math.pow(xsect.rFull, 2./3.);
    xsect.sMax = Transect[index].sMax;
    xsect.aBot = Transect[index].aMax;

    // Search transect's width table up to point where width decreases
    iMax = 0;
    wMax = wTbl[0];
    for (i = 1; i < N_TRANSECT_TBL; i++)
    {
	if ( wTbl[i] < wMax ) break;
	wMax = wTbl[i];
	iMax = i;
    }

    // Determine height at lowest widest point
    xsect.ywMax = xsect.yFull * iMax / (N_TRANSECT_TBL-1);
}

//=============================================================================
// TXsect *xsect
function xsect_setCustomXsectParams(xsect)
//
//  Input:   xsect = ptr. to a cross section data structure
//  Output:  none
//  Purpose: assigns parameters to a custom-shaped cross section.
//
{
    let index = Curve[xsect.transect].refersTo;
    let yFull = xsect.yFull;
    let i, iMax;
    let wMax;
    let wTbl = Shape[index].widthTbl;

    xsect.wMax  = Shape[index].wMax * yFull;
    xsect.aFull = Shape[index].aFull * yFull * yFull;
    xsect.rFull = Shape[index].rFull * yFull;
    xsect.sFull = xsect.aFull * Math.pow(xsect.rFull, 2./3.);
    xsect.sMax  = Shape[index].sMax * yFull * yFull * Math.pow(yFull, 2./3.);
    xsect.aBot  = Shape[index].aMax * yFull * yFull;

    // Search shape's width table up to point where width decreases
    iMax = 0;
    wMax = wTbl[0];
    for (i = 1; i < N_SHAPE_TBL; i++)
    {
	if ( wTbl[i] < wMax ) break;
	wMax = wTbl[i];
	iMax = i;
    }

    // Determine height at lowest widest point
    xsect.ywMax = yFull * iMax / (N_SHAPE_TBL-1);
}

//=============================================================================
// TXsect* xsect
function xsect_getAmax(xsect)
//
//  Input:   xsect = ptr. to a cross section data structure
//  Output:  returns area (ft2)
//  Purpose: finds xsection area at maximum flow depth.
//
{
    if ( xsect.type == IRREGULAR ) return xsect.aBot;
    else if ( xsect.type == CUSTOM ) return xsect.aBot;
    else return Amax[xsect.type] * xsect.aFull;
}

//=============================================================================
// TXsect *xsect, double a
function xsect_getSofA(xsect, a)
//
//  Input:   xsect = ptr. to a cross section data structure
//           a = area (ft2)
//  Output:  returns section factor (ft^(8/3))
//  Purpose: computes xsection's section factor at a given area.
//
{
    let alpha = a / xsect.aFull;
    let r;
    switch ( xsect.type )
    {
      case FORCE_MAIN:
      case CIRCULAR:
        return circ_getSofA(xsect, a);

      case EGGSHAPED:
        return xsect.sFull * lookup(alpha, S_Egg, N_S_Egg);

      case HORSESHOE:
        return xsect.sFull * lookup(alpha, S_Horseshoe, N_S_Horseshoe);

      case GOTHIC:
        return xsect.sFull * lookup(alpha, S_Gothic, N_S_Gothic);

      case CATENARY:
        return xsect.sFull * lookup(alpha, S_Catenary, N_S_Catenary);

      case SEMIELLIPTICAL:
        return xsect.sFull * lookup(alpha, S_SemiEllip, N_S_SemiEllip);

      case BASKETHANDLE:
        return xsect.sFull * lookup(alpha, S_BasketHandle, N_S_BasketHandle);

      case SEMICIRCULAR:
        return xsect.sFull * lookup(alpha, S_SemiCirc, N_S_SemiCirc);

      case RECT_CLOSED:
        return rect_closed_getSofA(xsect, a);

      case RECT_OPEN:
        return rect_open_getSofA(xsect, a);

      case RECT_TRIANG:
        return rect_triang_getSofA(xsect, a);

      case RECT_ROUND:
        return rect_round_getSofA(xsect, a);

      default:
        if (a == 0.0) return 0.0;
        r = xsect_getRofA(xsect, a);
        if ( r < TINY ) return 0.0;
        return a * Math.pow(r, 2./3.);
    }
}

//=============================================================================
// TXsect *xsect, double a
function xsect_getYofA(xsect, a)
//
//  Input:   xsect = ptr. to a cross section data structure
//           a = area (ft2)
//  Output:  returns depth (ft)
//  Purpose: computes xsection's depth at a given area.
//
{
    let alpha = a / xsect.aFull;
    switch ( xsect.type )
    {
      case FORCE_MAIN:
      case CIRCULAR: return circ_getYofA(xsect, a);

      case FILLED_CIRCULAR:
        return filled_circ_getYofA(xsect, a);

      case EGGSHAPED:
        return xsect.yFull * lookup(alpha, Y_Egg, N_Y_Egg);

      case HORSESHOE:
        return xsect.yFull * lookup(alpha, Y_Horseshoe, N_Y_Horseshoe);

      case GOTHIC:
        return xsect.yFull * lookup(alpha, Y_Gothic, N_Y_Gothic);

      case CATENARY:
        return xsect.yFull * lookup(alpha, Y_Catenary, N_Y_Catenary);

      case SEMIELLIPTICAL:
        return xsect.yFull * lookup(alpha, Y_SemiEllip, N_Y_SemiEllip);

      case BASKETHANDLE:
        return xsect.yFull * lookup(alpha, Y_BasketHandle, N_Y_BasketHandle);

      case SEMICIRCULAR:
        return xsect.yFull * lookup(alpha, Y_SemiCirc, N_Y_SemiCirc);

      case HORIZ_ELLIPSE:
        return xsect.yFull * invLookup(alpha, A_HorizEllipse, N_A_HorizEllipse);

      case VERT_ELLIPSE:
        return xsect.yFull * invLookup(alpha, A_VertEllipse, N_A_VertEllipse);

      case IRREGULAR:
        return xsect.yFull * invLookup(alpha,
            Transect[xsect.transect].areaTbl, N_TRANSECT_TBL);

      case CUSTOM:
        return xsect.yFull * invLookup(alpha,
            Shape[Curve[xsect.transect].refersTo].areaTbl, N_SHAPE_TBL);

      case ARCH:
        return xsect.yFull * invLookup(alpha, A_Arch, N_A_Arch);

      case RECT_CLOSED: return a / xsect.wMax;

      case RECT_TRIANG: return rect_triang_getYofA(xsect, a);

      case RECT_ROUND:  return rect_round_getYofA(xsect, a);

      case RECT_OPEN:   return a / xsect.wMax;

      case MOD_BASKET:  return mod_basket_getYofA(xsect, a);

      case TRAPEZOIDAL: return trapez_getYofA(xsect, a);

      case TRIANGULAR:  return triang_getYofA(xsect, a);

      case PARABOLIC:   return parab_getYofA(xsect, a);

      case POWERFUNC:   return powerfunc_getYofA(xsect, a);

      default:          return 0.0;
    }
}

//=============================================================================
// TXsect *xsect, double y
function xsect_getAofY(xsect,  y)
//
//  Input:   xsect = ptr. to a cross section data structure
//           y = depth (ft)
//  Output:  returns area (ft2)
//  Purpose: computes xsection's area at a given depth.
//
{
    let yNorm = y / xsect.yFull;
    if ( y <= 0.0 ) return 0.0;
    switch ( xsect.type )
    {
      case FORCE_MAIN:
      case CIRCULAR:
        return xsect.aFull * lookup(yNorm, A_Circ, N_A_Circ);

      case FILLED_CIRCULAR:
        return filled_circ_getAofY(xsect, y);

      case EGGSHAPED:
        return xsect.aFull * lookup(yNorm, A_Egg, N_A_Egg);

      case HORSESHOE:
        return xsect.aFull * lookup(yNorm, A_Horseshoe, N_A_Horseshoe);

      case GOTHIC:
        return xsect.aFull * invLookup(yNorm, Y_Gothic, N_Y_Gothic);

      case CATENARY:
        return xsect.aFull * invLookup(yNorm, Y_Catenary, N_Y_Catenary);

      case SEMIELLIPTICAL:
        return xsect.aFull * invLookup(yNorm, Y_SemiEllip, N_Y_SemiEllip);

      case BASKETHANDLE:
        return xsect.aFull * lookup(yNorm, A_Baskethandle, N_A_Baskethandle);

      case SEMICIRCULAR:
        return xsect.aFull * invLookup(yNorm, Y_SemiCirc, N_Y_SemiCirc);

      case HORIZ_ELLIPSE:
        return xsect.aFull * lookup(yNorm, A_HorizEllipse, N_A_HorizEllipse);

      case VERT_ELLIPSE:
        return xsect.aFull * lookup(yNorm, A_VertEllipse, N_A_VertEllipse);

      case ARCH:
        return xsect.aFull * lookup(yNorm, A_Arch, N_A_Arch);

      case IRREGULAR:
        return xsect.aFull * lookup(yNorm,
            Transect[xsect.transect].areaTbl, N_TRANSECT_TBL);

      case CUSTOM:
        return xsect.aFull * lookup(yNorm,
            Shape[Curve[xsect.transect].refersTo].areaTbl, N_SHAPE_TBL);

     case RECT_CLOSED:  return y * xsect.wMax;

      case RECT_TRIANG: return rect_triang_getAofY(xsect, y);

      case RECT_ROUND:  return rect_round_getAofY(xsect, y);

      case RECT_OPEN:   return y * xsect.wMax;

      case MOD_BASKET:  return mod_basket_getAofY(xsect, y);

      case TRAPEZOIDAL: return trapez_getAofY(xsect, y);

      case TRIANGULAR:  return triang_getAofY(xsect, y);

      case PARABOLIC:   return parab_getAofY(xsect, y);

      case POWERFUNC:   return powerfunc_getAofY(xsect, y);

      default:          return 0.0;
    }
}

//=============================================================================
// TXsect *xsect, double y
function xsect_getWofY(xsect, y)
//
//  Input:   xsect = ptr. to a cross section data structure
//           y = depth ft)
//  Output:  returns top width (ft)
//  Purpose: computes xsection's top width at a given depth.
//
{
    let yNorm = y / xsect.yFull;
    switch ( xsect.type )
    {
      case FORCE_MAIN:
      case CIRCULAR:
        return xsect.wMax * lookup(yNorm, W_Circ, N_W_Circ);

      case FILLED_CIRCULAR:
        yNorm = (y + xsect.yBot) / (xsect.yFull + xsect.yBot);
        return xsect.wMax * lookup(yNorm, W_Circ, N_W_Circ);

      case EGGSHAPED:
        return xsect.wMax * lookup(yNorm, W_Egg, N_W_Egg);

      case HORSESHOE:
        return xsect.wMax * lookup(yNorm, W_Horseshoe, N_W_Horseshoe);

      case GOTHIC:
        return xsect.wMax * lookup(yNorm, W_Gothic, N_W_Gothic);

      case CATENARY:
        return xsect.wMax * lookup(yNorm, W_Catenary, N_W_Catenary);

      case SEMIELLIPTICAL:
        return xsect.wMax * lookup(yNorm, W_SemiEllip, N_W_SemiEllip);

      case BASKETHANDLE:
        return xsect.wMax * lookup(yNorm, W_BasketHandle, N_W_BasketHandle);

      case SEMICIRCULAR:
        return xsect.wMax * lookup(yNorm, W_SemiCirc, N_W_SemiCirc);

      case HORIZ_ELLIPSE:
        return xsect.wMax * lookup(yNorm, W_HorizEllipse, N_W_HorizEllipse);

      case VERT_ELLIPSE:
        return xsect.wMax * lookup(yNorm, W_VertEllipse, N_W_VertEllipse);

      case ARCH:
        return xsect.wMax * lookup(yNorm, W_Arch, N_W_Arch);

      case IRREGULAR:
        return xsect.wMax * lookup(yNorm,
            Transect[xsect.transect].widthTbl, N_TRANSECT_TBL);

      case CUSTOM:
        return xsect.wMax * lookup(yNorm,
            Shape[Curve[xsect.transect].refersTo].widthTbl, N_SHAPE_TBL);

      case RECT_CLOSED: 
          if (yNorm == 1.0) return 0.0;                                        //(5.1.013)
          return xsect.wMax;

      case RECT_TRIANG: return rect_triang_getWofY(xsect, y);

      case RECT_ROUND:  return rect_round_getWofY(xsect, y);

      case RECT_OPEN:   return xsect.wMax;

      case MOD_BASKET:  return mod_basket_getWofY(xsect, y);

      case TRAPEZOIDAL: return trapez_getWofY(xsect, y);

      case TRIANGULAR:  return triang_getWofY(xsect, y);

      case PARABOLIC:   return parab_getWofY(xsect, y);

      case POWERFUNC:   return powerfunc_getWofY(xsect, y);

      default:          return 0.0;
    }
}

//=============================================================================
// TXsect *xsect, double y
function xsect_getRofY(xsect, y)
//
//  Input:   xsect = ptr. to a cross section data structure
//           y = depth (ft)
//  Output:  returns hydraulic radius (ft)
//  Purpose: computes xsection's hydraulic radius at a given depth.
//
{
    let yNorm = y / xsect.yFull;
    switch ( xsect.type )
    {
      case FORCE_MAIN:
      case CIRCULAR:
        return xsect.rFull * lookup(yNorm, R_Circ, N_R_Circ);

      case FILLED_CIRCULAR:
        if ( xsect.yBot == 0.0 )
            return xsect.rFull * lookup(yNorm, R_Circ, N_R_Circ);
        return filled_circ_getRofY(xsect, y);

      case EGGSHAPED:
        return xsect.rFull * lookup(yNorm, R_Egg, N_R_Egg);

      case HORSESHOE:
        return xsect.rFull * lookup(yNorm, R_Horseshoe, N_R_Horseshoe);

      case BASKETHANDLE:
        return xsect.rFull * lookup(yNorm, R_Baskethandle, N_R_Baskethandle);

      case HORIZ_ELLIPSE:
        return xsect.rFull * lookup(yNorm, R_HorizEllipse, N_R_HorizEllipse);

      case VERT_ELLIPSE:
        return xsect.rFull * lookup(yNorm, R_VertEllipse, N_R_VertEllipse);

      case ARCH:
        return xsect.rFull * lookup(yNorm, R_Arch, N_R_Arch);

      case IRREGULAR:
        return xsect.rFull * lookup(yNorm,
            Transect[xsect.transect].hradTbl, N_TRANSECT_TBL);

      case CUSTOM:
        return xsect.rFull * lookup(yNorm,
            Shape[Curve[xsect.transect].refersTo].hradTbl, N_SHAPE_TBL);

      case RECT_TRIANG:  return rect_triang_getRofY(xsect, y);

      case RECT_ROUND:   return rect_round_getRofY(xsect, y);

      case TRAPEZOIDAL:  return trapez_getRofY(xsect, y);

      case TRIANGULAR:   return triang_getRofY(xsect, y);

      case PARABOLIC:    return parab_getRofY(xsect, y);

      case POWERFUNC:    return powerfunc_getRofY(xsect, y);

      default:           return xsect_getRofA( xsect, xsect_getAofY(xsect, y) );
    }
}

//=============================================================================
// TXsect *xsect, double a
function xsect_getRofA(xsect, a)
//
//  Input:   xsect = ptr. to a cross section data structure
//           a = area (ft2)
//  Output:  returns hydraulic radius (ft)
//  Purpose: computes xsection's hydraulic radius at a given area.
//
{
    let cathy;
    if ( a <= 0.0 ) return 0.0;
    switch ( xsect.type )
    {
      case HORIZ_ELLIPSE:
      case VERT_ELLIPSE:
      case ARCH:
      case IRREGULAR:
      case FILLED_CIRCULAR:
      case CUSTOM:
        return xsect_getRofY( xsect, xsect_getYofA(xsect, a) );

      case RECT_CLOSED:  return rect_closed_getRofA(xsect, a);

      case RECT_OPEN:    return a / (xsect.wMax +
                             (2. - xsect.sBot) * a / xsect.wMax);

      case RECT_TRIANG:  return rect_triang_getRofA(xsect, a);

      case RECT_ROUND:   return rect_round_getRofA(xsect, a);

      case MOD_BASKET:   return mod_basket_getRofA(xsect, a);

      case TRAPEZOIDAL:  return trapez_getRofA(xsect, a);

      case TRIANGULAR:   return triang_getRofA(xsect, a);

      case PARABOLIC:    return parab_getRofA(xsect, a);

      case POWERFUNC:    return powerfunc_getRofA(xsect, a);

      default:
        cathy = xsect_getSofA(xsect, a);
        if ( cathy < TINY || a < TINY ) return 0.0;
        return Math.pow(cathy/a, 3./2.);
    }
}

//=============================================================================
// TXsect* xsect, double s
function xsect_getAofS(xsect, s)
//
//  Input:   xsect = ptr. to a cross section data structure
//           s = section factor (ft^(8/3))
//  Output:  returns area (ft2)
//  Purpose: computes xsection's area at a given section factor.
//
{
    let psi = s / xsect.sFull;
    if ( s <= 0.0 ) return 0.0;
    if ( s > xsect.sMax ) s = xsect.sMax;
    switch ( xsect.type )
    {
      case DUMMY:     return 0.0;

      case FORCE_MAIN:
      case CIRCULAR:  return circ_getAofS(xsect, s);

      case EGGSHAPED:
        return xsect.aFull * invLookup(psi, S_Egg, N_S_Egg);

      case HORSESHOE:
        return xsect.aFull * invLookup(psi, S_Horseshoe, N_S_Horseshoe);

      case GOTHIC:
        return xsect.aFull * invLookup(psi, S_Gothic, N_S_Gothic);

      case CATENARY:
        return xsect.aFull * invLookup(psi, S_Catenary, N_S_Catenary);

      case SEMIELLIPTICAL:
        return xsect.aFull * invLookup(psi, S_SemiEllip, N_S_SemiEllip);

      case BASKETHANDLE:
        return xsect.aFull * invLookup(psi, S_BasketHandle, N_S_BasketHandle);

      case SEMICIRCULAR:
        return xsect.aFull * invLookup(psi, S_SemiCirc, N_S_SemiCirc);

      default: return generic_getAofS(xsect, s);
    }
}

//=============================================================================
// TXsect* xsect, double a
function xsect_getdSdA(xsect, a)
//
//  Input:   xsect = ptr. to a cross section data structure
//           a = area (ft2)
//  Output:  returns derivative of section factor w.r.t. area (ft^2/3)
//  Purpose: computes xsection's derivative of its section factor with
//           respect to area at a given area.
//
{
    switch ( xsect.type )
    {
      case FORCE_MAIN:
      case CIRCULAR:
        return circ_getdSdA(xsect, a);

      case EGGSHAPED:
        return tabular_getdSdA(xsect, a, S_Egg, N_S_Egg);

      case HORSESHOE:
        return tabular_getdSdA(xsect, a, S_Horseshoe, N_S_Horseshoe);

      case GOTHIC:
        return tabular_getdSdA(xsect, a, S_Gothic, N_S_Gothic);

      case CATENARY:
        return tabular_getdSdA(xsect, a, S_Catenary, N_S_Catenary);

      case SEMIELLIPTICAL:
        return  tabular_getdSdA(xsect, a, S_SemiEllip, N_S_SemiEllip);

      case BASKETHANDLE:
        return  tabular_getdSdA(xsect, a, S_BasketHandle, N_S_BasketHandle);

      case SEMICIRCULAR:
        return  tabular_getdSdA(xsect, a, S_SemiCirc, N_S_SemiCirc);

      case RECT_CLOSED:
        return rect_closed_getdSdA(xsect, a);

      case RECT_OPEN:
        return rect_open_getdSdA(xsect, a);

      case RECT_TRIANG:
	return rect_triang_getdSdA(xsect, a);

      case RECT_ROUND:
	return rect_round_getdSdA(xsect, a);

      case MOD_BASKET:
	return mod_basket_getdSdA(xsect, a);

      case TRAPEZOIDAL:
	return trapez_getdSdA(xsect, a);

      case TRIANGULAR:
	return triang_getdSdA(xsect, a);

      default: return generic_getdSdA(xsect, a);
    }
}

//=============================================================================
// TXsect* xsect, double q
function xsect_getYcrit(xsect, q)
//
//  Input:   xsect = ptr. to a cross section data structure
//           q = flow rate (cfs)
//  Output:  returns critical depth (ft)
//  Purpose: computes critical depth at a specific flow rate.
//
{
    let q2g = Math.sqrt(q) / GRAVITY;
    let y, r;

    if ( q2g == 0.0 ) return 0.0;
    switch ( xsect.type )
    {
      case DUMMY:
        return 0.0;

      case RECT_OPEN:
      case RECT_CLOSED:
        // --- analytical expression for yCritical is
        //     y = (q2g / w^2)^(1/3) where w = width
        y = Math.pow(q2g / Math.pow(xsect.wMax, 2), 1./3.);
        break;

      case TRIANGULAR:
        // --- analytical expression for yCritical is
        //     y = (2 * q2g / s^2)^(1/5) where s = side slope
        y = Math.pow(2.0 * q2g / Math.pow(xsect.sBot, 2), 1./5.);
        break;

      case PARABOLIC:
        // --- analytical expression for yCritical is
        //     y = (27/32 * q2g * c)^(1/4) where y = c*x^2
        //     is eqn. for parabola and 1/sqrt(c) = rBot
        y = Math.pow(27./32. * q2g / Math.pow(xsect.rBot, 2), 1./4.);
        break;

      case POWERFUNC:
        y = 1. / (2.0 * xsect.sBot + 3.0);
        y = Math.pow( q2g * (xsect.sBot + 1.0) / Math.pow(xsect.rBot, 2), y);
        break;

      default:
        // --- first estimate yCritical for an equivalent circular conduit
        //     using 1.01 * (q2g / yFull)^(1/4)
        y = 1.01 * Math.pow(q2g / xsect.yFull, 1./4.);
        if (y >= xsect.yFull) y = 0.97 * xsect.yFull;

        // --- then find ratio of conduit area to equiv. circular area
        r = xsect.aFull / (PI / 4.0 * Math.pow(xsect.yFull, 2));

        // --- use interval enumeration method to find yCritical if
        //     area ratio not too far from 1.0
        if ( r >= 0.5 && r <= 2.0 )
            y = getYcritEnum(xsect, q, y);

        // --- otherwise use Ridder's root finding method
        else y = getYcritRidder(xsect, q, y);
    }

    // --- do not allow yCritical to be > yFull
    return Math.min(y, xsect.yFull);
}

//=============================================================================
// TXsect* xsect, double s
function generic_getAofS(xsect, s)
//
//  Input:   xsect = ptr. to a cross section data structure
//           s = section factor (ft^8/3)
//  Output:  returns area (ft2)
//  Purpose: finds area given section factor by
//           solving S = A*(A/P(A))^(2/3) using Newton-Raphson iterations.
//
{
    let a, a1, a2, tol;
    xsectStar = new TXsectStar();

    // ret facil
    let returnObj;
    let returnVal;

    if (s <= 0.0) return 0.0;

    // --- if S is between sMax and sFull then
    //     bracket A between aFull and aMax
    if ( (s <= xsect.sMax && s >= xsect.sFull)
    &&   xsect.sMax != xsect.sFull )
    {
        a1 = xsect.aFull;          // do this because sFull < sMax
        a2 = xsect_getAmax(xsect);
    }

    // --- otherwise bracket A between 0 and aMax
    else
    {
        a1 = 0.0;
        a2 = xsect_getAmax(xsect);
    }

    // --- place S & xsect in xsectStar for access by evalSofA function
    xsectStar.xsect = xsect;
    xsectStar.s = s;

    // --- compute starting guess for A
    a = 0.5 * (a1 + a2);

    // use the Newton-Raphson root finder function to find A
    tol = 0.0001 * xsect.aFull;
    ////////////////////////////////////
    returnObj = {rts: a, p: xsectStar}
    returnVal = findroot_Newton(a1, a2
                    , returnObj, tol, evalSofA)
    a = returnObj.rts;
    xsectStar = returnObj.p
    ////////////////////////////////////
    //findroot_Newton(a1, a2, a, tol, evalSofA, xsectStar);
    return a;
}

//=============================================================================
////////////////////////////////////
//let returnObj = {f: val1, df: val2, p: val3}
//let returnVal = evalSofA(a, returnObj)
//val1 = returnObj.f;
//val2 = returnObj.df;
//val3 = returnObj.p;
////////////////////////////////////
function evalSofA(a, inObj)
//void evalSofA(double a, double* f, double* df, void* p)
//
//  Input:   a = area
//  Output:  f = root finding function
//           df = derivative of root finding function
//  Purpose: function used in conjunction with getAofS() that evaluates
//           f = S(a) - s and df = dS(a)/dA.
//
{
    //TXsectStar* xsectStar;
    let s;

    let xsectStar = inObj.p;
    s = xsect_getSofA(xsectStar.xsect, a);
    inObj.f = s - xsectStar.s;
    inObj.df = xsect_getdSdA(xsectStar.xsect, a);
}

//=============================================================================

function tabular_getdSdA(xsect, a, table, nItems)
//double tabular_getdSdA(TXsect* xsect, double a, double *table, int nItems)
//
//  Input:   xsect = ptr. to cross section data structure
//           a = area (ft2)
//           table = ptr. to table of section factor v. normalized area
//           nItems = number of equally spaced items in table
//  Output:  returns derivative of section factor w.r.t. area (ft^2/3)
//  Purpose: computes derivative of section factor w.r.t area
//           using geometry tables.
//
{
    let    i;
    let alpha = a / xsect.aFull;
    let delta = 1.0 / (nItems-1);
    let dSdA;

    // --- find which segment of table contains alpha
    i = Math.trunc(alpha / delta);
    if ( i >= nItems - 1 ) i = nItems - 2;

    // --- compute slope from this interval of table
    dSdA = (table[i+1] - table[i]) / delta;

    // --- convert slope to un-normalized value
    return dSdA * xsect.sFull / xsect.aFull;
}

//=============================================================================
// TXsect* xsect, double a
function generic_getdSdA(xsect, a)
//
//  Input:   xsect = ptr. to cross section data structure
//           a = area (ft2)
//  Output:  returns derivative of section factor w.r.t. area (ft^2/3)
//  Purpose: computes derivative of section factor w.r.t area
//           using central difference approximation.
//
{
    let a1, a2;
    let alpha = a / xsect.aFull;
    let alpha1 = alpha - 0.001;
    let alpha2 = alpha + 0.001;
    if ( alpha1 < 0.0 ) alpha1 = 0.0;
    a1 = alpha1 * xsect.aFull;
    a2 = alpha2 * xsect.aFull;
    return (xsect_getSofA(xsect, a2) - xsect_getSofA(xsect, a1)) / (a2 - a1);
}

//=============================================================================
// double x, double *table, int nItems
function lookup(x, table, nItems)
//
//  Input:   x = value of independent variable in a geometry table
//           table = ptr. to geometry table
//           nItems = number of equally spaced items in table
//  Output:  returns value of dependent table variable
//  Purpose: looks up a value in a geometry table (i.e., finds y given x).
//
{
    let  delta, x0, x1, y, y2;
    let     i;

    // --- find which segment of table contains x
    delta = 1.0 / (nItems-1);
    i = Math.trunc(x / delta);
    if ( i >= nItems - 1 ) return table[nItems-1];

    // --- compute x at start and end of segment
    x0 = i * delta;
    x1 = (i+1) * delta;

    // --- linearly interpolate a y-value
    y = table[i] + (x - x0) * (table[i+1] - table[i]) / delta;

    // --- use quadratic interpolation for low x value
    if ( i < 2 )
    {
        y2 = y + (x - x0) * (x - x1) / (delta*delta) *
             (table[i]/2.0 - table[i+1] + table[i+2]/2.0) ;
        if ( y2 > 0.0 ) y = y2;
    }
    if ( y < 0.0 ) y = 0.0;
    return y;
}

//=============================================================================
// double y, double *table, int nItems
function invLookup(y, table, nItems)
//
//  Input:   y = value of dependent variable in a geometry table
//           table = ptr. to geometry table
//           nItems = number of equally spaced items in table
//  Output:  returns value of independent table variable
//  Purpose: performs inverse lookup in a geometry table (i.e., finds
//           x given y).
//
//  Notes:   This function assumes that the geometry table has either strictly
//           increasing entries or that the maximum entry is always third
//           from the last (which is true for all section factor tables). In
//           the latter case, the location of a large y can be ambiguous
//           -- it can be both below and above the location of the maximum.
//           In such cases this routine searches only the interval above
//           the maximum (i.e., the last 2 segments of the table).
//
//           nItems-1 is the highest subscript for the table's data.
//
//           The x value's in a geometry table lie between 0 and 1.
//
{
    let dx;               // x-increment of table
    let x, x0, dy;        // interpolation variables
    let    n;                // # items in increasing portion of table
    let    i;                // lower table index that brackets y

    // --- compute table's uniform x-increment
    dx = 1.0 / (nItems-1);

    // --- truncate item count if last 2 table entries are decreasing
    n = nItems;
    if ( table[n-3] > table[n-1] ) n = n - 2;

    // --- check if y falls in decreasing portion of table
    if ( n < nItems && y > table[nItems-1])
    {
        if ( y >= table[nItems-3] ) return (n-1) * dx;
	    if ( y <= table[nItems-2] ) i = nItems - 2;
	    else i = nItems - 3;
    }

    // --- otherwise locate the interval where y falls in the table
    else i = locate(y, table, n-1);
    if ( i >= n - 1 ) return (n-1) * dx;

    // --- compute x at start and end of segment
    x0 = i * dx;

    // --- linearly interpolate an x value
    dy = table[i+1] - table[i];
    if ( dy == 0.0 ) x = x0;
    else x = x0 + (y - table[i]) * dx / dy;
    if ( x < 0.0 ) x = 0.0;
    if ( x > 1.0 ) x = 1.0;
    return x;
}

//=============================================================================
// double y, double *table, int jLast
function locate(y, table, jLast)
//
//  Input:   y      = value being located in table
//           table  = ptr. to table with monotonically increasing entries
//           jLast  = highest table entry index to search over
//  Output:  returns index j of table such that table[j] <= y <= table[j+1]
//  Purpose: uses bisection method to locate the highest table index whose
//           table entry does not exceed a given value.
//
//  Notes:   This function is only used in conjunction with invLookup().
//
{
    let j;
    let j1 = 0;
    let j2 = jLast;

    // Check if value <= first table entry
    if ( y <= table[0] ) return 0;

    // Check if value >= the last entry
    if ( y >= table[jLast] ) return jLast;

    // While a portion of the table still remains
    while ( j2 - j1 > 1)
    {
	// Find midpoint of remaining portion of table
        j = (j1 + j2) >> 1;

	// Value is greater or equal to midpoint: search from midpoint to j2
        if ( y >= table[j] ) j1 = j;

	// Value is less than midpoint: search from j1 to midpoint
        else j2 = j;
    }

    // Return the lower index of the remaining interval,
    return j1;
}

//=============================================================================
////////////////////////////////////
//let returnObj = {p: val1}
//let returnVal = getQcritical(yc, returnObj)
//val1 = returnObj.p;
////////////////////////////////////
function getQcritical(yc, inObj)
//double getQcritical(double yc, void* p)
//
//  Input:   yc = critical depth (ft)
//           p = pointer to a TXsectStar object
//  Output:  returns flow difference value (cfs)
//  Purpose: finds difference between critical flow at depth yc and
//           some target value.
//
{
    let a, w, qc;
    //TXsectStar* xsectStar;

    let xsectStar = inObj.p;
    a = xsect_getAofY(xsectStar.xsect, yc);
    w = xsect_getWofY(xsectStar.xsect, yc);
    qc = -xsectStar.qc;
    if ( w > 0.0 )  qc = a * Math.sqrt(GRAVITY * a / w) - xsectStar.qc;
    return qc;
}

//=============================================================================
// TXsect* xsect, double q, double y0
function getYcritEnum(xsect, q, y0)
//
//  Input:   xsect = ptr. to cross section data structure
//           q = critical flow rate (cfs)
//           y0 = estimate of critical depth (ft)
//  Output:  returns true critical depth (ft)
//  Purpose: solves a * Math.sqrt(a(y)*g / w(y)) - q for y using interval
//           enumeration with starting guess of y0.
//
{
    let     q0, dy, qc, yc;
    let        i1, i;
    //TXsectStar xsectStar;
    xsectStar = new TXsectStar();
    
    // ret facil
    let returnObj;
    let returnVal;

    // --- divide cross section depth into 25 increments and
    //     locate increment corresponding to initial guess y0
    dy = xsect.yFull / 25.;
    i1 = Math.trunc(y0 / dy);

    // --- evaluate critical flow at this increment
    xsectStar.xsect = xsect;
    xsectStar.qc = 0.0;

    ////////////////////////////////////
    returnObj = {p: xsectStar}
    returnVal = getQcritical(i1*dy, returnObj)
    xsectStar = returnObj.p;
    ////////////////////////////////////
    q0 = returnVal;
    //q0 = getQcritical(i1*dy, xsectStar);

    // --- initial flow lies below target flow
    if ( q0 < q )
    {
        // --- search each successive higher depth increment
        yc = xsect.yFull;
        for ( i = i1+1; i <= 25; i++)
        {
            // --- if critical flow at current depth is above target
            //     then use linear interpolation to compute critical depth
            ////////////////////////////////////
            returnObj = {p: xsectStar}
            returnVal = getQcritical(i*dy, returnObj)
            xsectStar = returnObj.p;
            ////////////////////////////////////
            qc = returnVal;
            //qc = getQcritical(i*dy, xsectStar);
            if ( qc >= q )
            {
                yc = ( (q-q0) / (qc - q0) + (i-1) ) * dy;
                break;
            }
            q0 = qc;
        }
    }

    // --- initial flow lies above target flow
    else
    {
        // --- search each successively lower depth increment
        yc = 0.0;
        for ( i = i1-1; i >= 0; i--)
        {
            // --- if critical flow at current depth is below target
            //     then use linear interpolation to compute critical depth
            ////////////////////////////////////
            returnObj = {p: xsectStar}
            returnVal = getQcritical(i*dy, returnObj)
            xsectStar = returnObj.p;
            ////////////////////////////////////
            qc = returnVal;
            //qc = getQcritical(i*dy, xsectStar);
            if ( qc < q )
            {
                yc = ( (q-qc) / (q0-qc) + i ) * dy;
                break;
            }
            q0 = qc;
        }
    }
    return yc;
}

//=============================================================================
// TXsect* xsect, double q, double y0
function getYcritRidder(xsect, q, y0)
//
//  Input:   xsect = ptr. to cross section data structure
//           q = critical flow rate (cfs)
//           y0 = estimate of critical depth (ft)
//  Output:  returns true critical depth (ft)
//  Purpose: solves a * Math.sqrt(a(y)*g / w(y)) - q for y using Ridder's
//           root finding method with starting guess of y0.
//
{
    let  y1 = 0.0;
    let  y2 = 0.99 * xsect.yFull;
    let  yc;
    let q0, q1, q2;
    xsectStar = new TXsectStar();

    // ret facil
    let returnObj;
    let returnVal;

    // --- store reference to cross section in global pointer
    xsectStar.xsect = xsect;
    xsectStar.qc = 0.0;

    // --- check if critical flow at (nearly) full depth < target flow
    ////////////////////////////////////
    returnObj = {p: xsectStar}
    returnVal = getQcritical(y2, returnObj)
    xsectStar = returnObj.p;
    ////////////////////////////////////
    q2 = returnVal;
    //q2 = getQcritical(y2, xsectStar);
    if (q2 < q ) return xsect.yFull;

    // --- evaluate critical flow at initial depth guess y0
    //     and at 1/2 of full depth
    ////////////////////////////////////
    returnObj = {p: xsectStar}
    returnVal = getQcritical(y0, returnObj)
    xsectStar = returnObj.p;
    ////////////////////////////////////
    q0 = returnVal;
    //q0 = getQcritical(y0, xsectStar);
    ////////////////////////////////////
    returnObj = {p: xsectStar}
    returnVal = getQcritical(0.5*xsect.yFull, returnObj)
    xsectStar = returnObj.p;
    ////////////////////////////////////
    q1 = returnVal;
    //q1 = getQcritical(0.5*xsect.yFull, xsectStar);

    // --- adjust search interval on depth so it contains flow q
    if ( q0 > q )
    {
        y2 = y0;
        if ( q1 < q ) y1 = 0.5*xsect.yFull;
    }
    else
    {
        y1 = y0;
        if ( q1 > q ) y2 = 0.5*xsect.yFull;
    }

    // --- save value of target critical flow in global variable
    xsectStar.qc = q;

    // --- call Ridder root finding procedure with error tolerance
    //     of 0.001 ft. to find critical depth yc
    ////////////////////////////////////
    returnObj = {p: xsectStar}
    returnVal = findroot_Ridder(y1, y2, 0.001, getQcritical, returnObj)
    xsectStar = returnObj.p;
    yc = returnVal;
    ////////////////////////////////////
    //yc = findroot_Ridder(y1, y2, 0.001, getQcritical, xsectStar);
    return yc;
}


//=============================================================================
//  RECT_CLOSED fuctions
//=============================================================================
// TXsect* xsect, double a
function rect_closed_getSofA(xsect, a)
{
    // --- if a > area corresponding to Smax then
    //     interpolate between sMax and Sfull
    let alfMax = RECT_ALFMAX;
    if ( a / xsect.aFull > alfMax )
    {
        return xsect.sMax + (xsect.sFull - xsect.sMax) *
               (a/xsect.aFull - alfMax) / (1.0 - alfMax);
    }

    // --- otherwise use regular formula
    return a * Math.pow(xsect_getRofA(xsect, a), 2./3.);
}

// TXsect* xsect, double a
function rect_closed_getdSdA(xsect, a)
{
    let alpha, alfMax, r;

    // --- if above level corresponding to sMax, then
    //     use slope between sFull & sMax
    alfMax = RECT_ALFMAX;
    alpha = a / xsect.aFull;
    if ( alpha > alfMax )
    {
        return (xsect.sFull - xsect.sMax) /
               ((1.0 - alfMax) * xsect.aFull);
    }

    // --- for small a/aFull use generic central difference formula
    if ( alpha <= 1.0e-30 ) return generic_getdSdA(xsect, a);

    // --- otherwise evaluate dSdA = [5/3 - (2/3)(dP/dA)R]R^(2/3)
    //     (where P = wetted perimeter & dPdA = 2/width)
    r = xsect_getRofA(xsect, a);
    return  (5./3. - (2./3.) * (2.0/xsect.wMax) * r) * Math.pow(r, 2./3.);
}

// TXsect* xsect, double a
function rect_closed_getRofA(xsect, a)
{
    let p;
    if ( a <= 0.0 )   return 0.0;
    p = xsect.wMax + 2.*a/xsect.wMax; // Wetted Perim = width + 2*area/width
    if ( a/xsect.aFull > RECT_ALFMAX )
    {
        p += (a/xsect.aFull - RECT_ALFMAX) / (1.0 - RECT_ALFMAX) * xsect.wMax;
    }
    return a / p;
}


//=============================================================================
//  RECT_OPEN fuctions
//=============================================================================
// TXsect* xsect, double a
function rect_open_getSofA(xsect, a)
{
    let y = a / xsect.wMax;
    let r = a / ((2.0-xsect.sBot)*y + xsect.wMax);
    return a * Math.pow(r, 2./3.);
}

// TXsect* xsect, double a
function rect_open_getdSdA(xsect, a)
{
    let r, dPdA;

    // --- for small a/aFull use generic central difference formula
    if ( a / xsect.aFull <= 1.0e-30 ) return generic_getdSdA(xsect, a);

    // --- otherwise evaluate dSdA = [5/3 - (2/3)(dP/dA)R]R^(2/3)
    //     (where P = wetted perimeter)
    r = xsect_getRofA(xsect, a);
    dPdA = (2.0 - xsect.sBot) / xsect.wMax; // since P = geom2 + 2a/geom2
    return  (5./3. - (2./3.) * dPdA * r) * Math.pow(r, 2./3.);
}


//=============================================================================
//  RECT_TRIANG fuctions
//=============================================================================
// TXsect* xsect, double a
function rect_triang_getYofA(xsect, a)
{
    // below upper section
    if ( a <= xsect.aBot ) return Math.sqrt(a / xsect.sBot);

    // above bottom section
    else return xsect.yBot + (a - xsect.aBot) / xsect.wMax;
}

// TXsect* xsect, double a
function rect_triang_getRofA(xsect, a)
{
    let y;
    let p, alf;

    if ( a <= 0.0 )   return 0.0;
    y = rect_triang_getYofA(xsect, a);

    // below upper section
    if ( y <= xsect.yBot ) return a / (2. * y * xsect.rBot);

    // wetted perimeter without contribution of top surface
    p = 2. * xsect.yBot * xsect.rBot + 2. * (y - xsect.yBot);

    // top-surface contribution
    alf = (a / xsect.aFull) - RECT_TRIANG_ALFMAX;
    if ( alf > 0.0 ) p += alf / (1.0 - RECT_TRIANG_ALFMAX) * xsect.wMax;
    return a / p;
}

//TXsect* xsect, double a
function rect_triang_getSofA(xsect, a)
{
    // --- if a > area corresponding to sMax, then
    //     interpolate between sMax and Sfull
    let alfMax = RECT_TRIANG_ALFMAX;
    if ( a / xsect.aFull > alfMax )
        return xsect.sMax + (xsect.sFull - xsect.sMax) *
               (a/xsect.aFull - alfMax) / (1.0 - alfMax);

    // --- otherwise use regular formula
    else return a * Math.pow(rect_triang_getRofA(xsect, a), 2./3.);
}

//TXsect* xsect, double a
function rect_triang_getdSdA(xsect, a)
{
    let alpha, alfMax, dPdA, r;

    // --- if a > area corresponding to sMax, then
    //     use slope between sFull & sMax
    alfMax = RECT_TRIANG_ALFMAX;
    alpha = a / xsect.aFull;
    if ( alpha > alfMax )
        return (xsect.sFull - xsect.sMax) / ((1.0 - alfMax) * xsect.aFull);

    // --- use generic central difference method for very small a
    if ( alpha <= 1.0e-30 ) return generic_getdSdA(xsect, a);

    // --- find deriv. of wetted perimeter
    if ( a > xsect.aBot ) dPdA = 2.0 / xsect.wMax;  // for upper rectangle
    else dPdA = xsect.rBot / Math.sqrt(a * xsect.sBot);  // for triang. bottom

    // --- get hyd. radius & evaluate section factor derivative formula
    r = rect_triang_getRofA(xsect, a);
    return  (5./3. - (2./3.) * dPdA * r) * Math.pow(r, 2./3.);
}

//TXsect* xsect, double y
function rect_triang_getAofY(xsect, y)
{
    if ( y <= xsect.yBot ) return y * y * xsect.sBot;         // below upper section
    else return xsect.aBot + (y - xsect.yBot) * xsect.wMax;  // above bottom section
}

//(TXsect* xsect, double y
function rect_triang_getRofY(xsect, y)
{
    let p, a, alf;

    // y is below upper rectangular section
    if ( y <= xsect.yBot ) return y * xsect.sBot / (2. * xsect.rBot);

    // area
    a = xsect.aBot + (y - xsect.yBot) * xsect.wMax;

    // wetted perimeter without contribution of top surface
    p = 2. * xsect.yBot * xsect.rBot + 2. * (y - xsect.yBot);

    // top-surface contribution
    alf = (a / xsect.aFull) - RECT_TRIANG_ALFMAX;
    if ( alf > 0.0 ) p += alf / (1.0 - RECT_TRIANG_ALFMAX) * xsect.wMax;
    return a / p;
}

//TXsect* xsect, double y
function rect_triang_getWofY(xsect, y)
{
    if ( y <= xsect.yBot ) return 2.0 * xsect.sBot * y;  // below upper section
    else return xsect.wMax;                               // above bottom section
}


//=============================================================================
//  RECT_ROUND fuctions
//=============================================================================
// TXsect* xsect, double a
function rect_round_getYofA(xsect, a)
{
    let alpha;

    // --- if above circular bottom:
    if ( a > xsect.aBot )
        return xsect.yBot + (a - xsect.aBot) / xsect.wMax;

    // --- otherwise use circular xsection method to find height
    alpha = a / (PI * xsect.rBot * xsect.rBot);
    if ( alpha < 0.04 ) return (2.0 * xsect.rBot) * getYcircular(alpha);
    return (2.0 * xsect.rBot) * lookup(alpha, Y_Circ, N_Y_Circ);
}

// TXsect* xsect, double a
function rect_round_getRofA(xsect, a)
{
    let y1, theta1, p, arg;

    // --- if above circular invert ...
    if ( a <= 0.0 ) return 0.0;
    if ( a > xsect.aBot )
    {
        // wetted perimeter without contribution of top surface
        y1 = (a - xsect.aBot) / xsect.wMax;
        theta1 = 2.0 * Math.asin(xsect.wMax/2.0/xsect.rBot);
        p = xsect.rBot*theta1 + 2.0*y1;

        // top-surface contribution
        arg = (a / xsect.aFull) - RECT_ROUND_ALFMAX;
        if ( arg > 0.0 ) p += arg / (1.0 - RECT_ROUND_ALFMAX) * xsect.wMax;
        return a / p;
    }

    // --- if within circular invert ...
    y1 = rect_round_getYofA(xsect, a);
    theta1 = 2.0*Math.acos(1.0 - y1/xsect.rBot);
    p = xsect.rBot * theta1;
    return a / p;
}

// TXsect* xsect, double a
function rect_round_getSofA(xsect, a)
{
    let alpha, aFull, sFull;

    // --- if a > area corresponding to sMax,
    //     interpolate between sMax and sFull
    let alfMax = RECT_ROUND_ALFMAX;
    if ( a / xsect.aFull > alfMax )
    {
        return xsect.sMax + (xsect.sFull - xsect.sMax) *
               (a / xsect.aFull - alfMax) / (1.0 - alfMax);
    }

    // --- if above circular invert, use generic function
    else if ( a > xsect.aBot )
    {
        return a * Math.pow(xsect_getRofA(xsect, a), 2./3.);
    }

    // --- otherwise use circular xsection function applied
    //     to full circular shape of bottom section
    else
    {
        aFull = PI * xsect.rBot * xsect.rBot;
        alpha = a / aFull;
        sFull = xsect.sBot;

        // --- use special function for small a/aFull
        if ( alpha < 0.04 ) return sFull * getScircular(alpha);

        // --- otherwise use table
        else return sFull * lookup(alpha, S_Circ, N_S_Circ);
    }
}

//TXsect* xsect, double a
function rect_round_getdSdA(xsect, a)
{
    let alfMax, r, dPdA;

    // --- if a > area corresponding to sMax, then
    //     use slope between sFull & sMax
    alfMax = RECT_ROUND_ALFMAX;
    if ( a / xsect.aFull > alfMax )
    {
        return (xsect.sFull - xsect.sMax) /
               ((1.0 - alfMax) * xsect.aFull);
    }

    // --- if above circular invert, use analytical function for dS/dA
    else if ( a > xsect.aBot )
    {
        r = rect_round_getRofA(xsect, a);
        dPdA = 2.0 / xsect.wMax;       // d(wet perim)/dA for rect.
        return  (5./3. - (2./3.) * dPdA * r) * Math.pow(r, 2./3.);
    }

    // --- otherwise use generic finite difference function
    else return generic_getdSdA(xsect, a);
}

// TXsect* xsect, double y
function rect_round_getAofY(xsect, y)
{
    let theta1;

    // --- if above circular invert...
    if ( y > xsect.yBot )
        return xsect.aBot + (y - xsect.yBot) * xsect.wMax;

    // --- find area of circular section
    theta1 = 2.0*Math.acos(1.0 - y/xsect.rBot);
    return 0.5 * xsect.rBot * xsect.rBot * (theta1 - Math.sin(theta1));
}

// TXsect* xsect, double y
function rect_round_getRofY(xsect, y)
{
    let theta1;

    // --- if above top of circular bottom, use RofA formula
    if ( y <= 0.0 ) return 0.0;
    if ( y > xsect.yBot )
        return rect_round_getRofA( xsect, rect_round_getAofY(xsect, y) );

    // --- find hyd. radius of circular section
    theta1 = 2.0*Math.acos(1.0 - y/xsect.rBot);
    return 0.5 * xsect.rBot * (1.0 - Math.sin(theta1)) / theta1;
}

// TXsect* xsect, double y
function rect_round_getWofY(xsect, y)
{
    // --- return width if depth above circular bottom section
    if ( y > xsect.yBot ) return xsect.wMax;

    // --- find width of circular section
    return 2.0 * Math.sqrt( y * (2.0*xsect.rBot - y) );
}


//=============================================================================
//  MOD_BASKETHANDLE fuctions
//=============================================================================

// Note: the variables rBot, yBot, and aBot refer to properties of the
//       circular top portion of the cross-section (not the bottom)
// TXsect* xsect, double a
function mod_basket_getYofA(xsect, a)
{
    let alpha, y1;

    // --- water level below top of rectangular bottom
    if ( a <= xsect.aFull - xsect.aBot ) return a / xsect.wMax;

    // --- find unfilled top area / area of full circular top
    alpha = (xsect.aFull - a) / (PI * xsect.rBot * xsect.rBot);

    // --- find unfilled height
    if ( alpha < 0.04 ) y1 = getYcircular(alpha);
    else                y1 = lookup(alpha, Y_Circ, N_Y_Circ);
    y1 = 2.0 * xsect.rBot * y1;

    // --- return difference between full height & unfilled height
    return xsect.yFull - y1;
}

// TXsect* xsect, double a
function mod_basket_getRofA(xsect, a)
{
    let y1, p, theta1;

    // --- water level is below top of rectangular bottom;
    //     return hyd. radius of rectangle
    if ( a <= xsect.aFull - xsect.aBot )
        return a / (xsect.wMax + 2.0 * a / xsect.wMax);

    // --- find height of empty area
    y1 = xsect.yFull - mod_basket_getYofA(xsect, a);

    // --- find angle of circular arc corresponding to this height
    theta1 = 2.0 * Math.acos(1.0 - y1 / xsect.rBot);

    // --- find perimeter of wetted portion of circular arc
    //     (angle of full circular opening was stored in sBot)
    p = (xsect.sBot - theta1) * xsect.rBot;

    // --- add on wetted perimeter of bottom rectangular area
    y1 = xsect.yFull - xsect.yBot;
    p =  p + 2.0*y1 + xsect.wMax;

    // --- return area / wetted perimeter
    return a / p;
}

// TXsect* xsect, double a
function mod_basket_getdSdA(xsect, a)
{
    let r, dPdA;

    // --- if water level below top of rectangular bottom but not
    //     empty then use same code as for rectangular xsection
    if ( a <= xsect.aFull - xsect.aBot && a/xsect.aFull > 1.0e-30 )
    {
        r = a / (xsect.wMax + 2.0 * a / xsect.wMax);
        dPdA = 2.0 / xsect.wMax;
        return  (5./3. - (2./3.) * dPdA * r) * Math.pow(r, 2./3.);
    }

    // --- otherwise use generic function
    else return generic_getdSdA(xsect, a);
}

// TXsect* xsect, double y
function mod_basket_getAofY(xsect, y)
{
    let a1, theta1, y1;

    // --- if water level is below top of rectangular bottom
    //     return depth * width
    if ( y <= xsect.yFull - xsect.yBot ) return y * xsect.wMax;

    // --- find empty top circular area
    y1 = xsect.yFull - y;
    theta1 = 2.0*Math.acos(1.0 - y1/xsect.rBot);
    a1 = 0.5 * xsect.rBot * xsect.rBot * (theta1 - Math.sin(theta1));

    // --- return difference between full and empty areas
    return xsect.aFull - a1;
}

// TXsect* xsect, double y
function mod_basket_getWofY(xsect, y)
{
    let y1;

    // --- if water level below top of rectangular bottom then return width
    if ( y <= 0.0 ) return 0.0;
    if ( y <= xsect.yFull - xsect.yBot ) return xsect.wMax;

    // --- find width of empty top circular section
    y1 = xsect.yFull - y;
    return 2.0 * Math.sqrt( y1 * (2.0*xsect.rBot - y1) );
}


//=============================================================================
//  TRAPEZOIDAL fuctions
//
//  Note: yBot = width of bottom
//        sBot = avg. of side slopes
//        rBot = length of sides per unit of depth
//=============================================================================

// TXsect* xsect, double 
function trapez_getYofA(xsect, a)
{
    if ( xsect.sBot == 0.0 ) return a / xsect.yBot;
    return ( Math.sqrt( xsect.yBot*xsect.yBot + 4.*xsect.sBot*a )
             - xsect.yBot )/(2. * xsect.sBot);
}

// TXsect* xsect, double a
function trapez_getRofA(xsect, a)
{
    return a / (xsect.yBot + trapez_getYofA(xsect, a) * xsect.rBot);
}

// TXsect* xsect, double a
function trapez_getdSdA(xsect, a)
{
    let r, dPdA;
    // --- use generic central difference method for very small a
    if ( a/xsect.aFull <= 1.0e-30 ) return generic_getdSdA(xsect, a);

    // --- otherwise use analytical formula:
    //     dSdA = [5/3 - (2/3)(dP/dA)R]R^(2/3)
    r = trapez_getRofA(xsect, a);
    dPdA = xsect.rBot /
            Math.sqrt( xsect.yBot * xsect.yBot + 4. * xsect.sBot * a );
    return  (5./3. - (2./3.) * dPdA * r) * Math.pow(r, 2./3.);
}

// TXsect* xsect, double y
function trapez_getAofY(xsect, y)
{
    return ( xsect.yBot + xsect.sBot * y ) * y;
}

// TXsect* xsect, double y
function trapez_getRofY(xsect, y)
{
    if ( y == 0.0 ) return 0.0;
    return trapez_getAofY(xsect, y) / (xsect.yBot + y * xsect.rBot);
}

// TXsect* xsect, double y
function trapez_getWofY(xsect, y)
{
    return xsect.yBot + 2.0 * y * xsect.sBot;
}


//=============================================================================
//  TRIANGULAR fuctions
//=============================================================================
// TXsect* xsect, double a
function triang_getYofA(xsect, a)
{
    return Math.sqrt(a / xsect.sBot);
}

// TXsect* xsect, double a
function triang_getRofA(xsect, a)
{
    return a / (2. * triang_getYofA(xsect, a) * xsect.rBot);
}

// TXsect* xsect, double a
function triang_getdSdA(xsect, a)
{
    let r, dPdA;
    // --- use generic finite difference method for very small 'a'
    if ( a/xsect.aFull <= 1.0e-30 ) return generic_getdSdA(xsect, a);

    // --- evaluate dSdA = [5/3 - (2/3)(dP/dA)R]R^(2/3)
    r = triang_getRofA(xsect, a);
    dPdA = xsect.rBot / Math.sqrt(a * xsect.sBot);
    return  (5./3. - (2./3.) * dPdA * r) * Math.pow(r, 2./3.);
}

// TXsect* xsect, double y
function triang_getAofY(xsect, y)
{
    return y * y * xsect.sBot;
}

// TXsect* xsect, double y
function triang_getRofY(xsect, y)
{
    return (y * xsect.sBot) / (2. * xsect.rBot);
}

// TXsect* xsect, double y
function triang_getWofY(xsect, y)
{
    return 2.0 * xsect.sBot * y;
}


//=============================================================================
//  PARABOLIC fuctions
//=============================================================================

// TXsect* xsect, double a
function parab_getYofA(xsect, a)
{
    return Math.pow( (3./4.) * a / xsect.rBot, 2./3. );
}

// TXsect* xsect, double a
function parab_getRofA(xsect, a)
{
    if ( a <= 0.0 ) return 0.0;
    return a / parab_getPofY( xsect, parab_getYofA(xsect, a) );
}

// TXsect* xsect, double y
function parab_getPofY(xsect, y)
{
    let x = 2. * Math.sqrt(y) / xsect.rBot;
    let t = Math.sqrt(1.0 + x * x);
    return 0.5 * xsect.rBot * xsect.rBot * ( x * t + Math.log(x + t) );
}

// TXsect* xsect, double y
function parab_getAofY(xsect, y)
{
    return (4./3. * xsect.rBot * y * Math.sqrt(y));
}

// TXsect* xsect, double y
function parab_getRofY(xsect, y)
{
    if ( y <= 0.0 ) return 0.0;
    return parab_getAofY(xsect, y) / parab_getPofY(xsect, y);
}

// TXsect* xsect, double y
function parab_getWofY(xsect, y)
{
    return 2.0 * xsect.rBot * Math.sqrt(y);
}


//=============================================================================
//  POWERFUNC fuctions
//=============================================================================

// TXsect* xsect, double a
function powerfunc_getYofA(xsect, a)
{
    return Math.pow(a / xsect.rBot, 1.0 / (xsect.sBot + 1.0));
}

// TXsect* xsect, double a
function powerfunc_getRofA(xsect, a)
{
    if ( a <= 0.0 ) return 0.0;
    return a / powerfunc_getPofY(xsect, powerfunc_getYofA(xsect, a));
}

// TXsect* xsect, double y
function powerfunc_getPofY(xsect, y)
{
    let dy1 = 0.02 * xsect.yFull;
    let h = (xsect.sBot + 1.0) * xsect.rBot / 2.0;
    let m = xsect.sBot;
    let p = 0.0;
    let y1 = 0.0;
    let x1 = 0.0;
    let x2, y2, dx, dy;
    do
    {
        y2 = y1 + dy1;
        if ( y2 > y ) y2 = y;
        x2 = h * Math.pow(y2, m);
        dx = x2 - x1;
        dy = y2 - y1;
        p += Math.sqrt(dx*dx + dy*dy);
        x1 = x2;
        y1 = y2;
    } while ( y2 < y );
    return 2.0 * p;
}

// TXsect* xsect, double y
function powerfunc_getAofY(xsect, y)
{
    return xsect.rBot * Math.pow(y, xsect.sBot + 1.0);
}

// TXsect* xsect, double y
function powerfunc_getRofY(xsect, y)
{
    if ( y <= 0.0 ) return 0.0;
    return powerfunc_getAofY(xsect, y) / powerfunc_getPofY(xsect, y);
}

// TXsect* xsect, double y
function powerfunc_getWofY(xsect, y)
{
    return (xsect.sBot + 1.0) * xsect.rBot * Math.pow(y, xsect.sBot);
}


//=============================================================================
//  CIRCULAR functions
//=============================================================================

// TXsect* xsect, double a
function circ_getYofA(xsect,  a)
{
    let alpha = a / xsect.aFull;

    // --- use special function for small a/aFull
    if ( alpha < 0.04 )  return xsect.yFull * getYcircular(alpha);

    // --- otherwise use table
    else return xsect.yFull * lookup(alpha, Y_Circ, N_Y_Circ);
}

// TXsect* xsect, double s
function circ_getAofS(xsect, s)
{
    let psi = s / xsect.sFull;
    if (psi == 0.0) return 0.0;
    if (psi >= 1.0) return xsect.aFull;

    // --- use special function for small s/sFull
    if (psi <= 0.015) return xsect.aFull * getAcircular(psi);

    // --- otherwise use table
    else return xsect.aFull * invLookup(psi, S_Circ, N_S_Circ);
}

// TXsect* xsect, double a
function circ_getSofA(xsect, a)
{
    let alpha = a / xsect.aFull;

    // --- use special function for small a/aFull
    if ( alpha < 0.04 ) return xsect.sFull * getScircular(alpha);

    // --- otherwise use table
    else
    return xsect.sFull * lookup(alpha, S_Circ, N_S_Circ);
}

// TXsect* xsect, double a
function circ_getdSdA(xsect, a)
{
    let alpha, theta, p, r, dPdA;

    // --- for near-zero area, use generic central difference formula
    alpha = a / xsect.aFull;
    if ( alpha <= 1.0e-30 ) return 1.0e-30;  //generic_getdSdA(xsect, a);

	// --- for small a/aFull use analytical derivative
    else if ( alpha < 0.04 )
    {
        theta = getThetaOfAlpha(alpha);
        p = theta * xsect.yFull / 2.0;
        r = a / p;
        dPdA = 4.0 / xsect.yFull / (1. - Math.cos(theta));
        return  (5./3. - (2./3.) * dPdA * r) * Math.pow(r, 2./3.);
    }

    // --- otherwise use generic tabular getdSdA
    else return tabular_getdSdA(xsect, a, S_Circ, N_S_Circ);
}

////////////////////////////////////////////////
// This is an alternate method used in SWMM 4.4.
////////////////////////////////////////////////
/*
function circ_getdSdA(TXsect* xsect, double a)
{
    double alpha, a1, a2, da, s1, s2, ds;
    alpha = a / xsect.aFull;
    if ( alpha <= 1.0e-30 ) return 1.0e-30;
    da = 0.002;
    a1 = alpha - 0.001;
    a2 = alpha + 0.001;
    if ( a1 < 0.0 )
    {
        a1 = 0.0;
    	da = alpha + 0.001;
    }
    s1 = getScircular(a1);
    s2 = getScircular(a2);
    ds = (s2 - s1) / da;
    if ( ds <= 1.0e-30 ) ds = 1.0e-30;
    return xsect.sFull * ds / xsect.aFull;
}
*/

// TXsect* xsect, double y
function circ_getAofY(xsect, y)
{
    let yNorm;
    yNorm = y / xsect.yFull;
    return xsect.aFull * lookup(yNorm, A_Circ, N_A_Circ);
}


//=============================================================================
//  FILLED_CIRCULAR functions
//=============================================================================

// TXsect* xsect, double a
function filled_circ_getYofA(xsect, a)
{
    let y;

    // --- temporarily remove filled portion of circle
    xsect.yFull += xsect.yBot;
    xsect.aFull += xsect.aBot;
    a += xsect.aBot;

    // --- find depth in unfilled circle
    y = circ_getYofA(xsect, a);

    // --- restore original values
    y -= xsect.yBot;
    xsect.yFull -= xsect.yBot;
    xsect.aFull -= xsect.aBot;
    return y;
}

// TXsect* xsect, double y
function filled_circ_getAofY(xsect, y)
{
    let a;

    // --- temporarily remove filled portion of circle
    xsect.yFull += xsect.yBot;
    xsect.aFull += xsect.aBot;
    y += xsect.yBot;

    // --- find area of unfilled circle
    a = circ_getAofY(xsect, y);

    // --- restore original values
    a -= xsect.aBot;
    xsect.yFull -= xsect.yBot;
    xsect.aFull -= xsect.aBot;
    return a;
}

// TXsect* xsect, double y
function filled_circ_getRofY(xsect, y)
{
    let a, r, p;

    // --- temporarily remove filled portion of circle
    xsect.yFull += xsect.yBot;
    xsect.aFull += xsect.aBot;
    y += xsect.yBot;

    // --- get area,  hyd. radius & wetted perimeter of unfilled circle
    a = circ_getAofY(xsect, y);
    r = 0.25 * xsect.yFull * lookup(y/xsect.yFull, R_Circ, N_R_Circ);
    p = (a/r);

    // --- reduce area and wetted perimeter by amount of filled circle
    //     (rBot = filled perimeter, sBot = filled width)
    a = a - xsect.aBot;
    p = p - xsect.rBot + xsect.sBot;

    // --- compute actual hyd. radius & restore xsect parameters
    r = a / p;
    xsect.yFull -= xsect.yBot;
    xsect.aFull -= xsect.aBot;
    return r;
}


//=============================================================================
//  Special functions for circular cross sections
//=============================================================================
// double alpha
function getYcircular(alpha)
{
    let theta;
    if ( alpha >= 1.0 ) return 1.0;
    if ( alpha <= 0.0 ) return 0.0;
    if ( alpha <= 1.0e-5 )
    {
        theta = Math.pow(37.6911*alpha, 1./3.);
        return theta * theta / 16.0;
    }
    theta = getThetaOfAlpha(alpha);
    return (1.0 - Math.cos(theta/2.)) / 2.0;
}

// double alpha
function getScircular(alpha)
{
    let theta;
    if ( alpha >= 1.0 ) return 1.0;
    if ( alpha <= 0.0 ) return 0.0;
    if ( alpha <= 1.0e-5 )
    {
        theta = Math.pow(37.6911*alpha, 1.0/3.0);
        return Math.pow(theta, 13.0/3.0) / 124.4797;
    }
    theta = getThetaOfAlpha(alpha);
    return Math.pow((theta - Math.sin(theta)), 5.0/3.0) / (2.0 * PI) / Math.pow(theta, 2.0/3.0);
}

// double psi
function getAcircular(psi)
{
    let theta;
    if ( psi >= 1.0 ) return 1.0;
    if ( psi <= 0.0 ) return 0.0;
    if ( psi <= 1.0e-6 )
    {
        theta = Math.pow(124.4797*psi, 3./13.);
        return theta*theta*theta / 37.6911;
    }
    theta = getThetaOfPsi(psi);
    return (theta - Math.sin(theta)) / (2.0 * PI);
}

// double alpha
function getThetaOfAlpha(alpha)
{
    let    k;
    let theta, theta1, ap, d;

    if ( alpha > 0.04 ) theta = 1.2 + 5.08 * (alpha - 0.04) / 0.96;
    else theta = 0.031715 - 12.79384 * alpha + 8.28479 * Math.sqrt(alpha);
    theta1 = theta;
    ap  = (2.0*Math.PI) * alpha;
    for (k = 1; k <= 40; k++ )
    {
        d = - (ap - theta + Math.sin(theta)) / (1.0 - Math.cos(theta));
        // --- modification to improve convergence for large theta
        if ( d > 1.0 ) d = SIGN( 1.0, d );
        theta = theta - d;
        if ( Math.abs(d) <= 0.0001 ) return theta;
    }
    return theta1;
}

// double psi
function getThetaOfPsi(psi)
{
    let    k;
    let theta, theta1, ap, tt, tt23, t3, d;

    if      (psi > 0.90)  theta = 4.17 + 1.12 * (psi - 0.90) / 0.176;
    else if (psi > 0.5)   theta = 3.14 + 1.03 * (psi - 0.5) / 0.4;
    else if (psi > 0.015) theta = 1.2 + 1.94 * (psi - 0.015) / 0.485;
    else                  theta = 0.12103 - 55.5075 * psi +
                                  15.62254 * Math.sqrt(psi);
    theta1 = theta;
    ap     = (2.0*Math.PI) * psi;

    for (k = 1; k <= 40; k++)
    {
        theta    = Math.abs(theta);
        tt       = theta - Math.sin(theta);
        tt23     = Math.pow(tt, 2./3.);
        t3       = Math.pow(theta, 1./3.);
        d        = ap * theta / t3 - tt * tt23;
        d        = d / ( ap*(2./3.)/t3 - (5./3.)*tt23*(1.0-Math.cos(theta)) );
        theta    = theta - d;
        if ( Math.abs(d) <= 0.0001 ) return theta;
    }
    return theta1;
}

//=============================================================================

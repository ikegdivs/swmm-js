// Function for tranlating an integer into a 4 byte output string
// input: num: integer
function toBytes32(num){
    let ascii = '';
    for (let i=3; i>=0; i--){
        ascii+=String.fromCharCode((num>>(8*i))&255);
    }
    return ascii;
}

// Function for tranlating a float into a 4 byte output string
// input: num: float
function toBytes32f(num){
    let ascii = '';
    for (let i=3; i>=0; i--){
        ascii+=String.fromCharCode((Math.fround(num)>>(8*i))&255);
    }
    return ascii;
}

// Function for tranlating an integer into a 4 byte output string
// input: num: character
function toBytes32a(char){
    let arr1 = [];
    for(let n = 0, l = char.length; n < l; n++){
        let hex = Number(char.charCodeAt(n)).toString(16);
        arr1.push(hex);
    }
    return arr1.join('');
}

//--------------------------------------------------
// Macro to test for successful allocation of memory
//--------------------------------------------------
function  MEMCHECK(x)  {(((x) == null) ? 101 : 0 )}

//--------------------------------------------------
// Macro to free a non-null pointer
//--------------------------------------------------
function  FREE(x) { if (x) { x = null; } }

//---------------------------------------------------
// Conversion macros to be used in place of functions
//---------------------------------------------------
function ABS(x)   { return (((x)<0) ? -(x) : (x))  }        /* absolute value of x   */
function MIN(x,y) { return (((x)<=(y)) ? (x) : (y))  }      /* minimum of x and y    */
function MAX(x,y) { return (((x)>=(y)) ? (x) : (y)) }       /* maximum of x and y    */
function MOD(x,y) { return ((x)%(y))     }                  /* x modulus y           */
function LOG10(x) { return ((x) > 0.0 ? log10((x)) : (x))}  /* safe log10 of x       */
function SQR(x)   { return ((x)*(x))}                       /* x-squared             */
function SGN(x)   { return (((x)<0) ? (-1) : (1))}          /* sign of x             */
function SIGN(x,y) { return ((y) >= 0.0 ? Math.abs(x) : -Math.abs(x))}
function UCHAR(x) { return (((x) >= 'a' && (x) <= 'z') ? ((x)&~32) : (x))}
                                                 /* uppercase char of x   */
function ARRAY_LENGTH(x) {(sizeof(x)/sizeof(x[0]))} /* length of array x     */

//-------------------------------------------------
// Macro to evaluate function x with error checking
//-------------------------------------------------
function CALL(x) { return (ErrorCode = ((ErrorCode>0) ? (ErrorCode) : (x)))}

function fopen(dataStream) {
    return dataStream;
}

function fopen_path(filePath) {
    var result = null;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", filePath, false);
    xmlhttp.send();
    if(xmlhttp.status==200){
        result = xmlhttp.responseText;
    }
    return result;
}
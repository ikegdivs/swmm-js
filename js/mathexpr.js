/******************************************************************************
**  MODULE:        MATHEXPR.H
**  PROJECT:       SWMM 5.1
**  DESCRIPTION:   header file for the math expression parser in mathexpr.c.
**  AUTHORS:       L. Rossman, US EPA - NRMRL
**                 F. Shang, University of Cincinnati
**  VERSION:       5.1.001
**  LAST UPDATE:   03/20/14
******************************************************************************/

//  Node in a tokenized math expression list
class ExprNode
{
    constructor(){
        this.opcode;                // operator code
        this.ivar;                  // variable index
        this.fvalue;                // numerical value
        this.prev; // = new ExprNode();        // previous node
        this.next; // = new ExprNode();        // next node
    }
};

class MathExpr{
    constructor(){
        this.opcode;                // operator code
        this.ivar;                  // variable index
        this.fvalue;                // numerical value
        prev = new ExprNode();        // previous node
        next = new ExprNode();        // next node
    }
}

/******************************************************************************
**  MODULE:        MATHEXPR.C
**  PROJECT:       EPA SWMM 5.1
**  DESCRIPTION:   Evaluates symbolic mathematical expression consisting
**                 of numbers, variable names, math functions & arithmetic
**                 operators.
**  AUTHORS:       L. Rossman, US EPA - NRMRL
**                 F. Shang, University of Cincinnati
**  VERSION:       5.1.008
**  LAST UPDATE:   04/01/15
******************************************************************************/
/*
**   Operand codes:
** 	   1 = (
** 	   2 = )
** 	   3 = +
** 	   4 = - (subtraction)
** 	   5 = *
** 	   6 = /
** 	   7 = number
** 	   8 = user-defined variable
** 	   9 = - (negative)
**	  10 = cos
**	  11 = sin
**	  12 = tan
**	  13 = cot
**	  14 = abs
**	  15 = sgn
**	  16 = sqrt
**	  17 = log
**	  18 = exp
**	  19 = asin
**	  20 = acos
**	  21 = atan
**	  22 = acot
**    23 = sinh
**	  24 = cosh
**	  25 = tanh
**	  26 = coth
**	  27 = log10
**    28 = step (x<=0 ? 0 : 1)
**	  31 = ^
******************************************************************************/


var MAX_STACK_SIZE = 1024

//  Local declarations
//--------------------
//  Structure for binary tree representation of math expression
class TreeNode
{
    constructor(){
        this.opcode;                // operator code
        this.ivar;                  // variable index
        this.fvalue;                // numerical value
        this.left; //= new TreeNode();        // left sub-tree of tokenized formula
        this.right; //= new TreeNode();       // right sub-tree of tokenized formula
    }
};
//  Structure for binary tree representation of math expression
class ExprTree
{
    constructor(){
        this.opcode;                // operator code
        this.ivar;                  // variable index
        this.fvalue;                // numerical value
        this.left; //= new TreeNode();        // left sub-tree of tokenized formula
        this.right; //= new TreeNode();       // right sub-tree of tokenized formula
    }
};


// Local variables
//----------------
var Err;
var Bc;
var PrevLex, CurLex;
var Len, Pos;
var S;
var Token;
var Ivar;
var Fvalue;

// math function names
MathFunc =  ["COS", "SIN", "TAN", "COT", "ABS", "SGN",
                     "SQRT", "LOG", "EXP", "ASIN", "ACOS", "ATAN",
                     "ACOT", "SINH", "COSH", "TANH", "COTH", "LOG10",
                     "STEP", null];

// Local functions
//----------------
//static int        sametext(char *, char *);
//static int        isDigit(char);
//static int        isLetter(char);
//static void       getToken(void);
//static int        getMathFunc(void);
//static int        getVariable(void);
//static int        getOperand(void);
//static int        getLex(void);
//static double     getNumber(void);
//static ExprTree * newNode(void);
//static ExprTree * getSingleOp(int *);
//static ExprTree * getOp(int *);
//static ExprTree * getTree(void);
//static void       traverseTree(ExprTree *, MathExpr **);
//static void       deleteTree(ExprTree *);

// Callback functions
// static int    (*getVariableIndex) (char *); // return index of named variable

//=============================================================================
// char *s1, char *s2
function  sametext(s1, s2)
/*
**  Purpose:
**    performs case insensitive comparison of two strings.
**
**  Input:
**    s1 = character string
**    s2 = character string.
**  
**  Returns:
**    1 if strings are the same, 0 otherwise.
*/
{
   if(s1.localeCompare(s2) == 0){
       return 1;
   } else {
       return 0;
   }
}

//=============================================================================
// char c
function isDigit(c)
{
    if(Number.isInteger(c.parseInt())){
        return 1;
    } else {
        return 0;
    }
}

//=============================================================================
// char c
// returns: 1 if the character is a letter or an underscore.
function isLetter(c)
{
    if((/[a-zA-Z_]/).test(c)){
        return 1;
    } else {
        return 0;
    }
}

function setCharAt(str, index, chr){
    if(index > str.length-1) return str;
    return str.substring(0, index) + chr + str.substring(index + 1);
}

//=============================================================================

function getToken()
{
    let c = " ";
    Token = "";
    while ( Pos <= Len &&
        ( isLetter(S.substring(Pos, Pos + 1)) || isDigit(S.substring(Pos, Pos + 1) ) )) 
    {
        c = setCharAt(c, 0, S.substring(Pos, Pos + 1))
        c = S.substring(Pos, Pos + 1)
        Token += c;
        Pos++;
    }
    Pos--;
}

//=============================================================================

function getMathFunc()
{
    let i = 0;
    while (MathFunc[i] != null)
    {
        if (sametext(MathFunc[i], Token)) return i+10;
        i++;
    }
    return(0);
}

//=============================================================================

function getVariable()
{
    if ( !getVariableIndex ) return 0;
    Ivar = getVariableIndex(Token);
    if (Ivar >= 0) return 8;
    return 0;
}

//=============================================================================

function getNumber()
{
    let c = " ";
    let sNumber;
    let errflag = 0;

    /* --- get whole number portion of number */
    sNumber = "";
    while (Pos < Len && isDigit(S.substring(Pos, Pos + 1)))
    {
        //c[0] = S[Pos]
        c = setCharAt(c, 0, S.substring(Pos, Pos + 1))
        sNumber += c;
        Pos++;
    }

    /* --- get fractional portion of number */
    if (Pos < Len)
    {
        if (S.substring(Pos, Pos + 1) === '.')
        {
            sNumber += ".";
            Pos++;
            while (Pos < Len && isDigit(S.substring(Pos, Pos + 1)))
            {
                c = setCharAt(c, 0, S.substring(Pos, Pos + 1))
                sNumber += c;  
                Pos++;
            }
        }

        /* --- get exponent */
        if (Pos < Len && (S.substring(Pos, Pos + 1) === 'e' || S.substring(Pos, Pos + 1) === 'E'))
        {
            sNumber += "E";  
            Pos++;
            if (Pos >= Len) errflag = 1;
            else
            {
                if (S.substring(Pos, Pos + 1) == '-' || S.substring(Pos, Pos + 1) == '+')
                {
                    c = setCharAt(c, 0, S.substring(Pos, Pos + 1))
                    sNumber += c;  
                    Pos++;
                }
                if (Pos >= Len || !isDigit(S.substring(Pos, Pos + 1))) errflag = 1;
                else while ( Pos < Len && isDigit(S.substring(Pos, Pos + 1)))
                {
                    c = setCharAt(c, 0, S.substring(Pos, Pos + 1))
                    sNumber += c;  
                    Pos++;
                }
            }
        }
    }
    Pos--;
    if (errflag) return 0;
    else return sNumber.parseFloat();
}

//=============================================================================

function getOperand()
{
    let code;
    switch(S.substring(Pos, Pos + 1))
    {
      case '(': code = 1;  break;
      case ')': code = 2;  break;
      case '+': code = 3;  break;
      case '-': code = 4;
        if (Pos < Len-1 &&
            isDigit(S.substring(Pos+1, Pos + 2)) &&
            (CurLex == 0 || CurLex == 1))
        {
            Pos++;
            Fvalue = -getNumber();
            code = 7;
        }
        break;
      case '*': code = 5;  break;
      case '/': code = 6;  break;
      case '^': code = 31; break;
      default:  code = 0;
    }
    return code;
}

//=============================================================================

function getLex()
{
    let n;

    /* --- skip spaces */
    while ( Pos < Len && S.substring(Pos, Pos + 1) === ' ' ) Pos++;
    if ( Pos >= Len ) return 0;

    /* --- check for operand */
    n = getOperand();

    /* --- check for function/variable/number */
    if ( n == 0 )
    {
        if ( isLetter(S.substring(Pos, Pos + 1)) )
        {
            getToken();
            n = getMathFunc();
            if ( n == 0 ) n = getVariable();
        }
        else if ( isDigit(S.substring(Pos, Pos + 1)) )
        {
            n = 7;
            Fvalue = getNumber();
        }
    }
    Pos++;
    PrevLex = CurLex;
    CurLex = n;
    return n;
}

//=============================================================================

function newNode()
{
    //ExprTree *node;
    //node = (ExprTree *) malloc(sizeof(ExprTree));
    node = new ExprTree()
    if (!node) Err = 2;
    else
    {
        node.opcode = 0;
        node.ivar   = -1;
        node.fvalue = 0.;
        node.left   = null;
        node.right  = null;
    }
    return node;
}

//=============================================================================
////////////////////////////////////
//let returnObj = {lex: val}
//let returnVal = getSingleOp(returnObj);
//val = returnObj.lex;
////////////////////////////////////
//int *lex
function getSingleOp(inObj)
{
    let bracket;
    let opcode;
    //ExprTree *left;
    //ExprTree *right;
    //ExprTree *node;
    let left;
    let right;
    let node;

    /* --- open parenthesis, so continue to grow the tree */
    if ( inObj.lex == 1 )
    {
        Bc++;
        left = getTree();
    }

    else
    {
        /* --- Error if not a singleton operand */
        if ( inObj.lex < 7 || inObj.lex == 9 || inObj.lex > 30)
        {
            Err = 1;
            return null;
        }

        opcode = inObj.lex;

        /* --- simple number or variable name */
        if ( inObj.lex == 7 || inObj.lex == 8 )
        {
            left = newNode();
            left.opcode = opcode;
            if ( inObj.lex == 7 ) left.fvalue = Fvalue;
            if ( inObj.lex == 8 ) left.ivar = Ivar;
        }

        /* --- function which must have a '(' after it */
        else
        {
            inObj.lex = getLex();
            if ( inObj.lex != 1 )
            {
               Err = 1;
               return null;
            }
            Bc++;
            left = newNode();
            left.left = getTree();
            left.opcode = opcode;
        }
    }   
    inObj.lex = getLex();

    /* --- exponentiation */
    while ( inObj.lex == 31 )
    {
        inObj.lex = getLex();
        bracket = 0;
        if ( inObj.lex == 1 )
        {
            bracket = 1;
            inObj.lex = getLex();
        }
        if ( inObj.lex != 7 )
        {
            Err = 1;
            return null;
        }
        right = newNode();
        right.opcode = inObj.lex;
        right.fvalue = Fvalue;
        node = newNode();
        node.left = left;
        node.right = right;
        node.opcode = 31;
        left = node;
        if (bracket)
        {
            inObj.lex = getLex();
            if ( inObj.lex != 2 )
            {
                Err = 1;
                return null;
            }
        }
        inObj.lex = getLex();
    }
    return left;
}

//=============================================================================
////////////////////////////////////
//let returnObj = {lex: val}
//let returnVal = getOp(returnObj);
//val = returnObj.lex;
////////////////////////////////////
function getOp(inObj)
//ExprTree * getOp(int *lex)
{
    let opcode;
    //ExprTree *left;
    //ExprTree *right;
    //ExprTree *node;
    let left;
    let right;
    let node;
    let neg = 0;

    // Return object & value
    let returnObj;
    let returnVal;

    inObj.lex = getLex();
    if (PrevLex == 0 || PrevLex == 1)
    {
        if ( inObj.lex == 4 )
        {
            neg = 1;
            inObj.lex = getLex();
        }
        else if ( inObj.lex == 3) inObj.lex = getLex();
    }

    ////////////////////////////////////
    returnObj = {lex: inObj.lex}
    returnVal = getSingleOp(returnObj);
    inObj.lex = returnObj.lex;
    ////////////////////////////////////
    left = returnVal;
    //left = getSingleOp(lex);
    while ( inObj.lex == 5 || inObj.lex == 6 )
    {
        opcode = inObj.lex;
        inObj.lex = getLex();

        ////////////////////////////////////
        returnObj = {lex: inObj.lex}
        returnVal = getSingleOp(returnObj);
        inObj.lex = returnObj.lex;
        ////////////////////////////////////
        right = returnVal;
        //right = getSingleOp(lex);
        node = newNode();
        if (Err) return null;
        node.left = left;
        node.right = right;
        node.opcode = opcode;
        left = node;
    }
    if ( neg )
    {
        node = newNode();
        if (Err) return null;
        node.left = left;
        node.right = null;
        node.opcode = 9;
        left = node;
    }
    return left;
}

//=============================================================================

function getTree()
//ExprTree * getTree()
{
    let      lex;
    let      opcode;
    //ExprTree *left;
    //ExprTree *right;
    //ExprTree *node;
    let left;
    let right;
    let node;

    // return facilitators
    let returnObj;
    let returnVal;

    ////////////////////////////////////
    returnObj = {lex: lex}
    returnVal = getOp(returnObj);
    lex = returnObj.lex;
    ////////////////////////////////////
    left = returnVal;
    //left = getOp(&lex);
    for (;;)
    {
        if ( lex == 0 || lex == 2 )
        {
            if ( lex == 2 ) Bc--;
            break;
        }

        if (lex != 3 && lex != 4 )
        {
            Err = 1;
            break;
        }

        opcode = lex;
        ////////////////////////////////////
        returnObj = {lex: lex}
        returnVal = getOp(returnObj);
        lex = returnObj.lex;
        ////////////////////////////////////
        right = returnVal;
        //right = getOp(&lex);
        node = newNode();
        if (Err) break;
        node.left = left;
        node.right = right;
        node.opcode = opcode;
        left = node;
    } 
    return left;
}

//=============================================================================
////////////////////////////////////
//let returnObj = {tree: val1, expr: val2}
//let returnVal = traverseTree(returnObj);
//val1 = returnObj.tree;
//val2 = returnObj.expr;
////////////////////////////////////
function traverseTree(inObj)
//void traverseTree(ExprTree *tree, MathExpr **expr)
// Converts binary tree to linked list (postfix format)
{
    //MathExpr *node;
    let node;

    // return facilitators
    let returnObj;
    let returnVal;

    if ( inObj.tree == null) return;

    ////////////////////////////////////
    returnObj = {tree: inObj.tree.left, expr: inObj.expr}
    returnVal = traverseTree(returnObj);
    inObj.tree.left = returnObj.tree;
    inObj.expr = returnObj.expr;
    ////////////////////////////////////
    //traverseTree(inObj.tree.left,  inObj.expr);
    ////////////////////////////////////
    returnObj = {tree: inObj.tree.right, expr: inObj.expr}
    returnVal = traverseTree(returnObj);
    inObj.tree.right = returnObj.tree;
    inObj.expr = returnObj.expr;
    ////////////////////////////////////
    //traverseTree(inObj.tree.right, inObj.expr);

    //node = (MathExpr *) malloc(sizeof(MathExpr));
    node = new MathExpr();
    node.fvalue = inObj.tree.fvalue;
    node.opcode = inObj.tree.opcode;
    node.ivar = inObj.tree.ivar;
    node.next = null;
    node.prev = (inObj.expr);
    if (inObj.expr) (inObj.expr).next = node;
    (inObj.expr) = node;
}

//=============================================================================
////////////////////////////////////
//let returnObj = {tree: val1}
//let returnVal = deleteTree(returnObj);
//val1 = returnObj.tree;
////////////////////////////////////
function deleteTree(inObj)
//void deleteTree(ExprTree *tree)
{
    // return facilitators
    let returnObj;
    let returnVal;

    if (inObj.tree)
    {
        if (inObj.tree.left){
            ////////////////////////////////////
            returnObj = {tree: inObj.tree.left}
            returnVal = deleteTree(returnObj);
            inObj.tree.left = returnObj.tree;
            ////////////////////////////////////
            //deleteTree(inObj.tree.left);
        }
        if (inObj.tree.right){
            ////////////////////////////////////
            returnObj = {tree: inObj.tree.right}
            returnVal = deleteTree(returnObj);
            inObj.tree.right = returnObj.tree;
            ////////////////////////////////////
            //deleteTree(inObj.tree.right);
        }
        inObj.tree = null;
    }
}

//=============================================================================

// Turn on "precise" floating point option
//#pragma float_control(precise, on, push)
//float_control(precise, on, push)


////////////////////////////////////
//let returnObj = {expr: val1, getVariableValue: function(){return result;}}
//let returnVal = mathexpr_eval(returnObj);
//val1 = returnObj.expr;
////////////////////////////////////
function mathexpr_eval(inObj)
//double mathexpr_eval(MathExpr *expr, double (*getVariableValue) (int))
//  Mathematica expression evaluation using a stack
{
    
// --- Note: the ExprStack array must be declared locally and not globally
//     since this function can be called recursively.

    ExprStack = new Array(MAX_STACK_SIZE);
    //MathExpr *node = expr;
    node = inObj.expr;
    let r1, r2;
    let stackindex = 0;
    
    ExprStack[0] = 0.0;
    while(node != null)
    {
	switch (node.opcode)
	{
	    case 3:  
		r1 = ExprStack[stackindex];
		stackindex--;
		r2 = ExprStack[stackindex];
		ExprStack[stackindex] = r2 + r1;
		break;

        case 4:  
		r1 = ExprStack[stackindex];
		stackindex--;
		r2 = ExprStack[stackindex];
		ExprStack[stackindex] = r2 - r1;
		break;

        case 5:  
		r1 = ExprStack[stackindex];
		stackindex--;
		r2 = ExprStack[stackindex];
		ExprStack[stackindex] = r2 * r1;
		break;

        case 6:  
		r1 = ExprStack[stackindex];
		stackindex--;
		r2 = ExprStack[stackindex];
		ExprStack[stackindex] = r2 / r1;
		break;				

        case 7:  
		stackindex++;
		ExprStack[stackindex] = node.fvalue;
		break;

        case 8:
        if (inObj.getVariableValue != null)
        {
           r1 = inObj.getVariableValue(node.ivar);
        }
        else r1 = 0.0;
		stackindex++;
		ExprStack[stackindex] = r1;
		break;

        case 9: 
		ExprStack[stackindex] = -ExprStack[stackindex];
		break;

        case 10: 
		r1 = ExprStack[stackindex];
		r2 = Math.cos(r1);
		ExprStack[stackindex] = r2;
		break;

        case 11: 
		r1 = ExprStack[stackindex];
		r2 = Math.sin(r1);
		ExprStack[stackindex] = r2;
		break;

        case 12: 
		r1 = ExprStack[stackindex];
		r2 = Math.tan(r1);
		ExprStack[stackindex] = r2;
		break;

        case 13: 
		r1 = ExprStack[stackindex];
		if (r1 == 0.0) r2 = 0.0;
		else r2 = 1.0/Math.tan( r1 );    
		ExprStack[stackindex] = r2;
		break;

        case 14: 
		r1 = ExprStack[stackindex];
		r2 = Math.abs( r1 );       
		ExprStack[stackindex] = r2;
		break;

        case 15: 
		r1 = ExprStack[stackindex];
		if (r1 < 0.0) r2 = -1.0;
		else if (r1 > 0.0) r2 = 1.0;
		else r2 = 0.0;
		ExprStack[stackindex] = r2;
		break;

        case 16: 
		r1 = ExprStack[stackindex];
		if (r1 < 0.0) r2 = 0.0;
		else r2 = Math.sqrt( r1 );     
		ExprStack[stackindex] = r2;
		break;

        case 17: 
		r1 = ExprStack[stackindex];
		if (r1 <= 0) r2 = 0.0;
		else r2 = Math.log(r1);
		ExprStack[stackindex] = r2;
		break;

        case 18: 
		r1 = ExprStack[stackindex];
		r2 = Math.exp(r1);
		ExprStack[stackindex] = r2;
		break;

        case 19: 
		r1 = ExprStack[stackindex];
		r2 = Math.asin( r1 );
		ExprStack[stackindex] = r2;
		break;

        case 20: 
		r1 = ExprStack[stackindex];
		r2 = Math.acos( r1 );      
		ExprStack[stackindex] = r2;
		break;

        case 21: 
		r1 = ExprStack[stackindex];
		r2 = Math.atan( r1 );      
		ExprStack[stackindex] = r2;
		break;

        case 22: 
		r1 = ExprStack[stackindex];
		r2 = 1.57079632679489661923 - Math.atan(r1);  
		ExprStack[stackindex] = r2;
		break;

        case 23:
		r1 = ExprStack[stackindex];
		r2 = (Math.exp(r1)-Math.exp(-r1))/2.0;
		ExprStack[stackindex] = r2;
		break;

        case 24: 
		r1 = ExprStack[stackindex];
		r2 = (Math.exp(r1)+Math.exp(-r1))/2.0;
		ExprStack[stackindex] = r2;
		break;

        case 25: 
		r1 = ExprStack[stackindex];
		r2 = (Math.exp(r1)-Math.exp(-r1))/(Math.exp(r1)+Math.exp(-r1));
		ExprStack[stackindex] = r2;
		break;

        case 26: 
		r1 = ExprStack[stackindex];
		r2 = (Math.exp(r1)+Math.exp(-r1))/(Math.exp(r1)-Math.exp(-r1));
		ExprStack[stackindex] = r2;
		break;

        case 27: 
		r1 = ExprStack[stackindex];
		if (r1 == 0.0) r2 = 0.0;
		else r2 = Math.log10( r1 );     
		ExprStack[stackindex] = r2;
		break;

        case 28:
 		r1 = ExprStack[stackindex];
		if (r1 <= 0.0) r2 = 0.0;
		else           r2 = 1.0;
		ExprStack[stackindex] = r2;
		break;
               
        case 31: 
		r1 = ExprStack[stackindex];
		r2 = ExprStack[stackindex-1];
		if (r2 <= 0.0) r2 = 0.0;
		else r2 = Math.exp(r1*Math.log(r2));
		ExprStack[stackindex-1] = r2;
		stackindex--;
		break;
        }
        node = node.next;
    }
    r1 = ExprStack[stackindex];

    // Set result to 0 if it is NaN due to an illegal math op
    if ( r1 != r1 ) r1 = 0.0;

    return r1;
}

// Turn off "precise" floating point option
//#pragma float_control(pop)
//float_control(pop)

//=============================================================================
////////////////////////////////////
//let returnObj = {expr: val1}
//let returnVal = mathexpr_delete(returnObj);
//val1 = returnObj.expr;
////////////////////////////////////
function mathexpr_delete(inObj)
//void mathexpr_delete(MathExpr *expr)
{
    // return facilitators
    let returnObj;
    let returnVal;

    
    if(inObj){
        if (inObj.expr) {
            if(inObj.expr.next){
                ////////////////////////////////////
                returnObj = {expr: inObj.expr.next}
                returnVal = mathexpr_delete(returnObj);
                inObj.expr.next = returnObj.expr;
                ////////////////////////////////////
                //mathexpr_delete(inObj.expr.next);
            }
        }
        inObj.expr = null;
        //free(expr);
    }
}

//=============================================================================

////////////////////////////////////
//let returnObj = {getVar: function(){return;}}
//let returnVal = mathexpr_delete(formula, returnObj);
//val1 = returnObj.expr;
////////////////////////////////////
function mathexpr_create(formula, inObj)
//MathExpr * mathexpr_create(char *formula, int (*getVar) (char *))
{
    //ExprTree *tree;
    //MathExpr *expr = null;
    //MathExpr *result = null;
    let tree;
    let expr;
    let result;

    // return facilitators
    let returnObj;
    let returnVal;


    getVariableIndex = inObj.getVar;
    Err = 0;
    PrevLex = 0;
    CurLex = 0;
    S = formula;
    Len = S.length;
    Pos = 0;
    Bc = 0;
    tree = getTree();
    if (Bc == 0 && Err == 0)
    {
        ////////////////////////////////////
        returnObj = {tree: tree, expr: expr}
        returnVal = traverseTree(returnObj);
        tree = returnObj.tree;
        expr = returnObj.expr;
        ////////////////////////////////////
	    //traverseTree(tree, &expr);
	    while (expr)
	    {
            result = expr;
            expr = expr.prev;
        }
    }
    ////////////////////////////////////
    returnObj = {tree: tree}
    returnVal = deleteTree(returnObj);
    tree = returnObj.tree;
    ////////////////////////////////////
    //deleteTree(tree);
    return result;
}


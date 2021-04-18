//-----------------------------------------------------------------------------
//   hash.h
//
//   Header file for Hash Table module hash.c.
//-----------------------------------------------------------------------------

var HTMAXSIZE = 1999
var NOTFOUND  = -1

class HTentry
{
    constructor(){
        this.key;
        this.data;
        //struct HTentry *next
        this.next;
    }
};

class HTtable
{
    constructor(){
        this.key;
        this.data;
        //struct HTentry *next
        this.next;
    }
};

//typedef struct HTentry *HTtable;

//-----------------------------------------------------------------------------
//   hash.c
//
//   Implementation of a simple Hash Table for string storage & retrieval
//   CASE INSENSITIVE
//
//   Written by L. Rossman
//   Last Updated on 6/19/03
//
//   The hash table data structure (HTable) is defined in "hash.h".
//   Interface Functions:
//      HTcreate() - creates a hash table
//      HTinsert() - inserts a string & its index value into a hash table
//      HTfind()   - retrieves the index value of a string from a table
//      HTfree()   - frees a hash table
//-----------------------------------------------------------------------------

//function UCHAR(x) {(((x) >= 'a' && (x) <= 'z') ? ((x)&~32) : (x))}

/* Case-insensitive comparison of strings s1 and s2 */
// char *s1, 
// char *s2
// returns 1 if they are spelled the same, 0 if they are not.
function  samestr(s1, s2)
{
    if(s1.toUpperCase() == s2.toUpperCase()){
        return 1;
    } else {
        return 0;
    }
}                                       /*  End of samestr  */

/* Use Fletcher's checksum to compute 2-byte hash of string */
// char *str
function hash(str)
{
    var sum1 = 0, check1;
    var sum2 = 0;
    for(let i = 0; i < str.length; i++){
        sum1 += str[i];
        if (  255 <= sum1  ) sum1 -= 255;
        sum2 += sum1;
    }
    check1 = sum2;
    check1 %= 255;
    check1 = 255 - (sum1+check1) % 255;
    sum1 = 255 - (sum1+check1) % 255;
    return( ( ( check1 << 8 )  |  sum1  ) % HTMAXSIZE);
}

//HTtable *HTcreate()
function HTcreate()
{
        //HTtable *ht = (HTtable *) calloc(HTMAXSIZE, sizeof(HTtable));
        var ht = [];
        for(let i = 0; i < HTMAXSIZE; i++){ht.push(new HTtable())}
        //if (ht != null) for (i=0; i<HTMAXSIZE; i++) ht[i] = null;
        return(ht);
}
// HTtable *ht, char *key, int data
function HTinsert(ht, key, data)
{
        let i = hash(key);
        //struct HTentry *entry;
        let entry = new HTentry();
        if ( i >= HTMAXSIZE ) return(0);
        entry.key = key;
        entry.data = data;
        entry.next = ht[i];
        ht[i] = entry;
        return(1);
}

// HTtable *ht, char *key
function HTfind(ht, key)
{
        let i = hash(key);
        if ( i >= HTMAXSIZE ) return(NOTFOUND);
        let entry = ht[i];
        while (entry.key != null)
        {
            if ( samestr(entry.key,key) ) {
                return(entry.data);
            }
            entry = entry.next;
        }
        return(NOTFOUND);
}

// HTtable *ht, char *key
function HTfindKey(ht, key)
{
        let i = hash(key);
        if ( i >= HTMAXSIZE ) return(null);
        let entry = ht[i];
        while (entry.key != null)
        {
            if ( samestr(entry.key,key) ) {
                return(entry.key);
            }
            entry = entry.next;
        }
        return(null);
}

// HTtable *ht
function HTfree(ht)
{
        let i;

        for (i=0; i<HTMAXSIZE; i++)
        {
            ht[i] = null;
        }
        ht = null;
}


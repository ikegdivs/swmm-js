//-----------------------------------------------------------------------------
//  mempool.h
//
//  Header for mempool.c
//
//  The type alloc_handle_t provides an opaque reference to the
//  alloc pool - only the alloc routines know its structure.
//-----------------------------------------------------------------------------

//typedef struct
//{
//   long  dummy;
//}  alloc_handle_t;



//-----------------------------------------------------------------------------
//  mempool.c
//
//  A simple fast memory allocation package.
//
//  By Steve Hill in Graphics Gems III, David Kirk (ed.),
//    Academic Press, Boston, MA, 1992
//
//  Modified by L. Rossman, 8/13/94.
//
//  AllocInit()     - create an alloc pool, returns the old pool handle
//  Alloc()         - allocate memory
//  AllocReset()    - reset the current pool
//  AllocSetPool()  - set the current pool
//  AllocFree()     - free the memory used by the current pool.
//-----------------------------------------------------------------------------


/*
**  ALLOC_BLOCK_SIZE - adjust this size to suit your installation - it
**  should be reasonably large otherwise you will be mallocing a lot.
*/

var ALLOC_BLOCK_SIZE  = 64000       /*(62*1024)*/

/*
**  alloc_hdr_t - Header for each block of memory.
*/

//typedef struct alloc_hdr_s
//{
//    struct alloc_hdr_s *next;   /* Next Block          */
//    char               *block,  /* Start of block      */
//                       *free,   /* Next free in block  */
//                       *end;    /* block + block size  */
//}  alloc_hdr_t;
class alloc_hd_s {
    constructor(){
        this.next;                /* Next Block          */
        this.block,  /* Start of block      */
        this.free,   /* Next free in block  */
        this.end;    /* block + block size  */
    }
}

class alloc_hdr_t {
    constructor(){
        this.next;                /* Next Block          */
        this.block,  /* Start of block      */
        this.free,   /* Next free in block  */
        this.end;    /* block + block size  */
    }
}


/*
**  alloc_root_t - Header for the whole pool.
*/

//typedef struct alloc_root_s
//{
//    alloc_hdr_t *first,    /* First header in pool */
//                *current;  /* Current header       */
//}  alloc_root_t;

class alloc_root_s
{
    constructor(){
        this.first,    // First header in pool 
        this.current;  // Current header       
    }
}  

class alloc_root_t
{
    constructor(){
        this.first = null,    // First header in pool 
        this.current = null;  // Current header       
    }
}

/*
**  root - Pointer to the current pool.
*/

//static alloc_root_t *root;
var root;


/*
**  AllocHdr()
**
**  Private routine to allocate a header and memory block.
*/
                
function AllocHdr()
{
    //alloc_hdr_t     *hdr;
    let hdr;
    let block = '';

    hdr   = new alloc_hdr_t();

    if (hdr == null || block == null) return(null);
    hdr.block = block;
    hdr.free  = block;
    hdr.next  = null;
    hdr.end   = block + ALLOC_BLOCK_SIZE;

    return(hdr);
}


/*
**  AllocInit()
**
**  Create a new memory pool with one block.
**  Returns pointer to the new pool.
*/

function AllocInit()
{
    //alloc_handle_t *newpool;
    let newpool;

    //root = (alloc_root_t *) malloc(sizeof(alloc_root_t));
    root = new alloc_root_t();
    if (root == null) return(null);
    if ( (root.first = AllocHdr()) == null) return(null);
    root.current = root.first;
    newpool = root;
    return(newpool);
}


/*
**  Alloc()
**
**  Use as a direct replacement for malloc().  Allocates
**  memory from the current pool.
*/
// long size
function Alloc(size)
{
    //alloc_hdr_t  *hdr = root.current;
    let hdr = root.current;
    let ptr = '';

    /*
    **  Align to 4 byte boundary - should be ok for most machines.
    **  Change this if your machine has weird alignment requirements.
    */
    size = (size + 3) & 0xfffffffc;

    ptr = hdr.free;
    hdr.free += size;

    /* Check if the current block is exhausted. */

    if (hdr.free >= hdr.end)
    {
        /* Is the next block already allocated? */

        if (hdr.next != null)
        {
            /* re-use block */
            hdr.next.free = hdr.next.block;
            root.current = hdr.next;
        }
        else
        {
            /* extend the pool with a new block */
            if ( (hdr.next = AllocHdr()) == null) return(null);
            root.current = hdr.next;
        }

        /* set ptr to the first location in the next block */
        ptr = root.current.free;
        root.current.free += size;
    }

    /* Return pointer to allocated memory. */

    return(ptr);
}


/*
**  AllocSetPool()
**
**  Change the current pool.  Return the old pool.
*/
// alloc_handle_t *newpool
function AllocSetPool(newpool)
{
    //alloc_handle_t *old = (alloc_handle_t *) root;
    let old = root;
    root = newpool;
    return(old);
}


/*
**  AllocReset()
**
**  Reset the current pool for re-use.  No memory is freed,
**  so this is very fast.
*/

function  AllocReset()
{
    root.current = root.first;
    root.current.free = root.current.block;
}


/*
**  AllocFreePool()
**
**  Free the memory used by the current pool.
**  Don't use where AllocReset() could be used.
*/

function  AllocFreePool()
{
    //alloc_hdr_t  *tmp,
    //             *hdr = root.first;
    let tmp;
    let hdr = root.first

    while (hdr != null)
    {
        tmp = hdr.next;
        //free((char *) hdr.block);
        //free((char *) hdr);
        hdr.block = null;
        hdr = tmp;
    }
    //free((char *) root);
    root = null;
}

/*!
 * tabulator
 * 2015 Codenautas
 * MIT Licensed
 */

/**
 * Module dependencies.
 */
"use strict";
/*jshint eqnull:true */
/*jshint node:true */
(function webpackUniversalModuleDefinition(root, factory) {
    /* global define */
    /* global globalModuleName */
    if(typeof root.globalModuleName !== 'string'){
        root.globalModuleName = factory.name;
    }
    /* istanbul ignore next */
    if(typeof exports === 'object' && typeof module === 'object')
        module.exports = factory();
    else if(typeof define === 'function' && define.amd)
        define(factory);
    else if(typeof exports === 'object')
        exports[root.globalModuleName] = factory();
    else
        root[root.globalModuleName] = factory();
    root.globalModuleName = null;
})(/*jshint -W040 */this, function Tabulator() {
/*jshint +W040 */

/*jshint node:false */
if(typeof window !== 'undefined'){
    window.require.definedModules['codenautas-xlsx']=window.XLSX;
}

var XLSX = require('codenautas-xlsx');

var likeAr = require('like-ar');

var bg = require('best-globals');

var html=require('js-to-html').html;

/*jshint -W004 */
var Tabulator = function(){
};
/*jshint +W004 */
 
 // import used by this file
// var dependency = dependency || require('dependency');  

function array_combine(keys, values) {
  var new_array = {};
  for (var i = 0; i < keys.length; i++) {
    new_array[keys[i]] = values[i];
  }
  return new_array;
}



Tabulator.prototype.captionPart = function captionPart(matrix){
    return matrix.caption?html.caption(matrix.caption):null;
};

Tabulator.prototype.colGroups = function colGroups(matrix){
    //console.log("matrix.lineVariables",matrix.lineVariables);
    var lineVariablesPart=matrix.lineVariables?(
        html.colgroup(
            {'class':'headers'},
            matrix.lineVariables.map(function(lineVariable){
                return html.col({'class':lineVariable});
            })
        )
    ):null;
    var columnVariablesPart=(matrix.columns)?(
        html.colgroup(
            {'class':'data'},
            (matrix.oneColumnTitle)?(
                html.col({'class':'variable'})
            ):(
                matrix.columns.map(function(column){
                    return html.col({'class':JSON.stringify(array_combine(matrix.columnVariables,column.titles))});
                })
            )
        )
    ):null;
    return [].concat(lineVariablesPart,columnVariablesPart);
};

function labelVariableValues(matrix, varName, varValue){
    return (((((matrix.vars||{})[varName]||{}).values)||{})[varValue]||{}).label||varValue;
}

function flatArray(arrays){
    return [].concat.apply([], arrays);
}

Tabulator.prototype.toCellColumnHeader = function toCellColumnHeader(titleCellAttrs, varName, labelValue, varValue){
    return html.th(titleCellAttrs, labelValue);
}

Tabulator.prototype.tHeadPart = function tHeadPart(matrix){
    var tabulator = this;
    if(!matrix.columnVariables) return null;
    function labelVariable(varName){
        return ((matrix.vars||{})[varName]||{}).label||varName;
    }
    var varObj=matrix.columns.length>0?{'class':'variable', colspan:matrix.columns.length}:{'class':'variable', rowspan:2};
    return html.thead(
        [
            html.tr(
                matrix.lineVariables.map(function(varName){
                    var columnVariablesLength = matrix.columnVariables.length>0?matrix.columnVariables.length:1;
                    return html.th({'class':'variable', 'rowspan':2*columnVariablesLength}, labelVariable(varName));
                }).concat(
                    html.th(varObj,labelVariable(matrix.columnVariables[0])||matrix.oneColumnTitle)
                )
            )
        ].concat(flatArray(matrix.columnVariables.map(function(columnVariable,iColumnVariable){
            var lineTitles=[];
            var lineVariables=[];
            var previousValuesUptoThisRowJson="none";
            var colspan=1;
            function updateColspan(){
                if(colspan>1){
                    titleCellAttrs.colspan=colspan;
                    variableCellAttrs.colspan=colspan;
                }
            }
            for(var i=0; i<matrix.columns.length; i++){
                var actualValues=matrix.columns[i].titles;
                var actualValuesUptoThisRow=actualValues.slice(0,iColumnVariable+1);
                var actualValuesUptoThisRowJson=JSON.stringify(actualValuesUptoThisRow);
                if(actualValuesUptoThisRowJson!=previousValuesUptoThisRowJson){
                    updateColspan();
                    var varName = matrix.columnVariables[iColumnVariable];
                    var varValue = actualValues[iColumnVariable];
                    var labelValue = labelVariableValues(matrix, varName,varValue);
                    var titleCellAttrs={'class':'var_'+varName};
                    lineTitles.push(tabulator.toCellColumnHeader(titleCellAttrs, varName, labelValue, varValue));
                    if(iColumnVariable+1<matrix.columnVariables.length){
                        var variableCellAttrs={'class':'variable'};
                        lineVariables.push(html.th(variableCellAttrs, labelVariable(matrix.columnVariables[iColumnVariable+1])));
                    }
                    previousValuesUptoThisRowJson=actualValuesUptoThisRowJson;
                    colspan=0;
                }
                colspan++;
            }
            updateColspan();
            if(iColumnVariable+1<matrix.columnVariables.length){
                //console.log("lineTitles: ", JSON.stringify(lineTitles));
                //console.log("lineVariables: ", JSON.stringify(lineVariables));
                return [html.tr(lineTitles), html.tr(lineVariables)];
            }else{
                //console.log("lineTitles: ", JSON.stringify(lineTitles));
                return [html.tr(lineTitles)];
            }
        }))
    ));
};


Tabulator.prototype.defaultShowAttribute='show';

Tabulator.prototype.toCellTable=function(cell, varValues){
    return cell instanceof Object?html.td(
        likeAr(cell).filter(function(value,key){return /-/.test(key);}).plain(),
        cell[this.defaultShowAttribute]
    ):html.td(cell);
};

Tabulator.prototype.tBodyPart = function tBodyPart(matrix){
    var trList=[];
    var previousLineTitles=[];
    var titleLineAttrs=[];    
    for(var i=0; i<matrix.lines.length;i++){
        var actualLine=matrix.lines[i];
        var actualLineTitles=actualLine.titles;
        var thListActualLine=[];
        var actualLineCells=matrix.lines[i].cells;
        var lineVarValues=matrix.lineVariables && actualLine.titles ? 
            likeAr.toPlainObject(matrix.lineVariables, actualLine.titles) : 
            {};
        var td=actualLineCells.map(function(cell, j){
            var columnVarValues=matrix.columnVariables && matrix.columns &&  matrix.columns[j] ? 
                likeAr.toPlainObject(matrix.columnVariables, matrix.columns[j].titles) :
                {};
            return this.toCellTable(cell, bg.changing(lineVarValues,columnVarValues));
        },this);
        if(actualLineTitles){
            for(var j=0;j<actualLineTitles.length;j++){
                var varName=(matrix.lineVariables||{})[j]||null;
                var actualLineTitlesUpToNow=actualLineTitles.slice(0,j+1);
                var previousLineTitlesUpToNow=previousLineTitles.slice(0,j+1);
                if(JSON.stringify(actualLineTitlesUpToNow)!=JSON.stringify(previousLineTitlesUpToNow)){
                    titleLineAttrs[j]={};
                    if((matrix.lineVariables||{})[j]){
                        titleLineAttrs[j]['class']='var_'+(matrix.lineVariables||{})[j];
                    }
                    thListActualLine.push(html.th(titleLineAttrs[j],labelVariableValues(matrix, varName,actualLineTitles[j])));
                }else{
                    titleLineAttrs[j].rowspan=(titleLineAttrs[j].rowspan||1)+1;
                }
            }
            previousLineTitles=actualLineTitles;
        }
        trList.push(html.tr(thListActualLine.concat(td)));
    }
    return html.tbody(trList);
};
     
Tabulator.prototype.toExcel = function toExcel(tableElem, params){
    var type = 'xlsx'
    var wb = XLSX.utils.table_to_book(tableElem, {
        sheet: "Tabulado"
    });

    // usar aoa_to_sheet pasandole una matriz para que lo exporte solo
    wb.SheetNames.push('Ficha');
    var ws;
    ws = {B2: {t:'s', v:'Fecha:'}, C2: {t:'s', v: new Date(Date.now()).toLocaleString()},
            B3: {t:'s', v:'Indicador:'}, C3:{t:'s',v:params.filename},
            B4: {t:'s', v:'Enlace:'}, C4:{t:'s',v:window.location.href},
    };

    if (params.username){
        ws.B1 = {t:'s', v:'usuario'};
        ws.C1 = {t:'s',v:params.username};
    }
    ws['!ref'] = 'A1:D50';
    wb.Sheets['Ficha'] = ws;

    var wbout = XLSX.write(wb, {
        bookType: type,
        bookSST: true,
        type: 'binary'
    });
    var fname = params.filename + '.' + type;
    try {
        var blob = new Blob([s2ab(wbout)], {
            type: "application/octet-stream"
        });
        saveAs(blob, fname);
    } catch (e) {
        if (typeof console != 'undefined')
            console.log(e, wbout);
    }
    return wbout;
}

function s2ab(s) {
    if (typeof ArrayBuffer !== 'undefined') {
        var buf = new ArrayBuffer(s.length);
        var view = new Uint8Array(buf);
        for (var i = 0; i != s.length; ++i)
            view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    } else {
        var buf = new Array(s.length);
        for (var i = 0; i != s.length; ++i)
            buf[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    }
}

Tabulator.prototype.toHtmlTable = function toHtmlTable(matrix){
    this.controls(matrix);
    return html.table({class:'tabulator-table'},[].concat(
        this.captionPart(matrix),
        this.colGroups(matrix),
        this.tHeadPart(matrix),
        this.tBodyPart(matrix)
    ));
};

Tabulator.prototype.controls=function controls(matrix){
    var  matrixLineVariables=matrix.lineVariables;
    var  matrixLines=matrix.lines;
    var  matrixColumnVariables=matrix.columnVariables;
    var  matrixColumns=matrix.columns;
    if(matrixColumnVariables && matrixColumns /*&& matrixColumns.length*/){
        variableExistanceAndQuantity(matrixColumnVariables,matrixColumns,'columnVariables');
    }
    if(matrixLineVariables && matrixLines /*&& matrixLines.length*/){
        variableExistanceAndQuantity(matrixLineVariables,matrixLines,'lineVariables');
    }
    if(matrixColumns && matrixLines){
        cellExistanceAndQuantity(matrixColumns,matrixLines,'cells');
    }
    function variableExistanceAndQuantity(arrVar,objVar,nameArrVar){
        var varName=nameArrVar=='columnVariables'?'column ':'line ';
        var variablesQuantity=arrVar.length;
        for(var i=0;i<objVar.length;i++){
            if(objVar[i].titles){
                if(objVar[i].titles.length!=variablesQuantity){
                    throw new Error(varName+i+' has '+objVar[i].titles.length+' values but '+nameArrVar+' has '+variablesQuantity);
                }
            }else{
                throw new Error('there are no titles in '+ varName +i+' but '+nameArrVar+ ' exists');
            }
        }
    }
 
    function cellExistanceAndQuantity(matrixColumns,matrixLines,varName){
        var columnQuantity=matrixColumns.length||1;
        for(var i=0;i<matrixLines.length;i++){
            if(matrixLines[i].cells.length>0){
                if(matrixLines[i].cells.length!=columnQuantity){
                    throw new Error('line '+i+' has '+matrixLines[i].cells.length+' cells but columns has '+columnQuantity);
                }
            }else{
                throw new Error('there are no cells in line '+i+' but columns exists'); 
            }
        }
    }
};

Tabulator.prototype.controlsJoin=function controlsJoin(matrixList){
var firstMatrixListLinesLength = matrixList[0].lines.length;
if (!matrixList.every(function(element){return element.lines.length == firstMatrixListLinesLength})){
    throw new Error('line.length does not match in all matrix');
}
var firstMatrixListLine = matrixList[0].lines;
var JsonTitlesFirstMatrixListLine = firstMatrixListLine.map(function(obj){return JSON.stringify(obj.titles)});
if (!matrixList.every(
      function(element,index){
        return element.lines.every(
           function(elemento,indice){
             //return JSON.stringify(elemento.titles) == JSON.stringify(firstMatrixListLine[indice].titles)
             //console.log('Titulos ',JsonTitlesFirstMatrixListLine);
             //console.log('Titulos ',JSON.stringify(elemento.titles));
             return JsonTitlesFirstMatrixListLine.indexOf(JSON.stringify(elemento.titles)) > -1;
           })
      })
    ){
        throw new Error('line titles does not match in all matrix');
     }
}

//matrix.z is an array of matrizes (one per each category of z present in datum.list)
Tabulator.prototype.getZMatrices = function getZMatrices(datumBase, zVar) {
    //get z categories 
    var zVarCategories = datumBase.list.map(function (item) {
        return item[zVar.name];
    });
    //remove duplicates
    zVarCategories = zVarCategories.filter(function (v, i, self) {
        return i == self.indexOf(v);
    });
    //remove total category
    if (zVarCategories.indexOf(null) >= 0) {zVarCategories.splice(zVarCategories.indexOf(null),1);}
    //one matrix for each category
    var that = this;
    var z = zVarCategories.map(function (cat) {
        var datumCopy = bg.changing({}, datumBase);
        // keep only all rows where zVar has this category
        datumCopy.list = datumCopy.list.filter(function (listItem) {
            return listItem[zVar.name] == cat;
        });
        var aMatrix = that.getBaseMatrix(datumCopy);
        aMatrix.caption = zVar.values? zVar.values[cat].label: cat;
        return aMatrix;
    });
    return z;
}

Tabulator.prototype.toMatrix = function toMatrix(datum){
    //Managing only one z var
    var datumBase = bg.changing({}, datum);
    var zVar = (datumBase.vars.filter(function(v){ return v.isZ}))[0];
    datumBase.vars.splice(datumBase.vars.indexOf(zVar),1)
    var matrix = this.getBaseMatrix(datum);//classic matrix construction
    //For the base matrix case using copy instead of reference to avoid "typeerror converting circular structure to json" in JSON.stringify
    matrix.z = zVar? this.getZMatrices(datumBase, zVar): [bg.changing({},matrix)];
    return matrix;
};

Tabulator.prototype.getBaseMatrix = function getBaseMatrix(datum){
    var places={
        left:{place:'lineVariables'},
        top:{place:'columnVariables'},
        data:{place:'dataVariables'},
    };
    var matrix={lineVariables:[],columnVariables:[], dataVariables:[], columns:[], lines:[], vars:{}};
    for(var i=0; i<datum.vars.length;i++){
        var cadaVar=datum.vars[i];
        matrix[places[cadaVar.place].place].push(cadaVar.name);
        matrix.vars[cadaVar.name] = cadaVar;
    }
    matrix.oneColumnTitle=datum.oneColumnTitle;
    var vistosColumnVariables={};
    var vistosLineVariables={};
    for(var iList=0; iList<datum.list.length; iList++){
        var iCell;
        var iLine;
        var cadaList=datum.list[iList];
        iCell=matrix.columnVariables.length;
        if(iCell>0){ 
            var cadaDatoTop=[];
            cadaDatoTop=matrix.columnVariables.map(function(columnVar){ return cadaList[columnVar]});
            var jsonCadaDatoTop=JSON.stringify(cadaDatoTop);
            if (!vistosColumnVariables[jsonCadaDatoTop]){
                iCell=matrix.columns.push({titles:cadaDatoTop})-1;
                vistosColumnVariables[jsonCadaDatoTop]={index: iCell};
            }else{
                iCell=vistosColumnVariables[jsonCadaDatoTop].index;
            }
        }
        var cadaDatoLeft=[];
        var cadaDatoData=[];                
        for(var j=0; j<matrix.lineVariables.length;j++){
            cadaDatoLeft.push(cadaList[matrix.lineVariables[j]]);
            cadaDatoData.push(cadaList[matrix.dataVariables[j]]);
        }        
        var jsonCadaDatoLeft=JSON.stringify(cadaDatoLeft);
        if (vistosLineVariables[jsonCadaDatoLeft]){
            iLine=vistosLineVariables[jsonCadaDatoLeft].index;
        }else{
            iLine=matrix.lines.push({titles:cadaDatoLeft, cells:[]})-1;
            vistosLineVariables[jsonCadaDatoLeft]={index: iLine};            
        }
        var newCell={};
        if(datum.showFunction){
            newCell.display=datum.showFunction(cadaList);
        }
        for(var k=0; k<matrix.dataVariables.length; k++){
            var nombreVariable=matrix.dataVariables[k];
            newCell[nombreVariable]=cadaList[nombreVariable];
        }
        matrix.lines[iLine].cells[iCell]=newCell;
    }
    for(var l=0; l<matrix.lines.length; l++){
        for(var m=0; m<matrix.columns.length; m++){
            if (matrix.lines[l].cells[m]===undefined){
                matrix.lines[l].cells[m]=null;
            }
        }
    }
    return matrix;
}

Tabulator.prototype.matrixJoin = function matrixJoin(matrixList){
    this.controlsJoin(matrixList);
    
    var matrix={columnGroups:[], lineVariables:[], lines:[], vars:{}};
    var captions = matrixList.map(function(obj){return obj.caption});
    matrix.caption = captions.join(this.matrixJoin.captionSeparator);
    
    var reordererLines = [];
    matrixList.forEach(function(matrix){
        var lines = matrix.lines;
        var indexedLines = {};
        lines.forEach(function (line){
            var ind = JSON.stringify(line.titles);
            indexedLines[ind] = line.cells;
        });
        reordererLines.push(indexedLines);
    });
    //console.log("reordererLines: ", reordererLines);

    matrix.columnGroups = matrixList.map(function(obj){
        var cGroup={};
        cGroup.columnVariables=obj.columnVariables;
        cGroup.columns=obj.columns;
        return cGroup;
    });
    matrix.lineVariables = matrixList[0].lineVariables;
    matrix.lines = matrixList[0].lines;
    matrix.vars = matrixList[0].vars;
    // primer paso construir un arreglo indexado de líneas (indexado por título)
    // reordererLines[i_matrix][json_title] = line
    // segundo paso igual pero iterando sobre la matriz 0 (original) y buscando por índice (si un índice no está lanza excepción)
    matrixList.forEach(function(matrixToAdd, i_matrixToAdd){
        if (i_matrixToAdd>0){
            matrix.lines.forEach(function(line,ind){
                var lineToAdd = reordererLines[i_matrixToAdd][JSON.stringify(line.titles)];
                matrix.lines[ind].cells = matrix.lines[ind].cells.concat(lineToAdd);
            });
            for (var key in matrixToAdd.vars){
                matrix.vars[key] = matrixToAdd.vars[key];
            }
        }
    });
    return matrix;
}

Tabulator.prototype.matrixJoin.captionSeparator = ', ';

return Tabulator;

});

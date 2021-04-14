
var expect = require('expect.js');

var Tabulator = require('../tabulator.js');

describe('tabulator', function(){
    var tabulator;
    beforeEach(function(){
        tabulator=new Tabulator();
    });
    describe('toMatrix with datum to produce a 3x3 incomplete matrix', function(){
        var datum;
        beforeEach(function(){
            datum={
                list:[
                    {zone:'totalZ', area:'total,A',sex:'both', number:19000,total:19000},
                    {zone:'totalZ', area:'total,A',sex:'masc', number:9880, total:19000},
                    {zone:'zone 1', area:'area 1', sex:'masc', number:5110, total:10000},
                    {zone:'zone 1', area:'area 2', sex:'fem' , number:4365, total: 9000},
                    {zone:'zone 1', area:'area 1', sex:'fem' , number:4890, total:10000},
                    {zone:'zone 1', area:'area 2', sex:'masc', number:4635, total: 9000},
                    {zone:'zone 1', area:'area 2', sex:'both' ,number:9000, total: 9000}
                ],
                vars:[
                    {name: 'zone'  , place: 'left'},
                    {name: 'area'  , place: 'left'},
                    {name: 'sex'   , place: 'top' },
                    {name: 'number', place: 'data', another_data:{all:true}},
                    {name: 'total' , place: 'data'}
                ],
                showFunction:function(data){
                    return data.number/data.total*100
                }
            };
        });
        it('shoud obtain z pointer',function(){
            var obtain=tabulator.toMatrix(datum);
            expect(obtain.z).to.be.ok();
            expect(obtain.z).to.be.an(Array);
            expect(obtain.z.length).to.be.eql(1);
            var zObtained = obtain.z;
            delete obtain.z;
            expect(zObtained[0]).to.be.eql(obtain);
        });
        it('shoud obtain the variables',function(){
            var obtain=tabulator.toMatrix(datum);
            expect(obtain.lineVariables).to.eql(['zone','area']);
            expect(obtain.columnVariables).to.eql(['sex']);
            expect(obtain.vars).not.to.be.an(Array);
        });
        it('shoud obtain the data for the column titles',function(){
            var obtain=tabulator.toMatrix(datum);
            expect(obtain.columns).to.eql([
                {titles:['both']},
                {titles:['masc']},
                {titles:['fem' ]}
            ]);
        });
        it('shoud obtain the data and the titles of each line',function(){
            var countCall2toCell=0;
            tabulator.toCell=function(row){
                countCall2toCell++;
                return {display:row.number/row.total, numerator:row.number, denominator:row.total};
            }
            var obtain=tabulator.toMatrix(datum);
            expect(obtain.lines).to.eql([
                {
                    titles:['totalZ', 'total,A'],
                    cells:[
                        {display:100  , number:19000,total:19000},
                        {display:52   , number: 9880,total:19000},
                        null
                    ]
                },{
                    titles:['zone 1', 'area 1'],
                    cells:[
                        null,
                        {display:51.1 , number:5110, total:10000},
                        {display:48.9 , number:4890, total:10000}
                    ]
                },{
                    titles:['zone 1', 'area 2'],
                    cells:[
                        {display:100  , number:9000, total: 9000},
                        {display:51.5 , number:4635, total: 9000},
                        {display:48.5 , number:4365, total: 9000}
                    ]
                }
            ]);
        });
        it('shoud obtain vars #1',function(){
            var obtain=tabulator.toMatrix(datum);
            expect(obtain.vars).to.eql({
                zone  :{name: 'zone'  , place: 'left'},
                area  :{name: 'area'  , place: 'left'},
                sex   :{name: 'sex'   , place: 'top' },
                number:{name: 'number', place: 'data', another_data:{all:true}},
                total :{name: 'total' , place: 'data'}
            });
        });
        it('shoud obtain cells without showFunction',function(){
            delete datum.showFunction;
            var obtain=tabulator.toMatrix(datum);
            expect(obtain.lines[0].cells[0]).to.eql(
                {number:19000,total:19000}
            );
        });
        it('should obtain the titles with more than one column',function(){
            var datum2=datum;
            datum2.vars=datum2.vars.map(function(varElem,i){
                varElem.place= varElem.place=='left'?'top':(varElem.place=='top'?'left':varElem.place);
                return varElem;
            }); 
            var obtain=tabulator.toMatrix(datum2);
            expect(obtain.columns).to.eql([
                {titles:['totalZ', 'total,A']},
                {titles:['zone 1', 'area 1']},
                {titles:['zone 1', 'area 2']}
            ]);
        });
        it.skip('should has z although it does not has its', function(){
            expect(obtain.z).to.eql([obtain]);
        });
    });
    describe.skip('toMatrix with datum to undertand z', function(){
        var datum;
        beforeEach(function(){
            datum={
                list:[
                    {planet:'earth',zone:'totalZ', area:'total,A',sex:'both', number:19000,total:19000},
                    {planet:'earth',zone:'totalZ', area:'total,A',sex:'masc', number:9880, total:19000},
                    {planet:'earth',zone:'zone 1', area:'area 1', sex:'masc', number:5110, total:10000},
                    {planet:'earth',zone:'zone 1', area:'area 2', sex:'fem' , number:4365, total: 9000},
                    {planet:'earth',zone:'zone 1', area:'area 1', sex:'fem' , number:4890, total:10000},
                    {planet:'earth',zone:'zone 1', area:'area 2', sex:'masc', number:4635, total: 9000},
                    {planet:'earth',zone:'zone 1', area:'area 2', sex:'both' ,number:9000, total: 9000},
                    {planet:'mars' ,zone:'totalZ', area:'total,A',sex:'masc', number:988,  total:1900 },
                    {planet:'mars' ,zone:'zone 1', area:'area 1', sex:'masc', number:511,  total:1000 },
                    {planet:'mars' ,zone:'zone 1', area:'area 2', sex:'fem' , number:436,  total: 900 },
                    {planet:'mars' ,zone:'zone 1', area:'area 1', sex:'fem' , number:489,  total:1000 },
                    {planet:'mars' ,zone:'zone 1', area:'area 2', sex:'masc', number:463,  total: 900 }
                ],
                vars:[
                    {name: 'planet', place: 'z'   },
                    {name: 'zone'  , place: 'left'},
                    {name: 'area'  , place: 'left'},
                    {name: 'sex'   , place: 'top' },
                    {name: 'number', place: 'data', another_data:{all:true}},
                    {name: 'total' , place: 'data'}
                ],
                showFunction:function(data){
                    return data.number/data.total*100
                }
            };
        });
        it('shoud obtain the variables',function(){
            var obtain=tabulator.toMatrix(datum);
            expect(obtain.zVariables).to.eql(['planet']);
            expect(obtain.lineVariables).to.eql(['zone', 'area']);
            expect(obtain.columnVariables).to.eql(['sex']);
            expect(obtain.vars).not.to.be.an(Array);
        });
        it('shoud obtain the data for z titles',function(){
            var obtain=tabulator.toMatrix(datum);
            expect(obtain.z.length).to.eql(2);
            expect(obtain.z[0].zValues).to.eql(['earth']);
            expect(obtain.z[1].zValues).to.eql(['mars']);
        });
        it('shoud obtain the data for the column titles',function(){
            var obtain=tabulator.toMatrix(datum);
            expect(obtain.z[0].columns).to.eql([
                {titles:['both']},
                {titles:['masc']},
                {titles:['fem' ]}
            ]);
            expect(obtain.z[1].columns).to.eql([
                {titles:['masc']},
                {titles:['fem' ]}
            ]);
        });
        it('shoud obtain the data and the titles of each line',function(){
            var countCall2toCell=0;
            tabulator.toCell=function(row){
                countCall2toCell++;
                return {display:row.number/row.total, numerator:row.number, denominator:row.total};
            }
            var obtain=tabulator.toMatrix(datum);
            expect(obtain.z[0].lines).to.eql([
                {
                    titles:['totalZ', 'total,A'],
                    cells:[
                        {display:100  , number:19000,total:19000},
                        {display:52   , number: 9880,total:19000},
                        null
                    ]
                },{
                    titles:['zone 1', 'area 1'],
                    cells:[
                        null,
                        {display:51.1 , number:5110, total:10000},
                        {display:48.9 , number:4890, total:10000}
                    ]
                },{
                    titles:['zone 1', 'area 2'],
                    cells:[
                        {display:100  , number:9000, total: 9000},
                        {display:51.5 , number:4635, total: 9000},
                        {display:48.5 , number:4365, total: 9000}
                    ]
                }
            ]);
            expect(obtain.z[1].lines).to.eql([
                {
                    titles:['totalZ', 'total,A'],
                    cells:[
                        {display:52   , number: 988,total:1900},
                        null
                    ]
                },{
                    titles:['zone 1', 'area 1'],
                    cells:[
                        {display:51.1 , number:511, total:1000},
                        {display:48.9 , number:489, total:1000}
                    ]
                },{
                    titles:['zone 1', 'area 2'],
                    cells:[
                        {display:51.5 , number:463, total: 900},
                        {display:48.5 , number:436, total: 900}
                    ]
                }
            ]);
        });
        it('shoud obtain vars #1',function(){
            var obtain=tabulator.toMatrix(datum);
            expect(obtain.vars).to.eql({
                zone  :{name: 'zone'  , place: 'left'},
                area  :{name: 'area'  , place: 'left'},
                sex   :{name: 'sex'   , place: 'top' },
                number:{name: 'number', place: 'data', another_data:{all:true}},
                total :{name: 'total' , place: 'data'}
            });
        });
    });
    describe('toMatrix with var z to produce z array correctly', function(){
        var datum;
        beforeEach(function(){
            datum={
                list:[
                    {zone:'totalZ', area:'total,A',sex:'both', number:19000,total:19000},
                    {zone:'totalZ', area:'total,A',sex:'masc', number:9880, total:19000},
                    {zone:'zone 1', area:'area 1', sex:'masc', number:5110, total:10000},
                    {zone:'zone 1', area:'area 2', sex:'fem' , number:4365, total: 9000},
                    {zone:'zone 1', area:'area 1', sex:'fem' , number:4890, total:10000},
                    {zone:'zone 1', area:'area 2', sex:'masc', number:4635, total: 9000},
                    {zone:'zone 1', area:'area 2', sex:'both' ,number:9000, total: 9000}
                ],
                vars:[
                    {name: 'zone'  , place: 'left'},
                    {name: 'area'  , place: 'left', isZ: true}, //z place will generate one matrix per each z variable's category (present on datum list)
                    {name: 'sex'   , place: 'top' },
                    {name: 'number', place: 'data', another_data:{all:true}},
                    {name: 'total' , place: 'data'}
                ],
                showFunction:function(data){
                    return data.number/data.total*100
                }
            };
        });
        it('shoud obtain z pointer',function(){
            var obtain=tabulator.toMatrix(datum);
            expect(obtain.z).to.be.ok();
            expect(obtain.z).to.be.an(Array);
            expect(obtain.z[0]).not.to.be.eql(obtain); //here z is an array
            expect(obtain.z.length).to.be.eql(3);//exist 3 diferent categories ["total,A", "area 1", "area 2"]
        });
        it("should have variables inside z matrices",function(){
            var obtain=tabulator.toMatrix(datum);
            expect(obtain.lineVariables).to.be.ok();
            expect(obtain.columnVariables).to.be.ok();
            expect(obtain.columns).to.be.ok();
            expect(obtain.vars).to.be.ok();
            expect(obtain.lines).to.be.ok();
        });
        it('shoud obtain the variables in z matrices',function(){
            var obtain=tabulator.toMatrix(datum);
            obtain.z.forEach(element => {
                expect(element.lineVariables).to.eql(['zone']);
                expect(element.columnVariables).to.eql(['sex']);
                expect(element.vars).not.to.be.an(Array);
            });
        });
        it('shoud obtain the data for the column titles in z matrices',function(){
            var obtain=tabulator.toMatrix(datum);
            expect(obtain.z[0].columns).to.eql([
                {titles:['both']},
                {titles:['masc']},
            ]);
            expect(obtain.z[1].columns).to.eql([
                {titles:['masc']},
                {titles:['fem' ]}
            ]);
            expect(obtain.z[2].columns).to.eql([
                {titles:['fem' ]},
                {titles:['masc']},
                {titles:['both']},
            ]);
        });
        it('shoud obtain the data and the titles of each line in z matrices',function(){
            var countCall2toCell=0;
            tabulator.toCell=function(row){
                countCall2toCell++;
                return {display:row.number/row.total, numerator:row.number, denominator:row.total};
            }
            var obtain=tabulator.toMatrix(datum);
            expect(obtain.z[0].lines).to.eql([
                {
                    titles:['totalZ'],
                    cells:[
                        {display:100  , number:19000,total:19000},
                        {display:52   , number: 9880,total:19000}
                    ]
                }
            ]);
            expect(obtain.z[1].lines).to.eql([
                {
                    titles:['zone 1'],
                    cells:[
                        {display:51.1 , number:5110, total:10000},
                        {display:48.9 , number:4890, total:10000}
                    ]
                }
            ]);
            expect(obtain.z[2].lines).to.eql([
                {
                    titles:['zone 1'],
                    cells:[
                        {display:48.5 , number:4365, total: 9000},
                        {display:51.5 , number:4635, total: 9000},
                        {display:100  , number:9000, total: 9000},
                    ]
                }
            ]);
        });
        it('shoud obtain vars #1 in z matrices',function(){
            var obtain=tabulator.toMatrix(datum);
            obtain.z.forEach(element => {
                expect(element.vars).to.eql({
                    zone  :{name: 'zone'  , place: 'left'},
                    sex   :{name: 'sex'   , place: 'top' },
                    number:{name: 'number', place: 'data', another_data:{all:true}},
                    total :{name: 'total' , place: 'data'}
                });
            });
        });
        it('shoud obtain cells without showFunction in z matrices',function(){
            delete datum.showFunction;
            var obtain=tabulator.toMatrix(datum);
            expect(obtain.z[0].lines[0].cells[0]).to.eql(
                {number:19000,total:19000}
            );
            expect(obtain.z[1].lines[0].cells[0]).to.eql(
                {number:5110,total:10000}
            );
            expect(obtain.z[2].lines[0].cells[0]).to.eql(
                {number:4365,total:9000}
            );
        });
        it('should obtain the titles with more than one column in z matrices',function(){
            var datum2=datum;
            datum2.vars=datum2.vars.map(function(varElem,i){
                varElem.place= varElem.place=='left'?'top':(varElem.place=='top'?'left':varElem.place);
                return varElem;
            }); 
            var obtain=tabulator.toMatrix(datum2);
            expect(obtain.z[0].columns).to.eql([
                {titles:['totalZ']},
            ]);
            expect(obtain.z[1].columns).to.eql([
                {titles:['zone 1']},
            ]);
            expect(obtain.z[2].columns).to.eql([
                {titles:['zone 1']},
            ]);
        });
        it('shoud obtain the variables',function(){
            var obtain=tabulator.toMatrix(datum);
            expect(obtain.lineVariables).to.eql(['zone','area']);
            expect(obtain.columnVariables).to.eql(['sex']);
            expect(obtain.vars).not.to.be.an(Array);
        });
        it('shoud obtain the data for the column titles',function(){
            var obtain=tabulator.toMatrix(datum);
            expect(obtain.columns).to.eql([
                {titles:['both']},
                {titles:['masc']},
                {titles:['fem' ]}
            ]);
        });
        it('shoud obtain the data and the titles of each line',function(){
            var countCall2toCell=0;
            tabulator.toCell=function(row){
                countCall2toCell++;
                return {display:row.number/row.total, numerator:row.number, denominator:row.total};
            }
            var obtain=tabulator.toMatrix(datum);
            expect(obtain.lines).to.eql([
                {
                    titles:['totalZ', 'total,A'],
                    cells:[
                        {display:100  , number:19000,total:19000},
                        {display:52   , number: 9880,total:19000},
                        null
                    ]
                },{
                    titles:['zone 1', 'area 1'],
                    cells:[
                        null,
                        {display:51.1 , number:5110, total:10000},
                        {display:48.9 , number:4890, total:10000}
                    ]
                },{
                    titles:['zone 1', 'area 2'],
                    cells:[
                        {display:100  , number:9000, total: 9000},
                        {display:51.5 , number:4635, total: 9000},
                        {display:48.5 , number:4365, total: 9000}
                    ]
                }
            ]);
        });
        it('shoud obtain vars #1',function(){
            var obtain=tabulator.toMatrix(datum);
            expect(obtain.vars).to.eql({
                zone  :{name: 'zone'  , place: 'left'},
                area  :{name: 'area'  , place: 'left', isZ: true},
                sex   :{name: 'sex'   , place: 'top' },
                number:{name: 'number', place: 'data', another_data:{all:true}},
                total :{name: 'total' , place: 'data'}
            });
        });
        it('shoud obtain cells without showFunction',function(){
            delete datum.showFunction;
            var obtain=tabulator.toMatrix(datum);
            expect(obtain.lines[0].cells[0]).to.eql(
                {number:19000,total:19000}
            );
        });
        it('should obtain the titles with more than one column',function(){
            var datum2=datum;
            datum2.vars=datum2.vars.map(function(varElem,i){
                varElem.place= varElem.place=='left'?'top':(varElem.place=='top'?'left':varElem.place);
                return varElem;
            }); 
            var obtain=tabulator.toMatrix(datum2);
            expect(obtain.columns).to.eql([
                {titles:['totalZ', 'total,A']},
                {titles:['zone 1', 'area 1']},
                {titles:['zone 1', 'area 2']}
            ]);
        });
    });
    describe('toMatrix with datum to produce 1d matrix (with no top variable) #5', function(){
        var datum;
        beforeEach(function(){
            datum={
                list:[
                    {zone:'totalZ', area:'total,A', number:19000,total:19000},
                    {zone:'zone 1', area:'area 1',  number:5110, total:10000},
                    {zone:'zone 1', area:'area 2',  number:4365, total: 9000}
                ],
                vars:[
                    {name: 'zone'  , place: 'left'},
                    {name: 'area'  , place: 'left'},
                    {name: 'number', place: 'data', another_data:{all:true}},
                    {name: 'total' , place: 'data'}
                ],
                showFunction:function(data){
                    return data.number/data.total*100
                },
                oneColumnTitle:'the unique title'
            };
        });
        it('shoud obtain z pointer',function(){
            var obtain=tabulator.toMatrix(datum);
            expect(obtain.z).to.be.ok();
            expect(obtain.z).to.be.an(Array);
            expect(obtain.z.length).to.be.eql(1);
            var zObtained = obtain.z;
            delete obtain.z;
            expect(zObtained[0]).to.be.eql(obtain);
        });
        it('shoud obtain the variables',function(){
            var obtain=tabulator.toMatrix(datum);
            expect(obtain.lineVariables).to.eql(['zone','area']);
            expect(obtain.columnVariables).to.eql([]);
            expect(obtain.oneColumnTitle).to.eql('the unique title');
        });
        it('shoud obtain the data for the column titles',function(){
            var obtain=tabulator.toMatrix(datum);
            expect(obtain.columns).to.eql([]);
        });
        it('shoud obtain the data and the titles of each line',function(){
            var countCall2toCell=0;
            tabulator.toCell=function(row){
                countCall2toCell++;
                return {display:row.number/row.total, numerator:row.number, denominator:row.total};
            }
            var obtain=tabulator.toMatrix(datum);
            expect(obtain.lines).to.eql([
                {
                    titles:['totalZ', 'total,A'],
                    cells:[
                        {display:100  , number:19000,total:19000},
                    ]
                },{
                    titles:['zone 1', 'area 1'],
                    cells:[
                        {display:51.1 , number:5110, total:10000},
                    ]
                },{
                    titles:['zone 1', 'area 2'],
                    cells:[
                        {display:48.5 , number:4365, total: 9000}
                    ]
                }
            ]);
        });
        it('shoud obtain vars #1',function(){
            var obtain=tabulator.toMatrix(datum);
            expect(obtain.vars).to.eql({
                zone  :{name: 'zone'  , place: 'left'},
                area  :{name: 'area'  , place: 'left'},
                number:{name: 'number', place: 'data', another_data:{all:true}},
                total :{name: 'total' , place: 'data'}
            });
        });
        it('shoud obtain cells without showFunction',function(){
            delete datum.showFunction;
            var obtain=tabulator.toMatrix(datum);
            expect(obtain.lines[0].cells[0]).to.eql(
                {number:19000,total:19000}
            );
        });
    })
});

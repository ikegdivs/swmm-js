// Parser for SWMM INP files
d3.inp = function() {
    function inp() {
    }

    inp.parse = function(text) {
	var regex = {
	    section: /^\s*\[\s*([^\]]*)\s*\].*$/,
	    value: /\s*([^\s]+)([^;]*).*$/,
	    comment: /^\s*;.*$/
	},
	parser = {
	    COORDINATES: function(section, key, line) {
		var m = line.match(/\s*([0-9\.]+)\s+([0-9\.]+)/);
		if (m && m.length && 3 === m.length)
		    section[key] = {x: parseFloat(m[1]), y: parseFloat(m[2])};
	    },
	    Polygons: function(section, key, line) {
		var m = line.match(/\s*([0-9\.]+)\s+([0-9\.]+)/);
                if (!section[key]) 
                    section[key] = [];
                if (Object.keys(section[key]).length === 0)
                    section[key] = [];
		if (m && m.length && 3 === m.length) {
                    var coord = {x: parseFloat(m[1]), y: parseFloat(m[2])};
		    section[key].push(coord);
                }
	    },
	    LABELS: function(section, key, line) {
		var m = line.match(/\s+([[0-9\.]+)\s+"([^"]+)"/);
		if (m && m.length && 3 === m.length)
		    section[section.length] = {x: parseFloat(key), y: parseFloat(m[1]), label: m[2]};
	    },
	    CONDUITS: function(section, key, line) {
		var m = line.match(/\s*([^\s;]+)\s+([^\s;]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([^;]).*/);
		if (m && m.length && (8 === m.length || 9 === m.length)) {
		    section[key] = {NODE1: m[1], NODE2: m[2], 
			LENGTH: parseFloat(m[3]), MANNING: parseFloat(m[4]),
			IH: parseFloat(m[5]), OH: parseFloat(m[6]), IF: m[7]};
		}
	    },
	    SUBCATCHMENTS: function(section, key, line) {
		var m = line.match(/\s*([^\s;]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([^;]).*/);
		if (m && m.length && 9 === m.length) {
		    section[key] = {RAINGAGE: m[1], OUTLET: parseFloat(m[2]), 
			TOTAL: parseFloat(m[3]), IMPERV: parseFloat(m[4]),
			WIDTH: parseFloat(m[5]), SLOPE: parseFloat(m[6]), LENGTH: parseFloat(m[7]), SNOW: m[8]};
		}
	    },
	    SUBAREAS: function(section, key, line) {
		var m = line.match(/\s*([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([^;])\s+([^;]).*/);
		if (m && m.length && 8 === m.length) {
		    section[key] = {NIMPERV: parseFloat(m[1]), NPERV: parseFloat(m[2]), 
			SIMPERV: parseFloat(m[3]), SPERV: parseFloat(m[4]),
			ZERO: parseFloat(m[5]), ROUTE: m[6], PCT: m[7]};
		}
	    },
	    PUMPS: function(section, key, line) {
		var m = line.match(/\s*([^\s;]+)\s+([^\s;]+)\s+([^\s;]+)\s+([^\s;]+).*/);
		if (m && m.length && 5 === m.length) {
		    section[key] = {NODE1: m[1], NODE2: m[2], CURVE: m[3], STATUS: m[4]};
		}
	    },
	    XSECTIONS: function(section, key, line) {
		var m = line.match(/\s*([^\s;]+)\s+([^\s;]+)\s+([0-9\.]+)\s+([^\s;]+)\s+([^\s;]+)\s+([0-9\.]+).*/);
		if (m && m.length && 7 === m.length) {
		    section[key] = {TYPE: m[1], GEOM1: m[2], GEOM2: m[3], GEOM3: m[4], GEOM4: m[5], BARRELS: m[6]};
		}
	    },
	    VERTICES: function(section, key, line) {
		var m = line.match(/\s*([0-9\.]+)\s+([0-9\.]+)/),
		v = section[key] || [],
		c = {};
		if (m && m.length && 3 === m.length) {
		    c.x = parseFloat(m[1]);
		    c.y = parseFloat(m[2]);
		}
		v[v.length] = c;
		section[key] = v;
	    },
	    TIMES: function(section, key, line) { // to do: check
		var m = line.match(/(CLOCKTIME|START|TIMESTEP)\s+([^\s].*[^\s])\s*/i);
		if (m && m.length && 3 === m.length) {
		    section[(key + ' ' + m[1]).toUpperCase()] = m[2];
		}
		else {
		    section[key.toUpperCase()] = line.replace(/^\s+/, '').replace(/\s+$/, '');
		}
	    }
            // add other if neccesary
	},
	model = {COORDINATES: {}, LABELS: [], STORAGE: {}, OUTFALLS: {}},
	lines = text.split(/\r\n|\r|\n/),
		section = null;
	lines.forEach(function(line) {
	    if (regex.comment.test(line)) {
		return;
	    } else if (regex.section.test(line)) {
		var s = line.match(regex.section);
		if ('undefined' === typeof model[s[1]])
		    model[s[1]] = {};
		section = s[1];
	    } else if (regex.value.test(line)) {
		var v = line.match(regex.value);
		if (parser[section])
		    parser[section](model[section], v[1], v[2]);
		else
		    model[section][v[1]] = v[2];
	    }
	    ;
	});
	return model;
    };

    return inp;
};

// Read SWMM binary result files
d3.swmmresult = function() {
    function swmmresult() { }

    const SUBCATCH = 0,
        NODE     = 1,
        LINK     = 2,
        SYS      = 3,
        POLLUT   = 4,
        RECORDSIZE = 4;                       // number of bytes per file record

    TYPECODE = { // not used
        0: {1: 'Area'},
        1: {0: 'Junction',
            1: 'Outfall',
            2: 'Storage',
            3: 'Divider'},
        2: {0: 'Conduit',
            1: 'Pump',
            2: 'Orifice',
            3: 'Weir',
            4: 'Outlet'}
    };
            
    VARCODE = { 
        0: {0: 'Rainfall',
            1: 'Snow_depth',
            2: 'Evaporation_loss',
            3: 'Infiltration_loss',
            4: 'Runoff_rate',
            5: 'Groundwater_outflow',
            6: 'Groundwater_elevation',
            7: 'Soil_moisture',
            8: 'Pollutant_washoff'},
        1: {0: 'Depth_above_invert',
            1: 'Hydraulic_head',
            2: 'Volume_stored_ponded',
            3: 'Lateral_inflow',
            4: 'Total_inflow',
            5: 'Flow_lost_flooding'},
        2: {0: 'Flow_rate',
            1: 'Flow_depth',
            2: 'Flow_velocity',
            3: 'Froude_number',
            4: 'Capacity'},
        4: {0: 'Air_temperature',
            1: 'Rainfall',
            2: 'Snow_depth',
            3: 'Evaporation_infiltration',
            4: 'Runoff',
            5: 'Dry_weather_inflow',
            6: 'Groundwater_inflow',
            7: 'RDII_inflow',
            8: 'User_direct_inflow',
            9: 'Total_lateral_inflow',
            10: 'Flow_lost_to_flooding',
            11: 'Flow_leaving_outfalls',
            12: 'Volume_stored_water',
            13: 'Evaporation_rate',
            14: 'Potential_PET'}
    };
    
    _SWMM_FLOWUNITS = { // not used
            0: 'CFS',
            1: 'GPM',
            2: 'MGD',
            3: 'CMS',
            4: 'LPS',
            5: 'LPD'
    };    
    swmmresult.i4 = Module._malloc(4);
    swmmresult.string = Module._malloc(255);

    swmmresult.parse = function(filename, size) {
	var c = (FS.findObject(filename) ? FS.findObject(filename).contents : (typeof filename === "object"? filename : undefined)),
		r = {},
		er = swmmresult;
        
        this.offsetOID = 0;

        this.SWMM_Nperiods = 0,              // number of reporting periods
        this.SWMM_FlowUnits = 0,             // flow units code
        this.SWMM_Nsubcatch = 0,             // number of subcatchments
        this.SWMM_Nnodes = 0,                // number of drainage system nodes
        this.SWMM_Nlinks = 0,                // number of drainage system links
        this.SWMM_Npolluts = 0,              // number of pollutants tracked
        this.SWMM_StartDate = new Date(),              // start date of simulation
        this.SWMM_ReportStep = 0;            // reporting time step (seconds)	
        
        this.SubcatchVars = 0,               // number of subcatch reporting variable
        this.NodeVars = 0,                   // number of node reporting variables
        this.LinkVars = 0,                   // number of link reporting variables
        this.SysVars = 0,                    // number of system reporting variables
        this.StartPos = 0,                   // file position where results start
        this.BytesPerPeriod = 0;             // bytes used for results in each period
        
        var
            magic1, magic2, errCode, version;
        var
            offset, offset0;
            
        var stat = null;
        try {
            if (c)
                stat = FS.stat(filename);
        } catch (e) {
            stat = size || "undefined";
            console.log(e);
        }
        
        if (stat) {
            var size = (stat.size ? stat.size : stat);
            if (size < 14*RECORDSIZE) {
                return 1;
            }
            this.offsetOID = er.readInt(c, size-6*RECORDSIZE, RECORDSIZE);
            offset0 = er.readInt(c, size-5*RECORDSIZE, RECORDSIZE);
            this.StartPos = er.readInt(c, size-4*RECORDSIZE, RECORDSIZE);
            this.SWMM_Nperiods = er.readInt(c, size-3*RECORDSIZE, RECORDSIZE);
            errCode = er.readInt(c, size-2*RECORDSIZE, RECORDSIZE);
            magic2 = er.readInt(c, size-RECORDSIZE, RECORDSIZE);
            magic1 = er.readInt(c, 0, RECORDSIZE);
            
            if (magic1 !== magic2) return 1;
            else if (errCode !== 0) return 1;
            else if (this.SWMM_Nperiods===0) return 1;
            
            version = er.readInt(c, RECORDSIZE, RECORDSIZE);
            this.SWMM_FlowUnits = er.readInt(c, 2*RECORDSIZE, RECORDSIZE);
            this.SWMM_Nsubcatch = er.readInt(c, 3*RECORDSIZE, RECORDSIZE);
            this.SWMM_Nnodes = er.readInt(c, 4*RECORDSIZE, RECORDSIZE);
            this.SWMM_Nlinks = er.readInt(c, 5*RECORDSIZE, RECORDSIZE);
            this.SWMM_Npolluts = er.readInt(c, 6*RECORDSIZE, RECORDSIZE);
            
            // Skip over saved subcatch/node/link input values
            offset = (this.SWMM_Nsubcatch+2) * RECORDSIZE     // Subcatchment area
                       + (3*this.SWMM_Nnodes+4) * RECORDSIZE  // Node type, invert & max depth
                       + (5*this.SWMM_Nlinks+6) * RECORDSIZE; // Link type, z1, z2, max depth & length
            offset = offset0 + offset;

            this.SubcatchVars = er.readInt(c, offset, RECORDSIZE);
            this.NodeVars = er.readInt(c, offset + (this.SubcatchVars*RECORDSIZE), RECORDSIZE);
            this.LinkVars = er.readInt(c, offset + (this.SubcatchVars*RECORDSIZE) + (this.NodeVars*RECORDSIZE), RECORDSIZE);
            this.SysVars = er.readInt(c, offset + (this.SubcatchVars*RECORDSIZE) + (this.NodeVars*RECORDSIZE) + (this.LinkVars*RECORDSIZE), RECORDSIZE);
            
            offset = this.StartPos - 3*RECORDSIZE;
            var days = (er.readInt(c, offset, 2*RECORDSIZE)+1);
            this.SWMM_StartDate = new Date('12/31/1899');
            this.SWMM_StartDate = new Date(this.SWMM_StartDate.setDate(this.SWMM_StartDate.getDate() + days));
            this.SWMM_ReportStep = er.readInt(c, offset + 2*RECORDSIZE, RECORDSIZE);
            
            this.SubcatchVars = (8 + this.SWMM_Npolluts);
            this.NodeVars = (6 + this.SWMM_Npolluts);
            this.LinkVars = (5 + this.SWMM_Npolluts);
            this.SysVars = 15;
            
            this.BytesPerPeriod = RECORDSIZE*(2 + 
                    this.SWMM_Nsubcatch*this.SubcatchVars +
                    this.SWMM_Nnodes*this.NodeVars +
                    this.SWMM_Nlinks*this.LinkVars +
                    this.SysVars); 
            
            var variables = {};
            var nr = this.offsetOID;
            // Object names
            var subcatch = {}, node = {}, link = {}, pollut = {};
            for (var i =0; i< this.SWMM_Nsubcatch; i++) {
                var no = er.readInt(c, nr, RECORDSIZE);
                subcatch[i] = [ Module.intArrayToString(Array.prototype.slice.call(c,nr, nr + no + RECORDSIZE)).replace(/[^a-z0-9_\.]/gi, '') ];
                nr = nr + no + RECORDSIZE;
            }
            variables['SUBCATCH'] = {};
            variables['SUBCATCH']['items'] = subcatch;
            
            for (var i =0; i< this.SWMM_Nnodes; i++) {
                var no = er.readInt(c, nr, RECORDSIZE);
                node[i] = [ Module.intArrayToString(Array.prototype.slice.call(c,nr, nr + no + RECORDSIZE)).replace(/[^a-z0-9_\.]/gi, '') ];
                nr = nr + no + RECORDSIZE;
            }
            variables['NODE'] = {};
            variables['NODE']['items'] = node;
            
            for (var i =0; i< this.SWMM_Nlinks; i++) {
                var no = er.readInt(c, nr, RECORDSIZE);
                link[i] = [ Module.intArrayToString(Array.prototype.slice.call(c,nr, nr + no + RECORDSIZE)).replace(/[^a-z0-9_\.]/gi, '') ];
                nr = nr + no + RECORDSIZE;
            }
            variables['LINK'] = {};
            variables['LINK']['items'] = link;
            
            for (var i =0; i< this.SWMM_Npolluts; i++) {
                var no = er.readInt(c, nr, RECORDSIZE);
                pollut[i] = Module.intArrayToString(Array.prototype.slice.call(c,nr, nr + no + RECORDSIZE)).replace(/[^a-z0-9_\.]/gi, '');
                nr = nr + no + RECORDSIZE;
            }
            variables['POLLUT'] = {};
            variables['POLLUT']['items'] = pollut;
            
            while (nr<offset0) {
                var nm = er.readInt(c, nr, RECORDSIZE);
                variables.nm = nm;
                nr = nr + RECORDSIZE;
            }
            // Object properties
            nr = offset0;
            
            var vals = [];
            
            no = er.readInt(c, nr, RECORDSIZE);
            nr = nr + RECORDSIZE;
            vals.push(no);
            no = er.readInt(c, nr, RECORDSIZE);
            nr = nr + RECORDSIZE;
            vals.push(no);
            variables['SUBCATCH']['init'] = vals;
            
            vals = [];
            for (var i =0; i< this.SWMM_Nsubcatch; i++) {
                var no = er.readInt(c, nr, RECORDSIZE);
                nr = nr + RECORDSIZE;
                vals.push(no);
            }
            variables['SUBCATCH']['properties'] = vals;
            
            vals = [];
            no = er.readInt(c, nr, RECORDSIZE);
            nr = nr + RECORDSIZE;
            vals.push(no);
            no = er.readInt(c, nr, RECORDSIZE);
            nr = nr + RECORDSIZE;
            vals.push(no);
            no = er.readInt(c, nr, RECORDSIZE);
            nr = nr + RECORDSIZE;
            vals.push(no);
            no = er.readInt(c, nr, RECORDSIZE);
            nr = nr + RECORDSIZE;
            vals.push(no);
            variables['NODE']['init'] = vals;
            
            vals = [];
            for (var i =0; i< this.SWMM_Nnodes; i++) {
                var el = {};
                var val = [];
                var no = er.readInt(c, nr, RECORDSIZE);
                nr = nr + RECORDSIZE;
                val.push(no);
                no = er.readFloat(c, nr, RECORDSIZE);
                nr = nr + RECORDSIZE;
                val.push(no);
                no = er.readFloat(c, nr, RECORDSIZE);
                nr = nr + RECORDSIZE;
                val.push(no);
                el[variables['NODE']['items'][i]] = val;
                vals.push(el);
            }
            variables['NODE']['properties'] = vals;

            vals = [];
            no = er.readInt(c, nr, RECORDSIZE);
            nr = nr + RECORDSIZE;
            vals.push(no);
            no = er.readInt(c, nr, RECORDSIZE);
            nr = nr + RECORDSIZE;
            vals.push(no);
            no = er.readInt(c, nr, RECORDSIZE);
            nr = nr + RECORDSIZE;
            vals.push(no);
            no = er.readInt(c, nr, RECORDSIZE);
            nr = nr + RECORDSIZE;
            vals.push(no);
            no = er.readInt(c, nr, RECORDSIZE);
            nr = nr + RECORDSIZE;
            vals.push(no);
            no = er.readInt(c, nr, RECORDSIZE);
            nr = nr + RECORDSIZE;
            vals.push(no);
            variables['LINK']['init'] = vals;

            vals = [];
            for (var i =0; i< this.SWMM_Nlinks; i++) {
                var el = {};
                var val = [];
                var no = er.readInt(c, nr, RECORDSIZE);
                nr = nr + RECORDSIZE;
                val.push(no);
                no = er.readFloat(c, nr, RECORDSIZE);
                nr = nr + RECORDSIZE;
                val.push(no);
                no = er.readFloat(c, nr, RECORDSIZE);
                nr = nr + RECORDSIZE;
                val.push(no);
                no = er.readFloat(c, nr, RECORDSIZE);
                nr = nr + RECORDSIZE;
                val.push(no);
                no = er.readFloat(c, nr, RECORDSIZE);
                nr = nr + RECORDSIZE;
                val.push(no);
                el[variables['LINK']['items'][i]] = val;
                vals.push(el);
            }
            variables['LINK']['properties'] = vals;
            
            r['objects'] = variables;
            
            //reporting variables - 
            //SubcatchVars = 8;
            //NodeVars = 6;
            //LinkVars = 5;
            this.StartPosResult = this.StartPos;
            for (var i = 1; i <= this.SWMM_Nperiods; i++) {
                r[i] = {};
                var no = undefined;
                var vals = {};
                var el = [];
                
                this.StartPosResult += 2*RECORDSIZE;
                
                for (var j = 0; j < this.SWMM_Nsubcatch; j++) {
                    el = [];
                    for (var k = 0; k < this.SubcatchVars ; k++) { //2 = 1 number of subcatchment variables + 1 polluants
                        no = er.getswmmresultoffset(SUBCATCH, j, k, i);
                        el.push(er.readFloat(c, no, RECORDSIZE));
                    }
                    vals[variables['SUBCATCH']['items'][j]] = el;
                }
                r[i]['SUBCATCH'] = vals;

                vals = {};
                for (var j = 0; j <  this.SWMM_Nnodes; j++) {
                    el = [];
                    for (var k = 0; k < this.NodeVars; k++) {
                        no = er.getswmmresultoffset(NODE, j, k, i);
                        el.push(er.readFloat(c, no, RECORDSIZE));
                    }
                    vals[variables['NODE']['items'][j]] = el;
                }
                r[i]['NODE'] = vals;

                vals = {};
                for (var j = 0; j <  this.SWMM_Nlinks; j++) {
                    el = [];
                    for (var k = 0; k < this.LinkVars; k++) {
                        no = er.getswmmresultoffset(LINK, j, k, i);
                        el.push(er.readFloat(c, no, RECORDSIZE));
                    }
                    vals[variables['LINK']['items'][j]] = el;
                }
                r[i]['LINK'] = vals;

                vals = {};
                el = [];
                for (var k = 0; k < this.SysVars; k++) {
                    no = er.getswmmresultoffset(SYS, j, k, i);
                    el.push(er.readFloat(c, no, RECORDSIZE));
                }
                r[i]['SYS'] = el;

                this.StartPosResult = no + RECORDSIZE;
            }
        }
        
        return r;
    };

    swmmresult.getswmmresultoffset = function(iType, iIndex, vIndex, period ) {
        var offset1, offset2;
        offset1 = this.StartPosResult; // + (period-1)*this.BytesPerPeriod + 2*RECORDSIZE;
        
        if ( iType === SUBCATCH ) 
          offset2 = (iIndex*(this.SubcatchVars) + vIndex);
        else if (iType === NODE) 
          offset2 = (this.SWMM_Nsubcatch*this.SubcatchVars + iIndex*this.NodeVars + vIndex);
        else if (iType === LINK)
          offset2 = (this.SWMM_Nsubcatch*this.SubcatchVars + this.SWMM_Nnodes*this.NodeVars + iIndex*this.LinkVars + vIndex);
        else if (iType === SYS) 
            offset2 = (this.SWMM_Nsubcatch*this.SubcatchVars + this.SWMM_Nnodes*this.NodeVars + this.SWMM_Nlinks*this.LinkVars + vIndex);
        
        return offset1 + RECORDSIZE * offset2;
    };
    
    swmmresult.readInt = function(content, offset, recordsize) {
	Module.HEAP8.set(new Int8Array(content.slice(offset, offset + recordsize)), swmmresult.i4);
	return Module.getValue(swmmresult.i4, 'i32');
    };

    swmmresult.readFloat = function(content, offset, recordsize) {
	Module.HEAP8.set(new Int8Array(content.slice(offset, offset + recordsize)), swmmresult.i4);
	return Module.getValue(swmmresult.i4, 'float');
    };

    return swmmresult;
};

var margin = {top: 1, right: 1, bottom: 6, left: 1},
    width = 300 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var formatNumber = d3.format(",.3f"),
    format = function(d) {
        var units = swmmjs.model['OPTIONS']['Units'].replace(/\s*/g,'') || 'CMD',
                u = swmmjs.unit(units, $('#linkResult').val().toUpperCase());
        return formatNumber(d)+' '+u;
    },
    color = d3.scaleOrdinal(d3.schemeCategory20);

var swmmjs = function() {
    swmmjs = function() {
    };

    swmmjs.INPUT = 1;
    
    swmmjs.nodesections = ['JUNCTIONS', 'STORAGE'];
    swmmjs.linksections = ['CONDUITS', 'PUMPS'];

    swmmjs.mode = swmmjs.INPUT;
    swmmjs.success = false;
    swmmjs.results = false;
    swmmjs.colors = {'NODES': false, 'LINKS': false};
    swmmjs.model = false;
    swmmjs.currentScale = 1;
    swmmjs.currentPosition = [];
    swmmjs.renderLegend = false;
    swmmjs.defaultColor = '#636363';
    
    swmmjs.setMode = function(mode) {
	swmmjs.mode = mode;
	if(swmmjs.renderLegend)
	    $('#legend').show();
	else
	    $('#legend').hide();
        
	swmmjs.render();
    };

    // Render the map
    swmmjs.svg = function() {
	var svg = function() {
	};
	
	// ======================================================================================================
	// This product includes color specifications and designs 
	// developed by Cynthia Brewer (http://colorbrewer.org/).
	// See ../../COPYING for licensing details.
	// RdYlGn
	svg.colors =  {'NODES': ["#d7191c","#fdae61","#ffffbf","#a6d96a","#1a9641"],
	// RdBu
	    'LINKS': ["#ca0020","#f4a582","#f7f7f7","#92c5de","#0571b0"]};
	// ======================================================================================================

	svg.width = window.innerWidth || document.documentElement.clientWidth || d.getElementsByTagName('body')[0].clientWidth;
	svg.height = 500;
	svg.nodemap = {};
	svg.lastNodeId = 0;
	svg.links = [];
	svg.nodes = [];
	svg.nodeSize = 1;
        svg.minx = undefined;
        svg.maxx = undefined;
        svg.miny = undefined;
        svg.maxy = undefined;
        svg.top = undefined;
        svg.strokeWidth = undefined;

	svg.removeAll = function(el) {
	    el.selectAll('line').remove();
	    el.selectAll('circle').remove();
	    el.selectAll('rect').remove();
	    el.selectAll('polygon').remove();
	    el.selectAll('text').remove();
	    el.selectAll('g').remove();
	};

	svg.tooltip = function(element) {
            var a = (element ? element.attributes : this.attributes),
                text = (a ? a['title'].value : '');
        
	    if(swmmjs.INPUT !== swmmjs.mode && swmmjs.success) {
		var fmt = d3.format('0.3f'),
                    nodeResult = $('#nodeResult').val().toUpperCase(),
                    v = (swmmjs.results[$('#time').val()] ? (swmmjs.results[$('#time').val()]['NODE'][text] ? swmmjs.results[$('#time').val()]['NODE'][text][nodeResult] : '') : '');
                text = fmt(v);
	    }

            document.getElementById('tooltip').style.display = 'block';
            document.getElementById('tooltip').style.backgroundColor = 'white';
            document.getElementById('tooltip').style.position = 'absolute';
            document.getElementById('tooltip').style.left = swmmjs.currentPosition[0] + 'px';
            document.getElementById('tooltip').style.top = swmmjs.currentPosition[1] + 'px';
            document.getElementById('tooltip').innerHTML = text;

	};

	svg.clearTooltips = function(element) {
            document.getElementById('tooltip').style.display = 'none';
	};

	svg.render = function() {
	    var el = d3.select('#svgSimple').select('g'),
		    model = swmmjs.model,		
		    linksections = ['CONDUITS', 'PUMPS'],
		    step = $('#time').val(),
		    nodeResult = $('#nodeResult').val().toUpperCase(),
		    linkResult = $('#linkResult').val().toUpperCase();
	    svg.removeAll(el);
            if (!el._groups[0][0]) { 
                // nothing found 
                d3.select('#svgSimple').append('g');
                el = d3.select('#svgSimple').select('g');
            }

	    if ('object' !== typeof model.COORDINATES)
		return;
            
            var coords = d3.values(model.COORDINATES),
		    x = function(c) {
		return c.x
	    },
		    y = function(c) {
		return c.y
	    };
            svg.minx = d3.min(coords, x);
            svg.maxx = d3.max(coords, x);
            svg.miny = d3.min(coords, y);
            svg.maxy = d3.max(coords, y);
            
            if (!svg.minx || !svg.maxx || !svg.miny || !svg.maxy)
                return;
            
            var height = (svg.maxy - svg.miny),
                width = (svg.maxx - svg.minx),
                scale = width * 0.1;
            
            svg.strokeWidth = height / 200;
            svg.top = svg.maxy + scale;

            d3.select('#svgSimple').attr('viewBox', (svg.minx - scale) + ' ' + 0 + ' ' + (width + 2 * scale) + ' ' + (height + 2 * scale));
	    el.attr('viewBox', (svg.minx - scale) + ' ' + 0 + ' ' + (width + 2 * scale) + ' ' + (height + 2 * scale));

	    svg.nodeSize = height / 75,
	    el.append('circle')
		    .attr('cx', svg.minx + width / 2)
		    .attr('cy', svg.top - height / 2)
		    .attr('r', svg.nodeSize)
		    .attr('style', 'fill: black');
	    var c = d3.select('circle');
	    if (c && c[0] && c[0][0] && c[0][0].getBoundingClientRect)
	    {
		var r = c[0][0].getBoundingClientRect();
		if (r && r.height && r.width) {
		    svg.nodeSize = svg.nodeSize / r.height * 10;
		}
	    }
	    svg.removeAll(el);

	    // Render links
	    for (var section in linksections) {
		var s = linksections[section];
		if (model[s]) {
		    for (var link in model[s]) {
			var l = model[s][link],
				node1 = l.NODE1 || false,
				node2 = l.NODE2 || false,
				c1 = model.COORDINATES[node1] || false,
				c2 = model.COORDINATES[node2] || false,
				v = (swmmjs.results[step] ? ( swmmjs.results[step]['LINK'] ? (swmmjs.results[step]['LINK'][link] ? swmmjs.results[step]['LINK'][link][linkResult] : 0) : 0 ) : 0),
				r = swmmjs.colors['LINKS'],
				linkColors = swmmjs.svg.colors['LINKS'],
				color = (swmmjs.INPUT === swmmjs.mode ? swmmjs.defaultColor: linkColors[r(v)]);
			
			if (c1 && c2) {
			    var centerx = (c1.x + c2.x) / 2,
				    centery = (c1.y + c2.y) / 2,
				    angle = 180 / Math.PI * Math.atan2(c1.y - c2.y, c2.x - c1.x),
				    transform = 'rotate(' + angle + ' ' + centerx + ' ' + (svg.top - centery) + ')';
			    if (model['VERTICES'][link]) {
				// Render polylines  
                                // Haven't checked this one yet :D
				var v = model['VERTICES'][link],
					d = 'M ' + c1.x + ' ' + (svg.top - c1.y);
				for (var point in v) {
				    var p = v[point];
				    d = d + ' L ' + p.x + ' ' + (svg.top - p.y);
				}
				d = d + ' L ' + c2.x + ' ' + (svg.top - c2.y);
				el.append('g').attr('id',link).append('path')
					.attr('stroke', color)
					.attr('fill', 'none')
					.attr('d', d)
                                        .attr('class', 'vertice')
					.attr('stroke-width', svg.strokeWidth);

			    } 
                            if ('CONDUITS' === s) {
				el.append('g').attr('id',link).append('line')
					.attr('x1', c1.x)
					.attr('y1', svg.top - c1.y)
					.attr('x2', c2.x)
					.attr('y2', svg.top - c2.y)
                                        .attr('title', link)
                                        .on('mouseover', swmmjs.svg.tooltip)
                                        .on('mouseout', swmmjs.svg.clearTooltips)
					.attr('stroke', color)
                                        .attr('class', 'conduit')
					.attr('stroke-width', svg.strokeWidth);
			    } else if ('PUMPS' === s) {
                                // line
				el.append('g').attr('id',link).append('line')
					.attr('x1', c1.x)
					.attr('y1', svg.top - c1.y)
					.attr('x2', c2.x)
					.attr('y2', svg.top - c2.y)
                                        .attr('title', link)
                                        .on('mouseover', swmmjs.svg.tooltip)
                                        .on('mouseout', swmmjs.svg.clearTooltips)
					.attr('stroke', color)
                                        .attr('class', 'conduit')
					.attr('stroke-width', svg.strokeWidth);
                                // pump
				el.append('g').attr('id',link).append('circle')
					.attr('cx', centerx)
					.attr('cy', svg.top - centery)
					.attr('r', svg.nodeSize)
                                        .attr('class', 'pump1')
					.attr('style', 'fill:'+color+';');
				el.append('g').attr('id',link).append('rect')
					.attr('width', svg.nodeSize * 1.5)
					.attr('height', svg.nodeSize)
					.attr('x', centerx)
					.attr('y', svg.top - centery - svg.nodeSize)
                                        .attr('data-x', centerx)
                                        .attr('data-y', centery)
					.attr('transform', transform)
                                        .attr('class', 'pump2')
					.attr('style', 'fill:'+color+';');
			    }
			}
		    }
		}
	    }
	    // Render nodes
	    for (var coordinate in model.COORDINATES)
	    {
		var c = model.COORDINATES[coordinate],			
			v = (swmmjs.results[step] ? (swmmjs.results[step]['NODE'] ? (swmmjs.results[step]['NODE'][coordinate] ? swmmjs.results[step]['NODE'][coordinate][nodeResult] : 0) : 0) : 0),
			r = swmmjs.colors['NODES'],
			nodeColors = swmmjs.svg.colors['NODES'],
			color = (swmmjs.INPUT === swmmjs.mode ? swmmjs.defaultColor: nodeColors[r(v)]);
		if (model.STORAGE[coordinate]) {
		    el.append('g').attr('id',coordinate).append('rect')
			    .attr('width', svg.nodeSize * 2)
			    .attr('height', svg.nodeSize * 2)
			    .attr('x', c.x - svg.nodeSize)
			    .attr('y', svg.top - c.y - svg.nodeSize)
			    .attr('data-x', c.x)
			    .attr('data-y', svg.top - c.y)
                            .attr('data-y0', c.y)
			    .attr('title', coordinate)
			    .attr('onmouseover', 'swmmjs.svg.tooltip(evt.target)')
			    .attr('onmouseout', 'swmmjs.svg.clearTooltips(evt.target)')
                            .attr('class', 'storage')
			    .attr('fill', color);
		} else if (model.OUTFALLS[coordinate]) {
		    el.append('g').attr('id',coordinate).append('polygon')
			    .attr('points', (c.x - svg.nodeSize) + ' ' + (svg.top - c.y - svg.nodeSize) + ' ' +
			    (c.x + svg.nodeSize) + ' ' + (svg.top - c.y - svg.nodeSize) + ' ' +
			    c.x + ' ' + (svg.top - c.y + svg.nodeSize))
			    .attr('title', coordinate)
			    .attr('data-x', c.x)
			    .attr('data-y', svg.top - c.y)
                            .attr('data-y0', c.y)
			    .attr('onmouseover', 'swmmjs.svg.tooltip(evt.target)')
			    .attr('onmouseout', 'swmmjs.svg.clearTooltips(evt.target)')
                            .attr('class', 'outfall')
			    .attr('fill', color);
		} else if (model.JUNCTIONS[coordinate])  {
		    el.append('g').attr('id',coordinate).append('circle')
			    .attr('cx', c.x)
			    .attr('cy', svg.top - c.y)
			    .attr('r', svg.nodeSize)
			    .attr('data-x', c.x)
			    .attr('data-y', svg.top - c.y)
			    .attr('title', coordinate)
			    .attr('onmouseover', 'swmmjs.svg.tooltip(evt.target)')
			    .attr('onmouseout', 'swmmjs.svg.clearTooltips(evt.target)')
                            .attr('class', 'junction')
			    .attr('fill', color);
		}
	    }
	    // Render polygons
            if (model.Polygons) {
                for (var polygon in model.Polygons) {
                    var c = model.Polygons[polygon],			
                            color = swmmjs.defaultColor;
                    var points = '';
                    Object.keys(c).forEach(function(key) {
                        points += c[key].x + ' ' + c[key].y + ' ';
                    });
                    el.append('g').attr('id',polygon).append('polygon')
                                .attr('points', points)
                                .attr('title', polygon)
                                .attr('onmouseover', 'swmmjs.svg.tooltip(evt.target)')
                                .attr('onmouseout', 'swmmjs.svg.clearTooltips(evt.target)')
                                .attr('class', 'polygon')
                                .attr('fill', 'transparent')
                                .attr("stroke-width", 7)
                                .attr("stroke", color);
                }
            }
	    // Render labels
	    for (var label in model['LABELS']) {
		var l = model['LABELS'][label],
			t = (l['label'] ? l['label'] : '');
                if (t !== '') {
                    el.append('g').append('text')
                            .attr('x', (l['x']?l['x']:0) - svg.nodeSize * t.length / 3)
                            .attr('y', svg.top - (l['y']?l['y']:0) + svg.nodeSize * 2)
                            .text(t)
			    .attr('data-x', l['x'])
			    .attr('data-y', l['y'])
			    .attr('data-label', t)
                            .attr('style', 'font-family: Verdana, Arial, sans; font-size:' + (svg.nodeSize * 2) + 'px;')
                            .attr('class', 'label')
                            .attr('fill', swmmjs.defaultColor);
                }
	    }
            
            var vis = d3.select('#svgSimple');

            // zoom behaviour
            var zoom = d3.zoom().scaleExtent([0.1, 50]);
            zoom.on('zoom', function() { swmmjs.currentScale = d3.event.transform.k; swmmjs.applyScale(svg); });
            vis.call(zoom);

            swmmjs.applyScale(svg);
            
            vis.on('mousemove', function() {
                swmmjs.currentPosition = [d3.event.pageX, d3.event.pageY]; // log the mouse x,y position
                var svgEl = document.getElementById('svgSimple');
                var pt = svgEl.createSVGPoint();
                pt.x = d3.event.pageX;
                pt.y = d3.event.pageY;
                var globalPoint = pt.matrixTransform(svgEl.getScreenCTM().inverse());
                document.getElementById('xy').innerHTML = 'X: ' + (pt.x) + ', Y: ' + (pt.y);
            });
	};
        
        return svg;
    };
    
    swmmjs.applyScale = function(svg) {
        var scaleFactor = 1;
        //vertice
        d3.select('#svgSimple > g').selectAll('.vertice').each(function() { 
            this.setAttribute('stroke-width', scaleFactor * svg.strokeWidth / swmmjs.currentScale );
        });
        //conduit
        d3.select('#svgSimple > g').selectAll('.conduit').each(function() { 
            this.setAttribute('stroke-width', scaleFactor * svg.strokeWidth / swmmjs.currentScale );
        });
        //junction
        d3.select('#svgSimple > g').selectAll('.junction').each(function() { 
            this.setAttribute('r', svg.nodeSize / swmmjs.currentScale );
        });
        //outfall
        d3.select('#svgSimple > g').selectAll('.outfall').each(function() { 
            this.setAttribute('points', (parseFloat(this.dataset.x) - 1.5 * scaleFactor * svg.nodeSize / swmmjs.currentScale) + ' ' + 
                                (parseFloat(svg.top) - parseFloat(this.dataset.y0) - 1.5 * scaleFactor * svg.nodeSize / swmmjs.currentScale) + ' ' +
                                (parseFloat(this.dataset.x) + 1.5 * scaleFactor * svg.nodeSize / swmmjs.currentScale) + ' ' + 
                                (parseFloat(svg.top) - parseFloat(this.dataset.y0) - 1.5 * scaleFactor * svg.nodeSize / swmmjs.currentScale) + ' ' +
                                parseFloat(this.dataset.x) + ' ' + 
                                (parseFloat(svg.top) - parseFloat(this.dataset.y0) + 1.5 * scaleFactor * svg.nodeSize / swmmjs.currentScale));
        });
        //storage
        d3.select('#svgSimple > g').selectAll('.storage').each(function() { 
            this.setAttribute('height', svg.nodeSize / swmmjs.currentScale * 2);
            this.setAttribute('width', svg.nodeSize / swmmjs.currentScale * 2);
            this.setAttribute('x', parseFloat(this.dataset.x) - svg.nodeSize / swmmjs.currentScale);
            this.setAttribute('y', svg.top - parseFloat(this.dataset.y0) - svg.nodeSize / swmmjs.currentScale);
        });
        //pump
        d3.select('#svgSimple > g').selectAll('.pump1').each(function() { 
            this.setAttribute('r', svg.nodeSize / swmmjs.currentScale );
        });
        d3.select('#svgSimple > g').selectAll('.pump2').each(function() { 
            this.setAttribute('width', svg.nodeSize / swmmjs.currentScale * 1.5);
            this.setAttribute('height', svg.nodeSize / swmmjs.currentScale );
            this.setAttribute('y', svg.top - parseFloat(this.dataset.y) - svg.nodeSize / swmmjs.currentScale);
        });
        //label
        d3.select('#svgSimple > g').selectAll('.label').each(function() { 
            this.setAttribute('x', (parseFloat(this.dataset.x)?parseFloat(this.dataset.x):0) - svg.nodeSize / swmmjs.currentScale * this.dataset.label.length / 3);
            this.setAttribute('y', svg.top - (parseFloat(this.dataset.y)?parseFloat(this.dataset.y):0) + svg.nodeSize / swmmjs.currentScale * 2);
            this.setAttribute('style', 'font-family: Verdana, Arial, sans; font-size:' + (svg.nodeSize / swmmjs.currentScale * 2) + 'px;')
        });
        if (d3.event) {
            d3.select('#svgSimple > g')
              .attr('transform', d3.event.transform);
        }
    };
    
    swmmjs.svg = swmmjs.svg();

    swmmjs.renderAnalysis = function(renderLegendInput) {	
	var renderLegend = renderLegendInput || swmmjs.renderLegend;
	
	if (!swmmjs.success)
	    swmmjs.renderInput();
	else {
	    var time = $('#time').val(),
		nodes = (swmmjs.results[time] ? swmmjs.results[time]['NODE'] : null),
		links = (swmmjs.results[time] ? swmmjs.results[time]['LINK'] : null),		
		nodeResult = $('#nodeResult').val().toUpperCase(),
		linkResult = $('#linkResult').val().toUpperCase();
        
	    if (swmmjs.INPUT === swmmjs.mode)
		swmmjs.mode = swmmjs.ANALYSIS;
            
	    swmmjs.colors['NODES'] = d3.scaleQuantile().range(d3.range(5));
	    swmmjs.colors['NODES'].domain(d3.values(nodes).map(function(n) {
		return n[nodeResult];
	    }));
	    swmmjs.colors['LINKS'] = d3.scaleQuantile().range(d3.range(5));
	    swmmjs.colors['LINKS'].domain(d3.values(links).map(function(n) {
		return n[linkResult];
	    }));
	    svg = swmmjs.svg;
            
            if (nodeResult === '') {
                swmmjs.mode = swmmjs.INPUT;
            }
            
	    svg.render();
	    d3.select('#legend ul').remove();
	    if(renderLegend) {
		var legend = d3.select('#legend'),
			ul = legend.append('ul').attr('class', 'list-group'),
			fmt = d3.format('0.3f'),
			elements = ['Nodes', 'Links'];
		for(var el in elements) {
                    try {
                        var	el = elements[el],
                                singular = el.substr(0, el.length - 1)
                                range = swmmjs.colors[el.toUpperCase()],			    
                                quantiles = range.quantiles(),
                                v = [fmt(d3.min(range.domain()))];
                        ul.append('li').text(singular+' '+$('#'+singular.toLowerCase()+'Result').val()).attr('class', 'list-group-item active');
                        for(var q in quantiles)
                        {
                           v[v.length] = fmt(quantiles[q]);
                        }
                        v[v.length] = fmt(d3.max(range.domain()));
                        for(var i = 1; i < v.length; i++)
                        {
                            var li = ul.append('li')			    
                                    .attr('class', 'list-group-item'),
                                value = (parseFloat(v[i-1]) + parseFloat(v[i]))/2;
                            li.append('span')
                                    .attr('style', 'background:'+swmmjs.svg.colors[el.toUpperCase()][range(value)])
                                    .attr('class', 'legendcolor')
                                    .text(' ');
                            li.append('span')
                                .text(' '+v[i-1]+' to '+v[i]);
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }
	    }		
	}
    };

    swmmjs.renderInput = function() {
	swmmjs.svg.render();
    };

    swmmjs.readBin = function(success) {
	swmmjs.results = (success ? d3.swmmresult().parse('/report.bin') : false);
    };

    swmmjs.render = function() {
	if (swmmjs.INPUT === swmmjs.mode)
	    swmmjs.renderInput();
	else
	    swmmjs.renderAnalysis();
    };
    
    swmmjs.setSuccess = function(success) {
	var time = d3.select('#time');
	swmmjs.success = success;
	swmmjs.readBin(success);
	time.selectAll('option').remove();
	swmmjs.model = d3.inp().parse(document.getElementById('inpFile').value)
	if (swmmjs.results) {
	    var reportTime = (swmmjs.model['OPTIONS'] ? new Date(swmmjs.model['OPTIONS']['REPORT_START_DATE']+swmmjs.model['OPTIONS']['REPORT_STEP']) : undefined);
            var reportTimestep = (reportTime ? reportTime.getHours()*60 + reportTime.getMinutes() : undefined);
	    for (var t in swmmjs.results) {
		time.append('option')
                    .attr('value', t)
                    .text(swmmjs.formatDate(reportTime));
		reportTime = new Date(reportTime.setMinutes(reportTime.getMinutes() + reportTimestep));
	    } 
	}
	swmmjs.render();
    };

    swmmjs.formatDate = function(date) {
        return (date.getDate()<10 ? "0" : "") + date.getDate() + "." + ((date.getMonth() +1)<10 ? "0" : "") + (date.getMonth() +1) + "." + (date.getYear()+1900) + " " + (date.getHours()<10 ? "0" : "") + date.getHours() + ":" + (date.getMinutes()<10 ? "0" : "") + date.getMinutes(); 
    };
    
    swmmjs.unit = function(units, parameter) {
	var u = '';
	switch(parameter) {
	    case 'INVERT':
		switch(units)
		{
                    default:
			u = 'm';
			break;
		}
		break;
	    case 'MAXDEPTH':
		switch(units)
		{
		   default:
		       u = 'm';
		       break;
		}
		break;
	   case 'ROUGHNESS':
	       switch(units)
	       {
		   default:
		       u = '';
		       break;
	       }
	       break;
	   case 'SLOPE':
	       switch(units)
	       {
		   default:
		       u = '%';
		       break;
	       }
	       break;
	}
	return u;
    };

    swmmjs.run = function(Module) {
        FS.quit();
        Module.arguments = ['/input.inp', '/report.txt', '/report.bin'];
        Module.preRun = [function () {
                try
                {
                    FS.createPath('/', '/', true, true);
                    FS.ignorePermissions = true;
                    var inp = document.getElementById('inpFile').value;
                    var f = FS.findObject('input.inp');
                    if (f) {
                        FS.unlink('input.inp');
                    }
                    FS.createDataFile('/', 'input.inp', inp, true, true);
                } catch (e) {
                    console.log('/input.inp creation failed');
                }
            }];
        Module.postRun = [function () {
                try {
                    swmmjs.renderAnalysis();
                    var rpt = Module.intArrayToString(FS.findObject('/report.txt').contents);
                    document.getElementById('rptFile').innerHTML = rpt;
                    Module['calledRun'] = false;
                } catch (e) {
                    console.log(e);
                }
            }];
        Module.print = (function () {
            var element = document.getElementById('output');
            if (element)
                element.value = ''; // clear browser cache
            return function (text) {
                if (arguments.length > 1)
                    text = Array.prototype.slice.call(arguments).join(' ');
                console.log(text);
                if (element) {
                    element.value += text + "\n";
                    element.scrollTop = element.scrollHeight; // focus on bottom
                }
            };
        })();
        Module.printErr = function (text) {
            if (arguments.length > 1)
                text = Array.prototype.slice.call(arguments).join(' ');
            console.error(text);
        };
        Module.canvas = (function () {
            var canvas = document.getElementById('canvas');

            // As a default initial behavior, pop up an alert when webgl context is lost. To make your
            // application robust, you may want to override this behavior before shipping!
            // See http://www.khronos.org/registry/webgl/specs/latest/1.0/#5.15.2
            canvas.addEventListener("webglcontextlost", function (e) {
                alert('WebGL context lost. You will need to reload the page.');
                e.preventDefault();
            }, false);

            return canvas;
        })();
        Module.setStatus = function (text) {
            var statusElement = document.getElementById('status');

            var progressElement = document.getElementById('progress');
            if (!Module.setStatus.last)
                Module.setStatus.last = {time: Date.now(), text: ''};
            if (text === Module.setStatus.last.text) {
                return;
            }
            var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
            var now = Date.now();
            if (m && now - Module.setStatus.last.time < 30)
                return; // if this is a progress update, skip it if too soon
            Module.setStatus.last.time = now;
            Module.setStatus.last.text = text;
            if (m) {
                text = m[1];
                progressElement.value = parseInt(m[2]) * 100;
                progressElement.max = parseInt(m[4]) * 100;
                progressElement.hidden = false;
            } else {
                progressElement.value = null;
                progressElement.max = null;
                progressElement.hidden = true;
            }
            statusElement.innerHTML = text;
            if (text === "") {
                swmmjs.setSuccess(true);
                exitRuntime();
                console.log(JSON.stringify(swmmjs.results));
            } 
        };
        Module.totalDependencies = 0;
        Module.monitorRunDependencies = function (left) {
            this.totalDependencies = Math.max(this.totalDependencies, left);
            Module.setStatus(left ? 'Preparing... (' + (this.totalDependencies - left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
        };

        Module.setStatus('Downloading...');
        window.onerror = function (event) {
            // TODO: do not warn on ok events like simulating an infinite loop or exitStatus
            Module.setStatus('Exception thrown, see JavaScript console');
            Module.setStatus = function (text) {
                if (text)
                    Module.printErr('[post-exception status] ' + text);
            };
        };

        Module['calledRun'] = false;
        Module['run']();
    };

    return swmmjs;
};

swmmjs = swmmjs();



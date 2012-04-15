
ArcPieGraph = function(ctx){
    if (ctx.width === undefined){ throw Error('No width given.'); }
    this.w = ctx.width;

    if (ctx.height === undefined){ throw Error('No height given.'); }
    this.h = ctx.height;

    if (ctx.node === undefined){ throw Error('No Node given'); }
    this.node =  ctx.node;

    // Raidus of the circle
    this.r = Math.min(this.w, this.h) / 2.1;

    this.sort = ctx.sort === undefined ? true : ctx.sort; // sort the data
    this.sort_direction = ctx.sort_direction === undefined ? 1 : ctx.sort_direction; // highest to lowest
    // Arc config
    this.arc = ctx.arc || {};
    this.arc.width = this.arc.width || 25;
    this.arc.start_angle = this.deg_to_rad(this.arc.start_angle) || 0; // Start at the top
    this.arc.internal = this.arc.internal  === undefined ? 0.15 : this.arc.internal; // amount of space to be left as white space
    this.arc.offset_x = this.arc.offset_x || 0; // x offset of the graph
    this.arc.offset_y = this.arc.offset_y || 0; // y offset of the graph
    this.arc.margin = this.arc.margin || 1; // margin between the arcs
    this.arc.grey_color = this.arc.grey || '#eee';

    this.colors = ctx.colors || ['#0093d5', '#f1b821', '#009983','#cf3d96', '#df7627', '#252', '#528', '#72f', '#444'];

    if (ctx.data !== undefined && ctx.data !== null){
        this.update_data(ctx.data);
    }
};

ArcPieGraph.prototype = {

    update_data: function(data){
        if (data.length === undefined || data.length === 0) { return; }
        this.data = data;
        if (this.sort === true){
            if (this.sort_direction === 1){
                this.data = data.sort(this._compare_node);
            } else {
                this.data = data.sort(this._compare_node_reverse);
            }
        }

        var total = 0;
        for (var i =0 ; i < this.data.length; i ++){
            total += this.data[i].value;
        }

        // Check to see if the arc width is too big, if it is reduce the width of the arcs
        if (this.data.length * this.arc.width > this.r * (1 - this.arc.internal)){
            this.arc.width = this.r * (1 - this.arc.internal) / this.data.length;
        }

        this.current_angle = this.arc.start_angle;
        var me = this;
        var arc_color = d3.svg.arc()
            .startAngle(function(d, i) { return me.current_angle; })
            .endAngle(function(d, i) {
                me.current_angle = d.value / total * Math.PI * 2 + me.current_angle;
                return me.current_angle;
            })
            .innerRadius(function(d, i) { return me.innerRadius(i); })
            .outerRadius(function(d, i) { return me.outerRadius(i); });


        this.vis = d3.select(this.node).append("svg")
            .attr("class", "chart")
            .attr("width", this.w)
            .attr("height", this.h)
            .append('g')
            .attr("transform", "translate(" + (this.r + me.arc.offset_x) + "," + (this.r + me.arc.offset_y) + ")");

        // Add the colored arcs
        this.vis.selectAll('path')
            .data(this.data)
            .enter().append('path')
            .attr('d', arc_color)
            .attr('id', function(d, i){
                if (d.id === undefined)
                    return me.node.substring(1, me.node.length) + '-arc-' + i;
                return d.id;
            })
            .attr('class', function(d, i) { return 'ag-arc ag-arc-color ag-color-' + i; })
            .style('fill', function(d, i) { return me.colors[i]; });

        var arc_grey = d3.svg.arc()
            .startAngle(function(d, i) {
                me.current_angle = d.value / total * Math.PI * 2 + me.current_angle;
                return me.current_angle;
            })
            .endAngle(function(d, i) {
                return me.current_angle +  2 * Math.PI - (d.value / total * Math.PI * 2);
            })
            .innerRadius(function(d, i) { return me.innerRadius(i); })
            .outerRadius(function(d, i) { return me.outerRadius(i); });

        this.current_angle = this.arc.start_angle;
        this.vis.selectAll('g').data(this.data)
            .enter().append('path')
            .attr('d', arc_grey)
            .attr('id', function(d, i){
                if (d.id === undefined)
                    return me.node.substring(1, me.node.length) + '-arc-grey-' + i;
                return d.id + '-grey';
            })
            .attr('class', function(d, i) { return 'ag-arc ag-arc-grey ag-color-grey-' + i; })
            .style('fill', me.arc.grey_color);
    },

    innerRadius: function(i){
        return this.r - this.arc.width * i - this.arc.width + this.arc.margin;
    },

    outerRadius: function(i){
        return this.r - this.arc.width * i;
    },

    _compare_node: function(a, b){
        if (a.value > b.value){
            return -1;
        }
        if (b.value > a.value){
            return 1;
        }
        return 0;
    },

    _compare_node_reverse: function(a, b){
        if (a.value > b.value){
            return 1;
        }
        if (b.value > a.value){
            return -1;
        }
        return 0;
    },

    deg_to_rad: function(deg){
        if (deg === undefined || deg === null){
            return undefined;
        }

        return parseInt(deg,10) * Math.PI / 180;
    }
};
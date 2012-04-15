/**
 * Options for the intilization of ArcGraph
 * Mandatory:
 * ctx.width - Width (pixels)
 * ctx.height - Height (pixels).
 * ctx.data - data to graph.
 * ctx.node - the location to insert the graph using the d3 selector syntax, eg '#chart'

 * Optional:
 * ctx.internal_whitespace - reserved space in the inside of the circle (in percent, 0.4 = 40% | default 75%)
 * ctx.max_angle - the angle the biggest element will finish at (between 0-2, 0 being no angle, 1 = 1/2 circle, 2 = full circle | default 1.66).\
 * ctx.arc_width - width of the arcs in the graph (pixels | default 20)
 *               - this attribute will be adjusted if the arc_width is too large to be displayed for the number of elements

 * ctx.description_heigth - height of the description header/line/description element (pixels | defualt 50px)
 *                        - this attribute will be adjusted if the height is too large to be displayed.
 *
 * ctx.get_color - function to generate colors given the data and index of the element
 * ctx.color_list - list of colors to use to color the graph.
 * ctx.line_color - color of the line under the description.
 * ctx.description_color - color of the font for the description.
 */


ArcGraph = function(ctx){
    if (ctx.width === undefined){ throw Error('No width given.'); }
    this.w = ctx.width;

    if (ctx.height === undefined){ throw Error('No height given.'); }
    this.h = ctx.height;

    if (ctx.node === undefined){ throw Error('No Node given'); }
    this.node =  ctx.node;

    // Raidus of the circle
    this.r = Math.min(this.w, this.h) / 2;

    // Arc config
    this.arc = ctx.arc || {};
    this.arc.width = this.arc.width || 20;
    this.arc.end_angle = this.deg_to_rad(this.arc.end_angle) || 1.66 * Math.PI; // end 3/4 around
    this.arc.start_angle = this.deg_to_rad(this.arc.start_angle) || Math.PI; // Start at the bottom
    this.arc.internal = this.arc.internal || 0.25; // amount of space to be left as white space
    this.arc.offset_x = this.arc.offset_x || 5; // x offset of the graph
    this.arc.offset_y = this.arc.offset_y || 0; // y offset of the graph

    // Key config
    this.key = ctx.key || {};
    this.key.height = this.key.height || 50;
    this.key.height_percent = this.key.height_percent || 0.8; // Use only 80% of the height for the key
    this.key.line_color = this.key.line_color || '#888';
    this.key.text_color = this.key.text_color || '#666';

    this.colors = ctx.colors || ['#0093d5', '#f1b821', '#009983','#cf3d96', '#df7627', '#252', '#528', '#72f', '#444'];

    if (ctx.data !== undefined && ctx.data !== null){
        this.update_data(ctx.data);
    }
};

ArcGraph.prototype = {

    update_data: function(data){
        if (data.length === undefined || data.length === 0) { return; }
        this.data = data.sort(this._compare_node);
        var max = this.data[0].value;

        // Check to see if the arc width is too big, if it is reduce the width of the arcs
        if (this.data.length * this.arc.width > this.r * (1 - this.arc.internal)){
            this.arc.width = this.r * (1 - this.arc.internal) / this.data.length;
        }

        // Check to see if the description is too big, if it is reduce the height of the descripion
        if (this.data.length * this.key.height > this.h * this.key.height_percent){
            this.key.height = this.h / this.data.length * this.key.height_percent;
        }

        var me = this;
        var arc = d3.svg.arc()
             .startAngle(function(d, i) { return me.arc.start_angle; })
             .endAngle(function(d, i) { return d.value / max  * me.arc.end_angle + me.arc.start_angle; })
             .innerRadius(function(d, i) { return me.innerRadius(i); })
             .outerRadius(function(d, i) { return me.outerRadius(i); });


        this.vis = d3.select(this.node).append("svg")
            .attr("class", "chart")
            .attr("width", this.w)
            .attr("height", this.h)
            .append('g')
            .attr("transform", "translate(" + (this.r + me.arc.offset_x) + "," + (this.r + me.arc.offset_y) + ")");

        // Add the arcs
        var paths = this.vis.selectAll('path')
            .data(this.data)
            .enter().append('path')
            .attr('d', arc)
            .attr('id', function(d, i){
                if (d.id === undefined)
                    return me.node.substring(1, me.node.length) + '-arc-' + i;
                return d.id;
            })
            .attr('class', function(d, i) { return 'ag-arc ag-color-' + i; })
            .style('fill', function(d, i) { return me.colors[i]; });

        // Add the values next to the arcs
        var arc_font_size = parseInt(this.arc.width * 0.8, 10);
        this.vis.selectAll('text').data(this.data)
                .enter().append('text')
                .attr('x', 5)
                .attr('y', function(d,i) { return me.outerRadius(i);  } )
                .attr('dy',  arc_font_size * -0.2)
                .attr("text-anchor", "start")
                .attr('class',  function(d, i) { return 'ag-arc-value ag-color-' + i; })
                .style("fill",  function(d, i) { return me.colors[i]; })
                .style('font-size',  arc_font_size + 'px')
                .text(function(d, i) { return d.value; });

        // Add the heading for the description
        var description_header_font = parseInt(this.key.height * 0.8, 10);
        this.vis.selectAll('g').data(this.data)
                .enter().append('text')
                .attr('x', this.r * 1.4)
                .attr('y', function(d, i){ return me.descriptionLocation(i) - 5; })
                .style("fill",  function(d, i) { return me.colors[i]; })
                .style('font-size',  description_header_font + 'px')
                .style('font-weight', 'bold')
                .attr('class', function(d, i) { return 'ag-header-value ag-color-' + i; })
                .text(function(d, i) { return d.value2; });

        // Add a line under the text
        this.vis.selectAll('g').data(this.data)
            .enter().append('line')
                .attr('x1', this.r * 1.35)
                .attr('x2', this.w * 0.95)
                .attr('y1', function(d, i){ return me.descriptionLocation(i) - 1; } )
                .attr('y2', function(d, i){ return me.descriptionLocation(i) - 1; } )
                .attr('class', 'ag-header-line')
                .style("stroke", this.key.line_color);

        // Add a line under the text
        var description_font = parseInt(description_header_font * 0.5, 10);
        this.vis.selectAll('g').data(this.data)
            .enter().append('text')
                .attr('x', this.r * 1.45 + description_header_font * 2 )
                .attr('y', function(d, i){  return me.descriptionLocation(i) - description_header_font / 3; } )
                .style("fill", this.key.text_color )
                .style('font-size',  description_font + 'px')
                .attr('class', 'ag-header-description')
                .text( function(d){ return d.description; });
    },

    descriptionLocation: function(i){
        return this.r - this.key.height * (this.data.length - 1  - i);
    },

    innerRadius: function(i){
        return this.r - this.arc.width * i - this.arc.width + 1;
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

    deg_to_rad: function(deg){
        if (deg === undefined || deg === null){
            return undefined;
        }

        angle = parseInt(deg,10) * Math.PI / 180;
        console.log(angle)
        return angle;
    }
};
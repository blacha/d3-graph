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
    if (ctx.width === undefined){
        throw Error('No width given.');
    }
    this.w = ctx.width;

    if (ctx.height === undefined){
        throw Error('No height given.');
    }
    this.h = ctx.height;

    if (ctx.node === undefined){
        throw Error('No Node given');
    }
    this.node =  ctx.node;

    this.r = Math.min(this.w, this.h) / 2;

    this.arc_width = ctx.arc_width || 20;
    this.arc_max_angle = ctx.arc_angle || 1.66;
    this.description_height = ctx.description_height || 50;
    this.internal_whitespace = ctx.internal_whitespace === undefined ? 1 - 0.25 : 1 - ctx.internal_whitespace;

    this.get_color = ctx.get_colors === undefined ? this.get_color : ctx.get_colors;
    this.colors = ctx.colors || [ '#0093d5', '#f1b821', '#009983','#cf3d96', '#df7627', '#252', '#528', '#72f', '#444'];

    this.line_color = ctx.line_color || '#888';
    this.description_color = ctx.description_color || '#666';

    if (ctx.data !== undefined && ctx.data !== null){
        this.update_data(ctx.data);
    }
};

ArcGraph.prototype = {
    get_color: function(index){
        return this.colors[index];
    },

    update_data: function(data){
        if (this.get_color === undefined){
            this.get_color = function(i){
                return this.colors[i];
            };
        }

        if (data.length === undefined || data.length === 0) { return; }
        this.data = data.sort(this._compare_node);
        var max = this.data[0].value;

        // Check to see if the arc width is too big, if it is reduce the width of the arcs
        if (this.data.length * this.arc_width > this.r * this.internal_whitespace){
            this.arc_width = this.r * this.internal_whitespace / this.data.length;
        }

        // Check to see if the description is too big, if it is reduce the height of the descripion
        if (this.data.length * this.description_height > this.h * 0.8){
            this.description_height = this.h / this.data.length * 0.8;
        }

        var me = this;
        var arc = d3.svg.arc()
             .startAngle(function(d, i) { return Math.PI; })
             .endAngle(function(d, i) { return d.value / max * Math.PI * me.arc_max_angle + Math.PI; })
             .innerRadius(function(d, i) { return me.innerRadius(i); })
             .outerRadius(function(d, i) { return me.outerRadius(i); });


        this.vis = d3.select(this.node).append("svg")
            .attr("class", "chart")
            .attr("width", this.w)
            .attr("height", this.h)
            .append('g')
            .attr("transform", "translate(" + (this.r + 5) + "," + this.r + ")");

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
            .attr('class', 'ag-arc')
            .style('fill', function(d, i) {return me.get_color(i); });

        // Add the values next to the arcs
        var arc_font_size = parseInt(this.arc_width * 0.8, 10);
        this.vis.selectAll('text').data(this.data)
                .enter().append('text')
                .attr('x', 5)
                .attr('y', function(d,i) { return me.outerRadius(i);  } )
                .attr('dy',  arc_font_size * -0.2)
                .attr("text-anchor", "start")
                .attr('class', 'ag-arc-value')
                .style("fill",  function(d, i) {return me.get_color(i); })
                .style('font-size',  arc_font_size + 'px')
                .text(function(d, i) { return d.value; });

        // Add the heading for the description
        var description_header_font = parseInt(this.description_height * 0.8, 10);
        this.vis.selectAll('g').data(this.data)
                .enter().append('text')
                .attr('x', this.r * 1.4)
                .attr('y', function(d, i){ return me.descriptionLocation(i) - 5; })
                .style("fill",  function(d, i) {return me.get_color(i); })
                .style('font-size',  description_header_font + 'px')
                .style('font-weight', 'bold')
                .attr('class', 'ag-header-value')
                .text(function(d, i) { return d.value2; });

        // Add a line under the text
        this.vis.selectAll('g').data(this.data)
            .enter().append('line')
                .attr('x1', this.r * 1.35)
                .attr('x2', this.w * 0.95)
                .attr('y1', function(d, i){ return me.descriptionLocation(i) - 1; } )
                .attr('y2', function(d, i){ return me.descriptionLocation(i) - 1; } )
                .attr('class', 'ag-header-line')
                .style("stroke", this.line_color);

        // Add a line under the text
        var description_font = parseInt(description_header_font * 0.5, 10);
        this.vis.selectAll('g').data(this.data)
            .enter().append('text')
                .attr('x', this.r * 1.45 + description_header_font * 2 )
                .attr('y', function(d, i){  return me.descriptionLocation(i) - description_header_font / 3; } )

                .style("fill", this.description_color )
                .style('font-size',  description_font + 'px')
                .attr('class', 'ag-header-description')
                .text( function(d){ return d.description; });
    },

    descriptionLocation: function(i){
        return this.r - this.description_height *  (this.data.length - 1  - i);
    },

    innerRadius: function(i){
        return this.r - this.arc_width * i - this.arc_width + 1;
    },

    outerRadius: function(i){
        return this.r - this.arc_width * i;
    },

    _compare_node: function(a, b){
        if (a.value > b.value){
            return -1;
        }
        if (b.value > a.value){
            return 1;
        }
        return 0;
    }
};
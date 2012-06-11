SegmentPieGraph = function(ctx){
    if (ctx.width === undefined){ throw Error('No width given.'); }
    this.w = ctx.width;

    if (ctx.height === undefined){ throw Error('No height given.'); }
    this.h = ctx.height;

    if (ctx.node === undefined){ throw Error('No Node given'); }
    this.node =  ctx.node;

    // Raidus of the circle
    this.r = Math.min(this.w, this.h) / 2.1;

    // Arc config
    this.arc = ctx.arc || {};
    this.arc.start_angle = this.arc.start_angle || 0;
    this.arc.width = this.arc.width || 40;
    this.arc.offset_x = this.arc.offset_x || 0; // x offset of the graph
    this.arc.offset_y = this.arc.offset_y || 0; // y offset of the graph
    this.arc.margin = this.arc.margin || 0.1; // margin between the arcs

    this.total = ctx.total || 0;
    this.colors = ctx.colors || ['#009983','#cf3d96', '#df7627', '#252', '#528', '#72f', '#444'];

    if (typeof this.colors != 'function'){
        var color_data = this.colors;
        this.colors = function(d, i){
            return color_data[i];
        };

    }
    if (ctx.data !== undefined && ctx.data !== null){
        this.update_data(ctx.data);
    }
};

SegmentPieGraph.prototype = {

    update_data: function(data){
        if (data.length === undefined || data.length === 0) { return; }
        this.data = data;

        var total = this.total;

        if (total === undefined || total <= 0){
            for (var i =0 ; i < this.data.length; i ++){
                total += this.data[i].value;
            }
        }

        var me = this;
        me.current_angle = this.arc.start_angle;
        var arc = d3.svg.arc()
            .startAngle(function(d, i) { return me.current_angle; })
            .endAngle(function(d, i) {
                me.current_angle = d.value / total * Math.PI * 2 + me.current_angle ;
                return me.current_angle;
            })
            .innerRadius(this.r - this.arc.width)
            .outerRadius(this.r);

        me.end_angle = this.arc.start_angle;
        var arc_end = d3.svg.arc()
            .startAngle(function(d, i) { return me.end_angle; })
            .endAngle(function(d, i) {
                me.end_angle = d.value / total * Math.PI * 2 + me.end_angle ;
                return me.end_angle;
            })
            .innerRadius(this.r - this.arc.width)
            .outerRadius(this.r);

        this.vis = d3.select(this.node).select('g.chart');
        if (this.vis.empty()){
            this.vis =  d3.select(this.node).append("svg")
                .attr("class", "chart")
                .attr("width", this.w)
                .attr("height", this.h)
                .append('g')
                .attr('class', 'chart')
                .attr("transform", "translate(" + (this.r + me.arc.offset_x) + "," + (this.r + me.arc.offset_y) + ")");
        }

        // Add the arcs
        var paths = this.vis.selectAll('path.spg-arc')
            .data(this.data);

        paths.enter().append('path')
            //.attr('d', arc)
            .attr('class', function(d, i) { return 'spg-arc spg-color spg-group-' + i +' spg-arc-' + i; })
            .style('stroke', '#fff')
            .style('stroke-width', this.arc.margin / 2)
            .style('fill', this.colors);

        paths
            .attr('d', arc)
            .style('opacity', 0)
            .transition()
            .duration(function(d, i){ return i / me.data.length * 2000;})
            .style('opacity', 1)
            .attr('class', function(d, i) { return 'spg-arc spg-color spg-group-' + i +' spg-arc-' + i; })
            .style('stroke', '#fff')
            .style('stroke-width', this.arc.margin / 2)
            .style('fill', this.colors);

        paths.exit().transition()
            .duration(250)
            .style('opacity', 0);

        var text = this.vis.selectAll('path.spg-arc-text').data(this.data);
        text.enter().append('text')
            .attr("transform", function(d, i) { return "translate(" + arc.centroid(d, i) + ")"; })
                .attr('text-anchor', 'middle')
                .attr('dy', '0.25em')
                .attr('class' , function(d, i){ return 'spg-arc-text spg-group-' + i; })
                .style('fill', '#fff')
                .style('font-size', '12')
                .text(function(d , i){ return d.value + '%'; });

    }



};

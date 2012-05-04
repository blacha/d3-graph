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
    this.arc.width = this.arc.width || 40;
    this.arc.offset_x = this.arc.offset_x || 0; // x offset of the graph
    this.arc.offset_y = this.arc.offset_y || 0; // y offset of the graph
    this.arc.margin = this.arc.margin || 0.1; // margin between the arcs


    this.colors = ctx.colors || ['#009983','#cf3d96', '#df7627', '#252', '#528', '#72f', '#444'];

    if (ctx.data !== undefined && ctx.data !== null){
        this.update_data(ctx.data);
    }
};

SegmentPieGraph.prototype = {

    update_data: function(data){
        if (data.length === undefined || data.length === 0) { return; }
        this.data = data;

        var total = 0;
        for (var i =0 ; i < this.data.length; i ++){
            total += this.data[i].value;
        }

        var me = this;
        me.current_angle = 0;
        var arc = d3.svg.arc()
            .startAngle(function(d, i) { return me.current_angle; })
            .endAngle(function(d, i) {
                me.current_angle = d.value / total * Math.PI * 2 + me.current_angle ;
                return me.current_angle;
            })
            .innerRadius(this.r - this.arc.width)
            .outerRadius(this.r);


        this.vis = d3.select(this.node).append("svg")
            .attr("class", "chart")
            .attr("width", this.w)
            .attr("height", this.h)
            .append('g')
            .attr("transform", "translate(" + (this.r + me.arc.offset_x) + "," + (this.r + me.arc.offset_y) + ")");

        // Add the arcs
        var paths = this.vis.selectAll('path')
            .data(this.data);

            paths.enter().append('path')
            .attr('d', arc)
            .attr('class', function(d, i) { return 'spg-arc spg-color spg-group-' + i +' spg-arc-' + i; })
            .style('stroke', '#fff')
            .style('stroke-width', this.arc.margin / 2)
            .style('fill', function(d, i) { return me.colors[i]; });

            paths.enter().append('text')
            .attr("transform", function(d, i) { return "translate(" + arc.centroid(d, i) + ")"; })
                .attr('text-anchor', 'middle')
                .attr('dy', '0.25em')
                .attr('class' , function(d, i){ return 'spg-arc-text spg-group-' + i; })
                .style('fill', '#fff')
                .style('font-size', '12')
                .text(function(d , i){ return d.value + '%'; });

    }



};

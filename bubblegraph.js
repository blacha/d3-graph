BubbleGraph = function(ctx){
    if (ctx.width === undefined){ throw Error('No width given.'); }
    this.w = ctx.width;

    if (ctx.height === undefined){ throw Error('No height given.'); }
    this.h = ctx.height;

    if (ctx.node === undefined){ throw Error('No Node given'); }
    this.node =  ctx.node;

    this.colors = ctx.colors || ['#0093d5', '#f1b821', '#009983','#cf3d96', '#df7627', '#252', '#528', '#72f', '#444'];
    this.overlap = ctx.overlap || 0.95;
    if (ctx.data !== undefined && ctx.data !== null){
        this.update_data(ctx.data);
    }
};

BubbleGraph.prototype = {

    update_data: function(data){
        if (data.length === undefined || data.length === 0) { return; }
        this.data = data;

        this.max = 0;
        for (var i =0; i < this.data.length; i++){
            if (this.data[i].value > this.max){
                this.max = this.data[i].value;
            }
        }

        var me = this;

        this.r = Math.min(this.h, this.w) / 2.1;

        var bubble = d3.layout.pack()
                        .sort(null)
                        .size([this.w, this.h]);

        this.vis = d3.select(this.node).append("svg")
            .attr("class", "chart")
            .attr("width", this.w)
            .attr("height", this.h)
            .append('g');


        // Add the bubbles
        var graph = this.vis.selectAll('g.bug-node')
            .data(bubble.nodes({'children':this.data})
                .filter( function(d) { return !d.children; }))
            .enter().append('g')
            .attr('class', 'bug-node')
            .attr('transform', function(d){ return "translate(" + d.x + "," + d.y + ")"; });


        graph.append('circle')
            .attr('r', function(d, i) {
                return d.r  * me.overlap; })
            .attr('class', function(d, i) { return 'bug-bubble bug-color bug-group-' + i; })
            //.style('stroke', '#fff')
            //.style('stroke-width', '0')
            .style('fill', function(d, i) { return me.colors[i]; });


        graph.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.5em')
            .attr('class', function(d, i) { return 'bug-bubble-text bug-group-' + i; })
            .style('fill', '#fff')
            .text(function(d){ return Math.round(d.value); });

    }
};
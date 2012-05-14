LineGraph = function(ctx){
    if (ctx.width === undefined){ throw Error('No width given.'); }
    this.w = ctx.width;

    if (ctx.height === undefined){ throw Error('No height given.'); }
    this.h = ctx.height;

    if (ctx.node === undefined){ throw Error('No Node given'); }
    this.node =  ctx.node;

    this.colors = ctx.colors || ['#0093d5', '#f1b821', '#009983','#cf3d96', '#df7627', '#252', '#528', '#72f', '#444'];

    this.line = ctx.line || {};
    this.line.values = this.ck(this.line.values, true, this.line.values);
    this.line.dots = this.ck(this.line.dots, true, this.line.dots);
    this.line.min = this.ck(this.line.min, 0, this.line.min);
    this.line.max = this.ck(this.line.max, 0, this.line.max);

    this.xaxis = ctx.xaxis || {};
    this.xaxis.translate = this.xaxis.translate || {};
    this.xaxis.translate.rotate = this.ck(this.xaxis.translate.rotate, -90, this.xaxis.translate.rotate);
    this.xaxis.translate.x = this.ck(this.xaxis.translate.x, 0, this.xaxis.translate.x);
    this.xaxis.translate.y = this.ck(this.xaxis.translate.y, 0, this.xaxis.translate.y);

    this.x_axis = this.ck(ctx.x_axis, true, ctx.x_axis);
    this.y_axis = this.ck(ctx.y_axis, true, ctx.y_axis);

    if (typeof this.colors !== 'function'){
        var color_data = this.colors;
        this.colors = function(d, i){
            return color_data[i];
        };
    }

    if (ctx.data !== undefined && ctx.data !== null){
        this.update_data(ctx.data);
    }
};

LineGraph.prototype = {
    ck: function(opt, if_true, if_false){
        return opt === undefined ? if_true : if_false;
    },

    update_data: function(data){
        if (data.length === undefined || data.length === 0) { return; }
        this.data = data;

        this.max = 0;
        this.count = this.data[0].data.length;
        this.keys = [];

        this.graph_data = [];
        for (var i =0; i < this.data.length; i++){
            var series = this.data[i];
            this.graph_data.push([]);
            for (var j =0; j < series.data.length; j ++){
                if (series.data[j].value > this.max){
                    this.max = series.data[j].value;
                }

                if (i === 0){
                    this.keys.push(series.data[j].key);
                }
                this.graph_data[i].push(series.data[j].value);
            }
        }

        if (this.line.max > 0){
            this.max = this.line.max;
        }
        console.log(this.max);
        console.log(this.keys);
        console.log(this.graph_data);


        this.line.start = this.y_axis === true ? this.w * 0.15 : 0;
        this.line.end = this.w * 0.95;

        this.line.bottom = this.x_axis === true ? this.h * 0.6 : this.h;
        this.line.top = 15;

        var x = d3.scale.linear()
            .domain([0, this.count - 1])
            .rangeRound([this.line.start, this.line.end]);

        var y = d3.scale.linear()
            .domain([this.line.min, this.max])
            .rangeRound([this.line.bottom, this.line.top]);

        var xi = function(d, i){ return x(i);};
        var yd = function(d, i){ return y(d);};

        var line = d3.svg.line().x(xi).y(yd);

        var me = this;

        this.vis = d3.select(this.node).append("svg")
            .attr("class", "chart")
            .attr("width", this.w)
            .attr("height", this.h)
            .append('g');

        var ticks = this.vis.selectAll('.lg-tick-y')
            .data(y.ticks(4))
            .enter().append('g')
            .attr('transform', function(d){ return 'translate(' + me.line.start + ', ' + y(d) + ')'; })
            .attr('class', 'lg-tick lg-tick-y');

          ticks.append('svg:line')
           .attr('y1', 0)
           .attr('y2', 0)
           .attr('x1', 0)
           .attr('x2', this.line.end - this.line.start)
           .attr('stroke', '#ccc')
           .attr('stroke-dasharray', '2')
           .attr('class', 'lg-tick-tick');

        if (this.y_axis){
             ticks.append('svg:text')
               .text(function(d) { return d; } )
               .attr('text-anchor', 'end')
               .attr('dy', 2)
               .attr('dx', '-1em')
               .style('fill', '#777')
               .attr('class', 'lg-tick-text');
       }

        ticks = this.vis.selectAll('.lg-tick-x')
            .data(this.keys)
            .enter().append('g')
            .attr('transform', function(d, i){ return 'translate(' + x(i) + ', ' + me.line.bottom + ')'; })
            .attr('class', 'lg-tick lg-tick-x');

        ticks.append('line')
           .attr('y1', this.line.top - this.line.bottom)
           .attr('y2', 0)
           .attr('x1', 0)
           .attr('x2', 0)
           .attr('stroke', '#ccc')
           .attr('stroke-dasharray', '2')
           .attr('class', 'lg-tick-tick');

        if (this.x_axis){
             ticks.append('g')
             .attr('transform', 'translate(' + this.xaxis.translate.x + ',' + this.xaxis.translate.y  + ')' +
                                'rotate(' + this.xaxis.translate.rotate + ')')
                .append('text')
               .text(function(d) { return d; } )
               .attr('text-anchor', 'end')
               .attr('dy', '0.25em')
               .attr('dx', '-0.5em')
               .style('fill', '#777')
               .attr('class', function(d, i) {
                    var output = 'lg-tick-text';
                    if (i === 0){
                        output += ' lg-tick-first';
                    }
                    if (i == me.keys.length -1){
                        output += ' lg-tick-last';
                    }
                    return output;
                });
       }

               // Add the lines
        this.vis.selectAll('path')
            .data(this.graph_data)
            .enter().append('path')
            .attr('d', line)
            .attr('class', 'lg-line')
            .style('stroke', me.colors)
            .style('stroke-width', 2)
            .style('fill-opacity', '0');

       if (this.line.dots){
            var sx = function (d, i) { return me.colors(gd, gi); };
            for(var gi =0 ; gi < this.graph_data.length; gi++){
                var gd = this.graph_data[gi];
                this.vis.selectAll('.lg-point-' + gi)
                    .data(gd)
                    .enter().append('circle')
                    .style('stroke', sx)
                    .attr('class', 'lg-point')
                    .attr('cx', xi)
                    .attr('cy', yd)
                    .attr('r', 2)
                    .style('stroke-width', 2)
                    .style('fill', '#fff');
            }
       }
    }

};
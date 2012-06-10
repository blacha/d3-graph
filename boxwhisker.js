BoxWhisker = function(ctx){
    if (ctx.width === undefined){ throw Error('No width given.'); }
    this.w = ctx.width;

    if (ctx.height === undefined){ throw Error('No height given.'); }
    this.h = ctx.height;

    if (ctx.node === undefined){ throw Error('No Node given'); }
    this.node =  ctx.node;

    this.line = ctx.line || {};
    this.line.color =  this.line.color || '#e00';

    this.bar = ctx.bar || {};
    this.bar.width = this.bar.width || 50;
    this.bar.margin = this.bar.margin || 20;

    this.legend = ctx.legend || {};
    this.legend.enabled = this.legend.enabled === undefined ? false : this.legend.enabled;

    if (ctx.data !== undefined && ctx.data !== null){
        this.update_data(ctx.data);
    }
};

BoxWhisker.prototype = {

    update_data: function(data){
        if (data.length === undefined || data.length === 0) { return; }
        this.data = data;
        var i;


        var l= this.data.length;
        // Check to see if the bar width is too big, if it is reduce the width of the bar
        if ( l * this.bar.width + (l - 1) * this.bar.margin > this.w - this.bar.width){
            this.bar.width =  (this.w - (l - 1) * this.bar.margin) / (l + 2);
        }

        if (this.legend.enabled){
            this.bar.start = this.w * 0.2;
        } else {
            this.bar.start = 20;
        }

        if (this.bar.text){
            this.bar.end = this.w * 0.85;
        } else {
            this.bar.end = this.w;
        }

        var me = this;

        d3.selectAll(this.node).select('.bw-chart').remove();

        this.vis = d3.select(this.node).append('g')
            .attr('class','bw-chart')
            .attr("width", this.w)
            .attr("height", this.h);

        var rects = this.vis.selectAll('rect');

        rects = rects.data(this.data);
            //.data(this.data);

        var y = d3.scale.linear()
            .domain([100, 0])
            .rangeRound([20, this.h * 0.8]);

        var x = d3.scale.linear()
            .domain([0, l])
            .range([this.bar.start, this.bar.end, this.bar.width]);

        var gradient = this.vis.append("svg:defs")
                      .append("svg:linearGradient")
                        .attr("id", "gradient")
                        .attr("x1", "0%")
                        .attr("y1", "0%")
                        .attr("x2", "0%")
                        .attr("y2", "100%")
                        .attr("spreadMethod", "pad");

                    gradient.append("svg:stop")
                        .attr("offset", "0%")
                        .attr("stop-color", "#fff")
                        .attr("stop-opacity", 1);

                    gradient.append("svg:stop")
                        .attr("offset", "100%")
                        .attr("stop-color", "#e6e7e8")
                        .attr("stop-opacity", 1);


        rects.enter().append('rect')
            .attr('x', function(d, i){ return x(i) - 25;})
            .attr('width', function(d, i){ return me.bar.width + 60; })
            .attr('y', function(d, i){ return y(100) - 5;})
            .attr('height', function(d, i){ return  y(0) + 5;})
            .attr('fill', 'url(#gradient)');


        rects.enter().append('line')
            .attr('x1', function(d, i){ return x(i) + me.bar.width / 2; })
            .attr('x2', function(d, i) { return x(i) + me.bar.width / 2; })
            .attr('y1', function(d, i){ return y(d.min.value);})
            .attr('y2', function(d, i){ return y(d.max.value);})
            .attr('class', function(d, i){ return 'bw-line bw-line-mid bw-group-' + i;});

        rects.enter().append('rect')
            .attr('x', function(d, i){ return x(i); })
            .attr('width', function(d, i){ return  me.bar.width; })
            .attr('y', function(d, i){ return y(d.q2);})
            .attr('height', function(d, i){ return  y(d.q1) - y(d.q2) ;})
            .attr('class', function(d, i) { return 'bw-rect bw-lower bw-group-' + i; });

        rects.enter().append('rect')
            .attr('x', function(d, i){ return x(i); })
            .attr('width', function(d, i){ return me.bar.width; })
            .attr('y', function(d, i){ return y(d.q3);})
            .attr('height', function(d, i){ return  y(d.q2) - y(d.q3);})
            .attr('class', function(d, i) { return 'bw-rect bw-upper bw-group-' + i; });

        rects.enter().append('line')
            .attr('x1', function(d, i){ return x(i);})
            .attr('x2', function(d, i) { return  x(i) + me.bar.width;})
            .attr('y1', function(d, i){ return y(d.max.value);})
            .attr('y2', function(d, i){ return y(d.max.value);})
            .attr('class', function(d, i){ return 'bw-line bw-line-max bw-group-' + i;});

        rects.enter().append('line')
            .attr('x1', function(d, i){ return x(i);})
            .attr('x2', function(d, i) { return x(i) + me.bar.width;})
            .attr('y1', function(d, i){ return y(d.min.value);})
            .attr('y2', function(d, i){ return y(d.min.value);})
            .attr('class', function(d, i){ return 'bw-line bw-line-min bw-group-' + i;});

        rects.enter().append('line')
            .attr('x1', function(d, i){ return x(i);})
            .attr('x2', function(d, i) { return x(i) + me.bar.width;})
            .attr('y1', function(d, i){ return y(d.q2);})
            .attr('y2', function(d, i){ return y(d.q2);})
            .attr('class', function(d, i){ return 'bw-line bw-line-mid bw-group-' + i;});

        rects.enter().append('text')
            .attr('x', function(d, i){ return x(i) + me.bar.width;})
            .attr('dx', '0.5em')
            .attr('dy', '0.4em')
            .attr('y', function(d, i){ return y(d.max.value);})
            .attr('class', function(d, i){ return 'bw-text bw-text-max bw-group-' + i;})
            .text( function(d,i) { return d.max.label; });

        rects.enter().append('text')
            .attr('x', function(d, i){ return x(i) + me.bar.width;})
            .attr('dx', '0.5em')
            .attr('dy', '0.4em')
            .attr('y', function(d, i){ return y(d.min.value);})
            .attr('class', function(d, i){ return 'bw-text bw-text-min bw-group-' + i;})
            .text( function(d,i) { return d.min.label; });


        rects.enter().append('text')
            .attr('x', function(d, i){ return x(i) + me.bar.width / 2;})
            .attr('dx', '')
            .attr('text-anchor', 'middle')
            .attr('dy', '4em')
            .attr('y', function(d, i){ return y(0); })
            .attr('class', function(d, i){ return 'bw-text bw-text-label bw-group-' + i;})
            .text( function(d,i) { return d.region; });

        if (this.line.percent !== undefined){
            this.line.constant = this.line.percent * this.max;
        }

        if (this.line.average !== undefined){
            for (var j =0; j < data.length; j++){
                this.total += data[j].value;
            }
            var avg = this.total / data.length;
            this.line.constant = avg;
        }

        if (this.line.constant !== undefined){
                this.vis.selectAll('line.bw-constant-line')
                    .data([this.line.constant])
                    .enter().append('line')
                    .attr('x1', -50)
                    .attr('x2', this.w * 0.95)
                    .attr('y1', function(d) { return  y(d) ; })
                    .attr('y2', function(d) { return  y(d) ; })
                    .attr('class', 'bw-constant-line')
                    .attr('stroke-dasharray', '3')
                    .attr('stroke-width', '2')
                    .attr('stroke', this.line.color);

        }

    }


};
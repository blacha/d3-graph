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

    this.duration = ctx.duration || 1000;

    if (ctx.data !== undefined && ctx.data !== null){
        this.update_data(ctx.data);
    }
};

BoxWhisker.prototype = {

    update_data: function(data){
        if (data.length === undefined || data.length === 0) { return; }
        this.data = data;

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

        var old = d3.selectAll(this.node).select('.bw-chart');
        if (old.empty()){
            this.vis = d3.select(this.node).append('g')
                .attr('class','bw-chart')
                .attr("width", this.w)
                .attr("height", this.h);

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

                d3.select(this.node).append('g')
                    .attr('class','bw-line-g')
                    .attr("width", this.w)
                    .attr("height", this.h);

        }else {
            this.vis = d3.select(this.node).select('g.bw-chart');
        }
        this.line_g = d3.select(this.node).select('g.bw-line-g') ;



        var y = d3.scale.linear()
            .domain([100, 0])
            .rangeRound([20, this.h * 0.8]);

        var x = d3.scale.linear()
            .domain([0, l])
            .range([this.bar.start, this.bar.end, this.bar.width]);

        var gradients = this.vis.selectAll('rect.gradients').data(this.data);

        gradients.enter().append('rect')
            .attr('fill', 'url(#gradient)')
            .attr('class', 'gradients')
            .attr('x', function(d, i){ return x(i) - 25;})
            .attr('width', function(d, i){ return me.bar.width + 60; })
            .transition().duration(this.duration)
            .attr('x', function(d, i){ return x(i) - 25;})
            .attr('width', function(d, i){ return me.bar.width + 60; })
            .attr('y', function(d, i){ return y(100) - 5;})
            .attr('height', function(d, i){ return  y(0) + 5;});

        gradients.transition()
                .duration(this.duration / 2)
                .attr('width', function(d, i){ return me.bar.width + 60; })
                .attr('x', function(d, i){ return x(i) - 25;})
                .attr('width', function(d, i){ return me.bar.width + 60; })
                .attr('y', function(d, i){ return y(100) - 5;})
                .attr('height', function(d, i){ return  y(0) + 5;});

        gradients.exit().transition().attr('width',0).remove();


        var line_mid = this.vis.selectAll('line.bw-line-mid').data(this.data);
        line_mid.enter().append('line')
            .attr('class', function(d, i){ return 'bw-line bw-line-mid bw-group-' + i;})
            .attr('x1', function(d, i){ return x(i) + me.bar.width / 2; })
            .attr('x2', function(d, i){ return x(i) + me.bar.width / 2; })
            .attr('y2', function(d, i){ return y(d.max.value);})
            .attr('y1', function(d, i){ return y(d.max.value);})
            .transition().duration(this.duration)
            .attr('y1', function(d, i){ return y(d.min.value);})
            ;

        line_mid.transition().duration(this.duration  / 2)
            .attr('x1', function(d, i){ return x(i) + me.bar.width / 2; })
            .attr('x2', function(d, i){ return x(i) + me.bar.width / 2; })
            .attr('y1', function(d, i){ return y(d.min.value);})
            .attr('y2', function(d, i){ return y(d.max.value);});

        line_mid.exit().remove();

        var rects_lower = this.vis.selectAll('rect.bw-lower').data(this.data);
        rects_lower.enter().append('rect')
            .attr('x', function(d, i){ return x(i); })
            .attr('class', function(d, i) { return 'bw-rect bw-lower bw-group-' + i; })
            .attr('x', function(d, i){ return x(i); })
            .attr('width', function(d, i){ return  me.bar.width; })
            .attr('y', function(d, i){ return y(d.q2);})
            .transition().duration(this.duration)

            .attr('height', function(d, i){ return  y(d.q1) - y(d.q2) ;});


        rects_lower.transition().duration(this.duration  / 2)
            .attr('x', function(d, i){ return x(i); })
            .attr('width', function(d, i){ return  me.bar.width; })
            .attr('y', function(d, i){ return y(d.q2);})
            .attr('height', function(d, i){ return  y(d.q1) - y(d.q2) ;});

        rects_lower.exit().remove();

        var rects_higher = this.vis.selectAll('rect.bw-upper').data(this.data);
        rects_higher.enter().append('rect')
            .attr('x', function(d, i){ return x(i); })
            .attr('class', function(d, i) { return 'bw-rect bw-upper bw-group-' + i; })
            .attr('width', function(d, i){ return me.bar.width; })
            .attr('y', function(d, i){ return y(d.q3);})
            .transition().duration(this.duration)
            .attr('height', function(d, i){ return  y(d.q2) - y(d.q3);})
            .style('opacity', 1);

        rects_higher.transition().duration(this.duration  / 2)
            .attr('x', function(d, i){ return x(i); })
            .attr('width', function(d, i){ return me.bar.width; })
            .attr('y', function(d, i){ return y(d.q3);})
            .attr('height', function(d, i){ return  y(d.q2) - y(d.q3);});

        rects_higher.exit().remove();

        var line_max = this.vis.selectAll('line.bw-line-max').data(this.data);
        line_max.enter().append('line')
            .attr('class', function(d, i){ return 'bw-line bw-line-max bw-group-' + i;})
            .style('opacity', 0)
            .attr('y1', function(d, i){ return y(d.max.value);})
            .attr('x2', function(d, i) { return  x(i) + me.bar.width;})
            .attr('x1', function(d, i){ return x(i);})
            .attr('y1', function(d, i){ return y(d.max.value);})
            .attr('y2', function(d, i){ return y(d.max.value);})
            .transition().duration(this.duration)
            .style('opacity', 1);

        line_max.transition().duration(this.duration  / 2)
            .style('opacity', 1)
            .attr('y1', function(d, i){ return y(d.max.value);})
            .attr('x2', function(d, i) { return  x(i) + me.bar.width;})
            .attr('x1', function(d, i){ return x(i);})
            .attr('y1', function(d, i){ return y(d.max.value);})
            .attr('y2', function(d, i){ return y(d.max.value);});

        line_max.exit().remove();

        var line_min = this.vis.selectAll('line.bw-line-min').data(this.data);
        line_min.enter().append('line')
            .style('opacity', 0)
            .attr('x1', function(d, i){ return x(i);})
            .attr('x2', function(d, i) { return x(i) + me.bar.width;})
            .attr('y1', function(d, i){ return y(d.min.value);})
            .attr('y2', function(d, i){ return y(d.min.value);})
            .attr('class', function(d, i){ return 'bw-line bw-line-min bw-group-' + i;})
            .transition().duration(this.duration)
            .style('opacity', 1);

        line_min.transition().duration(this.duration  / 2)
            .style('opacity', 1)
            .attr('x1', function(d, i){ return x(i);})
            .attr('x2', function(d, i){ return x(i) + me.bar.width;})
            .attr('y1', function(d, i){ return y(d.min.value);})
            .attr('y2', function(d, i){ return y(d.min.value);});

        line_min.exit().remove();


        var text_max = this.vis.selectAll('text.bw-text-max').data(this.data);
        text_max.enter().append('text')
            .attr('x', function(d, i){ return x(i) + me.bar.width /2 ;})
            .attr('dy', '-0.75em')
            .attr('text-anchor', 'middle')
            .attr('y', function(d, i){ return y(d.max.value);})
            .attr('class', function(d, i){ return 'bw-text bw-text-max bw-group-' + i;})
            .text( function(d,i) { return d.max.label; });
        text_max.exit().remove();
        text_max.transition().duration(this.duration  / 2)
            .attr('x', function(d, i){ return x(i) + me.bar.width / 2;})

            .attr('dy', '-0.75em')
            .attr('text-anchor', 'middle')
            .attr('y', function(d, i){ return y(d.max.value);})
            .text( function(d,i) { return d.max.label; });

        var text_min = this.vis.selectAll('text.bw-text-min').data(this.data);
        text_min.enter().append('text')
            .attr('x', function(d, i){ return x(i) + me.bar.width / 2;})
            .attr('dy', '1.5em')
            .attr('text-anchor', 'middle')
            .attr('y', function(d, i){ return y(d.min.value);})
            .attr('class', function(d, i){ return 'bw-text bw-text-min bw-group-' + i;})
            .text( function(d,i) { return d.min.label; });

        text_min.transition().duration(this.duration  / 2)
            .attr('x', function(d, i){ return x(i) + me.bar.width / 2;})
            .attr('dy', '1.5em')
            .attr('text-anchor', 'middle')
            .text( function(d,i) { return d.min.label; })
            .attr('y', function(d, i){ return y(d.min.value);});

        text_min.exit().remove();

        var text_label = this.vis.selectAll('text.bw-text-label').data(this.data);
        text_label.enter().append('text')
            .attr('x', function(d, i){ return x(i) + me.bar.width / 2;})
            .attr('dx', '')
            .attr('text-anchor', 'middle')
            .attr('dy', '4em')
            .attr('y', function(d, i){ return y(0); })
            .attr('class', function(d, i){ return 'bw-text bw-text-label bw-group-' + i;})
            .text( function(d,i) { return d.region; });

        text_label.transition().duration(this.duration  / 2)
            .attr('x', function(d, i){ return x(i) + me.bar.width / 2;})
            .attr('dx', '')
            .attr('text-anchor', 'middle')
            .attr('dy', '4em')
            .attr('y', function(d, i){ return y(0); })
            .text( function(d,i) { return d.region; });
        text_label.exit().remove();


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
                var const_line = this.line_g.selectAll('line');
                //const_line.remove();
                const_line = const_line.data([this.line.constant]);

                const_line.enter().append('line')
                    .attr('x1', -60)
                    .attr('y1', function(d) { return  y(d) ; })
                    .attr('y2', function(d) { return  y(d) ; })
                    .attr('class', 'bw-constant-line')
                    .attr('stroke-dasharray', '3')
                    .attr('stroke-width', '2')
                    .attr('stroke', this.line.color)

                    .attr('x2', this.w * 0.95);

                const_line.transition().duration(this.duration)
                    .attr('y1', function(d) { return  y(d) ; })
                    .attr('x2', this.w * 0.95)
                    .attr('y2', function(d) { return  y(d) ; });

        }else {
            this.line_g.selectAll('line').remove();
        }

    }


};
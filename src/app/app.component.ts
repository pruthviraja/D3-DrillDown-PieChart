import { Component, OnInit, ElementRef, Input, EventEmitter } from '@angular/core';

import * as d3 from 'd3';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';

import * as $ from 'jquery';

import { POPULATION } from './shared';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @Input() colours: Array<string>;

  title = 'Pie Chart';

  private margin = { top: 20, right: 20, bottom: 30, left: 50 };
  private width: number; // width of SVG
  private height: number; // height of SVG
  private radius: number; // radius of Pie


  private arc: any;
  private arcGenerator: any;
  private labelArc: any;
  private pie: any;
  private pieGenerator: any;
  private color: any;
  private svg: any;
  private arcOver: any;
  private pieColours: any;

  // original filter options
  private originalFilters = [];
  private level = 0; // the deep of chart
  private MAXLEVEL = 2; // the highest deep of chart
  private defaultFilterOptions = ['Benedescription', 'BeneCategory', 'BeneSubcategory']; // default filter
  selectedSlice;
  private tooltip;
  private chart;
  private innerRadius = 20;

  tooltipModel: any = {
    cover: null,
    point: null,
    content: ''
  }; // model for tooltip

  _current: any; // temporaray variable for tween

  private _InitialChartData = [ // real chart data from raw data which is used for drawing chart. It has two fields named `type` & `percent`
    { type: 'Used Benefit', percent: 0 },
    { type: 'Unused Benefit', percent: 0 }
  ];

  constructor(private elRef: ElementRef) {
    this.selectedSlice = {};
    this.width = 900 - this.margin.left - this.margin.right;
    this.height = 500 - this.margin.top - this.margin.bottom;
    this.radius = Math.min(this.width, this.height) / 2;

  }


  /**
   * initialize component ===============================================================
   */
  ngOnInit() {
    const options = this.getOptions(this.defaultFilterOptions[this.level]);
    this.transformChartData(this.defaultFilterOptions[this.level], options);
    this.initSvg();
    this.drawPie();

  }

  /**
   * initialize SVG =======================================================================
   */
  private initSvg() {

    if (this._InitialChartData.length === 0) {
      return;
    }

    const colors = [];

    this._InitialChartData = this._InitialChartData.sort(function (a, b) {
      return b.percent - a.percent;
    });

    let colorStep = 200 / this._InitialChartData.length;
    colorStep = colorStep > 60 ? 60 : colorStep;
    let colorVal = 255;
    for (let i = 0; i < this._InitialChartData.length; i++) {
      if (this.level === 0) { // Hue : blue :=rgb(0, 0, 255)
        colors.push('rgb(20, 20,' + colorVal + ')');
      }
      if (this.level === 1) { // Hue : green :=rgb(0, 255, 0)
        colors.push('rgb(20, ' + colorVal + ', 20)');
      }
      if (this.level === 2) { // Hue : blue :=rgb(0, 0, 255)
        colors.push('rgb(20, 20,' + colorVal + ')');
      }
      colorVal -= colorStep;
    }

    this.color = d3Scale.scaleOrdinal()
      .range(colors);
    this.arc = d3Shape.arc()
      .outerRadius(this.radius)
      .innerRadius(this.innerRadius);
    this.arcGenerator = d3.arc()
      .innerRadius(this.innerRadius)
      .outerRadius(this.radius);
    this.arcOver = d3Shape.arc()
      .outerRadius(this.radius + 20)
      .innerRadius(40);
    this.labelArc = d3Shape.arc()
      .outerRadius(this.radius - 100)
      .innerRadius(this.radius - 100);
    this.pie = d3Shape.pie()
      .sort(null)
      .value((d: any) => d.percent);

    this.svg = d3.select('svg')
      .append('g')
      .attr('transform', 'translate(' + this.width / 2 + ',' + this.height / 2 + ')');

    this.tooltip = this.elRef.nativeElement.querySelector('.tooltip');


  }

  /**
   *
   * @param field : same as in getOptions
   * @param options : return result from getOptions
   */
  private transformChartData(field, options) {
    let item = null;
    this._InitialChartData = [];
    for (let i = 0; i < options.length; i++) {
      item = {};
      item.type = options[i];
      item.percent = 0;
      this._InitialChartData.push(item);
    }
    for (let i = 0; i < POPULATION.length; i++) {
      for (let j = 0; j < this._InitialChartData.length; j++) {
        item = this._InitialChartData[j];
        if (item.type === POPULATION[i][field]) {
          item.percent += 1;
          this._InitialChartData[j] = item;
        }
      }
    }
    let totalCount = 0;
    for (let i = 0; i < this._InitialChartData.length; i++) {
      item = this._InitialChartData[i];
      totalCount += item.percent;
    }
    for (let i = 0; i < this._InitialChartData.length; i++) {
      item = this._InitialChartData[i];
      item.percent = (item.percent / totalCount) * 100;
      this._InitialChartData[i] = item;
    }

  }

  /**
   *
   * @param field : field of POPULATION which used to filter in proper level.
   * @returns options: current filter options which are used to display in paths or legend for current level.
   */
  private getOptions(field) {
    let result = POPULATION;
    let item = {};
    let i = 0;
    const options = [];
    for (i = 0; i < this.originalFilters.length; i++) {
      item = this.originalFilters[i];
      result = result.filter((d) => {
        return d[item['key']] === item['value'];
      });

    }
    for (i = 0; i < result.length; i++) {
      item = result[i];
      if (options.indexOf(item[field]) === -1) {
        options.push(item[field]);
      }
    }
    return options;
  }

  // ================ drawing handler =================================
  private drawPie() {
    const parent = this;
    const g = this.svg.selectAll('.arc')
      .data(this.pie(this._InitialChartData))
      .enter().append('g')
      .attr('class', 'arc');
    const path = g.append('path').attr('d', this.arc)
      .style('fill', (d: any) => parent.color(d.data.type))
      .style('transform', 'scale(.95,.95)');

    // chart
    this.chart = d3.select('svg');


    // ===================================== legend === start =====================================================
    let count = 0;
    const legend = this.chart.selectAll('.legend')
      .data(this._InitialChartData).enter()
      .append('g').attr('class', 'legend')
      .attr('legend-id', function (d) {
        return count++;
      })
      .attr('transform', function (d, i) {
        // tslint:disable-next-line:radix
        return 'translate(15,' + (parseInt('-' + (parent._InitialChartData.length * 10)) + i * 28 + 50) + ')';
      })
      .style('cursor', 'pointer');

    const leg = legend.append('rect');

    leg.attr('x', this.width)
      .attr('width', 18).attr('height', 18)
      .style('fill', function (d) {
        return parent.color(d['type']);
      })
      .style('opacity', function (d) {
        return d.percent;
      });
    legend.append('text').attr('x', (this.width) - 5)
      .attr('y', 9).attr('dy', '.35em')
      .style('text-anchor', 'end').text(function (d) {
        return d.type;
      });

    leg.append('svg:title')
      .text(function (d) {
        return d.type + ' (' + d.percent + ')';
      });

    // ================= end legend ========= Define click handlers ==============================
    this.chart.selectAll('path').on('click', function(d, i) {parent.onPathClick(d.data.type); } );
    this.chart.selectAll('.legend').on('click', function(d, i) {parent.onPathClick(d.type); } );

    // ================================ end Tween ==========================================
    // ============================ Paths mouse move or out handler ========================
    path.on('mousemove', function (d, i) {

      parent.selectedSlice = d.data;

      parent.tooltipModel.point = { 'background-color': this.style.fill };

      parent.tooltipModel.content = d.data.type + '  :  ' + d.data.percent.toFixed(2) + ' %';

      // tslint:disable-next-line:max-line-length
      parent.tooltipModel.cover = { display: 'block', position: 'absolute', top: d3.event.pageY + 'px', left: (d3.event.pageX - 10) + 'px' };

      this.style.transition = 'all .1s ease-in-out';
      this.style.transform = 'none';

    }).on('mouseout', function (d) {
      this.style.transition = 'all .1s ease-in-out';
      this.style.transform = 'scale(.95, .95)';
      parent.tooltipModel.cover = {display: 'none'};

    });

  }


  arcTween(newValues, i, slice) {
    const interpolation = d3.interpolate(slice.storedValues, newValues);
    slice.storedValues = interpolation(0);

    return (t) => {
      return this.arcGenerator(interpolation(t));
    };
  }

  // ============================= Paths click handler ======================================
  onPathClick = (filterOption) => {
    // console.log(filterOption);
    let options = [];
    $('text').html('');

    if (this.level < this.MAXLEVEL) {
      this.originalFilters.push({
        key: this.defaultFilterOptions[this.level], value: filterOption
      });
      this.level++;
      options = this.getOptions(this.defaultFilterOptions[this.level]);

    } else {
      this.level = 0;
      this.originalFilters = [];
      options = this.getOptions(this.defaultFilterOptions[this.level]);
    }
    $(this).css({
      'transition': 'all .1s ease-in-out',
      'transform': 'none'
    });
    this.updatePie(options);

  }

  // =============== update pie if click paths, inner circle or legend ======================
  updatePie = (options) => {
    d3.selectAll('svg > *').remove();
    $('.content').hide().fadeIn('middle');
    this.transformChartData(this.defaultFilterOptions[this.level], options);
    this.initSvg();
    this.drawPie();
  }

  // =================  arc Tween (for animation) ============================================
  tweenIn = (data) => {
    data.startAngle = data.endAngle = (2 * Math.PI);
    const interpolation = d3.interpolate(this._current, data);
    this._current = interpolation(0);
    return function (t) {
      return this.arc(interpolation(t));
    };
  }

  tweenOut = (data) => {
    data.startAngle = data.endAngle = (2 * Math.PI);
    const interpolation = d3.interpolate(this._current, data);
    this._current = interpolation(0);
    return function (t) {
      return this.arc(interpolation(t));
    };
  }



  // ================================= Svg click handler ======================================
  onSvgClick = (event) => {
    console.log(event);
    const _target = $(event.target);
    const posX = event.clientX;
    const posY = event.clientY;
    const rr = (posX - this.width / 2) * (posX - this.width / 2) + (posY - this.height / 2) * (posY - this.height / 2);
    if (rr >= this.innerRadius * this.innerRadius) { // if not inner Circle
        return;
    }

    // ================= if inner circle =: Go back level:=0 ===================================
    this.level = 0;
    this.originalFilters = [];
    const options = this.getOptions(this.defaultFilterOptions[this.level]);
    this.updatePie(options);
  }
}

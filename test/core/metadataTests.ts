///<reference path="../testReference.ts" />

var assert = chai.assert;

describe("Metadata", () => {
  var xScale: Plottable.Scales.Linear;
  var yScale: Plottable.Scales.Linear;
  var data1 = [{x: 0, y: 0}, {x: 1, y: 1}];
  var data2 = [{x: 2, y: 2}, {x: 3, y: 3}];
  before(() => {
    xScale = new Plottable.Scales.Linear();
    yScale = new Plottable.Scales.Linear();
    xScale.domain([0, 400]);
    yScale.domain([400, 0]);
  });

  it("Dataset is passed in", () => {
    var svg = TestMethods.generateSVG(400, 400);
    var metadata = {foo: 10, bar: 20};
    var xAccessor = (d: any, i: number, dataset: Plottable.Dataset) => d.x + i * dataset.metadata().foo;
    var yAccessor = (d: any, i: number, dataset: Plottable.Dataset) => dataset.metadata().bar;
    var dataset = new Plottable.Dataset(data1, metadata);
    var plot = new Plottable.Plots.Scatter()
                                  .x(xAccessor, xScale)
                                  .y(yAccessor, yScale);
    plot.addDataset(dataset);
    plot.renderTo(svg);
    var circles = plot.getAllSelections();
    var c1 = d3.select(circles[0][0]);
    var c2 = d3.select(circles[0][1]);
    var c1Position = d3.transform(c1.attr("transform")).translate;
    var c2Position = d3.transform(c2.attr("transform")).translate;
    assert.closeTo(c1Position[0], 0, 0.01, "first circle cx is correct");
    assert.closeTo(c1Position[1], 20, 0.01, "first circle cy is correct");
    assert.closeTo(c2Position[0], 11, 0.01, "second circle cx is correct");
    assert.closeTo(c2Position[1], 20, 0.01, "second circle cy is correct");

    metadata = {foo: 0, bar: 0};
    dataset.metadata(metadata);
    c1Position = d3.transform(c1.attr("transform")).translate;
    c2Position = d3.transform(c2.attr("transform")).translate;

    assert.closeTo(c1Position[0], 0, 0.01, "first circle cx is correct after metadata change");
    assert.closeTo(c1Position[1], 0, 0.01, "first circle cy is correct after metadata change");
    assert.closeTo(c2Position[0], 1, 0.01, "second circle cx is correct after metadata change");
    assert.closeTo(c2Position[1], 0, 0.01, "second circle cy is correct after metadata change");

    svg.remove();
  });

  it("user metadata is applied to associated dataset", () => {
    var svg = TestMethods.generateSVG(400, 400);
    var metadata1 = {foo: 10};
    var metadata2 = {foo: 30};
    var xAccessor = (d: any, i: number, dataset: Plottable.Dataset) => d.x + (i + 1) * dataset.metadata().foo;
    var yAccessor = () => 0;
    var dataset1 = new Plottable.Dataset(data1, metadata1);
    var dataset2 = new Plottable.Dataset(data2, metadata2);
    var plot = new Plottable.Plots.Scatter()
                                  .x(xAccessor, xScale)
                                  .y(yAccessor, yScale);
    plot.addDataset(dataset1);
    plot.addDataset(dataset2);
    plot.renderTo(svg);
    var circles = plot.getAllSelections();
    var c1 = d3.select(circles[0][0]);
    var c2 = d3.select(circles[0][1]);
    var c3 = d3.select(circles[0][2]);
    var c4 = d3.select(circles[0][3]);

    var c1Position = d3.transform(c1.attr("transform")).translate;
    var c2Position = d3.transform(c2.attr("transform")).translate;
    var c3Position = d3.transform(c3.attr("transform")).translate;
    var c4Position = d3.transform(c4.attr("transform")).translate;
    assert.closeTo(c1Position[0], 10, 0.01, "first circle is correct");
    assert.closeTo(c2Position[0], 21, 0.01, "second circle is correct");
    assert.closeTo(c3Position[0], 32, 0.01, "third circle is correct");
    assert.closeTo(c4Position[0], 63, 0.01, "fourth circle is correct");

    svg.remove();
  });

  it("each plot passes metadata to projectors", () => {
    var svg = TestMethods.generateSVG(400, 400);
    var metadata = {foo: 11};
    var dataset1 = new Plottable.Dataset(data1, metadata);
    var dataset2 = new Plottable.Dataset(data2, metadata);

    var checkXYPlot = (plot: Plottable.XYPlot<any, any>) => {
      var xAccessor = (d: any, i: number, dataset: Plottable.Dataset) => {
          return d.x + dataset.metadata().foo;
      };
      var yAccessor = (d: any, i: number, dataset: Plottable.Dataset) => {
          return d.y + dataset.metadata().foo;
      };
      plot.addDataset(dataset1)
          .addDataset(dataset2);
      plot.x(xAccessor, xScale)
          .y(yAccessor, yScale);

      // This should not crash. If some metadata is not passed, undefined property error will be raised during accessor call.
      plot.renderTo(svg);
      plot.destroy();
    };

    var checkPiePlot = (plot: Plottable.Plots.Pie) => {
      plot.sectorValue((d) => d.x).addDataset(dataset1);

      // This should not crash. If some metadata is not passed, undefined property error will be raised during accessor call.
      plot.renderTo(svg);
      plot.destroy();
    };

    checkXYPlot(new Plottable.Plots.Area());
    checkXYPlot(new Plottable.Plots.StackedArea());
    checkXYPlot(new Plottable.Plots.Bar());
    checkXYPlot(new Plottable.Plots.StackedBar());
    checkXYPlot(new Plottable.Plots.StackedBar( Plottable.Plots.Bar.ORIENTATION_HORIZONTAL));
    checkXYPlot(new Plottable.Plots.ClusteredBar());
    checkXYPlot(new Plottable.Plots.Bar(Plottable.Plots.Bar.ORIENTATION_HORIZONTAL));
    checkXYPlot(new Plottable.Plots.Scatter());
    checkPiePlot(new Plottable.Plots.Pie());
    svg.remove();
  });
});

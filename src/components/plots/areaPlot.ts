///<reference path="../../reference.ts" />

module Plottable {
export module Plots {
  export class Area<X> extends Line<X> {
    private static _Y0_KEY = "y0";
    private _lineDrawers: Utils.Map<Dataset, Drawers.Line>;

    /**
     * An Area Plot draws a filled region (area) between Y and Y0.
     * 
     * @constructor
     * @param {QuantitativeScale} xScale
     * @param {QuantitativeScale} yScale
     */
    constructor() {
      super();
      this.classed("area-plot", true);
      this.y0(0); // default
      this.animator(Plots.Animator.MAIN, new Animators.Base().duration(600).easing("exp-in-out"));
      this.attr("fill-opacity", 0.25);
      this.attr("fill", new Scales.Color().range()[0]);

      this._lineDrawers = new Utils.Map<Dataset, Drawers.Line>();
    }

    protected _setup() {
      super._setup();
      this._lineDrawers.values().forEach((d) => d.setup(this._renderArea.append("g")));
    }

    public y(): Plots.AccessorScaleBinding<number, number>;
    public y(y: number | Accessor<number>): Area<X>;
    public y(y: number | Accessor<number>, yScale: QuantitativeScale<number>): Area<X>;
    public y(y?: number | Accessor<number>, yScale?: QuantitativeScale<number>): any {
      if (y == null) {
        return super.y();
      }

      if (yScale == null) {
        super.y(y);
      } else {
        super.y(y, yScale);
      }

      if (yScale != null) {
        var y0 = this.y0().accessor;
        if (y0 != null) {
          this._bindProperty(Area._Y0_KEY, y0, yScale);
        }
        this._updateYScale();
      }
      return this;
    }

    /**
     * Gets the AccessorScaleBinding for Y0.
     */
    public y0(): Plots.AccessorScaleBinding<number, number>;
    /**
     * Sets Y0 to a constant number or the result of an Accessor<number>.
     * If a Scale has been set for Y, it will also be used to scale Y0.
     * 
     * @param {number|Accessor<number>} y0
     * @returns {Area} The calling Area Plot.
     */
    public y0(y0: number | Accessor<number>): Area<X>;
    public y0(y0?: number | Accessor<number>): any {
      if (y0 == null) {
        return this._propertyBindings.get(Area._Y0_KEY);
      }
      var yBinding = this.y();
      var yScale = yBinding && yBinding.scale;
      this._bindProperty(Area._Y0_KEY, y0, yScale);
      this._updateYScale();
      this.render();
      return this;
    }

    protected _onDatasetUpdate() {
      super._onDatasetUpdate();
      this._updateYScale();
    }

    public addDataset(dataset: Dataset) {
      var lineDrawer = new Drawers.Line(dataset);
      if (this._isSetup) {
        lineDrawer.setup(this._renderArea.append("g"));
      }
      this._lineDrawers.set(dataset, lineDrawer);
      super.addDataset(dataset);
      return this;
    }

    protected _additionalPaint() {
      var drawSteps = this._generateLineDrawSteps();
      var dataToDraw = this._getDataToDraw();
      this._datasetKeysInOrder.forEach((k, i) => {
        var dataset = this._key2PlotDatasetKey.get(k).dataset;
        this._lineDrawers.get(dataset).draw(dataToDraw.get(k), drawSteps);
      });
    }

    private _generateLineDrawSteps() {
      var drawSteps: Drawers.DrawStep[] = [];
      if (this._dataChanged && this._animate) {
        var attrToProjector = this._generateLineAttrToProjector();
        attrToProjector["d"] = this._constructLineProjector(Plot._scaledAccessor(this.x()), this._getResetYFunction());
        drawSteps.push({attrToProjector: attrToProjector, animator: this._getAnimator("reset")});
      }
      drawSteps.push({attrToProjector: this._generateLineAttrToProjector(), animator: this._getAnimator("main")});
      return drawSteps;
    }

    private _generateLineAttrToProjector() {
      var lineAttrToProjector = this._generateAttrToProjector();
      lineAttrToProjector["d"] = this._constructLineProjector(Plot._scaledAccessor(this.x()), Plot._scaledAccessor(this.y()));
      return lineAttrToProjector;
    }

    protected _getDrawer(dataset: Dataset) {
      return new Plottable.Drawers.Area(dataset);
    }

    protected _generateDrawSteps(): Drawers.DrawStep[] {
      var drawSteps: Drawers.DrawStep[] = [];
      if (this._dataChanged && this._animate) {
        var attrToProjector = this._generateAttrToProjector();
        attrToProjector["d"] = this._constructAreaProjector(Plot._scaledAccessor(this.x()),
                                                            this._getResetYFunction(),
                                                            Plot._scaledAccessor(this.y0()));
        drawSteps.push({attrToProjector: attrToProjector, animator: this._getAnimator("reset")});
      }

      drawSteps.push({attrToProjector: this._generateAttrToProjector(), animator: this._getAnimator("main")});

      return drawSteps;
    }

    protected _updateYScale() {
      var extents = this._propertyExtents.get("y0");
      var extent = Utils.Methods.flatten<number>(extents);
      var uniqExtentVals = Utils.Methods.uniq<number>(extent);
      var constantBaseline = uniqExtentVals.length === 1 ? uniqExtentVals[0] : null;

      var yBinding = this.y();
      var yScale = <QuantitativeScale<number>> (yBinding && yBinding.scale);
      if (yScale == null) {
        return;
      }

      if (constantBaseline != null) {
        yScale.addPaddingException(this, constantBaseline);
      } else {
        yScale.removePaddingException(this);
      }
    }

    protected _getResetYFunction() {
      return Plot._scaledAccessor(this.y0());
    }

    protected _propertyProjectors(): AttributeToProjector {
      var propertyToProjectors = super._propertyProjectors();
      propertyToProjectors["d"] = this._constructAreaProjector(Plot._scaledAccessor(this.x()),
                                                               Plot._scaledAccessor(this.y()),
                                                               Plot._scaledAccessor(this.y0()));
      return propertyToProjectors;
    }

    public getAllSelections(datasets = this.datasets()) {
      var allSelections = super.getAllSelections(datasets)[0];
      var lineDrawers = datasets.map((dataset) => this._lineDrawers.get(dataset))
                                .filter((drawer) => drawer != null);
      lineDrawers.forEach((ld, i) => allSelections.push(ld._getSelection(i).node()));
      return d3.selectAll(allSelections);
    }

    public getAllPlotData(datasets = this.datasets()): Plots.PlotData {
      var allPlotData = super.getAllPlotData(datasets);
      var allElements = allPlotData.selection[0];

      this._keysForDatasets(datasets).forEach((datasetKey) => {
        var plotDatasetKey = this._key2PlotDatasetKey.get(datasetKey);
        if (plotDatasetKey == null) { return; }
        var dataset = plotDatasetKey.dataset;
        var drawer = this._lineDrawers.get(dataset);
        dataset.data().forEach((datum: any, index: number) => {
          var pixelPoint = this._pixelPoint(datum, index, dataset);
          if (pixelPoint.x !== pixelPoint.x || pixelPoint.y !== pixelPoint.y) {
            return;
          }
          allElements.push(drawer._getSelection(index).node());
        });
      });

      return { data: allPlotData.data, pixelPoints: allPlotData.pixelPoints, selection: d3.selectAll(allElements) };
    }

    protected _constructAreaProjector(xProjector: _Projector, yProjector: _Projector, y0Projector: _Projector) {
      var definedProjector = (d: any, i: number, dataset: Dataset) => {
        var positionX = Plot._scaledAccessor(this.x())(d, i, dataset);
        var positionY = Plot._scaledAccessor(this.y())(d, i, dataset);
        return Utils.Methods.isValidNumber(positionX) && Utils.Methods.isValidNumber(positionY);
      };
      return (datum: any[], index: number, dataset: Dataset) => {
        var areaGenerator = d3.svg.area()
                                  .x((innerDatum, innerIndex) => xProjector(innerDatum, innerIndex, dataset))
                                  .y1((innerDatum, innerIndex) => yProjector(innerDatum, innerIndex, dataset))
                                  .y0((innerDatum, innerIndex) => y0Projector(innerDatum, innerIndex, dataset))
                                  .defined((innerDatum, innerIndex) => definedProjector(innerDatum, innerIndex, dataset));
        return areaGenerator(datum, index);
      };
    }
  }
}
}

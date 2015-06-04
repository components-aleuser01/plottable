///<reference path="../reference.ts" />

module Plottable {
export module Drawers {
  /**
   * A step for the drawer to draw.
   *
   * Specifies how AttributeToProjector needs to be animated.
   */
  export type DrawStep = {
    attrToProjector: AttributeToProjector;
    animator: Animators.Plot;
  };

  export type AppliedDrawStep = {
    attrToAppliedProjector: AttributeToAppliedProjector;
    animator: Animators.Plot;
  };

}

  export class Drawer {
    private _renderArea: d3.Selection<void>;
    protected _className: string;
    protected _dataset: Dataset;

    /**
     * Constructs a Drawer
     *
     * @constructor
     * @param {Dataset} dataset The dataset associated with this Drawer
     */
    constructor(dataset: Dataset) {
        this._dataset = dataset;
    }

    public setup(area: d3.Selection<void>) {
      this._renderArea = area;
    }

    /**
     * Removes the Drawer and its renderArea
     */
    public remove() {
      if (this.renderArea() != null) {
        this.renderArea().remove();
      }
    }

    /**
     * Enter new data to render area and creates binding
     *
     * @param{any[]} data The data to be drawn
     */
    protected _enterData(data: any[]) {
      // no-op
    }

    /**
     * Draws data using one step
     *
     * @param{AppliedDrawStep} step The step, how data should be drawn.
     */
    protected _drawStep(step: Drawers.AppliedDrawStep) {
      // no-op
    }

    protected _numberOfAnimationIterations(data: any[]): number {
      return data.length;
    }

    private _appliedProjectors(attrToProjector: AttributeToProjector): AttributeToAppliedProjector {
      var modifiedAttrToProjector: AttributeToAppliedProjector = {};
      Object.keys(attrToProjector).forEach((attr: string) => {
        modifiedAttrToProjector[attr] =
          (datum: any, index: number) => attrToProjector[attr](datum, index, this._dataset);
      });

      return modifiedAttrToProjector;
    }

    /**
     * Draws the data into the renderArea using the spefic steps and metadata
     *
     * @param{any[]} data The data to be drawn
     * @param{DrawStep[]} drawSteps The list of steps, which needs to be drawn
     */
    public draw(data: any[], drawSteps: Drawers.DrawStep[]) {
      var appliedDrawSteps: Drawers.AppliedDrawStep[] = drawSteps.map((dr: Drawers.DrawStep) => {
        var attrToAppliedProjector = this._appliedProjectors(dr.attrToProjector);
        return {
          attrToAppliedProjector: attrToAppliedProjector,
          animator: dr.animator
        };
      });

      this._enterData(data);
      var numberOfIterations = this._numberOfAnimationIterations(data);

      var delay = 0;
      appliedDrawSteps.forEach((drawStep, i) => {
        Utils.Methods.setTimeout(() => this._drawStep(drawStep), delay);
        delay += drawStep.animator.totalTime(numberOfIterations);
      });

      return delay;
    }

    /**
     * Retrieves the renderArea selection for the drawer
     *
     * @returns {d3.Selection} the renderArea selection
     */
    public renderArea() {
      return this._renderArea;
    }

    /**
     * Returns the selector for this Drawer's visual elements.
     */
    public selector() {
      return "";
    }

    /**
     * Returns the D3 selection corresponding to the datum with the specified index.
     */
    public selectionForIndex(index: number) {
      var allSelections = this.renderArea().selectAll(this.selector());
      return d3.select(allSelections[0][index]);
    }

  }
}

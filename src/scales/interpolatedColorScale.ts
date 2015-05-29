///<reference path="../reference.ts" />

module Plottable {
export module Scales {
  export class InterpolatedColor extends Scale<number, string> {
    public static REDS = [
      "#FFFFFF", // white
      "#FFF6E1",
      "#FEF4C0",
      "#FED976",
      "#FEB24C",
      "#FD8D3C",
      "#FC4E2A",
      "#E31A1C",
      "#B10026" // red
    ];
    public static BLUES = [
      "#FFFFFF", // white
      "#CCFFFF",
      "#A5FFFD",
      "#85F7FB",
      "#6ED3EF",
      "#55A7E0",
      "#417FD0",
      "#2545D3",
      "#0B02E1" // blue
    ];
    public static POSNEG = [
      "#0B02E1", // blue
      "#2545D3",
      "#417FD0",
      "#55A7E0",
      "#6ED3EF",
      "#85F7FB",
      "#A5FFFD",
      "#CCFFFF",
      "#FFFFFF", // white
      "#FFF6E1",
      "#FEF4C0",
      "#FED976",
      "#FEB24C",
      "#FD8D3C",
      "#FC4E2A",
      "#E31A1C",
      "#B10026" // red
    ];
    private _colorRange: string[];
    private _colorScale: D3.Scale.QuantitativeScale<number>;
    private _d3Scale: D3.Scale.QuantitativeScale<number>;

    /**
     * An InterpolatedColor Scale maps numbers to color hex values, expressed as strings.
     *
     * @constructor
     * @param {string[]} [colors=InterpolatedColor.REDS] an array of strings representing color hex values
     *   ("#FFFFFF") or keywords ("white").
     * @param {string} [scaleType="linear"] One of "linear"/"log"/"sqrt"/"pow".
     */
    constructor(colorRange = InterpolatedColor.REDS, scaleType = "linear") {
      super();
      this._colorRange = colorRange;
      switch (scaleType) {
        case "linear":
          this._colorScale = d3.scale.linear();
          break;
        case "log":
          this._colorScale = d3.scale.log();
          break;
        case "sqrt":
          this._colorScale = d3.scale.sqrt();
          break;
        case "pow":
          this._colorScale = d3.scale.pow();
          break;
      }
      if (this._colorScale == null) {
        throw new Error("unknown QuantitativeScale scale type " + scaleType);
      }
      this._d3Scale = this._D3InterpolatedScale();
    }

    public extentOfValues(values: number[]) {
      var extent = d3.extent(values);
      if (extent[0] == null || extent[1] == null) {
        return [];
      } else {
        return extent;
      }
    }

    /**
     * Generates the converted QuantitativeScale.
     *
     * @returns {D3.Scale.QuantitativeScale} The converted d3 QuantitativeScale
     */
    private _D3InterpolatedScale(): D3.Scale.QuantitativeScale<number> {
      return this._colorScale.range([0, 1]).interpolate(this._interpolateColors());
    }

    /**
     * Generates the d3 interpolator for colors.
     *
     * @return {D3.Transition.Interpolate} The d3 interpolator for colors.
     */
    private _interpolateColors(): D3.Transition.Interpolate {
      var colors = this._colorRange;
      if (colors.length < 2) {
        throw new Error("Color scale arrays must have at least two elements.");
      };
      return (ignored: any) => {
        return (t: number) => {
          // Clamp t parameter to [0,1]
          t = Math.max(0, Math.min(1, t));

          // Determine indices for colors
          var tScaled = t * (colors.length - 1);
          var i0 = Math.floor(tScaled);
          var i1 = Math.ceil(tScaled);
          var frac = (tScaled - i0);

          // Interpolate in the L*a*b color space
          return d3.interpolateLab(colors[i0], colors[i1])(frac);
        };
      };
    }

    /**
     * Gets the color range.
     *
     * @returns {string[]}
     */
    public colorRange(): string[];
    /**
     * Sets the color range.
     *
     * @param {string[]} colorRange
     * @returns {InterpolatedColor} The calling InterpolatedColor Scale.
     */
    public colorRange(colorRange: string[]): InterpolatedColor;
    public colorRange(colorRange?: string[]): any {
      if (colorRange == null) {
        return this._colorRange;
      }
      this._colorRange = colorRange;
      this._resetScale();
      return this;
    }

    private _resetScale(): any {
      this._d3Scale = this._D3InterpolatedScale();
      this._autoDomainIfAutomaticMode();
      this._dispatchUpdate();
    }

    public autoDomain() {
      // InterpolatedColorScales do not pad
      var extents = this._getAllExtents();
      if (extents.length > 0) {
        this._setDomain([Utils.Methods.min(extents, (x) => x[0], 0), Utils.Methods.max(extents, (x) => x[1], 0)]);
      }
      return this;
    }

    public scale(value: number) {
      // HACKHACK D3 Quantitative Scales should return their interpolator return type
      return <string> <any> this._d3Scale(value);
    }

    protected _getDomain() {
      return this._d3Scale.domain();
    }

    protected _setBackingScaleDomain(values: number[]) {
      this._d3Scale.domain(values);
    }

    protected _getRange() {
      return this.colorRange();
    }

    protected _setRange(values: string[]) {
      this.colorRange(values);
    }
  }
}
}

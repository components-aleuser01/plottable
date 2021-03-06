
module Plottable {
export module Utils {
  export module DOM {
    var nativeMath: Math = (<any>window).Math;

    /**
     * Gets the bounding box of an element.
     * @param {d3.Selection} element
     * @returns {SVGRed} The bounding box.
     */
    export function getBBox(element: d3.Selection<any>): SVGRect {
      var bbox: SVGRect;
      // HACKHACK: Firefox won't correctly measure nodes with style "display: none" or their descendents (FF Bug 612118).
      try {
        bbox = (<any> element.node()).getBBox();
      } catch (err) {
        bbox = {
          x: 0, y: 0, width: 0, height: 0
        };
      }
      return bbox;
    }

    export var POLYFILL_TIMEOUT_MSEC = 1000 / 60; // 60 fps
    export function requestAnimationFramePolyfill(fn: () => any): void {
      if (window.requestAnimationFrame != null) {
        window.requestAnimationFrame(fn);
      } else {
        setTimeout(fn, POLYFILL_TIMEOUT_MSEC);
      }
    }

    function getParsedStyleValue(style: CSSStyleDeclaration, prop: string): number {
      var value: any = style.getPropertyValue(prop);
      var parsedValue = parseFloat(value);
      if (parsedValue !== parsedValue) {
          return 0;
      }
      return parsedValue;
    }

    export function isSelectionRemovedFromSVG(selection: d3.Selection<any>) {
      var n = (<Node> selection.node());
      while (n !== null && n.nodeName.toLowerCase() !== "svg") {
        n = n.parentNode;
      }
      return (n == null);
    }

    export function getElementWidth(elem: Element): number {
      var style: CSSStyleDeclaration = window.getComputedStyle(elem);
      return getParsedStyleValue(style, "width")
        + getParsedStyleValue(style, "padding-left")
        + getParsedStyleValue(style, "padding-right")
        + getParsedStyleValue(style, "border-left-width")
        + getParsedStyleValue(style, "border-right-width");
    }

    export function getElementHeight(elem: Element): number {
      var style: CSSStyleDeclaration = window.getComputedStyle(elem);
      return getParsedStyleValue(style, "height")
        + getParsedStyleValue(style, "padding-top")
        + getParsedStyleValue(style, "padding-bottom")
        + getParsedStyleValue(style, "border-top-width")
        + getParsedStyleValue(style, "border-bottom-width");
    }

    export function getSVGPixelWidth(svg: d3.Selection<void>) {
      var width = (<Element> svg.node()).clientWidth;

      if (width === 0) { // Firefox bug #874811
        var widthAttr = svg.attr("width");

        if (widthAttr.indexOf("%") !== -1) { // percentage
          var ancestorNode = <Element> (<Element> svg.node()).parentNode;
          while (ancestorNode != null && ancestorNode.clientWidth === 0) {
            ancestorNode = <Element> ancestorNode.parentNode;
          }
          if (ancestorNode == null) {
            throw new Error("Could not compute width of element");
          }
          width = ancestorNode.clientWidth * parseFloat(widthAttr) / 100;
        } else {
          width = parseFloat(widthAttr);
        }
      }

      return width;
    }

    export function translate(s: d3.Selection<any>): d3.Transform;
    export function translate(s: d3.Selection<any>, x: number, y: number): d3.Selection<any>
    export function translate(s: d3.Selection<any>, x?: number, y?: number): any {
      var xform = d3.transform(s.attr("transform"));
      if (x == null) {
        return xform.translate;
      } else {
        y = (y == null) ? 0 : y;
        xform.translate[0] = x;
        xform.translate[1] = y;
        s.attr("transform", xform.toString());
        return s;
      }
    }

    export function boxesOverlap(boxA: ClientRect, boxB: ClientRect) {
      if (boxA.right < boxB.left) { return false; }
      if (boxA.left > boxB.right) { return false; }
      if (boxA.bottom < boxB.top) { return false; }
      if (boxA.top > boxB.bottom) { return false; }
      return true;
    }

    export function boxIsInside(inner: ClientRect, outer: ClientRect) {
      return (
        nativeMath.floor(outer.left) <= nativeMath.ceil(inner.left) &&
        nativeMath.floor(outer.top) <= nativeMath.ceil(inner.top) &&
        nativeMath.floor(inner.right) <= nativeMath.ceil(outer.right) &&
        nativeMath.floor(inner.bottom) <= nativeMath.ceil(outer.bottom)
      );
    }

    export function getBoundingSVG(elem: SVGElement): SVGElement {
      var ownerSVG = elem.ownerSVGElement;
      if (ownerSVG != null) {
        return ownerSVG;
      }
      if (elem.nodeName.toLowerCase() === "svg") { // elem itself is an SVG
        return elem;
      }
      return null; // not in the DOM
    }

    var _latestClipPathId = 0;
    export function getUniqueClipPathId() {
      return "plottableClipPath" + ++_latestClipPathId;
    }

    /**
     * Returns true if the supplied coordinates or Ranges intersect or are contained by bbox.
     *
     * @param {number | Range} xValOrRange The x coordinate or Range to test
     * @param {number | Range} yValOrRange The y coordinate or Range to test
     * @param {SVGRect} bbox The bbox
     * @param {number} tolerance Amount by which to expand bbox, in each dimension, before
     * testing intersection
     *
     * @returns {boolean} True if the supplied coordinates or Ranges intersect or are
     * contained by bbox, false otherwise.
     */
    export function intersectsBBox(xValOrRange: number | Range, yValOrRange: number | Range,
      bbox: SVGRect, tolerance = 0.5): boolean {
      var xRange: Range = parseRange(xValOrRange);
      var yRange: Range = parseRange(yValOrRange);

      // SVGRects are positioned with sub-pixel accuracy (the default unit
      // for the x, y, height & width attributes), but user selections (e.g. via
      // mouse events) usually have pixel accuracy. A tolerance of half-a-pixel
      // seems appropriate.
      return bbox.x + bbox.width >= xRange.min - tolerance && bbox.x <= xRange.max + tolerance &&
        bbox.y + bbox.height >= yRange.min - tolerance && bbox.y <= yRange.max + tolerance;
    }

    /**
     * Create a Range from a number or an object with "min" and "max" defined.
     *
     * @param {any} input The object to parse
     *
     * @returns {Range} The generated Range
     */
    function parseRange(input: any): Range {
      if (typeof (input) === "number") {
        return { min: input, max: input };
      } else if (input instanceof Object && "min" in input && "max" in input) {
        return <Range> input;
      } else {
        throw new Error("input '" + input + "' can't be parsed as an Range");
      }
    }
  }
}
}

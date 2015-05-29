///<reference path="../reference.ts" />

module Plottable {
  /**
   * The RenderController is responsible for enqueueing and synchronizing
   * layout and render calls for Components.
   *
   * Layout and render calls occur inside an animation callback
   * (window.requestAnimationFrame if available).
   *
   * RenderController.flush() immediately lays out and renders all Components currently enqueued.
   *
   * To always have immediate rendering (useful for debugging), call
   * ```typescript
   * Plottable.RenderController.setRenderPolicy(
   *   new Plottable.RenderPolicies.Immediate()
   * );
   * ```
   */
  export module RenderController {
    var _componentsNeedingRender = new Utils.Set<Component>();
    var _componentsNeedingComputeLayout = new Utils.Set<Component>();
    var _animationRequested = false;
    var _isCurrentlyFlushing = false;
    export module Policy {
      export var IMMEDIATE = "immediate";
      export var ANIMATION_FRAME = "animationframe";
      export var TIMEOUT = "timeout";
    }
    export var _renderPolicy: RenderPolicies.RenderPolicy = new RenderPolicies.AnimationFrame();

    export function setRenderPolicy(policy: string) {
      switch (policy.toLowerCase()) {
        case Policy.IMMEDIATE:
          _renderPolicy = new RenderPolicies.Immediate();
          break;
        case Policy.ANIMATION_FRAME:
          _renderPolicy = new RenderPolicies.AnimationFrame();
          break;
        case Policy.TIMEOUT:
          _renderPolicy = new RenderPolicies.Timeout();
          break;
        default:
          Utils.Methods.warn("Unrecognized renderPolicy: " + policy);
      }
    }

    /**
     * Enqueues the Component for rendering.
     * 
     * @param {Component} component
     */
    export function registerToRender(component: Component) {
      if (_isCurrentlyFlushing) {
        Utils.Methods.warn("Registered to render while other components are flushing: request may be ignored");
      }
      _componentsNeedingRender.add(component);
      requestRender();
    }

    /**
     * Enqueues the Component for layout and rendering.
     * 
     * @param {Component} component
     */
    export function registerToComputeLayout(component: Component) {
      _componentsNeedingComputeLayout.add(component);
      _componentsNeedingRender.add(component);
      requestRender();
    }

    function requestRender() {
      // Only run or enqueue flush on first request.
      if (!_animationRequested) {
        _animationRequested = true;
        _renderPolicy.render();
      }
    }

    /**
     * Renders all Components waiting to be rendered immediately
     * instead of waiting until the next frame.
     *
     * Useful to call when debugging.
     */
    export function flush() {
      if (_animationRequested) {
        // Layout
        _componentsNeedingComputeLayout.values().forEach((component: Component) => component.computeLayout());

        // Top level render; Containers will put their children in the toRender queue
        _componentsNeedingRender.values().forEach((component: Component) => component.render());

        _isCurrentlyFlushing = true;
        var failed = new Utils.Set<Component>();
        _componentsNeedingRender.values().forEach((component: Component) => {
          try {
            component.renderImmediately();
          } catch (err) {
            // throw error with timeout to avoid interrupting further renders
            window.setTimeout(() => { throw err; }, 0);
            failed.add(component);
          }
        });
        _componentsNeedingComputeLayout = new Utils.Set<Component>();
        _componentsNeedingRender = failed;
        _animationRequested = false;
        _isCurrentlyFlushing = false;
      }
    }
  }
}

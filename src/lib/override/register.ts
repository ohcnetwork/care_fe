import React, { Component, useContext } from "react";

import { OverrideContext, ResolutionContext, StackContext } from "./contexts";
import { getEntry, registerComponent, resolveWithStack } from "./registry";
import type { AnyProps, RenderStackNode } from "./types";

/**
 * Lightweight error boundary for registered component overrides.
 *
 * If an override throws, this catches the error and renders the base
 * component instead — preventing a plugin bug from crashing the host app.
 */
class OverrideErrorBoundary extends Component<
  {
    children?: React.ReactNode;
    componentKey: string;
  },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      `[override] "${this.props.componentKey}" override crashed, falling back to base component:`,
      error,
      info,
    );
  }

  render() {
    if (this.state.hasError) {
      return React.createElement(
        "div",
        {
          className:
            "my-1 px-2 py-1 text-xs text-gray-400 border-l-2 border-gray-200",
        },
        "A plugin override for ",
        React.createElement("strong", null, this.props.componentKey),
        " encountered an error and was replaced with the default.",
      );
    }
    return this.props.children;
  }
}

/**
 * register() - Makes a component overrideable
 *
 * This is the main API for making components overrideable. Simply wrap your
 * component export with register() and it becomes context-aware and overrideable.
 *
 * @example
 * ```tsx
 * function PatientCard(props: PatientCardProps) {
 *   return <div>Base Card</div>;
 * }
 *
 * export default register("PatientCard", PatientCard);
 * ```
 *
 * Usage remains unchanged:
 * ```tsx
 * <PatientCard patient={patient} />
 * ```
 */
export function register<P extends AnyProps>(
  key: string,
  BaseComponent: React.ComponentType<P>,
): React.ComponentType<P> {
  // Register the component in the global registry
  registerComponent(key, BaseComponent);

  // Create the wrapper component
  function RegisteredComponent(props: P) {
    // Get contexts
    const resolutionMap = useContext(ResolutionContext);
    const parentStack = useContext(StackContext);
    const overrideContext = useContext(OverrideContext);

    const entry = getEntry(key);

    // If no entry (shouldn't happen) or no overrides, use base
    if (!entry || entry.overrides.length === 0) {
      return React.createElement(BaseComponent, props);
    }

    // 🚀 FAST PATH: No stack conditions - use precomputed resolution
    if (!entry.hasStackConditions) {
      const Component =
        (resolutionMap.get(key) as React.ComponentType<P>) || BaseComponent;
      // Inject __base so overrides can fall through to the original component
      if (Component !== BaseComponent) {
        const overrideElement = React.createElement(Component, {
          ...props,
          __base: BaseComponent,
        });
        return React.createElement(
          OverrideErrorBoundary,
          { componentKey: key },
          overrideElement,
        );
      }
      return React.createElement(Component, props);
    }

    // 🔥 STACK-AWARE PATH: Only when needed

    // Create new stack node (O(1) - linked list)
    const stack: RenderStackNode = {
      value: { name: key },
      parent: parentStack,
    };

    // Resolve with full context including stack
    const Component = resolveWithStack(
      key,
      overrideContext,
      stack,
    ) as React.ComponentType<P>;

    // Inject __base so overrides can fall through to the original component
    const isOverride = Component !== entry.base;
    const finalProps = isOverride ? { ...props, __base: entry.base } : props;

    const rendered = React.createElement(Component, finalProps);

    // Provide the updated stack to children
    const withStack = React.createElement(
      StackContext.Provider,
      { value: stack },
      isOverride
        ? React.createElement(
            OverrideErrorBoundary,
            { componentKey: key },
            rendered,
          )
        : rendered,
    );

    return withStack;
  }

  // Preserve display name for debugging
  RegisteredComponent.displayName = `Registered(${key})`;

  // Attach metadata for introspection
  (
    RegisteredComponent as unknown as { __override_key__: string }
  ).__override_key__ = key;
  (
    RegisteredComponent as unknown as {
      __base_component__: React.ComponentType<P>;
    }
  ).__base_component__ = BaseComponent;

  return RegisteredComponent;
}

/**
 * Type helper to extract props from a registered component
 */
export type RegisteredProps<T> =
  T extends React.ComponentType<infer P> ? P : never;

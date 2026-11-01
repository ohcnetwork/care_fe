// CareUI registry source: ohcnetwork/careui (4e143863).
/**
 * @name collapsible
 * @description An interactive component which expands/collapses a panel.
 * @dependencies @base-ui/react
 * @type registry:ui
 */
import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import * as React from "react";

type RenderProp =
  | React.ReactElement
  | ((props: unknown, state: unknown) => React.ReactElement)
  | undefined;

function resolveAsChild(
  asChild: boolean | undefined,
  children: React.ReactNode,
  render: RenderProp,
): { render: RenderProp; children: React.ReactNode } {
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{
      children?: React.ReactNode;
      [key: string]: unknown;
    }>;
    const { children: extractedChildren, ...restProps } = child.props;
    return {
      render: React.createElement(child.type as React.ElementType, restProps),
      children: extractedChildren,
    };
  }
  return { render, children };
}

function Collapsible({
  asChild,
  render,
  children,
  ...props
}: Omit<CollapsiblePrimitive.Root.Props, "render"> & {
  asChild?: boolean;
  render?: RenderProp;
}) {
  const resolved = resolveAsChild(asChild, children, render);
  return (
    <CollapsiblePrimitive.Root
      data-slot="collapsible"
      render={resolved.render}
      {...props}
    >
      {resolved.children}
    </CollapsiblePrimitive.Root>
  );
}

function CollapsibleTrigger({
  asChild,
  render,
  children,
  ...props
}: Omit<CollapsiblePrimitive.Trigger.Props, "render"> & {
  asChild?: boolean;
  render?: RenderProp;
}) {
  const resolved = resolveAsChild(asChild, children, render);
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      render={resolved.render}
      {...props}
    >
      {resolved.children}
    </CollapsiblePrimitive.Trigger>
  );
}

function CollapsibleContent({
  forceMount,
  keepMounted,
  ...props
}: CollapsiblePrimitive.Panel.Props & { forceMount?: boolean }) {
  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-content"
      keepMounted={keepMounted ?? forceMount}
      {...props}
    />
  );
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger };

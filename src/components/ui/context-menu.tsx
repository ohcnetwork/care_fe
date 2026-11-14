// CareUI registry source: ohcnetwork/careui (4e143863).
/**
 * @name context-menu
 * @description Displays a menu to the user triggered by right-click.
 * @dependencies @base-ui/react lucide-react
 * @type registry:ui
 */
import { ContextMenu as ContextMenuPrimitive } from "@base-ui/react/context-menu";
import * as React from "react";

import {
  MenuLabelContext,
  isMenuSelectionCanceled,
  menuFinalFocus,
  menuSelectionHandler,
  menuTriggerNativeButton,
  resolveMenuChild,
} from "@/components/ui/menu-compat";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronRightIcon } from "lucide-react";

function ContextMenu({
  onOpenChange,
  ...props
}: ContextMenuPrimitive.Root.Props) {
  return (
    <ContextMenuPrimitive.Root
      data-slot="context-menu"
      {...props}
      onOpenChange={(open, details) => {
        if (!open && isMenuSelectionCanceled(details)) return;
        onOpenChange?.(open, details);
      }}
    />
  );
}

function ContextMenuTrigger({
  className,
  asChild,
  children,
  render,
  ...props
}: ContextMenuPrimitive.Trigger.Props & { asChild?: boolean }) {
  const resolved = resolveMenuChild(asChild, children, render);
  return (
    <ContextMenuPrimitive.Trigger
      data-slot="context-menu-trigger"
      className={cn("select-none", className)}
      render={resolved.render}
      {...props}
    >
      {resolved.children}
    </ContextMenuPrimitive.Trigger>
  );
}

function ContextMenuGroup({
  children,
  ...props
}: ContextMenuPrimitive.Group.Props) {
  return (
    <MenuLabelContext value={true}>
      <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props}>
        {children}
      </ContextMenuPrimitive.Group>
    </MenuLabelContext>
  );
}

function ContextMenuPortal({ ...props }: ContextMenuPrimitive.Portal.Props) {
  return (
    <ContextMenuPrimitive.Portal data-slot="context-menu-portal" {...props} />
  );
}

function ContextMenuSub({
  onOpenChange,
  ...props
}: ContextMenuPrimitive.SubmenuRoot.Props) {
  return (
    <ContextMenuPrimitive.SubmenuRoot
      data-slot="context-menu-sub"
      {...props}
      onOpenChange={(open, details) => {
        if (!open && isMenuSelectionCanceled(details)) return;
        onOpenChange?.(open, details);
      }}
    />
  );
}

function ContextMenuRadioGroup({
  ...props
}: ContextMenuPrimitive.RadioGroup.Props) {
  return (
    <ContextMenuPrimitive.RadioGroup
      data-slot="context-menu-radio-group"
      {...props}
    />
  );
}

function ContextMenuContent({
  className,
  onCloseAutoFocus,
  finalFocus,
  collisionPadding,
  collisionAvoidance,
  avoidCollisions = true,
  align = "start",
  alignOffset = 4,
  side = "right",
  sideOffset = 0,
  ...props
}: ContextMenuPrimitive.Popup.Props &
  Pick<
    ContextMenuPrimitive.Positioner.Props,
    | "align"
    | "alignOffset"
    | "side"
    | "sideOffset"
    | "collisionPadding"
    | "collisionAvoidance"
  > & {
    onCloseAutoFocus?: (event: Event) => void;
    avoidCollisions?: boolean;
  }) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        collisionAvoidance={
          avoidCollisions
            ? collisionAvoidance
            : { side: "none", align: "none", fallbackAxisSide: "none" }
        }
      >
        <ContextMenuPrimitive.Popup
          finalFocus={
            onCloseAutoFocus ? menuFinalFocus(onCloseAutoFocus) : finalFocus
          }
          data-slot="context-menu-content"
          className={cn(
            "bg-popover text-popover-foreground ring-foreground/10 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 z-50 max-h-(--available-height) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md p-1 shadow-md ring-1 duration-100 outline-none",
            className,
          )}
          {...props}
        />
      </ContextMenuPrimitive.Positioner>
    </ContextMenuPrimitive.Portal>
  );
}

function ContextMenuItem({
  className,
  onSelect,
  onClick,
  asChild,
  nativeButton,
  children,
  render,
  inset,
  variant = "default",
  ...props
}: Omit<ContextMenuPrimitive.Item.Props, "onSelect"> & {
  onSelect?: (event: Event) => void;
  asChild?: boolean;
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  const resolved = resolveMenuChild(asChild, children, render);
  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "group/context-menu-item focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 focus:*:[svg]:text-accent-foreground data-[variant=destructive]:*:[svg]:text-destructive relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      nativeButton={nativeButton ?? menuTriggerNativeButton(resolved.render)}
      render={resolved.render}
      children={resolved.children}
      {...props}
      onClick={menuSelectionHandler(onSelect, onClick)}
    />
  );
}

function ContextMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: ContextMenuPrimitive.SubmenuTrigger.Props & {
  inset?: boolean;
}) {
  return (
    <ContextMenuPrimitive.SubmenuTrigger
      data-slot="context-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-popup-open:bg-accent data-popup-open:text-accent-foreground data-open:bg-accent data-open:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto" />
    </ContextMenuPrimitive.SubmenuTrigger>
  );
}

function ContextMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuContent>) {
  return (
    <ContextMenuContent
      data-slot="context-menu-sub-content"
      className={cn("shadow-lg", className)}
      side="right"
      {...props}
    />
  );
}

function ContextMenuCheckboxItem({
  className,
  onSelect,
  onClick,
  closeOnClick = true,
  children,
  checked,
  inset,
  ...props
}: Omit<ContextMenuPrimitive.CheckboxItem.Props, "onSelect"> & {
  onSelect?: (event: Event) => void;
  inset?: boolean;
}) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      data-slot="context-menu-checkbox-item"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      checked={checked}
      {...props}
      onClick={menuSelectionHandler(onSelect, onClick)}
      closeOnClick={closeOnClick}
    >
      <span className="pointer-events-none absolute right-2">
        <ContextMenuPrimitive.CheckboxItemIndicator>
          <CheckIcon />
        </ContextMenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  );
}

function ContextMenuRadioItem({
  className,
  onSelect,
  onClick,
  closeOnClick = true,
  children,
  inset,
  ...props
}: Omit<ContextMenuPrimitive.RadioItem.Props, "onSelect"> & {
  onSelect?: (event: Event) => void;
  inset?: boolean;
}) {
  return (
    <ContextMenuPrimitive.RadioItem
      data-slot="context-menu-radio-item"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
      onClick={menuSelectionHandler(onSelect, onClick)}
      closeOnClick={closeOnClick}
    >
      <span className="pointer-events-none absolute right-2">
        <ContextMenuPrimitive.RadioItemIndicator>
          <CheckIcon />
        </ContextMenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  );
}

function ContextMenuLabel({
  className,
  inset,
  ...props
}: ContextMenuPrimitive.GroupLabel.Props & {
  inset?: boolean;
}) {
  const inGroup = React.useContext(MenuLabelContext);
  const Label = inGroup ? ContextMenuPrimitive.GroupLabel : "div";
  return (
    <Label
      data-slot="context-menu-label"
      data-inset={inset}
      className={cn(
        "text-muted-foreground px-2 py-1.5 text-xs font-medium data-inset:pl-8",
        className,
      )}
      {...props}
    />
  );
}

function ContextMenuSeparator({
  className,
  ...props
}: ContextMenuPrimitive.Separator.Props) {
  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

function ContextMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="context-menu-shortcut"
      className={cn(
        "text-muted-foreground group-focus/context-menu-item:text-accent-foreground ml-auto text-xs tracking-widest",
        className,
      )}
      {...props}
    />
  );
}

export {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
};

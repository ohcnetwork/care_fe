// CareUI registry source: ohcnetwork/careui (4e143863).
/**
 * @name menubar
 * @description A visually persistent menu common in desktop applications.
 * @dependencies @base-ui/react lucide-react
 * @type registry:ui
 */
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { Menubar as MenubarPrimitive } from "@base-ui/react/menubar";
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

function Menubar({ className, ...props }: MenubarPrimitive.Props) {
  return (
    <MenubarPrimitive
      data-slot="menubar"
      className={cn(
        "flex h-9 items-center gap-1 rounded-md border p-1 shadow-xs",
        className,
      )}
      {...props}
    />
  );
}

function MenubarMenu({ onOpenChange, ...props }: MenuPrimitive.Root.Props) {
  return (
    <MenuPrimitive.Root
      data-slot="menubar-menu"
      {...props}
      onOpenChange={(open, details) => {
        if (!open && isMenuSelectionCanceled(details)) return;
        onOpenChange?.(open, details);
      }}
    />
  );
}

function MenubarGroup({ children, ...props }: MenuPrimitive.Group.Props) {
  return (
    <MenuLabelContext value={true}>
      <MenuPrimitive.Group data-slot="menubar-group" {...props}>
        {children}
      </MenuPrimitive.Group>
    </MenuLabelContext>
  );
}

function MenubarPortal({ ...props }: MenuPrimitive.Portal.Props) {
  return <MenuPrimitive.Portal data-slot="menubar-portal" {...props} />;
}

function MenubarRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props) {
  return (
    <MenuPrimitive.RadioGroup data-slot="menubar-radio-group" {...props} />
  );
}

function MenubarTrigger({
  className,
  asChild,
  children,
  render,
  nativeButton,
  ...props
}: MenuPrimitive.Trigger.Props & { asChild?: boolean }) {
  const resolved = resolveMenuChild(asChild, children, render);
  return (
    <MenuPrimitive.Trigger
      data-slot="menubar-trigger"
      nativeButton={nativeButton ?? menuTriggerNativeButton(resolved.render)}
      className={cn(
        "hover:bg-muted aria-expanded:bg-muted flex items-center rounded-sm px-2 py-1 text-sm font-medium outline-hidden select-none",
        className,
      )}
      render={resolved.render}
      {...props}
    >
      {resolved.children}
    </MenuPrimitive.Trigger>
  );
}

function MenubarContent({
  className,
  onCloseAutoFocus,
  finalFocus,
  collisionPadding,
  collisionAvoidance,
  avoidCollisions = true,
  align = "start",
  alignOffset = -4,
  side = "bottom",
  sideOffset = 8,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<
    MenuPrimitive.Positioner.Props,
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
    <MenubarPortal>
      <MenuPrimitive.Positioner
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
        <MenuPrimitive.Popup
          finalFocus={
            onCloseAutoFocus ? menuFinalFocus(onCloseAutoFocus) : finalFocus
          }
          data-slot="menubar-content"
          className={cn(
            "bg-popover text-popover-foreground ring-foreground/10 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 z-50 min-w-36 origin-(--transform-origin) overflow-hidden rounded-md p-1 shadow-md ring-1 duration-100 outline-none",
            className,
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenubarPortal>
  );
}

function MenubarItem({
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
}: Omit<MenuPrimitive.Item.Props, "onSelect"> & {
  onSelect?: (event: Event) => void;
  asChild?: boolean;
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  const resolved = resolveMenuChild(asChild, children, render);
  return (
    <MenuPrimitive.Item
      data-slot="menubar-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "group/menubar-item focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:*:[svg]:text-destructive! relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
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

function MenubarCheckboxItem({
  className,
  onSelect,
  onClick,
  closeOnClick = true,
  children,
  checked,
  inset,
  ...props
}: Omit<MenuPrimitive.CheckboxItem.Props, "onSelect"> & {
  onSelect?: (event: Event) => void;
  inset?: boolean;
}) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="menubar-checkbox-item"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-md py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-disabled:pointer-events-none data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      checked={checked}
      {...props}
      onClick={menuSelectionHandler(onSelect, onClick)}
      closeOnClick={closeOnClick}
    >
      <span className="pointer-events-none absolute left-2 flex size-4 items-center justify-center [&_svg:not([class*='size-'])]:size-4">
        <MenuPrimitive.CheckboxItemIndicator>
          <CheckIcon />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  );
}

function MenubarRadioItem({
  className,
  onSelect,
  onClick,
  closeOnClick = true,
  children,
  inset,
  ...props
}: Omit<MenuPrimitive.RadioItem.Props, "onSelect"> & {
  onSelect?: (event: Event) => void;
  inset?: boolean;
}) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="menubar-radio-item"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-md py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
      onClick={menuSelectionHandler(onSelect, onClick)}
      closeOnClick={closeOnClick}
    >
      <span className="pointer-events-none absolute left-2 flex size-4 items-center justify-center [&_svg:not([class*='size-'])]:size-4">
        <MenuPrimitive.RadioItemIndicator>
          <CheckIcon />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  );
}

function MenubarLabel({
  className,
  inset,
  ...props
}: MenuPrimitive.GroupLabel.Props & {
  inset?: boolean;
}) {
  const inGroup = React.useContext(MenuLabelContext);
  const Label = inGroup ? MenuPrimitive.GroupLabel : "div";
  return (
    <Label
      data-slot="menubar-label"
      data-inset={inset}
      className={cn(
        "px-2 py-1.5 text-sm font-medium data-inset:pl-8",
        className,
      )}
      {...props}
    />
  );
}

function MenubarSeparator({
  className,
  ...props
}: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="menubar-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

function MenubarShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="menubar-shortcut"
      className={cn(
        "text-muted-foreground group-focus/menubar-item:text-accent-foreground ml-auto text-xs tracking-widest",
        className,
      )}
      {...props}
    />
  );
}

function MenubarSub({
  onOpenChange,
  ...props
}: MenuPrimitive.SubmenuRoot.Props) {
  return (
    <MenuPrimitive.SubmenuRoot
      data-slot="menubar-sub"
      {...props}
      onOpenChange={(open, details) => {
        if (!open && isMenuSelectionCanceled(details)) return;
        onOpenChange?.(open, details);
      }}
    />
  );
}

function MenubarSubTrigger({
  className,
  inset,
  children,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props & {
  inset?: boolean;
}) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="menubar-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-popup-open:bg-accent data-popup-open:text-accent-foreground data-open:bg-accent data-open:text-accent-foreground flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none data-inset:pl-8 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </MenuPrimitive.SubmenuTrigger>
  );
}

function MenubarSubContent({
  className,
  align = "start",
  alignOffset = -3,
  side = "right",
  sideOffset = 0,
  ...props
}: React.ComponentProps<typeof MenubarContent>) {
  return (
    <MenubarContent
      data-slot="menubar-sub-content"
      className={cn("min-w-32 shadow-lg", className)}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      {...props}
    />
  );
}

export {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarPortal,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
};

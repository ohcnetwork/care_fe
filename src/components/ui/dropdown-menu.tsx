// CareUI registry source: ohcnetwork/careui (4e143863).
/**
 * @name dropdown-menu
 * @description A dropdown menu displays a list of options that can be selected.
 * @dependencies @base-ui/react
 * @type registry:ui
 */
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
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

type RenderProp =
  | React.ReactElement
  | ((props: unknown, state: unknown) => React.ReactElement)
  | undefined;

function resolveAsChild(
  asChild: boolean | undefined,
  children: React.ReactNode,
  render: RenderProp,
  className?: string,
): { render: RenderProp; children: React.ReactNode } {
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{
      children?: React.ReactNode;
      className?: string;
      [key: string]: unknown;
    }>;
    const {
      children: extractedChildren,
      className: childClassName,
      ...restProps
    } = child.props;
    return {
      render: React.createElement(child.type as React.ElementType, {
        ...restProps,
        // Let the trigger override child styles (e.g. tone down a Button's shadow).
        className: cn(childClassName, className),
      }),
      children: extractedChildren,
    };
  }
  return { render, children };
}

function DropdownMenu({ onOpenChange, ...props }: MenuPrimitive.Root.Props) {
  return (
    <MenuPrimitive.Root
      data-slot="dropdown-menu"
      {...props}
      onOpenChange={(open, details) => {
        if (!open && isMenuSelectionCanceled(details)) return;
        onOpenChange?.(open, details);
      }}
    />
  );
}

function DropdownMenuPortal({ ...props }: MenuPrimitive.Portal.Props) {
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

function DropdownMenuTrigger({
  asChild,
  nativeButton,
  render,
  children,
  className,
  ...props
}: Omit<MenuPrimitive.Trigger.Props, "render" | "className"> & {
  asChild?: boolean;
  render?: RenderProp;
  className?: string;
}) {
  const resolved = resolveAsChild(asChild, children, render, className);
  return (
    <MenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      nativeButton={nativeButton ?? menuTriggerNativeButton(resolved.render)}
      render={resolved.render}
      className={asChild ? undefined : className}
      {...props}
    >
      {resolved.children}
    </MenuPrimitive.Trigger>
  );
}

function DropdownMenuContent({
  className,
  onCloseAutoFocus,
  finalFocus,
  collisionPadding,
  collisionAvoidance,
  avoidCollisions = true,
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
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
    <MenuPrimitive.Portal>
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
          data-slot="dropdown-menu-content"
          className={cn(
            "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-[0.97] data-open:zoom-in-[0.97] ring-foreground/10 bg-popover text-popover-foreground z-50 max-h-(--available-height) w-max max-w-(--available-width) min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md p-1 shadow-md ring-1 duration-100 outline-none [animation-timing-function:cubic-bezier(0.23,1,0.32,1)] data-closed:overflow-hidden data-closed:duration-75 data-closed:[animation-timing-function:ease-in]",
            className,
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

function DropdownMenuGroup({ children, ...props }: MenuPrimitive.Group.Props) {
  return (
    <MenuLabelContext value={true}>
      <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props}>
        {children}
      </MenuPrimitive.Group>
    </MenuLabelContext>
  );
}

function DropdownMenuItem({
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
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:text-destructive group/dropdown-menu-item relative flex min-h-11 cursor-default items-center gap-2 rounded-sm px-2.5 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 md:min-h-10 md:px-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
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

function DropdownMenuCheckboxItem({
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
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground relative flex min-h-11 cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 md:min-h-10 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      checked={checked}
      {...props}
      onClick={menuSelectionHandler(onSelect, onClick)}
      closeOnClick={closeOnClick}
    >
      <span
        className="pointer-events-none absolute right-2 flex items-center justify-center"
        data-slot="dropdown-menu-checkbox-item-indicator"
      >
        <MenuPrimitive.CheckboxItemIndicator>
          <CheckIcon />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props) {
  return (
    <MenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  );
}

function DropdownMenuRadioItem({
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
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground relative flex min-h-11 cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 md:min-h-10 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
      onClick={menuSelectionHandler(onSelect, onClick)}
      closeOnClick={closeOnClick}
    >
      <span
        className="pointer-events-none absolute right-2 flex items-center justify-center"
        data-slot="dropdown-menu-radio-item-indicator"
      >
        <MenuPrimitive.RadioItemIndicator>
          <CheckIcon />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  );
}

function DropdownMenuLabel({
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
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "text-soft-foreground px-2 py-1.5 text-xs font-medium data-inset:pl-8",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground ml-auto text-xs tracking-widest",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSub({
  onOpenChange,
  ...props
}: MenuPrimitive.SubmenuRoot.Props) {
  return (
    <MenuPrimitive.SubmenuRoot
      data-slot="dropdown-menu-sub"
      {...props}
      onOpenChange={(open, details) => {
        if (!open && isMenuSelectionCanceled(details)) return;
        onOpenChange?.(open, details);
      }}
    />
  );
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props & {
  inset?: boolean;
}) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-popup-open:bg-accent data-popup-open:text-accent-foreground data-open:bg-accent data-open:text-accent-foreground flex min-h-11 cursor-default items-center gap-2 rounded-sm px-2.5 py-1.5 text-sm outline-hidden select-none data-inset:pl-8 md:min-h-10 md:px-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto" />
    </MenuPrimitive.SubmenuTrigger>
  );
}

function DropdownMenuSubContent({
  className,
  align = "start",
  alignOffset = -3,
  side = "right",
  sideOffset = 0,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      data-slot="dropdown-menu-sub-content"
      className={cn("w-auto min-w-[96px] rounded-md p-1 shadow-lg", className)}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};

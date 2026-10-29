// CareUI registry source: ohcnetwork/careui (4e143863).
/**
 * @name command
 * @description Fast, composable, unstyled command menu for React.
 * @dependencies cmdk
 * @type registry:ui
 */
import { Command as CommandPrimitive } from "cmdk";
import * as React from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { CheckIcon, SearchIcon, XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

const CommandDialogContext = React.createContext(false);

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "bg-popover text-popover-foreground flex size-full flex-col overflow-hidden",
        "in-data-[slot=drawer-content]:h-auto! in-data-[slot=drawer-content]:min-h-0 in-data-[slot=drawer-content]:flex-1",
        className,
      )}
      {...props}
    />
  );
}

function CommandDialog({
  title,
  description,
  trigger,
  children,
  className,
  open,
  onOpenChange,
  ...props
}: Omit<React.ComponentProps<typeof Dialog>, "children" | "onOpenChange"> & {
  title?: string;
  description?: string;
  trigger?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const isDesktop = !useIsMobile();
  // A drawer focuses its popup by default. iOS only opens the keyboard when the
  // input is focused as the drawer mounts (what native autoFocus does), not from
  // Base UI's deferred initial focus, so focus it here at mount.
  const focusSearchInput = React.useCallback((popup: HTMLDivElement | null) => {
    popup?.querySelector("input")?.focus({ preventScroll: true });
  }, []);
  const resolvedTitle = title ?? t("search");
  const resolvedDescription = description ?? t("search_encounter_command");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange} {...props}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent
          className={cn(
            "bg-foreground/10 top-1/4 translate-y-0 overflow-hidden p-1.5",
            className,
          )}
          innerClassName="bg-background grid gap-4 rounded-lg p-1 text-sm"
          showCloseButton={false}
        >
          <DialogHeader className="sr-only" showCloseButton={false}>
            <DialogTitle>{resolvedTitle}</DialogTitle>
            <DialogDescription>{resolvedDescription}</DialogDescription>
          </DialogHeader>
          <CommandDialogContext.Provider value={true}>
            <Command>{children}</Command>
          </CommandDialogContext.Provider>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent
        ref={focusSearchInput}
        className={cn(
          "h-[calc(80dvh+var(--drawer-keyboard-inset,0px))] max-h-[min(36rem,calc(100dvh-var(--drawer-keyboard-inset,0px)-env(safe-area-inset-top)-1rem))] p-1.5 data-[swipe-direction=down]:bottom-(--drawer-keyboard-inset,0px)",
          className,
        )}
      >
        <DrawerHeader className="pb-2 pl-1" showCloseButton>
          <DrawerTitle>{resolvedTitle}</DrawerTitle>
          <DrawerDescription className="sr-only">
            {resolvedDescription}
          </DrawerDescription>
        </DrawerHeader>
        <Command>{children}</Command>
      </DrawerContent>
    </Drawer>
  );
}

function CommandInput({
  className,
  wrapperClassName,
  autoFocus,
  ref,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input> & {
  wrapperClassName?: string;
}) {
  const innerRef = React.useRef<HTMLInputElement>(null);
  const isDesktopCommandDialog = React.useContext(CommandDialogContext);
  const { t } = useTranslation();

  React.useImperativeHandle(
    ref,
    () => innerRef.current as HTMLInputElement,
    [],
  );

  // Native `autoFocus` is unreliable inside an animated, portalled drawer:
  // the element is focused before it's visible (or the drawer moves focus to
  // its content), so the keyboard never opens on mobile. Focus imperatively
  // after the element mounts/paints instead.
  React.useEffect(() => {
    if (!autoFocus) return;
    const id = requestAnimationFrame(() => innerRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [autoFocus]);

  return (
    <div
      data-slot="command-input-wrapper"
      className={cn("w-full shrink-0 px-1 pt-2 pb-2 md:pt-1", wrapperClassName)}
    >
      <InputGroup className="border-input/30 bg-input/30 rounded-sm shadow-none has-[[data-slot=command-input]:focus-visible]:border-ring has-[[data-slot=command-input]:focus-visible]:ring-3 has-[[data-slot=command-input]:focus-visible]:ring-ring/50">
        <CommandPrimitive.Input ref={innerRef} {...props} asChild>
          <InputGroupInput
            data-slot="command-input"
            className={cn("h-full focus:ring-0", className)}
          />
        </CommandPrimitive.Input>
        <InputGroupAddon>
          <SearchIcon className="opacity-50 size-4 shrink-0" />
        </InputGroupAddon>
        {isDesktopCommandDialog && (
          <InputGroupAddon align="inline-end">
            <DialogClose asChild>
              <InputGroupButton
                variant="ghost"
                size="icon-xs"
                aria-label={t("close")}
              >
                <XIcon />
              </InputGroupButton>
            </DialogClose>
          </InputGroupAddon>
        )}
      </InputGroup>
    </div>
  );
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none",
        "in-data-[slot=drawer-content]:max-h-none in-data-[slot=drawer-content]:min-h-0 in-data-[slot=drawer-content]:flex-1 in-data-[slot=drawer-content]:overscroll-contain",
        className,
      )}
      {...props}
    />
  );
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("py-6 text-center text-sm", className)}
      {...props}
    />
  );
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "text-foreground **:[[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium",
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("bg-border -mx-1 h-px w-auto", className)}
      {...props}
    />
  );
}

function CommandItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "group/command-item data-[selected=true]:bg-muted data-[selected=true]:text-foreground data-[selected=true]:**:[svg]:text-foreground relative flex min-h-(--command-item-min-height) cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none [--command-item-min-height:--spacing(12)] md:[--command-item-min-height:--spacing(10)] in-data-[slot=dialog-content]:rounded-sm data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <CheckIcon className="ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" />
    </CommandPrimitive.Item>
  );
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "text-muted-foreground group-data-[selected=true]/command-item:text-foreground ml-auto text-xs tracking-widest",
        className,
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
};

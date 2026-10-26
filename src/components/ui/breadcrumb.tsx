/**
 * @name breadcrumb
 * @description Displays the path to the current resource using a hierarchy of links.
 * @dependencies @base-ui/react
 * @type registry:ui
 */
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";

function Breadcrumb({ className, ...props }: React.ComponentProps<"nav">) {
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t("navigation")}
      data-slot="breadcrumb"
      className={cn(className)}
      {...props}
    />
  );
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm wrap-break-word sm:gap-2.5",
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  );
}

function BreadcrumbLink({
  className,
  render,
  asChild = false,
  children,
  ...props
}: useRender.ComponentProps<"a"> & { asChild?: boolean }) {
  return useRender({
    defaultTagName: "a",
    render: asChild && React.isValidElement(children) ? children : render,
    state: {
      slot: "breadcrumb-link",
    },
    props: mergeProps<"a">(
      {
        className: cn(
          "hover:bg-soft-background hover:text-foreground underline transition-colors",
          className,
        ),
      },
      {
        ...props,
        children:
          asChild &&
          React.isValidElement<{ children?: React.ReactNode }>(children)
            ? children.props.children
            : children,
      },
    ),
  });
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("text-soft-foreground font-normal", className)}
      {...props}
    />
  );
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <ChevronRightIcon />}
    </li>
  );
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const { t } = useTranslation();
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn(
        "flex size-5 items-center justify-center [&>svg]:size-4",
        className,
      )}
      {...props}
    >
      <MoreHorizontalIcon />
      <span className="sr-only">{t("more")}</span>
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
};

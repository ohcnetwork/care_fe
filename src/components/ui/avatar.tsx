/**
 * @name avatar
 * @description An image element with a fallback for representing the user.
 * @dependencies class-variance-authority @base-ui/react
 * @type registry:ui
 */
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

function Avatar({
  className,
  size = "default",
  shape = "circle",
  ...props
}: AvatarPrimitive.Root.Props & {
  size?: "default" | "sm" | "lg";
  shape?: "circle" | "rounded" | "squircle";
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      data-shape={shape}
      className={cn(
        "after:border-strong-border group/avatar relative flex size-8 shrink-0 select-none after:absolute after:inset-0 after:border after:mix-blend-multiply data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten",
        shape === "circle" && "rounded-full after:rounded-full",
        shape === "rounded" && "rounded-md after:rounded-md",
        shape === "squircle" &&
          "rounded-squircle-2xl after:rounded-squircle-2xl rounded-2xl after:rounded-2xl",
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(
        "aspect-square size-full object-cover",
        "group-data-[shape=circle]/avatar:rounded-full",
        "group-data-[shape=rounded]/avatar:rounded-md",
        "group-data-[shape=squircle]/avatar:rounded-2xl",
        className,
      )}
      {...props}
    />
  );
}

const avatarFallbackVariants = cva(
  [
    "flex size-full items-center justify-center text-sm",
    "group-data-[size=sm]/avatar:text-xs",
    "group-data-[shape=circle]/avatar:rounded-full",
    "group-data-[shape=rounded]/avatar:rounded-md",
    "group-data-[shape=squircle]/avatar:rounded-2xl group-data-[shape=squircle]/avatar:rounded-squircle-2xl",
  ],
  {
    variants: {
      color: {
        default: "bg-muted text-muted-foreground",
        primary:
          "bg-primary-100 text-primary-900 dark:bg-primary-400/15 dark:text-primary-300",
        red: "bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-300",
        orange:
          "bg-orange-100 text-orange-900 dark:bg-orange-400/15 dark:text-orange-300",
        amber:
          "bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-300",
        yellow:
          "bg-yellow-100 text-yellow-900 dark:bg-yellow-400/15 dark:text-yellow-300",
        lime: "bg-lime-100 text-lime-900 dark:bg-lime-400/15 dark:text-lime-300",
        green:
          "bg-green-100 text-green-900 dark:bg-green-400/15 dark:text-green-300",
        teal: "bg-teal-100 text-teal-900 dark:bg-teal-400/15 dark:text-teal-300",
        cyan: "bg-cyan-100 text-cyan-900 dark:bg-cyan-400/15 dark:text-cyan-300",
        sky: "bg-sky-100 text-sky-900 dark:bg-sky-400/15 dark:text-sky-300",
        blue: "bg-blue-100 text-blue-900 dark:bg-blue-400/15 dark:text-blue-300",
        indigo:
          "bg-indigo-100 text-indigo-900 dark:bg-indigo-400/15 dark:text-indigo-300",
        violet:
          "bg-violet-100 text-violet-900 dark:bg-violet-400/15 dark:text-violet-300",
        purple:
          "bg-purple-100 text-purple-900 dark:bg-purple-400/15 dark:text-purple-300",
        fuchsia:
          "bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-400/15 dark:text-fuchsia-300",
        pink: "bg-pink-100 text-pink-900 dark:bg-pink-400/15 dark:text-pink-300",
        rose: "bg-rose-100 text-rose-900 dark:bg-rose-400/15 dark:text-rose-300",
        neutral:
          "bg-secondary text-secondary-foreground dark:bg-secondary/15 dark:text-secondary-foreground/80",
      },
    },
    defaultVariants: {
      color: "default",
    },
  },
);

export type AvatarColor = NonNullable<
  VariantProps<typeof avatarFallbackVariants>["color"]
>;

function AvatarFallback({
  className,
  color = "default",
  ...props
}: AvatarPrimitive.Fallback.Props & {
  color?: AvatarColor;
}) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(avatarFallbackVariants({ color }), className)}
      {...props}
    />
  );
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "bg-primary text-primary-foreground ring-background absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-blend-color ring-2 select-none",
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "*:data-[slot=avatar]:ring-background group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2",
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "bg-muted text-muted-foreground ring-background relative flex size-8 shrink-0 items-center justify-center rounded-full text-sm ring-2 group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
        className,
      )}
      {...props}
    />
  );
}

export {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
};

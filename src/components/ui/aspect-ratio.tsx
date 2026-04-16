/**
 * @name aspect-ratio
 * @description Displays content within a desired ratio.
 * @dependencies radix-ui
 * @type registry:ui
 */
import { AspectRatio as AspectRatioPrimitive } from "radix-ui";

function AspectRatio({
  ...props
}: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />;
}

export { AspectRatio };

import useWindowDimensions from "@/hooks/useWindowDimensions";

type Breakpoints = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

// Ensure that the breakpoint widths are sorted in ascending order.
const BREAKPOINT_WIDTH: Record<Breakpoints, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
  "3xl": 1920,
};

/**
 * Returns the value mapped to the current breakpoint. Mobile-first.
 *
 * @param map A map of breakpoints to values.
 * @param defaultValue The default value.
 * @returns The value mapped to the current breakpoint.
 */
export default function useBreakpoints<T>(
  map: Partial<Record<Breakpoints, T>> & { default: T },
) {
  const { width } = useWindowDimensions();

  const breakpoint = Object.entries(map).reduce((acc, [key]) => {
    if (width >= BREAKPOINT_WIDTH[key as Breakpoints]) {
      return key as Breakpoints;
    }

    return acc;
  }, "default" as Breakpoints);

  return map[breakpoint] ?? map.default;
}

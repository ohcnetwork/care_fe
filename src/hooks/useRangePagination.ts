import { useEffect, useMemo, useState } from "react";

interface DateRange {
  start: Date;
  end: Date;
}

interface Props {
  bounds: DateRange;
  perPage: number;
  slots?: number;
  defaultEnd?: boolean;
}

const useRangePagination = ({ bounds, perPage, ...props }: Props) => {
  const [currentRange, setCurrentRange] = useState(
    getInitialBounds(bounds, perPage, props.defaultEnd),
  );

  useEffect(() => {
    setCurrentRange(getInitialBounds(bounds, perPage, props.defaultEnd));
  }, [JSON.stringify(bounds), perPage, props.defaultEnd]);

  const next = () => {
    const { end } = currentRange;
    const deltaBounds = bounds.end.valueOf() - bounds.start.valueOf();
    const deltaCurrent = end.valueOf() - bounds.start.valueOf();

    if (deltaCurrent + perPage > deltaBounds) {
      setCurrentRange({
        start: new Date(bounds.end.valueOf() - perPage),
        end: bounds.end,
      });
    } else {
      setCurrentRange({
        start: new Date(end.valueOf()),
        end: new Date(end.valueOf() + perPage),
      });
    }
  };

  const previous = () => {
    const { start } = currentRange;
    const deltaCurrent = start.valueOf() - bounds.start.valueOf();

    if (deltaCurrent - perPage < 0) {
      setCurrentRange({
        start: bounds.start,
        end: new Date(bounds.start.valueOf() + perPage),
      });
    } else {
      setCurrentRange({
        start: new Date(start.valueOf() - perPage),
        end: new Date(start.valueOf()),
      });
    }
  };

  const slots = useMemo(() => {
    if (!props.slots) {
      return [];
    }

    const slots: DateRange[] = [];
    const { start } = currentRange;
    const delta = perPage / props.slots;

    for (let i = 0; i < props.slots; i++) {
      slots.push({
        start: new Date(start.valueOf() + delta * i),
        end: new Date(start.valueOf() + delta * (i + 1)),
      });
    }

    return slots;
  }, [currentRange, props.slots, perPage]);

  return {
    currentRange,
    hasNext: currentRange.end < bounds.end,
    hasPrevious: currentRange.start > bounds.start,
    previous,
    next,
    slots,
  };
};

export default useRangePagination;

const getInitialBounds = (
  bounds: DateRange,
  perPage: number,
  defaultEnd?: boolean,
) => {
  const deltaBounds = bounds.end.valueOf() - bounds.start.valueOf();

  if (deltaBounds < perPage) {
    return bounds;
  }

  if (defaultEnd) {
    return {
      start: new Date(bounds.end.valueOf() - perPage),
      end: bounds.end,
    };
  }

  return {
    start: bounds.start,
    end: new Date(bounds.start.valueOf() + perPage),
  };
};

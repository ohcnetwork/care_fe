export interface GroupedItems<T> {
  today: T[];
  yesterday: T[];
  thisWeek: T[];
  thisMonth: T[];
  thisYear: T[];
  older: T[];
}

/**
 * Groups an array of items by time periods based on their created_date.
 *
 * @param items - Array of items that have a created_date property
 * @returns Object with items grouped into: today, yesterday, thisWeek, thisMonth, thisYear, older
 *
 * @example
 * const medications = [
 *   { id: 1, created_date: "2024-01-15T10:00:00Z", name: "Medicine A" },
 *   { id: 2, created_date: "2024-01-14T15:30:00Z", name: "Medicine B" }
 * ];
 *
 * const grouped = groupItemsByTime(medications);
 * // Returns: { today: [...], yesterday: [...], thisWeek: [], ... }
 */
export function groupItemsByTime<T extends { created_date: string }>(
  items: T[],
): GroupedItems<T> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisYearStart = new Date(now.getFullYear(), 0, 1);

  const grouped: GroupedItems<T> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    thisMonth: [],
    thisYear: [],
    older: [],
  };

  items.forEach((item) => {
    const createdDate = new Date(item.created_date);
    const createdDateOnly = new Date(
      createdDate.getFullYear(),
      createdDate.getMonth(),
      createdDate.getDate(),
    );

    if (createdDateOnly.getTime() === today.getTime()) {
      grouped.today.push(item);
    } else if (createdDateOnly.getTime() === yesterday.getTime()) {
      grouped.yesterday.push(item);
    } else if (createdDateOnly >= thisWeekStart && createdDateOnly < today) {
      grouped.thisWeek.push(item);
    } else if (
      createdDateOnly >= thisMonthStart &&
      createdDateOnly < thisWeekStart
    ) {
      grouped.thisMonth.push(item);
    } else if (
      createdDateOnly >= thisYearStart &&
      createdDateOnly < thisMonthStart
    ) {
      grouped.thisYear.push(item);
    } else {
      grouped.older.push(item);
    }
  });

  return grouped;
}

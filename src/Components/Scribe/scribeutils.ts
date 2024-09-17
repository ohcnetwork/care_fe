import _ from "lodash";

export interface ScribeReducerOptions<T> {
  existingData: T[];
  newData: T[];
  comparer: (a: T, b: T) => boolean;
  onUpdate?: (strippedItem: Partial<T>, item: T) => Promise<unknown> | unknown;
  onDelete?: (item: T) => Promise<unknown> | unknown;
  onAdd?: (strippedItem: Partial<T>, item: T) => Promise<unknown> | unknown;
  allowedFields: (keyof T)[];
}

export async function scribeReducer<T>(
  options: ScribeReducerOptions<T>,
): Promise<void> {
  const {
    existingData,
    newData,
    onUpdate,
    onDelete,
    onAdd,
    allowedFields,
    comparer,
  } = options;

  const coveredItems: T[] = [];
  for (const item of newData) {
    const existingItem = existingData.find((d) => comparer(d, item));
    // Check if item is altered or added
    if (!_.isEqual(item, existingItem)) {
      if (existingItem) {
        // item was altered
        await onUpdate?.(_.pick(item, allowedFields), item);
      } else {
        // symptom does not exist, so must be added
        await onAdd?.(_.pick(item, allowedFields), item);
      }
    }
    coveredItems.push(item);
  }
  // check for deleted items
  const deletedItems =
    existingData?.filter((s) => !coveredItems.find((c) => comparer(c, s))) ||
    [];
  for (const item of deletedItems) {
    //item was deleted
    await onDelete?.(item);
  }
}

export const deepEqual = (x: any, y: any): boolean => {
  if (x === y) return true;

  if (typeof x == "object" && x != null && typeof y == "object" && y != null) {
    if (Object.keys(x).length != Object.keys(y).length) return false;

    Object.keys(x).forEach((key) => {
      if (!deepEqual(x[key], y[key])) return false;
    });

    return true;
  }

  return false;
};

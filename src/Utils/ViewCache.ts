const getKey = (name: string) => {
  return `${name}`;
};

/**
 * Clears the view preference.
 */
const invalidate = (name: string) => {
  localStorage.removeItem(getKey(name));
};

/**
 * Clears all the view preferences.
 */
const invalidateAll = () => {
  const viewKeys = ["users", "resource", "appointments"];
  viewKeys.forEach(invalidate);
};

export default {
  invalidate,
  invalidateAll,
};

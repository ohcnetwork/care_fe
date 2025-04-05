type Filters = Record<string, unknown>;

/**
 * @returns The filters cache key associated to the current window URL
 */
const getKey = () => {
  return `filters--${window.location.pathname}`;
};

/**
 * Returns a sanitized filter object that ignores filters with no value or
 * filters that are part of the blacklist.
 *
 * @param filters Input filters to be sanitized
 * @param blacklist Optional array of filter keys that are to be ignored.
 */
const clean = (filters: Filters, blacklist?: string[]) => {
  const reducer = (cleaned: Filters, key: string) => {
    const valueAllowed = (filters[key] ?? "") != "";
    if (valueAllowed && !blacklist?.includes(key)) {
      cleaned[key] = filters[key];
    }
    return cleaned;
  };

  return Object.keys(filters).reduce(reducer, {});
};

/**
 * Retrieves the cached filters
 */
const get = (key?: string) => {
  const content = localStorage.getItem(key ?? getKey());
  return content ? (JSON.parse(content) as Filters) : null;
};

/**
 * Sets the filters cache with the specified filters.
 */
const set = (filters: Filters, blacklist?: string[], key?: string) => {
  key ??= getKey();
  filters = clean(filters, blacklist);

  if (Object.keys(filters).length) {
    localStorage.setItem(key, JSON.stringify(filters));
  } else {
    invalidate(key);
  }
};

/**
 * Removes the filters cache for the specified key or current URL.
 */
const invalidate = (key?: string) => {
  localStorage.removeItem(key ?? getKey());
};

/**
 * Removes all filters cache in the platform.
 */
const invalidateAll = () => {
  for (const key in localStorage) {
    if (key.startsWith("filters--")) {
      invalidate(key);
    }
  }
};

export default {
  get,
  set,
  invalidate,
  invalidateAll,
  utils: {
    clean,
  },
};

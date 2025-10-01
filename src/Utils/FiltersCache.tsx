type Filters = Record<string, unknown>;

/**
 * @returns The filters cache key associated to the current window URL
 */
const getKey = () => {
  return `filters--${window.location.pathname}`;
};

/**
 * Returns a sanitized filter object that only includes filters with values
 * and filters that are part of the whitelist.
 *
 * @param filters Input filters to be sanitized
 * @param whitelist Optional array of filter keys that are allowed to be cached.
 */
const clean = (filters: Filters, whitelist?: string[]) => {
  const reducer = (cleaned: Filters, key: string) => {
    const valueAllowed = (filters[key] ?? "") != "";
    const keyAllowed = !whitelist || whitelist.includes(key);
    if (valueAllowed && keyAllowed) {
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
const set = (filters: Filters, whitelist?: string[], key?: string) => {
  key ??= getKey();
  filters = clean(filters, whitelist);

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

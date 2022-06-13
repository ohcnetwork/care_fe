export const parseQueryParams = (url: string) => {
  try {
    const urlSearch = new URL(url).search;
    return urlSearch.substring(12, urlSearch.length - 3);
  } catch (error) {
    return null;
  }
};

export const parseQueryParams = (url: string) =>
  Object.fromEntries(new URLSearchParams(new URL(url).search).entries());

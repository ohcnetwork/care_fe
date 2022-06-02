export const parseQueryParams = (url: string) => {
  const urlPath = new URL(url).pathname.split("/");
  return urlPath.pop();
};

export const normalizeNavigationPath = (url: string) =>
  url.split(/[?#]/)[0].replace(/\/+$/, "");

export const isNavigationActive = (path: string | null, url: string) => {
  if (path === null) return false;
  const currentPath = normalizeNavigationPath(path);
  const targetPath = normalizeNavigationPath(url);
  return (
    currentPath === targetPath ||
    (targetPath !== "" && currentPath.startsWith(`${targetPath}/`))
  );
};

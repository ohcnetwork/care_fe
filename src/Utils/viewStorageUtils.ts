export const getDefaultView = (key: string, defaultValue: string): string => {
  return localStorage.getItem(key) || defaultValue;
};

export const setDefaultView = (key: string, value: string): void => {
  localStorage.setItem(key, value);
};

export const nextWindow = () => {
  if (window) {
    return window;
  } else {
    return null;
  }
};

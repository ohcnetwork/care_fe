export const viewPort = {
  // Most common desktop resolution (Full HD)
  desktop1080p: {
    width: 1920,
    height: 1080,
  },
  // Common laptop resolution (HD+)
  laptopStandard: {
    width: 1366,
    height: 768,
  },
  // MacBook Pro 13" and similar laptops
  laptopRetina: {
    width: 1440,
    height: 900,
  },
  // Common desktop resolution (2K)
  desktop2k: {
    width: 2560,
    height: 1440,
  },
  // Common laptop resolution (HD)
  laptopSmall: {
    width: 1280,
    height: 720,
  },
} as const;

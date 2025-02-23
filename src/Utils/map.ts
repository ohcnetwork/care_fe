import careConfig from "@careConfig";

export const getMapUrl = (latitude: string, longitude: string) => {
  return careConfig.mapUrl
    .replace("{lat}", latitude)
    .replace("{long}", longitude);
};

export const formatPatientAddress = (address?: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return address?.replace(urlRegex, "").trim();
};

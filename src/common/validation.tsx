/**
 * @deprecated use isValidPhoneNumber from react-phone-number-input instead
 */
export const phonePreg = (phone: string) => {
  const pattern = /^((\+91|91|0)[- ]{0,1})?[123456789]\d{9}$/;
  return pattern.test(phone);
};

/**
 * @deprecated use zod schemas instead
 */
const valueIsBetween = (val: number, a: number, b: number) =>
  a <= val && val <= b;

/**
 * @deprecated use validators.latitude instead
 */
export const validateLatitude = (latitude: string) => {
  return valueIsBetween(Number(latitude), -90, 90);
};

/**
 * @deprecated use validators.longitude instead
 */
export const validateLongitude = (longitude: string) => {
  return valueIsBetween(Number(longitude), -180, 180);
};

export const validateName = (name: string) => {
  return name.length >= 3;
};

/**
 * @deprecated use validators.password instead
 */
export const validatePassword = (password: string) => {
  const pattern =
    /(?=(.*[0-9]))((?=.*[A-Za-z0-9])(?=.*[A-Z])(?=.*[a-z]))^.{8,}$/;
  return pattern.test(password);
};

/**
 * @deprecated use validators.pincode instead
 */
export const validatePincode = (pincode: string) => {
  const pattern = /^[1-9][0-9]{5}$/;
  return pattern.test(pincode);
};

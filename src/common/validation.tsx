export const phonePreg = (phone: string) => {
  const pattern = /^((\+91|91|0)[- ]{0,1})?[123456789]\d{9}$/;
  return pattern.test(phone);
};

const valueIsBetween = (val: number, a: number, b: number) =>
  a <= val && val <= b;

export const validateLatitude = (latitude: string) => {
  return valueIsBetween(Number(latitude), -90, 90);
};

export const validateLongitude = (longitude: string) => {
  return valueIsBetween(Number(longitude), -180, 180);
};

export const validateEmailAddress = (email: string) => {
  const pattern =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return pattern.test(email);
};

export const getArrayValueByKey = (
  arr: Array<any>,
  attr: string,
  value: string | number,
) => {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][attr] === value) {
      return i;
    }
  }
  return -1;
};

export const getRandomNumbers = (min: number, max: number) => {
  return Math.floor(Math.random() * max) + min;
};

export const validateName = (name: string) => {
  return name.length >= 3;
};

export const validateUsername = (username: string) => {
  const pattern = /^(?!.*[._-]{2})[a-z0-9](?:[a-z0-9._-]{2,14}[a-z0-9])$/s;
  return pattern.test(username);
};

export const validatePassword = (password: string) => {
  const pattern =
    /(?=(.*[0-9]))((?=.*[A-Za-z0-9])(?=.*[A-Z])(?=.*[a-z]))^.{8,}$/;
  return pattern.test(password);
};

export const validatePincode = (pincode: string) => {
  const pattern = /^[1-9][0-9]{5}$/;
  return pattern.test(pincode);
};

export const validateNumber = (number: string) => {
  const pattern = /^[0-9]+$/;
  return pattern.test(number);
};

export const checkIfValidIP = (str: string) => {
  // Regular expression to check if string is a IP address
  const regexExp =
    /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/gi;

  return regexExp.test(str);
};

export function generatePhoneNumber(): string {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  const randomNum = (array[0] % 900000000) + 100000000;
  return "9" + randomNum.toString();
}

export function generateEmergencyPhoneNumber(): string {
  return generatePhoneNumber();
}

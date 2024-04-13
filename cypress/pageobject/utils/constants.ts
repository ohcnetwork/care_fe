export function generatePhoneNumber() {
  return "9" + Math.floor(100000000 + Math.random() * 900000000).toString();
}

export function generateEmergencyPhoneNumber() {
  return "9" + Math.floor(100000000 + Math.random() * 900000000).toString();
}

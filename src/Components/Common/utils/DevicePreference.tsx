export function getTemperaturePreference(): "C" | "F" {
  if (window && window.localStorage) {
    const temp = localStorage.getItem("temperature");
    if (temp === "F" || temp === "C") return temp;
  }
  return "C";
}

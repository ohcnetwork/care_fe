import "./icon.css";
import iconData from "./UniconPaths.json";

const xmlns = "http://www.w3.org/2000/svg";

const findIconName = (className) => {
  const iconName = className.match(/care-([a-zA-Z0-9-]+)/);
  return iconName ? iconName[1] : "default";
};

const getIconData = (className) => {
  const data = iconData[findIconName(className)];
  return typeof data === "undefined" ? iconData["default"] : data;
};

const createSvg = (className) => {
  const icon = getIconData(className);
  const el = document.createElementNS(xmlns, "svg");
  el.setAttribute(
    "class",
    className.replace("care", "care-svg-icon__baseline")
  );
  el.setAttribute("role", "img");
  el.setAttribute("xmlns", xmlns);
  el.setAttribute("viewBox", `0 0 ${icon[0]} ${icon[0]}`);

  const path = document.createElementNS(xmlns, "path");
  path.setAttribute("fill", "currentColor");
  path.setAttribute("d", icon[1]);
  el.appendChild(path);
  return el;
};

export const transformIcons = () => {
  const elements = Array.from(document.getElementsByClassName("care"));
  elements.forEach((element) => {
    if (element.tagName == "I") {
      element.parentNode.replaceChild(createSvg(element.className), element);
    }
  });
};

export const addListener = () => {
  window.addEventListener("load", transformIcons);
};

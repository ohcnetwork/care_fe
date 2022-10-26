const Spinner = ({
  className = "",
  path: { fill: pathFill = "white", className: pathClassName = "" } = {},
  circle: {
    fill: circleFill = "white",
    className: circleClassName = "opacity-75",
    stroke: circleStroke = "#f1edf7",
    cx = "12",
    cy = "12",
    r = "10",
    strokeWidth: circleStrokeWidth = "4",
  } = {},
}) => {
  return (
    <svg
      className={"animate-spin h-5 w-5 mr-3 z-40 " + className}
      viewBox="0 0 24 24"
    >
      <circle
        className={circleClassName}
        cx={cx}
        cy={cy}
        r={r}
        stroke={circleStroke}
        fill={circleFill}
        strokeWidth={circleStrokeWidth}
      />
      <path
        className={pathClassName}
        fill={pathFill}
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
};

export default Spinner;

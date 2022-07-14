interface MonitorsvgProps {
  fill?: string;
  className?: string;
  viewBox?: string;
}

const Monitorsvg = (props: MonitorsvgProps) => {
  const { fill, className, viewBox } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill={fill}
      viewBox="0 0 122.88 78.97"
    >
      <path
        fill-rule="evenodd"
        d="M2.08,0h120.8V79H0V0ZM15.87,39.94a2.11,2.11,0,1,1,0-4.21h25l3.4-8.51a2.1,2.1,0,0,1,4,.39l5.13,20L60.71,11a2.11,2.11,0,0,1,4.14,0l6,22,4.76-10.5a2.1,2.1,0,0,1,3.86.08L84.55,35H107a2.11,2.11,0,1,1,0,4.21H83.14a2.12,2.12,0,0,1-2-1.32l-3.77-9.24L72.28,40h0a2.09,2.09,0,0,1-3.93-.31L63.09,20.5l-7.38,37h0a2.1,2.1,0,0,1-4.09.1L45.76,34.75l-1.48,3.72a2.11,2.11,0,0,1-2,1.47ZM4.15,4.15H118.73V64.29H4.15V4.15ZM55.91,69.27h11a2.1,2.1,0,0,1,0,4.2h-11a2.1,2.1,0,0,1,0-4.2Zm19,0h2a2.1,2.1,0,0,1,0,4.2h-2a2.1,2.1,0,0,1,0-4.2ZM46,69.27h2a2.1,2.1,0,0,1,0,4.2H46a2.1,2.1,0,0,1,0-4.2Z"
      />
    </svg>
  );
};

export default Monitorsvg;

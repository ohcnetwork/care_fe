interface CamerasvgProps {
  fill?: string;
  className?: string;
  viewBox?: string;
}

const Camerasvg = (props: CamerasvgProps) => {
  const { fill, className, viewBox } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill={fill}
      className={className}
      id="Icons"
      version="1.1"
      viewBox={viewBox}
    >
      <circle cx="16" cy="20" r="2" />
      <g>
        <path d="M30.7,10c0.6-1.8,0.4-3.9-0.8-5.6C29.7,4.2,29.4,4,29.1,4H2.9C2.6,4,2.3,4.2,2.1,4.4C1,6.1,0.7,8.2,1.3,10H30.7z" />
        <path d="M3,16c0,7.2,5.8,13,13,13s13-5.8,13-13v-4H3V16z M24,14h2c0.6,0,1,0.4,1,1s-0.4,1-1,1h-2c-0.6,0-1-0.4-1-1S23.4,14,24,14z M16,14c3.3,0,6,2.7,6,6s-2.7,6-6,6s-6-2.7-6-6S12.7,14,16,14z" />
      </g>
    </svg>
  );
};

export default Camerasvg;

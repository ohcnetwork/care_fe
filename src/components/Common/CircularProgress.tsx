interface CircularProgressProps {
  className?: string;
  children?: React.ReactNode;
}
export default function CircularProgress(props: CircularProgressProps) {
  return (
    <div
      className={`inline-block size-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-primary-500 motion-reduce:animate-[spin_1.5s_linear_infinite] ${props?.className}`}
    >
      {props?.children}
    </div>
  );
}

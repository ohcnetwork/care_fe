import {
  DetailedHTMLProps,
  ImgHTMLAttributes,
  ReactElement,
  useState,
} from "react";

type Props = DetailedHTMLProps<
  ImgHTMLAttributes<HTMLImageElement>,
  HTMLImageElement
> & {
  fallback?: ReactElement | null;
};

const ImageWithFallback = ({ fallback = null, onError, ...props }: Props) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) return fallback;

  return (
    <img
      {...props}
      onError={(event) => {
        setHasError(true);
        onError && onError(event);
      }}
    />
  );
};

export default ImageWithFallback;

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
  loading?: ReactElement | null;
};

const ImageWithFallback = ({ onError, onLoad, ...props }: Props) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const refresh = () => setHasError(false);

  if (hasError)
    return props.fallback ? (
      <div onClick={refresh}>{props.fallback}</div>
    ) : (
      <div
        className="w-full h-full flex flex-col gap-2 items-center justify-center bg-transparent hover:bg-gray-200 cursor-pointer"
        onClick={refresh}
      >
        <i className="text-xl fa-solid fa-arrows-rotate" />
        <span className="text-xs font-medium">try again</span>
      </div>
    );

  const Loading = () =>
    props.loading || (
      <div className="w-full h-full flex flex-col gap-2 items-center justify-center">
        <i className="text-xl fa-solid fa-arrows-rotate animate-spin" />
        <span className="text-xs font-medium">loading</span>
      </div>
    );

  return (
    <div className={props.className}>
      {isLoading && <Loading />}
      <img
        {...props}
        onError={(event) => {
          setHasError(true);
          onError && onError(event);
        }}
        onLoad={(event) => {
          setIsLoading(false);
          onLoad && onLoad(event);
        }}
      />
    </div>
  );
};

export default ImageWithFallback;

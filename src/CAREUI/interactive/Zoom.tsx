import { ReactNode, createContext, useContext, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";

type ProviderValue = {
  scale: number;
  zoomIn: () => void;
  zoomOut: () => void;
};

const ZoomContext = createContext<ProviderValue | null>(null);

type Props = {
  initialScale?: number;
  scaleRatio?: number;
  children: ReactNode;
};

export const ZoomProvider = ({
  initialScale = 1,
  scaleRatio = 1.25,
  children,
}: Props) => {
  const [scale, setScale] = useState(initialScale);

  return (
    <ZoomContext.Provider
      value={{
        scale,
        zoomIn: () => setScale((scale) => scale * scaleRatio),
        zoomOut: () => setScale((scale) => scale / scaleRatio),
      }}
    >
      {children}
    </ZoomContext.Provider>
  );
};

export const ZoomTransform = (props: {
  children: ReactNode;
  className?: string;
}) => {
  const ctx = useContext(ZoomContext);

  if (ctx == null) {
    throw new Error("Component must be used with ZoomProvider");
  }

  return (
    <div
      className={props.className}
      style={{
        transform: `scale(${ctx.scale})`,
      }}
    >
      {props.children}
    </div>
  );
};

export const ZoomControls = (props: { disabled?: boolean }) => {
  const ctx = useContext(ZoomContext);

  if (ctx == null) {
    throw new Error("Component must be used with ZoomProvider");
  }

  return (
    <div className="absolute bottom-8 right-8 flex flex-col items-center justify-center gap-1 rounded-full border border-secondary-400 bg-white p-0.5 shadow-lg md:flex-row-reverse md:gap-2">
      <ButtonV2
        disabled={props.disabled}
        circle
        variant="secondary"
        size="small"
        shadow={false}
        className="p-2.5"
        onClick={ctx.zoomIn}
      >
        <CareIcon icon="l-search-plus" className="text-lg" />
      </ButtonV2>
      <span className="text-sm font-semibold text-secondary-800">
        {Math.round(ctx.scale * 100)}%
      </span>
      <ButtonV2
        disabled={props.disabled}
        circle
        variant="secondary"
        size="small"
        shadow={false}
        className="p-2.5"
        onClick={ctx.zoomOut}
      >
        <CareIcon icon="l-search-minus" className="text-lg" />
      </ButtonV2>
    </div>
  );
};

import { ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Cancel, Submit } from "@/components/Common/ButtonV2";
import DialogModal from "@/components/Common/Dialog";

import useBreakpoints from "@/hooks/useBreakpoints";

import { classNames } from "@/Utils/utils";

type Props = {
  show: boolean;
  onHide: () => void;
  children: ReactNode;
  anchorRef: React.RefObject<HTMLElement>;
  className?: string;
  onSubmit?: () => void;
};

type Position =
  | { left: number; top: number }
  | { right: number; bottom: number }
  | { left: number; bottom: number }
  | { right: number; top: number };

export default function PopupModal(props: Props) {
  const { t } = useTranslation();
  const isMobile = useBreakpoints({ default: true, lg: false });

  if (!isMobile) {
    return <DesktopView {...props} />;
  }

  return (
    <DialogModal
      title=""
      show={props.show}
      onClose={props.onHide}
      className="!p-4 !pt-0"
    >
      <div className="space-y-6">
        {props.children}
        <div className="cui-form-button-group px-4">
          <Cancel onClick={props.onHide} label={t("close")} shadow={false} />
          {props.onSubmit && (
            <Submit onClick={props.onSubmit} label={t("save")} shadow={false} />
          )}
        </div>
      </div>
    </DialogModal>
  );
}

const DesktopView = (props: Props) => {
  const { t } = useTranslation();
  const [position, setPosition] = useState<Position>({ left: 0, top: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const modal = useRef<HTMLDivElement>(null);
  const [children, setChildren] = useState(props.children);

  useEffect(() => {
    // just to make sure the animation runs smoothly
    if (props.show) {
      setChildren(props.children);
    }
  }, [props.children, props.show]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const isModalClicked =
        modal.current && modal.current.contains(e.target as Node);
      if (!isModalClicked) {
        props.onHide();
      }
    };

    if (props.show) {
      const currentMousePosition = mousePosition;
      const modalHeight = modal.current?.clientHeight || 0;
      const modalWidth = modal.current?.clientWidth || 0;
      const clickX = currentMousePosition.x;
      const clickY = currentMousePosition.y;
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;

      const anchorPosition = props.anchorRef.current?.getBoundingClientRect();
      const anchorX = anchorPosition?.x || 0;
      const anchorY = anchorPosition?.y || 0;
      const verticalCenter = windowHeight / 2;
      const horizontalCenter = windowWidth / 2;
      const mountLeft = clickX - anchorX;
      const mountTop = clickY - anchorY;

      let position;
      if (clickX > horizontalCenter) {
        position = { left: mountLeft - modalWidth };
      } else {
        position = { left: mountLeft };
      }
      if (clickY > verticalCenter) {
        position = { ...position, top: mountTop - modalHeight };
      } else {
        position = { ...position, top: mountTop };
      }
      setPosition(position);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.show]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const positionAttributes = Object.entries(position).reduce(
    (acc, [key, value]) => {
      return { ...acc, [key]: `${value}px` };
    },
    {},
  );

  return (
    <div
      ref={modal}
      style={positionAttributes}
      className={classNames(
        "absolute z-10 rounded-lg border border-secondary-400 bg-white text-black shadow-lg transition-all",
        props.show ? "visible opacity-100" : "invisible opacity-0",
        props.className,
      )}
    >
      {children}
      <div className="flex w-full items-center justify-end gap-2 rounded-b-lg border-t border-t-secondary-300 bg-secondary-100 p-2">
        <Cancel onClick={props.onHide} label={t("close")} shadow={false} />
        {props.onSubmit && (
          <Submit onClick={props.onSubmit} label={t("save")} shadow={false} />
        )}
      </div>
    </div>
  );
};

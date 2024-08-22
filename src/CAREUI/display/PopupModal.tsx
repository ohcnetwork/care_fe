import { ReactNode, useEffect, useRef, useState } from "react";
import { Cancel, Submit } from "../../Components/Common/components/ButtonV2";
import { classNames } from "../../Utils/utils";
import { useTranslation } from "react-i18next";
import useBreakpoints from "../../Common/hooks/useBreakpoints";
import DialogModal from "../../Components/Common/Dialog";

type Props = {
  show: boolean;
  onHide: () => void;
  children: ReactNode;
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
      const xRelative = currentMousePosition.x;
      const yRelative = currentMousePosition.y;
      const containerHeight = window.innerHeight;
      const containerWidth = window.innerWidth;
      const verticalCenter = containerHeight / 2;
      const horizontalCenter = containerWidth / 2;
      // place the modal on the bottom right of the mouse
      // if the modal is going out of the screen, place it on the top left of the mouse
      // if the modal is still going out of the screen, place it on the bottom left of the mouse
      // if the modal is still going out of the screen, place it on the top right of the mouse
      console.log(
        xRelative,
        xRelative + modalWidth,
        yRelative,
        yRelative + modalHeight,
        containerWidth,
        containerHeight,
      );
      let position;
      if (xRelative > horizontalCenter) {
        position = { right: containerWidth - xRelative };
      } else {
        position = { left: xRelative };
      }
      if (yRelative > verticalCenter) {
        position = { ...position, bottom: containerHeight - yRelative };
      } else {
        position = { ...position, top: yRelative };
      }
      const mountingTo = Object.keys(position).reduce((acc, key) => {
        return `${acc} ${key}`;
      }, "");
      console.log("mounting to ", mountingTo);
      setPosition(position);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
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

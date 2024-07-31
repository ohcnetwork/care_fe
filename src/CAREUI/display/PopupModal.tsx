import { ReactNode, useEffect, useRef, useState } from "react";
import { Cancel, Submit } from "../../Components/Common/components/ButtonV2";
import { classNames } from "../../Utils/utils";
import { useTranslation } from "react-i18next";

type Props = {
  show: boolean;
  onHide: () => void;
  children: ReactNode;
  className?: string;
  onSubmit?: () => void;
};

export default function PopupModal(props: Props) {
  const { t } = useTranslation();
  const [position, setPosition] = useState({ x: 0, y: 0 });
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
      const top =
        yRelative + modalHeight > containerHeight
          ? yRelative - modalHeight
          : yRelative;
      const left =
        xRelative + modalWidth > containerWidth
          ? xRelative - modalWidth
          : xRelative;
      setPosition({ x: left, y: top });
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

  return (
    <div
      ref={modal}
      style={{
        top: position.y + "px",
        left: position.x + "px",
      }}
      className={classNames(
        "absolute z-10 rounded-lg border border-secondary-400 bg-white text-black shadow-lg transition-all",
        props.show ? "visible opacity-100" : "invisible opacity-0",
        props.className,
      )}
    >
      {children}
      {props.onSubmit && (
        <div className="flex w-full items-center justify-end gap-2 rounded-b-lg border-t border-t-secondary-300 bg-secondary-100 p-2">
          <Cancel onClick={props.onHide} label={t("close")} shadow={false} />
          <Submit onClick={props.onSubmit} label={t("save")} shadow={false} />
        </div>
      )}
    </div>
  );
}

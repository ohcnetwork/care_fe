import { Link } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import AuthorizedChild from "@/CAREUI/misc/AuthorizedChild";

import Spinner from "@/components/Common/Spinner";

import { AuthorizedElementProps } from "@/Utils/AuthorizeFor";
import { classNames } from "@/Utils/utils";

export type ButtonSize = "small" | "default" | "large";
export type ButtonShape = "square" | "circle";
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "warning"
  | "alert";

export type RawButtonProps = Omit<
  React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >,
  "style"
>;

export type ButtonStyleProps = {
  /**
   * - `"small"` has small text and minimal padding.
   * - `"default"` has small text with normal padding.
   * - `"large"` has base text size with large padding.
   */
  size?: ButtonSize;
  /**
   * - `"square"` gives a button with minimally rounded corners.
   * - `"circle"` gives a button with fully rounded corners. Ideal when only
   * icons are present.
   */
  circle?: boolean | undefined;
  /**
   * - `"primary"` is ideal for form submissions, etc.
   * - `"secondary"` is ideal for things that have secondary importance.
   * - `"danger"` is ideal for destructive or dangerous actions, such as delete.
   * - `"warning"` is ideal for actions that require caution such as archive.
   * - `"alert"` is ideal for actions that require alert.
   */
  variant?: ButtonVariant;
  /** If set, gives an elevated button with hover effects. */
  shadow?: boolean | undefined;
  /** If set, removes the background to give a simple text button. */
  ghost?: boolean | undefined;
  /**
   * If set, applies border to the button.
   */
  border?: boolean | undefined;
};

export type ButtonProps = RawButtonProps &
  AuthorizedElementProps &
  ButtonStyleProps & {
    /**
     * Whether the button is disabled or not.
     * This is overriden to `true` if `loading` is `true`.
     */
    disabled?: boolean | undefined;
    /**
     * Whether the button should be disabled and show a loading animation.
     */
    loading?: boolean | undefined;
    /**
     * A button will convert to a link if the `href` prop is set.
     */
    href?: string | undefined;
    /**
     * Link target. Only applicable if `href` is set.
     */
    target?: string | undefined;
    /**
     * Whether the button should be having a Id.
     */
    id?: string | undefined;
    /**
     * Tooltip showed when hovered over.
     */
    tooltip?: string;
    /**
     * Class for tooltip
     */
    tooltipClassName?: string;
  };

export const buttonStyles = ({
  size = "default",
  circle = false,
  variant = "primary",
  ghost = false,
  border = false,
  shadow = !ghost,
}: ButtonStyleProps) => {
  return classNames(
    "inline-flex h-min cursor-pointer items-center justify-center gap-2 whitespace-pre font-medium outline-offset-1 transition-all duration-200 ease-in-out disabled:cursor-not-allowed disabled:bg-secondary-200 disabled:text-secondary-500",
    `button-size-${size}`,
    `button-shape-${circle ? "circle" : "square"}`,
    ghost ? `button-${variant}-ghost` : `button-${variant}-default`,
    border && `button-${variant}-border`,
    shadow && "shadow enabled:hover:shadow-md",
  );
};

const ButtonV2 = ({
  authorizeFor,
  size,
  variant,
  circle,
  shadow,
  ghost,
  border,
  disabled,
  loading,
  children,
  href,
  target,
  tooltip,
  tooltipClassName,
  ...props
}: ButtonProps) => {
  shadow ??= !ghost;

  const className = classNames(
    buttonStyles({ size, circle, variant, ghost, border, shadow }),
    tooltip && "tooltip",
    props.className,
  );

  if (tooltip) {
    children = (
      <>
        {tooltip && (
          <span className={classNames("tooltip-text", tooltipClassName)}>
            {tooltip}
          </span>
        )}
        {children}
      </>
    );
  }

  if (href && !(disabled || loading)) {
    return (
      <Link href={href} target={target} className={props.className}>
        <button {...props} disabled={disabled || loading} className={className}>
          {children}
        </button>
      </Link>
    );
  }

  if (authorizeFor) {
    return (
      <AuthorizedChild authorizeFor={authorizeFor}>
        {({ isAuthorized }) => (
          <button
            {...props}
            disabled={disabled || !isAuthorized || loading}
            className={className}
          >
            {children}
          </button>
        )}
      </AuthorizedChild>
    );
  }

  return (
    <button {...props} disabled={disabled || loading} className={className}>
      {children}
    </button>
  );
};

export default ButtonV2;

// Common buttons

export type CommonButtonProps = ButtonProps & { label?: string };

export const Submit = ({ label = "Submit", ...props }: CommonButtonProps) => {
  const { t } = useTranslation();
  return (
    <ButtonV2
      id="submit"
      type="submit"
      children={
        <>
          <CareIcon icon="l-check-circle" className="text-lg" />
          <span className="whitespace-pre-wrap">{t(label)}</span>
        </>
      }
      {...props}
      className={classNames("w-full md:w-auto", props.className)}
    />
  );
};

export const Cancel = ({ label = "Cancel", ...props }: CommonButtonProps) => {
  const { t } = useTranslation();
  return (
    <ButtonV2
      id="cancel"
      type="button"
      variant="secondary"
      border
      children={
        <>
          <CareIcon icon="l-times-circle" className="text-lg" />
          {label && <span className="whitespace-pre-wrap">{t(label)}</span>}
        </>
      }
      {...props}
      className={classNames("w-full md:w-auto", props.className)}
    />
  );
};

export type ButtonWithTimerProps = CommonButtonProps & {
  initialInverval?: number;
  interval?: number;
};

export const ButtonWithTimer = ({
  initialInverval,
  interval = 60,
  ...buttonProps
}: ButtonWithTimerProps) => {
  const [seconds, setSeconds] = useState(initialInverval ?? interval);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  useEffect(() => {
    let interval = undefined;
    if (seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds - 1);
      }, 1000);
    } else {
      setIsButtonDisabled(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [seconds]);

  return (
    <div>
      <ButtonV2
        {...buttonProps}
        disabled={isButtonDisabled}
        onClick={async (e) => {
          await buttonProps.onClick?.(e);
          setSeconds(interval);
          setIsButtonDisabled(true);
        }}
      >
        {!!(seconds && isButtonDisabled) && (
          <div className="mr-2 flex items-center">
            <Spinner className="h-4 w-4" />
            {seconds}
          </div>
        )}

        {buttonProps.children ?? buttonProps.label}
      </ButtonV2>
    </div>
  );
};

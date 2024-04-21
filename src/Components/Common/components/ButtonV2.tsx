import AuthorizedChild from "../../../CAREUI/misc/AuthorizedChild";
import { AuthorizedElementProps } from "../../../Utils/AuthorizeFor";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { Link } from "raviger";
import { classNames } from "../../../Utils/utils";
import { useTranslation } from "react-i18next";

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

export type ButtonProps = RawButtonProps &
  AuthorizedElementProps & {
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

const ButtonV2 = ({
  authorizeFor,
  size = "default",
  variant = "primary",
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
  const className = classNames(
    props.className,
    "inline-flex h-min cursor-pointer items-center justify-center gap-2 whitespace-pre font-medium outline-offset-1 transition-all duration-200 ease-in-out disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500",
    `button-size-${size}`,
    `button-shape-${circle ? "circle" : "square"}`,
    ghost ? `button-${variant}-ghost` : `button-${variant}-default`,
    border && `button-${variant}-border`,
    shadow && "shadow enabled:hover:shadow-lg",
    tooltip && "tooltip"
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
      <Link href={href} target={target}>
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

import { useIsAuthorized } from "../../../Common/hooks/useIsAuthorized";
import { Anyone, AuthorizedElementProps } from "../../../Utils/AuthorizeFor";
import { classNames } from "../../../Utils/utils";

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
  };

const ButtonV2 = ({
  authorizeFor = Anyone,
  size = "default",
  variant = "primary",
  circle,
  shadow,
  ghost,
  border,
  className,
  disabled,
  loading,
  children,
  ...props
}: ButtonProps) => {
  const isAuthorized = useIsAuthorized(authorizeFor);

  return (
    <button
      {...props}
      disabled={disabled || !isAuthorized || loading}
      className={classNames(
        "Button outline-offset-1",
        `button-size-${size}`,
        `button-shape-${circle ? "circle" : "square"}`,
        ghost ? `button-${variant}-ghost` : `button-${variant}-default`,
        border && `button-${variant}-border`,
        shadow && "shadow enabled:hover:shadow-lg",
        className
      )}
    >
      {children}
    </button>
  );
};

export default ButtonV2;

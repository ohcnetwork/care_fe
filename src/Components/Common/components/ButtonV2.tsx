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

export type ButtonProps = RawButtonProps & {
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
   * - `"success"` is ideal for form submissions, etc.
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
   * Whether the button is disabled or not.
   * This is overriden to `true` if `loading` is `true`.
   */
  disabled?: boolean | undefined;
  /**
   * Whether the button should be disabled and show a loading animation.
   */
  loading?: boolean | undefined;
};

const shadowClasses =
  "shadow enabled:hover:shadow-lg enabled:hover:-translate-y-1";

const ButtonV2 = ({
  size = "default",
  variant = "primary",
  circle,
  shadow,
  ghost,
  className,
  disabled,
  loading,
  ...props
}: ButtonProps) => {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={[
        "Button outline-offset-1",
        `button-size-${size}`,
        `button-shape-${circle ? "circle" : "square"}`,
        `button-${variant}-${ghost ? "ghost" : "default"}`,
        shadow && shadowClasses,
        className,
      ].join(" ")}
    >
      {props.children}
    </button>
  );
};

export default ButtonV2;

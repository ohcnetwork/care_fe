export type ButtonSize = "small" | "default" | "large";
export type ButtonShape = "square" | "circle";
export type ButtonStyle =
  | "success"
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
  style?: ButtonStyle;
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
  style = "success",
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
        `button-${style}-${ghost ? "ghost" : "default"}`,
        shadow && shadowClasses,
        className,
      ].join(" ")}
    >
      {/* TODO: add loading animation if props.loading */}
      {props.children}
    </button>
  );
};

export default ButtonV2;

// export const RawButton = (props: RawButtonProps) => {
//   const { className, children, ...btnProps } = props;
//   return (
//     <button
//       className={`cursor-pointer flex rounded items-center justify-center font-medium text-sm transition-all duration-200 ease-in ${className}`}
//       {...btnProps}
//     >
//       {children}
//     </button>
//   );
// };

// export const PrimaryButton = (props: ButtonProps) => {
//   const padding = props.label ? "p-2" : "py-2 px-4";
//   return (
//     <RawButton
//       className={`${props.className} bg-primary-500 text-white ${padding}`}
//       {...props}
//     >
//       {props.icon}
//       {props.label}
//     </RawButton>
//   );
// };

// export const SecondaryButton = (props: ButtonProps) => {
//   const padding = props.label ? "p-2" : "py-2 px-4";
//   return (
//     <RawButton
//       className={`${props.className} bg-primary-500 text-white ${padding}`}
//       {...props}
//     >
//       {props.icon}
//       {props.label}
//     </RawButton>
//   );
// };

// export const TextButton = (props: ButtonProps) => {
//   const padding = props.label ? "p-2" : "py-2 px-4";
//   return (
//     <RawButton
//       className={`${props.className} text-primary-500 ${padding}`}
//       {...props}
//     >
//       {props.icon}
//       {props.label}
//     </RawButton>
//   );
// };

// export const OutlinedButton = (props: ButtonProps) => {
//   return (
//     <TextButton
//       className="outline outline-primary-500 hover:bg-gray-100"
//       {...props}
//     />
//   );
// };

// export const DangerButton = (props: ButtonProps) => {
//   const padding = props.label ? "p-2" : "py-2 px-4";
//   return (
//     <RawButton
//       className={`${props.className} bg-red-500 text-white ${padding}`}
//       {...props}
//     >
//       {props.icon}
//       {props.label}
//     </RawButton>
//   );
// };

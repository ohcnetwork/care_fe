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
  shape?: ButtonShape;
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

type ClassesFor<T extends string> = Record<T, string>;

const sizeClasses: ClassesFor<ButtonSize> = {
  small: "p-1 text-sm",
  default: "p-2 text-sm",
  large: "p-3 text-base",
};

const shapeClasses: ClassesFor<ButtonShape> = {
  square: "rounded",
  circle: "rounded-full",
};

const styleClasses: Record<ButtonStyle, ClassesFor<"default" | "ghost">> = {
  success: {
    default:
      "accent-primary-500 bg-primary-500 hover:bg-primary-400 text-white",
    ghost: "accent-primary-500 hover:bg-primary-200 text-primary-500",
  },
  secondary: {
    default: "accent-gray-200 bg-gray-200 hover:bg-gray-100 text-primary-500",
    ghost: "accent-gray-200 hover:bg-gray-200",
  },
  danger: {
    default: "accent-red-500 bg-red-500 hover:bg-red-400 text-white",
    ghost: "accent-red-500 hover:bg-red-200 text-red-500",
  },
  warning: {
    default: "accent-yellow-500 bg-yellow-500 hover:bg-yellow-400 text-white",
    ghost: "accent-yellow-500 hover:bg-yellow-200 text-yellow-500",
  },
  alert: {
    default: "accent-violet-600 bg-violet-600 hover:bg-violet-500 text-white",
    ghost: "accent-violet-600 hover:bg-violet-200 text-violet-600",
  },
};

const shadowClasses =
  "shadow enabled:hover:shadow-lg enabled:hover:-translate-y-1";
const ghostClasses = "border-0";

const Button = ({
  size = "default",
  shape = "square",
  style = "success",
  shadow,
  ghost,
  className,
  disabled,
  loading,
  ...props
}: ButtonProps) => {
  const classes = [
    sizeClasses[size],
    shapeClasses[shape],
    styleClasses[style][ghost ? "ghost" : "default"],
    (shadow && shadowClasses) || "",
    (ghost && ghostClasses) || "",
    className,
  ].join(" ");

  return (
    <button
      className={`h-min outline-offset-1 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 ease-in-out disabled:bg-gray-200 disabled:text-gray-500 ${classes}`}
      {...props}
      disabled={disabled || loading}
    >
      {/* TODO: add loading animation if props.loading */}
      {props.children}
    </button>
  );
};

export default Button;

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

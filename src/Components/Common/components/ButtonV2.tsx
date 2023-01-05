import { useTranslation } from "react-i18next";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import AuthorizedChild from "../../../CAREUI/misc/AuthorizedChild";
import { AuthorizedElementProps } from "../../../Utils/AuthorizeFor";
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
    /**
     * Whether the button should be having a Id.
     */
    id?: string | undefined;
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
  ...props
}: ButtonProps) => {
  const className = classNames(
    "font-medium h-min inline-flex items-center justify-center gap-2 transition-all duration-200 ease-in-out cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 outline-offset-1",
    `button-size-${size}`,
    `button-shape-${circle ? "circle" : "square"}`,
    ghost ? `button-${variant}-ghost` : `button-${variant}-default`,
    border && `button-${variant}-border`,
    shadow && "shadow enabled:hover:shadow-lg",
    props.className
  );

  if (authorizeFor) {
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
    </AuthorizedChild>;
  }

  return (
    <button {...props} disabled={disabled || loading} className={className}>
      {children}
    </button>
  );
};

export default ButtonV2;

// Common buttons

type CommonButtonProps = ButtonProps & { label?: string };

export const Submit = ({ label = "Submit", ...props }: CommonButtonProps) => {
  const { t } = useTranslation();
  return (
    <ButtonV2
      id="submit"
      type="submit"
      className="w-full md:w-auto"
      // Voluntarily setting children this way, so that it's overridable when using.
      children={
        <>
          <CareIcon className="care-l-check-circle text-lg" />
          <span>{t(label)}</span>
        </>
      }
      {...props}
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
      className="w-full md:w-auto"
      // Voluntarily setting children this way, so that it's overridable when using.
      children={
        <>
          <CareIcon className="care-l-times-circle text-lg" />
          <span>{t(label)}</span>
        </>
      }
      {...props}
    />
  );
};

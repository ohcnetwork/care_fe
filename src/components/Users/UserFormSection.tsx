import { createContext, useContext, useId } from "react";

import { Field, FieldGroup } from "@/components/ui/field";
import { FormItem } from "@/components/ui/form";
import { cn } from "@/lib/utils";

const MobileAddUserContext = createContext(false);
export const useMobileAddUser = () => useContext(MobileAddUserContext);

export function UserFormGroups({
  mobile,
  children,
}: {
  mobile: boolean;
  children: React.ReactNode;
}) {
  return (
    <MobileAddUserContext value={mobile}>
      {mobile ? (
        <FieldGroup data-mobile-add-user>{children}</FieldGroup>
      ) : (
        <div className="flex flex-col gap-8">{children}</div>
      )}
    </MobileAddUserContext>
  );
}

export function UserFormItem({
  children,
  className,
}: React.ComponentProps<typeof FormItem>) {
  const mobile = useMobileAddUser();
  return (
    <FormItem className={cn("min-w-0", !mobile && "gap-1.5", className)}>
      {mobile ? <Field>{children}</Field> : children}
    </FormItem>
  );
}

interface UserFormSectionProps extends Omit<
  React.ComponentProps<"section">,
  "title"
> {
  title: string;
}

/** A titled block of the user form. Every section shares the same header style. */
export function UserFormSection({
  title,
  className,
  children,
  ...props
}: UserFormSectionProps) {
  const headingId = useId();
  const mobile = useMobileAddUser();

  if (mobile) {
    return (
      <section className={className} {...props}>
        <FieldGroup>{children}</FieldGroup>
      </section>
    );
  }

  return (
    <section
      aria-labelledby={headingId}
      className={cn("flex flex-col gap-5", className)}
      {...props}
    >
      <h3 id={headingId} className="text-base leading-snug font-semibold">
        {title}
      </h3>
      {children}
    </section>
  );
}

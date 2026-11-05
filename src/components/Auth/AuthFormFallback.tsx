import { ComponentProps } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import { AuthCard } from "@/components/Auth/AuthCard";

type AuthFormFallbackProps = Omit<ComponentProps<typeof AuthCard>, "children">;

/**
 * Placeholder for a lazily loaded sign-in step: the real card header with a
 * field and a submit button sketched in, so the layout does not jump.
 */
export function AuthFormFallback(props: AuthFormFallbackProps) {
  return (
    <AuthCard {...props}>
      <div className="grid gap-6" aria-busy="true">
        <div className="grid gap-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-12 w-full md:h-10" />
        </div>
        <Skeleton className="h-12 w-full md:h-10" />
      </div>
    </AuthCard>
  );
}

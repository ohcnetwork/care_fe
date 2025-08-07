import { UserRead } from "@/types/user/user";

export type userChildProps = {
  userData: UserRead;
  username: string;
  permissions?: string[];
};

export default function UserColumns({
  heading,
  note,
  Child,
  childProps,
}: {
  heading: string;
  note: string;
  Child: (childProps: userChildProps) => React.ReactNode | undefined;
  childProps: userChildProps;
}) {
  return (
    <section
      className="flex flex-col gap-5 sm:flex-row"
      aria-labelledby="section-heading"
    >
      <div className="sm:w-1/4">
        <div className="my-1 text-sm leading-5">
          <p className="mb-2 font-semibold">{heading}</p>
          <p className="text-secondary-600">{note}</p>
        </div>
      </div>
      <div className="sm:w-3/4">
        <Child {...childProps} />
      </div>
    </section>
  );
}

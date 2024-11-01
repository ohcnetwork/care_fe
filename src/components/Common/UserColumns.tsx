import { UserModel } from "../Users/models";

export type userChildProps = {
  userData: UserModel;
  username: string;
};

export default function userColumns(
  heading: string,
  note: string,
  Child: (childProps: userChildProps) => JSX.Element,
  childProps: userChildProps,
) {
  return (
    <>
      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="sm:w-1/4">
          <p className="my-1 text-sm leading-5">
            <p className="mb-2 font-semibold">{heading}</p>
            <p className="text-secondary-600">{note}</p>
          </p>
        </div>
        <div className="sm:w-3/4">
          <Child {...childProps} />
        </div>
      </div>
    </>
  );
}

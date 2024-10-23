import { PerformedByModel } from "@/components/HCX/misc";

export interface BaseModel {
  readonly id: string;
  readonly modified_date: string;
  readonly created_date: string;
  readonly created_by: PerformedByModel;
  readonly updated_by: PerformedByModel;
}

export type Writable<T> = {
  [P in keyof T as IfEquals<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    never,
    P
  >]?: undefined;
} & {
  [P in keyof T as IfEquals<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    P,
    never
  >]: T[P];
};

export type WritableOnly<T> = {
  [P in keyof T as IfEquals<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    P
  >]: T[P];
};

type IfEquals<X, Y, A = X, B = never> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B;

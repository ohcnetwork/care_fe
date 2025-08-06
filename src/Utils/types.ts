import { UserReadMinimal } from "@/types/user/user";

export interface BaseModel {
  readonly id: string;
  readonly modified_date: string;
  readonly created_date: string;
  readonly created_by: UserReadMinimal;
  readonly updated_by: UserReadMinimal;
}

/**
 * A utility type that makes all properties of `T` writable recursively.
 * If a property was originally `readonly`, it becomes optional.
 * Otherwise, it remains required.
 */
export type Writable<T> = T extends object
  ? {
      [P in keyof T as IfEquals<
        { [_ in P]: T[P] },
        { -readonly [_ in P]: T[P] },
        never,
        P
      >]?: undefined;
    } & {
      [P in keyof T as IfEquals<
        { [_ in P]: T[P] },
        { -readonly [_ in P]: T[P] },
        P,
        never
      >]: T[P] extends object ? Writable<T[P]> : T[P];
    }
  : T;

/**
 * A utility type that includes only the non-readonly properties of `T` recursively.
 * Or in other words, excludes all `readonly` properties.
 */
export type WritableOnly<T> = T extends object
  ? {
      [P in keyof T as IfEquals<
        { [_ in P]: T[P] },
        { -readonly [_ in P]: T[P] },
        P
      >]: T[P] extends object ? WritableOnly<T[P]> : T[P];
    }
  : T;

type IfEquals<X, Y, A = X, B = never> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B;

export type Time = `${number}:${number}` | `${number}:${number}:${number}`;

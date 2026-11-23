import { UserSpec } from "@/types/user/user";

export interface BaseModel {
  readonly id: string;
  readonly modified_date: string;
  readonly created_date: string;
  readonly created_by: UserSpec;
  readonly updated_by: UserSpec;
}

export type NonEmptyArray<T> = [T, ...T[]];

export type Time = `${number}:${number}` | `${number}:${number}:${number}`;

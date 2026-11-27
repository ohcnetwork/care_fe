import { UserReadMinimal } from "@/types/user/user";

export interface BaseModel {
  readonly id: string;
  readonly modified_date: string;
  readonly created_date: string;
  readonly created_by: UserReadMinimal;
  readonly updated_by: UserReadMinimal;
}

export type NonEmptyArray<T> = [T, ...T[]];

export type Time = `${number}:${number}` | `${number}:${number}:${number}`;

import { type ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";

import { UserBase } from "@/types/user/user";

type ExcalidrawValue = {
  elements: readonly ExcalidrawElement[];
};

type ObjectTypeValues = {
  object_type: "drawing";
  object_value: ExcalidrawValue;
};

export type MetaArtifactUpsertRequest = {
  datapoints: [
    {
      id: string | undefined;
      associating_type: "patient" | "encounter";
      associating_id: string;
      name: string;
    } & ObjectTypeValues,
  ];
};

export type MetaArtifactResponse = {
  id: string;
  associating_type: "patient" | "encounter";
  associating_id: string;
  name: string;
  created_date: string;
  modified_date: string;
  created_by: UserBase;
  updated_by: UserBase;
  username: string;
} & ObjectTypeValues;

export type MetaArtifactCreatRequest = {
  associating_type: "patient" | "encounter";
  associating_id: string;
  name: string;
} & ObjectTypeValues;

export type MetaArtifactUpdateRequest = {
  id: string;
  associating_type: "patient" | "encounter";
  associating_id: string;
  name: string;
} & ObjectTypeValues;

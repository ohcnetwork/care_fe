import { ExcalidrawElement } from "@excalidraw/excalidraw/dist/types/excalidraw/element/types";

import { UserBase } from "@/types/user/user";

type DrawingValue = {
  application: "excalidraw";
  elements: readonly ExcalidrawElement[];
};

type ObjectTypeValues = {
  object_type: "drawing";
  object_value: DrawingValue;
};

interface MetaArtifactBase {
  name: string;
  note?: string;
}

export type MetaArtifactCreateRequest = MetaArtifactBase &
  ObjectTypeValues & {
    associating_type: "patient" | "encounter";
    associating_id: string;
  };

export type MetaArtifactUpdateRequest = MetaArtifactBase & ObjectTypeValues;

export type MetaArtifactResponse = MetaArtifactBase & {
  id: string;
  associating_type: "patient" | "encounter";
  associating_id: string;
  created_date: string;
  modified_date: string;
  created_by: UserBase;
  updated_by: UserBase;
  username: string;
} & ObjectTypeValues;

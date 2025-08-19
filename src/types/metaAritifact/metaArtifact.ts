import { ExcalidrawElement } from "@excalidraw/excalidraw/dist/types/element/src/types";

import { UserReadMinimal } from "@/types/user/user";

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
  created_by: UserReadMinimal;
  updated_by: UserReadMinimal;
  username: string;
} & ObjectTypeValues;

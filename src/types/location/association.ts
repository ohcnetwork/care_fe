export interface LocationAssociation {
  meta: Record<string, any>;
  id: string | null;
  encounter: string;
  start_datetime: string;
  end_datetime: string | null;
  status: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface LocationAssociationQuestion extends LocationAssociation {
  location: string;
}

export interface LocationAssociationWrite {
  encounter: string;
  start_datetime: string;
  end_datetime?: string | null;
  status: string;
  meta?: Record<string, any>;
}

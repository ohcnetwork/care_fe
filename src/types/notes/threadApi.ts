import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";
import { NoteCreate, NoteRead } from "@/types/notes/messages";
import { ThreadBase, ThreadCreate, ThreadRead } from "@/types/notes/thread";

export default {
  create: {
    path: "/api/v1/patient/{patientId}/thread/",
    method: HttpMethod.POST,
    TBody: Type<ThreadCreate>(),
    TRes: Type<ThreadRead>(),
  },
  update: {
    path: "/api/v1/patient/{patientId}/thread/{threadId}/",
    method: HttpMethod.PUT,
    TBody: Type<ThreadBase>(),
    TRes: Type<ThreadRead>(),
  },
  list: {
    path: "/api/v1/patient/{patientId}/thread/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ThreadRead>>(),
  },

  createNote: {
    path: "/api/v1/patient/{patientId}/thread/{threadId}/note/",
    method: HttpMethod.POST,
    TBody: Type<NoteCreate>(),
    TRes: Type<NoteRead>(),
  },
  getNote: {
    path: "/api/v1/patient/{patientId}/thread/{threadId}/note/{messageId}/",
    method: HttpMethod.GET,
    TRes: Type<NoteRead>(),
  },
  updateNote: {
    path: "/api/v1/patient/{patientId}/thread/{threadId}/note/{messageId}/",
    method: HttpMethod.PUT,
    TBody: Type<NoteCreate>(),
    TRes: Type<NoteRead>(),
  },
  listNotes: {
    path: "/api/v1/patient/{patientId}/thread/{threadId}/note/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<NoteRead>>(),
  },
} as const;

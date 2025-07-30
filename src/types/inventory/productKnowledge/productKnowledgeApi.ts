import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse, UpsertRequest } from "@/Utils/request/types";
import {
  ProductKnowledgeBase,
  ProductKnowledgeCreate,
  ProductKnowledgeUpdate,
} from "@/types/inventory/productKnowledge/productKnowledge";

export default {
  listProductKnowledge: {
    path: "/api/v1/product_knowledge/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ProductKnowledgeBase>>(),
  },
  retrieveProductKnowledge: {
    path: "/api/v1/product_knowledge/{productKnowledgeId}/",
    method: HttpMethod.GET,
    TRes: Type<ProductKnowledgeBase>(),
  },
  createProductKnowledge: {
    path: "/api/v1/product_knowledge/",
    method: HttpMethod.POST,
    TRes: Type<ProductKnowledgeBase>(),
    TBody: Type<ProductKnowledgeCreate>(),
  },
  updateProductKnowledge: {
    path: "/api/v1/product_knowledge/{productKnowledgeId}/",
    method: HttpMethod.PUT,
    TRes: Type<ProductKnowledgeBase>(),
    TBody: Type<ProductKnowledgeUpdate>(),
  },
  upsertProductKnowledge: {
    path: "/api/v1/product_knowledge/upsert/",
    method: HttpMethod.POST,
    TRes: Type<ProductKnowledgeBase>(),
    TBody:
      Type<UpsertRequest<ProductKnowledgeCreate, ProductKnowledgeUpdate>>(),
  },
} as const;

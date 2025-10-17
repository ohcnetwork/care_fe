import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
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
    defaultQueryParams: {
      ordering: "-created_date",
    },
  },
  retrieveProductKnowledge: {
    path: "/api/v1/product_knowledge/{slug}/",
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
    path: "/api/v1/product_knowledge/{slug}/",
    method: HttpMethod.PUT,
    TRes: Type<ProductKnowledgeBase>(),
    TBody: Type<ProductKnowledgeUpdate>(),
  },
  addFavorite: {
    path: "/api/v1/product_knowledge/{slug}/add_favorite/",
    method: HttpMethod.POST,
    TRes: Type<ProductKnowledgeBase>(),
  },
  removeFavorite: {
    path: "/api/v1/product_knowledge/{slug}/remove_favorite/",
    method: HttpMethod.POST,
    TRes: Type<ProductKnowledgeBase>(),
  },
  listFavorites: {
    path: "/api/v1/product_knowledge/",
    method: HttpMethod.GET,
    TRes: Type<ProductKnowledgeBase[]>(),
  },
} as const;

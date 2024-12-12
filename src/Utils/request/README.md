# CARE's data fetching utilities

CARE now uses TanStack Query (formerly React Query) as its data fetching solution. For backward compatibility, we maintain a wrapper `useTanStackQueryInstead` that provides the same API as our previous `useQuery` hook.

## Using TanStack Query (Recommended for new code)

For new API integrations, we recommend using TanStack Query directly:

```tsx
import { useQuery } from "@tanstack/react-query";
import request from "@/Utils/request/request";
import FooRoutes from "@foo/routes";

export default function FooDetails({ id }) {
  const { data, isLoading, error } = useQuery({
    queryKey: [FooRoutes.getFoo.path, id],
    queryFn: async () => {
      const response = await request(FooRoutes.getFoo, {
        pathParams: { id }
      });
      return response.data;
    }
  });

  if (isLoading) return <Loading />;
  if (error) return <Error error={error} />;

  return (
    <div>
      <span>{data.id}</span>
      <span>{data.name}</span>
    </div>
  );
}
```

## Migration Guide & Reference

### Understanding the Transition

Our codebase contains two patterns for data fetching:
1. Legacy pattern using `useTanStackQueryInstead` (wrapper around TanStack Query)
2. Modern pattern using TanStack Query directly

### Pattern Comparison

Here's the same API call implemented both ways:

```tsx
// Legacy Pattern (existing code)
function LegacyComponent({ id }) {
  const { data, loading, error, refetch } = useTanStackQueryInstead(UserRoutes.getUser, {
    pathParams: { id },
    prefetch: true,
    refetchOnWindowFocus: false
  });
}

// Modern Pattern (new code)
function ModernComponent({ id }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [UserRoutes.getUser.path, id],
    queryFn: async () => {
      const response = await request(UserRoutes.getUser, {
        pathParams: { id }
      });
      return response.data;
    },
    enabled: true,
    refetchOnWindowFocus: false
  });
}
```

### Migration Mapping

When migrating from `useTanStackQueryInstead` to direct TanStack Query usage:

```typescript
// Legacy options -> TanStack Query options
{
  prefetch: true      -> enabled: true
  loading            -> isLoading
  refetchOnWindowFocus: false -> refetchOnWindowFocus: false
  
  // Response structure
  data               -> data (direct access, no .data property)
  res.status         -> Use error handling or onError callback
  error              -> error
}
```

### Common Patterns

1. **Conditional Fetching**:
```tsx
// Legacy
useTanStackQueryInstead(route, { prefetch: shouldFetch })

// Modern
useQuery({
  queryKey: [route.path],
  queryFn: async () => (await request(route)).data,
  enabled: shouldFetch
})
```

2. **With Parameters**:
```tsx
// Legacy
useTanStackQueryInstead(route, { 
  pathParams: { id }, 
  query: { filter } 
})

// Modern
useQuery({
  queryKey: [route.path, id, filter],
  queryFn: async () => {
    const response = await request(route, {
      pathParams: { id },
      query: { filter }
    });
    return response.data;
  }
})
```

3. **Error Handling**:
```tsx
// Legacy
const { error, res } = useTanStackQueryInstead(route);
if (res?.status === 403) handleForbidden();

// Modern
useQuery({
  queryKey: [route.path],
  queryFn: async () => {
    const response = await request(route);
    if (response.res.status === 403) handleForbidden();
    return response.data;
  },
  onError: (error) => handleError(error)
})
```

## Legacy Support: `useTanStackQueryInstead`

For existing code or maintaining consistency with older patterns, use our wrapper around TanStack Query:

```jsx
import { useTanStackQueryInstead } from "@care/request";
import FooRoutes from "@foo/routes";

export default function FooDetails({ children, id }) {
  const { res, data, loading, error } = useTanStackQueryInstead(FooRoutes.getFoo, {
    pathParams: { id },
  });

  if (loading) return <Loading />;

  if (res.status === 403) {
    navigate("/forbidden");
    return null;
  }

  if (error) {
    return <Error error={error} />;
  }

  return (
    <div>
      <span>{data.id}</span>
      <span>{data.name}</span>
    </div>
  );
}
```

### API

```ts
useTanStackQueryInstead(route: Route, options?: QueryOptions): ReturnType<useTanStackQueryInstead>;
```

#### `route`

A route object that specifies the endpoint to fetch data from.

```ts
const FooRoutes = {
  getFoo: {
    path: "/api/v1/foo/{id}/", // 👈 The path to the endpoint. Slug parameters can be specified using curly braces.
    method: "GET", // 👈 The HTTP method to use. Optional; defaults to "GET".
    TRes: Type<Foo>(), // 👈 The type of the response body (for type inference).
    TBody: Type<Foo>(), // 👈 The type of the request body (for type inference).
    noAuth: true, // 👈 Whether to skip adding the Authorization header to the request.
  },
} as const; // 👈 This is important for type inference to work properly.
```

#### `options`

An object that specifies options for the request.

```ts
const options = {
  prefetch: true, // 👈 Whether to prefetch the data when the component mounts.
  refetchOnWindowFocus: true, // 👈 Whether to refetch the data when the window regains focus.

  // The following options are passed directly to the underlying `request` function.
  pathParams: { id: "123" }, // 👈 The slug parameters to use in the path.
  query: { limit: 10 }, // 👈 The query parameters to be added to the request URL.
  body: { name: "foo" }, // 👈 The body to be sent with the request.
  headers: { "X-Foo": "bar" }, // 👈 Additional headers to be sent with the request.
  silent: true, // 👈 Whether to suppress notifications for this request.

  onResponse: (res) => {
    if (res.status === 403) {
      navigate("/forbidden");
    }
  },
};
```

#### Return Type

The hook returns an object with the following properties:

```ts
{
  res: Type<TRes> | undefined;  // 👈 The response object. `undefined` if the request has not been made yet.
  data: TRes | null;            // 👈 The response body. `null` if the request has not been made yet.
  error: any;                   // 👈 The error that occurred while making the request if any.
  loading: boolean;             // 👈 Whether the request is currently in progress.
  refetch: () => void;          // 👈 A function that can be called to refetch the data.
}
```

## `request`

`request` is a function that allows you to fetch data. It is a wrapper around `fetch` that adds some useful features. It can be used in both React components and non-React code. For fetching data in React components, prefer using TanStack Query or `useTanStackQueryInstead`. For mutations, use `request`.

### `request` usage

```ts
import { request } from "@care/request";
import FooRoutes from "@foo/routes";

export default async function updateFoo(id: string, object: Foo) {
  const { res, data } = await request(FooRoutes.updateFoo, {
    pathParams: { id },
    body: object, // 👈 The body is automatically serialized to JSON.
  });

  if (res.status === 403) {
    navigate("/forbidden");
    return null;
  }

  return data;
}
```

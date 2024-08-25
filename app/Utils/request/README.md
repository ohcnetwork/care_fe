# CARE's data fetching utilities: `useQuery` and `request`

There are two main ways to fetch data in CARE: `useQuery` and `request`. Both of these utilities are built on top of [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).

## `useQuery`

`useQuery` is a React hook that allows you to fetch data and automatically update the UI when the data changes. It is
a wrapper around `request` that is designed to be used in React components. Only "GET" requests are supported with `useQuery`. For other request methods (mutations), use `request`.

### Usage

```jsx
import { useQuery } from "@care/request";
import FooRoutes from "@foo/routes";

export default function FooDetails({ children, id }) {
  const { res, data, loading, error } = useQuery(FooRoutes.getFoo, {
    pathParams: { id },
  });

  /* 🪄 Here typeof data is automatically inferred from the specified route. */

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
useQuery(route: Route, options?: QueryOptions): ReturnType<useQuery>;
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
  // If you accidentally forget to specify a slug parameter an error will be
  // thrown before the request is made.

  query: { limit: 10 }, // 👈 The query parameters to be added to the request URL.
  body: { name: "foo" }, // 👈 The body to be sent with the request. Should be compatible with the TBody type of the route.
  headers: { "X-Foo": "bar" }, // 👈 Additional headers to be sent with the request. (Coming soon...)

  silent: true, // 👈 Whether to suppress notifications for this request.
  // This is useful for requests that are made in the background.

  reattempts: 3, // 👈 The number of times to retry the request if it fails.
  // Reattempts are only made if the request fails due to a network error. Responses with
  // status codes in the 400s and 500s are not retried.

  onResponse: (res) => {
    // 👈 An optional callback that is called after the response is received.
    if (res.status === 403) {
      navigate("/forbidden");
    }
  },
  // This is useful for handling responses with status codes in the 400s and 500s for a specific request.
};
```

#### `ReturnType<useQuery>`

The `useQuery` hook returns an object with the following properties:

```ts
{
  res: Type<TRes> | undefined;  // 👈 The response object. `undefined` if the request has not been made yet.

  data: TRes | null;            // 👈 The response body. `null` if the request has not been made yet.

  error: any;                   // 👈 The error that occurred while making the request if any.

  loading: boolean;             // 👈 Whether the request is currently in progress.

  refetch: () => void;          // 👈 A function that can be called to refetch the data.
  // Ideal for revalidating stale data after a mutation.
}
```

## `request`

`request` is a function that allows you to fetch data. It is a wrapper around `fetch` that adds some useful features. It can be used in both React components and non-React code. For fetching data in React components, prefer using `useQuery`. For mutations, use `request`.

### `request` usage

```ts
import { request } from "@care/request";
import FooRoutes from "@foo/routes";

export default async function updateFoo(id: string, object: Foo) {
  const { res, data } = await request(FooRoutes.updateFoo, {
    pathParams: { id },
    body: object, // 👈 The body is automatically serialized to JSON. Should be compatible with the TBody type of the route.
  });

  if (res.status === 403) {
    navigate("/forbidden");
    return null;
  }

  return data;
}
```

# CARE's data fetching utilities

CARE now uses TanStack Query (formerly React Query) as its data fetching solution.

## Using TanStack Query (Recommended for new code)

For new API integrations, we recommend using TanStack Query with `query` utility function. This is a wrapper around `fetch` that works seamlessly with TanStack Query. It handles response parsing, error handling, setting headers, and more.

````tsx
import { useQuery } from "@tanstack/react-query";
import query from "@/Utils/request/query";

export default function UserProfile() {
  const { data, isLoading } = useQuery({
    queryKey: [routes.users.current.path],
    queryFn: query(routes.users.current)
  });

  if (isLoading) return <Loading />;
  return <div>{data?.name}</div>;
}

// With path parameters
function PatientDetails({ id }: { id: string }) {
  const { data } = useQuery({
    queryKey: ['patient', id],
    queryFn: query(patientApi.get, {
      pathParams: { id }
    })
  });

  return <div>{data?.name}</div>;
}

// With query parameters
function SearchMedicines() {
  const { data } = useQuery({
    queryKey: ['medicines', 'paracetamol'],
    queryFn: query(routes.medicine.search, {
      queryParams: { search: 'paracetamol' }
    })
  });

  return <MedicinesList medicines={data?.results} />;
}

// When you need response status/error handling
function FacilityDetails({ id }: { id: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["facility", id],
    queryFn: query(routes.getFacility, {
      pathParams: { id },
      silent: true
    })
  });

  if (isLoading) return <Loading />;
  return <div>{data?.name}</div>;
}

### query

`query` is our wrapper around fetch that works seamlessly with TanStack Query. It:
- Handles response parsing (JSON, text, blobs).
- Constructs proper error objects.
- Sets the headers appropriately.
- Integrates with our global error handling.

```typescript
interface APICallOptions {
  pathParams?: Record<string, string>;  // URL parameters
  queryParams?: TQuery;                 // Route-specific query string parameters
  body?: TBody;                         // Request body
  silent?: boolean;                     // Suppress error notifications
  headers?: HeadersInit;                // Additional headers
}

// Basic usage
useQuery({
  queryKey: ["users"],
  queryFn: query(routes.users.list)
});

// With parameters
useQuery({
  queryKey: ["user", id],
  queryFn: query(routes.users.get, {
    pathParams: { id },
    queryParams: { include: "details" },
    silent: true  // Optional: suppress error notifications
  })
});
````

### Debounced Queries

For search inputs or other scenarios requiring debounced API calls, use `query.debounced`:

```tsx
function SearchComponent() {
  const [search, setSearch] = useState("");

  const { data } = useQuery({
    queryKey: ["search", search],
    queryFn: query.debounced(routes.search, {
      queryParams: { q: search },
      debounceInterval: 500, // Optional: defaults to 500ms
    }),
    enabled: search.length > 0,
  });

  return (
    <Input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

The debounced query will wait for the specified interval after the last call before executing the request, helping to reduce unnecessary API calls during rapid user input.

### Error Handling

All API errors are now handled globally. Common scenarios like:

- Session expiry -> Redirects to /session-expired
- Bad requests (400/406) -> Shows error notification
  are automatically handled.

Use the `silent: true` option to suppress error notifications for specific queries.

## Using Mutations with TanStack Query

For data mutations, we provide a `mutate` utility that works seamlessly with TanStack Query's `useMutation` hook.

```tsx
import { useMutation } from "@tanstack/react-query";

import mutate from "@/Utils/request/mutate";

function CreatePrescription({ consultationId }: { consultationId: string }) {
  const { mutate: createPrescription, isPending } = useMutation({
    mutationFn: mutate(MedicineRoutes.createPrescription, {
      pathParams: { consultationId },
    }),
    onSuccess: () => {
      toast.success("Prescription created successfully");
    },
  });

  return (
    <Button
      onClick={() =>
        createPrescription({ medicineId: "123", dosage: "1x daily" })
      }
      disabled={isPending}
    >
      Create Prescription
    </Button>
  );
}

// With path parameters and complex payload
function UpdatePatient({ patientId }: { patientId: string }) {
  const { mutate: updatePatient } = useMutation({
    mutationFn: mutate(PatientRoutes.update, {
      pathParams: { id: patientId },
      silent: true, // Optional: suppress error notifications
    }),
  });

  const handleSubmit = (data: PatientData) => {
    updatePatient(data);
  };

  return <PatientForm onSubmit={handleSubmit} />;
}
```

## Using Batch Requests with `useBatchRequest`

The batch request API sends more than one request in one call. The backend
runs the requests in series in one atomic transaction. If one request fails,
the backend rolls back all the changes of all the requests and gives a 4xx or
5xx status for the full batch.

Use the `useBatchRequest` hook to call this API. Give the hook an array of
`BatchRequestObject`. Each object has the API route, the path parameters, the
body, and a reference ID. Use the reference ID to find the result of each
request in the response.

```tsx
import encounterApi from "@/types/emr/encounter/encounterApi";
import { BatchRequestObject, useBatchRequest } from "@/Utils/request/batch";

function CloseEncounter({ encounterId }: { encounterId: string }) {
  const { mutate: batchRequest, isPending } = useBatchRequest({
    onSuccess: ({ results }) => {
      // Use the reference ID to find the result of each request.
      if (results.some((result) => result.reference_id === "encounter-closed")) {
        toast.success("Encounter closed");
      }
    },
  });

  const submit = () => {
    const requests: BatchRequestObject[] = [
      {
        api: encounterApi.update,
        pathParams: { id: encounterId },
        body: { status: "completed" },
        referenceId: "encounter-closed",
      },
      // ... more requests
    ];

    batchRequest(requests);
  };

  return (
    <Button onClick={submit} disabled={isPending}>
      Close Encounter
    </Button>
  );
}
```

### Error Handling

The global error handler cannot read the batch response shape. On a batch
failure, the response body keeps the status and the error body of each
sub-request in the `results` array. Without special handling, the global
error handler shows a wrong error message for the successful sub-requests too.

The `useBatchRequest` hook prevents this. On a batch failure, the hook sends
the error of each failed sub-request to the global error handler. So each
failed sub-request gets the full error handling: the pydantic errors, the
structured errors, the 404 detail, the session expiry, and more. The
successful sub-requests show no error message.

The original error still goes to the `onError` and the `onSettled` callbacks.
To read the results of the failed batch, use `error.cause.results`.

Set the `silent` option to `true` if the caller handles the errors itself. The
hook then shows no error message for the sub-requests.

```tsx
const { mutate: batchRequest } = useBatchRequest({
  silent: true,
  onError: () => {
    toast.error("Could not save the changes");
  },
});
```

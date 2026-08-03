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
  queryParams?: QueryParams;            // Query string parameters
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

### Send atomic batch requests with `mutate.atomic`

Use `mutate.atomic` to send more than one request as one atomic batch
request. The server runs all of the requests together. The batch is atomic:
if one request fails, the server stops all of the requests. Then no request
in the batch changes the data.

Give `mutate.atomic` an array of request objects. Each request object has
these properties:

- `api`: the API route to call.
- `pathParams`: the path parameters for the route. This property is optional.
- `body`: the data to send in the request.
- `referenceId`: a unique name for the request.

```tsx
import { useMutation } from "@tanstack/react-query";

import { BatchRequestObject } from "@/Utils/request/batch";
import mutate from "@/Utils/request/mutate";

function DispenseMedications({ patientId }: { patientId: string }) {
  const { mutate: dispense, isPending } = useMutation({
    mutationFn: mutate.atomic(),
    onSuccess: (response) => {
      // The response has one result for each request in the batch.
      // Each result has the reference_id, the status_code, and the data.
      toast.success("The medications are dispensed.");
    },
  });

  const handleDispense = () => {
    const requests: BatchRequestObject[] = [
      {
        api: medicationDispenseApi.create,
        body: dispenseData,
        referenceId: "dispense_1",
      },
      {
        api: prescriptionApi.upsert,
        pathParams: { patientId },
        body: { datapoints },
        referenceId: "prescription_completion",
      },
    ];

    dispense(requests);
  };

  return (
    <Button onClick={handleDispense} disabled={isPending}>
      Dispense
    </Button>
  );
}
```

On success, the response contains a `results` array. The array has one
result for each request. Each result contains the `reference_id`, the
`status_code`, and the `data`.

On failure, `mutate.atomic` shows an error for each request that failed. It
does not show an error for the other requests in the batch. The mutation
goes to the error state. Add an `onError` function if you must do more steps
after a failure.

To stop the error notifications, set the `silent` option:

```tsx
mutationFn: mutate.atomic({ silent: true });
```

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
    queryFn: query(patientApi.getPatient, {
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

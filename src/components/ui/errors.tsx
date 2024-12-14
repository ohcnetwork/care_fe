export function InputErrors({ errors }: { errors?: string[] }) {
  return errors ? (
    <div className="mt-1">
      {errors?.map((error, i) => (
        <div key={i} className="text-red-500 text-xs">
          {error}
        </div>
      ))}
    </div>
  ) : null;
}

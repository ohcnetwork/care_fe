export function InputErrors({ errors }: { errors?: string[] }) {
  return errors && !!errors.length ? (
    <div className="mt-1" data-input-error>
      {errors?.map((error, i) => (
        <div key={i} className="text-red-500 text-xs">
          {error}
        </div>
      ))}
    </div>
  ) : null;
}

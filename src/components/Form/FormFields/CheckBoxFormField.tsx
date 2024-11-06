import {
  FieldErrorText,
  FieldLabel,
} from "@/components/Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "@/components/Form/FormFields/Utils";

export default function CheckBoxFormField(props: FormFieldBaseProps<boolean>) {
  const field = useFormFieldPropsResolver(props);

  return (
    <div className={field.className}>
      <div className="flex items-center">
        <input
          className="relative float-left mr-2 h-[1.125rem] w-[1.125rem] appearance-none rounded-DEFAULT border-[0.125rem] border-solid border-[rgba(0,0,0,0.25)] bg-white outline-none before:pointer-events-none before:absolute before:h-3.5 before:w-3.5 before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] checked:border-primary checked:bg-primary checked:before:absolute checked:before:opacity-[0.16] checked:after:absolute checked:after:-mt-px checked:after:ml-1 checked:after:block checked:after:h-[0.8125rem] checked:after:w-1.5 checked:after:rotate-45 checked:after:border-[0.125rem] checked:after:border-l-0 checked:after:border-t-0 checked:after:border-solid checked:after:border-white checked:after:bg-transparent checked:after:content-[''] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:transition-[border-color_0.2s] focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] focus:after:absolute focus:after:z-[1] focus:after:block focus:after:h-3.5 focus:after:w-3.5 focus:after:rounded-sm focus:after:bg-white focus:after:content-[''] checked:focus:border-primary checked:focus:bg-primary checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:focus:after:-mt-px checked:focus:after:ml-1 checked:focus:after:h-[0.8125rem] checked:focus:after:w-1.5 checked:focus:after:rotate-45 checked:focus:after:rounded-none checked:focus:after:border-[0.125rem] checked:focus:after:border-l-0 checked:focus:after:border-t-0 checked:focus:after:border-solid checked:focus:after:border-white checked:focus:after:bg-transparent"
          type="checkbox"
          id={field.id}
          name={field.name}
          checked={field.value}
          onChange={(e) => field.handleChange(e.target.checked)}
          disabled={field.disabled}
        />
        <FieldLabel
          htmlFor={field.id}
          required={field.required}
          className={props.labelClassName}
          noPadding
        >
          {field.label}
        </FieldLabel>
      </div>
      <FieldErrorText error={field.error} className={field.errorClassName} />
    </div>
  );
}

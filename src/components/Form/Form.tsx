import { useEffect, useMemo, useRef, useState } from "react";

import { Cancel, Submit } from "@/components/Common/ButtonV2";
import { FieldValidator } from "@/components/Form/FieldValidators";
import {
  FormContextValue,
  createFormContext,
} from "@/components/Form/FormContext";
import { FieldChangeEvent } from "@/components/Form/FormFields/Utils";
import {
  FormDetails,
  FormErrors,
  FormState,
  formReducer,
} from "@/components/Form/Utils";

import { DraftSection, useAutoSaveReducer } from "@/Utils/AutoSave";
import * as Notification from "@/Utils/Notifications";
import { classNames, isEmpty, omitBy } from "@/Utils/utils";

type Props<T extends FormDetails> = {
  className?: string;
  defaults: T;
  asyncGetDefaults?: (() => Promise<T>) | false;
  validate?: (form: T) => FormErrors<T>;
  onSubmit: (form: T, source?: string) => Promise<FormErrors<T> | void>;
  onCancel?: () => void;
  noPadding?: true;
  disabled?: boolean;
  submitLabel?: string;
  submitBtnId?: string;
  cancelLabel?: string;
  onDraftRestore?: (newState: FormState<T>) => void;
  children: (props: FormContextValue<T>) => React.ReactNode;
  hideRestoreDraft?: boolean;
  resetFormValsOnCancel?: boolean;
  resetFormValsOnSubmit?: boolean;
  hideCancelButton?: boolean;
  additionalButtons?: {
    type: "submit" | "button";
    label: string;
    id: string;
  }[];
};

const Form = <T extends FormDetails>({
  asyncGetDefaults,
  validate,
  hideCancelButton = false,
  ...props
}: Props<T>) => {
  const initial = { form: props.defaults, errors: {} };
  const [isLoading, setIsLoading] = useState(!!asyncGetDefaults);
  const [state, dispatch] = useAutoSaveReducer<T>(formReducer, initial);
  const formVals = useRef(props.defaults);

  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!asyncGetDefaults) return;

    asyncGetDefaults().then((form) => {
      dispatch({ type: "set_form", form });
      setIsLoading(false);
    });
  }, [asyncGetDefaults]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const buttonId = (event.nativeEvent as SubmitEvent).submitter?.id;

    if (validate) {
      const errors = omitBy(validate(state.form), isEmpty) as FormErrors<T>;

      if (Object.keys(errors).length) {
        dispatch({ type: "set_errors", errors });

        if (errors.$all) {
          Notification.Error({ msg: errors.$all });
        }
        return;
      }
    }

    const errors = await props.onSubmit(state.form, buttonId);
    if (errors) {
      setIsDirty(false);
      dispatch({
        type: "set_errors",
        errors: { ...state.errors, ...errors },
      });
    } else if (props.resetFormValsOnSubmit) {
      dispatch({ type: "set_form", form: formVals.current });
    }
  };

  const handleCancel = () => {
    if (props.resetFormValsOnCancel) {
      dispatch({ type: "set_form", form: formVals.current });
    }
    props.onCancel?.();
  };

  const handleFieldChange = (
    { name, value }: FieldChangeEvent<T[keyof T]>,
    validate?: FieldValidator<T[keyof T]>,
  ) => {
    dispatch({
      type: "set_field",
      name,
      value,
      error: validate?.(value),
    });

    const defaultValue: unknown = props.defaults[name];

    const isEqual = (() => {
      // Handle null/undefined
      if (defaultValue === null || value === null) {
        return defaultValue === value;
      }

      // Handle arrays
      if (Array.isArray(defaultValue) && Array.isArray(value)) {
        return JSON.stringify(defaultValue) === JSON.stringify(value);
      }

      // Handle objects
      if (typeof defaultValue === "object" && typeof value === "object") {
        return JSON.stringify(defaultValue) === JSON.stringify(value);
      }

      // Handle number/string conversion
      if (typeof defaultValue === "number" && typeof value === "string") {
        return defaultValue.toString() === value;
      }

      // Default case
      return defaultValue === value;
    })();
    setIsDirty(!isEqual);
  };

  const { Provider, Consumer } = useMemo(() => createFormContext<T>(), []);
  const disabled = isLoading || props.disabled;

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          handleSubmit(e);
        }
      }}
      className={classNames(
        "mx-auto w-full",
        !props.noPadding && "px-8 py-5 md:px-16 md:py-11",
        props.className,
      )}
      noValidate
    >
      <DraftSection
        handleDraftSelect={(newState: FormState<T>) => {
          dispatch({ type: "set_state", state: newState });
          props.onDraftRestore?.(newState);
          setIsDirty(false);
        }}
        formData={state.form}
        hidden={props.hideRestoreDraft}
      >
        <Provider
          value={(name: keyof T, validate?: FieldValidator<T[keyof T]>) => {
            return {
              name,
              id: name,
              onChange: (event: FieldChangeEvent<T[keyof T]>) =>
                handleFieldChange(event, validate),
              value: state.form[name],
              error: state.errors[name],
              disabled,
            };
          }}
        >
          <div className="my-6">
            <Consumer>{props.children}</Consumer>
          </div>
          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            {!hideCancelButton && (
              <Cancel
                onClick={handleCancel}
                label={props.cancelLabel ?? "Cancel"}
              />
            )}
            <Submit
              id={props.submitBtnId ?? "submit"}
              data-testid="submit-button"
              type="submit"
              disabled={disabled ?? !isDirty}
              label={props.submitLabel}
            />
            {props.additionalButtons?.map((btn) => {
              return (
                <Submit
                  key={btn.id}
                  id={btn.id}
                  type={btn.type}
                  disabled={disabled || !isDirty}
                  label={btn.label}
                />
              );
            })}
          </div>
        </Provider>
      </DraftSection>
    </form>
  );
};

export default Form;

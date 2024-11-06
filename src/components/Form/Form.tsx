import { isEmpty, omitBy } from "lodash-es";
import { useEffect, useMemo, useState } from "react";

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
import { classNames } from "@/Utils/utils";

type Props<T extends FormDetails> = {
  className?: string;
  defaults: T;
  asyncGetDefaults?: (() => Promise<T>) | false;
  validate?: (form: T) => FormErrors<T>;
  onSubmit: (form: T) => Promise<FormErrors<T> | void>;
  onCancel?: () => void;
  noPadding?: true;
  disabled?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onDraftRestore?: (newState: FormState<T>) => void;
  children: (props: FormContextValue<T>) => React.ReactNode;
  hideRestoreDraft?: boolean;
};

const Form = <T extends FormDetails>({
  asyncGetDefaults,
  validate,
  ...props
}: Props<T>) => {
  const initial = { form: props.defaults, errors: {} };
  const [isLoading, setIsLoading] = useState(!!asyncGetDefaults);
  const [state, dispatch] = useAutoSaveReducer<T>(formReducer, initial);

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

    const errors = await props.onSubmit(state.form);
    if (errors) {
      dispatch({
        type: "set_errors",
        errors: { ...state.errors, ...errors },
      });
    }
  };

  const { Provider, Consumer } = useMemo(() => createFormContext<T>(), []);
  const disabled = isLoading || props.disabled;

  return (
    <form
      onSubmit={handleSubmit}
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
        }}
        formData={state.form}
        hidden={props.hideRestoreDraft}
      >
        <Provider
          value={(name: keyof T, validate?: FieldValidator<T[keyof T]>) => {
            return {
              name,
              id: name,
              onChange: ({ name, value }: FieldChangeEvent<T[keyof T]>) =>
                dispatch({
                  type: "set_field",
                  name,
                  value,
                  error: validate?.(value),
                }),
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
            <Cancel
              onClick={props.onCancel}
              label={props.cancelLabel ?? "Cancel"}
            />
            <Submit
              data-testid="submit-button"
              type="submit"
              disabled={disabled}
              label={props.submitLabel ?? "Submit"}
            />
          </div>
        </Provider>
      </DraftSection>
    </form>
  );
};

export default Form;

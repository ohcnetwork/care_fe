import { NURSING_CARE_FIELDS } from "../../../Common/constants";
import CheckBoxFormField from "../../Form/FormFields/CheckBoxFormField";
import TextAreaFormField from "../../Form/FormFields/TextAreaFormField";
import { logUpdateSection } from "../utils";

export default logUpdateSection(
  {
    title: "Nursing Care",
    icon: "l-user-nurse",
  },
  ({ log, onChange }) => (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4">
      {NURSING_CARE_FIELDS.map((field, i) => {
        const nursing = log.nursing?.find((n) => n.procedure === field.text);

        return (
          <div key={i}>
            <div className="overflow-hidden rounded-lg border border-gray-400 bg-gray-200 ring-0 ring-primary-400 transition-all focus-within:ring-2">
              <div className="p-4">
                <CheckBoxFormField
                  label={field.desc}
                  name=""
                  value={!!nursing}
                  onChange={(e) =>
                    onChange({
                      nursing: e.value
                        ? [
                            ...(log.nursing || []),
                            { procedure: field.text, description: "" },
                          ]
                        : log.nursing?.filter(
                            (n) => n.procedure !== field.text,
                          ),
                    })
                  }
                />
              </div>
              {nursing && (
                <div className="p-4">
                  {log.nursing?.find((n) => n.procedure === field.text) && (
                    <TextAreaFormField
                      name={field.text}
                      value={nursing?.description}
                      onChange={(val) =>
                        onChange({
                          nursing: log.nursing?.map((n) =>
                            n.procedure === field.text
                              ? { ...n, description: val.value }
                              : n,
                          ),
                        })
                      }
                      placeholder="Description"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  ),
);

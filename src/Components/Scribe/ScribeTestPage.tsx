import { useState } from "react";
import TextFormField from "../Form/FormFields/TextFormField";
import * as Scribe from ".";

export default function ScribeTestPage() {
  const [form, setForm] = useState({
    patientName: "",
  });

  return (
    <div>
      <h1>Test Scribe Form</h1>
      <Scribe.Provider>
        <Scribe.Controller />
        <Scribe.Input<string>
          friendlyName="Patient Name"
          id="patient_name"
          description="Name of the patient"
          type="string"
          example="Manoj Bajpayee"
          value={() => form.patientName}
          onUpdate={(name) => setForm({ patientName: name })}
        >
          {({ value }) => (
            <TextFormField
              value={value() as any}
              name="patient_name"
              onChange={(e) => setForm({ patientName: e.value })}
            />
          )}
        </Scribe.Input>
      </Scribe.Provider>
    </div>
  );
}

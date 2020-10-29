import React, { useCallback, useReducer, useState } from "react";
import {
  MultilineInputField,
  PhoneNumberField,
  SelectField,
  TextInputField,
} from "../Common/HelperInputFields";

import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  InputLabel,
  IconButton,
} from "@material-ui/core";


export const ExternalResultLocalbodySelector = (props: any) => {
  const [localBody, setLocalBody] = useState(0)

  const selectedLocalBody = props.lsgs?.find((item: any) => item.id == localBody);

  const wards = selectedLocalBody?.wards;
  return (
    <div className="pb-2">
      <div className="space-y-1">
        <label id="listbox-label" className="block text-sm leading-5 font-medium text-gray-700">
          Assigned to
        </label>



        <div className="md:col-span-2">
          <InputLabel id="local_body-label">Localbody*</InputLabel>
          <SelectField
            name="local_body"
            variant="outlined"
            margin="dense"
            value={localBody}
            options={props.lsgs}
            optionValue="name"
            onChange={(e) => {
              setLocalBody(e.target.value)
            }}
          />

        </div>
        <div className="md:col-span-2">
          <InputLabel id="ward-label">Ward*</InputLabel>
          {
            wards && <SelectField
              name="ward"
              variant="outlined"
              margin="dense"
              options={wards
                ?.sort((a: any, b: any) => a.number - b.number)
                .map((e: any) => {
                  return { id: e.id, name: e.number + ": " + e.name };
                })}

              optionValue="name"
            />
          }


        </div>



      </div>
    </div >)
};

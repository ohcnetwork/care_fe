import React, { useState } from 'react';
import { DISEASE_STATUS } from "../../Common/constants";
import { SelectField } from "../Common/HelperInputFields";

const diseaseStatusOptions = ['Show All', ...DISEASE_STATUS];

type PatientFilterProps = { filter: (value: string) => void }

export const PatientFilter = (props: PatientFilterProps) => {
    const [diseaseStatus, setDiseaseStatus] = useState('Show All');
    const { filter } = props;

    const handleChange = (event: any) => {
        setDiseaseStatus(event.target.value)
        const filterVal = event.target.value !== 'Show All' ? event.target.value : '';
        filter(filterVal);
    };

    return (
        <div className="md:flex sticky top-0 bg-gray-100">
            <div className="w-56 flex items-center">
                <SelectField
                    name="disease_status"
                    variant="outlined"
                    margin="dense"
                    optionArray={true}
                    value={diseaseStatus}
                    options={diseaseStatusOptions}
                    onChange={(value: any) => handleChange(value)}
                    className="bg-white"
                />
            </div>
        </div>
    )
}

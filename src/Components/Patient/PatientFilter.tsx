import React  from 'react';
import { DISEASE_STATUS } from "../../Common/constants";
import { SelectField } from "../Common/HelperInputFields";

const diseaseStatusOptions = ['Show All', ...DISEASE_STATUS];

type PatientFilterProps = { filter: (value: string) => void ,value : string }

export const PatientFilter = (props: PatientFilterProps) => {

    const { filter, value = 'Show All' } = props; 
    
    const handleChange = (event: any) => { 
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
                    value={value}
                    options={diseaseStatusOptions}
                    onChange={(value: any) => handleChange(value)}
                    className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
                />
            </div>
        </div>
    )
}

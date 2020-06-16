import { TextFieldProps } from '@material-ui/core';
import Grid from "@material-ui/core/Grid";
import { makeStyles } from '@material-ui/core/styles';
import React, { useState } from 'react';
import { DISEASE_STATUS } from "../../Common/constants";
import { SelectField } from "../Common/HelperInputFields";

const useStyles = makeStyles(theme => ({
    searchboxInput: {
        background: "#ffffff"
    },
    searchboxSticky: {
        width: "100%",
        position: "sticky",
        zIndex: 1,
        top: "0px",
        background: "#edf2f7",
    }
}));

const diseaseStatusOptions = ['Show All', ...DISEASE_STATUS];

type PatientFilterProps = { filter: (value: string) => void }

export const PatientFilter = (props: PatientFilterProps) => {
    const classes = useStyles();
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

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper } from '@material-ui/core';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import { WithStyles, withStyles } from '@material-ui/styles';
import React, { useState } from 'react';
import { CheckboxField } from '../Common/HelperInputFields';
import { VirtualizedTable } from '../Common/VirtualizedTable';
import { DupPatientModel } from './models';

interface Props {
    patientList: Array<DupPatientModel>;
    handleOk: () => void;
    handleCancel: () => void;
    isNew: boolean;
};

const styles = {
    paper: {
        "max-width": "650px",
        "min-width": "400px",
    }
};

const columns = [
    {
        width: 120,
        label: 'Patient ID',
        dataKey: 'patient_id'
    },
    {
        width: 200,
        flexGrow: 1,
        label: 'Name',
        dataKey: 'name',
    },
    {
        width: 120,
        label: 'Gender',
        dataKey: 'gender',
    },
];

const DuplicatePatientDialog = (props: Props & WithStyles<typeof styles>) => {
    const { patientList, handleOk, handleCancel, classes, isNew } = props;
    const [confirm, setConfirm] = useState(false)

    const text = isNew ? 'Registration' : 'Update';

    return (
        <Dialog
            open={true}
            classes={{
                paper: classes.paper,
            }}
        >
            <DialogTitle id="test-sample-title">Possible Duplicate Entry!</DialogTitle>
            <DialogContent>
                <div className="grid gap-4 grid-cols-2">
                    <div className="col-span-2">
                        <p className="leading-relaxed">The following suspect's / patient's are having the Phone Number <span className="font-bold">{patientList[0].phone_number}</span> and DOB <span className="font-bold">{patientList[0].date_of_birth}</span>:</p>
                    </div>
                    <div className="col-span-2">
                        <Paper variant="outlined" style={{ height: 200, width: '100%' }}>
                            <VirtualizedTable
                                rowCount={patientList.length}
                                rowGetter={({ index }: any) => patientList[index]}
                                columns={columns}
                            />
                        </Paper>
                    </div>
                    <div className="col-span-2">
                        <CheckboxField
                            checked={confirm}
                            onChange={(e: any) => setConfirm(e.target.checked)}
                            name="confirm"
                            label="I confirm that I'm registering a different suspect / patient"
                        />
                    </div>
                </div>
            </DialogContent>
            <DialogActions style={{ justifyContent: "space-between" }}>
                <Button
                    color="secondary"
                    onClick={() => handleCancel()}
                >Cancel {text}</Button>
                <Button
                    onClick={() => handleOk()}
                    color="primary"
                    variant="contained"
                    disabled={!confirm}
                    startIcon={<CheckCircleOutlineIcon>save</CheckCircleOutlineIcon>}
                >Continue {text}</Button>
            </DialogActions>
        </Dialog>
    );
};

export default withStyles(styles)(DuplicatePatientDialog);

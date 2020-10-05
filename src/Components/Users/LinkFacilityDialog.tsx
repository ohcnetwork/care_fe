import { Button, Dialog, DialogActions, DialogContent, DialogTitle, withStyles, WithStyles } from '@material-ui/core';
import React, { useState } from 'react';
import { FacilitySelect } from '../Common/FacilitySelect';
import { FacilityModel } from '../Facility/models';


interface Props {
    username: string;
    handleOk: (username: string, facility: FacilityModel | FacilityModel[] | null) => void;
    handleCancel: () => void;
};

const styles = {
    paper: {
        "max-width": "600px",
        "min-width": "400px",
    }
};

const LinkFacilityDialog = (props: Props & WithStyles<typeof styles>) => {
    const { username, handleOk, handleCancel } = props;
    const [facility, setFacility] = useState<any>(null);;

    const okClicked = () => {
        handleOk(username, facility);
    };

    const cancelClicked = () => {
        handleCancel();
    };

    return (
        <Dialog
            open={true}
            onClose={cancelClicked}
        >
            <DialogTitle id="alert-dialog-title">Link new facility to {username}</DialogTitle>
            <DialogContent>
                <div style={{ minWidth: '400px' }}>
                    <FacilitySelect
                        multiple={false}
                        name="facility"
                        selected={facility}
                        setSelected={setFacility}
                        errors=""
                    />
                </div>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={cancelClicked}
                    color="secondary"
                >Cancel</Button>
                <Button
                    color="primary"
                    onClick={okClicked}
                    autoFocus
                >Add</Button>
            </DialogActions>
        </Dialog>
    );
};

export default withStyles(styles)(LinkFacilityDialog);
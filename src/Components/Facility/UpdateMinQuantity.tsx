import { Button, Card, CardContent, InputLabel } from "@material-ui/core";
import loadable from '@loadable/component';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import React, { useCallback, useReducer, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getItemName, updateMinQuantity } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { TextInputField } from "../Common/HelperInputFields";
const Loading = loadable( () => import("../Common/Loading"));
const PageTitle = loadable( () => import("../Common/PageTitle"));

const initForm = {
    id: "",
    quantity: "",
};
const initialState = {
    form: { ...initForm }
};

const inventoryFormReducer = (state = initialState, action: any) => {
    switch (action.type) {
        case "set_form": {
            return {
                ...state,
                form: action.form
            };
        }
        case "set_error": {
            return {
                ...state,
                errors: action.errors
            };
        }
        default:
            return state;
    }
};

const goBack = () => {
    window.history.go(-1);
};

export const UpdateMinQuantity = (props: any) => {
    const [state, dispatch] = useReducer(inventoryFormReducer, initialState);
    const { facilityId, inventoryId, itemId } = props;
    const dispatchAction: any = useDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [offset, setOffset] = useState(0);
    const [data, setData] = useState(" ");
    const [currentUnit, setCurrentUnit] = useState<any>();

    const limit = 14;

    const fetchData = useCallback(
        async (status: statusType) => {
            setIsLoading(true);
            const id = Number(itemId);
            const res = await dispatchAction(getItemName(id));
            if (!status.aborted) {
                if (res && res.data) {
                    setData(res.data.name);

                }
                setIsLoading(false);
            }
        },
        [dispatchAction, offset]
    );
    useAbortableEffect(
        (status: statusType) => {
            fetchData(status);
        },
        [fetchData]
    );
    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setIsLoading(true);
        const data: any = {
            min_quantity: Number(state.form.quantity),
            item: Number(itemId)
        };

        const res = await dispatchAction(updateMinQuantity(data, { facilityId, inventoryId }));
        setIsLoading(false);
        if (res && res.data) {
            Notification.Success({
                msg: "Minimum quantity updated successfully"
            });
        }
        goBack();

    };

    const handleChange = (e: any) => {
        let form = { ...state.form };
        form[e.target.name] = e.target.value;
        dispatch({ type: "set_form", form });
    };


    if (isLoading) {
        return <Loading />;
    }

    return (
    <div className="px-2 pb-2">
        <PageTitle title="Update Minimum Quantity " hideBack={false} />
        <div className="mt-4">
            <Card>
                <form onSubmit={e => handleSubmit(e)}>
                    <CardContent>
                        <div className="mt-2 grid gap-4 grid-cols-1 md:grid-cols-2">
                            <div >
                                <InputLabel id="inventory_name_label">Inventory Name</InputLabel>
                                <TextInputField
                                    name="id"
                                    variant="standard"
                                    margin="dense"
                                    type="string"
                                    value={data}
                                    errors=""
                                />
                            </div>

                            <div>
                                <InputLabel id="quantity">Item Min_Quantity</InputLabel>
                                <TextInputField
                                    name="quantity"
                                    variant="outlined"
                                    margin="dense"
                                    type="number"
                                    value={state.form.quantity}
                                    onChange={handleChange}
                                    errors=""
                                />
                            </div>
                        </div>
                        <div className="flex justify-between mt-4">
                            <Button
                                color="default"
                                variant="contained"
                                type="button"
                                onClick={goBack}
                            >Cancel</Button>
                            <Button
                                color="primary"
                                variant="contained"
                                type="submit"
                                style={{ marginLeft: "auto" }}
                                startIcon={<CheckCircleOutlineIcon></CheckCircleOutlineIcon>}
                                onClick={e => handleSubmit(e)}
                            >SET </Button>
                        </div>
                    </CardContent>
                </form>
            </Card>
        </div>
    </div>);
};

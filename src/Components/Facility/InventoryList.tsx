import React, { useState, useCallback } from 'react'
import PageTitle from '../Common/PageTitle'
import { Button } from "@material-ui/core";
import { navigate } from "hookrouter";
import { useDispatch } from "react-redux";
import { Loading } from "../Common/Loading";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getInventorySummary } from '../../Redux/actions';
import Pagination from "../Common/Pagination";


export default function InventoryList(props: any) {

    const { facilityId }: any = props;
    const dispatchAction: any = useDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const initialInventory: any[] = [];
    let inventoryItem: any = null;
    const [inventory, setInventory] = useState(initialInventory);
    const [offset, setOffset] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const limit = 14;

    const fetchData = useCallback(
        async (status: statusType) => {
            setIsLoading(true);
            const res = await dispatchAction(getInventorySummary(facilityId, { limit, offset }));
            if (!status.aborted) {
                if (res && res.data) {
                    setInventory(res.data.results);
                    setTotalCount(res.data.count);
                }
                setIsLoading(false);
            }
        },
        [dispatchAction, offset, facilityId]
    );

    useAbortableEffect(
        (status: statusType) => {
            fetchData(status);
        },
        [fetchData]
    );

    const handlePagination = (page: number, limit: number) => {
        const offset = (page - 1) * limit;
        setCurrentPage(page);
        setOffset(offset);
    };

    let inventoryList: any = [];
    if (inventory && inventory.length) {
        inventoryList = inventory.map((inventoryItem: any) => (
            <tr key={inventoryItem.id} className={`${inventoryItem.is_low ? "bg-red-100 hover:bg-gray-200" : "bg-white hover:bg-gray-200"}`} onClick={() => navigate(`/facility/${facilityId}/inventory/${inventoryItem.item_object?.id}`)}>
                <td className="px-5 py-5 border-b border-gray-200 text-sm ">
                    <div className="flex items-center">
                        <div className="ml-3">
                            <p className="text-gray-900 whitespace-no-wrap">
                                {inventoryItem.item_object?.name}
                                {
                                    inventoryItem.is_low &&
                                    <span className="ml-2 badge badge badge-danger">Low Stock</span>
                                }
                            </p>
                        </div>
                    </div>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 text-sm ">
                    <p className="text-gray-900 whitespace-no-wrap lowercase">
                        {inventoryItem.quantity} {inventoryItem.item_object?.default_unit?.name}
                    </p>
                </td>
            </tr>

        ));
    } else if (inventory && inventory.length === 0) {
        inventoryList = (
            <tr className="bg-white">
                <td colSpan={3} className="px-5 py-5 border-b border-gray-200 text-center">
                    <p className="text-gray-500 whitespace-no-wrap">
                        No inventory available
                    </p>
                </td>
            </tr>
        );
    }

    if (isLoading || !inventory) {
        inventoryItem = <Loading />;
    } else if (inventory) {
        inventoryItem = (
            <>
                <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 py-4 overflow-x-auto">
                    <div className="inline-block min-w-full">
                        <table className="min-w-full leading-normal shadow rounded-lg overflow-hidden">
                            <thead>
                                <tr>
                                    <th
                                        className="px-5 py-3 border-b-2 border-gray-200 bg-green-400 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th
                                        className="px-5 py-3 border-b-2 border-gray-200 bg-green-400 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                        Stock
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventoryList}
                            </tbody>
                        </table>
                    </div>
                </div>
                {totalCount > limit && (
                    <div className="mt-4 flex w-full justify-center">
                        <Pagination
                            cPage={currentPage}
                            defaultPerPage={limit}
                            data={{ totalCount }}
                            onChange={handlePagination}
                        />
                    </div>
                )}
            </>
        );
    }

    return (
        <div>
            <PageTitle title="Inventory Summary" hideBack={false} />
            <div className="container mx-auto px-4 sm:px-8">
                <div className="py-4 md:py-8">
                    <div className="flex flex-col md:flex-row items-center">
                        <div className="mt-2">
                            <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={() => navigate(`/facility/${facilityId}/inventory/add`)}
                            >
                                Add Inventory
                    </Button>
                        </div>
                        <div className="mt-2">
                            <Button
                                className="ml-2"
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={() => navigate(`/facility/${facilityId}/inventory/min_quantity/list`)}>
                                Minimum Quantity Required
                    </Button>
                        </div>
                    </div>
                    {inventoryItem}
                </div>
            </div>
        </div>
    )
}

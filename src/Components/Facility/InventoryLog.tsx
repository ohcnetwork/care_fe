import React, { useState, useCallback } from 'react'
import PageTitle from '../Common/PageTitle'
import { Button } from "@material-ui/core";
import { Loading } from "../Common/Loading";
import { navigate } from "hookrouter";
import { useDispatch } from "react-redux";
import { getInventoryLog } from '../../Redux/actions';
import { statusType, useAbortableEffect } from "../../Common/utils";
import Pagination from "../Common/Pagination";
import { FacilityCreate } from './FacilityCreate';
import moment from "moment";

export default function InventoryLog(props: any) {

    const { facilityId, inventoryId }: any = props;
    console.log(facilityId);
    console.log(inventoryId);


    const dispatchAction: any = useDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const initialInventory: any[] = [];
    let inventoryItem: any = null;
    const [inventory, setInventory] = useState(initialInventory);
    const [offset, setOffset] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const limit = 14;
    const item = inventoryId;

    const fetchData = useCallback(
        async (status: statusType) => {
            setIsLoading(true);
            const res = await dispatchAction(getInventoryLog(facilityId, { item, limit, offset }));
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

    // const onSearchSuspects = async (searchValue: string) => {
    //     setIsLoading(true);
    //     const res = await dispatchAction(getFacilities({ limit, offset, search_text: searchValue }));
    //     if (res && res.data) {
    //       setData(res.data.results);
    //       setTotalCount(res.data.count);
    //     }
    //     setIsLoading(false);
    // }

    let inventoryList: any = [];
    if (inventory && inventory.length) {
        inventoryList = inventory.map((inventoryItem: any) => (
            <tr key={inventoryItem.id} className="bg-white" onClick={() => navigate(`/facility/${facilityId}/inventory/${inventoryItem.id}`)}>
                <td className="px-5 py-5 border-b border-gray-200 text-sm hover:bg-gray-100">
                    <div className="flex items-center">
                        <div className="ml-3">
                            <p className="text-gray-900 whitespace-no-wrap">
                                {moment(inventoryItem.created_date).format("DD-MM-YYYY hh:mm:ss")}
                                {/* {new Date(inventoryItem.created_date).getDate()}-{new Date(inventoryItem.created_date).getMonth()}-{new Date(inventoryItem.created_date).getFullYear()} */}
                            </p>
                        </div>
                    </div>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 text-sm hover:bg-gray-100">
                    <p className="text-gray-900 whitespace-no-wrap lowercase">
                        {inventoryItem.quantity} {inventoryItem.item_object?.default_unit?.name}
                    </p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 text-sm hover:bg-gray-100">
                    <p className="text-gray-900 whitespace-no-wrap lowercase">
                        {inventoryItem.is_incoming ? <span className="ml-2 text-green-600">Incoming</span> : <span className="ml-2 text-red-600">Outgoing</span>}
                    </p>
                </td>
            </tr>

        ));
    } else if (inventory && inventory.length === 0) {
        inventoryList = (
            <tr className="bg-white">
                <td colSpan={3} className="px-5 py-5 border-b border-gray-200 text-center">
                    <p className="text-gray-500 whitespace-no-wrap">
                        No log for this inventory available
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
                                        Created On
                                    </th>
                                    <th
                                        className="px-5 py-3 border-b-2 border-gray-200 bg-green-400 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                        Quantity
                                    </th>
                                    <th
                                        className="px-5 py-3 border-b-2 border-gray-200 bg-green-400 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                        Status
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
            <PageTitle title="Inventory Log" hideBack={false} />
            <div className="container mx-auto px-4 sm:px-8">
                <div className="py-8">

                    {inventoryItem}
                </div>
            </div>
        </div>
    )
}
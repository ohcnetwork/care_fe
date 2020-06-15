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

    const { facilityId } = props;

    // interface InventoryProps {
    //     name: string;
    //     description: string;
    //     stock: number;
    //     minStock: number;
    // }
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
                    console.log(res.data.results);
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
            <tr key={inventoryItem.id}>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <div className="flex items-center">
                        <div className="ml-3">
                            <p className="text-gray-900 whitespace-no-wrap">
                                {inventoryItem.item_object?.name}
                            </p>
                        </div>
                    </div>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">
                        {inventoryItem.item_object?.stock}
                    </p>
                </td>
            </tr>

        ));
    } else if (inventory && inventory.length === 0) {
        inventoryList = (
            <tr>
                <td colSpan={3} className="text-center px-5 py-5 border-b border-gray-200 bg-white">
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
                                    <th
                                        className="px-5 py-3 border-b-2 border-gray-200 bg-green-400 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                        {" "}
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
        <PageTitle title="Inventory" hideBack={true} />
        <div className="container mx-auto px-4 sm:px-8">
            <div className="py-8">
                <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    // onClick={() => navigate(`/facility/${facilityId}/inventory/add`)}
                    onClick={() => navigate(`/facility/inventory/add`)}

                  >
                    Add Inventory
                  </Button>
                <div className="my-2 flex sm:flex-row flex-col">
                    <div className="flex flex-row mb-1 sm:mb-0">
                        <div className="relative">
                            <select
                                className="appearance-none h-full rounded-l border block appearance-none w-full bg-white border-gray-400 text-gray-700 py-2 px-4 pr-8 leading-tight focus:outline-none focus:bg-white focus:border-gray-500">
                                <option>5</option>
                                <option>10</option>
                                <option>20</option>
                            </select>
                            <div
                                className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                </svg>
                            </div>
                        </div>
                        <div className="relative">
                            <select
                                className="appearance-none h-full rounded-r border-t sm:rounded-r-none sm:border-r-0 border-r border-b block appearance-none w-full bg-white border-gray-400 text-gray-700 py-2 px-4 pr-8 leading-tight focus:outline-none focus:border-l focus:border-r focus:bg-white focus:border-gray-500">
                                <option>All</option>
                                <option>Active</option>
                                <option>Inactive</option>
                            </select>
                            <div
                                className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="block relative">
                        <span className="h-full absolute inset-y-0 left-0 flex items-center pl-2">
                            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-gray-500">
                                <path
                                    d="M10 4a6 6 0 100 12 6 6 0 000-12zm-8 6a8 8 0 1114.32 4.906l5.387 5.387a1 1 0 01-1.414 1.414l-5.387-5.387A8 8 0 012 10z">
                                </path>
                            </svg>
                        </span>
                        <input placeholder="Search"
                            className="appearance-none rounded-r rounded-l sm:rounded-l-none border border-gray-400 border-b block pl-8 pr-6 py-2 w-full bg-white text-sm placeholder-gray-400 text-gray-700 focus:bg-white focus:placeholder-gray-600 focus:text-gray-700 focus:outline-none" />
                    </div>
                </div>
                {inventoryItem}
            </div>
        </div>
        </div>
    )
}
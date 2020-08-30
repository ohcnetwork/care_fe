import React, { useState, useEffect } from 'react';
import { useAbortableEffect, statusType } from '../../Common/utils';

interface PaginationProps {
    data: { totalCount: number };
    onChange: (page: number, rowsPerPage: number) => void;
    defaultPerPage: number;
    cPage: number;

};
const Pagination = (props: PaginationProps) => {
    const { data, onChange } = props;
    const [rowsPerPage, setRowsPerPage] = useState(3);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const overflowDiv = document.querySelector("#pages");
        if (overflowDiv) {
            overflowDiv.scrollTo(0, 0);
        }
    }, [currentPage]);

    useAbortableEffect((status: statusType) => {
        if (!status.aborted) {
            if (props.defaultPerPage) {
                setRowsPerPage(props.defaultPerPage);
            }
            if (props.cPage) {
                setCurrentPage(parseInt(`${props.cPage}`));
            }
        }
    }, [props]);

    const getPageNumbers = () => {
        const totalPage = Math.ceil(data.totalCount / rowsPerPage);
        const pageNumbers = [];

        if (totalPage === 0) {
            return [1];
        }

        if (currentPage === 1 && currentPage === totalPage) {
            pageNumbers.push(currentPage);
        } else if (currentPage === totalPage) {
            let tempPage = currentPage;
            let pageLimit = 3;
            while (tempPage >= 1 && pageLimit > 0) {
                pageNumbers.push(tempPage);
                tempPage--;
                pageLimit--;
            }
        } else {
            pageNumbers.push(currentPage);
            if (currentPage > 1) {
                pageNumbers.push(currentPage - 1);
                if (currentPage + 1 <= totalPage) {
                    pageNumbers.push(currentPage + 1);
                }
            } else {
                pageNumbers.push(currentPage + 1);
                if (currentPage + 2 <= totalPage) {
                    pageNumbers.push(currentPage + 2);
                }
            }
        }
        return pageNumbers.sort((a, b) => a - b);
    }


    const handleChangePage = (evt: any, action: any) => {

        let newPage = 1;
        const totalPage = Math.ceil(data.totalCount / rowsPerPage);

        switch (action) {
            case 'prev':
                newPage = currentPage - 1;
                break;

            case 'next':
                newPage = currentPage + 1;
                break;

            case 'last':
                newPage = totalPage;
                break;

            default:
                break;
        }

        setCurrentPage(newPage);
        onChange(newPage, rowsPerPage);
    }

    const goToPage = (e: any, page: any) => {
        setCurrentPage(page);
        onChange(page, rowsPerPage);
    }

    const renderNavigationBtn = (label: any, disabled: any, classes: string) => {
        return (
            <button
                disabled={disabled}
                onClick={e => (handleChangePage(e, label.toLowerCase()))}
                className={`${classes} -ml-px relative bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-200 inline-flex items-center px-4 py-2 border border-gray-300 text-sm leading-5 font-medium focus:z-10 focus:outline-none focus:border-green-300 focus:shadow-outline-green transition ease-in-out duration-150  ${!disabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                {label}
            </button>
        );
    }

    const totalCount = data.totalCount;
    if (!totalCount) {
        return null;
    }
    const totalPage = Math.ceil(totalCount / rowsPerPage);
    const pageNumbers = getPageNumbers();
    const firstBtnDisable = currentPage === 1;
    const prevBtnDisable = currentPage - 1 <= 0;
    const nextBtnDisable = currentPage + 1 >= totalPage;
    const lastBtnDisable = totalPage === 0 || currentPage === totalPage;

    return (

        <div className="mx-auto mb-4">
            <div className="flex-1 flex justify-between sm:hidden">
                <a onClick={e => (handleChangePage(e, 'prev'))} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:shadow-outline-green focus:border-green-300 active:bg-gray-100 active:text-gray-700 transition ease-in-out duration-150">
                    Previous
                    </a>
                <a onClick={e => (handleChangePage(e, 'next'))} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:shadow-outline-green focus:border-green-300 active:bg-gray-100 active:text-gray-700 transition ease-in-out duration-150">
                    Next
                    </a>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <nav className="relative z-0 inline-flex shadow-sm">
                        {renderNavigationBtn('First', firstBtnDisable, "rounded-l-md")}
                        {renderNavigationBtn('Prev', prevBtnDisable, "")}
                        {pageNumbers.map(pageNo => (
                            <button type="button"

                                key={`page_${pageNo}`}
                                className={`-ml-px relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm leading-5 font-medium focus:z-10 focus:outline-none focus:border-green-300 focus:shadow-outline-green transition ease-in-out duration-150 ${currentPage === pageNo ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-200'}`}
                                onClick={e => goToPage(e, pageNo)}
                            >
                                {pageNo}
                            </button>
                        ))}
                        {renderNavigationBtn('Next', nextBtnDisable, "")}
                        {renderNavigationBtn('Last', lastBtnDisable, "rounded-r-md")}
                    </nav>
                </div>
            </div>
        </div>
    );
}

export default Pagination;

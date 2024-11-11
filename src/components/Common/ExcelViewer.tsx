import { ReactNode, useEffect, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2, { Cancel, Submit } from "@/components/Common/ButtonV2";
import DialogModal from "@/components/Common/Dialog";
import Pagination from "@/components/Common/Pagination";

import { ParsedData } from "@/common/schemaParser";

type FilePreviewProps = {
  title?: ReactNode;
  description?: ReactNode;
  show: boolean;
  onClose: () => void;
  selectedFile: { name: string };
  fileData?: any[];
  downloadURL?: string;
  className?: string;
  errors?: { index: number; key: string; error: string }[];
  handleSubmit: (data: ParsedData[]) => void;
  showCheckbox?: boolean;
  parsedData: ParsedData[];
};

const ExcelViewer = ({
  title = "File Preview",
  description,
  show,
  onClose,
  className,
  selectedFile,
  fileData,
  downloadURL,
  showCheckbox = true,
  handleSubmit,
  parsedData,
  errors = [],
}: FilePreviewProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRowsData, setSelectedRowsData] = useState<any[]>([]);

  const initialSelectedRows = fileData
    ? (fileData
        .map((_, i) => i)
        .filter((i) => !errors.some((err) => err.index === i)) ?? [])
    : [];

  const [selectedRows, setSelectedRows] =
    useState<number[]>(initialSelectedRows);

  const handleClose = () => {
    onClose?.();
  };

  useEffect(() => {
    setSelectedRowsData(selectedRows.map((rowIndex) => parsedData[rowIndex]));
  }, [selectedRows]);

  return (
    <DialogModal
      fixedWidth={false}
      className={`z-10 h-full w-full max-w-5xl flex-col gap-4 rounded-lg bg-white p-4 shadow-xl md:p-6 ${className}`}
      onClose={() => {
        handleClose();
      }}
      title={title}
      description={description}
      show={show}
    >
      <>
        <div className="mb-2 flex flex-col items-center justify-between md:flex-row">
          <p className="text-md font-semibold text-secondary-700">
            {selectedFile.name}
          </p>
          <div className="flex gap-4">
            {downloadURL && downloadURL.length > 0 && (
              <ButtonV2>
                <a
                  href={downloadURL}
                  className="text-white"
                  download={selectedFile.name}
                >
                  <CareIcon icon="l-file-download" className="h-4 w-4" />
                  <span>Download</span>
                </a>
              </ButtonV2>
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <div className="flex w-full justify-center overflow-scroll rounded-lg border border-secondary-200">
            {fileData && fileData[0] ? (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse rounded-lg border border-secondary-300 bg-white shadow-md">
                  <thead className="sticky top-0 bg-secondary-100">
                    <tr>
                      {showCheckbox && (
                        <th className="w-5 px-4 py-2">
                          <input
                            type="checkbox"
                            checked={selectedRows.length === fileData.length}
                            disabled={errors.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRows(fileData.map((_, i) => i));
                              } else {
                                setSelectedRows([]);
                              }
                            }}
                          />
                        </th>
                      )}
                      {Object.keys(fileData[0]).map((key) => (
                        <th
                          key={key}
                          className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap border-b px-4 py-2"
                          title={key}
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fileData
                      .slice(
                        (currentPage - 1) * rowsPerPage,
                        (currentPage - 1) * rowsPerPage + rowsPerPage,
                      )
                      .map((row, rowIndex) => {
                        const currentRowIndex =
                          rowIndex + (currentPage - 1) * rowsPerPage;
                        return (
                          <tr
                            key={currentRowIndex}
                            className={` ${rowIndex % 2 === 0 ? "bg-secondary-50" : "bg-white"} `}
                          >
                            {showCheckbox && (
                              <td className="w-5 px-4">
                                {errors.some(
                                  (err) => err.index === currentRowIndex,
                                ) ? (
                                  <span
                                    title={`Error in column(s) ${errors
                                      .filter(
                                        (err) => err.index === currentRowIndex,
                                      )
                                      .map((err) => err.key)
                                      .join(", ")}
                                      `}
                                  >
                                    <CareIcon
                                      icon="l-exclamation-triangle"
                                      className="text-lg text-danger-500"
                                    />
                                  </span>
                                ) : (
                                  <input
                                    type="checkbox"
                                    checked={selectedRows.includes(
                                      currentRowIndex,
                                    )}
                                    disabled={errors.some(
                                      (err) => err.index === currentRowIndex,
                                    )}
                                    onChange={() => {
                                      if (
                                        selectedRows.includes(currentRowIndex)
                                      ) {
                                        setSelectedRows(
                                          selectedRows.filter(
                                            (i) => i !== currentRowIndex,
                                          ),
                                        );
                                      } else {
                                        setSelectedRows([
                                          ...selectedRows,
                                          currentRowIndex,
                                        ]);
                                      }
                                    }}
                                    className="disabled:bg-danger-500"
                                  />
                                )}
                              </td>
                            )}
                            {Object.entries(row).map(
                              ([key, value]: [string, any], colIndex) => {
                                const error = errors.find(
                                  (err) =>
                                    err.index === currentRowIndex &&
                                    err.key == key,
                                );

                                return (
                                  <>
                                    <td
                                      key={colIndex}
                                      className={`max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap border px-4 py-2 ${!!error && "text-red-500"} `}
                                      title={
                                        error ? error.error : String(value)
                                      }
                                    >
                                      {String(value)}
                                    </td>
                                  </>
                                );
                              },
                            )}
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-secondary-500">No data found</div>
            )}
          </div>
          {fileData && fileData.length > 5 && (
            <div className="flex w-full flex-wrap items-center justify-between">
              <p className="my-6 text-secondary-600 md:w-auto">
                Showing {currentPage * rowsPerPage - rowsPerPage + 1} to{" "}
                {currentPage * rowsPerPage > fileData.length
                  ? fileData.length
                  : currentPage * rowsPerPage}{" "}
                of {fileData.length} entries
              </p>
              {rowsPerPage < fileData.length && (
                <Pagination
                  cPage={currentPage}
                  defaultPerPage={rowsPerPage}
                  data={{ totalCount: fileData.length }}
                  onChange={(page, rowsPerPage) => {
                    setCurrentPage(page);
                    setRowsPerPage(rowsPerPage);
                  }}
                />
              )}
              <select
                className="my-4 ml-2 h-9 w-[4.5rem] rounded-md border border-primary-400 py-0 pl-2 pr-4 text-secondary-600"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(+e.target.value);
                }}
              >
                {fileData && fileData.length > 0 && (
                  <>
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    {fileData.length > 50 && <option value="50">50</option>}
                    {fileData.length > 100 && <option value="100">100</option>}
                  </>
                )}
              </select>
            </div>
          )}
        </div>
      </>
      <div className="flex flex-wrap-reverse justify-end gap-5">
        <Cancel onClick={onClose} label="Close" />
        <Submit
          onClick={() => {
            handleSubmit(selectedRowsData);
            handleClose();
          }}
          disabled={selectedRows.length === 0}
          data-testid="import-btn"
        >
          <CareIcon icon="l-file-import" className="text-lg" />
          <span>Import {selectedRows.length} selected fields</span>
        </Submit>
      </div>
    </DialogModal>
  );
};

export default ExcelViewer;

import loadable from "@loadable/component";
import { navigate } from "raviger";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  externalResultUploadCsv,
  getAllLocalBodyByDistrict,
} from "../../Redux/actions";
import CSVReader from "react-csv-reader";
import {
  MultilineInputField,
  PhoneNumberField,
  SelectField,
  TextInputField,
} from "../Common/HelperInputFields";
import { ExternalResultLocalbodySelector } from "./ExternalResultLocalbodySelector";
import StateManager from "react-select";
import _ from "lodash";
const get = require("lodash.get");
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

export default function ExternalResultUpload() {
  const dispatch: any = useDispatch();
  const [uploadFile, setUploadFile] = useState("");
  // for disabling save button once clicked
  const [loading, setLoading] = useState(false);
  const [csvData, setCsvData] = useState(new Array<any>());
  const [errors, setErrors] = useState<any>([]);
  const initalState = { loading: false, lsgs: new Array<any>() };
  const [state, setState] = useState(initalState);
  const handleForce = (data: any, fileInfo: any) => {
    setCsvData(data);
  };

  // const fetchLSG = useCallback(
  //   async (status: statusType) => {
  //     setState({ ...state, loading: true });
  //     let id = 7
  //     const res = await dispatch(getAllLocalBodyByDistrict({ id }));
  //     if (!status.aborted) {
  //       if (res && res.data) {
  //         setState({ loading: false, lsgs: res.data.results });
  //       }
  //     }
  //   },
  //   [dispatch]
  // );

  // useAbortableEffect((status: statusType) => {
  //   fetchLSG(status);
  // }, []);

  const papaparseOptions = {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    transformHeader: (header: string) =>
      header.toLowerCase().replace(/\W/g, "_"),
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setLoading(true);
    const valid = true;
    const data = {
      sample_tests: csvData,
    };

    if (valid) {
      setErrors([]);
      dispatch(externalResultUploadCsv(data)).then((resp: any) => {
        if (resp && resp.status === 202) {
          navigate("/external_results");
        } else {
          setErrors(resp.data.map((err: any) => Object.entries(err)));
        }
        setLoading(false);
      });
    }
  };

  return (
    <div className="px-6">
      <PageTitle
        title="Upload External Results"
        backUrl="/external_results"
        className="mt-4"
      />
      <div className="max-w-3xl mx-auto mt-6">
        <div className="p-4 ">
          <div className="block text-sm leading-5 font-medium text-gray-700 sm:mt-px sm:pt-2">
            <div className="mt-2 sm:mt-0 sm:col-span-2 my-2">
              <div className="mx-auto max-w-lg flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="text-center">
                  <CSVReader
                    cssLabelClass="block text-sm leading-5 font-medium text-gray-700 pb-4 px-4"
                    cssClass="react-csv-input"
                    label="Select a CSV file in the specified format"
                    onFileLoaded={handleForce}
                    parserOptions={papaparseOptions}
                  />
                  <a
                    className="mt-4 ml-2 md:ml-0 inline-flex items-center px-3 py-2 border border-primary-500 text-sm leading-4 font-medium rounded-md text-primary-700 bg-white hover:text-primary-500 focus:outline-none focus:border-primary-300 focus:ring-blue active:text-primary-800 active:bg-gray-50 transition ease-in-out duration-150 hover:shadow"
                    href="https://docs.google.com/spreadsheets/d/17VfgryA6OYSYgtQZeXU9mp7kNvLySeEawvnLBO_1nuE/export?format=csv&id=17VfgryA6OYSYgtQZeXU9mp7kNvLySeEawvnLBO_1nuE"
                  >
                    <i className="fa fa-download mr-1" aria-hidden="true"></i>{" "}
                    <span>Sample Format</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className=" bg-white rounded shadow">
            {csvData.map((data: any, index: number) => {
              return (
                <div key={index} className="p-2 border-b flex">
                  <div className="p-2 mr-2">{index + 1}</div>
                  <div className="p-2 mr-2 md:w-1/3">{data.name}</div>

                  <div className="p-2 mr-2">
                    {errors && errors.length !== 0
                      ? errors.map((error: any) => {
                          return (
                            <div key={error[0][0]}>
                              {_.startCase(_.camelCase(error[0][0]))} -{" "}
                              {error[0][1]}
                            </div>
                          );
                        })
                      : null}
                  </div>
                  {/* <div>
                      {
                        !state.loading && <ExternalResultLocalbodySelector lsgs={state.lsgs} />
                      }
                    </div> */}
                </div>
              );
            })}
          </div>
          <div className=""></div>
          <div className="mt-2">
            <button
              disabled={loading}
              className="block btn btn-primary mx-auto"
              onClick={handleSubmit}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import _ from "lodash";
import { navigate } from "raviger";
import { lazy, useState } from "react";
import CSVReader from "react-csv-reader";
import { useDispatch } from "react-redux";
import useConfig from "../../Common/hooks/useConfig";
import { externalResultUploadCsv } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
const PageTitle = lazy(() => import("../Common/PageTitle"));
import { useTranslation } from "react-i18next";

export default function ExternalResultUpload() {
  const { sample_format_external_result_import } = useConfig();
  const dispatch: any = useDispatch();
  // for disabling save button once clicked
  const [loading, setLoading] = useState(false);
  const [csvData, setCsvData] = useState(new Array<any>());
  const [errors, setErrors] = useState<any>([]);
  const handleForce = (data: any) => {
    setCsvData(data);
  };
  const { t } = useTranslation();

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
    if (csvData.length !== 0) {
      const data = {
        sample_tests: csvData,
      };

      if (valid) {
        setErrors([]);
        dispatch(externalResultUploadCsv(data)).then((resp: any) => {
          if (resp && resp.status === 202) {
            setLoading(false);
            navigate("/external_results");
          } else {
            setErrors(resp.data.map((err: any) => Object.entries(err)));
            setLoading(false);
          }
        });
      } else {
        setLoading(false);
      }
    } else {
      Notification.Error({
        msg: t("please_upload_a_csv_file"),
      });
      setLoading(false);
    }
  };

  return (
    <div className="px-4">
      <PageTitle
        title={t("upload_external_results")}
        backUrl="/external_results"
        className="mt-4"
      />
      <div className="mx-auto mt-6 max-w-3xl">
        <div className="py-4">
          <div className="block text-sm font-medium leading-5 text-gray-700 sm:mt-px sm:pt-2">
            <div className="my-2 sm:col-span-2 sm:mt-0">
              <div className="mx-auto flex max-w-lg flex-col justify-center rounded-md border-2 border-dashed border-gray-300 pb-6 pt-5 text-center">
                <span className="flex justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mb-2 h-12 w-12 text-gray-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </span>
                <CSVReader
                  inputId="result-upload"
                  cssLabelClass="mx-auto text-sm leading-5 font-medium text-gray-700"
                  cssClass="flex flex-col react-csv-input"
                  cssInputClass="csv-input"
                  label={t("csv_file_in_the_specified_format")}
                  onFileLoaded={handleForce}
                  parserOptions={papaparseOptions}
                />
                <a
                  className="focus:ring-blue mx-auto mt-4 max-w-xs items-center rounded-md border border-primary-500 bg-white px-3 py-2 text-sm font-medium leading-4 text-primary-700 transition duration-150 ease-in-out hover:text-primary-500 hover:shadow focus:border-primary-300 focus:outline-none active:bg-gray-50 active:text-primary-800"
                  href={sample_format_external_result_import}
                >
                  <i className="fa fa-download mr-1" aria-hidden="true"></i>{" "}
                  <span>{t("sample_format")}</span>
                </a>
              </div>
            </div>
          </div>
          <div className=" rounded bg-white shadow">
            {csvData.map((data: any, index: number) => {
              return (
                <div key={data.name} className="flex border-b p-2">
                  <div className="mr-2 p-2">{index + 1}</div>
                  <div className="mr-2 p-2 md:w-1/3">{data.name}</div>

                  <div className="mr-2 p-2">
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
                </div>
              );
            })}
          </div>
          <div className=""></div>
          <div className="mt-2 text-center">
            <button
              disabled={loading}
              className="btn btn-primary mx-auto block"
              onClick={handleSubmit}
            >
              {t("save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

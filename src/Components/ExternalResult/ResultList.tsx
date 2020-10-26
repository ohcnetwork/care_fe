import loadable from '@loadable/component';
import Grid from "@material-ui/core/Grid";
import { navigate, useQueryParams } from 'raviger';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import moment from 'moment';
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { externalResultList } from "../../Redux/actions";
import { PhoneNumberField } from '../Common/HelperInputFields';
import Pagination from "../Common/Pagination";
import { InputSearchBox } from "../Common/SearchBox";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

function Badge(props: { color: string, icon: string, text: string }) {
  return (
    <span className="m-1 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium leading-4 bg-gray-100 text-gray-700" title={props.text}>
      <i className={"mr-2 text-md text-" + props.color + "-500 fas fa-" + props.icon}></i>
      {props.text}
    </span>
  )
}


const RESULT_LIMIT = 30;


export default function ResultList() {
  const dispatch: any = useDispatch();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [DownloadFile, setDownloadFile] = useState("");
  const [qParams, setQueryParams] = useQueryParams();

  let manageResults: any = null;

  useEffect(() => {
    setIsLoading(true);
    const params = {
      page: qParams.page || 1,
      name: qParams.name || undefined,
      phone_number: qParams.phone_number ? parsePhoneNumberFromString(qParams.phone_number)?.format('E.164') : undefined,
      offset: (qParams.page ? qParams.page - 1 : 0) * RESULT_LIMIT
    };

    dispatch(externalResultList(params, 'externalResultList'))
      .then((res: any) => {
        if (res && res.data) {
          setData(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      })
  }, [dispatch, qParams.name, qParams.page, qParams.phone_number]);

  const updateQuery = (params: any) => {
    const nParams = Object.assign({}, qParams, params);
    setQueryParams(nParams, true);
  }

  const handlePagination = (page: number, limit: number) => {
    updateQuery({ page, limit });
  };

  const searchByName = (value: string) => {
    updateQuery({ name: value, page: 1 });
  }

  const searchByPhone = (value: string) => {
    updateQuery({ phone_number: value, page: 1 });
  }

  const handleFilter = (value: string) => {
    updateQuery({ disease_status: value, page: 1 });
  }

  let resultList: any[] = [];
  if (data && data.length) {
    resultList = data.map((result: any, idx: number) => {
      const resultUrl = `/external_results/${result.id}`;
      return (
        <tr key={`usr_${result.id}`} onClick={() => navigate(resultUrl)} className="bg-white">
          <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-cool-gray-900">
            <div className="flex">
              <a href="#" className="group inline-flex space-x-2 text-sm leading-5">

                <p className="text-cool-gray-500 group-hover:text-cool-gray-900 transition ease-in-out duration-150">
                  {result.name} - {result.age} {result.age_in}
                </p>
              </a>
            </div>
          </td>
          <td className="px-6 py-4 text-left whitespace-no-wrap text-sm leading-5 text-cool-gray-500">
            <span className="text-cool-gray-900 font-medium">{result.test_type}</span>
          </td>
          <td className="px-6 py-4 text-left whitespace-no-wrap text-sm leading-5 text-cool-gray-500">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium leading-4 bg-blue-100 text-blue-800 capitalize">
              {result.result}
            </span>
          </td>
          <td className="px-6 py-4 text-left whitespace-no-wrap text-sm leading-5 text-cool-gray-500">
            {result.result_date || "-"}
          </td>
        </tr >
      );
    });
  }

  if (isLoading || !data) {
    manageResults = (
      <tr className="bg-white">
        <td colSpan={4}>
          <Loading />
        </td>
      </tr>);
  } else if (data && data.length) {
    manageResults = (
      <>
        {resultList}
        {totalCount > RESULT_LIMIT && (
          <div className="mt-4 flex w-full justify-center">
            <Pagination
              cPage={qParams.page}
              defaultPerPage={RESULT_LIMIT}
              data={{ totalCount }}
              onChange={handlePagination}
            />
          </div>
        )}
      </>
    );
  } else if (data && data.length === 0) {
    manageResults = (
      <Grid item xs={12} md={12}>
        <Grid container justify="center" alignItems="center">
          <h5> No Results Found</h5>
        </Grid>
      </Grid>
    );
  }

  return (
    <div className="px-6">
      <PageTitle
        title="Results"
        hideBack={true}
        className="mt-4" />
      <div className="mt-5 md:grid grid-cols-1 gap-5 sm:grid-cols-3 my-4 px-2 md:px-0 relative">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm leading-5 font-medium text-gray-500 truncate">
                Total Results
              </dt>
              <dd className="mt-4 text-5xl leading-9 font-semibold text-gray-900">
                {totalCount}
              </dd>
            </dl>
          </div>
        </div>
        <div>
          <div>
            <div className="text-sm font-semibold mb-2">
              Search by Name
          </div>
            <InputSearchBox
              search={searchByName}
              value={qParams.name}
              placeholder='Search by Patient Name'
              errors=''
            />
          </div>
          <div>
            <div className="text-sm font-semibold mt-2">
              Search by number
          </div>
            <PhoneNumberField
              value={qParams.phone_number}
              onChange={searchByPhone}
              turnOffAutoFormat={true}
              errors=""
            />
          </div>
        </div>
        <div className="flex flex-col justify-between">
          <div>
            {/* <div className="text-sm font-semibold">Filter by Status</div> */}
            <div className="btn btn-primary" onClick={_ => navigate('external_results/upload')}>
              Upload List
            </div>
            {/* <ResultFilter filter={handleFilter} value={qParams.disease_status} /> */}
          </div>
        </div>
      </div>
      <div className="align-middle min-w-full overflow-x-auto shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-cool-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-cool-gray-50 text-left text-xs leading-4 font-medium text-cool-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 bg-cool-gray-50 text-left text-xs leading-4 font-medium text-cool-gray-500 uppercase tracking-wider">
                Test Type
              </th>
              <th className="px-6 py-3 bg-cool-gray-50 text-left text-xs leading-4 font-medium text-cool-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="px-6 py-3 bg-cool-gray-50 text-left text-xs leading-4 font-medium text-cool-gray-500 uppercase tracking-wider">
                Result Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-cool-gray-200">
            {manageResults}
          </tbody>
        </table>
      </div>
    </div>
  );
};

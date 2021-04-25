import React, { useCallback, useEffect, useReducer } from "react";
import { useRef } from "react";
import { useDispatch } from "react-redux";
import { Group, InvestigationType } from "..";
import {
  getPatientInvestigation,
  listInvestigationGroups,
  listInvestigations,
} from "../../../../Redux/actions";
import { MultiSelectField } from "../../../Common/HelperInputFields";
import PageTitle from "../../../Common/PageTitle";
import { Button, Checkbox, TextField } from "@material-ui/core";
import Loading from "../../../Common/Loading";
import _ from "lodash";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { InputLabel, makeStyles, CircularProgress } from "@material-ui/core";
import { InvestigationResponse } from "./types";
import ReportTable from "./ReportTable";
import Pagination from "../../../Common/Pagination";
import { useQueryParams } from "raviger";

const RESULT_PER_PAGE = 15;

const useStyle = makeStyles({
  button: {
    margin: "1.5rem 0",
  },
});

interface InitialState {
  investigationGroups: Group[];
  selectedGroup: string[];
  investigations: InvestigationType[];
  selectedInvestigations: any[];
  investigtaionTableData: InvestigationResponse;
  isLoading: {
    investigationLoading: boolean;
    investigationGroupLoading: boolean;
    tableData: boolean;
  };
}

const initialState: InitialState = {
  investigationGroups: [],
  selectedGroup: [],
  investigations: [],
  selectedInvestigations: [],
  investigtaionTableData: [],
  isLoading: {
    investigationLoading: false,
    investigationGroupLoading: false,
    tableData: false,
  },
};

const investigationReportsReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case "set_investigation_groups": {
      return {
        ...state,
        investigationGroups: action.payload,
      };
    }
    case "set_selected_group": {
      return {
        ...state,
        selectedGroup: action.payload,
      };
    }
    case "set_investigations": {
      return {
        ...state,
        investigations: action.payload,
      };
    }
    case "set_selected_investigations": {
      return {
        ...state,
        selectedInvestigations: action.payload,
      };
    }
    case "set_investigtaion_table_data": {
      return {
        ...state,
        investigtaionTableData: action.payload,
      };
    }
    case "set_loading": {
      return {
        ...state,
        isLoading: action.payload,
      };
    }
    default:
      return state;
  }
};

const InvestigationReports = ({ id }: any) => {
  const className = useStyle();
  const dispatchAction: any = useDispatch();
  const [state, dispatch] = useReducer(
    investigationReportsReducer,
    initialState
  );
  const [qParams, setQueryParams] = useQueryParams();
  const {
    investigationGroups,
    investigations,
    investigtaionTableData,
    isLoading,
    selectedGroup,
    selectedInvestigations,
  } = state as InitialState;

  const fetchInvestigationsData = (page = qParams.page) => {
    dispatch({
      type: "set_loading",
      payload: { ...isLoading, tableData: true },
    });

    const pageStart = ((page || 1) - 1) * RESULT_PER_PAGE;
    const investigationsParams = (selectedInvestigations.length
      ? selectedInvestigations.map((i) => i.external_id)
      : investigations.map((i) => i.external_id)
    )
      .slice(pageStart, pageStart + RESULT_PER_PAGE)
      .join(",");

    console.log(pageStart, investigationsParams);

    dispatchAction(
      getPatientInvestigation(
        {
          investigations: investigationsParams,
        },
        id
      )
    ).then((res: any) => {
      if (res?.data?.results) {
        dispatch({
          type: "set_investigtaion_table_data",
          payload: res.data.results,
        });

        dispatch({
          type: "set_loading",
          payload: { ...isLoading, tableData: false },
        });
        document.getElementById("reports_section")?.scrollIntoView();
      }
    });
  };

  const fetchInvestigation = useCallback(async () => {
    dispatch({
      type: "set_loading",
      payload: { ...isLoading, investigationLoading: true },
    });

    const data = await Promise.all(
      selectedGroup.map((group, i) => {
        return dispatchAction(
          listInvestigations({ group: group }, `listInvestigations_${i}`)
        ).then((res: any) => res.data && res.data.results);
      })
    );

    const investigationList = _.chain(data)
      .compact()
      .flatten()
      .map((i) => ({
        ...i,
        name: `${i.groups[0].name && i.groups[0].name + "-"} ${i.name}`,
      }))
      .unionBy("external_id")
      .value();

    dispatch({ type: "set_investigations", payload: investigationList });
    dispatch({
      type: "set_loading",
      payload: { ...isLoading, investigationLoading: false },
    });
  }, [dispatchAction, isLoading, selectedGroup]);

  const fetchInvestigationGroups = useRef(() => {
    dispatch({
      type: "set_loading",
      payload: { ...isLoading, investigationLoading: false },
    });

    dispatchAction(listInvestigationGroups({})).then((res: any) => {
      if (res && res.data) {
        dispatch({
          type: "set_investigation_groups",
          payload: res.data.results,
        });
      }

      dispatch({
        type: "set_loading",
        payload: { ...isLoading, investigationGroupLoading: false },
      });
    });
  });

  const handleGroupSelect = (e: any) => {
    dispatch({ type: "set_investigations", payload: [] });
    dispatch({ type: "set_selected_investigations", payload: [] });
    dispatch({ type: "set_loading", payload: initialState.isLoading });
    dispatch({ type: "set_selected_group", payload: e.target.value });
  };

  useEffect(() => {
    fetchInvestigationGroups.current();
  }, []);

  const updateQuery = (filter: any) => {
    const nParams = Object.keys(filter).reduce(
      (a, k) =>
        filter[k] && filter[k] !== "--"
          ? Object.assign(a, { [k]: filter[k] })
          : a,
      {}
    );
    setQueryParams(nParams, true);
  };

  const handlePagination = (page: number, limit: number) => {
    updateQuery({ page });
    fetchInvestigationsData();
  };
  const handleGenerateReports = (e: any) => {
    updateQuery({ page: 1 });
    fetchInvestigationsData(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <PageTitle title={"Investigation Reports"} />
      {!isLoading.investigationGroupLoading ? (
        <>
          <div className="mt-5">
            <InputLabel required id="investigation-group-label">
              Select Investigation Groups
            </InputLabel>
            <MultiSelectField
              id="investigation-group-label"
              options={investigationGroups}
              value={selectedGroup}
              optionValue="name"
              optionKey="external_id"
              onChange={handleGroupSelect}
              placeholder="Select Groups"
            />
          </div>
          {!isLoading.investigationLoading && (
            <Button
              onClick={() => fetchInvestigation()}
              disabled={!selectedGroup.length}
              variant="contained"
              color="primary"
              className={className.button}
            >
              Get Tests
            </Button>
          )}
          {!!isLoading.investigationLoading && (
            <CircularProgress className={className.button} />
          )}
          {!!investigations.length && !isLoading.investigationLoading && (
            <>
              <div className="mt-5">
                <Autocomplete
                  multiple
                  id="investigation-group-label"
                  options={investigations}
                  value={selectedInvestigations}
                  disableCloseOnSelect
                  getOptionLabel={(option) => option.name}
                  renderOption={(option, { selected }) => (
                    <React.Fragment>
                      <Checkbox
                        style={{ marginRight: 8 }}
                        checked={selected}
                        color="primary"
                      />
                      {option.name}
                    </React.Fragment>
                  )}
                  renderInput={(params) => (
                    <>
                      <InputLabel>Select Investingations</InputLabel>
                      <TextField
                        margin="dense"
                        {...params}
                        placeholder="Select Investigation"
                      />
                    </>
                  )}
                  onChange={(_: any, options: any) => {
                    dispatch({
                      type: "set_selected_investigations",
                      payload: options,
                    });
                  }}
                />
              </div>

              <Button
                onClick={handleGenerateReports}
                disabled={!selectedGroup.length}
                variant="contained"
                color="primary"
                className={className.button}
              >
                Generate Report
              </Button>
            </>
          )}
          <section id="reports_section">
            {!!isLoading.tableData && (
              <CircularProgress className={className.button} />
            )}
            {!!investigtaionTableData.length && !isLoading.tableData && (
              <>
                <ReportTable
                  investigationData={investigtaionTableData}
                  title="Report"
                />
                <Pagination
                  cPage={qParams.page || 1}
                  data={{
                    totalCount:
                      selectedInvestigations.length || investigations.length,
                  }}
                  defaultPerPage={RESULT_PER_PAGE}
                  onChange={handlePagination}
                />
              </>
            )}
          </section>
        </>
      ) : (
        <Loading />
      )}
    </div>
  );
};

export default InvestigationReports;

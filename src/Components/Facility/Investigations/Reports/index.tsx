import React, { useCallback, useEffect, useReducer, useState } from "react";
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
import { Button, ButtonGroup, Checkbox, TextField } from "@material-ui/core";
import Loading from "../../../Common/Loading";
import _ from "lodash";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { InputLabel, makeStyles, CircularProgress } from "@material-ui/core";
import { InvestigationResponse } from "./types";
import ReportTable from "./ReportTable";

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
  const [page, setPage] = useState(1);
  const [sessionPage, setSessionPage] = useState(1);
  const [isNextSessionDisabled, setIsNextSessionDisabled] = useState(false);
  const [isLoadMoreDisabled, setIsLoadMoreDisabled] = useState(false);
  const [state, dispatch] = useReducer(
    investigationReportsReducer,
    initialState
  );

  const {
    investigationGroups,
    investigations,
    investigtaionTableData,
    isLoading,
    selectedGroup,
    selectedInvestigations,
  } = state as InitialState;

  const fetchInvestigationsData = useCallback(
    (onSuccess: Function, curPage = 1, curSessionPage = 1) => {
      dispatch({
        type: "set_loading",
        payload: { ...isLoading, tableData: true },
      });

      const pageStart = ((curPage || 1) - 1) * RESULT_PER_PAGE;
      const investigationsParams = (selectedInvestigations.length
        ? selectedInvestigations.map((i) => i.external_id)
        : investigations.map((i) => i.external_id)
      )
        .slice(pageStart, pageStart + RESULT_PER_PAGE)
        .join(",");

      dispatchAction(
        getPatientInvestigation(
          {
            investigations: investigationsParams,
            session_page: curSessionPage,
          },
          id
        )
      ).then((res: any) => {
        if (res?.data?.results) {
          onSuccess(res.data);
          setPage(curPage + 1);
          dispatch({
            type: "set_loading",
            payload: { ...isLoading, tableData: false },
          });
        }
      });
    },
    [dispatchAction, id, investigations, isLoading, selectedInvestigations]
  );

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
        name: `${i.name} ${i.groups[0].name && " | " + i.groups[0].name} `,
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
    dispatch({ type: "set_investigtaion_table_data", payload: [] });
    dispatch({ type: "set_selected_investigations", payload: [] });
    dispatch({ type: "set_loading", payload: initialState.isLoading });
    dispatch({ type: "set_selected_group", payload: e.target.value });
  };

  useEffect(() => {
    fetchInvestigationGroups.current();
  }, []);

  const handleLoadMore = (e: any) => {
    const onSuccess = (data: any) => {
      dispatch({
        type: "set_investigtaion_table_data",
        payload: [...state.investigtaionTableData, ...data.results],
      });
    };

    fetchInvestigationsData(onSuccess, page, sessionPage);
  };

  const handleGenerateReports = useCallback(
    (curSessionPage = 1) => {
      const onSuccess = (data: any) => {
        if (curSessionPage > 1 && !data.results.length) {
          setSessionPage(curSessionPage - 1);
          setIsNextSessionDisabled(true);
          setIsLoadMoreDisabled(true);
        } else {
          setIsNextSessionDisabled(false);
          setIsLoadMoreDisabled(false);
          dispatch({
            type: "set_investigtaion_table_data",
            payload: data.results,
          });
        }

        document.getElementById("reports_section")?.scrollIntoView();
      };

      fetchInvestigationsData(onSuccess, 1, curSessionPage);
    },
    [fetchInvestigationsData]
  );

  const totalPage = Math.ceil(
    (selectedInvestigations.length || investigations.length) / RESULT_PER_PAGE
  );

  const handleSessionPage = (go: "NEXT" | "PREV") => {
    const count = go === "NEXT" ? sessionPage + 1 : sessionPage - 1;
    setSessionPage(count);
    handleGenerateReports(count);
  };

  const loadMoreDisabled =
    page - 1 >= totalPage || isLoading.tableData || isLoadMoreDisabled;
  const getTestDisabled =
    !selectedGroup.length ||
    isLoading.tableData ||
    isLoading.investigationLoading ||
    isLoading.investigationGroupLoading;
  const generateReportDisabled =
    !selectedGroup.length ||
    isLoading.tableData ||
    isLoading.investigationLoading;
  const prevSessionDisabled = sessionPage <= 1 || isLoading.tableData;
  const nextSessionDisabled = isNextSessionDisabled || isLoading.tableData;

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
              disabled={getTestDisabled}
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
                      <InputLabel>
                        Select Investigations (all investigations will be
                        selected by default)
                      </InputLabel>
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
                onClick={() => {
                  setSessionPage(1);
                  handleGenerateReports(1);
                }}
                disabled={generateReportDisabled}
                variant="contained"
                color="primary"
                className={className.button}
              >
                Generate Report
              </Button>
            </>
          )}
          <section id="reports_section">
            {!!investigtaionTableData.length && (
              <>
                <ButtonGroup
                  disableElevation
                  variant="outlined"
                  color="primary"
                  className={className.button}
                >
                  <Button
                    onClick={() => handleSessionPage("PREV")}
                    disabled={prevSessionDisabled}
                  >
                    {isLoading.tableData ? "Loading..." : "Prev Sessions"}
                  </Button>
                  <Button
                    onClick={() => handleSessionPage("NEXT")}
                    disabled={nextSessionDisabled}
                  >
                    {isLoading.tableData ? "Loading..." : "Next Sessions"}
                  </Button>
                </ButtonGroup>
                <ReportTable
                  investigationData={investigtaionTableData}
                  title="Report"
                />
                {!!isLoading.tableData && (
                  <CircularProgress className={className.button} />
                )}

                {!loadMoreDisabled && (
                  <Button
                    disabled={loadMoreDisabled}
                    onClick={handleLoadMore}
                    className={className.button}
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                  >
                    Load More
                  </Button>
                )}
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

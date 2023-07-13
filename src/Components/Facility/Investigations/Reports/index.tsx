import * as Notification from "../../../../Utils/Notifications";

import { Group, InvestigationType } from "..";
import {
  getPatient,
  getPatientInvestigation,
  listInvestigationGroups,
  listInvestigations,
} from "../../../../Redux/actions";
import { useCallback, useEffect, useReducer, useState } from "react";

import AutocompleteMultiSelectFormField from "../../../Form/FormFields/AutocompleteMultiselect";
import ButtonV2 from "../../../Common/components/ButtonV2";
import CircularProgress from "../../../Common/components/CircularProgress";
import { FieldChangeEvent } from "../../../Form/FormFields/Utils";
import { InvestigationResponse } from "./types";
import Loading from "../../../Common/Loading";
import Page from "../../../Common/components/Page";
import ReportTable from "./ReportTable";
import _ from "lodash";
import { useDispatch } from "react-redux";
import { useRef } from "react";

const RESULT_PER_PAGE = 14;
interface InitialState {
  investigationGroups: Group[];
  selectedGroup: string[];
  investigations: InvestigationType[];
  selectedInvestigations: any[];
  investigationTableData: InvestigationResponse;
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
  investigationTableData: [],
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
    case "set_investigation_table_data": {
      return {
        ...state,
        investigationTableData: action.payload,
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
  const dispatchAction: any = useDispatch();
  const [page, setPage] = useState(1);
  const [sessionPage, setSessionPage] = useState(1);
  const [isNextSessionDisabled, setIsNextSessionDisabled] = useState(false);
  const [isLoadMoreDisabled, setIsLoadMoreDisabled] = useState(false);
  const [patientDetails, setPatientDetails] = useState<{
    name: string;
    age: number;
    hospitalName: string;
  }>({ name: "", age: -1, hospitalName: "" });
  const [state, dispatch] = useReducer(
    investigationReportsReducer,
    initialState
  );

  const {
    investigationGroups,
    investigations,
    investigationTableData,
    isLoading,
    selectedGroup,
    selectedInvestigations,
  } = state as InitialState;

  const fetchInvestigationsData = useCallback(
    (
      onSuccess: (data: any, pageNo: number) => void,
      curPage = 1,
      curSessionPage = 1
    ) => {
      dispatch({
        type: "set_loading",
        payload: { ...isLoading, tableData: true },
      });

      const pageStart = ((curPage || 1) - 1) * RESULT_PER_PAGE;
      const investigationsParams = (
        selectedInvestigations.length
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
          onSuccess(res.data, curPage);
          setPage(curPage + 1);
          if (res.data.results.length !== 0 || curPage >= totalPage) {
            dispatch({
              type: "set_loading",
              payload: { ...isLoading, tableData: false },
            });
          }
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

  useEffect(() => {
    async function fetchPatientName() {
      if (id) {
        const res = await dispatchAction(getPatient({ id: id }));
        if (res.data) {
          setPatientDetails({
            name: res.data.name,
            age: res.data.age,
            hospitalName: res.data.facility_object.name,
          });
        }
      } else {
        setPatientDetails({
          name: "",
          age: -1,
          hospitalName: "",
        });
      }
    }
    fetchPatientName();
  }, [dispatchAction, id]);

  const handleGroupSelect = ({ value }: FieldChangeEvent<string[]>) => {
    dispatch({ type: "set_investigations", payload: [] });
    dispatch({ type: "set_investigation_table_data", payload: [] });
    dispatch({ type: "set_selected_investigations", payload: [] });
    dispatch({ type: "set_loading", payload: initialState.isLoading });
    dispatch({ type: "set_selected_group", payload: value });
  };

  useEffect(() => {
    fetchInvestigationGroups.current();
  }, []);

  // eslint-disable-next-line
  const handleLoadMore = (e: any) => {
    const onSuccess = (data: any, pageNo: number) => {
      if (data.results.length === 0 && pageNo + 1 <= totalPage) {
        fetchInvestigationsData(onSuccess, pageNo + 1, sessionPage);
      } else {
        dispatch({
          type: "set_investigation_table_data",
          payload: [...state.investigationTableData, ...data.results],
        });
      }
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

          if (!data.results.length) {
            Notification.Error({
              msg: "No Investigation data available!",
            });
          }
          dispatch({
            type: "set_investigation_table_data",
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
    const count = go === "PREV" ? sessionPage + 1 : sessionPage - 1;
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
    <Page
      title="Investigation Reports"
      crumbsReplacements={{
        patient: { style: "pointer-events-none" },
        [id]: { name: patientDetails.name },
      }}
    >
      {!isLoading.investigationGroupLoading ? (
        <>
          <div className="mt-5">
            <AutocompleteMultiSelectFormField
              id="investigation-group-select"
              name="investigation-group-select"
              label="Select Investigation Groups"
              options={investigationGroups}
              value={selectedGroup}
              onChange={handleGroupSelect}
              optionLabel={(option) => option.name}
              optionValue={(option) => option.external_id}
              isLoading={isLoading.investigationLoading}
              placeholder="Select Groups"
              selectAll
            />
          </div>
          {!isLoading.investigationLoading && (
            <ButtonV2
              onClick={() => fetchInvestigation()}
              disabled={getTestDisabled}
              variant="primary"
              className="my-2.5"
            >
              Get Tests
            </ButtonV2>
          )}
          {!!isLoading.investigationLoading && (
            <CircularProgress className="text-primary-500" />
          )}
          {!!investigations.length && (
            <>
              <div className="mt-5">
                <AutocompleteMultiSelectFormField
                  id="investigation-select"
                  name="investigation-select"
                  label="Select Investigations (all investigations will be selected by default)"
                  value={selectedInvestigations}
                  options={investigations}
                  onChange={({ value }) =>
                    dispatch({
                      type: "set_selected_investigations",
                      payload: value,
                    })
                  }
                  optionLabel={(option) => option.name}
                  optionValue={(option) => option}
                  isLoading={isLoading.investigationLoading}
                  placeholder="Select Investigations"
                />
              </div>

              <ButtonV2
                onClick={() => {
                  setSessionPage(1);
                  handleGenerateReports(1);
                }}
                disabled={generateReportDisabled}
                variant="primary"
                className="my-2.5"
              >
                Generate Report
              </ButtonV2>
            </>
          )}
          <section id="reports_section">
            {!!investigationTableData.length && (
              <>
                <div className="my-2.5">
                  <ButtonV2
                    onClick={() => handleSessionPage("NEXT")}
                    disabled={prevSessionDisabled}
                  >
                    {isLoading.tableData ? "Loading..." : "Next Sessions"}
                  </ButtonV2>
                  <ButtonV2
                    onClick={() => handleSessionPage("PREV")}
                    disabled={nextSessionDisabled}
                  >
                    {isLoading.tableData ? "Loading..." : "Prev Sessions"}
                  </ButtonV2>
                </div>

                <ReportTable
                  investigationData={investigationTableData}
                  title="Report"
                  patientDetails={patientDetails}
                />

                {!!isLoading.tableData && (
                  <CircularProgress className="text-primary-500" />
                )}

                {!loadMoreDisabled && (
                  <ButtonV2
                    disabled={loadMoreDisabled}
                    onClick={handleLoadMore}
                    className="my-2.5 w-full"
                    variant="primary"
                  >
                    Load More
                  </ButtonV2>
                )}
              </>
            )}
          </section>
        </>
      ) : (
        <Loading />
      )}
    </Page>
  );
};

export default InvestigationReports;

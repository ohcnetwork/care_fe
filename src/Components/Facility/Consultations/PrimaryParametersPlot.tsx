import moment from "moment";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";

import ReactECharts from "echarts-for-react";
import {
  TableCell,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableBody,
} from "@material-ui/core";
import Paper from "@material-ui/core/Paper";
import { withStyles } from "@material-ui/core/styles";

export const PrimaryParametersPlot = (props: any) => {
  const { facilityId, patientId, consultationId } = props;
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [results, setResults] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const fetchDailyRounds = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(
        dailyRoundsAnalyse(
          {
            offset,
            fields: [
              "bp",
              "pulse",
              "temperature",
              "resp",
              "rhythm",
              "rhythm_detail",
            ],
          },
          { consultationId }
        )
      );
      if (!status.aborted) {
        if (res && res.data) {
          setResults(res.data);
        }
        setIsLoading(false);
      }
    },
    [consultationId, dispatch, offset]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchDailyRounds(status);
    },
    [consultationId]
  );

  const StyledTableCell = withStyles((theme) => ({
    head: {
      backgroundColor: theme.palette.action.hover,
      fontSize: 17,
    },
  }))(TableCell);

  const StyledTableRow = withStyles((theme) => ({
    root: {
      "&:nth-of-type(even)": {
        backgroundColor: theme.palette.action.hover,
      },
    },
  }))(TableRow);

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  const generalOptions = {
    tooltip: {
      trigger: "axis",
    },
    toolbox: {
      show: true,
      feature: {
        dataZoom: {
          yAxisIndex: "none",
        },
        magicType: { type: ["line", "bar"] },
        saveAsImage: {},
      },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: Object.keys(results).map((p: string) => moment(p).format("LLL")),
    },
    yAxis: {
      type: "value",
    },
  };

  const temperatureOptions = {
    ...generalOptions,
    title: {
      text: "Temperature (F)",
    },
    legend: {
      data: ["temperature"],
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "temperature",
        type: "line",
        data: Object.values(results).map((p: any) => p.temperature),
        areaStyle: {},
      },
    ],
  };

  const BPOptions = {
    ...generalOptions,
    title: {
      text: "Blood pressure",
    },
    legend: {
      data: ["diastolic", "systolic", "mean"],
    },

    series: [
      {
        name: "diastolic",
        type: "line",
        stack: "diastolic",
        data: Object.values(results).map((p: any) => p.bp && p.bp.diastolic),
      },
      {
        name: "systolic",
        type: "line",
        stack: "systolic",
        data: Object.values(results).map((p: any) => p.bp && p.bp.systolic),
      },
      {
        name: "mean",
        type: "line",
        stack: "mean",
        data: Object.values(results).map((p: any) => p.bp && p.bp.mean),
      },
    ],
  };

  const pulseOptions = {
    ...generalOptions,
    title: {
      text: "Pulse",
    },
    legend: {
      data: ["Pulse"],
    },

    series: [
      {
        name: "Pulse",
        type: "line",
        stack: "Pulse",
        data: Object.values(results).map((p: any) => p.pulse),
      },
    ],
  };

  const respOptions = {
    ...generalOptions,
    title: {
      text: "Resp",
    },
    legend: {
      data: ["Resp"],
    },

    series: [
      {
        name: "Resp",
        type: "line",
        stack: "Resp",
        data: Object.values(results).map((p: any) => p.resp),
      },
    ],
  };

  return (
    <div>
      <div className="grid grid-row-1 md:grid-cols-2 gap-4">
        <div className="pt-4 px-4 bg-white border rounded-lg shadow">
          <ReactECharts option={BPOptions} />
        </div>
        <div className="pt-4 px-4 bg-white border rounded-lg shadow">
          <ReactECharts option={temperatureOptions} />
        </div>
        <div className="pt-4 px-4 bg-white border rounded-lg shadow">
          <ReactECharts option={pulseOptions} />
        </div>
        <div className="pt-4 px-4 bg-white border rounded-lg shadow">
          <ReactECharts option={respOptions} />
        </div>
      </div>
      <div className="m-2">
        <h4 className="mx-2">Rhythm</h4>
        <TableContainer component={Paper}>
          <Table aria-label="customized table">
            <TableHead>
              <StyledTableRow className="font-bold">
                <StyledTableCell>Date</StyledTableCell>
                <StyledTableCell>Rhythm</StyledTableCell>
                <StyledTableCell>Description</StyledTableCell>
              </StyledTableRow>
            </TableHead>
            <TableBody>
              {Object.entries(results).map(
                (obj: any) =>
                  obj[1].rhythm > 0 && (
                    <StyledTableRow>
                      <TableCell>{moment(obj[0]).format("LLL")}</TableCell>
                      <TableCell>
                        {obj[1].rhythm === 5 ? "Regular" : "Ir regular"}
                      </TableCell>
                      <TableCell>{obj[1].rhythm_detail || "---"}</TableCell>
                    </StyledTableRow>
                  )
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
};

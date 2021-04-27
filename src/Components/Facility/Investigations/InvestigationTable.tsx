import {
  Paper,
  TableCell,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableBody,
  Theme,
  InputLabel,
  Box,
} from "@material-ui/core";
import { createStyles, makeStyles, withStyles } from "@material-ui/styles";
import React from "react";
import { useState } from "react";
import { TextInputField } from "../../Common/HelperInputFields";
import { getColorIndex, rowColor } from "./Reports/utils";

const useStyle = makeStyles((theme: Theme) => ({
  tableCell: {
    paddingTop: 0,
    paddingBottom: 0,
  },
}));

const StyledTableRow = withStyles((theme: Theme) =>
  createStyles({
    root: {
      "&:nth-of-type(odd)": {
        backgroundColor: "#f7f7f7",
      },
      "&:hover": {
        backgroundColor: "#eeeeee",
      },
    },
  })
)(TableRow);

const TestRow = ({ data }: any) => {
  const className = useStyle();

  const tableClass = "px-4 h-12 text-sm border-l border-r border-gray-400";
  const color = getColorIndex({
    min: data.investigation_object.min_value,
    max: data.investigation_object.max_value,
    value: data?.value,
  });

  return (
    <StyledTableRow>
      <TableCell className={tableClass}>
        {data.investigation_object.name}
      </TableCell>
      <TableCell
        className={tableClass}
        align="right"
        style={{
          ...(color >= 0
            ? {
                backgroundColor: rowColor[color]?.color || "white",
                color: rowColor[color]?.text || "black",
              }
            : {}),
        }}
      >
        {data?.notes ||
          (data?.value &&
            Math.round((data.value + Number.EPSILON) * 100) / 100) ||
          "---"}
      </TableCell>
      <TableCell className={tableClass} align="left">
        {data.investigation_object.unit || "---"}
      </TableCell>
      <TableCell className={tableClass} align="right">
        {data.investigation_object.min_value || "---"}
      </TableCell>
      <TableCell className={tableClass} align="right">
        {data.investigation_object.max_value || "---"}
      </TableCell>
      <TableCell className={tableClass} align="right">
        {data.investigation_object.ideal_value || "---"}
      </TableCell>
    </StyledTableRow>
  );
};

export const InvestigationTable = ({ title, data }: any) => {
  const className = useStyle();

  const [searchFilter, setSearchFilter] = useState("");

  const filterTests = data.filter((i: any) => {
    const result = !(
      String(i.investigation_object.name)
        .toLowerCase()
        .search(searchFilter.toLowerCase()) === -1
    );
    return result;
  });

  return (
    <Box padding="1rem" margin="1rem 0">
      {title && <div className="font-bold text-xl">{title}</div>}
      <br />
      <InputLabel>Search Test</InputLabel>
      <TextInputField
        value={searchFilter}
        placeholder="Search test"
        errors=""
        variant="outlined"
        margin="dense"
        onChange={(e) => setSearchFilter(e.target.value)}
      />
      <br />
      <TableContainer component={Paper}>
        <Table aria-label="simple table" size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="right">value</TableCell>
              <TableCell align="left">Unit</TableCell>
              <TableCell align="right">Min</TableCell>
              <TableCell align="right">Max</TableCell>
              <TableCell align="right">Ideal</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filterTests.length > 0 ? (
              filterTests.map((t: any) => {
                return <TestRow data={t} key={t.id} />;
              })
            ) : (
              <TableRow>
                <TableCell component="th" scope="row">
                  No test
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default InvestigationTable;

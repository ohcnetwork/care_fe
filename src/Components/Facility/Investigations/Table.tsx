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
  Typography,
  Box,
} from "@material-ui/core";
import { createStyles, makeStyles, withStyles } from "@material-ui/styles";
import React from "react";
import { useState } from "react";
import { TextInputField } from "../../Common/HelperInputFields";
import _ from "lodash";

const useStyle = makeStyles((theme: Theme) => ({
  tableCell: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  inputField: {
    // minHeight: 44,
    borderRadius: 0,
    borderLeft: "1px solid #ddd",
    borderRight: "1px solid #ddd",
    borderTop: "0 solid #ddd",
    borderBottom: "0 solid #ddd",
    fontSize: "1rem",
    padding: "0.5rem",
    maxWidth: 128,
    height: "100%",
    textAlign: "right",
    "&:hover": {
      backgroundColor: "#f7f7f7",
    },
    "&::placeholder": {
      color: "#bababa",
      textAlign: "center",
    },
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

const TestRow = ({ data, value, onChange }: any) => {
  const className = useStyle();
  const inputType = data.type === "float" ? "number" : "string";
  return (
    <StyledTableRow>
      <TableCell className={className.tableCell}>{data.name}</TableCell>
      <TableCell className={className.tableCell} align="right">
        <input
          className={className.inputField}
          value={value}
          onChange={onChange}
          type={inputType}
          step="any"
          placeholder="Enter value"
        />
      </TableCell>
      <TableCell className={className.tableCell} align="left">
        {data.unit || "---"}
      </TableCell>
      <TableCell className={className.tableCell} align="right">
        {data.min_value || "---"}
      </TableCell>
      <TableCell className={className.tableCell} align="right">
        {data.max_value || "---"}
      </TableCell>
      <TableCell className={className.tableCell} align="right">
        {data.ideal_value || "---"}
      </TableCell>
    </StyledTableRow>
  );
};

export const TestTable = ({ title, data, state, dispatch }: any) => {
  const className = useStyle();

  const [searchFilter, setSearchFilter] = useState("");

  const filterTests = data.filter((i: any) => {
    const result = !(String(i.name).toLowerCase().search(searchFilter) === -1);
    return result;
  });

  const handleValueChange = (value: any, name: string) => {
    const form = { ...state };
    _.set(form, name, value);
    dispatch({ type: "set_form", form });
  };

  return (
    <Box padding="1rem" margin="1rem 0">
      {title && (
        <Typography component="h1" variant="h4">
          {title}
        </Typography>
      )}
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
                return (
                  <TestRow
                    data={t}
                    key={t.external_id}
                    value={state[t.external_id] && state[t.external_id].value}
                    onChange={(e: { target: { value: any } }) =>
                      handleValueChange(
                        e.target.value,
                        `${t.external_id}.value`
                      )
                    }
                  />
                );
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

export default Table;

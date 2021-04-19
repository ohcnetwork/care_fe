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
import { SelectField } from "../../Common/HelperInputFields";
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
  const inputType = data.investigation_type === "Float" ? "number" : "string";
  return (
    <StyledTableRow>
      <TableCell className={className.tableCell}>{data.name}</TableCell>
      <TableCell className={className.tableCell} align="right">
        {data.investigation_type === "Choice" ? (
          <SelectField
            name="preferred_vehicle_choice"
            variant="outlined"
            margin="dense"
            optionArray={true}
            value={value}
            options={["Unselected", ...data.choices.split(",")]}
            onChange={onChange}
            className={"bg-white border-l border-r border-gray-400"}
          />
        ) : (
          <input
            className={
              "w-full px-4 h-12 text-right text-sm border-l border-r border-gray-400"
            }
            value={value}
            onChange={onChange}
            type={inputType}
            step="any"
            placeholder="Enter value"
          />
        )}
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
    const result = !(
      String(i.name).toLowerCase().search(searchFilter.toLowerCase()) === -1
    );
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
                        `${t.external_id}.${
                          t.investigation_type === "Float" ? "value" : "notes"
                        }`
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

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
import { SelectField, TextInputField } from "../../Common/HelperInputFields";
import { getColorIndex, rowColor } from "./Reports/utils";
import Checkbox from "@material-ui/core/Checkbox";
import _ from "lodash";

const useStyle = makeStyles(() => ({
  tableCell: {
    paddingTop: 0,
    paddingBottom: 0,
  },
}));

const StyledTableRow = withStyles(() =>
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

const TestRow = ({ data, onChange }: any) => {
  const [isChecked, setIsChecked] = useState(false);
  const tableClass = `h-12 text-sm border-l border-r border-gray-400 px-2`;
  const color = getColorIndex({
    min: data.investigation_object.min_value,
    max: data.investigation_object.max_value,
    value: data?.value,
  });
  const testValue =
    data?.notes ||
    (data?.value && Math.round((data.value + Number.EPSILON) * 100) / 100);

  const inputType =
    data?.investigation_object?.investigation_type === "Float"
      ? "number"
      : "string";
  return (
    <StyledTableRow>
      <TableCell className={tableClass}>
        <Checkbox
          checked={isChecked}
          onChange={(e) => setIsChecked(e.target.checked)}
          color="primary"
        />
      </TableCell>
      <TableCell className={tableClass}>
        {data?.investigation_object?.name || "---"}
      </TableCell>
      <TableCell
        className={`h-12 text-sm border-l border-r border-gray-400 ${
          isChecked ? "p-0" : "px-2"
        } `}
        align="right"
        style={{
          padding: 0,
          minWidth: 150,
          maxWidth: 150,
          ...(color >= 0
            ? {
                backgroundColor: rowColor[color]?.color || "white",
                color: rowColor[color]?.text || "black",
              }
            : {}),
        }}
      >
        {isChecked ? (
          data.investigation_type === "Choice" ? (
            <SelectField
              name="preferred_vehicle_choice"
              variant="outlined"
              margin="dense"
              optionArray={true}
              value={data?.notes}
              options={["Unselected", ...data.choices.split(",")]}
              onChange={onChange}
              className={"bg-white border-l border-r border-gray-400"}
            />
          ) : (
            <input
              className={
                "w-full px-4 h-full text-right text-sm border-l border-r border-gray-800 m-0"
              }
              value={testValue}
              onChange={onChange}
              type={inputType}
              step="any"
              placeholder="Enter value"
              autoFocus
              style={{
                ...(color >= 0
                  ? {
                      backgroundColor: rowColor[color]?.color || "white",
                      color: rowColor[color]?.text || "black",
                    }
                  : {}),
              }}
            />
          )
        ) : (
          testValue || "---"
        )}
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

export const InvestigationTable = ({ title, data, handleValueChange }: any) => {
  const [searchFilter, setSearchFilter] = useState("");

  const filterTests = Object.values(data).filter((i: any) => {
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
              <TableCell>&nbsp;</TableCell>
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
                    key={t.id}
                    onChange={(e: { target: { value: any } }) => {
                      const { target, value } =
                        t?.investigation_object?.investigation_type === "Float"
                          ? {
                              target: `${t.id}.value`,
                              value: Number(e.target.value) || null,
                            }
                          : {
                              target: `${t.id}.notes`,
                              value: e.target.value,
                            };
                      handleValueChange(value, target);
                    }}
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

export default InvestigationTable;

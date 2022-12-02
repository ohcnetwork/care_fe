import {
  Paper,
  TableCell,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableBody,
  InputLabel,
  Box,
  Button,
} from "@material-ui/core";
import { createStyles, withStyles } from "@material-ui/styles";
import React from "react";
import { useState } from "react";
import { SelectField, TextInputField } from "../../Common/HelperInputFields";
import _ from "lodash";
import { classNames } from "../../../Utils/utils";

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

const TestRow = ({ data, onChange, showForm, value, isChanged }: any) => {
  const tableClass = "h-12 text-sm border-l border-r border-gray-400 px-2";
  const testValue = value;

  const inputType =
    data?.investigation_object?.investigation_type === "Float"
      ? "number"
      : "string";
  return (
    <StyledTableRow className={isChanged ? "bg-primary-300" : ""}>
      <TableCell className={tableClass}>
        {data?.investigation_object?.name || "---"}
      </TableCell>
      <TableCell
        className={classNames(
          "h-12 text-sm border-l border-r border-gray-400",
          showForm ? "p-0" : "px-2"
        )}
        align="right"
        style={{
          padding: 0,
          minWidth: 150,
          maxWidth: 150,
        }}
      >
        {showForm ? (
          data?.investigation_object?.investigation_type === "Choice" ? (
            <SelectField
              name="preferred_vehicle_choice"
              variant="outlined"
              optionArray={true}
              value={testValue}
              options={[
                "Unselected",
                ...data?.investigation_object?.choices.split(","),
              ]}
              onChange={onChange}
              className="w-full px-4 h-full text-right text-sm m-0"
            />
          ) : (
            <input
              className="w-full px-4 h-full text-right text-sm border-l border-r m-0 focus:border-primary-500 focus:ring-primary-500"
              value={testValue}
              onChange={onChange}
              type={inputType}
              step="any"
              placeholder="Enter value"
            />
          )
        ) : (
          testValue || "---"
        )}
      </TableCell>
      <TableCell className={tableClass} align="left">
        {data.investigation_object.unit || "---"}
      </TableCell>
      <TableCell className={tableClass} align="center">
        {data.investigation_object.min_value || "---"}
      </TableCell>
      <TableCell className={tableClass} align="center">
        {data.investigation_object.max_value || "---"}
      </TableCell>
      <TableCell className={tableClass} align="right">
        {data.investigation_object.ideal_value || "---"}
      </TableCell>
    </StyledTableRow>
  );
};

export const InvestigationTable = ({
  title,
  data,
  handleValueChange,
  changedFields,
  handleUpdateCancel,
  handleSave,
}: any) => {
  const [searchFilter, setSearchFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
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
      <div className="flex flex-col sm:flex-row items-center justify-between mb">
        {title && <div className="font-bold text-xl">{title}</div>}
        <div className="py-2 flex sm:flex-row flex-col ">
          <Button
            color="primary"
            variant="outlined"
            onClick={() => window.print()}
            className="mr-2 my-2"
            disabled={showForm}
          >
            Print Report
          </Button>
          <Button
            variant={showForm ? "outlined" : "contained"}
            color="primary"
            className="mr-2 my-2"
            onClick={() => {
              showForm && handleUpdateCancel();
              setShowForm((prev) => !prev);
            }}
          >
            {!showForm && <i className="fas fa-pencil-alt mr-2" />}
            {showForm ? "Cancel" : "Update Details"}
          </Button>
          {showForm && (
            <Button
              variant={"contained"}
              color="primary"
              onClick={() => handleSave()}
              className="mr-2 my-2"
            >
              Save
            </Button>
          )}
        </div>
      </div>
      <InputLabel className="mt-4">Search Test</InputLabel>
      <TextInputField
        value={searchFilter}
        placeholder="Search test"
        errors=""
        variant="outlined"
        margin="dense"
        onChange={(e) => setSearchFilter(e.target.value)}
      />
      <br />
      <TableContainer component={Paper} id="section-to-print">
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
                const value =
                  changedFields[t.id]?.notes ??
                  changedFields[t.id]?.value ??
                  null;
                const isChanged = changedFields[t.id]?.initialValue !== value;
                return (
                  <TestRow
                    data={t}
                    key={t.id}
                    showForm={showForm}
                    value={value}
                    isChanged={isChanged}
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

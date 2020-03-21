import React, { useState } from "react";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import { Paper } from "@material-ui/core";

export default function StateDashboard() {
  const [data, setData] = useState([]);
  return (
    <TableContainer component={Paper}>
      <Table >
        <TableHead>
          <TableRow>
            <TableCell>Beds Available</TableCell>
            <TableCell align="right">Admitted Patients</TableCell>
            <TableCell align="right">COVID Positive Patients</TableCell>
            <TableCell align="right">People Under Observation</TableCell>
            <TableCell align="right">Cases Reported Today</TableCell>
            <TableCell align="right">
              COVID Positive Cases Reported Today
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map(row => (
            <TableRow key={row.name}>
              <TableCell component="th" scope="row">
                {row.name}
              </TableCell>
              <TableCell align="right">{row.calories}</TableCell>
              <TableCell align="right">{row.fat}</TableCell>
              <TableCell align="right">{row.carbs}</TableCell>
              <TableCell align="right">{row.protein}</TableCell>
              <TableCell align="right">{row.protein}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

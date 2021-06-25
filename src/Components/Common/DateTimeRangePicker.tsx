import { DateTimePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import { Box, Typography } from "@material-ui/core";
import DateFnsUtils from "@date-io/date-fns";
import moment from "moment";
import React from "react";

interface IDateTimeRangePickerProps {
  label?: string;
  onChange: (args: {
    startDate: moment.Moment | null;
    endDate: moment.Moment | null;
  }) => void;
  startDate: moment.Moment | null;
  endDate: moment.Moment | null;
  startDateId?: string;
  endDateId?: string;
  size?: "regular" | "small";
}

export const getDate = (value: any) =>
  value && moment(value).isValid() ? moment(value) : null;

export const DateTimeRangePicker: React.FC<IDateTimeRangePickerProps> = ({
  label,
  endDateId = "end_date",
  endDate,
  startDate,
  onChange,
  startDateId = "start_date",
  size = "regular",
}) => {
  return (
    <Box className="my-2">
      <div className="flex">
        {label && <span className="text-sm font-semibold">{label}</span>}
        {(startDate || endDate) && <button
          className="text-xs font-semibold px-2 bg-red-200 hover:bg-red-300 rounded uppercase float-right mr-1 ml-auto"
          onClick={() => {
            onChange({ startDate: null, endDate: null });
          }}
        >
          X Clear
        </button>}
      </div>
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <div className="flex">
          <DateTimePicker
            onChange={(p) =>
              p && onChange({ startDate: moment(p), endDate: endDate })
            }
            value={startDate}
            label={"Start Date"}
            autoOk={true}
            className="text-xs mr-1"
            clearable={true}
            maxDate={endDate}
          />

          <DateTimePicker
            onChange={(p) =>
              p && onChange({ startDate: startDate, endDate: moment(p) })
            }
            value={endDate}
            label={"End Date"}
            autoOk={true}
            className="text-xs ml-1"
            clearable={true}
            minDate={startDate}
          />
        </div>
      </MuiPickersUtilsProvider>
    </Box>
  );
};

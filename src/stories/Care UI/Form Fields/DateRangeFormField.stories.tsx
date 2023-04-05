import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DateRange } from "../../../Components/Common/DateRangeInputV2";
import DateRangeFormField from "../../../Components/Form/FormFields/DateRangeFormField";

const meta: Meta<typeof DateRangeFormField> = {
  component: DateRangeFormField,
};

export default meta;
type Story = StoryObj<typeof DateRangeFormField>;

const WithState = (args: any) => {
  const [value, setValue] = useState<DateRange>();

  return (
    <DateRangeFormField
      {...args}
      value={value}
      onChange={({ value }) => setValue(value)}
    />
  );
};

export const Default: Story = {
  args: {
    name: "date-range",
    label: "Select a date range",
  },
  render: (args) => (
    <div className="max-w-sm">
      <WithState {...args} />
    </div>
  ),
};

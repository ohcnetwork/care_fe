import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import DateFormField from "../../../Components/Form/FormFields/DateFormField";

const meta: Meta<typeof DateFormField> = {
  component: DateFormField,
};

export default meta;
type Story = StoryObj<typeof DateFormField>;

const WithState = (args: any) => {
  const [value, setValue] = useState<Date>();

  return (
    <DateFormField
      {...args}
      value={value}
      onChange={({ value }) => setValue(value)}
    />
  );
};

export const Default: Story = {
  args: {
    name: "date",
    label: "Select a date",
  },
  render: (args) => (
    <div className="max-w-xs">
      <WithState {...args} />
    </div>
  ),
};

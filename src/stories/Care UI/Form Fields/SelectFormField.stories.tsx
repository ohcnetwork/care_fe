import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { SelectFormField } from "../../../Components/Form/FormFields/SelectFormField";

const meta: Meta<typeof SelectFormField> = {
  component: SelectFormField,
};

export default meta;
type Story = StoryObj<typeof SelectFormField>;

const WithState = (args: any) => {
  const [value, setValue] = useState<any>();

  return (
    <SelectFormField
      {...args}
      value={value}
      onChange={({ value }) => setValue(value)}
    />
  );
};

export const Default: Story = {
  args: {
    name: "select",
    label: "Pick an item",
    placeholder: "Select an option",
    options: [
      { label: "Item 1", value: "item1" },
      { label: "Item 2", value: "item2" },
      { label: "Item 3", value: "item3" },
      { label: "Item 4", value: "item4" },
    ],
    optionLabel: (option: any) => option.label,
    optionValue: (option: any) => option.value,
  },
  render: (args) => (
    <div className="max-w-sm">
      <WithState {...args} />
    </div>
  ),
};

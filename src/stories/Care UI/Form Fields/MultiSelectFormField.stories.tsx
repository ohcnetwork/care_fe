import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { MultiSelectFormField } from "../../../Components/Form/FormFields/SelectFormField";

const meta: Meta<typeof MultiSelectFormField> = {
  component: MultiSelectFormField,
};

export default meta;
type Story = StoryObj<typeof MultiSelectFormField>;

const WithState = (args: any) => {
  const [value, setValue] = useState<any>();

  return (
    <MultiSelectFormField
      {...args}
      value={value}
      onChange={({ value }) => setValue(value)}
    />
  );
};

export const Default: Story = {
  args: {
    name: "select",
    label: "Pick items",
    placeholder: "Select multiple options",
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

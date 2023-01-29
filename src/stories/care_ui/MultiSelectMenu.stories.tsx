import { ComponentStory } from "@storybook/react";
import { useState } from "react";
import { ADMITTED_TO } from "../../Common/constants";
import MultiSelectMenuV2 from "../../Components/Form/MultiSelectMenuV2";

export default {
  title: "Care UI / Select",
  component: MultiSelectMenuV2,
};

const Template: ComponentStory<typeof MultiSelectMenuV2> = (args) => {
  const [state, setState] = useState<any>(undefined);

  return (
    <MultiSelectMenuV2
      {...args}
      value={state}
      onChange={(option) => setState(option)}
    />
  );
};

export const MultiSelectMenu = Template.bind({});
MultiSelectMenu.args = {
  placeholder: "Show all",
  className: "w-72",
  options: ADMITTED_TO,
  optionLabel: (option: any) => option.text,
  optionIcon: (option: any) => <i className="text-base">{option.icon}</i>,
  optionValue: (option: any) => option.id,
};

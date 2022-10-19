import { ComponentStory } from "@storybook/react";
import ButtonV2 from "../Components/Common/components/ButtonV2";

export default {
  title: "Care UI / Button",
  component: ButtonV2,
};

const Template: ComponentStory<typeof ButtonV2> = (args) => (
  <ButtonV2 {...args}>Label</ButtonV2>
);

export const Default = Template.bind({});

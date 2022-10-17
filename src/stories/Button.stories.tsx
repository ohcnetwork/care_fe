import { ComponentStory, ComponentMeta } from "@storybook/react";
import ButtonV2 from "../Components/Common/components/ButtonV2";

export default {
  title: "Button",
  component: ButtonV2,
} as ComponentMeta<typeof ButtonV2>;

const Template: ComponentStory<typeof ButtonV2> = (args) => (
  <ButtonV2 {...args}>Label</ButtonV2>
);

export const Button = Template.bind({});

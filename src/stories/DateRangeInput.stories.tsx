import { ComponentStory } from "@storybook/react";
import Component from "../Components/Common/DateRangeInputV2";

export default {
  title: "Care UI / DateRangeInput",
  component: Component,
};

const Template: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const DateRangeInput = Template.bind({});

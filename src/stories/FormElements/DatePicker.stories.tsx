import { ComponentStory } from "@storybook/react";
import Component from "../../Components/Form/FormFields/DateFormField";

export default {
  title: "Care UI / Button",
  component: Component,
};

const Template: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const DateFormField = Template.bind({});

DateFormField.args = {
  position: "LEFT",
};

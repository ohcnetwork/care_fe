import { ComponentStory } from "@storybook/react";
import Component from "../../../Components/Form/FormFields/TextAreaFormField";

export default {
  title: "Care UI / Form Elements",
  component: Component,
};

const Template: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const TextAreaFormField = Template.bind({});

TextAreaFormField.args = {
  className: "w-72",
  placeholder: "Type something",
};

import { ComponentStory } from "@storybook/react";
import Component from "../../Components/Form/FormFields/TextFormField";

export default {
  title: "Care UI / Form Elements",
  component: Component,
};

const Template: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const TextFormField = Template.bind({});

TextFormField.args = {
  className: "w-72",
  placeholder: "Type something",
};

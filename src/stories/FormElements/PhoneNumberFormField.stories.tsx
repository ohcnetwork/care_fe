import { ComponentStory } from "@storybook/react";
import { PhoneNumberField as Component } from "../../Components/Common/HelperInputFields";

export default {
  title: "Care UI / Form Elements",
  component: Component,
};

const Template: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const PhoneNumberField = Template.bind({});

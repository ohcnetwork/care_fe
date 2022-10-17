import { ComponentStory } from "@storybook/react";
import PhoneNumberFormField from "../../../Components/Form/FormFields/PhoneNumberFormField";

export default {
  title: "Care UI / Form Fields / PhoneNumberFormField",
  component: PhoneNumberFormField,
};

const Template: ComponentStory<typeof PhoneNumberFormField> = (args) => (
  <PhoneNumberFormField className="w-96" {...args} />
);

export const Component = Template.bind({});

Component.args = {
  label: "Phone Number",
  placeholder: "Hello",
};

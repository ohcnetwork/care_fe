import { ComponentStory } from "@storybook/react";
import ButtonV2 from "../Components/Common/components/ButtonV2";

export default {
  title: "Care UI / Button",
  component: ButtonV2,
};

const Template: ComponentStory<typeof ButtonV2> = (args) => (
  <ButtonV2 {...args}>Label</ButtonV2>
);

export const primary = Template.bind({});
primary.args = {
  variant: "primary",
};

export const secondary = Template.bind({});
secondary.args = {
  variant: "secondary",
};

export const danger = Template.bind({});
danger.args = {
  variant: "danger",
};

export const warning = Template.bind({});
warning.args = {
  variant: "warning",
};

export const alert = Template.bind({});
alert.args = {
  variant: "alert",
};

export const primaryGhost = Template.bind({});
primaryGhost.args = {
  variant: "primary",
  ghost: true,
};

export const secondaryGhost = Template.bind({});
secondaryGhost.args = {
  variant: "secondary",
  ghost: true,
};

export const dangerGhost = Template.bind({});
dangerGhost.args = {
  variant: "danger",
  ghost: true,
};

export const warningGhost = Template.bind({});
warningGhost.args = {
  variant: "warning",
  ghost: true,
};

export const alertGhost = Template.bind({});
alertGhost.args = {
  variant: "alert",
  ghost: true,
};

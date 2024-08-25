import type { Meta, StoryObj } from "@storybook/react";
import ButtonV2 from "../../Components/Common/components/ButtonV2";

const meta: Meta<typeof ButtonV2> = {
  component: ButtonV2,
};

export default meta;
type Story = StoryObj<typeof ButtonV2>;

export const Default: Story = {
  render: (args) => <ButtonV2 {...args}>Click Me</ButtonV2>,
};

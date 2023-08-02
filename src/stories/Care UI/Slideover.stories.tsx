import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import SlideOver from "../../CAREUI/interactive/SlideOver";
import ButtonV2 from "../../Components/Common/components/ButtonV2";

const meta: Meta<typeof SlideOver> = {
  component: SlideOver,
};

export default meta;
type Story = StoryObj<typeof SlideOver>;

const WithState = (args: any) => {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <ButtonV2 onClick={() => setOpen(true)}>Open SlideOver</ButtonV2>
      <SlideOver open={open} setOpen={setOpen} {...args}>
        Content
      </SlideOver>
    </div>
  );
};

export const Default: Story = {
  args: {
    slideFrom: "right",
    title: "Title",
    dialogClass: "md:w-[400px]",
  },
  render: (args) => <WithState {...args} />,
};

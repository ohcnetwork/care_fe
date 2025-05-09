import { PencilIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { MonetaryComponentRead } from "@/types/base/monetaryComponent/monetaryComponent";
import { Code } from "@/types/questionnaire/code";

import { DiscountMonetaryComponentForm } from "./DiscountMonetaryComponentForm";

export function EditDiscountMonetaryPopover({
  component,
  ...props
}: {
  component: MonetaryComponentRead;
  onSubmit: (data: MonetaryComponentRead) => void;
  systemCodes: Code[];
  facilityCodes: Code[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <PencilIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <DiscountMonetaryComponentForm
          defaultValues={component}
          onSubmit={(data) => {
            setOpen(false);
            props.onSubmit(data);
          }}
          systemCodes={props.systemCodes}
          facilityCodes={props.facilityCodes}
        />
      </PopoverContent>
    </Popover>
  );
}

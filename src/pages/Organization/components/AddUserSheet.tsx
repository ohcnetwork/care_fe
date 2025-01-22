import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import CreateUserForm from "@/components/Users/CreateUserForm";

import { UserBase } from "@/types/user/user";

interface AddUserSheetProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onUserCreated?: (user: UserBase) => void;
}

export default function AddUserSheet({
  open,
  setOpen,
  onUserCreated,
}: AddUserSheetProps) {
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" data-cy="add-user-button">
          <CareIcon icon="l-plus" className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </SheetTrigger>
      <SheetContent
        className="w-full sm:max-w-2xl overflow-y-auto"
        data-cy="add-user-form"
      >
        <SheetHeader>
          <SheetTitle>Add New User</SheetTitle>
          <SheetDescription>
            Create a new user and add them to the organization.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <CreateUserForm
            onSubmitSuccess={(user) => {
              setOpen(false);
              onUserCreated?.(user);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

import {
  CopyIcon,
  KeyRoundIcon,
  ShieldAlertIcon,
  TriangleAlert,
} from "lucide-react";
import { Link, navigate, usePathParams } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";
import { toast } from "sonner";

import { useMutation } from "@tanstack/react-query";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Avatar } from "@/components/Common/Avatar";
import RelativeDateTooltip from "@/components/Common/RelativeDateTooltip";

import useAuthUser from "@/hooks/useAuthUser";

import { formatName, isUserOnline } from "@/Utils/utils";
import {
  GenerateServiceAccountTokenResponse,
  UserReadMinimal,
} from "@/types/user/user";
import userApi from "@/types/user/userApi";

import mutate from "@/Utils/request/mutate";

interface UserCardProps {
  user: UserReadMinimal;
  roleName: string;
  actions?: React.ReactNode;
  facility?: string;
  isServiceAccount?: boolean;
  canManageServiceAccount?: boolean;
}

export const UserStatusIndicator = ({
  user,
  addPadding = false,
  className = "",
}: {
  user: UserReadMinimal;
  className?: string;
  addPadding?: boolean;
}) => {
  const authUser = useAuthUser();
  const isAuthUser = user.id === authUser.id;
  const { t } = useTranslation();

  return (
    <span className={cn(addPadding ? "px-3 py-1" : "py-px", className)}>
      {isUserOnline(user) || isAuthUser ? (
        <Badge variant="primary" className="whitespace-nowrap">
          <span className="inline-block size-2 shrink-0 rounded-full bg-green-500" />
          <span>{t("online")}</span>
        </Badge>
      ) : user.last_login ? (
        <Badge variant="yellow" className="whitespace-nowrap">
          <span className="inline-block size-2 shrink-0 rounded-full bg-yellow-500" />
          <RelativeDateTooltip date={user.last_login} />
        </Badge>
      ) : (
        <Badge variant="secondary" className="whitespace-nowrap">
          <span className="inline-block size-2 shrink-0 rounded-full bg-gray-500" />
          <span className="hidden lg:inline">{t("never_logged_in")}</span>
          <span className="lg:hidden">{t("never")}</span>
        </Badge>
      )}
    </span>
  );
};
export function UserCard(props: UserCardProps) {
  const {
    user,
    actions,
    roleName,
    facility,
    isServiceAccount,
    canManageServiceAccount,
  } = props;

  const { t } = useTranslation();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);

  const { mutate: generateToken, isPending: isGenerating } = useMutation({
    mutationFn: mutate(userApi.generateServiceAccountToken, {
      pathParams: { username: selectedAccount || "" },
    }),
    onSuccess: (data: GenerateServiceAccountTokenResponse) => {
      setGeneratedToken(data.token);
      setShowTokenDialog(true);
      toast.success(t("token_generated_successfully"));
    },
  });

  const { mutate: revokeToken, isPending: isRevoking } = useMutation({
    mutationFn: mutate(userApi.revokeServiceAccountToken, {
      pathParams: { username: selectedAccount || "" },
    }),
    onSuccess: () => {
      toast.success(t("token_revoked_successfully"));
      setShowRevokeDialog(false);
      setSelectedAccount(null);
    },
  });

  const handleGenerateToken = (username: string) => {
    setSelectedAccount(username);
    generateToken({});
  };

  const handleRevokeToken = (username: string) => {
    setSelectedAccount(username);
    setShowRevokeDialog(true);
  };

  const handleCopyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      toast.success(t("token_copied_to_clipboard"));
    }
  };

  const handleCloseTokenDialog = () => {
    setShowTokenDialog(false);
    setGeneratedToken(null);
    setSelectedAccount(null);
  };

  return (
    <Card key={user.id} className={cn("h-full", user.deleted && "opacity-60")}>
      <CardContent className="p-4 flex flex-col h-full justify-between">
        <div className="flex items-start gap-3">
          {!isServiceAccount && (
            <Avatar
              name={formatName(user, true)}
              imageUrl={user.profile_picture_url}
              className="h-12 w-12 sm:h-14 sm:w-14 text-xl sm:text-2xl flex-shrink-0"
            />
          )}

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex flex-col gap-1">
              <div className="flex items-start justify-between">
                <h1 className="text-base font-bold break-words pr-2">
                  {formatName(user)}
                </h1>
                {!isServiceAccount && (
                  <span className="text-sm text-gray-500">
                    <UserStatusIndicator user={user} />
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-500 mr-2 break-words">
                {user.username}
              </span>
            </div>
            <div
              className={cn(
                "mt-4 -ml-12 sm:ml-0 grid grid-cols-2 gap-2 text-sm",
                isServiceAccount && "ml-0",
              )}
            >
              <div>
                <div className="text-gray-500">{t("role")}</div>
                <div className="font-medium truncate">{roleName}</div>
              </div>
              <div>
                <div className="text-gray-500">{t("phone_number")}</div>
                <div className="font-medium truncate">
                  {user.phone_number
                    ? formatPhoneNumberIntl(user.phone_number)
                    : "-"}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2 -mx-2 -mb-2 sm:-mx-4 sm:-mb-4 rounded-md py-4 px-4 bg-gray-50 flex justify-end gap-2">
          {!user.deleted && !isServiceAccount ? (
            <>
              {actions}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigate(
                    `${facility ? `/facility/${facility}/users/${user.username}` : `/users/${user.username}`}`,
                  );
                }}
              >
                <CareIcon icon="l-arrow-up-right" className="text-lg mr-1" />
                <span>{t("see_details")}</span>
              </Button>
            </>
          ) : isServiceAccount && canManageServiceAccount ? (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerateToken(user.username)}
                disabled={isGenerating}
              >
                <KeyRoundIcon className="mr-2 size-4" />
                {isGenerating && selectedAccount === user.username
                  ? t("generating")
                  : t("generate_token")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleRevokeToken(user.username)}
                className="p-2"
              >
                <ShieldAlertIcon className="mr-2 size-4" />
                {t("revoke_token")}
              </Button>
            </div>
          ) : (
            <div className="bg-gray-200 rounded-md px-2 py-1 text-sm inline-block">
              <CareIcon icon="l-archive" className="mr-2" />
              {t("archived")}
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={showTokenDialog} onOpenChange={handleCloseTokenDialog}>
        <DialogContent className="max-w-md w-[95%] rounded-md">
          <DialogHeader>
            <div className="flex gap-2">
              <div className="hidden sm:flex size-10 items-center justify-center rounded-full bg-green-100">
                <KeyRoundIcon className="size-5 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  {t("token_generated_successfully")}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {t("copy_token_securely")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-medium text-gray-500 mb-2">
                {t("service_account_token")}
              </p>
              <code className="block break-all font-mono text-sm text-gray-900 bg-white p-3 rounded border border-gray-200">
                {generatedToken}
              </code>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <div className="flex gap-2">
                <TriangleAlert className="size-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">{t("important_note")}</p>
                  <p className="text-xs">{t("token_warning_message")}</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCopyToken}
              className="flex-1"
            >
              <CopyIcon className="mr-2 size-4" />
              {t("copy_token")}
            </Button>
            <Button onClick={handleCloseTokenDialog} className="flex-1">
              {t("done")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={showRevokeDialog}
        onOpenChange={setShowRevokeDialog}
        title={t("revoke_token")}
        description={
          <div className="space-y-2">
            <p>
              {t("revoke_token_confirmation", {
                username: selectedAccount,
              })}
            </p>
            <p className="text-sm text-gray-600">{t("revoke_token_warning")}</p>
          </div>
        }
        variant={"destructive"}
        confirmText={isRevoking ? t("revoking") : t("revoke")}
        disabled={isRevoking}
        onConfirm={() => revokeToken({})}
      />
    </Card>
  );
}
export const UserGrid = ({ users }: { users?: UserReadMinimal[] }) => {
  const { facilityId } = usePathParams("/facility/:facilityId/*")!;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {users?.map((user) => (
        <UserCard
          facility={facilityId}
          key={user.id}
          user={user}
          roleName={user.user_type}
        />
      ))}
    </div>
  );
};

const UserListHeader = () => {
  const { t } = useTranslation();

  return (
    <thead>
      <tr className="bg-gray-50 text-sm font-medium text-gray-500">
        <th className="px-4 py-3 text-left">{t("name")}</th>
        <th className="w-32 px-10 py-3 text-left">{t("status")}</th>
        <th className="px-10 py-3 text-left">{t("role")}</th>
        <th className="px-4 py-3 text-left">{t("contact_number")}</th>
      </tr>
    </thead>
  );
};

const UserListRow = ({ user }: { user: UserReadMinimal }) => {
  const { facilityId } = usePathParams("/facility/:facilityId/*")!;
  const { t } = useTranslation();

  return (
    <tr
      key={`usr_${user.id}`}
      id={`usr_${user.id}`}
      className="hover:bg-gray-50"
    >
      <td className="px-4 py-4 lg:pr-20">
        <div className="flex items-center gap-3">
          <Avatar
            imageUrl={
              "profile_picture_url" in user ? user.profile_picture_url : ""
            }
            name={formatName(user, true) ?? ""}
            className="size-10 text-lg"
          />
          <div className="flex flex-col">
            <h1 id={`name-${user.username}`} className="text-sm font-medium">
              {formatName(user)}
            </h1>
            <span
              id={`username-${user.username}`}
              className="text-xs text-gray-500"
            >
              {user.username}
            </span>
          </div>
        </div>
      </td>
      <td className="flex-0 px-6 py-4">
        <UserStatusIndicator user={user} addPadding />
      </td>
      <td id="role" className="px-10 py-4 text-sm">
        {user.user_type}
      </td>
      <td id="contact" className="px-4 py-4 text-sm whitespace-nowrap">
        {user.phone_number ? formatPhoneNumberIntl(user.phone_number) : "-"}
      </td>
      <td className="px-4 py-4">
        <Button
          asChild
          id={`see-details-${user.username}`}
          variant="outline"
          size="sm"
        >
          <Link href={`/facility/${facilityId}/users/${user.username}`}>
            <CareIcon icon="l-arrow-up-right" className="text-lg mr-1" />
            <span>{t("see_details")}</span>
          </Link>
        </Button>
      </td>
    </tr>
  );
};
export const UserList = ({ users }: { users?: UserReadMinimal[] }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="relative min-w-full divide-y divide-gray-200">
        <UserListHeader />
        <tbody className="divide-y divide-gray-200 bg-white">
          {users?.map((user) => (
            <UserListRow key={user.id} user={user} />
          ))}
        </tbody>
      </table>
    </div>
  );
};
interface UserListAndCardViewProps {
  users: UserReadMinimal[];
  activeTab: "card" | "list";
}

export default function UserListAndCardView({
  users,
  activeTab,
}: UserListAndCardViewProps) {
  const { t } = useTranslation();

  return (
    <>
      {users.length > 0 ? (
        <>
          {activeTab === "card" ? (
            <UserGrid users={users} />
          ) : (
            <UserList users={users} />
          )}
        </>
      ) : (
        <div className="h-full space-y-2 rounded-lg bg-white p-7 shadow-sm">
          <div className="flex w-full items-center justify-center text-xl font-bold text-secondary-500">
            {t("no_users_found")}
          </div>
        </div>
      )}
    </>
  );
}

import { useQuery } from "@tanstack/react-query";
import {
  GraduationCap,
  Languages,
  Mail,
  MapPin,
  Pencil,
  RefreshCw,
  Star,
  UserRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { UserProfileEditSection } from "@/components/Users/UserForm";

import { userChildProps } from "@/components/Common/UserColumns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/typography";
import ServiceTokenSection from "@/components/Users/ServiceTokenSection";
import { useUserLanguages } from "@/components/Users/UserLanguageSelect";
import { UserProfileEmptyState } from "@/components/Users/UserProfileEmptyState";
import { UserProfileSection } from "@/components/Users/UserProfileSection";
import { RoleOrgAccessSummary } from "@/components/Users/UserRoleOrganizationAccess";
import UserSoftwareUpdate from "@/components/Users/UserSoftwareUpdate";
import {
  BasicInfoDetails,
  ContactInfoDetails,
  GeoOrgDetails,
} from "@/components/Users/UserViewDetails";
import useAuthUser from "@/hooks/useAuthUser";
import { PLUGIN_Component } from "@/PluginEngine";
import userApi from "@/types/user/userApi";
import query from "@/Utils/request/query";

interface UserSummaryProps extends userChildProps {
  onEdit?: (section?: UserProfileEditSection) => void;
}

export default function UserSummaryTab({ userData, onEdit }: UserSummaryProps) {
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const { languageName } = useUserLanguages();
  const { data: degrees } = useQuery({
    queryKey: ["userDegrees"],
    queryFn: query(userApi.degrees),
    staleTime: 5 * 60 * 1000,
    enabled: !userData.is_service_account && !!userData.qualification?.length,
  });
  const editAction = (label: string, section: UserProfileEditSection) =>
    onEdit && (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-mr-2 shrink-0"
        aria-label={t("profile_edit_section", { section: label })}
        onClick={() => onEdit(section)}
      >
        <Pencil className="size-3.5" aria-hidden="true" />
        {t("edit")}
      </Button>
    );

  return (
    <div className="space-y-6 pt-6">
      <SectionTitle className="sr-only">{t("profile")}</SectionTitle>
      {userData.is_service_account &&
        userData.created_by?.username === authUser.username && (
          <UserProfileSection
            title={t("manage_token")}
            description={t("manage_service_account_token_for", {
              username: userData.username,
            })}
          >
            <ServiceTokenSection userData={userData} />
          </UserProfileSection>
        )}
      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(14rem,1fr)] md:gap-8">
        <div className="contents md:block md:space-y-8">
          <UserProfileSection
            title={t("personal_information")}
            className="order-1"
            icon={UserRound}
            action={editAction(t("personal_information"), "personal")}
          >
            <BasicInfoDetails user={userData} />
          </UserProfileSection>
          {!userData.is_service_account && (
            <UserProfileSection
              title={t("profile_qualifications")}
              className="order-3"
              icon={GraduationCap}
              action={
                userData.qualification?.length
                  ? editAction(t("profile_qualifications"), "qualification")
                  : undefined
              }
            >
              {userData.qualification?.length ? (
                <ul className="divide-y divide-border/70">
                  {userData.qualification.map((qualification, index) => {
                    const degree = degrees?.find(
                      (degree) =>
                        degree.code === qualification.degree.code &&
                        degree.system === qualification.degree.system,
                    );
                    return (
                      <li
                        key={index}
                        className="flex gap-4 py-5 first:pt-1 last:pb-0"
                      >
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-primary/5 text-primary">
                          <GraduationCap
                            className="size-5"
                            strokeWidth={1.5}
                            aria-hidden="true"
                          />
                        </div>
                        <div className="min-w-0 space-y-1.5 break-words">
                          <p className="text-base font-semibold tracking-tight">
                            {degree?.display || qualification.degree.code}
                          </p>
                          {qualification.issuer && (
                            <p className="text-sm text-soft-foreground">
                              {qualification.issuer}
                            </p>
                          )}
                          {qualification.registration_number && (
                            <p className="pt-1 text-xs text-soft-foreground">
                              {t("registration_number")}
                              <span
                                className="mx-2 text-border"
                                aria-hidden="true"
                              >
                                /
                              </span>
                              <span className="font-mono text-foreground">
                                {qualification.registration_number}
                              </span>
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <UserProfileEmptyState
                  icon={GraduationCap}
                  title={t("profile_no_qualifications")}
                  description={t("profile_qualifications_empty_description")}
                  actionLabel={t("profile_add_qualification")}
                  onAction={onEdit ? () => onEdit("qualification") : undefined}
                />
              )}
            </UserProfileSection>
          )}
          <div className="order-5">
            <RoleOrgAccessSummary
              userId={userData.id}
              memberships={userData.role_orgs || []}
            />
          </div>
        </div>
        <div className="contents md:block md:space-y-8 md:border-l md:border-border md:pl-8">
          <UserProfileSection
            title={t("contact")}
            className="order-2"
            icon={Mail}
            action={editAction(t("contact_info"), "contact")}
          >
            <ContactInfoDetails user={userData} />
          </UserProfileSection>
          {!userData.is_service_account && (
            <UserProfileSection
              title={t("profile_communication")}
              className="order-4"
              icon={Languages}
              action={
                userData.communication?.length
                  ? editAction(t("profile_communication"), "communication")
                  : undefined
              }
            >
              {userData.communication?.length ? (
                <ul className="divide-y divide-border/70">
                  {userData.communication.map((entry) => (
                    <li
                      key={entry.language.code}
                      className="space-y-2 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">
                          {languageName(entry.language.code)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs text-soft-foreground">
                        {entry.proficiency && (
                          <Badge
                            variant="secondary"
                            className="text-xs font-normal"
                          >
                            {t(`profile_cefr_${entry.proficiency}`)}
                          </Badge>
                        )}
                        {entry.preferred && (
                          <span className="inline-flex items-center gap-1.5 text-primary">
                            <Star
                              className="size-3 fill-primary/15"
                              aria-hidden="true"
                            />
                            {t("profile_preferred_language")}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <UserProfileEmptyState
                  icon={Languages}
                  title={t("profile_no_languages")}
                  description={t("profile_languages_empty_description")}
                  actionLabel={t("profile_add_language")}
                  onAction={onEdit ? () => onEdit("communication") : undefined}
                />
              )}
            </UserProfileSection>
          )}
          {userData.geo_organization && (
            <UserProfileSection
              title={t("location_info")}
              icon={MapPin}
              className="order-6"
            >
              <GeoOrgDetails user={userData} />
            </UserProfileSection>
          )}
        </div>
      </div>
      <PLUGIN_Component
        __name="UserProfileSections"
        user={userData}
        isOwnProfile={authUser.username === userData.username}
      />
      {authUser.username === userData.username && (
        <UserProfileSection
          title={t("software_update_cache")}
          icon={RefreshCw}
          description={t("check_for_available_update")}
        >
          <UserSoftwareUpdate />
        </UserProfileSection>
      )}
    </div>
  );
}

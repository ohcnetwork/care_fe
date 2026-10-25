import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
import { Link, usePath } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/careui/button";
import { Frame, FrameHeader, FramePanel } from "@/components/careui/frame";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/careui/item";
import { Skeleton } from "@/components/ui/skeleton";

import { getReferralDetailUrl } from "@/components/Referral/referralNavigation";
import { ReferralRoute } from "@/components/Referral/ReferralRoute";
import { ReferralStatusBadge } from "@/components/Referral/ReferralStatusBadge";

import referralReferencesApi from "@/types/emr/referral/referralReferencesApi";
import query from "@/Utils/request/query";
import { HTTPError } from "@/Utils/request/types";

interface ReferralReferencesProps {
  referralId: string;
}

export function ReferralReferences({ referralId }: ReferralReferencesProps) {
  const { t } = useTranslation();
  const path = usePath();
  const sourceUrl = (path ?? "") + window.location.search;
  const references = useQuery({
    queryKey: ["referrals", referralId, "references"],
    queryFn: query(referralReferencesApi.list, {
      pathParams: { referralId },
      silent: true,
    }),
    retry: false,
  });
  const denied =
    references.error instanceof HTTPError && references.error.status === 403;

  if (references.isSuccess && references.data.results.length === 0) return null;

  return (
    <section
      className="careui min-w-0"
      aria-label={t("referral_references")}
      data-cy="referral-references"
    >
      <Frame className="min-w-0 border-cui-border">
        <FrameHeader>
          <h2 className="text-base font-semibold text-cui-foreground">
            {t("referral_references")}
          </h2>
        </FrameHeader>
        {references.isPending ? (
          <FramePanel className="border-cui-border shadow-none">
            <div role="status" aria-label={t("loading")} className="py-2">
              <Skeleton className="h-5 w-2/3 bg-cui-muted" />
            </div>
          </FramePanel>
        ) : references.isError ? (
          <FramePanel className="border-cui-border shadow-none">
            <div className="flex flex-wrap items-center gap-3" role="alert">
              <p className="flex items-center gap-2 text-sm text-cui-muted-foreground">
                {denied && (
                  <LockKeyhole aria-hidden="true" className="size-4 shrink-0" />
                )}
                {t(
                  denied
                    ? "referral_references_read_denied"
                    : "referral_references_load_failed",
                )}
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={references.isFetching}
                onClick={() => void references.refetch()}
              >
                {t("retry")}
              </Button>
            </div>
          </FramePanel>
        ) : (
          <FramePanel className="min-w-0 border-cui-border p-1 shadow-none">
            <ItemGroup className="gap-0 divide-y divide-cui-border has-data-[size=sm]:gap-0">
              {references.data.results.map((referral) => (
                <div key={referral.id} role="listitem" className="min-w-0">
                  <Item
                    asChild
                    size="sm"
                    className="min-w-0 p-3 hover:bg-cui-accent focus-visible:bg-cui-accent focus-visible:ring-inset"
                  >
                    <Link href={getReferralDetailUrl(referral.id, sourceUrl)}>
                      <ItemContent className="min-w-0 gap-3">
                        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                          <div className="min-w-0 flex-1 basis-40 space-y-1">
                            <ItemTitle className="block w-full max-w-full line-clamp-none wrap-anywhere font-semibold text-cui-foreground group-hover/item:underline">
                              {referral.title}
                            </ItemTitle>
                            <ItemDescription className="line-clamp-none wrap-anywhere">
                              {referral.availability_name}
                            </ItemDescription>
                          </div>
                          <ItemActions className="shrink-0 flex-wrap gap-2">
                            <ReferralStatusBadge status={referral.status} />
                            <ArrowUpRight
                              className="size-4 shrink-0 text-cui-muted-foreground"
                              aria-hidden="true"
                            />
                          </ItemActions>
                        </div>
                        <ReferralRoute
                          source={referral.source}
                          destination={referral.destination}
                        />
                      </ItemContent>
                    </Link>
                  </Item>
                </div>
              ))}
            </ItemGroup>
          </FramePanel>
        )}
      </Frame>
    </section>
  );
}

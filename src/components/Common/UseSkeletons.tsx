import { useTranslation } from "react-i18next";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import Page from "@/components/Common/Page";

// import { CardTitle, CardDescription } from "@/components/ui/card";
export const EncounterListSkeleton = () => {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="hover:shadow-lg transition-shadow">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Separator className="my-2" />
              <div className="flex justify-end">
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
};

export const FacilityOrganizationSkeleton = () => {
  return (
    <div className="px-6 py-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-8 w-48 self-end" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="relative space-y-4">
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const OrganizationIndexSkeleton = () => {
  const { t } = useTranslation();
  return (
    <Page title={t("organizations")}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="relative">
            <CardHeader>
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-8 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </Page>
  );
};

export const OrganizationLayoutSkeleton = () => {
  return (
    <div className="p-4">
      <Skeleton className="h-8 w-48 mb-4" />
      <Skeleton className="h-4 w-24 mb-4" />
      <div className="flex space-x-4 mb-4">
        {[...Array(4)].map((_, index) => (
          <Skeleton key={index} className="h-8 w-24" />
        ))}
      </div>
      <Skeleton className="h-6 w-40 mb-4" />
      <Skeleton className="h-8 w-1/4 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex space-x-4">
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-6 w-1/2" />
                  <div className="flex space-x-4">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <Skeleton className="h-6 w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const PatientListSkeleton = ({ title }: { title: string }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[100px] w-full" />
      </CardContent>
    </Card>
  );
};

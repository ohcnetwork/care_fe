import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const UserListSkeleton = () => (
  //   <div className="overflow-x-auto rounded-lg border border-gray-200">
  //     <table className="relative min-w-full divide-y divide-gray-200">

  <tr className="hover:bg-gray-50">
    <td className="sticky left-0 z-10 bg-white px-4 py-4 lg:pr-20">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex flex-col">
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </td>
    <td className="flex-0 px-6 py-4">
      <Skeleton className="h-4 w-16" />
    </td>
    <td className="px-10 py-4 text-sm">
      <Skeleton className="h-4 w-20" />
    </td>
    <td className="px-4 py-4 text-sm whitespace-nowrap">
      <Skeleton className="h-4 w-24" />
    </td>
    <td className="px-4 py-4">
      <Skeleton className="h-8 w-20 rounded-md" />
    </td>
  </tr>
);

const UserCardSkeleton = () => (
  <Card className="h-full">
    <CardContent className="p-4 sm:p-6">
      <div className="flex flex-col h-full gap-4">
        <div className="flex gap-4">
          <Skeleton className="h-12 w-12 sm:h-16 sm:w-16 rounded-full flex-shrink-0" />
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex flex-col gap-1">
              <Skeleton className="h-5 w-32 mb-1" />
              <div className="flex items-center gap-2 flex-wrap">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        <div className="mt-auto pt-2">
          <Skeleton className="h-8 w-full rounded-md" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const OrganizationCardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const FacilityCardSkeleton = () => (
  <Card className="overflow-hidden">
    <div className="h-48 bg-gray-200 animate-pulse" />
    <CardContent className="p-6">
      <div className="flex items-center space-x-4">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const EncounterCardSkeleton = () => (
  <Card className="hover:shadow-lg transition-shadow">
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
);
const PatientCardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center space-x-4">
        <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
        </div>
      </div>
    </CardContent>
  </Card>
);
interface SkeletonLoadingProps {
  count: number;
  element:
    | "UserCard"
    | "UserList"
    | "PatientCard"
    | "FacilityCard"
    | "OrganizationCard"
    | "EncounterCard";
}
export const SkeletonLoading: React.FC<SkeletonLoadingProps> = ({
  count,
  element,
}) => {
  const renderSkeleton = () => {
    switch (element) {
      case "UserCard":
        return <UserCardSkeleton />;
      case "UserList":
        return <UserListSkeleton />;
      case "PatientCard":
        return <PatientCardSkeleton />;
      case "FacilityCard":
        return <FacilityCardSkeleton />;
      case "OrganizationCard":
        return <OrganizationCardSkeleton />;
      case "EncounterCard":
        return <EncounterCardSkeleton />;
      default:
        return null;
    }
  };

  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="skeleton-item">
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
};

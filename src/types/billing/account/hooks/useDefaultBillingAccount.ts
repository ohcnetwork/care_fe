import {
  AccountBase,
  AccountBillingStatus,
  AccountStatus,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { useQuery } from "@tanstack/react-query";

interface Options {
  patientId: string | undefined;
  facilityId: string;
}

export default function usePatientDefaultBillingAccount({
  patientId,
  facilityId,
}: Options) {
  return useQuery({
    queryKey: ["accounts", patientId],
    queryFn: query(accountApi.listAccount, {
      pathParams: { facilityId },
      queryParams: {
        patient: patientId,
        limit: 1,
        offset: 0,
        status: AccountStatus.active,
        billing_status: AccountBillingStatus.open,
      },
    }),
    enabled: !!patientId,
    select: (data: PaginatedResponse<AccountBase>) => data.results[0],
  });
}

import { TokenStatus } from "@/types/tokens/token/token";
import { TokenQueueSummary } from "@/types/tokens/tokenQueue/tokenQueue";

export function getTokenQueueStatusCount(
  summary: TokenQueueSummary,
  ...statuses: TokenStatus[]
) {
  return statuses.reduce((acc, status) => {
    Object.values(summary).forEach((category) => {
      acc += category[status] ?? 0;
    });
    return acc;
  }, 0);
}

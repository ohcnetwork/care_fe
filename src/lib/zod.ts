import i18n from "@/i18n";
import { z } from "zod";

export function initZod() {
  // Backwards compatibility for zod error messages (from zod v3 to v4)
  z.config({
    customError: (issue) => {
      if (issue.input === undefined) {
        return i18n.t("required");
      }
    },
  });
}

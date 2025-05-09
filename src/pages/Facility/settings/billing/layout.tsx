import { Menu } from "lucide-react";
import { useRoutes } from "raviger";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import { DiscountComponentSettings } from "@/pages/Facility/settings/billing/discount/DiscountComponentSettings";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";

const routes = {
  "/discounts": () => <DiscountComponentSettings />,
  "*": () => <ErrorPage />,
};

const sidebarNavItems = [
  {
    category: "Discount",
    items: [
      {
        title: "Discount Codes",
        href: "/discount-codes",
      },
      {
        title: "Discount Components",
        href: "/discounts",
      },
    ],
  },
  {
    category: "Tax",
    items: [
      {
        title: "Tax Codes",
        href: "/tax-codes",
      },
      {
        title: "Tax Components",
        href: "/tax-components",
      },
    ],
  },
];

export function BillingSettingsLayout() {
  const { t } = useTranslation();
  const facility = useCurrentFacility();

  const route = useRoutes(routes, {
    basePath: `/facility/${facility?.id}/settings/billing`,
    routeProps: { facilityId: facility?.id },
  });

  return (
    <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
      <div className="flex items-center justify-between mb-4 md:hidden">
        <h2 className="text-xl font-semibold">{t("billing")}</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            {sidebarNavItems.map((category) => (
              <DropdownMenuGroup key={category.category}>
                <div className="px-2 py-1.5 text-sm font-semibold">
                  {category.category}
                </div>
                {category.items.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link
                      href={`/billing${item.href}`}
                      className="w-full cursor-pointer"
                    >
                      {item.title}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <aside className="fixed top-14 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
        <div className="p-4">
          <h2 className="mb-4 text-2xl font-semibold tracking-tight">
            {t("billing")}
          </h2>
          <nav className="flex flex-col space-y-1">
            {sidebarNavItems.map((category) => (
              <div key={category.category} className="space-y-2 py-2">
                <h4 className="px-2 text-lg font-semibold tracking-tight">
                  {category.category}
                </h4>
                <div className="space-y-1">
                  {category.items.map((item) => (
                    <Link
                      key={item.href}
                      href={`/billing${item.href}`}
                      className={cn(
                        buttonVariants({ variant: "ghost" }),
                        "w-full justify-start",
                      )}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>
      <main className="relative py-6 lg:gap-10 lg:py-8">
        <div className="mx-auto w-full min-w-0">{route}</div>
      </main>
    </div>
  );
}

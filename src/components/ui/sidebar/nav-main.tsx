import { useAtom } from "jotai";
import { ChevronRight } from "lucide-react";
import { Link, usePath } from "raviger";
import {
  ComponentProps,
  Fragment,
  ReactNode,
  useEffect,
  useState,
} from "react";

import { navExpansionAtom } from "@/atoms/navExpansionAtom";
import { cn } from "@/lib/utils";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { Avatar } from "@/components/Common/Avatar";

const normalizeNavigationPath = (url: string) =>
  url.split(/[?#]/)[0].replace(/\/+$/, "");

const isNavigationActive = (path: string | null, url: string) => {
  if (path === null) return false;
  const currentPath = normalizeNavigationPath(path);
  const targetPath = normalizeNavigationPath(url);
  return (
    currentPath === targetPath ||
    (targetPath !== "" && currentPath.startsWith(`${targetPath}/`))
  );
};

const hasActiveChild = (link: NavigationLink, path: string | null) =>
  !!link.children?.some(
    (child) =>
      child.visibility !== false && isNavigationActive(path, child.url),
  );

export interface NavigationLink {
  /** Start a section before this item; null starts an unlabeled section. */
  section?: string | null;
  header?: string;
  headerIcon?: ReactNode;
  name: string;
  url: string;
  icon?: ReactNode;
  visibility?: boolean;
  children?: NavigationLink[];
}

interface NavLinkProps extends ComponentProps<typeof Link> {
  href: string;
  ariaLabel: string;
  isActive: boolean;
  children: ReactNode;
}

function NavLink({
  href,
  ariaLabel,
  isActive,
  className,
  onClick,
  children,
  ...props
}: NavLinkProps) {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Link
      {...props}
      href={href}
      basePath="/"
      aria-label={ariaLabel}
      aria-current={isActive ? "page" : undefined}
      data-active={isActive}
      className={className}
      onClick={(event) => {
        // Preserve native open-in-new-tab/window behavior.
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        onClick?.(event);
        if (event.defaultPrevented) return;

        const current = window.location;
        const isSelected = /[?#]/.test(href)
          ? href === `${current.pathname}${current.search}${current.hash}`
          : normalizeNavigationPath(href) ===
            normalizeNavigationPath(current.pathname);

        if (isSelected) {
          event.preventDefault();
          if (isMobile) setOpenMobile(false);
        }
      }}
    >
      {children}
    </Link>
  );
}

interface NavMainProps {
  links: NavigationLink[];
  label?: string;
}

interface NavigationSection {
  label?: string | null;
  links: NavigationLink[];
}

function groupNavigationLinks(links: NavigationLink[], label?: string) {
  const sections: NavigationSection[] = [];
  let currentSection: NavigationSection = { label, links: [] };

  for (const link of links) {
    if (link.section !== undefined) {
      if (currentSection.links.length) sections.push(currentSection);
      currentSection = { label: link.section, links: [] };
    }

    if (
      link.visibility !== false &&
      (!link.children ||
        link.children.some((child) => child.visibility !== false))
    ) {
      currentSection.links.push(link);
    }
  }

  if (currentSection.links.length) sections.push(currentSection);
  return sections;
}

export function NavMain({ links, label }: NavMainProps) {
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  const path = usePath();
  const sections = groupNavigationLinks(links, label);

  return (
    <>
      {sections.map((section, index) => (
        <Fragment key={section.links[0].url}>
          {index > 0 && (
            <Separator
              variant="inset"
              className="mx-3 data-horizontal:w-auto group-data-[collapsible=icon]:mx-2"
            />
          )}
          <SidebarGroup className={index > 0 ? "pt-0" : undefined}>
            {section.label && (
              <SidebarGroupLabel className="text-[10px] font-semibold tracking-wider uppercase">
                {section.label}
              </SidebarGroupLabel>
            )}
            <SidebarMenu>
              {section.links.map((link) =>
                link.children ? (
                  isCollapsed ? (
                    <SidebarMenuItem key={link.name}>
                      <PopoverMenu link={link} path={path} />
                    </SidebarMenuItem>
                  ) : (
                    <CollapsibleNavItem
                      key={link.name}
                      link={link}
                      path={path}
                    />
                  )
                ) : (
                  <SidebarMenuItem key={link.name}>
                    <SidebarMenuButton
                      asChild
                      tooltip={link.name}
                      isActive={isNavigationActive(path, link.url)}
                    >
                      <NavLink
                        href={link.url}
                        ariaLabel={link.name}
                        isActive={isNavigationActive(path, link.url)}
                      >
                        {link.icon ?? (
                          <Avatar
                            name={link.name}
                            className="size-6 -m-1 rounded-sm"
                          />
                        )}
                        <span
                          className="group-data-[collapsible=icon]:hidden"
                          title={link.name}
                        >
                          {link.name}
                        </span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ),
              )}
            </SidebarMenu>
          </SidebarGroup>
        </Fragment>
      ))}
    </>
  );
}

interface NavGroupProps {
  link: NavigationLink;
  path: string | null;
}

function CollapsibleNavItem({ link, path }: NavGroupProps) {
  const childActive = hasActiveChild(link, path);
  const [storedState, handleOpenChange] = useAtom(navExpansionAtom(link.name));
  const isOpen = storedState ?? childActive;

  useEffect(() => {
    if (childActive) handleOpenChange(true);
  }, [path, childActive, handleOpenChange]);

  return (
    <Collapsible
      asChild
      open={isOpen}
      onOpenChange={handleOpenChange}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            aria-label={link.name}
            tooltip={link.name}
            isActive={childActive && !isOpen}
            className={cn(
              "cursor-pointer",
              childActive && isOpen && "font-medium text-primary",
            )}
          >
            {link.icon ?? (
              <Avatar name={link.name} className="size-6 -m-1 rounded-sm" />
            )}
            <span className="truncate" title={link.name}>
              {link.name}
            </span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90 motion-reduce:transition-none" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {link.children
              ?.filter((child) => child.visibility !== false)
              .map((subItem) => (
                <SidebarMenuSubItem key={subItem.name}>
                  <NavGroupHeading item={subItem} />
                  <SidebarMenuSubButton
                    asChild
                    isActive={isNavigationActive(path, subItem.url)}
                  >
                    <NavLink
                      href={subItem.url}
                      ariaLabel={subItem.name}
                      isActive={isNavigationActive(path, subItem.url)}
                      className="w-full"
                    >
                      <span className="truncate" title={subItem.name}>
                        {subItem.name}
                      </span>
                    </NavLink>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function NavGroupHeading({ item }: { item: NavigationLink }) {
  if (!item.header) return null;
  return (
    <div className="mt-2 flex min-h-8 items-center gap-2 px-2">
      {item.headerIcon}
      <span className="text-sidebar-foreground/70 text-[10px] font-semibold tracking-wider uppercase">
        {item.header}
      </span>
    </div>
  );
}

function PopoverMenu({ link, path }: NavGroupProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <SidebarMenuButton
          aria-label={link.name}
          tooltip={link.name}
          isActive={hasActiveChild(link, path)}
          className="cursor-pointer"
        >
          {link.icon ?? (
            <Avatar name={link.name} className="size-6 -m-1 rounded-sm" />
          )}
        </SidebarMenuButton>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className="w-60 max-h-(--available-height) overflow-y-auto p-1"
        aria-label={link.name}
      >
        <SidebarMenu>
          {link.children
            ?.filter((item) => item.visibility !== false)
            .map((subItem) => (
              <SidebarMenuItem key={subItem.name}>
                <NavGroupHeading item={subItem} />
                <SidebarMenuButton
                  asChild
                  isActive={isNavigationActive(path, subItem.url)}
                >
                  <NavLink
                    href={subItem.url}
                    ariaLabel={subItem.name}
                    isActive={isNavigationActive(path, subItem.url)}
                    onClick={() => setOpen(false)}
                  >
                    <span className="truncate" title={subItem.name}>
                      {subItem.name}
                    </span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </PopoverContent>
    </Popover>
  );
}

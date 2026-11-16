import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  PaginationButton,
  PaginationContent,
  PaginationItem,
  Pagination as PaginationRoot,
} from "@/components/ui/pagination";
import { TooltipComponent } from "@/components/ui/tooltip";

interface PaginationProps {
  data: { totalCount: number };
  onChange: (page: number, rowsPerPage: number) => void;
  defaultPerPage: number;
  cPage: number;
  className?: string;
}
const Pagination = ({
  className = "mx-auto my-4",
  data,
  onChange,
  defaultPerPage,
  cPage,
}: PaginationProps) => {
  const { t } = useTranslation();
  const [rowsPerPage, setRowsPerPage] = useState(3);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (defaultPerPage) {
      setRowsPerPage(defaultPerPage);
    }
    if (cPage) {
      setCurrentPage(parseInt(`${cPage}`));
    }
  }, [defaultPerPage, cPage]);

  const getPageNumbers = () => {
    const totalPage = Math.ceil(data.totalCount / rowsPerPage);
    if (totalPage === 0) return [1];

    const pageNumbers = [];

    if (currentPage === 1 && currentPage === totalPage) {
      pageNumbers.push(currentPage);
    } else if (currentPage === totalPage) {
      let tempPage = currentPage;
      let pageLimit = 3;
      while (tempPage >= 1 && pageLimit > 0) {
        pageNumbers.push(tempPage);
        tempPage--;
        pageLimit--;
      }
    } else {
      pageNumbers.push(currentPage);
      if (currentPage > 1) {
        pageNumbers.push(currentPage - 1);
        if (currentPage + 1 <= totalPage) {
          pageNumbers.push(currentPage + 1);
        }
      } else {
        pageNumbers.push(currentPage + 1);
        if (currentPage + 2 <= totalPage) {
          pageNumbers.push(currentPage + 2);
        }
      }
    }
    return pageNumbers.sort((a, b) => a - b);
  };

  const totalCount = data.totalCount;
  if (!totalCount || totalCount <= rowsPerPage) {
    return null;
  }
  const totalPage = Math.ceil(totalCount / rowsPerPage);
  const pageNumbers = getPageNumbers();

  const goToPage = (page: number) => {
    setCurrentPage(page);
    onChange(page, rowsPerPage);
    const pageContainer = window.document.getElementById("pages");
    pageContainer?.scroll({ top: 0, left: 0 });
  };

  return (
    <PaginationRoot className={className}>
      <PaginationContent className="w-full justify-between sm:w-auto sm:justify-center">
        <PaginationItem className="hidden sm:block">
          <NavButton
            id="first-page"
            tooltip={t("pagination_first_page")}
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft />
          </NavButton>
        </PaginationItem>
        <PaginationItem className="sm:hidden">
          <NavButton
            id="prev-page"
            tooltip={t("pagination_previous_page")}
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft />
          </NavButton>
        </PaginationItem>
        <PaginationItem className="hidden sm:block">
          <NavButton
            id="prev-pages"
            tooltip={t("pagination_previous_page")}
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft />
          </NavButton>
        </PaginationItem>
        {pageNumbers.map((page) => (
          <PaginationItem key={page} className="hidden sm:block">
            <NavButton
              id={`page-${page}`}
              onClick={() => goToPage(page)}
              selected={currentPage === page}
              tooltip={t("pagination_go_to_page", { page })}
            >
              {page}
            </NavButton>
          </PaginationItem>
        ))}
        <PaginationItem className="sm:hidden">
          <NavButton
            id="next-page"
            tooltip={t("pagination_next_page")}
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPage}
          >
            <ChevronRight />
          </NavButton>
        </PaginationItem>
        <PaginationItem className="hidden sm:block">
          <NavButton
            id="next-pages"
            tooltip={t("pagination_next_page")}
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPage}
          >
            <ChevronRight />
          </NavButton>
        </PaginationItem>
        <PaginationItem className="hidden sm:block">
          <NavButton
            id="last-page"
            tooltip={t("pagination_last_page")}
            onClick={() => goToPage(totalPage)}
            disabled={currentPage === totalPage}
          >
            <ChevronsRight />
          </NavButton>
        </PaginationItem>
      </PaginationContent>
    </PaginationRoot>
  );
};

export default Pagination;

interface NavButtonProps {
  id?: string;
  onClick: () => void;
  children: React.ReactNode;
  tooltip: string;
  disabled?: boolean | undefined;
  selected?: boolean | undefined;
}

const NavButton = (props: NavButtonProps) => {
  return (
    <TooltipComponent content={props.tooltip}>
      <PaginationButton
        id={props.id}
        disabled={props.disabled}
        onClick={props.onClick}
        isActive={props.selected}
        aria-label={props.tooltip}
      >
        {props.children}
      </PaginationButton>
    </TooltipComponent>
  );
};

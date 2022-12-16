import { usePath, Link } from "raviger";
import { useState } from "react";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { classNames } from "../../Utils/utils";

const MENU_TAGS: { [key: string]: string } = {
  facility: "Facilities",
  patients: "Patients",
  assets: "Assets",
  sample: "Sample Tests",
  shifting: "Shiftings",
  resource: "Resources",
  external_results: "External Results",
  users: "Users",
  notice_board: "Notice Board",
};

const capitalize = (string: string) => {
  return string
    .replace(/[_-]/g, " ")
    .split(" ")
    .reduce(
      (acc, word) => acc + (word[0]?.toUpperCase() || "") + word.slice(1) + " ",
      ""
    )
    .trim();
};

export default function Breadcrumbs(props: any) {
  const { replacements } = props;
  const path = usePath();
  const crumbs = path
    ?.slice(1)
    .split("/")
    .map((field, i) => {
      return {
        name:
          replacements[field]?.name || MENU_TAGS[field] || capitalize(field),
        uri:
          replacements[field]?.uri ||
          path
            .split("/")
            .slice(0, i + 2)
            .join("/"),
        style: replacements[field]?.style || "",
      };
    });

  const [showFullPath, setShowFullPath] = useState(false);

  return (
    <div className="w-full">
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center space-x-1">
          <li>
            <div>
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                <CareIcon className="care-l-estate mr-1 text-lg" />
                <span className="sr-only">Home</span>
              </Link>
            </div>
          </li>
          {!showFullPath && crumbs && crumbs.length > 2 && (
            <li>
              <div className="flex items-center cursor-pointer">
                <svg
                  className="shrink-0 h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z"></path>
                </svg>
                <span
                  onClick={() => setShowFullPath(true)}
                  className="inline-flex items-center px-2.5 py-1 ml-1 mt-0.5 rounded-full text-xs font-medium bg-gray-500 hover:bg-gray-700"
                >
                  <svg
                    className="mx-0.25 h-1.5 w-1.5 text-white"
                    fill="currentColor"
                    viewBox="0 0 8 8"
                  >
                    <circle cx="4" cy="4" r="3"></circle>
                  </svg>
                  <svg
                    className="mx-0.25 h-1.5 w-1.5 text-white"
                    fill="currentColor"
                    viewBox="0 0 8 8"
                  >
                    <circle cx="4" cy="4" r="3"></circle>
                  </svg>
                  <svg
                    className="mx-0.25 h-1.5 w-1.5 text-white"
                    fill="currentColor"
                    viewBox="0 0 8 8"
                  >
                    <circle cx="4" cy="4" r="3"></circle>
                  </svg>
                </span>
              </div>
            </li>
          )}
          {crumbs?.slice(showFullPath ? 0 : -2).map((crumb: any) => {
            return (
              crumb.name && (
                <li
                  key={crumb.name}
                  className={classNames(
                    "text-sm font-medium text-gray-500 hover:text-gray-700 cursor-pointer",
                    crumb.style
                  )}
                >
                  <div className="flex items-center">
                    <svg
                      className="shrink-0 h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z"></path>
                    </svg>
                    <Link
                      href={crumb.uri}
                      className="ml-1 block text-gray-500 hover:text-gray-700"
                    >
                      {crumb.name.match(/^\w{8}-(\w{4}-){3}\w{12}$/) ? (
                        <div>
                          <i className="fas fa-hashtag fa-lg mr-1" />
                          <span>{crumb.name.slice(0, 13) + "..."}</span>
                        </div>
                      ) : (
                        <div className="truncate w-20 md:w-full">
                          <span>{crumb.name}</span>
                        </div>
                      )}
                    </Link>
                  </div>
                </li>
              )
            );
          })}
        </ol>
      </nav>
    </div>
  );
}

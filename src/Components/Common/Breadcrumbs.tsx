import { useState } from "react";

export default function Breadcrumbs(props: any) {
  const { crumbs } = props;
  const [showFullPath, setShowFullPath] = useState(false);

  return (
    <div className="max-w-lg">
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-1">
          <li>
            <div>
              <a href="/" className="text-gray-500 hover:text-gray-700">
                <svg
                  className="flex-shrink-0 h-5 w-5"
                  x-description="Heroicon name: solid/home"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                </svg>
                <span className="sr-only">Home</span>
              </a>
            </div>
          </li>
          {!showFullPath && crumbs.length > 2 && (
            <li>
              <div className="flex items-center">
                <svg
                  className="flex-shrink-0 h-5 w-5 text-gray-300"
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
          {crumbs.slice(showFullPath ? 0 : -2).map((crumb: any) => {
            return (
              crumb && (
                <li>
                  <div className="flex items-center">
                    <svg
                      className="flex-shrink-0 h-5 w-5 text-gray-300"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z"></path>
                    </svg>
                    <a
                      href={crumb.uri}
                      className="ml-1 text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      {crumb.name}
                    </a>
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

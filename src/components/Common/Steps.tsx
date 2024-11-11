import CareIcon from "@/CAREUI/icons/CareIcon";

export interface Step {
  id: number;
  name: string;
  onClick: () => void;
  status: "complete" | "current" | "upcoming";
  disabled?: boolean;
}

export default function Steps(props: { steps: Step[] }) {
  return (
    <nav aria-label="Progress">
      <ol
        role="list"
        className="divide-y divide-secondary-300 rounded-md border border-secondary-300 md:flex md:divide-y-0"
      >
        {props.steps.map((step, stepIdx) => (
          <li key={step.name} className="relative md:flex md:flex-1">
            {step.status === "complete" ? (
              <a
                onClick={() => {
                  !step.disabled && step.onClick();
                }}
                className={`group flex w-full items-center ${
                  step.disabled ? "cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <span className="flex items-center px-6 py-4 text-sm font-medium">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-600 group-hover:bg-green-800">
                    <CareIcon
                      icon="l-check"
                      className="h-6 w-6 text-white"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="ml-4 text-sm font-medium text-secondary-900">
                    {step.name}
                  </span>
                </span>
              </a>
            ) : step.status === "current" ? (
              <a
                onClick={() => {
                  !step.disabled && step.onClick();
                }}
                className={`flex items-center px-6 py-4 text-sm font-medium ${
                  step.disabled ? "cursor-not-allowed" : "cursor-pointer"
                }`}
                aria-current="step"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-green-600">
                  <span className="text-green-600">{step.id}</span>
                </span>
                <span className="ml-4 text-sm font-medium text-green-600">
                  {step.name}
                </span>
              </a>
            ) : (
              <a
                onClick={() => {
                  !step.disabled && step.onClick();
                }}
                className={`group flex items-center ${
                  step.disabled ? "cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <span className="flex items-center px-6 py-4 text-sm font-medium">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-secondary-300 group-hover:border-secondary-400">
                    <span className="text-secondary-500 group-hover:text-secondary-900">
                      {step.id}
                    </span>
                  </span>
                  <span className="ml-4 text-sm font-medium text-secondary-500 group-hover:text-secondary-900">
                    {step.name}
                  </span>
                </span>
              </a>
            )}

            {stepIdx !== props.steps.length - 1 ? (
              <>
                <div
                  className="absolute right-0 top-0 hidden h-full w-5 md:block"
                  aria-hidden="true"
                >
                  <svg
                    className="h-full w-full text-secondary-300"
                    viewBox="0 0 22 80"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0 -2L20 40L0 82"
                      vectorEffect="non-scaling-stroke"
                      stroke="currentcolor"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </>
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

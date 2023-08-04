export default function Table(props: {
  headings: string[];
  rows: (string | JSX.Element)[][];
}) {
  return (
    <div
      className="gap-3"
      style={{
        display: "grid",
        gridTemplateRows: `repeat(${props.rows.length + 1}, minmax(0, 1fr))`,
        overflowX: "auto",
        minWidth: "1000px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${props.headings.length}, minmax(0, 1fr))`,
        }}
        className="h-fit rounded-sm border border-[#D2D6DC]"
      >
        {props.headings.map((heading, i) => {
          if (i === 0) {
            return (
              <div className="flex min-w-[24px] items-center py-[14px] pl-4 text-sm font-medium text-[#808080]">
                {heading}
              </div>
            );
          }
          return (
            <div className="flex min-w-[24px] items-center justify-center py-[14px] text-center text-sm font-medium text-[#808080]">
              {heading}
            </div>
          );
        })}
      </div>

      {props.rows.map((row) => {
        return (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${props.headings.length}, minmax(0, 1fr))`,
              overflowX: "auto",
              minWidth: "1000px",
            }}
            className="rounded-sm border border-[#D2D6DC]"
          >
            {row.map((item, i) => {
              if (i === 0) {
                return (
                  <div className="flex min-w-[24px] items-center py-[14px] pl-4 text-sm font-medium text-[#808080]">
                    {item}
                  </div>
                );
              }
              return (
                <div className="flex min-w-[24px] items-center justify-center py-[14px] text-center text-sm font-bold text-gray-900">
                  <>{item}</>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

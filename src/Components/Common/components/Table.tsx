export default function Table(props: {
  headings: string[];
  rows: (string | JSX.Element)[][];
}) {
  return (
    <div
      className="grid min-w-[1000px] gap-3 overflow-x-auto"
      style={{
        gridTemplateRows: `repeat(${props.rows.length + 1}, minmax(0, 1fr))`,
      }}
    >
      <div
        className="grid h-fit rounded-sm border border-[#D2D6DC]"
        style={{
          gridTemplateColumns: `repeat(${props.headings.length}, minmax(0, 1fr))`,
        }}
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
            <div
              className="flex min-w-[24px] items-center justify-center py-[14px] text-center text-sm font-medium text-[#808080]"
              key={heading}
            >
              {heading}
            </div>
          );
        })}
      </div>

      {props.rows.map((row) => {
        return (
          <div
            className="grid min-w-[1000px] overflow-x-auto rounded-sm border border-[#D2D6DC]"
            style={{
              gridTemplateColumns: `repeat(${props.headings.length}, minmax(0, 1fr))`,
            }}
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
                <div className="flex min-w-[24px] items-center justify-center py-[14px] text-center text-sm font-bold text-secondary-900">
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

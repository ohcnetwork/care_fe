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
        className="border border-[#D2D6DC] rounded-sm h-fit"
      >
        {props.headings.map((heading, i) => {
          if (i === 0) {
            return (
              <div className="text-sm font-medium text-[#808080] flex items-center py-[14px] pl-4 min-w-[24px]">
                {heading}
              </div>
            );
          }
          return (
            <div className="text-sm font-medium text-[#808080] flex justify-center items-center text-center py-[14px] min-w-[24px]">
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
            className="border border-[#D2D6DC] rounded-sm"
          >
            {row.map((item, i) => {
              if (i === 0) {
                return (
                  <div className="text-sm text-[#808080] font-medium flex items-center py-[14px] pl-4 min-w-[24px]">
                    {item}
                  </div>
                );
              }
              return (
                <div className="text-sm text-gray-900 font-bold flex justify-center items-center text-center py-[14px] min-w-[24px]">
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

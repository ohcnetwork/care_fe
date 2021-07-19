let str = React.string

@react.component
let make = (~leftMain, ~rightMain, ~rightSub, ~noBorder=false) => {
  <div className={"flex justify-between items-center " ++ (noBorder ? "" : "border-b-4")}>
    <div className="text-xl font-bold text-gray-800 pt-2"> {str(leftMain)} </div>
    <div className="flex items-center text-primary-500">
      <div className="text-sm font-bold pt-3"> {str(rightSub)} </div>
      <div className="text-4xl font-bold ml-2"> {str(rightMain)} </div>
    </div>
  </div>
}

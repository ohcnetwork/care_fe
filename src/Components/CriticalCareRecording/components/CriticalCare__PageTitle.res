let str = React.string
@val @scope(("window", "history")) external goBack: int => () = "go"

@react.component
let make = (~title: string) => {
	<div className="p-6">
		<button className="text-lg" onClick={(_) => goBack(-1)}><i className="fas fa-arrow-left"></i>{str("  Go Back")}</button>
		<h2>{str(title)}</h2>
	</div>
}

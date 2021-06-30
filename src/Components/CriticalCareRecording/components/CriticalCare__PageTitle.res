let str = React.string
@val @scope(("window", "history")) external goBack: int => () = "go"

@react.component
let make = (~title: string) => {
	<div className="py-6">
		<h2>{str(title)}</h2>
	</div>
}

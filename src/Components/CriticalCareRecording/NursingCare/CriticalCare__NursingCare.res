let str = React.string

@react.component
export make = () => {
	<>
		<CriticalCare__PageTitle title="Nursing Care" />
		{str("Nursing care")}
	</>
}

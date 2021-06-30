let str = React.string


let handleSubmit = (handleDone, state) => {
	handleDone(state)
}
// PO2(mmHg)
// PCO2(mmHg)
// pH
// HCO3(mmol/L)
// Base Excess(mmol/L)
// Lactate(mmol/L)
// Sodium(mmol/L)
// Potassium(mmol/L)
type action =
|	SetPO2(string)
| SetPCO2(string)
|	SetpH(string)
|	SetHCO3(string)
|	SetBaseExcess(string)
|	SetLactate(string)
|	SetSodium(string)
|	SetPotassium(string)

let reducer = (state, action) => {
	switch action {
		|	SetPO2(po2) => {...state, ABGAnalysisEditorTypes.po2: po2}
		| SetPCO2(pco2) => {...state, ABGAnalysisEditorTypes.pco2: pco2}
		|	SetpH(pH) => {...state, ABGAnalysisEditorTypes.pH: pH}
		|	SetHCO3(hco3) => {...state, ABGAnalysisEditorTypes.hco3: hco3}
		|	SetBaseExcess(baseExcess) => {...state, ABGAnalysisEditorTypes.baseExcess: baseExcess}
		|	SetLactate(lactate) => {...state, ABGAnalysisEditorTypes.lactate: lactate}
		|	SetSodium(sodium) => {...state, ABGAnalysisEditorTypes.sodium: sodium}
		|	SetPotassium(potassium) => {...state, ABGAnalysisEditorTypes.potassium: potassium}
	}
}

let getFieldValue = (event) => {
	ReactEvent.Form.target(event)["value"]
}

@react.component
let make = (~handleDone, ~initialState) => {
	open MaterialUi
	let (state, send) = React.useReducer(reducer, initialState)
	<div>
		<CriticalCare__PageTitle title="Arterial Blood Gas Analysis" />
		<div className="my-4">
			<InputLabel htmlFor="po2">{str("PO2")}</InputLabel>
			<TextField
					name="po2"
					variant=#Outlined
					margin=#Dense
					_type="text"
					value={TextField.Value.string(state.po2)}
					onChange={(event) => send(SetPO2(getFieldValue(event)))}
					className="w-full"
					id="po2"
				/>
		</div>

		<button className="flex w-full bg-blue-600 text-white p-2 text-lg hover:bg-blue-800 justify-center items-center rounded-md" onClick={(_) => handleSubmit(handleDone, state)}>{str("Done")}</button>
	</div>
}

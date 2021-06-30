let str = React.string
@val external document: {..} = "document"
%%raw(`import("./styles.css")`)


type editor =
| NeurologicalMonitoringEditor
| HemodynamicParametersEditor
| VentilatorParametersEditor
| ArterialBloodGasAnalysisEditor
| BloodSugarEditor
| IOBalanceEditor
| DialysisEditor
| PressureSoreEditor
| NursingCareEditor

type state = {
	visibleEditor: option<editor>,
	nursingCare: NursingCareTypes.t

}

type action =
| ShowEditor(editor)
| CloseEditor
| SetNursingCare(NursingCareTypes.t)

let showEditor = (editor, send) => {
	send(ShowEditor(editor))
}

let editor = (state, send) => {
	switch state.visibleEditor {
		| Some(editor) => {
			<div id="editor">
			{switch editor {
				| NeurologicalMonitoringEditor
				| HemodynamicParametersEditor
				| VentilatorParametersEditor => <CriticalCare__VentilatorParametersEditor />
				| ArterialBloodGasAnalysisEditor
				| BloodSugarEditor
				| IOBalanceEditor
				| DialysisEditor
				| PressureSoreEditor
				| NursingCareEditor => <CriticalCare__NursingCare initialState={state.nursingCare} handleDone={(data) => send(SetNursingCare(data))} />
			}}
			</div>
		}
		| None => React.null
	}
}



let editorToggle = (editorName, text, send) => {
	<div id="editorToggle" className="w-3/4 border-2 px-4 py-6 mx-auto my-4 cursor-pointer" onClick={(_) => showEditor(editorName, send)}>
		{str(text)}
	</div>
}

let reducer = (state, action) => {
switch action {
| ShowEditor(editor) => {...state, visibleEditor: Some(editor)}
| CloseEditor => {...state, visibleEditor: None}
| SetNursingCare(nursingCare) => {...state, nursingCare: nursingCare}
}
}

let initialState = {
	visibleEditor: None,
	nursingCare: NursingCareTypes.init,
}

@react.component
export make = () => {
	let (state, send) = React.useReducer(
    reducer,
    initialState,
  )

	React.useEffect1(() => {
		switch state.visibleEditor {
		| Some(_) =>
		document["getElementById"]("editor")["scrollIntoView"]()
		| None => document["getElementById"]("closeEditor")["scrollIntoView"]()
		}
	}, [state.visibleEditor])

	<div>
		<div className="w-3/4 mx-auto my-4">
		<button id="closeEditor" onClick={(_) => send(CloseEditor)}>{str("Close All")}</button>
		</div>
		{editorToggle(NeurologicalMonitoringEditor, "Neurological Monitoring",  send)}
		{editorToggle(HemodynamicParametersEditor, "Hemodynamic Parameters",  send)}
		{editorToggle(VentilatorParametersEditor, "Ventilator Parameters",  send)}
		{editorToggle(ArterialBloodGasAnalysisEditor, "Arterial Blood Gas Analysis (ABG)",  send)}
		{editorToggle(BloodSugarEditor, "Blood Sugar",  send)}
		{editorToggle(IOBalanceEditor, "I/O Balance",  send)}
		{editorToggle(DialysisEditor, "Dialysis",  send)}
		{editorToggle(PressureSoreEditor, "Pressure Sore",  send)}
		{editorToggle(NursingCareEditor, "Nursing Care",  send)}
		<div className="w-3/4 mx-auto my-4">
			{editor(state, send)}
		</div>
	</div>
}

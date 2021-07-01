let str = React.string

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
	nursingCare: NursingCareTypes.t,
	neurologicalMonitoring: NeurologicalMonitoringTypes.t,
}

type action =
| ShowEditor(editor)
| CloseEditor
| SetNursingCare(NursingCareTypes.t)
| SetNeurologicalMonitoring(NeurologicalMonitoringTypes.t)

let showEditor = (editor, send) => {
	send(ShowEditor(editor))
}

let editor = (state, send) => {
	switch state.visibleEditor {
		| Some(editor) => {
			switch editor {
				| NeurologicalMonitoringEditor => <CriticalCare__NeurologicalMonitoring initialState={state.neurologicalMonitoring} handleDone={(data) => send(SetNeurologicalMonitoring(data))}/>
				| HemodynamicParametersEditor
				| VentilatorParametersEditor => <CriticalCare__VentilatorParametersEditor />
				| ArterialBloodGasAnalysisEditor
				| BloodSugarEditor
				| IOBalanceEditor
				| DialysisEditor
				| PressureSoreEditor
				| NursingCareEditor => <CriticalCare__NursingCare initialState={state.nursingCare} handleDone={(data) => send(SetNursingCare(data))} />
			}
		}
		| None => React.null
	}
}



let editorToggle = (editorName, text, send) => {
	<div id="editor" className="w-3/4 border-2 px-4 py-6 mx-auto my-4 cursor-pointer" onClick={(_) => showEditor(editorName, send)}>
		{str(text)}
	</div>
}

let reducer = (state, action) => {
switch action {
| ShowEditor(editor) => {...state, visibleEditor: Some(editor)}
| CloseEditor => {...state, visibleEditor: None}
| SetNursingCare(nursingCare) => {...state, nursingCare: nursingCare}
| SetNeurologicalMonitoring(neurologicalMonitoring) => {...state, neurologicalMonitoring: neurologicalMonitoring}
}
}

let initialState = {
	visibleEditor: None,
	nursingCare: NursingCareTypes.init,
	neurologicalMonitoring: NeurologicalMonitoringTypes.init,

}

@react.component
export make = () => {
	let (state, send) = React.useReducer(
    reducer,
    initialState,
  )
  Js.log(state)
	<div>
		<div className="w-3/4 mx-auto my-4">
		<button onClick={(_) => send(CloseEditor)}>{str("Close All")}</button>
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

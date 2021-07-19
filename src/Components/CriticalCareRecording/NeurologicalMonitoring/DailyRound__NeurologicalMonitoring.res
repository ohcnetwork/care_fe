let str = React.string
open CriticalCare__Types

@react.component
let make = (
  ~neurologicalMonitoring,
  ~renderLine,
  ~renderOptionalDescription,
  ~renderOptionalInt,
  ~title,
) => {
  <div className="space-y-2">
    {renderLine(
      "Level of Consciousness",
      NeurologicalMonitoring.consciousnessLevelToString(
        NeurologicalMonitoring.consciousnessLevel(neurologicalMonitoring),
      ),
    )}
    {renderOptionalDescription(
      "Consciousness Level Reaction Description",
      NeurologicalMonitoring.consciousnessLevelDetails(neurologicalMonitoring),
    )}
    <div className="flex md:flex-row flex-col mt-2">
      <div className="px-4 py-2 border bg-gray-100 m-1 rounded-lg shadow md:w-1/2 w-full">
        {title("Left Pupil")}
        {renderOptionalInt("Size", NeurologicalMonitoring.leftPupilSize(neurologicalMonitoring))}
        {renderOptionalDescription(
          "Pupil Size Description",
          NeurologicalMonitoring.leftPupilSizeDetails(neurologicalMonitoring),
        )}
        {renderLine(
          "Light Reaction",
          NeurologicalMonitoring.lightReactionToString(
            NeurologicalMonitoring.leftPupilLightReaction(neurologicalMonitoring),
          ),
        )}
        {renderOptionalDescription(
          "Light Reaction Description",
          NeurologicalMonitoring.leftPupilLightReactionDetails(neurologicalMonitoring),
        )}
      </div>
      <div className="px-4 py-2 border bg-gray-100 m-1 rounded-lg shadow md:w-1/2 w-full">
        {title("Right Pupil")}
        {renderOptionalInt("Size", NeurologicalMonitoring.rightPupilSize(neurologicalMonitoring))}
        {renderOptionalDescription(
          "Pupil Size Description",
          NeurologicalMonitoring.rightPupilSizeDetails(neurologicalMonitoring),
        )}
      </div>
    </div>
    {renderLine(
      "Light Reaction",
      NeurologicalMonitoring.lightReactionToString(
        NeurologicalMonitoring.leftPupilLightReaction(neurologicalMonitoring),
      ),
    )}
    {renderOptionalDescription(
      "Light Reaction Description",
      NeurologicalMonitoring.leftPupilLightReactionDetails(neurologicalMonitoring),
    )}
    {str("...add more")}
  </div>
}

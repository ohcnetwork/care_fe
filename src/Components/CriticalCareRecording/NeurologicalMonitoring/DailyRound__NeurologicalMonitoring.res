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
    </div>
    {renderOptionalInt(
      "Glasgow Eye Open",
      NeurologicalMonitoring.glasgowEyeOpen(neurologicalMonitoring),
    )}
    {renderOptionalInt(
      "Glasgow Verbal Response",
      NeurologicalMonitoring.glasgowVerbalResponse(neurologicalMonitoring),
    )}
    {renderOptionalInt(
      "Glasgow Motor Response",
      NeurologicalMonitoring.glasgowMotorResponse(neurologicalMonitoring),
    )}
    {renderOptionalInt(
      "Glasgow Total Calculated",
      NeurologicalMonitoring.glasgowTotalCalculated(neurologicalMonitoring),
    )}
    <div>
      {title("Limb Response")}
      <div className="flex md:flex-no-wrap flex-wrap">
        <div className="border md:w-1/2 w-full p-6 text-center bg-gray-100 hover:bg-gray-300">
          {renderLine(
            "Upper Left",
            NeurologicalMonitoring.limpResponseToString(
              NeurologicalMonitoring.limbResponseUpperExtremityLeft(neurologicalMonitoring),
            ),
          )}
        </div>
        <div className="border md:w-1/2 w-full p-6 text-center bg-gray-100 hover:bg-gray-300">
          {renderLine(
            "Upper Right",
            NeurologicalMonitoring.limpResponseToString(
              NeurologicalMonitoring.limbResponseUpperExtremityRight(neurologicalMonitoring),
            ),
          )}
        </div>
      </div>
      <div className="flex md:flex-no-wrap flex-wrap">
        <div className="border md:w-1/2 w-full p-6 text-center bg-gray-100 hover:bg-gray-300">
          {renderLine(
            "Lower Left",
            NeurologicalMonitoring.limpResponseToString(
              NeurologicalMonitoring.limbResponseLowerExtremityLeft(neurologicalMonitoring),
            ),
          )}
        </div>
        <div className="border md:w-1/2 w-full p-6 text-center bg-gray-100 hover:bg-gray-300">
          {renderLine(
            "Lower Right",
            NeurologicalMonitoring.limpResponseToString(
              NeurologicalMonitoring.limbResponseLowerExtremityRight(neurologicalMonitoring),
            ),
          )}
        </div>
      </div>
    </div>
  </div>
}

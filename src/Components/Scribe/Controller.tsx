import { useTranslation } from "react-i18next";
import { ScribeContext, useScribe } from "./Provider";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { ScribeControlProps, ScribeField, ScribeStatus } from "./types";
import { useContext, useEffect, useState } from "react";
import useVoiceRecorder from "../../Utils/useVoiceRecorder";
import { useTimer } from "../../Utils/useTimer";
import useSegmentedRecording from "../../Utils/useSegmentedRecorder";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import * as Notify from "../../Utils/Notifications";
import { ScribeModel } from "./Scribe";
import uploadFile from "../../Utils/request/uploadFile";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import ButtonV2 from "../Common/components/ButtonV2";

export function Controller(props: ScribeControlProps) {
  const [context, setContext] = useContext(ScribeContext);
  const { t } = useTranslation();
  const [micAllowed, setMicAllowed] = useState<null | boolean>(null);
  const [transcript, setTranscript] = useState<string>();
  const timer = useTimer();

  //const { blob, waveform, resetRecording, startRecording, stopRecording } =
  //  useVoiceRecorder((permission: boolean) => {
  //    if (!permission) {
  //      handleStopRecording();
  //      resetRecording();
  //      setMicAllowed(false);
  //    } else {
  //      setMicAllowed(true);
  //    }
  //  });

  const setStatus = (status: ScribeStatus) => {
    setContext((context) => ({ ...context, status }));
  };

  const {
    isRecording,
    startRecording: startSegmentedRecording,
    stopRecording: stopSegmentedRecording,
    resetRecording,
    audioBlobs,
  } = useSegmentedRecording();

  // Keeps polling the scribe endpoint to check if transcript or ai response has been generated
  const poller = async (
    scribeInstanceId: string,
    type: "transcript" | "ai_response",
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const res = await request(routes.getScribe, {
            pathParams: {
              external_id: scribeInstanceId,
            },
          });

          if (!res.data || res.error)
            throw new Error("Error getting scribe instance");

          const { status, transcript, ai_response } = res.data;

          if (
            status === "GENERATING_AI_RESPONSE" ||
            status === "COMPLETED" ||
            status === "FAILED"
          ) {
            clearInterval(interval);
            if (status === "FAILED") {
              Notify.Error({ msg: "Transcription failed" });
              return reject(new Error("Transcription failed"));
            }

            if (type === "transcript" && transcript) {
              return resolve(transcript);
            }

            if (type === "ai_response" && ai_response) {
              return resolve(ai_response);
            }

            reject(new Error(`Expected ${type} but it is unavailable.`));
          }
        } catch (error) {
          clearInterval(interval);
          reject(error);
        }
      }, 5000);
    });
  };

  // gets the AI response and returns only the data that has changes
  const getAIResponse = async (scribeInstanceId: string) => {
    const fields = await getHydratedFields();
    const updatedFieldsResponse = await poller(scribeInstanceId, "ai_response");
    const parsedFormData = JSON.parse(updatedFieldsResponse ?? "{}");
    // run type validations
    const changedData = Object.entries(parsedFormData)
      .filter(([k, v]) => {
        const f = fields.find((f) => f.id === k);
        if (!f) return false;
        if (v === f.current) return false;
        return true;
      })
      .map(([k, v]) => ({ [k]: v }))
      .reduce((acc, curr) => ({ ...acc, ...curr }), {});
    return changedData;
  };

  // gets the audio transcription
  const getTranscript = async (scribeInstanceId: string) => {
    const res = await request(routes.updateScribe, {
      body: {
        status: "READY",
      },
      pathParams: {
        external_id: scribeInstanceId,
      },
    });

    if (res.error || !res.data) throw Error("Error updating scribe instance");

    const transcript = await poller(scribeInstanceId, "transcript");
    setContext((context) => ({ ...context, lastTranscript: transcript }));
    return transcript;
  };

  // Uploads a scribe audio blob. Returns the response of the upload.
  const uploadAudio = async (audioBlob: Blob, scribeInstanceId: string) => {
    const category = "AUDIO";
    const name = "audio.mp3";
    const filename = Date.now().toString();

    const response = await request(routes.createScribeFileUpload, {
      body: {
        original_name: name,
        file_type: 1,
        name: filename,
        associating_id: scribeInstanceId,
        file_category: category,
        mime_type: audioBlob?.type?.split(";")?.[0],
      },
    });

    await new Promise<void>((resolve, reject) => {
      const url = response.data?.signed_url;
      const internal_name = response.data?.internal_name;
      const f = audioBlob;
      if (f === undefined) {
        reject(Error("No file to upload"));
        return;
      }
      const newFile = new File([f], `${internal_name}`, { type: f.type });
      const headers = {
        "Content-type": newFile?.type?.split(";")?.[0],
        "Content-disposition": "inline",
      };

      uploadFile(
        url || "",
        newFile,
        "PUT",
        headers,
        (xhr: XMLHttpRequest) => (xhr.status === 200 ? resolve() : reject()),
        null,
        reject,
      );
    });

    const res = request(routes.editScribeFileUpload, {
      body: { upload_completed: true },
      pathParams: {
        id: response.data?.id || "",
        fileType: "SCRIBE",
        associatingId: scribeInstanceId,
      },
    });
    return res;
  };

  // Sets up a scribe instance with the available recordings. Returns the instance ID.
  const createScribeInstance = async () => {
    const fields = await getHydratedFields();
    const response = await request(routes.createScribe, {
      body: {
        status: "CREATED",
        form_data: fields,
      },
    });
    if (response.error) throw Error("Error creating scribe instance");
    if (!response.data) throw Error("Response did not return any data");
    await Promise.all(
      audioBlobs.map((blob) =>
        uploadAudio(blob, response.data?.external_id ?? ""),
      ),
    );

    return response.data.external_id;
  };

  // Hydrates the values for all fields. This is required for fields whos' values need to be fetched asynchronously. Ex. Diagnoses data for a patient.
  const hydrateValues = async () => {
    const hydratedPromises = context.inputs.map(async (input) => {
      const value = await input.value();
      return {
        friendlyName: input.friendlyName,
        current: value,
        id: input.id,
        description: input.description,
        type: input.type,
        example: input.example,
      };
    });
    const hydrated = await Promise.all(hydratedPromises);
    setContext((context) => ({ ...context, hydratedInputs: hydrated }));
    return hydrated;
  };

  // gets hydrated fields, but does not fetch them again unless ignoreCache is true
  const getHydratedFields = async (ignoreCache?: boolean) => {
    if (context.hydratedInputs && !ignoreCache) return context.hydratedInputs;
    return await hydrateValues();
  };

  // updates the transcript and fetches a new AI response
  const handleUpdateTranscript = async (updatedTranscript: string) => {
    if (updatedTranscript === context.lastTranscript) return;
    if (!context.instanceId) throw Error("Cannot find scribe instance");
    setContext((context) => ({
      ...context,
      lastTranscript: updatedTranscript,
    }));
    const res = await request(routes.updateScribe, {
      body: {
        status: "READY",
        transcript: updatedTranscript,
        ai_response: null,
      },
      pathParams: {
        external_id: context.instanceId,
      },
    });
    if (res.error || !res.data) throw Error("Error updating scribe instance");
    setStatus("THINKING");
    const aiResponse = await getAIResponse(context.instanceId);
    setStatus("REVIEWING");
    setContext((context) => ({ ...context, lastAIResponse: aiResponse }));
  };

  const handleStartRecording = () => {
    resetRecording();
    timer.start();
    setStatus("RECORDING");
    startSegmentedRecording();
  };

  const handleStopRecording = async () => {
    timer.stop();
    timer.reset();
    setStatus("UPLOADING");
    stopSegmentedRecording();
    const instanceId = await createScribeInstance();
    setContext((context) => ({ ...context, instanceId }));
    setStatus("TRANSCRIBING");
    await getTranscript(instanceId);
    setStatus("THINKING");
    const aiResponse = await getAIResponse(instanceId);
    setStatus("REVIEWING");
    setContext((context) => ({ ...context, lastAIResponse: aiResponse }));
  };

  const getWaveformColor = (height: number): string => {
    const classes = [
      "bg-primary-500",
      "bg-primary-600",
      "bg-primary-700",
      "bg-primary-800",
    ];
    const index = Math.floor(height % classes.length);
    return classes[index];
  };

  useEffect(() => {
    setTranscript(context.lastTranscript);
  }, [context.lastTranscript]);

  useEffect(() => {
    //reset the reveiwed responses if the status changes
    if (context.status !== "REVIEWING")
      setContext((context) => ({
        ...context,
        reviewedAIResponses: {},
        lastAIResponse: undefined,
      }));
  }, [context.status]);

  return (
    <>
      <div
        className={`flex flex-row-reverse items-end right-0 -bottom-0 h-32 w-[50vw] blur-md fixed z-10 pointer-events-none transition-all ${context.status === "RECORDING" ? "visible opacity-100" : "invisible opacity-0"}`}
      >
        {/*waveform.map((wave, i) => (
          <div
            key={i}
            style={{ height: `${wave * 1.5}%` }}
            className={`w-full flex-1 transition-all rounded-t-[20px] ${getWaveformColor(wave)}`}
          />
        ))*/}
      </div>
      <div
        className={`fixed bottom-5 right-5 z-20 transition-all flex flex-col gap-4 items-end`}
      >
        <div
          className={`${context.status === "IDLE" ? "max-h-0 opacity-0" : "max-h-[300px]"} w-full transition-all rounded-lg overflow-hidden delay-100 bg-secondary-300 border border-secondary-400 shadow-lg`}
        >
          {context.status === "RECORDING" && (
            <div className="p-4 py-10 flex items-center justify-center">
              <div className="text-center">
                <div className="text-xl font-black ">{timer.time}</div>
                <p>We are hearing you...</p>
              </div>
            </div>
          )}
          {context.status === "TRANSCRIBING" && <div>Transcribing</div>}
          {context.lastTranscript && context.status === "REVIEWING" && (
            <div className="p-4 md:w-[350px]">
              <div className="text-base font-semibold">
                {t("transcript_information")}
              </div>
              <p className="text-xs text-gray-800 mb-4">
                {t("transcript_edit_info")}
              </p>
              <TextAreaFormField
                name="transcript"
                disabled={context.status !== "REVIEWING"}
                value={transcript}
                onChange={(e) => setTranscript(e.value)}
                errorClassName="hidden"
                placeholder="Transcript"
              />
              <ButtonV2
                loading={context.status !== "REVIEWING"}
                disabled={transcript === context.lastTranscript}
                className="w-full mt-4"
                onClick={() => transcript && handleUpdateTranscript(transcript)}
              >
                {t("process_transcript")}
              </ButtonV2>
            </div>
          )}
        </div>
        <ButtonV2
          variant={
            context.status === "IDLE"
              ? "primary"
              : context.status === "RECORDING"
                ? "danger"
                : "secondary"
          }
          className={`transition-all text-base`}
          onClick={
            context.status !== "RECORDING"
              ? handleStartRecording
              : handleStopRecording
          }
        >
          <CareIcon
            icon={
              context.status === "IDLE"
                ? "l-microphone"
                : context.status === "RECORDING"
                  ? "l-microphone-slash"
                  : "l-redo"
            }
          />
          {context.status === "IDLE"
            ? t("voice_autofill")
            : context.status === "RECORDING"
              ? t("stop_recording")
              : t("retake_recording")}
        </ButtonV2>
      </div>
    </>
  );
}

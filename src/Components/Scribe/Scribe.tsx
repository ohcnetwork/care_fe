import React, { useState, useEffect, useRef } from "react";
import { Popover } from "@headlessui/react";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import routes from "../../Redux/api";
import * as Notify from "../../Utils/Notifications";
import request from "../../Utils/request/request";
import axios from "axios";
import { UserModel } from "../Users/models";
import useConfig from "../../Common/hooks/useConfig";
import useSegmentedRecording from "../../Utils/useSegmentedRecorder";

interface FieldOption {
  id: string | number;
  text: string;
}

export interface Field {
  friendlyName: string;
  id: string;
  description: string;
  type: string;
  example: string;
  default: string;
  options?: readonly FieldOption[];
}

export type ScribeModel = {
  external_id: string;
  requested_by: UserModel;
  form_data: {
    name: string;
    field: string;
    description: string;
  }[];
  transcript: string;
  ai_response: string;
  status:
    | "CREATED"
    | "READY"
    | "GENERATING_TRANSCRIPT"
    | "GENERATING_AI_RESPONSE"
    | "COMPLETED"
    | "FAILED";
};

interface ScribeProps {
  fields: Field[];
  onFormUpdate: (fields: any) => void;
}

const SCRIBE_FILE_TYPES = {
  OTHER: 0,
  SCRIBE: 1,
};

export const Scribe: React.FC<ScribeProps> = ({ fields, onFormUpdate }) => {
  const { enable_scribe } = useConfig();
  const [open, setOpen] = useState(false);
  const [_progress, setProgress] = useState(0);
  const [stage, setStage] = useState("start");
  const [_editableTranscript, setEditableTranscript] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [formFields, setFormFields] = useState<{
    [key: string]: string | string[] | number;
  }>({});
  const [isHoveringCancelRecord, setIsHoveringCancelRecord] = useState(false);
  const [isGPTProcessing, setIsGPTProcessing] = useState(false);
  const [isAudioUploading, setIsAudioUploading] = useState(false);
  const [updatedTranscript, setUpdatedTranscript] = useState<string>("");
  const [scribeID, setScribeID] = useState<string>("");
  const stageRef = useRef(stage);

  useEffect(() => {
    if (stageRef.current === "cancelled") {
      setStage("start");
    }
  }, [stage]);

  const {
    isRecording,
    startRecording,
    stopRecording,
    resetRecording,
    audioBlobs,
  } = useSegmentedRecording();

  const uploadAudioData = (response: any, audioBlob: Blob) => {
    return new Promise<void>((resolve, reject) => {
      if (stageRef.current === "cancelled") resolve();
      const url = response.data.signed_url;
      const internal_name = response.data.internal_name;
      const f = audioBlob;
      if (f === undefined) {
        reject(Error("No file to upload"));
        return;
      }
      const newFile = new File([f], `${internal_name}`, { type: f.type });
      const config = {
        headers: {
          "Content-type": newFile?.type?.split(";")?.[0],
          "Content-disposition": "inline",
        },
      };

      axios
        .put(url, newFile, config)
        .then(() => {
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  const uploadAudio = async (audioBlob: Blob, associatingId: string) => {
    return new Promise((resolve, reject) => {
      if (stageRef.current === "cancelled") resolve({});
      const category = "AUDIO";
      const name = "audio.mp3";
      const filename = Date.now().toString();

      request(routes.createScribeFileUpload, {
        body: {
          original_name: name,
          file_type: SCRIBE_FILE_TYPES.SCRIBE,
          name: filename,
          associating_id: associatingId,
          file_category: category,
          mime_type: audioBlob?.type?.split(";")?.[0],
        },
      })
        .then((response) => {
          uploadAudioData(response, audioBlob)
            .then(() => {
              if (!response?.data?.id) throw Error("Error uploading audio");

              if (stageRef.current === "cancelled") resolve({});
              markUploadComplete(response?.data.id, associatingId).then(() => {
                resolve(response.data);
              });
            })
            .catch((error) => {
              reject(error);
            });
        })
        .catch(() => {
          reject(Error("Error uploading audio"));
        });
    });
  };

  const handleStartRecordingClick = () => {
    startRecording();
    setProgress(25);
    setStage("recording");
    stageRef.current = "recording";
  };

  const handleStopRecordingClick = () => {
    stopRecording();
    setProgress(50);
    setStage("recording-review");
    stageRef.current = "recording-end";
  };

  const handleEditChange = (e: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setUpdatedTranscript(e.target.value);
  };

  const waitForTranscript = async (externalId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (stageRef.current === "cancelled") resolve("");
      const interval = setInterval(async () => {
        try {
          const res = await request(routes.getScribe, {
            pathParams: {
              external_id: externalId,
            },
          });
          if (!res.data || res.error)
            throw Error("Error getting scribe instance");
          if (
            res.data.status === "GENERATING_AI_RESPONSE" ||
            res.data.status === "COMPLETED" ||
            res.data.status === "FAILED"
          ) {
            clearInterval(interval);
            if (res.data.status === "FAILED") {
              Notify.Error({ msg: "Transcription failed" });
              setErrors(["Transcription failed"]);
              reject(Error("Transcription failed"));
            }
            resolve(res.data.transcript);
          }
        } catch (error) {
          clearInterval(interval);
          reject(error);
        }
      }, 5000);
    });
  };

  const reProcessTranscript = async () => {
    setErrors([]);
    setEditableTranscript(updatedTranscript);
    setStage("review");
    const res = await request(routes.updateScribe, {
      body: {
        status: "READY",
        transcript: updatedTranscript,
        ai_response: null,
      },
      pathParams: {
        external_id: scribeID,
      },
    });
    if (res.error || !res.data) throw Error("Error updating scribe instance");
    setStage("review");
    await handleSubmitTranscript(res.data.external_id);
  };

  const waitForFormData = async (externalId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        if (stageRef.current === "cancelled") resolve("");
        try {
          const res = await request(routes.getScribe, {
            pathParams: {
              external_id: externalId,
            },
          });
          if (!res.data || res.error)
            throw Error("Error getting scribe instance");
          if (res.data.status === "COMPLETED" || res.data.status === "FAILED") {
            clearInterval(interval);
            if (res.data.status === "FAILED") {
              Notify.Error({ msg: "Transcription failed" });
              setErrors(["Transcription failed"]);
              reject(Error("Transcription failed"));
            }
            resolve(res.data.ai_response);
            setStage("final-review");
          }
        } catch (error) {
          clearInterval(interval);
          reject(error);
        }
      }, 5000);
    });
  };

  useEffect(() => {
    if (audioBlobs.length > 0 && stage === "recording-review") {
      handleAudioUploads();
    }
  }, [stage, audioBlobs]);

  const markUploadComplete = (external_id: string, associating_id: string) => {
    return request(routes.editScribeFileUpload, {
      body: { upload_completed: true },
      pathParams: {
        id: external_id,
        fileType: "SCRIBE",
        associatingId: associating_id,
      },
    });
  };

  const handleAudioUploads = async () => {
    if (isAudioUploading) return;
    setIsAudioUploading(true);
    request(routes.createScribe, {
      body: {
        status: "CREATED",
        form_data: fields,
      },
    })
      .then((response) => {
        if (response.error) throw Error("Error creating scribe instance");
        // Upload each audio blob
        setScribeID(response.data?.external_id ?? "");
        const promises = audioBlobs.map((blob) =>
          uploadAudio(blob, response.data?.external_id ?? ""),
        );
        Promise.all(promises)
          .then(() => {
            setIsAudioUploading(false);
            startTranscription(response.data?.external_id ?? "");
          })
          .catch(() => {
            Notify.Error({ msg: "Error uploading audio" });
            setIsAudioUploading(false);
          });
      })
      .catch(() => {
        Notify.Error({ msg: "Error creating scribe instance" });
        setIsAudioUploading(false);
      });
  };

  const handleSubmitTranscript = async (external_id: string) => {
    if (stageRef.current === "cancelled") return;
    setProgress(75);
    setIsGPTProcessing(true);
    try {
      const updatedFieldsResponse = await waitForFormData(external_id);
      setProgress(100);
      const parsedFormData = JSON.parse(updatedFieldsResponse ?? "{}");
      if (stageRef.current === "cancelled") return;
      setFormFields(parsedFormData);
      onFormUpdate(parsedFormData);
      setStage("final-review");
    } catch (error) {
      setErrors(["Error retrieving form data"]);
    }
    setIsGPTProcessing(false);
  };

  const startTranscription = async (scribeID: string) => {
    if (stageRef.current === "cancelled") return;
    setIsTranscribing(true);
    const errors = [];
    try {
      const res = await request(routes.updateScribe, {
        body: {
          status: "READY",
        },
        pathParams: {
          external_id: scribeID,
        },
      });

      if (res.error || !res.data) throw Error("Error updating scribe instance");

      //poll for transcript
      const transcriptResponse = await waitForTranscript(res.data.external_id);
      if (stageRef.current === "cancelled") return;
      setEditableTranscript(transcriptResponse);
      setUpdatedTranscript(transcriptResponse);
      setStage("review");
      setIsTranscribing(false);
      await handleSubmitTranscript(res.data.external_id);
    } catch (error) {
      errors.push("Whisper transcription failed");
      setIsTranscribing(false);
    }
    setErrors(errors);
    if (!errors.length) {
      setProgress(50); // Assuming transcript received
      setStage("final-review"); // Move to review stage
    }
  };

  const handleRerecordClick = () => {
    stopRecording();
    resetRecording();
    setProgress(0);
    setStage("start");
    setIsGPTProcessing(false);
    setIsTranscribing(false);
    setErrors([]);
    setFormFields({});
    setEditableTranscript("");
    setUpdatedTranscript("");
    setIsAudioUploading(false);
    setScribeID("");
    setIsHoveringCancelRecord(false);
    stageRef.current = "cancelled";
  };

  const processFormField = (
    fieldDetails: Field | undefined,
    formFields: { [key: string]: string | string[] | number },
    field: string,
  ) => {
    if (fieldDetails?.options) {
      // Check if the form field is an array (multiple selections allowed)
      if (Array.isArray(formFields[field])) {
        // Map each selected option ID to its corresponding text
        return (formFields[field] as string[])
          .map((option) => {
            const optionDetails = fieldDetails.options?.find(
              (o) => o.id === option,
            );
            return optionDetails?.text ?? option; // Use option text if found, otherwise fallback to option ID
          })
          .join(", ");
      } else {
        // Single selection scenario, find the option that matches the field value
        return (
          fieldDetails.options?.find((o) => o.id === formFields[field])?.text ??
          JSON.stringify(formFields[field])
        );
      }
    } else {
      // If no options are available, return the field value in JSON string format
      return JSON.stringify(formFields[field]);
    }
  };

  const renderContentBasedOnStage = () => {
    switch (stage) {
      case "start":
        return (
          <button
            onClick={handleStartRecordingClick}
            disabled={isRecording}
            className="flex items-center justify-center rounded-full border border-black px-2 py-2 font-bold hover:border-red-500 hover:bg-gray-200 hover:text-red-500"
          >
            <CareIcon
              icon="l-microphone"
              className="flex items-center justify-center text-xl"
            />
          </button>
        );
      case "recording":
        return (
          <button
            onClick={handleStopRecordingClick}
            disabled={!isRecording}
            onMouseEnter={() => setIsHoveringCancelRecord(true)}
            onMouseLeave={() => setIsHoveringCancelRecord(false)}
            className="flex animate-pulse items-center justify-center rounded-full border border-red-500 bg-red-100 px-2 py-2 font-bold text-red-500 hover:border-black hover:bg-gray-200 hover:text-black"
          >
            {isHoveringCancelRecord ? (
              <CareIcon
                icon="l-microphone-slash"
                className="flex items-center justify-center text-xl"
              />
            ) : (
              <CareIcon
                icon="l-microphone"
                className="flex items-center justify-center text-xl"
              />
            )}
          </button>
        );
      case "submit":
        return <p>Processing...</p>;
      default:
        return null;
    }
  };

  function getStageMessage(stage: string) {
    if (errors?.length > 0) return "Errored out. Please try again.";
    if (isGPTProcessing) return "Extracting form data from transcript...";
    if (isAudioUploading) return "Uploading audio...";
    if (isTranscribing) return "Transcribing audio...";
    switch (stage) {
      case "start":
        return "Click the microphone to start recording";
      case "recording":
        return "Recording...";
      case "recording-review":
        return "Uploading audio...";
      case "review":
        return "Transcript generated";
      case "submit":
        return "Generating form data from transcript...";
      case "final-review":
        return "Form data extracted. Please review.";
      default:
        return "";
    }
  }

  if (!enable_scribe) return null;

  return (
    <Popover>
      <Popover.Button>
        <ButtonV2
          onClick={() => setOpen(!open)}
          className="rounded py-2 font-bold"
        >
          <CareIcon icon="l-microphone" className="mr-1" />
          Voice AutoFill
        </ButtonV2>
      </Popover.Button>
      {open && (
        <Popover.Panel className="absolute right-6 z-10 w-[370px]" static>
          <div className="text-center">
            <span className="mt-2 inline-block align-middle" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <div className="flex justify-between">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Voice AutoFill
                </h3>

                <ButtonV2
                  onClick={() => {
                    handleRerecordClick();
                    setOpen(false);
                  }}
                  className={`flex items-center justify-center rounded-full bg-white p-2 font-bold text-red-500 transition duration-150 ease-in-out hover:bg-red-200 ${
                    stage === "start" && "opacity-0 hover:cursor-default"
                  }`}
                >
                  <CareIcon
                    icon="l-times-circle"
                    className=" flex -scale-x-100 justify-center text-lg"
                  />
                </ButtonV2>
              </div>

              {(stage === "review" ||
                stage === "final-review" ||
                stage === "recording-review") && (
                <div className="flex flex-col justify-center gap-4 rounded-md p-2">
                  <p className="text-sm font-semibold text-gray-600">
                    Recorded Audio
                  </p>
                  {audioBlobs.length > 0 &&
                    audioBlobs.map((blob, index) => (
                      <audio
                        key={index}
                        controls
                        src={URL.createObjectURL(blob)}
                      />
                    ))}
                  <ButtonV2
                    onClick={() => {
                      handleRerecordClick();
                    }}
                    className="w-full"
                  >
                    Restart Recording
                  </ButtonV2>
                </div>
              )}

              {(stage === "review" || stage === "final-review") && (
                <div className="my-2 w-full">
                  <div className="flex justify-between">
                    <p className="mb-2 text-sm font-semibold text-gray-600">
                      Transcript
                    </p>
                    <p className="mb-2 text-sm italic text-gray-500">
                      (Edit if needed)
                    </p>
                  </div>
                  <textarea
                    className="h-32 w-full rounded-md border border-gray-300 p-2 font-mono text-sm"
                    value={updatedTranscript}
                    onChange={handleEditChange}
                  />

                  <ButtonV2
                    onClick={reProcessTranscript}
                    className="my-2 w-full"
                  >
                    Process Transcript
                  </ButtonV2>
                  <ButtonV2
                    onClick={async () => {
                      setStage("recording-review");
                    }}
                    className="mb-2 w-full"
                  >
                    Regenerate Transcript
                  </ButtonV2>
                  {stage === "review" && (
                    <p className="animate-pulse text-sm text-gray-500">
                      {getStageMessage(stage)}
                    </p>
                  )}
                  {isGPTProcessing && (
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[rgba(5,114,206,0.2)]">
                      <div className="indeterminate h-full w-full bg-[rgb(5,206,152)]"></div>
                    </div>
                  )}
                  {!isGPTProcessing &&
                    Object.keys(formFields ?? {}).length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-sm font-semibold text-gray-600">
                          Form Data
                        </p>
                        <div className="max-h-80 divide-y divide-gray-300 overflow-scroll rounded-lg border border-gray-300 text-sm">
                          {Object.keys(formFields ?? {})
                            .filter((field) => formFields?.[field])
                            .map((field) => {
                              const fieldDetails = fields.find(
                                (f) => f?.id === field,
                              );
                              return (
                                <div
                                  key={field}
                                  className="flex flex-col bg-white px-3 py-1"
                                >
                                  <p className="mb-1 font-bold text-gray-600">
                                    {fieldDetails?.friendlyName}
                                  </p>
                                  <p className="text-gray-800">
                                    {processFormField(
                                      fieldDetails,
                                      formFields,
                                      field,
                                    )}
                                  </p>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  {stage === "final-review" && (
                    <p className="mt-2 text-sm text-gray-600">
                      {getStageMessage(stage)}
                    </p>
                  )}
                  {stage === "final-review" && !isGPTProcessing && (
                    <ButtonV2
                      onClick={reProcessTranscript}
                      className="mt-2 w-full"
                    >
                      Reobtain Form Data
                    </ButtonV2>
                  )}
                </div>
              )}
              <div className="">
                {errors?.map((error) => (
                  <p key={error} className="text-red-500">
                    {error}
                  </p>
                ))}
                {!(stage === "review" || stage === "final-review") && (
                  <p className="animate-pulse text-sm text-gray-500">
                    {getStageMessage(stage)}
                  </p>
                )}
              </div>
              {isTranscribing && (
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[rgba(5,114,206,0.2)]">
                  <div className="indeterminate h-full w-full bg-[rgb(5,114,206)]"></div>
                </div>
              )}
              {isAudioUploading && (
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[rgba(5,114,206,0.2)]">
                  <div className="indeterminate h-full w-full bg-[rgb(229,98,229)]"></div>
                </div>
              )}
              <div className="mt-4 flex justify-center">
                {renderContentBasedOnStage()}
              </div>
            </div>
          </div>
        </Popover.Panel>
      )}
    </Popover>
  );
};

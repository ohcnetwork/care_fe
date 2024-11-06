import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import React, { useEffect, useRef, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import { UserModel } from "@/components/Users/models";

import * as Notify from "@/Utils/Notifications";
import { useFeatureFlags } from "@/Utils/featureFlags";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import uploadFile from "@/Utils/request/uploadFile";
import useSegmentedRecording from "@/Utils/useSegmentedRecorder";

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
  default: any;
  options?: readonly FieldOption[];
  validator: (value: any) => boolean;
}

export interface ScribeForm {
  id: string;
  name: string;
  fields: () => Promise<Field[]> | Field[];
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
  facilityId: string;
  form: ScribeForm;
  existingData?: { [key: string]: any };
  onFormUpdate: (fields: any) => void;
}

const SCRIBE_FILE_TYPES = {
  OTHER: 0,
  SCRIBE: 1,
};

export const Scribe: React.FC<ScribeProps> = ({
  form,
  onFormUpdate,
  facilityId,
}) => {
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
  const [fields, setFields] = useState<Field[]>([]);

  const featureFlags = useFeatureFlags(facilityId);

  useEffect(() => {
    const loadFields = async () => {
      const fields = await form.fields();
      setFields(
        fields.map((f) => ({
          ...f,
          validate: undefined,
          default: JSON.stringify(f.default),
        })),
      );
    };
    loadFields();
  }, [form]);

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
      const headers = {
        "Content-type": newFile?.type?.split(";")?.[0],
        "Content-disposition": "inline",
      };

      uploadFile(
        url,
        newFile,
        "PUT",
        headers,
        (xhr: XMLHttpRequest) => (xhr.status === 200 ? resolve() : reject()),
        null,
        reject,
      );
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

      // run type validations
      const validated = Object.entries(parsedFormData)
        .filter(([k, v]) => {
          const f = fields.find((f) => f.id === k);
          if (!f) return false;
          if (v === f.default) return false;
          //if (f.validator) return f.validator(f.type === "number" ? Number(v) : v);
          return true;
        })
        .map(([k, v]) => ({ [k]: v }))
        .reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setFormFields(validated as any);
      onFormUpdate(validated);
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

  function processFormField(
    fieldDetails: Field | undefined,
    formFields: { [key: string]: any },
    field: string,
  ): React.ReactNode {
    const value = formFields[field];
    if (!fieldDetails || !value) return value;

    const { options } = fieldDetails;

    const getHumanizedKey = (key: string): string => {
      return key
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    const getOptionText = (value: string | number): string => {
      if (!options) return value.toString();
      const option = options.find((opt) => opt.id === value);
      return option ? option.text : value.toString();
    };

    const renderPrimitive = (value: any): any => {
      return options ? getOptionText(value) : value;
    };

    const renderArray = (values: any[]): React.ReactNode => {
      return values.map((value) => renderPrimitive(value)).join(", ");
    };

    const renderObject = (obj: { [key: string]: any }): React.ReactNode => {
      return (
        <div className="flex flex-col gap-2 text-sm">
          {Object.keys(obj).map((key, keyIndex) => (
            <div key={keyIndex}>
              <b>{getHumanizedKey(key)}</b>: {renderPrimitive(obj[key])}
            </div>
          ))}
        </div>
      );
    };

    const renderObjectArray = (objects: any[]): React.ReactNode => {
      return (
        <div className="flex flex-col gap-2 text-sm">
          {objects.map((obj, objIndex) => (
            <div key={objIndex}>{renderObject(obj)}</div>
          ))}
        </div>
      );
    };

    if (Array.isArray(value)) {
      if (
        value.length > 0 &&
        typeof value[0] === "object" &&
        !Array.isArray(value[0])
      ) {
        return renderObjectArray(value);
      }
      return renderArray(value);
    }

    if (typeof value === "object") {
      return renderObject(value);
    }

    return renderPrimitive(value);
  }

  const renderContentBasedOnStage = () => {
    switch (stage) {
      case "start":
        return (
          <button
            onClick={handleStartRecordingClick}
            disabled={isRecording}
            className="flex items-center justify-center rounded-full border border-black px-2 py-2 font-bold hover:border-red-500 hover:bg-secondary-200 hover:text-red-500"
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
            className="flex animate-pulse items-center justify-center rounded-full border border-red-500 bg-red-100 px-2 py-2 font-bold text-red-500 hover:border-black hover:bg-secondary-200 hover:text-black"
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

  if (!featureFlags.includes("SCRIBE_ENABLED")) return null;

  return (
    <Popover>
      <PopoverButton>
        <ButtonV2
          onClick={() => setOpen(!open)}
          className="rounded py-2 font-bold"
        >
          <CareIcon icon="l-microphone" className="mr-1" />
          Voice AutoFill
        </ButtonV2>
      </PopoverButton>
      {open && (
        <PopoverPanel className="absolute right-6 z-10 w-[370px]" static>
          <div className="text-center">
            <span className="mt-2 inline-block align-middle" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block max-h-[75vh] w-full max-w-md overflow-hidden overflow-y-auto rounded-2xl border-2 border-secondary-300 bg-white p-6 text-left align-middle shadow-xl transition-all">
              <div className="flex justify-between">
                <h3 className="text-lg font-medium leading-6 text-secondary-900">
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
                    className="flex -scale-x-100 justify-center text-lg"
                  />
                </ButtonV2>
              </div>

              {(stage === "review" ||
                stage === "final-review" ||
                stage === "recording-review") && (
                <div className="flex flex-col justify-center gap-4 rounded-md p-2">
                  <p className="text-sm font-semibold text-secondary-600">
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
                    <p className="mb-2 text-sm font-semibold text-secondary-600">
                      Transcript
                    </p>
                    <p className="mb-2 text-sm italic text-secondary-500">
                      (Edit if needed)
                    </p>
                  </div>
                  <textarea
                    className="h-32 w-full rounded-md border border-secondary-300 p-2 font-mono text-sm"
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
                    <p className="animate-pulse text-sm text-secondary-500">
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
                        <p className="mb-2 text-sm font-semibold text-secondary-600">
                          Form Data
                        </p>
                        <div className="max-h-80 divide-y divide-secondary-300 overflow-scroll rounded-lg border border-secondary-300 text-sm">
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
                                  <p className="mb-1 font-bold text-secondary-600">
                                    {fieldDetails?.friendlyName}
                                  </p>
                                  <div className="text-secondary-800">
                                    {processFormField(
                                      fieldDetails,
                                      formFields,
                                      field,
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  {stage === "final-review" && (
                    <p className="mt-2 text-sm text-secondary-600">
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
                  <p className="animate-pulse text-sm text-secondary-500">
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
        </PopoverPanel>
      )}
    </Popover>
  );
};

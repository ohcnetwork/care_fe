import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { QuestionnaireFormState } from "./QuestionnaireForm";

import { cn } from "@/lib/utils";
import { ResponseValue } from "@/types/questionnaire/form";
import { Question, findQuestionById } from "@/types/questionnaire/question";

interface AmbientScribeProps {
  formState: QuestionnaireFormState[];
  setFormState: React.Dispatch<React.SetStateAction<QuestionnaireFormState[]>>;
}

interface TranscriptSegment {
  speaker: string;
  text: string;
  timestamp: Date;
}

interface OpenAIRealtimeMessage {
  type: string;
  [key: string]: any;
}

export function AmbientScribe({ formState, setFormState }: AmbientScribeProps) {
  const { t } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [status, setStatus] = useState<string>("idle");
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const apiKey = import.meta.env.REACT_AI_VOICE_OPENAI_API_KEY;

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcript]);

  const extractFormData = (transcriptText: string) => {
    if (!formState.length) return;

    // Use OpenAI to analyze transcript and extract form data
    analyzeTranscriptAndFillForm(transcriptText);
  };

  const analyzeTranscriptAndFillForm = async (transcriptText: string) => {
    if (!apiKey) {
      toast.error(t("openai_api_key_not_configured"));
      return;
    }

    try {
      // Build form schema for GPT
      const formSchema = formState.map((form) => ({
        title: form.questionnaire.title,
        questions: extractQuestionsSchema(form.questionnaire.questions),
      }));

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: `You are a medical form assistant. Extract relevant information from the conversation transcript and map it to the form fields. Return a JSON object with question IDs as keys and extracted values as values. Only extract text and number fields. Form schema: ${JSON.stringify(formSchema)}`,
              },
              {
                role: "user",
                content: `Transcript: ${transcriptText}`,
              },
            ],
            temperature: 0.3,
          }),
        },
      );

      const data = await response.json();
      const extractedData = JSON.parse(
        data.choices?.[0]?.message?.content || "{}",
      );

      // Update form state with extracted data
      updateFormWithExtractedData(extractedData);
    } catch (error) {
      console.error("Error analyzing transcript:", error);
      toast.error(t("failed_to_analyze_transcript"));
    }
  };

  const extractQuestionsSchema = (questions: Question[]): any[] => {
    const schema: any[] = [];

    const processQuestion = (q: Question) => {
      if (q.type === "group" && q.questions) {
        q.questions.forEach(processQuestion);
      } else if (
        q.type === "text" ||
        q.type === "string" ||
        q.type === "integer" ||
        q.type === "decimal"
      ) {
        schema.push({
          id: q.id,
          text: q.text,
          type: q.type,
          link_id: q.link_id,
        });
      }
    };

    questions.forEach(processQuestion);
    return schema;
  };

  const updateFormWithExtractedData = (extractedData: Record<string, any>) => {
    setFormState((prevForms) =>
      prevForms.map((form) => {
        const updatedResponses = form.responses.map((response) => {
          const extractedValue = extractedData[response.question_id];
          if (extractedValue !== undefined) {
            const question = findQuestionById(
              form.questionnaire.questions,
              response.question_id,
            );
            if (!question) return response;

            let value: ResponseValue[] = [];
            if (question.type === "integer" || question.type === "decimal") {
              value = [
                {
                  type: "number",
                  value: extractedValue,
                },
              ];
            } else if (question.type === "text" || question.type === "string") {
              value = [
                {
                  type: "string",
                  value: extractedValue,
                },
              ];
            }

            return {
              ...response,
              values: value,
            };
          }
          return response;
        });

        return {
          ...form,
          responses: updatedResponses,
        };
      }),
    );
  };

  const startListening = async () => {
    if (!apiKey) {
      toast.error(t("openai_api_key_not_configured"));
      return;
    }

    try {
      setStatus(t("requesting_microphone_access"));

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 24000,
        },
      });

      setStatus(t("connecting_to_openai"));

      // Connect to OpenAI Realtime API
      const ws = new WebSocket(
        "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
        ["realtime", `openai-insecure-api-key.${apiKey}`],
      );

      wsRef.current = ws;

      ws.onopen = () => {
        setStatus(t("connected"));
        setIsListening(true);
        toast.success(t("ambient_scribe_started"));

        // Configure session with speaker diarization
        ws.send(
          JSON.stringify({
            type: "session.update",
            session: {
              modalities: ["text", "audio"],
              instructions:
                "You are a medical transcription assistant. Transcribe the conversation between doctor and patient. Identify speakers as 'Doctor' or 'Patient' based on context.",
              voice: "alloy",
              input_audio_format: "pcm16",
              output_audio_format: "pcm16",
              input_audio_transcription: {
                model: "whisper-1",
              },
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 500,
              },
            },
          }),
        );
      };

      ws.onmessage = (event) => {
        const message: OpenAIRealtimeMessage = JSON.parse(event.data);

        if (message.type === "conversation.item.created") {
          if (
            message.item?.type === "message" &&
            message.item?.role === "user"
          ) {
            // Extract transcript from user message
            const content = message.item.content?.[0];
            if (content?.type === "input_audio" && content.transcript) {
              const newSegment: TranscriptSegment = {
                speaker: "User",
                text: content.transcript,
                timestamp: new Date(),
              };
              setTranscript((prev) => [...prev, newSegment]);

              // Analyze transcript after each update
              const fullTranscript = [...transcript, newSegment]
                .map((seg) => `${seg.speaker}: ${seg.text}`)
                .join("\n");
              extractFormData(fullTranscript);
            }
          }
        }

        if (message.type === "response.audio_transcript.delta") {
          // Handle partial transcripts
          const delta = message.delta;
          if (delta) {
            setStatus(t("transcribing") + "...");
          }
        }

        if (message.type === "response.audio_transcript.done") {
          const transcriptText = message.transcript;
          if (transcriptText) {
            const newSegment: TranscriptSegment = {
              speaker: "Assistant",
              text: transcriptText,
              timestamp: new Date(),
            };
            setTranscript((prev) => [...prev, newSegment]);
          }
        }

        if (message.type === "error") {
          console.error("OpenAI error:", message);
          toast.error(t("transcription_error"));
          stopListening();
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast.error(t("connection_error"));
        stopListening();
      };

      ws.onclose = () => {
        setStatus(t("disconnected"));
        setIsListening(false);
      };

      // Set up audio processing
      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = new Int16Array(inputData.length);

          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }

          // Send audio data to OpenAI
          ws.send(
            JSON.stringify({
              type: "input_audio_buffer.append",
              audio: btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer))),
            }),
          );
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
    } catch (error) {
      console.error("Error starting ambient scribe:", error);
      toast.error(t("failed_to_start_ambient_scribe"));
      setStatus(t("error"));
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    setIsListening(false);
    setStatus(t("stopped"));
    toast.info(t("ambient_scribe_stopped"));
  };

  const clearTranscript = () => {
    setTranscript([]);
    toast.success(t("transcript_cleared"));
  };

  if (!apiKey) {
    return (
      <div className="w-96 sticky top-6 h-screen p-4 border-l border-gray-200 hidden xl:block">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CareIcon icon="l-microphone" className="size-5" />
              {t("ambient_scribe")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              {t("ambient_scribe_not_configured")}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-96 sticky top-6 h-screen p-4 border-l border-gray-200 hidden xl:block">
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CareIcon icon="l-microphone" className="size-5" />
            {t("ambient_scribe")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
          {/* Status */}
          <div className="flex items-center gap-2 text-sm">
            <div
              className={cn(
                "size-2 rounded-full",
                isListening ? "bg-green-500 animate-pulse" : "bg-gray-300",
              )}
            />
            <span className="text-gray-600">{status}</span>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {!isListening ? (
              <Button
                onClick={startListening}
                className="flex-1"
                variant="default"
              >
                <CareIcon icon="l-play" className="mr-2 size-4" />
                {t("start_listening")}
              </Button>
            ) : (
              <Button
                onClick={stopListening}
                className="flex-1"
                variant="destructive"
              >
                <CareIcon icon="l-stop-circle" className="mr-2 size-4" />
                {t("stop_listening")}
              </Button>
            )}
            <Button
              onClick={clearTranscript}
              variant="outline"
              size="icon"
              disabled={transcript.length === 0}
            >
              <CareIcon icon="l-trash-alt" className="size-4" />
            </Button>
          </div>

          {/* Transcript */}
          <div className="flex-1 overflow-y-auto border rounded-lg p-3 space-y-3 bg-gray-50">
            {transcript.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-8">
                {t("no_transcript_yet")}
              </div>
            ) : (
              transcript.map((segment, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded",
                        segment.speaker === "Doctor"
                          ? "bg-blue-100 text-blue-700"
                          : segment.speaker === "Patient"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700",
                      )}
                    >
                      {segment.speaker}
                    </span>
                    <span className="text-xs text-gray-400">
                      {segment.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 pl-2">{segment.text}</p>
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500 p-2 bg-blue-50 rounded border border-blue-100">
            <CareIcon icon="l-info-circle" className="inline size-3 mr-1" />
            {t("ambient_scribe_info")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

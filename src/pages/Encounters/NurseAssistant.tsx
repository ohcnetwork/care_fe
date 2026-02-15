/* eslint-disable i18next/no-literal-string */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import query from "@/Utils/request/query";
import { Persona } from "@/components/ai-elements/persona";
import { cn } from "@/lib/utils";
import allergyIntoleranceApi from "@/types/emr/allergyIntolerance/allergyIntoleranceApi";
import diagnosisApi from "@/types/emr/diagnosis/diagnosisApi";
import { completedEncounterStatus } from "@/types/emr/encounter/encounter";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";
import medicationStatementApi from "@/types/emr/medicationStatement/medicationStatementApi";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";
import symptomApi from "@/types/emr/symptom/symptomApi";
import { RealtimeAgent, RealtimeSession } from "@openai/agents/realtime";
import { PaperPlaneIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { getEncoding } from "js-tiktoken";
import {
  AlertCircle,
  Loader2,
  MicIcon,
  MicOffIcon,
  RotateCcwIcon,
  SquareIcon,
} from "lucide-react";
import { useEncounter } from "./utils/EncounterProvider";

const API_URL = import.meta.env.REACT_NURSE_ASSISTANT_API_URL as string;
const CONTEXT_LIMIT = Math.floor(32_000 * 0.9); // 90% of 128k

const LANGUAGES = [
  { value: "english", label: "English" },
  { value: "hindi", label: "Hindi" },
  { value: "gujarati", label: "Gujarati" },
] as const;

type Language = (typeof LANGUAGES)[number]["value"];

interface ProjectContext {
  id: string;
  name: string;
  text: string;
  filePath: string;
}

interface ProjectPrompt {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
  promptId: string;
  prompt: ProjectPrompt;
  llmModel: string;
  topP: number;
  topK: number;
  temperature: number;
  current: boolean;
  contexts: ProjectContext[];
  createdAt: string;
  updatedAt: string;
}

// interface ChatMessage {
//   id: string;
//   chatId: string;
//   role: "user" | "assistant" | "system";
//   content: string;
//   contextIds: string[];
//   createdAt: string;
//   updatedAt: string;
// }

// interface Chat {
//   id: string;
//   projectId: string;
//   createdAt: string;
//   updatedAt: string;
//   messages: ChatMessage[];
// }

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function NurseAssistant(props: {
  show: boolean;
  setShow: (show: boolean) => void;
}) {
  const {
    patient,
    patientId,
    selectedEncounterId,
    selectedEncounter,
    facilityId,
  } = useEncounter();

  const { show, setShow } = props;

  const containerRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [isProjectLoading, setIsProjectLoading] = useState(true);
  const [language, setLanguage] = useState<Language>("english");

  const { data: allergies, isLoading: isAllergiesLoading } = useQuery({
    queryKey: ["allergies", patientId, selectedEncounterId],
    queryFn: query.paginated(allergyIntoleranceApi.getAllergy, {
      pathParams: { patientId },
      queryParams: {
        encounter: (
          selectedEncounter?.status
            ? completedEncounterStatus.includes(selectedEncounter.status)
            : false
        )
          ? selectedEncounterId
          : undefined,
      },
      pageSize: 100,
    }),
  });

  const { data: symptoms, isLoading: isSymptomsLoading } = useQuery({
    queryKey: ["symptoms", patientId, selectedEncounterId],
    queryFn: query.paginated(symptomApi.listSymptoms, {
      pathParams: { patientId },
      queryParams: { encounter: selectedEncounterId },
      pageSize: 100,
    }),
    enabled: !!patientId && !!selectedEncounterId,
  });

  const { data: diagnoses, isLoading: isDiagnosesLoading } = useQuery({
    queryKey: ["diagnosis", patientId, selectedEncounterId],
    queryFn: query.paginated(diagnosisApi.listDiagnosis, {
      pathParams: { patientId },
      queryParams: {
        encounter: selectedEncounterId,
        category: "encounter_diagnosis,chronic_condition",
      },
      pageSize: 100,
    }),
    enabled: !!patientId && !!selectedEncounterId,
  });

  const { data: medications, isLoading: isMedicationsLoading } = useQuery({
    queryKey: ["medication_requests", patientId, selectedEncounterId],
    queryFn: query.paginated(medicationRequestApi.list, {
      pathParams: { patientId },
      queryParams: {
        encounter: selectedEncounterId,
        facility: facilityId,
        product_type: "medication",
      },
      pageSize: 100,
    }),
    enabled: !!selectedEncounterId,
  });
  const { data: medicationStatement, isLoading: isMedicationStatementLoading } =
    useQuery({
      queryKey: ["medication_statements", patientId],
      queryFn: query.paginated(medicationStatementApi.list, {
        pathParams: { patientId },
        pageSize: 100,
      }),
      enabled: !!patientId,
    });

  const { data: serviceRequests, isLoading: isServiceRequestsLoading } =
    useQuery({
      queryKey: ["service_requests", patientId, selectedEncounterId],
      queryFn: query.paginated(serviceRequestApi.listServiceRequest, {
        pathParams: { facilityId: facilityId || "" },
        queryParams: {
          encounter: selectedEncounterId,
        },
        pageSize: 100,
      }),
      enabled: !!selectedEncounterId && !!facilityId,
    });

  const isDataLoading =
    isAllergiesLoading ||
    isSymptomsLoading ||
    isDiagnosesLoading ||
    isMedicationsLoading ||
    isMedicationStatementLoading ||
    isServiceRequestsLoading;

  const sessionRef = useRef<RealtimeSession | null>(null);
  const agentRef = useRef<RealtimeAgent | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingMessageRef = useRef<{
    itemId: string;
    content: string;
  } | null>(null);
  const isSpeakingRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch project details on mount
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsProjectLoading(true);
        const response = await fetch(`${API_URL}/api/projects?current=true`);
        if (response.ok) {
          const data: Project[] = await response.json();
          if (data.length > 0) {
            setProject(data[0]);
          }
        } else {
          console.error("Failed to fetch project:", response.statusText);
        }
      } catch (err) {
        console.error("Error fetching project:", err);
      } finally {
        setIsProjectLoading(false);
      }
    };
    fetchProject();
  }, []);

  // Build instructions from project prompt + contexts + patient data
  const instructions = useMemo(() => {
    const patientInfo = patient
      ? `
        Patient Name: ${patient.name},
        ID: ${patientId}
        Encounter ID: ${selectedEncounterId}
        Blood Group : ${patient.blood_group}
        Gender: ${patient.gender}
        Age : ${patient.year_of_birth ? new Date().getFullYear() - patient.year_of_birth : patient.date_of_birth ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : "Unknown"}
        ${patient.deceased_datetime ? `Deceased: Yes (on ${new Date(patient.deceased_datetime).toLocaleDateString()})` : "Deceased: No"}

        ${
          diagnoses?.results.length
            ? `
# Diagnoses:
${diagnoses.results
  .map(
    (report) => `
## ${report.code?.display}
Status: ${report.clinical_status} (${report.verification_status})
Severity: ${report.severity}
Onset Date: ${report.onset?.onset_datetime ? new Date(report.onset.onset_datetime).toLocaleString() : "N/A"}
`,
  )
  .join("\n\n")}
`
            : ``
        }

        ${
          allergies?.results.length
            ? `
# Allergies:
${allergies.results
  .map(
    (allergy) => `
## ${allergy.code.display}
Category: ${allergy.category}
Clinical Status: ${allergy.clinical_status}
Verification Status: ${allergy.verification_status}
Criticality: ${allergy.criticality}
${allergy.last_occurrence ? `Last Occurrence: ${new Date(allergy.last_occurrence).toLocaleString()}` : ""}
${allergy.note ? `Note: ${allergy.note}` : ""}
`,
  )
  .join("\n\n")}
`
            : ``
        }

        ${
          symptoms?.results.length
            ? `
# Symptoms:
${symptoms.results
  .map(
    (symptom) => `
## ${symptom.code.display}
Clinical Status: ${symptom.clinical_status}
Verification Status: ${symptom.verification_status}
Severity: ${symptom.severity}
${symptom.onset?.onset_datetime ? `Onset Date: ${new Date(symptom.onset.onset_datetime).toLocaleString()}` : ""}
${symptom.note ? `Note: ${symptom.note}` : ""}
`,
  )
  .join("\n\n")}
`
            : ``
        }

        ${
          medications?.results.length
            ? `
# Prescribed Medications (Current Encounter):
${medications.results
  .map(
    (med) => `
## ${med.medication.display}
Status: ${med.status}
Intent: ${med.intent}
Category: ${med.category}
Priority: ${med.priority}
${med.dosage_instruction?.length ? `Dosage: ${med.dosage_instruction.map((d) => d.text || `${d.dose_and_rate?.dose_quantity?.value ?? ""} ${d.dose_and_rate?.dose_quantity?.unit?.display ?? ""}`.trim() || "N/A").join("; ")}` : ""}
${
  med.dosage_instruction?.length
    ? `Route: ${
        med.dosage_instruction
          .map((d) => d.route?.display)
          .filter(Boolean)
          .join(", ") || "N/A"
      }`
    : ""
}
${med.note ? `Note: ${med.note}` : ""}
Authored On: ${new Date(med.authored_on).toLocaleString()}
`,
  )
  .join("\n\n")}
`
            : ``
        }

        ${
          medicationStatement?.results.length
            ? `
# Current Medications (Medication Statements):
${medicationStatement.results
  .map(
    (stmt) => `
## ${stmt.medication.display}
Status: ${stmt.status}
Dosage: ${stmt.dosage_text || "N/A"}
Information Source: ${stmt.information_source}
${stmt.reason ? `Reason: ${stmt.reason}` : ""}
${stmt.note ? `Note: ${stmt.note}` : ""}
${stmt.effective_period ? `Effective Period: ${stmt.effective_period.start ? new Date(stmt.effective_period.start).toLocaleDateString() : "Unknown"} - ${stmt.effective_period.end ? new Date(stmt.effective_period.end).toLocaleDateString() : "Ongoing"}` : ""}
`,
  )
  .join("\n\n")}
`
            : ``
        }

        ${
          serviceRequests?.results.length
            ? `
# Service Requests:
${serviceRequests.results
  .map(
    (req) => `
## ${req.code?.display || req.title}
Status: ${req.status}
Intent: ${req.intent}
Priority: ${req.priority}
Category: ${req.category}
${req.body_site ? `Body Site: ${req.body_site.display}` : ""}
${req.occurance ? `Occurrence: ${new Date(req.occurance).toLocaleString()}` : ""}
${req.patient_instruction ? `Patient Instructions: ${req.patient_instruction}` : ""}
${req.note ? `Note: ${req.note}` : ""}
`,
  )
  .join("\n\n")}
`
            : ``
        }
      `
      : `NO PATIENT DATA AVAILABLE for Patient ID: ${patientId} and Encounter ID: ${selectedEncounterId}`;

    const basePrompt =
      project?.prompt?.content ??
      "You are a helpful nurse assistant for a healthcare facility. Help the clinical staff with patient information, care documentation, and clinical queries.";

    const contextsBlock = project?.contexts?.length
      ? project.contexts
          .map(
            (c, idx) =>
              `==== START CONTEXT ${idx + 1} : ${c.name} ====\n${c.text}\n==== END Context ${idx + 1} ====`,
          )
          .join("\n\n")
      : "";

    const languageLabel =
      LANGUAGES.find((l) => l.value === language)?.label ?? "English";
    const languageInstruction = `\n\nIMPORTANT: You MUST speak and respond ONLY in ${languageLabel}. All your responses, both spoken and written, must be in ${languageLabel}.`;

    return `${basePrompt}\n\nPatient Data:\n${patientInfo}${
      contextsBlock ? `\n\nContext:\n${contextsBlock}` : ""
    }${languageInstruction}`;
  }, [
    patient,
    patientId,
    selectedEncounterId,
    project,
    language,
    diagnoses,
    allergies,
    symptoms,
    medications,
    medicationStatement,
    serviceRequests,
  ]);

  // Calculate tokens whenever messages or instructions change
  useEffect(() => {
    try {
      const enc = getEncoding("cl100k_base");
      const messagesContent = messages
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");
      const fullContent = `${instructions}\n\n${messagesContent}`;
      const tokens = enc.encode(fullContent);
      const newTokenCount = tokens.length;
      setTokenCount(newTokenCount);

      if (newTokenCount >= CONTEXT_LIMIT && !isLimitReached) {
        setIsLimitReached(true);
        disconnect();
      }
    } catch (err) {
      console.error("Error calculating tokens:", err);
    }
  }, [messages, instructions, isLimitReached]);

  const usagePercentage = useMemo(() => {
    return Math.min((tokenCount / CONTEXT_LIMIT) * 100, 100);
  }, [tokenCount]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const setupSessionListeners = useCallback((session: RealtimeSession) => {
    // Streaming transcript deltas (assistant speech-to-text)
    session.transport.on("audio_transcript_delta", (deltaEvent) => {
      if (!isSpeakingRef.current) {
        isSpeakingRef.current = true;
        setIsSpeaking(true);
      }

      if (
        !streamingMessageRef.current ||
        streamingMessageRef.current.itemId !== deltaEvent.itemId
      ) {
        streamingMessageRef.current = {
          itemId: deltaEvent.itemId,
          content: deltaEvent.delta,
        };
      } else {
        streamingMessageRef.current.content += deltaEvent.delta;
      }

      setMessages((prev) => {
        if (!streamingMessageRef.current) return prev;

        const existing = prev.find((m) => m.id === deltaEvent.itemId);
        if (existing) {
          return prev.map((m) =>
            m.id === deltaEvent.itemId
              ? { ...m, content: streamingMessageRef.current!.content }
              : m,
          );
        } else {
          return [
            ...prev,
            {
              id: deltaEvent.itemId,
              role: "assistant" as const,
              content: streamingMessageRef.current!.content,
              timestamp: new Date(),
            },
          ];
        }
      });
    });

    // User starts speaking
    session.transport.on(
      "input_audio_buffer.speech_started",
      (_event: unknown) => {
        setIsListening(true);
      },
    );

    // User stops speaking
    session.transport.on(
      "input_audio_buffer.speech_stopped",
      (_event: unknown) => {
        setIsListening(false);
      },
    );

    // User audio transcription complete
    session.transport.on(
      "conversation.item.input_audio_transcription.completed",
      (event: { item_id?: string; transcript?: string }) => {
        setIsListening(false);

        setMessages((prev) => {
          const existing = prev.find((m) => m.id === event.item_id);
          if (existing) {
            return prev.map((m) =>
              m.id === event.item_id
                ? { ...m, content: event.transcript ?? "" }
                : m,
            );
          } else {
            return [
              ...prev,
              {
                id: event.item_id,
                role: "user" as const,
                content: event.transcript ?? "",
                timestamp: new Date(),
              },
            ];
          }
        });
      },
    );

    // History updates
    (
      session as {
        on: (event: string, handler: (...args: unknown[]) => void) => void;
      }
    ).on("history_updated", (...args: unknown[]) => {
      const history = args[0] as Array<{
        type: string;
        itemId: string;
        role: string;
        content: Array<{ text?: string; transcript?: string }>;
      }>;
      const newMessages: Message[] = [];

      history.forEach((item) => {
        if (item.type === "message") {
          const content = item.content
            .map((c) => {
              if ("text" in c && c.text) return c.text;
              if ("transcript" in c && c.transcript) return c.transcript;
              return "";
            })
            .filter(Boolean)
            .join(" ");

          if (content) {
            newMessages.push({
              id: item.itemId,
              role: item.role as "user" | "assistant",
              content,
              timestamp: new Date(),
            });
          }
        }
      });

      setMessages((prev) => {
        if (newMessages.length === 0 && prev.length > 0) {
          return prev;
        }

        if (streamingMessageRef.current) {
          const updatedMessages = newMessages.map((msg) => {
            if (msg.id === streamingMessageRef.current?.itemId) {
              if (
                msg.content.length > streamingMessageRef.current!.content.length
              ) {
                streamingMessageRef.current!.content = msg.content;
              } else if (msg.content === streamingMessageRef.current!.content) {
                streamingMessageRef.current = null;
              }
              return {
                ...msg,
                content: streamingMessageRef.current?.content || msg.content,
              };
            }
            return msg;
          });
          return updatedMessages;
        }
        return newMessages;
      });
    });

    // Transcript done
    session.transport.on("audio_transcript_done", (_event: unknown) => {
      streamingMessageRef.current = null;
    });

    // Audio playback stopped
    session.transport.on("output_audio_buffer.stopped", (_event: unknown) => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    });

    // Response done fallback
    session.transport.on("response.done", (_event: unknown) => {
      if (!isSpeakingRef.current) {
        setIsSpeaking(false);
      }
    });

    // Conversation interrupted
    session.transport.on("conversation.interrupted", () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    });

    // Errors
    session.on("error", (errorEvent) => {
      setError(
        errorEvent.error instanceof Error
          ? errorEvent.error.message
          : "An error occurred",
      );
    });
  }, []);

  const connect = useCallback(
    async (startMuted = false) => {
      try {
        setIsLoading(true);
        setError(null);

        // Get ephemeral token from the assistant API
        const tokenResponse = await fetch(`${API_URL}/api/realtime/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: project?.id,
            patientId,
            encounterId: selectedEncounterId,
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error("Failed to get token");
        }

        const { token } = await tokenResponse.json();

        const agent = new RealtimeAgent({
          name: "NurseAssistant",
          instructions,
          voice: "shimmer",
        });

        agentRef.current = agent;

        const session = new RealtimeSession(agent, {
          model: "gpt-4o-realtime-preview",
          transport: "webrtc",
        });

        sessionRef.current = session;

        setupSessionListeners(session);

        await session.connect({ apiKey: token });

        if (startMuted) {
          session.mute(true);
          setIsMicMuted(true);
        }

        setIsConnected(true);
        setIsLoading(false);
      } catch (err) {
        console.error("Error connecting:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to connect to voice chat",
        );
        setIsLoading(false);
      }
    },
    [
      instructions,
      patientId,
      selectedEncounterId,
      project,
      setupSessionListeners,
    ],
  );

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    agentRef.current = null;
    setIsConnected(false);
    setIsSpeaking(false);
    setIsListening(false);
    setIsMicMuted(false);
    setError(null);
  }, []);

  const newChat = useCallback(() => {
    disconnect();
    setMessages([]);
    setInputText("");
    setTokenCount(0);
    setIsLimitReached(false);
    streamingMessageRef.current = null;
    isSpeakingRef.current = false;
  }, [disconnect]);

  const sendTextMessage = useCallback(async () => {
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    setInputText("");

    try {
      if (!sessionRef.current) {
        await connect(true);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (!sessionRef.current) {
        throw new Error("Failed to establish session");
      }

      sessionRef.current.sendMessage({
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: messageText }],
      });
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
    }
  }, [inputText, connect]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  const interruptAgent = () => {
    if (sessionRef.current) {
      sessionRef.current.interrupt();
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      streamingMessageRef.current = null;
    }
  };

  const toggleMicMute = () => {
    if (sessionRef.current) {
      const newMutedState = !isMicMuted;
      sessionRef.current.mute(newMutedState);
      setIsMicMuted(newMutedState);
    }
  };

  const findReferencedContexts = useCallback(
    (content: string): ProjectContext[] => {
      if (!project?.contexts) return [];
      return project.contexts.filter((context) =>
        content.includes(context.name),
      );
    },
    [project],
  );

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        if (isConnected || messages.length > 0) {
          const confirmed = window.confirm(
            "You have an active session. Are you sure you want to close?",
          );
          if (!confirmed) return;
          newChat();
        }
        setShow(false);
      }
    },
    [isConnected, messages.length, newChat, setShow],
  );

  useEffect(() => {
    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show, handleClickOutside]);

  const personaState = isSpeaking
    ? "speaking"
    : isListening
      ? "listening"
      : "idle";

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed bottom-0 right-4 z-10 flex items-end p-6 opacity-0 invisible transition-all translate-y-10 duration-300 scale-90",
        show && "opacity-100 visible scale-100 translate-y-0",
      )}
    >
      {/* Persona avatar */}
      <div className="flex flex-col items-center gap-2">
        <Persona state={personaState} variant="opal" className="size-40" />
        {isListening && !isMicMuted && (
          <span className="animate-pulse text-xs text-muted-foreground">
            Listening...
          </span>
        )}
      </div>

      {/* Chat panel */}
      <div className="relative p-4">
        <div className="mask-[radial-gradient(ellipse_60%_60%_at_center,black_60%,transparent_100%)] absolute inset-0 -z-10 backdrop-blur-sm" />

        {/* Error banner */}
        {error && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-red-100/80 px-3 py-2 text-xs text-red-800 backdrop-blur-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="w-80 max-h-[70vh] overflow-y-auto text-sm">
          {messages.length === 0 && !isConnected ? (
            <div className="rounded-lg bg-neutral-200/50 p-4 mb-2 max-w-[90%] backdrop-blur-sm">
              Hello! How can I assist you today?
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isStreaming =
                streamingMessageRef.current?.itemId === msg.id;
              const referencedContexts = findReferencedContexts(msg.content);
              return (
                <div
                  key={msg.id ?? idx}
                  className={cn(
                    "mb-2 flex",
                    msg.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[90%] rounded-lg p-3 backdrop-blur-sm",
                      msg.role === "user"
                        ? "bg-primary-600/80 text-white"
                        : "bg-neutral-200/50",
                      isStreaming && "animate-pulse",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {referencedContexts.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {referencedContexts.map((context) => (
                          <a
                            key={context.id}
                            href={`${API_URL}/files/${context.filePath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md bg-black/10 px-1.5 py-0.5 text-[10px] underline hover:bg-black/20 transition-colors"
                          >
                            📄 {context.name}
                          </a>
                        ))}
                      </div>
                    )}
                    <p className="mt-1 text-[10px] opacity-50">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          {isSpeaking &&
            !messages.some(
              (m) => m.id === streamingMessageRef.current?.itemId,
            ) && (
              <div className="mb-2 flex justify-start">
                <div className="rounded-lg bg-neutral-200/50 p-3 backdrop-blur-sm">
                  <p className="text-muted-foreground animate-pulse text-xs">
                    Speaking...
                  </p>
                </div>
              </div>
            )}
          <div ref={messagesEndRef} />
        </div>

        {/* Limit reached warning */}
        {isLimitReached && (
          <p className="mb-2 text-xs text-red-500">
            Conversation limit reached. Please close and reopen to start fresh.
          </p>
        )}

        {/* Input area */}
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={
              isLimitReached ? "Conversation limit reached" : "Type here"
            }
            disabled={isLoading || isLimitReached || isDataLoading}
            className="m-0 min-h-20 min-w-60 w-full resize-none rounded-lg border-black/10 bg-white/50 p-2 backdrop-blur-sm disabled:opacity-50"
          />
          <div className="flex items-center gap-2 justify-between p-1">
            {/* Language selector & new chat */}
            <div className="flex items-center gap-1">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                disabled={isConnected || isLoading || isDataLoading}
                className={cn(
                  "rounded-md border-black/10 bg-white/50 px-2 py-1 text-xs backdrop-blur-sm w-20",
                  (isConnected || isLoading || isDataLoading) &&
                    "cursor-not-allowed opacity-50",
                )}
                title="Select language"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
              {(isConnected || messages.length > 0) && (
                <button
                  onClick={newChat}
                  className="flex aspect-square w-8 items-center justify-center rounded-full bg-neutral-200 hover:bg-neutral-300 transition-colors"
                  title="New chat"
                >
                  <RotateCcwIcon size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Token usage indicator */}
              {messages.length > 0 && (
                <div
                  className="flex items-center gap-1 text-[10px] text-muted-foreground"
                  title={`${tokenCount.toLocaleString()} / ${CONTEXT_LIMIT.toLocaleString()} tokens`}
                >
                  <svg className="h-4 w-4 -rotate-90" viewBox="0 0 20 20">
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      fill="transparent"
                      className="stroke-muted"
                      strokeWidth="3"
                    />
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      fill="transparent"
                      className={cn(
                        "transition-all duration-300",
                        usagePercentage >= 90
                          ? "stroke-red-500"
                          : usagePercentage > 70
                            ? "stroke-yellow-500"
                            : "stroke-primary",
                      )}
                      strokeWidth="3"
                      strokeDasharray={`${(usagePercentage / 100) * 50.27} 50.27`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span
                    className={cn(isLimitReached && "text-red-500 font-medium")}
                  >
                    {usagePercentage.toFixed(0)}%
                  </span>
                </div>
              )}

              {/* Stop speaking */}
              {isSpeaking && (
                <button
                  onClick={interruptAgent}
                  className="flex aspect-square w-8 items-center justify-center rounded-full bg-red-500 text-white transition-opacity"
                  title="Stop speaking"
                >
                  <SquareIcon size={16} />
                </button>
              )}

              {/* Mic toggle / Connect */}
              {isConnected ? (
                <button
                  onClick={toggleMicMute}
                  className={cn(
                    "flex aspect-square w-8 items-center justify-center rounded-full",
                    isMicMuted ? "bg-red-500 text-white" : "bg-neutral-200",
                  )}
                  title={isMicMuted ? "Unmute microphone" : "Mute microphone"}
                >
                  {isMicMuted ? (
                    <MicOffIcon size={18} />
                  ) : (
                    <MicIcon size={20} />
                  )}
                </button>
              ) : (
                <button
                  onClick={() => connect(false)}
                  disabled={
                    isLoading ||
                    isLimitReached ||
                    isProjectLoading ||
                    isDataLoading
                  }
                  className="flex aspect-square w-8 items-center justify-center rounded-full bg-neutral-200 disabled:opacity-50"
                  title="Connect voice"
                >
                  {isLoading || isProjectLoading || isDataLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <MicIcon size={20} className="opacity-50" />
                  )}
                </button>
              )}

              {/* Send text */}
              <button
                onClick={sendTextMessage}
                disabled={
                  isLoading ||
                  !inputText.trim() ||
                  isLimitReached ||
                  isProjectLoading ||
                  isDataLoading
                }
                className="flex aspect-square w-8 items-center justify-center rounded-full bg-primary-500 text-white disabled:opacity-50"
                title="Send message"
              >
                {isLoading && !isConnected ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <PaperPlaneIcon />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

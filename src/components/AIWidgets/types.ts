export type WidgetType = "markdown" | "cited-summary" | "ranked-list" | "score";

export interface Widget {
  id: string;
  name: string;
  type: WidgetType;
  prompt: string;
  model: string;
  enabled: boolean;
}

export interface AskRequest {
  prompt: string;
  model: string;
  response_schema?: Record<string, unknown> | null;
  max_tool_iterations?: number;
}

export interface ToolCallRecord {
  name: string;
  arguments?: string | null;
}

export interface AskUsage {
  requests?: number;
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  [key: string]: unknown;
}

export interface AskResponse<TOutput = unknown> {
  output: TOutput;
  model: string;
  usage: AskUsage;
  tool_calls: ToolCallRecord[];
  duration_ms: number;
}

export interface MarkdownOutput {
  title: string;
  intro?: string;
  sections: Array<{
    heading: string;
    callout?: "warning" | "info" | null;
    markdown: string;
  }>;
  footer_note?: string;
  language?: string;
}

export interface CitedSummaryOutput {
  summary: string;
  citations: Array<{ tag: string; tool: string }>;
  grounded_count?: number;
}

export type ScoreSeverity = "low" | "moderate" | "high" | "critical";

export interface ScoreOutput {
  title: string;
  score: number;
  scale?: string;
  severity?: ScoreSeverity;
  interpretation?: string;
  components?: Array<{
    name: string;
    value: string;
    contribution: number;
  }>;
  source_note?: string;
}

export interface RankedListOutput {
  title: string;
  items: Array<{
    name: string;
    why: string;
    score: number;
    score_label: "Low" | "Mod" | "High";
  }>;
  disclaimer?: string;
  source_note?: string;
}

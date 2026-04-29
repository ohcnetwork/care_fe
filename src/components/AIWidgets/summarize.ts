import {
  CitedSummaryOutput,
  MarkdownOutput,
  RankedListOutput,
  ScoreOutput,
  Widget,
} from "@/components/AIWidgets/types";

export function outputToText(widget: Widget, output: unknown): string {
  if (widget.type === "markdown") {
    return markdownOutputToText(output as MarkdownOutput);
  }
  if (widget.type === "cited-summary") {
    return citedSummaryOutputToText(output as CitedSummaryOutput);
  }
  if (widget.type === "ranked-list") {
    return rankedListOutputToText(output as RankedListOutput);
  }
  if (widget.type === "score") {
    return scoreOutputToText(output as ScoreOutput);
  }
  return JSON.stringify(output, null, 2);
}

function scoreOutputToText(out: ScoreOutput): string {
  const parts: string[] = [];
  const headline = `${out.title}: ${out.score}${out.scale ? ` ${out.scale}` : ""}${
    out.severity ? ` (${out.severity})` : ""
  }`;
  parts.push(headline);
  if (out.interpretation) parts.push(out.interpretation);
  if (out.components?.length) {
    parts.push("");
    out.components.forEach((c) => {
      parts.push(`- ${c.name}: ${c.value} (+${c.contribution})`);
    });
  }
  if (out.source_note) parts.push("", out.source_note);
  return parts.join("\n").trim();
}

function markdownOutputToText(out: MarkdownOutput): string {
  const parts: string[] = [];
  if (out.title) parts.push(out.title);
  if (out.intro) parts.push("", out.intro);
  for (const section of out.sections ?? []) {
    parts.push("", section.heading.toUpperCase());
    if (section.markdown) parts.push(section.markdown);
  }
  if (out.footer_note) parts.push("", out.footer_note);
  return parts.join("\n").trim();
}

function citedSummaryOutputToText(out: CitedSummaryOutput): string {
  const parts: string[] = [out.summary];
  if (out.citations?.length) {
    parts.push("");
    parts.push(`Sources: ${out.citations.map((c) => c.tag).join(", ")}`);
  }
  return parts.join("\n").trim();
}

function rankedListOutputToText(out: RankedListOutput): string {
  const parts: string[] = [];
  if (out.title) parts.push(out.title);
  out.items?.forEach((item, i) => {
    parts.push(
      "",
      `${i + 1}. ${item.name} — ${item.score_label} (${item.score}%)`,
      `   ${item.why}`,
    );
  });
  if (out.disclaimer) parts.push("", out.disclaimer);
  if (out.source_note) parts.push("", out.source_note);
  return parts.join("\n").trim();
}

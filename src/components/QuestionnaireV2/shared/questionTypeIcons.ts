import {
  AlignLeft,
  Boxes,
  Calendar,
  CalendarClock,
  CircleDot,
  Clock,
  Hash,
  Info,
  Link2,
  LucideIcon,
  Network,
  Scale,
  ToggleLeft,
  TypeOutline,
} from "lucide-react";

import { QuestionType } from "@/types/questionnaire/question";

/**
 * type → lucide icon + tint classes, shared by the builder's type picker
 * tiles and the tree nav's per-row icons. Lives in shared/ (not builder/)
 * because shared/QuestionTreeNav renders it and shared must never import
 * from builder/. A total record — adding a question type without an icon
 * will not compile (see README "Adding a question type").
 */
export const QUESTION_TYPE_ICONS: Record<
  QuestionType,
  { icon: LucideIcon; tint: string }
> = {
  group: { icon: Network, tint: "bg-blue-100 text-blue-700" },
  display: { icon: Info, tint: "bg-yellow-100 text-yellow-700" },
  date: { icon: Calendar, tint: "bg-amber-100 text-amber-700" },
  structured: { icon: Boxes, tint: "bg-purple-100 text-purple-700" },
  decimal: { icon: Hash, tint: "bg-lime-100 text-lime-700" },
  integer: { icon: Hash, tint: "bg-lime-100 text-lime-700" },
  string: { icon: TypeOutline, tint: "bg-sky-100 text-sky-700" },
  text: { icon: AlignLeft, tint: "bg-pink-100 text-pink-700" },
  choice: { icon: CircleDot, tint: "bg-orange-100 text-orange-700" },
  dateTime: { icon: CalendarClock, tint: "bg-red-100 text-red-700" },
  time: { icon: Clock, tint: "bg-blue-100 text-blue-700" },
  boolean: { icon: ToggleLeft, tint: "bg-teal-100 text-teal-700" },
  quantity: { icon: Scale, tint: "bg-lime-100 text-lime-700" },
  url: { icon: Link2, tint: "bg-gray-100 text-gray-700" },
};

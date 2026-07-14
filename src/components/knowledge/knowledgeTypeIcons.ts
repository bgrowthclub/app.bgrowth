import {
  FileText,
  BookOpen,
  ListChecks,
  ClipboardList,
  Calculator,
  LayoutTemplate,
  PlayCircle,
  Download,
  type LucideIcon,
} from 'lucide-react'
import type { KnowledgeType } from '../../modules/knowledge/types/knowledgeType'

// One icon per KnowledgeType — the Knowledge module's own mapping, kept
// separate from components/systems/categoryIcons.ts (BusinessSystem
// industries are a different taxonomy from Knowledge content types).
export const KNOWLEDGE_TYPE_ICONS: Record<KnowledgeType, LucideIcon> = {
  Article: FileText,
  Guide: BookOpen,
  Checklist: ListChecks,
  Planner: ClipboardList,
  Calculator: Calculator,
  Template: LayoutTemplate,
  Video: PlayCircle,
  Download: Download,
}

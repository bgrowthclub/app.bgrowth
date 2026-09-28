// The printable document behind "Print" and "Download PDF" — ported
// verbatim from the Portal (document-v1/DocumentPrintSummary.tsx), which
// matches Studio's PrintableSummary: one document design across Studio,
// Portal and this site ("motor de PDF único"). Keep the three in sync.
// Uses Tailwind's neutral slate scale on purpose: a print document, not
// site chrome.
import { forwardRef, type CSSProperties } from "react";
import { Check } from "lucide-react";
import type { FormSectionConfig, SectionConfig, WorkspaceContent, WorkspaceData } from "../../modules/workspace/types/content";
import { getWorkspaceIcon } from "../../modules/workspace/lib/icons";
import bgrowthLogo from "../../assets/logo.png";

interface DocumentPrintSummaryProps {
  content: WorkspaceContent;
  data: WorkspaceData;
  percent: number;
    instanceLabel?: string;
}


const SKIPPED_FIELD_TYPES = ["title", "static_text", "image", "static_image", "file", "link"];

function isJourneyCtaSection(section: { title: string }): boolean {
  const normalized = section.title.toLowerCase();
  return normalized.includes("continue your journey") || normalized.includes("continue sua jornada");
}

const SECTION_BLOCK_STYLE: CSSProperties = { breakInside: "avoid", pageBreakInside: "avoid" };
const HEADING_GROUP_STYLE: CSSProperties = { breakInside: "avoid", pageBreakInside: "avoid" };

function SectionHeading({ section, primaryColor }: { section: SectionConfig; primaryColor: string }) {
  const Icon = getWorkspaceIcon(section.icon);
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[9.5px] font-bold tabular-nums" style={{ color: primaryColor }}>
        {String(section.number).padStart(2, "0")}
      </span>
      <Icon className="h-3 w-3 shrink-0 self-center" style={{ color: primaryColor }} />
      <h3 className="text-[12px] font-bold tracking-tight text-slate-900">{section.title}</h3>
      {section.optional && <span className="text-[9px] font-medium text-slate-400">(optional)</span>}
    </div>
  );
}

function FormLine({ label, value, isBlank }: { label: string; value?: string; isBlank: boolean }) {
  return (
    <div className="mb-2 break-words">
      <div className="text-[8.5px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      {isBlank ? (
        <div className="h-[14px] border-b border-slate-300" aria-hidden="true" />
      ) : (
        <div className="text-[10.5px] leading-snug text-slate-900">{value || <span className="text-slate-300">—</span>}</div>
      )}
    </div>
  );
}

function FormSectionBody({ section, data, isBlank }: { section: FormSectionConfig; data: WorkspaceData; isBlank: boolean }) {
  const values = (data[section.id] as Record<string, string>) ?? {};
  const fields = section.fields.filter((field) => !SKIPPED_FIELD_TYPES.includes(field.type));

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
      {fields.map((field) => {
        const spanFull = field.fullWidth || field.type === "textarea";
        if (field.type === "checkbox") {
          const checked = values[field.id] === "true";
          return (
            <div key={field.id} className={`mb-2 flex items-center gap-1.5 text-[10.5px] ${spanFull ? "col-span-2" : ""}`}>
              <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-sm border border-slate-300">
                {checked && <Check className="h-2 w-2" strokeWidth={4} />}
              </span>
              <span className="text-slate-800">{field.placeholder || field.label}</span>
            </div>
          );
        }
        return (
          <div key={field.id} className={spanFull ? "col-span-2" : ""}>
            <FormLine label={field.label} value={values[field.id]} isBlank={isBlank} />
          </div>
        );
      })}
    </div>
  );
}

function ChecklistItemRow({ item, checked, primaryColor }: { item: { id: string; label: string }; checked: boolean; primaryColor: string }) {
  return (
    <div className="flex items-center gap-2 py-1" style={SECTION_BLOCK_STYLE}>
      <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border border-slate-300">
        {checked && <Check className="h-2.5 w-2.5" strokeWidth={4} style={{ color: primaryColor }} />}
      </span>
      <span className="text-[10.5px] text-slate-800">{item.label}</span>
    </div>
  );
}

function OutcomeSectionBody({
  section,
  data,
  primaryColor,
}: {
  section: Extract<SectionConfig, { type: "outcome" }>;
  data: WorkspaceData;
  primaryColor: string;
}) {
  const values = (data[section.id] as Record<string, boolean>) ?? {};
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1.5">
      {section.items.map((item) => (
        <div key={item.id} className="flex items-center gap-1.5">
          <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border border-slate-300">
            {values[item.id] && <Check className="h-2.5 w-2.5" strokeWidth={4} style={{ color: primaryColor }} />}
          </span>
          <span className="text-[10.5px] font-medium text-slate-800">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function NotesSectionBody({ section, data }: { section: SectionConfig; data: WorkspaceData }) {
  const value = (data[section.id] as string) ?? "";
  return (
    <p className="min-h-[14px] whitespace-pre-wrap text-[10.5px] leading-relaxed text-slate-800">
      {value || <span className="text-slate-300">No notes recorded.</span>}
    </p>
  );
}

function ContentSection({
  section,
  data,
  primaryColor,
  isBlank,
}: {
  section: SectionConfig;
  data: WorkspaceData;
  primaryColor: string;
  isBlank: boolean;
}) {
  if (section.type === "checklist") {
    const values = (data[section.id] as Record<string, boolean>) ?? {};
    const [firstItem, ...restItems] = section.items;
    return (
      <>
        <div className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0" style={HEADING_GROUP_STYLE}>
          <SectionHeading section={section} primaryColor={primaryColor} />
          {section.description && <p className="mt-0.5 pl-[27px] text-[9.5px] text-slate-400">{section.description}</p>}
          {firstItem && (
            <div className="mt-2 pl-[27px]">
              <ChecklistItemRow item={firstItem} checked={Boolean(values[firstItem.id])} primaryColor={primaryColor} />
            </div>
          )}
        </div>
        {restItems.map((item) => (
          <div key={item.id} className="pl-[27px]">
            <ChecklistItemRow item={item} checked={Boolean(values[item.id])} primaryColor={primaryColor} />
          </div>
        ))}
      </>
    );
  }

  return (
    <section className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0" style={SECTION_BLOCK_STYLE}>
      <div style={HEADING_GROUP_STYLE}>
        <SectionHeading section={section} primaryColor={primaryColor} />
        {section.description && <p className="mt-0.5 pl-[27px] text-[9.5px] text-slate-400">{section.description}</p>}
      </div>
      <div className="mt-2 pl-[27px]">
        {section.type === "form" && <FormSectionBody section={section} data={data} isBlank={isBlank} />}
        {section.type === "outcome" && <OutcomeSectionBody section={section} data={data} primaryColor={primaryColor} />}
        {section.type === "notes" && <NotesSectionBody section={section} data={data} />}
      </div>
    </section>
  );
}

const DocumentPrintSummary = forwardRef<HTMLDivElement, DocumentPrintSummaryProps>(
  ({ content, data, percent }, ref) => {
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const primaryColor = content.brand.primaryColor;
    const isBlank = !data || Object.keys(data).length === 0;

    return (
      <div ref={ref} className="printable-summary document-v1 select-none px-8 pb-8 pt-5 font-sans text-slate-900">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[21px] font-bold leading-tight tracking-tight text-[#0b1d3a]">{content.brand.name}</h1>
            <div className="mt-2 h-[2px] w-10" style={{ backgroundColor: primaryColor }} />
          </div>
          <div className="flex items-center gap-1.5">
            <img src={bgrowthLogo} alt="BGrowth" className="h-7 w-7 rounded-lg object-cover shrink-0" />
            <div className="flex flex-col leading-none">
              <span className="text-[12.5px] font-extrabold tracking-tight text-[#0b1d3a]">BGrowth</span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end text-[10px] text-slate-500" style={SECTION_BLOCK_STYLE}>
          <span>Generated {today}</span>
        </div>
        <div className="mt-4 flex flex-col">
          {content.sections
            .filter((section) => !isJourneyCtaSection(section))
            .map((section) => (
              <ContentSection key={section.id} section={section} data={data} primaryColor={primaryColor} isBlank={isBlank} />
            ))}
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-2 text-[9px] font-semibold">
          <span className="uppercase tracking-tight text-slate-700">{content.brand.companyLabel}</span>
          <span className="font-normal text-slate-400">
            Generated on {today} • {isBlank ? "Blank Form" : `${percent}% complete`}
          </span>
        </div>
      </div>
    );
  },
);

DocumentPrintSummary.displayName = "DocumentPrintSummary";

export default DocumentPrintSummary;

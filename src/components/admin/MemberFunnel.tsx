interface Step {
  label: string
  hint: string
  value: number
}

// How far the people who signed up got, each step as a share of sign-ups.
export default function MemberFunnel({ steps }: { steps: Step[] }) {
  const total = Math.max(steps[0]?.value ?? 0, 1)
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => {
        const pct = Math.round((step.value / total) * 100)
        return (
          <li key={step.label}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[13.5px] font-semibold text-navy">
                <span className="mr-2 text-navy/30">{i + 1}</span>
                {step.label}
              </p>
              <p className="shrink-0 text-[13.5px] tabular-nums text-navy">
                <span className="font-semibold">{step.value}</span>
                {i > 0 && <span className="ml-2 text-navy/45">{pct}%</span>}
              </p>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-navy/[0.05]">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(step.value / total) * 100}%`, opacity: 1 - i * 0.12 }} />
            </div>
            <p className="mt-1 text-[12px] text-navy/45">{step.hint}</p>
          </li>
        )
      })}
    </ol>
  )
}

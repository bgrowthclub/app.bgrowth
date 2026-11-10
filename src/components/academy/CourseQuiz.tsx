import { useState } from 'react'
import { Check, RotateCcw, X } from 'lucide-react'
import { isAnswerable, isAnswered, mark, score } from '../../modules/academy/quiz'
import type { GivenAnswer } from '../../modules/academy/quiz'
import type { CourseQuestion } from '../../modules/academy/types'

interface Props {
  title?: string
  questions: CourseQuestion[]
  /** What the student answered for a question, or null. */
  answerFor: (questionId: string) => GivenAnswer | null
  /** Records an answer; null clears it so the question can be tried again. */
  onAnswer: (questionId: string, given: GivenAnswer | null) => void
}

// BGrowth Academy™ — a lesson's self-check (02/11/2026).
//
// A sibling of CourseLessonBody's blocks, not a variant of one (CLAUDE.md
// §6): a quiz keeps an answer, reacts to a click and reads the student's
// saved progress, none of which a presentational block does.
//
// It never gates anything. The student answers, is told at once whether they
// got it right and why, and the next lesson is open to them either way.
// Their answer is saved only so the page looks the same when they come back,
// and they may try again as often as they like — so there is no score to
// defend and no reason to hide the answer.
export default function CourseQuiz({ title, questions, answerFor, onAnswer }: Props) {
  // A question with no right answer recorded yet is not shown at all — see
  // isAnswerable. The whole quiz disappears rather than showing an empty
  // box when none of its questions is ready.
  const ready = questions.filter(isAnswerable)
  if (!ready.length) return null

  const { answered, right } = score(ready, answerFor)

  return (
    <section className="rounded-xl2 border border-navy/[0.08] bg-bg-soft px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-[15px] font-bold text-navy">{title || 'Check yourself'}</h3>
        {answered > 0 && (
          <p className="text-[12.5px] font-semibold text-navy/50">
            {right} of {answered} right
            {answered < ready.length && ` · ${ready.length - answered} to go`}
          </p>
        )}
      </div>
      <p className="mt-1 text-[13px] text-navy/50">
        Just for you — nothing here is graded and it never blocks the next lesson.
      </p>

      <ol className="mt-4 space-y-4">
        {ready.map((question, i) => (
          <Question key={question.id} index={i + 1} question={question} given={answerFor(question.id)} onAnswer={onAnswer} />
        ))}
      </ol>
    </section>
  )
}

const CARD = 'rounded-xl2 border border-navy/[0.07] bg-white px-4 py-3.5'

// How many goes before the answer is shown (09/11/2026, the owner's
// decision). It used to reveal on the first wrong click, which ends the
// thinking the moment it got interesting.
//
// A CHOICE question gets at most options.length - 1, because after that many
// distinct wrong answers only the right one is left and "another go" would
// be theatre. A true/false question therefore reveals on the first miss,
// which is honest: with two options, a wrong answer means you didn't know.
const MAX_TRIES = 3
function triesFor(question: CourseQuestion) {
  if (question.kind === 'typed') return MAX_TRIES
  return Math.max(1, Math.min(MAX_TRIES, question.options.length - 1))
}

// Two goes at the SAME wrong answer are one mistake, not two — a misclick
// must not cost someone their last try. So attempts are counted by what was
// answered, not by how many times the button was pressed.
function attemptKey(given: GivenAnswer): string {
  return Array.isArray(given) ? [...given].sort().join('|') : String(given).trim().toLowerCase()
}

function Question({
  index,
  question,
  given,
  onAnswer,
}: {
  index: number
  question: CourseQuestion
  given: GivenAnswer | null
  onAnswer: (questionId: string, given: GivenAnswer | null) => void
}) {
  const done = isAnswered(given)
  const marked = done ? mark(question, given as GivenAnswer) : null
  // The wrong answers given so far, this visit. Deliberately NOT saved: the
  // quiz is ungraded and gates nothing, so a reload starting the tries over
  // costs nobody anything — and saving it would mean changing the shape of
  // every student's stored progress for a counter that decides nothing.
  const [tried, setTried] = useState<string[]>([])
  const limit = triesFor(question)
  const left = limit - tried.length

  // One door for all three kinds: right answers are recorded at once; a
  // wrong one is only recorded — and so revealed — when the tries run out.
  const tryAnswer = (value: GivenAnswer) => {
    if (mark(question, value).right) {
      onAnswer(question.id, value)
      return
    }
    const key = attemptKey(value)
    if (tried.includes(key)) return
    const next = [...tried, key]
    setTried(next)
    if (next.length >= limit) onAnswer(question.id, value)
  }

  const retry = () => {
    setTried([])
    onAnswer(question.id, null)
  }

  return (
    <li className={CARD}>
      <p className="text-[14.5px] font-semibold leading-snug text-navy">
        <span className="mr-1.5 text-navy/35">{index}.</span>
        {question.prompt}
      </p>
      {question.kind === 'multi' && !done && (
        <p className="mt-1 text-[12.5px] text-navy/45">Tick everything that applies.</p>
      )}

      {question.kind === 'typed' ? (
        <TypedAnswer question={question} given={typeof given === 'string' ? given : null} onTry={tryAnswer} tried={tried} left={left} />
      ) : question.kind === 'multi' ? (
        <MultiAnswer question={question} given={given} onTry={tryAnswer} tried={tried} left={left} />
      ) : (
        <SingleAnswer question={question} given={given} onTry={tryAnswer} tried={tried} left={left} />
      )}

      {marked && (
        <div className="mt-3 border-t border-navy/[0.07] pt-3">
          <p className={`text-[13.5px] font-semibold ${marked.right ? 'text-emerald-700' : 'text-navy'}`}>
            {marked.right
              ? "That's right."
              : question.kind === 'typed'
                ? `We were looking for: ${marked.expected}`
                : question.kind === 'multi'
                  ? 'Not quite — the right ones are marked above.'
                  : 'Not this one — the right answer is marked above.'}
          </p>
          {!marked.right && question.kind === 'typed' && (
            <p className="mt-1 text-[13px] text-navy/55">
              If you wrote the same thing in other words, count it as right.
            </p>
          )}
          {question.explanation && (
            <p className="mt-1 whitespace-pre-line text-[13.5px] leading-relaxed text-navy/65">{question.explanation}</p>
          )}
          <button
            type="button"
            onClick={retry}
            className="no-print mt-2.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-primary hover:text-navy"
          >
            <RotateCcw size={13} aria-hidden />
            Try this one again
          </button>
        </div>
      )}
    </li>
  )
}

const OPTION = 'flex w-full items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-[14px] leading-snug text-navy/85 transition-colors disabled:cursor-default'
const IDLE = 'border-navy/[0.1] hover:border-primary/40 hover:bg-primary/[0.03]'

/** One right option, answered in a single click. */
function SingleAnswer({
  question,
  given,
  onTry,
  tried,
  left,
}: {
  question: Extract<CourseQuestion, { answer: string }>
  given: GivenAnswer | null
  onTry: (given: GivenAnswer) => void
  tried: string[]
  left: number
}) {
  const picked = typeof given === 'string' ? given : null
  const revealed = picked !== null

  return (
    <>
      <div className="mt-3 space-y-2">
        {question.options.map((option) => {
          const chosen = picked === option.id
          // Once answered, the right option is shown even if they missed it:
          // a self-check is there to teach, not to keep a secret.
          const correct = revealed && option.id === question.answer
          // Tried and wrong, with goes still left: marked so they don't go
          // round in circles, but still clickable, because clicking it again
          // must not cost a try (see attemptKey).
          const spent = !revealed && tried.includes(option.id)

          let tone = IDLE
          if (correct) tone = 'border-emerald-500/50 bg-emerald-50'
          else if (chosen || spent) tone = 'border-red-500/40 bg-red-50'
          else if (revealed) tone = 'border-navy/[0.07] opacity-60'

          return (
            <button
              key={option.id}
              type="button"
              disabled={revealed}
              onClick={() => onTry(option.id)}
              className={`${OPTION} ${tone}`}
            >
              <Marker correct={correct} wrong={(chosen && !correct) || spent} />
              <span>{option.text}</span>
            </button>
          )
        })}
      </div>
      <TryAgain tried={tried} left={left} revealed={revealed} />
    </>
  )
}

/** "Not quite — have another go", and how many are left. */
function TryAgain({ tried, left, revealed }: { tried: string[]; left: number; revealed: boolean }) {
  if (revealed || tried.length === 0) return null
  return (
    <p className="no-print mt-2.5 text-[13px] font-semibold text-navy/60">
      Not quite — have another go.{' '}
      <span className="font-normal text-navy/40">
        {left} {left === 1 ? 'try' : 'tries'} left before we show it.
      </span>
    </p>
  )
}

/** Several right options: the student ticks, then commits once. */
function MultiAnswer({
  question,
  given,
  onTry,
  tried,
  left,
}: {
  question: Extract<CourseQuestion, { kind: 'multi' }>
  given: GivenAnswer | null
  onTry: (given: GivenAnswer) => void
  tried: string[]
  left: number
}) {
  const saved = Array.isArray(given) ? given : null
  const [draft, setDraft] = useState<string[]>([])
  const picked = saved ?? draft

  const toggle = (id: string) => setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]))

  return (
    <>
      <div className="mt-3 space-y-2">
        {question.options.map((option) => {
          const chosen = picked.includes(option.id)
          const correct = saved !== null && question.answers.includes(option.id)
          const missed = correct && !chosen

          let tone = chosen ? 'border-primary/40 bg-primary/[0.05]' : IDLE
          if (saved !== null) {
            if (correct) tone = 'border-emerald-500/50 bg-emerald-50'
            else if (chosen) tone = 'border-red-500/40 bg-red-50'
            else tone = 'border-navy/[0.07] opacity-60'
          }

          return (
            <button
              key={option.id}
              type="button"
              disabled={saved !== null}
              onClick={() => toggle(option.id)}
              className={`${OPTION} ${tone}`}
            >
              <Marker
                correct={saved !== null && correct}
                wrong={saved !== null && chosen && !correct}
                ticked={saved === null && chosen}
                square
              />
              <span>
                {option.text}
                {missed && <span className="ml-1.5 text-[12.5px] font-semibold text-emerald-700">(you missed this one)</span>}
              </span>
            </button>
          )
        })}
      </div>
      {saved === null && (
        <>
          {/* The ticks are kept after a wrong go: they were nearly right,
              and clearing the lot would make them start from nothing. */}
          <TryAgain tried={tried} left={left} revealed={false} />
          <button
            type="button"
            disabled={draft.length === 0}
            onClick={() => onTry(draft)}
            className="no-print mt-2.5 rounded-xl bg-primary px-4 py-2 text-[13.5px] font-semibold text-white transition-opacity disabled:opacity-40"
          >
            Check my answer
          </button>
        </>
      )}
    </>
  )
}

/** A typed answer, compared ignoring case and spacing. */
function TypedAnswer({
  question,
  given,
  onTry,
  tried,
  left,
}: {
  question: Extract<CourseQuestion, { kind: 'typed' }>
  given: string | null
  onTry: (given: GivenAnswer) => void
  tried: string[]
  left: number
}) {
  const [draft, setDraft] = useState('')

  if (given !== null)
    return (
      <p className="mt-3 rounded-xl border border-navy/[0.1] bg-bg-soft px-3.5 py-2.5 text-[14px] text-navy/85">
        <span className="mr-1.5 text-[12.5px] font-semibold uppercase tracking-wide text-navy/40">You wrote</span>
        {given}
      </p>
    )

  return (
    <>
      <TryAgain tried={tried} left={left} revealed={false} />
      <form
        className="no-print mt-3 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          // The draft is left alone on a wrong go, so they can edit a word
          // instead of typing the whole thing again.
          if (draft.trim()) onTry(draft.trim())
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type your answer"
          className="min-w-0 flex-1 rounded-xl border border-navy/[0.12] bg-white px-3.5 py-2.5 text-[14px] text-navy outline-none focus:border-primary/50"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="rounded-xl bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-white transition-opacity disabled:opacity-40"
        >
          Check
        </button>
      </form>
    </>
  )
}

function Marker({ correct, wrong, ticked, square }: { correct?: boolean; wrong?: boolean; ticked?: boolean; square?: boolean }) {
  return (
    <span className="mt-0.5 shrink-0">
      {correct ? (
        <Check size={16} className="text-emerald-600" aria-hidden />
      ) : wrong ? (
        <X size={16} className="text-red-500" aria-hidden />
      ) : ticked ? (
        <Check size={16} className="text-primary" aria-hidden />
      ) : (
        <span className={`block h-4 w-4 border border-navy/20 ${square ? 'rounded' : 'rounded-full'}`} aria-hidden />
      )}
    </span>
  )
}

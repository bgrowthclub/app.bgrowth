import { Check, RotateCcw, X } from 'lucide-react'
import type { CourseQuestion } from '../../modules/academy/types'

interface Props {
  title?: string
  questions: CourseQuestion[]
  /** The option the student picked for a question, or null. */
  answerFor: (questionId: string) => string | null
  /** Records an answer; null clears it so the question can be tried again. */
  onAnswer: (questionId: string, optionId: string | null) => void
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
  if (!questions.length) return null

  const answered = questions.filter((q) => answerFor(q.id))
  const right = answered.filter((q) => answerFor(q.id) === q.answer).length

  return (
    <section className="rounded-xl2 border border-navy/[0.08] bg-bg-soft px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-[15px] font-bold text-navy">{title || 'Check yourself'}</h3>
        {answered.length > 0 && (
          <p className="text-[12.5px] font-semibold text-navy/50">
            {right} of {answered.length} right
            {answered.length < questions.length && ` · ${questions.length - answered.length} to go`}
          </p>
        )}
      </div>
      <p className="mt-1 text-[13px] text-navy/50">
        Just for you — nothing here is graded and it never blocks the next lesson.
      </p>

      <ol className="mt-4 space-y-4">
        {questions.map((question, i) => (
          <Question key={question.id} index={i + 1} question={question} picked={answerFor(question.id)} onAnswer={onAnswer} />
        ))}
      </ol>
    </section>
  )
}

function Question({
  index,
  question,
  picked,
  onAnswer,
}: {
  index: number
  question: CourseQuestion
  picked: string | null
  onAnswer: (questionId: string, optionId: string | null) => void
}) {
  const isRight = picked === question.answer

  return (
    <li className="rounded-xl2 border border-navy/[0.07] bg-white px-4 py-3.5">
      <p className="text-[14.5px] font-semibold leading-snug text-navy">
        <span className="mr-1.5 text-navy/35">{index}.</span>
        {question.prompt}
      </p>

      <div className="mt-3 space-y-2">
        {question.options.map((option) => {
          const chosen = picked === option.id
          // Once answered, the right option is shown even if they missed it:
          // a self-check is there to teach, not to keep a secret.
          const correct = picked !== null && option.id === question.answer

          let tone = 'border-navy/[0.1] hover:border-primary/40 hover:bg-primary/[0.03]'
          if (correct) tone = 'border-emerald-500/50 bg-emerald-50'
          else if (chosen) tone = 'border-red-500/40 bg-red-50'
          else if (picked !== null) tone = 'border-navy/[0.07] opacity-60'

          return (
            <button
              key={option.id}
              type="button"
              disabled={picked !== null}
              onClick={() => onAnswer(question.id, option.id)}
              className={`flex w-full items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-[14px] leading-snug text-navy/85 transition-colors disabled:cursor-default ${tone}`}
            >
              <span className="mt-0.5 shrink-0">
                {correct ? (
                  <Check size={16} className="text-emerald-600" aria-hidden />
                ) : chosen ? (
                  <X size={16} className="text-red-500" aria-hidden />
                ) : (
                  <span className="block h-4 w-4 rounded-full border border-navy/20" aria-hidden />
                )}
              </span>
              <span>{option.text}</span>
            </button>
          )
        })}
      </div>

      {picked !== null && (
        <div className="mt-3 border-t border-navy/[0.07] pt-3">
          <p className={`text-[13.5px] font-semibold ${isRight ? 'text-emerald-700' : 'text-navy'}`}>
            {isRight ? "That's right." : 'Not this one — the right answer is marked above.'}
          </p>
          {question.explanation && (
            <p className="mt-1 whitespace-pre-line text-[13.5px] leading-relaxed text-navy/65">{question.explanation}</p>
          )}
          <button
            type="button"
            onClick={() => onAnswer(question.id, null)}
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

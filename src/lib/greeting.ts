// Shared time-of-day greeting for the Workspace Hero — kept here alongside
// motion.ts as the other piece of non-component shared logic.
export function getTimeOfDayGreeting(date: Date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

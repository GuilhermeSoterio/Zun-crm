export function differenceInDays(dateA: Date, dateB: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.floor((dateA.getTime() - dateB.getTime()) / msPerDay)
}

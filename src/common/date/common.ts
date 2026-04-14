export function combineDateAndTime(date: Date, time: string) {
  const [h, m, s] = time.split(':').map(Number);

  const newDate = new Date(date);
  newDate.setHours(h, m, s || 0, 0);

  return newDate;
}

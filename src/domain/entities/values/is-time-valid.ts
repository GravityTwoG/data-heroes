const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isTimeValid(value: string): boolean {
  return timeRegex.test(value);
}

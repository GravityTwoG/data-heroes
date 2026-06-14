import { UserQuietHours } from "@/domain/entities/user-preferences";

export function isInQuietHours(datetime: Date, quietHours: UserQuietHours): boolean {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: quietHours.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const timeStr = formatter.format(datetime);

  const [hours, minutes] = timeStr.split(":").map(Number);
  const currentMinutes = hours * 60 + minutes;

  const [startHours, startMinutes] = quietHours.start.split(":").map(Number);
  const startTotalMinutes = startHours * 60 + startMinutes;

  const [endHours, endMinutes] = quietHours.end.split(":").map(Number);
  const endTotalMinutes = endHours * 60 + endMinutes;

  if (startTotalMinutes <= endTotalMinutes) {
    return currentMinutes >= startTotalMinutes && currentMinutes <= endTotalMinutes;
  }

  return currentMinutes >= startTotalMinutes || currentMinutes <= endTotalMinutes;
}

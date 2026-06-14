export type Region = string;

const regionNames = new Intl.DisplayNames("en", {
  type: "region",
  fallback: "none",
});

export function isRegionValid(code: string): boolean {
  try {
    return regionNames.of(code) !== undefined;
  } catch {
    return false;
  }
}

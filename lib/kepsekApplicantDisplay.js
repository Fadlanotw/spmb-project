const DISPLAY_NAMES_BY_USER_ID = new Map([
  [11, "Arissa Zulaikha"],
  [10, "Nur Safa Sthyra"],
  [6, "Muhammad Farish"],
  [1, "Arfa Zaidan"],
]);

export function getKepsekApplicantName(userId, name) {
  return DISPLAY_NAMES_BY_USER_ID.get(Number(userId)) || name;
}

export function getKepsekApplicantIdsMatchingName(query) {
  const normalizedQuery = query.toLocaleLowerCase("id-ID");
  return [...DISPLAY_NAMES_BY_USER_ID]
    .filter(([, name]) => name.toLocaleLowerCase("id-ID").includes(normalizedQuery))
    .map(([userId]) => userId);
}

export function getNameInitials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

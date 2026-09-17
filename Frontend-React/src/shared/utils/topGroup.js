export function getTopGroupName(user) {
  const groups = user?.groups ?? [];
  if (!groups.length) return "—";
  const top = groups.reduce(
    (best, g) =>
      (g.group?._count?.permissions ?? 0) > (best?.group?._count?.permissions ?? -1) ? g : best,
    null
  );
  return top?.group?.groupName ?? "—";
}

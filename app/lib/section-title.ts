export function getSectionTitle({
  registryOpen,
  viewerTitle,
  introMinimized,
}: {
  registryOpen: boolean;
  viewerTitle: string | null;
  introMinimized: boolean;
}): string {
  if (registryOpen) return "Boolstack | Registry";
  if (viewerTitle) return `Boolstack | ${viewerTitle}`;
  if (!introMinimized) return "Boolstack | Setup";
  return "Boolstack | Apps";
}

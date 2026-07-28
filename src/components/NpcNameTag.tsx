type NpcNameTagProps = {
  displayName: string;
  displayRole: string;
};

export function NpcNameTag({
  displayName,
  displayRole,
}: NpcNameTagProps) {
  return (
    <span className="base-camp-npc-name-tag" aria-hidden="true">
      <small>&lt;{displayRole}&gt;</small>
      <strong>{displayName}</strong>
    </span>
  );
}

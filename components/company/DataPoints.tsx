type DataPointsProps = { names: string[] };

export function DataPoints({ names }: DataPointsProps) {
  if (!names.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      <span className="mr-1 text-sm font-medium text-muted-foreground">Attributes:</span>
      {names.map((name) => (
        <span
          key={name}
          className="inline-flex items-center rounded-md bg-primary-mid/15 px-2.5 py-0.5 text-sm text-primary"
        >
          {name}
        </span>
      ))}
    </div>
  );
}

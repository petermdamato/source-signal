type DeliveryMethodsProps = { methods: string[] };

export function DeliveryMethods({ methods }: DeliveryMethodsProps) {
  if (!methods.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      <span className="mr-1 text-sm font-medium text-muted-foreground">Delivery:</span>
      {methods.map((name) => (
        <span
          key={name}
          className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-0.5 text-sm text-primary"
        >
          {name}
        </span>
      ))}
    </div>
  );
}

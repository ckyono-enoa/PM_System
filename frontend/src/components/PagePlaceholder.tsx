/** A heading and a note, for screens that are not built yet. */
export function PagePlaceholder({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <section className="max-w-2xl space-y-2">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
      <p className="text-muted-foreground">Coming soon.</p>
    </section>
  )
}

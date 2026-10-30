import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <section className="max-w-2xl space-y-2">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">There is nothing at this address.</p>
      <Link to="/my-work" className="text-sm underline">
        Go to My Work
      </Link>
    </section>
  )
}

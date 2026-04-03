
import Link from "next/link";

export default function Home() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Home Page</h1>
      <p className="text-muted-foreground">Welcome to Finance App.</p>
      <Link href="/playground" className="text-primary underline-offset-4 hover:underline">
        Go to UI Playground
      </Link>
    </section>
  );
}
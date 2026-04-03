import { Button } from "@/components/ui/button";

export default function PlaygroundPage() {
  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">UI Playground</h1>
        <p className="text-muted-foreground">
          Component preview area. Add and test shadcn/ui components here.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Button Variants</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Button Sizes</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">SM</Button>
          <Button size="default">Default</Button>
          <Button size="lg">LG</Button>
          <Button size="icon" aria-label="Icon button">
            +
          </Button>
        </div>
      </div>
    </section>
  );
}
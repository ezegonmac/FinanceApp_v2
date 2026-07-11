export default function InvestmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6">
      {children}
    </section>
  );
}

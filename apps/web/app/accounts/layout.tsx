import React from "react";

export default function AccountsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #eee", padding: "1rem" }}>
      <h2>Accounts Section</h2>
      {children}
    </div>
  );
}
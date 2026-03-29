'use client';

import { useDebug } from "../debug/DebugContext";

type Props = {
  name: string;
  balance: string;
  createdAtIso: string;
  active: boolean;
};

export default function AccountSummary({ name, balance, createdAtIso, active }: Props) {
  const { debug } = useDebug();

  return (
    <>
      <h1>{name}</h1>
      <p><b>Balance:</b> {balance}</p>
      {debug && <p><b>Created At:</b> {createdAtIso}</p>}
      <p><b>Active:</b> {active ? "✅" : "❌"}</p>
      <br />
    </>
  );
}

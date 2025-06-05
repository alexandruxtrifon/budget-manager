import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-gray-100 p-4 space-y-4 fixed">
      <Link href="/" className="block font-bold text-xl">Budget App</Link>
      <nav className="space-y-2">
        <Link href="/" className="block">Dashboard</Link>
        <Link href="/accounts" className="block">Accounts</Link>
        <Link href="/transactions" className="block">Transactions</Link>
        <Link href="/budgets" className="block">Budgets</Link>
      </nav>
    </aside>
  );
}
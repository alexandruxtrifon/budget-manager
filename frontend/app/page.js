import SummaryCards from "@/components/SummaryCards";
import TransactionsTable from "@/components/TransactionsTable";
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/ModeToggle";
export default function HomePage() {
  return (
    <div>
      <ModeToggle />
    </div>
  )
}
// export default function Dashboard() {
//   return (
//     <div className="min-h-screen bg-gray-50 px-6 py-8 space-y-8">
//       {/* Header */}
//       <div className="space-y-1">
//         <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
//         <p className="text-muted-foreground text-gray-500">
//           Overview of your finances and recent activity.
//         </p>
//       </div>
//       <Button>Click me</Button>

//       {/* Summary Cards */}
//       <SummaryCards />

//       {/* Transactions Table */}
//       <div className="bg-white shadow-sm rounded-xl p-6">
//         <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
//         <TransactionsTable />
//       </div>
//     </div>
//   );
// }

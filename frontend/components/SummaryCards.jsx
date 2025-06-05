import { Card, CardContent } from "@/components/ui/card";

export default function SummaryCards() {
  const summary = {
    totalBalance: 2400.00,
    totalExpenses: 850.00,
    totalIncome: 3250.00,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4">
          <h2 className="text-sm text-gray-500">Total Balance</h2>
          <p className="text-xl font-bold">€{summary.totalBalance.toFixed(2)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <h2 className="text-sm text-gray-500">Total Expenses</h2>
          <p className="text-xl font-bold text-red-500">€{summary.totalExpenses.toFixed(2)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <h2 className="text-sm text-gray-500">Total Income</h2>
          <p className="text-xl font-bold text-green-600">€{summary.totalIncome.toFixed(2)}</p>
        </CardContent>
      </Card>
    </div>
  );
}

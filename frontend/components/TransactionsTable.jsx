
export default function TransactionsTable() {
  const transactions = [
    {
      id: 1,
      description: "Groceries",
      amount: -45.99,
      date: "2025-05-25",
      category: "Food",
    },
    {
      id: 2,
      description: "Salary",
      amount: 1500.00,
      date: "2025-05-24",
      category: "Income",
    },
    {
      id: 3,
      description: "Netflix Subscription",
      amount: -12.99,
      date: "2025-05-20",
      category: "Entertainment",
    },
  ];

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2 border">Date</th>
              <th className="text-left p-2 border">Description</th>
              <th className="text-left p-2 border">Category</th>
              <th className="text-right p-2 border">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.id}>
                <td className="p-2 border">{tx.date}</td>
                <td className="p-2 border">{tx.description}</td>
                <td className="p-2 border">{tx.category}</td>
                <td className={`p-2 border text-right ${tx.amount < 0 ? "text-red-500" : "text-green-600"}`}>
                  €{Math.abs(tx.amount).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

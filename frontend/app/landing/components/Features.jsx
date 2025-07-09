import {
    BarChart3,
    PieChart,
    Wallet,
    FileText,
    BellRing,
    Calendar,
    BadgeDollarSign,
    ArrowUpDown,
    AreaChart,
    CreditCard
  } from "lucide-react";
  import React from "react";
  
  const features = [
    {
      icon: Wallet,
      title: "Complete Financial Tracking",
      description:
        "Track all your income and expenses in one place with automatic categorization and smart tagging for comprehensive financial management.",
    },
    {
      icon: PieChart,
      title: "Insightful Spending Analytics",
      description:
        "Visualize where your money goes with interactive pie charts and category breakdowns that help identify spending patterns.",
    },
    {
      icon: BarChart3,
      title: "Income and Expense Analysis",
      description:
        "Compare your earnings and spending with intuitive timeline charts over 7-day, 30-day, or 90-day periods to identify trends.",
    },
    {
      icon: BadgeDollarSign,
      title: "Budget Planning Tools",
      description:
        "Set monthly budget limits for different spending categories and track your progress with visual indicators and alerts.",
    },
    {
      icon: FileText,
      title: "Exportable Financial Reports",
      description:
        "Generate comprehensive reports with customizable date ranges that can be exported as PDFs for your records or financial planning.",
    },
    {
      icon: CreditCard,
      title: "Multi-currency Support",
      description:
        "Manage accounts in different currencies including EUR, USD, RON, and GBP with automatic conversion for unified reporting.",
    },
  ];
  
  const Features = () => {
    return (
      <div id="features" className="w-full py-12 xs:py-20 px-6">
        <h2 className="text-3xl xs:text-4xl sm:text-5xl font-bold tracking-tight text-center">
          Powerful Financial Management
        </h2>
        <p className="mt-4 text-lg text-muted-foreground text-center max-w-[800px] mx-auto">
          Take control of your finances with tools that provide clarity and insight into your spending habits.
        </p>
        <div className="w-full max-w-screen-lg mx-auto mt-10 sm:mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col bg-background border rounded-xl py-6 px-5"
            >
              <div className="mb-3 h-10 w-10 flex items-center justify-center bg-muted rounded-full">
                <feature.icon className="h-6 w-6" />
              </div>
              <span className="text-lg font-semibold">{feature.title}</span>
              <p className="mt-1 text-foreground/80 text-[15px]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default Features;
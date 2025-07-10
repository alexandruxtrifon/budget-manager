import {
    BarChart3,
    PieChart,
    ArrowUpDown,
    BadgeDollarSign,
    ShieldCheck,
    Clock,
  } from "lucide-react";
  
  const faq = [
    {
      icon: BadgeDollarSign,
      question: "How can I track my spending in different categories?",
      answer:
        "Our app automatically categorizes your transactions and provides detailed breakdowns of your spending patterns. You can view spending by category through interactive pie charts and customize categories to match your financial needs.",
    },
    {
      icon: BarChart3,
      question: "What kind of financial reports does the app provide?",
      answer:
        "You get comprehensive financial reports including income vs expenses timelines, category spending analysis, monthly comparisons, and net balance tracking. All reports can be customized by date range and exported as PDFs for your records.",
    },
    {
      icon: ArrowUpDown,
      question: "Can I see how my spending changes over time?",
      answer:
        "Absolutely! Our interactive timeline charts show your income and expenses over 7-day, 30-day, or 90-day periods. This helps you spot trends, identify irregular spending patterns, and make better financial decisions.",
    },
    {
      icon: PieChart,
      question: "How does the budget planning feature work?",
      answer:
        "Set monthly budget limits for different spending categories, and the app will track your progress. You'll receive notifications as you approach limits, helping you stay on target with your financial goals.",
    },
    {
      icon: ShieldCheck,
      question: "How is my financial data protected?",
      answer:
        "We use bank-level encryption to protect all your financial information. Your data is stored securely, and we never share your personal details with third parties without your explicit consent.",
    },
    {
      icon: Clock,
      question: "Can I manage accounts in different currencies?",
      answer:
        "Yes! Our app supports multiple currencies including EUR, USD, RON, and GBP. You can track transactions across different accounts, and our system will automatically convert values for comprehensive reporting.",
    },
  ];
  
  const FAQ = () => {
    return (
      <div
        id="faq"
        className="min-h-screen flex items-center justify-center px-6 py-12 xs:py-20"
      >
        <div className="max-w-screen-lg">
          <h2 className="text-3xl xs:text-4xl md:text-5xl !leading-[1.15] font-bold tracking-tight text-center">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 xs:text-lg text-center text-muted-foreground">
            Quick answers to common questions about our service.
          </p>
  
          <div className="mt-12 grid md:grid-cols-2 bg-background rounded-xl overflow-hidden outline outline-[1px] outline-border outline-offset-[-1px]">
            {faq.map(({ question, answer, icon: Icon }) => (
              <div key={question} className="border p-6 -mt-px -ml-px">
                <div className="h-8 w-8 xs:h-10 xs:w-10 flex items-center justify-center rounded-full bg-accent">
                  <Icon className="h-4 w-4 xs:h-6 xs:w-6" />
                </div>
                <div className="mt-3 mb-2 flex items-start gap-2 text-lg xs:text-[1.35rem] font-semibold tracking-tight">
                  <span>{question}</span>
                </div>
                <p className="text-sm xs:text-base">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  export default FAQ;
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CircleCheck, CircleHelp, Github } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

// const tooltipContent = {
//   styles: "Choose from a variety of styles to suit your preferences.",
//   filters: "Choose from a variety of filters to enhance your portraits.",
//   credits: "Use these credits to retouch your portraits.",
// };

// const YEARLY_DISCOUNT = 20;
// const plans = [
//   {
//     name: "Starter",
//     price: 20,
//     description:
//       "Get 20 AI-generated portraits with 2 unique styles and filters.",
//     features: [
//       { title: "5 hours turnaround time" },
//       { title: "20 AI portraits" },
//       { title: "Choice of 2 styles", tooltip: tooltipContent.styles },
//       { title: "Choice of 2 filters", tooltip: tooltipContent.filters },
//       { title: "2 retouch credits", tooltip: tooltipContent.credits },
//     ],
//     buttonText: "Get 20 portraits in 5 hours",
//   },
//   {
//     name: "Advanced",
//     price: 40,
//     isRecommended: true,
//     description:
//       "Get 50 AI-generated portraits with 5 unique styles and filters.",
//     features: [
//       { title: "3 hours turnaround time" },
//       { title: "50 AI portraits" },
//       { title: "Choice of 5 styles", tooltip: tooltipContent.styles },
//       { title: "Choice of 5 filters", tooltip: tooltipContent.filters },
//       { title: "5 retouch credits", tooltip: tooltipContent.credits },
//     ],
//     buttonText: "Get 50 portraits in 3 hours",
//     isPopular: true,
//   },
//   {
//     name: "Premium",
//     price: 80,
//     description:
//       "Get 100 AI-generated portraits with 10 unique styles and filters.",
//     features: [
//       { title: "1-hour turnaround time" },
//       { title: "100 AI portraits" },
//       { title: "Choice of 10 styles", tooltip: tooltipContent.styles },
//       { title: "Choice of 10 filters", tooltip: tooltipContent.filters },
//       { title: "10 retouch credits", tooltip: tooltipContent.credits },
//     ],
//     buttonText: "Get 100 portraits in 1 hour",
//   },
// ];

const plans = [
    {
      name: "Free Forever",
      price: "$0",
      description:
        "Because money management software shouldn't cost... you know... money.",
      features: [
        { title: "100% Free (as in free pizza)" },
        { title: "All features included" },
        { title: "No hidden fees or 'premium' nonsense" },
        { title: "No credit card required (obviously)" },
        { title: "Updates whenever we feel like coding" },
      ],
      buttonText: "Download For Free",
      buttonLink: "https://github.com/alexandruxtrifon/budget-manager/releases",
    },
    {
      name: "Still Free",
      price: "$0",
      isRecommended: true,
      description:
        "The same free plan but with a fancy 'popular' badge to make you click it.",
      features: [
        { title: "Exactly the same features as the free plan" },
        { title: "Still completely free" },
        { title: "This box is taller to look important" },
        { title: "You get the satisfaction of picking the 'popular' option" },
        { title: "We added this badge to make you feel special" },
      ],
      buttonText: "Click Me",
      buttonLink: "https://github.com/alexandruxtrifon/budget-manager/releases",
      isPopular: true,
    },
    {
      name: "Technically Still Free",
      price: "$0",
      description:
        "Contribute to our project and get the warm fuzzies of helping open source.",
      features: [
        { title: "Yep, still free" },
        { title: "Exact same software" },
        { title: "But now with 100% more karma" },
        { title: "Your name in our contributors list (maybe)" },
        { title: "Bragging rights at developer meetups" },
      ],
      buttonText: "Fork on GitHub",
      buttonLink: "https://github.com/alexandruxtrifon/budget-manager",
    },
  ];

const Pricing = () => {
return (
    <div
    id="pricing"
    className="flex flex-col items-center justify-center py-12 xs:py-20 px-6"
    >
    <h1 className="text-3xl xs:text-4xl md:text-5xl font-bold text-center tracking-tight">
        Our Ridiculous Pricing
    </h1>
    <p className="mt-4 text-center text-lg text-muted-foreground max-w-[600px]">
        Budget Manager is 100% free and open source software. No subscriptions, no premium tiers, 
        no upsells. Just free. Forever.
    </p>
    
    <div className="mt-12 max-w-screen-lg mx-auto grid grid-cols-1 lg:grid-cols-3 items-center gap-8">
        {plans.map((plan) => (
        <div
            key={plan.name}
            className={cn("relative border rounded-xl p-6 bg-background/50", {
            "border-[2px] border-white bg-background py-10": plan.isPopular,
            })}
        >
            {plan.isPopular && (
            <Badge className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-white text-gray-900 rounded-full py-1 border-none">
                Most Popular (somehow)
            </Badge>
            )}
            <h3 className="text-lg font-medium">{plan.name}</h3>
            <p className="mt-2 text-4xl font-bold">
            {plan.price}
            <span className="ml-1.5 text-sm text-muted-foreground font-normal">
                /forever
            </span>
            </p>
            <p className="mt-4 font-medium text-muted-foreground">
            {plan.description}
            </p>

            <Link href={plan.buttonLink} target="_blank" rel="noopener noreferrer">
            <Button
                variant={plan.isPopular ? "default" : "outline"}
                size="lg"
                className={plan.isPopular? "w-full mt-6 text-base bg-white text-gray-900 border border-gray-200 hover:bg-gray-200" : "w-full mt-6 text-base"}
            >
                {plan.buttonText} {plan.name === "Technically Still Free" && <Github className="ml-2 h-4 w-4" />}
            </Button>
            </Link>
            <Separator className="my-8" />
            <ul className="space-y-2">
            {plan.features.map((feature) => (
                <li key={feature.title} className="flex items-start gap-1.5">
                <CircleCheck className="h-4 w-4 mt-1 text-green-600" />
                {feature.title}
                </li>
            ))}
            </ul>
        </div>
        ))}
    </div>
    </div>
);
};

// const Pricing = () => {
//   const [selectedBillingPeriod, setSelectedBillingPeriod] = useState("monthly");

//   return (
//     <div
//       id="pricing"
//       className="flex flex-col items-center justify-center py-12 xs:py-20 px-6"
//     >
//       <h1 className="text-3xl xs:text-4xl md:text-5xl font-bold text-center tracking-tight">
//         Pricing
//       </h1>
//       <Tabs
//         value={selectedBillingPeriod}
//         onValueChange={setSelectedBillingPeriod}
//         className="mt-8"
//       >
//         <TabsList className="h-11 px-1.5 rounded-full bg-white/5">
//           <TabsTrigger value="monthly" className="py-1.5 rounded-full">
//             Monthly
//           </TabsTrigger>
//           <TabsTrigger value="yearly" className="py-1.5 rounded-full">
//             Yearly (Save {YEARLY_DISCOUNT}%)
//           </TabsTrigger>
//         </TabsList>
//       </Tabs>
//       <div className="mt-12 max-w-screen-lg mx-auto grid grid-cols-1 lg:grid-cols-3 items-center gap-8">
//         {plans.map((plan) => (
//           <div
//             key={plan.name}
//             className={cn("relative border rounded-xl p-6 bg-background/50", {
//               "border-[2px] border-white bg-background py-10": plan.isPopular,
//             })}
//           >
//             {plan.isPopular && (  //bg-white text-gray-900 rounded-full py-1 border-none
//               <Badge className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-white text-gray-900 rounded-full py-1 border-none">
//                 Most Popular
//               </Badge>
//             )}
//             <h3 className="text-lg font-medium">{plan.name}</h3>
//             <p className="mt-2 text-4xl font-bold">
//               $
//               {selectedBillingPeriod === "monthly"
//                 ? plan.price
//                 : plan.price * ((100 - YEARLY_DISCOUNT) / 100)}
//               <span className="ml-1.5 text-sm text-muted-foreground font-normal">
//                 /month
//               </span>
//             </p>
//             <p className="mt-4 font-medium text-muted-foreground">
//               {plan.description}
//             </p>

//             <Button
//               variant={plan.isPopular ? "default" : "outline"}
//               size="lg"
//               className={plan.isPopular? "w-full mt-6 text-base bg-white text-gray-900 border border-gray-200 hover:bg-gray-200" : "w-full mt-6 text-base"}
//               //className="w-full mt-6 text-base"
//             >
//               {plan.buttonText}
//             </Button>
//             <Separator className="my-8" />
//             <ul className="space-y-2">
//               {plan.features.map((feature) => (
//                 <li key={feature.title} className="flex items-start gap-1.5">
//                   <CircleCheck className="h-4 w-4 mt-1 text-green-600" />
//                   {feature.title}
//                   {feature.tooltip && (
//                     <Tooltip>
//                       <TooltipTrigger className="cursor-help">
//                         <CircleHelp className="h-4 w-4 mt-1 text-gray-500" />
//                       </TooltipTrigger>
//                       <TooltipContent>{feature.tooltip}</TooltipContent>
//                     </Tooltip>
//                   )}
//                 </li>
//               ))}
//             </ul>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

export default Pricing;
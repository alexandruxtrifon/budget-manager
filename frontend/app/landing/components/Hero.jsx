"use client"

import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";
import { ArrowUpRight, CirclePlay } from "lucide-react";
import React, { useState } from "react";
import LogoCloud from "./logo-cloud";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useNavigation } from "@/components/navigation-provider";

const Hero = () => {
  const [videoOpen, setVideoOpen] = useState(false);
  const { startNavigation } = useNavigation();
  const router = useRouter();

  const handleNavigate = (path) => {
    startNavigation(() => {
    router.push(path);
    });
};
  return (
    <>
    <div className="min-h-[calc(100vh-6rem)] flex flex-col items-center py-20 px-6">
      <div className="md:mt-6 flex items-center justify-center">
        <div className="text-center max-w-2xl">
          <Badge className="bg-white text-gray-900 rounded-full py-1 border-none">
            v1.0.0 is available now! 🚀
          </Badge>
          <h1 className="mt-6 max-w-[20ch] text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold !leading-[1.2] tracking-tight">
            Making Cents of Your Finances
          </h1>
          <p className="mt-6 max-w-[60ch] xs:text-lg">
            Take control of your financial future with our powerful budgeting tools.
            Track expenses, set goals, and make smarter money decisions.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row items-center sm:justify-center gap-4">
            <Button
              size="lg"
              className="w-full sm:w-auto rounded-full text-base bg-white text-gray-900 border border-gray-200 hover:bg-gray-200"
              onClick={() => handleNavigate('/register')}
            >
              Get Started <ArrowUpRight className="!h-5 !w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto rounded-full text-base shadow-none"
              onClick={() => setVideoOpen(true)}
            >
              <CirclePlay className="!h-5 !w-5" /> Watch Demo
            </Button>
          </div>
        </div>
      </div>
      <LogoCloud className="mt-24 max-w-3xl mx-auto" />
    </div>
          {/* Rick Roll Dialog */}
          <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
          <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
            <DialogHeader className="p-4">
              <DialogTitle/>
            </DialogHeader>
            <div className="aspect-video w-full">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" 
                title="" 
                className="border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          </DialogContent>
        </Dialog>
        </>
  );
};

export default Hero;
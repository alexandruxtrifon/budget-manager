"use client";

import { Button } from "../ui/button";
import { Logo } from "./logo";
import { NavMenu } from "./nav-menu";
import { NavigationSheet } from "./navigation-sheet";
import ThemeToggle from "../theme-toggle";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNavigation } from "@/components/navigation-provider";
import { ArrowUpRight } from "lucide-react";

const Navbar = () => {
const router = useRouter();
const { startNavigation } = useNavigation();

const handleNavigate = (path) => {
    startNavigation(() => {
    router.push(path);
    });
};
  return (
    <>
    <nav className="fixed z-10 top-6 inset-x-4 h-14 xs:h-16 bg-background/50 backdrop-blur-[4px] border dark:border-slate-700/70 max-w-screen-xl mx-auto rounded-full">
      <div className="h-full flex items-center justify-between mx-auto px-4">
        <Logo />

        {/* Desktop Menu */}
        <NavMenu className="hidden md:block" />

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/register">
          <Button variant="outline" className="hidden sm:inline-flex" 
            onClick={() => handleNavigate('/login')}>
            Sign In
          </Button>
          </Link>
          <Button className=" xs:inline-flex bg-white text-gray-900 border border-gray-200 hover:bg-gray-200"
            onClick={() => handleNavigate('/register')}>
            Get Started 
            <ArrowUpRight className="!h-5 !w-5" />
            </Button>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <NavigationSheet />
          </div>
        </div>
      </div>
    </nav>
    </>
  );
};

export default Navbar;
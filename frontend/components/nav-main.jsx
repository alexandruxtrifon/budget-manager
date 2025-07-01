"use client"

import { IconDashboard, IconCirclePlusFilled, IconMail, IconBuildingBank } from "@tabler/icons-react";

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavMain({
  items,
  ...props
}) {
  const pathname = usePathname();
  return (
    <SidebarMenu {...props}>
      {items.map((item) => {
        const isActive = pathname === item.url;
        
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton 
              asChild 
              className={isActive ? "bg-accent text-accent-foreground" : ""}
            >
              <Link href={item.url}>
                {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                <span className="font-medium">{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

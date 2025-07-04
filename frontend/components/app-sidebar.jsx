"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconBuildingBank,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconHistory,
  IconFile,
  IconFileAnalytics,
  IconChartLine,
  IconChartAreaLine,
  IconChartAreaFilled,
  IconChartColumn,
  IconChartArrows,
  IconChartDots2,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar({
  user,
  onUserUpdate,
  ...props
}) {
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
      isActive: true,
    },
    {
      title: "Accounts",
      url: "/accounts",
      icon: IconBuildingBank,
    },
    {
      title: "Transactions",
      url: "#",
      icon: IconListDetails,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: IconChartBar,
    },
    {
      title: "Forecast",
      url: "/forecast",
      icon: IconChartDots2,
    }
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Activity Logs",
      url: "/logs",
      icon: IconHistory
    },
    {
      name: "Reports",
      url: "#",
      icon: IconReport,
    }
  ],
}

  const documentItems = React.useMemo(() => {
    const items = [
      {
        name: "Data Library",
        url: "#",
        icon: IconDatabase,
      },
      ...(user?.role === 'admin' ? [
        {
          name: "Activity Logs",
          url: "/logs",
          icon: IconHistory
        }
      ] : []),
      {
        name: "Reports",
        url: "#",
        icon: IconReport,
      },
      {
        name: "Aggregate Data",
        url: "/aggregate",
        icon: IconFileAnalytics,
      },
      {
        name: "Users",
        url: "/users",
        icon: IconUsers,
      }
    ];
    
    return items;
  }, [user?.role]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Budget Manager Web</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={documentItems} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onUserUpdate={onUserUpdate}/>
      </SidebarFooter>
    </Sidebar>
  );
}

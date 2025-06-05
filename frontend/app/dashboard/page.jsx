import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/ModeToggle"
//mport { useRouter } from "next/navigation"

import data from "./data.json"

export default function Page() {
  // const router = useRouter();
  // const [isLoading, setIsLoading] = useState(true);
  // const [userName, setUserName] = useState(''); // Example state for user data

  // useEffect(() => {
  //   const token = localStorage.getItem('token');
  //   if (!token) {
  //     router.replace('/login'); // Use replace to avoid adding to history stack
  //   } else {
  //     // Optional: Verify token with backend or fetch user profile
  //     // For now, just assume token means authenticated
  //     setIsLoading(false);
      
  //     // Example: Fetch user profile if you stored user data or want to fetch it
  //     // const fetchProfile = async () => {
  //     //   const res = await fetch('http://localhost:3001/api/profile', {
  //     //     headers: {
  //     //       'Authorization': `Bearer ${token}`
  //     //     }
  //     //   });
  //     //   if (res.ok) {
  //     //     const profile = await res.json();
  //     //     setUserName(profile.full_name);
  //     //   } else {
  //     //     // Token might be invalid or expired
  //     //     localStorage.removeItem('token');
  //     //     router.replace('/login');
  //     //   }
  //     // };
  //     // fetchProfile();
  //   }
  // }, [router]);

  // if (isLoading) {
  //   return <div>Loading dashboard...</div>; // Or a spinner component
  // }

  return (
    <SidebarProvider
    style={
      {
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)"
      }
    }>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

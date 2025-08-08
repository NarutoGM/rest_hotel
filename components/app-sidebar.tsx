"use client"

import type * as React from "react"
import { Home, UtensilsCrossed,Utensils	, Hotel, Settings, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "../components/ui/sidebar"
import { signOut } from "next-auth/react"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeView: string
  setActiveView: (view: string) => void
}

export function AppSidebar({ activeView, setActiveView, ...props }: AppSidebarProps) {
  const router = useRouter()


const handleLogout = () => {
  signOut({ callbackUrl: "/" }) // te redirige a /login después de cerrar sesión
}

  const navigationItems = [
    {
      title: "Reservas",
      items: [
        {
          id: "restaurant-reservations",
          title: "Restaurante",
          icon: UtensilsCrossed,
        },
        {
          id: "hotel-reservations",
          title: "Hotel",
          icon: Hotel,
        },
      ],
    },
    {
      title: "Gestión",
      items: [
        {
          id: "table-management",
          title: "Mesas",
          icon: Home,
        },
        {
          id: "room-management",
          title: "Habitaciones",
          icon: Settings,
        },
        {
          id: "dish-management",
          title: "Dish",
          icon: Utensils	,
        },
      ],
    },
  ]

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="p-2 text-lg font-bold">Sistema de Reservas</div>
      </SidebarHeader>
      <SidebarContent>
        {navigationItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={activeView === item.id}
                      onClick={() => setActiveView(item.id)}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Botón de Logout */}
        <SidebarGroup>
          <SidebarGroupLabel>Cuenta</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <LogOut />
                  <span>Cerrar sesión</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

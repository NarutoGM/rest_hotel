"use client"

import type * as React from "react"
import { useState, useEffect } from "react"
import { Home, UtensilsCrossed, Utensils, Hotel, Settings, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"

// Importar traducciones
import { sidebarTranslations } from "../components/translations/sidebar"

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

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeView: string
  setActiveView: (view: string) => void
}

export function AppSidebar({ activeView, setActiveView, ...props }: AppSidebarProps) {
  const router = useRouter()

  // Estado para el idioma
  const [lang, setLang] = useState<"es" | "en" | "fr">("en")

  // Cargar idioma desde localStorage al montar
  useEffect(() => {
    const savedLang = localStorage.getItem("lang")
    if (savedLang === "es" || savedLang === "en" || savedLang === "fr") {
      setLang(savedLang)
    }
  }, [])

  // Traducciones actuales
  const t = sidebarTranslations[lang]

  const handleLogout = () => {
    signOut({ callbackUrl: "/" })
  }

  const navigationItems = [
    {
      title: t.reservations, // "Reservas"
      items: [
        {
          id: "restaurant-reservations",
          title: t.restaurant, // "Restaurante"
          icon: UtensilsCrossed,
        },
        {
          id: "hotel-reservations",
          title: t.hotel, // "Hotel"
          icon: Hotel,
        },
      ],
    },
    {
      title: t.management, // "Gestión"
      items: [
        {
          id: "table-management",
          title: t.tables, // "Mesas"
          icon: Home,
        },
        {
          id: "room-management",
          title: t.rooms, // "Habitaciones"
          icon: Settings,
        },
        {
          id: "dish-management",
          title: t.dishes, // "Platos"
          icon: Utensils,
        },
      ],
    },
  ]

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="p-2 text-lg font-bold">{t.systemName}</div>
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
          <SidebarGroupLabel>{t.account}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <LogOut />
                  <span>{t.logout}</span>
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

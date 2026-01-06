import type { ReactNode } from "react";
import { useState } from "react";
import { Header } from "@/components/Header/Header";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { TopBar } from "@/components/TopBar/TopBar";
import * as styles from "./AdminLayout.css";

interface AdminLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export function AdminLayout({ children, showSidebar = false }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className={styles.layoutContainer}>
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} showOnDesktop={showSidebar} />

      <main className={`${styles.mainContent} ${showSidebar ? styles.mainContentWithSidebar : ""}`}>
        {/* Header - sempre visível, mas menu hamburguer escondido no desktop quando sidebar está visível */}
        <Header onMenuToggle={handleMenuToggle} hideHamburgerOnDesktop={showSidebar} />
        <TopBar />
        <div className={styles.contentWrapper}>{children}</div>
      </main>
    </div>
  );
}

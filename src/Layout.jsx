import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { Clock, Calendar, BarChart3, LogOut, Menu, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navigationItems = [
  {
    title: "Registrar Ponto",
    url: createPageUrl("Dashboard"),
    icon: Clock,
    description: "Bater ponto e ver status",
  },
  {
    title: "Professores",
    url: createPageUrl("Professores"),
    icon: Users,
    description: "Cadastro e Face ID",
  },
  {
    title: "Histórico",
    url: createPageUrl("Projects"),
    icon: Calendar,
    description: "Registros anteriores",
  },
  {
    title: "Relatórios",
    url: createPageUrl("Assistant"),
    icon: BarChart3,
    description: "Horas e estatísticas",
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch {
      // User not logged in
    }
  };

  const handleLogout = async () => {
    await User.logout();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Menu Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-slate-900">
                    Ponto Eletrônico
                  </h1>
                  <p className="text-xs text-slate-400">Controle de horário</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-slate-400 hover:bg-slate-100"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1.5">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`block p-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-emerald-50 border border-emerald-100"
                      : "hover:bg-slate-50 border border-transparent"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg transition-colors ${
                        isActive
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-500 group-hover:text-slate-700"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p
                        className={`font-medium text-sm ${
                          isActive ? "text-emerald-900" : "text-slate-700"
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-slate-100">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="bg-emerald-600 text-white text-sm font-medium">
                      {user.full_name?.charAt(0) ||
                        user.email?.charAt(0) ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {user.full_name || "Usuário"}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => User.login()}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Entrar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-72">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 p-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-600 hover:bg-slate-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <h1 className="font-bold text-slate-900">Ponto Eletrônico</h1>
            </div>
            <div className="w-10" />
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
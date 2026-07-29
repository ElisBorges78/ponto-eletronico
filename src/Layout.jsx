import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import {
  Clock,
  Calendar,
  BarChart3,
  LogOut,
  Users,
  LayoutDashboard,
  UserCircle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DeleteAccountDialog from "@/components/ponto/DeleteAccountDialog";

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
  {
    title: "Painel Admin",
    url: createPageUrl("Admin"),
    icon: LayoutDashboard,
    description: "Visão consolidada",
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    loadUser();
  }, [user?.role, currentPageName]);

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

  const isAdmin = user?.role === "admin";
  const isGestor = !!user?.tipo_gestor;
  const canManageProfessores = isAdmin || isGestor;
  const visibleNavItems = canManageProfessores
    ? navigationItems.filter(
        (item) =>
          isAdmin ||
          item.title === "Registrar Ponto" ||
          item.title === "Professores"
      )
    : navigationItems.filter((item) => item.title === "Registrar Ponto");

  useEffect(() => {
    if (user && !canManageProfessores && currentPageName !== "Dashboard") {
      navigate(createPageUrl("Dashboard"), { replace: true });
    }
    if (
      user &&
      isGestor &&
      !isAdmin &&
      !["Dashboard", "Professores"].includes(currentPageName)
    ) {
      navigate(createPageUrl("Dashboard"), { replace: true });
    }
  }, [user, isAdmin, isGestor, canManageProfessores, currentPageName, navigate]);

  const bottomNavItems = visibleNavItems.filter(
    (item) => item.title !== "Painel Admin"
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar - desktop only */}
      <div className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex-col">
        <div className="p-6 border-b border-slate-100">
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
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {visibleNavItems.map((item) => {
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
                    <p className="text-xs text-slate-400">{item.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>

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
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
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
              <Button
                variant="ghost"
                onClick={() => setDeleteOpen(true)}
                className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir minha conta
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

      {/* Main Content */}
      <div className="lg:ml-72">
        {/* Mobile Header */}
        <header
          className="lg:hidden bg-white border-b border-slate-200 sticky top-0 z-30"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <h1 className="font-bold text-slate-900">Ponto Eletrônico</h1>
            </div>
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center justify-center"
              aria-label="Configurações"
            >
              {user ? (
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-emerald-600 text-white text-xs font-medium">
                    {user.full_name?.charAt(0) ||
                      user.email?.charAt(0) ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <UserCircle className="w-7 h-7 text-slate-500" />
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-screen pb-24 lg:pb-0">{children}</main>
      </div>

      {/* Bottom Navigation - mobile only */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <Link
                key={item.title}
                to={item.url}
                className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[44px] gap-1 ${
                  isActive ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-none">
                  {item.title}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-emerald-600" /> Minha conta
            </DialogTitle>
          </DialogHeader>
          {user ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-emerald-600 text-white text-sm font-medium">
                    {user.full_name?.charAt(0) ||
                      user.email?.charAt(0) ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {user.full_name || "Usuário"}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSettingsOpen(false);
                  handleLogout();
                }}
                className="w-full justify-start"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSettingsOpen(false);
                  setDeleteOpen(true);
                }}
                className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir minha conta
              </Button>
            </div>
          ) : (
            <div className="py-2">
              <Button
                onClick={() => User.login()}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Entrar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DeleteAccountDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </div>
  );
}
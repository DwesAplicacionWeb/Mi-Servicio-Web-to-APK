import React, { useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  Clock,
  FlaskConical,
  Home,
  LayoutGrid,
  Link2,
  Lock,
  Moon,
  Scale,
  Settings,
  ShieldCheck,
  StickyNote,
  Sun,
  X,
} from 'lucide-react';
import { CalendarView } from './components/CalendarView';
import { CodificadoTraficoView } from './components/CodificadoTraficoView';
import { DayDetailModal } from './components/DayDetailModal';
import { DrugCalculatorView } from './components/DrugCalculatorView';
import { HomeView } from './components/HomeView';
import { HoursBalanceModal } from './components/HoursBalanceModal';
import { LibraryView } from './components/LibraryView';
import { NotesView } from './components/NotesView';
import { PinLockScreen } from './components/PinLockScreen';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SettingsView } from './components/SettingsView';
import { ShortcutsView } from './components/ShortcutsView';
import { TasksView } from './components/TasksView';
import { VdgView } from './components/VdgView';
import { WomanIcon } from './components/WomanIcon';
import { AppProvider, useApp } from './context/AppContext';
import { AppRoute } from './types/app';
import { formatHoursBalance } from './utils/dateUtils';

const ROUTE_TITLES: Record<AppRoute, string> = {
  inicio: 'Inicio',
  calendario: 'Calendario',
  tareas: 'Tareas',
  notas: 'Notas',
  biblioteca: 'Biblioteca Documental',
  codificado: 'Codificado Tráfico',
  drogas: 'Calculadora Drogas',
  vdg: 'VDG / VD',
  accesos: 'Accesos Directos',
  configuracion: 'Configuración',
};

const NAV_ITEMS: Array<{
  id: AppRoute;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'inicio', label: 'Inicio', shortLabel: 'Inicio', icon: Home },
  { id: 'calendario', label: 'Calendario', shortLabel: 'Calendario', icon: CalendarDays },
  { id: 'tareas', label: 'Tareas', shortLabel: 'Tareas', icon: CheckSquare },
  { id: 'notas', label: 'Notas', shortLabel: 'Notas', icon: StickyNote },
  { id: 'biblioteca', label: 'Biblioteca', shortLabel: 'Biblioteca', icon: BookOpen },
  { id: 'codificado', label: 'Codificado Tráfico', shortLabel: 'Tráfico', icon: Scale },
  { id: 'drogas', label: 'Calculadora Drogas', shortLabel: 'Drogas', icon: FlaskConical },
  { id: 'vdg', label: 'VDG / VD', shortLabel: 'VDG / VD', icon: WomanIcon },
  { id: 'accesos', label: 'Accesos Directos', shortLabel: 'Accesos', icon: Link2 },
  { id: 'configuracion', label: 'Configuración', shortLabel: 'Ajustes', icon: Settings },
];

const AppShell: React.FC = () => {
  const {
    state,
    route,
    setRoute,
    isLocked,
    lockApp,
    updateSettings,
    toasts,
  } = useApp();

  const [selectedDayIso, setSelectedDayIso] = useState<string | null>(null);
  const [hoursModalOpen, setHoursModalOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  if (isLocked) {
    return <PinLockScreen />;
  }

  const pendingTasksCount = state.tasks.filter((t) => !t.completada).length;
  const isDark = state.settings.tema === 'dark';

  const mobilePrimaryRoutes: AppRoute[] = ['inicio', 'calendario', 'tareas', 'notas'];
  const isMoreRouteActive = !mobilePrimaryRoutes.includes(route);

  const navigateTo = (target: AppRoute) => {
    setRoute(target);
    setMoreMenuOpen(false);
  };

  const toggleTheme = () => {
    updateSettings({ tema: isDark ? 'light' : 'dark' });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F4F6F9] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-30">
        {/* Brand */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-white shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
            Mi Servicio
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Navegación principal">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = route === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setRoute(item.id)}
                className={`w-full min-h-[44px] flex items-center justify-between gap-3 px-3.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.id === 'tareas' && pendingTasksCount > 0 && (
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {pendingTasksCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button
            type="button"
            onClick={() => setHoursModalOpen(true)}
            className="w-full min-h-[44px] flex items-center justify-between px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs font-medium hover:border-blue-400 transition-colors"
          >
            <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              <span>Saldo horas</span>
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {formatHoursBalance(state.saldoHorasMinutos)}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{isDark ? 'Modo claro' : 'Modo oscuro'}</span>
            </button>
            {state.settings.pinActivo && (
              <button
                type="button"
                onClick={lockApp}
                aria-label="Bloquear aplicación"
                title="Bloquear con PIN"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Lock className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Sticky Mobile Top Bar (48px) / Desktop Top Bar (64px) */}
        <header className="sticky top-0 z-30 h-12 lg:h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldCheck className="h-5 w-5 text-blue-700 dark:text-blue-400 lg:hidden shrink-0" />
            <h1 className="font-display text-base lg:text-xl font-semibold text-slate-900 dark:text-slate-100 truncate">
              <span className="lg:hidden">
                {route === 'inicio' ? 'Mi Servicio' : ROUTE_TITLES[route]}
              </span>
              <span className="hidden lg:inline">{ROUTE_TITLES[route]}</span>
            </h1>
          </div>

          <div className="flex items-center gap-1 lg:gap-3 shrink-0">
            <span className="hidden sm:inline font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {state.user.nombre} · {state.settings.anoTrabajo}
            </span>

            <button
              type="button"
              onClick={() => setHoursModalOpen(true)}
              aria-label="Abrir saldo de horas"
              className="lg:hidden min-h-[40px] inline-flex items-center gap-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 tabular-nums"
            >
              <Clock className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <span>{formatHoursBalance(state.saldoHorasMinutos)}</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              className="lg:hidden min-h-[44px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => setHoursModalOpen(true)}
              className="hidden lg:inline-flex min-h-[40px] items-center gap-2 px-3.5 rounded-xl bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
            >
              <Clock className="h-3.5 w-3.5" />
              <span className="font-mono tabular-nums">
                {formatHoursBalance(state.saldoHorasMinutos)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('configuracion')}
              aria-label="Abrir configuración"
              title="Configuración"
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors ${
                route === 'configuracion'
                  ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Scrollable Content Viewport */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-8 pb-24 lg:pb-10">
          {route === 'inicio' && (
            <HomeView onOpenDayDetail={(iso) => setSelectedDayIso(iso)} />
          )}
          {route === 'calendario' && (
            <CalendarView
              onOpenDayDetail={(iso) => setSelectedDayIso(iso)}
              onOpenHoursModal={() => setHoursModalOpen(true)}
            />
          )}
          {route === 'tareas' && <TasksView />}
          {route === 'notas' && <NotesView />}
          {route === 'biblioteca' && <LibraryView />}
          {route === 'codificado' && <CodificadoTraficoView />}
          {route === 'drogas' && <DrugCalculatorView />}
          {route === 'vdg' && <VdgView />}
          {route === 'accesos' && <ShortcutsView />}
          {route === 'configuracion' && <SettingsView />}
        </main>
      </div>

      {/* Mobile Vertical "Más opciones" Dropdown Sheet */}
      {moreMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 flex flex-col justify-end">
          <button
            type="button"
            aria-label="Cerrar menú de opciones"
            onClick={() => setMoreMenuOpen(false)}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]"
          />
          <div
            role="dialog"
            aria-label="Todas las opciones"
            className="relative z-10 mx-3 mb-[68px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                Todas las opciones
              </span>
              <button
                type="button"
                onClick={() => setMoreMenuOpen(false)}
                aria-label="Cerrar desplegable"
                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 p-1.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = route === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.id)}
                    className={`w-full min-h-[46px] flex items-center justify-between gap-3 px-3 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      {item.id === 'tareas' && pendingTasksCount > 0 && (
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          {pendingTasksCount}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Mobile Bottom Tab Bar (56px height -> total mobile sticky = 48+56 = 104px <= 15% cap) */}
      <nav
        aria-label="Navegación inferior móvil"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pb-safe"
      >
        <div className="grid grid-cols-5 h-14 items-center">
          {NAV_ITEMS.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const active = !moreMenuOpen && route === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active
                    ? 'text-blue-700 dark:text-blue-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] leading-none tracking-tight">{item.shortLabel}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreMenuOpen((prev) => !prev)}
            aria-expanded={moreMenuOpen}
            aria-label="Más opciones"
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
              moreMenuOpen || isMoreRouteActive
                ? 'text-blue-700 dark:text-blue-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <LayoutGrid className="h-5 w-5" />
            <span className="text-[10px] leading-none tracking-tight">Más</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <DayDetailModal fecha={selectedDayIso} onClose={() => setSelectedDayIso(null)} />
      <HoursBalanceModal open={hoursModalOpen} onClose={() => setHoursModalOpen(false)} />

      {/* Offline Connectivity Indicator */}
      <OfflineIndicator />

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-50 flex flex-col gap-2 max-w-xs w-full pointer-events-none"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className="pointer-events-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-900 dark:bg-slate-800 text-white px-4 py-3 text-xs font-medium shadow-lg"
            >
              {t.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

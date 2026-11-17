import React, { useRef, useState } from 'react';
import {
  Download,
  Lock,
  Moon,
  RotateCcw,
  Shield,
  Sun,
  Upload,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getTodayIso } from '../utils/dateUtils';

export const SettingsView: React.FC = () => {
  const {
    state,
    availableYears,
    setWorkingYear,
    updateSettings,
    updateUserName,
    lockApp,
    exportBackupJson,
    importBackupJson,
    resetAllData,
    showToast,
  } = useApp();

  const activeYear = state.settings.anoTrabajo;

  const [userName, setUserName] = useState(state.user.nombre);
  const [pinInput, setPinInput] = useState(state.settings.pinCodigo);
  const [confirmReset, setConfirmReset] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePinSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pinInput)) {
      showToast('El PIN debe tener exactamente 4 dígitos numéricos', 'error');
      return;
    }
    updateSettings({ pinCodigo: pinInput, pinActivo: true });
    showToast('PIN personal activado y guardado', 'success');
  };

  const handleExport = () => {
    const json = exportBackupJson();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mi-servicio-backup-${getTodayIso()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Copia de seguridad descargada', 'success');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = importBackupJson(String(reader.result || ''));
      if (res.ok) {
        showToast('Datos restaurados desde la copia de seguridad', 'success');
      } else {
        showToast(res.error || 'Archivo inválido', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Left Column: Year, Vacaciones & AP, Saldo de horas */}
      <div className="space-y-6">
        {/* Año de trabajo y perfil local */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Año de trabajo y perfil local
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cada 1 de enero se crean automáticamente 27 días de vacaciones y 3 de AP
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="working-year-select"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Año activo
              </label>
              <select
                id="working-year-select"
                value={activeYear}
                onChange={(e) => {
                  const yr = Number(e.target.value);
                  setWorkingYear(yr);
                }}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="local-alias"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Identificador personal
              </label>
              <div className="flex gap-2">
                <input
                  id="local-alias"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="flex-1 min-w-0 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    updateUserName(userName);
                    showToast('Nombre actualizado', 'success');
                  }}
                  className="min-h-[44px] px-3.5 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-xs font-semibold shrink-0"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Right Column: Theme, PIN Security, Backups */}
      <div className="space-y-6">
        {/* Tema claro / oscuro */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Apariencia
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Adaptada para lectura diurna en exterior o servicio nocturno
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => updateSettings({ tema: 'light' })}
              className={`min-h-[52px] flex items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors ${
                state.settings.tema === 'light'
                  ? 'border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <Sun className="h-4 w-4" />
              <span>Tema claro</span>
            </button>

            <button
              type="button"
              onClick={() => updateSettings({ tema: 'dark' })}
              className={`min-h-[52px] flex items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors ${
                state.settings.tema === 'dark'
                  ? 'border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <Moon className="h-4 w-4" />
              <span>Tema oscuro</span>
            </button>
          </div>
        </section>

        {/* Seguridad PIN */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                  Bloqueo por PIN
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {state.settings.pinActivo ? 'Protección activa al iniciar' : 'Desactivado'}
                </p>
              </div>
            </div>

            {state.settings.pinActivo && (
              <button
                type="button"
                onClick={lockApp}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-3 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Bloquear</span>
              </button>
            )}
          </div>

          <form onSubmit={handlePinSave} className="flex items-center gap-2">
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="PIN 4 dígitos"
              className="w-36 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 font-mono text-sm tracking-widest text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none"
            />
            <button
              type="submit"
              className="min-h-[44px] px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold"
            >
              {state.settings.pinActivo ? 'Actualizar PIN' : 'Activar PIN'}
            </button>
            {state.settings.pinActivo && (
              <button
                type="button"
                onClick={() => {
                  updateSettings({ pinActivo: false });
                  showToast('PIN desactivado', 'info');
                }}
                className="min-h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Desactivar
              </button>
            )}
          </form>
        </section>

        {/* Copias de seguridad locales */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Copias de seguridad locales
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Exporta o restaura tus turnos, saldo de horas, tareas y accesos en formato JSON
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExport}
              className="min-h-[44px] inline-flex items-center gap-2 px-4 rounded-xl bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Exportar datos</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[44px] inline-flex items-center gap-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>Importar copia</span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Restablecer datos de fábrica</span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 p-3">
                <span className="text-xs font-medium text-rose-800 dark:text-rose-200 mr-auto">
                  ¿Borrar tus datos actuales y restaurar los iniciales?
                </span>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="min-h-[36px] px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetAllData();
                    setConfirmReset(false);
                    showToast('Datos restablecidos', 'info');
                  }}
                  className="min-h-[36px] px-3 rounded-lg bg-rose-600 text-white text-xs font-semibold"
                >
                  Confirmar
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

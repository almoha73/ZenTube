import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Server, Plus, Check, Zap, Globe, Shield } from 'lucide-react';
import { invidiousApi } from '../services/invidiousApi';

interface InstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInstance: string;
  onSelectInstance: (instance: string) => void;
}

interface InstancePingState {
  url: string;
  domain: string;
  ping: number | null;
  status: 'idle' | 'testing' | 'success' | 'error';
}

export const InstanceModal: React.FC<InstanceModalProps> = ({
  isOpen,
  onClose,
  currentInstance,
  onSelectInstance,
}) => {
  const [instances, setInstances] = useState<InstancePingState[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [isTestingAll, setIsTestingAll] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const list = invidiousApi.getAllInstances();
      setInstances(
        list.map((url) => ({
          url,
          domain: url.replace(/^https?:\/\//, '').replace(/\/.*$/, ''),
          ping: null,
          status: 'idle',
        }))
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const testSingleInstance = async (instUrl: string): Promise<number | null> => {
    setInstances((prev) =>
      prev.map((item) =>
        item.url === instUrl ? { ...item, status: 'testing' } : item
      )
    );

    const res = await invidiousApi.pingInstance(instUrl);
    
    setInstances((prev) =>
      prev.map((item) =>
        item.url === instUrl
          ? {
              ...item,
              ping: res.success ? res.latency : null,
              status: res.success ? 'success' : 'error',
            }
          : item
      )
    );

    return res.success ? res.latency : null;
  };

  const testAllPings = async () => {
    setIsTestingAll(true);
    const promises = instances.map((inst) => testSingleInstance(inst.url));
    await Promise.allSettled(promises);

    // Sort by fastest response
    setInstances((prev) =>
      [...prev].sort((a, b) => {
        if (a.ping === null && b.ping === null) return 0;
        if (a.ping === null) return 1;
        if (b.ping === null) return -1;
        return a.ping - b.ping;
      })
    );

    setIsTestingAll(false);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    let formatted = customInput.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = `https://${formatted}`;
    }

    invidiousApi.addCustomInstance(formatted);
    onSelectInstance(formatted);
    setCustomInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-zen-card border border-zen-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zen-border bg-zen-surface/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand/10 text-brand">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Instances Invidious</h2>
              <p className="text-xs text-zen-muted">
                Bascule automatique & réseau décentralisé sans tracking
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-zen-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-6 py-3 bg-brand/5 border-b border-brand/10 flex items-center gap-2 text-xs text-slate-300">
          <Shield className="w-4 h-4 text-brand shrink-0" />
          <span>
            ZenTube bascule automatiquement vers une autre instance saine en cas d'erreur réseau ou de limite de débit.
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          {/* Custom instance form */}
          <form onSubmit={handleAddCustom} className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Ajouter une instance personnalisée (ex: invidious.drgns.space)..."
                className="w-full pl-9 pr-3 py-2 bg-zen-bg border border-zen-border rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={!customInput.trim()}
              className="px-4 py-2 bg-zen-surface hover:bg-zen-hover border border-zen-border disabled:opacity-50 text-white rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </form>

          {/* Test pings action */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Instances disponibles ({instances.length})
            </span>

            <button
              onClick={testAllPings}
              disabled={isTestingAll}
              className="text-xs font-medium text-brand hover:text-brand-400 flex items-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingAll ? 'animate-spin' : ''}`} />
              {isTestingAll ? 'Test des pings en cours...' : 'Tester tous les pings'}
            </button>
          </div>

          {/* List of Instances */}
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
            {instances.map((inst) => {
              const isSelected = inst.url === currentInstance;

              return (
                <div
                  key={inst.url}
                  onClick={() => {
                    onSelectInstance(inst.url);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-brand/10 border-brand/40 text-white ring-1 ring-brand/30'
                      : 'bg-zen-surface/40 hover:bg-zen-surface border-zen-border/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isSelected
                          ? 'bg-brand shadow-[0_0_8px_rgba(255,0,51,0.8)]'
                          : inst.status === 'success'
                          ? 'bg-emerald-500'
                          : inst.status === 'error'
                          ? 'bg-rose-500'
                          : 'bg-slate-500'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate flex items-center gap-2">
                        {inst.domain}
                        {isSelected && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand text-white">
                            Actif
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 truncate">{inst.url}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {inst.status === 'testing' && (
                      <span className="text-xs text-amber-400 flex items-center gap-1 font-mono">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        ...
                      </span>
                    )}

                    {inst.status === 'success' && inst.ping !== null && (
                      <span
                        className={`text-xs font-mono px-2 py-0.5 rounded-md ${
                          inst.ping < 200
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : inst.ping < 500
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        <Zap className="w-3 h-3 inline mr-0.5" />
                        {inst.ping}ms
                      </span>
                    )}

                    {inst.status === 'error' && (
                      <span className="text-xs font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">
                        Échec
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        testSingleInstance(inst.url);
                      }}
                      title="Tester cette instance"
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-zen-hover transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-zen-surface/80 border-t border-zen-border flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zen-surface hover:bg-zen-hover border border-zen-border text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Server, Activity, ShieldCheck } from 'lucide-react';

interface StatusBadgeProps {
  instance: string;
  latency: number;
  onClick: () => void;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ instance, latency, onClick }) => {
  // Extract clean domain name from URL
  let domain = instance.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  // Determine status color based on latency
  let statusColor = 'bg-emerald-500';
  let badgeBorder = 'border-emerald-500/30';
  let badgeBg = 'bg-emerald-500/10';
  let textColor = 'text-emerald-400';

  if (latency > 600) {
    statusColor = 'bg-rose-500';
    badgeBorder = 'border-rose-500/30';
    badgeBg = 'bg-rose-500/10';
    textColor = 'text-rose-400';
  } else if (latency > 250) {
    statusColor = 'bg-amber-500';
    badgeBorder = 'border-amber-500/30';
    badgeBg = 'bg-amber-500/10';
    textColor = 'text-amber-400';
  }

  return (
    <button
      onClick={onClick}
      title="Cliquez pour changer d'instance Invidious ou tester la latence"
      className={`group flex items-center gap-2.5 px-3 py-1.5 rounded-full border ${badgeBorder} ${badgeBg} hover:bg-zen-surface hover:border-zen-border transition-all duration-200 text-xs font-medium backdrop-blur-sm cursor-pointer shadow-sm`}
    >
      <div className="relative flex items-center justify-center">
        <span className={`w-2 h-2 rounded-full ${statusColor}`} />
        <span className={`absolute w-2 h-2 rounded-full ${statusColor} animate-ping opacity-75`} />
      </div>

      <div className="flex items-center gap-1.5">
        <Server className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
        <span className="text-slate-200 font-semibold max-w-[110px] sm:max-w-none truncate">
          {domain}
        </span>
      </div>

      <div className="hidden sm:flex items-center gap-1 border-l border-slate-700/60 pl-2">
        <Activity className={`w-3 h-3 ${textColor}`} />
        <span className={`${textColor} font-mono font-medium`}>{latency}ms</span>
      </div>

      <div className="hidden md:flex items-center text-slate-400 group-hover:text-slate-200 transition-colors">
        <ShieldCheck className="w-3.5 h-3.5 text-brand" />
      </div>
    </button>
  );
};

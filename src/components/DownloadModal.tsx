import React, { useState } from 'react';
import {
  X,
  Download,
  Music,
  Film,
  Image,
  ExternalLink,
  Check,
  Copy,
  Sparkles,
  ShieldCheck,
  Headphones,
} from 'lucide-react';
import { InvidiousVideoDetail, InvidiousVideoSummary } from '../types';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: InvidiousVideoDetail | InvidiousVideoSummary;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  video,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'thumbnail'>('video');
  const [copied, setCopied] = useState(false);
  const [downloadingThumb, setDownloadingThumb] = useState(false);

  if (!isOpen || !video) return null;

  const videoId = video.videoId;
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const highResThumb =
    video.videoThumbnails?.find((t) => t.quality === 'maxres' || t.quality === 'high')?.url ||
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  const copyUrl = () => {
    navigator.clipboard.writeText(youtubeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadThumbnail = async () => {
    setDownloadingThumb(true);
    try {
      const response = await fetch(highResThumb);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${(video.title || 'video').replace(/[/\\?%*:|"<>]/g, '_')}-miniature.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(highResThumb, '_blank');
    } finally {
      setDownloadingThumb(false);
    }
  };

  // Curated fast and safe download options
  const downloadServices = {
    video: [
      {
        name: '10Downloader (Recommandé)',
        desc: 'Téléchargement direct MP4 Full HD 1080p, 720p sans publicité',
        url: `https://10downloader.com/download?v=${videoId}`,
        badge: 'Rapide & Propre',
        color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400',
      },
      {
        name: 'SnapSave Ultra HD',
        desc: 'Supporte les résolutions 1080p, 2K, 4K et 720p',
        url: `https://snapsave.io/fr?query=${encodeURIComponent(youtubeUrl)}`,
        badge: 'Haute Définition',
        color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400',
      },
      {
        name: 'Y2Mate MP4',
        desc: 'Téléchargement rapide de vidéos MP4 en plusieurs résolutions',
        url: `https://www.y2mate.com/fr/youtube/${videoId}`,
        badge: 'Multi-formats',
        color: 'from-violet-500/20 to-purple-500/20 border-violet-500/30 text-violet-400',
      },
    ],
    audio: [
      {
        name: '10Downloader Audio (MP3 / M4A)',
        desc: 'Extraction audio directe en MP3 ou M4A haute fidélité',
        url: `https://10downloader.com/download?v=${videoId}`,
        badge: 'Sans Pub',
        color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400',
      },
      {
        name: 'Y2Mate MP3 (320 kbps)',
        desc: 'Conversion audio MP3 haute fidélité pour écoute nomade',
        url: `https://www.y2mate.com/fr/youtube-mp3/${videoId}`,
        badge: '320 kbps',
        color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400',
      },
      {
        name: 'YTmp3 Audio',
        desc: 'Convertisseur instantané pour musique et podcasts',
        url: `https://ytmp3.mobi/fr/watch?v=${videoId}`,
        badge: 'Instantané',
        color: 'from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-400',
      },
    ],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-zen-card/95 border border-zen-border/80 rounded-3xl shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zen-border/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand/10 border border-brand/20 text-brand">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Télécharger
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-brand/20 text-brand">
                  HD & MP3
                </span>
              </h2>
              <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-sm" title={video.title}>
                {video.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-zen-surface transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video preview mini banner */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-zen-surface/60 border border-zen-border/40">
            <img
              src={highResThumb}
              alt={video.title}
              className="w-16 h-10 object-cover rounded-lg border border-zen-border/40 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{video.title}</p>
              <p className="text-[11px] text-slate-400 truncate">{video.author}</p>
            </div>
            <button
              onClick={copyUrl}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zen-card hover:bg-zen-surface text-slate-300 hover:text-white border border-zen-border/60 text-[11px] font-medium transition-colors shrink-0 cursor-pointer"
              title="Copier le lien de la vidéo"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier le lien</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-5 pt-2 border-b border-zen-border/40 gap-2">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-semibold transition-all relative cursor-pointer ${
              activeTab === 'video' ? 'text-brand' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Vidéo MP4</span>
            {activeTab === 'video' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full shadow-[0_0_12px_rgba(244,63,94,0.6)]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-semibold transition-all relative cursor-pointer ${
              activeTab === 'audio' ? 'text-brand' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Audio MP3</span>
            {activeTab === 'audio' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full shadow-[0_0_12px_rgba(244,63,94,0.6)]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('thumbnail')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-semibold transition-all relative cursor-pointer ${
              activeTab === 'thumbnail' ? 'text-brand' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Image className="w-4 h-4" />
            <span>Miniature HD</span>
            {activeTab === 'thumbnail' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full shadow-[0_0_12px_rgba(244,63,94,0.6)]" />
            )}
          </button>
        </div>

        {/* Tab content */}
        <div className="p-5 max-h-80 overflow-y-auto">
          {activeTab === 'video' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                <span>Choisissez une passerelle de téléchargement :</span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" /> 1080p / 720p
                </span>
              </div>

              {downloadServices.video.map((service, idx) => (
                <a
                  key={idx}
                  href={service.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between p-3.5 rounded-2xl bg-zen-surface/60 hover:bg-zen-surface border border-zen-border/60 hover:border-brand/40 transition-all hover:scale-[1.01] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white transition-colors">
                      <Film className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-white">
                          {service.name}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border bg-gradient-to-r ${service.color}`}
                        >
                          {service.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{service.desc}</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-brand transition-colors shrink-0" />
                </a>
              ))}
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                <span>Convertir et télécharger la piste audio :</span>
                <span className="flex items-center gap-1 text-[11px] text-amber-400">
                  <Headphones className="w-3.5 h-3.5" /> MP3 320kbps
                </span>
              </div>

              {downloadServices.audio.map((service, idx) => (
                <a
                  key={idx}
                  href={service.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between p-3.5 rounded-2xl bg-zen-surface/60 hover:bg-zen-surface border border-zen-border/60 hover:border-brand/40 transition-all hover:scale-[1.01] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                      <Music className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-white">
                          {service.name}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border bg-gradient-to-r ${service.color}`}
                        >
                          {service.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{service.desc}</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-brand transition-colors shrink-0" />
                </a>
              ))}
            </div>
          )}

          {activeTab === 'thumbnail' && (
            <div className="flex flex-col gap-4 items-center text-center">
              <div className="relative rounded-2xl overflow-hidden border border-zen-border/80 w-full max-h-48 group">
                <img src={highResThumb} alt={video.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="px-3 py-1 rounded-xl bg-black/70 text-xs text-white backdrop-blur-md">
                    Haute Résolution (1280×720)
                  </span>
                </div>
              </div>

              <div className="w-full flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleDownloadThumbnail}
                  disabled={downloadingThumb}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-brand hover:bg-brand-hover text-white font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-brand/20 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {downloadingThumb ? 'Téléchargement...' : 'Télécharger la miniature (JPG HD)'}
                  </span>
                </button>
                <p className="text-[11px] text-slate-400">
                  Le fichier est enregistré directement dans votre dossier Téléchargements.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zen-surface/40 border-t border-zen-border/60 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            <span>Service gratuit et sans limite</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-medium transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

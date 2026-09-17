import React, { useState, useRef } from 'react';
import {
  Heart,
  Search,
  Trash2,
  Play,
  VideoOff,
  Clock,
  ListMusic,
  Layers,
  ExternalLink,
  Shuffle,
  Download,
  Upload,
  Cloud,
  CloudUpload,
  RefreshCw,
  Users,
  UserMinus,
} from 'lucide-react';
import { FavoriteItem, FavoritePlaylistItem, SubscriptionItem } from '../types';
import { formatDuration, formatPublishedDate } from '../utils/formatters';

interface FavoritesViewProps {
  favorites: FavoriteItem[];
  favoritePlaylists: FavoritePlaylistItem[];
  subscriptions?: SubscriptionItem[];
  onSelectVideo: (videoId: string) => void;
  onOpenPlaylist: (playlistId: string) => void;
  onPlayPlaylist: (playlist: FavoritePlaylistItem) => void;
  onPlayShuffleVideos?: (favorites: FavoriteItem[]) => void;
  onPlayShufflePlaylist?: (playlist: FavoritePlaylistItem) => void;
  onRemoveFavorite: (videoId: string) => void;
  onRemoveFavoritePlaylist: (playlistId: string) => void;
  onClearAll: () => void;
  onClearPlaylists: () => void;
  onOpenChannel?: (channelId: string, channelName: string) => void;
  onUnsubscribe?: (channelId: string, channelName: string) => void;
  onClearSubscriptions?: () => void;
  onExportData?: () => void;
  onImportData?: (imported: any) => void;
  isGdriveAvailable?: boolean;
  isSyncingGdrive?: boolean;
  onSyncGdrive?: () => void;
  onRestoreGdrive?: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  favorites,
  favoritePlaylists,
  subscriptions = [],
  onSelectVideo,
  onOpenPlaylist,
  onPlayPlaylist,
  onPlayShuffleVideos,
  onPlayShufflePlaylist,
  onRemoveFavorite,
  onRemoveFavoritePlaylist,
  onClearAll,
  onClearPlaylists,
  onOpenChannel,
  onUnsubscribe,
  onClearSubscriptions,
  onExportData,
  onImportData,
  isGdriveAvailable = false,
  isSyncingGdrive = false,
  onSyncGdrive,
  onRestoreGdrive,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'videos' | 'playlists' | 'subscriptions'>('videos');
  const [filterQuery, setFilterQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredVideoFavorites = favorites.filter(
    (item) =>
      item.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const filteredPlaylistFavorites = favoritePlaylists.filter(
    (item) =>
      item.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const filteredSubscriptions = subscriptions.filter(
    (item) =>
      item.author.toLowerCase().includes(filterQuery.toLowerCase()) ||
      item.authorId.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const totalFavorites = favorites.length + favoritePlaylists.length + subscriptions.length;

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (onImportData) {
          onImportData(parsed);
        }
      } catch (err) {
        alert("Erreur lors de la lecture du fichier de sauvegarde. Assurez-vous qu'il s'agit d'un fichier .json valide.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (totalFavorites === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl bg-zen-card/40 border border-zen-border/40 my-6 animate-fade-in">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".json,application/json"
          className="hidden"
        />
        <div className="p-4 rounded-2xl bg-brand/10 text-brand mb-4 ring-1 ring-brand/20">
          <Heart className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">Aucun favori ni abonnement enregistré</h3>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          Cliquez sur le cœur d'une vidéo ou sur « Mettre en favoris » sur une playlist, ou abonnez-vous à une chaîne pour la sauvegarder localement et la retrouver ici à tout moment.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {onImportData && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 bg-zen-surface hover:bg-zen-hover border border-zen-border text-white text-xs sm:text-sm font-semibold rounded-2xl transition-all cursor-pointer shadow-lg hover:border-brand/40"
            >
              <Upload className="w-4 h-4 text-brand" />
              <span>Importer une sauvegarde (.json)</span>
            </button>
          )}

          {isGdriveAvailable && onRestoreGdrive && (
            <button
              type="button"
              onClick={onRestoreGdrive}
              disabled={isSyncingGdrive}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 hover:text-white text-xs sm:text-sm font-semibold rounded-2xl transition-all cursor-pointer shadow-lg disabled:opacity-50"
            >
              {isSyncingGdrive ? (
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
              ) : (
                <Cloud className="w-4 h-4 text-blue-400" />
              )}
              <span>Restaurer depuis Google Drive</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Hidden File Input for Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Header with Title, Search and Clear */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zen-border/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-brand/10 text-brand">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Mes Favoris & Abonnements</h2>
            <p className="text-xs text-slate-400">
              {favorites.length} vidéo{favorites.length > 1 ? 's' : ''}, {favoritePlaylists.length} playlist{favoritePlaylists.length > 1 ? 's' : ''} et {subscriptions.length} chaîne{subscriptions.length > 1 ? 's' : ''} enregistrée{totalFavorites > 1 ? 's' : ''} sur cet appareil
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          {/* Search inside favorites */}
          <div className="relative flex-1 sm:w-56 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={
                activeSubTab === 'videos'
                  ? 'Filtrer mes vidéos...'
                  : activeSubTab === 'playlists'
                  ? 'Filtrer mes playlists...'
                  : 'Filtrer mes abonnements...'
              }
              className="w-full pl-9 pr-3 py-2 bg-zen-card border border-zen-border rounded-xl text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand"
            />
          </div>

          {/* Quick Shuffle Videos button */}
          {activeSubTab === 'videos' && filteredVideoFavorites.length > 1 && (
            <button
              onClick={() => {
                if (onPlayShuffleVideos) {
                  onPlayShuffleVideos(filteredVideoFavorites);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-brand/10 hover:bg-brand/20 text-brand border border-brand/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0"
              title="Lire tous les favoris en mode aléatoire"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Aléatoire</span>
            </button>
          )}

          {/* Google Drive Sync Button */}
          {isGdriveAvailable && onSyncGdrive && (
            <button
              type="button"
              onClick={onSyncGdrive}
              disabled={isSyncingGdrive}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 hover:text-white border border-blue-500/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              title="Sauvegarder directement dans le dossier 'ZenTube' de votre Google Drive"
            >
              {isSyncingGdrive ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
              ) : (
                <CloudUpload className="w-3.5 h-3.5 text-blue-400" />
              )}
              <span className="hidden sm:inline">Google Drive</span>
            </button>
          )}

          {/* Export Button */}
          {onExportData && (
            <button
              type="button"
              onClick={onExportData}
              className="flex items-center gap-1.5 px-3 py-2 bg-zen-surface hover:bg-zen-hover text-slate-300 hover:text-white border border-zen-border rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0"
              title="Exporter tous vos favoris et playlists dans un fichier .json"
            >
              <Download className="w-3.5 h-3.5 text-brand" />
              <span className="hidden sm:inline">Exporter</span>
            </button>
          )}

          {/* Import Button */}
          {onImportData && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 bg-zen-surface hover:bg-zen-hover text-slate-300 hover:text-white border border-zen-border rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0"
              title="Importer des favoris depuis un fichier .json"
            >
              <Upload className="w-3.5 h-3.5 text-brand" />
              <span className="hidden sm:inline">Importer</span>
            </button>
          )}

          <button
            onClick={
              activeSubTab === 'videos'
                ? onClearAll
                : activeSubTab === 'playlists'
                ? onClearPlaylists
                : onClearSubscriptions
            }
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0"
            title={
              activeSubTab === 'videos'
                ? 'Effacer toutes les vidéos favorites'
                : activeSubTab === 'playlists'
                ? 'Effacer toutes les playlists favorites'
                : 'Supprimer tous les abonnements'
            }
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tout effacer</span>
          </button>
        </div>
      </div>

      {/* Subtabs: Videos vs Playlists vs Subscriptions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveSubTab('videos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'videos'
              ? 'bg-brand text-white shadow-md shadow-brand/20'
              : 'bg-zen-card hover:bg-zen-surface text-slate-400 hover:text-slate-200 border border-zen-border'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>Vidéos</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30">
            {favorites.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('playlists')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'playlists'
              ? 'bg-brand text-white shadow-md shadow-brand/20'
              : 'bg-zen-card hover:bg-zen-surface text-slate-400 hover:text-slate-200 border border-zen-border'
          }`}
        >
          <ListMusic className="w-4 h-4" />
          <span>Playlists</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30">
            {favoritePlaylists.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('subscriptions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'subscriptions'
              ? 'bg-brand text-white shadow-md shadow-brand/20'
              : 'bg-zen-card hover:bg-zen-surface text-slate-400 hover:text-slate-200 border border-zen-border'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Abonnements</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30">
            {subscriptions.length}
          </span>
        </button>
      </div>

      {/* Content based on active subtab */}
      {activeSubTab === 'videos' ? (
        /* VIDEOS TAB */
        favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 bg-zen-card/30 rounded-3xl border border-zen-border/40">
            <VideoOff className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-300">Aucune vidéo favorite enregistrée.</p>
          </div>
        ) : filteredVideoFavorites.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Aucun résultat pour « {filterQuery} ».
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredVideoFavorites.map((item) => (
              <div
                key={item.videoId}
                onClick={() => onSelectVideo(item.videoId)}
                className="group flex flex-col gap-3 rounded-2xl p-2.5 bg-zen-card/60 hover:bg-zen-card border border-zen-border/40 hover:border-zen-border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer relative"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zen-surface">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Duration Badge */}
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/85 text-slate-100 text-xs font-mono font-medium backdrop-blur-sm">
                    {formatDuration(item.lengthSeconds)}
                  </div>

                  {/* Hover Play Button */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFavorite(item.videoId);
                    }}
                    title="Supprimer des favoris"
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-rose-600 text-slate-200 hover:text-white transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Info */}
                <div className="flex flex-col px-1">
                  <h3 className="text-sm font-semibold text-slate-100 group-hover:text-brand-300 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <span className="text-xs text-slate-400 mt-1">{item.author}</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Ajouté {formatPublishedDate(item.savedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeSubTab === 'playlists' ? (
        /* PLAYLISTS TAB */
        favoritePlaylists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 bg-zen-card/30 rounded-3xl border border-zen-border/40">
            <ListMusic className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-200 mb-1">Aucune playlist favorite</p>
            <p className="text-xs text-slate-400 max-w-sm">
              Visitez une chaîne et cliquez sur le cœur d'une playlist, ou collez un lien de playlist YouTube dans la barre de recherche pour la sauvegarder.
            </p>
          </div>
        ) : filteredPlaylistFavorites.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Aucune playlist trouvée pour « {filterQuery} ».
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredPlaylistFavorites.map((playlist) => (
              <div
                key={playlist.playlistId}
                onClick={() => onOpenPlaylist(playlist.playlistId)}
                className="group flex flex-col bg-zen-card/70 hover:bg-zen-card border border-zen-border/60 hover:border-brand/40 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer relative"
              >
                {/* Thumbnail with Stacking Badge */}
                <div className="relative aspect-video w-full bg-zen-surface overflow-hidden">
                  {playlist.thumbnailUrl ? (
                    <img
                      src={playlist.thumbnailUrl}
                      alt={playlist.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600">
                      <ListMusic className="w-12 h-12" />
                    </div>
                  )}

                  {/* Stacking layer badge */}
                  <div className="absolute right-2 bottom-2 px-2.5 py-1 bg-black/80 backdrop-blur-md rounded-lg text-[11px] font-semibold text-slate-200 flex items-center gap-1.5 border border-white/10 shadow-lg">
                    <Layers className="w-3.5 h-3.5 text-brand" />
                    <span>{playlist.videoCount || 'Playlist'}</span>
                  </div>

                  {/* Hover Overlay "Tout lire" / "Aléatoire" */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs font-bold backdrop-blur-[2px]">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayPlaylist(playlist);
                      }}
                      className="w-10 h-10 rounded-full bg-brand flex items-center justify-center shadow-lg shadow-brand/50 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                      title="Lire la playlist dans l'ordre"
                    >
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>

                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onPlayShufflePlaylist) {
                          onPlayShufflePlaylist(playlist);
                        } else {
                          onPlayPlaylist(playlist);
                        }
                      }}
                      className="w-10 h-10 rounded-full bg-zen-surface/90 hover:bg-brand border border-white/20 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                      title="Lire en mode aléatoire"
                    >
                      <Shuffle className="w-4 h-4 text-slate-200" />
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFavoritePlaylist(playlist.playlistId);
                    }}
                    title="Supprimer des favoris"
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-rose-600 text-slate-200 hover:text-white transition-colors cursor-pointer z-10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Playlist Info */}
                <div className="p-4 flex flex-col gap-1.5 flex-1 justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-100 line-clamp-2 group-hover:text-brand transition-colors">
                      {playlist.title}
                    </h3>
                    <span className="text-xs text-slate-400 mt-1 block">{playlist.author}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-zen-border/40">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatPublishedDate(playlist.savedAt)}
                    </span>
                    <span className="text-brand font-semibold group-hover:underline">
                      Afficher →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* SUBSCRIPTIONS TAB */
        subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 bg-zen-card/30 rounded-3xl border border-zen-border/40">
            <Users className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-200 mb-1">Aucun abonnement enregistré</p>
            <p className="text-xs text-slate-400 max-w-sm">
              Abonnez-vous à une chaîne en cliquant sur « S'abonner » sous une vidéo ou sur sa page pour la retrouver facilement ici sans compte Google.
            </p>
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Aucun abonnement trouvé pour « {filterQuery} ».
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredSubscriptions.map((sub) => (
              <div
                key={sub.authorId}
                onClick={() => onOpenChannel && onOpenChannel(sub.authorId, sub.author)}
                className="group flex items-center justify-between p-3.5 rounded-2xl bg-zen-card/70 hover:bg-zen-card border border-zen-border/60 hover:border-brand/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer relative"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  {sub.authorThumbnail ? (
                    <img
                      src={sub.authorThumbnail}
                      alt={sub.author}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-2xl object-cover bg-zen-surface border border-zen-border group-hover:border-brand shrink-0 transition-colors shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand to-rose-600 flex items-center justify-center font-black text-lg text-white shrink-0 shadow-sm">
                      {sub.author ? sub.author.charAt(0).toUpperCase() : 'Y'}
                    </div>
                  )}
                  <div className="min-w-0 flex flex-col">
                    <span className="text-sm font-bold text-slate-100 group-hover:text-brand transition-colors truncate">
                      {sub.author}
                    </span>
                    <span className="text-[11px] text-slate-400 truncate">
                      {sub.subscribedAt ? `Abonné ${formatPublishedDate(sub.subscribedAt)}` : 'Chaîne suivie'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onUnsubscribe) {
                      onUnsubscribe(sub.authorId, sub.author);
                    }
                  }}
                  title={`Se désabonner de ${sub.author}`}
                  className="p-2 rounded-xl bg-zen-surface/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-zen-border/40 hover:border-rose-500/30 transition-colors cursor-pointer shrink-0"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

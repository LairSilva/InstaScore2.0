import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bookmark, 
  Search, 
  Filter, 
  Trash2, 
  Copy, 
  Check, 
  FileText, 
  Layers, 
  Video, 
  Instagram, 
  Calendar, 
  Sparkles, 
  Plus, 
  ExternalLink,
  Clock,
  Eye
} from "lucide-react";
import { ContentIdea, ContentFormatType, ContentItemStatus } from "../../types/content-engine";
import { ContentDetailModal } from "../../components/content/ContentDetailModal";
import { apiFetch } from "../../lib/api-client";

interface ContentLibraryViewProps {
  onNavigateToCreate?: () => void;
  isPro?: boolean;
}

export const ContentLibraryView: React.FC<ContentLibraryViewProps> = ({
  onNavigateToCreate,
  isPro = false
}) => {
  const [items, setItems] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<ContentFormatType | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<ContentItemStatus | "all">("all");
  const [inspectingIdea, setInspectingIdea] = useState<ContentIdea | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load items from API or localStorage
  useEffect(() => {
    const loadLibrary = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<{ success: boolean; items: ContentIdea[] }>("/api/content/library");
        if (data.items && data.items.length > 0) {
          setItems(data.items);
          return;
        }
        // Fallback to local storage if empty
        const local = localStorage.getItem("instascore_content_library");
        if (local) {
          setItems(JSON.parse(local));
        }
      } catch (err) {
        console.warn("Could not fetch library from server, loading local backup", err);
        const local = localStorage.getItem("instascore_content_library");
        if (local) setItems(JSON.parse(local));
      } finally {
        setLoading(false);
      }
    };
    loadLibrary();
  }, []);

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    localStorage.setItem("instascore_content_library", JSON.stringify(updated));

    try {
      await apiFetch(`/api/content/library/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete from server", err);
    }
  };

  const handleCopyCaption = (idea: ContentIdea, e: React.MouseEvent) => {
    e.stopPropagation();
    const payload = idea.content?.data as any;
    const text = payload?.caption || idea.caption || idea.title;
    navigator.clipboard.writeText(text);
    setCopiedId(idea.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredItems = items.filter(item => {
    if (selectedFormat !== "all" && item.type !== selectedFormat) return false;
    if (selectedStatus !== "all" && item.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchHook = item.hook?.toLowerCase().includes(q);
      const matchPillar = item.cagePillar?.toLowerCase().includes(q);
      if (!matchTitle && !matchHook && !matchPillar) return false;
    }
    return true;
  });

  const getFormatIcon = (format: ContentFormatType) => {
    switch (format) {
      case "carousel": return <Layers size={16} className="text-[#FA26A0]" />;
      case "reel": return <Video size={16} className="text-[#FF5E36]" />;
      case "story": return <Instagram size={16} className="text-amber-400" />;
      default: return <FileText size={16} className="text-[#833AB4]" />;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white font-display">
              Biblioteca de Conteúdo
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-white">
              {items.length} {items.length === 1 ? "peça" : "peças"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Seus roteiros, carrosséis e posts estruturados e prontos para execução.
          </p>
        </div>

        {onNavigateToCreate && (
          <button
            type="button"
            onClick={onNavigateToCreate}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5E36] via-[#E1306C] to-[#833AB4] text-white font-bold text-xs flex items-center gap-2 shadow-lg hover:opacity-90 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Criar Novo Conteúdo</span>
          </button>
        )}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-[#090C16] border border-white/10">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por tema, gancho ou pilar..."
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#E1306C]/50"
          />
        </div>

        {/* Formats Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {(["all", "reel", "carousel", "story", "post"] as const).map(fmt => (
            <button
              key={fmt}
              type="button"
              onClick={() => setSelectedFormat(fmt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedFormat === fmt 
                  ? "bg-white/15 text-white border border-white/20" 
                  : "text-slate-400 hover:text-white bg-transparent"
              }`}
            >
              {fmt === "all" ? "Todos os Formatos" : fmt === "reel" ? "Reels" : fmt === "carousel" ? "Carrosséis" : fmt === "story" ? "Stories" : "Posts"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Content Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs">
          Carregando biblioteca estratégica...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/5 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 text-slate-500 flex items-center justify-center mx-auto">
            <Bookmark size={22} />
          </div>
          <h3 className="text-sm font-bold text-white">Nenhum conteúdo encontrado</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || selectedFormat !== "all" 
              ? "Tente alterar os filtros de busca acima."
              : "Você ainda não salvou conteúdos. Utilize o InstaScore Content Engine para gerar sua primeira pauta estratégica."}
          </p>
          {onNavigateToCreate && (
            <button
              type="button"
              onClick={onNavigateToCreate}
              className="mt-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus size={14} />
              <span>Gerar Conteúdo Agora</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setInspectingIdea(item)}
              className="group p-5 rounded-2xl bg-[#0C101D] border border-white/10 hover:border-[#E1306C]/40 transition-all cursor-pointer flex flex-col justify-between shadow-xl relative overflow-hidden"
            >
              <div>
                {/* Format and Pillar Badges */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    {getFormatIcon(item.type)}
                    <span className="text-[11px] font-mono uppercase font-bold text-slate-300">
                      {item.type.toUpperCase()}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#FA26A0]/15 text-[#FA26A0] font-bold border border-[#FA26A0]/30">
                    {item.cagePillar?.toUpperCase()}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-white group-hover:text-[#FA26A0] transition-colors line-clamp-2 mb-2 font-display">
                  {item.title}
                </h3>

                {/* Hook preview */}
                {item.hook && (
                  <p className="text-xs text-slate-400 line-clamp-2 italic mb-4">
                    "{item.hook}"
                  </p>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span className="text-[11px] font-mono flex items-center gap-1 text-slate-500">
                  <Clock size={12} /> {item.objective}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => handleCopyCaption(item, e)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                    title="Copiar Legenda"
                  >
                    {copiedId === item.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteItem(item.id, e)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Excluir da Biblioteca"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Inspect Detail Modal */}
      <ContentDetailModal
        isOpen={Boolean(inspectingIdea)}
        onClose={() => setInspectingIdea(null)}
        idea={inspectingIdea}
        isSaved={true}
      />
    </div>
  );
};

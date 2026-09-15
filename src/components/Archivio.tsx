import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, FolderPlus, Upload, FileText, Trash2, ArrowLeft, Download } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";

type ArchiveFolder = { id: string; name: string; parent_id: string | null };
type ArchiveFile = { id: string; name: string; storage_path: string; mime_type: string | null; size_bytes: number | null; folder_id: string | null };

const ALLOWED = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv",
  "text/plain",
];
const isImage = (m: string | null) => !!m && m.startsWith("image/");
const isAllowed = (m: string) => ALLOWED.includes(m) || m.startsWith("image/");

function formatSize(b: number | null) {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default function Archivio() {
  const { user } = useAuth();
  const { canEdit } = useSubscription();
  const [folders, setFolders] = useState<ArchiveFolder[]>([]);
  const [files, setFiles] = useState<ArchiveFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    if (!user) return;
    const [{ data: fs }, { data: fl }] = await Promise.all([
      supabase.from("archive_folders").select("*").order("name"),
      supabase.from("archive_files").select("*").order("created_at", { ascending: false }),
    ]);
    setFolders((fs || []) as ArchiveFolder[]);
    setFiles((fl || []) as ArchiveFile[]);
  };
  useEffect(() => { load(); }, [user]);

  const visibleFolders = folders.filter(f => f.parent_id === currentFolder);
  const visibleFiles = files.filter(f => f.folder_id === currentFolder);
  const currentFolderName = currentFolder ? folders.find(f => f.id === currentFolder)?.name : null;
  const parentOfCurrent = currentFolder ? folders.find(f => f.id === currentFolder)?.parent_id ?? null : null;

  const breadcrumb: ArchiveFolder[] = [];
  let cursor = currentFolder;
  while (cursor) {
    const f = folders.find(x => x.id === cursor);
    if (!f) break;
    breadcrumb.unshift(f);
    cursor = f.parent_id;
  }

  const createFolder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !canEdit) return;
    const name = (new FormData(e.currentTarget).get("name") as string)?.trim();
    if (!name) return;
    const { error } = await supabase.from("archive_folders").insert({
      user_id: user.id, name, parent_id: currentFolder,
    });
    if (error) { toast.error("Errore creazione cartella"); return; }
    setNewFolderOpen(false);
    toast.success("Cartella creata");
    load();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!canEdit) { toast.error("Abbonamento scaduto"); return; }
    if (!isAllowed(file.type)) { toast.error("Tipo file non supportato"); return; }
    if (file.size > 25 * 1024 * 1024) { toast.error("Max 25 MB"); return; }
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("archive").upload(path, file, {
        contentType: file.type, upsert: false,
      });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("archive_files").insert({
        user_id: user.id, folder_id: currentFolder, name: file.name,
        storage_path: path, mime_type: file.type, size_bytes: file.size,
      });
      if (dbErr) throw dbErr;
      toast.success("File caricato");
      load();
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Errore upload");
    } finally { setUploading(false); }
  };

  const downloadFile = async (f: ArchiveFile) => {
    const { data, error } = await supabase.storage.from("archive").createSignedUrl(f.storage_path, 60);
    if (error || !data) { toast.error("Errore download"); return; }
    window.open(data.signedUrl, "_blank");
  };

  const deleteFile = async (f: ArchiveFile) => {
    await supabase.storage.from("archive").remove([f.storage_path]);
    await supabase.from("archive_files").delete().eq("id", f.id);
    toast.success("File eliminato");
    load();
  };

  const deleteFolder = async (folder: ArchiveFolder) => {
    // collect descendants
    const allIds = new Set<string>([folder.id]);
    let added = true;
    while (added) {
      added = false;
      for (const f of folders) {
        if (f.parent_id && allIds.has(f.parent_id) && !allIds.has(f.id)) {
          allIds.add(f.id); added = true;
        }
      }
    }
    const filesToDelete = files.filter(f => f.folder_id && allIds.has(f.folder_id));
    if (filesToDelete.length) {
      await supabase.storage.from("archive").remove(filesToDelete.map(f => f.storage_path));
    }
    await supabase.from("archive_folders").delete().eq("id", folder.id);
    toast.success("Cartella eliminata");
    load();
  };

  return (
    <div className="space-y-3">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <button onClick={() => setCurrentFolder(null)} className="hover:text-primary flex items-center gap-1">
          <Folder className="h-4 w-4" /> Archivio
        </button>
        {breadcrumb.map((f) => (
          <span key={f.id} className="flex items-center gap-2">
            <span>/</span>
            <button onClick={() => setCurrentFolder(f.id)} className="hover:text-primary">{f.name}</button>
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {currentFolder && (
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setCurrentFolder(parentOfCurrent)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-xl gap-1" disabled={!canEdit}>
              <FolderPlus className="h-4 w-4" /> Nuova cartella
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader><DialogTitle>Nuova cartella</DialogTitle></DialogHeader>
            <form onSubmit={createFolder} className="space-y-3">
              <Input name="name" placeholder="Nome cartella" required autoFocus className="rounded-xl" />
              <Button type="submit" className="w-full rounded-xl">Crea</Button>
            </form>
          </DialogContent>
        </Dialog>
        <label className="flex-1">
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading || !canEdit}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,image/*" />
          <Button type="button" size="sm" className="w-full rounded-xl gap-1" disabled={uploading || !canEdit} asChild>
            <span>
              {uploading
                ? <><div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" /> Caricamento...</>
                : <><Upload className="h-4 w-4" /> Carica file</>}
            </span>
          </Button>
        </label>
      </div>

      {currentFolderName && (
        <p className="text-xs text-muted-foreground px-1">In: <b>{currentFolderName}</b></p>
      )}

      {/* Folders */}
      {visibleFolders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {visibleFolders.map((f, i) => (
            <motion.div key={f.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="glass rounded-2xl p-3 flex items-center justify-between gap-2 group">
              <button onClick={() => setCurrentFolder(f.id)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                <Folder className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm truncate">{f.name}</span>
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminare "{f.name}"?</AlertDialogTitle>
                    <AlertDialogDescription>Verranno eliminati anche tutti i file e le sottocartelle al suo interno.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Annulla</AlertDialogCancel>
                    <AlertDialogAction className="rounded-xl" onClick={() => deleteFolder(f)}>Elimina</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </motion.div>
          ))}
        </div>
      )}

      {/* Files */}
      {visibleFiles.length > 0 && (
        <div className="space-y-2">
          {visibleFiles.map((f, i) => (
            <motion.div key={f.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="glass rounded-2xl p-3 flex items-center gap-3 group">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <button onClick={() => downloadFile(f)} className="flex-1 min-w-0 text-left">
                <p className="text-sm truncate">{f.name}</p>
                <p className="text-[10px] text-muted-foreground">{formatSize(f.size_bytes)}</p>
              </button>
              <button onClick={() => downloadFile(f)} className="text-muted-foreground hover:text-primary p-1">
                <Download className="h-4 w-4" />
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminare "{f.name}"?</AlertDialogTitle>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Annulla</AlertDialogCancel>
                    <AlertDialogAction className="rounded-xl" onClick={() => deleteFile(f)}>Elimina</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </motion.div>
          ))}
        </div>
      )}

      {visibleFolders.length === 0 && visibleFiles.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">Cartella vuota</div>
      )}
    </div>
  );
}

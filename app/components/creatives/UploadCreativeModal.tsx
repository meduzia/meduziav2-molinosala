"use client";

import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Upload, X, Image, Video, File, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadFile {
  file: File;
  preview: string;
  progress: number;
  id: string;
}

interface Metadata {
  name: string;
  angle: string;
  destination: string;
  format: string;
  campaign: string;
  notes: string;
}

interface UploadCreativeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const ANGLES = ["Urgencia", "Pain Point", "Comparativa", "Tranquilidad", "FOMO", "Otro"];
const DESTINATIONS = ["USA", "Europa", "Brasil", "Chile", "México", "Global"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "video/mp4", "video/quicktime"];

export function UploadCreativeModal({ open, onOpenChange, onSuccess }: UploadCreativeModalProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [metadata, setMetadata] = useState<Metadata>({
    name: "",
    angle: "",
    destination: "",
    format: "",
    campaign: "",
    notes: "",
  });

  const detectFileType = (file: File): "image" | "video" => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    return "image"; // default
  };

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles: UploadFile[] = [];
    Array.from(fileList).forEach((file) => {
      // Validate file type
      if (!ACCEPTED_TYPES.includes(file.type)) {
        alert(`${file.name}: Tipo de archivo no soportado. Use JPG, PNG, MP4 o MOV.`);
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        alert(`${file.name}: Archivo muy grande. Máximo 50MB.`);
        return;
      }

      const fileType = detectFileType(file);
      const id = `${Date.now()}-${Math.random()}`;
      const preview = fileType === "image" ? URL.createObjectURL(file) : "";

      newFiles.push({
        file,
        preview,
        progress: 0,
        id,
      });

      // Auto-detect format
      if (metadata.format === "" && newFiles.length === 1) {
        setMetadata((prev) => ({ ...prev, format: fileType === "video" ? "Video" : "Image" }));
      }
    });

    setFiles((prev) => [...prev, ...newFiles]);
  }, [metadata.format]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const updateFileProgress = (id: string, progress: number) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, progress } : f))
    );
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("Por favor, selecciona al menos un archivo");
      return;
    }

    if (!metadata.name.trim()) {
      alert("El nombre del creative es requerido");
      return;
    }

    setUploading(true);

    try {
      for (const uploadFile of files) {
        const formData = new FormData();
        formData.append("file", uploadFile.file);
        formData.append("name", metadata.name + (files.length > 1 ? ` - ${uploadFile.file.name}` : ""));
        formData.append("angle", metadata.angle);
        formData.append("destination", metadata.destination);
        formData.append("format", metadata.format || (detectFileType(uploadFile.file) === "video" ? "Video" : "Image"));
        formData.append("campaign", metadata.campaign);
        formData.append("notes", metadata.notes);
        formData.append("status", "draft");

        // Simulate progress
        const progressInterval = setInterval(() => {
          updateFileProgress(uploadFile.id, (prev) => Math.min(prev + 10, 90));
        }, 200);

        try {
          const response = await fetch("/api/creatives/upload", {
            method: "POST",
            body: formData,
          });

          clearInterval(progressInterval);
          updateFileProgress(uploadFile.id, 100);

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Error al subir el archivo");
          }
        } catch (error: any) {
          clearInterval(progressInterval);
          alert(`Error al subir ${uploadFile.file.name}: ${error.message}`);
          throw error;
        }
      }

      // Reset form
      setFiles([]);
      setMetadata({
        name: "",
        angle: "",
        destination: "",
        format: "",
        campaign: "",
        notes: "",
      });
      
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (uploading) return;
    setFiles([]);
    setMetadata({
      name: "",
      angle: "",
      destination: "",
      format: "",
      campaign: "",
      notes: "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-950/95 to-blue-950/95 border-purple-500/30 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Upload New Creative
          </DialogTitle>
          <DialogDescription className="text-purple-300/70">
            Sube imágenes o videos para tus campañas publicitarias
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Dropzone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300",
              isDragging
                ? "border-purple-500 bg-purple-500/10 scale-[1.02]"
                : "border-purple-500/30 bg-purple-950/30 hover:border-purple-500/50 hover:bg-purple-950/40"
            )}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              multiple
              accept="image/jpeg,image/jpg,image/png,video/mp4,video/quicktime"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto mb-4 text-purple-400" />
              <p className="text-lg font-medium text-foreground mb-2">
                Drag & drop archivos aquí o haz clic para seleccionar
              </p>
              <p className="text-sm text-muted-foreground">
                JPG, PNG, MP4, MOV (máx. 50MB)
              </p>
            </label>
          </div>

          {/* File Previews */}
          {files.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Archivos seleccionados ({files.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {files.map((uploadFile) => {
                  const fileType = detectFileType(uploadFile.file);
                  return (
                    <div
                      key={uploadFile.id}
                      className="relative group border border-purple-500/30 rounded-lg overflow-hidden bg-purple-950/30"
                    >
                      {fileType === "image" && uploadFile.preview ? (
                        <img
                          src={uploadFile.preview}
                          alt={uploadFile.file.name}
                          className="w-full h-32 object-cover"
                        />
                      ) : (
                        <div className="w-full h-32 bg-purple-900/30 flex items-center justify-center">
                          <Video className="h-8 w-8 text-purple-400" />
                        </div>
                      )}
                      <div className="p-2">
                        <p className="text-xs text-muted-foreground truncate">
                          {uploadFile.file.name}
                        </p>
                        <p className="text-xs text-purple-400/70">
                          {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {uploadFile.progress > 0 && uploadFile.progress < 100 && (
                          <Progress value={uploadFile.progress} className="h-1 mt-1" />
                        )}
                        {uploadFile.progress === 100 && (
                          <div className="flex items-center gap-1 text-green-400 text-xs mt-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Subido</span>
                          </div>
                        )}
                      </div>
                      {!uploading && (
                        <button
                          onClick={() => removeFile(uploadFile.id)}
                          className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4 text-white" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Metadata Form */}
          <div className="space-y-4 border-t border-purple-500/30 pt-4">
            <h3 className="text-sm font-semibold text-foreground">Metadata</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm text-purple-300/80">
                  Nombre del Creative <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  value={metadata.name}
                  onChange={(e) => setMetadata((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Campaña Verano 2024"
                  className="bg-purple-950/50 border-purple-500/30 focus:border-purple-500/50"
                  disabled={uploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="angle" className="text-sm text-purple-300/80">
                  Ángulo
                </Label>
                <Select
                  value={metadata.angle}
                  onValueChange={(value) => setMetadata((prev) => ({ ...prev, angle: value }))}
                  disabled={uploading}
                >
                  <SelectTrigger className="bg-purple-950/50 border-purple-500/30 focus:border-purple-500/50">
                    <SelectValue placeholder="Seleccionar ángulo" />
                  </SelectTrigger>
                  <SelectContent className="bg-purple-950/95 border-purple-500/30">
                    {ANGLES.map((angle) => (
                      <SelectItem key={angle} value={angle}>
                        {angle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination" className="text-sm text-purple-300/80">
                  Destino
                </Label>
                <Select
                  value={metadata.destination}
                  onValueChange={(value) => setMetadata((prev) => ({ ...prev, destination: value }))}
                  disabled={uploading}
                >
                  <SelectTrigger className="bg-purple-950/50 border-purple-500/30 focus:border-purple-500/50">
                    <SelectValue placeholder="Seleccionar destino" />
                  </SelectTrigger>
                  <SelectContent className="bg-purple-950/95 border-purple-500/30">
                    {DESTINATIONS.map((dest) => (
                      <SelectItem key={dest} value={dest}>
                        {dest}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format" className="text-sm text-purple-300/80">
                  Formato
                </Label>
                <Select
                  value={metadata.format}
                  onValueChange={(value) => setMetadata((prev) => ({ ...prev, format: value }))}
                  disabled={uploading}
                >
                  <SelectTrigger className="bg-purple-950/50 border-purple-500/30 focus:border-purple-500/50">
                    <SelectValue placeholder="Auto-detectar" />
                  </SelectTrigger>
                  <SelectContent className="bg-purple-950/95 border-purple-500/30">
                    <SelectItem value="Image">Image</SelectItem>
                    <SelectItem value="Video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign" className="text-sm text-purple-300/80">
                Campaña (opcional)
              </Label>
              <Input
                id="campaign"
                value={metadata.campaign}
                onChange={(e) => setMetadata((prev) => ({ ...prev, campaign: e.target.value }))}
                placeholder="Nombre de la campaña"
                className="bg-purple-950/50 border-purple-500/30 focus:border-purple-500/50"
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm text-purple-300/80">
                Notas (opcional)
              </Label>
              <Textarea
                id="notes"
                value={metadata.notes}
                onChange={(e) => setMetadata((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas adicionales..."
                rows={3}
                className="bg-purple-950/50 border-purple-500/30 focus:border-purple-500/50 resize-none"
                disabled={uploading}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-purple-500/30">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={uploading}
              className="text-purple-300 hover:text-purple-100"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || files.length === 0 || !metadata.name.trim()}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg shadow-purple-500/30"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Save Draft
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

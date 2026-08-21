import React, { useState, useRef } from "react";
import { Upload, X, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { compressImage, validateImageFile } from "../lib/image";

interface FileUploaderProps {
  id: string;
  label: string;
  description: string;
  required?: boolean;
  value?: string; // base64 data URI
  onChange: (base64: string | undefined) => void;
}

export default function FileUploader({
  id,
  label,
  description,
  required = false,
  value,
  onChange,
}: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputId = `file-input-${id}`;
  const descId = `desc-${id}`;
  const errorId = `error-${id}`;

  const handleFile = async (file: File) => {
    setErrorMessage(null);

    // Validate type
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || "Arquivo inválido.");
      return;
    }

    setCompressing(true);
    try {
      const processed = await compressImage(file);
      onChange(processed.base64);
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao processar imagem.");
    } finally {
      setCompressing(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    onChange(undefined);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      triggerInput();
    }
  };

  return (
    <div id={`uploader-container-${id}`} className="space-y-2 w-full">
      <div className="flex justify-between items-baseline">
        <label htmlFor={inputId} className="block text-sm font-semibold text-slate-200">
          {label} {required && <span className="text-rose-500" aria-hidden="true">*</span>}
          {required && <span className="sr-only">(Obrigatório)</span>}
        </label>
        {value && (
          <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium" role="status">
            <CheckCircle size={12} aria-hidden="true" /> Pronto para envio
          </span>
        )}
      </div>

      <p id={descId} className="text-xs text-slate-400">{description}</p>

      {value ? (
        // Preview Container with full keyboard focus support
        <div id={`preview-box-${id}`} className="relative rounded-xl border border-slate-700 bg-slate-900/60 overflow-hidden group">
          <img
            src={value}
            alt={`Pré-visualização do ${label}`}
            className="w-full h-48 object-contain bg-slate-950 p-2"
          />
          <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3 p-4">
            <button
              type="button"
              id={`replace-btn-${id}`}
              onClick={triggerInput}
              aria-label={`Substituir arquivo de ${label}`}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
            >
              <RefreshCw size={14} aria-hidden="true" /> Substituir
            </button>
            <button
              type="button"
              id={`remove-btn-${id}`}
              onClick={removeFile}
              aria-label={`Remover arquivo de ${label}`}
              className="px-4 py-2 bg-rose-600/90 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
            >
              <X size={14} aria-hidden="true" /> Remover
            </button>
          </div>
        </div>
      ) : (
        // Accessible Keyboard-Operable Dropzone Container
        <div
          id={`dropzone-${id}`}
          role="button"
          tabIndex={0}
          aria-label={`Área de envio para ${label}. Pressione Enter ou Espaço para selecionar o arquivo no seu dispositivo.`}
          aria-describedby={`${descId}${errorMessage ? ` ${errorId}` : ""}`}
          onKeyDown={handleKeyDown}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={triggerInput}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[160px] focus-visible:outline-2 focus-visible:outline-[#38BDF8] focus-visible:outline-offset-2 ${
            dragActive
              ? "border-[#E1306C] bg-[#1A0E33]/60 shadow-[0_0_25px_rgba(225,48,108,0.3)]"
              : "border-[#E1306C]/30 hover:border-[#E1306C]/60 bg-[#120924]/40 hover:bg-[#120924]/70"
          }`}
        >
          <input
            type="file"
            id={inputId}
            ref={fileInputRef}
            onChange={onFileChange}
            accept=".png, .jpg, .jpeg, .webp"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />

          {compressing ? (
            <div className="flex flex-col items-center gap-2" role="status" aria-live="polite">
              <RefreshCw className="animate-spin text-[#FA26A0]" size={32} aria-hidden="true" />
              <p className="text-sm font-medium text-slate-200">Otimizando e preparando imagem...</p>
              <p className="text-xs text-slate-400">Isso preserva a legibilidade e reduz o tempo de envio.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-[#1D1038] rounded-full text-[#FA26A0] border border-[#E1306C]/30 shadow-md">
                <Upload size={24} aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-slate-200">
                <span className="text-[#FF5E36] font-bold underline">Clique para fazer upload</span> ou arraste o arquivo aqui
              </p>
              <p className="text-xs text-slate-400">Formatos aceitos: JPG, PNG, WebP (Máx. 10MB)</p>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <div 
          id={errorId} 
          role="alert" 
          aria-live="polite"
          className="flex items-center gap-1.5 p-2.5 bg-rose-950/40 border border-rose-800/60 rounded-lg text-xs text-rose-300"
        >
          <AlertCircle size={14} className="shrink-0 text-rose-400" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}


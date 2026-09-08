"use client";

import { ImagePlus, Loader2, Trash2, Upload } from "@/lib/icons";
import Image from "next/image";
import { useRef, useState } from "react";
import { uploadImage, uploadMultipleImages } from "@/lib/storage";
import { cn } from "@/lib/utils";

type ImageUploadProps = {
  folder: string;
  multiple?: boolean;
  maxFiles?: number;
  label?: string;
  hint?: string;
  value?: string[];
  onChange: (urls: string[]) => void;
  compact?: boolean;
};

export function ImageUpload({
  folder,
  multiple = false,
  maxFiles = 5,
  label = "Images",
  hint = "JPG, PNG ou WebP — 5 Mo max.",
  value = [],
  onChange,
  compact = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setError(null);
    setUploading(true);

    const files = Array.from(fileList).slice(0, multiple ? maxFiles - value.length : 1);
    const result = multiple
      ? await uploadMultipleImages(files, folder)
      : await uploadImage(files[0], folder).then((item) => ({
          urls: item.url ? [item.url] : [],
          error: item.error,
        }));

    setUploading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onChange(multiple ? [...value, ...result.urls] : result.urls);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(index: number) {
    onChange(value.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="grid gap-2">
      <span className="font-medium">{label}</span>
      <div
        className={cn(
          "group relative cursor-pointer rounded-ucao border-2 border-dashed border-ucao-line bg-ucao-soft/60 transition-colors hover:border-ucao-red hover:bg-ucao-red-soft/30 dark:border-[#2a3a52] dark:bg-[#132238]/60 dark:hover:border-[#ff9aa0]",
          compact ? "p-4" : "p-6",
        )}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(event) => event.key === "Enter" && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label={`${label} — cliquer pour parcourir`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple={multiple}
          className="sr-only"
          onChange={(event) => handleFiles(event.target.files)}
        />
        <div className="flex flex-col items-center gap-2 text-center text-sm text-ucao-muted dark:text-[#a8b8cc]">
          {uploading ? (
            <>
              <Loader2 className="animate-spin text-ucao-red" size={28} />
              <span>Envoi en cours...</span>
            </>
          ) : (
            <>
              <Upload className="text-ucao-red" size={28} />
              <span className="font-medium text-ucao-ink dark:text-white">
                Glissez une image ou cliquez pour parcourir
              </span>
              <span>{hint}</span>
            </>
          )}
        </div>
      </div>

      {value.length > 0 && (
        <ul className={cn("grid gap-3", multiple ? "sm:grid-cols-2" : "grid-cols-1")}>
          {value.map((url, index) => (
            <li key={url} className="panel relative overflow-hidden p-2">
              <div className="relative h-32 w-full overflow-hidden rounded-ucao">
                <Image src={url} alt={`${label} ${index + 1}`} fill className="object-cover" sizes="200px" />
              </div>
              <button
                type="button"
                className="btn btn-ghost absolute right-3 top-3 size-9 min-h-0 p-0 text-ucao-red"
                onClick={() => removeAt(index)}
                aria-label="Supprimer cette image"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {multiple && value.length < maxFiles && (
        <button
          type="button"
          className="btn btn-ghost w-fit"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus size={16} /> Ajouter une image ({value.length}/{maxFiles})
        </button>
      )}

      {error && <p className="notice notice-error text-sm">{error}</p>}
    </div>
  );
}

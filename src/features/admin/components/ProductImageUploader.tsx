import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, X, Plus, CheckCircle2, AlertCircle, RefreshCw, Upload } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type SlotState = {
  /** URL of the persisted (server-saved) image, or '' if slot is empty */
  persistedUrl: string;
  /** Object URL of the locally selected file, awaiting upload */
  pendingFile: File | null;
  /** Local object URL for instant preview */
  previewUrl: string | null;
  /** Whether this slot is marked for deletion on save */
  markedForDeletion: boolean;
  /** Whether an upload is currently in progress for this slot */
  uploading: boolean;
  /** Upload error message for this slot, if any */
  uploadError: string | null;
};

const SLOT_LABELS = ['Main Featured View', 'Side View', 'Close Up', 'Packaging'];

function createInitialSlots(existingImages: string[]): SlotState[] {
  return Array.from({ length: 4 }, (_, i) => ({
    persistedUrl: existingImages[i] || '',
    pendingFile: null,
    previewUrl: existingImages[i] || null,
    markedForDeletion: false,
    uploading: false,
    uploadError: null,
  }));
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface ProductImageUploaderProps {
  sku: string;
  /** Called whenever the effective image URL array changes */
  onImagesChange: (urls: string[]) => void;
  existingImages?: string[];
  theme?: 'light' | 'dark';
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProductImageUploader({
  sku,
  onImagesChange,
  existingImages = [],
  theme = 'dark',
}: ProductImageUploaderProps) {
  const [slots, setSlots] = useState<SlotState[]>(() => createInitialSlots(existingImages));
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Track blob URLs to revoke on unmount / replacement
  const blobUrlsRef = useRef<Map<number, string>>(new Map());

  // Sync with existingImages prop changes (e.g. when dialog reopens with different product)
  useEffect(() => {
    const newSlots = createInitialSlots(existingImages);
    setSlots(newSlots);
    // Revoke any stale blob URLs
    blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    blobUrlsRef.current.clear();
  }, [existingImages.join(',')]); // eslint-disable-line

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  /**
   * Computes the effective image URL array for the parent form.
   * Uses uploaded URL if available, persisted URL otherwise.
   * Excludes deleted slots and empty slots.
   */
  const computeEffectiveUrls = useCallback((currentSlots: SlotState[]): string[] => {
    return currentSlots
      .map((slot) => {
        if (slot.markedForDeletion) return '';
        return slot.persistedUrl || '';
      })
      .filter(Boolean);
  }, []);

  // ── File Selection Handler ──────────────────────────────────────────────────

  const handleFileSelect = useCallback(
    async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!sku) {
        toast.error('Please generate a SKU (select Category) before uploading images');
        return;
      }

      // ── Instant Local Preview ──────────────────────────────────────────────
      // Revoke previous blob URL for this slot
      const prevBlobUrl = blobUrlsRef.current.get(index);
      if (prevBlobUrl) {
        URL.revokeObjectURL(prevBlobUrl);
      }
      const objectUrl = URL.createObjectURL(file);
      blobUrlsRef.current.set(index, objectUrl);

      // Update slot: show preview immediately, mark uploading
      setSlots((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          pendingFile: file,
          previewUrl: objectUrl, // ← instant visual replacement
          markedForDeletion: false,
          uploading: true,
          uploadError: null,
        };
        return next;
      });

      // Reset file input so the same file can be re-selected
      if (inputRefs[index].current) inputRefs[index].current!.value = '';

      // ── Background Upload ──────────────────────────────────────────────────
      const slotIndex = index + 1;
      const toastId = `upload-slot-${index}`;
      toast.loading(`Uploading Slot ${slotIndex}…`, { id: toastId });

      try {
        const formData = new FormData();
        formData.append('sku', sku);
        formData.append('index', slotIndex.toString());
        formData.append('images', file);

        const res = await adminAPI.uploadProductImages(formData);

        if (res.data?.success) {
          const uploadedUrl: string = res.data.data.imageUrls[0];

          // Revoke blob URL now that we have the real URL
          URL.revokeObjectURL(objectUrl);
          blobUrlsRef.current.delete(index);

          setSlots((prev) => {
            const next = [...prev];
            next[index] = {
              ...next[index],
              persistedUrl: uploadedUrl,
              previewUrl: uploadedUrl,
              pendingFile: null,
              uploading: false,
              uploadError: null,
            };
            // Notify parent with the updated effective URLs
            const effective = computeEffectiveUrls(next);
            // Use setTimeout to avoid calling setState inside setState
            setTimeout(() => onImagesChange(effective), 0);
            return next;
          });

          toast.success(`Slot ${slotIndex} uploaded successfully`, { id: toastId });
        } else {
          throw new Error(res.data?.message || 'Upload response indicated failure');
        }
      } catch (error: any) {
        const errMsg =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          'Upload failed';

        console.error(`[IMG_UPLOAD] Slot ${slotIndex} error:`, {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });

        toast.error(`Slot ${slotIndex} failed: ${errMsg}`, { id: toastId });

        // Revert to persisted state on failure (keep preview showing persisted image)
        setSlots((prev) => {
          const next = [...prev];
          next[index] = {
            ...next[index],
            pendingFile: null,
            previewUrl: next[index].persistedUrl || null,
            uploading: false,
            uploadError: errMsg,
          };
          return next;
        });

        // Clean up failed blob URL
        URL.revokeObjectURL(objectUrl);
        blobUrlsRef.current.delete(index);
      }
    },
    [sku, computeEffectiveUrls, onImagesChange]
  );

  // ── Slot Deletion ───────────────────────────────────────────────────────────

  const handleRemoveSlot = useCallback(
    (index: number) => {
      // Revoke blob URL if any
      const blobUrl = blobUrlsRef.current.get(index);
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        blobUrlsRef.current.delete(index);
      }

      setSlots((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          persistedUrl: '',
          pendingFile: null,
          previewUrl: null,
          markedForDeletion: false,
          uploading: false,
          uploadError: null,
        };
        const effective = computeEffectiveUrls(next);
        setTimeout(() => onImagesChange(effective), 0);
        return next;
      });

      if (inputRefs[index].current) inputRefs[index].current!.value = '';
    },
    [computeEffectiveUrls, onImagesChange]
  );

  // ── Retry ───────────────────────────────────────────────────────────────────

  const handleRetry = useCallback((index: number) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], uploadError: null };
      return next;
    });
    inputRefs[index].current?.click();
  }, []);

  // ── Computed derived values ─────────────────────────────────────────────────

  const activeSlotCount = slots.filter(
    (s) => !s.markedForDeletion && (s.persistedUrl || s.previewUrl)
  ).length;
  const hasAnyUploading = slots.some((s) => s.uploading);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Hidden file inputs */}
      {[0, 1, 2, 3].map((index) => (
        <input
          key={`input-${index}`}
          type="file"
          ref={inputRefs[index]}
          className="hidden"
          accept="image/*"
          onChange={(e) => handleFileSelect(index, e)}
        />
      ))}

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Slot (index 0) */}
        <div className="w-full">
          <ImageSlot
            index={0}
            slot={slots[0]}
            label={SLOT_LABELS[0]}
            sku={sku}
            theme={theme}
            onSelect={() => !slots[0].uploading && inputRefs[0].current?.click()}
            onRemove={() => handleRemoveSlot(0)}
            onRetry={() => handleRetry(0)}
            large
          />
        </div>

        {/* Side Slots (indexes 1-3) */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((index) => (
            <ImageSlot
              key={index}
              index={index}
              slot={slots[index]}
              label={SLOT_LABELS[index]}
              sku={sku}
              theme={theme}
              onSelect={() => !slots[index].uploading && inputRefs[index].current?.click()}
              onRemove={() => handleRemoveSlot(index)}
              onRetry={() => handleRetry(index)}
            />
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl border transition-all',
          theme === 'dark'
            ? 'bg-slate-900/50 border-slate-800'
            : 'bg-slate-50 border-slate-200'
        )}
      >
        {hasAnyUploading ? (
          <Loader2 className="w-4 h-4 text-indigo-500 animate-spin flex-shrink-0" />
        ) : (
          <CheckCircle2
            className={cn(
              'w-4 h-4 flex-shrink-0',
              activeSlotCount === 4 ? 'text-emerald-500' : 'text-slate-400'
            )}
          />
        )}
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {hasAnyUploading
            ? 'Processing uploads…'
            : `Media Assets: ${activeSlotCount}/4 Slots Active`}
        </span>
        {slots.some((s) => s.uploadError) && (
          <span className="ml-auto text-[10px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {slots.filter((s) => s.uploadError).length} slot(s) need attention
          </span>
        )}
      </div>
    </div>
  );
}

// ─── ImageSlot Sub-Component ─────────────────────────────────────────────────

interface ImageSlotProps {
  index: number;
  slot: SlotState;
  label: string;
  sku: string;
  theme: 'light' | 'dark';
  onSelect: () => void;
  onRemove: () => void;
  onRetry: () => void;
  large?: boolean;
}

function ImageSlot({ index, slot, label, sku, theme, onSelect, onRemove, onRetry, large }: ImageSlotProps) {
  const displaySku = sku ? `${sku}_${index + 1}.jpeg` : `SLOT_${index + 1}`;
  const hasImage = !!(slot.previewUrl || slot.persistedUrl) && !slot.markedForDeletion;
  const effectivePreview = slot.previewUrl || slot.persistedUrl || null;

  return (
    <div className="space-y-1.5 group">
      {/* Label row */}
      <div className="flex justify-between items-center px-0.5">
        <span className="text-[9px] font-mono font-bold text-indigo-500 uppercase tracking-wider">
          {label}
        </span>
        {hasImage && !slot.uploading && (
          <button
            type="button"
            onClick={onRemove}
            className="text-rose-400 hover:text-rose-500 transition-colors p-0.5 rounded"
            title="Remove image"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Image slot box */}
      <div
        onClick={slot.uploading || !!slot.uploadError ? undefined : onSelect}
        className={cn(
          'relative rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all duration-200',
          large ? 'aspect-[4/3] md:aspect-square' : 'aspect-square',
          hasImage && !slot.uploadError
            ? 'border-indigo-500/40 bg-indigo-500/5 cursor-pointer'
            : slot.uploadError
            ? 'border-rose-500/50 bg-rose-500/5 cursor-default'
            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 cursor-pointer',
          slot.uploading && 'cursor-wait opacity-80'
        )}
      >
        {/* Uploading state */}
        {slot.uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-20">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mb-1" />
            <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest">
              Processing…
            </span>
          </div>
        )}

        {/* Error state overlay */}
        {slot.uploadError && !slot.uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2 z-20">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <span className="text-[8px] font-bold text-rose-400 text-center leading-tight px-1">
              {slot.uploadError.length > 60
                ? slot.uploadError.substring(0, 57) + '…'
                : slot.uploadError}
            </span>
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center gap-1 text-[9px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors mt-1"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

        {/* Image preview */}
        {effectivePreview && !slot.uploadError && (
          <>
            <img
              src={effectivePreview}
              alt={displaySku}
              className={cn(
                'w-full h-full object-cover transition-all duration-300',
                slot.uploading ? 'opacity-40 blur-sm' : 'opacity-100'
              )}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
              }}
            />
            {/* Hover overlay for replacement */}
            {!slot.uploading && !slot.uploadError && (
              <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100 group-hover:opacity-100">
                <div className="flex flex-col items-center gap-1">
                  <Upload className="w-4 h-4 text-white" />
                  <span className="text-[8px] font-bold text-white uppercase tracking-widest">
                    Replace
                  </span>
                </div>
              </div>
            )}
            {/* File info ribbon */}
            <div className="absolute inset-x-0 bottom-0 bg-black/70 backdrop-blur-sm py-1 px-2 border-t border-white/10">
              <p className="text-[8px] font-mono text-white text-center truncate">{displaySku}</p>
            </div>
          </>
        )}

        {/* Empty state */}
        {!effectivePreview && !slot.uploadError && !slot.uploading && (
          <div className="flex flex-col items-center gap-1.5 p-2">
            <Plus className="w-5 h-5 text-slate-500" />
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
              Upload
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

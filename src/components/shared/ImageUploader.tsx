import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { uploadService } from '../../services/uploadService';
import { cn } from '../../lib/utils';

interface ImageUploaderProps {
  onUpload: (url: string) => void;
  onError?: (error: string) => void;
  bucket: string;
  path: string;
  maxSize?: number;
  accept?: string;
  className?: string;
  previewUrl?: string;
  label?: string;
  showPreview?: boolean; // NOU: pentru a controla preview-ul
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUpload,
  onError,
  bucket,
  path,
  maxSize = 5,
  accept = 'image/jpeg,image/png,image/webp',
  className,
  previewUrl,
  label = 'Încarcă imagine',
  showPreview = true, // NOU: default true
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(previewUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = uploadService.validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Fișier invalid');
      onError?.(validation.error || 'Fișier invalid');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    try {
      setUploading(true);
      setError(null);
      const url = await uploadService.uploadImage(file, bucket, path);
      onUpload(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Eroare la încărcare';
      setError(errorMessage);
      onError?.(errorMessage);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('relative', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <button
              onClick={handleRemove}
              className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              disabled={uploading}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={cn(
            'w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 transition-colors',
            error ? 'border-red-300 bg-red-50' : 'border-slate-300 hover:border-amber-400 bg-slate-50',
            uploading && 'cursor-not-allowed opacity-50'
          )}
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
          ) : error ? (
            <AlertCircle size={32} className="text-red-500" />
          ) : (
            <Upload size={32} className="text-slate-400" />
          )}
          <span className={cn('text-sm font-medium', error ? 'text-red-600' : 'text-slate-600')}>
            {uploading ? 'Se încarcă...' : error || label}
          </span>
          {!error && !uploading && (
            <span className="text-xs text-slate-500">
              Max {maxSize}MB • JPG, PNG, WebP
            </span>
          )}
        </button>
      )}
    </div>
  );
};

interface MultiImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  bucket: string;
  path: string;
  maxImages?: number;
  className?: string;
}

export const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({
  images,
  onImagesChange,
  bucket,
  path,
  maxImages = 10,
  className,
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Check max images limit
    if (images.length + files.length > maxImages) {
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 z-50 bg-amber-500 text-white p-4 rounded-lg shadow-lg flex items-center gap-2';
      notification.innerHTML = `<span>⚠️</span><span>Poți încărca maximum ${maxImages} imagini</span>`;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
      return;
    }

    // Validate all files
    const validFiles = files.filter(file => {
      const validation = uploadService.validateImageFile(file);
      return validation.valid;
    });

    if (validFiles.length !== files.length) {
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 z-50 bg-amber-500 text-white p-4 rounded-lg shadow-lg flex items-center gap-2';
      notification.innerHTML = '<span>⚠️</span><span>Unele fișiere nu sunt valide și au fost ignorate</span>';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    }

    if (validFiles.length === 0) return;

    try {
      setUploading(true);
      const urls = await uploadService.uploadMultipleImages(validFiles, bucket, path);
      onImagesChange([...images, ...urls]);
      
      // Notificare de succes
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 z-50 bg-emerald-500 text-white p-4 rounded-lg shadow-lg flex items-center gap-2';
      notification.innerHTML = `<span>✓</span><span>${urls.length} imagini încărcate cu succes!</span>`;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    } catch (err) {
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 z-50 bg-red-500 text-white p-4 rounded-lg shadow-lg flex items-center gap-2';
      notification.innerHTML = '<span>✕</span><span>Eroare la încărcarea imaginilor</span>';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFilesSelect}
        className="hidden"
        disabled={uploading}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative group">
            <img
              src={image}
              alt={`Image ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg"
            />
            <button
              onClick={() => handleRemoveImage(index)}
              className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={16} />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-32 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-amber-400 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600" />
            ) : (
              <>
                <ImageIcon size={24} className="text-slate-400" />
                <span className="text-xs text-slate-600">Adaugă imagini</span>
              </>
            )}
          </button>
        )}
      </div>

      {images.length > 0 && (
        <p className="text-sm text-slate-500 mt-2">
          {images.length} / {maxImages} imagini încărcate
        </p>
      )}
    </div>
  );
};
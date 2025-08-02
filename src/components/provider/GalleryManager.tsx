import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, X, Star as StarIcon, ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button';
import { MultiImageUploader } from '../shared/ImageUploader';
import { uploadService } from '../../services/uploadService';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

interface GalleryManagerProps {
  providerId: string;
}

interface GalleryCategory {
  id: string;
  name: string;
  description: string;
  images: string[];
}

const DEFAULT_CATEGORIES = [
  { id: 'exterior', name: 'Imagini locație', description: 'Imagini cu locația salonului' },
  { id: 'certificates', name: 'Certificate', description: 'Diplome și certificări' },
];

export const GalleryManager: React.FC<GalleryManagerProps> = ({ providerId }) => {
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('exterior');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchGalleryData();
  }, [providerId]);

  const fetchGalleryData = async () => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('gallery, video_url')
        .eq('id', providerId)
        .single();

      if (error) throw error;

      if (data?.gallery) {
        setCategories(data.gallery);
      } else {
        // Initialize with default categories
        setCategories(DEFAULT_CATEGORIES.map(cat => ({ ...cat, images: [] })));
      }

      setVideoUrl(data?.video_url || '');
    } catch (error) {
      console.error('Failed to fetch gallery data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveGalleryData = async () => {
    setSaving(true);
    try {
      // Agregăm toate imaginile din toate categoriile pentru providers.images
      const allImages = categories.reduce((acc, category) => {
        return [...acc, ...category.images];
      }, [] as string[]);

      const { error } = await supabase
        .from('providers')
        .update({
          gallery: categories,
          images: allImages, // Actualizează și array-ul principal de imagini
          video_url: videoUrl,
        })
        .eq('id', providerId);

      if (error) throw error;
      
      // Înlocuim alert cu o notificare mai elegantă
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 z-50 bg-emerald-500 text-white p-4 rounded-lg shadow-lg flex items-center gap-2';
      notification.innerHTML = '<span>✓</span><span>Galeria a fost salvată cu succes!</span>';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    } catch (error) {
      console.error('Failed to save gallery:', error);
      
      // Notificare de eroare
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 z-50 bg-red-500 text-white p-4 rounded-lg shadow-lg flex items-center gap-2';
      notification.innerHTML = '<span>✕</span><span>Eroare la salvarea galeriei</span>';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleImagesChange = (categoryId: string, images: string[]) => {
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, images } : cat
    ));
    
    // Auto-save după fiecare modificare pentru sincronizare immediatez
    setTimeout(async () => {
      const updatedCategories = categories.map(cat =>
        cat.id === categoryId ? { ...cat, images } : cat
      );
      
      const allImages = updatedCategories.reduce((acc, category) => {
        return [...acc, ...category.images];
      }, [] as string[]);

      try {
        await supabase
          .from('providers')
          .update({
            gallery: updatedCategories,
            images: allImages,
          })
          .eq('id', providerId);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 500); // Debounce pentru a evita prea multe requests
  };

  const removeImage = async (categoryId: string, imageUrl: string) => {
    if (!confirm('Ești sigur că vrei să ștergi această imagine?')) return;

    try {
      // Remove from storage
      await uploadService.deleteImage(imageUrl, 'gallery');
      
      // Update state
      const updatedCategories = categories.map(cat =>
        cat.id === categoryId 
          ? { ...cat, images: cat.images.filter(img => img !== imageUrl) }
          : cat
      );
      
      setCategories(updatedCategories);
      
      // Update database immediately pentru consistență
      const allImages = updatedCategories.reduce((acc, category) => {
        return [...acc, ...category.images];
      }, [] as string[]);

      await supabase
        .from('providers')
        .update({
          gallery: updatedCategories,
          images: allImages,
        })
        .eq('id', providerId);
        
    } catch (error) {
      console.error('Failed to delete image:', error);
      
      // Notificare de eroare
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 z-50 bg-red-500 text-white p-4 rounded-lg shadow-lg flex items-center gap-2';
      notification.innerHTML = '<span>✕</span><span>Eroare la ștergerea imaginii</span>';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    }
  };

  const setFeaturedImage = async (imageUrl: string) => {
    try {
      const { error } = await supabase
        .from('providers')
        .update({ featured_image: imageUrl })
        .eq('id', providerId);

      if (error) throw error;
      
      // Notificare de succes
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 z-50 bg-emerald-500 text-white p-4 rounded-lg shadow-lg flex items-center gap-2';
      notification.innerHTML = '<span>⭐</span><span>Imaginea principală a fost setată!</span>';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    } catch (error) {
      console.error('Failed to set featured image:', error);
      
      // Notificare de eroare
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 z-50 bg-red-500 text-white p-4 rounded-lg shadow-lg flex items-center gap-2';
      notification.innerHTML = '<span>✕</span><span>Eroare la setarea imaginii principale</span>';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  const currentCategory = categories.find(cat => cat.id === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Galerie Foto & Video</h2>
        <Button onClick={saveGalleryData} loading={saving}>
          Salvează Galeria
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                'px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors',
                selectedCategory === category.id
                  ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-600'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              )}
            >
              {category.name}
              {category.images.length > 0 && (
                <span className="ml-2 text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                  {category.images.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Gallery Content */}
        <div className="p-6">
          {currentCategory && (
            <>
              <p className="text-sm text-slate-600 mb-4">{currentCategory.description}</p>
              
              <MultiImageUploader
                images={currentCategory.images}
                onImagesChange={(images) => handleImagesChange(currentCategory.id, images)}
                bucket="gallery"
                path={`${providerId}/${currentCategory.id}`}
                maxImages={20}
              />

              {/* Image Grid with Actions */}
              {currentCategory.images.length > 0 && (
                <div className="mt-6 grid grid-cols-3 md:grid-cols-6 gap-3">
                  {currentCategory.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`${currentCategory.name} ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg cursor-pointer"
                        onClick={() => setSelectedImage(image)}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFeaturedImage(image);
                          }}
                          className="p-1.5 bg-amber-600 text-white rounded-full hover:bg-amber-700 transition-colors"
                          title="Setează ca imagine principală"
                        >
                          <StarIcon size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(currentCategory.id, image);
                          }}
                          className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                          title="Șterge"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Video Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Video Prezentare</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Link Video (YouTube, Vimeo, etc.)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-1/2 px-3 py-2.5 border border-slate-300 rounded-lg focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-20"
              />
              {videoUrl && (
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <ExternalLink size={20} className="text-slate-600" />
                </a>
              )}
            </div>
          </div>

          {/* Video Preview */}
          {videoUrl && (
            <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden">
              {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeId(videoUrl)}`}
                  className="w-full h-full"
                  allowFullScreen
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  Preview-ul video nu este disponibil
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image Viewer Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to extract YouTube video ID
function getYouTubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : '';
}
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, DollarSign, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useServices } from '../../hooks/useServices';
import { Service } from '../../types';
import { formatPrice, formatDuration } from '../../lib/utils';

interface ServiceManagementProps {
  providerId: string;
}

interface ServiceFormData {
  name: string;
  description: string;
  price: string;
  duration: string;
  category?: string;
}

export const ServiceManagement: React.FC<ServiceManagementProps> = ({ providerId }) => {
  const { services, loading, createService, updateService, deleteService, toggleServiceStatus } = useServices(providerId);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    price: '',
    duration: '',
    category: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<ServiceFormData>>({});
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: '',
      category: '',
    });
    setFormErrors({});
    setEditingService(null);
    setShowForm(false);
  };

  const validateForm = (): boolean => {
    const errors: Partial<ServiceFormData> = {};

    if (!formData.name.trim()) {
      errors.name = 'Numele serviciului este obligatoriu';
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      errors.price = 'Prețul trebuie să fie mai mare ca 0';
    }
    if (!formData.duration || parseInt(formData.duration) <= 0) {
      errors.duration = 'Durata trebuie să fie mai mare ca 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const serviceData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        category: formData.category?.trim() || null,
        active: true,
      };

      if (editingService) {
        await updateService(editingService.id, serviceData);
      } else {
        await createService(serviceData);
      }

      resetForm();
    } catch (error) {
      console.error('Failed to save service:', error);
      alert('Eroare la salvarea serviciului');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      duration: service.duration.toString(),
      category: service.category || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Ești sigur că vrei să ștergi acest serviciu?')) return;

    try {
      await deleteService(serviceId);
    } catch (error) {
      console.error('Failed to delete service:', error);
      alert('Eroare la ștergerea serviciului');
    }
  };

  const handleToggleStatus = async (serviceId: string, currentStatus: boolean) => {
    try {
      await toggleServiceStatus(serviceId, !currentStatus);
    } catch (error) {
      console.error('Failed to toggle service status:', error);
      alert('Eroare la actualizarea statusului');
    }
  };

  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || 'Fără categorie';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-slate-200 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Servicii</h2>
          <p className="text-slate-600">{services.length} servicii în total</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus size={18} className="mr-2" />
            Adaugă Serviciu
          </Button>
        )}
      </div>

      {/* Service Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            {editingService ? 'Editează Serviciu' : 'Serviciu Nou'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nume Serviciu"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={formErrors.name}
                required
              />
              <Input
                label="Categorie (opțional)"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="ex: Tuns, Vopsit, Coafat"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Descriere
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-20"
                rows={3}
                placeholder="Descrie serviciul oferit..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Preț (lei)"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                error={formErrors.price}
                min="0"
                step="0.01"
                required
                icon={<DollarSign size={18} className="text-slate-400" />}
              />
              <Input
                label="Durată (minute)"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                error={formErrors.duration}
                min="15"
                step="15"
                required
                icon={<Clock size={18} className="text-slate-400" />}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" loading={submitting}>
                {editingService ? 'Actualizează' : 'Adaugă'} Serviciu
              </Button>
              <Button type="button" variant="ghost" onClick={resetForm}>
                Anulează
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Services List */}
      {services.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500 mb-4">Nu ai adăugat încă niciun serviciu</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus size={18} className="mr-2" />
            Adaugă primul serviciu
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedServices).map(([category, categoryServices]) => (
            <div key={category}>
              <h3 className="font-medium text-slate-700 mb-3">{category}</h3>
              <div className="space-y-3">
                {categoryServices.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-slate-800">{service.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            service.active
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {service.active ? 'Activ' : 'Inactiv'}
                          </span>
                        </div>
                        {service.description && (
                          <p className="text-sm text-slate-600 mb-2">{service.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-amber-600 font-semibold">
                            {formatPrice(service.price)}
                          </span>
                          <span className="text-slate-500">
                            {formatDuration(service.duration)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleToggleStatus(service.id, service.active)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          title={service.active ? 'Dezactivează' : 'Activează'}
                        >
                          {service.active ? (
                            <ToggleRight size={20} className="text-emerald-600" />
                          ) : (
                            <ToggleLeft size={20} className="text-slate-400" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(service)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Editează"
                        >
                          <Edit2 size={18} className="text-slate-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Șterge"
                        >
                          <Trash2 size={18} className="text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
import { useEffect, useState } from 'react';
import api from '../api/client';
import ImagePreviewModal from '../components/ImagePreviewModal';
import { resolveMediaUrl, imageFallbackProps } from '../utils/mediaUrl';

const emptyForm = { name: '', image: null };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(null);

  const load = async () => {
    setError('');
    try {
      const { data } = await api.get('/categories');
      setCategories(data);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditingId(cat.id);
    setForm({ name: cat.name || '', image: null });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      if (form.image) {
        fd.append('image', form.image);
      }
      if (editingId) {
        await api.post(`/admin/categories/${editingId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/admin/categories', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      closeModal();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this category? Products in this category will be removed (cascade).')) return;
    setError('');
    try {
      await api.delete(`/admin/categories/${id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Delete failed');
    }
  };

  if (loading) {
    return <p className="text-lg font-medium text-slate-600">Loading categories…</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Organize products into groups</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary">
          + Add category
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[15px] text-rose-800">
          {error}
        </div>
      )}

      <div className="table-wrap mt-8 overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-violet-50/50">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Preview
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Name
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[15px]">
            {categories.map((c, idx) => {
              const img = c.image_url ? resolveMediaUrl(c.image_url) : null;
              return (
                <tr
                  key={c.id}
                  className={`transition hover:bg-violet-50/40 ${
                    idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'
                  }`}
                >
                  <td className="px-6 py-5">
                    {img ? (
                      <button
                        type="button"
                        onClick={() => setPreviewSrc(img)}
                        className="block overflow-hidden rounded-xl ring-2 ring-slate-200/80 transition hover:ring-indigo-400"
                        title="Enlarge image"
                      >
                        <img
                          src={img}
                          alt={c.name || 'Category'}
                          className="h-12 w-12 object-cover"
                          {...imageFallbackProps()}
                        />
                      </button>
                    ) : (
                      <span className="text-sm text-slate-400">No image</span>
                    )}
                  </td>
                  <td className="px-6 py-5 font-semibold text-slate-900">{c.name}</td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button type="button" onClick={() => openEdit(c)} className="btn-edit">
                        Edit
                      </button>
                      <button type="button" onClick={() => remove(c.id)} className="btn-delete">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900">
              {editingId ? 'Edit category' : 'New category'}
            </h2>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })}
                  className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewSrc && (
        <ImagePreviewModal src={previewSrc} alt="" onClose={() => setPreviewSrc(null)} />
      )}
    </div>
  );
}

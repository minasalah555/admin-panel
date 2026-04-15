import { useEffect, useState } from 'react';
import api from '../api/client';
import ImagePreviewModal from '../components/ImagePreviewModal';
import { resolveMediaUrl, imageFallbackProps } from '../utils/mediaUrl';

const emptyForm = {
  name: '',
  price: '',
  quantity: '0',
  description: '',
  category_id: '',
  image: null,
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [priceEdit, setPriceEdit] = useState(null);

  const load = async () => {
    setError('');
    try {
      const [pRes, cRes] = await Promise.all([api.get('/products'), api.get('/categories')]);
      setProducts(pRes.data);
      setCategories(cRes.data);
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

  const openEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || '',
      price: String(product.price ?? ''),
      quantity: String(product.quantity ?? 0),
      description: product.description || '',
      category_id: String(product.category_id ?? ''),
      image: null,
    });
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
      fd.append('price', form.price);
      fd.append('quantity', form.quantity || '0');
      fd.append('description', form.description || '');
      fd.append('category_id', form.category_id);
      if (form.image) {
        fd.append('image', form.image);
      }
      if (editingId) {
        await api.post(`/admin/products/${editingId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/admin/products', fd, {
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
    if (!window.confirm('Delete this product?')) return;
    setError('');
    try {
      await api.delete(`/admin/products/${id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Delete failed');
    }
  };

  const saveQuickPrice = async () => {
    if (!priceEdit) return;
    const price = parseFloat(priceEdit.value);
    if (Number.isNaN(price) || price < 0) {
      setError('Enter a valid price.');
      return;
    }
    setError('');
    try {
      await api.patch(`/admin/products/${priceEdit.id}/price`, { price });
      setPriceEdit(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Price update failed');
    }
  };

  if (loading) {
    return <p className="text-lg font-medium text-slate-600">Loading products…</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Add, edit, delete, and adjust pricing</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary">
          + Add product
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
                Image
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Name
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Price
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Qty
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Category
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[15px]">
            {products.map((p, idx) => {
              const img = resolveMediaUrl(p.image_url || p.image);
              return (
                <tr
                  key={p.id}
                  className={`transition hover:bg-violet-50/40 hover:shadow-[inset_0_0_0_9999px_rgba(139,92,246,0.03)] ${
                    idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'
                  }`}
                >
                  <td className="px-6 py-5">
                    <button
                      type="button"
                      onClick={() => setPreviewSrc(img)}
                      className="group block overflow-hidden rounded-xl ring-2 ring-slate-200/80 transition hover:ring-indigo-400"
                      title="Enlarge image"
                    >
                      <img
                        src={img}
                        alt={p.name || 'Product'}
                        className="h-14 w-14 object-cover transition group-hover:scale-105"
                        {...imageFallbackProps()}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-5 font-semibold text-slate-900">{p.name}</td>
                  <td className="px-6 py-5 text-slate-700">
                    {priceEdit?.id === p.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-slate-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={priceEdit.value}
                          onChange={(e) =>
                            setPriceEdit({ id: p.id, value: e.target.value })
                          }
                          className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-medium"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={saveQuickPrice}
                          className="btn-edit py-1 text-xs"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setPriceEdit(null)}
                          className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setPriceEdit({ id: p.id, value: String(p.price ?? '') })
                        }
                        className="rounded-lg px-2 py-1 text-left font-medium hover:bg-violet-100/80"
                        title="Click to edit price"
                      >
                        ${Number(p.price).toFixed(2)}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-5 tabular-nums text-slate-700">
                    {p.quantity ?? 0}
                  </td>
                  <td className="px-6 py-5 text-slate-600">
                    {p.category?.name ?? `ID ${p.category_id}`}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button type="button" onClick={() => openEdit(p)} className="btn-edit">
                        Edit
                      </button>
                      <button type="button" onClick={() => remove(p.id)} className="btn-delete">
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
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/20 bg-white p-8 shadow-2xl ring-1 ring-indigo-500/10">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId ? 'Edit product' : 'New product'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Images are stored on the server via Laravel storage.
              </p>
            </div>
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Price</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Category</label>
                <select
                  required
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="input-field resize-y"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })}
                  className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {editingId && (
                  <p className="mt-2 text-xs text-slate-500">Leave empty to keep the current image.</p>
                )}
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save product'}
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

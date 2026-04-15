import { useEffect, useMemo, useState, useCallback } from 'react';
import api from '../api/client';

// TitleCase values matching backend canonical status
const STATUSES = ['Pending', 'Processing', 'Completed', 'Cancelled'];

const PAYMENT_STATUSES = ['unpaid', 'paid'];
const PAYMENT_METHODS = ['cod', 'card', 'wallet', 'bank_transfer', 'none'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState('all');
  // Expanded order id — shows payment controls
  const [expandedId, setExpandedId] = useState(null);
  // Editable fields for the expanded order
  const [edit, setEdit] = useState({});

  const load = async () => {
    setError('');
    try {
      const { data } = await api.get('/admin/orders');
      setOrders(data);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Auto-dismiss success message
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 3000);
    return () => clearTimeout(t);
  }, [success]);

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  // Map any status (including legacy lowercase) to a valid select value
  const selectValue = useCallback((status) => {
    const lower = (status || '').toLowerCase();
    const map = {
      pending: 'Pending', new: 'Pending',
      processing: 'Processing', processed: 'Processing', shipped: 'Processing',
      completed: 'Completed', delivered: 'Completed', done: 'Completed',
      cancelled: 'Cancelled', canceled: 'Cancelled',
    };
    return map[lower] || 'Pending';
  }, []);

  // Full update via PATCH /admin/orders/{id}
  const updateOrder = async (orderId, payload) => {
    setUpdatingId(orderId);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.patch(`/admin/orders/${orderId}`, payload);
      // Update local state from response so UI reflects persisted values
      const updated = data.order;
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          return { ...o, ...updated, user: o.user, order_items: o.order_items || o.orderItems };
        })
      );
      setSuccess(data.message || 'Order updated.');
      return data;
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Update failed';
      const validationErrors = e.response?.data?.errors;
      setError(validationErrors ? `${msg}: ${Object.values(validationErrors).flat().join(', ')}` : msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const changeStatus = async (orderId, status) => {
    await updateOrder(orderId, { status });
  };

  const savePayment = async (orderId) => {
    await updateOrder(orderId, {
      payment_status: edit.payment_status,
      payment_method: edit.payment_method,
      tracking_number: edit.tracking_number || null,
      notes: edit.notes || null,
    });
  };

  const toggleExpand = (order) => {
    if (expandedId === order.id) {
      setExpandedId(null);
      setEdit({});
    } else {
      setExpandedId(order.id);
      setEdit({
        payment_status: order.payment_status || 'unpaid',
        payment_method: order.payment_method || 'cod',
        tracking_number: order.tracking_number || '',
        notes: order.notes || '',
      });
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this order permanently?')) return;
    setError('');
    try {
      await api.delete(`/admin/orders/${id}`);
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Delete failed');
    }
  };

  const lineItems = (order) => order.order_items || order.orderItems || [];

  const itemsSummary = (order) => {
    const items = lineItems(order);
    if (!items.length) return '—';
    return items
      .map((i) => `${i.product?.name || i.product_name || 'Item'} ×${i.quantity}`)
      .join(', ');
  };

  if (loading) {
    return <p className="text-lg font-medium text-slate-600">Loading orders…</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">
            Pending → Processing → Completed · Update status, payment &amp; tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="order-filter" className="text-sm font-medium text-slate-600">
            Filter
          </label>
          <select
            id="order-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[15px] text-rose-800">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[15px] text-emerald-800">
          {success}
        </div>
      )}

      <div className="table-wrap mt-8 overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-violet-50/50">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Order
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Customer
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Products
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Payment
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[15px]">
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  No orders match this filter.
                </td>
              </tr>
            )}
            {filteredOrders.map((order, idx) => (
              <>
                <tr
                  key={order.id}
                  className={`transition hover:bg-violet-50/40 ${
                    idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'
                  }`}
                >
                  <td className="px-6 py-5 font-semibold text-slate-900">#{order.id}</td>
                  <td className="px-6 py-5">
                    <div className="font-medium text-slate-900">{order.user?.name || order.guest_name || '—'}</div>
                    <div className="mt-0.5 text-sm text-slate-500">
                      {[order.user?.email, order.user?.phone].filter(Boolean).join(' · ') || order.guest_email || '—'}
                    </div>
                  </td>
                  <td className="max-w-xs px-6 py-5 text-slate-700">
                    <span className="line-clamp-2" title={itemsSummary(order)}>
                      {itemsSummary(order)}
                    </span>
                  </td>
                  <td className="px-6 py-5 font-semibold tabular-nums text-slate-900">
                    ${Number(order.total_price).toFixed(2)}
                  </td>
                  <td className="px-6 py-5">
                    <select
                      value={selectValue(order.status)}
                      disabled={updatingId === order.id}
                      onChange={(e) => changeStatus(order.id, e.target.value)}
                      className="min-w-[140px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      order.payment_status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {order.payment_status || 'unpaid'}
                    </span>
                    {order.tracking_number && (
                      <span className="ml-2 text-xs text-slate-500" title="Tracking #">
                        {order.tracking_number}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => toggleExpand(order)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                      >
                        {expandedId === order.id ? 'Close' : 'Edit'}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(order.id)}
                        className="btn-delete"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedId === order.id && (
                  <tr key={`${order.id}-detail`} className="bg-slate-50/80">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="flex flex-wrap items-end gap-4">
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Payment Status
                          </label>
                          <select
                            value={edit.payment_status || 'unpaid'}
                            onChange={(e) => setEdit((p) => ({ ...p, payment_status: e.target.value }))}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          >
                            {PAYMENT_STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Payment Method
                          </label>
                          <select
                            value={edit.payment_method || 'cod'}
                            onChange={(e) => setEdit((p) => ({ ...p, payment_method: e.target.value }))}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          >
                            {PAYMENT_METHODS.map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Tracking Number
                          </label>
                          <input
                            type="text"
                            value={edit.tracking_number || ''}
                            onChange={(e) => setEdit((p) => ({ ...p, tracking_number: e.target.value }))}
                            placeholder="e.g. TRK-123"
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                        <div className="min-w-[200px] flex-1">
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Notes
                          </label>
                          <input
                            type="text"
                            value={edit.notes || ''}
                            onChange={(e) => setEdit((p) => ({ ...p, notes: e.target.value }))}
                            placeholder="Admin notes..."
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={updatingId === order.id}
                          onClick={() => savePayment(order.id)}
                          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {updatingId === order.id ? 'Saving…' : 'Save Payment'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

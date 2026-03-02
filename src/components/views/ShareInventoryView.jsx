import React, { useState, useEffect, useCallback } from 'react';
import {
    Link2, Link2Off, Send, CheckCircle, XCircle, Clock,
    Share2, Building2, AlertCircle, RefreshCw, ChevronDown,
    Lock, Package, Hotel, Ticket, Loader2
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

const getToken = () => localStorage.getItem('access_token');
const getOrgId = () => {
    try {
        const data = JSON.parse(localStorage.getItem('admin_data') || '{}');
        return data.organization_id || null;
    } catch { return null; }
};
const getOrgName = () => {
    try {
        const data = JSON.parse(localStorage.getItem('admin_data') || '{}');
        return data.full_name || data.name || data.username || 'My Organization';
    } catch { return 'My Organization'; }
};

const authHeaders = () => ({ 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' });

// ─── Status Badge ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        pending: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Clock size={11} />, label: 'Pending' },
        accepted: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle size={11} />, label: 'Accepted' },
        active: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle size={11} />, label: 'Active' },
        rejected: { color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle size={11} />, label: 'Rejected' },
        cancelled: { color: 'bg-slate-100 text-slate-500 border-slate-200', icon: <XCircle size={11} />, label: 'Cancelled' },
        unlinked: { color: 'bg-slate-100 text-slate-500 border-slate-200', icon: <Link2Off size={11} />, label: 'Unlinked' },
        revoked: { color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle size={11} />, label: 'Revoked' },
    };
    const cfg = map[status] || map.pending;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color}`}>
            {cfg.icon} {cfg.label}
        </span>
    );
};

// ─── Inventory Type Badges ────────────────────────────────────────────────────
const InventoryBadge = ({ type }) => {
    const map = {
        tickets: { color: 'bg-blue-100 text-blue-700', icon: <Ticket size={10} /> },
        hotels: { color: 'bg-purple-100 text-purple-700', icon: <Hotel size={10} /> },
        packages: { color: 'bg-orange-100 text-orange-700', icon: <Package size={10} /> },
    };
    const cfg = map[type] || {};
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.color}`}>
            {cfg.icon} {type}
        </span>
    );
};

// ─── Action Button ────────────────────────────────────────────────────────────
const ActionBtn = ({ onClick, variant = 'primary', children, loading, disabled }) => {
    const variants = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        danger: 'bg-red-500 hover:bg-red-600 text-white',
        ghost: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    };
    return (
        <button
            onClick={onClick}
            disabled={loading || disabled}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${variants[variant]} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            {loading ? <Loader2 size={12} className="animate-spin" /> : null}
            {children}
        </button>
    );
};

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard = ({ title, icon, count, children }) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-2.5">
                <div className="text-blue-600">{icon}</div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">{title}</h3>
                {count !== undefined && (
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{count}</span>
                )}
            </div>
        </div>
        <div className="p-6">{children}</div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ShareInventoryView() {
    const myOrgId = getOrgId();
    const myOrgName = getOrgName();

    const [organizations, setOrganizations] = useState([]);
    const [links, setLinks] = useState([]);
    const [shares, setShares] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});
    const [toast, setToast] = useState(null);

    // Send link request form
    const [selectedOrg, setSelectedOrg] = useState('');
    const [sendingLink, setSendingLink] = useState(false);

    // Send share request form
    const [shareForm, setShareForm] = useState({ linkId: '', toOrgId: '', types: [] });
    const [sendingShare, setSendingShare] = useState(false);
    const [showShareForm, setShowShareForm] = useState(null); // link_id

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [orgsRes, linksRes, sharesRes] = await Promise.all([
                fetch(`${API_BASE}/organizations/directory`, { headers: authHeaders() }),
                fetch(`${API_BASE}/org-links/`, { headers: authHeaders() }),
                fetch(`${API_BASE}/inventory-shares/`, { headers: authHeaders() }),
            ]);
            if (orgsRes.ok) setOrganizations(await orgsRes.json());
            if (linksRes.ok) setLinks(await linksRes.json());
            if (sharesRes.ok) setShares(await sharesRes.json());
        } catch (e) {
            showToast('Failed to load data', 'error');
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ── Derived data ──────────────────────────────────────────────────────────
    const otherOrgs = organizations.filter(o => (o._id || o.id) !== myOrgId);

    const getOrgNameById = (id) => {
        const org = organizations.find(o => (o._id || o.id) === id);
        return org?.name || org?.full_name || org?.username || id?.slice(-6) || 'Unknown Org';
    };

    const getOtherOrgId = (link) =>
        link.org_low_id === myOrgId ? link.org_high_id : link.org_low_id;

    // Incoming link requests (pending, where I am NOT the requester)
    const incomingLinkRequests = links.filter(
        l => l.status === 'pending' && l.requested_by_org_id !== myOrgId
    );

    // My sent pending requests
    const sentPendingLinks = links.filter(
        l => l.status === 'pending' && l.requested_by_org_id === myOrgId
    );

    // Accepted links
    const acceptedLinks = links.filter(l => l.status === 'accepted');

    // Incoming share requests (pending, to me)
    const incomingShareRequests = shares.filter(
        s => s.status === 'pending' && s.to_org_id === myOrgId
    );

    // Active shares (I receive)
    const activeShares = shares.filter(
        s => s.status === 'active' && s.to_org_id === myOrgId
    );

    // ── Actions ───────────────────────────────────────────────────────────────
    const setLoaderFor = (id, val) => setActionLoading(prev => ({ ...prev, [id]: val }));

    const sendLinkRequest = async () => {
        if (!selectedOrg) return;
        setSendingLink(true);
        try {
            const res = await fetch(`${API_BASE}/org-links/request`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ to_org_id: selectedOrg })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed');
            showToast('Link request sent!');
            setSelectedOrg('');
            fetchAll();
        } catch (e) {
            showToast(e.message, 'error');
        }
        setSendingLink(false);
    };

    const linkAction = async (linkId, action) => {
        setLoaderFor(linkId, true);
        try {
            const res = await fetch(`${API_BASE}/org-links/${linkId}/action`, {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify({ action })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed');
            showToast(`Link ${action}ed successfully`);
            fetchAll();
        } catch (e) {
            showToast(e.message, 'error');
        }
        setLoaderFor(linkId, false);
    };

    const sendShareRequest = async () => {
        if (!shareForm.linkId || shareForm.types.length === 0) return;
        setSendingShare(true);
        try {
            const res = await fetch(`${API_BASE}/inventory-shares/request`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({
                    link_id: shareForm.linkId,
                    to_org_id: shareForm.toOrgId,
                    inventory_types: shareForm.types,
                    scope: { all: true, filters: {} }
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed');
            showToast('Inventory share request sent!');
            setShowShareForm(null);
            setShareForm({ linkId: '', toOrgId: '', types: [] });
            fetchAll();
        } catch (e) {
            showToast(e.message, 'error');
        }
        setSendingShare(false);
    };

    const shareAction = async (shareId, action) => {
        setLoaderFor(`share_${shareId}`, true);
        try {
            const res = await fetch(`${API_BASE}/inventory-shares/${shareId}/action`, {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify({ action })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed');
            showToast(`Share ${action}ed`);
            fetchAll();
        } catch (e) {
            showToast(e.message, 'error');
        }
        setLoaderFor(`share_${shareId}`, false);
    };

    const toggleShareType = (type) => {
        setShareForm(prev => ({
            ...prev,
            types: prev.types.includes(type)
                ? prev.types.filter(t => t !== type)
                : [...prev.types, type]
        }));
    };

    // ── Render ────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 size={32} className="animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold animate-in slide-in-from-top-2 duration-300
                    ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {toast.type === 'error' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Share Inventory</h1>
                    <p className="text-sm text-slate-500 mt-1">Link with other organizations and share inventory securely</p>
                </div>
                <button onClick={fetchAll} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all">
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* ── 1. Send Link Request ──────────────────────────────────────── */}
            <SectionCard title="Send Link Request" icon={<Link2 size={18} />}>
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">From Organization</label>
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-100 rounded-xl border border-slate-200 text-sm text-slate-600 font-semibold">
                            <Building2 size={14} className="text-slate-400" />
                            {myOrgName}
                            <Lock size={12} className="ml-auto text-slate-400" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">To Organization</label>
                        <select
                            value={selectedOrg}
                            onChange={e => setSelectedOrg(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select organization...</option>
                            {otherOrgs.map(org => (
                                <option key={org._id || org.id} value={org._id || org.id}>
                                    {org.name || org.full_name || org.username}
                                </option>
                            ))}
                        </select>
                    </div>
                    <ActionBtn onClick={sendLinkRequest} loading={sendingLink} disabled={!selectedOrg} variant="primary">
                        <Send size={13} /> Send Request
                    </ActionBtn>
                </div>
            </SectionCard>

            {/* ── 2. Incoming Link Requests ─────────────────────────────────── */}
            {incomingLinkRequests.length > 0 && (
                <SectionCard title="Incoming Link Requests" icon={<AlertCircle size={18} />} count={incomingLinkRequests.length}>
                    <div className="space-y-3">
                        {incomingLinkRequests.map(link => (
                            <div key={link._id} className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-amber-200 flex items-center justify-center text-amber-700 font-black text-sm">
                                        {getOrgNameById(link.requested_by_org_id).charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">
                                            <span className="text-amber-700">{getOrgNameById(link.requested_by_org_id)}</span> wants to link inventories
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">{new Date(link.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <ActionBtn onClick={() => linkAction(link._id, 'accept')} loading={actionLoading[link._id]} variant="success">
                                        <CheckCircle size={12} /> Accept
                                    </ActionBtn>
                                    <ActionBtn onClick={() => linkAction(link._id, 'reject')} loading={actionLoading[link._id]} variant="danger">
                                        <XCircle size={12} /> Reject
                                    </ActionBtn>
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            )}

            {/* ── 3. Linked Organizations ───────────────────────────────────── */}
            <SectionCard title="Linked Organizations" icon={<Building2 size={18} />} count={links.filter(l => ['accepted', 'pending'].includes(l.status)).length}>
                {links.filter(l => ['accepted', 'pending'].includes(l.status)).length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <Link2 size={32} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-semibold">No linked organizations yet</p>
                        <p className="text-xs mt-1">Send a link request above to get started</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {links.filter(l => ['accepted', 'pending'].includes(l.status)).map(link => {
                            const otherId = getOtherOrgId(link);
                            const otherName = getOrgNameById(otherId);
                            const isMySentRequest = link.requested_by_org_id === myOrgId;
                            const isAccepted = link.status === 'accepted';
                            const isShareFormOpen = showShareForm === link._id;

                            return (
                                <div key={link._id} className="border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="flex items-center justify-between p-4 bg-white">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-black text-sm">
                                                {otherName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{otherName}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <StatusBadge status={link.status} />
                                                    {isMySentRequest && link.status === 'pending' && (
                                                        <span className="text-[10px] text-slate-400">Sent by you</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 flex-wrap justify-end">
                                            {isAccepted && (
                                                <ActionBtn
                                                    onClick={() => {
                                                        setShowShareForm(isShareFormOpen ? null : link._id);
                                                        setShareForm({ linkId: link._id, toOrgId: otherId, types: [] });
                                                    }}
                                                    variant="primary"
                                                >
                                                    <Share2 size={12} /> Share Inventory
                                                </ActionBtn>
                                            )}
                                            {isMySentRequest && link.status === 'pending' && (
                                                <ActionBtn onClick={() => linkAction(link._id, 'cancel')} loading={actionLoading[link._id]} variant="ghost">
                                                    Cancel
                                                </ActionBtn>
                                            )}
                                            {isAccepted && (
                                                <ActionBtn onClick={() => linkAction(link._id, 'unlink')} loading={actionLoading[link._id]} variant="danger">
                                                    <Link2Off size={12} /> Unlink
                                                </ActionBtn>
                                            )}
                                        </div>
                                    </div>

                                    {/* Share Inventory Form (inline) */}
                                    {isShareFormOpen && (
                                        <div className="border-t border-slate-100 bg-blue-50/40 p-4 space-y-3">
                                            <p className="text-xs font-black text-slate-600 uppercase tracking-wider">Select inventory types to share with {otherName}</p>
                                            <div className="flex gap-2 flex-wrap">
                                                {['tickets', 'hotels', 'packages'].map(type => (
                                                    <button
                                                        key={type}
                                                        onClick={() => toggleShareType(type)}
                                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${shareForm.types.includes(type)
                                                            ? 'border-blue-600 bg-blue-600 text-white'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                                                            }`}
                                                    >
                                                        {type === 'tickets' && <Ticket size={12} />}
                                                        {type === 'hotels' && <Hotel size={12} />}
                                                        {type === 'packages' && <Package size={12} />}
                                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <ActionBtn onClick={sendShareRequest} loading={sendingShare} disabled={shareForm.types.length === 0} variant="success">
                                                    <Send size={12} /> Send Share Request
                                                </ActionBtn>
                                                <ActionBtn onClick={() => setShowShareForm(null)} variant="ghost">Cancel</ActionBtn>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </SectionCard>

            {/* ── 4. Incoming Inventory Share Requests ─────────────────────── */}
            {incomingShareRequests.length > 0 && (
                <SectionCard title="Incoming Share Requests" icon={<Share2 size={18} />} count={incomingShareRequests.length}>
                    <div className="space-y-3">
                        {incomingShareRequests.map(share => (
                            <div key={share._id} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <div>
                                    <p className="text-sm font-bold text-slate-800">
                                        <span className="text-blue-700">{getOrgNameById(share.from_org_id)}</span> wants to share inventory
                                    </p>
                                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                        {share.inventory_types?.map(t => <InventoryBadge key={t} type={t} />)}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <ActionBtn onClick={() => shareAction(share._id, 'accept')} loading={actionLoading[`share_${share._id}`]} variant="success">
                                        <CheckCircle size={12} /> Accept
                                    </ActionBtn>
                                    <ActionBtn onClick={() => shareAction(share._id, 'reject')} loading={actionLoading[`share_${share._id}`]} variant="danger">
                                        <XCircle size={12} /> Reject
                                    </ActionBtn>
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            )}

            {/* ── 5. Active Shared Inventory (received) ────────────────────── */}
            {activeShares.length > 0 && (
                <SectionCard title="Shared With Me" icon={<Lock size={18} />} count={activeShares.length}>
                    <div className="space-y-2">
                        {activeShares.map(share => (
                            <div key={share._id} className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                                <div>
                                    <p className="text-sm font-bold text-slate-700">
                                        🔒 Shared from <span className="text-emerald-700">{getOrgNameById(share.from_org_id)}</span>
                                    </p>
                                    <div className="flex gap-1.5 mt-1 flex-wrap">
                                        {share.inventory_types?.map(t => <InventoryBadge key={t} type={t} />)}
                                    </div>
                                </div>
                                <ActionBtn onClick={() => shareAction(share._id, 'reject')} loading={actionLoading[`share_${share._id}`]} variant="ghost">
                                    <XCircle size={12} /> Revoke Access
                                </ActionBtn>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            )}
        </div>
    );
}

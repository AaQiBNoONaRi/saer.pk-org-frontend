import React, { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';

const API = 'http://localhost:8000/api';

const Row = ({ label, value }) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-100">
        <div className="text-xs text-slate-500 font-bold">{label}</div>
        <div className="text-sm font-black text-slate-800">{value || '—'}</div>
    </div>
);

export default function LeadDetailView({ leadId, leadData: initialData, onBack }) {
    const [leadData, setLeadData] = useState(initialData || null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(initialData?.lead_status || 'pending');
    const [nextFollowup, setNextFollowup] = useState(initialData?.next_followup_date || '');
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        if (leadData || !leadId) return;
        setLoading(true);
        (async () => {
            try {
                const t = localStorage.getItem('access_token');
                const res = await fetch(`${API}/leads/${leadId}`, { headers: { Authorization: `Bearer ${t}` } });
                if (res.ok) {
                    const data = await res.json();
                    setLeadData(data);
                    setStatus(data.lead_status || 'pending');
                    setNextFollowup(data.next_followup_date || '');
                    setRemarks('');
                }
            } catch (e) { console.error(e); }
            setLoading(false);
        })();
    }, [leadId]);

    const saveFollowup = async () => {
        try {
            const t = localStorage.getItem('access_token');
            const id = leadId || leadData?._id || leadData?.id;
            const res = await fetch(`${API}/leads/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
                body: JSON.stringify({ lead_status: status, next_followup_date: nextFollowup })
            });
            if (res.ok) {
                const updated = await res.json();
                // Also post a chat remark if text was typed
                if (remarks && remarks.trim()) {
                    try {
                        const remarkRes = await fetch(`${API}/leads/${updated._id || updated.id || id}/remarks`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
                            body: JSON.stringify({ text: remarks.trim() })
                        });
                        if (remarkRes.ok) {
                            const rd = await remarkRes.json();
                            updated.chat_remarks = [...(updated.chat_remarks || []), rd.remark];
                        }
                    } catch (re) { console.warn('Remark save failed', re); }
                }
                setLeadData(updated);
                setRemarks('');
                alert('Follow-up saved');
            } else {
                const err = await res.json();
                alert(err.detail || 'Failed to save');
            }
        } catch (e) { console.error(e); alert('Error saving follow-up'); }
    };

    const fmtTime = (iso) => {
        try { return new Date(iso).toLocaleString('en-PK', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }); }
        catch { return iso || ''; }
    };

    return (
        <div className="bg-[#F8F9FD] min-h-screen">
            <div className="p-6 md:p-8">
                <div className="flex items-center gap-4 mb-6">
                    <div onClick={onBack} className="cursor-pointer text-slate-500 hover:text-slate-700">
                        <ChevronLeft size={20} />
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-800">{leadData?.customer_full_name || 'Lead Details'} <span className="text-sm font-medium text-slate-400">{leadData ? `(${leadId})` : ''}</span></h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                            <div className="text-xs font-bold uppercase text-blue-600 bg-blue-50 inline-block px-3 py-1 rounded-full mb-4">Primary Information</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="text-xs text-slate-400 font-bold">Customer Name</div>
                                    <div className="text-lg font-black text-slate-800">{leadData?.customer_full_name || '—'}</div>

                                    <div className="mt-6 text-xs text-slate-400 font-bold">CNIC</div>
                                    <div className="text-sm font-black text-slate-800">{leadData?.cnic || leadData?.nic || '—'}</div>

                                    <div className="mt-6 text-xs text-slate-400 font-bold">City</div>
                                    <div className="text-sm font-black text-slate-800">{leadData?.city || '—'}</div>
                                </div>

                                <div>
                                    <div className="text-xs text-slate-400 font-bold">Phone</div>
                                    <div className="text-lg font-black text-slate-800">{leadData?.contact_number || leadData?.phone || '—'}</div>

                                    <div className="mt-6 text-xs text-slate-400 font-bold">Passport Number</div>
                                    <div className="text-sm font-black text-slate-800">{leadData?.passport_number || '—'}</div>

                                    <div className="mt-6 text-xs text-slate-400 font-bold">Lead Source</div>
                                    <div className="text-sm font-black text-slate-800">{leadData?.lead_source || '—'}</div>

                                    <div className="mt-6 text-xs text-slate-400 font-bold">Loan Amount</div>
                                    <div className="text-sm font-black text-slate-800">{leadData?.loan_amount ? `PKR ${Number(leadData.loan_amount).toLocaleString()}` : '—'}</div>

                                    <div className="mt-6 text-xs text-slate-400 font-bold">Recovered Amount</div>
                                    <div className="text-sm font-black text-slate-800">{leadData?.recovered_amount ? `PKR ${Number(leadData.recovered_amount).toLocaleString()}` : '—'}</div>

                                    <div className="mt-6 text-xs text-slate-400 font-bold">Remaining</div>
                                    <div className="text-sm font-black text-slate-800">{(leadData && (leadData.loan_amount || leadData.recovered_amount)) ? `PKR ${Math.max(0, Number(leadData.loan_amount || 0) - Number(leadData.recovered_amount || 0)).toLocaleString()}` : '—'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Full raw lead data */}
                        <div className="mt-4 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                            <div className="text-xs font-bold uppercase text-slate-500 mb-3">Full Lead Data</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-700">
                                {leadData ? (
                                    [
                                        ['_id', leadData._id || leadData.id],
                                        ['customer_full_name', leadData.customer_full_name],
                                        ['contact_number', leadData.contact_number],
                                        ['whatsapp_number', leadData.whatsapp_number],
                                        ['email', leadData.email],
                                        ['address', leadData.address],
                                        ['city', leadData.city],
                                        ['country', leadData.country],
                                        ['lead_status', leadData.lead_status],
                                        ['conversion_status', leadData.conversion_status],
                                        ['lead_source', leadData.lead_source],
                                        ['interested_in', leadData.interested_in],
                                        ['is_instant', leadData.is_instant],
                                        ['loan_amount', leadData.loan_amount],
                                        ['recovered_amount', leadData.recovered_amount],
                                        ['loan_promise_date', leadData.loan_promise_date],
                                        ['loan_status', leadData.loan_status],
                                        ['next_followup_date', leadData.next_followup_date],
                                        ['remarks', leadData.remarks],
                                        ['organization_id', leadData.organization_id],
                                        ['created_by', leadData.created_by],
                                        ['created_at', leadData.created_at],
                                    ].map(([k, v]) => (
                                        <div key={k} className="flex items-start gap-3">
                                            <div className="text-xs text-slate-400 w-40 font-bold">{k}</div>
                                            <div className="break-words">{v === null || v === undefined ? '—' : (typeof v === 'boolean' ? (v ? 'true' : 'false') : String(v))}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-slate-400">No lead data loaded.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-4">
                        {/* Remarks History */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100">
                                <h3 className="text-sm font-black text-slate-800">Remarks History</h3>
                                <p className="text-[10px] text-slate-400 mt-0.5">All remarks made by the team</p>
                            </div>
                            <div className="px-4 py-3 space-y-2 max-h-64 overflow-y-auto">
                                {(leadData?.chat_remarks || []).length === 0 && (
                                    <p className="text-xs text-slate-400 text-center py-3 font-bold">No remarks yet.</p>
                                )}
                                {(leadData?.chat_remarks || []).map((r, i) => {
                                    const etBadge = { organization: 'bg-purple-100 text-purple-700', branch: 'bg-green-100 text-green-700', agency: 'bg-orange-100 text-orange-700', employee: 'bg-blue-100 text-blue-700' }[r.entity_type] || 'bg-slate-100 text-slate-500';
                                    return (
                                        <div key={i} className="flex gap-2 items-start">
                                            <div className="w-7 h-7 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-white text-[10px] font-black">
                                                {(r.author_name || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                                    <span className="text-[11px] font-black text-slate-900">{r.author_name || 'Unknown'}</span>
                                                    {r.entity_type && <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full leading-none ${etBadge}`}>{r.entity_type}</span>}
                                                    <span className="text-[8px] text-slate-300 ml-auto">{fmtTime(r.created_at)}</span>
                                                </div>
                                                <div className="bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">{r.text}</div>
                                            </div>
                                        </div>
                                    );
                                })}

                            </div>
                        </div>

                        {/* Follow-up form */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                            <h3 className="text-sm font-black text-slate-800 mb-4">Record Follow-up</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-400">Status</label>
                                    <select value={status} onChange={e => setStatus(e.target.value)} className="w-full mt-2 p-2 rounded-lg border border-slate-100 text-sm font-bold">
                                        <option value="pending">Pending</option>
                                        <option value="followup">Follow-up</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="lost">Lost</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400">Next Follow-up Date</label>
                                    <input type="date" value={nextFollowup} onChange={e => setNextFollowup(e.target.value)} className="w-full mt-2 p-2 rounded-lg border border-slate-100 text-sm font-bold" />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400">New Remark</label>
                                    <textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Add a remark about this follow-up…" className="w-full mt-2 p-3 rounded-lg border border-slate-100 text-sm" rows={3}></textarea>
                                </div>

                                <div className="pt-2">
                                    <button onClick={saveFollowup} className="w-full bg-blue-600 text-white py-3 rounded-xl font-black">✓ SAVE FOLLOW-UP</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

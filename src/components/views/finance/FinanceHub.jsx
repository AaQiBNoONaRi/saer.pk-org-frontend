import React, { useState } from 'react';
import {
    LayoutDashboard, BookOpen, BookMarked, PenSquare,
    TrendingUp, Scale, Table2, BookText, ShieldCheck
} from 'lucide-react';

import FinanceDashboard from './FinanceDashboard';
import ChartOfAccounts from './ChartOfAccounts';
import JournalEntries from './JournalEntries';
import ManualEntry from './ManualEntry';
import AuditTrail from './AuditTrail';
import ProfitLoss from './reports/ProfitLoss';
import BalanceSheet from './reports/BalanceSheet';
import TrialBalance from './reports/TrialBalance';
import Ledger from './reports/Ledger';

const TABS = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'coa', label: 'Chart of Accounts', icon: BookOpen },
    { key: 'journal', label: 'Journal Entries', icon: BookMarked },
    { key: 'manual', label: 'Manual Posting', icon: PenSquare },
    { key: 'pl', label: 'Profit & Loss', icon: TrendingUp },
    { key: 'bs', label: 'Balance Sheet', icon: Scale },
    { key: 'tb', label: 'Trial Balance', icon: Table2 },
    { key: 'ledger', label: 'Ledger', icon: BookText },
    { key: 'audit', label: 'Audit Trail', icon: ShieldCheck },
];

export default function FinanceHub() {
    const [activeTab, setActiveTab] = useState('dashboard');

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <FinanceDashboard onNavigate={(t) => {
                const map = {
                    'Finance/COA': 'coa', 'Finance/Journal': 'journal',
                    'Finance/ManualEntry': 'manual', 'Finance/AuditTrail': 'audit',
                    'Finance/Reports/PL': 'pl', 'Finance/Reports/BS': 'bs',
                    'Finance/Reports/TB': 'tb', 'Finance/Reports/Ledger': 'ledger',
                };
                if (map[t]) setActiveTab(map[t]);
            }} />;
            case 'coa': return <ChartOfAccounts />;
            case 'journal': return <JournalEntries />;
            case 'manual': return <ManualEntry />;
            case 'pl': return <ProfitLoss />;
            case 'bs': return <BalanceSheet />;
            case 'tb': return <TrialBalance />;
            case 'ledger': return <Ledger />;
            case 'audit': return <AuditTrail />;
            default: return <FinanceDashboard />;
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Page Header */}
            <div className="mb-6 shrink-0">
                <h1 className="text-3xl font-black text-slate-900">Finance Hub</h1>
                <p className="text-slate-400 text-sm mt-1">Accounting, reports & audit trail</p>
            </div>

            {/* Tab Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mb-6 shrink-0 overflow-hidden">
                <div className="flex w-full overflow-x-auto scrollbar-hide">
                    {TABS.map((tab, i) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        const activeClass = isActive ? 'text-blue-600 border-blue-600 bg-blue-50/60' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border-transparent';

                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 flex items-center justify-center gap-1.5 border-b-2 px-2 py-3.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-colors min-w-[120px] lg:min-w-0 ${activeClass}`}
                            >
                                <Icon size={14} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                                <span className="truncate">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto min-h-0 pb-4">
                {renderContent()}
            </div>
        </div>
    );
}

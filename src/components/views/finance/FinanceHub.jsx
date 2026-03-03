import React, { useState } from 'react';
import {
    LayoutDashboard, BookOpen, BookMarked, PenSquare,
    TrendingUp, Scale, Table2, BookText, ShieldCheck
} from 'lucide-react';
import { getCurrentPermissions } from '../../../utils/permissions';

import FinanceDashboard from './FinanceDashboard';
import ChartOfAccounts from './ChartOfAccounts';
import JournalEntries from './JournalEntries';
import ManualEntry from './ManualEntry';
import AuditTrail from './AuditTrail';
import ProfitLoss from './reports/ProfitLoss';
import BalanceSheet from './reports/BalanceSheet';
import TrialBalance from './reports/TrialBalance';
import Ledger from './reports/Ledger';

// Each tab declares the minimum permission code required to VIEW it
const ALL_TABS = [
    { key: 'dashboard', label: 'Dashboard',        icon: LayoutDashboard, permCode: 'finance.dashboard' },
    { key: 'coa',       label: 'Chart of Accounts', icon: BookOpen,        permCode: 'finance.coa' },
    { key: 'journal',   label: 'Journal Entries',   icon: BookMarked,      permCode: 'finance.journals' },
    { key: 'manual',    label: 'Manual Posting',    icon: PenSquare,       permCode: 'finance.manual_posting' },
    { key: 'pl',        label: 'Profit & Loss',     icon: TrendingUp,      permCode: 'finance.profit_loss' },
    { key: 'bs',        label: 'Balance Sheet',     icon: Scale,           permCode: 'finance.balance_sheet' },
    { key: 'tb',        label: 'Trial Balance',     icon: Table2,          permCode: 'finance.trial_balance' },
    { key: 'ledger',    label: 'Ledger',            icon: BookText,        permCode: 'finance.ledger' },
    { key: 'audit',     label: 'Audit Trail',       icon: ShieldCheck,     permCode: 'finance.audit_trail' },
];

// Returns the tabs this user is allowed to see
function getAllowedTabs() {
    const perms = getCurrentPermissions();
    // Org admins have wildcard — show everything
    if (perms.includes('*')) return ALL_TABS;
    return ALL_TABS.filter(tab =>
        perms.some(p => p === tab.permCode || p.startsWith(tab.permCode + '.'))
    );
}

export default function FinanceHub() {
    // If no specific tabs resolved (shouldn't happen for admins), show all as fallback
    const TABS = getAllowedTabs().length > 0 ? getAllowedTabs() : ALL_TABS;
    const [activeTab, setActiveTab] = useState(TABS[0]?.key || 'dashboard');

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <FinanceDashboard onNavigate={(t) => {
                const map = {
                    'Finance/COA': 'coa', 'Finance/Journal': 'journal',
                    'Finance/ManualEntry': 'manual', 'Finance/AuditTrail': 'audit',
                    'Finance/Reports/PL': 'pl', 'Finance/Reports/BS': 'bs',
                    'Finance/Reports/TB': 'tb', 'Finance/Reports/Ledger': 'ledger',
                };
                const target = map[t];
                // Only navigate to tabs this user is allowed to see
                if (target && TABS.some(tab => tab.key === target)) setActiveTab(target);
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

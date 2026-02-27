import React, { useState, useEffect } from 'react';
import { Clock, Calendar, FileText, DollarSign, MapPin, AlertCircle } from 'lucide-react';

export default function EmployeeHRView() {
    const [activeTab, setActiveTab] = useState('attendance');
    const [loading, setLoading] = useState(true);
    const [myAttendance, setMyAttendance] = useState([]);
    const [myMovements, setMyMovements] = useState([]);
    const [myLeaves, setMyLeaves] = useState([]);
    const [mySalaries, setMySalaries] = useState([]);

    const employeeData = JSON.parse(localStorage.getItem('employee_data') || '{}');
    const employeeId = employeeData._id || employeeData.id;

    useEffect(() => {
        // Placeholder for future API calls
        setLoading(false);
    }, []);

    const tabs = [
        { id: 'attendance', label: 'My Attendance', icon: Clock },
        { id: 'movements', label: 'Movements', icon: MapPin },
        { id: 'leaves', label: 'Leave Requests', icon: FileText },
        { id: 'salaries', label: 'Salary & Payments', icon: DollarSign }
    ];

    const renderAttendance = () => (
        <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-blue-600 mt-0.5" size={20} />
                <div>
                    <p className="text-sm font-semibold text-blue-900">Check-In/Out Feature Coming Soon</p>
                    <p className="text-xs text-blue-700 mt-1">You will be able to check in and out, and view your attendance history here.</p>
                </div>
            </div>
            
            {myAttendance.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    <Clock size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-semibold">No Attendance Records</p>
                    <p className="text-xs mt-1">Your attendance records will appear here</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {myAttendance.map((record, idx) => (
                        <div key={idx} className="bg-white border rounded-lg p-4">
                            {/* Attendance record details will go here */}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderMovements = () => (
        <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-blue-600 mt-0.5" size={20} />
                <div>
                    <p className="text-sm font-semibold text-blue-900">Movement Tracking Coming Soon</p>
                    <p className="text-xs text-blue-700 mt-1">Track your movements and field visits here.</p>
                </div>
            </div>
            
            {myMovements.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    <MapPin size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-semibold">No Movement Records</p>
                    <p className="text-xs mt-1">Your movement history will appear here</p>
                </div>
            ) : null}
        </div>
    );

    const renderLeaves = () => (
        <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-blue-600 mt-0.5" size={20} />
                <div>
                    <p className="text-sm font-semibold text-blue-900">Leave Management Coming Soon</p>
                    <p className="text-xs text-blue-700 mt-1">Submit leave requests and track their status here.</p>
                </div>
            </div>
            
            {myLeaves.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    <FileText size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-semibold">No Leave Requests</p>
                    <p className="text-xs mt-1">Your leave requests will appear here</p>
                </div>
            ) : null}
        </div>
    );

    const renderSalaries = () => (
        <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-blue-600 mt-0.5" size={20} />
                <div>
                    <p className="text-sm font-semibold text-blue-900">Salary Information Coming Soon</p>
                    <p className="text-xs text-blue-700 mt-1">View your salary slips and payment history here.</p>
                </div>
            </div>
            
            {mySalaries.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    <DollarSign size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-semibold">No Salary Records</p>
                    <p className="text-xs mt-1">Your salary and payment records will appear here</p>
                </div>
            ) : null}
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'attendance': return renderAttendance();
            case 'movements': return renderMovements();
            case 'leaves': return renderLeaves();
            case 'salaries': return renderSalaries();
            default: return renderAttendance();
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">My HR Information</h1>
                <p className="text-sm text-slate-500 mt-1">View your attendance, movements, leaves, and salary information</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-200">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                                activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                            }`}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="bg-slate-50 rounded-lg p-6">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-slate-500 mt-4">Loading...</p>
                    </div>
                ) : (
                    renderContent()
                )}
            </div>
        </div>
    );
}

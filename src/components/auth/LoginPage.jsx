import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, User, Lock } from 'lucide-react';
import { authAPI } from '../../services/api';

export default function LoginPage({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus(null);
        setErrorMessage('');

        try {
            // Call backend API
            const response = await authAPI.login(username, password);

            // Success
            setStatus('success');

            // Call onLogin after a brief delay to show success message
            setTimeout(() => {
                onLogin();
            }, 800);
        } catch (error) {
            // Error handling
            setStatus('error');
            if (error.response?.status === 401) {
                setErrorMessage('Invalid username or password');
            } else if (error.response?.status === 403) {
                setErrorMessage('Account is deactivated');
            } else if (error.response?.data?.detail) {
                setErrorMessage(error.response.data.detail);
            } else {
                setErrorMessage('Unable to connect to server. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 font-sans text-left">
            <div className="w-full max-w-[900px] flex bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 flex-col lg:flex-row animate-in zoom-in-95 duration-500">

                {/* Left Side: Branding */}
                <div className="lg:w-[40%] bg-[#1a73e8] p-8 lg:p-12 flex flex-col items-center justify-center relative min-h-[200px] lg:min-h-[480px] overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24 blur-3xl pointer-events-none" />

                    {/* White container for logo */}
                    <div className="relative z-10 bg-white rounded-3xl p-8 lg:p-10 shadow-2xl">
                        <img
                            src="/logo.png"
                            alt="Saer.Pk"
                            className="w-full max-w-[200px] lg:max-w-[240px] h-auto object-contain transition-transform duration-700 hover:scale-105"
                        />
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="flex-1 p-6 lg:p-12 flex flex-col justify-center text-left bg-white">
                    <div className="max-w-sm w-full mx-auto lg:mx-0">
                        <h1 className="text-2xl lg:text-3xl font-black text-slate-900 mb-1 uppercase tracking-tight">Organization Portal</h1>
                        <p className="text-slate-400 font-bold mb-6 uppercase text-[10px] tracking-[0.2em]">Secure Access Gateway</p>

                        <form className="space-y-4" onSubmit={handleLogin}>
                            {/* Username Field */}
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Enter your username"
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 ring-blue-50 transition-all font-bold text-slate-800 text-sm placeholder:font-normal placeholder:text-slate-400"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 ring-blue-50 transition-all font-bold text-slate-800 text-sm placeholder:font-normal placeholder:text-slate-400"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me */}
                            <div className="flex items-center py-1">
                                <label className="flex items-center group cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded-lg border-slate-300 text-[#1a73e8] focus:ring-[#1a73e8] cursor-pointer transition-all"
                                    />
                                    <span className="ml-2 text-sm text-slate-600 font-bold group-hover:text-slate-900 transition-colors">Remember Me</span>
                                </label>
                            </div>

                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-[#1a73e8] text-white font-black rounded-xl shadow-xl shadow-blue-200 transition-all hover:scale-[1.01] active:scale-95 uppercase tracking-wider text-sm flex items-center justify-center gap-3"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin h-5 w-5" />
                                ) : null}
                                {isLoading ? 'Processing...' : 'Login'}
                            </button>
                        </form>

                        {/* Status Feedback */}
                        {status === 'success' && (
                            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <CheckCircle2 size={18} />
                                <span className="text-xs font-bold uppercase tracking-wider">Access Granted</span>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle size={18} />
                                <span className="text-xs font-bold uppercase tracking-wider">
                                    {errorMessage || 'Invalid Credentials'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
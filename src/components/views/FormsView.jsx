import React, { useState, useEffect } from 'react';
import {
    Plus,
    Trash2,
    Save,
    RotateCcw,
    Layout,
    Type,
    Search,
    GripVertical,
    Settings,
    Info,
    MousePointerClick,
    ArrowLeft,
    Edit2,
    FileEdit,
    Loader2,
    FileText,
    X
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// --- Reusable UI Components ---

const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
        {children}
    </div>
);

const CardHeader = ({ title, count, action }) => (
    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            {title}
            {count !== undefined && (
                <span className="ml-2 bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs font-bold">
                    {count}
                </span>
            )}
        </h3>
        {action}
    </div>
);

const Label = ({ children, required }) => (
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {children}
        {required && <span className="text-rose-500 ml-1">*</span>}
    </label>
);

const Input = ({ ...props }) => (
    <input
        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
        {...props}
    />
);

const Select = ({ children, ...props }) => (
    <div className="relative">
        <select
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
            {...props}
        >
            {children}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
        </div>
    </div>
);

const Button = ({ children, variant = "primary", className = "", icon: Icon, ...props }) => {
    const variants = {
        primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200",
        secondary: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm",
        danger: "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-transparent",
        ghost: "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50",
    };

    return (
        <button
            className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
            {...props}
        >
            {Icon && <Icon size={16} className={children ? "mr-2" : ""} />}
            {children}
        </button>
    );
};

// --- Main FormsView Component ---

const FormsView = () => {
    // --- State ---
    const [viewMode, setViewMode] = useState('list'); // 'list',  'builder'
    const [forms, setForms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedForm, setSelectedForm] = useState(null);
    const [error, setError] = useState('');

    // Builder state
    const [formConfig, setFormConfig] = useState({
        title: '',
        autoUrl: '/forms/untitled-form',
        linkBlog: false,
        position: 'End of Blog (Below Content)',
    });

    const [fields, setFields] = useState([]);
    const [buttons, setButtons] = useState([]);
    const [notes, setNotes] = useState([]);

    useEffect(() => {
        fetchForms();
    }, []);

    const fetchForms = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/forms', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setForms(data);
            }
        } catch (err) {
            console.error("Failed to fetch forms", err);
            setError('Failed to load forms');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateNew = () => {
        setFormConfig({
            title: '',
            autoUrl: '/forms/untitled-form',
            linkBlog: false,
            position: 'End of Blog (Below Content)',
        });
        setFields([
            { id: uuidv4(), label: 'Full Name', name: 'full_name', type: 'text', placeholder: 'John Doe', required: true },
            { id: uuidv4(), label: 'Email Address', name: 'email_address', type: 'email', placeholder: 'john@example.com', required: true }
        ]);
        setButtons([
            { id: uuidv4(), label: 'Submit', action: 'submit', type: 'primary' }
        ]);
        setNotes([
            { id: uuidv4(), text: 'We will contact you within 24 hours.', type: 'info' }
        ]);
        setSelectedForm(null);
        setViewMode('builder');
    };

    const handleEdit = (form) => {
        setSelectedForm(form);
        setFormConfig({
            title: form.name,
            autoUrl: form.autoUrl || '/forms/' + form.name.toLowerCase().replace(/\s+/g, '-'),
            linkBlog: form.linkBlog || false,
            position: form.position || 'End of Blog (Below Content)',
        });
        setFields(form.schema?.fields || []);
        setButtons(form.schema?.buttons || [{ id: uuidv4(), label: 'Submit', action: 'submit', type: 'primary' }]);
        setNotes(form.schema?.notes || []);
        setViewMode('builder');
    };

    const handleSave = async () => {
        if (!formConfig.title.trim()) {
            setError('Form title is required');
            return;
        }

        if (fields.length === 0) {
            setError('Add at least one field');
            return;
        }

        try {
            setIsSubmitting(true);
            const token = localStorage.getItem('access_token');

            const formData = {
                name: formConfig.title,
                status: 'active',
                autoUrl: formConfig.autoUrl,
                linkBlog: formConfig.linkBlog,
                position: formConfig.position,
                schema: {
                    fields,
                    buttons,
                    notes,
                    submitButton: {
                        text: buttons[0]?.label || 'Submit',
                        styles: {}
                    }
                }
            };

            let url = 'http://localhost:8000/api/forms';
            let method = 'POST';

            if (selectedForm) {
                url = `http://localhost:8000/api/forms/${selectedForm.id}`;
                method = 'PUT';
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                await fetchForms();
                setViewMode('list');
                setError('');
            }
        } catch (err) {
            console.error("Failed to save form", err);
            setError('Failed to save form');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (formId) => {
        if (!window.confirm('Are you sure you want to delete this form?')) return;

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8000/api/forms/${formId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                await fetchForms();
            }
        } catch (err) {
            console.error("Failed to delete form", err);
        }
    };

    // --- Handlers ---
    const handleConfigChange = (key, value) => {
        setFormConfig(prev => ({ ...prev, [key]: value }));
        if (key === 'title') {
            const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            setFormConfig(prev => ({ ...prev, autoUrl: `/forms/${slug || 'untitled-form'}` }));
        }
    };

    const addField = () => {
        const newField = {
            id: uuidv4(),
            label: 'New Field',
            name: 'new_field',
            type: 'text',
            placeholder: 'Enter text...',
            required: false
        };
        setFields([...fields, newField]);
    };

    const removeField = (id) => {
        setFields(fields.filter(f => f.id !== id));
    };

    const updateField = (id, key, value) => {
        setFields(fields.map(f => {
            if (f.id === id) {
                const updated = { ...f, [key]: value };
                // Auto-generate name from label
                if (key === 'label') {
                    updated.name = value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                }
                return updated;
            }
            return f;
        }));
    };

    const updateButton = (id, key, value) => {
        setButtons(buttons.map(b => b.id === id ? { ...b, [key]: value } : b));
    };

    const updateNote = (id, val) => {
        setNotes(notes.map(n => n.id === id ? { ...n, text: val } : n));
    };

    const filteredForms = forms.filter(form =>
        form.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- LIST VIEW ---
    if (viewMode === 'list') {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Action Header with Breadcrumb */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-slate-400 font-medium mb-1">
                            <span>Content Management</span>
                            <span>/</span>
                            <span className="text-blue-600 font-semibold">Forms</span>
                        </div>
                        <h1 className="text-2xl font-extrabold text-slate-800">Overview</h1>
                    </div>
                    <button
                        onClick={handleCreateNew}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Plus size={18} strokeWidth={3} />
                        CREATE FORM
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100/50 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-2xl bg-blue-500">
                                <FileEdit size={24} className="text-white" strokeWidth={2} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Forms</p>
                            <h3 className="text-2xl font-extrabold text-slate-800">{forms.length}</h3>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100/50 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-2xl bg-emerald-500">
                                <FileEdit size={24} className="text-white" strokeWidth={2} />
                            </div>
                            {forms.filter(f => f.status === 'active').length > 0 && (
                                <span className="bg-green-50 text-green-600 text-xs font-bold px-2 py-1 rounded-lg">
                                    Active
                                </span>
                            )}
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Forms</p>
                            <h3 className="text-2xl font-extrabold text-slate-800">
                                {forms.filter(f => f.status === 'active').length}
                            </h3>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100/50 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-2xl bg-cyan-500">
                                <Layout size={24} className="text-white" strokeWidth={2} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Submissions</p>
                            <h3 className="text-2xl font-extrabold text-slate-800">
                                {forms.reduce((sum, f) => sum + (f.submissions || 0), 0)}
                            </h3>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100/50 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-2xl bg-amber-500">
                                <FileText size={24} className="text-white" strokeWidth={2} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Blog Linked</p>
                            <h3 className="text-2xl font-extrabold text-slate-800">
                                {forms.filter(f => f.linkBlog).length}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Filters & Content Area */}
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100/50 min-h-[500px]">

                    {/* Filter Bar */}
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <div className="relative flex-1 lg:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search forms by name or ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-transparent rounded-2xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50/50 transition-all placeholder:text-slate-400 placeholder:font-medium"
                                />
                            </div>
                        </div>

                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-colors"
                            >
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-blue-600" size={40} />
                        </div>
                    ) : filteredForms.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm ring-1 ring-slate-100">
                                <FileEdit className="text-slate-300" size={40} />
                            </div>
                            <h3 className="text-lg font-extrabold text-slate-800 mb-2">
                                {searchQuery ? 'No Forms Found' : 'No Forms Yet'}
                            </h3>
                            <p className="text-slate-400 text-sm font-medium mb-8 text-center max-w-xs">
                                {searchQuery
                                    ? 'Try adjusting your search terms or filters.'
                                    : "You haven't created any lead forms yet. Start by creating your first form."
                                }
                            </p>
                            {!searchQuery && (
                                <button
                                    onClick={handleCreateNew}
                                    className="bg-white border border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-600 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                                >
                                    <Plus size={16} strokeWidth={3} />
                                    Create New Form
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredForms.map(form => (
                                <div
                                    key={form.id}
                                    className="p-5 border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-sm transition-all group"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-bold text-slate-900 text-base">{form.name}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${form.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {form.status === 'active' ? 'Active' : 'Inactive'}
                                                </span>
                                                {form.linkBlog && (
                                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                                        Blog Linked
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                                                <span className="flex items-center gap-1">
                                                    <Type size={14} />
                                                    {form.schema?.fields?.length || 0} fields
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Layout size={14} />
                                                    {form.submissions || 0} submissions
                                                </span>
                                                <span>Created {new Date(form.created_at).toLocaleDateString()}</span>
                                            </div>
                                            {form.autoUrl && (
                                                <p className="text-xs text-slate-400 mt-2 font-mono bg-slate-50 inline-block px-2 py-1 rounded">
                                                    {form.autoUrl}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(form)}
                                                className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(form.id)}
                                                className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- BUILDER VIEW ---
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Back Button */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setViewMode('list')}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                >
                    <ArrowLeft size={20} className="text-slate-600" />
                </button>
                <div>
                    <h1 className="text-lg font-bold text-slate-900">Form Builder</h1>
                    <p className="text-xs text-slate-500">Create or edit your form</p>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Configuration */}
                <div className="lg:col-span-8 space-y-6">

                    {/* 1. Form Configuration */}
                    <Card>
                        <CardHeader title="Form Configuration" action={<Settings size={16} className="text-slate-400" />} />
                        <div className="p-6 space-y-6">
                            <div>
                                <Label required>Form Title</Label>
                                <Input
                                    placeholder="e.g., Umrah Leads Form"
                                    value={formConfig.title}
                                    onChange={(e) => handleConfigChange('title', e.target.value)}
                                />
                                <p className="mt-1.5 text-xs text-slate-400">Auto URL: <span className="font-mono text-slate-500">{formConfig.autoUrl}</span></p>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center h-5">
                                    <input
                                        id="linkBlog"
                                        type="checkbox"
                                        checked={formConfig.linkBlog}
                                        onChange={(e) => handleConfigChange('linkBlog', e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                                    />
                                </div>
                                <div className="text-sm">
                                    <label htmlFor="linkBlog" className="font-medium text-slate-900 cursor-pointer select-none">Link with Blog Post</label>
                                    <p className="text-slate-500 mt-1">If checked, this form will appear automatically below the selected blog post content.</p>
                                </div>
                            </div>

                            <div>
                                <Label>Display Position</Label>
                                <Select
                                    value={formConfig.position}
                                    onChange={(e) => handleConfigChange('position', e.target.value)}
                                >
                                    <option>End of Blog (Below Content)</option>
                                    <option>Sidebar (Top)</option>
                                    <option>Sidebar (Sticky)</option>
                                    <option>Popup / Modal</option>
                                </Select>
                            </div>
                        </div>
                    </Card>

                    {/* 2. Form Fields */}
                    <Card>
                        <CardHeader
                            title="Form Fields"
                            count={fields.length}
                            action={
                                <Button variant="primary" icon={Plus} onClick={addField} className="!py-1.5 !px-3 !text-xs">
                                    Add Field
                                </Button>
                            }
                        />
                        <div className="p-6">
                            {fields.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                    <Type className="mx-auto h-8 w-8 text-slate-300 mb-3" />
                                    <p className="text-slate-500 font-medium">No fields added yet</p>
                                    <p className="text-sm text-slate-400">Click "Add Field" to start building your form.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="group flex gap-4 p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-indigo-300 hover:shadow-md transition-all">
                                            <div className="mt-2 text-slate-300 cursor-move group-hover:text-indigo-400">
                                                <GripVertical size={20} />
                                            </div>
                                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Label</Label>
                                                    <Input
                                                        value={field.label}
                                                        onChange={(e) => updateField(field.id, 'label', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Placeholder</Label>
                                                    <Input
                                                        value={field.placeholder}
                                                        onChange={(e) => updateField(field.id, 'placeholder', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Field Type</Label>
                                                    <Select
                                                        value={field.type}
                                                        onChange={(e) => updateField(field.id, 'type', e.target.value)}
                                                    >
                                                        <option value="text">Text</option>
                                                        <option value="email">Email</option>
                                                        <option value="number">Number</option>
                                                        <option value="textarea">Text Area</option>
                                                        <option value="select">Dropdown</option>
                                                        <option value="radio">Radio</option>
                                                        <option value="checkbox">Checkbox</option>
                                                        <option value="file">File Upload</option>
                                                    </Select>
                                                </div>
                                                <div className="flex items-end">
                                                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={field.required || false}
                                                            onChange={(e) => updateField(field.id, 'required', e.target.checked)}
                                                            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                                        />
                                                        <span>Required field</span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <button
                                                    onClick={() => removeField(field.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* 3. Action Buttons */}
                    <Card>
                        <CardHeader title="Action Buttons" count={buttons.length} />
                        <div className="p-6">
                            <div className="space-y-3">
                                {buttons.map((btn) => (
                                    <div key={btn.id} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                            <MousePointerClick size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-slate-900">{btn.label}</div>
                                            <div className="text-xs text-slate-500 font-mono mt-0.5">Type: {btn.action}</div>
                                        </div>
                                        <Input
                                            value={btn.label}
                                            onChange={(e) => updateButton(btn.id, 'label', e.target.value)}
                                            className="!w-48"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* 4. Helper Notes */}
                    <Card>
                        <CardHeader title="Helper Notes" />
                        <div className="p-6">
                            {notes.map((note) => (
                                <div key={note.id} className="flex gap-4">
                                    <div className="mt-2 text-slate-400">
                                        <Info size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <Label>Note Content</Label>
                                        <textarea
                                            rows={2}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 resize-none"
                                            value={note.text}
                                            onChange={(e) => updateNote(note.id, e.target.value)}
                                        />
                                        <p className="text-xs text-slate-400 mt-1">Displays below submit button</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Live Preview & Actions */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="sticky top-24 space-y-6">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
                            Live Preview
                        </h2>

                        <div className="bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200 overflow-hidden">
                            {/* Mock Browser Header */}
                            <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                                </div>
                                <div className="flex-1 text-center">
                                    <div className="text-[10px] bg-white border border-slate-200 rounded-md py-0.5 px-2 text-slate-400 inline-block w-full max-w-[180px] truncate">
                                        {formConfig.autoUrl}
                                    </div>
                                </div>
                            </div>

                            {/* Form Render */}
                            <div className="p-6 bg-white min-h-[300px] flex flex-col justify-center">
                                <div className="w-full max-w-sm mx-auto space-y-5">

                                    <div className="text-center mb-6">
                                        <h3 className="text-xl font-bold text-slate-900">{formConfig.title || "Form Title"}</h3>
                                        <p className="text-sm text-slate-500 mt-1">Please fill out the details below.</p>
                                    </div>

                                    {fields.length === 0 && (
                                        <div className="text-center p-4 border border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
                                            Fields will appear here
                                        </div>
                                    )}

                                    {fields.map((field) => (
                                        <div key={field.id}>
                                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                                                {field.label} {field.required && <span className="text-rose-500">*</span>}
                                            </label>
                                            {field.type === 'textarea' ? (
                                                <textarea
                                                    placeholder={field.placeholder}
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                                                    rows="3"
                                                    readOnly
                                                />
                                            ) : (
                                                <input
                                                    type={field.type}
                                                    placeholder={field.placeholder}
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                                    readOnly
                                                />
                                            )}
                                        </div>
                                    ))}

                                    <div className="pt-2">
                                        {buttons.map(btn => (
                                            <button key={btn.id} className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-lg shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-colors">
                                                {btn.label}
                                            </button>
                                        ))}
                                    </div>

                                    {notes.map(note => (
                                        <div key={note.id} className="flex gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg text-xs items-start">
                                            <Info size={14} className="mt-0.5 shrink-0" />
                                            <span>{note.text}</span>
                                        </div>
                                    ))}

                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <Button
                                variant="primary"
                                icon={Save}
                                className="w-full py-3 text-base shadow-lg shadow-indigo-200/50"
                                onClick={handleSave}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Saving...' : 'Save Form'}
                            </Button>
                            <Button
                                variant="secondary"
                                icon={RotateCcw}
                                className="w-full py-3"
                                onClick={() => setViewMode('list')}
                            >
                                Cancel
                            </Button>
                        </div>

                        {/* Stats / Details */}
                        <Card className="!bg-slate-50/50 !border-slate-200">
                            <div className="p-5">
                                <h4 className="font-semibold text-slate-900 mb-4 text-sm">Form Details</h4>
                                <ul className="space-y-3 text-sm">
                                    <li className="flex justify-between">
                                        <span className="text-slate-500">Fields:</span>
                                        <span className="font-medium text-slate-800">{fields.length}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-slate-500">Buttons:</span>
                                        <span className="font-medium text-slate-800">{buttons.length}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-slate-500">Type:</span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                            {formConfig.linkBlog ? 'Blog Linked' : 'Standalone'}
                                        </span>
                                    </li>
                                    <li className="flex justify-between items-start gap-4">
                                        <span className="text-slate-500 shrink-0">Page URL:</span>
                                        <span className="font-mono text-xs text-slate-600 text-right break-all">
                                            {formConfig.autoUrl}
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FormsView;

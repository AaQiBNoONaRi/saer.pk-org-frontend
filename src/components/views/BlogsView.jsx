import React, { useState, useEffect } from 'react';
import {
    FileText, Plus, Search, ArrowLeft, Edit2, Trash2, Eye,
    Loader2, Save, Globe, GripVertical, Type, AlignLeft,
    Image as ImageIcon, Video, Link2, Quote, Settings,
    BookOpen, Tag, Calendar, X, ChevronDown, Filter, MoreHorizontal, Layers
} from 'lucide-react';

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const BlogsView = () => {
    const [blogs, setBlogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // 'list', 'builder', 'preview'
    const [selectedBlog, setSelectedBlog] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All Blogs');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Builder state
    const [title, setTitle] = useState('');
    const [blocks, setBlocks] = useState([]);
    const [selectedBlockId, setSelectedBlockId] = useState(null);
    const [showStyleSidebar, setShowStyleSidebar] = useState(false);

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/blogs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setBlogs(data);
            }
        } catch (err) {
            console.error("Failed to fetch blogs", err);
            setError('Failed to load blogs');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateNew = () => {
        setTitle('');
        setBlocks([]);
        setSelectedBlog(null);
        setSelectedBlockId(null);
        setViewMode('builder');
    };

    const handleEdit = (blog) => {
        setSelectedBlog(blog);
        setTitle(blog.title);
        setBlocks(blog.blocks || []);
        setSelectedBlockId(null);
        setViewMode('builder');
    };

    const handleSave = async (publish = false) => {
        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        try {
            setIsSubmitting(true);
            const token = localStorage.getItem('access_token');

            const blogData = {
                title,
                blocks,
                seoMeta: {
                    description: '',
                    keywords: [],
                    ogImage: null
                }
            };

            let url = 'http://localhost:8000/api/blogs';
            let method = 'POST';

            if (selectedBlog) {
                url = `http://localhost:8000/api/blogs/${selectedBlog.id}`;
                method = 'PUT';
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(blogData)
            });

            if (response.ok) {
                const savedBlog = await response.json();

                // If publish is true, call publish endpoint
                if (publish) {
                    await fetch(`http://localhost:8000/api/blogs/${savedBlog.id}/publish`, {
                        method: 'PATCH',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                }

                await fetchBlogs();
                setViewMode('list');
                setError('');
            }
        } catch (err) {
            console.error("Failed to save blog", err);
            setError('Failed to save blog');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (blogId) => {
        if (!window.confirm('Are you sure you want to delete this blog?')) return;

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8000/api/blogs/${blogId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                await fetchBlogs();
            }
        } catch (err) {
            console.error("Failed to delete blog", err);
        }
    };

    const handlePreview = (blog) => {
        setSelectedBlog(blog);
        setTitle(blog.title);
        setBlocks(blog.blocks || []);
        setViewMode('preview');
    };

    const addBlock = (type) => {
        const newBlock = {
            id: generateId(),
            type,
            order: blocks.length,
            content: getDefaultContent(type),
            styles: {}
        };
        setBlocks([...blocks, newBlock]);
    };

    const getDefaultContent = (type) => {
        switch (type) {
            case 'heading':
                return { text: 'Heading Text', level: 1 };
            case 'paragraph':
                return { text: 'Paragraph text goes here...' };
            case 'image':
                return { src: '', alt: '' };
            case 'video':
                return { src: '' };
            case 'button':
                return { text: 'Click Here', href: '#' };
            case 'quote':
                return { text: 'Quote text...' };
            default:
                return {};
        }
    };

    const updateBlock = (blockId, field, value) => {
        setBlocks(blocks.map(block =>
            block.id === blockId
                ? { ...block, content: { ...block.content, [field]: value } }
                : block
        ));
    };

    const updateBlockStyles = (blockId, styles) => {
        setBlocks(blocks.map(block =>
            block.id === blockId
                ? { ...block, styles: { ...block.styles, ...styles } }
                : block
        ));
    };

    const deleteBlock = (blockId) => {
        setBlocks(blocks.filter(block => block.id !== blockId));
        if (selectedBlockId === blockId) {
            setSelectedBlockId(null);
        }
    };

    const renderBlock = (block, isEditor = true) => {
        const isSelected = selectedBlockId === block.id;
        const blockStyle = block.styles || {};

        return (
            <div
                key={block.id}
                className={`border rounded-lg p-4 mb-4 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200'} ${isEditor ? 'cursor-pointer hover:border-blue-300' : ''}`}
                onClick={() => isEditor && setSelectedBlockId(block.id)}
                style={blockStyle}
            >
                {isEditor && (
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <GripVertical size={14} />
                            <span className="font-semibold uppercase">{block.type}</span>
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBlockId(block.id);
                                    setShowStyleSidebar(true);
                                }}
                                className="p-1 hover:bg-slate-100 rounded"
                            >
                                <Settings size={14} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteBlock(block.id);
                                }}
                                className="p-1 hover:bg-red-100 text-red-600 rounded"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {block.type === 'heading' && (
                    isEditor ? (
                        <div>
                            <select
                                value={block.content.level || 1}
                                onChange={(e) => updateBlock(block.id, 'level', parseInt(e.target.value))}
                                className="mb-2 p-1 border rounded text-sm"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {[1, 2, 3, 4, 5, 6].map(level => (
                                    <option key={level} value={level}>H{level}</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                value={block.content.text || ''}
                                onChange={(e) => updateBlock(block.id, 'text', e.target.value)}
                                className="w-full p-2 border rounded"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    ) : (
                        React.createElement(`h${block.content.level || 1}`, { className: "font-bold" }, block.content.text)
                    )
                )}

                {block.type === 'paragraph' && (
                    isEditor ? (
                        <textarea
                            value={block.content.text || ''}
                            onChange={(e) => updateBlock(block.id, 'text', e.target.value)}
                            className="w-full p-2 border rounded"
                            rows="4"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <p>{block.content.text}</p>
                    )
                )}

                {block.type === 'image' && (
                    isEditor ? (
                        <div>
                            <input
                                type="text"
                                placeholder="Image URL"
                                value={block.content.src || ''}
                                onChange={(e) => updateBlock(block.id, 'src', e.target.value)}
                                className="w-full p-2 border rounded mb-2"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <input
                                type="text"
                                placeholder="Alt text"
                                value={block.content.alt || ''}
                                onChange={(e) => updateBlock(block.id, 'alt', e.target.value)}
                                className="w-full p-2 border rounded"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    ) : (
                        block.content.src && <img src={block.content.src} alt={block.content.alt} className="max-w-full rounded" />
                    )
                )}

                {block.type === 'video' && (
                    isEditor ? (
                        <input
                            type="text"
                            placeholder="Video URL"
                            value={block.content.src || ''}
                            onChange={(e) => updateBlock(block.id, 'src', e.target.value)}
                            className="w-full p-2 border rounded"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        block.content.src && <video src={block.content.src} controls className="max-w-full rounded" />
                    )
                )}

                {block.type === 'button' && (
                    isEditor ? (
                        <div>
                            <input
                                type="text"
                                placeholder="Button text"
                                value={block.content.text || ''}
                                onChange={(e) => updateBlock(block.id, 'text', e.target.value)}
                                className="w-full p-2 border rounded mb-2"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <input
                                type="text"
                                placeholder="Link URL"
                                value={block.content.href || ''}
                                onChange={(e) => updateBlock(block.id, 'href', e.target.value)}
                                className="w-full p-2 border rounded"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    ) : (
                        <a href={block.content.href} className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            {block.content.text}
                        </a>
                    )
                )}

                {block.type === 'quote' && (
                    isEditor ? (
                        <textarea
                            value={block.content.text || ''}
                            onChange={(e) => updateBlock(block.id, 'text', e.target.value)}
                            className="w-full p-2 border rounded"
                            rows="3"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <blockquote className="border-l-4 border-slate-300 pl-4 italic text-slate-700">
                            {block.content.text}
                        </blockquote>
                    )
                )}
            </div>
        );
    };

    // TabButton Component
    const TabButton = ({ label, active, onClick, icon: Icon }) => (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all relative
                ${active ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}
            `}
        >
            {Icon && <Icon size={16} strokeWidth={active ? 2.5 : 2} />}
            {label}
            {active && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 rounded-t-full" />
            )}
        </button>
    );

    const filteredBlogs = blogs.filter(blog => {
        const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase());
        if (activeTab === 'Published') return matchesSearch && blog.status === 'published';
        if (activeTab === 'Auto Pages') return matchesSearch && blog.autoPage;
        return matchesSearch;
    });

    // LIST VIEW
    if (viewMode === 'list') {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Action Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-800 mb-1">Blog Management System</h1>
                        <p className="text-sm font-medium text-slate-400">Create, edit, and manage blog posts across your network</p>

                        {/* Tabs */}
                        <div className="flex items-center gap-2 mt-6 border-b border-slate-100">
                            <TabButton
                                label="All Blogs"
                                active={activeTab === 'All Blogs'}
                                onClick={() => setActiveTab('All Blogs')}
                                icon={BookOpen}
                            />
                            <TabButton
                                label="Published"
                                active={activeTab === 'Published'}
                                onClick={() => setActiveTab('Published')}
                                icon={Eye}
                            />
                            <TabButton
                                label="Auto Pages"
                                active={activeTab === 'Auto Pages'}
                                onClick={() => setActiveTab('Auto Pages')}
                                icon={Layers}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleCreateNew}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Plus size={18} strokeWidth={3} />
                        NEW BLOG
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100/50 hover:shadow-md transition-shadow group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-2xl bg-blue-500 text-white transition-transform group-hover:scale-110">
                                <BookOpen size={24} strokeWidth={2} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Blogs</p>
                            <h3 className="text-2xl font-extrabold text-slate-800">{blogs.length}</h3>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100/50 hover:shadow-md transition-shadow group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-2xl bg-emerald-500 text-white transition-transform group-hover:scale-110">
                                <Eye size={24} strokeWidth={2} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Published</p>
                            <h3 className="text-2xl font-extrabold text-slate-800">
                                {blogs.filter(b => b.status === 'published').length}
                            </h3>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100/50 hover:shadow-md transition-shadow group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-2xl bg-amber-500 text-white transition-transform group-hover:scale-110">
                                <Tag size={24} strokeWidth={2} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Drafts</p>
                            <h3 className="text-2xl font-extrabold text-slate-800">
                                {blogs.filter(b => b.status === 'draft').length}
                            </h3>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100/50 hover:shadow-md transition-shadow group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-2xl bg-cyan-500 text-white transition-transform group-hover:scale-110">
                                <Calendar size={24} strokeWidth={2} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Views</p>
                            <h3 className="text-2xl font-extrabold text-slate-800">
                                {blogs.reduce((sum, b) => sum + (b.views || 0), 0)}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Filters & Content Area */}
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100/50 min-h-[500px]">

                    {/* Filter Section Header */}
                    <div className="flex items-center gap-2 mb-6 text-slate-800">
                        <Filter size={18} className="text-slate-400" />
                        <h3 className="font-bold text-lg">Filters</h3>
                    </div>

                    {/* Filter Inputs Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 items-end">
                        {/* Status */}
                        <div className="lg:col-span-3 space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Status</label>
                            <div className="relative">
                                <select className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-transparent rounded-2xl text-sm font-bold text-slate-600 focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50/50 appearance-none cursor-pointer transition-all">
                                    <option>All Status</option>
                                    <option>Published</option>
                                    <option>Draft</option>
                                    <option>Archived</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>

                        {/* Search Blog */}
                        <div className="lg:col-span-4 space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Search Blog</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search blog title..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-transparent rounded-2xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50/50 transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        {/* Tag */}
                        <div className="lg:col-span-3 space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Tag</label>
                            <div className="relative">
                                <select className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-transparent rounded-2xl text-sm font-bold text-slate-600 focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50/50 appearance-none cursor-pointer transition-all">
                                    <option>All Tags</option>
                                    <option>Travel</option>
                                    <option>Technology</option>
                                    <option>Lifestyle</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>

                        {/* Clear Button */}
                        <div className="lg:col-span-2">
                            <button
                                onClick={() => setSearchQuery('')}
                                className="w-full py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300 transition-all font-bold text-sm shadow-sm"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 my-8"></div>

                    {/* List Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg text-slate-800">Blog Posts ({filteredBlogs.length})</h3>
                    </div>

                    {/* Content */}
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-blue-600" size={40} />
                        </div>
                    ) : filteredBlogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm ring-1 ring-slate-100">
                                <BookOpen className="text-slate-300" size={40} />
                            </div>
                            <h3 className="text-lg font-extrabold text-slate-800 mb-2">
                                {searchQuery ? 'No blogs found' : 'No blogs yet'}
                            </h3>
                            <p className="text-slate-400 text-sm font-medium mb-8 text-center max-w-xs">
                                {searchQuery
                                    ? 'Try adjusting your search terms or filters.'
                                    : "You haven't published any posts yet. Create your first blog to engage with your audience."
                                }
                            </p>
                            {!searchQuery && (
                                <button
                                    onClick={handleCreateNew}
                                    className="bg-white border border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-600 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                                >
                                    <Plus size={16} strokeWidth={3} />
                                    New Blog Post
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredBlogs.map(blog => (
                                <div
                                    key={blog.id}
                                    className="p-5 border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-sm transition-all group"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-bold text-slate-900 text-base">{blog.title}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${blog.status === 'published' ? 'bg-green-100 text-green-700' :
                                                        blog.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {blog.status === 'published' ? 'Published' : blog.status === 'draft' ? 'Draft' : 'Archived'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                                                <span className="flex items-center gap-1">
                                                    <BookOpen size={14} />
                                                    {blog.blocks?.length || 0} blocks
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Eye size={14} />
                                                    {blog.views || 0} views
                                                </span>
                                                <span>Updated {new Date(blog.updated_at || blog.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handlePreview(blog)}
                                                className="p-2.5 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                                                title="Preview"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(blog)}
                                                className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(blog.id)}
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

    // BUILDER VIEW
    if (viewMode === 'builder') {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setViewMode('list')}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                            >
                                <ArrowLeft size={20} className="text-slate-600" />
                            </button>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900">Blog Builder</h1>
                                <p className="text-xs text-slate-500">Create or edit your blog post</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleSave(false)}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
                            >
                                <Save size={16} />
                                Save Draft
                            </button>
                            <button
                                onClick={() => handleSave(true)}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                <Globe size={16} />
                                Publish
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Blog Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter blog title..."
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>

                    <div className="flex gap-6">
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-slate-900">Content Blocks</h3>
                                <div className="relative">
                                    <select
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                addBlock(e.target.value);
                                                e.target.value = '';
                                            }
                                        }}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer"
                                    >
                                        <option value="">+ Add Block</option>
                                        <option value="heading">Heading</option>
                                        <option value="paragraph">Paragraph</option>
                                        <option value="image">Image</option>
                                        <option value="video">Video</option>
                                        <option value="button">Button</option>
                                        <option value="quote">Quote</option>
                                    </select>
                                </div>
                            </div>

                            {blocks.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 border-2 border-dashed rounded-lg">
                                    <FileText size={48} className="mx-auto mb-3 opacity-50" />
                                    <p>No blocks yet. Add your first block above!</p>
                                </div>
                            ) : (
                                <div>
                                    {blocks.map(block => renderBlock(block, true))}
                                </div>
                            )}
                        </div>

                        {showStyleSidebar && selectedBlockId && (
                            <div className="w-80 bg-slate-50 border border-slate-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-slate-900">Block Styles</h3>
                                    <button
                                        onClick={() => setShowStyleSidebar(false)}
                                        className="text-slate-500 hover:text-slate-700"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {(() => {
                                    const block = blocks.find(b => b.id === selectedBlockId);
                                    if (!block) return null;

                                    return (
                                        <div className="space-y-4 text-sm">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Padding</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., 16px"
                                                    value={block.styles.padding || ''}
                                                    onChange={(e) => updateBlockStyles(block.id, { padding: e.target.value })}
                                                    className="w-full p-2 border rounded"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Margin</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., 8px 0"
                                                    value={block.styles.margin || ''}
                                                    onChange={(e) => updateBlockStyles(block.id, { margin: e.target.value })}
                                                    className="w-full p-2 border rounded"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Background Color</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., #f0f0f0"
                                                    value={block.styles.backgroundColor || ''}
                                                    onChange={(e) => updateBlockStyles(block.id, { backgroundColor: e.target.value })}
                                                    className="w-full p-2 border rounded"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Text Color</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., #333"
                                                    value={block.styles.color || ''}
                                                    onChange={(e) => updateBlockStyles(block.id, { color: e.target.value })}
                                                    className="w-full p-2 border rounded"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Font Size</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., 18px"
                                                    value={block.styles.fontSize || ''}
                                                    onChange={(e) => updateBlockStyles(block.id, { fontSize: e.target.value })}
                                                    className="w-full p-2 border rounded"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Border Radius</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., 8px"
                                                    value={block.styles.borderRadius || ''}
                                                    onChange={(e) => updateBlockStyles(block.id, { borderRadius: e.target.value })}
                                                    className="w-full p-2 border rounded"
                                                />
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // PREVIEW VIEW
    if (viewMode === 'preview') {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => setViewMode('list')}
                            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
                        >
                            <ArrowLeft size={20} />
                            <span className="font-semibold">Back to List</span>
                        </button>
                        <button
                            onClick={() => handleEdit(selectedBlog)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                        >
                            <Edit2 size={16} />
                            Edit
                        </button>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-4xl font-bold text-slate-900 mb-8">{title}</h1>
                        <div>
                            {blocks.map(block => renderBlock(block, false))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};

export default BlogsView;

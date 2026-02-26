import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
    FileText, Plus, Search, ArrowLeft, Edit2, Trash2, Eye,
    Loader2, Save, Globe, Type, AlignLeft,
    Image as ImageIcon, Video, Link2, Quote, Settings,
    BookOpen, Tag, Calendar, X, ChevronDown, Filter, Layers,
    PenTool, Hash, UploadCloud, MonitorSmartphone
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/blogs';

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
    const [activeBuilderTab, setActiveBuilderTab] = useState('content');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [customCss, setCustomCss] = useState('');
    const [thumbnailImage, setThumbnailImage] = useState('');
    const [galleryImages, setGalleryImages] = useState([]);
    const [videoUrl, setVideoUrl] = useState('');
    const [category, setCategory] = useState('');
    const [tags, setTags] = useState([]);
    const [author, setAuthor] = useState('');
    const [seoMeta, setSeoMeta] = useState({ title: '', description: '', keywords: [] });
    const [tagInput, setTagInput] = useState('');
    const [keywordInput, setKeywordInput] = useState('');

    const quillRef = useRef(null);

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('access_token');
            const response = await fetch(API_BASE, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setBlogs(data);
            }
        } catch (err) {
            setError('Failed to load blogs');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateNew = () => {
        setSelectedBlog(null);
        setTitle('');
        setContent('');
        setCustomCss('');
        setThumbnailImage('');
        setGalleryImages([]);
        setVideoUrl('');
        setCategory('');
        setTags([]);
        setAuthor('');
        setSeoMeta({ title: '', description: '', keywords: [] });
        setActiveBuilderTab('content');
        setViewMode('builder');
    };

    const handleEdit = (blog) => {
        setSelectedBlog(blog);
        setTitle(blog.title || '');
        setContent(blog.content || '');
        setCustomCss(blog.custom_css || '');
        setThumbnailImage(blog.thumbnail_image_url || '');
        setGalleryImages(blog.gallery_images || []);
        setVideoUrl(blog.video_url || '');
        setCategory(blog.category || '');
        setTags(blog.tags || []);
        setAuthor(blog.author || '');
        setSeoMeta(blog.seoMeta || { title: '', description: '', keywords: [] });
        setActiveBuilderTab('content');
        setViewMode('builder');
    };

    const handleFileUpload = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const token = localStorage.getItem('access_token');

        try {
            const res = await fetch(`${API_BASE}/upload-media`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                return data.url;
            } else {
                const err = await res.json();
                throw new Error(err.detail || 'Upload failed');
            }
        } catch (err) {
            console.error('File upload error:', err);
            return null;
        }
    };

    const imageHandler = () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            if (file) {
                const url = await handleFileUpload(file);
                if (url && quillRef.current) {
                    const quill = quillRef.current.getEditor();
                    const range = quill.getSelection();
                    quill.insertEmbed(range.index, 'image', url);
                }
            }
        };
    };

    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'color': [] }, { 'background': [] }],
                ['blockquote', 'code-block'],
                ['link', 'image', 'video'],
                ['clean']
            ],
            handlers: {
                image: imageHandler
            }
        }
    }), []);

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
                content,
                custom_css: customCss,
                thumbnail_image_url: thumbnailImage,
                gallery_images: galleryImages,
                video_url: videoUrl,
                category,
                tags,
                author,
                seoMeta
            };

            let url = API_BASE;
            let method = 'POST';

            if (selectedBlog) {
                url = `${API_BASE}/${selectedBlog._id}`;
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
                if (publish) {
                    await fetch(`${API_BASE}/${savedBlog._id}/publish`, {
                        method: 'PATCH',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                }
                await fetchBlogs();
                setViewMode('list');
                setError('');
            } else {
                const dt = await response.json();
                setError(dt.detail || 'Failed to save blog');
            }
        } catch (err) {
            setError('Failed to save blog');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (blogId) => {
        if (!window.confirm('Are you sure you want to delete this blog?')) return;
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE}/${blogId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                await fetchBlogs();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleThumbnailUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = await handleFileUpload(file);
            if (url) setThumbnailImage(url);
        }
    };

    const handleGalleryUpload = async (e) => {
        const files = Array.from(e.target.files);
        for (const file of files) {
            const url = await handleFileUpload(file);
            if (url) {
                setGalleryImages(prev => [...prev, url]);
            }
        }
    };

    const removeGalleryImage = (index) => {
        setGalleryImages(prev => prev.filter((_, i) => i !== index));
    };

    const filteredBlogs = blogs.filter(blog => {
        const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase());
        if (activeTab === 'Published') return matchesSearch && blog.status === 'published';
        if (activeTab === 'Auto Pages') return matchesSearch && blog.autoPage;
        return matchesSearch;
    });

    if (viewMode === 'list') {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Action Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-800 mb-1">Blog Management</h1>
                        <p className="text-sm font-medium text-slate-400">Wordpress-style blog publishing</p>
                        <div className="flex items-center gap-2 mt-6 border-b border-slate-100">
                            {[
                                { id: 'All Blogs', icon: BookOpen },
                                { id: 'Published', icon: Eye },
                                { id: 'Auto Pages', icon: Layers }
                            ].map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all relative ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                                    <tab.icon size={16} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                                    {tab.id}
                                    {activeTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 rounded-t-full" />}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0">
                        <Plus size={18} strokeWidth={3} />
                        NEW BLOG
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100/50">
                        <div className="p-3 mb-4 inline-block rounded-2xl bg-blue-500 text-white"><BookOpen size={24} /></div>
                        <p className="text-xs font-bold text-slate-400 tracking-wider">Total Blogs</p>
                        <h3 className="text-2xl font-extrabold text-slate-800">{blogs.length}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100/50">
                        <div className="p-3 mb-4 inline-block rounded-2xl bg-emerald-500 text-white"><Eye size={24} /></div>
                        <p className="text-xs font-bold text-slate-400 tracking-wider">Published</p>
                        <h3 className="text-2xl font-extrabold text-slate-800">{blogs.filter(b => b.status === 'published').length}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100/50">
                        <div className="p-3 mb-4 inline-block rounded-2xl bg-amber-500 text-white"><Tag size={24} /></div>
                        <p className="text-xs font-bold text-slate-400 tracking-wider">Drafts</p>
                        <h3 className="text-2xl font-extrabold text-slate-800">{blogs.filter(b => b.status === 'draft').length}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100/50">
                        <div className="p-3 mb-4 inline-block rounded-2xl bg-cyan-500 text-white"><Calendar size={24} /></div>
                        <p className="text-xs font-bold text-slate-400 tracking-wider">Total Views</p>
                        <h3 className="text-2xl font-extrabold text-slate-800">{blogs.reduce((s, b) => s + (b.views || 0), 0)}</h3>
                    </div>
                </div>

                {/* Filters & Content Area */}
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100/50 min-h-[500px]">
                    <div className="relative mb-8 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder="Search blog title..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-transparent rounded-2xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50/50 transition-all placeholder:text-slate-400" />
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
                    ) : filteredBlogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30">
                            <BookOpen className="text-slate-300 mb-4" size={48} />
                            <h3 className="text-lg font-extrabold text-slate-800 mb-2">No blogs found</h3>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredBlogs.map(blog => (
                                <div key={blog._id} className="p-5 border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-4">
                                    {blog.thumbnail_image_url ? (
                                        <div className="w-20 h-20 rounded-xl bg-cover bg-center shrink-0 border border-slate-200" style={{ backgroundImage: `url(${blog.thumbnail_image_url})` }} />
                                    ) : (
                                        <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                                            <ImageIcon className="text-slate-300" size={24} />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-slate-900 text-base">{blog.title}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${blog.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {blog.status === 'published' ? 'Published' : 'Draft'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                                            <span>{blog.author || 'No Author'}</span> •
                                            <span>{new Date(blog.updated_at || blog.created_at).toLocaleDateString()}</span> •
                                            <span>{blog.views || 0} views</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setViewMode('preview') || setSelectedBlog(blog)} className="p-2.5 text-slate-600 hover:bg-slate-50 rounded-xl" title="Preview"><MonitorSmartphone size={18} /></button>
                                        <button onClick={() => handleEdit(blog)} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl" title="Edit"><Edit2 size={18} /></button>
                                        <button onClick={() => handleDelete(blog._id)} className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl" title="Delete"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (viewMode === 'builder') {
        const BuilderTabButton = ({ id, icon: Icon, label }) => (
            <button
                onClick={() => setActiveBuilderTab(id)}
                className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeBuilderTab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <Icon size={16} /> {label}
            </button>
        );

        return (
            <div className="space-y-6 animate-in fade-in duration-500 pb-20">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm sticky top-0 z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setViewMode('list')} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft size={20} className="text-slate-600" /></button>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900">{selectedBlog ? 'Edit Blog' : 'New Blog'}</h1>
                            <p className="text-xs text-slate-500">Auto-saves every 30s • WordPress style editor</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleSave(false)} disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 disabled:opacity-50">
                            <Save size={16} /> Save Draft
                        </button>
                        <button onClick={() => handleSave(true)} disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                            <Globe size={16} /> Publish
                        </button>
                    </div>
                </div>

                {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">{error}</div>}

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex border-b border-slate-200 bg-slate-50 px-4">
                        <BuilderTabButton id="content" icon={FileText} label="Content" />
                        <BuilderTabButton id="media" icon={ImageIcon} label="Media & Gallery" />
                        <BuilderTabButton id="seo" icon={Settings} label="SEO & Styling" />
                    </div>

                    <div className="p-8">
                        {activeBuilderTab === 'content' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Blog Title</label>
                                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A catchy title..." className="w-full p-4 border border-slate-200 rounded-xl text-lg font-bold focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300" />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                                        <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g., Travel Guides" className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Author Name</label>
                                        <input type="text" value={author} onChange={e => setAuthor(e.target.value)} placeholder="John Doe" className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Main Content</label>
                                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden quill-wrapper" style={{ minHeight: 400 }}>
                                        <ReactQuill
                                            ref={quillRef}
                                            theme="snow"
                                            modules={modules}
                                            value={content}
                                            onChange={setContent}
                                            style={{ height: 'calc(100% - 42px)' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeBuilderTab === 'media' && (
                            <div className="space-y-8 max-w-4xl">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">Thumbnail / Cover Image</h3>
                                    <p className="text-sm text-slate-500 mb-4">Required. This image will represent your blog everywhere.</p>
                                    {thumbnailImage ? (
                                        <div className="relative group rounded-xl overflow-hidden border border-slate-200 inline-block">
                                            <img src={thumbnailImage} alt="Thumbnail preview" className="h-64 object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button onClick={() => setThumbnailImage('')} className="bg-white text-red-600 font-bold px-4 py-2 rounded-lg text-sm shadow-lg">Remove</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="flex items-center gap-4 p-6 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><UploadCloud /></div>
                                            <div>
                                                <div className="font-bold text-slate-700">Click to upload thumbnail</div>
                                                <div className="text-xs text-slate-500">JPG, PNG, WEBP (Max 2MB)</div>
                                            </div>
                                            <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
                                        </label>
                                    )}
                                </div>

                                <div className="border-t border-slate-100 my-8"></div>

                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">Media Gallery</h3>
                                    <p className="text-sm text-slate-500 mb-4">Upload additional photos to create a gallery at the bottom of the blog.</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        {galleryImages.map((img, idx) => (
                                            <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square">
                                                <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                                <button onClick={() => removeGalleryImage(idx)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">✕</button>
                                            </div>
                                        ))}
                                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all aspect-square text-slate-400 hover:text-blue-500">
                                            <Plus size={32} className="mb-2" />
                                            <span className="text-sm font-bold">Add Photo</span>
                                            <input type="file" multiple accept="image/*" onChange={handleGalleryUpload} className="hidden" />
                                        </label>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 my-8"></div>

                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">Embed Video</h3>
                                    <p className="text-sm text-slate-500 mb-4">Paste a YouTube, Vimeo, or MP4 url to embed a featured video.</p>
                                    <input type="text" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none max-w-2xl" />
                                </div>
                            </div>
                        )}

                        {activeBuilderTab === 'seo' && (
                            <div className="space-y-8 max-w-4xl">
                                {/* Tags */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-4">Blog Tags</h3>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {tags.map(tag => (
                                            <div key={tag} className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-700">
                                                {tag}
                                                <button onClick={() => setTags(tags.filter(t => t !== tag))} className="text-slate-400 hover:text-red-500">✕</button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => {
                                            if (e.key === 'Enter' && tagInput.trim() && !tags.includes(tagInput.trim())) {
                                                setTags([...tags, tagInput.trim()]);
                                                setTagInput('');
                                                e.preventDefault();
                                            }
                                        }} placeholder="Type tag and hit Enter" className="p-3 border border-slate-200 rounded-xl text-sm outline-none w-64" />
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 my-8"></div>

                                {/* Custom CSS */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">Custom CSS (Advanced)</h3>
                                    <p className="text-sm text-slate-500 mb-4">Apply custom styles exclusively to this blog page. Sanitzed securely.</p>
                                    <div className="bg-slate-900 rounded-xl p-4">
                                        <textarea value={customCss} onChange={e => setCustomCss(e.target.value)} placeholder=".blog-content h2 { color: red; }" className="w-full bg-transparent text-emerald-400 font-mono text-sm outline-none resize-y" rows="6" spellCheck="false" />
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 my-8"></div>

                                {/* SEO Meta */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-4">SEO Metadata</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Meta Title</label>
                                            <input type="text" value={seoMeta.title || ''} onChange={e => setSeoMeta({ ...seoMeta, title: e.target.value })} placeholder="SEO friendly title..." className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Meta Description</label>
                                            <textarea value={seoMeta.description || ''} onChange={e => setSeoMeta({ ...seoMeta, description: e.target.value })} placeholder="Short description for search engines..." className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none" rows="3" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Meta Keywords</label>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {(seoMeta.keywords || []).map(kw => (
                                                    <div key={kw} className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-semibold text-blue-700 border border-blue-100">
                                                        {kw}
                                                        <button onClick={() => setSeoMeta({ ...seoMeta, keywords: seoMeta.keywords.filter(k => k !== kw) })} className="text-blue-400 hover:text-red-500">✕</button>
                                                    </div>
                                                ))}
                                            </div>
                                            <input type="text" value={keywordInput} onChange={e => setKeywordInput(e.target.value)} onKeyDown={e => {
                                                if (e.key === 'Enter' && keywordInput.trim() && !(seoMeta.keywords || []).includes(keywordInput.trim())) {
                                                    setSeoMeta({ ...seoMeta, keywords: [...(seoMeta.keywords || []), keywordInput.trim()] });
                                                    setKeywordInput('');
                                                    e.preventDefault();
                                                }
                                            }} placeholder="Add SEO keyword and hit Enter" className="p-3 border border-slate-200 rounded-xl text-sm outline-none w-64" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .quill-wrapper .ql-toolbar {
                        border: none;
                        border-bottom: 1px solid #e2e8f0;
                        background: #f8fafc;
                        border-radius: 12px 12px 0 0;
                        padding: 12px;
                    }
                    .quill-wrapper .ql-container {
                        border: none;
                        font-size: 16px;
                        font-family: inherit;
                    }
                    .quill-wrapper .ql-editor {
                        min-height: 400px;
                        padding: 24px;
                    }
                `}} />
            </div>
        );
    }

    // Preview Mode placeholder, fallback to list if encountered
    if (viewMode === 'preview') {
        const blogData = selectedBlog || { title, content, thumbnail_image_url: thumbnailImage, custom_css: customCss, gallery_images: galleryImages, video_url: videoUrl, author, category, tags };
        return (
            <div className="animate-in fade-in duration-500 pb-20">
                <div className="bg-white p-4 shadow-sm border-b sticky top-0 z-50 flex items-center justify-between">
                    <button onClick={() => setViewMode(selectedBlog ? 'list' : 'builder')} className="flex items-center gap-2 text-slate-600 font-bold"><ArrowLeft size={16} /> Exit Preview</button>
                    <div className="text-sm font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">Preview Mode</div>
                </div>
                {/* Simulated BlogArticle style rendering */}
                <div className="max-w-4xl mx-auto mt-12 bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                    {blogData.thumbnail_image_url && <div className="h-80 bg-cover bg-center" style={{ backgroundImage: `url(${blogData.thumbnail_image_url})` }} />}
                    <div className="p-12">
                        <div className="mb-8">
                            {blogData.category && <span className="text-blue-600 font-bold uppercase tracking-wider text-xs mb-2 block">{blogData.category}</span>}
                            <h1 className="text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">{blogData.title || 'Untitled Blog'}</h1>
                            <div className="text-slate-500 font-medium">By {blogData.author || 'Author'} • Preview</div>
                        </div>
                        <style dangerouslySetInnerHTML={{ __html: blogData.custom_css }} />
                        <div className="blog-content ql-editor" dangerouslySetInnerHTML={{ __html: blogData.content }} />
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default BlogsView;

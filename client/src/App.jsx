import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function App() {
  const [posts, setPosts] = useState([]);
  const [view, setView] = useState('home'); 
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentUserId, setCurrentUserId] = useState(localStorage.getItem('userId'));
  const [editingId, setEditingId] = useState(null); // Track if we are editing
  const [uploading, setUploading] = useState(false);
  
  const [form, setForm] = useState({ title: '', content: '', imageUrl: '', status: 'published' });

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    const res = await axios.get(`${API}/posts`);
    setPosts(res.data);
  };

  // Switch to Edit Mode
  const startEdit = (post) => {
    setForm({ title: post.title, content: post.content, imageUrl: post.imageUrl, status: post.status });
    setEditingId(post._id);
    setView('write');
  };

  const savePost = async (status) => {
    const postData = { ...form, status };
    try {
      if (editingId) {
        await axios.put(`${API}/posts/${editingId}`, postData, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API}/posts`, postData, { headers: { Authorization: `Bearer ${token}` } });
      }
      setEditingId(null);
      setForm({ title: '', content: '', imageUrl: '', status: 'published' });
      setView('home');
      fetchPosts();
    } catch (err) { alert("Save failed"); }
  };

  const publishedPosts = posts.filter(p => p.status === 'published');
  const draftPosts = posts.filter(p => p.status === 'draft' && p.author === currentUserId);

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans">
      <nav className="sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-serif font-black text-white cursor-pointer" onClick={() => {setView('home'); setEditingId(null);}}>Journal.</h1>
          <div className="flex gap-6 items-center text-[10px] font-bold uppercase tracking-widest">
            <button onClick={() => setView('home')} className="hover:text-blue-400">Feed</button>
            {token && (
              <>
                <button onClick={() => setView('drafts')} className="hover:text-yellow-400">My Drafts ({draftPosts.length})</button>
                <button onClick={() => {setEditingId(null); setForm({title:'', content:'', imageUrl:''}); setView('write')}} className="text-blue-400">New Story</button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        
        {/* HOME FEED WITH EMPTY STATE */}
        {view === 'home' && (
          <div className="max-w-2xl mx-auto">
            {publishedPosts.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl">
                <p className="text-slate-500 font-serif italic text-xl mb-4">The fields are empty...</p>
                <button onClick={() => setView('write')} className="text-blue-400 font-bold uppercase text-xs tracking-widest hover:underline">Begin the first narrative</button>
              </div>
            ) : (
              publishedPosts.map(post => (
                <article key={post._id} className="mb-24 group">
                  {post.imageUrl && <img src={post.imageUrl} className="w-full h-80 object-cover rounded-2xl mb-8 border border-slate-800" />}
                  <h2 className="text-4xl font-serif font-bold text-white mb-6 leading-tight">{post.title}</h2>
                  <div className="prose prose-invert prose-slate max-w-none mb-6">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                  </div>
                  <div className="flex gap-4 items-center border-t border-slate-800 pt-6">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">By {post.authorName}</span>
                    {currentUserId === post.author && (
                      <button onClick={() => startEdit(post)} className="text-[10px] text-blue-400 font-bold uppercase ml-auto">Edit</button>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        {/* DRAFTS VIEW */}
        {view === 'drafts' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-yellow-500 mb-10">Unpublished Drafts</h2>
            {draftPosts.length === 0 ? <p className="text-slate-600 italic">No drafts saved.</p> : 
              draftPosts.map(post => (
                <div key={post._id} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl mb-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-white font-bold">{post.title || "Untitled Draft"}</h3>
                    <p className="text-[10px] text-slate-500 uppercase">{new Date(post.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => startEdit(post)} className="bg-slate-800 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-700 transition">Continue Writing</button>
                </div>
              ))
            }
          </div>
        )}

        {/* WRITE / EDIT VIEW */}
        {view === 'write' && (
          <div className="flex flex-col h-[calc(100vh-160px)]">
            <div className="flex gap-4 mb-4">
              <input className="flex-1 bg-transparent text-4xl font-serif font-bold text-white outline-none" placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              <button onClick={() => savePost('draft')} className="text-yellow-500 text-xs font-bold uppercase px-4">Save Draft</button>
              <button onClick={() => savePost('published')} className="bg-blue-600 text-white px-8 py-2 rounded-xl font-bold">{editingId ? 'Update Story' : 'Publish Story'}</button>
            </div>
            <div className="grid grid-cols-2 flex-1 border border-slate-800 rounded-3xl overflow-hidden bg-slate-900/20">
              <div className="flex flex-col border-r border-slate-800">
                <textarea className="flex-1 p-8 bg-transparent text-slate-300 font-mono text-sm outline-none resize-none leading-relaxed" value={form.content} onChange={e => setForm({...form, content: e.target.value})} />
              </div>
              <div className="p-8 overflow-y-auto prose prose-invert prose-slate max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
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
  const [uploading, setUploading] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  
  const [form, setForm] = useState({ 
    title: '', 
    content: '# New Narrative\n\nStart typing to see the **live preview**...', 
    imageUrl: '' 
  });
  
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const res = await axios.get(`${API}/posts`);
    setPosts(res.data);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await axios.post(`${API}/upload`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setForm(prev => ({ ...prev, imageUrl: res.data.url }));
    } catch (err) {
      alert("Upload failed.");
    } finally { setUploading(false); }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Delete this story permanently?")) return;
    try {
      await axios.delete(`${API}/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPosts();
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.message || "Error"));
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = authMode === 'login' ? 'login' : 'signup';
    try {
      const res = await axios.post(`${API}/${endpoint}`, credentials);
      if (authMode === 'login') {
        setToken(res.data.token);
        setCurrentUserId(res.data.userId);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userId', res.data.userId);
        setView('home');
      } else {
        setAuthMode('login');
        alert("Account ready. Please login.");
      }
    } catch (err) { alert("Auth Error"); }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans">
      <nav className="sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-serif font-black text-white cursor-pointer" onClick={() => setView('home')}>Journal.</h1>
          <div className="flex gap-6 items-center">
            <button onClick={() => setView('home')} className="text-[10px] font-bold uppercase tracking-widest hover:text-blue-400">Feed</button>
            {token ? (
              <button onClick={() => setView('write')} className="bg-blue-600 text-white px-6 py-2 rounded-full text-[10px] font-bold uppercase shadow-lg shadow-blue-900/40">Write</button>
            ) : (
              <button onClick={() => setView('write')} className="text-blue-400 text-[10px] font-bold uppercase">Sign In</button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {view === 'home' && (
          <div className="max-w-2xl mx-auto">
            {posts.map(post => (
              <article key={post._id} className="mb-24 animate-in fade-in duration-700">
                {post.imageUrl && <img src={post.imageUrl} className="w-full h-80 object-cover rounded-2xl mb-8 border border-slate-800" />}
                <h2 className="text-4xl font-serif font-bold text-white mb-6 leading-tight">{post.title}</h2>
                <div className="prose prose-invert prose-slate max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">By {post.authorName}</span>
                  {currentUserId === post.author && (
                    <button onClick={() => handleDelete(post._id)} className="text-[10px] text-red-500 font-bold uppercase hover:underline">Delete</button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {view === 'write' && (
          <div className="flex flex-col h-[calc(100vh-140px)] animate-in slide-in-from-bottom-4">
            <div className="flex items-center gap-4 mb-6">
              <input className="flex-1 bg-transparent text-4xl font-serif font-bold text-white outline-none" placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              <button onClick={async () => { await axios.post(`${API}/posts`, form, { headers: { Authorization: `Bearer ${token}` } }); setView('home'); fetchPosts(); }} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold">Publish</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 border border-slate-800 rounded-3xl overflow-hidden bg-slate-900/30 flex-1">
              <div className="flex flex-col border-r border-slate-800">
                <div className="bg-slate-800/50 px-6 py-2 text-[10px] font-black uppercase text-slate-500 border-b border-slate-800 flex justify-between">
                   <span>Editor</span>
                   <label className="cursor-pointer text-blue-400"><input type="file" hidden onChange={handleImageUpload} />{uploading ? '...' : '+ Image'}</label>
                </div>
                <textarea className="w-full h-full p-8 bg-transparent text-slate-300 font-mono text-sm outline-none resize-none" value={form.content} onChange={e => setForm({...form, content: e.target.value})} />
              </div>
              <div className="flex flex-col bg-[#0b1120] overflow-y-auto p-8 prose prose-invert prose-slate max-w-none">
                {form.imageUrl && <img src={form.imageUrl} className="w-full h-48 object-cover rounded-xl mb-8" />}
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
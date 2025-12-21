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
  const [editingId, setEditingId] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  
  const [form, setForm] = useState({ title: '', content: '', imageUrl: '', status: 'published' });
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API}/posts`);
      setPosts(res.data);
    } catch (err) { console.error("Backend connection error"); }
  };

  const deletePost = async (id) => {
    if (!window.confirm("⚠️ Are you sure? This narrative will be lost forever.")) return;
    try {
      await axios.delete(`${API}/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPosts(); // Refresh list after deletion
    } catch (err) {
      alert("Failed to delete post.");
    }
  };

  const savePost = async (status) => {
    if (!form.title.trim()) return alert("⚠️ Please add a title.");
    if (!form.content.trim()) return alert("⚠️ Content cannot be empty.");

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const data = { ...form, status };
      if (editingId) {
        await axios.put(`${API}/posts/${editingId}`, data, config);
      } else {
        await axios.post(`${API}/posts`, data, config);
      }
      setEditingId(null);
      setForm({ title: '', content: '', imageUrl: '', status: 'published' });
      setView('home');
      fetchPosts();
    } catch (err) { alert("Error saving post."); }
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setCurrentUserId(null);
    setView('home');
  };

  const publishedPosts = posts.filter(p => p.status === 'published');
  const draftPosts = posts.filter(p => p.status === 'draft' && p.author === currentUserId);

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans">
      <nav className="sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-serif font-black text-white cursor-pointer" onClick={() => setView('home')}>Journal.</h1>
          <div className="flex gap-6 items-center text-[10px] font-bold uppercase tracking-widest">
            <button onClick={() => setView('home')} className="hover:text-blue-400">Feed</button>
            {token ? (
              <>
                <button onClick={() => setView('drafts')} className="text-yellow-500">Drafts ({draftPosts.length})</button>
                <button onClick={() => {setEditingId(null); setForm({title:'', content:'', imageUrl:''}); setView('write')}} className="text-blue-400">New Story</button>
                <button onClick={logout} className="text-red-500/60 hover:text-red-500">Log Out</button>
              </>
            ) : (
              <button onClick={() => setView('login')} className="bg-blue-600 text-white px-5 py-2 rounded-full">Sign In</button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* LOGIN/SIGNUP */}
        {view === 'login' && (
          <div className="max-w-sm mx-auto bg-slate-900 border border-slate-800 p-10 rounded-3xl">
            <h2 className="text-2xl font-serif font-bold text-white mb-6">{authMode === 'login' ? 'Sign In' : 'Join'}</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await axios.post(`${API}/${authMode}`, credentials);
                if (authMode === 'login') {
                  setToken(res.data.token);
                  setCurrentUserId(res.data.userId);
                  localStorage.setItem('token', res.data.token);
                  localStorage.setItem('userId', res.data.userId);
                  setView('home');
                } else { setAuthMode('login'); alert("User Created!"); }
              } catch { alert("Auth Error"); }
            }} className="space-y-4">
              <input className="w-full bg-slate-800 p-4 rounded-xl outline-none" placeholder="Username" onChange={e => setCredentials({...credentials, username: e.target.value})} />
              <input className="w-full bg-slate-800 p-4 rounded-xl outline-none" type="password" placeholder="Password" onChange={e => setCredentials({...credentials, password: e.target.value})} />
              <button className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold">Continue</button>
              <p className="text-center text-[10px] cursor-pointer mt-4 uppercase text-slate-500 font-bold" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>Toggle Login/Signup</p>
            </form>
          </div>
        )}

        {/* FEED VIEW */}
        {view === 'home' && (
          <div className="max-w-2xl mx-auto">
            {publishedPosts.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl">
                <p className="text-slate-500 italic">No published stories yet.</p>
              </div>
            ) : (
              publishedPosts.map(post => (
                <article key={post._id} className="mb-24">
                  {post.imageUrl && <img src={post.imageUrl} className="w-full h-80 object-cover rounded-2xl mb-8 border border-slate-800" />}
                  <h2 className="text-4xl font-serif font-bold text-white mb-4">{post.title}</h2>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">By {post.authorName}</div>
                  <div className="prose prose-invert prose-slate max-w-none mb-6">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                  </div>
                  {currentUserId === post.author && (
                    <div className="flex gap-4">
                      <button onClick={() => { setEditingId(post._id); setForm(post); setView('write'); }} className="text-[10px] text-blue-400 font-bold uppercase">Edit</button>
                      <button onClick={() => deletePost(post._id)} className="text-[10px] text-red-500 font-bold uppercase">Delete Post</button>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        )}

        {/* DRAFTS VIEW */}
        {view === 'drafts' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-yellow-500 mb-8">Workspace</h2>
            {draftPosts.length === 0 ? (
               <div className="text-center py-20 bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl">
                <p className="text-slate-500 italic mb-4">You have 0 drafts.</p>
                <button onClick={() => setView('write')} className="text-yellow-500 font-bold uppercase text-[10px]">Create new draft</button>
              </div>
            ) : (
              draftPosts.map(post => (
                <div key={post._id} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl mb-4 flex justify-between items-center group hover:border-yellow-500/50 transition-all">
                  <div>
                    <h3 className="text-white font-bold">{post.title || "Untitled Draft"}</h3>
                    <p className="text-[10px] text-slate-500 uppercase">Status: Private Draft</p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => { setEditingId(post._id); setForm(post); setView('write'); }} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-yellow-600 transition-colors">Resume</button>
                    <button onClick={() => deletePost(post._id)} className="text-red-500 font-bold text-[10px] uppercase hover:underline">Discard</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* WRITE VIEW */}
        {view === 'write' && (
          <div className="flex flex-col h-[calc(100vh-160px)]">
            <div className="flex gap-4 mb-6 items-center">
              <input className="flex-1 bg-transparent text-4xl font-serif font-bold text-white outline-none" placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              <button onClick={() => savePost('draft')} className="text-yellow-500 text-xs font-bold uppercase px-4">Save Draft</button>
              <button onClick={() => savePost('published')} className="bg-blue-600 text-white px-8 py-2 rounded-xl font-bold">{editingId ? 'Update' : 'Publish'}</button>
            </div>
            <div className="grid grid-cols-2 flex-1 border border-slate-800 rounded-3xl overflow-hidden bg-slate-900/10">
              <textarea className="p-8 bg-transparent text-slate-300 font-mono text-sm outline-none resize-none border-r border-slate-800" value={form.content} onChange={e => setForm({...form, content: e.target.value})} />
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
import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function App() {
  const [posts, setPosts] = useState([]);
  const [view, setView] = useState('home');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [form, setForm] = useState({ title: '', content: '', imageUrl: '' });
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    const res = await axios.get(`${API}/posts`);
    setPosts(res.data);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await axios.post(`${API}/upload`, fd, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForm({ ...form, imageUrl: res.data.url });
    } catch (err) { alert("Upload failed"); }
    setUploading(false);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const res = await axios.post(`${API}/login`, credentials);
    setToken(res.data.token);
    localStorage.setItem('token', res.data.token);
    setView('home');
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans selection:bg-blue-500/30">
      <nav className="sticky top-0 z-50 bg-[#0F172A]/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-serif font-black text-white cursor-pointer" onClick={() => setView('home')}>Journal.</h1>
          <button onClick={() => setView(token ? 'write' : 'login')} className="bg-blue-600 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
            {token ? 'New Story' : 'Sign In'}
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        {view === 'home' && posts.map(post => (
          <article key={post._id} className="mb-24 animate-in fade-in duration-700">
            {post.imageUrl && <img src={post.imageUrl} className="w-full h-[400px] object-cover rounded-2xl mb-8 border border-slate-800 shadow-2xl" />}
            <h2 className="text-4xl font-serif font-bold text-white mb-6 leading-tight">{post.title}</h2>
            <div className="prose prose-invert prose-slate max-w-none mb-8">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-t border-slate-800 pt-6">
              Published by {post.authorName} • {post.views || 0} Views
            </div>
          </article>
        ))}

        {view === 'write' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            {/* Aesthetic Image Uploader */}
            <div className="relative group w-full h-64 rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/50 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-blue-500/50 mb-12">
              {form.imageUrl ? (
                <>
                  <img src={form.imageUrl} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <p className="text-white text-xs font-bold uppercase tracking-widest">Change Cover</p>
                  </div>
                </>
              ) : (
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{uploading ? 'Uploading...' : 'Add Cover Image'}</p>
              )}
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
            </div>

            <input 
              className="w-full text-6xl font-serif font-bold outline-none bg-transparent placeholder:text-slate-800 text-white tracking-tighter mb-8" 
              placeholder="Title" 
              onChange={e => setForm({...form, title: e.target.value})} 
            />
            
            <textarea 
              className="w-full h-96 text-xl font-serif outline-none bg-transparent placeholder:text-slate-800 text-slate-300 leading-relaxed resize-none mb-20" 
              placeholder="Tell your story..." 
              onChange={e => setForm({...form, content: e.target.value})} 
            />

            <div className="fixed bottom-10 right-10">
              <button 
                onClick={async () => { await axios.post(`${API}/posts`, form, { headers: { Authorization: `Bearer ${token}` } }); setView('home'); fetchPosts(); }} 
                className="bg-blue-600 text-white px-12 py-4 rounded-full font-black shadow-2xl hover:bg-blue-500 transition-all"
              >
                Publish Story
              </button>
            </div>
          </div>
        )}

        {view === 'login' && (
          <form onSubmit={handleAuth} className="max-w-sm mx-auto bg-slate-900 p-10 rounded-3xl border border-slate-800 shadow-2xl">
            <h2 className="text-2xl font-serif font-bold text-white mb-8">Sign In</h2>
            <input className="w-full bg-slate-800 p-4 rounded-xl mb-4 outline-none focus:ring-1 ring-blue-500" placeholder="Username" onChange={e => setCredentials({...credentials, username: e.target.value})} />
            <input className="w-full bg-slate-800 p-4 rounded-xl mb-6 outline-none focus:ring-1 ring-blue-500" type="password" placeholder="Password" onChange={e => setCredentials({...credentials, password: e.target.value})} />
            <button className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold">Continue</button>
          </form>
        )}
      </main>
    </div>
  );
}
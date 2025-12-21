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
    content: '# New Story\n\nStart typing here to see the **live preview** on the right.\n\n## Features\n- Real-time rendering\n- Image support\n- Markdown syntax', 
    imageUrl: '' 
  });
  
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API}/posts`);
      setPosts(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axios.post(`${API}/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setForm(prev => ({ ...prev, imageUrl: res.data.url }));
    } catch (err) {
      alert("Image upload failed. Ensure Cloudinary is configured on the backend.");
    } finally {
      setUploading(false);
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
        alert("Account created! Please login.");
      }
    } catch (err) {
      alert("Authentication failed.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-serif font-black text-white cursor-pointer" onClick={() => setView('home')}>Journal.</h1>
          <div className="flex gap-6 items-center">
            <button onClick={() => setView('home')} className="text-[10px] font-bold uppercase tracking-widest hover:text-blue-400 transition">Feed</button>
            {token ? (
              <button onClick={() => setView('write')} className="bg-blue-600 text-white px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-900/40 hover:bg-blue-500 transition">Write</button>
            ) : (
              <button onClick={() => setView('write')} className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">Sign In</button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* VIEW: HOME FEED */}
        {view === 'home' && (
          <div className="max-w-2xl mx-auto">
            {posts.map(post => (
              <article key={post._id} className="mb-24 animate-in fade-in duration-700">
                {post.imageUrl && <img src={post.imageUrl} className="w-full h-80 object-cover rounded-2xl mb-8 border border-slate-800" alt="" />}
                <h2 className="text-4xl font-serif font-bold text-white mb-6 leading-tight">{post.title}</h2>
                <div className="prose prose-invert prose-slate max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  By {post.authorName} • {post.views || 0} Reads
                </div>
              </article>
            ))}
          </div>
        )}

        {/* VIEW: SPLIT-SCREEN EDITOR */}
        {view === 'write' && token && (
          <div className="flex flex-col h-[calc(100vh-140px)] animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-6">
              <input 
                className="flex-1 bg-transparent text-4xl font-serif font-bold text-white outline-none placeholder:text-slate-800" 
                placeholder="Story Title" 
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
              />
              <button 
                onClick={async () => { 
                  await axios.post(`${API}/posts`, form, { headers: { Authorization: `Bearer ${token}` } }); 
                  setView('home'); 
                  fetchPosts(); 
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all"
              >
                Publish
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-slate-800 rounded-3xl overflow-hidden bg-slate-900/30 flex-1">
              {/* Left Side: Raw Editor */}
              <div className="flex flex-col border-r border-slate-800">
                <div className="bg-slate-800/50 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800 flex justify-between items-center">
                   <span>Markdown Editor</span>
                   <div className="flex gap-4">
                     <input type="file" id="fileInput" hidden onChange={handleImageUpload} />
                     <label htmlFor="fileInput" className="cursor-pointer text-blue-400 hover:text-white transition">
                       {uploading ? 'Uploading...' : form.imageUrl ? 'Change Image' : 'Add Image'}
                     </label>
                   </div>
                </div>
                <textarea 
                  className="w-full h-full p-8 bg-transparent text-slate-300 font-mono text-sm outline-none resize-none leading-relaxed"
                  value={form.content}
                  onChange={e => setForm({...form, content: e.target.value})}
                  spellCheck="false"
                />
              </div>

              {/* Right Side: Rendered Preview */}
              <div className="flex flex-col bg-[#0b1120]">
                <div className="bg-slate-800/50 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800">
                   Live Preview
                </div>
                <div className="overflow-y-auto p-8 prose prose-invert prose-slate max-w-none prose-img:rounded-2xl prose-pre:bg-black prose-table:border prose-table:border-slate-800">
                  {form.imageUrl && <img src={form.imageUrl} className="w-full h-48 object-cover mb-8 rounded-xl border border-slate-800" alt="Cover" />}
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: AUTH FORM */}
        {view === 'write' && !token && (
          <div className="max-w-md mx-auto mt-20 p-10 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl animate-in fade-in">
            <h2 className="text-3xl font-serif font-bold text-white mb-8">{authMode === 'login' ? 'Sign In' : 'Join Us'}</h2>
            <form onSubmit={handleAuth} className="space-y-4">
              <input className="w-full bg-slate-800 p-4 rounded-xl outline-none focus:ring-1 ring-blue-500" placeholder="Username" onChange={e => setCredentials({...credentials, username: e.target.value})} />
              <input className="w-full bg-slate-800 p-4 rounded-xl outline-none focus:ring-1 ring-blue-500" type="password" placeholder="Password" onChange={e => setCredentials({...credentials, password: e.target.value})} />
              <button className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-900/20">Continue</button>
              <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="w-full text-xs text-slate-500 font-bold uppercase tracking-widest pt-4">
                {authMode === 'login' ? 'Create an account' : 'Back to login'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
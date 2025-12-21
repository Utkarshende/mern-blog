import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function App() {
  const [posts, setPosts] = useState([]);
  const [view, setView] = useState('home');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentUserId, setCurrentUserId] = useState(localStorage.getItem('userId'));
  const [form, setForm] = useState({ title: '', content: '', imageUrl: '' });
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [authMode, setAuthMode] = useState('login');

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    const res = await axios.get(`${API}/posts`);
    setPosts(res.data);
    res.data.forEach(post => axios.post(`${API}/posts/${post._id}/view`));
  };

  const extractHeaders = (content) => {
    const headerRegex = /^(#{2,3})\s+(.*)$/gm;
    const headers = [];
    let match;
    while ((match = headerRegex.exec(content)) !== null) {
      headers.push({ level: match[1].length, text: match[2] });
    }
    return headers;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = authMode === 'login' ? 'login' : 'signup';
    const res = await axios.post(`${API}/${endpoint}`, credentials);
    if (authMode === 'login') {
      setToken(res.data.token); setCurrentUserId(res.data.userId);
      localStorage.setItem('token', res.data.token); localStorage.setItem('userId', res.data.userId);
      setView('home');
    } else { setAuthMode('login'); }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans selection:bg-blue-500/30 transition-colors duration-500">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0F172A]/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-serif font-black tracking-tighter text-white cursor-pointer" onClick={() => setView('home')}>Journal.</h1>
          <div className="flex gap-8 items-center text-[11px] font-bold tracking-[0.2em] uppercase">
            <button onClick={() => setView('home')} className="hover:text-blue-400 transition">Explore</button>
            {token ? (
              <button onClick={() => setView('write')} className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-500 transition shadow-lg shadow-blue-900/20">Write</button>
            ) : <button onClick={() => setView('write')} className="text-blue-400">Sign In</button>}
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-12">
        <div className="max-w-2xl">
          {view === 'home' && posts.map(post => {
            const headers = extractHeaders(post.content);
            return (
              <article key={post._id} className="mb-32 animate-in fade-in slide-in-from-bottom-6 duration-700">
                {post.imageUrl && <img src={post.imageUrl} className="w-full h-[400px] object-cover rounded-2xl mb-10 shadow-2xl shadow-black/40 border border-slate-800" alt="" />}
                
                <div className="flex items-center gap-3 mb-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <span className="text-blue-400">{post.authorName}</span>
                  <span>/</span>
                  <span>{Math.ceil(post.content.split(' ').length / 200)} min read</span>
                </div>

                <h2 className="text-5xl font-serif font-bold mb-10 text-white leading-[1.2] tracking-tight">{post.title}</h2>
                
                <div className="prose prose-invert prose-slate prose-lg max-w-none 
                  prose-headings:text-white prose-p:text-slate-300 prose-strong:text-white prose-code:text-blue-300 
                  prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800">
                  <ReactMarkdown>{post.content}</ReactMarkdown>
                </div>
                
                <div className="flex gap-8 mt-16 pt-8 border-t border-slate-800 text-sm font-bold text-slate-500">
                  <span>✦ {post.likes?.length || 0} Applause</span>
                  <span>👁️ {post.views || 0} Reads</span>
                </div>
              </article>
            );
          })}

          {view === 'write' && (
            <div className="animate-in fade-in duration-500">
              <input 
                className="w-full text-6xl font-serif font-bold outline-none bg-transparent placeholder:text-slate-800 text-white tracking-tighter mb-12" 
                placeholder="Story Title" 
                onChange={e => setForm({...form, title: e.target.value})} 
              />
              <textarea 
                className="w-full h-[600px] text-xl font-serif outline-none bg-transparent placeholder:text-slate-800 text-slate-300 leading-relaxed resize-none" 
                placeholder="Markdown supported content..." 
                onChange={e => setForm({...form, content: e.target.value})} 
              />
              <div className="fixed bottom-10 right-10">
                <button 
                  onClick={async () => { await axios.post(`${API}/posts`, form, { headers: { Authorization: `Bearer ${token}` } }); setView('home'); fetchPosts(); }} 
                  className="bg-blue-600 text-white px-10 py-4 rounded-full font-black shadow-2xl hover:bg-blue-500 transition-all"
                >
                  Publish Story
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sticky TOC Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-32">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6">In this Story</p>
            {posts.length > 0 && view === 'home' && extractHeaders(posts[0].content).map((h, i) => (
              <div key={i} className={`text-xs mb-4 cursor-pointer hover:text-blue-400 transition-colors font-medium ${h.level === 3 ? 'pl-4 text-slate-500' : 'text-slate-400'}`}>
                {h.text}
              </div>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
}
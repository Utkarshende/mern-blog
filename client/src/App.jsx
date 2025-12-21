import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function App() {
  const [posts, setPosts] = useState([]);
  const [view, setView] = useState('home');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentUserId, setCurrentUserId] = useState(localStorage.getItem('userId'));
  const [authMode, setAuthMode] = useState('login');
  const [form, setForm] = useState({ title: '', content: '', imageUrl: '' });
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    fetchPosts();
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const fetchPosts = async () => {
    const res = await axios.get(`${API}/posts`);
    setPosts(res.data);
    res.data.forEach(post => axios.post(`${API}/posts/${post._id}/view`));
  };

  // --- TOC LOGIC ---
  const extractHeaders = (content) => {
    const headerRegex = /^(#{2,3})\s+(.*)$/gm;
    const headers = [];
    let match;
    while ((match = headerRegex.exec(content)) !== null) {
      headers.push({ level: match[1].length, text: match[2] });
    }
    return headers;
  };

  const getReadingTime = (content) => {
    const words = content.split(/\s+/).length;
    return `${Math.ceil(words / 200)} min read`;
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
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-[#0a0a0a] text-zinc-100' : 'bg-[#ffffff] text-[#1a1a1a]'} font-sans`}>
      <nav className={`sticky top-0 z-50 border-b px-6 py-4 backdrop-blur-md ${darkMode ? 'bg-[#0a0a0a]/80 border-white/10' : 'bg-white/80 border-black/5'}`}>
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-serif font-black tracking-tighter cursor-pointer" onClick={() => setView('home')}>Journal.</h1>
          <div className="flex gap-6 items-center text-[12px] font-bold tracking-widest uppercase">
            <button onClick={() => setDarkMode(!darkMode)} className="text-lg">{darkMode ? '☀️' : '🌙'}</button>
            <button onClick={() => setView('home')} className="hover:text-blue-500 transition">Home</button>
            {token ? (
              <button onClick={() => setView('write')} className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition">Write</button>
            ) : <button onClick={() => setView('write')} className="text-blue-500">Sign In</button>}
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-16">
        {view === 'home' && posts.map(post => {
          const headers = extractHeaders(post.content);
          return (
            <article key={post._id} className="mb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {post.imageUrl && <img src={post.imageUrl} className="w-full h-[400px] object-cover rounded-lg mb-8 shadow-sm" alt="" />}
              
              <div className="flex items-center gap-3 mb-4 text-[11px] font-bold opacity-40 uppercase tracking-widest">
                <span className="text-blue-500">{post.authorName}</span>
                <span>•</span>
                <span>{getReadingTime(post.content)}</span>
              </div>

              <h2 className="text-5xl font-serif font-bold mb-8 leading-tight tracking-tight">{post.title}</h2>
              
              {/* Table of Contents Section */}
              {headers.length > 0 && (
                <div className={`mb-12 p-6 rounded-xl border ${darkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-zinc-50 border-black/5'}`}>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-40">Outline</p>
                  <ul className="space-y-3">
                    {headers.map((h, i) => (
                      <li key={i} className={`text-sm font-medium hover:text-blue-500 transition-colors cursor-pointer ${h.level === 3 ? 'ml-4 opacity-60' : ''}`}>
                        {h.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className={`prose prose-lg max-w-none transition-colors duration-500 
                ${darkMode ? 'prose-invert prose-headings:text-white prose-p:text-zinc-400 prose-strong:text-white prose-em:text-zinc-300' 
                           : 'prose-headings:text-black prose-p:text-zinc-600 prose-strong:text-black prose-em:text-zinc-800'}`}>
                <ReactMarkdown>{post.content}</ReactMarkdown>
              </div>
              
              <div className={`flex gap-8 mt-12 pt-8 border-t text-sm font-bold opacity-30 ${darkMode ? 'border-white/10' : 'border-black/5'}`}>
                <span>✦ {post.likes?.length || 0} Likes</span>
                <span>👁️ {post.views || 0} Views</span>
              </div>
            </article>
          );
        })}

        {view === 'write' && (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] mb-12 opacity-30 text-center">New Narrative</h2>
            <div className="space-y-12">
              <input 
                className="w-full text-6xl font-serif font-bold outline-none bg-transparent placeholder:opacity-10 tracking-tighter" 
                placeholder="Title" 
                onChange={e => setForm({...form, title: e.target.value})} 
              />
              <textarea 
                className="w-full h-[500px] text-xl font-serif outline-none bg-transparent placeholder:opacity-10 leading-relaxed resize-none" 
                placeholder="Start typing... Use ## for headers." 
                onChange={e => setForm({...form, content: e.target.value})} 
              />
              <div className="fixed bottom-10 right-10 flex gap-4">
                <button onClick={() => setView('home')} className="bg-zinc-100 text-black dark:bg-zinc-800 dark:text-white px-8 py-4 rounded-full font-bold">Cancel</button>
                <button 
                  onClick={async () => { await axios.post(`${API}/posts`, form, { headers: { Authorization: `Bearer ${token}` } }); setView('home'); fetchPosts(); }} 
                  className="bg-blue-600 text-white px-10 py-4 rounded-full font-black shadow-2xl hover:scale-105 transition-all"
                >
                  Publish Story
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
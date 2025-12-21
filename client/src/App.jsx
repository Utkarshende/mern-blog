import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // Supports Tables and Tasklists

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function App() {
  const [posts, setPosts] = useState([]);
  const [view, setView] = useState('home');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [form, setForm] = useState({ 
    title: '', 
    content: '# Hello World\n\nStart typing to see the **live preview**...', 
    imageUrl: '' 
  });
  const [uploading, setUploading] = useState(false);

  // ... (previous fetchPosts and handleImageUpload functions remain the same)

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans">
      <nav className="sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-serif font-black text-white cursor-pointer" onClick={() => setView('home')}>Journal.</h1>
          <div className="flex gap-4">
            <button onClick={() => setView('home')} className="text-xs font-bold uppercase tracking-widest px-4">Feed</button>
            <button onClick={() => setView('write')} className="bg-blue-600 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-900/40">
              {view === 'write' ? 'Drafting...' : 'Write'}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {view === 'home' && (
            // Home Feed Logic (Same as before)
            <div className="max-w-2xl mx-auto">
               {posts.map(post => (
                 <article key={post._id} className="mb-20">
                    <h2 className="text-4xl font-serif font-bold text-white mb-4">{post.title}</h2>
                    <div className="prose prose-invert prose-slate max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                    </div>
                 </article>
               ))}
            </div>
        )}

        {view === 'write' && (
          <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-500">
            {/* Header / Title Input */}
            <div className="flex items-center gap-4 mb-6">
              <input 
                className="flex-1 bg-transparent text-4xl font-serif font-bold text-white outline-none placeholder:text-slate-800" 
                placeholder="Untitled Story" 
                onChange={e => setForm({...form, title: e.target.value})}
              />
              <button 
                onClick={async () => { await axios.post(`${API}/posts`, form, { headers: { Authorization: `Bearer ${token}` } }); setView('home'); fetchPosts(); }}
                className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-xl shadow-green-900/20"
              >
                Publish
              </button>
            </div>

            {/* Split Screen Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-slate-800 rounded-3xl overflow-hidden bg-slate-900/30 flex-1">
              
              {/* LEFT: RAW EDITOR */}
              <div className="flex flex-col border-r border-slate-800">
                <div className="bg-slate-800/50 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800 flex justify-between items-center">
                   <span>Markdown Editor</span>
                   <input type="file" id="file" hidden onChange={handleImageUpload} />
                   <label htmlFor="file" className="cursor-pointer text-blue-400 hover:text-white transition">Add Cover</label>
                </div>
                <textarea 
                  className="w-full h-full p-8 bg-transparent text-slate-300 font-mono text-sm outline-none resize-none leading-relaxed"
                  value={form.content}
                  onChange={e => setForm({...form, content: e.target.value})}
                  spellCheck="false"
                />
              </div>

              {/* RIGHT: LIVE PREVIEW */}
              <div className="flex flex-col bg-[#0b1120]">
                <div className="bg-slate-800/50 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800">
                   Live Preview
                </div>
                <div className="overflow-y-auto p-8 prose prose-invert prose-slate max-w-none 
                  prose-table:border prose-table:border-slate-800 prose-th:bg-slate-800/50 prose-th:p-2 prose-td:border prose-td:border-slate-800 prose-td:p-2
                  prose-pre:bg-black prose-pre:border prose-pre:border-slate-800 prose-img:rounded-2xl">
                  {form.imageUrl && <img src={form.imageUrl} className="mb-8 w-full h-48 object-cover" />}
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.content}</ReactMarkdown>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function App() {
  const [posts, setPosts] = useState([]);
  const [view, setView] = useState('home');
  const [authMode, setAuthMode] = useState('login'); 
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(localStorage.getItem('user'));
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', status: 'published' });
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    const res = await axios.get(`${API}/posts`);
    setPosts(res.data);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = authMode === 'login' ? 'login' : 'signup';
    try {
      const res = await axios.post(`${API}/${endpoint}`, credentials);
      if (authMode === 'login') {
        setToken(res.data.token);
        setUser(res.data.username);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', res.data.username);
      } else {
        alert("Success! Now login.");
        setAuthMode('login');
      }
    } catch (err) { alert(err.response?.data?.message || "Error"); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      if (editId) {
        await axios.put(`${API}/posts/${editId}`, form, config);
        setEditId(null);
      } else {
        await axios.post(`${API}/posts`, form, config);
      }
      setForm({ title: '', content: '', status: 'published' });
      fetchPosts();
      setView('home');
    } catch (err) { alert("Permission denied or session expired."); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this story?")) return;
    try {
      await axios.delete(`${API}/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPosts();
    } catch (err) { alert("Failed to delete."); }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100">
      <nav className="sticky top-0 bg-white/90 backdrop-blur-md border-b z-50">
        <div className="max-w-4xl mx-auto h-16 flex items-center justify-between px-6">
          <h1 className="text-xl font-black tracking-tighter cursor-pointer" onClick={() => setView('home')}>DevBlog.</h1>
          <div className="flex gap-6 items-center">
            <button onClick={() => setView('home')} className="text-sm font-medium hover:text-blue-600 transition">Explore</button>
            {token ? (
              <div className="flex items-center gap-4">
                <button onClick={() => {setEditId(null); setForm({title:'', content:'', status:'published'}); setView('write')}} className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-bold shadow-md shadow-blue-100 hover:bg-blue-700">Write</button>
                <button onClick={() => {setToken(null); localStorage.clear(); setUser(null);}} className="text-xs text-slate-400 hover:text-red-500 transition">Logout</button>
              </div>
            ) : (
              <button onClick={() => setView('write')} className="text-sm font-bold border-2 border-slate-900 px-5 py-1.5 rounded-full hover:bg-slate-900 hover:text-white transition">Login</button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-16">
        {view === 'home' ? (
          <div className="space-y-20">
            {posts.map(post => (
              <article key={post._id} className="relative">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-blue-600 uppercase italic">Written by {post.authorName}</span>
                  {user === post.authorName && (
                    <div className="flex gap-3">
                      <button onClick={() => {setEditId(post._id); setForm(post); setView('write')}} className="text-xs font-bold text-slate-400 hover:text-blue-600">Edit</button>
                      <button onClick={() => handleDelete(post._id)} className="text-xs font-bold text-slate-400 hover:text-red-600">Delete</button>
                    </div>
                  )}
                </div>
                <h2 className="text-4xl font-extrabold mb-4 leading-tight tracking-tight">{post.title}</h2>
                <div className="prose prose-slate prose-lg max-w-none text-slate-600 leading-relaxed"><ReactMarkdown>{post.content}</ReactMarkdown></div>
              </article>
            ))}
          </div>
        ) : (
          !token ? (
            <div className="bg-slate-50 p-10 rounded-3xl border border-slate-100 max-w-sm mx-auto shadow-2xl shadow-slate-200/50">
              <h2 className="text-3xl font-black mb-2 tracking-tighter">{authMode === 'login' ? 'Welcome back.' : 'Start writing.'}</h2>
              <p className="text-slate-400 text-sm mb-8">{authMode === 'login' ? 'Sign in to your account' : 'Join our community of creators'}</p>
              <form onSubmit={handleAuth} className="space-y-4">
                <input type="text" placeholder="Username" className="w-full p-4 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition" onChange={e => setCredentials({...credentials, username: e.target.value})} />
                <input type="password" placeholder="Password" className="w-full p-4 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition" onChange={e => setCredentials({...credentials, password: e.target.value})} />
                <button className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-black transition shadow-lg">{authMode === 'login' ? 'Login' : 'Create Account'}</button>
              </form>
              <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="w-full mt-6 text-sm font-semibold text-slate-400 hover:text-slate-900">
                {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Login"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="text-5xl font-black w-full outline-none bg-transparent placeholder:text-slate-200 tracking-tighter" placeholder="Title..." autoFocus />
              <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full h-[500px] text-xl outline-none bg-transparent resize-none leading-relaxed placeholder:text-slate-200" placeholder="Tell your story..." />
              <div className="fixed bottom-10 right-10">
                <button className="bg-blue-600 text-white px-10 py-4 rounded-full font-black shadow-2xl shadow-blue-300 hover:scale-105 active:scale-95 transition-all">
                  {editId ? 'Update Story' : 'Publish Now'}
                </button>
              </div>
            </form>
          )
        )}
      </main>
    </div>
  );
}
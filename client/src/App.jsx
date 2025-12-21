import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function App() {
  const [posts, setPosts] = useState([]);
  const [view, setView] = useState('home');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [form, setForm] = useState({ title: '', content: '', status: 'draft' });
  const [loginData, setLoginData] = useState({ username: '', password: '' });

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    const res = await axios.get(`${API}/posts`);
    setPosts(res.data);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/login`, loginData);
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
    } catch (err) { alert("Login failed!"); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      await axios.post(`${API}/posts`, form, config);
      setForm({ title: '', content: '', status: 'draft' });
      fetchPosts();
      setView('home');
    } catch (err) { alert("Session expired. Please login again."); }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <h1 className="text-xl font-black tracking-tighter cursor-pointer" onClick={() => setView('home')}>MERN.</h1>
          <div className="space-x-4">
            <button onClick={() => setView('home')} className="text-sm font-medium text-slate-600 hover:text-black">Home</button>
            <button onClick={() => setView('manage')} className="bg-black text-white px-4 py-2 rounded-full text-sm font-bold">Studio</button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-6 py-12">
        {view === 'home' ? (
          <section className="space-y-12">
            {posts.filter(p => p.status === 'published').map(post => (
              <article key={post._id} className="border-b border-slate-200 pb-8">
                <h2 className="text-3xl font-bold mb-2">{post.title}</h2>
                <div className="prose prose-slate"><ReactMarkdown>{post.content}</ReactMarkdown></div>
              </article>
            ))}
          </section>
        ) : (
          !token ? (
            <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl space-y-4">
              <h2 className="text-2xl font-bold">Admin Access</h2>
              <input type="text" placeholder="Username" className="w-full p-3 border rounded-lg" onChange={e => setLoginData({...loginData, username: e.target.value})} />
              <input type="password" placeholder="Password" className="w-full p-3 border rounded-lg" onChange={e => setLoginData({...loginData, password: e.target.value})} />
              <button className="w-full bg-black text-white p-3 rounded-lg font-bold">Login</button>
            </form>
          ) : (
            <section className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Create Post</h2>
                <button onClick={() => {setToken(null); localStorage.removeItem('token');}} className="text-red-500 text-sm">Logout</button>
              </div>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full text-3xl font-bold bg-transparent outline-none" placeholder="Title..." />
              <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full h-64 bg-transparent outline-none text-lg" placeholder="Write story..." />
              <div className="flex justify-between">
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="p-2 border rounded">
                  <option value="draft">Draft</option>
                  <option value="published">Publish</option>
                </select>
                <button onClick={handleSave} className="bg-black text-white px-6 py-2 rounded-full font-bold">Save Post</button>
              </div>
            </section>
          )
        )}
      </main>
    </div>
  );
}
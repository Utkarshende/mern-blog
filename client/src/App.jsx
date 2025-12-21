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
        alert("Signup successful! Please login.");
        setAuthMode('login');
      }
    } catch (err) { alert(err.response?.data?.message || "Auth failed"); }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/posts`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForm({ title: '', content: '', status: 'published' });
      fetchPosts();
      setView('home');
    } catch (err) { alert("Error publishing post"); }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="sticky top-0 bg-white/80 backdrop-blur-md border-b z-50">
        <div className="max-w-5xl mx-auto h-16 flex items-center justify-between px-6">
          <h1 className="text-xl font-black cursor-pointer" onClick={() => setView('home')}>BLOG.ly</h1>
          <div className="flex gap-4 items-center">
            <button onClick={() => setView('home')} className="text-sm font-medium">Home</button>
            {token ? (
              <div className="flex items-center gap-4">
                <button onClick={() => setView('write')} className="bg-black text-white px-4 py-2 rounded-full text-sm font-bold">Write</button>
                <button onClick={() => {setToken(null); localStorage.clear();}} className="text-xs text-red-500">Logout</button>
              </div>
            ) : (
              <button onClick={() => setView('write')} className="text-sm font-bold border border-black px-4 py-2 rounded-full">Login</button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {view === 'home' ? (
          <div className="space-y-12">
            {posts.map(post => (
              <article key={post._id} className="group">
                <span className="text-[10px] font-bold tracking-widest text-blue-600 uppercase">By {post.authorName || 'Anonymous'}</span>
                <h2 className="text-3xl font-bold mt-1 mb-3 group-hover:text-blue-600 transition">{post.title}</h2>
                <div className="prose prose-slate line-clamp-3 text-slate-600"><ReactMarkdown>{post.content}</ReactMarkdown></div>
              </article>
            ))}
          </div>
        ) : (
          !token ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm border max-w-sm mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-center">{authMode === 'login' ? 'Login' : 'Join Us'}</h2>
              <form onSubmit={handleAuth} className="space-y-4">
                <input type="text" placeholder="Username" className="w-full p-3 bg-slate-50 rounded-lg outline-none focus:ring-2 ring-blue-500" onChange={e => setCredentials({...credentials, username: e.target.value})} />
                <input type="password" placeholder="Password" className="w-full p-3 bg-slate-50 rounded-lg outline-none focus:ring-2 ring-blue-500" onChange={e => setCredentials({...credentials, password: e.target.value})} />
                <button className="w-full bg-black text-white p-3 rounded-lg font-bold">{authMode === 'login' ? 'Sign In' : 'Create Account'}</button>
              </form>
              <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="w-full mt-4 text-sm text-slate-500 hover:text-black">
                {authMode === 'login' ? "New here? Create account" : "Have an account? Login"}
              </button>
            </div>
          ) : (
            <form onSubmit={handlePublish} className="space-y-6">
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="text-4xl font-bold w-full outline-none bg-transparent" placeholder="Title..." />
              <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full h-80 text-lg outline-none bg-transparent resize-none" placeholder="Tell your story..." />
              <button className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-blue-200">Publish Post</button>
            </form>
          )
        )}
      </main>
    </div>
  );
}
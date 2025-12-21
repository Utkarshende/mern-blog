import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function App() {
  const [posts, setPosts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [view, setView] = useState('home');
  const [authMode, setAuthMode] = useState('login'); 
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(localStorage.getItem('user'));
  const [editId, setEditId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', imageUrl: '', status: 'published' });
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  useEffect(() => {
    fetchPosts();
    if (token && view === 'profile') fetchMyPosts();
  }, [view, token]);

  const fetchPosts = async () => {
    const res = await axios.get(`${API}/posts`);
    setPosts(res.data);
  };

  const fetchMyPosts = async () => {
    const res = await axios.get(`${API}/posts/me`, { headers: { Authorization: `Bearer ${token}` } });
    setMyPosts(res.data);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);
    try {
      const res = await axios.post(`${API}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      setForm({ ...form, imageUrl: res.data.url });
    } catch (err) { alert("Upload failed"); }
    setUploading(false);
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
        setView('home');
      } else { alert("Signup success! Please login."); setAuthMode('login'); }
    } catch (err) { alert("Auth Error"); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      if (editId) { await axios.put(`${API}/posts/${editId}`, form, config); setEditId(null); }
      else { await axios.post(`${API}/posts`, form, config); }
      setForm({ title: '', content: '', imageUrl: '', status: 'published' });
      fetchPosts(); setView('home');
    } catch (err) { alert("Error saving post"); }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <nav className="sticky top-0 bg-white/90 backdrop-blur-md border-b z-50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black cursor-pointer" onClick={() => setView('home')}>DevBlog.</h1>
          <div className="flex gap-6 items-center">
            <button onClick={() => setView('home')} className="text-sm font-medium">Explore</button>
            {token ? (
              <>
                <button onClick={() => setView('profile')} className="text-sm font-medium">My Stories</button>
                <button onClick={() => {setEditId(null); setForm({title:'', content:'', imageUrl:'', status:'published'}); setView('write')}} className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-bold">Write</button>
                <button onClick={() => {setToken(null); localStorage.clear(); setView('home')}} className="text-xs text-slate-400">Logout</button>
              </>
            ) : <button onClick={() => setView('write')} className="text-sm font-bold border-2 border-black px-5 py-1.5 rounded-full">Login</button>}
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-16">
        {view === 'home' && (
          <div className="space-y-16">
            {posts.map(post => (
              <article key={post._id}>
                {post.imageUrl && <img src={post.imageUrl} className="w-full h-72 object-cover rounded-3xl mb-6 shadow-lg shadow-slate-100" />}
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">By {post.authorName}</span>
                <h2 className="text-4xl font-extrabold mt-2 mb-4 tracking-tight">{post.title}</h2>
                <div className="prose prose-slate prose-lg text-slate-600 line-clamp-4"><ReactMarkdown>{post.content}</ReactMarkdown></div>
              </article>
            ))}
          </div>
        )}

        {view === 'profile' && (
          <div>
            <h2 className="text-3xl font-black mb-8">Your Stories</h2>
            <div className="space-y-4">
              {myPosts.map(post => (
                <div key={post._id} className="p-6 bg-slate-50 rounded-2xl flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    {post.imageUrl && <img src={post.imageUrl} className="w-12 h-12 rounded-lg object-cover" />}
                    <h3 className="font-bold">{post.title}</h3>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => {setEditId(post._id); setForm(post); setView('write')}} className="text-sm font-bold text-blue-600">Edit</button>
                    <button onClick={async () => { if(window.confirm("Delete?")) { await axios.delete(`${API}/posts/${post._id}`, {headers:{Authorization:`Bearer ${token}`}}); fetchMyPosts(); fetchPosts(); }}} className="text-sm font-bold text-red-500">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'write' && (
          !token ? (
            <div className="max-w-sm mx-auto p-10 bg-slate-50 rounded-3xl border">
              <h2 className="text-2xl font-bold mb-6">{authMode === 'login' ? 'Login' : 'Join'}</h2>
              <form onSubmit={handleAuth} className="space-y-4">
                <input type="text" placeholder="Username" className="w-full p-4 rounded-xl ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 outline-none" onChange={e => setCredentials({...credentials, username: e.target.value})} />
                <input type="password" placeholder="Password" className="w-full p-4 rounded-xl ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 outline-none" onChange={e => setCredentials({...credentials, password: e.target.value})} />
                <button className="w-full bg-black text-white p-4 rounded-xl font-bold">{authMode === 'login' ? 'Login' : 'Sign Up'}</button>
              </form>
              <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="mt-4 text-sm text-slate-500 w-full text-center">{authMode === 'login' ? "New? Signup" : "Member? Login"}</button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-8">
              <div className="border-2 border-dashed border-slate-200 p-8 rounded-3xl text-center">
                <input type="file" id="image" className="hidden" onChange={handleImageUpload} />
                <label htmlFor="image" className="cursor-pointer text-sm font-bold text-blue-600">{uploading ? 'Uploading...' : 'Click to upload cover image'}</label>
                {form.imageUrl && <img src={form.imageUrl} className="mt-4 h-40 w-full object-cover rounded-xl" />}
              </div>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="text-5xl font-black w-full outline-none tracking-tighter" placeholder="Title..." />
              <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full h-96 text-xl outline-none resize-none leading-relaxed" placeholder="Write story..." />
              <div className="fixed bottom-10 right-10 flex gap-4">
                <button onClick={() => setView('home')} type="button" className="bg-white border px-8 py-3 rounded-full font-bold">Cancel</button>
                <button className="bg-blue-600 text-white px-10 py-3 rounded-full font-black shadow-xl">{editId ? 'Update' : 'Publish'}</button>
              </div>
            </form>
          )
        )}
      </main>
    </div>
  );
}
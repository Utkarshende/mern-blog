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
  const [commentText, setCommentText] = useState({});

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    const res = await axios.get(`${API}/posts`);
    setPosts(res.data);
    // Increment view count for each post loaded on the feed
    res.data.forEach(post => axios.post(`${API}/posts/${post._id}/view`));
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
      } else { setAuthMode('login'); alert("Signup success!"); }
    } catch (err) { alert("Auth error"); }
  };

  const handleLike = async (id) => {
    if (!token) return alert("Login to like!");
    await axios.post(`${API}/posts/${id}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
    fetchPosts();
  };

  const handleComment = async (id) => {
    if (!commentText[id]) return;
    await axios.post(`${API}/posts/${id}/comments`, { text: commentText[id] }, { headers: { Authorization: `Bearer ${token}` } });
    setCommentText({ ...commentText, [id]: "" });
    fetchPosts();
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100">
      <nav className="p-4 border-b sticky top-0 bg-white/90 backdrop-blur-md z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-black tracking-tighter cursor-pointer" onClick={() => setView('home')}>DevBlog.</h1>
          <div className="flex gap-5 items-center">
            <button onClick={() => setView('home')} className="text-sm font-bold">Explore</button>
            {token ? (
              <button onClick={() => setView('write')} className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition">Write</button>
            ) : <button onClick={() => setView('write')} className="text-sm font-bold border-2 border-black px-5 py-1.5 rounded-full">Login</button>}
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {view === 'home' && posts.map(post => (
          <article key={post._id} className="mb-24 animate-in fade-in duration-700">
            {post.imageUrl && <img src={post.imageUrl} className="w-full h-80 object-cover rounded-[2.5rem] mb-8 shadow-2xl shadow-slate-200" />}
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">By {post.authorName}</span>
            <h2 className="text-5xl font-black mt-2 mb-6 tracking-tighter leading-tight">{post.title}</h2>
            <div className="prose prose-slate prose-lg mb-10 text-slate-600"><ReactMarkdown>{post.content}</ReactMarkdown></div>
            
            <div className="flex gap-8 items-center mb-10 pb-8 border-b border-slate-50 text-slate-400">
              <button onClick={() => handleLike(post._id)} className="flex items-center gap-2 group">
                <span className={`text-2xl transition group-hover:scale-125 ${post.likes?.includes(currentUserId) ? 'text-red-500' : 'text-slate-200'}`}>
                  {post.likes?.includes(currentUserId) ? '❤️' : '🤍'}
                </span>
                <span className="text-sm font-bold text-slate-900">{post.likes?.length || 0}</span>
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xl">👁️</span>
                <span className="text-sm font-bold text-slate-900">{post.views || 0} Reads</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">💬</span>
                <span className="text-sm font-bold text-slate-900">{post.comments?.length || 0}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-[2rem]">
              <div className="space-y-5 mb-6">
                {post.comments?.map((c, i) => (
                  <div key={i} className="text-sm leading-relaxed">
                    <span className="font-black text-slate-900">{c.authorName}</span> 
                    <span className="text-slate-600 ml-2">{c.text}</span>
                  </div>
                ))}
              </div>
              {token && (
                <div className="flex gap-3">
                  <input value={commentText[post._id] || ""} onChange={e => setCommentText({...commentText, [post._id]: e.target.value})} className="flex-1 bg-white p-4 rounded-2xl outline-none border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500 transition" placeholder="Add to the discussion..." />
                  <button onClick={() => handleComment(post._id)} className="bg-slate-900 text-white px-6 rounded-2xl text-sm font-bold hover:bg-black transition">Post</button>
                </div>
              )}
            </div>
          </article>
        ))}

        {view === 'write' && (!token ? (
          <form onSubmit={handleAuth} className="max-w-xs mx-auto space-y-4 pt-10 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-4xl font-black tracking-tighter mb-8 text-center">{authMode === 'login' ? 'Welcome back.' : 'Join the club.'}</h2>
            <input className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 ring-blue-500 transition" placeholder="Username" onChange={e => setCredentials({...credentials, username: e.target.value})} />
            <input className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 ring-blue-500 transition" type="password" placeholder="Password" onChange={e => setCredentials({...credentials, password: e.target.value})} />
            <button className="w-full bg-slate-900 text-white p-4 rounded-2xl font-bold shadow-xl hover:bg-black transition">Continue</button>
            <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="w-full text-sm text-slate-400 font-medium">Switch to {authMode === 'login' ? 'Signup' : 'Login'}</button>
          </form>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between border-b pb-4">
               <input type="file" className="text-xs font-bold text-slate-400" onChange={async (e) => {
                 const fd = new FormData(); fd.append('image', e.target.files[0]);
                 const res = await axios.post(`${API}/upload`, fd, { headers: { Authorization: `Bearer ${token}` } });
                 setForm({...form, imageUrl: res.data.url});
               }} />
               {form.imageUrl && <span className="text-green-500 text-xs font-bold">✓ Image Ready</span>}
            </div>
            <input className="w-full text-6xl font-black outline-none placeholder:text-slate-100 tracking-tighter" placeholder="Title..." onChange={e => setForm({...form, title: e.target.value})} />
            <textarea className="w-full h-96 text-2xl outline-none placeholder:text-slate-100 leading-relaxed resize-none" placeholder="Tell your story..." onChange={e => setForm({...form, content: e.target.value})} />
            <div className="fixed bottom-10 right-10">
              <button onClick={async () => { await axios.post(`${API}/posts`, form, { headers: { Authorization: `Bearer ${token}` } }); setView('home'); fetchPosts(); }} className="bg-blue-600 text-white px-12 py-4 rounded-full font-black shadow-2xl shadow-blue-200 hover:scale-105 active:scale-95 transition-all">Publish Now</button>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
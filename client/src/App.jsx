import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function App() {
  const [posts, setPosts] = useState([]);
  const [publicProfile, setPublicProfile] = useState({ username: '', posts: [] });
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
    res.data.forEach(post => axios.post(`${API}/posts/${post._id}/view`));
  };

  const viewAuthorProfile = async (authorId) => {
    const res = await axios.get(`${API}/posts/author/${authorId}`);
    setPublicProfile(res.data);
    setView('author-profile');
    window.scrollTo(0, 0);
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

  const handleLike = async (id) => {
    if (!token) return alert("Login to like!");
    await axios.post(`${API}/posts/${id}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
    fetchPosts();
  };

  const handleComment = async (id) => {
    await axios.post(`${API}/posts/${id}/comments`, { text: commentText[id] }, { headers: { Authorization: `Bearer ${token}` } });
    setCommentText({ ...commentText, [id]: "" });
    fetchPosts();
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <nav className="p-4 border-b sticky top-0 bg-white/90 backdrop-blur-md z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-black cursor-pointer" onClick={() => setView('home')}>DevBlog.</h1>
          <div className="flex gap-5 items-center text-sm font-bold">
            <button onClick={() => setView('home')}>Explore</button>
            {token ? <button onClick={() => setView('write')} className="bg-blue-600 text-white px-5 py-2 rounded-full">Write</button> 
                   : <button onClick={() => setView('write')} className="underline">Login</button>}
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {view === 'home' && posts.map(post => (
          <article key={post._id} className="mb-24">
            {post.imageUrl && <img src={post.imageUrl} className="w-full h-80 object-cover rounded-[2.5rem] mb-6 shadow-xl" />}
            <span onClick={() => viewAuthorProfile(post.author)} className="text-[10px] font-bold text-blue-600 uppercase tracking-widest cursor-pointer hover:underline">By {post.authorName}</span>
            <h2 className="text-5xl font-black mt-2 mb-6 tracking-tighter">{post.title}</h2>
            <div className="prose mb-8"><ReactMarkdown>{post.content}</ReactMarkdown></div>
            <div className="flex gap-6 text-sm font-bold mb-10">
              <button onClick={() => handleLike(post._id)}>{post.likes?.includes(currentUserId) ? '❤️' : '🤍'} {post.likes?.length}</button>
              <span>👁️ {post.views} Reads</span>
              <span>💬 {post.comments?.length}</span>
            </div>
          </article>
        ))}

        {view === 'author-profile' && (
          <div className="animate-in fade-in duration-500">
            <header className="mb-16 text-center">
              <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-black text-slate-300">
                {publicProfile.username[0]?.toUpperCase()}
              </div>
              <h2 className="text-4xl font-black tracking-tighter">{publicProfile.username}</h2>
              <p className="text-slate-400 text-sm mt-2">{publicProfile.posts.length} Stories Published</p>
            </header>
            <div className="space-y-12">
              {publicProfile.posts.map(post => (
                <div key={post._id} className="group cursor-pointer">
                  <h3 className="text-2xl font-bold group-hover:text-blue-600 transition">{post.title}</h3>
                  <p className="text-slate-500 text-sm mt-2 line-clamp-2">{post.content}</p>
                  <div className="mt-4 flex gap-4 text-[10px] font-bold text-slate-300 uppercase">
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    <span>{post.views} Views</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'write' && (!token ? (
          <form onSubmit={handleAuth} className="max-w-xs mx-auto space-y-4 pt-10">
            <h2 className="text-3xl font-black mb-6">Welcome.</h2>
            <input className="w-full border p-4 rounded-2xl" placeholder="Username" onChange={e => setCredentials({...credentials, username: e.target.value})} />
            <input className="w-full border p-4 rounded-2xl" type="password" placeholder="Password" onChange={e => setCredentials({...credentials, password: e.target.value})} />
            <button className="w-full bg-black text-white p-4 rounded-2xl font-bold">Continue</button>
            <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="w-full text-xs text-slate-400 text-center">{authMode === 'login' ? 'Create account' : 'Login'}</button>
          </form>
        ) : (
          <div className="space-y-8">
            <input type="file" onChange={async (e) => {
              const fd = new FormData(); fd.append('image', e.target.files[0]);
              const res = await axios.post(`${API}/upload`, fd, { headers: { Authorization: `Bearer ${token}` } });
              setForm({...form, imageUrl: res.data.url});
            }} />
            <input className="w-full text-6xl font-black outline-none" placeholder="Title..." onChange={e => setForm({...form, title: e.target.value})} />
            <textarea className="w-full h-96 text-2xl outline-none" placeholder="Tell your story..." onChange={e => setForm({...form, content: e.target.value})} />
            <button onClick={async () => { await axios.post(`${API}/posts`, form, { headers: { Authorization: `Bearer ${token}` } }); setView('home'); fetchPosts(); }} className="bg-blue-600 text-white px-12 py-4 rounded-full font-black">Publish</button>
          </div>
        ))}
      </main>
    </div>
  );
}
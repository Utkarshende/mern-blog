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

  const getReadingTime = (content) => {
    const words = content.split(/\s+/).length;
    return `${Math.ceil(words / 200)} min read`;
  };

  const viewAuthorProfile = async (authorId) => {
    const res = await axios.get(`${API}/posts/author/${authorId}`);
    setPublicProfile(res.data);
    setView('author-profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = authMode === 'login' ? 'login' : 'signup';
    try {
      const res = await axios.post(`${API}/${endpoint}`, credentials);
      if (authMode === 'login') {
        setToken(res.data.token); setCurrentUserId(res.data.userId);
        localStorage.setItem('token', res.data.token); localStorage.setItem('userId', res.data.userId);
        setView('home');
      } else { setAuthMode('login'); alert("Welcome to the community!"); }
    } catch (err) { alert("Invalid credentials"); }
  };

  const handleLike = async (id) => {
    if (!token) return alert("Sign in to applaud this story.");
    await axios.post(`${API}/posts/${id}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
    fetchPosts();
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#191919] font-sans selection:bg-yellow-200 selection:text-black">
      {/* Modern Glassmorphism Nav */}
      <nav className="sticky top-0 bg-white/70 backdrop-blur-xl border-b border-black/5 z-50 px-8 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-serif font-black tracking-tight cursor-pointer" onClick={() => setView('home')}>Journal.</h1>
          <div className="flex gap-8 items-center text-[13px] font-medium tracking-wide">
            <button onClick={() => setView('home')} className="hover:text-blue-600 transition">EXPLORE</button>
            {token ? (
              <div className="flex items-center gap-6">
                <button onClick={() => setView('write')} className="bg-black text-white px-6 py-2 rounded-full hover:bg-neutral-800 transition shadow-lg shadow-black/10">Write Story</button>
                <button onClick={() => {localStorage.clear(); window.location.reload();}} className="text-neutral-400">Sign Out</button>
              </div>
            ) : <button onClick={() => setView('write')} className="text-blue-600 font-bold">SIGN IN</button>}
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-20">
        {view === 'home' && posts.map(post => (
          <article key={post._id} className="mb-32 group animate-in fade-in slide-in-from-bottom-6 duration-700">
            {post.imageUrl && (
              <div className="overflow-hidden rounded-sm mb-10 shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:shadow-black/5">
                <img src={post.imageUrl} className="w-full h-[450px] object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
              </div>
            )}
            
            <div className="flex items-center gap-3 mb-6 text-[11px] font-bold tracking-[0.2em] text-neutral-400">
              <span onClick={() => viewAuthorProfile(post.author)} className="text-blue-600 cursor-pointer hover:text-black transition uppercase underline underline-offset-4">{post.authorName}</span>
              <span>/</span>
              <span className="uppercase">{getReadingTime(post.content)}</span>
            </div>

            <h2 className="text-5xl font-serif font-bold mb-8 leading-[1.15] tracking-tight">{post.title}</h2>
            
            <div className="prose prose-neutral prose-lg max-w-none text-neutral-600 leading-relaxed mb-12">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
            
            <div className="flex gap-10 items-center text-sm font-semibold border-t border-black/5 pt-10">
              <button onClick={() => handleLike(post._id)} className="flex items-center gap-2 group">
                <span className={`text-xl transition-transform duration-300 group-active:scale-150 ${post.likes?.includes(currentUserId) ? 'text-red-500' : 'text-neutral-200'}`}>
                  {post.likes?.includes(currentUserId) ? '✦' : '✧'}
                </span>
                <span className="text-neutral-900">{post.likes?.length || 0}</span>
              </button>
              <div className="flex items-center gap-2 text-neutral-300">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-neutral-900">{post.views || 0} views</span>
              </div>
            </div>
          </article>
        ))}

        {view === 'author-profile' && (
          <section className="animate-in fade-in duration-1000">
            <div className="border-b border-black/10 pb-16 mb-16">
              <span className="text-xs font-bold tracking-widest text-neutral-400 block mb-4 uppercase">Author Profile</span>
              <h2 className="text-7xl font-serif font-bold tracking-tighter">{publicProfile.username}</h2>
            </div>
            <div className="grid gap-16">
              {publicProfile.posts.map(post => (
                <div key={post._id} className="group cursor-pointer border-b border-black/5 pb-10">
                  <h3 className="text-3xl font-serif font-bold group-hover:text-blue-600 transition duration-300 mb-4">{post.title}</h3>
                  <div className="flex gap-4 text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{getReadingTime(post.content)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {view === 'write' && (!token ? (
          <div className="max-w-md mx-auto py-20 bg-white p-12 rounded-2xl shadow-2xl shadow-black/5 border border-black/5">
            <h2 className="text-4xl font-serif font-bold mb-10 tracking-tight text-center">{authMode === 'login' ? 'Sign In.' : 'Register.'}</h2>
            <form onSubmit={handleAuth} className="space-y-6">
              <input className="w-full bg-neutral-50 p-4 rounded-xl outline-none focus:ring-1 ring-black/10 text-sm" placeholder="Username" onChange={e => setCredentials({...credentials, username: e.target.value})} />
              <input className="w-full bg-neutral-50 p-4 rounded-xl outline-none focus:ring-1 ring-black/10 text-sm" type="password" placeholder="Password" onChange={e => setCredentials({...credentials, password: e.target.value})} />
              <button className="w-full bg-black text-white p-4 rounded-xl font-bold hover:bg-neutral-800 transition shadow-lg shadow-black/10">Continue</button>
              <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="w-full text-xs text-neutral-400 font-bold uppercase tracking-widest">
                {authMode === 'login' ? 'Create an account' : 'Already have an account?'}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-12 animate-in fade-in duration-1000">
            <div className="group relative w-full h-[300px] bg-neutral-100 rounded-2xl border-2 border-dashed border-black/5 flex flex-col items-center justify-center transition hover:border-blue-200">
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                const fd = new FormData(); fd.append('image', e.target.files[0]);
                const res = await axios.post(`${API}/upload`, fd, { headers: { Authorization: `Bearer ${token}` } });
                setForm({...form, imageUrl: res.data.url});
              }} />
              {form.imageUrl ? <img src={form.imageUrl} className="w-full h-full object-cover rounded-2xl" /> : <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Upload Header Image</p>}
            </div>
            <input className="w-full text-7xl font-serif font-bold outline-none bg-transparent placeholder:text-neutral-200 tracking-tighter" placeholder="Title." onChange={e => setForm({...form, title: e.target.value})} />
            <textarea className="w-full h-96 text-xl font-serif outline-none bg-transparent placeholder:text-neutral-200 leading-relaxed resize-none" placeholder="Begin your narrative..." onChange={e => setForm({...form, content: e.target.value})} />
            <div className="fixed bottom-12 right-12">
              <button onClick={async () => { await axios.post(`${API}/posts`, form, { headers: { Authorization: `Bearer ${token}` } }); setView('home'); fetchPosts(); }} className="bg-blue-600 text-white px-10 py-4 rounded-full font-black shadow-2xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">Publish Story</button>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
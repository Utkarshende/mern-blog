import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function App() {
  const [posts, setPosts] = useState([]);
  const [view, setView] = useState('home'); // home, write, login, profile
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentUserId, setCurrentUserId] = useState(localStorage.getItem('userId'));
  const [profileData, setProfileData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  
  const [form, setForm] = useState({ title: '', content: '', imageUrl: '' });
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const res = await axios.get(`${API}/posts`);
    setPosts(res.data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setToken(null);
    setCurrentUserId(null);
    setView('home');
  };

  const viewProfile = async (userId) => {
    try {
      const res = await axios.get(`${API}/users/${userId}`);
      setProfileData(res.data);
      setView('profile');
    } catch (err) { alert("User not found"); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await axios.post(`${API}/upload`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForm(prev => ({ ...prev, imageUrl: res.data.url }));
    } catch (err) { alert("Upload failed"); }
    finally { setUploading(false); }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Delete permanently?")) return;
    await axios.delete(`${API}/posts/${postId}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchPosts();
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
      } else {
        setAuthMode('login');
        alert("Success! Now please login.");
      }
    } catch (err) { alert("Auth Error"); }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans">
      <nav className="sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-serif font-black text-white cursor-pointer" onClick={() => setView('home')}>Journal.</h1>
          
          <div className="flex gap-6 items-center">
            <button onClick={() => setView('home')} className="text-[10px] font-bold uppercase tracking-widest hover:text-blue-400">Feed</button>
            
            {token ? (
              <>
                <button onClick={() => setView('write')} className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Write</button>
                <button onClick={logout} className="text-[10px] font-bold uppercase tracking-widest text-red-500/70 hover:text-red-500">Log Out</button>
              </>
            ) : (
              <button onClick={() => setView('login')} className="bg-blue-600 text-white px-5 py-2 rounded-full text-[10px] font-bold uppercase">Sign In</button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* LOGIN/SIGNUP VIEW */}
        {view === 'login' && (
          <div className="max-w-sm mx-auto bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
            <h2 className="text-2xl font-serif font-bold text-white mb-6">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
            <form onSubmit={handleAuth} className="space-y-4">
              <input className="w-full bg-slate-800 p-3 rounded-xl outline-none" placeholder="Username" onChange={e => setCredentials({...credentials, username: e.target.value})} />
              <input className="w-full bg-slate-800 p-3 rounded-xl outline-none" type="password" placeholder="Password" onChange={e => setCredentials({...credentials, password: e.target.value})} />
              <button className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold">Continue</button>
              <p className="text-center text-[10px] text-slate-500 uppercase font-bold cursor-pointer" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
                {authMode === 'login' ? 'Need an account?' : 'Already have an account?'}
              </p>
            </form>
          </div>
        )}

        {/* HOME FEED */}
        {view === 'home' && (
          <div className="max-w-2xl mx-auto">
            {posts.map(post => (
              <article key={post._id} className="mb-24">
                {post.imageUrl && <img src={post.imageUrl} className="w-full h-80 object-cover rounded-2xl mb-8 border border-slate-800" />}
                <h2 className="text-4xl font-serif font-bold text-white mb-6">{post.title}</h2>
                <div className="prose prose-invert prose-slate max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between">
                  <span onClick={() => viewProfile(post.author)} className="text-[10px] font-bold text-blue-400 cursor-pointer uppercase">By {post.authorName}</span>
                  {currentUserId === post.author && (
                    <button onClick={() => handleDelete(post._id)} className="text-[10px] text-red-500 font-bold uppercase">Delete</button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* PROFILE VIEW */}
        {view === 'profile' && profileData && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-serif font-bold text-white mb-2">{profileData.user.username}</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{profileData.posts.length} Narratives</p>
            </div>
            {profileData.posts.map(post => (
              <div key={post._id} className="mb-12 p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                <h3 className="text-xl font-serif font-bold text-white mb-2">{post.title}</h3>
                <p className="text-slate-400 text-sm line-clamp-2">{post.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* WRITE VIEW (SPLIT SCREEN) */}
        {view === 'write' && (
          <div className="flex flex-col h-[calc(100vh-160px)]">
            <div className="flex gap-4 mb-4">
              <input className="flex-1 bg-transparent text-4xl font-serif font-bold text-white outline-none" placeholder="Title" onChange={e => setForm({...form, title: e.target.value})} />
              <button onClick={async () => { await axios.post(`${API}/posts`, form, { headers: { Authorization: `Bearer ${token}` } }); setView('home'); fetchPosts(); }} className="bg-blue-600 text-white px-8 py-2 rounded-xl font-bold">Publish</button>
            </div>
            <div className="grid grid-cols-2 flex-1 border border-slate-800 rounded-3xl overflow-hidden">
              <div className="flex flex-col border-r border-slate-800">
                <div className="p-2 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 flex justify-between">
                  <span>Markdown</span>
                  <label className="cursor-pointer text-blue-400"><input type="file" hidden onChange={handleImageUpload}/>{uploading ? '...' : '+ Image'}</label>
                </div>
                <textarea className="flex-1 p-6 bg-transparent text-slate-300 font-mono text-sm outline-none resize-none" onChange={e => setForm({...form, content: e.target.value})} />
              </div>
              <div className="p-6 overflow-y-auto prose prose-invert prose-slate">
                {form.imageUrl && <img src={form.imageUrl} className="w-full h-40 object-cover rounded-xl mb-4"/>}
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
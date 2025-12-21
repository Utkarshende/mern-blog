import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function App() {
  const [posts, setPosts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [view, setView] = useState('home');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(localStorage.getItem('user'));
  const [authMode, setAuthMode] = useState('login');
  const [form, setForm] = useState({ title: '', content: '', imageUrl: '' });
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [commentText, setCommentText] = useState({});

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

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = authMode === 'login' ? 'login' : 'signup';
    const res = await axios.post(`${API}/${endpoint}`, credentials);
    if (authMode === 'login') {
      setToken(res.data.token); setUser(res.data.username);
      localStorage.setItem('token', res.data.token); localStorage.setItem('user', res.data.username);
      setView('home');
    } else { setAuthMode('login'); alert("Signed up!"); }
  };

  const handleImage = async (e) => {
    const formData = new FormData();
    formData.append('image', e.target.files[0]);
    const res = await axios.post(`${API}/upload`, formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
    setForm({ ...form, imageUrl: res.data.url });
  };

  const handleComment = async (id) => {
    await axios.post(`${API}/posts/${id}/comments`, { text: commentText[id] }, { headers: { Authorization: `Bearer ${token}` } });
    setCommentText({ ...commentText, [id]: "" });
    fetchPosts();
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <nav className="sticky top-0 bg-white/80 backdrop-blur-md border-b z-50 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-black cursor-pointer" onClick={() => setView('home')}>DevBlog.</h1>
          <div className="flex gap-4">
            <button onClick={() => setView('home')} className="text-sm font-bold">Explore</button>
            {token ? (
              <>
                <button onClick={() => setView('profile')} className="text-sm">My Dashboard</button>
                <button onClick={() => setView('write')} className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold">Write</button>
                <button onClick={() => {localStorage.clear(); window.location.reload();}} className="text-xs text-red-400">Logout</button>
              </>
            ) : <button onClick={() => setView('write')} className="text-sm font-bold underline">Login</button>}
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {view === 'home' && posts.map(post => (
          <article key={post._id} className="mb-20">
            {post.imageUrl && <img src={post.imageUrl} className="w-full h-64 object-cover rounded-2xl mb-4" />}
            <span className="text-xs font-bold text-blue-600 uppercase">By {post.authorName}</span>
            <h2 className="text-4xl font-black mt-2 mb-4 tracking-tighter">{post.title}</h2>
            <div className="prose prose-slate mb-8"><ReactMarkdown>{post.content}</ReactMarkdown></div>
            
            <div className="border-t pt-6">
              <h3 className="text-sm font-bold mb-4">Comments ({post.comments.length})</h3>
              <div className="space-y-3 mb-4">
                {post.comments.map((c, i) => (
                  <div key={i} className="bg-slate-50 p-3 rounded-xl text-sm">
                    <span className="font-bold">{c.authorName}: </span>{c.text}
                  </div>
                ))}
              </div>
              {token && (
                <div className="flex gap-2">
                  <input value={commentText[post._id] || ""} onChange={e => setCommentText({...commentText, [post._id]: e.target.value})} className="flex-1 bg-slate-100 p-2 rounded-lg outline-none" placeholder="Add a comment..." />
                  <button onClick={() => handleComment(post._id)} className="bg-slate-900 text-white px-4 rounded-lg text-sm">Post</button>
                </div>
              )}
            </div>
          </article>
        ))}

        {view === 'profile' && (
          <div>
            <h2 className="text-3xl font-black mb-6">Your Stories</h2>
            {myPosts.map(p => (
              <div key={p._id} className="flex justify-between p-4 border rounded-xl mb-2">
                <span>{p.title}</span>
                <button onClick={async () => {await axios.delete(`${API}/posts/${p._id}`, {headers:{Authorization:`Bearer ${token}`}}); fetchMyPosts();}} className="text-red-500 text-sm">Delete</button>
              </div>
            ))}
          </div>
        )}

        {view === 'write' && (!token ? (
          <form onSubmit={handleAuth} className="max-w-xs mx-auto space-y-4">
            <h2 className="text-2xl font-bold">{authMode === 'login' ? 'Login' : 'Signup'}</h2>
            <input className="w-full border p-3 rounded-lg" placeholder="Username" onChange={e => setCredentials({...credentials, username: e.target.value})} />
            <input className="w-full border p-3 rounded-lg" type="password" placeholder="Password" onChange={e => setCredentials({...credentials, password: e.target.value})} />
            <button className="w-full bg-black text-white p-3 rounded-lg font-bold">{authMode === 'login' ? 'Enter' : 'Join'}</button>
            <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="w-full text-sm text-slate-500">{authMode === 'login' ? 'Create account' : 'Login instead'}</button>
          </form>
        ) : (
          <div className="space-y-6">
            <input type="file" onChange={handleImage} className="text-sm mb-4" />
            {form.imageUrl && <img src={form.imageUrl} className="h-32 rounded-lg" />}
            <input className="w-full text-4xl font-black outline-none" placeholder="Title..." onChange={e => setForm({...form, title: e.target.value})} />
            <textarea className="w-full h-96 text-lg outline-none" placeholder="Content..." onChange={e => setForm({...form, content: e.target.value})} />
            <button onClick={async () => {await axios.post(`${API}/posts`, form, {headers:{Authorization:`Bearer ${token}`}}); setView('home'); fetchPosts();}} className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold">Publish</button>
          </div>
        ))}
      </main>
    </div>
  );
}
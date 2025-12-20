import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const API = 'http://localhost:5000/api/posts';

function App() {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({ title: '', content: '', status: 'draft' });
  const [editId, setEditId] = useState(null);
  const [view, setView] = useState('home'); // 'home' or 'manage'

  const refresh = () => axios.get(API).then(res => setPosts(res.data));
  useEffect(() => { refresh(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    editId ? await axios.put(`${API}/${editId}`, form) : await axios.post(API, form);
    setForm({ title: '', content: '', status: 'draft' });
    setEditId(null);
    refresh();
    setView('home'); // Redirect to home after publishing
  };

  // Filter posts for the public home page
  const publishedPosts = posts.filter(p => p.status === 'published');

  return (
    <div style={ui.page}>
      {/* NAVIGATION */}
      <nav style={ui.nav}>
        <h2 onClick={() => setView('home')} style={{ cursor: 'pointer' }}>MERN Blog</h2>
        <div>
          <button onClick={() => setView('home')} style={view === 'home' ? ui.activeTab : ui.tab}>Home</button>
          <button onClick={() => setView('manage')} style={view === 'manage' ? ui.activeTab : ui.tab}>Write + Manage</button>
        </div>
      </nav>

      <main style={ui.container}>
        
        {/* VIEW 1: HOME PAGE (Public) */}
        {view === 'home' && (
          <section>
            <h1 style={ui.viewTitle}>Latest Stories</h1>
            {publishedPosts.length === 0 && <p>No stories published yet.</p>}
            {publishedPosts.map(p => (
              <article key={p._id} style={ui.blogPost}>
                <h2 style={ui.postTitle}>{p.title}</h2>
                <small style={ui.date}>{new Date(p.createdAt).toDateString()}</small>
                <div style={ui.content}><ReactMarkdown>{p.content}</ReactMarkdown></div>
              </article>
            ))}
          </section>
        )}

        {/* VIEW 2: MANAGE/PUBLISH PAGE (Admin) */}
        {view === 'manage' && (
          <section>
            <h1 style={ui.viewTitle}>Studio</h1>
            <div style={ui.editorBox}>
              <form onSubmit={handleSave} style={ui.form}>
                <input style={ui.input} value={form.title} placeholder="Title" onChange={e => setForm({...form, title: e.target.value})} required />
                <textarea style={ui.textarea} value={form.content} placeholder="Write your story..." onChange={e => setForm({...form, content: e.target.value})} required />
                <div style={ui.row}>
                  <select style={ui.select} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="draft">Save as Draft</option>
                    <option value="published">Publish to Home</option>
                  </select>
                  <button type="submit" style={ui.btnMain}>{editId ? 'Update' : 'Publish'}</button>
                </div>
              </form>
            </div>

            <h2 style={{marginTop: '40px'}}>Inventory</h2>
            {posts.map(p => (
              <div key={p._id} style={ui.manageCard}>
                <div>
                   <span style={p.status === 'published' ? ui.dotPub : ui.dotDraft}>●</span>
                   <strong>{p.title}</strong>
                </div>
                <div style={ui.actions}>
                  <button onClick={() => {setEditId(p._id); setForm(p);}} style={ui.btnLink}>Edit</button>
                  <button onClick={() => axios.delete(`${API}/${p._id}`).then(refresh)} style={ui.btnDel}>Delete</button>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

const ui = {
  page: { fontFamily: '"Inter", sans-serif', color: '#222', backgroundColor: '#fff', minHeight: '100vh' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 10%', borderBottom: '1px solid #eee' },
  tab: { background: 'none', border: 'none', padding: '10px 15px', cursor: 'pointer', color: '#666' },
  activeTab: { background: 'none', border: 'none', padding: '10px 15px', cursor: 'pointer', color: '#000', fontWeight: 'bold', borderBottom: '2px solid #000' },
  container: { maxWidth: '700px', margin: '40px auto', padding: '0 20px' },
  viewTitle: { fontSize: '32px', marginBottom: '30px' },
  blogPost: { marginBottom: '60px', borderBottom: '1px solid #f0f0f0', paddingBottom: '40px' },
  postTitle: { fontSize: '28px', marginBottom: '10px' },
  date: { color: '#888', display: 'block', marginBottom: '20px' },
  content: { lineHeight: '1.8', fontSize: '18px', color: '#333' },
  editorBox: { backgroundColor: '#f9f9f9', padding: '25px', borderRadius: '8px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { fontSize: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' },
  textarea: { height: '200px', padding: '10px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px' },
  row: { display: 'flex', justifyContent: 'space-between' },
  btnMain: { background: '#000', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' },
  manageCard: { display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #eee' },
  dotPub: { color: '#4caf50', marginRight: '10px' },
  dotDraft: { color: '#ff9800', marginRight: '10px' },
  btnLink: { background: 'none', border: 'none', color: '#0070f3', cursor: 'pointer', marginRight: '10px' },
  btnDel: { background: 'none', border: 'none', color: 'red', cursor: 'pointer' }
};

export default App;
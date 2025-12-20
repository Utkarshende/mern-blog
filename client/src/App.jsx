import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const API = 'http://localhost:5000/api/posts';

function App() {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({ title: '', content: '', status: 'draft' });
  const [editId, setEditId] = useState(null);

  const refresh = () => axios.get(API).then(res => setPosts(res.data));
  useEffect(() => { refresh(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    editId ? await axios.put(`${API}/${editId}`, form) : await axios.post(API, form);
    setForm({ title: '', content: '', status: 'draft' });
    setEditId(null);
    refresh();
  };

  const startEdit = (p) => { setEditId(p._id); setForm(p); window.scrollTo(0,0); };

  return (
    <div style={ui.page}>
      <nav style={ui.nav}>
        <h2 style={{ fontWeight: 400 }}>MERN / <span style={{ color: '#888' }}>Minimalist Blog</span></h2>
      </nav>

      <main style={ui.container}>
        {/* Composition Area */}
        <section style={ui.editorBox}>
          <form onSubmit={handleSave} style={ui.form}>
            <input style={ui.input} value={form.title} placeholder="Title" onChange={e => setForm({...form, title: e.target.value})} required />
            <textarea style={ui.textarea} value={form.content} placeholder="Content (Markdown)" onChange={e => setForm({...form, content: e.target.value})} required />
            <div style={ui.row}>
              <select style={ui.select} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="draft">Draft</option>
                <option value="published">Publish</option>
              </select>
              <button type="submit" style={ui.btnMain}>{editId ? 'Update' : 'Post'}</button>
            </div>
          </form>
        </section>

        {/* Feed Area */}
        <section style={ui.feed}>
          {posts.map(p => (
            <article key={p._id} style={ui.card}>
              <div style={ui.cardMeta}>
                <span style={p.status === 'published' ? ui.dotPub : ui.dotDraft}>●</span> {p.status}
              </div>
              <h3 style={ui.cardTitle}>{p.title}</h3>
              <div style={ui.preview}><ReactMarkdown>{p.content}</ReactMarkdown></div>
              <div style={ui.actions}>
                <button onClick={() => startEdit(p)} style={ui.btnLink}>Edit</button>
                <button onClick={() => axios.delete(`${API}/${p._id}`).then(refresh)} style={ui.btnDel}>Delete</button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

const ui = {
  page: { fontFamily: '"Inter", sans-serif', color: '#333', backgroundColor: '#fafafa', minHeight: '100vh' },
  nav: { padding: '20px 50px', borderBottom: '1px solid #eee', backgroundColor: '#fff' },
  container: { maxWidth: '800px', margin: '40px auto', padding: '0 20px' },
  editorBox: { backgroundColor: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #eee', marginBottom: '40px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { fontSize: '24px', border: 'none', borderBottom: '1px solid #eee', outline: 'none', padding: '10px 0' },
  textarea: { fontSize: '16px', border: 'none', outline: 'none', height: '150px', resize: 'none', lineHeight: '1.6' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  select: { border: 'none', background: '#f0f0f0', padding: '8px 12px', borderRadius: '6px' },
  btnMain: { backgroundColor: '#000', color: '#fff', padding: '10px 25px', borderRadius: '6px', border: 'none', cursor: 'pointer' },
  feed: { display: 'flex', flexDirection: 'column', gap: '20px' },
  card: { padding: '25px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eee' },
  cardMeta: { fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '10px' },
  dotPub: { color: '#4caf50', marginRight: '5px' },
  dotDraft: { color: '#ff9800', marginRight: '5px' },
  cardTitle: { margin: '0 0 10px 0', fontSize: '20px' },
  preview: { fontSize: '15px', color: '#555', lineHeight: '1.6' },
  actions: { marginTop: '20px', display: 'flex', gap: '15px' },
  btnLink: { background: 'none', border: 'none', color: '#0070f3', cursor: 'pointer', padding: 0 },
  btnDel: { background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', padding: 0 }
};

export default App;
import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

// Base URL for our Backend API
const API_URL = 'http://localhost:5000/api/posts';

function App() {
  const [posts, setPosts] = useState([]);
  const [formData, setFormData] = useState({ title: '', content: '', status: 'draft' });
  const [editingId, setEditingId] = useState(null);

  // 1. Fetch all posts when the app loads
  const fetchPosts = async () => {
    try {
      const res = await axios.get(API_URL);
      setPosts(res.data);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // 2. Handle Form Submission (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update existing post
        await axios.put(`${API_URL}/${editingId}`, formData);
        setEditingId(null);
      } else {
        // Create new post
        await axios.post(API_URL, formData);
      }
      setFormData({ title: '', content: '', status: 'draft' });
      fetchPosts();
    } catch (err) {
      console.error("Error saving post:", err);
    }
  };

  // 3. Delete a post
  const deletePost = async (id) => {
    if (window.confirm("Are you sure you want to delete this blog post?")) {
      await axios.delete(`${API_URL}/${id}`);
      fetchPosts();
    }
  };

  // 4. Load post into form for editing
  const startEdit = (post) => {
    setEditingId(post._id);
    setFormData({ 
      title: post.title, 
      content: post.content, 
      status: post.status 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>MERN Blog Studio</h1>
        <p>Write in Markdown, publish to the world.</p>
      </header>

      <div style={styles.layout}>
        {/* EDITOR SECTION */}
        <section style={styles.editorSection}>
          <h2>{editingId ? '📝 Edit Post' : '✍️ New Post'}</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <input 
              style={styles.input}
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              placeholder="Post Title..." 
              required
            />
            <textarea 
              style={styles.textarea}
              value={formData.content} 
              onChange={e => setFormData({...formData, content: e.target.value})} 
              placeholder="Write your content here (Markdown supported)..." 
              required
            />
            <div style={styles.formControls}>
              <select 
                style={styles.select}
                value={formData.status} 
                onChange={e => setFormData({...formData, status: e.target.value})}
              >
                <option value="draft">📁 Save as Draft</option>
                <option value="published">🚀 Publish Now</option>
              </select>
              <button type="submit" style={styles.submitBtn}>
                {editingId ? 'Update Post' : 'Save Post'}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={() => {setEditingId(null); setFormData({title:'', content:'', status:'draft'})}}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* PREVIEW SECTION */}
        <section style={styles.previewSection}>
          <h2>👀 Live Preview</h2>
          <div style={styles.previewContent}>
            <h1 style={{margin: 0}}>{formData.title || "Untitled Post"}</h1>
            <hr />
            <ReactMarkdown>{formData.content || "*No content to preview yet...*"}</ReactMarkdown>
          </div>
        </section>
      </div>

      <hr style={{margin: '40px 0'}} />

      {/* BLOG FEED SECTION */}
      <section>
        <h2>📬 Management Console</h2>
        <div style={styles.grid}>
          {posts.map(post => (
            <div key={post._id} style={{
              ...styles.card, 
              borderLeft: post.status === 'published' ? '5px solid #4CAF50' : '5px solid #FF9800'
            }}>
              <div style={styles.cardHeader}>
                <span style={post.status === 'published' ? styles.statusPub : styles.statusDraft}>
                  {post.status.toUpperCase()}
                </span>
                <small>{new Date(post.createdAt).toLocaleDateString()}</small>
              </div>
              <h3>{post.title}</h3>
              <div style={styles.cardActions}>
                <button onClick={() => startEdit(post)} style={styles.editBtn}>Edit</button>
                <button onClick={() => deletePost(post._id)} style={styles.deleteBtn}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// Minimalist Styles
const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, sans-serif' },
  header: { textAlign: 'center', marginBottom: '40px' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { padding: '12px', fontSize: '18px', borderRadius: '5px', border: '1px solid #ddd' },
  textarea: { padding: '12px', height: '300px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ddd', resize: 'vertical' },
  formControls: { display: 'flex', gap: '10px' },
  select: { padding: '10px', borderRadius: '5px' },
  submitBtn: { padding: '10px 20px', background: '#2196F3', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  cancelBtn: { padding: '10px 20px', background: '#eee', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  previewSection: { background: '#fcfcfc', border: '1px solid #eee', padding: '20px', borderRadius: '8px' },
  previewContent: { color: '#333', lineHeight: '1.6' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  card: { padding: '20px', background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', borderRadius: '5px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
  statusPub: { color: '#4CAF50', fontWeight: 'bold', fontSize: '12px' },
  statusDraft: { color: '#FF9800', fontWeight: 'bold', fontSize: '12px' },
  cardActions: { marginTop: '15px', display: 'flex', gap: '10px' },
  editBtn: { padding: '5px 10px', background: '#fff', border: '1px solid #2196F3', color: '#2196F3', cursor: 'pointer' },
  deleteBtn: { padding: '5px 10px', background: '#fff', border: '1px solid #f44336', color: '#f44336', cursor: 'pointer' },
};

export default App;
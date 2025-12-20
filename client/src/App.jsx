import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [posts, setPosts] = useState([]);
  const [formData, setFormData] = useState({ title: '', content: '', status: 'draft' });
  const [editingId, setEditingId] = useState(null);

  const fetchPosts = async () => {
    const res = await axios.get('http://localhost:5000/api/posts');
    setPosts(res.data);
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`http://localhost:5000/api/posts/${editingId}`, formData);
      setEditingId(null);
    } else {
      await axios.post('http://localhost:5000/api/posts', formData);
    }
    setFormData({ title: '', content: '', status: 'draft' });
    fetchPosts();
  };

  const deletePost = async (id) => {
    if(window.confirm("Delete this post?")) {
      await axios.delete(`http://localhost:5000/api/posts/${id}`);
      fetchPosts();
    }
  };

  const startEdit = (post) => {
    setEditingId(post._id);
    setFormData({ title: post.title, content: post.content, status: post.status });
  };

  return (
    <div style={{ maxWidth: '800px', margin: 'auto', padding: '20px' }}>
      <h1>Blog Studio</h1>
      
      {/* Form Section */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input 
          value={formData.title} 
          onChange={e => setFormData({...formData, title: e.target.value})} 
          placeholder="Blog Title" 
        />
        <textarea 
          value={formData.content} 
          onChange={e => setFormData({...formData, content: e.target.value})} 
          placeholder="Write your story..." 
        />
        <select 
          value={formData.status} 
          onChange={e => setFormData({...formData, status: e.target.value})}
        >
          <option value="draft">Save as Draft</option>
          <option value="published">Publish Now</option>
        </select>
        <button type="submit">{editingId ? 'Update Post' : 'Save Post'}</button>
      </form>

      <hr />

      {/* List Section */}
      {posts.map(post => (
        <div key={post._id} style={{ 
          border: '1px solid #ddd', 
          padding: '15px', 
          margin: '10px 0', 
          borderRadius: '8px',
          opacity: post.status === 'draft' ? 0.6 : 1 
        }}>
          <span style={{ fontSize: '12px', background: '#eee', padding: '2px 5px' }}>
            {post.status.toUpperCase()}
          </span>
          <h3>{post.title}</h3>
          <p>{post.content}</p>
          <button onClick={() => startEdit(post)}>Edit</button>
          <button onClick={() => deletePost(post._id)} style={{ color: 'red' }}>Delete</button>
        </div>
      ))}
    </div>
  );
}

export default App;
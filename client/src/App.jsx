import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown'; // 1. Import the library

function App() {
  const [posts, setPosts] = useState([]);
  const [formData, setFormData] = useState({ title: '', content: '', status: 'draft' });
  const [editingId, setEditingId] = useState(null);

  // ... (Keep fetchPosts, handleSubmit, deletePost, startEdit from previous step)

  return (
    <div style={{ maxWidth: '1000px', margin: 'auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Blog Studio Pro</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left Side: The Editor */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2>Editor</h2>
          <input 
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})} 
            placeholder="Title" 
            style={{ padding: '10px' }}
          />
          <textarea 
            value={formData.content} 
            onChange={e => setFormData({...formData, content: e.target.value})} 
            placeholder="Write using Markdown... (e.g. ## Heading, **bold**)" 
            style={{ height: '300px', padding: '10px' }}
          />
          <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
            <option value="draft">Draft</option>
            <option value="published">Publish</option>
          </select>
          <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none' }}>
            {editingId ? 'Update Post' : 'Save Post'}
          </button>
        </form>

        {/* Right Side: The Preview */}
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', background: '#f9f9f9' }}>
          <h2>Live Preview</h2>
          <h1>{formData.title || "Untitled"}</h1>
          <ReactMarkdown>{formData.content}</ReactMarkdown> {/* 2. Render Markdown here */}
        </div>
      </div>

      <hr style={{ margin: '40px 0' }} />

      {/* Blog Feed */}
      <h2>Your Posts</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {posts.map(post => (
          <div key={post._id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
            <small style={{ color: post.status === 'published' ? 'green' : 'orange' }}>
               ● {post.status.toUpperCase()}
            </small>
            <h3>{post.title}</h3>
            {/* We render the summary as markdown too! */}
            <div style={{ maxHeight: '100px', overflow: 'hidden' }}>
                <ReactMarkdown>{post.content.substring(0, 100) + "..."}</ReactMarkdown>
            </div>
            <div style={{ marginTop: '10px' }}>
                <button onClick={() => startEdit(post)}>Edit</button>
                <button onClick={() => deletePost(post._id)} style={{ marginLeft: '10px', color: 'red' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
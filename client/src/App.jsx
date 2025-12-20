import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Fetch posts from backend
  useEffect(() => {
    axios.get('http://localhost:5000/api/posts')
      .then(res => setPosts(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await axios.post('http://localhost:5000/api/posts', { title, content });
    setPosts([...posts, res.data]); // Update UI immediately
    setTitle(''); setContent('');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>My MERN Blog</h1>
      <form onSubmit={handleSubmit}>
        <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} /><br />
        <textarea placeholder="Content" value={content} onChange={e => setContent(e.target.value)} /><br />
        <button type="submit">Publish</button>
      </form>
      <hr />
      {posts.map(p => (
        <div key={p._id}>
          <h3>{p.title}</h3>
          <p>{p.content}</p>
        </div>
      ))}
    </div>
  );
}

export default App;
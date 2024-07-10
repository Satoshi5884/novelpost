import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const MyPage = ({ isAuth }) => {
  const [postList, setPostList] = useState([]);
  const [authorName, setAuthorName] = useState("");
  const [editingAuthorName, setEditingAuthorName] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuth) {
      navigate("/login");
      return;
    }

    const getPosts = async () => {
      try {
        const postsCollectionRef = collection(db, "posts");
        const q = query(postsCollectionRef, where("author.id", "==", auth.currentUser.uid));
        const data = await getDocs(q);
        setPostList(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
        if (data.docs.length > 0) {
          setAuthorName(data.docs[0].data().author.name);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    getPosts();
  }, [isAuth, navigate]);

  const deletePost = async (id) => {
    try {
      const postDoc = doc(db, "posts", id);
      await deleteDoc(postDoc);
      setPostList(postList.filter((post) => post.id !== id));
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const updateAuthorName = async () => {
    try {
      const postsToUpdate = postList.map(post => ({
        ...post,
        author: { ...post.author, name: authorName }
      }));

      await Promise.all(postsToUpdate.map(post => 
        updateDoc(doc(db, "posts", post.id), { author: post.author })
      ));

      setPostList(postsToUpdate);
      setEditingAuthorName(false);
    } catch (error) {
      console.error("Error updating author name:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-serif font-bold text-primary mb-8">My Novels</h1>
      
      <div className="mb-8">
        {editingAuthorName ? (
          <div className="flex items-center">
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="mr-2 px-2 py-1 border rounded"
            />
            <button onClick={updateAuthorName} className="px-4 py-2 bg-secondary text-white rounded hover:bg-primary">
              Save
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <p className="mr-2">Author Name: {authorName}</p>
            <button onClick={() => setEditingAuthorName(true)} className="px-4 py-2 bg-secondary text-white rounded hover:bg-primary">
              Edit
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {postList.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-serif font-bold text-gray-900 mb-2">{post.title}</h2>
              <p className="text-gray-600 mb-4">
                {expandedPostId === post.id ? post.postText : `${post.postText.substring(0, 100)}...`}
              </p>
              <p className="text-sm text-gray-500 mb-2">By: {post.author.name}</p>
              <p className="text-xs text-gray-400 mb-2">Created: {new Date(post.createdAt).toLocaleString()}</p>
              {post.updatedAt && (
                <p className="text-xs text-gray-400 mb-2">Updated: {new Date(post.updatedAt).toLocaleString()}</p>
              )}
              <div className="flex justify-end space-x-2">
                <button 
                  onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {expandedPostId === post.id ? "Collapse" : "Expand"}
                </button>
                <button onClick={() => navigate(`/edit/${post.id}`)} className="px-4 py-2 bg-secondary text-white rounded hover:bg-primary">Edit</button>
                <button onClick={() => deletePost(post.id)} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyPage;
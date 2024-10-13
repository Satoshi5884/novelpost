import React, { useEffect, useState } from 'react';
import { auth, db, setUserAuthorName, getUserAuthorName } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc, writeBatch, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import FullPostView from './FullPostView';

const MyPage = ({ isAuth }) => {
  const [postList, setPostList] = useState([]);
  const [authorName, setAuthorName] = useState("");
  const [editingAuthorName, setEditingAuthorName] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndFetchPosts = async () => {
      if (!isAuth) {
        navigate("/login");
        return;
      }

      if (!auth.currentUser) {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            setUserEmail(user.email);
            await getPosts(user.uid);
          } else {
            navigate("/login");
          }
          unsubscribe();
        });
      } else {
        setUserEmail(auth.currentUser.email);
        await getPosts(auth.currentUser.uid);
      }
    };

    checkAuthAndFetchPosts();
  }, [isAuth, navigate]);

  const getPosts = async (userId) => {
    try {
      setLoading(true);
      const postsCollectionRef = collection(db, "posts");
      const q = query(postsCollectionRef, where("author.id", "==", userId));
      const data = await getDocs(q);
      const posts = data.docs.map((doc) => {
        const postData = doc.data();
        return {
          ...postData,
          id: doc.id,
          pages: Array.isArray(postData.pages) ? postData.pages : [],
        };
      });
      setPostList(posts);
      const name = await getUserAuthorName(userId);
      setAuthorName(name || '');
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPostList([]);
    } finally {
      setLoading(false);
    }
  };

  const getPostContent = (post) => {
    if (post.pages && post.pages.length > 0 && typeof post.pages[0].content === 'string') {
      return post.pages[0].content.substring(0, 100);
    }
    return "No content available";
  };

  const togglePublishStatus = async (id, currentStatus) => {
    try {
      const postDoc = doc(db, "posts", id);
      await updateDoc(postDoc, { published: !currentStatus });
      setPostList(postList.map(post => 
        post.id === id ? { ...post, published: !currentStatus } : post
      ));
    } catch (error) {
      console.error("Error toggling publish status:", error);
    }
  };

  const initiateDeletePost = (id) => {
    setDeletingPostId(id);
  };

  const confirmDeletePost = async (id) => {
    try {
      const postDoc = doc(db, "posts", id);
      await deleteDoc(postDoc);
      setPostList(postList.filter((post) => post.id !== id));
      setExpandedPost(null);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("記事の削除中にエラーが発生しました。");
    } finally {
      setDeletingPostId(null);
    }
  };

  const cancelDeletePost = () => {
    setDeletingPostId(null);
  };

  const updateAuthorName = async () => {
    try {
      await setUserAuthorName(auth.currentUser.uid, authorName);
      setEditingAuthorName(false);

      const batch = writeBatch(db);
      
      postList.forEach((post) => {
        const postRef = doc(db, "posts", post.id);
        batch.update(postRef, { "author.name": authorName });
      });

      const commentsQuery = query(collection(db, "comments"), where("author.id", "==", auth.currentUser.uid));
      const commentsSnapshot = await getDocs(commentsQuery);
      commentsSnapshot.forEach((commentDoc) => {
        batch.update(doc(db, "comments", commentDoc.id), { "author.name": authorName });
      });

      await batch.commit();

      setPostList(postList.map(post => ({
        ...post,
        author: { ...post.author, name: authorName }
      })));
    } catch (error) {
      console.error("Error updating author name:", error);
    }
  };

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-serif font-bold text-primary mb-8">My Novels</h1>
      
      {/* メールアドレス表示セクション */}
      <div className="mb-4">
        <p className="text-gray-600">ログイン中のアカウント: {userEmail}</p>
      </div>
      
      {/* Author name editing section */}
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
              保存
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <p className="mr-2">著者名: {authorName}</p>
            <button onClick={() => setEditingAuthorName(true)} className="px-4 py-2 bg-secondary text-white rounded hover:bg-primary">
              編集
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {postList.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-serif font-bold text-gray-900 mb-2">{post.title || "Untitled"}</h2>
              <p className="text-gray-600 mb-4">{getPostContent(post)}...</p>
              <p className="text-sm text-gray-500 mb-2">Pages: {post.pages?.length || 0}</p>
              <p className="text-sm text-gray-500 mb-2">Status: {post.published ? 'Published' : 'Draft'}</p>
              <p className="text-xs text-gray-400 mb-2">Created: {post.createdAt ? new Date(post.createdAt).toLocaleString() : "Unknown"}</p>
              {post.updatedAt && (
                <p className="text-xs text-gray-400 mb-2">Updated: {new Date(post.updatedAt).toLocaleString()}</p>
              )}
              <div className="flex flex-wrap justify-end space-x-2 space-y-2">
                <button 
                  onClick={() => setExpandedPost(post)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Expand
                </button>
                <button 
                  onClick={() => togglePublishStatus(post.id, post.published)}
                  className={`px-4 py-2 ${post.published ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded`}
                >
                  {post.published ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => navigate(`/edit/${post.id}`)} className="px-4 py-2 bg-secondary text-white rounded hover:bg-primary">Edit</button>
                {deletingPostId === post.id ? (
                  <>
                    <p className="w-full text-red-500 text-sm">本当に削除しますか？</p>
                    <button
                      onClick={() => confirmDeletePost(post.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                    <button
                      onClick={cancelDeletePost}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => initiateDeletePost(post.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {expandedPost && (
        <FullPostView 
          post={expandedPost} 
          onClose={() => setExpandedPost(null)}
          onDelete={confirmDeletePost}
          onEdit={(id) => navigate(`/edit/${id}`)}
          isAuthor={true}
        />
      )}
    </div>
  );
};

export default MyPage;

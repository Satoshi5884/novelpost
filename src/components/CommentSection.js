import React, { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, query, where, orderBy, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth, getUserAuthorName } from '../firebase';

const CommentSection = ({ postId, isAuthor }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  const fetchComments = useCallback(async () => {
    const q = query(
      collection(db, 'comments'),
      where('postId', '==', postId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const commentsData = await Promise.all(querySnapshot.docs.map(async (doc) => {
      const data = doc.data();
      const authorName = await getUserAuthorName(data.author.id);
      return { ...data, id: doc.id, author: { ...data.author, name: authorName || 'Anonymous' } };
    }));
    setComments(commentsData);
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = async (e) => {
    e.preventDefault();
    if (newComment.trim() === '') return;
    if (!auth.currentUser) {
      alert("Please log in to add a comment.");
      return;
    }

    const authorName = await getUserAuthorName(auth.currentUser.uid) || 'Anonymous';

    await addDoc(collection(db, 'comments'), {
      postId,
      content: newComment,
      author: {
        name: authorName,
        id: auth.currentUser.uid
      },
      createdAt: new Date().toISOString(),
      deleted: false
    });

    setNewComment('');
    fetchComments();
  };

  const initiateDeleteComment = (commentId) => {
    setDeletingCommentId(commentId);
  };

  const confirmDeleteComment = async (commentId, commentAuthorId) => {
    try {
      if (auth.currentUser.uid === commentAuthorId) {
        // コメントを書いた人が削除する場合
        await updateDoc(doc(db, 'comments', commentId), { deleted: true, content: 'コメントを削除しました' });
      } else if (isAuthor) {
        // 記事の作者が削除する場合
        await deleteDoc(doc(db, 'comments', commentId));
      }
      fetchComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("コメントの削除中にエラーが発生しました。");
    } finally {
      setDeletingCommentId(null);
    }
  };

  const cancelDeleteComment = () => {
    setDeletingCommentId(null);
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Comments</h3>
      {auth.currentUser && (
        <form onSubmit={addComment} className="mb-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
            rows="4"
            placeholder="Add a comment..."
          ></textarea>
          <button
            type="submit"
            className="mt-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary transition duration-300"
          >
            Post Comment
          </button>
        </form>
      )}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm font-semibold">{comment.author.name}</p>
            <p className="text-gray-600">{comment.content}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(comment.createdAt).toLocaleString()}
            </p>
            {(auth.currentUser && (auth.currentUser.uid === comment.author.id || isAuthor)) && !comment.deleted && (
              <>
                {deletingCommentId === comment.id ? (
                  <div className="mt-2">
                    <p className="text-red-500 mb-2">本当に削除しますか？</p>
                    <button
                      onClick={() => confirmDeleteComment(comment.id, comment.author.id)}
                      className="mr-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                    <button
                      onClick={cancelDeleteComment}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => initiateDeleteComment(comment.id)}
                    className="mt-2 text-sm text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;
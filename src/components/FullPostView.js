import React, { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../firebase';
import CommentSection from './CommentSection';

const FullPostView = ({ post, onClose, onDelete, onEdit, isAuthor }) => {
  const [likes, setLikes] = useState(post.likes || []);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (auth.currentUser) {
      setIsLiked(likes.includes(auth.currentUser.uid));
    }
  }, [likes]);

  const handleLike = async () => {
    if (!auth.currentUser) {
      alert("Please log in to like posts.");
      return;
    }

    const postRef = doc(db, 'posts', post.id);
    if (isLiked) {
      await updateDoc(postRef, {
        likes: arrayRemove(auth.currentUser.uid)
      });
      setLikes(likes.filter(id => id !== auth.currentUser.uid));
    } else {
      await updateDoc(postRef, {
        likes: arrayUnion(auth.currentUser.uid)
      });
      setLikes([...likes, auth.currentUser.uid]);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-3xl font-serif font-bold text-primary mb-4">{post.title}</h3>
          <div className="mt-2 px-7 py-3">
            <p className="text-gray-700 text-lg mb-4 text-left whitespace-pre-wrap">{post.postText}</p>
            <p className="text-sm text-gray-500 mb-2 text-left">By: {post.author.name}</p>
            <p className="text-xs text-gray-400 mb-2 text-left">Created: {new Date(post.createdAt).toLocaleString()}</p>
            {post.updatedAt && (
              <p className="text-xs text-gray-400 mb-2 text-left">Updated: {new Date(post.updatedAt).toLocaleString()}</p>
            )}
            <div className="flex items-center mb-4">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-1 ${isLiked ? 'text-red-500' : 'text-gray-500'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                <span>{likes.length} {likes.length === 1 ? 'Like' : 'Likes'}</span>
              </button>
            </div>
          </div>
          <CommentSection postId={post.id} isAuthor={isAuthor} />
          <div className="items-center px-4 py-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 mb-2"
            >
              Close
            </button>
            {isAuthor && (
              <>
                <button
                  onClick={() => onEdit(post.id)}
                  className="px-4 py-2 bg-secondary text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-primary focus:outline-none focus:ring-2 focus:ring-blue-300 mb-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(post.id)}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullPostView;
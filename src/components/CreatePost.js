import React, { useState, useEffect } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db, auth, getUserAuthorName } from '../firebase';
import { useNavigate } from 'react-router-dom';

const MAX_CHARS_PER_PAGE = 10000;

const CreatePost = ({ isAuth }) => {
  const [title, setTitle] = useState("");
  const [pages, setPages] = useState([{ content: "" }]);
  const [currentPage, setCurrentPage] = useState(0);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuth) {
      navigate("/login");
    }
  }, [isAuth, navigate]);

  const addTag = () => {
    if (tagInput.trim() !== "" && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handlePageChange = (index) => {
    setCurrentPage(index);
  };

  const addNewPage = () => {
    setPages([...pages, { content: "" }]);
    setCurrentPage(pages.length);
  };

  const updatePageContent = (content) => {
    const newPages = [...pages];
    newPages[currentPage].content = content;
    setPages(newPages);
  };

  const createPost = async (isPublished) => {
    try {
      const authorName = await getUserAuthorName(auth.currentUser.uid) || 'Anonymous';
      await addDoc(collection(db, "posts"), {
        title,
        pages: pages.map(page => ({
          content: page.content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })),
        author: {
          name: authorName,
          id: auth.currentUser.uid
        },
        tags,
        published: isPublished,
        likes: [],
        favorites: [],  // 新しく追加
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      navigate("/mypage");
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-serif font-bold text-primary mb-8">Create a New Post</h1>
      <div className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            id="title"
            placeholder="Title..."
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">Content</label>
          <div className="flex space-x-2 mb-2">
            {pages.map((_, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(index)}
                className={`px-3 py-1 rounded ${currentPage === index ? 'bg-primary text-white' : 'bg-gray-200'}`}
              >
                Page {index + 1}
              </button>
            ))}
            <button
              onClick={addNewPage}
              className="px-3 py-1 rounded bg-secondary text-white"
            >
              +
            </button>
          </div>
          <textarea
            id="content"
            placeholder="Write your story..."
            value={pages[currentPage].content}
            onChange={(e) => updatePageContent(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            rows="12"
            maxLength={MAX_CHARS_PER_PAGE}
          />
          <p className="text-sm text-gray-500 mt-1">
            {pages[currentPage].content.length} / {MAX_CHARS_PER_PAGE} characters
          </p>
        </div>
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags</label>
          <div className="flex items-center">
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
              placeholder="Add a tag..."
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
            <button
              type="button"
              onClick={addTag}
              className="ml-2 px-4 py-2 bg-secondary text-white rounded-md hover:bg-primary"
            >
              Add Tag
            </button>
          </div>
          <div className="mt-2 flex flex-wrap">
            {tags.map((tag, index) => (
              <span key={index} className="bg-gray-200 text-gray-700 rounded-full px-3 py-1 text-sm mr-2 mb-2">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>
        <div className="flex justify-between">
          <button onClick={() => createPost(false)} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary bg-primary bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            Save as Draft
          </button>
          <button onClick={() => createPost(true)} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            Publish Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, getUserAuthorName, storage } from '../firebase';
import { useNavigate } from 'react-router-dom';

const MAX_CHARS_PER_PAGE = 10000;
const MAX_SYNOPSIS_CHARS = 1000;
const MAX_IMAGE_SIZE = 512; // 最大画像サイズ

const CreatePost = ({ isAuth }) => {
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [pages, setPages] = useState([{ title: "", content: "" }]);
  const [currentPage, setCurrentPage] = useState(0);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [coverImageURL, setCoverImageURL] = useState("");
  const navigate = useNavigate();

  const addNewPage = () => {
    setPages([...pages, { title: "", content: "" }]);
    setCurrentPage(pages.length);
  };

  const removePage = () => {
    if (pages.length > 1) {
      const newPages = pages.filter((_, index) => index !== currentPage);
      setPages(newPages);
      setCurrentPage(Math.min(currentPage, newPages.length - 1));
    }
  };

  const updatePageContent = (content) => {
    const newPages = [...pages];
    newPages[currentPage].content = content;
    setPages(newPages);
  };

  const updatePageTitle = (title) => {
    const newPages = [...pages];
    newPages[currentPage].title = title;
    setPages(newPages);
  };

  const addTag = () => {
    if (tagInput.trim() !== "" && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          let width = img.width;
          let height = img.height;

          // 画像のリサイズ
          if (width > MAX_IMAGE_SIZE || height > MAX_IMAGE_SIZE) {
            if (width > height) {
              height *= MAX_IMAGE_SIZE / width;
              width = MAX_IMAGE_SIZE;
            } else {
              width *= MAX_IMAGE_SIZE / height;
              height = MAX_IMAGE_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            setCoverImage(blob);
            setCoverImageURL(URL.createObjectURL(blob));
          }, 'image/jpeg', 0.95);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const createPost = async (isPublished) => {
    try {
      const authorName = await getUserAuthorName(auth.currentUser.uid) || 'Anonymous';
      let coverImageURL = "";
      if (coverImage) {
        const imageRef = ref(storage, `covers/${new Date().getTime()}`);
        await uploadBytes(imageRef, coverImage);
        coverImageURL = await getDownloadURL(imageRef);
      }

      await addDoc(collection(db, "posts"), {
        title,
        synopsis,
        pages: pages.map(page => ({
          title: page.title,
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
        favorites: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        coverImageURL,
      });
      navigate("/mypage");
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-serif font-bold text-primary mb-8">Create New Post</h1>
      <form onSubmit={(e) => { e.preventDefault(); createPost(true); }} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="synopsis" className="block text-sm font-medium text-gray-700">Synopsis (Max 1000 characters)</label>
          <textarea
            id="synopsis"
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value.slice(0, MAX_SYNOPSIS_CHARS))}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            rows="4"
            maxLength={MAX_SYNOPSIS_CHARS}
          ></textarea>
          <p className="text-sm text-gray-500 mt-1">
            {synopsis.length} / {MAX_SYNOPSIS_CHARS} characters
          </p>
        </div>
        <div>
          <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700">Cover Image</label>
          <input
            type="file"
            id="coverImage"
            accept="image/png, image/jpeg"
            onChange={handleImageUpload}
            className="mt-1 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary file:text-white
                      hover:file:bg-secondary"
          />
          {coverImageURL && (
            <img src={coverImageURL} alt="Cover" className="mt-4 max-w-xs rounded shadow" />
          )}
        </div>
        <div>
          <label htmlFor="pageTitle" className="block text-sm font-medium text-gray-700">Page Title</label>
          <input
            type="text"
            id="pageTitle"
            value={pages[currentPage].title}
            onChange={(e) => updatePageTitle(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">Content</label>
          <div className="flex space-x-2 mb-2 overflow-x-auto">
            {pages.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentPage(index)}
                className={`px-3 py-1 rounded ${currentPage === index ? 'bg-primary text-white' : 'bg-gray-200'}`}
              >
                Page {index + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={addNewPage}
              className="px-3 py-1 rounded bg-secondary text-white"
            >
              +
            </button>
            {pages.length > 1 && (
              <button
                type="button"
                onClick={removePage}
                className="px-3 py-1 rounded bg-red-500 text-white"
              >
                -
              </button>
            )}
          </div>
          <textarea
            id="content"
            value={pages[currentPage].content}
            onChange={(e) => updatePageContent(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            rows="12"
            maxLength={MAX_CHARS_PER_PAGE}
            required
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
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
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
          <button 
            type="button"
            onClick={() => createPost(false)} 
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary bg-primary bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Save as Draft
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Publish Post
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
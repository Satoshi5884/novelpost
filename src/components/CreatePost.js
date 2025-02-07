import React, { useState, useEffect } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db, auth, getUserAuthorName, getAIAssistUsage, updateAIAssistUsage } from '../firebase';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { validateAndResizeImage, uploadImage, deleteImage, downloadImage } from '../utils/imageUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudBolt } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const MAX_CHARS_PER_PAGE = 10000;
const MAX_IMAGES = 5;

// DOMPurifyの設定を変更して<img-novel>タグを許可
DOMPurify.addHook('uponSanitize', (node) => {
  if (node.tagName === 'IMG-NOVEL') {
    node.setAttribute('data-allowed', 'true');
  }
});

DOMPurify.setConfig({
  ADD_TAGS: ['img-novel'],
  ADD_ATTR: ['id'],
});

const CreatePost = ({ isAuth }) => {
  const [title, setTitle] = useState("");
  const [pages, setPages] = useState([{ title: "", content: "" }]);
  const [currentPage, setCurrentPage] = useState(0);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [coverImageURL, setCoverImageURL] = useState("");
  const [novelImages, setNovelImages] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const navigate = useNavigate();
  const [synopsis, setSynopsis] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiAssistUsage, setAIAssistUsage] = useState(0);

  useEffect(() => {
    if (!isAuth) {
      navigate("/login");
    }
  }, [isAuth, navigate]);

  useEffect(() => {
    const fetchAIAssistUsage = async () => {
      if (auth.currentUser) {
        const usage = await getAIAssistUsage(auth.currentUser.uid);
        setAIAssistUsage(usage);
      }
    };
    fetchAIAssistUsage();
  }, []);

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
    setPages([...pages, { title: "", content: "" }]);
    setCurrentPage(pages.length);
  };

  const deletePage = (index) => {
    if (pages.length > 1) {
      const newPages = pages.filter((_, i) => i !== index);
      setPages(newPages);
      setCurrentPage(Math.min(currentPage, newPages.length - 1));
    } else {
      alert("You cannot delete the last page.");
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

  const handleCoverImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const resizedImage = await validateAndResizeImage(file);
        const imageURL = await uploadImage(resizedImage, `covers/${Date.now()}`);
        setCoverImageURL(imageURL);
      } catch (error) {
        alert(error);
      }
    }
  };

  const handleNovelImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file && novelImages.length < MAX_IMAGES) {
      try {
        const resizedImage = await validateAndResizeImage(file);
        const imageURL = await uploadImage(resizedImage, `novel-images/${Date.now()}`);
        const newImage = { id: Date.now().toString(), url: imageURL };
        setNovelImages(prevImages => [...prevImages, newImage]);
        updatePageContent(pages[currentPage].content + `[novel-image id="${newImage.id}"]`);
      } catch (error) {
        console.error("Error uploading image:", error);
        alert(`Failed to upload image: ${error.message}`);
      }
    } else if (novelImages.length >= MAX_IMAGES) {
      alert(`Maximum ${MAX_IMAGES} images allowed per novel.`);
    }
  };

  const deleteNovelImage = async (imageId) => {
    const imageToDelete = novelImages.find(img => img.id === imageId);
    if (imageToDelete) {
      await deleteImage(imageToDelete.url);
      setNovelImages(novelImages.filter(img => img.id !== imageId));
      updatePageContent(pages[currentPage].content.replace(`<img-novel id="${imageId}" />`, ''));
    }
  };

  const convertNewlinesToBr = (text) => {
    return text.replace(/\n/g, '<br />').replace(/\[novel-image id="(\d+)"\]/g, '<img-novel id="$1" />');
  };

  const createPost = async (isPublished) => {
    try {
      const authorName = await getUserAuthorName(auth.currentUser.uid) || 'Anonymous';
      await addDoc(collection(db, "posts"), {
        title,
        synopsis,
        pages: pages.map(page => ({
          title: page.title,
          content: DOMPurify.sanitize(convertNewlinesToBr(page.content), {
            ALLOW_UNKNOWN_PROTOCOLS: true,
            FORCE_BODY: true,
          }),
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
        coverImageURL,
        novelImages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      navigate("/mypage");
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const generateAIContent = async () => {
    if (aiAssistUsage >= 100) {
      alert('AI Assist使用回数の上限に達しました。明日また使用できます。');
      return;
    }
    setIsGenerating(true);
    try {
      const prompt = `タイトル: ${title}\nページタイトル: ${pages[currentPage].title}\n現在の内容: ${pages[currentPage].content}\n\n約5000文字で物語を続けてください:`;

      const response = await axios.post(
        '/.netlify/functions/generate-ai-content',
        { prompt },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const generatedContent = response.data.content;
      updatePageContent(pages[currentPage].content + '\n\n' + generatedContent);

      await updateAIAssistUsage(auth.currentUser.uid);
      setAIAssistUsage(prevUsage => prevUsage + 1);
    } catch (error) {
      console.error('AIコンテンツ生成エラー:', error.response ? error.response.data : error.message);
      alert('AIによるコンテンツ生成に失敗しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderPreview = () => {
    return (
      <div className="preview-container">
        <h1 className="text-2xl font-bold mb-4">{title}</h1>
        {coverImageURL && <img src={coverImageURL} alt="Cover" className="mb-4 max-w-xs rounded shadow" />}
        {pages.map((page, index) => (
          <div key={index} className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{page.title}</h2>
            <div dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(
                convertNewlinesToBr(page.content).replace(/<img-novel id="(\d+)"(?: \/)?>/g, (match, id) => {
                  const image = novelImages.find(img => img.id === id);
                  return image ? `<img src="${image.url}" alt="Novel image" class="max-w-xs rounded shadow my-2" />` : '';
                }),
                {
                  ALLOW_UNKNOWN_PROTOCOLS: true,
                  FORCE_BODY: true,
                }
              ) 
            }} />
          </div>
        ))}
      </div>
    );
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
          <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700">Cover Image (JPG, max 512x512, max 300kB)</label>
          <input
            type="file"
            id="coverImage"
            accept="image/jpeg,image/png"
            onChange={handleCoverImageUpload}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-primary file:text-white
              hover:file:bg-secondary"
          />
          {coverImageURL && (
            <div className="mt-2">
              <img src={coverImageURL} alt="Cover" className="max-w-xs rounded shadow" />
              <button onClick={() => { setCoverImageURL(""); }} className="mt-2 text-red-500">Delete Cover Image</button>
              <button onClick={() => downloadImage(coverImageURL, "cover_image.jpg")} className="ml-4 text-blue-500">Download Cover Image</button>
            </div>
          )}
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">Content</label>
          <div className="overflow-x-auto">
            <div className="flex space-x-2 mb-2 min-w-max">
              {pages.map((_, index) => (
                <div key={index} className="relative">
                  <button
                    onClick={() => handlePageChange(index)}
                    className={`px-3 py-1 rounded ${currentPage === index ? 'bg-primary text-white' : 'bg-gray-200'}`}
                  >
                    Page {index + 1}
                  </button>
                  {pages.length > 1 && (
                    <button
                      onClick={() => deletePage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >

                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addNewPage}
                className="px-3 py-1 rounded bg-secondary text-white"
              >
                +
              </button>
            </div>
          </div>
          <div className="flex items-center mb-2">
            <input
              type="text"
              value={pages[currentPage].title}
              onChange={(e) => updatePageTitle(e.target.value)}
              placeholder="Page title..."
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm mr-2"
            />
            <button
              onClick={generateAIContent}
              disabled={isGenerating || aiAssistUsage >= 100}
              className={`ml-2 px-3 py-2 ${aiAssistUsage >= 100 ? 'bg-gray-400 cursor-not-allowed' : 'bg-secondary hover:bg-primary'} text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary text-xs whitespace-nowrap relative group`}
              title="AI Assist"
            >
              <FontAwesomeIcon icon={faCloudBolt} className="mr-1" />
              {isGenerating ? 'Gen...' : 'AI'}
            </button>
          </div>
          <textarea
            id="content"
            placeholder="Write your story... (HTML tags are supported)"
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
          <label htmlFor="novelImage" className="block text-sm font-medium text-gray-700">Novel Images (JPG, max 512x512, max 300kB, {MAX_IMAGES} images max)</label>
          <input
            type="file"
            id="novelImage"
            accept="image/jpeg,image/png"
            onChange={handleNovelImageUpload}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-primary file:text-white
              hover:file:bg-secondary"
          />
          <div className="mt-2 grid grid-cols-2 gap-4">
            {novelImages.map((image) => (
              <div key={image.id} className="relative">
                <img src={image.url} alt="Novel" className="max-w-full h-auto rounded shadow" />
                <div className="absolute top-0 left-0 bg-black bg-opacity-50 text-white p-1 rounded">
                  ID: {image.id}
                </div>
                <button onClick={() => deleteNovelImage(image.id)} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded">Delete</button>
                <button onClick={() => downloadImage(image.url, `novel_image_${image.id}.jpg`)} className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded">Download</button>
              </div>
            ))}
          </div>
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
        <div>
          <label htmlFor="synopsis" className="block text-sm font-medium text-gray-700">Synopsis</label>
          <textarea
            id="synopsis"
            placeholder="Synopsis..."
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            rows="3"
          />
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
          >
            {previewMode ? "Edit Mode" : "Preview Mode"}
          </button>
          <button
            onClick={() => createPost(false)}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary bg-primary bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Save as Draft
          </button>
          <button
            onClick={() => createPost(true)}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Publish Post
          </button>
        </div>
      </div>
      {previewMode && (
        <div className="mt-8 border-t pt-8">
          <h2 className="text-2xl font-bold mb-4">Preview</h2>
          {renderPreview()}
        </div>
      )}
    </div>
  );
};

export default CreatePost;

import React, { useState, useEffect } from 'react';
import { storage, db, auth } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const ImageUploader = ({ postId, existingImages, onImageUpload, onImageDelete }) => {
  const [images, setImages] = useState(existingImages || []);

  useEffect(() => {
    setImages(existingImages || []);
  }, [existingImages]);

  const validateImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          if (img.width > 512 || img.height > 512) {
            reject('画像のサイズは512x512以下である必要があります。');
          } else if (file.size > 5 * 1024 * 1024) {
            reject('画像のサイズは5MB以下である必要があります。');
          } else {
            resolve();
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadImage = async (file) => {
    if (!auth.currentUser) {
      alert('画像をアップロードするにはログインが必要です。');
      return;
    }

    if (images.length >= 5) {
      alert('1つの小説につき最大5枚までの画像が許可されています。');
      return;
    }

    try {
      await validateImage(file);
      const imageRef = ref(storage, `covers/${postId}/${Date.now()}_${file.name}`);
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);
      const newImage = { id: imageRef.fullPath, url: downloadURL };
      setImages([...images, newImage]);
      onImageUpload(newImage);

      // Firestoreドキュメントの更新
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        images: arrayUnion(newImage)
      });
    } catch (error) {
      alert(error);
    }
  };

  const deleteImage = async (imageId) => {
    if (!auth.currentUser) {
      alert('画像を削除するにはログインが必要です。');
      return;
    }

    try {
      const imageRef = ref(storage, imageId);
      await deleteObject(imageRef);
      const updatedImages = images.filter(img => img.id !== imageId);
      setImages(updatedImages);
      onImageDelete(imageId);

      // Firestoreドキュメントの更新
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        images: arrayRemove({ id: imageId, url: images.find(img => img.id === imageId).url })
      });
    } catch (error) {
      console.error('画像の削除中にエラーが発生しました:', error);
      alert('画像の削除に失敗しました。もう一度お試しください。');
    }
  };

  const downloadImage = (imageUrl, imageName) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = imageName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="image-uploader">
      <h3>小説内画像 (最大5枚)</h3>
      <input 
        type="file" 
        accept=".jpg,.jpeg" 
        onChange={(e) => uploadImage(e.target.files[0])}
        disabled={images.length >= 5}
      />
      <div className="image-preview">
        {images.map((image, index) => (
          <div key={image.id} className="image-item">
            <img src={image.url} alt={`小説画像 ${index + 1}`} style={{ maxWidth: '100px' }} />
            <button onClick={() => deleteImage(image.id)}>削除</button>
            <button onClick={() => downloadImage(image.url, `novel_image_${index + 1}.jpg`)}>ダウンロード</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageUploader;
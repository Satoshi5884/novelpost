import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

const MAX_IMAGE_SIZE = 512;
const MAX_FILE_SIZE = 400 * 1024; // 400kB

export const validateImage = (file) => {
  return new Promise((resolve, reject) => {
    if (file.type !== 'image/jpeg') {
      reject('Only JPG images are allowed.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      reject('Image size must be 400kB or smaller.');
      return;
    }

    const img = new Image();
    img.onload = () => {
      if (img.width > MAX_IMAGE_SIZE || img.height > MAX_IMAGE_SIZE) {
        reject('Image dimensions must be 512x512 or smaller.');
      } else {
        resolve();
      }
    };
    img.onerror = () => reject('Invalid image file.');
    img.src = URL.createObjectURL(file);
  });
};

export const uploadImage = async (file, path) => {
  await validateImage(file);
  const imageRef = ref(storage, path);
  await uploadBytes(imageRef, file);
  return await getDownloadURL(imageRef);
};

export const deleteImage = async (path) => {
  const imageRef = ref(storage, path);
  await deleteObject(imageRef);
};

export const downloadImage = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
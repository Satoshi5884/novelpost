import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';  // firebase.js ファイルへのパスを適切に調整してください

export const addFavoritesToExistingPosts = async () => {
  const postsRef = collection(db, "posts");
  const q = query(postsRef, where("favorites", "==", null));
  const querySnapshot = await getDocs(q);

  const batch = writeBatch(db);

  querySnapshot.forEach((doc) => {
    batch.update(doc.ref, { favorites: [] });
  });

  await batch.commit();
  console.log("Favorites field added to existing posts");
};
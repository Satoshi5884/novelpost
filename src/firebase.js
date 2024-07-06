
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBDAQ04Uc9nsuGYUJiiapQN0K1oI1VRvIU",
  authDomain: "blog-99919.firebaseapp.com",
  projectId: "blog-99919",
  storageBucket: "blog-99919.appspot.com",
  messagingSenderId: "624125159696",
  appId: "1:624125159696:web:66b5ebe553b52a61271d95"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider, db };
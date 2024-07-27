import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { auth } from './firebase';
import Home from './components/Home';
import CreatePost from './components/CreatePost';
import Login from './components/Login';
import Logout from './components/Logout';
import Navbar from './components/Navbar';
import MyPage from './components/MyPage';
import EditPost from './components/EditPost';
import HelpPage from './components/HelpPage';
import { addFavoritesToExistingPosts } from './utils/updateExistingPosts';

// FontAwesome
import { library } from '@fortawesome/fontawesome-svg-core';
import { faStar as fasStar } from '@fortawesome/free-solid-svg-icons';
import { faStar as farStar } from '@fortawesome/free-regular-svg-icons';

library.add(fasStar, farStar);

function App() {
  const [isAuth, setIsAuth] = useState(localStorage.getItem('isAuth') === 'true');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsAuth(true);
        localStorage.setItem('isAuth', 'true');
      } else {
        setIsAuth(false);
        localStorage.setItem('isAuth', 'false');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const updatePosts = async () => {
      if (isAuth) {
        try {
          await addFavoritesToExistingPosts();
          console.log('Favorites field added to existing posts successfully');
        } catch (error) {
          console.error('Error adding favorites field to existing posts:', error);
        }
      }
    };
    updatePosts();
  }, [isAuth]);

  return (
    <Router>
      <div className="App">
        <Navbar isAuth={isAuth} />
        <Routes>
          <Route path="/" element={<Home isAuth={isAuth} />} />
          <Route path="/createpost" element={<CreatePost isAuth={isAuth} />} />
          <Route path="/login" element={<Login setIsAuth={setIsAuth} />} />
          <Route path="/logout" element={<Logout setIsAuth={setIsAuth} />} />
          <Route path="/mypage" element={<MyPage isAuth={isAuth} />} />
          <Route path="/edit/:id" element={<EditPost isAuth={isAuth} />} />
          <Route path="/help" element={<HelpPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
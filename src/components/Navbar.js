import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faFile, faUser, faQuestion } from '@fortawesome/free-solid-svg-icons';

const Navbar = ({ isAuth }) => {
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-primary">NovelPost</Link>
          </div>
          <div className="flex items-center">
            <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 group relative">
              <FontAwesomeIcon icon={faHouse} />
              <span className="group-hover:opacity-100 transition-opacity bg-gray-800 px-1 text-sm text-gray-100 rounded-md absolute left-1/2 -translate-x-1/2 translate-y-full opacity-0 m-4 mx-auto">Home</span>
            </Link>
            {!isAuth ? (
              <Link to="/login" className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-secondary">Login</Link>
            ) : (
              <>
                <Link to="/createpost" className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 group relative">
                  <FontAwesomeIcon icon={faFile} />
                  <span className="group-hover:opacity-100 transition-opacity bg-gray-800 px-1 text-sm text-gray-100 rounded-md absolute left-1/2 -translate-x-1/2 translate-y-full opacity-0 m-4 mx-auto">Create Post</span>
                </Link>
                <Link to="/mypage" className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 group relative">
                  <FontAwesomeIcon icon={faUser} />
                  <span className="group-hover:opacity-100 transition-opacity bg-gray-800 px-1 text-sm text-gray-100 rounded-md absolute left-1/2 -translate-x-1/2 translate-y-full opacity-0 m-4 mx-auto">My Page</span>
                </Link>
                <Link to="/help" className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 group relative">
                  <FontAwesomeIcon icon={faQuestion} />
                  <span className="group-hover:opacity-100 transition-opacity bg-gray-800 px-1 text-sm text-gray-100 rounded-md absolute left-1/2 -translate-x-1/2 translate-y-full opacity-0 m-4 mx-auto">Help</span>
                </Link>
                <Link to="/logout" className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-secondary">Logout</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
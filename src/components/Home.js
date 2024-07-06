import React, { useEffect, useState } from 'react'
import './Home.css'
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const Home = () => {

const [postList, setPostList] = useState([])

  useEffect(() => {
    const getPosts = async() => {
      const data = await getDocs(collection(db, 'posts'))
      //console.log(data)
      //console.log(data.docs)
      //console.log(data.docs.map(doc => ({doc})))
      //console.log(data.docs.map(doc => ({...doc.data(), id: doc.id})))
      setPostList(data.docs.map(doc => ({...doc.data(), id: doc.id})))
    }
    getPosts()
   }, [])

  const handleDelete = async(id) => {
    try {
      await deleteDoc(doc(db, 'posts', id))
      window.location.href = '/'
      // 削除後、投稿リストを更新
      setPostList(postList.filter(post => post.id !== id))
    } catch (error) {
      console.error("Error deleting document: ", error)
    }
  }

  return (
    <div className='homePage'>
      {postList.map((post) => {
        return (
          <div className='postContents' key={post.id}>
            <div className='postHeader'>
              <h1>{post.title}</h1>
           </div>
  
          <div className='postTextContainer'>{post.postText}</div>
          <div className='nameAndDeleteButton'>
            <h3>@{post.author.username}</h3>
            {post.author.id === auth.currentUser?.uid &&  (
              <button onClick={() => handleDelete(post.id)}>削除</button>
            )}
          </div>
        </div>
      )
    })}

    </div>
  )
}

export default Home
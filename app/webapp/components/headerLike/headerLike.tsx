"use client";

import { useState } from "react";
import { MdArrowBack, MdFavorite } from "react-icons/md";
import styles from "./headerLike.module.scss"; // Use .module.scss

const HeaderLike = () => {
  const [likes, setLikes] = useState(0);

  const handleBackClick = () => {
    // Navegar para a página anterior
    window.history.back();
  };

  const handleLikeClick = () => {
    // Incrementar o número de likes
    setLikes(likes + 1);
  };

  return (
    <div className={styles.headerLike}>
      <button className={styles.backButton} onClick={handleBackClick}>
        <MdArrowBack size={24} />
      </button>
      <button className={styles.likeButton} onClick={handleLikeClick}>
        <MdFavorite size={24} />
        <span className={styles.likeCount}>{likes}</span>
      </button>
    </div>
  );
};

export default HeaderLike;

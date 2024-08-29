"use client";

import { useState, useEffect } from "react";
import { MdArrowBack, MdNotifications } from "react-icons/md";
import styles from "./headerNotification.module.scss";

const HeaderNotification = () => {
  const [likes, setLikes] = useState(0);
  const [router, setRouter] = useState(null);

  useEffect(() => {
    // Verifica se está no lado do cliente e inicializa o router
    import("next/router").then((mod) => setRouter(mod.useRouter()));
  }, []);

  const handleBackClick = () => {
    window.history.back();
  };

  const handleNotificationClick = () => {
    if (router) {
      router.push("/notifications");
    }
  };

  return (
    <div className={styles.headerLike}>
      <button className={styles.backButton} onClick={handleBackClick}>
        <MdArrowBack size={24} />
      </button>
      <div className={styles.notificationContainer} onClick={handleNotificationClick}>
        <svg
          stroke="currentColor"
          fill="currentColor"
          strokeWidth="0"
          viewBox="0 0 24 24"
          className="text-gray-600 text-3xl cursor-pointer"
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"></path>
        </svg>
      </div>
    </div>
  );
};

export default HeaderNotification;

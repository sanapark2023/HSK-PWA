import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBp_23RUeWCUjziHfGi9gDIOmzB8-3gQiM",
  authDomain: "chinese-vocab-app-113d0.firebaseapp.com",
  databaseURL: "https://chinese-vocab-app-113d0-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chinese-vocab-app-113d0",
  storageBucket: "chinese-vocab-app-113d0.firebasestorage.app",
  messagingSenderId: "677244705660",
  appId: "1:677244705660:web:cf3181ed0a09a93fbe22f9",
  measurementId: "G-KF1N4QH1X0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 햄버거 메뉴 토글
document.querySelector(".hamburger")?.addEventListener("click", () => {
  document.querySelector(".menu").classList.toggle("show");
});

// 로그인 상태에 따라 메뉴 조정
onAuthStateChanged(auth, (user) => {
  const loginMenu = document.getElementById("menu-login");
  const mypageMenu = document.getElementById("menu-mypage");
  const logoutMenu = document.getElementById("menu-logout");

  if (user && user.emailVerified) {
    loginMenu.style.display = "none";
    mypageMenu.style.display = "list-item";
    logoutMenu.style.display = "list-item";
  } else {
    loginMenu.style.display = "list-item";
    mypageMenu.style.display = "none";
    logoutMenu.style.display = "none";
  }
});

// 로그아웃 처리
let isLoggingOut = false;
document.addEventListener("click", async (e) => {
  if (e.target.id === "logout-btn") {
    isLoggingOut = true;
    await signOut(auth);
    alert("로그아웃되었습니다.");
    window.location.href = "auth.html";
  }
});

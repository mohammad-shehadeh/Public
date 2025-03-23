import { 
  initializeApp 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// إعداد Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBP2bnt1DNNUO0dFtfiIovxMG-NM6yXPMM",
  authDomain: "aasa-8a079.firebaseapp.com",
  projectId: "aasa-8a079",
  storageBucket: "aasa-8a079.appspot.com",
  messagingSenderId: "849330713582",
  appId: "1:849330713582:web:7a11b11ebdb5cdcc8b14ff"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- تبديل واجهة المستخدم بين تسجيل الدخول والمحتوى الرئيسي ---
function toggleUI(isLoggedIn) {
  document.getElementById("login-container").style.display = isLoggedIn ? "none" : "block";
  document.getElementById("main-content").style.display = isLoggedIn ? "block" : "none";
}

// --- التحقق من الجلسة عند تحميل الصفحة ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    toggleUI(true);
  } else {
    toggleUI(false);
  }
});

// --- زر تسجيل الدخول ---
document.getElementById("login-button").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorMessage = document.getElementById("email-error");
  errorMessage.style.display = "none";

  if (!email || !password) {
    errorMessage.innerText = "يرجى إدخال البريد الإلكتروني وكلمة المرور";
    errorMessage.style.display = "block";
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    toggleUI(true);
  } catch (error) {
    errorMessage.innerText = "خطأ في تسجيل الدخول: " + error.message;
    errorMessage.style.display = "block";
  }
});

// --- زر تسجيل الخروج ---
document.getElementById("logout-button")?.addEventListener("click", async () => {
  if (auth.currentUser) {
    try {
      await signOut(auth);
      toggleUI(false);
    } catch (error) {
      console.error("حدث خطأ أثناء تسجيل الخروج:", error);
    }
  }
});

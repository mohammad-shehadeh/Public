import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// إعداد Firebase - استبدل القيم التالية بقيم مشروعك
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

// دالة لتوليد معرف جلسة فريد (Session ID)
function generateSessionId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 5);
}

let currentSessionId = null;

// التحقق مما إذا كان المستخدم مسجلاً للدخول من جهاز آخر
async function isUserLoggedIn(uid) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() && userSnap.data().isLoggedIn && userSnap.data().sessionId;
}

// تسجيل الدخول
async function login() {
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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data().isLoggedIn && userSnap.data().sessionId) {
      errorMessage.innerText = "هذا الحساب مفتوح بالفعل على جهاز آخر.";
      errorMessage.style.display = "block";
      await signOut(auth);
      return;
    }
    
    currentSessionId = generateSessionId();
    await setDoc(userRef, { isLoggedIn: true, sessionId: currentSessionId }, { merge: true });

    const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
      if (docSnapshot.exists() && docSnapshot.data().sessionId !== currentSessionId) {
        alert("تم تسجيل الدخول من جهاز آخر. سيتم تسجيل خروجك.");
        signOut(auth);
        unsubscribe();
      }
    });

    document.getElementById("login-container").style.display = "none";
    document.getElementById("welcome-container").style.display = "block";
  } catch (error) {
    errorMessage.innerText = "خطأ: " + error.message;
    errorMessage.style.display = "block";
  }
}

document.getElementById("email-login").addEventListener("click", login);

document.getElementById("logout").addEventListener("click", async () => {
  const user = auth.currentUser;
  if (user) {
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, { isLoggedIn: false, sessionId: "" }, { merge: true });
    await signOut(auth);
    document.getElementById("login-container").style.display = "block";
    document.getElementById("welcome-container").style.display = "none";
  }
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && userSnap.data().isLoggedIn && userSnap.data().sessionId) {
      currentSessionId = userSnap.data().sessionId;
      document.getElementById("login-container").style.display = "none";
      document.getElementById("welcome-container").style.display = "block";
      
      onSnapshot(userRef, (docSnapshot) => {
        if (docSnapshot.exists() && docSnapshot.data().sessionId !== currentSessionId) {
          alert("تم تسجيل الدخول من جهاز آخر. سيتم تسجيل خروجك.");
          signOut(auth);
        }
      });
    } else {
      await signOut(auth);
      document.getElementById("login-container").style.display = "block";
      document.getElementById("welcome-container").style.display = "none";
    }
  } else {
    document.getElementById("login-container").style.display = "block";
    document.getElementById("welcome-container").style.display = "none";
  }
});

window.addEventListener("beforeunload", async () => {
  const user = auth.currentUser;
  if (user) {
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { isLoggedIn: false, sessionId: "" });
    await signOut(auth);
  }
});

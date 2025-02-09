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

// متغير لتخزين Session ID الخاص بالجلسة الحالية
let currentSessionId = null;

// دالة للتحقق مما إذا كان المستخدم مسجلاً للدخول من جهاز آخر
async function isUserLoggedIn(uid) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() && userSnap.data().isLoggedIn && userSnap.data().sessionId;
}

// تأكد من تحميل عناصر DOM قبل تثبيت الأحداث
window.addEventListener('DOMContentLoaded', () => {
  const emailLoginButton = document.getElementById("email-login");
  const logoutButton = document.getElementById("logout");
  const loginContainer = document.getElementById("login-container");
  const welcomeContainer = document.getElementById("welcome-container");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const errorMessage = document.getElementById("email-error");

  if (!emailLoginButton) {
    console.error("زر تسجيل الدخول غير موجود في الصفحة.");
    return;
  }

  // عند الضغط على زر تسجيل الدخول
  emailLoginButton.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    errorMessage.style.display = "none";
    
    if (!email || !password) {
      errorMessage.innerText = "يرجى إدخال البريد الإلكتروني وكلمة المرور";
      errorMessage.style.display = "block";
      return;
    }
    
    try {
      // محاولة تسجيل الدخول باستخدام Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
  
      // إذا كان الحساب مفتوحًا على جهاز آخر، يتم رفض تسجيل الدخول
      if (userSnap.exists() && userSnap.data().isLoggedIn && userSnap.data().sessionId) {
        errorMessage.innerText = "هذا الحساب مفتوح بالفعل على جهاز آخر.";
        errorMessage.style.display = "block";
        await signOut(auth);
        return;
      }
      
      // إنشاء وتخزين Session ID جديد وتحديث حالة تسجيل الدخول في Firestore
      currentSessionId = generateSessionId();
      await setDoc(userRef, { isLoggedIn: true, sessionId: currentSessionId }, { merge: true });
  
      // تعيين مراقبة (onSnapshot) على مستند المستخدم لمتابعة أي تغيير في Session ID
      const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
        if (docSnapshot.exists() && docSnapshot.data().sessionId !== currentSessionId) {
          alert("تم تسجيل الدخول من جهاز آخر. سيتم تسجيل خروجك.");
          signOut(auth);
          unsubscribe();
        }
      });
  
      // إخفاء نموذج تسجيل الدخول وعرض شاشة الترحيب
      loginContainer.style.display = "none";
      welcomeContainer.style.display = "block";
    } catch (error) {
      errorMessage.innerText = "خطأ: " + error.message;
      errorMessage.style.display = "block";
    }
  });
  
  // حدث لتسجيل الخروج (اختياري)
  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, { isLoggedIn: false, sessionId: "" }, { merge: true });
        await signOut(auth);
        loginContainer.style.display = "block";
        welcomeContainer.style.display = "none";
      }
    });
  }
  
  // التحقق من حالة تسجيل الدخول عند تحميل الصفحة
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && userSnap.data().isLoggedIn && userSnap.data().sessionId) {
        currentSessionId = userSnap.data().sessionId;
        loginContainer.style.display = "none";
        welcomeContainer.style.display = "block";
        
        // مراقبة مستند المستخدم للتأكد من استمرار صلاحية الجلسة
        onSnapshot(userRef, (docSnapshot) => {
          if (docSnapshot.exists() && docSnapshot.data().sessionId !== currentSessionId) {
            alert("تم تسجيل الدخول من جهاز آخر. سيتم تسجيل خروجك.");
            signOut(auth);
          }
        });
      } else {
        await signOut(auth);
        loginContainer.style.display = "block";
        welcomeContainer.style.display = "none";
      }
    } else {
      loginContainer.style.display = "block";
      welcomeContainer.style.display = "none";
    }
  });
});

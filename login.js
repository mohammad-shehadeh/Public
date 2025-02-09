import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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

async function isUserLoggedIn(uid) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() && userSnap.data().isLoggedIn;
}

// إخفاء الموقع عند التحميل
document.getElementById("main-content").style.display = "none";

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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (await isUserLoggedIn(user.uid)) {
      errorMessage.innerText = "هذا الحساب مفتوح بالفعل على جهاز آخر.";
      errorMessage.style.display = "block";
      
      // تسجيل خروج تلقائي للمستخدم الجديد إذا كان الحساب مفتوحًا
      await signOut(auth);
      return;
    }

    // تسجيل الدخول وتحديث حالة المستخدم في Firestore
    await setDoc(doc(db, "users", user.uid), { isLoggedIn: true }, { merge: true });

    // عرض الموقع بعد تسجيل الدخول
    document.getElementById("login-container").style.display = "none";
    document.getElementById("main-content").style.display = "block";
  } catch (error) {
    errorMessage.innerText = "خطأ: " + error.message;
    errorMessage.style.display = "block";
  }
});

// التحقق من حالة تسجيل الدخول عند تحميل الصفحة
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data().isLoggedIn) {
      document.getElementById("login-container").style.display = "none";
      document.getElementById("main-content").style.display = "block";
    } else {
      // تسجيل خروج تلقائي إذا لم يتم العثور على بيانات المستخدم أو كان تسجيل الدخول غير نشط
      await signOut(auth);
      document.getElementById("login-container").style.display = "block";
      document.getElementById("main-content").style.display = "none";
    }
  } else {
    document.getElementById("login-container").style.display = "block";
    document.getElementById("main-content").style.display = "none";
  }
});

// تسجيل خروج المستخدم عند إغلاق الصفحة أو الخروج
window.addEventListener("beforeunload", async () => {
  const user = auth.currentUser;
  if (user) {
    await updateDoc(doc(db, "users", user.uid), { isLoggedIn: false });
    await signOut(auth);
  }
});

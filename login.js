import { 
  initializeApp 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  setPersistence,
  browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
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

// الحفاظ على تسجيل الدخول حتى بعد إغلاق المتصفح
setPersistence(auth, browserLocalPersistence).catch(error => {
  console.error("خطأ أثناء تفعيل حفظ الجلسة:", error);
});

/**
 * التحقق مما إذا كان المستخدم مسجلاً في قاعدة البيانات
 */
async function isUserLoggedIn(uid) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() && userSnap.data().isLoggedIn;
}

// عرض أو إخفاء عناصر الصفحة بناءً على تسجيل الدخول
function toggleUI(isLoggedIn) {
  if (isLoggedIn) {
    document.getElementById("login-container").style.display = "none";
    document.getElementById("main-content").style.display = "block";
  } else {
    document.getElementById("login-container").style.display = "block";
    document.getElementById("main-content").style.display = "none";
  }
}

// التحقق من حالة تسجيل الدخول عند تحميل الصفحة
onAuthStateChanged(auth, async (user) => {
  if (user && await isUserLoggedIn(user.uid)) {
    toggleUI(true);
  } else {
    toggleUI(false);
  }
});

// معالجة تسجيل الدخول
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
      return;
    }

    await setDoc(doc(db, "users", user.uid), { isLoggedIn: true });
    toggleUI(true);
  } catch (error) {
    errorMessage.innerText = "خطأ: " + error.message;
    errorMessage.style.display = "block";
  }
});

// زر تسجيل الخروج
document.getElementById("logout-button")?.addEventListener("click", async () => {
  if (auth.currentUser) {
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), { isLoggedIn: false });
      await signOut(auth);
      toggleUI(false);
    } catch (error) {
      console.error("خطأ أثناء تسجيل الخروج:", error);
    }
  }
});

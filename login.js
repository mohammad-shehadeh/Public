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

// تحديد الـ persistence إلى "local" ليبقى المستخدم مسجلاً حتى بعد إعادة تحميل الصفحة
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("حدث خطأ أثناء إعداد الـ persistence:", error);
  });

/**
 * دالة للتحقق من حالة المستخدم في قاعدة البيانات (على سبيل المثال لمنع تسجيل الدخول المتزامن على أجهزة متعددة)
 */
async function isUserLoggedIn(uid) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() && userSnap.data().isLoggedIn;
}

// إخفاء المحتوى الرئيسي عند تحميل الصفحة
document.getElementById("main-content").style.display = "none";

// معالج حدث زر تسجيل الدخول
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
    // محاولة تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // التحقق مما إذا كان الحساب مفتوحاً على جهاز آخر
    if (await isUserLoggedIn(user.uid)) {
      errorMessage.innerText = "هذا الحساب مفتوح بالفعل على جهاز آخر.";
      errorMessage.style.display = "block";
      return;
    }

    // عند نجاح تسجيل الدخول، يتم تحديث حالة المستخدم في قاعدة البيانات إلى true
    await setDoc(doc(db, "users", user.uid), { isLoggedIn: true });

    // إخفاء واجهة تسجيل الدخول وعرض المحتوى الرئيسي
    document.getElementById("login-container").style.display = "none";
    document.getElementById("main-content").style.display = "block";
  } catch (error) {
    errorMessage.innerText = "خطأ: " + error.message;
    errorMessage.style.display = "block";
  }
});

// معالج حدث زر تسجيل الخروج
// تأكد من وجود عنصر في HTML بالمعرف "logout-button" داخل المحتوى الرئيسي
document.getElementById("logout-button").addEventListener("click", async () => {
  if (auth.currentUser) {
    try {
      // تحديث حالة المستخدم في قاعدة البيانات إلى false
      await setDoc(doc(db, "users", auth.currentUser.uid), { isLoggedIn: false });
      // تسجيل خروج المستخدم من Firebase
      await signOut(auth);
      // عرض واجهة تسجيل الدخول وإخفاء المحتوى الرئيسي
      document.getElementById("login-container").style.display = "block";
      document.getElementById("main-content").style.display = "none";
    } catch (error) {
      console.error("حدث خطأ أثناء تسجيل الخروج:", error);
    }
  }
});

// الاستماع لتغييرات حالة تسجيل الدخول
onAuthStateChanged(auth, (user) => {
  if (user) {
    // إذا كان المستخدم مسجلاً، يتم عرض المحتوى الرئيسي وإخفاء واجهة تسجيل الدخول
    document.getElementById("login-container").style.display = "none";
    document.getElementById("main-content").style.display = "block";
  } else {
    // إذا لم يكن المستخدم مسجلاً، يتم عرض واجهة تسجيل الدخول وإخفاء المحتوى الرئيسي
    document.getElementById("login-container").style.display = "block";
    document.getElementById("main-content").style.display = "none";
  }
});

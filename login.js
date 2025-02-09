import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut, 
  setPersistence, 
  browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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

// دالة للتحقق من حالة تسجيل الدخول في قاعدة البيانات
async function isUserLoggedIn(uid) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() && userSnap.data().isLoggedIn;
}

// إخفاء المحتوى الرئيسي عند تحميل الصفحة
document.getElementById("main-content").style.display = "none";

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
    // تعيين الـ persistence لجعل جلسة تسجيل الدخول دائمة (حتى بعد تحديث الصفحة)
    await setPersistence(auth, browserLocalPersistence);

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // التحقق من عدم وجود جلسة نشطة على جهاز آخر
    if (await isUserLoggedIn(user.uid)) {
      await signOut(auth);
      errorMessage.innerText = "هذا الحساب مفتوح بالفعل على جهاز آخر.";
      errorMessage.style.display = "block";
      return;
    }

    // تحديث حالة المستخدم في قاعدة البيانات
    await setDoc(doc(db, "users", user.uid), { 
      isLoggedIn: true,
      lastLogin: new Date() 
    }, { merge: true });

    // عرض المحتوى الرئيسي وإخفاء واجهة تسجيل الدخول
    document.getElementById("login-container").style.display = "none";
    document.getElementById("main-content").style.display = "block";
  } catch (error) {
    errorMessage.innerText = "خطأ: " + error.message;
    errorMessage.style.display = "block";
  }
});

// معالجة تسجيل الخروج
document.getElementById("logout-button").addEventListener("click", async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      await setDoc(doc(db, "users", user.uid), { isLoggedIn: false }, { merge: true });
    }
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
  }
});

// متابعة حالة المصادقة (عند تحميل الصفحة أو تغيير حالة الجلسة)
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      // التحقق من مطابقة حالة الجلسة في قاعدة البيانات
      const loggedIn = await isUserLoggedIn(user.uid);
      
      if (!loggedIn) {
        await signOut(auth);
        return;
      }

      // تحديث وقت النشاط
      await setDoc(doc(db, "users", user.uid), { 
        lastActivity: new Date() 
      }, { merge: true });

      // عرض المحتوى الرئيسي
      document.getElementById("login-container").style.display = "none";
      document.getElementById("main-content").style.display = "block";
    } catch (error) {
      console.error("Error checking login status:", error);
    }
  } else {
    // إعادة عرض واجهة تسجيل الدخول عند عدم وجود مستخدم
    document.getElementById("login-container").style.display = "block";
    document.getElementById("main-content").style.display = "none";
  }
});

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

/**
 * دالة للتحقق مما إذا كان سجل المستخدم في Firestore يُشير إلى أن الحساب مسجّل الدخول.
 * إذا لم يوجد السجل، يمكنك اعتبار أن المستخدم لم يفتح جلسة على جهاز آخر.
 */
async function isUserLoggedIn(uid) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() && userSnap.data().isLoggedIn;
}

// إخفاء المحتوى الرئيسي حتى يتم التأكد من حالة المصادقة
document.getElementById("main-content").style.display = "none";

// معالجة عملية تسجيل الدخول عند الضغط على زر "login-button"
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
    // تعيين طريقة حفظ الجلسة لتكون دائمة حتى بعد تحديث الصفحة
    await setPersistence(auth, browserLocalPersistence);
    
    // محاولة تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // التحقق من أن الحساب غير مفتوح على جهاز آخر
    if (await isUserLoggedIn(user.uid)) {
      await signOut(auth);
      errorMessage.innerText = "هذا الحساب مفتوح بالفعل على جهاز آخر.";
      errorMessage.style.display = "block";
      return;
    }

    // تحديث سجل المستخدم في قاعدة البيانات: تفعيل حالة تسجيل الدخول وتحديث وقت تسجيل الدخول
    await setDoc(doc(db, "users", user.uid), { 
      isLoggedIn: true,
      lastLogin: new Date() 
    }, { merge: true });

    // إخفاء واجهة تسجيل الدخول وعرض المحتوى الرئيسي
    document.getElementById("login-container").style.display = "none";
    document.getElementById("main-content").style.display = "block";
  } catch (error) {
    errorMessage.innerText = "خطأ: " + error.message;
    errorMessage.style.display = "block";
  }
});

// معالجة تسجيل الخروج عند الضغط على زر "logout-button"
document.getElementById("logout-button").addEventListener("click", async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      // تحديث سجل المستخدم في Firestore لتفعيل حالة تسجيل الخروج
      await setDoc(doc(db, "users", user.uid), { isLoggedIn: false }, { merge: true });
    }
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
  }
});

// متابعة حالة المصادقة (يتم استدعاؤها عند تحميل الصفحة أو عند تغيير حالة الجلسة)
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      // عند تحديث الصفحة، إذا كان المستخدم مسجّلًا في Firebase Auth،
      // نقوم فقط بتحديث وقت النشاط (lastActivity) وعرض المحتوى الرئيسي.
      await setDoc(doc(db, "users", user.uid), { 
        lastActivity: new Date() 
      }, { merge: true });
      
      document.getElementById("login-container").style.display = "none";
      document.getElementById("main-content").style.display = "block";
    } catch (error) {
      console.error("Error updating lastActivity:", error);
    }
  } else {
    // إذا لم يكن هناك مستخدم مسجّل، يتم عرض واجهة تسجيل الدخول
    document.getElementById("login-container").style.display = "block";
    document.getElementById("main-content").style.display = "none";
  }
});

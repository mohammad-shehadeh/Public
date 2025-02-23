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

// --- دوال إدارة الجلسة ---
function setLocalSessionId(sessionId) {
  localStorage.setItem("currentSessionId", sessionId);
}

function getLocalSessionId() {
  return localStorage.getItem("currentSessionId");
}

function clearLocalSessionId() {
  localStorage.removeItem("currentSessionId");
}

// دالة لإنشاء معرف جلسة فريد بناءً على توقيت الجهاز
function generateSessionId() {
  return Date.now().toString() + Math.random().toString(36).substring(2);
}

// --- التحقق من حالة تسجيل المستخدم على جهاز آخر ---
async function isUserAlreadyLoggedIn(uid) {
  const userDoc = await getDoc(doc(db, "users", uid));
  return userDoc.exists() && userDoc.data().sessionId; 
}

// --- تبديل واجهة المستخدم بين تسجيل الدخول والمحتوى الرئيسي ---
function toggleUI(isLoggedIn) {
  document.getElementById("loading-screen").style.display = "none";
  document.getElementById("login-container").style.display = isLoggedIn ? "none" : "block";
  document.getElementById("main-content").style.display = isLoggedIn ? "block" : "none";
}

// --- التحقق من الجلسة عند تحميل الصفحة ---
onAuthStateChanged(auth, async (user) => {
  try {
    if (user) {
      let localSession = getLocalSessionId();
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists() && userDoc.data().sessionId) {
        if (!localSession || localSession !== userDoc.data().sessionId) {
          alert("تم تسجيل الدخول على جهاز آخر");
          await signOut(auth);
          toggleUI(false);
          return;
        }
      } else {
        const sessionId = generateSessionId();
        setLocalSessionId(sessionId);
        await setDoc(doc(db, "users", user.uid), { sessionId }, { merge: true });
      }
      toggleUI(true);
    } else {
      clearLocalSessionId();
      toggleUI(false);
    }
  } catch (error) {
    console.error("Error:", error);
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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // التحقق مما إذا كان الحساب مستخدم بالفعل في جهاز آخر
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists() && userDoc.data().sessionId) {
      errorMessage.innerText = "هذا الحساب مستخدم بالفعل على جهاز آخر، لا يمكنك تسجيل الدخول.";
      errorMessage.style.display = "block";
      await signOut(auth);
      return;
    }

    // إذا لم يكن مسجلاً دخول مسبقًا، يتم إنشاء sessionId للجهاز الحالي فقط
    const sessionId = generateSessionId();
    setLocalSessionId(sessionId);
    await setDoc(doc(db, "users", user.uid), { sessionId: sessionId }, { merge: true });

    toggleUI(true);
  } catch (error) {
    errorMessage.innerText = "البريد الإلكتروني الذي أدخلته غير صحيح، أو أن كلمة المرور غير مطابقة.: " + error.message;
    errorMessage.style.display = "block";
  }
});

// --- زر تسجيل الخروج ---
document.getElementById("logout-button")?.addEventListener("click", async () => {
  if (auth.currentUser) {
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), { sessionId: "" }, { merge: true });
      clearLocalSessionId();
      await signOut(auth);
      toggleUI(false);
    } catch (error) {
      console.error("حدث خطأ أثناء تسجيل الخروج:", error);
    }
  }
});

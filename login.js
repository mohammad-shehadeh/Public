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
  getDoc, 
  onSnapshot 
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

// تفعيل حفظ الجلسة حتى بعد إعادة تحميل الصفحة
setPersistence(auth, browserLocalPersistence).catch(error => {
  console.error("خطأ أثناء تفعيل حفظ الجلسة:", error);
});

// --- دوال للتعامل مع معرّف الجلسة ---
function setLocalSessionId(sessionId) {
  localStorage.setItem("currentSessionId", sessionId);
}

function getLocalSessionId() {
  return localStorage.getItem("currentSessionId");
}

function clearLocalSessionId() {
  localStorage.removeItem("currentSessionId");
}

// دالة لتوليد معرّف جلسة فريد
function generateSessionId() {
  return Date.now().toString() + Math.random().toString(36).substring(2);
}

// --- التحقق من تسجيل الدخول لمنع الحساب من تسجيل الدخول على أكثر من جهاز ---
async function isUserAlreadyLoggedIn(uid) {
  const userDoc = await getDoc(doc(db, "users", uid));
  return userDoc.exists() && userDoc.data().sessionId; // إذا كان هناك sessionId، فهذا يعني أن المستخدم مسجل دخول بالفعل
}

// --- دالة لتبديل واجهة المستخدم ---
function toggleUI(isLoggedIn) {
  if (isLoggedIn) {
    document.getElementById("login-container").style.display = "none";
    document.getElementById("main-content").style.display = "block";
  } else {
    document.getElementById("login-container").style.display = "block";
    document.getElementById("main-content").style.display = "none";
  }
}

// --- التحقق من حالة تسجيل الدخول عند تحميل الصفحة ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    let localSession = getLocalSessionId();
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (userDoc.exists() && userDoc.data().sessionId) {
      if (!localSession || localSession !== userDoc.data().sessionId) {
        alert("هذا الحساب مستخدم بالفعل على جهاز آخر، لا يمكنك تسجيل الدخول.");
        await signOut(auth);
        toggleUI(false);
        return;
      }
    } else {
      // في حالة عدم وجود sessionId في قاعدة البيانات، قم بتعيينه لهذا الجهاز
      localSession = generateSessionId();
      setLocalSessionId(localSession);
      await setDoc(doc(db, "users", user.uid), { sessionId: localSession }, { merge: true });
    }

    toggleUI(true);
  } else {
    clearLocalSessionId();
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

    // التحقق مما إذا كان المستخدم مسجلاً دخول مسبقًا على جهاز آخر
    if (await isUserAlreadyLoggedIn(user.uid)) {
      errorMessage.innerText = "هذا الحساب مسجل دخول بالفعل على جهاز آخر، لا يمكنك تسجيل الدخول.";
      errorMessage.style.display = "block";
      await signOut(auth);
      return;
    }

    // تسجيل الدخول على الجهاز الحالي فقط
    const sessionId = generateSessionId();
    setLocalSessionId(sessionId);
    await setDoc(doc(db, "users", user.uid), { sessionId: sessionId }, { merge: true });

    toggleUI(true);
  } catch (error) {
    errorMessage.innerText = "خطأ: " + error.message;
    errorMessage.style.display = "block";
  }
});

// --- زر تسجيل الخروج ---
document.getElementById("logout-button")?.addEventListener("click", async () => {
  if (auth.currentUser) {
    try {
      // إزالة sessionId من قاعدة البيانات
      await setDoc(doc(db, "users", auth.currentUser.uid), { sessionId: "" }, { merge: true });
      clearLocalSessionId();
      await signOut(auth);
      toggleUI(false);
    } catch (error) {
      console.error("حدث خطأ أثناء تسجيل الخروج:", error);
    }
  }
});

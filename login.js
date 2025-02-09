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

// دالة لتوليد معرّف جلسة فريد (يمكنك تحسينها أو استخدام مكتبة للتوليد)
function generateSessionId() {
  return Date.now().toString() + Math.random().toString(36).substring(2);
}

// متغيرات لتخزين معرّف الجلسة الحالي ووظيفة إلغاء مراقبة التغييرات (listener)
let currentSessionId = null;
let sessionListenerUnsubscribe = null;

// --- دالة لمراقبة تغييرات الجلسة من خلال Firestore ---
// إذا تغيّر معرّف الجلسة في قاعدة البيانات (أي تم تسجيل الدخول من جهاز آخر)
// يتم تسجيل خروج هذا الجهاز تلقائيًا
function startSessionListener(user) {
  const userDocRef = doc(db, "users", user.uid);
  // إذا كان هناك مراقب سابق، قم بإلغائه
  if (sessionListenerUnsubscribe) {
    sessionListenerUnsubscribe();
  }
  sessionListenerUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      // إذا كان معرّف الجلسة في قاعدة البيانات لا يتطابق مع معرّف الجلسة الحالي:
      if (data.sessionId && data.sessionId !== currentSessionId) {
        alert("تم تسجيل الدخول من جهاز آخر، سيتم تسجيل خروجك الآن.");
        // إلغاء المراقبة وتسجيل الخروج
        if (sessionListenerUnsubscribe) sessionListenerUnsubscribe();
        clearLocalSessionId();
        signOut(auth).then(() => {
          toggleUI(false);
        });
      }
    }
  });
}

// --- دالة لتبديل واجهة المستخدم بناءً على حالة تسجيل الدخول ---
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
    // محاولة استعادة معرّف الجلسة من المتصفح
    let localSession = getLocalSessionId();
    if (!localSession) {
      // إذا لم يكن موجودًا في localStorage، نحاول قراءته من قاعدة البيانات
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().sessionId) {
        localSession = userDoc.data().sessionId;
        setLocalSessionId(localSession);
      } else {
        // وإن لم يكن موجودًا، نقوم بتوليد معرّف جلسة جديد وتخزينه
        localSession = generateSessionId();
        setLocalSessionId(localSession);
        await setDoc(doc(db, "users", user.uid), { isLoggedIn: true, sessionId: localSession }, { merge: true });
      }
    }
    currentSessionId = localSession;
    startSessionListener(user);
    toggleUI(true);
  } else {
    clearLocalSessionId();
    toggleUI(false);
  }
});

// --- معالجة زر تسجيل الدخول ---
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
    
    // توليد معرّف جلسة جديد وتخزينه محليًا وفي قاعدة البيانات
    currentSessionId = generateSessionId();
    setLocalSessionId(currentSessionId);
    await setDoc(doc(db, "users", user.uid), { isLoggedIn: true, sessionId: currentSessionId }, { merge: true });
    
    // بدء مراقبة تغييرات الجلسة
    startSessionListener(user);
    toggleUI(true);
  } catch (error) {
    errorMessage.innerText = "خطأ: " + error.message;
    errorMessage.style.display = "block";
  }
});

// --- معالجة زر تسجيل الخروج ---
// تأكد من إضافة زر في HTML بمعرّف "logout-button" داخل محتوى الصفحة الرئيسي
document.getElementById("logout-button")?.addEventListener("click", async () => {
  if (auth.currentUser) {
    try {
      // تحديث حالة المستخدم في قاعدة البيانات وإفراغ معرّف الجلسة
      await setDoc(doc(db, "users", auth.currentUser.uid), { isLoggedIn: false, sessionId: "" }, { merge: true });
      if (sessionListenerUnsubscribe) {
        sessionListenerUnsubscribe();
        sessionListenerUnsubscribe = null;
      }
      clearLocalSessionId();
      await signOut(auth);
      toggleUI(false);
    } catch (error) {
      console.error("حدث خطأ أثناء تسجيل الخروج:", error);
    }
  }
});

import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// تهيئة Firebase
const auth = getAuth();
const db = getFirestore();

async function isUserLoggedIn(uid) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() && userSnap.data().isLoggedIn;
}

document.getElementById("email-login").addEventListener("click", async () => {
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
      await signOut(auth);
      return;
    }

    await setDoc(doc(db, "users", user.uid), { isLoggedIn: true });

    document.getElementById("login-container").style.display = "none";
    document.getElementById("welcome-container").style.display = "block";
  } catch (error) {
    errorMessage.innerText = "خطأ: " + error.message;
    errorMessage.style.display = "block";
  }
});

onAuthStateChanged(auth, async (user) => {
  if (user && !(await isUserLoggedIn(user.uid))) {
    document.getElementById("login-container").style.display = "none";
    document.getElementById("welcome-container").style.display = "block";
  } else {
    document.getElementById("login-container").style.display = "block";
    document.getElementById("welcome-container").style.display = "none";
  }
});

document.getElementById("logout").addEventListener("click", async () => {
  const user = auth.currentUser;
  if (user) {
    await setDoc(doc(db, "users", user.uid), { isLoggedIn: false });
    await signOut(auth);
  }
});

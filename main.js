import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDVoOQsCrEvhRbFZP4rBgyf9dEd-AQq-us",
  authDomain: "schoolappv2-c1c84.firebaseapp.com",
  projectId: "schoolappv2-c1c84",
  storageBucket: "schoolappv2-c1c84.appspot.com",
  messagingSenderId: "70334432902",
  appId: "1:70334432902:web:d8ba08cfcf6d912fca3307"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

const adminSection = document.getElementById("adminSection");
const lessonInput = document.getElementById("lessonInput");
const classInput = document.getElementById("classInput");
const dateInput = document.getElementById("dateInput");
const taughtMaterialInput = document.getElementById("taughtMaterialInput");
const attentionNotesInput = document.getElementById("attentionNotesInput");
const submitLessonBtn = document.getElementById("submitLessonBtn");
const adminMessage = document.getElementById("adminMessage");
const logoutBtn = document.getElementById("logoutBtn");

const studentClassInput = document.getElementById("studentClass");
const viewLessonsBtn = document.getElementById("viewLessonsBtn");
const guestMessage = document.getElementById("guestMessage");
const lessonsContainer = document.getElementById("lessonsContainer");

const privateLastName = document.getElementById("privateLastName");
const privateClass = document.getElementById("privateClass");
const privateNotesInput = document.getElementById("privateNotesInput");
const submitPrivateNoteBtn = document.getElementById("submitPrivateNoteBtn");
const privateNoteMessage = document.getElementById("privateNoteMessage");
const privateNotesList = document.getElementById("privateNotesList");
const searchLastNameInput = document.getElementById("searchLastNameInput");
const searchClassInput = document.getElementById("searchClassInput");
const searchPrivateNotesBtn = document.getElementById("searchPrivateNotesBtn");

function toggleAdminView(loggedIn) {
  loginForm.style.display = loggedIn ? "none" : "block";
  adminSection.style.display = loggedIn ? "block" : "none";
}

onAuthStateChanged(auth, (user) => {
  toggleAdminView(!!user);
  if (user) loadPrivateNotes();
});

loginBtn.addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
  } catch (error) {
    loginError.textContent = "Σφάλμα σύνδεσης: " + error.message;
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  emailInput.value = "";
  passwordInput.value = "";
});

submitLessonBtn.addEventListener("click", async () => {
  try {
    await addDoc(collection(db, "lessons"), {
      lesson: lessonInput.value,
      class: classInput.value.toUpperCase(),
      date: dateInput.value,
      taughtMaterial: taughtMaterialInput.value,
      attentionNotes: attentionNotesInput.value,
      timestamp: new Date().toISOString()
    });
    adminMessage.textContent = "Η ύλη καταχωρίστηκε!";
    lessonInput.value = classInput.value = dateInput.value = taughtMaterialInput.value = attentionNotesInput.value = "";
  } catch (e) {
    adminMessage.textContent = "Σφάλμα: " + e.message;
  }
});

viewLessonsBtn.addEventListener("click", async () => {
  const studentClass = studentClassInput.value.trim().toUpperCase();
  lessonsContainer.innerHTML = "";
  guestMessage.textContent = "";

  try {
    const q = query(
      collection(db, "lessons"),
      where("class", "==", studentClass),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      guestMessage.textContent = "Δεν βρέθηκε ύλη.";
      return;
    }
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const card = document.createElement("div");
      card.className = "lesson-card";
      card.innerHTML = `
        <h4>${data.lesson} - ${data.class} (${data.date})</h4>
        <p><strong>Ύλη:</strong> ${data.taughtMaterial}</p>
        <p><strong>Προσοχή:</strong> ${data.attentionNotes || "—"}</p>
      `;
      if (auth.currentUser) {
        const delBtn = document.createElement("button");
        delBtn.textContent = "Διαγραφή";
        delBtn.className = "delete-btn";
        delBtn.onclick = async () => {
          if (confirm("Διαγραφή;")) {
            await deleteDoc(doc(db, "lessons", docSnap.id));
            viewLessonsBtn.click();
          }
        };
        card.appendChild(delBtn);
      }
      lessonsContainer.appendChild(card);
    });
  } catch (error) {
    guestMessage.textContent = "Σφάλμα: " + error.message;
  }
});

submitPrivateNoteBtn.addEventListener("click", async () => {
  try {
    await addDoc(collection(db, "privateNotes"), {
      lastName: privateLastName.value,
      class: privateClass.value,
      note: privateNotesInput.value,
      timestamp: new Date().toISOString()
    });
    privateNoteMessage.textContent = "Η σημείωση αποθηκεύτηκε!";
    privateLastName.value = privateClass.value = privateNotesInput.value = "";
    loadPrivateNotes();
  } catch (error) {
    privateNoteMessage.textContent = "Σφάλμα: " + error.message;
  }
});

searchPrivateNotesBtn.addEventListener("click", () => {
  loadPrivateNotes(searchLastNameInput.value.trim(), searchClassInput.value.trim());
});

async function loadPrivateNotes(lastName = "", classVal = "") {
  privateNotesList.innerHTML = "";
  let q = collection(db, "privateNotes");

  if (lastName && classVal) {
    q = query(q, where("lastName", "==", lastName), where("class", "==", classVal));
  } else if (lastName) {
    q = query(q, where("lastName", "==", lastName));
  } else if (classVal) {
    q = query(q, where("class", "==", classVal));
  } else {
    q = query(q, orderBy("timestamp", "desc"));
  }

  const snapshot = await getDocs(q);
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const div = document.createElement("div");
    div.className = "lesson-card";
    div.innerHTML = `<p><strong>${data.lastName} (${data.class}):</strong> ${data.note}</p>`;
    const delBtn = document.createElement("button");
    delBtn.textContent = "Διαγραφή";
    delBtn.className = "delete-btn";
    delBtn.onclick = async () => {
      if (confirm("Διαγραφή σημείωσης;")) {
        await deleteDoc(doc(db, "privateNotes", docSnap.id));
        loadPrivateNotes(lastName, classVal);
      }
    };
    div.appendChild(delBtn);
    privateNotesList.appendChild(div);
  });
}
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDVoOQsCrEvhRbFZP4rBgyf9dEd-AQq-us",
  authDomain: "schoolappv2-c1c84.firebaseapp.com",
  projectId: "schoolappv2-c1c84",
  storageBucket: "schoolappv2-c1c84.appspot.com",
  messagingSenderId: "70334432902",
  appId: "1:70334432902:web:d8ba08cfcf6d912fca3307"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
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

// Toggle Admin View
function toggleAdminView(loggedIn) {
  loginForm.style.display = loggedIn ? "none" : "block";
  adminSection.style.display = loggedIn ? "block" : "none";
}

// Auth State Listener
onAuthStateChanged(auth, (user) => {
  toggleAdminView(!!user);
  if (user) {
    console.log("Ο χρήστης είναι συνδεδεμένος:", user.email);
    loadPrivateNotes();
  } else {
    console.log("Ο χρήστης αποσυνδέθηκε");
  }
});

// Login Function
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    loginError.textContent = "Συμπληρώστε email και κωδικό";
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginError.textContent = "";
  } catch (error) {
    loginError.textContent = "Σφάλμα σύνδεσης: " + error.message;
    console.error("Σφάλμα σύνδεσης:", error);
  }
});

// Logout Function
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    emailInput.value = "";
    passwordInput.value = "";
    adminMessage.textContent = "";
  } catch (error) {
    console.error("Σφάλμα αποσύνδεσης:", error);
  }
});

// Submit Lesson Function
submitLessonBtn.addEventListener("click", async () => {
  const lesson = lessonInput.value.trim();
  const classVal = classInput.value.trim().toUpperCase();
  const date = dateInput.value;
  const taughtMaterial = taughtMaterialInput.value.trim();
  const attentionNotes = attentionNotesInput.value.trim();

  if (!lesson || !classVal || !date || !taughtMaterial) {
    adminMessage.textContent = "Συμπληρώστε όλα τα απαραίτητα πεδία (Μάθημα, Τμήμα, Ημερομηνία, Ύλη)";
    adminMessage.className = "error-message";
    return;
  }

  try {
    await addDoc(collection(db, "lessons"), {
      lesson,
      class: classVal,
      date,
      taughtMaterial,
      attentionNotes: attentionNotes || "—",
      timestamp: new Date().toISOString()
    });

    adminMessage.textContent = "Η ύλη καταχωρίστηκε επιτυχώς!";
    adminMessage.className = "success-message";
    lessonInput.value = "";
    classInput.value = "";
    dateInput.value = "";
    taughtMaterialInput.value = "";
    attentionNotesInput.value = "";
  } catch (error) {
    adminMessage.textContent = "Σφάλμα: " + error.message;
    adminMessage.className = "error-message";
    console.error("Σφάλμα καταχώρησης:", error);
  }
});

// View Lessons Function
viewLessonsBtn.addEventListener("click", async () => {
  const studentClass = studentClassInput.value.trim().toUpperCase();
  lessonsContainer.innerHTML = "";
  guestMessage.textContent = "";

  if (!studentClass) {
    guestMessage.textContent = "Εισάγετε τμήμα για αναζήτηση";
    guestMessage.className = "error-message";
    return;
  }

  try {
    const q = query(
      collection(db, "lessons"),
      where("class", "==", studentClass),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      guestMessage.textContent = `Δεν βρέθηκε ύλη για το τμήμα ${studentClass}`;
      guestMessage.className = "info-message";
      return;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const card = document.createElement("div");
      card.className = "lesson-card";
      card.innerHTML = `
        <h4>${data.lesson} - ${data.class} (${data.date})</h4>
        <p><strong>Ύλη:</strong> ${data.taughtMaterial}</p>
        <p><strong>Προσοχή:</strong> ${data.attentionNotes}</p>
      `;

      // Add delete button only for logged-in users
      if (auth.currentUser) {
        const delBtn = document.createElement("button");
        delBtn.textContent = "Διαγραφή";
        delBtn.className = "delete-btn";
        delBtn.onclick = async () => {
          if (confirm("Θέλετε να διαγράψετε αυτή την καταχώρηση ύλης;")) {
            try {
              await deleteDoc(doc(db, "lessons", docSnap.id));
              card.remove();
              guestMessage.textContent = "Η καταχώρηση διαγράφηκε επιτυχώς!";
              guestMessage.className = "success-message";
            } catch (error) {
              guestMessage.textContent = "Σφάλμα διαγραφής: " + error.message;
              guestMessage.className = "error-message";
              console.error("Σφάλμα διαγραφής:", error);
            }
          }
        };
        card.appendChild(delBtn);
      }
      lessonsContainer.appendChild(card);
    });
  } catch (error) {
    guestMessage.textContent = "Σφάλμα: " + error.message;
    guestMessage.className = "error-message";
    console.error("Σφάλμα φόρτωσης ύλης:", error);
  }
});

// Private Notes Functions
submitPrivateNoteBtn.addEventListener("click", async () => {
  const lastName = privateLastName.value.trim();
  const classVal = privateClass.value.trim().toUpperCase();
  const note = privateNotesInput.value.trim();

  if (!lastName || !classVal || !note) {
    privateNoteMessage.textContent = "Συμπληρώστε όλα τα πεδία (Επίθετο, Τμήμα, Σημειώσεις)";
    privateNoteMessage.className = "error-message";
    return;
  }

  try {
    await addDoc(collection(db, "privateNotes"), {
      lastName,
      class: classVal,
      note,
      timestamp: new Date().toISOString()
    });

    privateNoteMessage.textContent = "Η σημείωση αποθηκεύτηκε επιτυχώς!";
    privateNoteMessage.className = "success-message";
    privateLastName.value = "";
    privateClass.value = "";
    privateNotesInput.value = "";
    loadPrivateNotes();
  } catch (error) {
    privateNoteMessage.textContent = "Σφάλμα: " + error.message;
    privateNoteMessage.className = "error-message";
    console.error("Σφάλμα καταχώρησης σημείωσης:", error);
  }
});

searchPrivateNotesBtn.addEventListener("click", () => {
  const lastName = searchLastNameInput.value.trim();
  const classVal = searchClassInput.value.trim().toUpperCase();
  loadPrivateNotes(lastName, classVal);
});

async function loadPrivateNotes(lastName = "", classVal = "") {
  privateNotesList.innerHTML = "";
  let q = collection(db, "privateNotes");

  if (lastName && classVal) {
    q = query(q, 
      where("lastName", "==", lastName), 
      where("class", "==", classVal),
      orderBy("timestamp", "desc")
    );
  } else if (lastName) {
    q = query(q, 
      where("lastName", "==", lastName),
      orderBy("timestamp", "desc")
    );
  } else if (classVal) {
    q = query(q, 
      where("class", "==", classVal),
      orderBy("timestamp", "desc")
    );
  } else {
    q = query(q, orderBy("timestamp", "desc"));
  }

  try {
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      privateNotesList.innerHTML = "<p>Δεν βρέθηκαν σημειώσεις</p>";
      return;
    }

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const div = document.createElement("div");
      div.className = "lesson-card";
      div.innerHTML = `
        <p><strong>${data.lastName} (${data.class}):</strong> ${data.note}</p>
        <small>${new Date(data.timestamp).toLocaleString()}</small>
      `;

      if (auth.currentUser) {
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
      }
      privateNotesList.appendChild(div);
    });
  } catch (error) {
    privateNotesList.innerHTML = `<p class="error-message">Σφάλμα: ${error.message}</p>`;
    console.error("Σφάλμα φόρτωσης σημειώσεων:", error);
  }
}
// Select required elements
const noteText = document.getElementById("note-text");
const charCount = document.getElementById("char-count");
const wordCount = document.getElementById("word-count");
const clearBtn = document.getElementById("clear-btn");
const themeToggle = document.getElementById("theme-toggle");

// Function to update character and word counts + warning classes
function updateCounts() {
  const text = noteText.value;
  const len = text.length;

  // Update char count display
  charCount.textContent = `${len} / 200 characters`;

  // Update classes for char count (warning > 180, over > 200)
  charCount.classList.remove("warning", "over");
  if (len > 200) {
    charCount.classList.add("over");
  } else if (len > 180) {
    charCount.classList.add("warning");
  }

  // Calculate word count
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  wordCount.textContent = `${words} words`;
}

// Clear function for button and Escape key
function clearAll() {
  noteText.value = "";
  localStorage.removeItem("noteDraft");
  updateCounts();
}

// Input event listener to update counts and persist draft
noteText.addEventListener("input", () => {
  updateCounts();
  localStorage.setItem("noteDraft", noteText.value);
});

// Escape key inside textarea clears content
noteText.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    clearAll();
  }
});

// Clear button event listener
clearBtn.addEventListener("click", clearAll);

// Dark mode toggle event listener
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");

  themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// Initial load: restore draft, restore theme, and call updateCounts()
window.addEventListener("DOMContentLoaded", () => {
  const savedDraft = localStorage.getItem("noteDraft");
  if (savedDraft !== null) {
    noteText.value = savedDraft;
  }

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "Light mode";
  } else {
    themeToggle.textContent = "Dark mode";
  }

  updateCounts();
});

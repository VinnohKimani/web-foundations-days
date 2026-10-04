// Starting data
let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

// 1. searchNotes(word)
// Returns an array of notes whose text contains word, case insensitive.
function searchNotes(word) {
  const query = word.toLowerCase();
  return notes.filter((note) => note.text.toLowerCase().includes(query));
}

// 2. longestNote()
// Returns the note object with the most characters, or null if notes is empty.
function longestNote() {
  if (notes.length === 0) {
    return null;
  }
  return notes.reduce((longest, current) => {
    return current.text.length > longest.text.length ? current : longest;
  });
}

// 3. countByCategory()
// Returns an object counting notes per category .
function countByCategory() {
  const counts = {};
  for (const note of notes) {
    counts[note.category] = (counts[note.category] || 0) + 1;
  }
  return counts;
}

// 4. getSummary()
// Returns a summary sentence using countByCategory.
// Handles singular "note" for 1 total note, "notes" otherwise.
function getSummary() {
  const total = notes.length;
  const word = total === 1 ? "note" : "notes";
  const counts = countByCategory();

  const parts = Object.entries(counts).map(
    ([category, count]) => `${count} ${category}`,
  );

  return `${total} ${word}: ${parts.join(", ")}.`;
}

// 5. isDuplicate(text)
// Returns true if a note with the same text already exists (ignoring case and whitespace).
function isDuplicate(text) {
  const cleanedText = text.trim().toLowerCase();
  return notes.some((note) => note.text.trim().toLowerCase() === cleanedText);
}

// 6. addNote(text, category)
// Validates length (1-200), checks duplicate, ensures allowed category (personal, work, study).
function addNote(text, category) {
  const validCategories = ["personal", "work", "study"];

  if (typeof text !== "string" || text.trim().length === 0) {
    console.log("Failed to add note: Note text cannot be empty.");
    return false;
  }

  if (text.length > 200) {
    console.log("Failed to add note: Note text exceeds 200 characters.");
    return false;
  }

  if (!validCategories.includes(category)) {
    console.log(`Failed to add note: "${category}" is not a valid category.`);
    return false;
  }

  if (isDuplicate(text)) {
    console.log("Failed to add note: A note with this text already exists.");
    return false;
  }

  const newId = notes.length > 0 ? Math.max(...notes.map((n) => n.id)) + 1 : 1;
  const newNote = {
    id: newId,
    text: text.trim(),
    category: category,
  };

  notes.push(newNote);
  return true;
}

// ==========================================
// Tests (Normal cases & Edge cases)
// ==========================================

console.log("--- 1. searchNotes ---");
// Normal case: matches 'javascript' regardless of case
console.log(searchNotes("javascript"));
// Expected: [ { id: 4, text: "Revise JavaScript arrays", category: "study" } ]

// Edge case: query has no matches
console.log(searchNotes("nonexistent word"));
// Expected: []

console.log("\n--- 2. longestNote ---");
// Normal case: finds the note with the longest text
console.log(longestNote());
// Expected: { id: 3, text: "Email the project report to Grace", category: "work" }

// Edge case: empty notes array returns null
const tempBackup = notes;
notes = [];
console.log(longestNote());
// Expected: null
notes = tempBackup; // restore dataset

console.log("\n--- 3. countByCategory ---");
// Normal case: counts all categories
console.log(countByCategory());
// Expected: { personal: 2, study: 2, work: 1 }

// Edge case: dataset with zero items
const tempBackup2 = notes;
notes = [];
console.log(countByCategory());
// Expected: {}
notes = tempBackup2; // restore dataset

console.log("\n--- 4. getSummary ---");
// Normal case: 5 total notes
console.log(getSummary());
// Expected: "5 notes: personal: 2, study: 2, work: 1." (or "5 notes: 2 personal, 2 study, 1 work.")

// Edge case: single note checks singular "note"
const tempBackup3 = notes;
notes = [{ id: 1, text: "Single item", category: "work" }];
console.log(getSummary());
// Expected: "1 note: 1 work."
notes = tempBackup3; // restore dataset

console.log("\n--- 5. isDuplicate ---");
// Normal case: text exists with different casing and whitespace
console.log(isDuplicate("  call MUM  "));
// Expected: true

// Edge case: text does not exist
console.log(isDuplicate("Cook dinner tonight"));
// Expected: false

console.log("\n--- 6. addNote ---");
// Normal case: successfully adds valid note
console.log(addNote("Prepare presentation slides", "work"));
// Expected: true

// Edge cases: duplicate note, invalid category, empty note
console.log(addNote("Call mum", "personal"));
// Expected: Failed to add note: A note with this text already exists. -> false

console.log(addNote("Read a chapter of a book", "leisure"));
// Expected: Failed to add note: "leisure" is not a valid category. -> false

console.log(addNote("   ", "study"));
// Expected: Failed to add note: Note text cannot be empty. -> false

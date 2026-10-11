// Select required elements
const loadBtn = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const statusPara = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

// In-memory array to store fetched users
let loadedUsers = [];

// Renders any array of users passed to it
function renderUsers(list) {
  usersList.textContent = "";

  if (list.length === 0) {
    if (loadedUsers.length > 0) {
      statusPara.textContent = "No users match your filter.";
    }
    return;
  }

  // Clear status override if results match filter
  if (statusPara.textContent === "No users match your filter.") {
    statusPara.textContent = "Users loaded successfully.";
  }

  list.forEach((user) => {
    const li = document.createElement("li");

    // Display name, email, city, and company name using createElement and textContent
    const nameHeading = document.createElement("strong");
    nameHeading.textContent = user.name;

    const emailPara = document.createElement("p");
    emailPara.textContent = `Email: ${user.email}`;

    const cityPara = document.createElement("p");
    cityPara.textContent = `City: ${user.address?.city || user.city}`;

    const companyPara = document.createElement("p");
    companyPara.textContent = `Company: ${user.company?.name || user.company}`;

    li.appendChild(nameHeading);
    li.appendChild(emailPara);
    li.appendChild(cityPara);
    li.appendChild(companyPara);

    usersList.appendChild(li);
  });
}

// Async function to fetch users from API
async function loadUsers() {
  // Update status and disable button while loading
  statusPara.textContent = "Loading users...";
  loadBtn.disabled = true;

  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/users");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    loadedUsers = data;

    statusPara.textContent = "Users loaded successfully.";
    renderUsers(loadedUsers);
  } catch (error) {
    statusPara.textContent = "Failed to load users. Please try again.";
    usersList.textContent = "";
  } finally {
    // Re-enable button when request completes
    loadBtn.disabled = false;
  }
}

// Event Listeners
loadBtn.addEventListener("click", loadUsers);

filterInput.addEventListener("input", () => {
  const query = filterInput.value.toLowerCase().trim();
  const filtered = loadedUsers.filter((user) =>
    user.name.toLowerCase().includes(query),
  );
  renderUsers(filtered);
});

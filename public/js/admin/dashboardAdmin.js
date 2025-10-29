// =======================
// API Base URL
// =======================
const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:8080" // lokale backend
    : "https://workshoptest.wailsalutem-foundation.com"; // productie backend

console.log("Backend URL:", API_URL);

// =======================
// Fetch Pending Users
// =======================
async function fetchPendingUsers() {
  const token = localStorage.getItem("jwt");
  const response = await fetch(`${API_URL}/register/pending`, {
    headers: { "Authorization": `Bearer ${token}` }
  });

  if (response.ok) {
    const users = await response.json();

    // Debug log
    console.log("Pending users fetched:", users);

    const tbody = document.querySelector("#pendingUsersTable tbody");
    const notificationsDiv = document.getElementById("notifications");
    tbody.innerHTML = "";
    notificationsDiv.innerHTML = "";

    users.forEach(user => {
      // Notificatie
      const notif = document.createElement("div");
      notif.textContent = `Nieuwe aanmelding: ${user.firstName} ${user.lastName}`;
      notificationsDiv.appendChild(notif);

      // Table row
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${user.firstName} ${user.lastName}</td>
        <td>${user.email}</td>
        <td>${user.school}</td>
        <td>${user.phone}</td>
        <td>
            <button onclick="approveUser(${user.id})">Sta toe</button>
            <button onclick="denyUser(${user.id})">Weiger</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } else {
    console.error("Failed to fetch pending users");
  }
}

// =======================
// Approve User
// =======================
async function approveUser(userId) {
  const token = localStorage.getItem("jwt");
  const response = await fetch(`${API_URL}/register/approve/${userId}`, {
    method: "PATCH",
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (response.ok) {
    alert("Gebruiker goedgekeurd!");
    fetchPendingUsers();
  }
}

// =======================
// Deny User
// =======================
async function denyUser(userId) {
  const token = localStorage.getItem("jwt");
  const response = await fetch(`${API_URL}/register/deny/${userId}`, {
    method: "PATCH",
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (response.ok) {
    alert("Gebruiker afgekeurd!");
    fetchPendingUsers();
  }
}

// =======================
// Auto load pending users
// =======================
document.addEventListener("DOMContentLoaded", fetchPendingUsers);

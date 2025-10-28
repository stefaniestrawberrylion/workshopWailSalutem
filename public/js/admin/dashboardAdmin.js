async function fetchPendingUsers() {
  const token = localStorage.getItem("jwt");
  const response = await fetch("http://localhost:8080/register/pending", {
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

async function approveUser(userId) {
  const token = localStorage.getItem("jwt");
  const response = await fetch(`http://localhost:8080/register/approve/${userId}`, {
    method: "PATCH",
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (response.ok) {
    alert("Gebruiker goedgekeurd!");
    fetchPendingUsers();
  }
}

async function denyUser(userId) {
  const token = localStorage.getItem("jwt");
  const response = await fetch(`http://localhost:8080/register/deny/${userId}`, {
    method: "PATCH",
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (response.ok) {
    alert("Gebruiker afgekeurd!");
    fetchPendingUsers();
  }
}

// Auto load pending users
document.addEventListener("DOMContentLoaded", fetchPendingUsers);

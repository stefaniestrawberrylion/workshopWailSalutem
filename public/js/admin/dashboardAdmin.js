document.addEventListener("DOMContentLoaded", async () => {

  // =======================
  // API Base URL
  // =======================
  const API_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:3000" // lokale backend
      : "https://workshoptest.wailsalutem-foundation.com"; // productie backend

  console.log("Backend URL:", API_URL);

  // =======================
  // Token check
  // =======================
  const token = localStorage.getItem("jwt");

  if (!token) {
    alert("Niet ingelogd!");
    window.location.href = "/inlog";
    return;
  }

  try {
    // Decode token payload
    const payload = JSON.parse(atob(token.split(".")[1]));
    const roles = Array.isArray(payload.roles) ? payload.roles : [payload.roles];

    if (!roles.includes("ADMIN")) {
      alert("Geen toegang!");
      window.location.href = "/dashboarduser";
      return;
    }

    console.log("✅ Token gevonden voor:", payload.email);
  } catch (err) {
    console.error("Fout bij token-decodering:", err);
    localStorage.removeItem("jwt");
    window.location.href = "/inlog";
    return;
  }

  // =======================
  // Fetch Pending Users
  // =======================
  async function fetchPendingUsers() {
    console.log("📡 Ophalen van pending users...");

    try {
      const response = await fetch(`${API_URL}/register/pending`, {
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.status === 401) {
        console.warn("⚠️ Token ongeldig of verlopen. Redirect naar login.");
        localStorage.removeItem("jwt");
        window.location.href = "/inlog";
        return;
      }

      if (!response.ok) {
        console.error("❌ Fout bij ophalen pending users:", response.status);
        return;
      }

      const users = await response.json();
      console.log("✅ Pending users fetched:", users);

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

    } catch (err) {
      console.error("🚨 Fout bij fetchPendingUsers:", err);
    }
  }

  // =======================
  // Approve User
  // =======================
  window.approveUser = async function (userId) {
    try {
      const response = await fetch(`${API_URL}/register/approve/${userId}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.status === 401) {
        alert("Sessie verlopen. Log opnieuw in.");
        localStorage.removeItem("jwt");
        window.location.href = "/inlog";
        return;
      }

      if (response.ok) {
        alert("Gebruiker goedgekeurd!");
        fetchPendingUsers();
      } else {
        alert("Fout bij goedkeuren gebruiker.");
      }
    } catch (err) {
      console.error("❌ Fout bij approveUser:", err);
    }
  };

  // =======================
  // Deny User
  // =======================
  window.denyUser = async function (userId) {
    try {
      const response = await fetch(`${API_URL}/register/deny/${userId}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.status === 401) {
        alert("Sessie verlopen. Log opnieuw in.");
        localStorage.removeItem("jwt");
        window.location.href = "/inlog";
        return;
      }

      if (response.ok) {
        alert("Gebruiker afgekeurd!");
        fetchPendingUsers();
      } else {
        alert("Fout bij afkeuren gebruiker.");
      }
    } catch (err) {
      console.error("❌ Fout bij denyUser:", err);
    }
  };
  // =======================
  // Uitlog functionaliteit
  // =======================
  document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
      logoutButton.addEventListener("click", () => {
        if (confirm("Weet je zeker dat je wilt uitloggen?")) {
          localStorage.removeItem("jwt");
          window.location.href = "/";
        }
      });
    }
  });


  // =======================
  // Auto load pending users
  // =======================
  await fetchPendingUsers();

});

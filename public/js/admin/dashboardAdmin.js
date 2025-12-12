document.addEventListener("DOMContentLoaded", async () => {

  const API_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://workshoptest.wailsalutem-foundation.com";

  const token = localStorage.getItem("jwt");

  const showNotification = (message, type = "info") => {
    const notificationsDiv = document.getElementById("notifications");
    const notif = document.createElement("div");
    notif.textContent = message;
    notif.className = `notification ${type}`; // types: info, success, error
    notificationsDiv.appendChild(notif);

    // 2 seconden zichtbaar
    setTimeout(() => notif.remove(), 2000);
  };


  if (!token) {
    showNotification("Niet ingelogd!", "error");
    setTimeout(() => window.location.href = "/inlog", 2000);
    return;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const roles = Array.isArray(payload.roles) ? payload.roles : [payload.roles];

    if (!roles.includes("ADMIN")) {
      showNotification("Geen toegang!", "error");
      setTimeout(() => window.location.href = "/dashboarduser", 2000);
      return;
    }

  } catch (err) {
    localStorage.removeItem("jwt");
    window.location.href = "/inlog";
    return;
  }

  async function fetchPendingUsers() {
    try {
      const response = await fetch(`${API_URL}/register/pending`, {
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.status === 401) {
        localStorage.removeItem("jwt");
        window.location.href = "/inlog";
        return;
      }

      if (!response.ok) return;

      const users = await response.json();

      const tbody = document.querySelector("#pendingUsersTable tbody");
      const notificationsDiv = document.getElementById("notifications");
      tbody.innerHTML = "";
      notificationsDiv.innerHTML = "";

      users.forEach(user => {
        const notif = document.createElement("div");
        notif.textContent = `Nieuwe aanmelding: ${user.firstName} ${user.lastName}`;
        notif.className = "notification info";
        notificationsDiv.appendChild(notif);

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
      showNotification("Fout bij ophalen van gebruikers.", "error");
    }
  }

  window.approveUser = async function (userId) {
    try {
      const response = await fetch(`${API_URL}/register/approve/${userId}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.status === 401) {
        showNotification("Sessie verlopen. Log opnieuw in.", "error");
        localStorage.removeItem("jwt");
        setTimeout(() => window.location.href = "/inlog", 2000);
        return;
      }

      if (response.ok) {
        showNotification("Gebruiker goedgekeurd!", "success");
        fetchPendingUsers();
      } else {
        showNotification("Fout bij goedkeuren gebruiker.", "error");
      }
    } catch (err) {
      showNotification("Fout bij goedkeuren gebruiker.", "error");
    }
  };

  window.denyUser = async function (userId) {
    try {
      const response = await fetch(`${API_URL}/register/deny/${userId}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.status === 401) {
        showNotification("Sessie verlopen. Log opnieuw in.", "error");
        localStorage.removeItem("jwt");
        setTimeout(() => window.location.href = "/inlog", 2000);
        return;
      }

      if (response.ok) {
        showNotification("Gebruiker afgekeurd!", "success");
        fetchPendingUsers();
      } else {
        showNotification("Fout bij afkeuren gebruiker.", "error");
      }
    } catch (err) {
      showNotification("Fout bij afkeuren gebruiker.", "error");
    }
  };

  await fetchPendingUsers();

  const logoutButton = document.getElementById("logoutButton");
  const logoutModal = document.getElementById("logoutModal");
  const confirmLogout = document.getElementById("confirmLogout");
  const cancelLogout = document.getElementById("cancelLogout");

  if (logoutButton && logoutModal) {
    logoutButton.addEventListener("click", () => {
      logoutModal.style.display = "block";
    });

    confirmLogout.addEventListener("click", () => {
      localStorage.removeItem("jwt");
      window.location.href = "/";
    });

    cancelLogout.addEventListener("click", () => {
      logoutModal.style.display = "none";
    });

    // Klik buiten de modal sluit het
    window.addEventListener("click", (e) => {
      if (e.target === logoutModal) {
        logoutModal.style.display = "none";
      }
    });
  }



});

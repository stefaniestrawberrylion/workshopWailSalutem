document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('cardContainer');
  const token = localStorage.getItem("jwt");

  if (!token) {
    alert("Je bent niet ingelogd!");
    return;
  }

  // Dynamische backend URL (lokaal of productie)
  const API_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://workshoptest.wailsalutem-foundation.com";


  // Modal elementen
  const modal = document.getElementById("userModal");
  const modalImage = document.getElementById("modalImage");
  const modalName = document.getElementById("modalName");
  const modalEmail = document.getElementById("modalEmail");
  const modalSchool = document.getElementById("modalSchool");
  const modalPhone = document.getElementById("modalPhone");
  const closeBtn = document.querySelector(".close");

  closeBtn.onclick = () => modal.style.display = "none";
  window.onclick = e => { if (e.target === modal) modal.style.display = "none"; }

  try {
    const response = await fetch(`${API_URL}/users/approved`, {
      headers: { "Authorization": "Bearer " + token }
    });


    if (!response.ok) throw new Error("Fout bij ophalen gebruikers");

    const users = await response.json();

    users.forEach(user => {
      const card = document.createElement("div");
      card.className = "user-card";

      const img = document.createElement("img");
      img.src = user.avatarUrl || "/image/profiel.png"; // gebruik avatarUrl
      card.appendChild(img);

      const name = document.createElement("h2");
      name.textContent = `${user.firstName} ${user.lastName}`;
      card.appendChild(name);

      const email = document.createElement("p");
      email.textContent = user.email;
      card.appendChild(email);

      // Modal gedrag
      card.addEventListener("click", () => {
        modal.style.display = "block";
        modalImage.src = user.avatarUrl || "/image/profiel.png"; // modal avatarUrl
        modalName.textContent = `${user.firstName} ${user.lastName}`;
        modalEmail.textContent = "Email: " + user.email;
        modalSchool.textContent = "School: " + user.school;
        modalPhone.textContent = "Telefoon: " + user.phone;
      });

      // Verwijder-knop
      const delBtn = document.createElement("button");
      delBtn.textContent = "Verwijderen";
      delBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!confirm(`Weet je zeker dat je ${user.firstName} wilt verwijderen?`)) return;
        try {
          const delResponse = await fetch(`${API_URL}/users/${user.id}`, {
            method: "DELETE",
            headers: { "Authorization": "Bearer " + token }
          });
          if (!delResponse.ok) throw new Error("Kon gebruiker niet verwijderen");
          card.remove();
        } catch (err) {
          alert(err.message);
        }
      });
      card.appendChild(delBtn);

      container.appendChild(card);
    });

  } catch (err) {
    alert("Er is een fout opgetreden bij het ophalen van gebruikers.");
  }

  // Terugknop
  const backBtn = document.getElementById("backBtn");
  backBtn.addEventListener("click", () => {
    window.location.href = "/dashboard";
  });

  // Zoeken
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", () => {
    const filter = searchInput.value.toLowerCase();
    document.querySelectorAll(".user-card").forEach(card => {
      const name = card.querySelector("h2").textContent.toLowerCase();
      const email = card.querySelector("p").textContent.toLowerCase();
      card.style.display = (name.includes(filter) || email.includes(filter)) ? "" : "none";
    });
  });
});

// "Bekijk Alles" knoppen → redirect naar /workshopuser met filter
document.querySelectorAll(".toggle-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const targetClass = btn.dataset.target;

    // Maak een filterparameter op basis van het target
    let filterType = "";
    if (targetClass.includes("recent")) filterType = "recent";
    else if (targetClass.includes("pop")) filterType = "populair";
    else if (targetClass.includes("new")) filterType = "nieuw";

    // Redirect naar workshopuser met filter query
    window.location.href = `/workshopuser?filter=${filterType}`;
  });
});


document.getElementById("logoutBtn").addEventListener("click", (e) => {
  e.preventDefault();

  // Simuleer verwijderen van lokale sessiegegevens
  localStorage.removeItem("user");
  sessionStorage.removeItem("user");

  // Eventueel melding
  alert("Je bent succesvol uitgelogd!");

  // Doorsturen naar loginpagina
  window.location.href = "/";
});
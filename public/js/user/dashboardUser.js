window.addEventListener('DOMContentLoaded', () => {

  const toggleBtn = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const logoutBtn = document.getElementById('logoutBtn');

  // MOBILE SIDEBAR
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('sidebar-open');
    });
  }

  // LOGOUT
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('jwt');
      alert("Je bent uitgelogd!");
      window.location.href = "/";
    });
  }
  document.querySelectorAll(".sidebar a").forEach(link => {
    link.addEventListener("click", function () {

      // Verwijder active van alle links
      document.querySelectorAll(".sidebar a").forEach(a => a.classList.remove("active"));

      // Voeg active toe aan de geklikte link
      this.classList.add("active");
    });
  });

});

document
  .querySelectorAll(".nav.navbar-nav li.dropdown .dropdown-toggle")
  .forEach((el, i, drops) => {
    el.addEventListener("click", function (e) {
      if (e.target.offsetParent.classList.contains("open")) {
        e.target.offsetParent.classList.remove("open");
      } else {
        drops.forEach((i) => i.offsetParent.classList.remove("open"));
        e.target.offsetParent.classList.add("open");
      }
    });
  });

document.addEventListener("click", function (e) {
  const isInsideDropdown = e.target.closest(".navbar .dropdown");

  if (!isInsideDropdown) {
    document.querySelectorAll(".navbar .dropdown.open").forEach(function (el) {
      el.classList.remove("open");
    });
  }
});

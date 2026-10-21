// Regency House Assisted Living — site JS

// Google Ads conversion label for form submissions.
// Create a "Submit lead form" conversion action in Google Ads (Goals > Conversions),
// copy its label, and paste it here (format: "AbC-D3fGhIjKlMnOp").
var FORM_CONVERSION_LABEL = "";

// Mobile nav toggle
(function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
})();

// Track phone-link clicks as a gtag event (calls from ads are already
// tracked via call reporting; this covers organic site visitors).
(function () {
  document.querySelectorAll('[data-track="phone"]').forEach(function (el) {
    el.addEventListener("click", function () {
      if (typeof gtag === "function") {
        gtag("event", "phone_click", { event_category: "engagement" });
      }
    });
  });
})();

// Fire the form-lead conversion on the thank-you page.
(function () {
  if (document.body.dataset.page === "thank-you" && FORM_CONVERSION_LABEL && typeof gtag === "function") {
    gtag("event", "conversion", { send_to: "AW_CONVERSION_ID/" + FORM_CONVERSION_LABEL });
  }
})();

// Dropdown toggle for touch devices (hover handles pointer devices)
(function () {
  document.querySelectorAll(".has-sub > button").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      var li = btn.parentElement;
      var open = li.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      document.querySelectorAll(".has-sub.open").forEach(function (o) { if (o !== li) o.classList.remove("open"); });
    });
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".has-sub")) document.querySelectorAll(".has-sub.open").forEach(function (o) { o.classList.remove("open"); });
  });
})();

// Photo gallery lightbox (gallery page only)
(function () {
  var box = document.getElementById("lightbox");
  var links = Array.prototype.slice.call(document.querySelectorAll("#gallery .gallery-item a[data-caption]"));
  if (!box || !links.length) return;
  var img = box.querySelector("img"), cap = box.querySelector("figcaption"), idx = 0, lastFocus = null;
  function show(i) {
    idx = (i + links.length) % links.length;
    var a = links[idx];
    img.src = a.getAttribute("href");
    img.alt = a.querySelector("img").alt;
    cap.textContent = a.getAttribute("data-caption");
  }
  function open(i) {
    lastFocus = document.activeElement;
    show(i); box.hidden = false; box.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    box.querySelector(".lightbox-close").focus();
  }
  function close() {
    box.hidden = true; box.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  links.forEach(function (a, i) {
    a.addEventListener("click", function (e) { e.preventDefault(); open(i); });
  });
  box.querySelector(".lightbox-close").addEventListener("click", close);
  box.querySelector(".lightbox-prev").addEventListener("click", function () { show(idx - 1); });
  box.querySelector(".lightbox-next").addEventListener("click", function () { show(idx + 1); });
  box.addEventListener("click", function (e) { if (e.target === box) close(); });
  document.addEventListener("keydown", function (e) {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(idx - 1);
    else if (e.key === "ArrowRight") show(idx + 1);
  });
})();

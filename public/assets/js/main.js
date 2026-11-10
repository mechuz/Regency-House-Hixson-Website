// Regency House Assisted Living — site JS

// Google Ads conversion label for form submissions.
// Create a "Submit lead form" conversion action in Google Ads (Goals > Conversions),
// copy its label, and paste it here (format: "AbC-D3fGhIjKlMnOp").
var FORM_CONVERSION_LABEL = "";

// Primary lead path: the Zapier hook (emails the facility and ownership within seconds).
// FormSubmit stays as the automatic fallback if the hook does not answer in 10 seconds.
var LEAD_HOOK = "https://hooks.zapier.com/hooks/catch/27563206/RAc4ZhMQP7nwB023/";

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


// Lead form: post to the Zapier hook first, fall back to FormSubmit, then go to /thank-you/.
(function () {
  var form = document.querySelector("form[data-lead-form]");
  if (!form || !window.fetch || !window.URLSearchParams) return;
  var started = Date.now();
  var FAIL_NOTE = "We could not send your message just now. Please call (423) 870-0050 and we will help you right away.";
  function note(msg) {
    var n = form.querySelector(".form-status");
    if (!n) { n = document.createElement("p"); n.className = "form-status form-note"; n.setAttribute("role", "status"); form.appendChild(n); }
    n.textContent = msg;
  }
  function screened() {
    var hp = form.querySelector('[name="_honey"]');
    if (hp && hp.value) return "honeypot";
    if (Date.now() - started < 2500) return "too-fast";
    var phone = (form.querySelector('[name="phone"]') || {}).value || "";
    var d = phone.replace(/\D/g, ""); if (d.length === 11 && d.charAt(0) === "1") d = d.slice(1);
    if (d.length !== 10 || /^(\d)\1+$/.test(d)) return "bad-phone";
    return "";
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]');
    var done = false;
    var why = screened();
    if (why) {
      if (typeof gtag === "function") gtag("event", "lead_screened_out", { reason: why });
      if (why === "bad-phone") { note("Please check the phone number and try again."); return; }
      location.href = form.querySelector('[name="_next"]').value || "/thank-you/"; return;
    }
    if (btn) { btn.disabled = true; btn.textContent = "Sending\u2026"; }
    var next = (form.querySelector('[name="_next"]') || {}).value || "/thank-you/";
    function success(via) {
      if (done) return; done = true;
      try { sessionStorage.setItem("rh_lead_ok", "1"); } catch (err) {}
      if (typeof gtag === "function" && via !== "zapier") gtag("event", "lead_sent_backup");
      location.href = next;
    }
    function giveUp(w) {
      if (done) return; done = true;
      if (btn) { btn.disabled = false; btn.textContent = "Send Message"; }
      note(FAIL_NOTE);
      if (typeof gtag === "function") gtag("event", "lead_send_failed", { reason: w });
    }
    function fallback(w) {
      if (done) return;
      if (typeof gtag === "function") gtag("event", "lead_primary_failed", { reason: w });
      var ctrl = window.AbortController ? new AbortController() : null;
      var t2 = setTimeout(function () { if (ctrl) ctrl.abort(); giveUp("fallback-timeout"); }, 12000);
      fetch(form.action.replace("formsubmit.co/", "formsubmit.co/ajax/"), {
        method: "POST", body: new FormData(form), headers: { Accept: "application/json" }, signal: ctrl ? ctrl.signal : undefined
      }).then(function (r) { clearTimeout(t2); if (r.ok) success("formsubmit"); else giveUp("fallback-" + r.status); })
        .catch(function () { clearTimeout(t2); giveUp("fallback-network"); });
    }
    var fd = new URLSearchParams();
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.name.charAt(0) === "_" || el.disabled) return;
      if ((el.type === "checkbox" || el.type === "radio") && !el.checked) return;
      fd.append(el.name, el.value);
    });
    fd.append("source", (form.querySelector('[name="_subject"]') || {}).value || "website form");
    fd.append("page", location.pathname);
    fd.append("reason", "primary");
    fd.append("rh_src", "hixsonregencyhouse");
    fd.append("el", String(Date.now() - started));
    var t1 = setTimeout(function () { fallback("timeout"); }, 10000);
    fetch(LEAD_HOOK, { method: "POST", mode: "no-cors", body: fd })
      .then(function () { clearTimeout(t1); success("zapier"); })
      .catch(function () { clearTimeout(t1); fallback("network"); });
  });
})();

// Thank-you page: one GA4 lead event per session, only after a real send.
(function () {
  if (document.body.dataset.page !== "thank-you" || typeof gtag !== "function") return;
  try {
    if (sessionStorage.getItem("rh_lead_ok") === "1" && !sessionStorage.getItem("rh_lead_counted")) {
      gtag("event", "generate_lead", { method: "website_form" });
      sessionStorage.setItem("rh_lead_counted", "1");
    }
  } catch (err) {}
})();

// Book Your Visit (/visit/): pick a day and time in three taps.
// Email and text links may add ?r=<lead id>&n=<first name>, so a known family sees
// their name and the request is matched to their lead. The booking goes through the
// site's one lead sender (main.js, form[data-lead-form]) with source "Book a visit"
// and the chosen day and time as visit_day and visit_time; the sender then shows
// /thank-you/. This script only builds the day and time chips and checks them before
// the sender runs.
(function () {
  "use strict";
  var TIMES = ["10:00 AM", "11:30 AM", "1:00 PM", "2:30 PM", "4:00 PM"];
  var CLOSED = { "2026-11-26": 1, "2026-12-25": 1, "2027-01-01": 1 }; // holidays: no tours
  var DAYS_AHEAD = 10;

  var $ = function (id) { return document.getElementById(id); };
  var form = $("kv-form");
  if (!form) return;
  var q = new URLSearchParams(location.search);
  var leadId = /^rec[A-Za-z0-9]{14}$/.test(q.get("r") || "") ? q.get("r") : "";
  var first = (q.get("n") || "").replace(/[^A-Za-z .'-]/g, "").trim().slice(0, 30);
  if (first) { $("kv-title").textContent = first + ", book your visit"; $("kv-name").value = first; }
  $("kv-lead").value = leadId;
  var day = "", time = "";

  function chip(label, value, group, onPick) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "kv-chip";
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", "false");
    b.textContent = label;
    b.addEventListener("click", function () {
      Array.prototype.forEach.call(group.children, function (c) { c.setAttribute("aria-checked", "false"); });
      b.setAttribute("aria-checked", "true");
      onPick(value, label);
      msg("");
    });
    group.appendChild(b);
  }

  function iso(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  var days = $("kv-days");
  var d = new Date();
  d.setHours(12, 0, 0, 0);
  var added = 0;
  for (var i = 1; added < DAYS_AHEAD && i < 30; i++) {
    var dd = new Date(d.getTime() + i * 864e5);
    if (CLOSED[iso(dd)]) continue;
    var label = dd.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    chip(label, iso(dd), days, function (v) { day = v; $("kv-day").value = v; });
    added++;
  }
  var times = $("kv-times");
  TIMES.forEach(function (t) { chip(t, t, times, function (v) { time = v; $("kv-time").value = v; }); });

  function msg(t) { $("kv-msg").textContent = t || ""; }

  // Runs before the shared sender (which listens on document): stop the submit when a
  // day, a time, a name or a phone is missing. The sender does the spam and phone checks.
  form.addEventListener("submit", function (ev) {
    var problem = "";
    if (!day) problem = "Please pick a day.";
    else if (!time) problem = "Please pick a time.";
    else if (!$("kv-name").value.trim()) problem = "Please enter your name.";
    else if ($("kv-phone").value.replace(/\D/g, "").length < 10) problem = "Please enter a phone number so we can confirm.";
    if (problem) { ev.preventDefault(); msg(problem); return; }
    msg("");
    if (typeof gtag === "function") gtag("event", "visit_booking_request", { event_category: "engagement", visit_time: time });
  });
})();

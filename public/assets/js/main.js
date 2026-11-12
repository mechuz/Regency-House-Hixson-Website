// Regency House Assisted Living — site JS

// Google Ads conversion label for form submissions.
// Create a "Submit lead form" conversion action in Google Ads (Goals > Conversions),
// copy its label, and paste it here (format: "AbC-D3fGhIjKlMnOp").
var FORM_CONVERSION_LABEL = "";

// Primary lead path: the Zapier hook (emails the facility and ownership within seconds).
// FormSubmit stays as the automatic fallback if the hook does not answer in 10 seconds.
var LEAD_HOOK = "https://hooks.zapier.com/hooks/catch/27563206/RAc4ZhMQP7nwB023/";
// FormSubmit fallback: the AJAX endpoint of the hashed alias used by the contact form
// (content/contact-us.html). Only this script reaches it, never a form's own HTML action.
var FS_AJAX = "https://formsubmit.co/ajax/51b2551f2845c13f18729befdff08eb7";

// Mobile nav toggle
(function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      // Lock the page behind the menu so only the menu scrolls on a phone.
      document.body.classList.toggle("nav-locked", open && window.matchMedia("(max-width: 1180px)").matches);
    };
    toggle.addEventListener("click", function () { setOpen(!nav.classList.contains("open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("open")) { setOpen(false); toggle.focus(); } });
    document.addEventListener("click", function (e) { if (nav.classList.contains("open") && !e.target.closest(".main-nav")) setOpen(false); });
    window.addEventListener("resize", function () { if (window.innerWidth > 1180 && nav.classList.contains("open")) setOpen(false); });
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

// Track clicks out to review platforms (Google, Facebook) as a gtag event.
(function () {
  document.querySelectorAll('[data-track="review"]').forEach(function (el) {
    el.addEventListener("click", function () {
      if (typeof gtag === "function") {
        gtag("event", "review_click", { event_category: "engagement", event_label: el.dataset.platform || "unknown" });
      }
    });
  });
})();

// Lead source: remember how this visit arrived (Google Ads click IDs and UTM tags from
// the landing URL, or the referring site) for the browser session, so every lead the
// team receives says whether it came from ads, the Business Profile, search or
// elsewhere. First touch in the session wins. Nothing personal is stored.
(function () {
  try {
    if (sessionStorage.getItem("rh_attr")) return;
    var q = new URLSearchParams(location.search);
    var got = {};
    ["gclid", "gbraid", "wbraid", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach(function (k) {
      var v = q.get(k);
      if (v) got[k] = v.slice(0, 200);
    });
    if (!Object.keys(got).length && document.referrer) {
      var ref = new URL(document.referrer);
      if (ref.hostname && ref.hostname !== location.hostname) got.referrer = ref.hostname;
    }
    if (!Object.keys(got).length) return;
    got.landing_page = location.pathname;
    sessionStorage.setItem("rh_attr", JSON.stringify(got));
  } catch (e) {}
})();
function rhLeadSource() {
  try { return JSON.parse(sessionStorage.getItem("rh_attr") || "{}") || {}; } catch (e) { return {}; }
}
// One readable label for the lead_source field: google_ads, utm source/medium, the
// referring site, or direct.
function rhLeadSourceLabel(src) {
  if (src.gclid || src.gbraid || src.wbraid) return "google_ads";
  if (src.utm_source) return src.utm_source + (src.utm_medium ? " / " + src.utm_medium : "");
  if (src.referrer) return "referral: " + src.referrer;
  return "direct";
}

// Count a form lead on the thank-you page, once per browser session (window.rhLead is
// set by the head script in base.html), and only for visitors who came through a
// screened form on this site (rh_lead_ok): bots that post straight to FormSubmit, job
// seekers and vendors never get the flag.
(function () {
  var screened = false;
  try { screened = sessionStorage.getItem("rh_lead_ok") === "1"; sessionStorage.removeItem("rh_lead_ok"); } catch (e) {}
  if (document.body.dataset.page === "thank-you" && window.rhLead && screened && typeof gtag === "function") {
    gtag("event", "generate_lead", { event_category: "lead", lead_source: "website_form" });
    if (FORM_CONVERSION_LABEL) {
      gtag("event", "conversion", { send_to: "AW_CONVERSION_ID/" + FORM_CONVERSION_LABEL });
    }
  }
})();

// Spam filter. Shared by every lead form (contact, respite booking, reserve request,
// visit booking, chat callback, share an article). It only stops submissions that are
// clearly bots, and those are dropped silently (the sender sees the normal thank-you),
// so it never asks a real family to solve a puzzle. Rules, all deliberately conservative:
//  - a link together with a typical spam word (casino, betting, crypto, loan, SEO ...),
//  - more than 2 links,
//  - Cyrillic or Chinese/Japanese/Korean text with a link, or with no English letters
//    at all in the name and message.
// Email addresses are ignored when counting links, so "my email is jo@gmail.com" is fine.
// Fields marked data-rh-allow-link (the article URL on /news/) are not counted as links.
window.rhSpam = (function () {
  // Kept specific on purpose: a family pasting a VA or pharmacy link must still get through.
  var WORDS = /\b(casinos?|gambl(e|ing)|betting|sportsbook|bookmakers?|bet365|1xbet|slot machines?|online slots|free spins|poker|jackpot|roulette|crypto(currency)?|bitcoin|btc|usdt|forex|binary options|payday loans?|quick loans?|instant loans?|personal loans?|loan offers?|seo|backlinks?|link building|viagra|cialis|porn|porno|xxx|escorts?|onlyfans|nudes|hookups?)\b|казино|ставк|букмекер|крипт|биткоин|займ|порн|слоты/i;
  var LINK = /(https?:\/\/|www\.)[^\s<>"']+|\b[a-z0-9-]+(\.[a-z0-9-]+)*\.(com|net|org|info|biz|ru|su|ua|by|kz|cn|xyz|top|site|online|shop|store|club|bet|casino|io|co|me|ly|cc|tk|pw|win|vip|link|click|pro|live|app)\/[^\s<>"']*/gi;
  var EMAIL = /[^\s@<>"']+@[^\s@<>"']+\.[a-z]{2,}/gi;
  var FOREIGN = /[Ѐ-ӿ぀-ヿ㐀-䶿一-鿿가-힯]/g;
  // words: everything a person typed (name, email, message); prose: just name + message.
  function check(words, prose) {
    words = String(words || ""); prose = String(prose || "");
    var links = (words.replace(EMAIL, " ").match(LINK) || []).length;
    if (links > 2) return "spam_links";
    if (links && WORDS.test(words)) return "spam_words";
    var plain = prose.replace(EMAIL, " ").replace(LINK, " ");
    var foreign = (plain.match(FOREIGN) || []).length;
    if (foreign >= 3 && (links || !/[A-Za-z]/.test(plain))) return "spam_script";
    return "";
  }
  function form(f) {
    var words = [], prose = [];
    Array.prototype.forEach.call(f.querySelectorAll("input, textarea"), function (el) {
      if (!el.name || el.name.charAt(0) === "_" || el.hasAttribute("data-rh-hp") || !el.value) return;
      if (el.type === "checkbox" || el.type === "radio" || el.type === "tel" || el.type === "submit") return;
      if (el.type === "hidden" && el.name !== "chat_question") return;
      if (el.hasAttribute("data-rh-allow-link")) { if (WORDS.test(el.value)) return; words.push(el.value.replace(LINK, " ")); return; }
      words.push(el.value);
      if (el.type !== "email") prose.push(el.value);
    });
    return check(words.join("\n"), prose.join("\n"));
  }
  // A second honeypot that bots fill and people never see: off-screen (not
  // display:none, which some bots skip), out of the tab order, hidden from screen
  // readers, and with a name no browser autofill recognises.
  function honeypot(f) {
    var hp = f.querySelector("[data-rh-hp]");
    if (hp) return hp;
    var wrap = document.createElement("div");
    wrap.setAttribute("aria-hidden", "true");
    wrap.style.cssText = "position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden";
    wrap.innerHTML = '<label>Leave this field empty <input type="text" name="rh_hp_field" data-rh-hp tabindex="-1" autocomplete="off"></label>';
    f.appendChild(wrap);
    return wrap.querySelector("input");
  }
  return { check: check, form: form, honeypot: honeypot, MIN_MS: 3000 };
})();

// Lead screening and the one sender for every form on the site (form[data-lead-form]:
// contact, respite booking, reserve request, visit booking, chat callback, share an
// article). Job seekers and vendors are pointed to the main line instead of sending,
// sales pitches, links, fake phone numbers and instant bot submissions are stopped,
// and only screened submissions set the flag the thank-you page needs to count a lead.
(function () {
  var MAIN = '<a href="tel:4238700050">(423) 870-0050</a>';
  var loaded = Date.now();
  var JOB = /\b(employment|job|jobs|hiring|hire me|resume|career|careers|looking for work|seeking work|work for you|work with your company|working with your company|job position|open position|positions? available|cna position|caregiver position|apply for (a|the) (job|position)|years of experience)\b/i;
  var SPAM = /(https?:\/\/|www\.|\bseo\b|backlink|guest post|web ?design|marketing services|free listing|your listing|crypto|bitcoin|casino|loan offer|investment opportunity)/i;
  function badPhone(p) {
    var d = String(p || "").replace(/\D/g, "");
    if (d.length === 11 && d.charAt(0) === "1") d = d.slice(1);
    if (d.length !== 10) return true;
    if (/^(\d)\1+$/.test(d)) return true;
    if (/[01]/.test(d.charAt(0)) || /[01]/.test(d.charAt(3))) return true;
    if (d.slice(3, 6) === "555") return true;
    return false;
  }
  function note(form, html) {
    var n = form.querySelector(".form-screen-note");
    if (!n) {
      n = document.createElement("p");
      n.className = "form-screen-note"; n.setAttribute("role", "alert");
      var btn = form.querySelector('[type="submit"]');
      if (btn) btn.parentNode.insertBefore(n, btn); else form.appendChild(n);
    }
    n.innerHTML = html;
    n.hidden = !html;
  }
  var JOB_NOTE = "We don&rsquo;t take job applications or business inquiries through this form. Please call our main line, " + MAIN + ".";
  function check(form) {
    var who = form.querySelector("[data-screen-who]");
    var honey = form.querySelector('[name="_honey"]');
    if (honey && honey.value) return { ok: false, msg: "", why: "honeypot", silent: true };
    var hp2 = form.querySelector("[data-rh-hp]");
    if (hp2 && hp2.value) return { ok: false, msg: "", why: "honeypot", silent: true };
    // Bots submit within a second or two of the page loading; no person can fill in a
    // name and phone that fast.
    if (Date.now() - loaded < window.rhSpam.MIN_MS) return { ok: false, msg: "", why: "fast", silent: true };
    var spam = window.rhSpam.form(form);
    if (spam) return { ok: false, msg: "", why: spam, silent: true };
    if (who && (who.value === "job" || who.value === "vendor")) return { ok: false, msg: JOB_NOTE, why: who.value };
    var text = Array.prototype.map.call(form.querySelectorAll("textarea, [name='chat_question']"), function (el) { return el.value; }).join(" ");
    if (JOB.test(text)) return { ok: false, msg: JOB_NOTE, why: "job_text" };
    if (SPAM.test(text)) return { ok: false, msg: "Please remove any links or sales offers from your message, or call us at " + MAIN + ".", why: "spam_text" };
    var phone = form.querySelector('[name="phone"]');
    if (phone && badPhone(phone.value)) return { ok: false, msg: "Please enter a 10-digit phone number so our team can call you back.", why: "phone" };
    return { ok: true };
  }
  function attach(form) {
    if (form.dataset.screened) return;
    form.dataset.screened = "1";
    window.rhSpam.honeypot(form);
    var who = form.querySelector("[data-screen-who]");
    if (who) who.addEventListener("change", function () {
      var stop = who.value === "job" || who.value === "vendor";
      note(form, stop ? JOB_NOTE : "");
      var btn = form.querySelector('[type="submit"]');
      if (btn && !form.querySelector("#bk-submit")) btn.disabled = stop;
    });
  }
  // Send screened submissions in the background. Primary receiver: the Zapier catch
  // hook (LEAD_HOOK), which emails the lead to the facility and ownership and routes
  // it by its "source" field. If Zapier cannot be reached, FormSubmit is tried; if both
  // fail, the visitor sees the main line instead. Listening on document lets
  // form-specific checks (the respite calendar's date check, the visit page's day and
  // time) run and cancel first.
  var FAIL_NOTE = "Sorry, our message system isn&rsquo;t responding right now. Please call us at " + MAIN + " and we&rsquo;ll help you right away.";
  var FS_MARK = " (sent by website)";
  function send(form) {
    var btn = form.querySelector('[type="submit"]');
    var label = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
    var next = form.querySelector('[name="_next"]');
    var done = false;
    function success(via) {
      if (done) return; done = true;
      try { sessionStorage.setItem("rh_lead_ok", "1"); } catch (err) {}
      if (via !== "zapier" && typeof gtag === "function") gtag("event", "lead_sent_backup", { event_category: "lead", via: via });
      location.href = next && next.value ? next.value : "/thank-you/";
    }
    function giveUp(why) {
      if (done) return; done = true;
      if (btn) { btn.disabled = false; btn.textContent = label; }
      note(form, FAIL_NOTE);
      if (typeof gtag === "function") gtag("event", "lead_send_failed", { event_category: "lead", reason: why });
    }
    var src = rhLeadSource();
    // Fallback: FormSubmit (AJAX endpoint; the form's own action when it names FormSubmit).
    var tried = false;
    function fallback(why) {
      if (done || tried) return; tried = true;
      if (typeof gtag === "function") gtag("event", "lead_primary_failed", { event_category: "lead", reason: why });
      var t2 = setTimeout(function () { giveUp("fallback_timeout"); }, 12000);
      var fsd = new FormData(form);
      fsd.set("_subject", (fsd.get("_subject") || "Website lead") + FS_MARK);
      // FormSubmit's own honeypot: it discards any submission where _honey is filled.
      var fsHoney = form.querySelector('[name="_honey"]');
      fsd.set("_honey", fsHoney ? fsHoney.value : "");
      fsd.set("_captcha", "false");
      fsd.delete("rh_hp_field");
      fsd.set("lead_source", rhLeadSourceLabel(src));
      Object.keys(src).forEach(function (k) { fsd.set(k, String(src[k]).slice(0, 200)); });
      var action = /formsubmit\.co\//.test(form.getAttribute("action") || "") ? form.getAttribute("action").replace("formsubmit.co/", "formsubmit.co/ajax/") : FS_AJAX;
      fetch(action, {
        method: "POST", body: fsd, headers: { Accept: "application/json" }
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (j) { return { ok: res.ok, j: j }; });
      }).then(function (r) {
        clearTimeout(t2);
        if (r.ok && String(r.j.success) === "true") success("formsubmit"); else giveUp("fallback_status");
      }).catch(function () { clearTimeout(t2); giveUp("fallback_network"); });
    }
    var fd = new URLSearchParams();
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.name.charAt(0) === "_" || el.type === "submit" || el.disabled || el.hasAttribute("data-rh-hp")) return;
      if ((el.type === "checkbox" || el.type === "radio") && !el.checked) return;
      fd.append(el.name, el.value);
    });
    var subj = form.querySelector('[name="_subject"]');
    fd.append("source", subj ? subj.value : "website form");
    fd.append("page", location.pathname);
    fd.append("reason", "primary");
    fd.append("rh_src", "hixsonregencyhouse");
    var hp = form.querySelector('[name="_honey"]');
    fd.append("hp", hp ? hp.value : "");
    fd.append("el", String(Date.now() - loaded));
    fd.append("lead_source", rhLeadSourceLabel(src));
    Object.keys(src).forEach(function (k) { fd.append(k, String(src[k]).slice(0, 200)); });
    var t1 = setTimeout(function () { fallback("timeout"); }, 10000);
    fetch(LEAD_HOOK, { method: "POST", mode: "no-cors", body: fd })
      .then(function () { clearTimeout(t1); success("zapier"); })
      .catch(function () { clearTimeout(t1); fallback("network"); });
  }
  document.addEventListener("submit", function (e) {
    var form = e.target;
    if (!form || !form.dataset || !form.dataset.screened || e.defaultPrevented) return;
    e.preventDefault();
    var r = check(form);
    if (!r.ok) {
      // Bots: pretend it worked and send nothing. The thank-you page does not count
      // these as leads (no rh_lead_ok flag).
      if (r.silent) {
        if (typeof gtag === "function") gtag("event", "lead_screened_out", { event_category: "lead", reason: r.why, transport_type: "beacon" });
        location.href = "/thank-you/";
        return;
      }
      note(form, r.msg);
      if (typeof gtag === "function") gtag("event", "lead_screened_out", { event_category: "lead", reason: r.why });
      return;
    }
    note(form, "");
    if (!window.fetch || !window.FormData) {
      note(form, FAIL_NOTE);
      return;
    }
    send(form);
  });
  window.rhScreenForm = attach;
  document.querySelectorAll("form[data-lead-form]").forEach(attach);
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

// Pre-select the "I'm interested in" field from ?interest= (used by ad sitelinks),
// e.g. /contact-us/?interest=respite
(function () {
  var sel = document.getElementById("interest");
  if (!sel) return;
  var v = (new URLSearchParams(location.search).get("interest") || "").toLowerCase();
  var map = { "assisted-living": "Assisted Living", "respite": "Respite or Short-Term Stay", "tour": "Scheduling a Tour", "rates": "Rates & Availability", "apply": "Reserving an Apartment" };
  if (map[v]) sel.value = map[v];
})();

// Senior Care News: how readers move on from /news/ (news_cta) and clicks out to other
// publishers from a news page or the headline list on the home page (news_outbound).
(function () {
  var onNews = /^\/news(\/|$)/.test(location.pathname);
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a || typeof gtag !== "function") return;
    var track = a.dataset.track || "";
    var inHeadlines = !!a.closest(".headline-list");
    if (!onNews && !inHeadlines && track.indexOf("news-") !== 0) return;
    var url;
    try { url = new URL(a.getAttribute("href"), location.href); } catch (err) { return; }
    var web = url.protocol === "http:" || url.protocol === "https:";
    var ours = url.hostname === location.hostname || /(^|\.)hixsonregencyhouse\.com$/.test(url.hostname);
    if (web && !ours) {
      var domain = url.hostname.replace(/^www\./, "");
      gtag("event", "news_outbound", { event_category: "engagement", event_label: domain, publisher_domain: domain, link_url: url.href, transport_type: "beacon" });
      return;
    }
    if (web && track.indexOf("news-") === 0) {
      gtag("event", "news_cta", { event_category: "engagement", event_label: track, link_url: url.pathname, transport_type: "beacon" });
    }
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

// Respite booking calendar (/respite-care/#book): pick check-in and check-out like a
// stay request. Regency House sets no minimum stay (typically a few days to several
// weeks), so any check-out after check-in is accepted and the nights are counted.
(function () {
  var root = document.getElementById("book-cal");
  if (!root) return;
  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var WDS = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  var today = new Date(); today.setHours(0,0,0,0);
  var view = new Date(today.getFullYear(), today.getMonth(), 1);
  var maxView = new Date(today.getFullYear(), today.getMonth() + 11, 1);
  var start = null, end = null;
  var fmt = function (d) {
    return MONTHS[d.getMonth()].slice(0,3) + " " + d.getDate() + ", " + d.getFullYear();
  };
  var iso = function (d) {
    return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
  };
  function monthHTML(base, first) {
    var y = base.getFullYear(), m = base.getMonth();
    var firstDow = new Date(y, m, 1).getDay();
    var days = new Date(y, m + 1, 0).getDate();
    var h = '<div class="bc-month"><div class="bc-head">';
    if (first) h += '<button type="button" class="bc-nav" data-nav="-1" aria-label="Previous month">‹</button>';
    h += '<span class="bc-title">' + MONTHS[m] + " " + y + "</span>";
    if (first) h += '<button type="button" class="bc-nav" data-nav="1" aria-label="Next month">›</button>';
    else h += "<span></span>";
    h += '</div><div class="bc-grid">';
    WDS.forEach(function (w) { h += '<span class="bc-wd">' + w + "</span>"; });
    for (var i = 0; i < firstDow; i++) h += "<span></span>";
    for (var d = 1; d <= days; d++) {
      var dt = new Date(y, m, d);
      var cls = [];
      var dis = dt < today ? " disabled" : "";
      if (start && !end && dt.getTime() === start.getTime()) cls.push("sel", "only");
      if (start && end) {
        if (dt.getTime() === start.getTime()) cls.push("sel", "start");
        else if (dt.getTime() === end.getTime()) cls.push("sel", "end");
        else if (dt > start && dt < end) cls.push("in-range");
      }
      h += '<button type="button" class="bc-day' + (cls.length ? " " + cls.join(" ") : "") + '" data-date="' + iso(dt) + '"' + dis + ">" + d + "</button>";
    }
    h += "</div></div>";
    return h;
  }
  function render() {
    var second = new Date(view.getFullYear(), view.getMonth() + 1, 1);
    root.innerHTML = '<div class="bc-months">' + monthHTML(view, true) + monthHTML(second, false) + "</div>";
    var prev = root.querySelector('[data-nav="-1"]');
    if (prev) prev.disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1);
    var next = root.querySelector('[data-nav="1"]');
    if (next) next.disabled = view >= maxView;
    update();
  }
  function update() {
    var inEl = document.getElementById("bk-checkin");
    var outEl = document.getElementById("bk-checkout");
    var nEl = document.getElementById("bk-nights");
    var sIn = document.getElementById("bks-in"), sOut = document.getElementById("bks-out"), sN = document.getElementById("bks-n");
    var btn = document.getElementById("bk-submit");
    var hint = document.getElementById("bk-hint");
    var nights = start && end ? Math.round((end - start) / 86400000) : 0;
    if (inEl) inEl.value = start ? iso(start) : "";
    if (outEl) outEl.value = end ? iso(end) : "";
    if (nEl) nEl.value = nights || "";
    if (sIn) sIn.textContent = start ? fmt(start) : "—";
    if (sOut) sOut.textContent = end ? fmt(end) : "—";
    if (sN) sN.textContent = nights ? nights + (nights === 1 ? " night" : " nights") : "—";
    if (btn) btn.disabled = !(start && end);
    if (hint) {
      if (!start) hint.textContent = "Select your check-in date.";
      else if (!end) hint.textContent = "Now select a check-out date.";
      else hint.textContent = "Dates look good. Fill in your details below and send the request.";
    }
  }
  root.addEventListener("click", function (e) {
    var nav = e.target.closest(".bc-nav");
    if (nav) {
      view = new Date(view.getFullYear(), view.getMonth() + parseInt(nav.dataset.nav, 10), 1);
      render();
      return;
    }
    var day = e.target.closest(".bc-day");
    if (!day || day.disabled) return;
    var parts = day.dataset.date.split("-");
    var dt = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    if (!start || end) { start = dt; end = null; }
    else if (dt.getTime() === start.getTime()) { start = null; }
    else if (dt < start) { start = dt; }
    else { end = dt; }
    render();
  });
  var form = document.getElementById("bk-form");
  if (form) form.addEventListener("submit", function (e) {
    if (!start || !end) {
      e.preventDefault();
      var hint = document.getElementById("bk-hint");
      if (hint) hint.textContent = "Please select your dates on the calendar first.";
      root.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (typeof gtag === "function") {
      gtag("event", "respite_booking_request", { event_category: "engagement" });
    }
  });
  render();
})();

// Reserve a Suite request flow (/reserve/): stay type, apartment preference, then the
// contact details, sent through the shared lead sender. No availability feed, no
// checkout and no deposit: the team calls back with what is open and the rate.
(function () {
  var root = document.getElementById("reserve");
  if (!root) return;
  var state = { stay: "", stayLabel: "", apt: "", aptLabel: "" };
  function show(step) {
    [1, 2, 3].forEach(function (n) {
      var pane = document.getElementById("wiz-" + n);
      if (pane) { if (n === step) pane.removeAttribute("hidden"); else pane.setAttribute("hidden", ""); }
      var dot = root.querySelector('[data-step-dot="' + n + '"]');
      if (dot) dot.classList.toggle("on", n <= step);
    });
    if (step > 1) { var h = document.getElementById("wiz-" + step); if (h) h.scrollIntoView({ behavior: "smooth", block: "start" }); }
  }
  function pressed(group, btn) {
    root.querySelectorAll(group).forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
  }
  function summary() {
    var t = document.getElementById("wiz-sum-type"); if (t) t.textContent = state.stayLabel;
    var a = document.getElementById("wiz-sum-apt"); if (a) a.textContent = state.aptLabel;
    var st = document.getElementById("rv-stay"); if (st) st.value = state.stayLabel;
    var ap = document.getElementById("rv-apt"); if (ap) ap.value = state.aptLabel;
  }
  root.querySelectorAll("[data-pick-stay]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.stay = btn.dataset.pickStay; state.stayLabel = btn.dataset.label || btn.textContent.trim();
      pressed("[data-pick-stay]", btn);
      summary();
      show(2);
      if (typeof gtag === "function") gtag("event", "reserve_step", { event_label: "stay_" + state.stay });
    });
  });
  root.querySelectorAll("[data-pick-apt]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.apt = btn.dataset.pickApt; state.aptLabel = btn.dataset.label || btn.textContent.trim();
      pressed("[data-pick-apt]", btn);
      summary();
      show(3);
      if (typeof gtag === "function") gtag("event", "reserve_step", { event_label: "apt_" + state.apt });
    });
  });
  root.addEventListener("click", function (e) {
    var back = e.target.closest("[data-wiz-back]");
    if (back) show(parseInt(back.dataset.wizBack, 10));
  });
  var form = document.getElementById("rv-form");
  if (form) form.addEventListener("submit", function (e) {
    if (!state.stay || !state.apt) {
      e.preventDefault();
      show(state.stay ? 2 : 1);
    } else if (typeof gtag === "function") {
      gtag("event", "reserve_request", { event_category: "engagement", event_label: state.stay + "_" + state.apt });
    }
  });
  // Deep link: /reserve/?type=studio|onebed|either|respite
  var want = (new URLSearchParams(location.search).get("type") || "").toLowerCase();
  if (want) {
    var stayBtn = root.querySelector('[data-pick-stay="' + (want === "respite" ? "respite" : "al") + '"]');
    if (stayBtn) stayBtn.click();
    var aptBtn = root.querySelector('[data-pick-apt="' + want + '"]');
    if (aptBtn) aptBtn.click();
  }
})();

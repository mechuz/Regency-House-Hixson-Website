// Regency House — "Ask us" chat assistant.
// Answers common questions from the facts published on this site (no AI service,
// nothing sent anywhere until a visitor chooses to leave their number), and points
// every conversation toward a tour, a reservation request or a callback.
// Callback requests go through the site's one lead sender (main.js) like every other
// form, with the visitor's questions in chat_question, and land on /thank-you/.
// Rules kept here: no prices, no memory care, private pay plus PACE only, one phone number.
(function () {
  if (window.rhChat) return;
  if (document.body && document.body.getAttribute("data-page") === "team") return; // staff page: no family chat
  window.rhChat = true;

  var MAIN = '<a href="tel:4238700050" data-track="phone">(423) 870-0050</a>';
  var RESERVE = { label: "Reserve a suite", href: "/reserve/" };
  var TOUR = { label: "Schedule a tour", href: "/contact-us/" };
  var VISIT = { label: "Book a visit", href: "/visit/" };
  var CALLBACK = { label: "Have someone call me", action: "callback" };
  var PAYING = { label: "Paying for senior living", href: "/paying-for-senior-living/" };

  // Each entry: words that suggest the topic, the answer, and follow-up buttons.
  var KB = [
    { k: ["price", "cost", "rate", "rates", "how much", "fee", "fees", "expensive", "afford", "monthly", "pricing", "charge", "quote"],
      a: 'Regency House has one inclusive monthly rate, set by the apartment you choose, with no care levels or tiered pricing. The rate covers the apartment, personal care, medication management, three meals a day, housekeeping, laundry, activities and transportation. We quote it by phone rather than publishing a figure, because it depends on the apartment and what is open: call ' + MAIN + ' and we will give you a clear estimate in about ten minutes. How the rate works is explained on our <a href="/rates-floor-plans/">Residences &amp; Rates</a> page.',
      b: [CALLBACK, RESERVE] },
    { k: ["pace", "alexian", "all-inclusive care for the elderly", "program of all-inclusive"],
      a: 'Yes. Regency House welcomes participants enrolled in PACE, the Program of All-Inclusive Care for the Elderly (in Hamilton County that is Ascension Living Alexian PACE). PACE participants keep their PACE care team while living here. If you are not enrolled yet, the PACE program itself decides eligibility (generally 55 and older, living in its service area and meeting the state nursing-home level of care). Our <a href="/paying-for-senior-living/#pace">guide to paying for senior living</a> explains it in plain words.',
      b: [PAYING, CALLBACK] },
    { k: ["medicaid", "tenncare", "choices", "insurance", "long-term care insurance", "ltc", " va ", "veteran", "veterans", "aid and attendance", "pay for", "private pay", "accept", "benefits"],
      a: 'Regency House is a private-pay community, and we also welcome participants enrolled in PACE (the Program of All-Inclusive Care for the Elderly). We do not bill Medicaid, TennCare CHOICES, the VA or insurance companies; families pay the community directly. Some families do receive a benefit or an insurance reimbursement themselves and use it toward the monthly rate; whether one applies is between the family and the insurer or the VA, and a benefits counselor can confirm it. Our guide to <a href="/paying-for-senior-living/">paying for senior living</a> walks through the options.',
      b: [PAYING, CALLBACK] },
    { k: ["medicare"],
      a: 'Medicare does not pay for room and board or everyday personal care in assisted living, at any community. It still covers doctor visits, therapy and prescriptions while you live here. More in our guide to <a href="/paying-for-senior-living/">paying for senior living</a>. Regency House is private pay and welcomes PACE participants.',
      b: [PAYING, CALLBACK] },
    { k: ["available", "availability", "opening", "openings", "vacancy", "vacancies", "room open", "apartment open", "space", "waitlist", "waiting list", "right now", "today"],
      a: 'With forty-eight apartments, availability changes from week to week, so the quickest answer is a phone call: ' + MAIN + '. You can also <a href="/reserve/">send a reservation request</a> and our team will call you back with what is open and the rate.',
      b: [RESERVE, CALLBACK] },
    { k: ["reserve", "reservation", "apply", "application", "deposit", "sign up", "hold a", "hold an", "move in", "move-in", "lease", "contract"],
      a: 'Use <a href="/reserve/">Reserve a Suite</a> to tell us the kind of stay and the apartment you have in mind, and our team calls you back with current availability and the monthly rate, quoted in writing. Nothing is paid online. Residency is confirmed after a brief nursing assessment and a signed resident agreement.',
      b: [RESERVE, CALLBACK] },
    { k: ["tour", "visit us", "see the", "come by", "stop by", "look around", "appointment", "lunch", "schedule"],
      a: 'Tours are available daily by appointment, and families are welcome to join residents for lunch. <a href="/visit/">Pick a day and time online</a>, use the <a href="/contact-us/">contact form</a>, or call ' + MAIN + '.',
      b: [VISIT, CALLBACK] },
    { k: ["memory", "dementia", "alzheimer", "alzheimers", "confused", "wander", "wandering", "forget", "secure unit", "locked"],
      a: 'Regency House does not offer memory care: we have no secure dementia unit, and we are honest about that so families choose the right setting. Our assisted living suits residents who want help with daily routines and medications while living safely in a private apartment. If a loved one needs a secured setting with dementia-specific care, the right choice is a community licensed for memory care; a doctor or a care manager can help with that search. If you are unsure which fits, our team is glad to talk it through: ' + MAIN + '.',
      b: [CALLBACK, TOUR] },
    { k: ["assisted living", "help with", "bathing", "dressing", "daily living", "personal care", "independent", "independence"],
      a: '<a href="/assisted-living/">Assisted living</a> at Regency House is for seniors who want their independence plus daily support: a private apartment, help with bathing, dressing and daily routines, medications managed by our nursing team, three meals a day, and a care team on site around the clock. There are no care levels, so a resident who needs more help is not charged more.',
      b: [TOUR, RESERVE] },
    { k: ["respite", "short term", "short-term", "short stay", "temporary", "trial", "after surgery", "after a hospital", "recover", "recovery", "caregiver break", "vacation", "few days", "few weeks"],
      a: '<a href="/respite-care/">Respite stays</a> are typically a few days to several weeks in a private apartment, with meals, housekeeping, medication management and the same 24-hour care our residents receive. They are private pay, billed by the day, with no long-term contract, and a brief nursing assessment comes first. You can <a href="/respite-care/#book">pick your dates online</a>.',
      b: [{ label: "Pick respite dates", href: "/respite-care/#book" }, CALLBACK] },
    { k: ["assessment", "qualify", "eligible", "eligibility", "approved", "approval", "requirements", "accept my", "right fit", "level of care"],
      a: 'Before anyone moves in or begins a respite stay, our nursing team completes a brief health assessment of health history, medications and mobility. Approval is based on that assessment and a signed resident agreement. Regency House is a good fit for people who need help with daily routines and medications but not skilled nursing or a secured memory care setting.',
      b: [CALLBACK, TOUR] },
    { k: ["nursing home", "skilled nursing", "rehab", "hospital", "licensed"],
      a: 'Regency House is a licensed assisted living community in Tennessee offering assisted living and respite stays. It is not a nursing home or skilled nursing facility, and it has no secure memory care unit. CommonSpirit Memorial Hospital Hixson is minutes away.',
      b: [TOUR, CALLBACK] },
    { k: ["nurse", "staff", "24 hour", "24-hour", "caregiver", "caregivers", "medication", "medications", "pills", "care team", "ratio"],
      a: 'Our care team is on site 24 hours a day, every day of the year, and the same staff care for the same residents each day. Medications are administered on schedule by our nursing team, and each resident has a personal care plan that is reviewed as needs change.',
      b: [TOUR, CALLBACK] },
    { k: ["food", "meal", "meals", "dining", "eat", "menu", "diet", "diabetic", "cook", "kitchen", "snack"],
      a: 'Three home-cooked meals a day are served in the dining room, with snacks available through the day. Each meal is cooked fresh on site with plenty of variety, and residents choose the Thursday menu at their monthly council meeting. Ask us about special diets when you call. Families are welcome to join residents for lunch.',
      b: [TOUR, RESERVE] },
    { k: ["pet", "pets", "dog", "cat", "animal"],
      a: 'Please ask us about pets when you call: ' + MAIN + '. The answer depends on the animal and the apartment, so our team will go over it with you directly. Residents do enjoy visits from a petting zoo and other visiting animals in the courtyard.',
      b: [CALLBACK, TOUR] },
    { k: ["visiting", "visit my", "visitors", "family visit", "visit hours", "visiting hours", "grandkids", "hours", "open"],
      a: 'Our care team is here around the clock, and families are welcome to visit; mealtime is a favorite, and you are welcome to join your loved one for lunch. Tours are by appointment, daily. For questions and tours call ' + MAIN + ' at any hour.',
      b: [VISIT, CALLBACK] },
    { k: ["activity", "activities", "calendar", "events", "bingo", "music", "things to do", "outing", "outings", "church", "faith", "bible", "devotional", "entertainment"],
      a: 'There is something on the <a href="/activities-calendar/">activities calendar</a> every day: exercise, crafts, games, bingo, live music and sing-alongs, devotionals and Bible study, outings, and a celebration for every holiday. Joining in is always a choice. The current month&rsquo;s printed calendar is at the front desk.',
      b: [TOUR, RESERVE] },
    { k: ["transport", "transportation", "ride", "rides", "doctor appointment", "drive", "shuttle", "bus"],
      a: 'Scheduled transportation to medical appointments and group outings is included in the monthly rate.',
      b: [TOUR, CALLBACK] },
    { k: ["laundry", "housekeeping", "clean", "wifi", "wi-fi", "utilities", "included", "amenities", "salon", "barber", "hair", "courtyard", "garden"],
      a: 'Weekly housekeeping, personal laundry, utilities and Wi-Fi are included. There is an on-site salon, a courtyard planted with roses and daylilies between the apartment wings, and common rooms for activities and visits. See all <a href="/amenities/">amenities &amp; services</a>.',
      b: [TOUR, RESERVE] },
    { k: ["suite", "suites", "apartment", "apartments", "room", "rooms", "floor plan", "floor plans", "studio", "one bedroom", "one-bedroom", "size", "square feet", "couple", "couples", "husband", "wife", "furniture", "kitchenette"],
      a: 'Regency House has forty-eight private apartments in two styles: a studio (our most popular) and a one-bedroom with a separate bedroom and living room, which suits couples well. Every apartment has its own kitchenette and a private bathroom with safety fixtures, and residents furnish it with their own things. See <a href="/rates-floor-plans/">Residences &amp; Rates</a>.',
      b: [RESERVE, TOUR] },
    { k: ["where", "address", "location", "located", "directions", "parking", "hixson", "chattanooga", "red bank", "soddy", "signal mountain", "northgate", "highway 153", "near"],
      a: 'We are at 2062 Hamill Road, Hixson, TN 37343, about five minutes from Highway 153, near Northgate Mall and CommonSpirit Memorial Hospital Hixson, and an easy drive from Chattanooga, Red Bank, Soddy-Daisy and Signal Mountain. <a href="https://www.google.com/maps/dir/?api=1&amp;destination=2062+Hamill+Road+Hixson+TN+37343" target="_blank" rel="noopener">Get directions</a>.',
      b: [VISIT, RESERVE] },
    { k: ["job", "jobs", "career", "careers", "hiring", "employment", "work there", "apply for a job", "vendor", "caregiver job", "caregiver position", "cna", "looking for work", "hire", "hiring now", "resume", "work for you", "caregiver jobs", "position"],
      a: 'For employment, vendor and current-resident questions, please call our main line at ' + MAIN + '. We do not have a careers page, and this chat does not take applications.',
      b: [] },
    { k: ["portal", "rent", "pay my", "resident account", "bill", "invoice", "maintenance"],
      a: 'For questions about a current resident&rsquo;s account or bill, please call ' + MAIN + ' and ask for the office.',
      b: [] },
    { k: ["phone", "call", "number", "contact", "email", "talk to someone", "speak", "human", "person", "someone"],
      a: 'Call ' + MAIN + ' at any hour; you reach our community in Hixson directly, not a call center. Email: <a href="mailto:info@hixsonregencyhouse.com">info@hixsonregencyhouse.com</a>. Or leave your number and we will call you.',
      b: [CALLBACK, TOUR] },
    { k: ["smoke", "smoking", "alcohol", "policy", "policies", "rules"],
      a: 'Please call ' + MAIN + ' and our team will go over community policies with you.',
      b: [CALLBACK] }
  ];

  var GREETING = 'Hi! I can answer questions about care, apartments, availability, respite stays, paying for care and life at Regency House. What would you like to know?';
  var CHIPS = ["Rates", "Availability", "Reserve a suite", "Respite stays", "Paying for care", "Schedule a tour"];
  var FALLBACK = { a: 'I don&rsquo;t have a good answer for that one. Leave your number and our team will call you back, or call ' + MAIN + '.', b: [CALLBACK, TOUR] };

  function track(name, label) {
    if (typeof gtag === "function") gtag("event", name, { event_category: "chat", event_label: label || "" });
  }

  function find(text) {
    var t = " " + text.toLowerCase().replace(/[^a-z0-9' -]/g, " ") + " ";
    var best = null, score = 0;
    KB.forEach(function (e) {
      var s = 0;
      e.k.forEach(function (w) { if (t.indexOf(w.indexOf(" ") > -1 ? w : " " + w) > -1 || t.indexOf(w + " ") > -1) s += w.length; });
      if (s > score) { score = s; best = e; }
    });
    return best || FALLBACK;
  }

  var css = document.createElement("link");
  css.rel = "stylesheet"; css.href = "/assets/css/chat.css?v=1";
  document.head.appendChild(css);

  var launcher = document.createElement("button");
  launcher.type = "button"; launcher.className = "rhc-launch"; launcher.setAttribute("aria-expanded", "false");
  launcher.setAttribute("aria-controls", "rhc-panel");
  launcher.innerHTML = '<span aria-hidden="true">&#128172;</span> Questions? Ask us';

  var panel = document.createElement("section");
  panel.id = "rhc-panel"; panel.className = "rhc-panel"; panel.hidden = true;
  panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Ask Regency House");
  panel.innerHTML =
    '<header class="rhc-head"><strong>Ask Regency House</strong><button type="button" class="rhc-close" aria-label="Close chat">&times;</button></header>' +
    '<div class="rhc-log" aria-live="polite"></div>' +
    '<form class="rhc-input"><label class="rhc-sr" for="rhc-q">Your question</label>' +
    '<input id="rhc-q" type="text" autocomplete="off" placeholder="Type your question" maxlength="200">' +
    '<button type="submit">Send</button></form>' +
    '<p class="rhc-note">Automated answers from our website. For anything personal or medical, talk with our team.</p>';

  document.body.appendChild(launcher);
  document.body.appendChild(panel);
  var log = panel.querySelector(".rhc-log");
  var started = false;

  function bubble(html, who) {
    var d = document.createElement("div");
    d.className = "rhc-msg rhc-" + who;
    if (who === "user") d.textContent = html; else d.innerHTML = html;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  function buttons(list) {
    if (!list || !list.length) return;
    var row = document.createElement("div");
    row.className = "rhc-actions";
    list.forEach(function (b) {
      var el;
      if (b.href) {
        el = document.createElement("a"); el.href = b.href; el.className = "rhc-btn";
        el.addEventListener("click", function () { track("chat_cta", b.label); });
      } else {
        el = document.createElement("button"); el.type = "button"; el.className = "rhc-btn";
        el.addEventListener("click", function () { track("chat_cta", b.label); callbackForm(); });
      }
      el.textContent = b.label;
      row.appendChild(el);
    });
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }

  function chips() {
    var row = document.createElement("div");
    row.className = "rhc-chips";
    CHIPS.forEach(function (c) {
      var el = document.createElement("button");
      el.type = "button"; el.className = "rhc-chip"; el.textContent = c;
      el.addEventListener("click", function () { ask(c); });
      row.appendChild(el);
    });
    log.appendChild(row);
  }

  function ask(q) {
    q = (q || "").trim();
    if (!q) return;
    bubble(q, "user");
    var hit = find(q === "Rates" ? "price" : (q === "Paying for care" ? "pay for" : q));
    track("chat_question", hit === FALLBACK ? "unanswered" : hit.k[0]);
    setTimeout(function () { bubble(hit.a, "bot"); buttons(hit.b); }, 250);
  }

  function callbackForm() {
    if (log.querySelector(".rhc-form")) { log.querySelector(".rhc-form input").focus(); return; }
    bubble("Leave your name and number and our team will call you, usually the same day.", "bot");
    var f = document.createElement("form");
    f.className = "rhc-form"; f.method = "POST"; f.action = "/thank-you/"; f.setAttribute("data-lead-form", "");
    f.innerHTML =
      '<input type="hidden" name="_cc" value="info@hixsonregencyhouse.com">' +
      '<input type="hidden" name="_subject" value="Chat callback request">' +
      '<input type="hidden" name="_template" value="table">' +
      '<input type="hidden" name="_next" value="https://www.hixsonregencyhouse.com/thank-you/">' +
      '<input type="hidden" name="_captcha" value="false">' +
      '<input type="text" name="_honey" class="rhc-sr" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<input type="hidden" name="chat_question" value="">' +
      '<label class="rhc-sr" for="rhc-name">Name</label><input id="rhc-name" name="name" required autocomplete="name" placeholder="Your name">' +
      '<label class="rhc-sr" for="rhc-phone">Phone</label><input id="rhc-phone" name="phone" type="tel" required autocomplete="tel" placeholder="Phone number">' +
      '<select name="inquiry_from" required data-screen-who aria-label="I am"><option value="">I am&hellip;</option><option>Looking for care for a family member</option><option>Looking for care for myself</option><option>A hospital, doctor or care professional</option><option value="job">Looking for a job</option><option value="vendor">A vendor or business</option></select>' +
      '<select name="interest" aria-label="Interested in"><option>Assisted Living</option><option>Respite or Short-Term Stay</option><option>Rates &amp; Availability</option><option>Scheduling a Tour</option><option>Paying for care / PACE</option></select>' +
      '<button type="submit" class="rhc-btn">Request a call</button>';
    f.addEventListener("submit", function () {
      var qs = Array.prototype.map.call(log.querySelectorAll(".rhc-user"), function (n) { return n.textContent; });
      f.querySelector('[name="chat_question"]').value = qs.join(" | ").slice(0, 500);
      track("chat_callback_submit", location.pathname);
    });
    log.appendChild(f);
    if (window.rhScreenForm) window.rhScreenForm(f);
    log.scrollTop = log.scrollHeight;
    f.querySelector("#rhc-name").focus();
  }

  function open() {
    panel.hidden = false; launcher.setAttribute("aria-expanded", "true"); launcher.classList.add("rhc-open");
    if (!started) { started = true; bubble(GREETING, "bot"); chips(); track("chat_open", location.pathname); }
    setTimeout(function () { panel.querySelector("#rhc-q").focus(); }, 50);
  }
  function close() {
    panel.hidden = true; launcher.setAttribute("aria-expanded", "false"); launcher.classList.remove("rhc-open");
    launcher.focus();
  }

  launcher.addEventListener("click", function () { panel.hidden ? open() : close(); });
  panel.querySelector(".rhc-close").addEventListener("click", close);
  panel.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  panel.querySelector(".rhc-input").addEventListener("submit", function (e) {
    e.preventDefault();
    var i = panel.querySelector("#rhc-q");
    ask(i.value); i.value = "";
  });
})();

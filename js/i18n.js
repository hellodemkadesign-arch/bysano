(function () {
  var STORAGE_KEY = "bysano_lang";
  var langSwitchBound = false;

  function resolveLocale() {
    try {
      var params = new URLSearchParams(window.location.search);
      var q = (params.get("lang") || params.get("locale") || "").toLowerCase();
      if (q === "ru" || q === "ru-ru") return "ru";
      if (q === "en" || q === "en-us" || q === "en-gb") return "en";
    } catch (e) {}

    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "ru" || stored === "en") return stored;
    } catch (e2) {}

    var list = [];
    if (navigator.language) list.push(navigator.language);
    if (navigator.languages && navigator.languages.length) {
      for (var j = 0; j < navigator.languages.length; j++) {
        if (list.indexOf(navigator.languages[j]) === -1) list.push(navigator.languages[j]);
      }
    }
    if (navigator.userLanguage && list.indexOf(navigator.userLanguage) === -1) {
      list.push(navigator.userLanguage);
    }

    for (var i = 0; i < list.length; i++) {
      var lang = (list[i] || "").toLowerCase();
      if (lang.startsWith("ru")) return "ru";
    }
    return "en";
  }

  function persistLocale(locale) {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch (e) {}
    try {
      var u = new URL(window.location.href);
      if (u.searchParams.has("lang") || u.searchParams.has("locale")) {
        u.searchParams.delete("lang");
        u.searchParams.delete("locale");
        window.history.replaceState({}, "", u.pathname + u.search + u.hash);
      }
    } catch (e2) {}
  }

  function localesBaseUrl() {
    var scripts = document.getElementsByTagName("script");
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src;
      if (!src || src.indexOf("i18n.js") === -1) continue;
      try {
        var u = new URL(src);
        u.pathname = u.pathname.replace(/\/js\/i18n\.js$/i, "/locales/");
        return u.href;
      } catch (e) {}
    }
    try {
      return new URL("locales/", window.location.href).href;
    } catch (e2) {
      return "./locales/";
    }
  }

  function get(obj, path) {
    return path.split(".").reduce(function (acc, key) {
      return acc != null ? acc[key] : undefined;
    }, obj);
  }

  function deepMerge(base, override) {
    var out = JSON.parse(JSON.stringify(base));
    function walk(target, over) {
      if (!over) return;
      Object.keys(over).forEach(function (k) {
        var ov = over[k];
        var tv = target[k];
        if (
          ov !== null &&
          typeof ov === "object" &&
          !Array.isArray(ov) &&
          tv !== null &&
          typeof tv === "object" &&
          !Array.isArray(tv)
        ) {
          walk(tv, ov);
        } else {
          target[k] = ov;
        }
      });
    }
    walk(out, override);
    return out;
  }

  function setLangMobileOpen(wrap, open) {
    if (!wrap) return;
    var trig = wrap.querySelector(".nav-lang-mobile-trigger");
    var list = wrap.querySelector(".nav-lang-mobile-list");
    if (!trig || !list) return;
    trig.setAttribute("aria-expanded", open ? "true" : "false");
    wrap.classList.toggle("nav-lang-mobile--open", open);
    if (open) {
      list.removeAttribute("hidden");
    } else {
      list.setAttribute("hidden", "");
    }
  }

  function closeAllLangMobile() {
    document.querySelectorAll(".nav-lang-mobile").forEach(function (w) {
      setLangMobileOpen(w, false);
    });
  }

  function updateLangSwitcher(locale) {
    document.querySelectorAll(".nav-lang-desktop .nav-lang-btn").forEach(function (btn) {
      var code = btn.getAttribute("data-lang");
      var active = code === locale;
      btn.classList.toggle("nav-lang-btn--active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    var short = locale === "ru" ? "RU" : "EN";
    document.querySelectorAll(".nav-lang-mobile-current").forEach(function (el) {
      el.textContent = short;
    });

    document.querySelectorAll(".nav-lang-mobile-option").forEach(function (btn) {
      var code = btn.getAttribute("data-lang");
      var active = code === locale;
      btn.classList.toggle("nav-lang-mobile-option--active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function applyListAttributes(dict) {
    document.querySelectorAll("[data-i18n-list]").forEach(function (ul) {
      var key = ul.getAttribute("data-i18n-list");
      var items = get(dict, key);
      if (!Array.isArray(items)) return;
      var lis = ul.querySelectorAll(":scope > li");
      items.forEach(function (text, i) {
        if (lis[i]) lis[i].textContent = text;
      });
    });
  }

  function applyProcessSteps(dict) {
    var steps = document.querySelectorAll(".process-list .process-step");
    var stepData = get(dict, "process.steps");
    if (!Array.isArray(stepData)) return;
    steps.forEach(function (step, i) {
      var item = stepData[i];
      if (!item) return;
      var title = step.querySelector(".process-step-title");
      var desc = step.querySelector(".process-step-description");
      if (title) title.textContent = item.title;
      if (desc) desc.textContent = item.description;
    });
  }

  function applyTestimonialCards(dict) {
    var cards = document.querySelectorAll(".testimonials-track .testimonial-card");
    var isStudio = !!document.querySelector(".page-studio");
    var cardData = get(dict, isStudio ? "studio.testimonials.cards" : "testimonials.cards") || get(dict, "testimonials.cards");
    if (!Array.isArray(cardData)) return;
    cards.forEach(function (card, i) {
      var item = cardData[i];
      if (!item) return;
      var textEl = card.querySelector(".testimonial-text");
      var nameEl = card.querySelector(".testimonial-name");
      var roleEl = card.querySelector(".testimonial-role");
      if (textEl) textEl.textContent = item.text;
      if (nameEl) nameEl.textContent = item.name;
      if (roleEl) roleEl.textContent = item.role;
    });
  }

  function applyTranslations(dict, locale) {
    document.documentElement.lang = locale === "ru" ? "ru" : "en";

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var val = get(dict, key);
      if (val !== undefined && val !== null) el.textContent = val;
    });

    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-html");
      var val = get(dict, key);
      if (val !== undefined && val !== null) el.innerHTML = val;
    });

    document.querySelectorAll("[data-i18n-aria-label]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria-label");
      var val = get(dict, key);
      if (val !== undefined && val !== null) el.setAttribute("aria-label", val);
    });

    document.querySelectorAll("[data-i18n-alt]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-alt");
      var val = get(dict, key);
      if (val !== undefined && val !== null) el.setAttribute("alt", val);
    });

    applyListAttributes(dict);
    applyProcessSteps(dict);
    applyTestimonialCards(dict);

    updateLangSwitcher(locale);

    window.__SITE_I18N__ = {
      menuOpen: get(dict, "a11y.menuOpen") || "Open menu",
      menuClose: get(dict, "a11y.menuClose") || "Close menu",
    };

    document.dispatchEvent(new CustomEvent("localeapplied", { detail: { locale: locale } }));
  }

  function loadLocale(code) {
    var url = localesBaseUrl() + code + ".json";
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("locale " + code + " HTTP " + r.status + " (" + url + ")");
      return r.json();
    });
  }

  function warnFetch(err, locale) {
    var hint =
      window.location.protocol === "file:"
        ? "Opened as file:// — Chrome blocks fetch() for locales/*.json. Run a local server (e.g. python3 -m http.server) and use http://localhost:8000/"
        : "Check locales/" + locale + ".json returns 200 (Network tab).";
    console.warn("[i18n] Failed to load translations:", err && err.message ? err.message : err, "|", hint);
  }

  function loadAndApply(locale) {
    updateLangSwitcher(locale);
    if (locale === "en") {
      loadLocale("en")
        .then(function (dict) {
          applyTranslations(dict, "en");
        })
        .catch(function (err) {
          warnFetch(err, "en");
        });
      return;
    }

    Promise.all([loadLocale("en"), loadLocale("ru")])
      .then(function (pair) {
        var dict = deepMerge(pair[0], pair[1]);
        applyTranslations(dict, "ru");
      })
      .catch(function (err) {
        warnFetch(err, "ru");
        loadLocale("en")
          .then(function (dict) {
            applyTranslations(dict, "en");
          })
          .catch(function () {});
      });
  }

  function bindLangSwitcher() {
    if (langSwitchBound) return;
    langSwitchBound = true;

    document.addEventListener("click", function (e) {
      var trig = e.target.closest && e.target.closest(".nav-lang-mobile-trigger");
      if (trig && document.body.contains(trig)) {
        e.preventDefault();
        e.stopPropagation();
        var wrap = trig.closest(".nav-lang-mobile");
        var isOpen = trig.getAttribute("aria-expanded") === "true";
        document.querySelectorAll(".nav-lang-mobile").forEach(function (w) {
          setLangMobileOpen(w, w === wrap ? !isOpen : false);
        });
        return;
      }

      var mob = e.target.closest && e.target.closest(".nav-lang-mobile-option");
      if (mob && document.body.contains(mob)) {
        var lang = mob.getAttribute("data-lang");
        if (lang !== "en" && lang !== "ru") return;
        e.preventDefault();
        persistLocale(lang);
        loadAndApply(lang);
        closeAllLangMobile();
        return;
      }

      var btn = e.target.closest && e.target.closest(".nav-lang-desktop .nav-lang-btn");
      if (btn && document.body.contains(btn)) {
        var langDesk = btn.getAttribute("data-lang");
        if (langDesk !== "en" && langDesk !== "ru") return;
        e.preventDefault();
        persistLocale(langDesk);
        loadAndApply(langDesk);
        return;
      }

      if (!e.target.closest || !e.target.closest(".nav-lang-mobile")) {
        closeAllLangMobile();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeAllLangMobile();
    });
  }

  function init() {
    bindLangSwitcher();
    loadAndApply(resolveLocale());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

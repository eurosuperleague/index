(function () {
  "use strict";

  var search = document.getElementById("rulesSearch");
  var clear = document.getElementById("rulesClear");
  var status = document.getElementById("rulesStatus");
  var empty = document.getElementById("rulesEmpty");
  var sections = Array.from(document.querySelectorAll(".rules-section"));
  var links = Array.from(document.querySelectorAll(".rules-toc a"));
  var index = sections.map(function (section) {
    return { section: section, text: section.textContent.toLowerCase() };
  });

  function filterRules() {
    var terms = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    var count = 0;
    index.forEach(function (entry, i) {
      var matches = terms.every(function (term) { return entry.text.indexOf(term) !== -1; });
      entry.section.hidden = !matches;
      links[i].hidden = !matches;
      if (matches) { count += 1; }
    });
    status.textContent = terms.length ? count + " of " + sections.length + " sections match" : "All " + sections.length + " sections";
    clear.hidden = !search.value;
    empty.hidden = count !== 0;
  }

  search.addEventListener("input", filterRules);
  clear.addEventListener("click", function () {
    search.value = "";
    filterRules();
    search.focus();
  });
  document.getElementById("rulesPrint").addEventListener("click", function () { window.print(); });

  function revealHashTarget() {
    var target = document.getElementById(window.location.hash.slice(1));
    if (target && target.classList.contains("rules-section") && target.hidden) {
      search.value = "";
      filterRules();
      target.scrollIntoView();
    }
  }
  window.addEventListener("hashchange", revealHashTarget);

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        links.forEach(function (link) {
          if (link.hash === "#" + entry.target.id) { link.setAttribute("aria-current", "location"); }
          else { link.removeAttribute("aria-current"); }
        });
      });
    }, { rootMargin: "0px 0px -65% 0px" });
    sections.forEach(function (section) { observer.observe(section); });
  }
  filterRules();
  revealHashTarget();
}());

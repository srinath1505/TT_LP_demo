/**
 * Searchable country dropdown (shared with IB application form UX).
 */
(function (global) {
  function initSearchSelect(opts) {
    var wrap = opts.wrap;
    var hidden = opts.hidden;
    var input = opts.input;
    var listEl = opts.list;
    var items = opts.items;
    var onChange = opts.onChange || function () {};

    if (!wrap || !hidden || !input || !listEl || !items || !items.length) return;

    var optionEls = [];
    var highlightIdx = -1;

    function norm(s) {
      return String(s || "")
        .toLowerCase()
        .trim();
    }

    function buildOptions() {
      listEl.innerHTML = "";
      optionEls = [];
      items.forEach(function (item) {
        var li = document.createElement("li");
        li.setAttribute("role", "option");
        li.className = "ib-search-select-option";
        li.dataset.value = item.value;
        li.dataset.label = item.label;
        li.textContent = item.label;
        listEl.appendChild(li);
        optionEls.push(li);
      });
    }

    function filterOptions(query) {
      var q = norm(query);
      optionEls.forEach(function (li) {
        var label = norm(li.dataset.label);
        var value = norm(li.dataset.value);
        var match = !q || label.indexOf(q) !== -1 || value.indexOf(q) !== -1;
        li.hidden = !match;
      });
    }

    function visibleOptions() {
      return optionEls.filter(function (li) {
        return !li.hidden;
      });
    }

    function stripHighlightClasses() {
      optionEls.forEach(function (li) {
        li.classList.remove("is-highlighted");
      });
    }

    function clearHighlight() {
      highlightIdx = -1;
      stripHighlightClasses();
    }

    function applyHighlight(vis) {
      stripHighlightClasses();
      if (highlightIdx < 0 || highlightIdx >= vis.length) return;
      vis[highlightIdx].classList.add("is-highlighted");
      vis[highlightIdx].scrollIntoView({ block: "nearest" });
    }

    function openList() {
      listEl.hidden = false;
      input.setAttribute("aria-expanded", "true");
    }

    function closeList() {
      listEl.hidden = true;
      input.setAttribute("aria-expanded", "false");
      clearHighlight();
    }

    function syncInputFromHidden() {
      var v = hidden.value.trim();
      if (!v) {
        input.value = "";
        return;
      }
      var found = items.filter(function (i) {
        return i.value === v;
      })[0];
      input.value = found ? found.label : "";
    }

    buildOptions();

    input.addEventListener("focus", function () {
      filterOptions(input.value);
      openList();
    });

    input.addEventListener("input", function () {
      hidden.value = "";
      filterOptions(input.value);
      openList();
      clearHighlight();
      onChange();
    });

    listEl.addEventListener("mousedown", function (e) {
      e.preventDefault();
    });

    listEl.addEventListener("click", function (e) {
      var li = e.target.closest(".ib-search-select-option");
      if (!li || !listEl.contains(li) || li.hidden) return;
      hidden.value = li.dataset.value;
      input.value = li.dataset.label || "";
      closeList();
      hidden.dispatchEvent(new Event("change", { bubbles: true }));
      onChange();
    });

    document.addEventListener("click", function (e) {
      if (!wrap.contains(e.target)) closeList();
    });

    input.addEventListener("keydown", function (e) {
      var vis = visibleOptions();
      if (e.key === "Escape") {
        e.preventDefault();
        closeList();
        syncInputFromHidden();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (listEl.hidden) {
          filterOptions(input.value);
          openList();
          vis = visibleOptions();
        }
        if (!vis.length) return;
        highlightIdx = Math.min(highlightIdx + 1, vis.length - 1);
        if (highlightIdx < 0) highlightIdx = 0;
        applyHighlight(vis);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (listEl.hidden || !vis.length) return;
        highlightIdx = Math.max(highlightIdx - 1, 0);
        applyHighlight(vis);
        return;
      }
      if (e.key === "Enter") {
        if (listEl.hidden || highlightIdx < 0) return;
        vis = visibleOptions();
        var chosen = vis[highlightIdx];
        if (!chosen) return;
        e.preventDefault();
        hidden.value = chosen.dataset.value;
        input.value = chosen.dataset.label || "";
        closeList();
        hidden.dispatchEvent(new Event("change", { bubbles: true }));
        onChange();
      }
    });

    syncInputFromHidden();
  }

  function initCountryField(prefix, onChange) {
    if (!prefix) return;

    var countryWrap = document.getElementById(prefix + "CountryWrap");
    var countryHidden = document.getElementById(prefix + "Country");
    var countryInput = document.getElementById(prefix + "CountrySearch");
    var countryList = document.getElementById(prefix + "CountryList");
    var rawCountries = global.TRADER_TOK_COUNTRY_OPTIONS;

    if (
      !countryWrap ||
      !countryHidden ||
      !countryInput ||
      !countryList ||
      !Array.isArray(rawCountries) ||
      !rawCountries.length
    ) {
      return;
    }

    var countryItems = rawCountries.map(function (row) {
      return { value: row.code, label: row.name };
    });

    initSearchSelect({
      wrap: countryWrap,
      hidden: countryHidden,
      input: countryInput,
      list: countryList,
      items: countryItems,
      onChange: onChange || function () {},
    });
  }

  global.TraderTokCountrySearch = {
    initSearchSelect: initSearchSelect,
    initCountryField: initCountryField,
  };
})(window);

/**
 * Shared helpers for marketing / contact / account-opening lead submissions.
 * UTM params are merged into payloads for all forms that use mergePayload().
 */
(function (global) {
  var UTM_STORAGE_KEY = "tradertok_utm_params";
  var ORGANIC_TRAFFIC_LABEL = "organic traffic";
  var LEADS_URL =
    "https://6dfed096-backend-clientzone.dataconect.com/api/v1/clientzone/leads";

  var BRAND_ID = "8f867771-8a91-4eac-acd9-3255502fceab";
  var BUSINESS_UNIT_ID = "fa26636a-0722-400f-91fc-90c88c9623d6";
  var BONUS_TAG_ID = "5dc023b1-8e1d-44e7-ad8e-815a947f452c";
  var TAG_ID = "fb251ea1-1956-428a-b5a3-015cfb017e37";
  var DEFAULT_GROUP = "118000\\Default.USD";

  var HEARD_ABOUT_FIELD_ID = "7b031f98-76ab-4a81-a188-12ddfe87ddcb";

  var HEARD_ABOUT_LABELS = {
    search: "Search engine",
    social: "Social Media",
    friend: "Friend or colleague",
    event: "Webinar or event",
    other: "Other",
  };

  var REGISTRATION_QUALIFICATION_FIELD_IDS = {
    age: "7ab6f7d9-6eb4-4036-85ee-4298d90d329e",
    monthlyIncome: "11f7782f-96a8-4632-b6eb-1f2bb9aa8762",
    interestedInAccount: "ab2d6df6-6deb-4698-8cf6-8e9c53df68d8",
    readyToTrade: "d098a30b-4f50-4437-aa90-7dceb8c89651",
    minDeposit100: "e4743ede-ed68-49bb-a149-50f34cbb5730",
  };

  var QUALIFICATION_FIELD_BASE_NAMES = {
    age: "lead_age",
    monthlyIncome: "lead_monthly_income",
    interestedInAccount: "lead_interested_account",
    readyToTrade: "lead_ready_to_trade",
    minDeposit100: "lead_min_deposit_100",
  };

  function qualT(key, fallback) {
    if (global.i18n && typeof global.i18n.t === "function") {
      var out = global.i18n.t(key);
      if (out && out !== key) return out;
    }
    return fallback;
  }

  function getQualificationPrefix(container) {
    if (!container || !container.querySelector) return "";
    var wrap = container.querySelector(".registration-qualification-fields");
    return wrap ? wrap.getAttribute("data-qual-prefix") || "" : "";
  }

  function qualFieldName(prefix, key) {
    return prefix + (QUALIFICATION_FIELD_BASE_NAMES[key] || key);
  }

  function readQualificationField(container, prefix, key) {
    var name = qualFieldName(prefix, key);
    var baseName = QUALIFICATION_FIELD_BASE_NAMES[key];
    if (
      baseName === "lead_interested_account" ||
      baseName === "lead_ready_to_trade" ||
      baseName === "lead_min_deposit_100"
    ) {
      var checked = container.querySelector(
        'input[name="' + name + '"]:checked',
      );
      return checked ? checked.value : "";
    }
    var field = container.querySelector('[name="' + name + '"]');
    if (!field || typeof field.value !== "string") return "";
    return field.value.trim();
  }

  function readQualificationValues(container) {
    var prefix = getQualificationPrefix(container);
    return {
      age: readQualificationField(container, prefix, "age"),
      monthlyIncome: readQualificationField(container, prefix, "monthlyIncome"),
      interestedInAccount: readQualificationField(
        container,
        prefix,
        "interestedInAccount",
      ),
      readyToTrade: readQualificationField(container, prefix, "readyToTrade"),
      minDeposit100: readQualificationField(container, prefix, "minDeposit100"),
    };
  }

  function parseQualificationBoolean(value) {
    if (value === "yes") return true;
    if (value === "no") return false;
    return null;
  }

  function hasQualificationFields(container) {
    if (!container || !container.querySelector) return false;
    return !!container.querySelector(".registration-qualification-fields");
  }

  function validateRegistrationQualificationFields(container) {
    if (!hasQualificationFields(container)) return "";

    var values = readQualificationValues(container);

    if (!values.age) {
      return qualT(
        "registrationQualification.errAgeRequired",
        "Please enter your age.",
      );
    }
    var ageNum = parseInt(values.age, 10);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 120) {
      return qualT(
        "registrationQualification.errAgeInvalid",
        "Please enter a valid age (18–120).",
      );
    }

    if (!values.monthlyIncome) {
      return qualT(
        "registrationQualification.errIncomeRequired",
        "Please enter your monthly income.",
      );
    }
    var income = parseFloat(values.monthlyIncome);
    if (isNaN(income) || income < 0) {
      return qualT(
        "registrationQualification.errIncomeInvalid",
        "Please enter a valid monthly income.",
      );
    }

    if (!values.interestedInAccount) {
      return qualT(
        "registrationQualification.errInterestedRequired",
        "Please indicate if you are interested in opening a trading account.",
      );
    }
    if (!values.readyToTrade) {
      return qualT(
        "registrationQualification.errReadyRequired",
        "Please indicate if you are ready to start trading now.",
      );
    }
    if (!values.minDeposit100) {
      return qualT(
        "registrationQualification.errDepositRequired",
        "Please indicate if you can make the minimum deposit of $100.",
      );
    }

    return "";
  }

  function buildRegistrationQualificationCustomFields(container) {
    if (!hasQualificationFields(container)) return [];

    var values = readQualificationValues(container);
    return [
      {
        id: REGISTRATION_QUALIFICATION_FIELD_IDS.age,
        value: String(values.age),
      },
      {
        id: REGISTRATION_QUALIFICATION_FIELD_IDS.monthlyIncome,
        value: String(values.monthlyIncome),
      },
      {
        id: REGISTRATION_QUALIFICATION_FIELD_IDS.interestedInAccount,
        value: parseQualificationBoolean(values.interestedInAccount),
      },
      {
        id: REGISTRATION_QUALIFICATION_FIELD_IDS.readyToTrade,
        value: parseQualificationBoolean(values.readyToTrade),
      },
      {
        id: REGISTRATION_QUALIFICATION_FIELD_IDS.minDeposit100,
        value: parseQualificationBoolean(values.minDeposit100),
      },
    ];
  }

  function appendQualificationCustomFields(existing, container) {
    var base = Array.isArray(existing) ? existing.slice() : [];
    return base.concat(buildRegistrationQualificationCustomFields(container));
  }

  function qualificationWatchSelectors(container) {
    if (!hasQualificationFields(container)) return [];
    var prefix = getQualificationPrefix(container);
    var keys = Object.keys(QUALIFICATION_FIELD_BASE_NAMES);
    var selectors = [];
    var i;
    for (i = 0; i < keys.length; i++) {
      selectors.push('[name="' + qualFieldName(prefix, keys[i]) + '"]');
    }
    return selectors;
  }

  function parseJsonSafe(raw) {
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function readStoredUtm() {
    try {
      var raw = sessionStorage.getItem(UTM_STORAGE_KEY);
      return raw ? parseJsonSafe(raw) || {} : {};
    } catch (error) {
      return {};
    }
  }

  function captureUtmFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var source = params.get("utm_source");
    var medium = params.get("utm_medium");
    var campaign = params.get("utm_campaign");
    if (!source && !medium && !campaign) return;

    var out = {};
    if (source) out.utmSource = source;
    if (medium) out.utmMedium = medium;
    if (campaign) out.utmCampaign = campaign;

    try {
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(out));
    } catch (error) {}
  }

  function getUtmPayload() {
    var params = new URLSearchParams(window.location.search);
    var stored = readStoredUtm();

    return {
      utmSource:
        params.get("utm_source") ||
        stored.utmSource ||
        ORGANIC_TRAFFIC_LABEL,
      utmMedium:
        params.get("utm_medium") ||
        stored.utmMedium ||
        ORGANIC_TRAFFIC_LABEL,
      utmCampaign:
        params.get("utm_campaign") ||
        stored.utmCampaign ||
        ORGANIC_TRAFFIC_LABEL,
    };
  }

  captureUtmFromUrl();

  function leadsHeaders() {
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      Referer: window.location.origin + "/",
      "x-platform-name": "ClientZone",
    };
  }

  function getLanguage() {
    if (typeof global.currentLanguage === "string" && global.currentLanguage) {
      return global.currentLanguage;
    }
    var fullLanguage =
      (navigator.language || navigator.userLanguage || "en").split("-")[0];
    return fullLanguage || "en";
  }

  function detectBrowser() {
    var userAgent = navigator.userAgent || "";
    if (/Edg/i.test(userAgent)) return "Edge";
    if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) return "Chrome";
    if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) return "Safari";
    if (/Firefox/i.test(userAgent)) return "Firefox";
    if (/OPR|Opera/i.test(userAgent)) return "Opera";
    if (/MSIE|Trident/i.test(userAgent)) return "Internet Explorer";
    return "Unknown";
  }

  function fallbackUserDeviceInfo() {
    return {
      appVersion: "1.0",
      uniqueId: "",
      device: navigator.platform || "Unknown",
      systemName: navigator.platform || "Unknown",
      useragent: navigator.userAgent || "",
      type: "website",
      brand: detectBrowser(),
      systemVersion: "1",
      language: getLanguage(),
    };
  }

  function getUserDeviceInfoSafe() {
    if (typeof global.getUserDeviceInfo === "function") {
      return global.getUserDeviceInfo();
    }
    return fallbackUserDeviceInfo();
  }

  function splitFullName(fullName) {
    var trimmed = String(fullName || "").trim();
    if (!trimmed) {
      return { firstName: "", lastName: "" };
    }
    var parts = trimmed.split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: parts[0] };
    }
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(" "),
    };
  }

  function defaultAccounts(isDemoAccount) {
    return [
      {
        groupName: DEFAULT_GROUP,
        leverage: 100,
        isDemoAccount: !!isDemoAccount,
      },
    ];
  }

  function heardAboutLabel(value) {
    return HEARD_ABOUT_LABELS[value] || value || "";
  }

  function buildHeardAboutCustomFields(value) {
    var label = heardAboutLabel(value);
    if (!label) return [];
    return [{ id: HEARD_ABOUT_FIELD_ID, value: label }];
  }

  function postLead(payload) {
    return fetch(LEADS_URL, {
      method: "POST",
      headers: leadsHeaders(),
      body: JSON.stringify(payload),
    }).then(function (response) {
      return response.text().then(function (raw) {
        return {
          response: response,
          data: parseJsonSafe(raw),
          raw: raw,
        };
      });
    });
  }

  function mergePayload(base) {
    var utm = getUtmPayload();
    var merged = {};
    var key;
    for (key in base) {
      if (Object.prototype.hasOwnProperty.call(base, key)) {
        merged[key] = base[key];
      }
    }
    for (key in utm) {
      if (Object.prototype.hasOwnProperty.call(utm, key)) {
        merged[key] = utm[key];
      }
    }
    return merged;
  }

  global.TraderTokLeads = {
    LEADS_URL: LEADS_URL,
    BRAND_ID: BRAND_ID,
    BUSINESS_UNIT_ID: BUSINESS_UNIT_ID,
    BONUS_TAG_ID: BONUS_TAG_ID,
    TAG_ID: TAG_ID,
    HEARD_ABOUT_LABELS: HEARD_ABOUT_LABELS,
    parseJsonSafe: parseJsonSafe,
    getUtmPayload: getUtmPayload,
    leadsHeaders: leadsHeaders,
    getLanguage: getLanguage,
    getUserDeviceInfoSafe: getUserDeviceInfoSafe,
    splitFullName: splitFullName,
    defaultAccounts: defaultAccounts,
    buildHeardAboutCustomFields: buildHeardAboutCustomFields,
    REGISTRATION_QUALIFICATION_FIELD_IDS: REGISTRATION_QUALIFICATION_FIELD_IDS,
    readQualificationValues: readQualificationValues,
    validateRegistrationQualificationFields:
      validateRegistrationQualificationFields,
    buildRegistrationQualificationCustomFields:
      buildRegistrationQualificationCustomFields,
    appendQualificationCustomFields: appendQualificationCustomFields,
    qualificationWatchSelectors: qualificationWatchSelectors,
    postLead: postLead,
    mergePayload: mergePayload,
  };
})(window);

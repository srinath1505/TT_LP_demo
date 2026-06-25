/**
 * Open demo / open live account pages — lead submission (IB-style, no password).
 */
(function () {
  var leads = window.TraderTokLeads;
  if (!leads) return;

  var otp = window.TraderTokRegistrationOtp;

  var FORM_CONFIGS = [
    {
      formId: "openDemoAccountPageForm",
      errorId: "openDemoPageError",
      isDemoAccount: true,
      submitFallback: "Submit demo request",
      submittingLabel: "Submitting...",
      countryPrefix: "openDemo",
    },
    {
      formId: "openLiveAccountPageForm",
      errorId: "openLivePageError",
      isDemoAccount: false,
      submitFallback: "Submit live account request",
      submittingLabel: "Submitting...",
      countryPrefix: "openLive",
    },
  ];

  function tr(key) {
    if (window.i18n && typeof window.i18n.t === "function") {
      var out = window.i18n.t(key);
      if (out && out !== key) return out;
    }
    return key;
  }

  function readValue(form, name) {
    var field = form.querySelector('[name="' + name + '"]');
    if (!field || typeof field.value !== "string") return "";
    return field.value.trim();
  }

  function showError(errEl, message) {
    if (!errEl) return;
    errEl.textContent = message || "";
    errEl.hidden = !message;
  }

  function buildAccountPayload(form, isDemoAccount) {
    var names = leads.splitFullName(readValue(form, "name"));
    var customFields = leads.appendQualificationCustomFields(
      leads.buildHeardAboutCustomFields(readValue(form, "heard_about")),
      form,
    );

    var payload = leads.mergePayload({
      firstName: names.firstName,
      lastName: names.lastName,
      email: readValue(form, "email"),
      phone: readValue(form, "phone"),
      country: readValue(form, "country"),
      language: leads.getLanguage(),
      brandId: leads.BRAND_ID,
      businessUnitId: leads.BUSINESS_UNIT_ID,
      tags: [{ id: leads.TAG_ID }],
      accounts: isDemoAccount
        ? [
            {
              groupName: "demo\\118000\\STANDART.USD",
              leverage: 100,
              isDemoAccount: true,
            },
          ]
        : leads.defaultAccounts(false),
      userDevice: leads.getUserDeviceInfoSafe(),
      customFields: customFields,
    });

    if (otp) {
      payload.registrationVerificationOtp = otp.getOtpValue(form);
    }

    return payload;
  }

  function getFormValidationError(form) {
    var name = readValue(form, "name");
    var email = readValue(form, "email");
    var phone = readValue(form, "phone");
    var country = readValue(form, "country");
    var heardAbout = readValue(form, "heard_about");
    var consent = form.querySelector('[name="consent"]');
    var isDemo = form.id === "openDemoAccountPageForm";

    if (!name) {
      return tr(
        isDemo
          ? "openDemoAccountPage.errors.nameRequired"
          : "openLiveAccountPage.errors.nameRequired",
      );
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return tr(
        isDemo
          ? "openDemoAccountPage.errors.emailInvalid"
          : "openLiveAccountPage.errors.emailInvalid",
      );
    }
    if (!phone) {
      return tr(
        isDemo
          ? "openDemoAccountPage.errors.phoneRequired"
          : "openLiveAccountPage.errors.phoneRequired",
      );
    }
    if (!country) {
      return tr(
        isDemo
          ? "openDemoAccountPage.errors.countryRequired"
          : "openLiveAccountPage.errors.countryRequired",
      );
    }
    if (!heardAbout) {
      return "Please tell us how you heard about us.";
    }
    if (!consent || !consent.checked) {
      return tr(
        isDemo
          ? "openDemoAccountPage.errors.consentRequired"
          : "openLiveAccountPage.errors.consentRequired",
      );
    }

    return leads.validateRegistrationQualificationFields(form) || "";
  }

  function validateForm(form, errEl) {
    var error = getFormValidationError(form);
    if (error) {
      showError(errEl, error);
      return false;
    }

    showError(errEl, "");
    return true;
  }

  function mountOtp(form, config) {
    if (!otp) return;

    otp.mount(form, {
      getSubmitButton: function () {
        return form.querySelector('button[type="submit"]');
      },
      getOtpPayload: function () {
        var names = leads.splitFullName(readValue(form, "name"));
        return {
          firstName: names.firstName,
          lastName: names.lastName,
          email: readValue(form, "email"),
          phone: readValue(form, "phone"),
          country: readValue(form, "country"),
          language: leads.getLanguage(),
          brandId: leads.BRAND_ID,
          businessUnitId: leads.BUSINESS_UNIT_ID,
        };
      },
      watchSelectors: [
        '[name="name"]',
        '[name="email"]',
        '[name="phone"]',
        '[name="country"]',
        '[name="heard_about"]',
        '[name="consent"]',
      ].concat(leads.qualificationWatchSelectors(form)),
      validateBeforeSend: function () {
        return getFormValidationError(form);
      },
      isFormComplete: function () {
        return !getFormValidationError(form);
      },
    });
  }

  function initForm(config) {
    var form = document.getElementById(config.formId);
    if (!form) return;

    var errEl = document.getElementById(config.errorId);
    var thankYouUrl = form.getAttribute("data-thank-you-url") || "";
    var submitBtn = form.querySelector('button[type="submit"]');

    mountOtp(form, config);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateForm(form, errEl)) return;

      if (otp && !otp.isReady(form)) {
        showError(
          errEl,
          tr("registrationOtp.errRequired") ||
            "Please verify your email with the code sent to you.",
        );
        return;
      }

      var originalText = submitBtn ? submitBtn.textContent : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = config.submittingLabel;
      }

      leads
        .postLead(buildAccountPayload(form, config.isDemoAccount))
        .then(function (result) {
          if (!result.response.ok) {
            var message =
              (result.data &&
                (result.data.message || result.data.error)) ||
              "Unable to submit your request right now. Please try again.";
            showError(errEl, message);
            return;
          }

          showError(errEl, "");
          if (thankYouUrl) {
            window.location.href = thankYouUrl;
          }
        })
        .catch(function () {
          showError(errEl, "A network error occurred. Please try again.");
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.textContent = originalText || config.submitFallback;
            if (otp) {
              otp.refresh(form);
            } else {
              submitBtn.disabled = false;
            }
          }
        });
    });
  }

  function initCountrySelects() {
    var countrySearch = window.TraderTokCountrySearch;
    if (!countrySearch || typeof countrySearch.initCountryField !== "function") {
      return;
    }
    countrySearch.initCountryField("openDemo");
    countrySearch.initCountryField("openLive");
  }

  FORM_CONFIGS.forEach(initForm);
  initCountrySelects();
})();

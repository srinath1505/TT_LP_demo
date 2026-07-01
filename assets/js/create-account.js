(function () {
    'use strict';

    var form;

    function val(id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : '';
    }

    function getValidationError() {
        var leads = window.TraderTokLeads;
        if (!val('ca-firstname')) return 'Please enter your first name.';
        if (!val('ca-lastname')) return 'Please enter your last name.';
        var email = val('ca-email');
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return 'Please enter a valid email address.';
        }
        if (!val('ca-phone')) return 'Please enter your phone number.';
        if (!val('createAccountCountry')) return 'Please select your country.';
        var pwdEl = document.getElementById('ca-password');
        if (!pwdEl || !pwdEl.value || pwdEl.value.length < 8) {
            return 'Password must be at least 8 characters.';
        }
        var consent = document.getElementById('ca-consent');
        if (!consent || !consent.checked) {
            return 'Please accept the Terms of Service and Privacy Policy.';
        }
        if (leads) {
            return leads.validateRegistrationQualificationFields(form) || '';
        }
        return '';
    }

    function showError(message) {
        var errEl = document.getElementById('ca-error');
        if (!errEl) return;
        errEl.textContent = message || '';
        errEl.hidden = !message;
    }

    document.addEventListener('DOMContentLoaded', function () {
        form = document.getElementById('createAccountForm');
        if (!form) return;

        if (window.TraderTokCountrySearch && typeof window.TraderTokCountrySearch.initCountryField === 'function') {
            window.TraderTokCountrySearch.initCountryField('createAccount');
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            var error = getValidationError();
            if (error) {
                showError(error);
                return;
            }

            var leads = window.TraderTokLeads;
            if (!leads) {
                showError('Unable to submit. Please refresh and try again.');
                return;
            }

            var submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating account…';
            }

            var payload = {
                firstName: val('ca-firstname'),
                lastName: val('ca-lastname'),
                email: val('ca-email'),
                phone: val('ca-phone'),
                password: document.getElementById('ca-password').value,
                country: val('createAccountCountry'),
                language: 'en',
                brandId: leads.BRAND_ID,
                businessUnitId: leads.BUSINESS_UNIT_ID,
                bonusTagId: leads.BONUS_TAG_ID,
                tags: [{ id: leads.TAG_ID }],
                accounts: [{ groupName: '118000\\Default.USD', leverage: 100, isDemoAccount: false }],
                userDevice: leads.getUserDeviceInfoSafe(),
                customFields: leads.buildRegistrationQualificationCustomFields(form),
            };

            leads.postLead(leads.mergePayload(payload))
                .then(function (result) {
                    if (!result.response.ok) {
                        var message = (result.data && (result.data.message || result.data.error)) ||
                            'Unable to submit your request right now. Please try again.';
                        showError(message);
                        return;
                    }
                    showError('');
                    window.location.href = './thank-you.html?kind=live';
                })
                .catch(function () {
                    showError('A network error occurred. Please try again.');
                })
                .finally(function () {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Create Account';
                    }
                });
        });
    });
})();
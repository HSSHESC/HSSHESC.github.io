const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const passwordStrength = require("../assets/js/password-strength.js");

class ElementStub {
  constructor(id) {
    this.id = id;
    this.attributes = new Map();
    this.className = "";
    this.disabled = false;
    this.hidden = true;
    this.listeners = new Map();
    this.src = "";
    this.textContent = "";
    this.value = "";
    this.classList = { add() {} };
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  querySelectorAll() {
    return [];
  }

  reportValidity() {
    return true;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  setCustomValidity() {}
}

const ids = [
  "accountEmail",
  "accountEmailSummary",
  "accountLoadingSection",
  "accountLogoutButton",
  "accountMessage",
  "accountSection",
  "changePasswordButton",
  "currentPassword",
  "mfaChallengeButton",
  "mfaChallengeCode",
  "mfaChallengeForm",
  "mfaChallengeSection",
  "mfaEnrollButton",
  "mfaEnrollCode",
  "mfaEnrollForm",
  "mfaQrCode",
  "mfaSecret",
  "mfaSetupSection",
  "newPassword",
  "newPasswordConfirm",
  "passwordChangeForm",
  "passwordMfaCode",
  "passwordStrengthBar",
  "passwordStrengthLabel",
  "passwordStrengthMeter",
];
const elements = Object.fromEntries(ids.map((id) => [id, new ElementStub(id)]));
elements.mfaEnrollForm.querySelectorAll = () => [
  elements.mfaEnrollCode,
  elements.mfaEnrollButton,
];

const user = { id: "admin-user", email: "admin@example.com" };
const factorId = "new-totp-factor";
let currentLevel = "aal1";
const mfaCalls = [];
const client = {
  auth: {
    async getUser() {
      return { data: { user }, error: null };
    },
    mfa: {
      async challengeAndVerify(parameters) {
        mfaCalls.push(parameters);
        currentLevel = "aal2";
        return { data: {}, error: null };
      },
      async enroll(parameters) {
        assert.deepEqual(JSON.parse(JSON.stringify(parameters)), {
          factorType: "totp",
          friendlyName: "ESC 관리자",
        });
        return {
          data: {
            id: factorId,
            totp: {
              qr_code: "data:image/svg+xml;charset=UTF-8,test-qr",
              secret: "TESTSECRET",
            },
          },
          error: null,
        };
      },
      async getAuthenticatorAssuranceLevel() {
        return {
          data: { currentLevel, nextLevel: currentLevel },
          error: null,
        };
      },
      async listFactors() {
        return {
          data: { all: [], phone: [], totp: [], webauthn: [] },
          error: null,
        };
      },
      async unenroll() {
        throw new Error("No abandoned factor should be removed.");
      },
    },
    onAuthStateChange() {
      return { data: { subscription: { unsubscribe() {} } } };
    },
    async signOut() {
      return { error: null };
    },
  },
  from(table) {
    assert.equal(table, "site_admins");
    return {
      select() {
        return this;
      },
      eq() {
        return this;
      },
      async maybeSingle() {
        return { data: { user_id: user.id }, error: null };
      },
    };
  },
};

const redirects = [];
const context = vm.createContext({
  console,
  document: {
    querySelector(selector) {
      return elements[selector.slice(1)];
    },
  },
  encodeURIComponent,
  window: {
    ESC_PASSWORD_STRENGTH: passwordStrength,
    ESC_SUPABASE: client,
    location: {
      replace(url) {
        redirects.push(url);
      },
    },
  },
});

const source = fs.readFileSync(
  path.resolve(__dirname, "../assets/js/account.js"),
  "utf8",
);
vm.runInContext(source, context, { filename: "assets/js/account.js" });

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

(async () => {
  await flushPromises();
  await flushPromises();

  assert.equal(elements.mfaSetupSection.hidden, false);
  assert.equal(elements.accountSection.hidden, true);
  assert.equal(elements.mfaQrCode.src.includes("test-qr"), true);
  assert.equal(elements.mfaSecret.textContent, "TESTSECRET");

  elements.mfaEnrollCode.value = "123456";
  await elements.mfaEnrollForm.listeners.get("submit")({ preventDefault() {} });

  assert.deepEqual(JSON.parse(JSON.stringify(mfaCalls)), [
    { code: "123456", factorId },
  ]);
  assert.deepEqual(redirects, ["admin.html"]);
  console.log("Initial administrator TOTP enrollment checks passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

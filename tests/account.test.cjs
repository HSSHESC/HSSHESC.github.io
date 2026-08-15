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
    this.validationMessage = "";
    this.value = "";
    this.classList = {
      add: (name) => {
        this.className = `${this.className} ${name}`.trim();
      },
    };
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  querySelectorAll() {
    return [];
  }

  reportValidity() {
    return !this.validationMessage;
  }

  reset() {}

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  setCustomValidity(message) {
    this.validationMessage = message;
  }
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
const passwordControls = [
  elements.currentPassword,
  elements.newPassword,
  elements.newPasswordConfirm,
  elements.passwordMfaCode,
  elements.changePasswordButton,
];
elements.passwordChangeForm.querySelectorAll = () => passwordControls;
elements.passwordChangeForm.reportValidity = () =>
  passwordControls.every((element) => !element.validationMessage);
elements.passwordChangeForm.reset = () => {
  passwordControls.forEach((element) => {
    if (element.id !== "changePasswordButton") {
      element.value = "";
    }
  });
};
elements.mfaChallengeForm.querySelectorAll = () => [
  elements.mfaChallengeCode,
  elements.mfaChallengeButton,
];
elements.mfaEnrollForm.querySelectorAll = () => [
  elements.mfaEnrollCode,
  elements.mfaEnrollButton,
];

const user = { id: "admin-user", email: "admin@example.com" };
const factor = {
  factor_type: "totp",
  id: "verified-factor",
  status: "verified",
};
const authCalls = { mfaVerify: [], signIn: [], update: [] };
const auth = {
  async getUser() {
    return { data: { user }, error: null };
  },
  mfa: {
    async challengeAndVerify(parameters) {
      authCalls.mfaVerify.push(parameters);
      return parameters.code === "123456"
        ? { data: {}, error: null }
        : { data: null, error: { code: "mfa_verification_failed" } };
    },
    async enroll() {
      throw new Error("Enrollment is not expected for a verified account.");
    },
    async getAuthenticatorAssuranceLevel() {
      return {
        data: { currentLevel: "aal2", nextLevel: "aal2" },
        error: null,
      };
    },
    async listFactors() {
      return {
        data: { all: [factor], phone: [], totp: [factor], webauthn: [] },
        error: null,
      };
    },
    async unenroll() {
      throw new Error("Unenrollment is not expected for a verified account.");
    },
  },
  onAuthStateChange() {
    return { data: { subscription: { unsubscribe() {} } } };
  },
  async signInWithPassword(credentials) {
    authCalls.signIn.push(credentials);
    if (credentials.password !== "current-password") {
      return {
        data: { user: null },
        error: { code: "invalid_credentials" },
      };
    }
    return { data: { user }, error: null };
  },
  async signOut() {
    return { error: null };
  },
  async updateUser(attributes) {
    authCalls.update.push(attributes);
    return { data: { user }, error: null };
  },
};
const client = {
  auth,
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

const accountScript = fs.readFileSync(
  path.resolve(__dirname, "../assets/js/account.js"),
  "utf8",
);
vm.runInContext(accountScript, context, { filename: "assets/js/account.js" });

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

(async () => {
  await flushPromises();
  await flushPromises();

  assert.deepEqual(redirects, []);
  assert.equal(elements.accountSection.hidden, false);
  assert.equal(elements.accountLoadingSection.hidden, true);
  assert.equal(elements.accountEmail.textContent, user.email);

  elements.currentPassword.value = "current-password";
  elements.newPassword.value = "new-password";
  elements.newPasswordConfirm.value = "new-password";
  elements.passwordMfaCode.value = "123456";
  await elements.passwordChangeForm.listeners.get("submit")({
    preventDefault() {},
  });

  assert.deepEqual(JSON.parse(JSON.stringify(authCalls.signIn[0])), {
    email: user.email,
    password: "current-password",
  });
  assert.deepEqual(JSON.parse(JSON.stringify(authCalls.mfaVerify[0])), {
    code: "123456",
    factorId: factor.id,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(authCalls.update[0])), {
    password: "new-password",
  });
  assert.equal(
    elements.accountMessage.textContent,
    "비밀번호가 변경되었습니다.",
  );

  elements.currentPassword.value = "current-password";
  elements.newPassword.value = "one-password";
  elements.newPasswordConfirm.value = "different-password";
  elements.passwordMfaCode.value = "123456";
  await elements.passwordChangeForm.listeners.get("submit")({
    preventDefault() {},
  });
  assert.equal(authCalls.update.length, 1);
  assert.equal(
    elements.newPasswordConfirm.validationMessage,
    "새 비밀번호가 일치하지 않습니다.",
  );

  elements.newPasswordConfirm.setCustomValidity("");
  elements.currentPassword.value = "wrong-password";
  elements.newPassword.value = "another-password";
  elements.newPasswordConfirm.value = "another-password";
  elements.passwordMfaCode.value = "123456";
  await elements.passwordChangeForm.listeners.get("submit")({
    preventDefault() {},
  });
  assert.equal(authCalls.update.length, 1);
  assert.equal(
    elements.currentPassword.validationMessage,
    "기존 비밀번호가 올바르지 않습니다.",
  );

  console.log("Account MFA reauthentication and password update checks passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

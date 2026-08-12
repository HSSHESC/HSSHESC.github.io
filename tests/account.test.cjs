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
  "newPassword",
  "newPasswordConfirm",
  "passwordChangeForm",
  "passwordStrengthBar",
  "passwordStrengthLabel",
  "passwordStrengthMeter",
];
const elements = Object.fromEntries(ids.map((id) => [id, new ElementStub(id)]));
const formControls = [
  elements.currentPassword,
  elements.newPassword,
  elements.newPasswordConfirm,
  elements.changePasswordButton,
];
elements.passwordChangeForm.hidden = false;
elements.passwordChangeForm.querySelectorAll = () => formControls;
elements.passwordChangeForm.reportValidity = () =>
  formControls.every((element) => !element.validationMessage);
elements.passwordChangeForm.reset = () => {
  formControls.forEach((element) => {
    if (element.id !== "changePasswordButton") {
      element.value = "";
    }
  });
};

const user = { id: "admin-user", email: "admin@example.com" };
const authCalls = { signIn: [], update: [] };
const auth = {
  async getUser() {
    return { data: { user }, error: null };
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
  await elements.passwordChangeForm.listeners.get("submit")({
    preventDefault() {},
  });

  assert.deepEqual(JSON.parse(JSON.stringify(authCalls.signIn[0])), {
    email: user.email,
    password: "current-password",
  });
  assert.deepEqual(JSON.parse(JSON.stringify(authCalls.update[0])), {
    password: "new-password",
    current_password: "current-password",
  });
  assert.equal(
    elements.accountMessage.textContent,
    "비밀번호가 변경되었습니다.",
  );

  elements.currentPassword.value = "current-password";
  elements.newPassword.value = "one-password";
  elements.newPasswordConfirm.value = "different-password";
  await elements.passwordChangeForm.listeners.get("submit")({
    preventDefault() {},
  });
  assert.equal(authCalls.update.length, 1);
  assert.equal(
    elements.newPasswordConfirm.validationMessage,
    "새 비밀번호가 일치하지 않습니다.",
  );

  elements.currentPassword.value = "wrong-password";
  elements.newPassword.value = "another-password";
  elements.newPasswordConfirm.value = "another-password";
  await elements.passwordChangeForm.listeners.get("submit")({
    preventDefault() {},
  });
  assert.equal(authCalls.update.length, 1);
  assert.equal(
    elements.currentPassword.validationMessage,
    "기존 비밀번호가 올바르지 않습니다.",
  );

  console.log("Account reauthentication and password update checks passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

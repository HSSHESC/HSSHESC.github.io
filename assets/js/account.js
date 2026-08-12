(function () {
  "use strict";

  const client = window.ESC_SUPABASE;
  const strengthEvaluator = window.ESC_PASSWORD_STRENGTH;
  const elements = {
    accountEmail: document.querySelector("#accountEmail"),
    accountEmailSummary: document.querySelector("#accountEmailSummary"),
    accountLoadingSection: document.querySelector("#accountLoadingSection"),
    accountLogoutButton: document.querySelector("#accountLogoutButton"),
    accountMessage: document.querySelector("#accountMessage"),
    accountSection: document.querySelector("#accountSection"),
    changePasswordButton: document.querySelector("#changePasswordButton"),
    currentPassword: document.querySelector("#currentPassword"),
    newPassword: document.querySelector("#newPassword"),
    newPasswordConfirm: document.querySelector("#newPasswordConfirm"),
    passwordChangeForm: document.querySelector("#passwordChangeForm"),
    passwordStrengthBar: document.querySelector("#passwordStrengthBar"),
    passwordStrengthLabel: document.querySelector("#passwordStrengthLabel"),
    passwordStrengthMeter: document.querySelector("#passwordStrengthMeter"),
  };

  let currentUser = null;

  const setMessage = (message, type = "info") => {
    elements.accountMessage.className = `alert alert-${type} admin-message`;
    elements.accountMessage.textContent = message;
    elements.accountMessage.hidden = false;
  };

  const clearMessage = () => {
    elements.accountMessage.hidden = true;
    elements.accountMessage.textContent = "";
  };

  const goToLogin = () => {
    window.location.replace("admin.html");
  };

  const setFormBusy = (busy) => {
    elements.passwordChangeForm.setAttribute("aria-busy", String(busy));
    elements.passwordChangeForm
      .querySelectorAll("input, button")
      .forEach((element) => {
        element.disabled = busy;
      });
    elements.changePasswordButton.textContent = busy
      ? "변경 중..."
      : "비밀번호 변경";
  };

  const renderStrength = () => {
    if (!strengthEvaluator?.evaluate) {
      return;
    }
    const result = strengthEvaluator.evaluate(elements.newPassword.value);
    elements.passwordStrengthLabel.textContent = result.label;
    elements.passwordStrengthBar.className = "password-strength-bar";
    if (result.key !== "empty") {
      elements.passwordStrengthBar.classList.add(`is-${result.key}`);
    }
    elements.passwordStrengthMeter.setAttribute(
      "aria-valuenow",
      String(result.percent),
    );
    elements.passwordStrengthMeter.setAttribute("aria-valuetext", result.label);
  };

  const showAccount = (user) => {
    const accountName = user.email ?? "관리자";
    currentUser = user;
    elements.accountEmail.textContent = accountName;
    elements.accountEmail.hidden = false;
    elements.accountEmailSummary.textContent = accountName;
    elements.accountLogoutButton.hidden = false;
    elements.accountLoadingSection.hidden = true;
    elements.accountSection.hidden = false;
  };

  const verifyAdmin = async (user) => {
    const { data, error } = await client
      .from("site_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }
    return Boolean(data);
  };

  const initialize = async () => {
    if (!client || !strengthEvaluator?.evaluate) {
      elements.accountLoadingSection.hidden = true;
      setMessage(
        "Supabase 계정 관리 기능을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        "danger",
      );
      return;
    }

    try {
      const {
        data: { user },
        error,
      } = await client.auth.getUser();

      if (error || !user) {
        goToLogin();
        return;
      }

      const authorized = await verifyAdmin(user);
      if (!authorized) {
        await client.auth.signOut();
        goToLogin();
        return;
      }

      showAccount(user);
      renderStrength();
    } catch (error) {
      console.error("관리자 계정 확인에 실패했습니다.", error);
      elements.accountLoadingSection.hidden = true;
      setMessage(
        "관리자 계정을 확인하지 못했습니다. 관리자 페이지에서 다시 로그인해 주세요.",
        "danger",
      );
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    clearMessage();
    elements.currentPassword.setCustomValidity("");
    elements.newPassword.setCustomValidity("");
    elements.newPasswordConfirm.setCustomValidity("");

    if (!elements.passwordChangeForm.reportValidity()) {
      return;
    }

    if (elements.newPassword.value !== elements.newPasswordConfirm.value) {
      elements.newPasswordConfirm.setCustomValidity(
        "새 비밀번호가 일치하지 않습니다.",
      );
      elements.newPasswordConfirm.reportValidity();
      return;
    }

    if (elements.currentPassword.value === elements.newPassword.value) {
      elements.newPassword.setCustomValidity(
        "새 비밀번호는 기존 비밀번호와 다르게 입력해 주세요.",
      );
      elements.newPassword.reportValidity();
      return;
    }

    if (!currentUser?.email) {
      setMessage("로그인 계정의 이메일을 확인하지 못했습니다.", "danger");
      return;
    }

    setFormBusy(true);

    try {
      const currentPassword = elements.currentPassword.value;
      const { data: verification, error: verificationError } =
        await client.auth.signInWithPassword({
          email: currentUser.email,
          password: currentPassword,
        });

      if (verificationError) {
        if (verificationError.code !== "invalid_credentials") {
          throw verificationError;
        }
        elements.currentPassword.setCustomValidity(
          "기존 비밀번호가 올바르지 않습니다.",
        );
        elements.currentPassword.reportValidity();
        return;
      }

      if (verification.user?.id !== currentUser.id) {
        throw new Error(
          "재인증된 계정이 현재 관리자 계정과 일치하지 않습니다.",
        );
      }

      const { error: updateError } = await client.auth.updateUser({
        password: elements.newPassword.value,
        current_password: currentPassword,
      });

      if (updateError) {
        throw updateError;
      }

      elements.passwordChangeForm.reset();
      renderStrength();
      setMessage("비밀번호가 변경되었습니다.", "success");
    } catch (error) {
      console.error("비밀번호 변경에 실패했습니다.", error);
      const message =
        error?.code === "same_password"
          ? "새 비밀번호는 기존 비밀번호와 다르게 입력해 주세요."
          : "비밀번호를 변경하지 못했습니다. 새 비밀번호가 Supabase의 비밀번호 정책을 충족하는지 확인해 주세요.";
      setMessage(message, "danger");
    } finally {
      setFormBusy(false);
    }
  };

  elements.newPassword.addEventListener("input", () => {
    elements.newPassword.setCustomValidity("");
    elements.newPasswordConfirm.setCustomValidity("");
    renderStrength();
  });
  elements.newPasswordConfirm.addEventListener("input", () => {
    elements.newPasswordConfirm.setCustomValidity("");
  });
  elements.currentPassword.addEventListener("input", () => {
    elements.currentPassword.setCustomValidity("");
  });
  elements.passwordChangeForm.addEventListener("submit", handlePasswordChange);
  elements.accountLogoutButton.addEventListener("click", async () => {
    clearMessage();
    const { error } = await client.auth.signOut();
    if (error) {
      console.error("로그아웃에 실패했습니다.", error);
      setMessage("로그아웃하지 못했습니다.", "danger");
      return;
    }
    goToLogin();
  });

  client?.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      goToLogin();
    }
  });

  initialize();
})();

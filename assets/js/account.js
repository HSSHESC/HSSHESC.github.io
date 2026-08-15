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
    mfaChallengeButton: document.querySelector("#mfaChallengeButton"),
    mfaChallengeCode: document.querySelector("#mfaChallengeCode"),
    mfaChallengeForm: document.querySelector("#mfaChallengeForm"),
    mfaChallengeSection: document.querySelector("#mfaChallengeSection"),
    mfaEnrollButton: document.querySelector("#mfaEnrollButton"),
    mfaEnrollCode: document.querySelector("#mfaEnrollCode"),
    mfaEnrollForm: document.querySelector("#mfaEnrollForm"),
    mfaQrCode: document.querySelector("#mfaQrCode"),
    mfaSecret: document.querySelector("#mfaSecret"),
    mfaSetupSection: document.querySelector("#mfaSetupSection"),
    newPassword: document.querySelector("#newPassword"),
    newPasswordConfirm: document.querySelector("#newPasswordConfirm"),
    passwordChangeForm: document.querySelector("#passwordChangeForm"),
    passwordMfaCode: document.querySelector("#passwordMfaCode"),
    passwordStrengthBar: document.querySelector("#passwordStrengthBar"),
    passwordStrengthLabel: document.querySelector("#passwordStrengthLabel"),
    passwordStrengthMeter: document.querySelector("#passwordStrengthMeter"),
  };

  const accountSections = [
    elements.accountLoadingSection,
    elements.mfaSetupSection,
    elements.mfaChallengeSection,
    elements.accountSection,
  ];
  let currentUser = null;
  let enrollmentFactorId = null;
  let verifiedFactorId = null;

  const setMessage = (message, type = "info") => {
    elements.accountMessage.className = `alert alert-${type} admin-message`;
    elements.accountMessage.textContent = message;
    elements.accountMessage.hidden = false;
  };

  const clearMessage = () => {
    elements.accountMessage.hidden = true;
    elements.accountMessage.textContent = "";
  };

  const showSection = (section) => {
    accountSections.forEach((candidate) => {
      candidate.hidden = candidate !== section;
    });
  };

  const goToLogin = () => {
    window.location.replace("admin.html");
  };

  const goToAdmin = () => {
    window.location.replace("admin.html");
  };

  const setHeader = (user) => {
    const accountName = user.email ?? "관리자";
    currentUser = user;
    elements.accountEmail.textContent = accountName;
    elements.accountEmail.hidden = false;
    elements.accountEmailSummary.textContent = accountName;
    elements.accountLogoutButton.hidden = false;
  };

  const setMfaBusy = (form, button, busy, idleLabel) => {
    form.setAttribute("aria-busy", String(busy));
    form.querySelectorAll("input, button").forEach((element) => {
      element.disabled = busy;
    });
    button.textContent = busy ? "확인 중..." : idleLabel;
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

  const getMfaState = async () => {
    const [levelResult, factorsResult] = await Promise.all([
      client.auth.mfa.getAuthenticatorAssuranceLevel(),
      client.auth.mfa.listFactors(),
    ]);
    if (levelResult.error) {
      throw levelResult.error;
    }
    if (factorsResult.error) {
      throw factorsResult.error;
    }
    return {
      allFactors: factorsResult.data.all,
      currentLevel: levelResult.data.currentLevel,
      verifiedTotpFactor: factorsResult.data.totp[0] ?? null,
    };
  };

  const ensureAal2 = async () => {
    const { data, error } =
      await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) {
      throw error;
    }
    if (data.currentLevel !== "aal2") {
      throw new Error("The administrator session did not reach AAL2.");
    }
  };

  const toQrCodeUrl = (value) =>
    value.startsWith("data:image/")
      ? value
      : `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(value)}`;

  const prepareMfaEnrollment = async (allFactors) => {
    const abandonedFactors = allFactors.filter(
      (factor) =>
        factor.factor_type === "totp" && factor.status === "unverified",
    );
    for (const factor of abandonedFactors) {
      const { error } = await client.auth.mfa.unenroll({
        factorId: factor.id,
      });
      if (error) {
        throw error;
      }
    }

    const { data, error } = await client.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "ESC 관리자",
    });
    if (error) {
      throw error;
    }

    enrollmentFactorId = data.id;
    elements.mfaQrCode.src = toQrCodeUrl(data.totp.qr_code);
    elements.mfaSecret.textContent = data.totp.secret;
    elements.mfaEnrollCode.value = "";
    showSection(elements.mfaSetupSection);
  };

  const prepareMfaChallenge = (factor) => {
    verifiedFactorId = factor.id;
    elements.mfaChallengeCode.value = "";
    showSection(elements.mfaChallengeSection);
  };

  const showAccount = () => {
    showSection(elements.accountSection);
    renderStrength();
  };

  const initialize = async () => {
    if (!client || !strengthEvaluator?.evaluate || !client.auth.mfa) {
      elements.accountLoadingSection.hidden = true;
      setMessage(
        "Supabase 계정 보안 기능을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
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

      setHeader(user);
      const mfaState = await getMfaState();
      if (mfaState.currentLevel === "aal2") {
        showAccount();
      } else if (mfaState.verifiedTotpFactor) {
        prepareMfaChallenge(mfaState.verifiedTotpFactor);
      } else {
        await prepareMfaEnrollment(mfaState.allFactors);
      }
    } catch (error) {
      console.error("관리자 계정 보안 확인에 실패했습니다.", error);
      showSection(elements.accountLoadingSection);
      setMessage(
        "관리자 계정 보안을 확인하지 못했습니다. 관리자 페이지에서 다시 로그인해 주세요.",
        "danger",
      );
    }
  };

  const handleMfaEnrollment = async (event) => {
    event.preventDefault();
    clearMessage();
    if (!elements.mfaEnrollForm.reportValidity() || !enrollmentFactorId) {
      return;
    }

    setMfaBusy(
      elements.mfaEnrollForm,
      elements.mfaEnrollButton,
      true,
      "등록 완료",
    );
    try {
      const { error } = await client.auth.mfa.challengeAndVerify({
        factorId: enrollmentFactorId,
        code: elements.mfaEnrollCode.value.trim(),
      });
      if (error) {
        throw error;
      }
      await ensureAal2();
      goToAdmin();
    } catch (error) {
      console.error("2단계 인증 등록에 실패했습니다.", error);
      setMessage(
        "인증 코드가 올바르지 않거나 만료되었습니다. 인증 앱의 새 코드를 입력해 주세요.",
        "danger",
      );
    } finally {
      setMfaBusy(
        elements.mfaEnrollForm,
        elements.mfaEnrollButton,
        false,
        "등록 완료",
      );
    }
  };

  const handleMfaChallenge = async (event) => {
    event.preventDefault();
    clearMessage();
    if (!elements.mfaChallengeForm.reportValidity() || !verifiedFactorId) {
      return;
    }

    setMfaBusy(
      elements.mfaChallengeForm,
      elements.mfaChallengeButton,
      true,
      "인증",
    );
    try {
      const { error } = await client.auth.mfa.challengeAndVerify({
        factorId: verifiedFactorId,
        code: elements.mfaChallengeCode.value.trim(),
      });
      if (error) {
        throw error;
      }
      await ensureAal2();
      goToAdmin();
    } catch (error) {
      console.error("2단계 인증에 실패했습니다.", error);
      setMessage(
        "인증 코드가 올바르지 않거나 만료되었습니다. 인증 앱의 새 코드를 입력해 주세요.",
        "danger",
      );
    } finally {
      setMfaBusy(
        elements.mfaChallengeForm,
        elements.mfaChallengeButton,
        false,
        "인증",
      );
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    clearMessage();
    elements.currentPassword.setCustomValidity("");
    elements.newPassword.setCustomValidity("");
    elements.newPasswordConfirm.setCustomValidity("");
    elements.passwordMfaCode.setCustomValidity("");

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
      const { data: verification, error: verificationError } =
        await client.auth.signInWithPassword({
          email: currentUser.email,
          password: elements.currentPassword.value,
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

      const { data: factors, error: factorsError } =
        await client.auth.mfa.listFactors();
      if (factorsError) {
        throw factorsError;
      }
      const factor = factors.totp[0];
      if (!factor) {
        throw new Error("A verified TOTP factor is required.");
      }

      const { error: mfaError } = await client.auth.mfa.challengeAndVerify({
        factorId: factor.id,
        code: elements.passwordMfaCode.value.trim(),
      });
      if (mfaError) {
        elements.passwordMfaCode.setCustomValidity(
          "인증 앱 코드가 올바르지 않습니다.",
        );
        elements.passwordMfaCode.reportValidity();
        return;
      }
      await ensureAal2();

      const { error: updateError } = await client.auth.updateUser({
        password: elements.newPassword.value,
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
          : "비밀번호를 변경하지 못했습니다. 입력 내용과 계정 보안 상태를 확인해 주세요.";
      setMessage(message, "danger");
    } finally {
      setFormBusy(false);
    }
  };

  const normalizeMfaCode = (element) => {
    element.value = element.value.replace(/\D/g, "").slice(0, 6);
    element.setCustomValidity("");
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
  [
    elements.mfaEnrollCode,
    elements.mfaChallengeCode,
    elements.passwordMfaCode,
  ].forEach((element) => {
    element.addEventListener("input", () => normalizeMfaCode(element));
  });
  elements.mfaEnrollForm.addEventListener("submit", handleMfaEnrollment);
  elements.mfaChallengeForm.addEventListener("submit", handleMfaChallenge);
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

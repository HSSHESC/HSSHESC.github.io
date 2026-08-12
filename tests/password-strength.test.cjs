const assert = require("node:assert/strict");
const { evaluate } = require("../assets/js/password-strength.js");

assert.deepEqual(evaluate(""), {
  key: "empty",
  label: "입력 전",
  percent: 0,
});
assert.deepEqual(evaluate("abc123"), {
  key: "weak",
  label: "Weak",
  percent: 33,
});
assert.deepEqual(evaluate("Abcdef12"), {
  key: "medium",
  label: "Medium",
  percent: 67,
});
assert.deepEqual(evaluate("LongPassword12!"), {
  key: "strong",
  label: "Strong",
  percent: 100,
});

console.log("Password strength scale checks passed.");

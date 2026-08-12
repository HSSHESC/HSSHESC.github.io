const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const context = vm.createContext({ Date, Intl });
context.window = context;

const source = fs.readFileSync(
  path.resolve(__dirname, "../assets/js/year.js"),
  "utf8",
);
vm.runInContext(source, context);

const { getCurrentKoreanYear, normalizeYearTemplate, renderYearTemplate } =
  context.ESC_YEAR;

assert.equal(getCurrentKoreanYear(new Date("2026-12-31T14:59:59Z")), "2026");
assert.equal(getCurrentKoreanYear(new Date("2026-12-31T15:00:00Z")), "2027");
assert.equal(
  normalizeYearTemplate("2026학년도 ESC에서 진행할 동아리 활동입니다."),
  "{year}학년도 ESC에서 진행할 동아리 활동입니다.",
);
assert.equal(
  renderYearTemplate(
    "2026학년도 ESC에서 진행할 동아리 활동입니다.",
    new Date("2027-08-12T00:00:00Z"),
  ),
  "2027학년도 ESC에서 진행할 동아리 활동입니다.",
);
assert.equal(
  renderYearTemplate(
    "{year}학년도에 계획된 활동은 다음과 같습니다.",
    new Date("2028-08-12T00:00:00Z"),
  ),
  "2028학년도에 계획된 활동은 다음과 같습니다.",
);
assert.equal(
  renderYearTemplate(
    "2026학년도에 계획된 활동은 다음과 같습니다.",
    new Date("2029-08-12T00:00:00Z"),
  ),
  "2029학년도에 계획된 활동은 다음과 같습니다.",
);
assert.equal(
  normalizeYearTemplate("2024학년도 활동을 돌아봅니다."),
  "2024학년도 활동을 돌아봅니다.",
);

console.log("Dynamic Korean year checks passed.");

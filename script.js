// Password generator using the Web Crypto API for secure randomness.
const slider = document.querySelector(".range__slider");
const sliderInput = document.getElementById("slider");
const sliderValue = document.querySelector(".length__title");

const resultEl = document.getElementById("result");
const generateBtn = document.getElementById("generate");
const copyBtn = document.getElementById("copy-btn");
const resultContainer = document.querySelector(".result");
const copyInfo = document.querySelector(".result__info.right");
const copiedInfo = document.querySelector(".result__info.left");

const uppercaseEl = document.getElementById("uppercase");
const lowercaseEl = document.getElementById("lowercase");
const numberEl = document.getElementById("number");
const symbolEl = document.getElementById("symbol");

const characterSets = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  number: "0123456789",
  symbol: '~!@#$%^&*()_+{}":?><;.,'
};

let generatedPassword = false;
let resultContainerBound = resultContainer.getBoundingClientRect();

function applyFill(input) {
  const percentage = (100 * (input.value - input.min)) / (input.max - input.min);
  slider.style.background = `linear-gradient(90deg, #0B1EDF ${percentage}%, rgba(255, 255, 255, 0.214) ${percentage + 0.1}%)`;
  sliderValue.setAttribute("data-length", input.value);
}

sliderInput.addEventListener("input", () => applyFill(sliderInput));
applyFill(sliderInput);

// Use rejection sampling to avoid modulo bias when selecting a random integer.
function secureRandomInt(maxExclusive) {
  if (!Number.isInteger(maxExclusive) || maxExclusive < 1) {
    throw new RangeError("maxExclusive must be a positive integer.");
  }

  const range = 0x100000000;
  const limit = Math.floor(range / maxExclusive) * maxExclusive;
  const values = new Uint32Array(1);
  let value;

  do {
    window.crypto.getRandomValues(values);
    value = values[0];
  } while (value >= limit);

  return value % maxExclusive;
}

function getSelectedSets() {
  const selected = [];
  if (lowercaseEl.checked) selected.push(characterSets.lowercase);
  if (uppercaseEl.checked) selected.push(characterSets.uppercase);
  if (numberEl.checked) selected.push(characterSets.number);
  if (symbolEl.checked) selected.push(characterSets.symbol);
  return selected;
}

function shuffleSecurely(characters) {
  for (let i = characters.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [characters[i], characters[j]] = [characters[j], characters[i]];
  }
  return characters;
}

function generatePassword(length, selectedSets) {
  if (selectedSets.length === 0) {
    throw new Error("Select at least one character type.");
  }

  const allCharacters = selectedSets.join("");
  const password = selectedSets.map(set => set[secureRandomInt(set.length)]);

  while (password.length < length) {
    password.push(allCharacters[secureRandomInt(allCharacters.length)]);
  }

  return shuffleSecurely(password).join("");
}

function disableOnlyCheckbox() {
  const checkboxes = [uppercaseEl, lowercaseEl, numberEl, symbolEl];
  const checked = checkboxes.filter(checkbox => checkbox.checked);
  checkboxes.forEach(checkbox => {
    checkbox.disabled = checked.length === 1 && checkbox.checked;
  });
}

[uppercaseEl, lowercaseEl, numberEl, symbolEl].forEach(checkbox => {
  checkbox.addEventListener("change", disableOnlyCheckbox);
});
disableOnlyCheckbox();

generateBtn.addEventListener("click", () => {
  try {
    const selectedSets = getSelectedSets();
    resultEl.innerText = generatePassword(Number(sliderInput.value), selectedSets);
    generatedPassword = true;
    copyInfo.style.transform = "translateY(0%)";
    copyInfo.style.opacity = "0.75";
    copiedInfo.style.transform = "translateY(200%)";
    copiedInfo.style.opacity = "0";
  } catch (error) {
    resultEl.innerText = error.message;
    generatedPassword = false;
    copyBtn.style.opacity = "0";
    copyBtn.style.pointerEvents = "none";
  }
});

async function copyPassword() {
  const password = resultEl.innerText;
  if (!generatedPassword || !password) return;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(password);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = password;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      if (!copied) throw new Error("Clipboard copy failed.");
    }

    copyInfo.style.transform = "translateY(200%)";
    copyInfo.style.opacity = "0";
    copiedInfo.style.transform = "translateY(0%)";
    copiedInfo.style.opacity = "0.75";
  } catch (error) {
    copiedInfo.textContent = "copy failed";
    copiedInfo.style.transform = "translateY(0%)";
    copiedInfo.style.opacity = "0.75";
    console.error("Could not copy password:", error);
  }
}

copyBtn.addEventListener("click", copyPassword);

resultContainer.addEventListener("mousemove", event => {
  resultContainerBound = resultContainer.getBoundingClientRect();
  if (generatedPassword) {
    copyBtn.style.opacity = "1";
    copyBtn.style.pointerEvents = "all";
    copyBtn.style.setProperty("--x", `${event.clientX - resultContainerBound.left}px`);
    copyBtn.style.setProperty("--y", `${event.clientY - resultContainerBound.top}px`);
  }
});

resultContainer.addEventListener("mouseleave", () => {
  if (generatedPassword) {
    copyBtn.style.opacity = "0";
    copyBtn.style.pointerEvents = "none";
  }
});

window.addEventListener("resize", () => {
  resultContainerBound = resultContainer.getBoundingClientRect();
});

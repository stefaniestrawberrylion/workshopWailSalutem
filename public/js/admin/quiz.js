document.addEventListener("DOMContentLoaded", () => {
  // =======================
  // DOM ELEMENTS
  // =======================
  const quizPopup = document.getElementById("quizPopup");
  const quizContainer = document.getElementById("quizContainer");
  const submitQuizBtn = document.getElementById("submitQuizBtn");
  const quizResult = document.getElementById("quizResult");
  const btnStartQuiz = document.getElementById("btnStartQuiz");
  let currentWorkshopData = window.currentWorkshopData || {};

  // =======================
  // CUSTOM ALERTS / CONFIRMS
  // =======================
  async function showMessage(message) {
    return new Promise((resolve) => {
      const modal = document.getElementById("customAlert");
      const msgEl = document.getElementById("customAlertMessage");
      const okBtn = document.getElementById("customAlertOk");

      msgEl.textContent = message;
      modal.style.display = "flex";

      okBtn.onclick = () => {
        modal.style.display = "none";
        resolve();
      };
    });
  }

  async function showConfirm(message) {
    return new Promise((resolve) => {
      const modal = document.getElementById("customConfirm");
      const msgEl = document.getElementById("customConfirmMessage");
      const yesBtn = document.getElementById("customConfirmYes");
      const noBtn = document.getElementById("customConfirmNo");

      msgEl.textContent = message;
      modal.style.display = "flex";

      yesBtn.onclick = () => {
        modal.style.display = "none";
        resolve(true);
      };
      noBtn.onclick = () => {
        modal.style.display = "none";
        resolve(false);
      };
    });
  }

  // =======================
  // QUIZ VIEWER
  // =======================
  if (btnStartQuiz) {
    btnStartQuiz.addEventListener("click", async () => {
      const quiz = currentWorkshopData?.quiz || [];

      if (quiz.length === 0) {
        const createQuiz = await showConfirm(
          "Deze workshop heeft nog geen quiz. Wil je er een aanmaken?"
        );
        if (createQuiz) {
          openQuizCreator();
        }
        return;
      }

      if (quizContainer) quizContainer.innerHTML = "";

      quiz.forEach((q, index) => {
        const div = document.createElement("div");
        div.classList.add("quiz-question-block");

        let html = `<h3>${index + 1}. ${q.question}</h3>`;
        q.options.forEach((opt, i) => {
          html += `
            <label style="display:block; margin-bottom:6px;">
              <input type="radio" name="quiz-q${index}" value="${i}">
              ${opt.text}
            </label>
          `;
        });

        div.innerHTML = html;
        if (quizContainer) quizContainer.appendChild(div);
      });

      if (quizPopup) quizPopup.style.display = "flex";
    });
  }

  const closeQuizBtn = document.querySelector(".close-quiz-popup");
  if (closeQuizBtn) {
    closeQuizBtn.addEventListener("click", () => {
      if (quizPopup) quizPopup.style.display = "none";
    });
  }

  if (submitQuizBtn) {
    submitQuizBtn.addEventListener("click", () => {
      const quiz = currentWorkshopData?.quiz || [];
      let correctCount = 0;

      quiz.forEach((q, index) => {
        const selected = document.querySelector(`input[name="quiz-q${index}"]:checked`);
        const questionBlock = quizContainer.children[index];

        if (questionBlock) questionBlock.style.backgroundColor = "#f0f4fa";

        if (!selected) {
          if (questionBlock) questionBlock.style.backgroundColor = "#f8d7da";
          return;
        }

        const chosen = Number(selected.value);
        if (q.options[chosen]?.correct) {
          correctCount++;
          if (questionBlock) questionBlock.style.backgroundColor = "#d4edda";
        } else {
          if (questionBlock) questionBlock.style.backgroundColor = "#f8d7da";
        }
      });

      if (quizResult) {
        quizResult.textContent = `Je hebt ${correctCount} van de ${quiz.length} vragen goed!`;
      }
    });
  }

  // =======================
  // QUIZ CREATOR BUTTONS
  // =======================
  const addQBtn = document.querySelector(".add-q-btn");
  if (addQBtn) addQBtn.addEventListener("click", addQuestionBlock);

  const btnOpenQuizCreator = document.getElementById("btnOpenQuizCreator");
  if (btnOpenQuizCreator) btnOpenQuizCreator.addEventListener("click", openQuizCreator);

  const closeQuizCreatorBtn = document.querySelector(".close-quiz");
  if (closeQuizCreatorBtn) closeQuizCreatorBtn.addEventListener("click", closeQuizModals);

  // =======================
  // QUIZ CREATOR FUNCTIONS
  // =======================
  let questionCount = 0;
  const MIN_QUESTIONS = 5;
  const MAX_QUESTIONS = 10;

  function openQuizCreator() {
    const modal = document.getElementById("modal-quiz-creator");
    if (!modal) return;
    modal.style.display = "flex";

    const container = document.getElementById("creator-questions-container");
    if (!container) return;
    container.innerHTML = "";
    questionCount = 0;

    const existingQuiz = currentWorkshopData?.quiz || [];
    if (existingQuiz.length > 0) {
      existingQuiz.forEach((q) => {
        addQuestionBlock();
        const lastBlock = container.lastElementChild;
        if (lastBlock) lastBlock.querySelector(".question-text-input").value = q.question;

        q.options.forEach((opt, i) => {
          if (i >= 5) addOption(lastBlock);
          const optRow = lastBlock.querySelectorAll(".answer-option-row")[i];
          if (optRow) {
            optRow.querySelector(".answer-option-input").value = opt.text;
            optRow.querySelector(".is-correct-checkbox").checked = opt.correct;
          }
        });
      });
    } else {
      addQuestionBlock();
    }
  }

  function closeQuizModals() {
    const modal = document.getElementById("modal-quiz-creator");
    if (!modal) return;
    modal.style.display = "none";
  }

  async function addQuestionBlock() {
    if (questionCount >= MAX_QUESTIONS) {
      await showMessage(`Je kunt maximaal ${MAX_QUESTIONS} vragen aanmaken.`);
      return;
    }
    questionCount++;

    const container = document.getElementById("creator-questions-container");
    if (!container) return;

    const block = document.createElement("div");
    block.className = "quiz-question-block";
    block.dataset.questionId = questionCount;

    block.innerHTML = `
      <div class="quiz-question-header">
        <h4>Vraag ${questionCount}</h4>
        <button type="button" class="delete-q-btn">🗑️</button>
      </div>

      <div class="question-input-group">
        <input type="text" class="question-text-input" placeholder="Typ hier je vraag...">
      </div>

      <p class="answer-options-title">Antwoord opties (vink correcte antwoorden aan)</p>

      <div class="answer-options"></div>

      <button type="button" class="add-option-btn">+ Optie toevoegen</button>

      <hr class="question-separator">
    `;

    container.appendChild(block);

    const deleteBtn = block.querySelector(".delete-q-btn");
    if (deleteBtn) deleteBtn.addEventListener("click", async () => await deleteQuestion(block));

    const addOptionBtn = block.querySelector(".add-option-btn");
    if (addOptionBtn) addOptionBtn.addEventListener("click", () => addOption(block));

    // Voeg standaard 2 opties toe
    addOption(block);
    addOption(block);
  }

  async function deleteQuestion(block) {
    const blocks = document.querySelectorAll(".quiz-question-block");
    if (blocks.length <= MIN_QUESTIONS) {
      await showMessage(`Er moeten minimaal ${MIN_QUESTIONS} vragen zijn.`);
      return;
    }

    const confirmed = await showConfirm("Weet je zeker dat je deze vraag wilt verwijderen?");
    if (!confirmed) return;

    block.remove();
    questionCount--;
    renumberQuestions();
  }

  function renumberQuestions() {
    const blocks = document.querySelectorAll(".quiz-question-block");
    blocks.forEach((block, idx) => {
      block.dataset.questionId = idx + 1;
      const h4 = block.querySelector("h4");
      if (h4) h4.textContent = `Vraag ${idx + 1}`;

      const radios = block.querySelectorAll(".is-correct-checkbox");
      radios.forEach((r) => {
        r.name = `correct-${idx + 1}`;
      });
    });
  }

  function addOption(block) {
    const container = block.querySelector(".answer-options");
    if (!container) return;

    const qId = block.dataset.questionId || document.querySelectorAll(".quiz-question-block").length;
    const optionRow = document.createElement("div");
    optionRow.className = "answer-option-row";

    optionRow.innerHTML = `
      <input type="radio" name="correct-${qId}" class="is-correct-checkbox">
      <input type="text" class="answer-option-input" placeholder="Antwoord optie...">
      <button type="button" class="delete-option-btn">✖</button>
    `;

    container.appendChild(optionRow);

    const deleteOptionBtn = optionRow.querySelector(".delete-option-btn");
    if (deleteOptionBtn) deleteOptionBtn.addEventListener("click", () => optionRow.remove());
  }

  async function saveQuizToForm() {
    const quiz = [];
    document.querySelectorAll(".quiz-question-block").forEach((block) => {
      const questionText = block.querySelector(".question-text-input")?.value || "";
      const options = [];
      block.querySelectorAll(".answer-option-row").forEach((opt) => {
        const text = opt.querySelector(".answer-option-input")?.value || "";
        const correct = !!opt.querySelector(".is-correct-checkbox")?.checked;
        options.push({ text, correct });
      });
      quiz.push({ question: questionText, options });
    });

    const hiddenInput = document.getElementById("hiddenQuizField");
    if (hiddenInput) {
      hiddenInput.value = JSON.stringify(quiz);
    }

    currentWorkshopData.quiz = quiz;

    await showMessage("Quiz is opgeslagen en wordt meegestuurd bij de workshop.");
    closeQuizModals();
  }

  // Globale functies beschikbaar maken
  window.addQuestionBlock = addQuestionBlock;
  window.openQuizCreator = openQuizCreator;
  window.closeQuizModals = closeQuizModals;
  window.saveQuizToForm = saveQuizToForm;
});

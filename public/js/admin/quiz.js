document.addEventListener("DOMContentLoaded", () => {
  // =======================
  // DOM ELEMENTS
  // =======================
  const quizPopup = document.getElementById("modal-quiz-creator");
  const quizContainer = document.getElementById("creator-questions-container");
  const btnStartQuiz = document.getElementById("btnStartQuiz");

  // =======================
  // GLOBAL WORKSHOP STATE
  // =======================
  const getWorkshopData = () => window.currentWorkshopData || {};
  const getQuiz = () =>
    Array.isArray(getWorkshopData().quiz) ? getWorkshopData().quiz : [];

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
      yesBtn.onclick = () => { modal.style.display = "none"; resolve(true); };
      noBtn.onclick = () => { modal.style.display = "none"; resolve(false); };
    });
  }

  // =======================
  // QUIZ CREATOR LOGIC
  // =======================
  const MIN_QUESTIONS = 5;
  const MAX_QUESTIONS = 10;
  const MIN_OPTIONS = 2;
  const MAX_OPTIONS = 4;

  function openQuizCreator() {
    if (!quizPopup) return;
    quizPopup.style.display = "flex";
    quizContainer.innerHTML = "";

    const existingQuiz = getQuiz();
    if (existingQuiz.length > 0) {
      existingQuiz.forEach((q) => {
        const block = addQuestionBlock(false);
        block.querySelector(".question-text-input").value = q.question;
        q.options.forEach((opt) => {
          addOption(block, opt.text, opt.correct);
        });
      });
    } else {
      // Start direct met 5 lege vragen (het minimum)
      for (let i = 0; i < MIN_QUESTIONS; i++) {
        addQuestionBlock(true);
      }
    }
    reindexQuestions();
  }

  function addQuestionBlock(addEmptyOptions = true) {
    const currentBlocks = quizContainer.querySelectorAll(".quiz-question-block").length;
    if (currentBlocks >= MAX_QUESTIONS) {
      showMessage(`Je kunt maximaal ${MAX_QUESTIONS} vragen toevoegen.`);
      return null;
    }

    const block = document.createElement("div");
    block.className = "quiz-question-block";
    const qUniqueId = Date.now() + Math.random();
    block.dataset.questionId = qUniqueId;

    block.innerHTML = `
      <div class="quiz-question-header">
        <h4 class="question-label">Vraag</h4>
        <button type="button" class="delete-q-btn">🗑️</button>
      </div>
      <input type="text" class="question-text-input" placeholder="Typ je vraag...">
      <div class="answer-options"></div>
      <button type="button" class="add-option-btn">+ Optie toevoegen</button>
      <hr>
    `;

    quizContainer.appendChild(block);

    block.querySelector(".delete-q-btn").addEventListener("click", () => deleteQuestion(block));
    block.querySelector(".add-option-btn").addEventListener("click", () => addOption(block));

    if (addEmptyOptions) {
      addOption(block);
      addOption(block);
    }

    reindexQuestions();
    return block;
  }

  function addOption(block, text = "", correct = false) {
    const container = block.querySelector(".answer-options");
    const currentOptions = container.querySelectorAll(".answer-option-row").length;

    if (currentOptions >= MAX_OPTIONS) {
      showMessage(`Maximaal ${MAX_OPTIONS} opties per vraag.`);
      return;
    }

    const qId = block.dataset.questionId;
    const row = document.createElement("div");
    row.className = "answer-option-row";
    row.innerHTML = `
      <input type="radio" name="correct-${qId}" class="is-correct-checkbox" ${correct ? 'checked' : ''}>
      <input type="text" class="answer-option-input" placeholder="Antwoord optie..." value="${text}">
      <button type="button" class="delete-option-btn">✖</button>
    `;

    container.appendChild(row);
    row.querySelector(".delete-option-btn").addEventListener("click", () => {
      const remaining = container.querySelectorAll(".answer-option-row").length;
      if (remaining <= MIN_OPTIONS) {
        showMessage(`Minimaal ${MIN_OPTIONS} opties vereist.`);
      } else {
        row.remove();
      }
    });
  }

  async function deleteQuestion(block) {
    const currentBlocks = quizContainer.querySelectorAll(".quiz-question-block").length;
    if (currentBlocks <= MIN_QUESTIONS) {
      await showMessage(`Minimaal ${MIN_QUESTIONS} vragen zijn verplicht voor een quiz.`);
      return;
    }

    const confirmed = await showConfirm("Weet je zeker dat je deze vraag wilt verwijderen?");
    if (confirmed) {
      block.remove();
      reindexQuestions();
    }
  }

  function reindexQuestions() {
    const blocks = quizContainer.querySelectorAll(".quiz-question-block");
    blocks.forEach((block, index) => {
      block.querySelector(".question-label").textContent = `Vraag ${index + 1}`;
    });
  }

  async function saveQuizToForm() {
    try {
      const quiz = [];
      const blocks = quizContainer.querySelectorAll(".quiz-question-block");
      let errorMsg = "";

      if (blocks.length < MIN_QUESTIONS) {
        errorMsg = `Een quiz moet minimaal ${MIN_QUESTIONS} vragen bevatten.`;
        throw new Error(errorMsg);
      }

      blocks.forEach((block, idx) => {
        try {
          const questionText = block.querySelector(".question-text-input").value.trim();
          const options = [];
          const optionRows = block.querySelectorAll(".answer-option-row");
          let hasCorrect = false;

          optionRows.forEach((row, optIdx) => {
            try {
              const text = row.querySelector(".answer-option-input").value.trim();
              const correct = row.querySelector(".is-correct-checkbox").checked;
              if (correct) hasCorrect = true;
              if (text !== "") options.push({ text, correct });
            } catch (errOption) {
              console.error(`Error in option ${optIdx + 1} of question ${idx + 1}:`, errOption);
              showMessage(`Fout bij optie ${optIdx + 1} van vraag ${idx + 1}: ${errOption.message}`);
            }
          });

          if (!questionText) throw new Error(`Vraag ${idx + 1} heeft geen tekst.`);
          if (options.length < MIN_OPTIONS) throw new Error(`Vraag ${idx + 1} moet minimaal ${MIN_OPTIONS} gevulde opties hebben.`);
          if (!hasCorrect) throw new Error(`Vraag ${idx + 1} heeft geen correct antwoord geselecteerd.`);

          quiz.push({ question: questionText, options });
        } catch (errQ) {
          console.error(`Error in question ${idx + 1}:`, errQ);
          throw errQ; // stop de loop en laat zien wat er mis is
        }
      });

      // Sla quiz op in window.currentWorkshopData
      if (!window.currentWorkshopData) window.currentWorkshopData = {};
      window.currentWorkshopData.quiz = quiz;
      window.currentWorkshopData.quizUpdated = true;

      const statusText = document.getElementById("quizStatusText");
      const qCountSpan = document.getElementById("quizQCount");
      if (statusText && qCountSpan) {
        statusText.style.display = "inline";
        qCountSpan.textContent = quiz.length;
      }

      await showMessage("Quiz succesvol opgeslagen!");
      closeQuizModals();

    } catch (err) {
      console.error("Error saving quiz:", err);
      showMessage(`Fout bij opslaan van quiz: ${err.message}`);
    }
  }


  function closeQuizModals() {
    quizPopup.style.display = "none";
  }

  // =======================
  // BINDING
  // =======================
  const btnOpenCreator = document.getElementById("btnOpenQuizCreator");
  if (btnOpenCreator) btnOpenCreator.addEventListener("click", openQuizCreator);
  if (btnStartQuiz) btnStartQuiz.addEventListener("click", openQuizCreator);

  window.addQuestionBlock = () => addQuestionBlock(true);
  window.openQuizCreator = openQuizCreator;
  window.closeQuizModals = closeQuizModals;
  window.saveQuizToForm = saveQuizToForm;
});
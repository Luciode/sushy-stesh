function parseNotes(text) {
  const qna = [];
  const lines = text.split("\n").map(l => l.trim()).filter(l => l);

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("Q:") && lines[i+1]?.startsWith("A:")) {
      qna.push({
        question: lines[i].replace("Q:", "").trim(),
        answer: lines[i+1].replace("A:", "").trim()
      });
      i++;
    } else if (!lines[i].startsWith("A:") && !lines[i].startsWith("Topic:")) {
      // fallback: use colon as key-value
      const parts = lines[i].split(":");
      if (parts.length > 1) {
        qna.push({
          question: `What is ${parts[0].trim()}?`,
          answer: parts.slice(1).join(":").trim()
        });
      }
    }
  }
  return qna;
}

function startStudy(mode) {
  const notes = document.getElementById("notes").value;
  const pairs = parseNotes(notes);
  const area = document.getElementById("study-area");
  area.innerHTML = "";
  
  if (pairs.length === 0) {
    area.innerHTML = "<p>Please add some notes first!</p>";
    return;
  }

  let index = 0;

  function showNext() {
    if (index >= pairs.length) {
      area.innerHTML = "<p>🎉 Done studying! You’re amazing 💕</p>";
      return;
    }

    const { question, answer } = pairs[index];
    area.innerHTML = "";

    if (mode === "flashcards") {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `<p><b>Q:</b> ${question}</p>
                        <button class="next-btn" onclick="this.nextElementSibling.style.display='block'">Show Answer</button>
                        <p style="display:none"><b>A:</b> ${answer}</p>`;
      area.appendChild(card);
    } 
    else if (mode === "mcq") {
      const box = document.createElement("div");
      box.className = "question-box";
      const wrongs = pairs.filter((_, i) => i !== index).slice(0,3).map(p => p.answer);
      const options = shuffle([answer, ...wrongs]);
      box.innerHTML = `<p><b>Q:</b> ${question}</p>`;
      options.forEach(opt => {
        const btn = document.createElement("button");
        btn.textContent = opt;
        btn.className = "next-btn";
        btn.onclick = () => {
          if (opt === answer) btn.style.background = "#71d971";
          else btn.style.background = "#ff6b6b";
          setTimeout(showNext, 700);
        };
        box.appendChild(btn);
      });
      area.appendChild(box);
    } 
    else if (mode === "written") {
      const box = document.createElement("div");
      box.className = "question-box";
      box.innerHTML = `<p><b>Q:</b> ${question}</p>
                       <input type="text" id="userAnswer" placeholder="Type your answer...">
                       <button class="next-btn">Check</button>
                       <p id="result"></p>`;
      area.appendChild(box);

      box.querySelector("button").onclick = () => {
        const userAns = box.querySelector("#userAnswer").value.trim().toLowerCase();
        const correct = answer.toLowerCase();
        box.querySelector("#result").innerHTML =
          userAns.includes(correct) ? "✅ Correct!" : `❌ Correct answer: ${answer}`;
        setTimeout(showNext, 1000);
      };
    }

    index++;
  }

  function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
  }

  showNext();
}
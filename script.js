class ValdorianDictionary {
  constructor() {
    this.searchInput = document.getElementById("searchInput")
    this.clearBtn = document.getElementById("clearBtn")
    this.showAllBtn = document.getElementById("showAllBtn")
    this.results = document.getElementById("results")
    this.noResults = document.getElementById("noResults")
    this.resultCount = document.getElementById("resultCount")

    this.originalWelcomeHTML = this.results.innerHTML;

    this.dictionaryData = []; // keep dictionary inside the class
    this.loadDictionary(); 

    this.initializeEventListeners()
    this.showWelcomeMessage()
    this.updateButtonVisibility()
    
  }

  async loadDictionary() {
    try {
      const response = await fetch("dictionary.json");
      const data = await response.json();

      // Normalize all entries
      this.dictionaryData = data.word_entries.map(rawEntry =>
        this.normalizeEntry(rawEntry)
      );

      // Show welcome screen
      this.showWelcomeMessage();
      this.updateButtonVisibility();
    } catch (error) {
      console.error("Error loading dictionary:", error);
    }
  }

  normalizeEntry(rawEntry) {
    return {
      sordish: rawEntry.sordish,
      english: rawEntry.english,
      pronunciation: rawEntry.pronunciation, // handle typo
      partOfSpeech: rawEntry.part_of_speech,
      definition: rawEntry.definition || "",
      origin: rawEntry.origin,
      source: rawEntry.source,
      verbType: rawEntry.verb_type,
      gender: rawEntry.gender,
      root: rawEntry.root,
      associatedWords: rawEntry.associated_words
    };
  }

  initializeEventListeners() {
    this.searchInput.addEventListener("input", (e) => {
      this.handleSearch(e.target.value)
    })

    this.clearBtn.addEventListener("click", () => {
      this.clearSearch()
    })

    // Added event listener for show all button
    this.showAllBtn.addEventListener("click", () => {
      this.showAllWords()
    })

    this.searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.clearSearch()
      }
    })
  }

  handleSearch(query) {
    const trimmedQuery = query.trim()

    if (trimmedQuery === "") {
      this.showWelcomeMessage()
      this.updateResultCount(0)
      this.updateButtonVisibility()
      return
    }

    const results = this.searchDictionary(trimmedQuery)
    this.displayResults(results, trimmedQuery)
    this.updateResultCount(results.length)
    this.updateButtonVisibility()
  }

  searchDictionary(query) {
    const lowerQuery = query.toLowerCase();

    return this.dictionaryData.filter((entry) => {
      return (
        entry.sordish.toLowerCase().includes(lowerQuery) ||
        entry.english.toLowerCase().includes(lowerQuery) ||
        entry.definition.toLowerCase().includes(lowerQuery) ||
        entry.pronunciation.toLowerCase().includes(lowerQuery)
      );
    });
  }

  showAllWords() {
    this.searchInput.value = "";
    this.displayResults(this.dictionaryData, "");
    this.updateResultCount(this.dictionaryData.length);
    this.updateButtonVisibility(false);
  }

  displayResults(results, query) {
    if (results.length === 0) {
      this.showNoResults()
      return
    }

    this.hideNoResults()
    this.results.innerHTML = ""

    results.forEach((entry) => {
      const entryElement = this.createEntryElement(entry, query)
      this.results.appendChild(entryElement)
    })
  }

  createEntryElement(entry, query) {
    const entryDiv = document.createElement("div")
    entryDiv.className = "word-entry"

    const headerDiv = document.createElement("div")
    headerDiv.className = "word-header"

    const sordishWord = document.createElement("span")
    sordishWord.className = "sordish-word"
    sordishWord.innerHTML = this.highlightMatch(entry.sordish, query)

    // Add tooltip if root exists
    if (entry.root) {
      const tooltip = document.createElement("span")
      tooltip.className = "root-tooltip"
      tooltip.textContent = `Root: ${entry.root}`
      sordishWord.appendChild(tooltip)
    }

    const pronunciation = document.createElement("span")
    pronunciation.className = "pronunciation"
    pronunciation.innerHTML = `${this.highlightMatch(entry.pronunciation, query)}`

    const partOfSpeech = document.createElement("span")
    partOfSpeech.className = "part-of-speech " + entry.partOfSpeech.toLowerCase()
    partOfSpeech.textContent = entry.partOfSpeech

    const origin = document.createElement("span")
    origin.className = "origin " + entry.origin.toLowerCase()
    origin.textContent = entry.origin ? `${entry.origin}` : ""

    let declensionBtn;

    if (entry.partOfSpeech.toLowerCase() === "verb") {
      declensionBtn = document.createElement("button");
      declensionBtn.className = "declension-btn";
      declensionBtn.textContent = "declension";

      declensionBtn.addEventListener("click", () => {
        this.openDeclensionModal(entry);
      });
    }
    headerDiv.appendChild(sordishWord)
    headerDiv.appendChild(pronunciation)
    headerDiv.appendChild(partOfSpeech)
    headerDiv.appendChild(origin)

    if (declensionBtn) headerDiv.appendChild(declensionBtn);

    const englishTranslation = document.createElement("div")
    englishTranslation.className = "english-translation"
    englishTranslation.innerHTML = this.highlightMatch(entry.english, query)

    const definition = document.createElement("div")
    definition.className = "definition"
    definition.innerHTML = this.highlightMatch(entry.definition, query)

    const watermark = document.createElement("img")
    watermark.src = "SLI-logo-black.svg"
    watermark.className = "watermark"

    entryDiv.appendChild(headerDiv)
    entryDiv.appendChild(englishTranslation)
    entryDiv.appendChild(definition)
    entryDiv.appendChild(watermark)

    if (entry.associatedWords && Object.keys(entry.associatedWords).length > 0) {
      const associatedDiv = document.createElement("div")
      associatedDiv.className = "associated-words"
      associatedDiv.innerHTML = "<strong>Associated Words:</strong> "

      Object.entries(entry.associatedWords).forEach(([word, url], index) => {
        const link = document.createElement("a")
        link.href = url
        link.textContent = word
        link.target = "_blank"
        link.rel = "noopener noreferrer"

        associatedDiv.appendChild(link)

        // Add comma separators if not last
        if (index < Object.keys(entry.associatedWords).length - 1) {
          associatedDiv.append(", ")
        }
      })

      entryDiv.appendChild(associatedDiv)
    }

    return entryDiv
  }

  generateDeclension(word) {
    // Define verb types
    const verbTypes = [
      {
        type: "Type I",
        endings: ["e"],
        description: `Type I verbs are identified by the ending letter 'e'. Type I words are classified as strong verbs, as they are what the other verb types are based on.`,
        generate: (stem, fullWord) => [
          { form: "Simple", past: stem + "en", present: fullWord, future: "wes " + fullWord },
          { form: "Continuous", past: "", present: stem + "rai", future: "wes " + stem + "ai" },
          { form: "Perfect", past: "her " + stem + "en", present: "her " + fullWord, future: "" },
          { form: "Perfect Continuous", past: "her " + stem + "aien", present: "her " + stem + "aien", future: "" }
        ]
      },
      {
        type: "Type II",
        endings: ["ae"],
        description: `Type II verbs are identified by the ending 'ae'. Type II verbs are thought of as strong verbs, as their suffix keeps most of its form throughout conjugation.`,
        generate: (stem, fullWord, ending) => {
          return [
            { form: "Simple", past: stem + "n", present: fullWord, future: "wes " + fullWord },
            { form: "Continuous", past: "", present: stem + "ai", future: "wes " + stem + "ai" },
            { form: "Perfect", past: "her " + stem + "aen", present: "her " + fullWord, future: "" },
            { form: "Perfect Continuous", past: "her " + stem + "aien", present: "her " + stem + "aien", future: "" }
          ];
        }
      },
      {
        type: "Type IV",
        endings: ["i"],
        description: `Type IV words end in 'i'. Type IV verbs are thought of as strong verbs, as their suffix keeps most of its form throughout conjugation.`,
        generate: (stem, fullWord) => [
          { form: "Simple", past: stem + "in", present: fullWord, future: "wes " + fullWord },
          { form: "Continuous", past: "", present: stem + "ai", future: "wes " + stem + "ai" },
          { form: "Perfect", past: "her " + stem + "in", present: "her " + fullWord, future: "" },
          { form: "Perfect Continuous", past: "her " + stem + "aien", present: "her " + stem + "aien", future: "" }
        ]
      },
      {
        type: "Type V",
        endings: ["a"],
        description: `Type V verbs end in 'a', and are primarily Germanic but can also be found in Latin verbs.`,
        generate: (stem, fullWord) => [
          { form: "Simple", past: stem + "ah", present: fullWord, future: "wes " + fullWord },
          { form: "Continuous", past: "", present: stem + "ai", future: "wes " + stem + "ai" },
          { form: "Perfect", past: "her " + stem + "an", present: "her " + fullWord, future: "" },
          { form: "Perfect Continuous", past: "her " + stem + "aien", present: "her " + stem + "aien", future: "" }
        ]
      },
      {
        type: "Type VI",
        endings: ["o"],
        description: `Type VI verbs end in 'o', and are primarily Latin. These are rare but found in newer Latin words.`,
        generate: (stem, fullWord) => [
          { form: "Simple", past: stem + "en", present: fullWord, future: "wes " + fullWord },
          { form: "Continuous", past: "", present: stem + "ai", future: "wes " + stem + "ai" },
          { form: "Perfect", past: "her " + stem + "en", present: "her " + fullWord, future: "" },
          { form: "Perfect Continuous", past: "her " + stem + "aien", present: "her " + stem + "aien", future: "" }
        ]
      },
      {
        type: "Type VII",
        endings: ["en"],
        description: `Type VII words end in 'en', and are primarily Latin.`,
        generate: (stem, fullWord) => [
          { form: "Simple", past: stem + "en", present: fullWord, future: "wes " + fullWord },
          { form: "Continuous", past: "", present: stem + "ai", future: "wes " + stem + "ai" },
          { form: "Perfect", past: "her " + stem + "enen", present: "her " + fullWord, future: "" },
          { form: "Perfect Continuous", past: "her " + stem + "aien", present: "her " + stem + "aien", future: "" }
        ]
      },
      {
        type: "Type III",
        endings: ["b", "c", "d", "f", "g", "h", "k", "l", "m", "n", "p", "q", "r", "s", "t", "v", "w", "x", "y", "z"], 
        description: `Type III words end in a consonant, but never with 'en'. These words are common in all kinds of verbs, primarily found in the new words.`,
        generate: (stem, fullWord) => [
          { form: "Simple", past: stem + "en", present: fullWord, future: "wes " + fullWord },
          { form: "Continuous", past: "", present: stem + "ai", future: "wes " + stem + "ai" },
          { form: "Perfect", past: "her " + stem + "en", present: "her " + fullWord, future: "" },
          { form: "Perfect Continuous", past: "her " + stem + "aien", present: "her " + stem + "aien", future: "" }
        ]
      }
    ];

    // Find the first matching type
    for (const verbType of verbTypes) {
      const endingMatched = verbType.endings.find(e => word.endsWith(e));
      if (endingMatched) {
        const stem = word.slice(0, -endingMatched.length);
        const conjugation = verbType.generate(stem, word, endingMatched);
        return { type: verbType.type, description: verbType.description, conjugation };
      }
    }

    // Default if no type matches
    return {
      type: "Unknown",
      description: "No declension rules available for this word.",
      conjugation: []
    };
  }

  openDeclensionModal(entry) {
    // Generate declension dynamically
    const declension = this.generateDeclension(entry.sordish);

    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    // Create modal
    const modal = document.createElement("div");
    modal.className = "modal";

    // Build table rows
    const rows = declension.conjugation.map(c => `
      <tr>
        <td>${c.form}</td>
        <td>${c.past || ""}</td>
        <td>${c.present || ""}</td>
        <td>${c.future || ""}</td>
      </tr>
    `).join("");

    // Set modal content
    modal.innerHTML = `
      <h3>${entry.sordish} (${declension.type})</h3>
      <p>${declension.description}</p>
      <table class="declension-table">
        <thead>
          <tr>
            <th>Form</th>
            <th>Past</th>
            <th>Present</th>
            <th>Future</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <button class="close-btn">Close</button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Close button
    modal.querySelector(".close-btn").addEventListener("click", () => {
      document.body.removeChild(overlay);
    });
  }

  highlightMatch(text, query) {
    if (!query) return text

    const regex = new RegExp(`(${this.escapeRegex(query)})`, "gi")
    return text.replace(regex, '<span class="highlight">$1</span>')
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }

  showWelcomeMessage() {
    this.results.innerHTML = this.originalWelcomeHTML;
    this.hideNoResults();
  }

  showNoResults() {
    this.results.innerHTML = ""
    this.noResults.classList.remove("hidden")
  }

  hideNoResults() {
    this.noResults.classList.add("hidden")
  }

  updateResultCount(count) {
    if (count === 0 && this.searchInput.value.trim() === "") {
      this.resultCount.textContent = ""
    } else if (count === 0) {
      this.resultCount.textContent = "No results found"
    } else if (count === 1) {
      this.resultCount.textContent = "1 result found"
    } else {
      this.resultCount.textContent = `${count} results found`
    }
  }

  updateButtonVisibility(value = true) {
    const hasSearch = this.searchInput.value.trim() !== ""

    if (hasSearch || !value) {
      // Hide button, show result count
      this.showAllBtn.style.display = "none"
      this.resultCount.style.display = "inline"
    } else {
      // Show button, hide result count
      this.showAllBtn.style.display = "inline-block"
      this.resultCount.style.display = "none"
    }
  }

  clearSearch() {
    this.searchInput.value = ""
    this.showWelcomeMessage()
    this.updateResultCount(0)
    this.updateButtonVisibility()
    this.searchInput.focus()
  }

}

// Initialize the dictionary when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new ValdorianDictionary()
})



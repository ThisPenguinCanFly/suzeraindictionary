class ConlangDictionary {
  constructor(language, config) {
    this.language = language
    this.config = config

    this.searchInput = document.getElementById(config.searchInputId)
    this.clearBtn = document.getElementById(config.clearBtnId)
    this.showAllBtn = document.getElementById(config.showAllBtnId)
    this.results = document.getElementById(config.resultsId)
    this.noResults = document.getElementById(config.noResultsId)
    this.resultCount = document.getElementById(config.resultCountId)

    this.originalWelcomeHTML = this.results.innerHTML
    this.dictionaryData = []

    this.loadDictionary(config.dataSource)
    this.initializeEventListeners()
    this.updateButtonVisibility()
  }

  loadDictionary(dataSource) {
    if (dataSource && dataSource.word_entries) {
      this.dictionaryData = dataSource.word_entries.map((entry) => this.normalizeEntry(entry))
    }
    this.showWelcomeMessage()
    this.updateButtonVisibility()
  }

  normalizeEntry(rawEntry) {
    const wordKey = this.language === "sordish" ? "sordish" : "rizian"
    return {
      word: rawEntry[wordKey] || rawEntry.word || "",
      english: rawEntry.english || "",
      pronunciation: rawEntry.pronunciation || "",
      partOfSpeech: rawEntry.part_of_speech || "",
      definition: rawEntry.definition || "",
      origin: rawEntry.origin || "",
      verbType: rawEntry.verb_type || "",
      gender: rawEntry.gender || "",
      associatedWords: rawEntry.associated_words || {},
    }
  }

  initializeEventListeners() {
    this.searchInput.addEventListener("input", (e) => {
      this.handleSearch(e.target.value)
    })

    this.clearBtn.addEventListener("click", () => {
      this.clearSearch()
    })

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
    const lowerQuery = query.toLowerCase()
    return this.dictionaryData.filter((entry) => {
      return (
        entry.word.toLowerCase().includes(lowerQuery) ||
        entry.english.toLowerCase().includes(lowerQuery) ||
        entry.definition.toLowerCase().includes(lowerQuery) ||
        entry.pronunciation.toLowerCase().includes(lowerQuery)
      )
    })
  }

  showAllWords() {
    this.searchInput.value = ""
    this.displayResults(this.dictionaryData, "")
    this.updateResultCount(this.dictionaryData.length)
    this.updateButtonVisibility(false)
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

    const conlangWord = document.createElement("span")
    conlangWord.className = `conlang-word ${this.language}`
    conlangWord.innerHTML = this.highlightMatch(entry.word, query)

    const pronunciation = document.createElement("span")
    pronunciation.className = "pronunciation"
    pronunciation.innerHTML = this.highlightMatch(entry.pronunciation, query)

    if(this.canWordBeNoun(entry.partOfSpeech)){
      const gender = document.createElement("span");
      gender.className = `gender ${entry.gender} tooltip`;
      gender.textContent = entry.gender[0];

      const genderTooltip = document.createElement("span");
      genderTooltip.className = "tooltip-text";
      genderTooltip.textContent = entry.gender;
      gender.appendChild(genderTooltip);

      const plural = document.createElement("span");
      plural.className = `plural ${entry.gender} tooltip`;
      plural.textContent = this.getPluralForm(entry.gender);

      const pluralTooltip = document.createElement("span");
      pluralTooltip.className = "tooltip-text";
      pluralTooltip.textContent = "Plural form";
      plural.appendChild(pluralTooltip);

      headerDiv.appendChild(conlangWord);
      if(this.canWordBeNoun(entry.partOfSpeech)) headerDiv.appendChild(plural);
      if(this.canWordBeNoun(entry.partOfSpeech)) headerDiv.appendChild(gender);
      headerDiv.appendChild(pronunciation);
    }
    else{
      headerDiv.appendChild(conlangWord)
      headerDiv.appendChild(pronunciation)
    }
    


    if (Array.isArray(entry.partOfSpeech)) {
      entry.partOfSpeech.forEach(pos => {
        headerDiv.appendChild(this.createPOSSpan(pos));
      });
    } else {
      headerDiv.appendChild(this.createPOSSpan(entry.partOfSpeech));
    }

    if (entry.origin) {
      const origin = document.createElement("span")
      origin.className = `origin ${entry.origin.toLowerCase().replace(/\s+/g, "-")}`
      origin.textContent = entry.origin
      headerDiv.appendChild(origin)
    }

    // Add declension button for verbs (Sordish only for now)
    if (this.language === "sordish" && this.canWordBeVerb(entry.partOfSpeech)) {
      const declensionBtn = document.createElement("button")
      declensionBtn.className = "declension-btn"
      declensionBtn.textContent = "declension"
      declensionBtn.addEventListener("click", () => {
        this.openDeclensionModal(entry)
      })
      headerDiv.appendChild(declensionBtn)
    }

    const englishTranslation = document.createElement("div")
    englishTranslation.className = "english-translation"
    englishTranslation.innerHTML = this.highlightMatch(entry.english, query)

    const definition = document.createElement("div")
    definition.className = "definition"
    definition.innerHTML = this.highlightMatch(entry.definition, query)

    entryDiv.appendChild(headerDiv)
    entryDiv.appendChild(englishTranslation)
    entryDiv.appendChild(definition)

    return entryDiv
  }

  getPluralForm(gender){
    switch(gender){
      case "masculine": return "-es";
      case "feminine": return "-s";
      case "neuter": return "-e";
    }
    return "N";
  }

  canWordBeVerb(pos) {
    if (typeof pos === "string") {
      return pos === "VERB";
    } else if (Array.isArray(pos)) {
      return pos.includes("VERB");
    } else {
      return false;
    }
  }

  canWordBeNoun(pos) {
    if (typeof pos === "string") {
      return pos === "NOUN";
    } else if (Array.isArray(pos)) {
      return pos.includes("NOUN");
    } else {
      return false;
    }
  }

  createPOSSpan(pos) {
    const span = document.createElement("span");
    span.className = `part-of-speech ${pos}`;
    span.textContent = pos;
    return span;
  }

  generateDeclension(word) {
    const verbTypes = [
      {
        type: "Type I",
        endings: ["e"],
        description:
          "Type I verbs are identified by the ending letter 'e'. Type I words are classified as strong verbs.",
        generate: (stem, fullWord) => [
          { form: "Simple", past: stem + "en", present: fullWord, future: "wes " + fullWord },
          { form: "Continuous", past: "", present: stem + "rai", future: "wes " + stem + "ai" },
          { form: "Perfect", past: "her " + stem + "en", present: "her " + fullWord, future: "" },
          { form: "Perfect Continuous", past: "her " + stem + "aien", present: "her " + stem + "aien", future: "" },
        ],
      },
      {
        type: "Type II",
        endings: ["ae"],
        description: "Type II verbs are identified by the ending 'ae'. Type II verbs are thought of as strong verbs.",
        generate: (stem, fullWord) => [
          { form: "Simple", past: stem + "n", present: fullWord, future: "wes " + fullWord },
          { form: "Continuous", past: "", present: stem + "ai", future: "wes " + stem + "ai" },
          { form: "Perfect", past: "her " + stem + "aen", present: "her " + fullWord, future: "" },
          { form: "Perfect Continuous", past: "her " + stem + "aien", present: "her " + stem + "aien", future: "" },
        ],
      },
      {
        type: "Type IV",
        endings: ["i"],
        description: "Type IV words end in 'i'. Type IV verbs are thought of as strong verbs.",
        generate: (stem, fullWord) => [
          { form: "Simple", past: stem + "in", present: fullWord, future: "wes " + fullWord },
          { form: "Continuous", past: "", present: stem + "ai", future: "wes " + stem + "ai" },
          { form: "Perfect", past: "her " + stem + "in", present: "her " + fullWord, future: "" },
          { form: "Perfect Continuous", past: "her " + stem + "aien", present: "her " + stem + "aien", future: "" },
        ],
      },
      {
        type: "Type V",
        endings: ["a"],
        description: "Type V verbs end in 'a', and are primarily Germanic but can also be found in Latin verbs.",
        generate: (stem, fullWord) => [
          { form: "Simple", past: stem + "ah", present: fullWord, future: "wes " + fullWord },
          { form: "Continuous", past: "", present: stem + "ai", future: "wes " + stem + "ai" },
          { form: "Perfect", past: "her " + stem + "an", present: "her " + fullWord, future: "" },
          { form: "Perfect Continuous", past: "her " + stem + "aien", present: "her " + stem + "aien", future: "" },
        ],
      },
      {
        type: "Type VI",
        endings: ["o"],
        description:
          "Type VI verbs end in 'o', and are primarily Latin. These are rare but found in newer Latin words.",
        generate: (stem, fullWord) => [
          { form: "Simple", past: stem + "en", present: fullWord, future: "wes " + fullWord },
          { form: "Continuous", past: "", present: stem + "ai", future: "wes " + stem + "ai" },
          { form: "Perfect", past: "her " + stem + "en", present: "her " + fullWord, future: "" },
          { form: "Perfect Continuous", past: "her " + stem + "aien", present: "her " + stem + "aien", future: "" },
        ],
      },
      {
        type: "Type VII",
        endings: ["en"],
        description: "Type VII words end in 'en', and are primarily Latin.",
        generate: (stem, fullWord) => [
          { form: "Simple", past: stem + "en", present: fullWord, future: "wes " + fullWord },
          { form: "Continuous", past: "", present: stem + "ai", future: "wes " + stem + "ai" },
          { form: "Perfect", past: "her " + stem + "enen", present: "her " + fullWord, future: "" },
          { form: "Perfect Continuous", past: "her " + stem + "aien", present: "her " + stem + "aien", future: "" },
        ],
      },
      {
        type: "Type III",
        endings: ["b", "c", "d", "f", "g", "h", "k", "l", "m", "n", "p", "q", "r", "s", "t", "v", "w", "x", "y", "z"],
        description:
          "Type III words end in a consonant, but never with 'en'. These words are common in all kinds of verbs.",
        generate: (stem, fullWord) => [
          { form: "Simple", past: stem + "en", present: fullWord, future: "wes " + fullWord },
          { form: "Continuous", past: "", present: stem + "ai", future: "wes " + stem + "ai" },
          { form: "Perfect", past: "her " + stem + "en", present: "her " + fullWord, future: "" },
          { form: "Perfect Continuous", past: "her " + stem + "aien", present: "her " + stem + "aien", future: "" },
        ],
      },
    ]

    for (const verbType of verbTypes) {
      const endingMatched = verbType.endings.find((e) => word.endsWith(e))
      if (endingMatched) {
        const stem = word.slice(0, -endingMatched.length)
        const conjugation = verbType.generate(stem, word, endingMatched)
        return { type: verbType.type, description: verbType.description, conjugation }
      }
    }

    return {
      type: "Unknown",
      description: "No declension rules available for this word.",
      conjugation: [],
    }
  }

  openDeclensionModal(entry) {
    const declension = this.generateDeclension(entry.word)
    const modal = document.getElementById("declensionModal")
    const modalContent = document.getElementById("modalContent")

    const rows = declension.conjugation
      .map(
        (c) => `
            <tr>
                <td>${c.form}</td>
                <td>${c.past || "-"}</td>
                <td>${c.present || "-"}</td>
                <td>${c.future || "-"}</td>
            </tr>
        `,
      )
      .join("")

    modalContent.innerHTML = `
            <h3>${entry.word} (${declension.type})</h3>
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
        `

    modal.classList.remove("hidden")
  }

  highlightMatch(text, query) {
    if (!query || !text) return text
    const regex = new RegExp(`(${this.escapeRegex(query)})`, "gi")
    return text.replace(regex, '<span class="highlight">$1</span>')
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }

  showWelcomeMessage() {
    this.results.innerHTML = this.originalWelcomeHTML
    this.hideNoResults()
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

  updateButtonVisibility(showButton = true) {
    const hasSearch = this.searchInput.value.trim() !== ""
    if (hasSearch || !showButton) {
      this.showAllBtn.style.display = "none"
      this.resultCount.style.display = "inline"
    } else {
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

// Tab Navigation
function initializeTabs() {
  const tabBtns = document.querySelectorAll(".tab-btn")
  const tabContents = document.querySelectorAll(".tab-content")

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabId = btn.dataset.tab

      // Remove active class from all tabs and contents
      tabBtns.forEach((b) => b.classList.remove("active"))
      tabContents.forEach((c) => c.classList.remove("active"))

      // Add active class to clicked tab and corresponding content
      btn.classList.add("active")
      document.getElementById(tabId).classList.add("active")
    })
  })
}

// Modal close functionality
function initializeModal() {
  const modal = document.getElementById("declensionModal")
  const closeBtn = document.getElementById("closeModalBtn")

  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden")
  })

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden")
    }
  })

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      modal.classList.add("hidden")
    }
  })
}

document.addEventListener("DOMContentLoaded", () => {
  initializeTabs();
  initializeModal();

  // Helper function to load a JSON dictionary file
  async function loadDictionary(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      // Wrap the array in the word_entries structure your ConlangDictionary expects
      return { word_entries: data };
    } catch (error) {
      console.error("Failed to load dictionary:", error);
      return { word_entries: [] }; // fallback empty dictionary
    }
  }

  // Load Sordish dictionary from JSON
  loadDictionary("sordish-dict.json").then(sordishDictionary => {
    new ConlangDictionary("sordish", {
      searchInputId: "sordishSearchInput",
      clearBtnId: "sordishClearBtn",
      showAllBtnId: "sordishShowAllBtn",
      resultsId: "sordishResults",
      noResultsId: "sordishNoResults",
      resultCountId: "sordishResultCount",
      dataSource: sordishDictionary,
    });
  });

  // Load Rizian dictionary from JSON
  loadDictionary("rizian-data.json").then(rizianDictionary => {
    new ConlangDictionary("rizian", {
      searchInputId: "rizianSearchInput",
      clearBtnId: "rizianClearBtn",
      showAllBtnId: "rizianShowAllBtn",
      resultsId: "rizianResults",
      noResultsId: "rizianNoResults",
      resultCountId: "rizianResultCount",
      dataSource: rizianDictionary,
    });
  });
});

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
      root: rawEntry.root || "",
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

    if (entry.root) {
      const tooltip = document.createElement("span")
      tooltip.className = "root-tooltip"
      tooltip.textContent = `Root: ${entry.root}`
      conlangWord.appendChild(tooltip)
    }

    const pronunciation = document.createElement("span")
    pronunciation.className = "pronunciation"
    pronunciation.innerHTML = this.highlightMatch(entry.pronunciation, query)

    const partOfSpeech = document.createElement("span")
    partOfSpeech.className = `part-of-speech ${entry.partOfSpeech.toLowerCase()}`
    partOfSpeech.textContent = entry.partOfSpeech

    headerDiv.appendChild(conlangWord)
    headerDiv.appendChild(pronunciation)
    headerDiv.appendChild(partOfSpeech)

    if (entry.origin) {
      const origin = document.createElement("span")
      origin.className = `origin ${entry.origin.toLowerCase().replace(/\s+/g, "-")}`
      origin.textContent = entry.origin
      headerDiv.appendChild(origin)
    }

    // Add declension button for verbs (Sordish only for now)
    if (this.language === "sordish" && entry.partOfSpeech.toLowerCase() === "verb") {
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

// Initialize everything when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  initializeTabs()
  initializeModal()

  // Initialize Sordish Dictionary
  const sordishDictionary = {
    word_entries: [
      // Example entries for Sordish
      {
        sordish: "example",
        english: "example",
        pronunciation: "ex-ample",
        part_of_speech: "noun",
        definition: "A sample.",
      },
      // Add more entries as needed
    ],
  }
  new ConlangDictionary("sordish", {
    searchInputId: "sordishSearchInput",
    clearBtnId: "sordishClearBtn",
    showAllBtnId: "sordishShowAllBtn",
    resultsId: "sordishResults",
    noResultsId: "sordishNoResults",
    resultCountId: "sordishResultCount",
    dataSource: sordishDictionary,
  })

  // Initialize Rizian Dictionary
  const rizianDictionary = {
    word_entries: [
      // Example entries for Rizian
      {
        rizian: "sample",
        english: "sample",
        pronunciation: "sam-ple",
        part_of_speech: "noun",
        definition: "A small amount.",
      },
      // Add more entries as needed
    ],
  }
  new ConlangDictionary("rizian", {
    searchInputId: "rizianSearchInput",
    clearBtnId: "rizianClearBtn",
    showAllBtnId: "rizianShowAllBtn",
    resultsId: "rizianResults",
    noResultsId: "rizianNoResults",
    resultCountId: "rizianResultCount",
    dataSource: rizianDictionary,
  })
})

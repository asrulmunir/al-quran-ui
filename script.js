// Base API URL
const API_BASE = 'https://quran-api.asrulmunir.workers.dev';

// DOM Elements
const loadingEl = document.getElementById('loading');
const errorModal = document.getElementById('error-modal');
const errorMessage = document.getElementById('error-message');

// Global variable to store chapters data
let chaptersData = [];

// Tab Management
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tab functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // Close mobile menu when tab is selected
            closeMobileMenuOnTabSelect();
            
            // Load chapters data when verses, compare, screenshot, or flashcard tab is activated
            if ((tabId === 'verses' || tabId === 'compare' || tabId === 'screenshot' || tabId === 'flashcard') && chaptersData.length === 0) {
                loadChaptersForDropdown();
            }
            
            // Initialize flashcard chapter dropdown
            if (tabId === 'flashcard') {
                setTimeout(() => {
                    populateFlashcardChapterDropdown();
                }, 100);
            }
            
            // Ensure screenshot dropdown is populated immediately
            if (tabId === 'screenshot') {
                setTimeout(() => {
                    const screenshotSelect = document.getElementById('screenshot-chapter-select');
                    if (screenshotSelect && screenshotSelect.innerHTML.includes('Loading chapters...')) {
                        populateBasicChapterDropdown();
                    }
                }, 100);
            }
        });
    });

    // Initialize tooltips and other setup functions
    initializeTooltips();
    
    // Load chapters data for dropdowns
    loadChaptersForDropdown();
    
    // Ensure screenshot dropdown is initialized
    setTimeout(() => {
        const screenshotSelect = document.getElementById('screenshot-chapter-select');
        if (screenshotSelect && screenshotSelect.innerHTML.includes('Loading chapters...')) {
            populateBasicChapterDropdown();
        }
    }, 500);
});

// Utility Functions
function showLoading() {
    loadingEl.classList.remove('hidden');
}

function hideLoading() {
    loadingEl.classList.add('hidden');
}

function showError(message) {
    errorMessage.textContent = message;
    errorModal.classList.remove('hidden');
}

function closeErrorModal() {
    errorModal.classList.add('hidden');
}

async function apiRequest(endpoint) {
    try {
        showLoading();
        const url = `${API_BASE}${endpoint}`;
        console.log('Making API request to:', url);
        
        const response = await fetch(url);
        console.log('Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('API Response data:', data);
        return data;
    } catch (error) {
        console.error('API Error:', error);
        showError(`API Error: ${error.message}`);
        throw error;
    } finally {
        hideLoading();
    }
}

function formatJson(obj) {
    return `<pre><code>${JSON.stringify(obj, null, 2)}</code></pre>`;
}

function createVerseCard(verse, showReference = true) {
    const card = document.createElement('div');
    card.className = 'verse-card';
    
    let html = '';
    
    if (showReference && verse.chapterNumber && verse.verseNumber) {
        html += `<div class="verse-reference">Chapter ${verse.chapterNumber}, Verse ${verse.verseNumber}</div>`;
    }
    
    if (verse.text) {
        html += `<div class="arabic-text">${verse.text}</div>`;
    }
    
    if (verse.location) {
        html += `<div class="verse-reference">${verse.location}</div>`;
    }
    
    if (verse.tokenCount) {
        html += `<div class="translation-info">Token Count: ${verse.tokenCount}</div>`;
    }
    
    card.innerHTML = html;
    return card;
}

function createChapterCard(chapter) {
    const card = document.createElement('div');
    card.className = 'chapter-card';
    card.onclick = () => loadSpecificChapter(chapter.number);
    
    card.innerHTML = `
        <div class="chapter-number">${chapter.number}</div>
        <div class="chapter-name">${chapter.name}</div>
        <div class="chapter-info">${chapter.verseCount} verses</div>
        ${chapter.tokenCount ? `<div class="chapter-info">${chapter.tokenCount} tokens</div>` : ''}
    `;
    
    return card;
}

function createTranslationCard(verse) {
    const card = document.createElement('div');
    card.className = 'verse-card';
    
    let html = `<div class="verse-reference">Chapter ${verse.chapterNumber}, Verse ${verse.verseNumber}</div>`;
    
    if (verse.arabic && verse.arabic.text) {
        html += `<div class="arabic-text">${verse.arabic.text}</div>`;
    }
    
    if (verse.translations) {
        Object.entries(verse.translations).forEach(([key, translation]) => {
            const decodedText = decodeHtmlEntities(translation.text);
            html += `
                <div class="translation-text">
                    <strong>${translation.language_name}:</strong> ${decodedText}
                    <div class="translation-info">Translator: ${translation.translator}</div>
                </div>
            `;
        });
    }
    
    card.innerHTML = html;
    return card;
}

// Load chapters data for dropdown (without showing loading spinner)
async function loadChaptersForDropdown() {
    try {
        if (chaptersData.length === 0) {
            const response = await fetch(`${API_BASE}/api/chapters`);
            if (response.ok) {
                chaptersData = await response.json();
            }
        }
        
        populateChapterDropdown();
    } catch (error) {
        console.error('Failed to load chapters for dropdown:', error);
        // Fallback: populate with basic chapter numbers
        populateBasicChapterDropdown();
    }
}

function populateChapterDropdown() {
    const chapterSelect = document.getElementById('verse-chapter-select');
    const compareChapterSelect = document.getElementById('compare-chapter-select');
    const screenshotChapterSelect = document.getElementById('screenshot-chapter-select');
    
    // Populate verse chapter dropdown
    if (chapterSelect) {
        chapterSelect.innerHTML = '<option value="">Select a chapter</option>';
        chaptersData.forEach(chapter => {
            const option = document.createElement('option');
            option.value = chapter.number;
            option.textContent = `${chapter.number}. ${chapter.name} (${chapter.verseCount} verses)`;
            option.dataset.verseCount = chapter.verseCount;
            chapterSelect.appendChild(option);
        });
    }
    
    // Populate compare chapter dropdown
    if (compareChapterSelect) {
        compareChapterSelect.innerHTML = '<option value="">Select a chapter</option>';
        chaptersData.forEach(chapter => {
            const option = document.createElement('option');
            option.value = chapter.number;
            option.textContent = `${chapter.number}. ${chapter.name} (${chapter.verseCount} verses)`;
            option.dataset.verseCount = chapter.verseCount;
            compareChapterSelect.appendChild(option);
        });
    }
    
    // Populate screenshot chapter dropdown
    if (screenshotChapterSelect) {
        screenshotChapterSelect.innerHTML = '<option value="">Select a chapter</option>';
        chaptersData.forEach(chapter => {
            const option = document.createElement('option');
            option.value = chapter.number;
            option.textContent = `${chapter.number}. ${chapter.name} (${chapter.verseCount} verses)`;
            option.dataset.verseCount = chapter.verseCount;
            option.dataset.chapterName = chapter.name;
            screenshotChapterSelect.appendChild(option);
        });
    }
}

function populateBasicChapterDropdown() {
    const chapterSelect = document.getElementById('verse-chapter-select');
    const compareChapterSelect = document.getElementById('compare-chapter-select');
    const screenshotChapterSelect = document.getElementById('screenshot-chapter-select');
    
    // Basic chapter list with approximate verse counts for popular chapters
    const basicChapters = [
        {number: 1, name: "Al-Fatihah", verses: 7},
        {number: 2, name: "Al-Baqarah", verses: 286},
        {number: 3, name: "Ali 'Imran", verses: 200},
        {number: 18, name: "Al-Kahf", verses: 110},
        {number: 36, name: "Ya-Sin", verses: 83},
        {number: 67, name: "Al-Mulk", verses: 30},
        {number: 112, name: "Al-Ikhlas", verses: 4}
    ];
    
    // Function to populate a dropdown
    function populateDropdown(selectElement) {
        if (!selectElement) return;
        
        selectElement.innerHTML = '<option value="">Select a chapter</option>';
        
        // Add all 114 chapters with basic numbering
        for (let i = 1; i <= 114; i++) {
            const basicChapter = basicChapters.find(ch => ch.number === i);
            const option = document.createElement('option');
            option.value = i;
            if (basicChapter) {
                option.textContent = `${i}. ${basicChapter.name} (~${basicChapter.verses} verses)`;
                option.dataset.verseCount = basicChapter.verses;
                option.dataset.chapterName = basicChapter.name;
            } else {
                option.textContent = `${i}. Chapter ${i}`;
                option.dataset.verseCount = 50; // Default estimate
                option.dataset.chapterName = `Chapter ${i}`;
            }
            selectElement.appendChild(option);
        }
    }
    
    // Populate all dropdowns
    populateDropdown(chapterSelect);
    populateDropdown(compareChapterSelect);
    populateDropdown(screenshotChapterSelect);
}

function updateVerseRange() {
    const chapterSelect = document.getElementById('verse-chapter-select');
    const verseSelect = document.getElementById('verse-number-select');
    
    if (!chapterSelect || !verseSelect) return;
    
    const selectedOption = chapterSelect.options[chapterSelect.selectedIndex];
    
    if (!selectedOption || !selectedOption.value) {
        verseSelect.innerHTML = '<option value="">Select chapter first</option>';
        return;
    }
    
    const verseCount = parseInt(selectedOption.dataset.verseCount) || 50;
    
    // Clear and populate verse dropdown
    verseSelect.innerHTML = '<option value="">Select a verse</option>';
    
    for (let i = 1; i <= verseCount; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Verse ${i}`;
        verseSelect.appendChild(option);
    }
    
    // Set default to verse 1
    verseSelect.value = '1';
}

// 1. API Info
async function loadApiInfo() {
    try {
        const data = await apiRequest('/api/info');
        const container = document.getElementById('api-info-result');
        
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${data.chapterCount}</div>
                    <div class="stat-label">Chapters</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${data.verseCount}</div>
                    <div class="stat-label">Verses</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${data.tokenCount}</div>
                    <div class="stat-label">Tokens</div>
                </div>
            </div>
            <h3>API Details:</h3>
            ${formatJson(data)}
        `;
    } catch (error) {
        console.error('Failed to load API info:', error);
    }
}

// 2. List Chapters
async function loadChapters() {
    try {
        const data = await apiRequest('/api/chapters');
        const container = document.getElementById('chapters-result');
        
        container.innerHTML = '<h3>All Chapters (Click to view):</h3>';
        
        data.forEach(chapter => {
            container.appendChild(createChapterCard(chapter));
        });
    } catch (error) {
        console.error('Failed to load chapters:', error);
    }
}

// 3. Get Specific Chapter
async function loadChapter() {
    const chapterId = document.getElementById('chapter-id').value;
    if (!chapterId || chapterId < 1 || chapterId > 114) {
        showError('Please enter a valid chapter number (1-114)');
        return;
    }
    
    await loadSpecificChapter(chapterId);
}

async function loadSpecificChapter(chapterId) {
    try {
        const data = await apiRequest(`/api/chapters/${chapterId}`);
        const container = document.getElementById('chapter-result');
        
        let html = `
            <h3>Chapter ${data.number}: ${data.name}</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${data.verseCount}</div>
                    <div class="stat-label">Verses</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${data.tokenCount}</div>
                    <div class="stat-label">Tokens</div>
                </div>
            </div>
        `;
        
        if (data.verses && data.verses.length > 0) {
            html += '<h4>Verses:</h4>';
            data.verses.forEach((verse, index) => {
                html += `
                    <div class="verse-card">
                        <div class="verse-reference">Verse ${index + 1}</div>
                        <div class="arabic-text">${verse.text}</div>
                        <div class="translation-info">Tokens: ${verse.tokenCount}</div>
                    </div>
                `;
            });
        }
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Failed to load chapter:', error);
    }
}

// 4. Get Specific Verse
async function loadVerse() {
    const chapterSelect = document.getElementById('verse-chapter-select');
    const verseSelect = document.getElementById('verse-number-select');
    
    const chapter = chapterSelect ? chapterSelect.value : document.getElementById('verse-chapter')?.value;
    const verse = verseSelect ? verseSelect.value : document.getElementById('verse-number')?.value;
    
    if (!chapter || !verse) {
        showError('Please select both chapter and verse');
        return;
    }
    
    await loadSpecificVerse(chapter, verse);
}

async function loadSpecificVerse(chapter, verse) {
    try {
        const data = await apiRequest(`/api/verses/${chapter}/${verse}`);
        const container = document.getElementById('verse-result');
        
        container.innerHTML = '';
        container.appendChild(createVerseCard(data));
        
        if (data.tokens && data.tokens.length > 0) {
            const tokensHtml = `
                <h4>Tokens (${data.tokens.length} total):</h4>
                <div style="padding: 15px; background: #f5f5f5; border-radius: 8px; margin-top: 15px;">
                    ${data.tokens.map((token, index) => {
                        let tokenText = '';
                        let tokenInfo = '';
                        
                        if (typeof token === 'object' && token !== null) {
                            tokenText = token.text || token.token || token.word || token.arabic || `Token ${index + 1}`;
                            tokenInfo = token.location ? ` (${token.location})` : '';
                        } else {
                            tokenText = String(token);
                        }
                        
                        return `<span style="margin: 5px; padding: 8px 12px; background: white; border-radius: 5px; display: inline-block; font-family: 'Amiri', 'Traditional Arabic', serif; direction: rtl; font-size: 1.2rem; border: 1px solid #ddd;" title="Token ${index + 1}${tokenInfo}">${tokenText}</span>`;
                    }).join('')}
                </div>
                <div style="margin-top: 10px; font-size: 0.9rem; color: #666;">
                    <strong>Token Analysis:</strong> Each token represents a word or morphological unit in the Arabic text.
                </div>
            `;
            container.innerHTML += tokensHtml;
        }
        
        // Update dropdowns to reflect the loaded verse
        updateDropdownsToVerse(chapter, verse);
    } catch (error) {
        console.error('Failed to load verse:', error);
    }
}

function updateDropdownsToVerse(chapter, verse) {
    const chapterSelect = document.getElementById('verse-chapter-select');
    const verseSelect = document.getElementById('verse-number-select');
    
    if (chapterSelect && chapterSelect.value !== chapter.toString()) {
        chapterSelect.value = chapter.toString();
        updateVerseRange();
    }
    
    if (verseSelect && verseSelect.value !== verse.toString()) {
        verseSelect.value = verse.toString();
    }
}

function updateCompareVerseRange() {
    const chapterSelect = document.getElementById('compare-chapter-select');
    const verseSelect = document.getElementById('compare-verse-select');
    
    if (!chapterSelect || !verseSelect) return;
    
    const selectedOption = chapterSelect.options[chapterSelect.selectedIndex];
    
    if (!selectedOption || !selectedOption.value) {
        verseSelect.innerHTML = '<option value="">Select chapter first</option>';
        return;
    }
    
    const verseCount = parseInt(selectedOption.dataset.verseCount) || 50;
    
    // Clear and populate verse dropdown
    verseSelect.innerHTML = '<option value="">Select a verse</option>';
    
    for (let i = 1; i <= verseCount; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Verse ${i}`;
        verseSelect.appendChild(option);
    }
    
    // Set default to verse 1
    verseSelect.value = '1';
}

// 5. Compare Translations
async function compareTranslations() {
    const chapterSelect = document.getElementById('compare-chapter-select');
    const verseSelect = document.getElementById('compare-verse-select');
    
    const chapter = chapterSelect ? chapterSelect.value : document.getElementById('compare-chapter')?.value;
    const verse = verseSelect ? verseSelect.value : document.getElementById('compare-verse')?.value;
    
    if (!chapter || !verse) {
        showError('Please select both chapter and verse');
        return;
    }
    
    try {
        const data = await apiRequest(`/api/compare/${chapter}/${verse}`);
        const container = document.getElementById('compare-result');
        
        container.innerHTML = '';
        container.appendChild(createTranslationCard(data));
    } catch (error) {
        console.error('Failed to compare translations:', error);
    }
}

function toggleTranslationOptions() {
    const showTranslations = document.getElementById('show-translations').checked;
    const translationOptions = document.getElementById('translation-language-options');
    
    if (showTranslations) {
        translationOptions.classList.remove('hidden');
    } else {
        translationOptions.classList.add('hidden');
    }
}

// Enhanced search function with translation support
async function searchArabicWithTranslations(data) {
    const showTranslations = document.getElementById('show-translations').checked;
    const translationLanguage = document.getElementById('translation-language').value;
    
    if (!showTranslations) {
        return displaySearchResults(data, 'search-result');
    }
    
    const container = document.getElementById('search-result');
    
    let html = `
        <div class="search-info">
            Found ${data.resultCount} results for "${data.query}" 
            (Type: ${data.type}, Normalize: ${data.normalize})
            ${data.hasMore ? ' - More results available' : ''}
            <br><strong>Translations:</strong> ${getTranslationLanguageText(translationLanguage)}
        </div>
    `;
    
    if (data.results && data.results.length > 0) {
        for (const result of data.results) {
            html += await createSearchResultWithTranslation(result, translationLanguage);
        }
    } else {
        html += '<p>No results found.</p>';
    }
    
    container.innerHTML = html;
}

function getTranslationLanguageText(lang) {
    switch(lang) {
        case 'en': return 'English only';
        case 'ms': return 'Malay only';
        case 'zh': return 'Chinese only';
        case 'ta': return 'Tamil only';
        case 'both': return 'English and Malay';
        case 'all': return 'All available languages';
        default: return 'Selected language';
    }
}

async function createSearchResultWithTranslation(result, translationLanguage) {
    const resultId = `result-${result.chapterNumber}-${result.verseNumber}`;
    
    let html = `
        <div class="search-result-with-translation">
            <div class="search-result-header">
                Chapter ${result.chapterNumber} (${result.chapterName}), Verse ${result.verseNumber}
            </div>
            <div class="search-result-content">
                <div class="arabic-text">${result.verseText}</div>
                <div class="translation-info">Location: ${result.location}</div>
                ${result.matchingTokens && result.matchingTokens.length > 0 ? `
                    <div style="margin-top: 10px;">
                        <strong>Matching tokens:</strong>
                        <div style="margin-top: 5px;">
                            ${result.matchingTokens.map(token => 
                                `<span style="background: #fffacd; padding: 3px 6px; border-radius: 3px; margin: 2px; display: inline-block; font-family: 'Amiri', 'Traditional Arabic', serif; direction: rtl;">${token.text}</span>`
                            ).join('')}
                        </div>
                    </div>
                ` : ''}
                <div id="${resultId}-translations" class="translation-loading">
                    Loading translations...
                </div>
            </div>
        </div>
    `;
    
    // Load translations asynchronously
    setTimeout(() => loadTranslationForResult(result.chapterNumber, result.verseNumber, resultId, translationLanguage), 100);
    
    return html;
}

async function loadTranslationForResult(chapter, verse, resultId, translationLanguage) {
    const translationContainer = document.getElementById(`${resultId}-translations`);
    
    if (!translationContainer) return;
    
    try {
        const data = await fetch(`${API_BASE}/api/compare/${chapter}/${verse}`);
        if (!data.ok) throw new Error('Failed to load translations');
        
        const compareData = await data.json();
        let translationHtml = '';
        
        if (compareData.translations) {
            // English translation
            if (translationLanguage === 'en' || translationLanguage === 'both' || translationLanguage === 'all') {
                const enTranslation = compareData.translations['en.hilali'];
                if (enTranslation) {
                    const decodedText = decodeHtmlEntities(enTranslation.text);
                    translationHtml += `
                        <div class="translation-text english-text">
                            <strong>English:</strong> ${decodedText}
                            <div class="translation-info">Translator: ${enTranslation.translator}</div>
                        </div>
                    `;
                }
            }
            
            // Malay translation
            if (translationLanguage === 'ms' || translationLanguage === 'both' || translationLanguage === 'all') {
                const msTranslation = compareData.translations['ms.basmeih'];
                if (msTranslation) {
                    const decodedText = decodeHtmlEntities(msTranslation.text);
                    translationHtml += `
                        <div class="translation-text malay-text">
                            <strong>Bahasa Melayu:</strong> ${decodedText}
                            <div class="translation-info">Translator: ${msTranslation.translator}</div>
                        </div>
                    `;
                }
            }
            
            // Chinese translation
            if (translationLanguage === 'zh' || translationLanguage === 'all') {
                const zhTranslation = compareData.translations['zh.jian'];
                if (zhTranslation) {
                    const decodedText = decodeHtmlEntities(zhTranslation.text);
                    translationHtml += `
                        <div class="translation-text chinese-text">
                            <strong>中文:</strong> ${decodedText}
                            <div class="translation-info">Translator: ${zhTranslation.translator}</div>
                        </div>
                    `;
                }
            }
            
            // Tamil translation
            if (translationLanguage === 'ta' || translationLanguage === 'all') {
                const taTranslation = compareData.translations['ta.tamil'];
                if (taTranslation) {
                    const decodedText = decodeHtmlEntities(taTranslation.text);
                    translationHtml += `
                        <div class="translation-text tamil-text">
                            <strong>தமிழ்:</strong> ${decodedText}
                            <div class="translation-info">Translator: ${taTranslation.translator}</div>
                        </div>
                    `;
                }
            }
        }
        
        if (translationHtml) {
            translationContainer.innerHTML = translationHtml;
        } else {
            translationContainer.innerHTML = '<div class="translation-error">Translations not available for this verse.</div>';
        }
        
    } catch (error) {
        console.error('Failed to load translation:', error);
        translationContainer.innerHTML = '<div class="translation-error">Failed to load translations.</div>';
    }
}
// 6. Search Arabic Text
async function searchArabic() {
    const query = document.getElementById('search-query').value.trim();
    if (!query) {
        showError('Please enter an Arabic search query');
        return;
    }
    
    const type = document.getElementById('search-type').value;
    const normalize = document.getElementById('normalize').checked;
    const limit = document.getElementById('search-limit').value;
    
    try {
        // Properly encode the Arabic text for URL
        const params = new URLSearchParams();
        params.set('q', query);
        params.set('type', type);
        params.set('normalize', normalize.toString());
        params.set('limit', limit);
        
        console.log('Search URL:', `/api/search?${params.toString()}`);
        
        const data = await apiRequest(`/api/search?${params.toString()}`);
        
        // Use enhanced search results with translations if enabled
        await searchArabicWithTranslations(data);
        
    } catch (error) {
        console.error('Failed to search Arabic text:', error);
    }
}

async function quickSearchArabic(term) {
    document.getElementById('search-query').value = term;
    document.getElementById('normalize').checked = true;
    await searchArabic();
}

// 7. Search Translations
async function searchTranslation() {
    const query = document.getElementById('translation-query').value.trim();
    if (!query) {
        showError('Please enter a search query');
        return;
    }
    
    const lang = document.getElementById('translation-lang').value;
    const type = document.getElementById('translation-type').value;
    const includeArabic = document.getElementById('include-arabic').checked;
    const limit = document.getElementById('translation-limit').value;
    
    try {
        // Properly encode parameters
        const params = new URLSearchParams();
        params.set('q', query);
        params.set('lang', lang);
        params.set('type', type);
        params.set('include_arabic', includeArabic.toString());
        params.set('limit', limit);
        
        console.log('Translation search URL:', `/api/search/translation?${params.toString()}`);
        
        const data = await apiRequest(`/api/search/translation?${params.toString()}`);
        displayTranslationSearchResults(data, 'search-translation-result');
    } catch (error) {
        console.error('Failed to search translations:', error);
    }
}

async function quickSearchTranslation(term, lang) {
    document.getElementById('translation-query').value = term;
    document.getElementById('translation-lang').value = lang;
    await searchTranslation();
}

function displaySearchResults(data, containerId) {
    const container = document.getElementById(containerId);
    
    let html = `
        <div class="search-info">
            Found ${data.resultCount} results for "${data.query}" 
            (Type: ${data.type}, Normalize: ${data.normalize})
            ${data.hasMore ? ' - More results available' : ''}
        </div>
    `;
    
    if (data.results && data.results.length > 0) {
        data.results.forEach(result => {
            html += `
                <div class="verse-card">
                    <div class="verse-reference">Chapter ${result.chapterNumber} (${result.chapterName}), Verse ${result.verseNumber}</div>
                    <div class="arabic-text">${result.verseText}</div>
                    <div class="translation-info">Location: ${result.location}</div>
                    ${result.matchingTokens && result.matchingTokens.length > 0 ? `
                        <div style="margin-top: 10px;">
                            <strong>Matching tokens:</strong>
                            <div style="margin-top: 5px;">
                                ${result.matchingTokens.map(token => 
                                    `<span style="background: #fffacd; padding: 3px 6px; border-radius: 3px; margin: 2px; display: inline-block; font-family: 'Amiri', 'Traditional Arabic', serif; direction: rtl;">${token.text}</span>`
                                ).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        });
    } else {
        html += '<p>No results found.</p>';
    }
    
    container.innerHTML = html;
}

function displayTranslationSearchResults(data, containerId) {
    const container = document.getElementById(containerId);
    
    let html = `
        <div class="search-info">
            Found ${data.resultCount} results for "${data.query}" in ${data.languageName}
            (Translator: ${data.translator}, Type: ${data.searchType})
            ${data.hasMore ? ' - More results available' : ''}
        </div>
    `;
    
    if (data.searchInfo) {
        html += `
            <div style="background: #e8f4fd; padding: 10px; border-radius: 8px; margin: 10px 0; font-size: 0.9rem; color: #1565c0;">
                <strong>Search Info:</strong> ${data.searchInfo.searchedIn}
            </div>
        `;
    }
    
    if (data.results && data.results.length > 0) {
        data.results.forEach(result => {
            html += `
                <div class="verse-card">
                    <div class="verse-reference">
                        Chapter ${result.chapterNumber} (${result.chapterName}${result.chapterNameArabic ? ` - ${result.chapterNameArabic}` : ''}), Verse ${result.verseNumber}
                    </div>
            `;
            
            // Display Arabic text if available
            if (result.arabic && result.arabic.text) {
                html += `<div class="arabic-text">${result.arabic.text}</div>`;
            }
            
            // Display translation text with proper language styling
            if (result.translation && result.translation.text) {
                const langClass = getLanguageClass(result.translation.language);
                const decodedText = decodeHtmlEntities(result.translation.text);
                html += `
                    <div class="translation-text ${langClass}">
                        <strong>${result.translation.languageName}:</strong> ${decodedText}
                        <div class="translation-info">Translator: ${result.translation.translator}</div>
                    </div>
                `;
            } else if (typeof result.translation === 'string') {
                // Fallback for simple string translations
                const langClass = getLanguageClass(data.language);
                const decodedText = decodeHtmlEntities(result.translation);
                html += `
                    <div class="translation-text ${langClass}">
                        <strong>${data.languageName}:</strong> ${decodedText}
                    </div>
                `;
            }
            
            html += `</div>`;
        });
    } else {
        html += '<p>No results found.</p>';
    }
    
    container.innerHTML = html;
}

function getLanguageClass(language) {
    switch(language) {
        case 'zh': return 'chinese-text';
        case 'ta': return 'tamil-text';
        case 'ms': return 'malay-text';
        case 'en': return 'english-text';
        default: return '';
    }
}

// Screenshot Generator Functions
function updateScreenshotVerseRange() {
    const chapterSelect = document.getElementById('screenshot-chapter-select');
    const verseSelect = document.getElementById('screenshot-verse-select');
    
    if (!chapterSelect || !verseSelect) return;
    
    const selectedOption = chapterSelect.options[chapterSelect.selectedIndex];
    
    if (!selectedOption || !selectedOption.value) {
        verseSelect.innerHTML = '<option value="">Select chapter first</option>';
        return;
    }
    
    const verseCount = parseInt(selectedOption.dataset.verseCount) || 50;
    
    // Clear and populate verse dropdown
    verseSelect.innerHTML = '<option value="">Select a verse</option>';
    
    for (let i = 1; i <= verseCount; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Verse ${i}`;
        verseSelect.appendChild(option);
    }
    
    // Set default to verse 1
    verseSelect.value = '1';
}

function updateScreenshotTheme() {
    const theme = document.getElementById('screenshot-theme').value;
    const preview = document.getElementById('screenshot-preview');
    
    // Remove all theme classes
    preview.classList.remove('light', 'dark', 'gradient', 'islamic');
    // Add selected theme
    preview.classList.add(theme);
}

function updateScreenshotFontSize() {
    const fontSize = document.getElementById('screenshot-font-size').value;
    const preview = document.getElementById('screenshot-preview');
    
    // Remove all font size classes
    preview.classList.remove('small', 'medium', 'large', 'extra-large');
    // Add selected font size
    preview.classList.add(fontSize);
}

async function generateScreenshot() {
    const chapterSelect = document.getElementById('screenshot-chapter-select');
    const verseSelect = document.getElementById('screenshot-verse-select');
    const translationSelect = document.getElementById('screenshot-translation-select');
    
    const chapter = chapterSelect.value;
    const verse = verseSelect.value;
    const translationLang = translationSelect.value;
    
    if (!chapter || !verse) {
        showError('Please select both chapter and verse');
        return;
    }
    
    try {
        // Get verse data and chapter data in parallel
        const [verseData, chapterData] = await Promise.all([
            apiRequest(`/api/verses/${chapter}/${verse}`),
            apiRequest(`/api/chapters`)
        ]);
        
        // Find the specific chapter info
        const chapterInfo = chapterData.find(ch => ch.number === parseInt(chapter));
        
        // Get translation if needed
        let translationData = null;
        if (translationLang !== 'none') {
            translationData = await apiRequest(`/api/compare/${chapter}/${verse}`);
        }
        
        // Update preview with chapter info
        updateScreenshotPreview(verseData, translationData, translationLang, chapterInfo);
        
    } catch (error) {
        console.error('Failed to generate screenshot:', error);
        showError('Failed to load verse data for screenshot');
    }
}

// Utility function to decode HTML entities
function decodeHtmlEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

function updateScreenshotPreview(verseData, translationData, translationLang, chapterInfo) {
    const chapterNameEl = document.getElementById('screenshot-chapter-name');
    const verseReferenceEl = document.getElementById('screenshot-verse-reference');
    const arabicTextEl = document.getElementById('screenshot-arabic-text');
    const translationTextEl = document.getElementById('screenshot-translation-text');
    const attributionEl = document.getElementById('screenshot-attribution');
    
    // Create English chapter name mapping
    const englishChapterNames = {
        1: "Al-Fatihah", 2: "Al-Baqarah", 3: "Ali 'Imran", 4: "An-Nisa", 5: "Al-Ma'idah",
        6: "Al-An'am", 7: "Al-A'raf", 8: "Al-Anfal", 9: "At-Tawbah", 10: "Yunus",
        11: "Hud", 12: "Yusuf", 13: "Ar-Ra'd", 14: "Ibrahim", 15: "Al-Hijr",
        16: "An-Nahl", 17: "Al-Isra", 18: "Al-Kahf", 19: "Maryam", 20: "Ta-Ha",
        21: "Al-Anbiya", 22: "Al-Hajj", 23: "Al-Mu'minun", 24: "An-Nur", 25: "Al-Furqan",
        26: "Ash-Shu'ara", 27: "An-Naml", 28: "Al-Qasas", 29: "Al-'Ankabut", 30: "Ar-Rum",
        31: "Luqman", 32: "As-Sajdah", 33: "Al-Ahzab", 34: "Saba", 35: "Fatir",
        36: "Ya-Sin", 37: "As-Saffat", 38: "Sad", 39: "Az-Zumar", 40: "Ghafir",
        41: "Fussilat", 42: "Ash-Shuraa", 43: "Az-Zukhruf", 44: "Ad-Dukhan", 45: "Al-Jathiyah",
        46: "Al-Ahqaf", 47: "Muhammad", 48: "Al-Fath", 49: "Al-Hujurat", 50: "Qaf",
        51: "Adh-Dhariyat", 52: "At-Tur", 53: "An-Najm", 54: "Al-Qamar", 55: "Ar-Rahman",
        56: "Al-Waqi'ah", 57: "Al-Hadid", 58: "Al-Mujadila", 59: "Al-Hashr", 60: "Al-Mumtahanah",
        61: "As-Saff", 62: "Al-Jumu'ah", 63: "Al-Munafiqun", 64: "At-Taghabun", 65: "At-Talaq",
        66: "At-Tahrim", 67: "Al-Mulk", 68: "Al-Qalam", 69: "Al-Haqqah", 70: "Al-Ma'arij",
        71: "Nuh", 72: "Al-Jinn", 73: "Al-Muzzammil", 74: "Al-Muddaththir", 75: "Al-Qiyamah",
        76: "Al-Insan", 77: "Al-Mursalat", 78: "An-Naba", 79: "An-Nazi'at", 80: "'Abasa",
        81: "At-Takwir", 82: "Al-Infitar", 83: "Al-Mutaffifin", 84: "Al-Inshiqaq", 85: "Al-Buruj",
        86: "At-Tariq", 87: "Al-A'la", 88: "Al-Ghashiyah", 89: "Al-Fajr", 90: "Al-Balad",
        91: "Ash-Shams", 92: "Al-Layl", 93: "Ad-Duhaa", 94: "Ash-Sharh", 95: "At-Tin",
        96: "Al-'Alaq", 97: "Al-Qadr", 98: "Al-Bayyinah", 99: "Az-Zalzalah", 100: "Al-'Adiyat",
        101: "Al-Qari'ah", 102: "At-Takathur", 103: "Al-'Asr", 104: "Al-Humazah", 105: "Al-Fil",
        106: "Quraysh", 107: "Al-Ma'un", 108: "Al-Kawthar", 109: "Al-Kafirun", 110: "An-Nasr",
        111: "Al-Masad", 112: "Al-Ikhlas", 113: "Al-Falaq", 114: "An-Nas"
    };
    
    // Get chapter names
    const englishName = englishChapterNames[verseData.chapterNumber] || `Chapter ${verseData.chapterNumber}`;
    const arabicName = chapterInfo ? chapterInfo.name : '';
    
    // Update chapter name with both English and Arabic
    if (arabicName) {
        chapterNameEl.innerHTML = `
            <div class="chapter-name-english">${englishName}</div>
            <div class="chapter-name-arabic">${arabicName}</div>
        `;
    } else {
        chapterNameEl.innerHTML = `<div class="chapter-name-english">${englishName}</div>`;
    }
    
    // Update verse reference
    verseReferenceEl.textContent = `${verseData.chapterNumber}:${verseData.verseNumber}`;
    
    // Update Arabic text
    arabicTextEl.textContent = verseData.text;
    
    // Auto-adjust font size for long verses
    adjustFontSizeForContent();
    
    // Update translation
    if (translationLang === 'none') {
        translationTextEl.style.display = 'none';
    } else {
        translationTextEl.style.display = 'block';
        
        let translationText = '';
        let translatorName = '';
        let languageClass = '';
        
        if (translationData && translationData.translations) {
            const translationKey = getTranslationKey(translationLang);
            const translation = translationData.translations[translationKey];
            
            if (translation) {
                // Decode HTML entities in translation text
                translationText = decodeHtmlEntities(translation.text);
                translatorName = translation.translator;
                languageClass = getLanguageClass(translationLang);
            }
        }
        
        translationTextEl.textContent = translationText || 'Translation not available';
        translationTextEl.className = `translation-verse ${languageClass}`;
        
        // Update attribution with translator
        if (translatorName) {
            // Shorten translator names for better mobile display
            const shortTranslatorName = translatorName
                .replace('Dr. Muhammad Taqi-ud-Din Al-Hilali and Dr. Muhammad Muhsin Khan', 'Hilali-Khan')
                .replace('Abdullah Muhammad Basmeih', 'Basmeih')
                .replace('Jan Turst Foundation', 'Jan Turst')
                .replace('Ma Jian', 'Ma Jian');
            
            attributionEl.textContent = `${shortTranslatorName} | Al-Quran API`;
        } else {
            attributionEl.textContent = 'Al-Quran API';
        }
    }
}

// Auto-adjust font size based on content length
function adjustFontSizeForContent() {
    const preview = document.getElementById('screenshot-preview');
    const arabicText = document.getElementById('screenshot-arabic-text');
    const translationText = document.getElementById('screenshot-translation-text');
    
    if (!preview || !arabicText) return;
    
    const arabicLength = arabicText.textContent.length;
    const translationLength = translationText && translationText.style.display !== 'none' 
        ? translationText.textContent.length : 0;
    
    // Remove any existing auto-size classes
    preview.classList.remove('auto-small', 'auto-tiny', 'auto-micro');
    
    // Calculate total content length
    const totalLength = arabicLength + translationLength;
    
    // Apply auto-sizing based on content length
    if (totalLength > 800) {
        preview.classList.add('auto-micro');
    } else if (totalLength > 500) {
        preview.classList.add('auto-tiny');
    } else if (totalLength > 300) {
        preview.classList.add('auto-small');
    }
}

// Mobile menu toggle function
function toggleMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navContent = document.querySelector('.tab-nav-content');
    
    if (menuToggle && navContent) {
        menuToggle.classList.toggle('active');
        navContent.classList.toggle('show');
    }
}

// Close mobile menu when a tab is selected
function closeMobileMenuOnTabSelect() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navContent = document.querySelector('.tab-nav-content');
    
    if (window.innerWidth <= 768 && menuToggle && navContent) {
        menuToggle.classList.remove('active');
        navContent.classList.remove('show');
    }
}

// Flashcard functionality
let flashcardData = [];
let currentFlashcardIndex = 0;
let isFlashcardFlipped = false;

async function startFlashcards() {
    const chapterSelect = document.getElementById('flashcard-chapter-select');
    const languageSelect = document.getElementById('flashcard-language-select');
    
    const chapter = chapterSelect.value;
    const language = languageSelect.value;
    
    if (!chapter) {
        showError('Please select a chapter');
        return;
    }
    
    try {
        showLoading();
        
        // Get chapter data with verses
        const chapterData = await apiRequest(`/api/chapters/${chapter}`);
        
        // Extract all words from all verses
        const words = [];
        for (const verse of chapterData.verses) {
            if (verse.tokens) {
                for (const token of verse.tokens) {
                    // Get translation for this verse
                    const compareData = await apiRequest(`/api/compare/${chapter}/${verse.number}`);
                    const translationKey = getTranslationKey(language);
                    const translation = compareData.translations[translationKey];
                    
                    words.push({
                        arabic: token.text,
                        location: `${chapter}:${verse.number}`,
                        position: `Word ${token.number}`,
                        verseTranslation: translation ? translation.text : 'Translation not available',
                        verseArabic: verse.text,
                        tokenNumber: token.number,
                        verseNumber: verse.number
                    });
                }
            }
        }
        
        // Shuffle the words
        flashcardData = shuffleArray(words);
        currentFlashcardIndex = 0;
        
        // Update UI
        updateFlashcardDisplay();
        showFlashcardSection();
        updateFlashcardStats(chapter, language);
        
        hideLoading();
        
    } catch (error) {
        console.error('Failed to load flashcard data:', error);
        showError('Failed to load flashcard data');
        hideLoading();
    }
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function showFlashcardSection() {
    document.getElementById('flashcard-section').style.display = 'block';
    document.getElementById('next-flashcard-btn').style.display = 'inline-block';
    document.getElementById('shuffle-btn').style.display = 'inline-block';
    document.getElementById('reset-btn').style.display = 'inline-block';
}

function updateFlashcardDisplay() {
    if (flashcardData.length === 0) return;
    
    const currentWord = flashcardData[currentFlashcardIndex];
    
    // Update Arabic word
    document.getElementById('flashcard-arabic').textContent = currentWord.arabic;
    document.getElementById('flashcard-location').textContent = currentWord.location;
    document.getElementById('flashcard-position').textContent = currentWord.position;
    
    // Update translation
    const languageSelect = document.getElementById('flashcard-language-select');
    const language = languageSelect.value;
    const translationEl = document.getElementById('flashcard-translation');
    const contextEl = document.getElementById('flashcard-context');
    
    // For individual word translation, we'll show the verse translation as context
    translationEl.textContent = 'Verse Translation:';
    contextEl.textContent = decodeHtmlEntities(currentWord.verseTranslation);
    
    // Apply language-specific styling
    const languageClass = getLanguageClass(language);
    translationEl.className = `translation-word ${languageClass}`;
    contextEl.className = `verse-context ${languageClass}`;
    
    // Update progress
    updateFlashcardProgress();
    
    // Reset flip state
    resetFlashcardFlip();
}

function updateFlashcardProgress() {
    const counter = document.getElementById('flashcard-counter');
    const progressBar = document.getElementById('flashcard-progress');
    
    counter.textContent = `${currentFlashcardIndex + 1} / ${flashcardData.length}`;
    
    const progress = ((currentFlashcardIndex + 1) / flashcardData.length) * 100;
    progressBar.style.width = `${progress}%`;
}

function updateFlashcardStats(chapter, language) {
    const chapterSelect = document.getElementById('flashcard-chapter-select');
    const selectedOption = chapterSelect.options[chapterSelect.selectedIndex];
    const chapterName = selectedOption ? selectedOption.textContent : `Chapter ${chapter}`;
    
    const languageNames = {
        'en': 'English',
        'ms': 'Malay',
        'zh': 'Chinese',
        'ta': 'Tamil'
    };
    
    document.getElementById('current-chapter').textContent = chapterName;
    document.getElementById('total-words').textContent = flashcardData.length;
    document.getElementById('current-language').textContent = languageNames[language];
}

function flipFlashcard() {
    const flashcard = document.getElementById('flashcard');
    flashcard.classList.toggle('flipped');
    isFlashcardFlipped = !isFlashcardFlipped;
}

function resetFlashcardFlip() {
    const flashcard = document.getElementById('flashcard');
    flashcard.classList.remove('flipped');
    isFlashcardFlipped = false;
}

function nextFlashcard() {
    if (flashcardData.length === 0) return;
    
    currentFlashcardIndex = (currentFlashcardIndex + 1) % flashcardData.length;
    updateFlashcardDisplay();
}

function previousFlashcard() {
    if (flashcardData.length === 0) return;
    
    currentFlashcardIndex = currentFlashcardIndex === 0 
        ? flashcardData.length - 1 
        : currentFlashcardIndex - 1;
    updateFlashcardDisplay();
}

function shuffleFlashcards() {
    if (flashcardData.length === 0) return;
    
    flashcardData = shuffleArray(flashcardData);
    currentFlashcardIndex = 0;
    updateFlashcardDisplay();
}

function resetFlashcards() {
    currentFlashcardIndex = 0;
    if (flashcardData.length > 0) {
        updateFlashcardDisplay();
    }
}

// Populate flashcard chapter dropdown
function populateFlashcardChapterDropdown() {
    const chapterSelect = document.getElementById('flashcard-chapter-select');
    if (!chapterSelect) return;
    
    chapterSelect.innerHTML = '<option value="">Select a chapter</option>';
    
    // Basic chapter list with names
    const basicChapters = [
        {number: 1, name: "Al-Fatihah"},
        {number: 2, name: "Al-Baqarah"},
        {number: 3, name: "Ali 'Imran"},
        {number: 18, name: "Al-Kahf"},
        {number: 36, name: "Ya-Sin"},
        {number: 67, name: "Al-Mulk"},
        {number: 112, name: "Al-Ikhlas"}
    ];
    
    // Add all 114 chapters
    for (let i = 1; i <= 114; i++) {
        const basicChapter = basicChapters.find(ch => ch.number === i);
        const option = document.createElement('option');
        option.value = i;
        option.textContent = basicChapter 
            ? `${i}. ${basicChapter.name}`
            : `${i}. Chapter ${i}`;
        chapterSelect.appendChild(option);
    }
}

function getTranslationKey(lang) {
    switch(lang) {
        case 'en': return 'en.hilali';
        case 'ms': return 'ms.basmeih';
        case 'zh': return 'zh.jian';
        case 'ta': return 'ta.tamil';
        default: return 'en.hilali';
    }
}

async function loadScreenshotVerse(chapter, verse) {
    // Update dropdowns
    const chapterSelect = document.getElementById('screenshot-chapter-select');
    const verseSelect = document.getElementById('screenshot-verse-select');
    
    if (chapterSelect && chapterSelect.value !== chapter.toString()) {
        chapterSelect.value = chapter.toString();
        updateScreenshotVerseRange();
    }
    
    if (verseSelect) {
        verseSelect.value = verse.toString();
    }
    
    // Generate screenshot
    await generateScreenshot();
}

// 8. List Translations
async function loadTranslations() {
    try {
        const data = await apiRequest('/api/translations');
        const container = document.getElementById('translations-result');
        
        let html = '<h3>Available Translations:</h3>';
        
        data.forEach(translation => {
            html += `
                <div class="verse-card">
                    <h4>${translation.name}</h4>
                    <p><strong>Language:</strong> ${translation.language_name} (${translation.language})</p>
                    <p><strong>Translator:</strong> ${translation.translator}</p>
                    <p><strong>Key:</strong> ${translation.key}</p>
                    ${translation.source ? `<p><strong>Source:</strong> ${translation.source}</p>` : ''}
                </div>
            `;
        });
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Failed to load translations:', error);
    }
}

// 9. Statistics
async function loadStatistics() {
    try {
        const data = await apiRequest('/api/stats');
        const container = document.getElementById('stats-result');
        
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${data.totalChapters}</div>
                    <div class="stat-label">Total Chapters</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${data.totalVerses}</div>
                    <div class="stat-label">Total Verses</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${data.totalTokens?.toLocaleString() || data.totalTokens}</div>
                    <div class="stat-label">Total Tokens</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${data.averageVersesPerChapter}</div>
                    <div class="stat-label">Avg Verses/Chapter</div>
                </div>
                ${data.averageTokensPerVerse ? `
                <div class="stat-card">
                    <div class="stat-value">${data.averageTokensPerVerse}</div>
                    <div class="stat-label">Avg Tokens/Verse</div>
                </div>
                ` : ''}
            </div>
            
            <div class="verse-card">
                <h4>📏 Longest Chapter:</h4>
                <p><strong>Chapter ${data.longestChapter.number}:</strong> ${data.longestChapter.name}</p>
                <p><strong>Verses:</strong> ${data.longestChapter.verses}</p>
            </div>
            
            <div class="verse-card">
                <h4>📐 Shortest Chapter:</h4>
                <p><strong>Chapter ${data.shortestChapter.number}:</strong> ${data.shortestChapter.name}</p>
                <p><strong>Verses:</strong> ${data.shortestChapter.verses}</p>
            </div>
            
            <div class="verse-card">
                <h4>📊 Additional Statistics:</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                    <div style="background: #f8f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
                        <strong>Chapter Range:</strong><br>
                        Shortest: ${data.shortestChapter.verses} verses<br>
                        Longest: ${data.longestChapter.verses} verses
                    </div>
                    <div style="background: #fff8f0; padding: 15px; border-radius: 8px; border-left: 4px solid #764ba2;">
                        <strong>Text Analysis:</strong><br>
                        ${data.totalTokens?.toLocaleString() || data.totalTokens} total tokens<br>
                        ${data.averageTokensPerVerse || 'N/A'} avg tokens per verse
                    </div>
                </div>
            </div>
            
            <details style="margin-top: 20px;">
                <summary style="cursor: pointer; color: #667eea; font-weight: bold; padding: 10px; background: #f8f9ff; border-radius: 5px;">View Raw Statistics Data</summary>
                <pre style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin-top: 10px; overflow-x: auto; font-size: 0.9rem;">${JSON.stringify(data, null, 2)}</pre>
            </details>
        `;
    } catch (error) {
        console.error('Failed to load statistics:', error);
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to trigger search in active tab
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) {
            const searchBtn = activeTab.querySelector('.btn.primary');
            if (searchBtn) {
                searchBtn.click();
            }
        }
    }
    
    // Escape to close modal
    if (e.key === 'Escape') {
        closeErrorModal();
    }
});

// Auto-focus on input fields when switching tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        setTimeout(() => {
            const activeTab = document.querySelector('.tab-content.active');
            const firstInput = activeTab.querySelector('input[type="text"], input[type="number"]');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    });
});

// Keyboard navigation for flashcards
document.addEventListener('keydown', (e) => {
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab && activeTab.id === 'flashcard' && flashcardData.length > 0) {
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                previousFlashcard();
                break;
            case 'ArrowRight':
                e.preventDefault();
                nextFlashcard();
                break;
            case ' ':
            case 'Enter':
                e.preventDefault();
                flipFlashcard();
                break;
            case 'r':
            case 'R':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    shuffleFlashcards();
                }
                break;
        }
    }
});

// Add loading states to buttons
function addButtonLoading(button) {
    const originalText = button.textContent;
    button.textContent = 'Loading...';
    button.disabled = true;
    
    return () => {
        button.textContent = originalText;
        button.disabled = false;
    };
}

// Enhanced error handling with retry functionality
function createRetryableError(message, retryFn) {
    const container = document.createElement('div');
    container.innerHTML = `
        <p>${message}</p>
        <button onclick="(${retryFn.toString()})()" class="btn secondary" style="margin-top: 10px;">
            Retry
        </button>
    `;
    return container;
}

// Add copy functionality for results
function addCopyButton(container) {
    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy Results';
    copyBtn.className = 'btn secondary';
    copyBtn.style.marginTop = '10px';
    
    copyBtn.onclick = () => {
        const text = container.textContent;
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = 'Copy Results';
            }, 2000);
        });
    };
    
    container.appendChild(copyBtn);
}

// Initialize tooltips for better UX
function initializeTooltips() {
    const tooltips = {
        'normalize': 'Enable Arabic text normalization for better matching',
        'search-type': 'Exact: matches whole words, Substring: matches partial text',
        'include-arabic': 'Include original Arabic text in translation search results'
    };
    
    Object.entries(tooltips).forEach(([id, text]) => {
        const element = document.getElementById(id);
        if (element) {
            element.title = text;
        }
    });
}

// Call initialization functions
document.addEventListener('DOMContentLoaded', initializeTooltips);

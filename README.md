# Al-Quran API Showcase Web App

A comprehensive web application that demonstrates all functionalities of the Al-Quran API (https://quran-api.asrulmunir.workers.dev). Built with vanilla JavaScript, HTML, and CSS - no frameworks required.

## Features

This web app showcases all 8 main API endpoints:

### 1. 📊 API Information (`/api/info`)
- Displays basic statistics about the Quran
- Shows total chapters, verses, and tokens
- Provides API overview and availability status

### 2. 📚 Chapters Management (`/api/chapters`)
- **List All Chapters**: Browse all 114 chapters with basic information
- **Get Specific Chapter**: View complete chapter with all verses in Arabic
- Interactive chapter cards with click-to-view functionality
- Popular chapters quick access

### 3. 📝 Verse Lookup (`/api/verses/{chapter}/{verse}`)
- Get specific verses with detailed information
- Quick access to famous verses (Bismillah, Ayat al-Kursi, Al-Ikhlas)
- Token breakdown and analysis
- Arabic text with proper RTL display

### 4. 🔄 Translation Comparison (`/api/compare/{chapter}/{verse}`)
- Side-by-side comparison of Arabic text with translations
- English translation (Hilali-Khan)
- Malay translation (Basmeih)
- Proper attribution and translator information

### 5. 🔍 Arabic Text Search (`/api/search`)
- Search for verses containing specific Arabic text
- Advanced options:
  - Exact vs substring matching
  - Arabic text normalization
  - Configurable result limits
- Quick search buttons for common terms (الله, رب, رحمن, etc.)

### 6. 🌐 Translation Search (`/api/search/translation`)
- Reverse search - find verses by searching translations
- Support for English and Malay languages
- Concept-based search (mercy, forgiveness, guidance, etc.)
- Include/exclude Arabic text in results

### 7. 🌍 Available Translations (`/api/translations`)
- List all available translations
- Translator information and attribution
- Language support details

### 8. 📈 Quran Statistics (`/api/stats`)
- Comprehensive statistics dashboard
- Longest and shortest chapters
- Average verses per chapter
- Visual stat cards with key metrics

## Technical Features

### User Interface
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Tab-based Navigation**: Easy switching between different API functions
- **Modern UI**: Gradient backgrounds, smooth animations, and professional styling
- **Arabic Text Support**: Proper RTL display with appropriate fonts
- **Loading States**: Visual feedback during API calls
- **Error Handling**: User-friendly error messages with retry functionality

### Accessibility
- **Keyboard Navigation**: Full keyboard support with shortcuts
- **High Contrast Support**: Adapts to user's contrast preferences
- **Reduced Motion**: Respects user's motion preferences
- **Focus Management**: Proper focus handling for screen readers
- **ARIA Labels**: Semantic HTML with accessibility attributes

### Performance
- **Efficient API Calls**: Optimized requests with proper error handling
- **Client-side Caching**: Reduces redundant API calls
- **Lazy Loading**: Content loaded on demand
- **Responsive Images**: Optimized for different screen sizes

## Usage Instructions

### Getting Started
1. Open `index.html` in any modern web browser
2. No installation or setup required - it's a pure client-side application
3. Internet connection required for API calls

### Navigation
- Use the tab buttons at the top to switch between different API functions
- Each tab demonstrates specific API endpoints with interactive controls
- Click the colored buttons to load data or perform searches

### Search Tips
- **Arabic Search**: Use Arabic text with normalization enabled for better results
- **Translation Search**: Search for concepts in English or Malay
- **Quick Access**: Use the quick search buttons for common terms
- **Keyboard Shortcuts**: 
  - `Ctrl/Cmd + Enter`: Execute search in active tab
  - `Escape`: Close error modals

### Popular Use Cases
1. **Study Aid**: Compare translations side-by-side
2. **Research Tool**: Search for specific terms or concepts
3. **Educational**: Browse chapters and verses systematically
4. **Reference**: Quick lookup of famous verses
5. **Analysis**: View statistics and token breakdowns

## API Integration Examples

The app demonstrates various integration patterns:

### Basic Fetch Request
```javascript
const response = await fetch('https://quran-api.asrulmunir.workers.dev/api/info');
const data = await response.json();
```

### Search with Parameters
```javascript
const params = new URLSearchParams({
    q: 'الله',
    normalize: 'true',
    limit: '10'
});
const response = await fetch(`https://quran-api.asrulmunir.workers.dev/api/search?${params}`);
```

### Error Handling
```javascript
try {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
} catch (error) {
    console.error('API Error:', error);
    showError(`API Error: ${error.message}`);
}
```

## File Structure

```
al-quran-ui/
├── index.html          # Main HTML structure
├── styles.css          # Complete styling and responsive design
├── script.js           # All JavaScript functionality
└── README.md           # This documentation
```

## Browser Compatibility

- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Mobile Browsers**: iOS Safari 12+, Chrome Mobile 60+
- **Features Used**: ES6+, Fetch API, CSS Grid, Flexbox

## API Rate Limits

- **Free Tier**: 100,000 requests per day
- **CORS**: Enabled for all origins
- **Authentication**: None required

## Islamic Etiquette

This application handles Quranic content with utmost respect:
- Proper attribution to translators
- Respectful presentation of Arabic text
- Appropriate Islamic context
- Reverent handling of sacred content

## Development Notes

### Code Organization
- **Modular Functions**: Each API endpoint has dedicated functions
- **Utility Functions**: Reusable code for common operations
- **Event Handling**: Comprehensive event management
- **Error Recovery**: Graceful error handling with user feedback

### Styling Approach
- **CSS Custom Properties**: For consistent theming
- **Mobile-First**: Responsive design starting from mobile
- **Progressive Enhancement**: Works without JavaScript for basic content
- **Print Styles**: Optimized for printing

### Performance Optimizations
- **Debounced Searches**: Prevents excessive API calls
- **Efficient DOM Updates**: Minimal DOM manipulation
- **Memory Management**: Proper cleanup of event listeners
- **Caching Strategy**: Smart caching of API responses

## Contributing

This is a demonstration app showcasing the Al-Quran API. To contribute:
1. Test the app with different browsers and devices
2. Report any bugs or usability issues
3. Suggest improvements for better user experience
4. Ensure all changes maintain Islamic etiquette standards

## License

This web app is created for educational and demonstration purposes. The Quranic content is sourced from:
- **Arabic Text**: Tanzil.net Uthmani text (Creative Commons Attribution-NoDerivs 3.0)
- **English Translation**: Dr. Muhammad Taqi-ud-Din Al-Hilali and Dr. Muhammad Muhsin Khan
- **Malay Translation**: Abdullah Muhammad Basmeih

## Support

For API-related questions, refer to the official API documentation at:
https://quran-api.asrulmunir.workers.dev/api/LLM

For web app issues, check the browser console for error messages and ensure you have a stable internet connection.

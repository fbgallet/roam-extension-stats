# Stats Architecture Refactoring Proposal

## Current Implementation Analysis

### How it works now:
1. **Data Collection**: Functions like `getChildrenStats()` and `getBlockStats()` collect raw statistics
2. **Formatting**: Functions like `getFormatedChildrenStats()` format data into a **raw string** with abbreviations
3. **Display**: The same string is used for both tooltips AND dialogs

### Problems:
- **Same abbreviated text everywhere**: "5c 3w" is hard to read in dialogs
- **Cannot differentiate**: Tooltips need brevity, dialogs can show full details
- **Hard to extend**: Adding new stats requires modifying formatting logic throughout
- **No structured data**: Everything is string concatenation

## Proposed New Architecture

### 1. Data Layer (Pure Data Objects)

```javascript
// infos.js
export function getBlockInfo(uid) {
  return {
    // Basic stats
    characters: 150,
    words: 25,
    sentences: 3,
    avgWordsPerSentence: 8.3,
    readingTime: "1 min", // calculated from words

    // Block structure
    blocks: 10,
    children: 5,

    // Tasks
    tasks: {
      done: 3,
      todo: 5,
      percentage: 60
    },

    // Roam-specific
    pomo: 2,
    references: {
      count: 7,
      lastUpdated: timestamp
    },

    // Metadata
    created: {
      date: dateObj,
      user: "username"
    },
    updated: {
      date: dateObj,
      user: "username"
    }
  };
}
```

### 2. Formatting Layer (Multiple Formatters)

```javascript
// formatters.js

// Compact formatter for tooltips
export function formatCompact(stats) {
  const parts = [];
  if (stats.characters) parts.push(`${stats.characters}c`);
  if (stats.words) parts.push(`${stats.words}w`);
  if (stats.sentences) parts.push(`${stats.sentences}s`);
  return parts.join(' ');
}

// Detailed formatter for dialogs
export function formatDetailed(stats) {
  const parts = [];
  if (stats.characters) parts.push(`${stats.characters} characters`);
  if (stats.words) parts.push(`${stats.words} words`);
  if (stats.sentences) parts.push(`${stats.sentences} sentences`);
  if (stats.avgWordsPerSentence) {
    parts.push(`${stats.avgWordsPerSentence.toFixed(1)} words/sentence`);
  }
  if (stats.readingTime) parts.push(`Reading time: ${stats.readingTime}`);
  return parts.join('\n');
}
```

### 3. Display Components

```javascript
// Tooltips use compact format
function showTooltip(uid) {
  const stats = getBlockInfo(uid);
  const text = formatCompact(stats);
  // Display: "150c 25w 3s"
}

// Dialogs use detailed format
function showDialog(uid) {
  const stats = getBlockInfo(uid);
  const text = formatDetailed(stats);
  // Display:
  // "150 characters
  //  25 words
  //  3 sentences
  //  8.3 words/sentence
  //  Reading time: 1 min"
}
```

## Implementation Plan

### Phase 1: Create New Stats Functions
- [ ] Add `countSentences(text)` function
- [ ] Add `calculateAvgWordsPerSentence(words, sentences)` function
- [ ] Add `calculateReadingTime(words)` function (250 words/min)
- [ ] Create `getBlockInfoObject(uid)` that returns structured data

### Phase 2: Create Formatters
- [ ] Create `formatters.js` file
- [ ] Implement `formatCompact()` for tooltips
- [ ] Implement `formatDetailed()` for dialogs
- [ ] Handle conditional display (based on user settings)

### Phase 3: Update Display Functions
- [ ] Update tooltip rendering to use `formatCompact()`
- [ ] Update dialog rendering to use `formatDetailed()`
- [ ] Add settings toggles for new stats (sentences, reading time)

### Phase 4: Refactor Existing Code
- [ ] Gradually migrate old string-based functions to use new architecture
- [ ] Keep backward compatibility during transition
- [ ] Remove old functions once migration is complete

## Example Usage

```javascript
// OLD WAY (current)
const info = getFormatedChildrenStats(uid, users, "block", true);
// Returns: "\n• 150c 25w\n5 children, 500c 100w"

// NEW WAY (proposed)
const stats = getBlockInfo(uid);
const tooltip = formatCompact(stats);
// Returns: "150c 25w 3s"

const dialogText = formatDetailed(stats);
// Returns: "150 characters\n25 words\n3 sentences\n8.3 words/sentence\nReading time: 1 min"
```

## Benefits

1. **Separation of Concerns**: Data collection, formatting, and display are separate
2. **Flexibility**: Easy to add different display modes (compact, detailed, JSON, etc.)
3. **Maintainability**: Changes to one layer don't affect others
4. **Testability**: Each function can be tested independently
5. **Extensibility**: Adding new stats only requires updating the data layer
6. **Better UX**: Users get appropriate level of detail in each context

## Migration Strategy

To avoid breaking existing functionality:
1. Create new functions alongside old ones
2. Gradually migrate display functions to use new architecture
3. Keep old functions until all references are updated
4. Remove deprecated functions in final cleanup
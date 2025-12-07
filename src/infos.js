import {
  cjkMode,
  dateFormat,
  displayChar,
  displayChildren,
  displayEditName,
  displayPOMO,
  displayReadingTime,
  displayREFS,
  displaySentence,
  displayTODO,
  displayWord,
  localDateFormat,
  modeTODO,
  timeFormat,
} from ".";
import {
  getBlockContentByUid,
  getBlocksIncludingRef,
  getBlocksIncludingRefByTitle,
  getBlockTimes,
  getPageUidByTitle,
  getTreeByUid,
  getUser,
  pageRegex,
  resolveReferences,
  uidRegex,
} from "./utils";

export function getDateStrings(uid) {
  // let t = document.querySelector(".rm-bullet__tooltip"); // .rm-bullet-tooltip__time
  let blockTimes = getBlockTimes(uid);
  let c = formatDateAndTime(blockTimes.create);
  let u = formatDateAndTime(blockTimes.update);
  return {
    u: u,
    c: c,
  };
}

export function formatDateAndTime(timestamp) {
  let date = new Date(timestamp).toLocaleDateString(localDateFormat, {
    // default: "en-US"
    dateStyle: dateFormat,
    // year: "numeric",
    // month: "numeric",
    // day: "numeric",
  });
  let formatedTime = new Date(timestamp).toLocaleTimeString(
    "en-US",
    getTimeFormatOption(timeFormat)
  );
  let time;
  timeFormat == "~H AM/PM"
    ? (time = "~" + formatedTime)
    : (time = formatedTime);
  return { date: date, time: time };
}

export function getFormatedDay(date) {
  return new Date(date).toLocaleDateString(localDateFormat, {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

function getTimeFormatOption(choice) {
  switch (choice) {
    case "HH:MM:SS":
      return { hour12: false };
    case "H:MM:SS AM/PM":
      return {
        hour12: true,
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      };
    case "HH:MM":
      return { hour12: false, hour: "2-digit", minute: "2-digit" };
    case "H:MM AM/PM":
      return { timeStyle: "short", hour: "2-digit", minute: "2-digit" };
    case "~H AM/PM":
      return { hour: "numeric", hourCycle: "h12" };
  }
}

export function getYesterdayDate(date = null) {
  if (!date) date = new Date();
  return new Date(date.getTime() - 24 * 60 * 60 * 1000);
}

function getChildrenStats(
  tree,
  newestTime = 0,
  editUser = "",
  c = 0,
  w = 0,
  s = 0,
  b = 0,
  task = { done: 0, todo: 0 },
  pomo = 0,
  newestBlockUid = "",
  ec = 0,
  ew = 0,
  es = 0,
  eb = 0,
  etodo = 0,
  edone = 0
) {
  for (let i = 0; i < tree.length; i++) {
    // Count embeds in this block BEFORE resolving references
    let embedStats = getEmbedStats(tree[i].string);
    ec += embedStats.characters;
    ew += embedStats.words;
    es += embedStats.sentences;
    eb += embedStats.blocks;
    etodo += embedStats.todo;
    edone += embedStats.done;

    let content = resolveReferences(tree[i].string, [tree[i].uid]);
    b++;
    c += countCharacters(content);
    if (displayWord) w += countWords(content);
    s += countSentences(content);

    let users = getUser(tree[i].uid);
    if (content.includes("[[DONE]]")) {
      task.done++;
      task.todo++;
    } else if (content.includes("[[TODO]]")) task.todo++;
    if (content.includes("{{[[POMO]]:")) pomo++;
    if (tree[i].time > newestTime) {
      newestTime = tree[i].time;
      editUser = users.editUser;
      newestBlockUid = tree[i].uid;
    }
    if (tree[i].children) {
      let r = getChildrenStats(
        tree[i].children,
        newestTime,
        editUser,
        0,
        0,
        0,
        0,
        { done: 0, todo: 0 },
        0,
        newestBlockUid,
        0,
        0,
        0,
        0,
        0,
        0
      );
      c += r.characters;
      if (displayWord) w += r.words;
      s += r.sentences;
      b += r.blocks;
      ec += r.embedCharacters;
      ew += r.embedWords;
      es += r.embedSentences;
      eb += r.embedBlocks;
      etodo += r.embedTodo;
      edone += r.embedDone;
      task.done += r.done;
      task.todo += r.todo;
      pomo += r.pomo;
      newestTime = r.newestTime;
      editUser = r.editUser;
      newestBlockUid = r.newestBlockUid;
    }
  }
  return {
    characters: c,
    words: w,
    sentences: s,
    blocks: b,
    embedCharacters: ec,
    embedWords: ew,
    embedSentences: es,
    embedBlocks: eb,
    embedTodo: etodo,
    embedDone: edone,
    done: task.done,
    todo: task.todo,
    pomo: pomo,
    newestTime: newestTime,
    editUser: editUser,
    newestBlockUid: newestBlockUid,
  };
}

// Helper function to get stats from embedded content
function getEmbedStats(content) {
  let embedChars = 0;
  let embedWords = 0;
  let embedSentences = 0;
  let embedBlocks = 0;
  let embedTodo = 0;
  let embedDone = 0;

  // Reset regex index
  EMBED_REGEX.lastIndex = 0;

  const matches = content.matchAll(EMBED_REGEX);

  for (const match of matches) {
    const embedType = match[1]; // Can be '-path', '-children', or empty
    const embedRef = match[2].trim();

    // Determine if it's a block or page embed
    let embedUid = null;
    let isBlockEmbed = false;

    // Check if it's a block reference ((uid))
    // UIDs in Roam are typically 9 characters but can vary
    uidRegex.lastIndex = 0;
    const blockRefMatch = embedRef.match(uidRegex);
    if (blockRefMatch) {
      // Extract UID by removing the (( and )) wrappers
      embedUid = blockRefMatch[0].slice(2, -2);
      isBlockEmbed = true;
    }
    // Check if it's a page reference [[page title]]
    else {
      pageRegex.lastIndex = 0;
      const pageRefMatch = embedRef.match(pageRegex);
      if (pageRefMatch) {
        // Extract page title by removing the [[ and ]] wrappers
        const pageTitle = pageRefMatch[0].slice(2, -2);
        embedUid = getPageUidByTitle(pageTitle);
        isBlockEmbed = false;
      }
    }

    if (embedUid) {
      if (isBlockEmbed) {
        // For block embeds
        if (embedType === "-children") {
          // Only count children, not the block itself
          let tree = getTreeByUid(embedUid);
          if (tree && tree.children) {
            let stats = getChildrenStats(tree.children);
            embedChars += stats.characters;
            embedWords += stats.words;
            embedSentences += stats.sentences;
            embedBlocks += stats.blocks;
            embedTodo += stats.todo;
            embedDone += stats.done;
          }
        } else {
          // Count the block and its children
          let blockContent = resolveReferences(getBlockContentByUid(embedUid), [
            embedUid,
          ]);
          if (blockContent) {
            embedChars += countCharacters(blockContent);
            if (displayWord) embedWords += countWords(blockContent);
            embedSentences += countSentences(blockContent);
            embedBlocks += 1; // Count the block itself

            // Count TODO/DONE in the embedded block itself
            if (blockContent.includes("[[DONE]]")) {
              embedDone++;
              embedTodo++;
            } else if (blockContent.includes("[[TODO]]")) {
              embedTodo++;
            }

            // Add children stats
            let tree = getTreeByUid(embedUid);
            if (tree && tree.children) {
              let stats = getChildrenStats(tree.children);
              embedChars += stats.characters;
              embedWords += stats.words;
              embedSentences += stats.sentences;
              embedBlocks += stats.blocks;
              embedTodo += stats.todo;
              embedDone += stats.done;
            }
          }
        }
      } else {
        // For page embeds, count all children of the page
        let tree = getTreeByUid(embedUid);
        if (tree && tree.children) {
          let stats = getChildrenStats(tree.children);
          embedChars += stats.characters;
          embedWords += stats.words;
          embedSentences += stats.sentences;
          embedBlocks += stats.blocks;
          embedTodo += stats.todo;
          embedDone += stats.done;
        }
      }
    }
  }

  return {
    characters: embedChars,
    words: embedWords,
    sentences: embedSentences,
    blocks: embedBlocks,
    todo: embedTodo,
    done: embedDone,
  };
}

function getBlockStats(uid) {
  let rawContent = getBlockContentByUid(uid);

  // Get embed stats BEFORE resolving references
  let embedStats = getEmbedStats(rawContent);

  // Now resolve references for regular content counting
  let content = resolveReferences(rawContent, [uid]);
  let charCount = countCharacters(content);
  let wordCount = countWords(content);
  let sentenceCount = countSentences(content);

  return {
    characters: charCount,
    words: wordCount,
    sentences: sentenceCount,
    embedCharacters: embedStats.characters,
    embedWords: embedStats.words,
    embedSentences: embedStats.sentences,
    embedBlocks: embedStats.blocks,
  };
}

// Regex to match CJK characters (Chinese, Japanese, Korean)
// Includes: CJK Unified Ideographs, Hiragana, Katakana, Hangul, and extensions
const CJK_REGEX =
  /[\u3400-\u4dbf\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\uff00-\uffef]/g;

// Regex to match embed syntax in Roam
// Matches: {{embed: ((uid))}}, {{[[embed]]: ((uid))}}, {{embed-children: ((uid))}}, etc.
const EMBED_REGEX = /\{\{\[?\[?embed(-path|-children|)\]?\]?:\s*([^\}]+)\}\}/gi;

export function countCharacters(str) {
  if (cjkMode) {
    // In CJK mode, count characters without spaces and newlines
    return str.replace(/[\s\n]/g, "").length;
  }
  return str.length;
}

function countWords(str) {
  str = str.replace(/(^\s*)|(\s*$)/gi, "");
  if (!str) return 0;

  if (cjkMode) {
    // In CJK mode:
    // 1. Count each CJK character as one word
    // 2. Count non-CJK words (space-separated) normally
    const cjkChars = str.match(CJK_REGEX) || [];
    const cjkCount = cjkChars.length;

    // Remove CJK characters and count remaining words
    const nonCjkText = str.replace(CJK_REGEX, " ").trim();
    let nonCjkCount = 0;
    if (nonCjkText) {
      const cleaned = nonCjkText
        .replace(/[ ]{2,}/gi, " ")
        .replace(/\n /g, "\n");
      const words = cleaned.split(/\s+/).filter((w) => w.length > 0);
      nonCjkCount = words.length;
    }

    return cjkCount + nonCjkCount;
  }

  // Standard word counting for non-CJK text
  str = str.replace(/[ ]{2,}/gi, " ");
  str = str.replace(/\n /, "\n");
  return str.split(" ").length;
}

function countSentences(str) {
  str = str.trim();
  if (!str) return 0;

  if (cjkMode) {
    // In CJK mode, count sentences ending with CJK or Western punctuation
    // CJK: 。！？；and newlines as sentence breaks
    // Western: . ! ?
    const allEndings = str.match(/[.!?。！？；]/g) || [];
    // If no punctuation found but text exists, count as 1 sentence
    return allEndings.length > 0 ? allEndings.length : 1;
  }

  // Standard sentence counting for Western text
  const sentences = str.match(/[^.!?]+[.!?]+/g) || [];
  return sentences.length > 0 ? sentences.length : str.length > 0 ? 1 : 0;
}

function calculateReadingTime(wordCount) {
  const wordsPerMinute = 250;
  const minutes = Math.ceil(wordCount / wordsPerMinute);

  if (minutes < 1) return "< 1 min";
  if (minutes === 1) return "1 min";
  return `${minutes} min`;
}

function displayPercentage(a, b, mode) {
  let percent = a / b;
  if (mode === "green squares") {
    const offSquare = "□";
    const greenSquare = "🟩";
    let left = "";
    let right = "";
    if (b <= 6) {
      for (let i = 0; i < a; i++) {
        left += greenSquare;
      }
      for (let i = 0; i < b - a; i++) {
        right += offSquare;
      }
    } else {
      percent *= 6;
      if (percent === 6) left = "🟩🟩🟩🟩🟩🟩";
      else if (percent >= 5) {
        left = "🟩🟩🟩🟩🟩";
        right = "□";
      } else if (percent >= 4) {
        left = "🟩🟩🟩🟩";
        right = "□□";
      } else if (percent >= 3) {
        left = "🟩🟩🟩";
        right = "□□□";
      } else if (percent >= 2) {
        left = "🟩🟩";
        right = "□□□□";
      } else if (percent >= 1) {
        left = "🟩";
        right = "□□□□□";
      } else {
        right = "□□□□□□";
      }
    }
    return left + right;
  } else if (mode === "percent") {
    percent = Math.trunc(percent * 100);
    return `(${percent}%)`;
  }
}

function getFormatedUserName(uid) {
  let result;
  let editName = getUser(uid);
  displayEditName ? (result = editName + "\n") : (result = "");
  return result;
}

function countPageMentions(pageUid) {
  // Count how many OTHER pages are mentioned on this page
  // This gets all unique page references from blocks on this page
  let pageRefs = window.roamAlphaAPI.q(`
    [:find ?ref-title
     :where
     [?page :block/uid "${pageUid}"]
     [?b :block/page ?page]
     [?b :block/refs ?ref]
     [?ref :node/title ?ref-title]]
  `);

  // Return unique count of referenced pages (excluding the page itself)
  return pageRefs ? pageRefs.length : 0;
}

export function getFormatedDateStrings(
  dates,
  users,
  node = "block",
  dateCondition,
  displayAll = false
) {
  let result = "";
  // let dates = getDateStrings(uid);
  let doNotDisplayCreateName = false;

  if (dateCondition || displayAll) {
    if (displayAll) {
      result += `**Created:**\n${dates.c.date}, ${dates.c.time}`;
      if (displayEditName) result += ` by ${users.createUser}`;
    } else {
      result += `Created:\n${dates.c.date}, ${dates.c.time}`;
      if (displayEditName) result += `\nby ${users.createUser}`;
    }
  }
  if (
    node === "block" &&
    (dates.c.date != dates.u.date ||
      dates.c.time.slice(0, -3) != dates.u.time.slice(0, -3))
  ) {
    if (dateCondition || displayAll) {
      if (displayAll) {
        result += `\n**Updated:**\n${dates.u.date}, ${dates.u.time}`;
        if (displayEditName && users.editUser != users.createUser)
          result += ` by ${users.editUser}`;
      } else {
        result += `\nUpdated:\n${dates.u.date}, ${dates.u.time}`;
        if (displayEditName && users.editUser != users.createUser)
          result += `\nby ${users.editUser}`;
      }
    }
  } else {
    doNotDisplayCreateName = true;
  }
  // result += "\n";
  //console.log(result);
  return result;
}

export function getFormatedChildrenStats(
  uid,
  users,
  node = "block",
  withDate = true,
  displayAll = false
) {
  let result = "\n";
  let tree = getTreeByUid(uid);
  if (!tree) return null;
  let bStats = getBlockStats(uid);

  let bString = [];
  if (node === "block") {
    if (displayAll) {
      // Detailed format for dialogs with header
      result += `\n**Block Content:**`;
      if (displayChar) {
        const totalChars = bStats.characters + bStats.embedCharacters;
        result += `\n• ${totalChars} characters`;
        if (bStats.embedCharacters > 0) {
          result += ` (${bStats.embedCharacters} in embeds)`;
        }
      }
      if (displayWord) {
        const totalWords = bStats.words + bStats.embedWords;
        result += `\n• ${totalWords} words`;
        if (bStats.embedWords > 0) {
          result += ` (${bStats.embedWords} in embeds)`;
        }
      }
      if (displaySentence && bStats.sentences > 0) {
        const totalSentences = bStats.sentences + bStats.embedSentences;
        result += `\n• ${totalSentences} sentences`;
        if (bStats.embedSentences > 0) {
          result += ` (${bStats.embedSentences} in embeds)`;
        }
        if (bStats.words > 0) {
          const avgWords = (bStats.words / bStats.sentences).toFixed(1);
          result += ` (avg ${avgWords} words/sentence)`;
        }
      }
    } else {
      // Compact format for tooltips - include embed counts
      const totalChars = bStats.characters + bStats.embedCharacters;
      const totalWords = bStats.words + bStats.embedWords;
      const totalSentences = bStats.sentences + bStats.embedSentences;

      if (displayChar) bString.push(totalChars + "c");
      if (displayWord) bString.push(totalWords + "w");
      if (displaySentence && totalSentences > 0)
        bString.push(totalSentences + "s");
      if (displayChar || displayWord) result += `\n• ${bString.join(" ")}`;
    }
  }
  if (tree.children) {
    let cStats = getChildrenStats(tree.children);
    let cString = [];
    if (node !== "block" && withDate) {
      let newestTime = formatDateAndTime(cStats.newestTime);
      let updateString;
      if (displayAll) {
        // For detailed dialog, add clickable block link
        updateString = `\n**Last updated block:** [[blocklink:${cStats.newestBlockUid}:(*)]]`;
        updateString += `\n${newestTime.date}, ${newestTime.time}`;
      } else {
        updateString = `\nLast updated block:\n${newestTime.date}, ${newestTime.time}`;
      }
      if (displayEditName && cStats.editUser != users.createUser)
        updateString += `\nby ${cStats.editUser}`;
      result = updateString + result;
    }
    let nodeType;
    node !== "block" ? (nodeType = "blocks") : (nodeType = "children");

    if (displayAll) {
      // Detailed format with header for children section
      if (node === "block") {
        result += `\n\n**Children Blocks:**`;
      } else {
        // For pages, add "Content:" header
        result += `\n**Content:**`;
      }
      if (displayChildren) {
        const totalBlocks = cStats.blocks + cStats.embedBlocks;
        result += `\n• ${totalBlocks} ${nodeType}`;
        if (cStats.embedBlocks > 0) {
          result += ` (${cStats.embedBlocks} in embeds)`;
        }
      }
      if (displayChar) {
        const totalChars = cStats.characters + cStats.embedCharacters;
        result += `\n• ${totalChars} characters`;
        if (cStats.embedCharacters > 0) {
          result += ` (${cStats.embedCharacters} in embeds)`;
        }
      }
      if (displayWord) {
        const totalWords = cStats.words + cStats.embedWords;
        result += `\n• ${totalWords} words`;
        if (cStats.embedWords > 0) {
          result += ` (${cStats.embedWords} in embeds)`;
        }
      }
      if (displaySentence && cStats.sentences > 0) {
        const totalSentences = cStats.sentences + cStats.embedSentences;
        result += `\n• ${totalSentences} sentences`;
        if (cStats.embedSentences > 0) {
          result += ` (${cStats.embedSentences} in embeds)`;
        }
        if (cStats.words > 0) {
          const avgWords = (cStats.words / cStats.sentences).toFixed(1);
          result += ` (avg ${avgWords} words/sentence)`;
        }
      }
      // Only show reading time for children if >= 1 minute (250+ words) and if enabled
      if (displayReadingTime) {
        const totalWords = cStats.words + cStats.embedWords;
        if (totalWords >= 250) {
          result += `\n• Reading time: ${calculateReadingTime(totalWords)}`;
        }
      }
      // Add page mentions count for pages
      if (node !== "block") {
        let mentionCount = countPageMentions(uid);
        if (mentionCount > 0) {
          result += `\n• ${mentionCount} page mentions`;
        }
      }
    } else {
      // Compact format for tooltips - include embed counts
      const totalChars = cStats.characters + cStats.embedCharacters;
      const totalWords = cStats.words + cStats.embedWords;
      const totalSentences = cStats.sentences + cStats.embedSentences;
      const totalBlocks = cStats.blocks + cStats.embedBlocks;

      if (displayAll || displayChar || displayChildren || displayWord)
        cString.push("\n");
      if (displayChildren) cString.push(`${totalBlocks} ${nodeType}, `);
      if (displayChar) cString.push(totalChars + "c");
      if (displayWord) cString.push(totalWords + "w");
      if (displaySentence && totalSentences > 0)
        cString.push(totalSentences + "s");
      result += `${cString.join(" ")}`;
    }

    if ((displayTODO || displayAll) && (cStats.todo != 0 || cStats.embedTodo != 0)) {
      const totalTodo = cStats.todo + cStats.embedTodo;
      const totalDone = cStats.done + cStats.embedDone;
      let percent = displayPercentage(totalDone, totalTodo, modeTODO);
      result += `\n☑ ${totalDone}/${totalTodo} ${percent}`;
      if (cStats.embedTodo > 0) {
        result += ` (${cStats.embedDone}/${cStats.embedTodo} in embeds)`;
      }
    }
    if (displayPOMO || displayAll) {
      if (cStats.pomo != 0) {
        result += `\n${cStats.pomo} `;
        let i = 1;
        while (i <= cStats.pomo && i < 7) {
          result += "🍅";
          i++;
        }
      }
    }
  }
  if (displayREFS || displayAll) {
    let refs;
    node === "block"
      ? (refs = getBlocksIncludingRef(uid))
      : (refs = getBlocksIncludingRefByTitle(node));
    let refsNb = refs.length;
    if (refsNb > 0 || (displayAll && node !== "block")) {
      let newestTime = 0;
      let oldestTime = Infinity;
      let updateTime;
      let totalRefChars = 0;
      let totalRefWords = 0;

      let totalRefTodo = 0;
      let totalRefDone = 0;

      refs.forEach((ref) => {
        let refUid;
        node === "block" ? (refUid = ref[0]) : (refUid = ref[0].uid);
        let times = getBlockTimes(refUid);
        updateTime = times.update;
        if (updateTime > newestTime) newestTime = updateTime;
        if (times.create < oldestTime) oldestTime = times.create;

        // Count characters, words, and TODO/DONE in reference blocks (including children)
        if (displayAll) {
          let refContent =
            node === "block"
              ? ref[1]
              : resolveReferences(ref[0][":block/string"] || "", []);
          totalRefChars += countCharacters(refContent);
          if (displayWord) totalRefWords += countWords(refContent);

          // Count TODO/DONE in the reference block itself
          if (refContent.includes("[[DONE]]")) {
            totalRefDone++;
            totalRefTodo++;
          } else if (refContent.includes("[[TODO]]")) {
            totalRefTodo++;
          }

          // Add children content if present
          let refTree = getTreeByUid(refUid);
          if (refTree && refTree.children) {
            let childStats = getChildrenStats(refTree.children);
            totalRefChars += childStats.characters;
            if (displayWord) totalRefWords += childStats.words;
            totalRefTodo += childStats.todo;
            totalRefDone += childStats.done;
          }
        }
      });

      if (displayAll && node !== "block") {
        result += `\n\n**References:**`;
      } else if (!displayAll) {
        result += `\n`;
      }

      if (refsNb > 0) {
        if (node !== "block") {
          if (displayAll) {
            result += `\n• ${refsNb} linked references`;
            if (totalRefChars > 0) {
              result += `\n• ${totalRefChars} characters in references`;
            }
            if (displayWord && totalRefWords > 0) {
              result += `\n• ${totalRefWords} words in references`;
            }
            if (totalRefTodo > 0) {
              let percent = displayPercentage(
                totalRefDone,
                totalRefTodo,
                modeTODO
              );
              result += `\n• ☑ ${totalRefDone}/${totalRefTodo} in references ${percent}`;
            }
          } else {
            result += `${refsNb} linked ref`;
          }
        }

        let refTimeNewest = formatDateAndTime(newestTime);
        let refTimeOldest = formatDateAndTime(oldestTime);

        if (displayAll) {
          result += `\n• First reference: ${refTimeOldest.date}`;
          result += `\n• Last updated reference: ${refTimeNewest.date}`;
        } else {
          result += `\nLast ref: ${refTimeNewest.date}`;
        }
      }
    }
  }
  if (result === "\n") result = "";
  return result;
}

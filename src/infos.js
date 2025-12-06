import {
  dateFormat,
  displayChar,
  displayChildren,
  displayEditName,
  displayPOMO,
  displayREFS,
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
  getTreeByUid,
  getUser,
  resolveReferences,
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
  newestBlockUid = ""
) {
  for (let i = 0; i < tree.length; i++) {
    let content = resolveReferences(tree[i].string, [tree[i].uid]);
    b++;
    c += content.length;
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
      let r = getChildrenStats(tree[i].children, newestTime, editUser, 0, 0, 0, 0, { done: 0, todo: 0 }, 0, newestBlockUid);
      c += r.characters;
      if (displayWord) w += r.words;
      s += r.sentences;
      b += r.blocks;
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
    done: task.done,
    todo: task.todo,
    pomo: pomo,
    newestTime: newestTime,
    editUser: editUser,
    newestBlockUid: newestBlockUid,
  };
}

function getBlockStats(uid) {
  let content = resolveReferences(getBlockContentByUid(uid), [uid]);
  let wordCount = countWords(content);
  let sentenceCount = countSentences(content);
  return {
    characters: content.length,
    words: wordCount,
    sentences: sentenceCount,
  };
}

function countWords(str) {
  str = str.replace(/(^\s*)|(\s*$)/gi, "");
  str = str.replace(/[ ]{2,}/gi, " ");
  str = str.replace(/\n /, "\n");
  return str.split(" ").length;
}

function countSentences(str) {
  // Remove extra whitespace and clean up the string
  str = str.trim();
  if (!str) return 0;

  // Match sentences ending with ., !, or ?
  // Handle common abbreviations (Dr., Mr., etc.) and numbers (1.5, etc.)
  const sentences = str.match(/[^.!?]+[.!?]+/g) || [];

  // If no sentence-ending punctuation found but text exists, count as 1 sentence
  return sentences.length > 0 ? sentences.length : (str.length > 0 ? 1 : 0);
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
      if (displayChar) result += `\n• ${bStats.characters} characters`;
      if (displayWord) result += `\n• ${bStats.words} words`;
      if (bStats.sentences > 0) {
        result += `\n• ${bStats.sentences} sentences`;
        if (bStats.words > 0) {
          const avgWords = (bStats.words / bStats.sentences).toFixed(1);
          result += ` (avg ${avgWords} words/sentence)`;
        }
      }
      if (bStats.words > 0) {
        result += `\n• Reading time: ${calculateReadingTime(bStats.words)}`;
      }
    } else {
      // Compact format for tooltips
      if (displayChar) bString.push(bStats.characters + "c");
      if (displayWord) bString.push(bStats.words + "w");
      if (bStats.sentences > 0) bString.push(bStats.sentences + "s");
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
      if (displayChildren) result += `\n• ${cStats.blocks} ${nodeType}`;
      if (displayChar) result += `\n• ${cStats.characters} characters`;
      if (displayWord) result += `\n• ${cStats.words} words`;
      if (cStats.sentences > 0) {
        result += `\n• ${cStats.sentences} sentences`;
        if (cStats.words > 0) {
          const avgWords = (cStats.words / cStats.sentences).toFixed(1);
          result += ` (avg ${avgWords} words/sentence)`;
        }
      }
      if (cStats.words > 0) {
        result += `\n• Reading time: ${calculateReadingTime(cStats.words)}`;
      }
      // Add page mentions count for pages
      if (node !== "block") {
        let mentionCount = countPageMentions(uid);
        if (mentionCount > 0) {
          result += `\n• ${mentionCount} page mentions`;
        }
      }
    } else {
      // Compact format for tooltips
      if (displayAll || displayChar || displayChildren || displayWord)
        cString.push("\n");
      if (displayChildren) cString.push(`${cStats.blocks} ${nodeType}, `);
      if (displayChar) cString.push(cStats.characters + "c");
      if (displayWord) cString.push(cStats.words + "w");
      if (cStats.sentences > 0) cString.push(cStats.sentences + "s");
      result += `${cString.join(" ")}`;
    }

    if ((displayTODO || displayAll) && cStats.todo != 0) {
      let percent = displayPercentage(cStats.done, cStats.todo, modeTODO);
      result += `\n☑ ${cStats.done}/${cStats.todo} ${percent}`;
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

      refs.forEach((ref) => {
        let refUid;
        node === "block" ? (refUid = ref[0]) : (refUid = ref[0].uid);
        let times = getBlockTimes(refUid);
        updateTime = times.update;
        if (updateTime > newestTime) newestTime = updateTime;
        if (times.create < oldestTime) oldestTime = times.create;

        // Count characters and words in reference blocks (including children)
        if (displayAll) {
          let refContent = node === "block" ? ref[1] : resolveReferences(ref[0][":block/string"] || "", []);
          totalRefChars += refContent.length;
          if (displayWord) totalRefWords += countWords(refContent);

          // Add children content if present
          let refTree = getTreeByUid(refUid);
          if (refTree && refTree.children) {
            let childStats = getChildrenStats(refTree.children);
            totalRefChars += childStats.characters;
            if (displayWord) totalRefWords += childStats.words;
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

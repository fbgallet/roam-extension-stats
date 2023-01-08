import { getBlockContentByUid, getCreationTime, getTreeByUid } from "./utils";
import { displayChar, displayWord, displayTODO, modeTODO } from "./index";

var runners = {
  menuItems: [],
  observers: [],
};

export function addObserver(element, callback, options) {
  let myObserver = new MutationObserver(callback);
  myObserver.observe(element, options);

  runners["observers"] = [myObserver];
}
export function disconnectObserver() {
  // loop through observers and disconnect
  for (let index = 0; index < runners["observers"].length; index++) {
    const element = runners["observers"][index];
    element.disconnect();
  }
}

function getDateStrings(uid) {
  let t = document.querySelectorAll(".rm-bullet-tooltip__time");
  t[0].style.display = "none";
  t[1].style.display = "none";
  let creationTime = getCreationTime(uid);
  let cDate = new Date(creationTime).toLocaleDateString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  let cTime = new Date(creationTime).toLocaleTimeString("en-US", {
    hour12: false,
  });
  return {
    uTime: t[0].innerText.trim(),
    uDate: t[1].innerText,
    cTime: cTime,
    cDate: cDate,
  };
}

function getChildrenStats(
  tree,
  c = 0,
  w = 0,
  b = 0,
  task = { done: 0, todo: 0 }
) {
  for (let i = 0; i < tree.length; i++) {
    let content = tree[i].string;
    b++;
    c += content.length;
    if (displayWord) w += countWords(content);
    if (content.includes("[[DONE]]")) {
      task.done++;
      task.todo++;
    } else if (content.includes("[[TODO]]")) task.todo++;
    if (tree[i].children) {
      let r = getChildrenStats(tree[i].children);
      c += r.characters;
      if (displayWord) w += r.words;
      b += r.blocks;
      task.done += r.done;
      task.todo += r.todo;
    }
  }
  return {
    characters: c,
    words: w,
    blocks: b,
    done: task.done,
    todo: task.todo,
  };
}

function getBlockStats(uid) {
  let content = getBlockContentByUid(uid);
  let wordCount = countWords(content);
  return {
    characters: content.length,
    words: wordCount,
  };
}

function countWords(str) {
  str = str.replace(/(^\s*)|(\s*$)/gi, "");
  str = str.replace(/[ ]{2,}/gi, " ");
  str = str.replace(/\n /, "\n");
  return str.split(" ").length;
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
      else if (percent > 5) {
        left = "🟩🟩🟩🟩🟩";
        right = "□";
      } else if (percent > 4) {
        left = "🟩🟩🟩🟩";
        right = "□□";
      } else if (percent > 3) {
        left = "🟩🟩🟩";
        right = "□□□";
      } else if (percent > 2) {
        left = "🟩🟩";
        right = "□□□□";
      } else if (percent > 1) {
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

export function infoTooltip(mutations) {
  let target = mutations[0].target;
  if (
    target.classList.contains("bp3-popover-open") &&
    target.firstChild.className === "rm-bullet__inner"
  ) {
    let parent = target.parentNode.parentNode.parentNode.parentNode;
    let uid = parent.querySelector(".roam-block").id.slice(-9);
    const tooltip = document.querySelector(".rm-bullet__tooltip");

    let dates = getDateStrings(uid);
    tooltip.innerText += `\nUpdated:\n${dates.uTime} ${dates.uDate}\nCreated:\n${dates.cTime} ${dates.cDate}\n\n`;

    let tree = getTreeByUid(uid);
    console.log(tree);
    let bStats = getBlockStats(uid);
    let bString = [];
    if (displayChar) bString.push(bStats.characters + "c");
    if (displayWord) bString.push(bStats.words + "w");
    if (displayChar || displayWord)
      tooltip.innerText += `• ${bString.join(" ")}\n`;
    if (tree.children) {
      let cStats = getChildrenStats(tree.children);
      let cString = [];
      cString.push(`${cStats.blocks} children `);
      if (displayChar) cString.push(`${cStats.characters}c`);
      if (displayWord) cString.push(`${cStats.words}w`);
      tooltip.innerText += `${cString.join(" ")}`;
      if (displayTODO && cStats.todo != 0) {
        let percent = displayPercentage(cStats.done, cStats.todo, modeTODO);
        tooltip.innerText += `\n☑ ${cStats.done}/${cStats.todo} ${percent}`;
      }
    }
  }
}

import {
  getBlockContentByUid,
  getBlockTimes,
  getMainPageUid,
  getTreeByUid,
  getUser,
} from "./utils";
import {
  displayEditName,
  displayChar,
  displayWord,
  displayTODO,
  modeTODO,
  dateFormat,
  localDateFormat,
} from "./index";

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
  // let t = document.querySelector(".rm-bullet__tooltip"); // .rm-bullet-tooltip__time
  let blockTimes = getBlockTimes(uid);
  let c = formatDateAndTime(blockTimes.create);
  let u = formatDateAndTime(blockTimes.update);
  return {
    u: u,
    c: c,
  };
}

function formatDateAndTime(timestamp) {
  let date = new Date(timestamp).toLocaleDateString(localDateFormat, {
    // default: "en-US"
    dateStyle: dateFormat,
    // year: "numeric",
    // month: "numeric",
    // day: "numeric",
  });
  let time = new Date(timestamp).toLocaleTimeString(localDateFormat, {
    hour12: false,
  });
  return { date: date, time: time };
}

function getChildrenStats(
  tree,
  newestTime = 0,
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
    if (tree[i].time > newestTime) newestTime = tree[i].time;
    if (tree[i].children) {
      let r = getChildrenStats(tree[i].children, newestTime);
      c += r.characters;
      if (displayWord) w += r.words;
      b += r.blocks;
      task.done += r.done;
      task.todo += r.todo;
      newestTime = r.newestTime;
    }
  }
  return {
    characters: c,
    words: w,
    blocks: b,
    done: task.done,
    todo: task.todo,
    newestTime: newestTime,
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

function getFormatedUserName(uid) {
  let result;
  let editName = getUser(uid);
  displayEditName ? (result = editName + "\n") : (result = "");
  return result;
}

function getFormatedDateStrings(uid, node) {
  let result = "";
  let dates = getDateStrings(uid);
  if (
    dates.c.date != dates.u.date ||
    dates.c.time.slice(0, -3) != dates.u.time.slice(0, -3)
  ) {
    result += `Updated:\n${dates.u.date} ${dates.u.time}\n`;
  }
  result += `Created:\n${dates.c.date} ${dates.c.time}\n`;
  return result;
}

function getFormatedChildrenStats(uid, node) {
  let result = "";
  let tree = getTreeByUid(uid);
  let bStats = getBlockStats(uid);

  let bString = [];
  if (node !== "page") {
    if (displayChar) bString.push(bStats.characters + "c");
    if (displayWord) bString.push(bStats.words + "w");
    if (displayChar || displayWord) result += `\n• ${bString.join(" ")}`;
  }
  if (tree.children) {
    let cStats = getChildrenStats(tree.children);
    let cString = [];
    if (node === "page") {
      let newestTime = formatDateAndTime(cStats.newestTime);
      result =
        `Last updated block:\n${newestTime.date} ${newestTime.time}\n` + result;
    }
    let nodeType;
    node === "page" ? (nodeType = "blocks") : (nodeType = "children");
    cString.push(`\n${cStats.blocks} ${nodeType} `);
    if (displayChar) cString.push(`${cStats.characters}c`);
    if (displayWord) cString.push(`${cStats.words}w`);
    result += `${cString.join(" ")}`;
    if (displayTODO && cStats.todo != 0) {
      let percent = displayPercentage(cStats.done, cStats.todo, modeTODO);
      result += `\n☑ ${cStats.done}/${cStats.todo} ${percent}`;
    }
  }
  return result;
}

export function infoTooltip(mutations) {
  let target = mutations[0].target;
  if (
    target.classList.contains("bp3-popover-open") &&
    //target.firstChild.className === "rm-bullet__inner" // does the issue come from here ?
    target.querySelector(".rm-bullet__inner")
  ) {
    //let parent = target.parentNode.parentNode.parentNode.parentNode;
    let parent = target.closest(".rm-block-main");
    let uid = parent.querySelector(".roam-block").id.slice(-9);
    const tooltip = document.querySelector(".rm-bullet__tooltip");

    tooltip.innerText = "" + getFormatedUserName(uid);
    tooltip.innerText += getFormatedDateStrings(uid);
    tooltip.innerText += getFormatedChildrenStats(uid);
  }
}

export async function infoPage() {
  let pageUid = await getMainPageUid();
  //  console.log(getFormatedUserName(pageUid));
  // console.log(getFormatedDateStrings(pageUid, "page"));
  // console.log(getFormatedChildrenStats(pageUid, "page"));

  let pageTitle = document.querySelector(".rm-title-display");

  return `${getFormatedDateStrings(pageUid, "page")}${getFormatedChildrenStats(
    pageUid,
    "page"
  )}`;
  // return (
  //   <div>
  //     <p>{getFormatedDateStrings(pageUid, "page")}</p>
  //     <p>{getFormatedChildrenStats(pageUid, "page")}</p>
  //   </div>
  // );
}

import {
  dateFormat,
  displayChar,
  displayEditName,
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
  b = 0,
  task = { done: 0, todo: 0 }
) {
  for (let i = 0; i < tree.length; i++) {
    let content = resolveReferences(tree[i].string, [tree[i].uid]);
    b++;
    c += content.length;
    if (displayWord) w += countWords(content);
    let users = getUser(tree[i].uid);
    if (content.includes("[[DONE]]")) {
      task.done++;
      task.todo++;
    } else if (content.includes("[[TODO]]")) task.todo++;
    if (tree[i].time > newestTime) {
      newestTime = tree[i].time;
      editUser = users.editUser;
    }
    if (tree[i].children) {
      let r = getChildrenStats(tree[i].children, newestTime, editUser);
      c += r.characters;
      if (displayWord) w += r.words;
      b += r.blocks;
      task.done += r.done;
      task.todo += r.todo;
      newestTime = r.newestTime;
      editUser = r.editUser;
    }
  }
  return {
    characters: c,
    words: w,
    blocks: b,
    done: task.done,
    todo: task.todo,
    newestTime: newestTime,
    editUser: editUser,
  };
}

function getBlockStats(uid) {
  let content = resolveReferences(getBlockContentByUid(uid), [uid]);
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

export function getFormatedDateStrings(uid, users, node = "block") {
  let result = "";
  let dates = getDateStrings(uid);
  let doNotDisplayCreateName = false;

  result += `Created:\n${dates.c.date}, ${dates.c.time}\n`;
  if (displayEditName) result += `by ${users.createUser}\n`;
  if (
    node === "block" &&
    (dates.c.date != dates.u.date ||
      dates.c.time.slice(0, -3) != dates.u.time.slice(0, -3))
  ) {
    result += `Updated:\n${dates.u.date}, ${dates.u.time}\n`;
  } else {
    doNotDisplayCreateName = true;
  }
  if (
    users.editUser != users.createUser &&
    !doNotDisplayCreateName &&
    displayEditName
  )
    result += `by ${users.editUser}\n`;
  //result += "\n";
  return result;
}

export function getFormatedChildrenStats(
  uid,
  users,
  node = "block",
  withDate = true
) {
  let result = "";
  let tree = getTreeByUid(uid);
  if (!tree) return null;
  let bStats = getBlockStats(uid);

  let bString = [];
  if (node === "block") {
    if (displayChar) bString.push(bStats.characters + "c");
    if (displayWord) bString.push(bStats.words + "w");
    if (displayChar || displayWord) result += `\n• ${bString.join(" ")}`;
  }
  if (tree.children) {
    let cStats = getChildrenStats(tree.children);
    let cString = [];
    if (node !== "block" && withDate) {
      let newestTime = formatDateAndTime(cStats.newestTime);
      let updateString = `Last updated block:\n${newestTime.date}, ${newestTime.time}\n`;
      if (displayEditName && cStats.editUser != users.createUser)
        updateString += `by ${cStats.editUser}\n`;
      result = updateString + result;
    }
    let nodeType;
    node !== "block" ? (nodeType = "blocks") : (nodeType = "children");
    cString.push(`\n${cStats.blocks} ${nodeType} `);
    if (displayChar) cString.push(`${cStats.characters}c`);
    if (displayWord) cString.push(`${cStats.words}w`);
    result += `${cString.join(" ")}`;
    if (displayTODO && cStats.todo != 0) {
      let percent = displayPercentage(cStats.done, cStats.todo, modeTODO);
      result += `\n☑ ${cStats.done}/${cStats.todo} ${percent}`;
    }
  }
  if (displayREFS) {
    let refs;
    node === "block"
      ? (refs = getBlocksIncludingRef(uid))
      : (refs = getBlocksIncludingRefByTitle(node));
    let refsNb = refs.length;
    if (refsNb > 0) {
      let newestTime = 0;
      let updateTime;
      refs.forEach((ref) => {
        let refUid;
        node === "block" ? (refUid = ref[0]) : (refUid = ref[0].uid);
        updateTime = getBlockTimes(refUid).update;
        if (updateTime > newestTime) newestTime = updateTime;
      });
      let refTime = formatDateAndTime(newestTime);
      result += `\n`;
      if (node !== "block") result += `${refsNb} linked ref\n`;
      result += `Last ref: ${refTime.date}`;
    }
  }
  return result;
}

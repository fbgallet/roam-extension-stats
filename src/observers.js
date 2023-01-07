import { getBlockContentByUid, getCreationTime, getTreeByUid } from "./utils";

const NEW_ELEMENT_ID = "tooltip-content-xxx";

// store observers globally so they can be disconnected
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
    w += countWords(content);
    if (content.includes("[[DONE]]")) {
      task.done++;
      task.todo++;
    } else if (content.includes("[[TODO]]")) task.todo++;
    if (tree[i].children) {
      let r = getChildrenStats(tree[i].children);
      c += r.characters;
      w += r.words;
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

function displayPercent(a, b) {
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
    let percent = (a / b) * 6;
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
}

export function infoTooltip(mutations) {
  let target = mutations[0].target;
  if (target.classList.contains("bp3-popover-open")) {
    let parent = target.parentNode.parentNode.parentNode.parentNode;
    let uid = parent.querySelector(".roam-block").id.slice(-9);
    const tooltip = document.querySelector(".rm-bullet__tooltip");

    let dates = getDateStrings(uid);
    tooltip.innerText += `\nUpdated:\n${dates.uTime} ${dates.uDate}\nCreated:\n${dates.cTime} ${dates.cDate}\n`;

    let tree = getTreeByUid(uid);
    console.log(tree);
    let bStats = getBlockStats(uid);
    tooltip.innerText += `\n• ${bStats.characters}c ${bStats.words}w\n`;
    if (tree.children) {
      let cStats = getChildrenStats(tree.children);
      tooltip.innerText += `${cStats.blocks} children ${cStats.characters}c ${cStats.words}w`;
      let displayTODO = true;
      if (displayTODO & (cStats.todo != 0)) {
        let percent = Math.trunc((cStats.done / cStats.todo) * 100) + "%";
        percent = displayPercent(cStats.done, cStats.todo);
        tooltip.innerText += `\n☑ ${cStats.done}/${cStats.todo} ${percent}`;
      }
    }
  }
  if (
    target === "x"
    //document.querySelectorAll("rm-bullet .bp3-popover-wrapper.bp3-popover-open") //&& // .rm-bullet__tooltip
    //  !document.getElementById(NEW_ELEMENT_ID)
  ) {
    const tooltipContent =
      document.getElementsByClassName("rm-bullet__tooltip");
    console.log("coucou");
    console.log(tooltipContent);
    if (tooltipContent) {
      // let uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
      // noteInline = getInlineNote();
      // if (noteInline.content.length > 0) {
      //   let hasCreateNoteItem =
      //     blockAutocomplete.querySelector(".create-footnote");
      //   if (hasCreateNoteItem === null) {
      //     footnoteButton = blockAutocomplete.insertAdjacentElement(
      //       "afterbegin",
      //       createFootnoteButton(noteInline.content)
      //     );
      //   } else {
      //     blockAutocomplete.removeChild(footnoteButton);
      //     footnoteButton = blockAutocomplete.insertAdjacentElement(
      //       "afterbegin",
      //       createFootnoteButton(noteInline.content)
      //     );
      //   }
      //   let addAsBlockElt = footnoteButton.nextElementSibling;
      //   document.addEventListener(
      //     "keydown",
      //     function (e) {
      //       keyboardSelect(e, uid, addAsBlockElt);
      //     },
      //     { once: true }
      //   );
      //   footnoteButton.addEventListener(
      //     "click",
      //     function () {
      //       insertFootNote(uid);
      //     },
      //     { once: true }
      //   );
      // }
    }
  }
}

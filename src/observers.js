import {
  getBlocksByPageTitle,
  getMainPageUid,
  getPageUidByTitle,
  getUser,
  removeTopBlankLines,
} from "./utils";
import {
  formatDateAndTime,
  getDateStrings,
  getFormatedChildrenStats,
  getFormatedDateStrings,
  getFormatedDay,
  getYesterdayDate,
} from "./infos";
import {
  displayDates,
  displayShortcutInfo,
  displayStreakRender,
  EXTENSION_PAGE_UID,
  fontSize,
  monthsInStreak,
  nbDaysBefore,
  tooltipDelay,
  tooltipOff,
} from ".";
import { displayPageInfo } from "./components";

let observers = {
  tooltips: null,
  logs: null,
};
let pageTitle = undefined;
let isHover;
let dailyLogPageTitles = [];
export let blockToRender;
// let triggerKeyPressed = false;

export function connectObservers() {
  addObserver(
    document.getElementsByClassName("roam-app")[0],
    infoTooltip,
    {
      childList: false,
      subtree: true,
      attributeFilter: ["class"],
    },
    "tooltips"
  );
}

function addObserver(element, callback, options, name) {
  const myObserver = new MutationObserver(callback);
  myObserver.observe(element, options);
  observers[name] = myObserver;
}
export function disconnectObserver(name) {
  if (observers[name]) {
    observers[name].disconnect();
  }
}

export function addListeners() {
  window.addEventListener("popstate", onPageLoad);
  shortcutsListener();
  // document.addEventListener("keydown", onkeydown);
  // document.addEventListener("keyup", onkeyup);
}

// function onkeydown(e) {
//   if (e.key === "Control" || e.key === "Meta") {
//     triggerKeyPressed = true;
//   }
// }

// function onkeyup(e) {
//   if (e.key === "Control" || e.key === "Meta") {
//     if (!isHover) triggerKeyPressed = false;
//   }
// }

export function shortcutsListener() {
  let shortcuts = document.querySelectorAll(".page");
  shortcuts.forEach((s) => {
    s.addEventListener("mouseenter", onTitleOver);
    s.addEventListener("mouseleave", onTitleLeave);
    // s.addEventListener("click", onStarredPagesClick);
  });
  let dailyNotes = document.querySelector(".rm-left-sidebar__daily-notes");
  dailyNotes.addEventListener("mouseenter", onTitleOver);
  dailyNotes.addEventListener("mouseleave", onTitleLeave);
}

export function removeListeners() {
  pageTitle = document.querySelector(".rm-title-display");
  if (pageTitle) {
    pageTitle.removeEventListener("mouseenter", onTitleOver);
    pageTitle.removeEventListener("mouseleave", onTitleLeave);
  }
  window.removeEventListener("popstate", onPageLoad);
  removeShortcutsListeners();
  // document
  //   .querySelector(".starred-pages")
  document.removeEventListener("keydown", onkeydown);
  document.removeEventListener("keyup", onkeyup);
}

export function removeShortcutsListeners() {
  let shortcuts = document.querySelectorAll(".page");
  shortcuts.forEach((s) => {
    s.removeEventListener("mouseenter", onTitleOver);
    s.removeEventListener("mouseleave", onTitleLeave);
    // s.removeEventListener("click", onStarredPagesClick);
  });
  let dailyNotes = document.querySelector(".rm-left-sidebar__daily-notes");
  if (dailyNotes) {
    dailyNotes.removeEventListener("mouseenter", onTitleOver);
    dailyNotes.removeEventListener("mouseleave", onTitleLeave);
  }
}

export function removeDailyLogListeners() {
  if (dailyLogPageTitles.length != 0) {
    dailyLogPageTitles.forEach((title) => {
      title.removeEventListener("mouseenter", onTitleOver);
      title.removeEventListener("mouseleave", onTitleLeave);
    });
    dailyLogPageTitles = [];
  }
}

export function onPageLoad(e) {
  disconnectObserver("tooltips");
  if (pageTitle) {
    pageTitle.removeEventListener("mouseenter", onTitleOver);
    pageTitle.removeEventListener("mouseleave", onTitleLeave);
  }
  setTimeout(() => {
    connectObservers();
    let isLogPage = document.querySelector(".roam-log-container");
    isHover = false;
    if (isLogPage) {
      let titles = document.querySelectorAll(".rm-title-display");
      dailyLogPageTitles = titles;
      titles.forEach((title) => {
        title.addEventListener("mouseenter", onTitleOver);
        title.addEventListener("mouseleave", onTitleLeave);
      });
      addObserver(
        document.getElementsByClassName("roam-log-container")[0],
        dailyLogObserver,
        {
          childList: true,
          subtree: false,
        },
        "logs"
      );
    } else {
      removeDailyLogListeners();
      disconnectObserver("logs");
      pageTitle = document.querySelector(".rm-title-display");
      if (!pageTitle) return;

      pageTitle.addEventListener("mouseenter", onTitleOver);

      pageTitle.addEventListener(
        "mouseleave",
        onTitleLeave
        //document.removeEventListener("keydown", ctrlDown /*, { once: true }*/);
      );
    }
  }, 1000);
}

function dailyLogObserver(e) {
  let titles = document.querySelectorAll(".rm-title-display");
  dailyLogPageTitles = titles;
  titles[titles.length - 1].addEventListener("mouseenter", onTitleOver);
  titles[titles.length - 1].addEventListener("mouseleave", onTitleLeave);
}

var hoverEventTarget;

export function infoTooltip(mutations) {
  let target = mutations[0].target;
  if (
    // target.classList.contains("bp3-popover-open") &&
    target.className === "bp3-popover-target bp3-popover-open" &&
    (target.firstChild.className === "rm-bullet__inner" ||
      target.firstChild.className === "rm-bullet__inner--user-icon")
  ) {
    let isMouseDown = false;
    document.addEventListener("mousedown", onMouseDown);
    const tooltip = document.querySelector(".rm-bullet__tooltip");
    if (fontSize != "") tooltip.classList.add(fontSize);
    let popover = tooltip.parentElement.parentElement.parentElement;
    popover.style.transform = "none";
    popover.style.visibility = "hidden";
    setTimeout(() => {
      if (!isMouseDown) {
        popover.style.transform = "initial";
        popover.style.visibility = "visible";
        let result = getInfoOnBlock(undefined, target);
        tooltip.innerText = removeTopBlankLines(result);
        // TODO ?
        // the tooltip still appear a split second in the top left corner,
        // before to be displayed below the bullet,
        // can't find any way to hidde it properly !!!
      }
    }, tooltipDelay - 200);

    document.removeEventListener("mousedown", onMouseDown);
    function onMouseDown(e) {
      if (e.button === 0) {
        isMouseDown = true;
      }
    }
  }
}

export function getInfoOnBlock(uid, target) {
  let parent = target.closest(".rm-block-main");
  let rmBlock = parent.querySelector(".roam-block");
  if (!uid) {
    if (rmBlock) {
      uid = rmBlock.id.slice(-9);
    } else {
      rmBlock = parent.querySelector("textarea");
      uid = rmBlock.id.slice(-9);
    }
  }
  let users = getUser(uid);
  let dates = {
    c: formatDateAndTime(parseInt(parent.parentElement.dataset.createTime)),
    u: formatDateAndTime(parseInt(parent.parentElement.dataset.editTime)),
  };
  let datesCondition = displayDates != "None" ? true : false;
  return (
    getFormatedDateStrings(dates, users, "block", datesCondition) +
    getFormatedChildrenStats(uid, users, "block", datesCondition)
  );
}

function onTitleOver(e) {
  {
    // if (triggerKeyPressed) {
    //   onTriggerKeyHoverTitle(e);
    //   isHover = false;
    //   return;
    // }
    if (isHover) return;
    isHover = true;
    hoverEventTarget = e.target;
    setTimeout(async () => {
      // if (triggerKeyPressed && isHover) {
      //   onTriggerKeyHoverTitle(e);
      //   isHover = false;
      //   return;
      // }
      let shortcut = false;
      if (tooltipOff || !isHover) return;
      if (hoverEventTarget !== e.target) return;
      let monthsToDisplay = monthsInStreak;
      let dailyNotesHover = false;
      let logHover = false;
      let title = e.target.firstChild.textContent;
      let tooltip = document.createElement("span");
      e.target.style.position = "relative";
      tooltip.classList.add("tooltiptext");
      if (fontSize != "") tooltip.classList.add(fontSize);
      let prevTooltip = e.target.querySelector(".tooltiptext");
      prevTooltip ? (tooltip = prevTooltip) : e.target.appendChild(tooltip);
      let pageUid;
      // over Page title
      if (e.target.classList.contains("rm-title-display")) {
        pageUid = await getPageUidByTitle(e.target.innerText);
        if (!pageUid) {
          let originalTitle = e.target.dataset?.originalText;
          if (originalTitle) pageUid = await getPageUidByTitle(originalTitle);
        }
        // in log page
        if (document.querySelector(".roam-log-container")) {
          logHover = true;
        }
      }
      // over 'Daily Notes'
      else if (e.target.classList.contains("rm-left-sidebar__daily-notes")) {
        dailyNotesHover = true;
        pageUid = await window.roamAlphaAPI.util.dateToPageUid(new Date());
        // over Shortcuts in leftt sidebar or daily notes title in log
      } else if (displayShortcutInfo && e.target.classList.contains("page")) {
        pageUid = await getPageUidByTitle(e.target.innerText);
        monthsToDisplay = 2;
        shortcut = true;
      } else {
        tooltip.remove();
        return;
      }
      if (!isHover) return;
      if (dailyNotesHover) tooltip.innerText = await infoDailyPage(pageUid);
      else {
        tooltip.innerText = await infoPage(pageUid, title, shortcut);
        if (displayStreakRender && !logHover) {
          displayStreak(pageUid, title, tooltip, monthsToDisplay);
        }
      }
    }, tooltipDelay);
    //document.addEventListener("keydown", ctrlDown /*, { once: true }*/);
  }
}

function onTitleLeave(e) {
  isHover = false;
  // setTimeout(() => {
  // triggerKeyPressed = false;
  let tooltips = document.querySelectorAll(".tooltiptext");
  if (tooltips) {
    tooltips.forEach((t) => t.remove());
    // deleteStreakBlock();
  }
  cleanExtensionPage();
  // }, 500);
}

// async function onTriggerKeyHoverTitle(e) {
//   if (triggerKeyPressed) {
//     triggerKeyPressed = false;
//     let title = e.target.innerText;
//     if (document.querySelector(".bp3-dialog")) return;
//     // if on 'Daily Notes'
//     if (e.target.classList.contains("rm-left-sidebar__daily-notes")) {
//       pageUid = await window.roamAlphaAPI.util.dateToPageUid(new Date());
//       let daysToDisplay;
//       tooltipOff ? (daysToDisplay = nbDaysBefore) : (daysToDisplay = 6);
//       displayPageInfo(
//         await infoDailyPage(pageUid, daysToDisplay),
//         "Daily Notes"
//       );
//       return;
//     }
//     // else: title or shorcuts
//     let displayAllInfo;
//     tooltipOff ? (displayAllInfo = false) : (displayAllInfo = true);
//     let pageUid = await getPageUidByTitle(title);
//     displayPageInfo(
//       await infoPage(pageUid, title, false, displayAllInfo),
//       "Page",
//       title
//     );
//     let dialog = document.querySelector(".bp3-dialog-body");
//     let newNode = document.createElement("div");
//     dialog.appendChild(newNode);
//     displayStreak(pageUid, title, dialog);
//   }
// }

export async function infoPage(
  pageUid,
  title,
  shortcut = false,
  displayAll = false
) {
  if (!pageUid) pageUid = await getMainPageUid();
  let users = getUser(pageUid);
  let datesCondition =
    displayDates === "None" ||
    (displayDates === "Not for pages" && !shortcut) ||
    (displayDates === "Not for shortcuts" && shortcut)
      ? false
      : true;
  let result = `${getFormatedDateStrings(
    getDateStrings(pageUid),
    users,
    title,
    datesCondition,
    displayAll
  )}${getFormatedChildrenStats(
    pageUid,
    users,
    title,
    datesCondition,
    displayAll
  )}`;
  result = removeTopBlankLines(result);
  return result;
}

export async function displayStreak(pageUid, title, elt, maxMonths) {
  if (elt.innerText.trim().length === 0) {
    //console.log("void");
  } else {
    elt.innerHTML.slice(-4) === "<br>"
      ? (elt.innerText += "\n")
      : (elt.innerText += "\n\n");
  }
  blockToRender = window.roamAlphaAPI.util.generateUID();
  await window.roamAlphaAPI.createBlock({
    location: { "parent-uid": EXTENSION_PAGE_UID, order: "last" },
    block: { string: `{{streak: [[${title}]]}}`, uid: blockToRender },
  });

  let newNode = document.createElement("span");
  elt.appendChild(newNode);
  await window.roamAlphaAPI.ui.components.renderBlock({
    uid: blockToRender,
    el: newNode,
  });
  elt.querySelector(".rm-block__controls").style.display = "none";
  elt.querySelector(".rm-streak__title").style.display = "none";
  let main = elt.querySelector(".rm-block-main");
  main.lastChild.style.minWidth = "0";

  let recentMention = false;
  let oldMention = false;
  let oldMentionDate;

  let streak = elt.querySelector(".rm-streak");
  streak.style.visibility = "hidden";
  let months = elt.querySelectorAll(".rm-streak__month");
  // months.style.visibility = "none";
  let days = elt.querySelectorAll(".rm-streak__day");
  let columnNb;
  if (maxMonths) {
    if (months.length < maxMonths) maxMonths = months.length;
    columnNb = maxMonths * 4 + 1;
    for (let i = months.length - 1; i >= 0; i--) {
      if (i < months.length - maxMonths) months[i].style.display = "none";
      else {
        let rightShift = 0;
        let dayOfMonth = new Date().getDate();
        if (dayOfMonth < 12) rightShift = 2;
        else if (dayOfMonth < 24) rightShift = 1;
        months[i].style.gridColumnStart =
          (i - (months.length - maxMonths - 1)) * 4 + rightShift;
      }
    }
    let weeksToRemove = Math.floor((days.length - 28 * maxMonths) / 7) - 1;
    let lastDayNb = parseInt(days[days.length - 1].style.gridRowStart) - 1;
    let daysToDisplay = 28 * maxMonths + lastDayNb;
    // console.log(weeksToRemove);
    for (let i = days.length - 1; i >= 0; i--) {
      if (i < days.length - daysToDisplay) {
        days[i].style.display = "none";
        if (
          !oldMention &&
          !days[i].getAttribute("title").includes(" 0 times")
        ) {
          oldMention = true;
          oldMentionDate = days[i].getAttribute("title").split(":")[0];
        }
      } else {
        days[i].style.gridColumnStart -= weeksToRemove;
        if (
          !recentMention &&
          !days[i].getAttribute("title").includes(" 0 times")
        ) {
          recentMention = true;
        }
      }
    }
  } else {
    columnNb = days[days.length - 1].style.gridColumnStart - 1;
    recentMention = true;
  }
  columnNb = columnNb.toString();
  let grid = elt.querySelector(".rm-streak__grid");
  grid.style.gridTemplateColumns = `max-content repeat(${columnNb}, 12px)`;

  if (!recentMention) {
    elt.innerText += `Streak:\nNo mention last ${maxMonths} mths`;
    if (oldMention)
      elt.innerText += `\nLast mention: ${oldMentionDate.slice(4)}`;
  } else {
    streak.style.visibility = "visible";
  }
  // Hide created streak in the linked references
  setTimeout(() => {
    let rmRefElt = document.querySelector(".rm-reference-container");
    let newStreak = rmRefElt.querySelector(".rm-streak");
    newStreak.closest(".rm-ref-page-view").style.display = "none";
  }, 50);
}

export async function deleteStreakBlock() {
  if (blockToRender) {
    await window.roamAlphaAPI.deleteBlock({ block: { uid: blockToRender } });
    blockToRender = null;
  }
}

export function cleanExtensionPage() {
  let createWarningMessage = false;
  let blocks = getBlocksByPageTitle("roam/depot/page & block info");
  if (blocks) {
    createWarningMessage = true;
    blocks.forEach((block) => {
      if (
        block[1] ==
        "⚠️ Doesn't write anything on this page, all content will be deleted on each streak view in page info."
      )
        createWarningMessage = false;
      else window.roamAlphaAPI.deleteBlock({ block: { uid: block[0] } });
    });
  } else createWarningMessage = true;
  return createWarningMessage;
}

export async function infoDailyPage(pageUid, nbDays = nbDaysBefore) {
  let users = getUser(pageUid);
  let result = `Today: ${getFormatedDay(new Date())}${getFormatedChildrenStats(
    pageUid,
    users,
    pageUid,
    false
  )}`;
  let previousDayDate = new Date();
  for (let i = 0; i < nbDays; i++) {
    previousDayDate = getYesterdayDate(previousDayDate);
    let previousDayUid = await window.roamAlphaAPI.util.dateToPageUid(
      previousDayDate
    );
    let stats = getFormatedChildrenStats(
      previousDayUid,
      users,
      window.roamAlphaAPI.util.dateToPageTitle(previousDayDate),
      false
    );
    if (stats) result += `\n_____\n${getFormatedDay(previousDayDate)}${stats}`;
  }
  return result;
}

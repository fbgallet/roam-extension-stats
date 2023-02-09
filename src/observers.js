import { getMainPageUid, getPageUidByTitle, getUser } from "./utils";
import {
  formatDateAndTime,
  getFormatedChildrenStats,
  getFormatedDateStrings,
  getFormatedDay,
  getYesterdayDate,
} from "./infos";
import { displayShortcutInfo, nbDaysBefore, tooltipDelay } from ".";

var runners = {
  menuItems: [],
  observers: [],
};
let pageTitle = undefined;
let isHover;
let dailyLogPageTitles = [];

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
  let myObserver = new MutationObserver(callback);
  myObserver.observe(element, options);

  runners[name] = [myObserver];
}
export function disconnectObserver(name) {
  if (runners[name])
    for (let index = 0; index < runners[name].length; index++) {
      const element = runners[name][index];
      element.disconnect();
    }
}

export function addListeners() {
  window.addEventListener("popstate", onPageLoad);
  addShortcutsListener();
}

export function addShortcutsListener() {
  if (displayShortcutInfo) shortcutsListener();
}

export function removeListeners() {
  pageTitle = document.querySelector(".rm-title-display");
  if (pageTitle) {
    pageTitle.removeEventListener("mouseenter", onTitleOver);
    pageTitle.removeEventListener("mouseleave", onTitleLeave);
  }
  window.removeEventListener("popstate", onPageLoad);
  removeShortcutsListeners();
}

export function removeShortcutsListeners() {
  let shortcuts = document.querySelectorAll(".page");
  shortcuts.forEach((s) => {
    s.removeEventListener("mouseenter", onTitleOver);
    s.removeEventListener("mouseleave", onTitleLeave);
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
  // setTimeout(() => {
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

function onTitleOver(e) {
  {
    isHover = true;
    setTimeout(async () => {
      let dailyNotesHover = false;
      if (!isHover) return;
      let title = e.target.firstChild.textContent;
      let tooltip = document.createElement("span");
      e.target.style.position = "relative";
      tooltip.classList.add("tooltiptext");
      let prevTooltip = e.target.querySelector(".tooltiptext");
      prevTooltip ? (tooltip = prevTooltip) : e.target.appendChild(tooltip);
      let pageUid;
      // hover 'Daily Notes'
      if (e.target.classList.contains("rm-left-sidebar__daily-notes")) {
        dailyNotesHover = true;
        pageUid = await window.roamAlphaAPI.util.dateToPageUid(new Date());
        // hover Shortcuts in right sidebar or daily notes title in log
      } else if (
        e.target.classList.contains("page") ||
        (document.querySelector(".roam-log-container") &&
          e.target.classList.contains("rm-title-display"))
      ) {
        pageUid = await getPageUidByTitle(e.target.innerText);
      }
      dailyNotesHover
        ? (tooltip.innerText = await infoDailyPage(pageUid, pageUid))
        : (tooltip.innerText = await infoPage(pageUid, title));
    }, tooltipDelay);
    //document.addEventListener("keydown", ctrlDown /*, { once: true }*/);
  }
}

function onTitleLeave() {
  isHover = false;
  let tooltip = document.querySelector(".tooltiptext");
  if (tooltip) tooltip.remove();
}

export function shortcutsListener() {
  let shortcuts = document.querySelectorAll(".page");
  shortcuts.forEach((s) => {
    s.addEventListener("mouseenter", onTitleOver);
    s.addEventListener("mouseleave", onTitleLeave);
  });
  let dailyNotes = document.querySelector(".rm-left-sidebar__daily-notes");
  dailyNotes.addEventListener("mouseenter", onTitleOver);
  dailyNotes.addEventListener("mouseleave", onTitleLeave);
}

export function infoTooltip(mutations) {
  let target = mutations[0].target;
  if (
    //  target.classList.contains("bp3-popover-open") &&
    target.className === "bp3-popover-target bp3-popover-open" &&
    (target.firstChild.className === "rm-bullet__inner" ||
      target.firstChild.className === "rm-bullet__inner--user-icon")
  ) {
    let parent = target.closest(".rm-block-main");
    let uid = parent.querySelector(".roam-block")?.id.slice(-9);
    if (!uid) uid = parent.querySelector("textarea").id.slice(-9);
    const tooltip = document.querySelector(".rm-bullet__tooltip");
    let users = getUser(uid);

    tooltip.innerText = ""; // + getFormatedUserName(uid);
    tooltip.innerText += getFormatedDateStrings(uid, users);
    tooltip.innerText += getFormatedChildrenStats(uid);
  }
}

export async function infoPage(pageUid, title) {
  if (!pageUid) pageUid = await getMainPageUid();
  let users = getUser(pageUid);

  return `${getFormatedDateStrings(
    pageUid,
    users,
    title
  )}${getFormatedChildrenStats(pageUid, users, title)}`;
}

export async function infoDailyPage(pageUid) {
  let users = getUser(pageUid);
  let result = `Today: ${getFormatedDay(new Date())}${getFormatedChildrenStats(
    pageUid,
    users,
    pageUid,
    false
  )}`;
  let previousDayDate = new Date();
  for (let i = 0; i < nbDaysBefore; i++) {
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

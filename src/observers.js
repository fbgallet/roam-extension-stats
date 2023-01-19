import { getMainPageUid, getPageUidByTitle, getUser } from "./utils";
import { getFormatedChildrenStats, getFormatedDateStrings } from "./infos";
import { displayShortcutInfo } from ".";

var runners = {
  menuItems: [],
  observers: [],
};
let pageTitle = undefined;
let isHover;

export function connectObservers() {
  addObserver(document.getElementsByClassName("roam-app")[0], infoTooltip, {
    childList: false,
    subtree: true,
    attributeFilter: ["class"],
  });
}

function addObserver(element, callback, options) {
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

export function addListeners() {
  window.addEventListener("popstate", onPageLoad);
  addShortcutsListener();
}

export function addShortcutsListener() {
  if (displayShortcutInfo) shortcutsListener();
}

export function removeListeners() {
  let pageTitle = document.querySelector(".rm-title-display");
  pageTitle.removeEventListener("mouseenter", onTitleOver);
  pageTitle.removeEventListener("mouseleave", onTitleLeave);
  window.removeEventListener("popstate", onPageLoad);
  removeShortcutsListeners();
}

export function removeShortcutsListeners() {
  let shortcuts = document.querySelectorAll(".page");
  shortcuts.forEach((s) => {
    s.removeEventListener("mouseenter", onTitleOver);
    s.removeEventListener("mouseleave", onTitleLeave);
  });
}

export function onPageLoad(e) {
  // setTimeout(() => {
  if (pageTitle) {
    pageTitle.removeEventListener("mouseenter", onTitleOver);
    pageTitle.removeEventListener("mouseleave", onTitleLeave);
  }
  setTimeout(() => {
    pageTitle = document.querySelector(".rm-title-display");
    if (!pageTitle) return;
    isHover = false;

    pageTitle.addEventListener("mouseenter", onTitleOver);

    pageTitle.addEventListener(
      "mouseleave",
      onTitleLeave
      //document.removeEventListener("keydown", ctrlDown /*, { once: true }*/);
    );
  }, 500);
}

function onTitleOver(e) {
  {
    isHover = true;
    setTimeout(async () => {
      if (!isHover) return;
      let tooltip = document.createElement("span");
      e.target.style.position = "relative";
      tooltip.classList.add("tooltiptext");
      let prevTooltip = e.target.querySelector(".tooltiptext");
      prevTooltip ? (tooltip = prevTooltip) : e.target.appendChild(tooltip);
      let pageUid;
      if (e.target.classList.contains("page")) {
        pageUid = await getPageUidByTitle(e.target.innerText);
      }
      tooltip.innerText = await infoPage(pageUid);
    }, 450);
    //document.addEventListener("keydown", ctrlDown /*, { once: true }*/);
  }
}

function onTitleLeave() {
  isHover = false;
}

export function shortcutsListener() {
  let shortcuts = document.querySelectorAll(".page");
  shortcuts.forEach((s) => {
    s.addEventListener("mouseenter", onTitleOver);
    s.addEventListener("mouseleave", onTitleLeave);
  });
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
    let uid = parent.querySelector(".roam-block")?.id.slice(-9);
    if (!uid) uid = parent.querySelector("textarea").id.slice(-9);
    const tooltip = document.querySelector(".rm-bullet__tooltip");
    let users = getUser(uid);

    tooltip.innerText = ""; // + getFormatedUserName(uid);
    tooltip.innerText += getFormatedDateStrings(uid, users);
    tooltip.innerText += getFormatedChildrenStats(uid);
  }
}

export async function infoPage(pageUid) {
  if (!pageUid) pageUid = await getMainPageUid();
  let users = getUser(pageUid);

  return `${getFormatedDateStrings(
    pageUid,
    users,
    "page"
  )}${getFormatedChildrenStats(pageUid, users, "page")}`;
}

import {
  addListeners,
  cleanExtensionPage,
  disconnectObserver,
  displayStreak,
  getInfoOnBlock,
  infoDailyPage,
  infoPage,
  onPageLoad,
  removeDailyLogListeners,
  removeListeners,
} from "./observers";
import { displayPageInfo, displayToast, displayTooltip } from "./components";
import { getMainPageUid, getPageTitleByUid, getPageUidByTitle } from "./utils";

export const EXTENSION_PAGE_UID = getExtensionPageUidOrCreateIt();
export var tooltipOff;
export var displayEditName;
export var displayDates;
export var dateFormat;
var localDate;
export var timeFormat;
export var localDateFormat;
export var displayChildren;
export var displayChar;
export var displayWord;
export var displayTODO;
export var modeTODO;
export var displayPOMO;
export var displayShortcutInfo;
export var nbDaysBefore;
export var tooltipDelay;
export var displayREFS;
export var displayStreakRender;
export var monthsInStreak;
export var fontSize;

function getExtensionPageUidOrCreateIt() {
  let createWarningMessage = true;
  let pageUid = getPageUidByTitle("roam/depot/page & block info");
  if (pageUid === null) {
    pageUid = window.roamAlphaAPI.util.generateUID();
    window.roamAlphaAPI.createPage({
      page: { title: "roam/depot/page & block info", uid: pageUid },
    });
  }
  createWarningMessage = cleanExtensionPage();
  if (createWarningMessage)
    window.roamAlphaAPI.createBlock({
      location: { "parent-uid": pageUid, order: 0 },
      block: {
        string:
          "⚠️ Doesn't write anything on this page, all content will be deleted on each streak view in page info.",
      },
    });
  return pageUid;
}

function getModeTodo(mode) {
  switch (mode) {
    case "(50%)":
      return "percent";
    case "🟩🟩🟩□□□":
      return "green squares";
  }
}

function getFontSize(size) {
  switch (size) {
    case "Extra small":
      return "pbi-fs-11";
    case "Small":
      return "pbi-fs-12";
    case "Large":
      return "pbi-fs-14";
    case "Theme default":
      return "pbi-fs-theme";
    default:
      return "";
  }
}

async function setTooltipState(state) {
  switch (state) {
    case "Disable all":
      tooltipOff = true;
      break;
    case "Disable for shortcuts":
      tooltipOff = false;
      displayShortcutInfo = false;
      // removeShortcutsListeners();
      break;
    case "Enable all":
      tooltipOff = false;
      displayShortcutInfo = true;
  }
  await toggleListenersForTooltips(false);
}

async function toggleListenersForTooltips(firstTime) {
  // No tooltip and listeners on mobile
  if (
    !tooltipOff &&
    !window.roamAlphaAPI.platform.isMobile &&
    !window.roamAlphaAPI.platform.isMobileApp
  ) {
    onPageLoad();
    addListeners();
  }
  if (tooltipOff && !firstTime) {
    // removeListeners();
    disconnectObserver("tooltips");
    disconnectObserver("logs");
    // removeDailyLogListeners();
  }
}

const panelConfig = {
  tabTitle: "Blocks infos",
  settings: [
    {
      id: "toggleTooltips",
      name: "Toggle tooltips",
      description: "Enable tooltips on hover:",
      action: {
        type: "select",
        items: ["Enable all", "Disable for shortcuts", "Disable all"],
        onChange: async (evt) => {
          await setTooltipState(evt);
        },
      },
    },
    {
      id: "delay",
      name: "Tooltip display delay",
      description: "Delay before the tooltip is displayed on hover (in ms):",
      action: {
        type: "input",
        onChange: (evt) => {
          tooltipDelay = evt.target.value;
        },
      },
    },
    {
      id: "fontSize",
      name: "Font size",
      description: "Font size in tooltip (Medium = 13px):",
      action: {
        type: "select",
        items: ["Theme default", "Extra small", "Small", "Medium", "Large"],
        onChange: (evt) => {
          fontSize = getFontSize(evt);
        },
      },
    },
    {
      id: "displayName",
      name: "User Name",
      description: "Display the name of the last user who updated the block",
      action: {
        type: "switch",
        onChange: (evt) => {
          displayEditName = !displayEditName;
        },
      },
    },
    {
      id: "displayDates",
      name: "Dates",
      description: "Display creation and, if different, update dates:",
      action: {
        type: "select",
        items: ["All", "Not for shortcuts", "Not for pages", "None"],
        onChange: (evt) => {
          switch (evt) {
            case "All":
              displayDates = "All";
              return;
            case "Not for shortcuts":
              displayDates = "Not for shortcuts";
              return;
            case "Not for pages":
              displayDates = "Not for pages";
              return;
            case "None":
              displayDates = "None";
              return;
          }
        },
      },
    },
    {
      id: "dateFormat",
      name: "Date format",
      description: "Select how dates are displayed",
      action: {
        type: "select",
        items: ["short", "medium", "long", "full"],
        onChange: (evt) => {
          dateFormat = evt;
        },
      },
    },
    {
      id: "localDate",
      name: "Local date format",
      description:
        "Display the dates in the local format if enabled, or default en-US",
      action: {
        type: "switch",
        onChange: (evt) => {
          localDate = !localDate;
          localDate
            ? (localDateFormat = undefined)
            : (localDateFormat = "en-US");
        },
      },
    },
    {
      id: "timeFormat",
      name: "Time format",
      description: "Select how time is displayed",
      action: {
        type: "select",
        items: [
          "HH:MM:SS",
          "HH:MM:SS AM/PM",
          "HH:MM",
          "HH:MM AM/PM",
          "~H AM/PM",
        ],
        onChange: (evt) => {
          timeFormat = evt;
        },
      },
    },
    {
      id: "displayChildren",
      name: "Children count",
      description: "Display children or blocks in page count:",
      action: {
        type: "switch",
        onChange: (evt) => {
          displayChildren = !displayChildren;
        },
      },
    },
    {
      id: "displayCharacters",
      name: "Character count",
      description: "Display character count:",
      action: {
        type: "switch",
        onChange: (evt) => {
          displayChar = !displayChar;
        },
      },
    },
    {
      id: "displayWords",
      name: "Word count",
      description: "Display word count:",
      action: {
        type: "switch",
        onChange: (evt) => {
          displayWord = !displayWord;
        },
      },
    },
    {
      id: "displayTODO",
      name: "TODO count",
      description: "Display DONE/TODO ratio in children:",
      action: {
        type: "switch",
        onChange: (evt) => {
          displayTODO = !displayTODO;
        },
      },
    },
    {
      id: "modeTODO",
      name: "DONE/TODO percentage",
      description: "DONE/TODO percentage display mode (example):",
      action: {
        type: "select",
        items: ["(50%)", "🟩🟩🟩□□□"],
        onChange: (evt) => {
          modeTODO = getModeTodo(evt);
        },
      },
    },
    {
      id: "displayPOMO",
      name: "[[POMO]] count",
      description: "Display Pomodoros count in children:",
      action: {
        type: "switch",
        onChange: (evt) => {
          displayPOMO = !displayPOMO;
        },
      },
    },
    {
      id: "displayREFS",
      name: "References count",
      description: "Display linked reference count and last update date:",
      action: {
        type: "switch",
        onChange: (evt) => {
          displayREFS = !displayREFS;
        },
      },
    },
    {
      id: "displayStreak",
      name: "Display streak",
      description:
        "Display streak (heatmap) about the page whose title or shortcut is hovered over:",
      action: {
        type: "switch",
        onChange: (evt) => {
          displayStreakRender = !displayStreakRender;
        },
      },
    },
    {
      id: "monthsInStreak",
      name: "How many months in streak ?",
      description:
        "Number of months to display in streak (heatmap) by hovering over the page title:",
      action: {
        type: "select",
        items: ["1", "2", "3", "4", "6", "Maximum"],
        onChange: (evt) => {
          evt === "Maximum"
            ? (monthsInStreak = undefined)
            : (monthsInStreak = parseInt(evt));
        },
      },
    },
    {
      id: "nbDaysBefore",
      name: "Number of Daily Notes",
      description:
        "Display stats of how many previous days when hovering 'Daily Notes':",
      action: {
        type: "select",
        items: ["None", "1", "2", "3", "4", "5", "6"],
        onChange: (evt) => {
          nbDaysBefore = parseInt(evt);
        },
      },
    },
  ],
};

export default {
  onload: async ({ extensionAPI }) => {
    if (extensionAPI.settings.get("toggleTooltips") === null)
      await extensionAPI.settings.set("toggleTooltips", "Enable all");
    await setTooltipState(extensionAPI.settings.get("toggleTooltips"));
    if (extensionAPI.settings.get("displayName") === null)
      await extensionAPI.settings.set("displayName", false);
    displayEditName = extensionAPI.settings.get("displayName");
    if (extensionAPI.settings.get("displayDates") === null)
      await extensionAPI.settings.set("displayDates", "All");
    displayDates = extensionAPI.settings.get("displayDates");
    if (extensionAPI.settings.get("dateFormat") === null)
      await extensionAPI.settings.set("dateFormat", "short");
    dateFormat = extensionAPI.settings.get("dateFormat");
    if (extensionAPI.settings.get("localDate") === null)
      await extensionAPI.settings.set("localDate", true);
    localDate = extensionAPI.settings.get("localDate")
      ? (localDateFormat = undefined)
      : (localDateFormat = "en-US");
    if (extensionAPI.settings.get("timeFormat") === null)
      await extensionAPI.settings.set("timeFormat", "HH:MM");
    timeFormat = extensionAPI.settings.get("timeFormat");
    if (extensionAPI.settings.get("displayChildren") === null)
      await extensionAPI.settings.set("displayChildren", true);
    displayChildren = extensionAPI.settings.get("displayChildren");
    if (extensionAPI.settings.get("displayCharacters") === null)
      await extensionAPI.settings.set("displayCharacters", true);
    displayChar = extensionAPI.settings.get("displayCharacters");
    if (extensionAPI.settings.get("displayWords") === null)
      await extensionAPI.settings.set("displayWords", true);
    displayWord = extensionAPI.settings.get("displayWords");
    if (extensionAPI.settings.get("displayTODO") === null)
      await extensionAPI.settings.set("displayTODO", true);
    displayTODO = extensionAPI.settings.get("displayTODO");
    if (extensionAPI.settings.get("modeTODO") === null)
      await extensionAPI.settings.set("modeTODO", "🟩🟩🟩□□□");
    modeTODO = getModeTodo(extensionAPI.settings.get("modeTODO"));
    if (extensionAPI.settings.get("displayPOMO") === null)
      await extensionAPI.settings.set("displayPOMO", true);
    displayPOMO = extensionAPI.settings.get("displayPOMO");
    if (extensionAPI.settings.get("displayREFS") === null)
      await extensionAPI.settings.set("displayREFS", false);
    displayREFS = extensionAPI.settings.get("displayREFS");
    if (extensionAPI.settings.get("displayStreak") === null)
      await extensionAPI.settings.set("displayStreak", true);
    displayStreakRender = extensionAPI.settings.get("displayStreak");
    if (extensionAPI.settings.get("monthsInStreak") === null)
      await extensionAPI.settings.set("monthsInStreak", 2);
    extensionAPI.settings.get("monthsInStreak") == "Maximum"
      ? (monthsInStreak = undefined)
      : (monthsInStreak = extensionAPI.settings.get("monthsInStreak"));
    if (extensionAPI.settings.get("nbDaysBefore") === null)
      await extensionAPI.settings.set("nbDaysBefore", 2);
    nbDaysBefore = extensionAPI.settings.get("nbDaysBefore");
    if (extensionAPI.settings.get("delay") === null)
      await extensionAPI.settings.set("delay", 1000);
    tooltipDelay = extensionAPI.settings.get("delay");
    if (extensionAPI.settings.get("fontSize") === null)
      await extensionAPI.settings.set("fontSize", "Medium");
    fontSize = getFontSize(extensionAPI.settings.get("fontSize"));

    await extensionAPI.settings.panel.create(panelConfig);

    extensionAPI.ui.commandPalette.addCommand({
      label: "Block & Page Info: Get Page Info",
      callback: async () => {
        let pageUid = await getMainPageUid();
        let title = getPageTitleByUid(pageUid);
        displayPageInfo(await infoPage(pageUid, title, false, true), "Page");
        let dialog = document.querySelector(".bp3-dialog-body");
        let newNode = document.createElement("div");
        //newNode.innerHTML = "<br>";
        dialog.appendChild(newNode);
        displayStreak(pageUid, title, dialog);
      },
      "default-hotkey": "ctrl-alt-i",
    });

    extensionAPI.ui.commandPalette.addCommand({
      label: "Block & Page Info: Get Info on recent Daily Notes",
      callback: async () => {
        let pageUid = await window.roamAlphaAPI.util.dateToPageUid(new Date());
        displayPageInfo(await infoDailyPage(pageUid, pageUid));
      },
    });

    extensionAPI.ui.commandPalette.addCommand({
      label: "Block & Page Info: Toggle tooltips on hover",
      callback: () => {
        console.log(tooltipOff);
        tooltipOff
          ? setTooltipState("Enable all")
          : setTooltipState("Disable all");
      },
    });

    roamAlphaAPI.ui.blockContextMenu.addCommand({
      label: "Block Info",
      callback: (e) => {
        let block = document.querySelector(`[id$='${e["block-uid"]}']`);
        displayPageInfo(getInfoOnBlock(e["block-uid"], block), "Block");
      },
    });

    //toggleListenersForTooltips(true);

    console.log("Block Info extension loaded.");
    //return;
  },
  onunload: () => {
    tooltipOff = true;
    toggleListenersForTooltips(false);
    removeListeners();
    removeDailyLogListeners();

    console.log("Block Info extension unloaded");
  },
};

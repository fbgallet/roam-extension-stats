import {
  addListeners,
  addShortcutsListener,
  connectObservers,
  disconnectObserver,
  infoDailyPage,
  infoPage,
  onPageLoad,
  removeDailyLogListeners,
  removeListeners,
  removeShortcutsListeners,
} from "./observers";
import { displayPageInfo, displayToast, displayTooltip } from "./components";

export var displayEditName;
export var dateFormat;
var localDate;
export var timeFormat;
export var localDateFormat;
export var displayChar;
export var displayWord;
export var displayTODO;
export var modeTODO;
export var displayShortcutInfo;
export var nbDaysBefore;
export var tooltipDelay;
export var displayREFS;

function getModeTodo(mode) {
  switch (mode) {
    case "(50%)":
      return "percent";
    case "🟩🟩🟩□□□":
      return "green squares";
    default:
      return "percent";
  }
}

const panelConfig = {
  tabTitle: "Blocks infos",
  settings: [
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
      id: "displayShortcut",
      name: "Display Shortcuts Info",
      description:
        "Display page Info when hovering a page shortcut in the left sidebar:",
      action: {
        type: "switch",
        onChange: (evt) => {
          displayShortcutInfo = !displayShortcutInfo;
          displayShortcutInfo
            ? addShortcutsListener()
            : removeShortcutsListeners();
        },
      },
    },
    {
      id: "nbDaysBefore",
      name: "Number of days before",
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
    {
      id: "delay",
      name: "Tooltip display delay",
      description:
        "Delay before the tooltip is displayed when hovering over a page title/shortcut (in ms):",
      action: {
        type: "input",
        onChange: (evt) => {
          tooltipDelay = evt.target.value;
        },
      },
    },
  ],
};

export default {
  onload: async ({ extensionAPI }) => {
    if (extensionAPI.settings.get("displayName") === null)
      await extensionAPI.settings.set("displayName", false);
    displayEditName = extensionAPI.settings.get("displayName");
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
      await extensionAPI.settings.set("modeTODO", "(50%)");
    modeTODO = getModeTodo(extensionAPI.settings.get("modeTODO"));
    if (extensionAPI.settings.get("displayREFS") === null)
      await extensionAPI.settings.set("displayREFS", true);
    displayREFS = extensionAPI.settings.get("displayREFS");
    if (extensionAPI.settings.get("displayShortcut") === null)
      await extensionAPI.settings.set("displayShortcut", true);
    displayShortcutInfo = extensionAPI.settings.get("displayShortcut");
    if (extensionAPI.settings.get("nbDaysBefore") === null)
      await extensionAPI.settings.set("nbDaysBefore", 2);
    nbDaysBefore = extensionAPI.settings.get("nbDaysBefore");
    if (extensionAPI.settings.get("delay") === null)
      await extensionAPI.settings.set("delay", 800);
    tooltipDelay = extensionAPI.settings.get("delay");

    await extensionAPI.settings.panel.create(panelConfig);

    window.roamAlphaAPI.ui.commandPalette.addCommand({
      label: "Block & Page Info: Get Page Info",
      callback: async () => {
        displayPageInfo(await infoPage());
      },
    });

    window.roamAlphaAPI.ui.commandPalette.addCommand({
      label: "Block & Page Info: Get Info on recent Daily Notes",
      callback: async () => {
        let pageUid = await window.roamAlphaAPI.util.dateToPageUid(new Date());
        displayPageInfo(await infoDailyPage(pageUid, pageUid));
      },
    });

    // Add command to block context menu
    // roamAlphaAPI.ui.blockContextMenu.addCommand({
    //   label: "Color Highlighter: Remove color tags",
    //   "display-conditional": (e) => e["block-string"].includes("#c:"),
    //   callback: (e) => removeHighlightsFromBlock(e["block-uid"], removeOption),
    // });

    // Add SmartBlock command
    // const insertCmd = {
    //   text: "INSERTFOOTNOTE",
    //   help: "Insert automatically numbered footnote (requires the Footnotes extension)",
    //   handler: (context) => () => {
    //     noteInline = null;
    //     currentPos = new position();
    //     currentPos.s = context.currentContent.length;
    //     currentPos.e = currentPos.s;
    //     insertOrRemoveFootnote(context.targetUid);
    //     return "";
    //   },
    // };
    // if (window.roamjs?.extension?.smartblocks) {
    //   window.roamjs.extension.smartblocks.registerCommand(insertCmd);
    // } else {
    //   document.body.addEventListener(`roamjs:smartblocks:loaded`, () => {
    //     window.roamjs?.extension.smartblocks &&
    //       window.roamjs.extension.smartblocks.registerCommand(insertCmd);
    //   });
    // }

    onPageLoad();
    connectObservers();
    addListeners();

    console.log("Block Info extension loaded.");
    //return;
  },
  onunload: () => {
    disconnectObserver("tooltips");
    disconnectObserver("logs");
    removeListeners();
    removeDailyLogListeners();
    // window.roamAlphaAPI.ui.commandPalette.removeCommand({
    //   label: "Footnotes: Reorder footnotes on current page",
    // });

    // roamAlphaAPI.ui.blockContextMenu.removeCommand({
    //   label: "Color Highlighter: Remove color tags",
    // });
    console.log("Block Info extension unloaded");
  },
};

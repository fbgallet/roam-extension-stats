import {
  getBlockContentByUid,
  getTreeByUid,
  processNotesInTree,
} from "./utils";
import {
  addObserver,
  disconnectObserver,
  infoPage,
  infoTooltip,
} from "./observers";
import getPageTitleByBlockUid from "roamjs-components/queries/getPageTitleByBlockUid";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import normalizePageTitle from "roamjs-components/queries/normalizePageTitle";
import { displayToast, displayTooltip } from "./components";

export var displayEditName;
export var dateFormat;
var localDate;
export var localDateFormat;
export var displayChar;
export var displayWord;
export var displayTODO;
export var modeTODO;

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
    // INPUT example
    // {
    //   id: "footnotesHeader",
    //   name: "Footnotes header",
    //   description: "Text inserted as the parent block of footnotes:",
    //   action: {
    //     type: "input",
    //     onChange: (evt) => {
    //       //   footnotesTag = evt.target.value;
    //     },
    //   },
    // },
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
      description: "Select the way dates are displayed",
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
  ],
};

export default {
  onload: async ({ extensionAPI }) => {
    if (extensionAPI.settings.get("displayName") === null)
      await extensionAPI.settings.set("displayName", true);
    displayEditName = extensionAPI.settings.get("displayName");
    if (extensionAPI.settings.get("dateFormat") === null)
      await extensionAPI.settings.set("dateFormat", "short");
    dateFormat = extensionAPI.settings.get("dateFormat");
    if (extensionAPI.settings.get("localDate") === null)
      await extensionAPI.settings.set("localDate", true);
    localDateFormat = extensionAPI.settings.get("localDate")
      ? (localDateFormat = undefined)
      : (localDateFormat = "en-US");
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

    extensionAPI.settings.panel.create(panelConfig);

    window.roamAlphaAPI.ui.commandPalette.addCommand({
      label: "Get Page Info",
      callback: async () => {
        displayToast(await infoPage());
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

    addObserver(document.getElementsByClassName("roam-app")[0], infoTooltip, {
      childList: false,
      subtree: true,
      attributeFilter: ["class"],
    });
    let pageTitle = document.querySelector(".rm-title-display");

    let isHover = false;

    pageTitle.addEventListener("mouseleave", () => {
      isHover = false;
      //document.removeEventListener("keydown", ctrlDown /*, { once: true }*/);
    });

    pageTitle.addEventListener("mouseover", async () => {
      isHover = true;
      setTimeout(async () => {
        if (!isHover) return;
        let tooltip = document.createElement("span");
        pageTitle.style.position = "relative";
        tooltip.classList.add("tooltiptext");
        let prevTooltip = pageTitle.querySelector(".tooltiptext");
        prevTooltip ? (tooltip = prevTooltip) : pageTitle.appendChild(tooltip); // idem
        tooltip.innerText = await infoPage();
        console.log("DONE!");
      }, 450);
      //document.addEventListener("keydown", ctrlDown /*, { once: true }*/);
    });

    console.log("Block Info extension loaded.");
    //return;
  },
  onunload: () => {
    disconnectObserver();
    let pageTitle = document.querySelector(".rm-title-display");
    pageTitle.removeEventListener("mouseover", () => {});
    // window.roamAlphaAPI.ui.commandPalette.removeCommand({
    //   label: "Footnotes: Reorder footnotes on current page",
    // });

    // roamAlphaAPI.ui.blockContextMenu.removeCommand({
    //   label: "Color Highlighter: Remove color tags",
    // });
    console.log("Block Info extension unloaded");
  },
};
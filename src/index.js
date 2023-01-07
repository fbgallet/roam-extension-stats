import {
  getBlockContentByUid,
  getTreeByUid,
  processNotesInTree,
} from "./utils";
import { addObserver, disconnectObserver, infoTooltip } from "./observers";
import getPageTitleByBlockUid from "roamjs-components/queries/getPageTitleByBlockUid";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import normalizePageTitle from "roamjs-components/queries/normalizePageTitle";

export var displayChar;
export var displayWord;
export var displayTODO;
export var modeTODO;

function getModeTodo(mode) {
  switch (mode) {
    case "(50%)":
      return "percent";
      break;
    case "🟩🟩🟩□□□":
      return "green squares";
      break;
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
      name: "Count TODO",
      description: "Display count DONE/TODO ratio in children:",
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
      description: "DONE/TODO percentage display mode:",
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
    extensionAPI.settings.panel.create(panelConfig);

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
      await extensionAPI.settings.set("modeTODO", "percent");
    modeTODO = getModeTodo(extensionAPI.settings.get("modeTODO"));

    // Add command to command palette
    //   window.roamAlphaAPI.ui.commandPalette.addCommand({
    //   label: "Insert footnote",
    //   callback: () => {
    //     //        let position = document.activeElement.selectionStart;
    //     //        console.log(position);
    //     let startUid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
    //     if (startUid) insertFootNote(startUid);
    //   },
    // });

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

    console.log("Extension loaded.");
    //return;
  },
  onunload: () => {
    disconnectObserver();

    // window.roamAlphaAPI.ui.commandPalette.removeCommand({
    //   label: "Footnotes: Reorder footnotes on current page",
    // });

    // roamAlphaAPI.ui.blockContextMenu.removeCommand({
    //   label: "Color Highlighter: Remove color tags",
    // });
    console.log("Extension unloaded");
  },
};

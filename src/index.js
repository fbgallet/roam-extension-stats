import {
  getBlockContentByUid,
  getTreeByUid,
  processNotesInTree,
} from "./utils";
import { addObserver, disconnectObserver, infoTooltip } from "./observers";
import getPageTitleByBlockUid from "roamjs-components/queries/getPageTitleByBlockUid";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import normalizePageTitle from "roamjs-components/queries/normalizePageTitle";

const panelConfig = {
  tabTitle: "___",
  settings: [
    // INPUT example
    {
      id: "footnotesHeader",
      name: "Footnotes header",
      description: "Text inserted as the parent block of footnotes:",
      action: {
        type: "input",
        onChange: (evt) => {
          //   footnotesTag = evt.target.value;
        },
      },
    },
    // SWITCH example
    {
      id: "insertLine",
      name: "Insert a line above footnotes header",
      description:
        "Insert a block drawing a line just above the footnotes header, at the bottom of the page:",
      action: {
        type: "switch",
        onChange: (evt) => {
          // insertLineBeforeFootnotes = !insertLineBeforeFootnotes;
        },
      },
    },
    // SELECT example
    {
      id: "hotkeys",
      name: "Hotkeys",
      description: "Hotkeys to insert/delete footnote",
      action: {
        type: "select",
        items: ["Ctrl + Alt + F", "Ctrl + Shift + F"],
        onChange: (evt) => {
          // secondHotkey = getHotkeys(evt);
        },
      },
    },
  ],
};

export default {
  onload: ({ extensionAPI }) => {
    extensionAPI.settings.panel.create(panelConfig);

    // get settings from setting panel
    // if (extensionAPI.settings.get("footnotesHeader") === null)
    //   extensionAPI.settings.set("footnotesHeader", "#footnotes");
    // footnotesTag = extensionAPI.settings.get("footnotesHeader");

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

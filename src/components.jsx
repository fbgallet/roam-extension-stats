import React from "react";
import { useState } from "react";
import FormDialog from "roamjs-components/components/FormDialog";
import renderOverlay from "roamjs-components/util/renderOverlay";
import { cleanExtensionPage, deleteStreakBlock } from "./observers";

let typeElt;

const Dialog = () => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <>
      <FormDialog
        isOpen={isOpen}
        title={`${typeElt} info`}
        onClose={() => {
          setIsOpen(false);
          //deleteStreakBlock();
          cleanExtensionPage();
        }}
      />
    </>
  );
};

export async function displayPageInfo(infos, type, title = "") {
  title !== "" ? (typeElt = `[[${title}]] page `) : (typeElt = type);
  renderOverlay({
    Overlay: Dialog,
  });

  let dialog = document.querySelector(
    ".bp3-dialog:not(.rm-modal-dialog--command-palette):not(.rm-extensions-marketplace-dialog)"
  );
  dialog.style.width = "auto";
  dialog.style.position = "absolute";
  //dialog.style.top = "200px";
  //dialog.style.color = "#000000";
  let body = dialog.querySelector(".bp3-dialog-body");
  body.style.lineHeight = "1.5";
  body.innerText = infos;
  let footer = dialog.querySelector(".bp3-dialog-footer");
  footer.style.display = "none";
}

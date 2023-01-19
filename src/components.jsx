import React from "react";
import { useState } from "react";
import FormDialog from "roamjs-components/components/FormDialog";
import renderOverlay from "roamjs-components/util/renderOverlay";

const Dialog = () => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <>
      <FormDialog
        isOpen={isOpen}
        title={"Page info"}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};

export async function displayPageInfo(infos) {
  const parent = document.createElement("div");
  let t = document.querySelector(".rm-title-display");
  t.parentElement.appendChild(parent);
  parent.style.height = "0";
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
  body.innerText = infos;
  let footer = dialog.querySelector(".bp3-dialog-footer");
  footer.style.display = "none";
}

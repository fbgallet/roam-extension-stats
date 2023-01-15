import {
  Alert,
  Button,
  Popover,
  Position,
  Tooltip,
  Toaster,
} from "@blueprintjs/core";
import React from "react";
import "@blueprintjs/core/lib/css/blueprint.css";
import { useState } from "react";
import ReactDOM from "react-dom";
import FormDialog from "roamjs-components/components/FormDialog";
import renderOverlay from "roamjs-components/util/renderOverlay";

var infoPageJSX;

/** Singleton toaster instance. Create separate instances for different options. */
const AppToaster = Toaster.create({
  className: "my_toaster",
  position: Position.TOP,
  maxToasts: 1,
});

const Dialog = () => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <>
      <FormDialog
        isOpen={isOpen}
        title={"Page info"}
        onClose={() => setIsOpen(false)}
        // onSubmit={() => navigator.clipboard.writeText(textToCopy)}
        //content={infoPageJSX}
      />
    </>
  );
};

function myToast() {
  return <Toast message="Test<br>Deuxième ligne" />;
}

export function displayTooltip(t) {
  console.log("hello 2!");
  const parent = document.createElement("div");
  t.parentElement.appendChild(parent);
  //parent.style.height = "0";
  console.log(parent);
  ReactDOM.render(<myTooltip />, parent);
}
export async function displayToast(infos) {
  //AppToaster.show({ message: message, timeout: 3000 });

  //infoPageJSX = infos;

  const parent = document.createElement("div");
  let t = document.querySelector(".rm-title-display");
  t.parentElement.appendChild(parent);
  parent.style.height = "0";
  //ReactDOM.render(<Dialog />, parent);
  renderOverlay({
    Overlay: Dialog,
  });

  let dialog = document.querySelector(
    ".bp3-dialog:not(.rm-modal-dialog--command-palette)"
  );
  dialog.style.width = "auto";
  dialog.style.position = "absolute";
  //dialog.style.top = "200px";
  //dialog.style.color = "#000000";
  let body = dialog.querySelector(".bp3-dialog-body");
  body.innerText = infos;
  let footer = dialog.querySelector(".bp3-dialog-footer");
  footer.style.display = "none";

  // let cancelButton = dialog.querySelector(".bp3-button-text");
  // console.log(cancelButton);
  // //cancelButton.firstParent.style.display = "none";
  // let submitButton = dialog.querySelector(".bp3-button.bp3-intent-primary");
  // submitButton.style.display = "none";
}

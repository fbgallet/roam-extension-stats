import React from "react";
import { Dialog, Classes, Button } from "@blueprintjs/core";
import ReactDOM from "react-dom";
import StreakDisplay from "./StreakDisplay";
import { getMainPageUid, getPageTitleByUid } from "../utils";
import { infoPage } from "../observers";

let containerDiv = null;

const InfoDialogComponent = ({
  isOpen,
  title,
  content,
  onClose,
  showStreak = false,
  pageUid = null,
  pageTitle = null,
  maxMonths = undefined,
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      className="pbi-dialog"
      canOutsideClickClose={true}
      canEscapeKeyClose={true}
    >
      <div className={`${Classes.DIALOG_BODY} pbi-dialog-body`}>
        {content}
        {showStreak && pageUid && pageTitle && (
          <StreakDisplay
            pageUid={pageUid}
            title={pageTitle}
            maxMonths={maxMonths}
          />
        )}
      </div>
      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Dialog>
  );
};

export function displayPageInfo(infos, type, title = "", options = {}) {
  const { showStreak = false, pageUid = null, maxMonths = undefined } = options;
  const dialogTitle = title !== "" ? `[[${title}]] page ` : type;
  const fullTitle = `${dialogTitle} info`;

  // Create container if it doesn't exist
  if (!containerDiv) {
    containerDiv = document.createElement("div");
    containerDiv.id = "info-dialog-container";
    document.body.appendChild(containerDiv);
  }

  const handleClose = () => {
    if (containerDiv) {
      ReactDOM.unmountComponentAtNode(containerDiv);
    }
  };

  // Render the dialog
  ReactDOM.render(
    <InfoDialogComponent
      isOpen={true}
      title={fullTitle}
      content={infos}
      onClose={handleClose}
      showStreak={showStreak}
      pageUid={pageUid}
      pageTitle={title}
      maxMonths={maxMonths}
    />,
    containerDiv
  );
}

export async function displayMainPageInfoDialog() {
  let pageUid = await getMainPageUid();
  let title = getPageTitleByUid(pageUid);
  displayPageInfo(await infoPage(pageUid, title, false, true), "Page", title, {
    showStreak: true,
    pageUid: pageUid,
  });
}

export default InfoDialogComponent;

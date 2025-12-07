import React from "react";
import { Dialog, Classes, Button } from "@blueprintjs/core";
import ReactDOM from "react-dom";
import StreakDisplay from "./StreakDisplay";
import BlockLink from "./BlockLink";
import { getMainPageUid, getPageTitleByUid } from "../utils";
import { infoPage } from "../observers";

let containerDiv = null;

// Simple markdown-like formatter for **bold** text and block links
const formatContent = (text) => {
  if (!text) return text;

  const parts = [];
  const lines = text.split("\n");

  lines.forEach((line, lineIndex) => {
    const segments = [];
    let lastIndex = 0;
    // Match **bold** and [[blocklink:uid:text]]
    const combinedRegex = /\*\*(.*?)\*\*|\[\[blocklink:(.*?):(.*?)\]\]/g;
    let match;

    while ((match = combinedRegex.exec(line)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        segments.push(
          <span key={`text-${lineIndex}-${lastIndex}`}>
            {line.substring(lastIndex, match.index)}
          </span>
        );
      }

      if (match[1] !== undefined) {
        // Bold text
        segments.push(
          <strong key={`bold-${lineIndex}-${match.index}`}>{match[1]}</strong>
        );
      } else if (match[2] !== undefined && match[3] !== undefined) {
        // Block link
        segments.push(
          <BlockLink
            key={`blocklink-${lineIndex}-${match.index}`}
            blockUid={match[2]}
          >
            {match[3]}
          </BlockLink>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < line.length) {
      segments.push(
        <span key={`text-${lineIndex}-${lastIndex}`}>
          {line.substring(lastIndex)}
        </span>
      );
    }

    parts.push(
      <React.Fragment key={`line-${lineIndex}`}>
        {segments.length > 0 ? segments : line}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });

  return parts;
};

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
        {formatContent(content)}
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

export async function displayMainPageInfoDialog(pageUid) {
  if (!pageUid) pageUid = await getMainPageUid();
  let title = getPageTitleByUid(pageUid);
  displayPageInfo(await infoPage(pageUid, title, false, true), "Page", title, {
    showStreak: true,
    pageUid: pageUid,
  });
}

export default InfoDialogComponent;

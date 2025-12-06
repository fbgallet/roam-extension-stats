import React, { useEffect, useRef } from "react";

const StreakDisplay = ({ pageUid, title, maxMonths }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const renderStreak = async () => {
      const newNode = document.createElement("span");
      containerRef.current.appendChild(newNode);

      await window.roamAlphaAPI.ui.components.renderString({
        string: `{{streak: [[${title}]]}}`,
        el: newNode,
      });

      // Style adjustments
      const controls = containerRef.current.querySelector(".rm-block__controls");
      if (controls) controls.style.display = "none";

      const streakTitle = containerRef.current.querySelector(".rm-streak__title");
      if (streakTitle) streakTitle.style.display = "none";

      const main = containerRef.current.querySelector(".rm-block-main");
      if (main && main.lastChild) main.lastChild.style.minWidth = "0";

      let recentMention = false;
      let oldMention = false;
      let oldMentionDate;

      const streak = containerRef.current.querySelector(".rm-streak");
      if (streak) streak.style.visibility = "hidden";

      const months = containerRef.current.querySelectorAll(".rm-streak__month");
      const days = containerRef.current.querySelectorAll(".rm-streak__day");
      let columnNb;

      if (maxMonths) {
        const actualMaxMonths = months.length < maxMonths ? months.length : maxMonths;
        columnNb = actualMaxMonths * 4 + 1;

        for (let i = months.length - 1; i >= 0; i--) {
          if (i < months.length - actualMaxMonths) {
            months[i].style.display = "none";
          } else {
            let rightShift = 0;
            const dayOfMonth = new Date().getDate();
            if (dayOfMonth < 12) rightShift = 2;
            else if (dayOfMonth < 24) rightShift = 1;
            months[i].style.gridColumnStart =
              (i - (months.length - actualMaxMonths - 1)) * 4 + rightShift;
          }
        }

        const weeksToRemove = Math.floor((days.length - 28 * actualMaxMonths) / 7) - 1;
        const lastDayNb = parseInt(days[days.length - 1].style.gridRowStart) - 1;
        const daysToDisplay = 28 * actualMaxMonths + lastDayNb;

        for (let i = days.length - 1; i >= 0; i--) {
          if (i < days.length - daysToDisplay) {
            days[i].style.display = "none";
            if (
              !oldMention &&
              !days[i].getAttribute("title").includes(" 0 times")
            ) {
              oldMention = true;
              oldMentionDate = days[i].getAttribute("title").split(":")[0];
            }
          } else {
            days[i].style.gridColumnStart -= weeksToRemove;
            if (
              !recentMention &&
              !days[i].getAttribute("title").includes(" 0 times")
            ) {
              recentMention = true;
            }
          }
        }
      } else {
        columnNb = days[days.length - 1].style.gridColumnStart - 1;
        recentMention = true;
      }

      columnNb = columnNb.toString();
      const grid = containerRef.current.querySelector(".rm-streak__grid");
      if (grid) {
        grid.style.gridTemplateColumns = `max-content repeat(${columnNb}, 12px)`;
      }

      if (!recentMention) {
        const textNode = document.createTextNode(
          `Streak:\nNo mention last ${actualMaxMonths} mths` +
          (oldMention ? `\nLast mention: ${oldMentionDate.slice(4)}` : "")
        );
        containerRef.current.insertBefore(textNode, newNode);
      } else if (streak) {
        streak.style.visibility = "visible";
      }
    };

    renderStreak();
  }, [pageUid, title, maxMonths]);

  return <div ref={containerRef} className="pbi-streak-container" />;
};

export default StreakDisplay;
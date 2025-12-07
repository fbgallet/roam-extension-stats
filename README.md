# Block & Page Info

### Get a quick overview of useful informations on any block, page or DNP and their children, in a small tooltip (replacing the native one for blocks) or more details in a popup. See characters/words/sentences count, DONE/TODO count and ratio, Pomodoros, page streak, last update block in page and more

[See changelog here](https://github.com/fbgallet/roam-extension-stats/blob/main/CHANGELOG.md) for an overview of updates and new features 🆕

![block info v 4 1](https://user-images.githubusercontent.com/74436347/220415782-0a6084ac-8c19-4aa2-81a9-fd6890a2d335.gif)

### Tooltips

Just hover over any bullet, page title, page shortcut or 'Daily notes' in the left sidebar to see info and streak.

When hovering over 'Daily notes' in the left sidebar, see info for today and up to 6 days before.

### Commands

`/Block Info` slash command (🆕 new in v.6): just type `/info + Enter` to display in a popup detailed info about the current block and its children. It can also be triggered via block context menu or block reference context menu.

`Display Page Info` via page title context menu or page reference context menu: display in a popup detailed info about the current page and linked references.

Three commands in the **command palette** (open with `Cmd/Ctrl-p`) with customizable hotkeys:

- `Display page info` (default hotkeys: `Ctrl-Alt-i`) : display in a popup detailed info and the complete streak for current page,
- `Display info on recent Daily Notes`,
- `Toggle tooltips on hover`: you can disable tooltips if you find them annoying.

### Available Info

Info between brackets are optional:

- Creation Date and time (customizable format)
  - by [user]
- Last update date and time (of the block or, for page info, of the last updated block in the page) (hidden if same as previous one)
  - by [user] (hidden if same as previous one)
- [Character (c)], [word (w)] and [sentence (s)] count in current block (block references and embed content included in count)
- [Children blocks] count, [Character], [word] and [sentence] count in children blocks, block ref and embeds included
- [Reading time (250 words/min)]
- [DONE/TODO ratio] and percentage (or progress bar with 6 boxes: "🟩🟩🟩□□□" means more that 50%, less than 66%)
- [Pomodoros count] (up to 6 tomatoes 🍅 displayed, beyond that you have to rely on the number)
- [Linked references count]
  - Date of the first linked reference
  - Date of the last update of a linked reference
- [Streak], i.e. heatmap about mention of the given page on Daily Notes

![image](https://user-images.githubusercontent.com/74436347/220786868-7499dd2f-bbb9-4918-916d-779b6c815aff.png)

---

Do you think other information could be useful? Don't hesitate to let me know, via a DM or an issue on Github (see below)!

---

## If you want to support my work

If you want to encourage me to develop further and enhance Roam extensions, you can [buy me a coffee ☕ here](https://buymeacoffee.com/fbgallet) or [sponsor me on Github](https://github.com/sponsors/fbgallet). Thanks in advance for your support! 🙏

For any question or suggestion, DM me on **X/Twitter** and follow me to be informed of updates and new extensions : [@fbgallet](https://x.com/fbgallet), or on Bluesky: [@fbgallet.bsky.social](https://bsky.app/profile/fbgallet.bsky.social)

Please report any issue [here](https://github.com/fbgallet/roam-extension-stats/issues).

# Block & Page Info v.4

### Get a quick overview of useful informations on any block, page or DNP and their children, in a small tooltip.

Update to v.4: February 23rd, 2023. See [changelog here](https://github.com/fbgallet/roam-extension-stats/blob/main/CHANGELOG.md) for an overview of updates and new features 🆕

![block info v 4 1](https://user-images.githubusercontent.com/74436347/220415782-0a6084ac-8c19-4aa2-81a9-fd6890a2d335.gif)


### Tooltips
Just hover over any bullet, page title, page shortcut or 'Daily notes' in the left sidebar to see the selected info.
When hovering over 'Daily notes' in the left sidebar, see info for today and up to 6 days before (🆕 new in v.3). 

You can also press `Ctrl or Cmd` when hovering over a page title (or shortcut) to see detailed info in a popup. (🆕 new in v.4)

### Commands
Three commands in the command palette:
- 'Get page info' (default hotkeys: `Ctrl-Alt-i`) : display in a popup detailed info and the complete streak for current page,
- 'Get info on recent Daily Notes',
- 'Toggle tooltips on hover': you can disable tooltips if you find them annoying. You can still see page info on over if you press `Ctrl or Cmd` (🆕 new in v.4).

A command in block contextual menu:
- 'Block info': useful if you have disabled tooltips. (🆕 new in v.4)

### Available Info
Info between brackets are optional:
- Creation Date and time (customizable format)
  - by [user]
- Last update date and time (of the block or, for page info, of the last updated block in the page) (hidden if same as previous one)
  - by [user] (hidden if same as previous one)
- [Character] and [word] count in current block (block references content included in count)
- [Children blocks] count, [Character] and [word] count in children blocks
- [DONE/TODO ratio] and percentage (or progress bar with 6 boxes: "🟩🟩🟩□□□" means more that 50%, less than 66%)
- [Linked references count] (🆕 new in v.3)
  - Date of the last update of a linked reference
- [Streak], i.e. heatmap about mention of the given page on Daily Notes (🆕 new in v.4)

![image](https://user-images.githubusercontent.com/74436347/220786868-7499dd2f-bbb9-4918-916d-779b6c815aff.png)

---
Do you think other information could be useful? Don't hesitate to let me know!

Future possible developments:

- tooltip for other elements like dates in the calendar ?
- info on referenes in the page and linked references ?

---

### For any question or suggestion, DM me on **Twitter** and follow me to be informed of updates and new extensions : [@fbgallet](https://twitter.com/fbgallet).
To report some issue, follow [this link (Github)](https://github.com/fbgallet/roam-extension-stats/issues) and click on 'New issue'. 

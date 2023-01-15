export const uidRegex = /\(\([^\)]{9}\)\)/g;
export const pageRegex = /\[\[.*\]\]/g; // very simplified, not recursive...

export function getTreeByUid(uid) {
  if (uid)
    return window.roamAlphaAPI.q(`[:find (pull ?page
                     [:block/uid :block/string :block/children :block/refs :edit/time
                        {:block/children ...} ])
                      :where [?page :block/uid "${uid}"]  ]`)[0][0];
  else return null;
}

export function getBlockContentByUid(uid) {
  let result = window.roamAlphaAPI.pull("[:block/string]", [":block/uid", uid]);
  if (result) return result[":block/string"];
  else return "";
}

export async function getTopOrActiveBlockUid() {
  let currentBlockUid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
  if (currentBlockUid) return currentBlockUid;
  else {
    let uid = await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();
    return getFirstChildUid(uid);
  }
}

export async function getMainPageUid() {
  let uid = await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();
  let pageUid = window.roamAlphaAPI.pull("[{:block/page [:block/uid]}]", [
    ":block/uid",
    uid,
  ]);
  if (pageUid === null) return uid;
  return pageUid[":block/page"][":block/uid"];
}

function getFirstChildUid(uid) {
  let q = `[:find (pull ?c
                       [:block/uid :block/children {:block/children ...}])
                    :where [?c :block/uid "${uid}"]  ]`;
  return window.roamAlphaAPI.q(q)[0][0].children[0].uid;
}

export function getUser(uid) {
  return window.roamAlphaAPI.pull(
    "[{:edit/user [{:user/display-page [:node/title]}]}]",
    [
      //[:user/display-page]
      ":block/uid",
      uid,
    ]
  )[":edit/user"][":user/display-page"][":node/title"];
}

export function getBlockTimes(uid) {
  let times = window.roamAlphaAPI.pull("[:create/time :edit/time]", [
    ":block/uid",
    uid,
  ]);
  return {
    create: times[":create/time"],
    update: times[":edit/time"],
  };
}

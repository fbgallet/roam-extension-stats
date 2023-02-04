export const uidRegex = /\(\([^\)]{9}\)\)/g;
export const pageRegex = /\[\[.*\]\]/g; // very simplified, not recursive...

export function getTreeByUid(uid) {
  if (uid) {
    let result = window.roamAlphaAPI.q(`[:find (pull ?page
      [:block/uid :block/string :block/children :block/refs :edit/time
         {:block/children ...} ])
       :where [?page :block/uid "${uid}"]  ]`);
    if (result.length != 0) return result[0][0];
    else return null;
  } else return null;
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

export function getPageUidByTitle(title) {
  let result = window.roamAlphaAPI.pull("[:block/uid]", [":node/title", title]);
  if (result) return result[":block/uid"];
  else return null;
}

export function getBlocksIncludingRef(uid) {
  return window.roamAlphaAPI.q(
    `[:find ?u ?s
         :where [?r :block/uid ?u] 
              [?r :block/refs ?b]
                [?r :block/string ?s]
            [?b :block/uid "${uid}"]]`
  );
}

function getFirstChildUid(uid) {
  let q = `[:find (pull ?c
                       [:block/uid :block/children {:block/children ...}])
                    :where [?c :block/uid "${uid}"]  ]`;
  return window.roamAlphaAPI.q(q)[0][0].children[0].uid;
}

export function getUser(uid) {
  let result = window.roamAlphaAPI.pull(
    "[{:edit/user [{:user/display-page [:node/title]}]} {:create/user [{:user/display-page [:node/title]}]}]",
    [
      //[:user/display-page]
      ":block/uid",
      uid,
    ]
  );
  let editUser, createUser;
  if (!result) {
    editUser = "unknown user";
    createUser = "unknown user";
  } else {
    !result[":edit/user"]
      ? (editUser = "unknown user")
      : (editUser = result[":edit/user"][":user/display-page"][":node/title"]);
    !result[":create/user"]
      ? (editUser = "unknown user")
      : (createUser =
          result[":create/user"][":user/display-page"][":node/title"]);
  }
  return {
    editUser: editUser,
    createUser: createUser,
  };
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

export const resolveReferences = (content, uidsArray) => {
  if (uidRegex.test(content)) {
    uidRegex.lastIndex = 0;
    let matches = content.matchAll(uidRegex);
    for (const match of matches) {
      let refUid = match[0].slice(2, -2);
      let isNewRef = !uidsArray.includes(refUid);
      uidsArray.push(refUid);
      let resolvedRef = getBlockContentByUid(refUid);
      uidRegex.lastIndex = 0;
      if (uidRegex.test(resolvedRef) && isNewRef)
        resolvedRef = resolveReferences(resolvedRef, uidsArray);
      content = content.replace(match, resolvedRef);
    }
  }
  return content;
};

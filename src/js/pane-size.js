/* eslint-disable object-shorthand */
(function (win, doc) {
  let sizingPane = false;
  let sizingPaneBounding = {};
  let sizingStartPos = [0, 0];

  function getTargetPane(event, callback) {
    let isPane = event.target.hasParentClass("pane");
    if (isPane.success === true) {
      let target = isPane.parents[isPane.parents.length - 1];
      let panes = target.parentNode.getElementsByClassName("pane");
      for (let i = 0; i < panes.length; i++) {
        const pane = panes[i];
        let panePos = pane.getBoundingClientRect();
        let limiterPos = panePos.right;
        let mouseAccuracy = Math.abs(limiterPos - event.pageX);
        if (mouseAccuracy <= 5 && i < panes.length - 1) {
          callback(panes[i], panePos);
        }
      }
    }
  }

  win.addEventListener("mousedown", function (event) {
    getTargetPane(event, function (pane, bounding) {
      sizingPane = pane;
      sizingPaneBounding = bounding;
      sizingStartPos = [event.pageX, event.pageY];
    });
  });

  win.addEventListener("mousemove", function (event) {
    let sizings = doc.getElementsByClassName("sizing-pane");
    for (let i = 0; i < sizings.length; i++) {
      sizings[i].classList.remove("sizing-pane");
    }
    let isPaneGroup = event.target.hasParentClass("pane-group");
    if (isPaneGroup.success) {
      let group = isPaneGroup.parents[isPaneGroup.parents.length - 1];
      let panes = group.getElementsByClassName("pane");
      getTargetPane(event, function (pane, bounding) {
        for (let i = 0; i < panes.length; i++) {
          panes.item(i).classList.add("sizing-pane");
        }
      });
    }
  });

  win.addEventListener("mouseup", function () {
    sizingPane = false;
  });
  win.addEventListener("mousemove", function (event) {
    if (sizingPane) {
      let sizing = [event.pageX - sizingStartPos[0], sizingStartPos[1] - event.pageY];
      let currWidth = sizingPaneBounding.width;
      let newWidth = currWidth + sizing[0];
      sizingPane.style["width"] = newWidth + "px";
    }
  });
}(window, document));

HTMLElement.prototype.hasParentClass = function (className) {
  let currParent = this;
  let parents = [];
  while (currParent.tagName !== undefined) {
    parents.push(currParent);
    if (currParent.classList.contains(className)) {
      return {
        success: true,
        parents: parents
      };
    }
    currParent = currParent.parentNode;
  }
  return {
    success: false,
    parents: parents
  };
};

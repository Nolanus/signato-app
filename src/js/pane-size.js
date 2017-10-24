(function () {
  let sizingPane = false;
  let sizingPaneBounding = {};
  let sizingStartPos = [0, 0];

  function getTargetPane(event, callback) {
    let isPane = event.target.hasParentClass("pane");
    if (isPane.success === true) {
      let target = isPane.parents[isPane.parents.length - 1];
      let panes = target.parentNode.getElementsByClassName("pane");
      for (let i = 0; i < panes.length; i++) {
        let panePos = panes[i].getBoundingClientRect();
        let limiterPos = panePos.right;
        let mouseAcurracy = Math.abs(limiterPos - event.pageX);
        if (mouseAcurracy <= 5 && i < panes.length - 1) {
          callback(panes[i], panePos);
        }
      }
    }
  }

  window.addEventListener("mousedown", function (event) {
    getTargetPane(event, function (pane, bounding) {
      sizingPane = pane;
      sizingPaneBounding = bounding;
      sizingStartPos = [event.pageX, event.pageY];
    });
  });

  window.addEventListener("mousemove", function (event) {
    let sizings = document.getElementsByClassName("sizing-pane");
    for (let i = 0; i < sizings.length; i++) {
      sizings[i].classList.remove("sizing-pane");
    }
    let isPaneGroup = event.target.hasParentClass("pane-group");
    if (isPaneGroup.success) {
      let group = isPaneGroup.parents[isPaneGroup.parents.length - 1];
      let panes = group.getElementsByClassName("pane");
      getTargetPane(event, function (pane, bounding) {
        for (let i = 0; i < panes.length; i++) {
          panes[i].classList.add("sizing-pane");
        }
      });
    }
  });

  window.addEventListener("mouseup", function () {
    sizingPane = false;
  });
  window.addEventListener("mousemove", function (event) {
    if (sizingPane) {
      let sizing = [event.pageX - sizingStartPos[0], sizingStartPos[1] - event.pageY];
      let currWidth = sizingPaneBounding.width;
      let newWidth = currWidth + sizing[0];
      sizingPane.style["width"] = newWidth + "px";
    }
  });
}());

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

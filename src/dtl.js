import { brute } from "./brute.js";
const ipsumLorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum".split(
  " "
);

const isVerticalLayout = rect => {
  if (!rect.children || rect.children.length < 2) {
    return false;
  }
  let result = true;
  rect.children.forEach(outer => {
    rect.children.forEach(inner => {
      const hdiff = Math.abs(outer.left - inner.left);
      const vdiff = Math.abs(outer.top - inner.top);
      if (hdiff > vdiff) {
        result = false;
      }
    });
  });

  return result;
};

const isHorizontalLayout = rect => {
  if (!rect.children || rect.children.length < 2) {
    return false;
  }
  let result = true;
  rect.children.forEach(outer => {
    rect.children.forEach(inner => {
      const hdiff = Math.abs(outer.left - inner.left);
      const vdiff = Math.abs(outer.top - inner.top);
      if (hdiff < vdiff) {
        result = false;
      }
    });
  });

  return result;
};

const rectArea = rect => {
  const w = Math.abs(rect.right - rect.left);
  const h = Math.abs(rect.bottom - rect.top);
  return w * h;
};

const pointInsideRect = (rect, x, y) => {
  return x > rect.left && x < rect.right && y > rect.top && y < rect.bottom;
};

const rectsIntersect = (rectA, rectB) => {
  return (
    pointInsideRect(rectA, rectB.left, rectB.top) ||
    pointInsideRect(rectA, rectB.right, rectB.top) ||
    pointInsideRect(rectA, rectB.right, rectB.bottom) ||
    pointInsideRect(rectA, rectB.left, rectB.bottom)
  );
};

const getSmallestRect = rects => {
  let smallestArea = rectArea(rects[0]);
  let smallest = rects[0];
  rects.forEach(rect => {
    if (rectArea(rect) < smallestArea) {
      smallestArea = rectArea(rect);
      smallest = rect;
    }
  });
  return smallest;
};

const deleteRectChildren = rects => {
  rects.forEach(rect => {
    delete rect.children;
  });
};

let suggestionElements = [];
let suggestionRects = [];

const getMatchRatio = (treeA, treeB) => {
  let matchLength = 0;
  treeA.forEach((item, index) => {
    if (item === treeB[index]) {
      matchLength++;
    }
  });
  return matchLength / treeA.length;
};

const rectRatio = rect => {
  const w = rect.right - rect.left;
  const h = rect.bottom - rect.top;
  return w / h;
};

export const createAndAppendChildElements = rects => {
  let tree = [];
  const setAttribute = (name, value) => {
    tree.push(name, value, "=");
  };
  rects.forEach(rect => {
    const children = [];
    let styles = "";
    let tagName = rect.snippet ? rect.snippet : "div";
    tree.push(tagName);
    tree.push("(");
    if (rect.css_props) {
      styles = rect.css_props;
    }

    if (rect.children) {
      if (isVerticalLayout(rect)) {
        rect.children.sort((rectA, rectB) => {
          return rectA.top - rectB.top;
        });
      } else {
        rect.children.sort((rectA, rectB) => {
          return rectA.left - rectB.left;
        });
      }
    }

    if (tagName === "vaadin-vertical-layout") {
      rect.children.sort((rectA, rectB) => {
        return rectA.top - rectB.top;
      });
    }

    if (tagName === "vaadin-horizontal-layout") {
      rect.children.sort((rectA, rectB) => {
        return rectA.left - rectB.left;
      });
    }

    if (tagName === "vaadin-split-layout") {
      // remove drag handle rect
      const smallest = getSmallestRect(rect.children);
      rect.children = rect.children.filter(rect => rect !== smallest);
      // determine orientation
      const child = rect.children[0];
      if (
        pointInsideRect(child, smallest.left, smallest.top) !==
        pointInsideRect(child, smallest.left, smallest.bottom)
      ) {
        setAttribute("orientation", "vertical");
      }
    }

    // Use brute to determine flexbox properties for div
    if (tagName === "div" && rect.children) {
      styles = styles + brute(rect.children, rect);
    }

    // Temporary hardcodings
    if (tagName == "vaadin-button") {
      rect.text = "Button";
      setAttribute("theme", "primary");
    }

    if (tagName == "vaadin-tabs") {
      rect.text = "Tab name|Tab name|Tab name";
    }
    if (rect.text) {
      if (rect.text.includes("|")) {
        rect.text.split("|").forEach(str => {
          children.push("vaadin-tab", "(", "textContent", str, "=", ")");
        });
      } else {
        setAttribute("textContent", rect.text);
      }
    }

    if (styles.length > 0) {
      setAttribute("style", styles);
    }
    if (children.length > 0) {
      tree = tree.concat(children);
    }

    if (rect.children) {
      tree = tree.concat(createAndAppendChildElements(rect.children));
    }
    tree.push(")");
  });
  return tree;
};

export const modelToDOM = (code, target) => {
  const stack = [];
  const tree = [];
  let current = target;
  code.forEach((str, index) => {
    const trimmed = str.trim();
    switch (trimmed) {
      case "(": {
        const old = current;
        tree.push(current);
        const tag = stack.pop();
        current = document.createElement(tag);
        old.appendChild(current);
        break;
      }
      case ")": {
        current = tree.pop();
        break;
      }
      case "=": {
        const tos = stack.pop();
        const nos = stack.pop();
        if (nos in current) {
          try {
            const json = JSON.parse(tos);
            current[nos] = json;
          } catch (e) {
            current[nos] = tos;
            current.setAttribute(nos, tos);
          }
        } else {
          current.setAttribute(nos, tos);
        }

        break;
      }
      default: {
        stack.push(trimmed);
      }
    }
  });
  return current;
};

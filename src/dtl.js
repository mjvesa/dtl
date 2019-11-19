import { brute } from "./brute.js";
const ipsumLorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum".split(
  " "
);

let suggestions = [
  {
    tree: [
      "vaadin-vertical-layout",
      "(",
      "vaadin-button",
      "(",
      ")",
      "vaadin-button",
      "(",
      ")",
      "vaadin-button",
      "(",
      ")",
      "vaadin-button",
      "(",
      ")",
      ")"
    ],
    rects: [
      { left: 51, top: 62, right: 330, bottom: 430 },
      { left: 94, top: 94, right: 240, bottom: 134 },
      { left: 96, top: 155, right: 241, bottom: 198 },
      { left: 103, top: 225, right: 232, bottom: 260 },
      { left: 105, top: 286, right: 232, bottom: 332 }
    ]
  }
];

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

    if (tagName === "grid-layout") {
      styles = styles + "display:grid;";
      // Sort into left-right and top down order
      rect.children.sort((rectA, rectB) => {
        return (
          rectA.left +
          (rectA.top - rect.top - ((rectA.top - rect.top) % 50)) * 8192 -
          (rectB.left +
            (rectB.top - rect.top - ((rectB.top - rect.top) % 50)) * 8192)
        );
      });
      let columnWidth = 0;
      let maxColumnWidth = 0;
      let previous = rect.children[0];
      rect.children.forEach(rect => {
        if (previous.left > rect.left) {
          if (columnWidth > maxColumnWidth) {
            maxColumnWidth = columnWidth;
          }
          columnWidth = 0;
        }
        columnWidth++;
        previous = rect;
      });
      styles =
        styles + `grid-template-columns:repeat(${maxColumnWidth}, auto);`;
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

    // Handle text content in rect
    if (
      rect.text &&
      tagName !== "vaadin-radio-button" &&
      tagName !== "vaadin-checkbox"
    ) {
      if (tagName == "unide-grid") {
        const columns = rect.text.split(",");
        const columnCaptions = [];
        columns.forEach(column => {
          columnCaptions.push({ name: column, path: column });
        });
        setAttribute("columnCaptions", JSON.stringify(columnCaptions));
        const items = [];
        for (let i = 0; i < 200; i++) {
          const item = {};
          columns.forEach(column => {
            item[column] = ipsumLorem[(Math.random() * ipsumLorem.length) | 0];
          });
          items.push(item);
        }
        setAttribute("items", JSON.stringify(items));
      } else if (rect.text.includes(",")) {
        rect.text.split(",").forEach(str => {
          children.push("vaadin-item", "(", "textContent", str, "=", ")");
        });
      } else if (rect.text.includes("|")) {
        rect.text.split("|").forEach(str => {
          children.push("vaadin-tab", "(", "textContent", str, "=", ")");
        });
      } else if (rect.text.includes(";")) {
        setAttribute("items", JSON.stringify(rect.text.split(";")));
      } else {
        setAttribute("textContent", rect.text.replace("#", ""));
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

// DOM creator
export const createAndAppendChildElementsToDOM = (parent, rects) => {
  rects.forEach(rect => {
    let styles = "";
    let tagName = rect.snippet ? rect.snippet : "div";
    tagName = tagName.replace("unide-grid", "vaadin-grid");
    let el = document.createElement(tagName);
    if (rect.css_props) {
      styles = rect.css_props;
    }

    if (
      tagName === "vaadin-radio-group" ||
      tagName === "vaadin-checkbox-group"
    ) {
      if (rectRatio(rect) < 1) {
        el.setAttribute("theme", "vertical");
      }
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

    if (tagName === "grid-layout") {
      el.style.display = "grid";
      // Sort into left-right and top down order
      rect.children.sort((rectA, rectB) => {
        return (
          rectA.left +
          (rectA.top - rect.top - ((rectA.top - rect.top) % 50)) * 8192 -
          (rectB.left +
            (rectB.top - rect.top - ((rectB.top - rect.top) % 50)) * 8192)
        );
      });
      let columnWidth = 0;
      let maxColumnWidth = 0;
      let previous = rect.children[0];
      rect.children.forEach(rect => {
        if (previous.left > rect.left) {
          if (columnWidth > maxColumnWidth) {
            maxColumnWidth = columnWidth;
          }
          columnWidth = 0;
        }
        columnWidth++;
        previous = rect;
      });
      el.style.gridTemplateColumns = `repeat(${maxColumnWidth}, auto)`;
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
        el.setAttribute("orientation", "vertical");
      }
    }

    // Use brute to determine flexbox properties for div
    if (tagName === "div" && rect.children) {
      styles = styles + brute(rect.children, rect);
    }

    // Temporary hardcodings
    if (tagName == "vaadin-button") {
      rect.text = "Button";
      el.setAttribute("theme", "primary");
    }

    if (tagName == "vaadin-tabs") {
      rect.text = "Tab name|Tab name|Tab name";
    }

    // Handle text content in rect
    if (
      rect.text &&
      tagName !== "vaadin-radio-button" &&
      tagName !== "vaadin-checkbox"
    ) {
      if (tagName == "vaadin-grid") {
        const columnNames = rect.text.split(",");
        columnNames.forEach(columnName => {
          const column = document.createElement("vaadin-grid-column");
          column.setAttribute("path", columnName);
          column.setAttribute("header", columnName);
          el.appendChild(column);
        });
        let items = [];
        for (let i = 0; i < 200; i++) {
          let item = {};
          columnNames.forEach(columnName => {
            item[columnName] =
              ipsumLorem[(Math.random() * ipsumLorem.length) | 0];
          });
          items.push(item);
        }
        el.items = items;
      } else if (rect.text.includes(",")) {
        rect.text.split(",").forEach(str => {
          let item = document.createElement("vaadin-item");
          item.textContent = str;
          el.appendChild(item);
        });
      } else if (rect.text.includes("|")) {
        rect.text.split("|").forEach(str => {
          let tab = document.createElement("vaadin-tab");
          tab.textContent = str;
          el.appendChild(tab);
        });
      } else if (rect.text.includes(";")) {
        el.items = rect.text.split(";");
      } else {
        el.textContent = rect.text.replace("#", "");
      }
    }

    if (styles.length > 0) {
      el.setAttribute("style", styles);
    }

    parent.appendChild(el);
    if (rect.children) {
      createAndAppendChildElementsToDOM(el, rect.children);
    }
  });
};

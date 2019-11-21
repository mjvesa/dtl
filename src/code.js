figma.showUI(__html__, { width: 700, height: 800 });

figma.ui.onmessage = msg => {
  if (msg.type === "generate-vaadin-ui") {
    // Gather all frames
    const frameRects = [];
    const frames = figma.currentPage.findAll(node => node.type === "FRAME");
    frames.forEach(node => {
      const rect = {
        left: node.absoluteTransform[0][2],
        top: node.absoluteTransform[1][2],
        right: node.absoluteTransform[0][2] + node.width,
        bottom: node.absoluteTransform[1][2] + node.height,
        name: node.name
      };
      frameRects.push(rect);
    });
    // Obtain root frames. Those are the high level frames on the page
    const rects = createTreeFromRects(frameRects);
    // Remove references to children
    for (let rect of rects) {
      rect.children = null;
    }
    console.log("roots " + JSON.stringify(rects));
    // Add components and instances to the rects
    const components = figma.currentPage.findAll(
      node => node.type === "COMPONENT"
    );
    components.forEach(node => {
      const component = node;
      const rect = {
        left: node.absoluteTransform[0][2],
        top: node.absoluteTransform[1][2],
        right: node.absoluteTransform[0][2] + node.width,
        bottom: node.absoluteTransform[1][2] + node.height,
        snippet: component.description
      };
      rects.push(rect);
    });
    const instances = figma.currentPage.findAll(
      node => node.type === "INSTANCE"
    );
    instances.forEach(node => {
      const component = node.masterComponent;
      const rect = {
        left: node.absoluteTransform[0][2],
        top: node.absoluteTransform[1][2],
        right: node.absoluteTransform[0][2] + node.width,
        bottom: node.absoluteTransform[1][2] + node.height,
        snippet: component.description
      };
      rects.push(rect);
    });
    const roots = createTreeFromRects(rects);
    figma.ui.postMessage(roots);
  }
  if (msg.type === "close") {
    // Make sure to close the plugin when you're done. Otherwise the plugin will
    // keep running, which shows the cancel button at the bottom of the screen.
    figma.closePlugin();
  }
};
const childOf = (rectA, rectB) => {
  return (
    rectA.left > rectB.left &&
    rectA.top > rectB.top &&
    rectA.right < rectB.right &&
    rectA.bottom < rectB.bottom
  );
};
const createTreeFromRects = rects => {
  const roots = [];
  rects.forEach(rect => {
    let smallestArea = 10000000;
    let potentialParent;
    rects.forEach(parentRect => {
      const area =
        Math.abs(parentRect.right - parentRect.left) *
        Math.abs(parentRect.bottom - parentRect.top);
      if (area < smallestArea && childOf(rect, parentRect)) {
        potentialParent = parentRect;
        smallestArea = area;
      }
    });
    if (potentialParent) {
      const children = potentialParent.children || [];
      children.push(rect);
      potentialParent.children = children;
    } else {
      roots.push(rect);
    }
  });
  return roots;
};

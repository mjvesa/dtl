// This plugin will open a modal to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser enviroment (see documentation).

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 700, height: 800 });

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = msg => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === "create-rectangles") {
    const nodes: SceneNode[] = [];
    for (let i = 0; i < msg.count; i++) {
      const rect = figma.createRectangle();
      rect.x = i * 150;
      rect.fills = [{ type: "SOLID", color: { r: 1, g: 0.5, b: 0 } }];
      figma.currentPage.appendChild(rect);
      nodes.push(rect);
    }
    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);
  }

  if (msg.type === "generate-vaadin-ui") {
    // Gather all frames
    const frameRects = [];
    const frames = figma.currentPage.findAll(node => node.type === "FRAME");
    frames.forEach(node => {
      const component = node as ComponentNode;
      const rect = {
        left: node.absoluteTransform[0][2],
        top: node.absoluteTransform[1][2],
        right: node.absoluteTransform[0][2] + node.width,
        bottom: node.absoluteTransform[1][2] + node.height,
        snippet: component.description,
        name: component.name
      };
      frameRects.push(rect);
    });

    // Obtain root frames. Those are the high level frames on the page
    const rects = createTreeFromRects(frameRects);
    // Remove references to children
    for (let rect in rects) {
      (rect as any).children = null;
    }

    // Add components and insntances to the rects
    const components = figma.currentPage.findAll(
      node => node.type === "COMPONENT"
    );
    components.forEach(node => {
      const component = node as ComponentNode;
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
      const component = (node as InstanceNode).masterComponent;
      const rect = {
        left: node.absoluteTransform[0][2],
        top: node.absoluteTransform[1][2],
        right: node.absoluteTransform[0][2] + node.width,
        bottom: node.absoluteTransform[1][2] + node.height,
        snippet: component.description
      };
      rects.push(rect);
    });

    console.log("Them rects, waat : " + JSON.stringify(rects));
    let roots = createTreeFromRects(rects);
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

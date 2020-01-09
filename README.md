# Designs to Layouts

This is a work-in-progress Figma plugin that can be used to take a page and convert
the top-level frames in that page into layouts. Those layouts can be HTML pages,
views in an application, pages in a document and many other things. The plugin produces an
intermediate representation that can be converted into the target layout format
by writing an interpreter. Currently only Vaadin 14 Java projects are supported, but more
targets are coming.

In more detail, dtl first converts the absolutely positioned components into
a tree of components with proper nesting. Then the positioning of those components
is reproduced using flexbox. That should produce a layout that maintains the
proper positioning of elements when the layout is scaled. The resulting layout is not 1:1
with the design, but one goal is to get it as close as possible.

To achieve this, each element needs its description field filled with the tag
it represents (button, vaadin-text-field...). To create the layout, components
need to be grouped into layouts. This is done by surrouding them with a component
whose tag is `div`. Each layout can contain components positioned
either vertically or horizontally. That rule might be relaxed in the future when
things like grid layout will be available.

# How to install the plugin and convert the example design

First either clone this repository or download a zip of it via the "clone or download"
button above. Then import the `example_design.fig` file into figma. To install the plugin,
right click on the design, navigate to `Plugins > Development > New Plugin...` There click to
choose the manifest.json inside the copy of this repository you just downloaded, and you're
done. To access the plugin, right click on the design again and navigate to
`Plugins > Development > Designs to Layouts`. Click on `Generate layouts` to see what your
layouts should look like in the application and then click on `Download` to get a Vaadin project.

# Roadmap

Since there is no feedback yet, these are things that would be nice to have:

- Support for styles created in Figma
- Use text in components
- Snippets instead of tag name for component conversion
- Navigation between layouts
- Automatic clustering to reduce the need to draw layout components
- Grid layout

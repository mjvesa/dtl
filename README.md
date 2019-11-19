# Designs to Layouts

This is a work-in-progress Figma plugin that can be used to take a page and convert
the top-level frames in that page into layouts. Those layouts can be HTML pages,
views in an application, pages in a document and many other things. The plugin produces an
intermediate representation that can be converted into the target layout format
by writing an interpreter.

In more detail, dtl first converts the absolutely positioned components into
a tree of components with proper nesting. Then the positioning of those components
is reproduced using flexbox. That should produce a layout that maintains the
proper positioning of elements when the layout is scaled.

To achieve this, each element needs its description field filled with the tag
it represents (button, vaadin-text-field...). To create the layout, components
need to be grouped into layouts. This is done by surrouding them with a component
whose tag is `flex-layout`. Each layout can contain components positioned
either vertically or horizontally. That rule might be relaxed in the future when
things like grid layout will be available.

# Roadmap

Since there is no feedback yet, these are things that would be nice to have:

- Support for styles created in Figma
- Snippets instead of tag name for component conversion
- Navigation between layouts
- Automatic clustering to reduce the need to draw layout components
- Grid layout

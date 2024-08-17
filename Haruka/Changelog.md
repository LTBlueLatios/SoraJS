# Haruka Changelog

## [2.0.0] Refactored Templating and Improved Reactivity

The most substantial change in 2.0.0 is the shift from separate HTML and CSS files in the `components/templates` folder to utilizing HTML `<template>` elements.

Alongside the change in templating, this release includes enhancements to reactivity and rendering performance:

* **Reactive Properties:** Components now support reactive properties defined in the `static properties` array, enabling automatic re-rendering upon property changes.
* **Optimized Rendering:** The rendering process has been optimized to update only the necessary parts of the DOM.
* **Attribute Binding:** Dynamic attribute updates are now possible using the `data-bind-attr-{propertyName}` attribute.
* **Child Component Management:**  Methods for managing nested components (`addChild`, `getChild`, `removeChild`) have been added.
* **Dependency Injection:**  Support for dependency injection has been introduced to improve code modularity.

### Detailed Changes

**Added:**

* Reactive properties with automatic re-rendering.
* Attribute binding for dynamic attribute updates.
* Child component management capabilities.
* Dependency injection support.
* Utility methods for enhanced functionality.
* Event delegation, a more efficient and centralized way to manage events.

**Changed:**

* Template handling now utilizes HTML `<template>` elements.
* Streamlined initialization process.
* Enhanced state management with recursive updates.
* Simplified event handling.
* Code reorganization for improved readability / maintainability.

**Removed:**

* Reliance on separate HTML and CSS files in the `components/templates` folder.
* Asynchronous initialization.
* Integration with SoulDew.
* Direct event handling.
* The `hydrate` method is no longer needed and has been removed
* Generic `handleError` method.
* Several DOM manipulation methods (`insertBefore`, `replace`, `addClass`, `removeClass`, `toggleClass`) in order to maintain a minimal core functionality and encourage a separation of concerns.

## [1.0.1] Fixes and Improvements

Please use this version. Past versions literally do not work.

### Changed

* Refactored overall initialization logic to fix asynchronous issues

### Removed

* SoulDew, as it was uneeded in the base of the code.

## [1.0.0] - 2024-7-19

First official release version, yay!

### Added

* Error handling with `handleError` method
* Lifecycle method `onMount`
* `hydrate` method for adding interactivity
* `destroy` method for cleanup
* Additional DOM handling methods: `insertBefore`, `replace`, `addClass`, `removeClass`, `toggleClass`
* Improved `isVisible` method
* `clearTimers` method placeholder

### Changed

* Refactored `init` method to be asynchronous
* Improved error handling consistency
* Enhanced type checking for method parameters

### Removed

- Direct event handling (now handled by SoulDew)

## [0.2.0] - Release Candidate 2

### Added

* Integration with SoulDew for event handling
* `appendTo` method for targeted element insertion
* `show`, `hide`, and `isVisible` methods for visibility control

### Changed

* Refactored to extend SoulDew class

## [0.1.0] - Release Candidate 1

### Added

* Basic state management with `setState` and `getState`
* CSS property handling with `setCSSProperty` and `getCSSProperty`
* `append` and `remove` methods for DOM manipulation

### Changed

* Improved template fetching with error handling

## [0.0.2] - Indev

Needed after v0.0.1 took a bit of my sanity away, resulting in some horribly implemented code. Thank you, asynchronous JavaScript.

### Added

- Refactored the module to reflect SRP and the goal of "small but mighty"

## [0.0.1] - Indev

### Added

- Initial implementation of Haruka class
- Asynchronous template fetching
- Basic rendering functionality

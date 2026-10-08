// jsdom has no layout: the router's scroll restoration only needs scrollTo to exist.
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};

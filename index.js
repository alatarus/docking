const sourcesContaner = document.getElementById("sources");
const targetContainer = document.getElementById("target");

if (sourcesContaner) {
  for (let i = 0; i < 10; i++) {
    const randomColor = `rgb(${Math.round(Math.random() * 100)}% ${Math.round(
      Math.random() * 100
    )}% ${Math.round(Math.random() * 100)}%)`;
    console.log(randomColor);
    const element = document.createElement("div");
    element.classList.add("draggable");
    element.draggable = true;
    element.style.backgroundColor = randomColor;

    element.addEventListener("dragstart", (event) => {
      // Show drop sites when drag starts
      document.body.style.setProperty("--handles-display", "block");
      event.currentTarget.classList.add("dragging");
      event.dataTransfer.setData(
        "application/color",
        event.currentTarget.style.backgroundColor
      );
      event.dataTransfer.effectAllowed = "copy";
    });
    element.addEventListener("dragend", (event) => {
      // Hide drop sites when drag ends
      document.body.style.removeProperty("--handles-display");
      event.currentTarget.classList.remove("dragging");
    });

    sourcesContaner.appendChild(element);
  }
}

function dragOver(event) {
  if (event.dataTransfer.types.includes("application/color")) {
    event.preventDefault();
    event.dataTransfer.effectAllowed = "copy";
  }
}

targetContainer.addEventListener("dragover", dragOver);
targetContainer.addEventListener("drop", (event) => {
  if (event.defaultPrevented) return;

  const data = event.dataTransfer.getData("application/color");
  const layout = createChild(getLayerCreator("v-target", getLayerCreator("h-target", createItem)), data);

  event.currentTarget.appendChild(layout);
});

/**
 * 
 * @param {string} color 
 * @returns {HTMLElement}
 */
function createItem(color) {
  const item = document.createElement("div");
  item.className = "item";
  item.style.backgroundColor = color;

  const closeButton = document.createElement("button");
  closeButton.innerText = "Close";

  closeButton.addEventListener("click", () => {
    item.parentElement.removeChild(item);
  });

  item.appendChild(closeButton);

  item.addEventListener("dragover", dragOver);
  item.addEventListener("drop", (event) => {
    if (event.defaultPrevented) return;

    event.preventDefault();

    const data = event.dataTransfer.getData("application/color");
    event.currentTarget.style.backgroundColor = data;
  });

  return item;
}

/**
 * A factory function that creates creators of layout layers.
 * 
 * @param {"v-target" | "h-target"} className
 * @param {(color: string) => HTMLElement} childFactory
 * @returns {(color: string) => HTMLElement}
 */
function getLayerCreator(className, childFactory) {
  return (color) => {
    const layer = document.createElement("div");
    layer.className = className;
    layer.appendChild(createChild(childFactory, color));

    const observer = new MutationObserver((mutations, observer) => {
      mutations.forEach((mutation) => {
        //If the layer containst only drop sites then delete a layer.
        if (mutation.target.childNodes.length === 2) {
          mutation.target.parentNode.removeChild(mutation.target);
          observer.disconnect();
        }
      });
    });

    observer.observe(layer, { childList: true });

    return layer;
  };
}

/**
 * A support function that creates a generic drop site.
 * 
 * @returns {HTMLElement}
 */
function createHandle() {
  const handle = document.createElement("div");
  handle.addEventListener("dragenter", (event) => {
    event.currentTarget.style.opacity = 1;
  });
  handle.addEventListener("dragleave", (event) => {
    event.currentTarget.style.opacity = 0;
  });
  handle.addEventListener("dragover", dragOver);

  return handle;
}

/**
 * A support function that creates a child element and adds drop sites to it.
 * 
 * @param {(color: string) => HTMLElement} childFactory 
 * @param  {Parameters<childFactory>} args 
 * @returns {HTMLElement}
 */
function createChild(childFactory, ...args) {
  const child = childFactory(...args);

  const handleBefore = createHandle();
  handleBefore.className = "handleBefore";

  handleBefore.addEventListener("drop", (event) => {
    event.preventDefault();
    event.currentTarget.style.opacity = 0;

    const data = event.dataTransfer.getData("application/color");
    const element = createChild(childFactory, data);

    const item = event.currentTarget.parentElement;
    item.parentElement.insertBefore(element, item);
  });

  const handleAfter = createHandle();
  handleAfter.className = "handleAfter";

  handleAfter.addEventListener("drop", (event) => {
    event.preventDefault();
    event.currentTarget.style.opacity = 0;

    const data = event.dataTransfer.getData("application/color");
    const element = createChild(childFactory, data);

    const item = event.currentTarget.parentElement;
    const nextSibling = item.nextElementSibling;

    if (nextSibling) {
      nextSibling.parentElement.insertBefore(element, nextSibling);
    } else {
      item.parentElement.appendChild(element);
    }
  });

  child.appendChild(handleBefore);
  child.appendChild(handleAfter);

  return child;
}

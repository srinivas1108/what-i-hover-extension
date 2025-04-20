let shiftPressed = false;  // Track Shift key status
let inspectorBox = null;
let isDragging = false;
let offset = { x: 0, y: 0 };
let overlayActive = false;
let currentElement = null; // Store the current hovered element
let isPaused = false; // Flag to indicate if content is paused

// Detect Shift key press and release
document.addEventListener("keydown", (e) => {
  if (e.key === "Shift") {
    shiftPressed = true;
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "Shift") {
    shiftPressed = false;
  }
});

// Create Inspector Box
function createInspectorBox() {
  if (inspectorBox) return;

  inspectorBox = document.createElement("div");
  inspectorBox.id = "hover-inspector-box";
  inspectorBox.style.position = "fixed";
  inspectorBox.style.top = "10px";
  inspectorBox.style.right = "10px";
  inspectorBox.style.width = "280px";
  inspectorBox.style.backgroundColor = "#1e1e1e";
  inspectorBox.style.color = "#fff";
  inspectorBox.style.padding = "12px";
  inspectorBox.style.border = "1px solid #555";
  inspectorBox.style.borderRadius = "10px";
  inspectorBox.style.zIndex = "999999";
  inspectorBox.style.fontFamily = "monospace";
  inspectorBox.style.fontSize = "12px";
  inspectorBox.style.boxShadow = "0 4px 10px rgba(0,0,0,0.4)";
  inspectorBox.style.cursor = "move";
  inspectorBox.style.userSelect = "text";

  inspectorBox.innerHTML = `
    <div id="hover-inspector-content">
      Hover over any element
    </div>
    <div id="tooltip" style="color: #ddd; font-size: 10px; margin-top: 10px;">
      Press <strong>Shift</strong> to freeze content
    </div>
  `;

  // Make it draggable
  inspectorBox.addEventListener("mousedown", (e) => {
    isDragging = true;
    offset.x = e.clientX - inspectorBox.offsetLeft;
    offset.y = e.clientY - inspectorBox.offsetTop;
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      inspectorBox.style.left = `${e.clientX - offset.x}px`;
      inspectorBox.style.top = `${e.clientY - offset.y}px`;
      inspectorBox.style.right = "auto";
    }
  });

  document.body.appendChild(inspectorBox);
}

// Get Element Styles
function getElementStyles(el) {
  const styles = window.getComputedStyle(el);
  const styleInfo = [
    `Color: ${styles.color}`,
    `Font Size: ${styles.fontSize}`,
    `Font Weight: ${styles.fontWeight}`,
    `Background: ${styles.backgroundColor}`,
    `Border: ${styles.border}`,
    `Padding: ${styles.padding}`,
    `Margin: ${styles.margin}`,
    `Width: ${styles.width}`,
    `Height: ${styles.height}`,
  ];
  return styleInfo.join("<br>");
}

// Update Inspector Box with Element Details
function updateInspectorContent(el) {
  if (!inspectorBox) return;

  const tagName = el.tagName.toLowerCase();
  const id = el.id ? `ID: #${el.id}` : 'ID: None';
  const classes = el.classList.length ? `Class: .${[...el.classList].join('.')}` : 'Class: None';
  const text = el.textContent.trim().slice(0, 100);
  const selector = `${tagName} ${id} ${classes}`;
  const styles = getElementStyles(el);

  const content = `
    <strong>${selector}</strong><br>
    ${text ? `"${text}"<br>` : ''}
    <strong>Styles:</strong><br>
    ${styles}<br>
    <button id="copySelector" style="margin-top: 6px; padding: 4px 8px; font-size: 12px; background: #444; color: white; border: none; border-radius: 4px; cursor: pointer;">
      Copy Selector and Styles
    </button>
  `;

  const box = document.getElementById("hover-inspector-content");
  if (box) box.innerHTML = content;

  const copyBtn = document.getElementById("copySelector");
  if (copyBtn) {
    copyBtn.onclick = () => {
      const fullInfo = `${selector}\n\nStyles:\n${styles}`;
      navigator.clipboard.writeText(fullInfo).then(() => {
        copyBtn.innerText = "Copied!";
        setTimeout(() => {
          copyBtn.innerText = "Copy Selector and Styles";
        }, 1000);
      });
    };
  }
}

// Handle Hover Event
function onHover(e) {
  if (!overlayActive || isPaused) return;  // Don't update if paused
  
  const el = document.elementFromPoint(e.clientX, e.clientY);
  if (!el || inspectorBox?.contains(el)) return;

  currentElement = el;  // Update current element when hovering

  updateInspectorContent(el);
}

// Toggle Inspector Box Visibility
function toggleInspector() {
  if (overlayActive) {
    overlayActive = false;
    if (inspectorBox) inspectorBox.remove();
    inspectorBox = null;
    currentElement = null;  // Reset current element when inspector is toggled off
    document.removeEventListener("mousemove", onHover);
  } else {
    overlayActive = true;
    createInspectorBox();
    document.addEventListener("mousemove", onHover);
  }
}

// Listen for the toggle command from the background or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleOverlay") {
    toggleInspector();
    sendResponse({ status: "toggled" });
  }
});

// Pause content when Shift key is pressed while hovering
document.addEventListener("mousemove", (e) => {
  if (shiftPressed) {
    isPaused = true;  // Freeze content when Shift is held
  } else {
    isPaused = false;  // Resume content updates when Shift is released
  }
});

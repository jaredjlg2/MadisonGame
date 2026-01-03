const clothingItems = document.querySelectorAll('.clothing');
const dropZones = document.querySelectorAll('.drop-zone');
const statusText = document.getElementById('status');
const bubbleLayer = document.getElementById('bubble-layer');
const dollArm = document.getElementById('doll-arm');

const dressed = new Set();
let bubblesActive = false;
let bubbleInterval = null;
const bubbles = new Set();

clothingItems.forEach((item) => {
  item.addEventListener('dragstart', (event) => {
    event.dataTransfer.setData('text/plain', item.dataset.item);
  });
});

dropZones.forEach((zone) => {
  zone.addEventListener('dragover', (event) => {
    event.preventDefault();
    zone.classList.add('active');
  });

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('active');
  });

  zone.addEventListener('drop', (event) => {
    event.preventDefault();
    zone.classList.remove('active');
    const itemType = event.dataTransfer.getData('text/plain');

    if (!itemType || zone.dataset.zone !== itemType) {
      statusText.textContent = 'Try dropping it on the matching spot!';
      return;
    }

    if (dressed.has(itemType)) {
      return;
    }

    const item = document.querySelector(`.clothing[data-item="${itemType}"]`);
    if (item) {
      item.setAttribute('draggable', 'false');
      item.style.opacity = '0.6';
      item.style.cursor = 'default';
    }

    const dressedItem = document.createElement('div');
    dressedItem.className = `dressed-item ${itemType}`;
    dressedItem.textContent = itemType.charAt(0).toUpperCase() + itemType.slice(1);
    zone.appendChild(dressedItem);
    dressed.add(itemType);

    if (dressed.size === dropZones.length) {
      startBubbles();
    } else {
      statusText.textContent = 'Great! Keep dressing the doll.';
    }
  });
});

function startBubbles() {
  if (bubblesActive) {
    return;
  }
  bubblesActive = true;
  statusText.textContent = 'Bubbles are here! Drag the arm to pop them!';
  bubbleInterval = setInterval(createBubble, 700);
  requestAnimationFrame(updateBubbles);
}

function createBubble() {
  const bubble = document.createElement('div');
  bubble.classList.add('bubble');
  const size = 30 + Math.random() * 30;
  bubble.style.width = `${size}px`;
  bubble.style.height = `${size}px`;
  bubble.style.left = `${Math.random() * 80 + 10}%`;
  bubble.style.top = `-${size}px`;
  bubble.dataset.speed = (1.2 + Math.random() * 1.5).toString();
  bubbleLayer.appendChild(bubble);
  bubbles.add(bubble);
}

function updateBubbles() {
  bubbles.forEach((bubble) => {
    const currentTop = parseFloat(bubble.style.top);
    const speed = parseFloat(bubble.dataset.speed);
    const nextTop = currentTop + speed;
    bubble.style.top = `${nextTop}px`;

    if (nextTop > bubbleLayer.offsetHeight + 60) {
      bubble.remove();
      bubbles.delete(bubble);
    }
  });

  checkBubblePops();

  if (bubblesActive) {
    requestAnimationFrame(updateBubbles);
  }
}

function checkBubblePops() {
  const armRect = dollArm.getBoundingClientRect();
  bubbles.forEach((bubble) => {
    const bubbleRect = bubble.getBoundingClientRect();
    const overlaps =
      armRect.left < bubbleRect.right &&
      armRect.right > bubbleRect.left &&
      armRect.top < bubbleRect.bottom &&
      armRect.bottom > bubbleRect.top;

    if (overlaps) {
      bubble.classList.add('pop');
      setTimeout(() => {
        bubble.remove();
        bubbles.delete(bubble);
      }, 150);
    }
  });
}

let isDraggingArm = false;
let armOffset = { x: 0, y: 0 };

function startArmDrag(event) {
  if (!bubblesActive) {
    statusText.textContent = 'Dress the doll first so you can pop bubbles!';
    return;
  }
  isDraggingArm = true;
  const armRect = dollArm.getBoundingClientRect();
  const pointer = getPointerPosition(event);
  armOffset = {
    x: pointer.x - armRect.left,
    y: pointer.y - armRect.top,
  };
  dollArm.setPointerCapture?.(event.pointerId);
}

function dragArm(event) {
  if (!isDraggingArm) {
    return;
  }
  const pointer = getPointerPosition(event);
  const dollRect = document.getElementById('doll').getBoundingClientRect();
  const bubbleRect = bubbleLayer.getBoundingClientRect();
  const armWidth = dollArm.offsetWidth;
  const armHeight = dollArm.offsetHeight;
  const newLeft = pointer.x - dollRect.left - armOffset.x;
  const newTop = pointer.y - dollRect.top - armOffset.y;
  const minLeft = bubbleRect.left - dollRect.left;
  const maxLeft = bubbleRect.right - dollRect.left - armWidth;
  const minTop = bubbleRect.top - dollRect.top;
  const maxTop = bubbleRect.bottom - dollRect.top - armHeight;
  dollArm.style.left = `${Math.min(Math.max(newLeft, minLeft), maxLeft)}px`;
  dollArm.style.top = `${Math.min(Math.max(newTop, minTop), maxTop)}px`;
}

function endArmDrag() {
  if (!isDraggingArm) {
    return;
  }
  isDraggingArm = false;
}

function getPointerPosition(event) {
  if (event.touches && event.touches[0]) {
    return { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }
  return { x: event.clientX, y: event.clientY };
}

dollArm.addEventListener('pointerdown', startArmDrag);
window.addEventListener('pointermove', dragArm);
window.addEventListener('pointerup', endArmDrag);

// Touch fallback
window.addEventListener('touchmove', dragArm, { passive: false });
window.addEventListener('touchend', endArmDrag);

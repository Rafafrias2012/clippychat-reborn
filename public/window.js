class Window {
  static getRandomPosition() {
      // Get window dimensions with padding
      const padding = 100; // Padding from edges
      const maxWidth = window.innerWidth - padding * 2;
      const maxHeight = window.innerHeight - padding * 2;

      // Generate random position within bounds
      return {
          x: Math.floor(Math.random() * maxWidth) + padding,
          y: Math.floor(Math.random() * maxHeight) + padding
      };
  }

  static keepInBounds(sprite) {
      const padding = 100;
      const bounds = {
          left: padding,
          right: window.innerWidth - padding,
          top: padding,
          bottom: window.innerHeight - padding
      };

      // Adjust x position
      if (sprite.x < bounds.left) sprite.x = bounds.left;
      if (sprite.x > bounds.right) sprite.x = bounds.right;

      // Adjust y position
      if (sprite.y < bounds.top) sprite.y = bounds.top;
      if (sprite.y > bounds.bottom) sprite.y = bounds.bottom;

      return { x: sprite.x, y: sprite.y };
  }
}

// Make Window available globally
window.WindowManager = Window; 
// Block utility functions for matching test creation
export const blockUtils = {
  create: (x, y, width, height, id) => ({
    id,
    x: x - width / 2,
    y: y - height / 2,
    width: Math.max(width, 30),
    height: Math.max(height, 10),
    fill: 'rgba(0, 123, 255, 0.15)',
    stroke: '#007bff',
    strokeWidth: 2,
    cornerRadius: 6,
    shadowColor: 'rgba(0, 123, 255, 0.3)',
    shadowBlur: 10,
    shadowOffset: { x: 0, y: 2 },
    shadowOpacity: 0.5
  }),
  
  validate: (block) => {
    return block.width > 0 && block.height > 0;
  },
  
  findAtPosition: (blocks, x, y) => {
    return blocks.find(block => 
      x >= block.x && x <= block.x + block.width &&
      y >= block.y && y <= block.y + block.height
    );
  },
  
  generateId: () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
};

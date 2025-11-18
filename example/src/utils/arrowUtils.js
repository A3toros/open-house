// Arrow utility functions for matching test creation
export const arrowUtils = {
  create: (startX, startY, endX, endY, startBlock, endBlock, id) => ({
    id,
    startX, startY, endX, endY,
    startBlock, endBlock,
    stroke: '#dc3545',
    fill: '#dc3545',
    strokeWidth: 3,
    pointerLength: 10,
    pointerWidth: 10
  }),
  
  snapToNearestBlock: (x, y, blocks, snapRadius = 60) => {
    let nearestBlock = null;
    let nearestDistance = Infinity;
    
    for (const block of blocks) {
      const blockCenterX = block.x + (block.width / 2);
      const blockCenterY = block.y + (block.height / 2);
      const distance = Math.sqrt(
        Math.pow(x - blockCenterX, 2) + Math.pow(y - blockCenterY, 2)
      );
      
      if (distance <= snapRadius && distance < nearestDistance) {
        nearestDistance = distance;
        nearestBlock = block;
      }
    }
    
    if (nearestBlock) {
      return {
        x: nearestBlock.x + (nearestBlock.width / 2),
        y: nearestBlock.y + (nearestBlock.height / 2),
        blockId: nearestBlock.id,
        block: nearestBlock,
        distance: nearestDistance
      };
    }
    
    return null;
  },
  
  validate: (startX, startY, endX, endY, blocks) => {
    // Arrow must start near a block
    return arrowUtils.snapToNearestBlock(startX, startY, blocks) !== null;
  },
  
  generateId: () => `arrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
};

// Word utility functions for matching test creation
export const wordUtils = {
  create: (blockId, word, id) => ({
    id,
    blockId,
    word
  }),
  
  update: (words, blockId, newWord) => {
    return words.map(w => 
      w.blockId === blockId ? { ...w, word: newWord } : w
    );
  },
  
  delete: (words, blockId) => {
    return words.filter(w => w.blockId !== blockId);
  },
  
  generateId: (blockId) => `word_${blockId}`,
  
  validate: (word) => {
    return word && word.trim().length > 0;
  }
};

import React, { useState } from 'react';
import PerfectModal from './PerfectModal';
import Button from './Button';

// EXAMPLE: How to use PerfectModal
const PerfectModalExample = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-8">
      <Button onClick={() => setIsOpen(true)}>
        Open Perfect Modal
      </Button>

      <PerfectModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Perfect Modal Example"
        size="medium"
      >
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            This is a Perfect Modal!
          </h2>
          <p className="text-gray-600 mb-6">
            It uses the same styling pattern as the working example.
            No CSS classes needed - just pure Tailwind!
          </p>
          <div className="flex justify-center space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => setIsOpen(false)}
            >
              Confirm
            </Button>
          </div>
        </div>
      </PerfectModal>
    </div>
  );
};

export default PerfectModalExample;

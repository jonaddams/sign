import { Check, ChevronDown, User } from 'lucide-react';
import { useContext, useState } from 'react';
import { FormPlacementContext } from '../../context/FormPlacementContext';

const RecipientDropdown = () => {
  const { currentRecipientIndex, setCurrentRecipientIndex, signerRecipients, recipientColors } =
    useContext(FormPlacementContext);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // If no signers at all, don't show anything
  if (signerRecipients.length === 0) {
    return null;
  }

  const currentRecipient = signerRecipients[currentRecipientIndex];

  // If there's only one signer, show a non-interactive display instead of dropdown
  const isSingleSigner = signerRecipients.length === 1;

  // Function to create a solid background color from the recipient's color
  const _getRecipientBackgroundColor = (color: string | undefined): string => {
    if (!color) return 'rgb(210, 225, 245)';

    // Extract RGB components if it's an rgba or rgb color
    if (color.startsWith('rgb')) {
      const matches = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
      if (matches) {
        // Get the RGB values
        const r = parseInt(matches[1], 10);
        const g = parseInt(matches[2], 10);
        const b = parseInt(matches[3], 10);

        // For better visibility, return a solid color without transparency
        return `rgb(${r}, ${g}, ${b})`;
      }
    }

    // Fallback for other color formats
    return color.split(',').length > 3 ? `${color.split(')')[0].replace(/rgba/i, 'rgb')})` : color;
  };

  // Function to create icon background colors with good contrast in both modes
  const getIconBackgroundColor = (color: string | undefined): string => {
    // If no color is provided, use a default high-contrast color
    if (!color) return 'rgb(118, 239, 182)';

    // For existing colors, we need to ensure they have enough saturation and brightness
    // Extract RGB components if it's an rgba or rgb color
    if (color.startsWith('rgb')) {
      // For rgb/rgba colors, transform to solid versions
      const matches = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
      if (matches) {
        // Get the RGB values
        const r = parseInt(matches[1], 10);
        const g = parseInt(matches[2], 10);
        const b = parseInt(matches[3], 10);

        // Identify specific color types to handle them appropriately
        const isLightGreen = g > Math.max(r, b) && g > 180;
        const isLightPink = r > Math.max(g, b) && r > 180 && b > 100;
        const isPastel = (r > 160 && g > 160 && b > 160) || Math.max(r, g, b) - Math.min(r, g, b) < 60;

        // For the icon background, we want a slightly darker version of the color for better contrast
        // Apply moderate saturation boost and brightness adjustment for better visibility
        const saturationBoost = isPastel ? 1.2 : 1.0;
        const brightnessAdjust = isPastel ? 0.85 : 1.0;

        let rNew = r;
        let gNew = g;
        let bNew = b;

        // Apply saturation boost if needed (for pastel colors)
        if (isPastel) {
          const avg = (r + g + b) / 3;
          rNew = Math.min(255, Math.max(0, r > avg ? r + (r - avg) * saturationBoost : r));
          gNew = Math.min(255, Math.max(0, g > avg ? g + (g - avg) * saturationBoost : g));
          bNew = Math.min(255, Math.max(0, b > avg ? b + (b - avg) * saturationBoost : b));
        }

        // Apply brightness adjustment for pastel colors
        if (isPastel) {
          rNew *= brightnessAdjust;
          gNew *= brightnessAdjust;
          bNew *= brightnessAdjust;
        }

        // Special handling for problematic colors
        if (isLightGreen) {
          // Make light greens more visible
          gNew = Math.min(255, g);
          rNew = Math.max(0, r * 0.8);
          bNew = Math.max(0, b * 0.8);
        }

        if (isLightPink) {
          // Make light pinks more visible
          rNew = Math.min(255, r);
          gNew = Math.max(0, g * 0.8);
        }

        return `rgb(${Math.round(rNew)}, ${Math.round(gNew)}, ${Math.round(bNew)})`;
      }
    }

    // Handle named colors or hex values - remove any transparency if present
    return color.split(',').length > 3 ? `${color.split(')')[0].replace(/rgba/i, 'rgb')})` : color;
  };

  return (
    <div className="relative">
      {/* Dropdown trigger - styled like FieldOption */}
      <div
        className={`flex items-center justify-between p-3 mb-3 rounded-md border border-gray-200 dark:border-zinc-700 ${isSingleSigner ? '' : 'cursor-pointer'}`}
        onClick={() => !isSingleSigner && setIsDropdownOpen(!isDropdownOpen)}
      >
        <div className="flex items-center flex-1">
          <div
            className="mr-3 p-1.5 rounded-md flex items-center justify-center"
            style={{
              backgroundColor: getIconBackgroundColor(recipientColors[currentRecipient.email]),
            }}
          >
            <User className="h-5 w-5 text-gray-950" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{currentRecipient.name}</span>
            {isSingleSigner && <span className="text-xs text-gray-500 dark:text-gray-400">Only signer</span>}
          </div>
        </div>
        {!isSingleSigner && (
          <div className="ml-2 p-0.5 rounded-md flex items-center justify-center bg-gray-200 dark:bg-gray-700">
            <ChevronDown className="h-3 w-3 text-gray-700 dark:text-gray-300" />
          </div>
        )}
      </div>

      {/* Dropdown content - only show if multiple signers */}
      {!isSingleSigner && isDropdownOpen && (
        <div
          className="absolute z-50 w-full mt-1 border-2 border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-md shadow-lg max-h-64 overflow-y-auto"
          style={{
            borderColor: recipientColors[currentRecipient.email],
          }}
        >
          {signerRecipients.map((recipient, index) => {
            // Apply recipient's color only to the left border when selected
            const isSelected = index === currentRecipientIndex;

            return (
              <div
                key={recipient.email}
                className={`flex items-center justify-between p-3 cursor-pointer
                  ${isSelected ? 'border-l-4 bg-gray-50 dark:bg-zinc-700' : 'border-l-4 border-l-transparent hover:bg-gray-50 dark:hover:bg-zinc-700'}`}
                style={{
                  borderLeftColor: isSelected ? recipientColors[recipient.email] : 'transparent',
                }}
                onClick={() => {
                  setIsDropdownOpen(false);
                  setCurrentRecipientIndex(index);
                }}
              >
                <div className="flex items-center">
                  <div
                    className="mr-3 p-1 rounded-md flex items-center justify-center"
                    style={{
                      backgroundColor: getIconBackgroundColor(recipientColors[recipient.email]),
                    }}
                  >
                    <User className="h-4 w-4 text-gray-950" />
                  </div>
                  <span className="text-sm font-medium truncate">{recipient.name}</span>
                </div>
                {isSelected && (
                  <div
                    className="ml-2 p-0.5 rounded-md flex items-center justify-center"
                    style={{
                      backgroundColor: getIconBackgroundColor(recipientColors[recipient.email]),
                    }}
                  >
                    <Check className="h-3 w-3 text-gray-950" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecipientDropdown;
